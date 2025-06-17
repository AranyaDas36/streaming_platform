"use client"
import { useState } from "react"
import Navbar from "./Navbar"
import LongFormFeed from "./LongFormFeed"
import ShortFormFeed from "./ShortFormFeed"
import ReelsFeed from "./ReelsFeed"
import { Video, Zap, Play } from "lucide-react"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("long-form")

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div>
        {/* Header Section */}


        {/* Tab Navigation */}
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("long-form")}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "long-form"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Long Form Videos
                </div>
              </button>
              <button
                onClick={() => setActiveTab("short-form")}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "short-form"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Short Form Videos
                </div>
              </button>
              <button
                onClick={() => setActiveTab("reels")}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "reels"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Reels
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-screen">
          {activeTab === "long-form" && <LongFormFeed />}
          {activeTab === "short-form" && <ShortFormFeed />}
          {activeTab === "reels" && <ReelsFeed />}
        </div>
      </div>
    </div>
  )
}
