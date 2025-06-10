import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Heart, Share2, Download, Play, ShoppingCart } from "lucide-react";
import LikesModal from "./LikesModal";

export default function VideoCard({ video }) {
  const [purchased, setPurchased] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 0);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likes, setLikes] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (video.videoType === "Long-Form") {
      checkPurchase();
    }
    checkLikeStatus();
  }, []);

  const checkPurchase = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/v1/purchase/check/${video._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPurchased(res.data.purchased);
    } catch (err) {
      console.error("Failed to check purchase", err);
    }
  };

  const checkLikeStatus = async () => {
    try {
      if (!token) return;
      const res = await axios.get(
        `http://localhost:4000/api/v1/videos/${video._id}/like/check`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likesCount || 0);
    } catch (err) {
      console.error("Failed to check like status", err);
    }
  };

  const handleLike = async () => {
    try {
      if (!token) {
        alert("Please log in to like videos");
        return;
      }
      const res = await axios.post(
        `http://localhost:4000/api/v1/videos/${video._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      console.error("Error liking video:", err);
    }
  };

  const handleShowLikes = async () => {
    try {
      setLoadingLikes(true);
      const res = await axios.get(
        `http://localhost:4000/api/v1/videos/${video._id}/likes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLikes(res.data.likes);
      setShowLikesModal(true);
    } catch (err) {
      console.error("Failed to fetch likes", err);
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleBuy = async () => {
    try {
      const res = await axios.post(
        `http://localhost:4000/api/v1/purchase/${video._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Purchase successful");
      setPurchased(true);
    } catch (err) {
      alert(err.response?.data?.error || "Purchase failed");
    }
  };

  const handleWatch = () => {
    navigate(`/player/${video._id}`);
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/player/${video._id}`;
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = async () => {
    try {
      // For YouTube videos
      if (video.videoUrl && video.videoUrl.includes('youtube.com')) {
        alert('Direct download is not available for YouTube videos.');
        return;
      }

      // For uploaded videos
      if (video.videoFilePath) {
        const videoUrl = `http://localhost:4000/${video.videoFilePath}`;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `${video.title || 'video'}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download video. Please try again.');
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
        {/* Thumbnail/Video Section */}
        <div className="relative group">
          {video.videoType === "Short-Form" ? (
            <video
              ref={videoRef}
              src={`http://localhost:4000/${video.videoFilePath}`}
              className="w-full h-64 object-cover cursor-pointer"
              onClick={handleWatch}
              muted
              loop
            />
          ) : (
            <img
              src={video.videoUrl ? `https://img.youtube.com/vi/${extractYouTubeID(video.videoUrl)}/hqdefault.jpg` : "https://placehold.co/640x360/e2e8f0/475569?text=No+Thumbnail"}
              alt={video.title}
              className="w-full h-64 object-cover cursor-pointer"
              onClick={() => purchased && handleWatch()}
            />
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Price Badge for Long-Form Videos */}
          {video.videoType === "Long-Form" && video.price > 0 && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
              ₹{video.price}
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{video.title}</h3>
          <p className="text-sm text-gray-600 mb-4">By {video.creatorId?.name}</p>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              <span 
                className="text-sm hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowLikes();
                }}
              >
                {likesCount}
              </span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm">Share</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm">Download</span>
            </button>
          </div>

          {/* Watch/Buy Button */}
          {video.videoType === "Long-Form" ? (
            <div className="mt-4">
              {video.price > 0 && !purchased ? (
                <button
                  onClick={handleBuy}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Buy for ₹{video.price}
                </button>
              ) : (
                <button
                  onClick={handleWatch}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Watch Now
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleWatch}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Watch
            </button>
          )}
        </div>
      </div>

      {/* Likes Modal */}
      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        likes={likes}
      />
    </>
  );
}

function extractYouTubeID(url) {
  if (!url) return "";
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : "";
}
