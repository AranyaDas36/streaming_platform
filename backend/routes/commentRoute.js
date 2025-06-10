import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Comment from "../models/comment.js";
import User from "../models/user.js"; // if username is needed

const router = express.Router();

// Get comments for a video
router.get("/:videoId", async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.videoId })
      .populate("userId", "username") // Assuming User model has 'name'
      .sort({ createdAt: -1 });

    res.status(200).json({ comments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Post a new comment
router.post("/:videoId", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const { id: userId } = req.user;

    if (!text) return res.status(400).json({ error: "Comment text is required" });

    const comment = new Comment({
      videoId: req.params.videoId,
      userId,
      text
    });

    await comment.save();

    const populatedComment = await comment.populate("userId", "username");

    res.status(201).json({ comment: populatedComment });
  } catch (err) {
    res.status(500).json({ error: "Failed to post comment" });
  }
});

export default router;

