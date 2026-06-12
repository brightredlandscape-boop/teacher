import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { db } from '../db.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'edubridge_jwt_secret_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token required." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    req.user = user;
    next();
  });
}

const checkoutRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many payment operations from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Simulate Payment Processor Checkout (Paystack / Stripe)
 */
router.post('/checkout', authenticateToken, checkoutRateLimiter, (req, res) => {
  const { parentId, amount, currency, provider } = req.body;

  if (!parentId || !amount || !currency) {
    return res.status(400).json({ error: "Missing required payment fields." });
  }

  // Verify that the requested parentId matches the authenticated user's uid
  if (req.user.role !== 'Admin' && req.user.uid !== parentId) {
    return res.status(403).json({ error: "Access forbidden. User identity mismatch." });
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
router.post('/webhook', (req, res) => {
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

  const { reference, status, parentId, amount } = req.body;

  if (status === 'success') {
    const wallet = db.findOne('wallets', w => w.uid === parentId);
    if (wallet) {
      db.update('wallets', wallet.id, {
        balance: wallet.balance + amount
      });
      return res.json({ success: true, message: "Wallet topped up successfully." });
    } else {
      return res.status(404).json({ error: "Wallet not found for parent." });
    }
  }

  res.status(400).json({ error: "Payment failed." });
});

export default router;
