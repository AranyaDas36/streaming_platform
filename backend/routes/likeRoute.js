import express from "express"
import { verifyToken } from "../middleware/auth.js"
import Like from "./../models/like.js"

const router = express.Router()

// Get likes for a video
router.get("/:videoId", async (req, res) => {
  try {
    const likesCount = await Like.countDocuments({ videoId: req.params.videoId })
    res.status(200).json({ likesCount })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch likes" })
  }
})

// Check if user liked a video
router.get("/:videoId/check", verifyToken, async (req, res) => {
  try {
    const like = await Like.findOne({
      videoId: req.params.videoId,
      userId: req.user.id,
    })

    res.status(200).json({ liked: !!like })
  } catch (err) {
    res.status(500).json({ error: "Failed to check like status" })
  }
})

export default router
