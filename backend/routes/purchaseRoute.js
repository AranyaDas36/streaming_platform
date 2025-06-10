import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Purchase from "./../models/purchase.js";
import Video from "./../models/video.js";
import User from './../models/user.js';

const router = express.Router();

// POST /api/v1/purchase/:videoId
router.post('/:videoId', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { videoId } = req.params;

    // Check if video exists and is a Long-Form video
    const video = await Video.findById(videoId);
    if (!video || video.videoType !== 'Long-Form') {
      return res.status(404).json({ error: 'Video not found or not purchasable' });
    }

    // Check if user already purchased it
    const alreadyPurchased = await Purchase.findOne({ userId, videoId });
    if (alreadyPurchased) {
      return res.status(200).json({ message: 'Already purchased' });
    }

    // Check if user has enough wallet balance
    const user = await User.findById(userId);
    if (user.wallet < video.price) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct price and save purchase
    user.wallet -= video.price;
    await user.save();

    const newPurchase = new Purchase({ userId, videoId });
    await newPurchase.save();

    res.status(200).json({ message: 'Purchase successful', wallet: user.wallet });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// GET /api/v1/purchase/check/:videoId
router.get('/check/:videoId', verifyToken, async (req, res) => {
  const userId = req.user._id;
  const { videoId } = req.params;

  const purchase = await Purchase.findOne({ userId, videoId });
  res.json({ purchased: !!purchase });
});


export default router;
