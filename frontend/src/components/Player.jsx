"use client"
import React from "react"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Heart,
  Share2,
  Download,
  Send,
  MessageSquare,
  User,
} from "lucide-react"
import LikesModal from "./LikesModal"

export default function Player() {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [likes, setLikes] = useState([])
  const [loadingLikes, setLoadingLikes] = useState(false)
  const token = localStorage.getItem("token")
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return

      try {
        setCommentLoading(true)
        const res = await axios.get(`http://localhost:4000/api/v1/comments/${id}`)
        setComments(res.data.comments)
      } catch (err) {
        console.error("Failed to load comments")
      } finally {
        setCommentLoading(false)
      }
    }

    if (id) fetchComments()
  }, [id])

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`http://localhost:4000/api/v1/videos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setVideo(res.data.video)
        setError(null)
        checkLikeStatus()
      } catch (error) {
        console.error("Error loading video:", error)
        setError("Failed to load video. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchVideo()
    }
  }, [id, token])

  const checkLikeStatus = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/v1/videos/${id}/like/check`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLiked(res.data.liked)
      setLikesCount(res.data.likesCount)
    } catch (err) {
      console.error("Failed to check like status:", err)
    }
  }

  const handleLike = async () => {
    try {
      if (!token) {
        alert("Please log in to like videos")
        return
      }
      const res = await axios.post(
        `http://localhost:4000/api/v1/videos/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLiked(res.data.liked)
      setLikesCount(res.data.likesCount)
    } catch (err) {
      console.error("Error liking video:", err)
    }
  }

  const handleShowLikes = async () => {
    try {
      setLoadingLikes(true)
      const res = await axios.get(
        `http://localhost:4000/api/v1/videos/${id}/likes`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLikes(res.data.likes)
      setShowLikesModal(true)
    } catch (err) {
      console.error("Failed to fetch likes", err)
    } finally {
      setLoadingLikes(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

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

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    if (!token) {
      alert("Please log in to comment")
      return
    }

    try {
      const res = await axios.post(
        `http://localhost:4000/api/v1/comments/${id}`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setComments([res.data.comment, ...comments])
      setNewComment("")
    } catch (err) {
      console.error("Failed to post comment", err)
    }
  }

  const togglePlay = () => {
    const videoElement = document.querySelector("video")
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause()
      } else {
        videoElement.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    const videoElement = document.querySelector("video")
    if (videoElement) {
      videoElement.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    const videoElement = document.querySelector("video")
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoElement.requestFullscreen()
      }
    }
  }

  const formatViews = (views) => {
    if (!views) return "0"
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Format relative time for comments
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Video not found"}</p>
        </div>
      </div>
    )
  }

  function extractYouTubeID(url) {
    if (!url) return ""
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)
    return match ? match[1] : ""
  }

  return (
    <>
      <div className="min-h-screen bg-slate-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content (Left Side) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div className="relative group">
                  {video.videoType === "Short-Form" ? (
                    <div className="relative">
                      <video
                        src={`http://localhost:4000/${video.videoFilePath}`}
                        className="w-full aspect-video object-cover"
                        controls
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onLoadedData={() => setIsPlaying(false)}
                      />

                      {/* Custom Video Controls Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 pointer-events-auto">
                          <button
                            onClick={togglePlay}
                            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm p-2 rounded-full transition-colors"
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </button>

                          <button
                            onClick={toggleMute}
                            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm p-2 rounded-full transition-colors"
                          >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>

                          <div className="flex-1" />

                          <button
                            onClick={toggleFullscreen}
                            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm p-2 rounded-full transition-colors"
                          >
                            <Maximize className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeID(video.videoUrl)}?rel=0&modestbranding=1`}
                        frameBorder="0"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                        title="YouTube Player"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Video Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
                {/* Title and Type Badge */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        video.videoType === "Short-Form" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {video.videoType}
                    </span>
                    {video.category && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border">
                        {video.category}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">{video.title}</h1>
                </div>

                {/* Description */}
                {video.description && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{video.description}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      liked ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                    <span 
                      className="hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowLikes();
                      }}
                    >
                      {likesCount}
                    </span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>

                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            {/* Comments Section (Right Side) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comments
                  </h2>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                    {comments.length}
                  </span>
                </div>

                {/* New Comment Form */}
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                        placeholder={token ? "Add a comment..." : "Please log in to comment"}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!token}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!token || !newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Post
                    </button>
                  </div>
                </form>

                {/* Comment List */}
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {commentLoading ? (
                    // Comment loading skeletons
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="flex gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {comment.userId?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{comment.userId?.username || "User"}</h4>
                            <span className="text-xs text-gray-500">
                              {comment.createdAt ? formatRelativeTime(comment.createdAt) : "Just now"}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
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
