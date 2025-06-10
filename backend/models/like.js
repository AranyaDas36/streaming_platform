import mongoose from "mongoose"

const likeSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Ensure a user can only like a video once
likeSchema.index({ videoId: 1, userId: 1 }, { unique: true })

const Like = mongoose.model("Like", likeSchema)

export default Like
