import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../db.js';
import { sendTransactionalEmail } from '../services/email.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'eduvista_jwt_secret_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token required." });

  // If Firebase Admin is initialized, verify via Firebase Auth
  if (getApps().length > 0) {
    getAuth().verifyIdToken(token)
      .then((decodedToken) => {
        const uid = decodedToken.uid;
        // Lookup user profile in database cache
        const user = db.findOne('users', u => u.uid === uid);
        if (user) {
          req.user = {
            uid: user.uid,
            role: user.role,
            email: user.email,
            displayName: user.displayName
          };
        } else {
          // If profile sync hasn't occurred yet, build basic request context
          req.user = {
            uid: uid,
            role: decodedToken.role || 'Parent',
            email: decodedToken.email
          };
        }
        next();
      })
      .catch((err) => {
        // Fallback to local JWT verification
        jwt.verify(token, JWT_SECRET, (jwtErr, user) => {
          if (jwtErr) {
            console.warn("JWT verification error (Firebase catch in payments):", jwtErr.message);
            return res.status(403).json({ error: "Invalid or expired token." });
          }
          req.user = user;
          next();
        });
      });
  } else {
    // Normal local JWT fallback
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.warn("JWT verification error (No Firebase in payments):", err.message);
        return res.status(403).json({ error: "Invalid or expired token." });
      }
      req.user = user;
      next();
    });
  }
}

const checkoutRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many payment operations from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Simulate or Live Payment Processor Checkout (Paystack / Stripe)
 */
router.post('/checkout', authenticateToken, checkoutRateLimiter, async (req, res) => {
  const { parentId, amount, currency, provider } = req.body;

  if (!parentId || !amount || !currency) {
    return res.status(400).json({ error: "Missing required payment fields." });
  }

  // Verify that the requested parentId matches the authenticated user's uid
  if (req.user.role !== 'Admin' && req.user.uid !== parentId) {
    return res.status(403).json({ error: "Access forbidden. User identity mismatch." });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const isPaystackLive = provider === 'paystack' && paystackSecret && !paystackSecret.includes('mock_paystack_secret_key');

  if (isPaystackLive) {
    try {
      // Find parent user to get email
      const parentUser = db.findOne('users', u => u.uid === parentId || u.id === parentId);
      const email = parentUser ? parentUser.email : 'customer@eduvista.com';

      // We need to send amount in minor units to Paystack.
      // Paystack expects amount as integer.
      const paystackAmount = Math.round(amount);

      // Define callback url
      const callbackUrl = req.headers.origin 
        ? `${req.headers.origin}/#dashboard` 
        : `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/#dashboard`;

      console.log(`[PAYMENTS] Initializing live Paystack checkout for ${email}, amount: ${paystackAmount} ${currency}`);

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: paystackAmount,
          currency: currency === 'NGN' ? 'NGN' : currency,
          callback_url: callbackUrl,
          metadata: {
            parentId,
            paymentType: req.body.paymentType || 'wallet_topup',
            amountNgnMinor: req.body.amountNgnMinor || (currency === 'NGN' ? paystackAmount : null)
          }
        })
      });

      const resData = await response.json();
      if (response.ok && resData.status && resData.data) {
        return res.json({
          success: true,
          checkoutUrl: resData.data.authorization_url,
          reference: resData.data.reference,
          amount,
          currency
        });
      } else {
        console.error("[PAYMENTS] Paystack initialization failed:", resData);
        return res.status(400).json({ error: resData.message || "Paystack initialization failed." });
      }
    } catch (err) {
      console.error("[PAYMENTS] Live Paystack checkout error:", err);
      return res.status(500).json({ error: err.message || "Internal payment gateway error." });
    }
  }

  // Simulate processor integration
  const checkoutUrl = `https://mock-${provider || 'paystack'}.com/checkout/${crypto.randomUUID()}`;
  
  res.json({
    success: true,
    checkoutUrl,
    reference: crypto.randomUUID(),
    amount,
    currency
  });
});

