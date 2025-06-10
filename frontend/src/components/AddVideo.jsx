"use client"
import React from "react"
import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Upload, Video, Youtube, X, Check, Loader2 } from "lucide-react"

export default function AddVideo() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoType, setVideoType] = useState("Short-Form")
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState("")
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const token = localStorage.getItem("token")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("videoType", videoType)

      if (videoType === "Short-Form") {
        if (!videoFile) return alert("Please upload a video file")
        formData.append("videoFile", videoFile)
      } else {
        if (!videoUrl) return alert("Please provide a YouTube URL")
        formData.append("videoUrl", videoUrl)
      }

      const res = await axios.post("http://localhost:4000/api/v1/videos/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      alert("Video uploaded successfully!")
      setTitle("")
      setDescription("")
      setVideoFile(null)
      setPreviewUrl(null)
      setVideoUrl("")
      setPrice(0)
      navigate("/dashboard")
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (file) => {
    if (file) {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const removeFile = () => {
    setVideoFile(null)
    setPreviewUrl(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-8">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Upload className="mr-2 h-6 w-6" />
            Upload a New Video
          </h2>
          <p className="text-blue-100 mt-1">Share your content with the world</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Video Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Video Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setVideoType("Short-Form")}
                className={`flex flex-col items-center justify-center py-3 px-4 border rounded-lg ${
                  videoType === "Short-Form"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Video className="h-6 w-6 mb-1" />
                <span className="text-sm font-medium">Short-Form</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoType("Long-Form")}
                className={`flex flex-col items-center justify-center py-3 px-4 border rounded-lg ${
                  videoType === "Long-Form"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Youtube className="h-6 w-6 mb-1" />
                <span className="text-sm font-medium">Long-Form</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoType("Reel")}
                className={`flex flex-col items-center justify-center py-3 px-4 border rounded-lg ${
                  videoType === "Reel"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Video className="h-6 w-6 mb-1" />
                <span className="text-sm font-medium">Reel</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows="3"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your video"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            {/* Video Upload or URL */}
            {videoType === "Short-Form" ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Video <span className="text-red-500">*</span>
                </label>

                {!videoFile ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".mp4"
                      className="hidden"
                      id="video-upload"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm font-medium text-gray-700">
                        Drag and drop your video here, or click to browse
                      </p>
                      <p className="mt-1 text-xs text-gray-500">MP4 format only, max 10MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-4 flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        <Video className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{videoFile.name}</p>
                        <p className="text-xs text-gray-500">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="ml-4 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    {previewUrl && (
                      <div className="p-2 bg-black">
                        <video src={previewUrl} className="w-full h-48 object-contain" controls />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
                    YouTube URL <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Youtube className="h-4 w-4" />
                    </span>
                    <input
                      type="url"
                      id="videoUrl"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Paste the full YouTube video URL</p>
                </div>

                {videoType === "Long-Form" && (
                  <div>
             
          
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="-ml-1 mr-2 h-5 w-5" />
                  Upload Video
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
