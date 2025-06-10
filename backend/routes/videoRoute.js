import express from "express"
import multer from "multer"
const router = express.Router()
import path from "path"
import { verifyToken } from "../middleware/auth.js"
import Video from "./../models/video.js"
import Like from "./../models/like.js"

// Multer storage config to save file locally in /uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/") // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    // e.g., video-1623984234.mp4
    cb(null, "video-" + Date.now() + path.extname(file.originalname))
  },
})

// File filter to accept only .mp4
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ext === ".mp4") cb(null, true)
  else cb(new Error("Only .mp4 files are allowed"), false)
}

// Max file size 10MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

// GET /videos
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadedAt: -1 }) // Newest first
    res.status(200).json({ videos })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch videos" })
  }
})

// GET /api/v1/videos/feed?page=1&limit=10
router.get("/feed", verifyToken, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const videos = await Video.find()
      .sort({ uploadedAt: -1, _id: -1 }) // helps ensure stable ordering
      .skip(skip)
      .limit(limit)
      .populate("creatorId", "username")

    res.status(200).json({ videos, page })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load feed" })
  }
})

// GET /api/v1/videos/reels - Get videos for reels (modified to show all short-form videos)

// GET /api/v1/videos/reels
// router.get("/reels", verifyToken, async (req, res) => {
//   try {
// const videos = await Video.find({
//     videoType: "Reel",
//     $or: [
//       { videoFilePath: { $exists: true, $ne: null } },
//       { videoUrl: { $exists: true, $ne: null } },
//     ],
//   })
//     .sort({ uploadedAt: -1 })
//     .populate("creatorId", "username");


//     const videosWithLikes = await Promise.all(
//       videos.map(async (video) => {
//         const likesCount = await Like.countDocuments({ videoId: video._id });
//         return {
//           ...video.toObject(),
//           likesCount,
//         };
//       })
//     );

//     res.status(200).json({ videos: videosWithLikes });
//   } catch (error) {
//     console.error("Error in /reels endpoint:", error);
//     res.status(500).json({ error: "Failed to load reels" });
//   }
// });

router.get("/reels", verifyToken, async (req, res) => {
  try {
    const reels = await Video.find({ videoType: "Reel" })
      .sort({ uploadedAt: -1 })
      .populate("creatorId", "username");

    const reelsWithLikes = await Promise.all(
      reels.map(async (video) => {
        const likesCount = await Like.countDocuments({ videoId: video._id });
        return {
          ...video.toObject(),
          likesCount,
        };
      })
    );

    res.status(200).json({ videos: reelsWithLikes });
  } catch (err) {
    console.error("Failed to fetch reels:", err);
    res.status(500).json({ error: "Failed to fetch reels" });
  }
});




// GET /videos/:id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate("creatorId", "username")
    if (!video) return res.status(404).json({ error: "Video not found" })
    res.status(200).json({ video })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

// POST /videos/upload
router.post("/upload", verifyToken, upload.single("videoFile"), async (req, res) => {
  try {
    const { title, description, videoType, videoUrl, price, duration } = req.body
    const creatorId = req.user.id // Assuming you have user auth middleware

    if (!title || !videoType) {
      return res.status(400).json({ error: "Title and videoType are required" })
    }

    const videoData = {
      creatorId,
      title,
      description,
      videoType,
      duration: duration ? Number(duration) : 30, // Default to 30 seconds for testing
    }

  if (videoType === "Short-Form") {
  if (!req.file) {
    return res.status(400).json({ error: "Video file is required for Short-Form" });
  }
  videoData.videoFilePath = req.file.filename;
  videoData.price = 0;
} else if (videoType === "Long-Form"  || videoType === "Reel") {
  if (!videoUrl) {
    return res.status(400).json({ error: "Video URL is required for Long-Form videos/Reel videos" });
  }
  videoData.videoUrl = videoUrl;
  videoData.price = price ? Number(price) : 0;
}


    const newVideo = new Video(videoData)
    await newVideo.save()

    res.status(201).json({ message: "Video uploaded successfully", video: newVideo })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// POST /videos/:id/like - Like/Unlike a video
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const videoId = req.params.id
    const userId = req.user.id

    // Check if user already liked this video
    const existingLike = await Like.findOne({ videoId, userId })

    if (existingLike) {
      // Unlike the video
      await Like.deleteOne({ videoId, userId })
    } else {
      // Like the video
      const newLike = new Like({ videoId, userId })
      await newLike.save()
    }

    // Get updated likes count
    const likesCount = await Like.countDocuments({ videoId })

    res.status(200).json({
      liked: !existingLike,
      likesCount,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to like/unlike video" })
  }
})

// DELETE /videos/:id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)

    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    // Ensure the logged-in user is the creator
    if (video.creatorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to delete this video" })
    }

    await video.deleteOne()
    res.status(200).json({ message: "Video deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

// GET /videos/:id/likes - Get users who liked a video
router.get("/:id/likes", verifyToken, async (req, res) => {
  try {
    const videoId = req.params.id;
    const likes = await Like.find({ videoId })
      .populate('userId', 'username name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      likes: likes.map(like => ({
        userId: like.userId._id,
        username: like.userId.username,
        name: like.userId.name,
        avatar: like.userId.avatar,
        likedAt: like.createdAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
});

// GET /videos/:id/like/check - Check if user liked a video
router.get("/:id/like/check", verifyToken, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    const existingLike = await Like.findOne({ videoId, userId });
    const likesCount = await Like.countDocuments({ videoId });

    res.status(200).json({
      liked: !!existingLike,
      likesCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to check like status" });
  }
});

export default router