function verifyStripeWebhook(rawBody, signatureHeader, webhookSecret) {
  if (!signatureHeader || !webhookSecret) return false;
  try {
    const parts = signatureHeader.split(',');
    const tPart = parts.find(p => p.startsWith('t='));
    const v1Part = parts.find(p => p.startsWith('v1='));

    if (!tPart || !v1Part) return false;

    const timestamp = tPart.substring(2);
    const signature = v1Part.substring(3);

    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch (e) {
    return false;
  }
}

function verifyPaystackWebhook(rawBody, signatureHeader, paystackSecret) {
  if (!signatureHeader || !paystackSecret) return false;
  try {
    const expectedSignature = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signatureHeader, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch (e) {
    return false;
  }
}

/**
 * Simulate Webhook Confirmation (Top-up Wallet)
 */
router.post('/webhook', async (req, res) => {
  const stripeSig = req.headers['stripe-signature'];
  const paystackSig = req.headers['x-paystack-signature'];

  // Verify signatures if keys are configured in production/live mode
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const paystackSecret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (stripeSig && stripeSecret) {
    const isValid = verifyStripeWebhook(rawBody, stripeSig, stripeSecret);
    if (!isValid) {
      console.warn("[PAYMENTS] Webhook verification failed for Stripe signature.");
      return res.status(401).json({ error: "Invalid Stripe signature." });
    }
    console.log("[PAYMENTS] Webhook signature verified for Stripe.");
  } else if (paystackSig && paystackSecret) {
    const isValid = verifyPaystackWebhook(rawBody, paystackSig, paystackSecret);
    if (!isValid) {
      console.warn("[PAYMENTS] Webhook verification failed for Paystack signature.");
      return res.status(401).json({ error: "Invalid Paystack signature." });
    }
    console.log("[PAYMENTS] Webhook signature verified for Paystack.");
  } else {
    // If we're in production, require signature verification
    if (process.env.NODE_ENV === 'production') {
      console.error("[PAYMENTS] Production webhook request blocked due to missing signature or secrets.");
      return res.status(401).json({ error: "Signature verification required in production." });
    }
    console.log("[PAYMENTS] Running webhook in local sandbox mode without signature check.");
  }

  const payload = req.body;
  const isPaystackEvent = payload.event && payload.data;
  
  // Extract values based on whether it is a Paystack event or fallback/sandbox direct webhook call
  const eventStatus = isPaystackEvent ? payload.data.status : (payload.status || 'success');
  const reference = isPaystackEvent ? payload.data.reference : payload.reference;
  const dataMetadata = isPaystackEvent ? (payload.data.metadata || {}) : {};
  
  const parentId = dataMetadata.parentId || payload.parentId;
  const paymentType = dataMetadata.paymentType || payload.paymentType || 'wallet_topup';
  
  // Get amount. If Paystack, we can use metadata.amountNgnMinor or fall back to payload.amount
  let amountNgnMinor = dataMetadata.amountNgnMinor || (isPaystackEvent ? payload.data.amount : payload.amount);
  
  // If amountNgnMinor is still not found but amount is in USD/GHS/etc., we can do conversion
  if (!amountNgnMinor && isPaystackEvent) {
    const currency = payload.data.currency;
    const chargeAmount = payload.data.amount;
    if (currency === 'NGN') {
      amountNgnMinor = chargeAmount;
    } else {
      const config = db.findOne('platform_config', c => c.id === 'default') || {};
      const rates = config.exchangeRates || { NGN_USD: 0.00125 };
      const rateKey = `NGN_${currency}`;
      const rate = rates[rateKey] || 1;
      amountNgnMinor = Math.round(chargeAmount / rate);
    }
  }

  // Ensure amount is parsed as integer
  amountNgnMinor = Math.round(Number(amountNgnMinor || 0));

  console.log(`[PAYMENTS] Webhook received. Reference: ${reference}, Status: ${eventStatus}, ParentId: ${parentId}, Amount (NGN Minor): ${amountNgnMinor}`);

  if (eventStatus === 'success') {
    if (!parentId) {
      console.error("[PAYMENTS] Webhook ignored due to missing parentId.");
      return res.status(400).json({ error: "Missing parentId." });
    }

    // Deduplicate webhook actions
    if (reference) {
      const existingTx = db.findOne('transactions', t => t.paymentReference === reference || t.id === reference);
      if (existingTx) {
        console.log(`[PAYMENTS] Webhook reference ${reference} already processed.`);
        return res.json({ success: true, message: "Webhook already processed." });
      }
    }

    if (paymentType === 'session_booking') {
      const teacherId = dataMetadata.teacherId || payload.teacherId;
      const teacherName = dataMetadata.teacherName || payload.teacherName;
      const subject = dataMetadata.subject || payload.subject || 'General';
      const curriculum = dataMetadata.curriculum || payload.curriculum || 'Standard';
      const studentId = dataMetadata.studentId || payload.studentId || 'student_1';
      const studentName = dataMetadata.studentName || payload.studentName || 'Tunde';
      
      const slots = typeof dataMetadata.slots === 'string' 
        ? JSON.parse(dataMetadata.slots) 
        : (dataMetadata.slots || payload.slots || []);

      const commission = Math.round(amountNgnMinor * 0.15);
      const payout = amountNgnMinor - commission;

      // Update admin wallet (balance)
      const adminUser = db.findOne('users', u => u.role === 'Admin') || { uid: 'admin_1' };
      let adminWallet = db.findOne('wallets', w => w.uid === adminUser.uid);
      if (!adminWallet) {
        await db.insert('wallets', {
          uid: adminUser.uid,
          balance: commission,
          escrow: 0
        });
      } else {
        await db.update('wallets', adminWallet.id, {
          balance: Number(adminWallet.balance) + commission
        });
      }

      // Update teacher wallet (escrow)
      let teacherWallet = db.findOne('wallets', w => w.uid === teacherId);
      if (!teacherWallet) {
        await db.insert('wallets', {
          uid: teacherId,
          balance: 0,
          escrow: payout
        });
      } else {
        await db.update('wallets', teacherWallet.id, {
          escrow: Number(teacherWallet.escrow) + payout
        });
      }

      // Create session booking records
      if (Array.isArray(slots) && slots.length > 0) {
        for (const slot of slots) {
          const sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
          await db.insert('sessions', {
            id: sessionId,
            parentId,
            studentId,
            studentName,
            teacherId,
            teacherName,
            slot,
            subject,
            curriculum,
            status: 'Scheduled',
            classLink: '',
            recordingUrl: '',
            cost: Math.floor(amountNgnMinor / slots.length),
            createdAt: new Date().toISOString()
          });
        }
      }

      // Log transactions
      await db.insert('transactions', {
        fromUserId: parentId,
        toUserId: teacherId,
        amount: amountNgnMinor,
        type: 'session_booking',
        paymentProcessor: 'paystack',
        paymentReference: reference,
        date: new Date().toISOString()
      });

      await db.insert('transactions', {
        fromUserId: teacherId,
        toUserId: adminUser.uid,
        amount: commission,
        type: 'commission',
        paymentProcessor: 'virtual',
        paymentReference: `comm_${reference}`,
        date: new Date().toISOString()
      });

      // Send notifications and emails
      await db.insert('notifications', {
        id: 'notif_' + Date.now(),
        userId: teacherId,
        title: 'New Session Booking Request',
        body: `A new session has been booked. ₦${(payout / 100).toLocaleString()} is secured in escrow.`,
        read: false,
        type: 'booking_received',
        timestamp: new Date().toISOString()
      });

      const parentUser = db.findOne('users', u => u.uid === parentId);
      if (parentUser) {
        sendTransactionalEmail(parentUser.email, "EduVista: Session Escrow Secured", "booking_secured", {
          displayName: parentUser.displayName,
          formattedAmount: `₦${(amountNgnMinor / 100).toLocaleString()}`,
          reference: reference || 'N/A',
          tutorName: teacherName
        });
      }

      const teacherUser = db.findOne('users', u => u.uid === teacherId);
      if (teacherUser) {
        sendTransactionalEmail(teacherUser.email, "EduVista: New Booking Request", "booking_received", {
          displayName: teacherUser.displayName,
          studentName: studentName,
          subject: subject
        });
      }

      return res.json({ success: true, message: "Session booked and fees split successfully." });

    } else {
      let wallet = db.findOne('wallets', w => w.uid === parentId);
      if (!wallet) {
        wallet = await db.insert('wallets', {
          uid: parentId,
          balance: amountNgnMinor,
          escrow: 0
        });
      } else {
        await db.update('wallets', wallet.id, {
          balance: Number(wallet.balance) + amountNgnMinor
        });
      }

      // Insert transaction log
      await db.insert('transactions', {
        fromUserId: 'system',
        toUserId: parentId,
        amount: amountNgnMinor,
        type: 'wallet_topup',
        paymentProcessor: 'paystack',
        paymentReference: reference,
        date: new Date().toISOString()
      });

      // Create system notification
      await db.insert('notifications', {
        id: 'notif_' + Date.now(),
        userId: parentId,
        title: 'Wallet Top-up Successful',
        body: `Successfully added ₦${(amountNgnMinor / 100).toLocaleString()} to your wallet.`,
        read: false,
        type: 'wallet_topup',
        timestamp: new Date().toISOString()
      });

      // Send transactional confirmation email
      const parentUser = db.findOne('users', u => u.uid === parentId || u.id === parentId);
      if (parentUser) {
        sendTransactionalEmail(parentUser.email, "EduVista: Wallet Deposit Confirmed", "wallet_topup", {
          displayName: parentUser.displayName,
          formattedAmount: `₦${(amountNgnMinor / 100).toLocaleString()}`,
          reference: reference || 'N/A',
          paymentProcessor: 'paystack'
        });
      }

      return res.json({ success: true, message: "Wallet topped up successfully." });
    }
  }

  res.status(400).json({ error: "Payment failed." });
});

export default router;
