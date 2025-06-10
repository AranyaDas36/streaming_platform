import React from 'react';
import { X } from 'lucide-react';

export default function LikesModal({ isOpen, onClose, likes }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Liked by</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Likes List */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {likes.length === 0 ? (
            <p className="text-center text-gray-500">No likes yet</p>
          ) : (
            <div className="space-y-4">
              {likes.map((like) => (
                <div key={like.userId} className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {like.avatar ? (
                      <img
                        src={like.avatar}
                        alt={like.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-lg font-semibold">
                        {like.name ? like.name[0].toUpperCase() : like.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <h4 className="font-medium">{like.name || like.username}</h4>
                    {like.name && (
                      <p className="text-sm text-gray-500">@{like.username}</p>
                    )}
                  </div>

                  {/* Like Time */}
                  <div className="text-sm text-gray-500">
                    {new Date(like.likedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 