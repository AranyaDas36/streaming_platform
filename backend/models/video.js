import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  videoType: {
    type: String,
    enum: ["Short-Form", "Long-Form", "Reel"],
    required: true,
  },
  videoFilePath: {
    type: String,
    required: function () {
      return this.videoType === "Short-Form";
    },
  },
  videoUrl: {
    type: String,
    required: function () {
      return this.videoType === "Long-Form" || this.videoType === "Reel";
    },
    validate: {
      validator: (v) => {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
  duration: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
    required: function () {
      return this.videoType === "Long-Form";
    },
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const Video = mongoose.model("Video", videoSchema);

export default Video;
