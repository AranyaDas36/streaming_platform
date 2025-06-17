"use client"
import React, { useEffect, useRef, useState, useCallback } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  Play,
  User,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Trash2,
  VolumeX,
  Volume2,
} from "lucide-react"
import config from '../config.js'

export default function ShortFormFeed() {
  const [videos, setVideos] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [playingVideo, setPlayingVideo] = useState(null)
  const [mutedStates, setMutedStates] = useState({})
  const observerRef = useRef()
  const videoRefs = useRef({})
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const fetchVideos = useCallback(
    async (currentPage) => {
      if (!token) return
      try {
        setLoading(true)
        const res = await axios.get(
          `${config.apiUrl}/api/v1/videos/feed?page=${currentPage}&limit=9`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        const shortFormVideos = res.data.videos.filter(
          (video) => video.videoType === "Short-Form"
        )

        if (shortFormVideos.length === 0 && currentPage === 1) {
          setVideos([])
          setHasMore(false)
        } else if (shortFormVideos.length === 0) {
          setHasMore(false)
        } else {
          setVideos((prev) => {
            const all = [...prev, ...shortFormVideos]
            const seen = new Set()
            return all.filter((v) => {
              if (seen.has(v._id)) return false
              seen.add(v._id)
              return true
            })
          })
        }
      } catch (err) {
        console.error("Error loading videos:", err)
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    fetchVideos(page)
  }, [page, fetchVideos])

  const lastVideoRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((prev) => prev + 1)
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [hasMore, loading]
  )

  const handleVideoPlay = (videoId) => {
    if (playingVideo && playingVideo !== videoId && videoRefs.current[playingVideo]) {
      videoRefs.current[playingVideo].pause()
    }

    const video = videoRefs.current[videoId]
    if (!video) return

    if (video.paused) {
      video.play().catch((err) => console.error("Error playing video:", err))
      setPlayingVideo(videoId)
    } else {
      video.pause()
      setPlayingVideo(null)
    }
  }

  const toggleMute = (videoId, e) => {
    e.stopPropagation()
    const video = videoRefs.current[videoId]
    if (!video) return

    video.muted = !video.muted
    setMutedStates((prev) => ({ ...prev, [videoId]: video.muted }))
  }

  const handleDelete = async (videoId, e) => {
    e.stopPropagation()
    if (!window.confirm("Are you sure you want to delete this video?")) return

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Please log in to view videos</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => {
          const isLast = index === videos.length - 1
          const ref = isLast ? lastVideoRef : null
          const isPlaying = playingVideo === video._id
          const isMuted = mutedStates[video._id] !== false

          return (
            <div
              key={video._id}
              ref={ref}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => handleVideoPlay(video._id)}
            >
              <div className="relative group h-64 bg-black">
                <video
                  ref={(el) => {
                    if (el) videoRefs.current[video._id] = el
                  }}
                  src={`http://localhost:4000/${video.videoFilePath}`}
                  className="w-full h-full object-cover"
                  loop
                  muted={isMuted}
                  playsInline
                  poster={`http://localhost:4000/${video.videoFilePath.replace(".mp4", ".jpg")}`}
                />

                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
                  {!isPlaying && (
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </div>

                <div className="absolute bottom-3 right-3 flex space-x-2">
                  <button
                    onClick={(e) => toggleMute(video._id, e)}
                    className="bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 transition-all"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs font-medium">
                  {video.duration
                    ? `${Math.floor(video.duration / 60)}:${(video.duration % 60)
                        .toString()
                        .padStart(2, "0")}`
                    : "Short"}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">{video.title}</h3>

                {video.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{video.description}</p>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {video.creatorId?.username || "Unknown Creator"}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {formatDate(video.uploadedAt)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/player/${video._id}`)
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Watch
                  </button>

                  {video.creatorId?._id === (token ? JSON.parse(atob(token.split(".")[1])).id : null) && (
                    <button
                      onClick={(e) => handleDelete(video._id, e)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs">0</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">0</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Share2 className="w-4 h-4" />
                    <span className="text-xs">Share</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!hasMore && videos.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">You've reached the end! No more videos to load.</p>
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="text-center py-16">
          <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Short Form Videos</h3>
          <p className="text-gray-500">Check back later for new content!</p>
        </div>
      )}
    </div>
  )
}
