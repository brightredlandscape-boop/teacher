import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
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

/**
 * Simulate Payment Processor Checkout (Paystack / Stripe)
 */
router.post('/checkout', authenticateToken, (req, res) => {
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

/**
 * Simulate Webhook Confirmation (Top-up Wallet)
 */
router.post('/webhook', (req, res) => {
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
