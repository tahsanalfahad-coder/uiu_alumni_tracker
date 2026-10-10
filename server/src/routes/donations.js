import express from 'express';
import crypto from 'crypto';
import Fund from '../models/Fund.js';
import Donation from '../models/Donation.js';
import AlumniProfile from '../models/AlumniProfile.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const MAX_DONATION = 10_000_000;

// GET /api/donations/funds
router.get('/funds', async (req, res, next) => {
  try {
    const funds = await Fund.find({}).sort({ createdAt: 1 });
    res.json(funds);
  } catch (err) {
    next(err);
  }
});

// GET /api/donations/me (alumni history)
router.get('/me', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });
    const alumniId = alumniProfile ? alumniProfile._id : req.user.id;

    const history = await Donation.find({ alumniId })
      .populate('fundId', 'name')
      .sort({ createdAt: -1 });

    const totalDonated = alumniProfile ? alumniProfile.totalDonated : 0;
    const funds = await Fund.find({});

    const formattedHistory = history.map((tx) => ({
      id: tx._id,
      fund: tx.fundId?.name || 'UIU Scholarship Fund',
      amount: `৳${tx.amount.toLocaleString()}`,
      date: tx.date,
      txId: tx.txId,
      status: tx.status
    }));

    res.json({
      totalDonated,
      funds: funds.map((f) => ({
        id: f._id,
        name: f.name,
        description: f.description,
        raised: f.raised,
        goal: f.goal,
        icon: f.icon
      })),
      history: formattedHistory
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/donations (alumni only)
router.post('/', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const { fundId, amount, paymentMethod, recurring, anonymous } = req.body;

    const numericAmount = typeof amount === 'string' ? parseInt(amount.replace(/[^0-9]/g, ''), 10) : Number(amount);
    if (!fundId || !Number.isInteger(numericAmount) || numericAmount <= 0 || numericAmount > MAX_DONATION) {
      return res.status(400).json({
        error: { message: 'Valid fundId and a whole-number donation amount (up to ৳10,000,000) are required', code: 'VALIDATION_ERROR' }
      });
    }

    const fund = await Fund.findById(fundId);
    if (!fund) {
      return res.status(404).json({
        error: { message: 'Scholarship fund not found', code: 'NOT_FOUND' }
      });
    }

    const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });
    const alumniId = alumniProfile ? alumniProfile._id : req.user.id;

    const txId = 'TXN-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const todayStr = new Date().toISOString().split('T')[0];

    const donation = await Donation.create({
      alumniId,
      fundId,
      amount: numericAmount,
      date: todayStr,
      txId,
      status: 'Completed',
      paymentMethod: paymentMethod || 'bKash / Card',
      recurring: !!recurring,
      anonymous: !!anonymous
    });

    // Atomic increments: concurrent donations can no longer overwrite each other.
    await Fund.updateOne({ _id: fund._id }, { $inc: { raised: numericAmount } });
    if (alumniProfile) {
      await AlumniProfile.updateOne({ _id: alumniProfile._id }, { $inc: { totalDonated: numericAmount } });
    }

    res.status(201).json({
      message: 'Donation recorded successfully (Sandbox Mode)',
      isDemo: true,
      donation: {
        id: donation._id,
        fund: fund.name,
        amount: `৳${numericAmount.toLocaleString()}`,
        date: todayStr,
        txId,
        status: 'Completed'
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
