"use client"
import React, { useEffect, useRef, useState, useCallback } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Play, User, ShoppingCart, Calendar, Video } from "lucide-react"
import { Trash2 } from "lucide-react"
import config from '../config.js'


export default function LongFormFeed() {
  const [videos, setVideos] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [purchasedMap, setPurchasedMap] = useState({})
  const observerRef = useRef()
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const loadingRef = useRef(false)

  const checkPurchase = async (videoId) => {
    try {
      const res = await axios.get(`${config.apiUrl}/api/v1/purchase/check/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPurchasedMap((prev) => ({
        ...prev,
        [videoId]: res.data.purchased,
      }))
    } catch (err) {
      console.error("Purchase check failed", err)
    }
  }

  const handleDelete = async (videoId) => {
  if (!window.confirm("Are you sure you want to delete this video?")) return;
  try {
    await axios.delete(`${config.apiUrl}/api/v1/videos/${videoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setVideos((prev) => prev.filter((v) => v._id !== videoId))
    alert("Video deleted successfully")
  } catch (err) {
    alert(err.response?.data?.error || "Delete failed")
  }
}


  const handleBuy = async (videoId, price) => {
    try {
      const res = await axios.post(
        `${config.apiUrl}/api/v1/purchase/${videoId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      alert("Purchase successful!")
      setPurchasedMap((prev) => ({ ...prev, [videoId]: true }))
    } catch (err) {
      alert(err.response?.data?.error || "Purchase failed")
    }
  }

  const isPurchased = (video) => {
    return video.price === 0 || purchasedMap[video._id]
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!token || loadingRef.current || !hasMore) return

      loadingRef.current = true
      try {
        const res = await axios.get(`${config.apiUrl}/api/v1/videos/feed?page=${page}&limit=6`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const longFormVideos = res.data.videos.filter((video) => video.videoType === "Long-Form")

        if (longFormVideos.length === 0) {
          setHasMore(false)
        } else {
          setVideos((prev) => {
            const all = [...prev, ...longFormVideos]
            const seen = new Set()
            return all.filter((v) => {
              if (seen.has(v._id)) return false
              seen.add(v._id)
              return true
            })
          })

          longFormVideos.forEach((video) => checkPurchase(video._id))
        }
      } catch (err) {
        console.error("Error loading videos:", err)
      } finally {
        loadingRef.current = false
      }
    }

    fetchData()
  }, [page, token, hasMore])

  const lastVideoRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingRef.current && hasMore) {
        loadingRef.current = true // prevent multiple triggers
        setPage((prev) => prev + 1)
      }
    })

    if (node) observerRef.current.observe(node)
  }, [hasMore])

  const extractYouTubeID = (url) => {
    if (!url) return null;
    try {
      // Handle different YouTube URL formats
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?/]+)/,
        /youtube\.com\/shorts\/([^&?/]+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    } catch (error) {
      console.error("Error extracting YouTube ID:", error);
      return null;
    }
  };

  const getThumbnailUrl = (video) => {
    const youtubeId = extractYouTubeID(video.videoUrl);
    if (youtubeId) {
      // Try HD thumbnail first, fallback to default quality
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    }
    // Fallback to a default thumbnail
    return "https://placehold.co/640x360/e2e8f0/475569?text=No+Thumbnail";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => {
          const isLast = index === videos.length - 1
          const ref = isLast ? lastVideoRef : null

          return (
            <div key={video._id} ref={ref} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              {/* Thumbnail */}
              <div className="relative group">
                <img
                  src={getThumbnailUrl(video)}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // If HD thumbnail fails, try standard quality
                    const youtubeId = extractYouTubeID(video.videoUrl);
                    if (youtubeId && e.target.src.includes('maxresdefault')) {
                      e.target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                    } else {
                      // If all YouTube thumbnails fail, use fallback
                      e.target.src = "https://placehold.co/640x360/e2e8f0/475569?text=No+Thumbnail";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Price Badge */}
                {video.price > 0 && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
                    ₹{video.price}
                  </div>
                )}

                {/* Free Badge */}
                {video.price === 0 && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
                    FREE
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">{video.title}</h3>

                {video.description && <p className="text-gray-600 text-sm mb-4 line-clamp-2">{video.description}</p>}

                {/* Creator Info */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {video.creatorId?.username || "Unknown Creator"}
                  </span>
                </div>

                {/* Upload Date */}
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {formatDate(video.uploadedAt)}
                </div>

                {/* Action Button */}
                <div className="flex gap-2">
                  {isPurchased(video) ? (
                    <button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/player/${video._id}`)}
                    >
                      <Play className="w-4 h-4" />
                      Watch Now
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(video._id, video.price)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Buy for ₹{video.price}
                    </button>
                  )}

                  {video.creatorId?._id === JSON.parse(atob(token.split('.')[1])).id && (
                  <button
                    onClick={() => handleDelete(video._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Video
                  </button>
                )}

                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* No More Videos */}
      {!hasMore && videos.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">You've reached the end! No more videos to load.</p>
        </div>
      )}

      {/* No Videos */}
      {!loadingRef.current && videos.length === 0 && (
        <div className="text-center py-16">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Long Form Videos</h3>
          <p className="text-gray-500">Check back later for new content!</p>
        </div>
      )}
    </div>
  )
}
