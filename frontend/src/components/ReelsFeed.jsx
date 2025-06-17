"use client"

import React, { useState, useEffect, useRef } from "react"
import { Heart, MessageCircle, AlertCircle, RefreshCw, Share2, Download } from "lucide-react"
import axios from "axios"
import LikesModal from "./LikesModal"
import "../styles/ReelsFeed.css"
import config from '../config.js';

// Helper component for rendering each reel
const ReelItem = ({ video, isActive }) => {
  const videoRef = useRef(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [likesCount, setLikesCount] = useState(video.likesCount || 0)
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [errorDetails, setErrorDetails] = useState("")
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [likes, setLikes] = useState([])
  const [loadingLikes, setLoadingLikes] = useState(false)

  // Check if the video is liked on mount
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const res = await axios.get(`${config.apiUrl}/api/v1/videos/${video._id}/like/check`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setIsLiked(res.data.liked)
      } catch (err) {
        console.error("Error checking like status:", err)
      }
    }

    checkLikeStatus()
  }, [video._id])

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(err => console.error("Playback failed:", err));
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const handleLike = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${config.apiUrl}/api/v1/videos/${video._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsLiked(res.data.liked)
      setLikesCount(res.data.likesCount)
    } catch (err) {
      console.error("Error liking video:", err)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${config.apiUrl}/api/v1/comments/${video._id}`)
      setComments(res.data.comments || [])
    } catch (err) {
      console.error("Error fetching comments:", err)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim()) return
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${config.apiUrl}/api/v1/comments/${video._id}`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setComments([res.data.comment, ...comments])
      setNewComment("")
    } catch (err) {
      console.error("Error posting comment:", err)
    }
  }

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) {
      setIsLiked(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
      fetchComments();
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const videoUrl = getVideoUrl();
      if (!videoUrl) {
        throw new Error('Video URL not available');
      }

      // For YouTube videos, show a message that direct download is not available
      if (isYouTubeUrl(videoUrl)) {
        alert('Direct download is not available for YouTube videos.');
        return;
      }

      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${video.title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download video. Please try again.');
    }
  };

  // Add a function to validate video URL
  const isValidVideoUrl = (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Add function to check if URL is from YouTube
  const isYouTubeUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
    } catch (e) {
      return false;
    }
  }

  // Add function to get YouTube video ID
  const getYouTubeVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.pathname.includes('/shorts/')) {
        return urlObj.pathname.split('/shorts/')[1];
      }
      // Handle regular YouTube URLs if needed
      const searchParams = new URLSearchParams(urlObj.search);
      return searchParams.get('v');
    } catch (e) {
      return null;
    }
  }

  const getVideoUrl = () => {
    console.log("Processing video data:", {
      id: video._id,
      url: video.videoUrl,
      filePath: video.videoFilePath
    });

    if (video.videoUrl) {
      if (isYouTubeUrl(video.videoUrl)) {
        return video.videoUrl;
      }
      
      if (!isValidVideoUrl(video.videoUrl)) {
        console.error("Invalid video URL format:", video.videoUrl);
        setErrorDetails("Invalid video URL format");
        return null;
      }
      return video.videoUrl;
    }
    
    if (!video.videoFilePath) {
      console.error("No video source found for video:", video._id);
      setErrorDetails("No video source found");
      return null;
    }
    
    try {
      if (video.videoFilePath.startsWith("uploads/")) {
        return `${config.apiUrl}/${video.videoFilePath}`;
      } else if (video.videoFilePath.startsWith("/")) {
        return `${config.apiUrl}${video.videoFilePath}`;
      } else {
        return `${config.apiUrl}/uploads/${video.videoFilePath}`;
      }
    } catch (error) {
      console.error("Error constructing video URL:", error);
      setErrorDetails("Error constructing video URL");
      return null;
    }
  }

  const handleVideoError = (e) => {
    console.error("Video error for:", video._id, e);
    const videoElement = e.target;
    
    let errorMessage = "Failed to load video";
    
    // Check specific error types
    if (videoElement.error) {
      switch (videoElement.error.code) {
        case 1:
          errorMessage = "Video loading aborted";
          break;
        case 2:
          errorMessage = "Network error while loading video";
          break;
        case 3:
          errorMessage = "Video decoding failed";
          break;
        case 4:
          errorMessage = "Video format not supported";
          break;
        default:
          errorMessage = "Unknown error while loading video";
      }
    }
    
    setErrorDetails(errorMessage);
    setVideoError(true);
    setVideoLoaded(false);
  }

  const retryLoadingVideo = async () => {
    setVideoError(false);
    setVideoLoaded(false);
    setErrorDetails("");
    setRetryCount((prev) => prev + 1);

    const url = getVideoUrl();
    if (!url) {
      setErrorDetails("Invalid video source");
      setVideoError(true);
      return;
    }

    // Skip validation for YouTube URLs
    if (isYouTubeUrl(url)) {
      if (videoRef.current) {
        videoRef.current.load();
      }
      return;
    }

    try {
      // Only validate non-YouTube URLs
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        setErrorDetails(`Video file not accessible (${response.status})`);
        setVideoError(true);
        return;
      }

      if (videoRef.current) {
        videoRef.current.load();
      }
    } catch (error) {
      console.error("Error validating video:", error);
      setErrorDetails("Failed to validate video source");
      setVideoError(true);
    }
  }

  const videoUrl = getVideoUrl();

  // Handle missing video source gracefully
  if (!videoUrl) {
    return (
      <div className="relative w-full h-[calc(100vh-64px)] bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg mb-2">Video source missing</p>
          <p className="text-sm text-gray-400 mb-4">{errorDetails || "This reel doesn't have a valid video source."}</p>
          <button
            onClick={retryLoadingVideo}
            className="bg-blue-500 px-4 py-2 rounded text-white flex items-center mx-auto hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const finalVideoUrl = `${videoUrl}?retry=${retryCount}`;
  const isYouTube = isYouTubeUrl(videoUrl);
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(videoUrl) : null;

  const handleShowLikes = async (e) => {
    e.stopPropagation();
    try {
      setLoadingLikes(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${config.apiUrl}/api/v1/videos/${video._id}/likes`,
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

  return (
    <>
      <div className="relative w-full h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] bg-black">
        {/* Video Container */}
        <div className="w-full h-full">
          {isYouTube && youtubeVideoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=${isActive ? 1 : 0}&loop=1&playlist=${youtubeVideoId}&controls=0&modestbranding=1&mute=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              loop
              playsInline
              preload="metadata"
              onError={handleVideoError}
              onLoadedData={() => {
                setVideoLoaded(true);
                setVideoError(false);
                setErrorDetails("");
              }}
            >
              <source src={finalVideoUrl} type="video/mp4" />
            </video>
          )}

          {/* Video Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-start">
              <div className="flex-1 text-white">
                <h3 className="text-base sm:text-lg font-semibold">{video.title}</h3>
                <p className="text-xs sm:text-sm text-gray-300">{video.description}</p>
              </div>
            </div>
          </div>

          {/* Right Side Buttons */}
          <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4">
            {/* Like Button */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleLike}
                className="w-12 h-12 rounded-full bg-gray-800/60 flex items-center justify-center hover:bg-gray-700/60 transition-colors"
              >
                <Heart 
                  className={`w-6 h-6 ${isLiked ? "text-red-500 fill-current" : "text-white"}`}
                />
              </button>
              <button 
                onClick={handleShowLikes}
                className="text-white text-sm mt-1 hover:underline cursor-pointer"
              >
                {likesCount}
              </button>
            </div>

            {/* Dislike Button */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleDislike}
                className="w-12 h-12 rounded-full bg-gray-800/60 flex items-center justify-center hover:bg-gray-700/60 transition-colors"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className={`w-6 h-6 ${isDisliked ? "text-red-500" : "text-white"}`}
                  fill="none" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" 
                  />
                </svg>
              </button>
            </div>

            {/* Comments Button */}
            <div className="flex flex-col items-center">
              <button 
                onClick={toggleComments}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800/60 flex items-center justify-center hover:bg-gray-700/60 transition-colors"
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              <span className="text-white text-xs sm:text-sm mt-1">{comments.length}</span>
            </div>

            {/* Share Button */}
            <div className="flex flex-col items-center">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="w-12 h-12 rounded-full bg-gray-800/60 flex items-center justify-center hover:bg-gray-700/60 transition-colors"
              >
                <Share2 className="w-6 h-6 text-white" />
              </button>
              <span className="text-white text-sm mt-1">Share</span>
            </div>

            {/* Download Button */}
            <div className="flex flex-col items-center">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="w-12 h-12 rounded-full bg-gray-800/60 flex items-center justify-center hover:bg-gray-700/60 transition-colors"
              >
                <Download className="w-6 h-6 text-white" />
              </button>
              <span className="text-white text-sm mt-1">Download</span>
            </div>
          </div>

          {/* Comments Overlay */}
          {showComments && (
            <div className="absolute inset-0 bg-black/90 z-10 flex flex-col">
              <div className="p-2 sm:p-4 flex items-center border-b border-gray-700">
                <h4 className="text-white font-semibold flex-1 text-base sm:text-lg">Comments</h4>
                <button 
                  onClick={() => setShowComments(false)}
                  className="text-white hover:text-gray-300 text-lg sm:text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-400">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="mb-4 text-white">
                      <div className="font-semibold text-sm">
                        {comment.userId?.username || "Anonymous"}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        {comment.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-gray-800 text-white border-none rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleComment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors"
                    disabled={!newComment.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
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

const ReelsFeed = () => {
  const [reels, setReels] = useState([])
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${config.apiUrl}/api/v1/videos/reels`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        console.log("Fetched reels data:", res.data.videos)
        setReels(res.data.videos || [])
      } catch (err) {
        console.error("Error fetching reels:", err)
      }
    }

    fetchReels()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.7,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.index)
          setCurrentReelIndex(index)
        }
      })
    }, options)

    const reelElements = container.querySelectorAll(".reel-item")
    reelElements.forEach((el) => observer.observe(el))

    return () => {
      reelElements.forEach((el) => observer.unobserve(el))
    }
  }, [reels])

  if (reels.length === 0) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reels...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="reels-container h-[calc(100vh-64px)] overflow-y-auto snap-y snap-mandatory"
    >
      {reels.map((reel, index) => (
        <div
          key={reel._id}
          data-index={index}
          className="reel-item h-[calc(100vh-64px)] snap-start"
        >
          <ReelItem
            video={reel}
            isActive={currentReelIndex === index}
          />
        </div>
      ))}
    </div>
  )
}

export default ReelsFeed
