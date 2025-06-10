import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function VideoFeed() {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [purchasedMap, setPurchasedMap] = useState({});
  const observerRef = useRef();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchVideos = useCallback(async () => {
    if (!token) return;
    try {
        const res = await axios.get(
        `http://localhost:4000/api/v1/videos/feed?page=${page}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.videos.length === 0) {
        setHasMore(false);
      } else {
        setVideos((prev) => [...prev, ...res.data.videos]);

        // Check purchase status for each long-form video
        res.data.videos.forEach((video) => {
          if (video.videoType === "Long-Form") {
            checkPurchase(video._id);
          }
        });
      }
    } catch (err) {
      console.error("Error loading videos:", err);
    }
  }, [page, token]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const checkPurchase = async (videoId) => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/v1/purchase/check/${videoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPurchasedMap((prev) => ({
        ...prev,
        [videoId]: res.data.purchased,
      }));
    } catch (err) {
      console.error("Purchase check failed", err);
    }
  };

  const handleBuy = async (videoId, price) => {
    try {
      const res = await axios.post(
        `http://localhost:4000/api/v1/purchase/${videoId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Purchase successful!");
      setPurchasedMap((prev) => ({ ...prev, [videoId]: true }));
    } catch (err) {
      alert(err.response?.data?.error || "Purchase failed");
    }
  };

  const isPurchased = (video) => {
    return video.price === 0 || purchasedMap[video._id];
  };

  const lastVideoRef = useCallback(
    (node) => {
      if (!hasMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [hasMore]
  );

  useEffect(() => {
    const observers = [];

    const videos = document.querySelectorAll("video[data-autoplay]");
    videos.forEach((video) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(video);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [videos]);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {videos.map((video, index) => {
        const isLast = index === videos.length - 1;
        const ref = isLast ? lastVideoRef : null;

        return (
          <div
            key={video._id}
            ref={ref}
            className="border rounded shadow-md p-4 space-y-2"
          >
            <h3 className="text-lg font-semibold">{video.title}</h3>
            <p className="text-sm text-gray-600">By {video.creatorId?.name}</p>

            {video.videoType === "Short-Form" ? (
              <video
                src={`http://localhost:4000/${video.videoFilePath}`}
                controls
                muted
                data-autoplay
                className="w-full h-64 object-cover rounded"
                onClick={() => navigate(`/player/${video._id}`)}
              />
            ) : (
              <>
                <img
                  src={`https://img.youtube.com/vi/${extractYouTubeID(
                    video.videoUrl
                  )}/0.jpg`}
                  alt="thumbnail"
                  className="w-full h-64 object-cover rounded cursor-pointer"
                  onClick={() =>
                    isPurchased(video) && navigate(`/player/${video._id}`)
                  }
                />
                <div className="flex justify-between items-center mt-2">
                  {isPurchased(video) ? (
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded"
                      onClick={() => navigate(`/player/${video._id}`)}
                    >
                      Watch
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(video._id, video.price)}
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Buy for ₹{video.price}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
      {!hasMore && (
        <p className="text-center text-gray-500 mt-4">No more videos</p>
      )}
    </div>
  );
}

function extractYouTubeID(url) {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : "";
}
