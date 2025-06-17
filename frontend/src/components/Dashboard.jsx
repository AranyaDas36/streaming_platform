"use client"
import React from "react"
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
          <div className="max-w-6xl mx-auto px-2 sm:px-4">
            <div className="flex flex-wrap sm:flex-nowrap space-x-0 sm:space-x-8 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("long-form")}
                className={`py-3 px-2 sm:py-4 border-b-2 font-medium text-xs sm:text-sm transition-colors min-w-[120px] sm:min-w-0 ${
                  activeTab === "long-form"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <Video className="w-4 h-4" />
                  <span className="hidden xs:inline">Long Form Videos</span>
                  <span className="inline xs:hidden">Long</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("short-form")}
                className={`py-3 px-2 sm:py-4 border-b-2 font-medium text-xs sm:text-sm transition-colors min-w-[120px] sm:min-w-0 ${
                  activeTab === "short-form"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <Zap className="w-4 h-4" />
                  <span className="hidden xs:inline">Short Form Videos</span>
                  <span className="inline xs:hidden">Short</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("reels")}
                className={`py-3 px-2 sm:py-4 border-b-2 font-medium text-xs sm:text-sm transition-colors min-w-[120px] sm:min-w-0 ${
                  activeTab === "reels"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <Play className="w-4 h-4" />
                  <span className="hidden xs:inline">Reels</span>
                  <span className="inline xs:hidden">Reels</span>
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
