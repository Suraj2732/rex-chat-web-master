'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  name?: string;
}

interface MediaGalleryProps {
  media: MediaItem[];
  className?: string;
}

export default function MediaGallery({ media, className = '' }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  if (media.length === 0) return null;

  const renderMediaItem = (item: MediaItem, index: number, isOverlay = false) => (
    <div
      key={index}
      className={`relative cursor-pointer overflow-hidden ${
        isOverlay ? 'bg-black/50 flex items-center justify-center' : ''
      }`}
      onClick={() => openLightbox(index)}
    >
      {item.type === 'image' ? (
        <img
          src={item.url}
          alt={`Media ${index + 1}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="relative w-full h-full">
          <video
            src={item.url}
            className="w-full h-full object-cover"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-8 h-8 text-white" />
          </div>
        </div>
      )}
      {isOverlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            +{media.length - 3}
          </span>
        </div>
      )}
    </div>
  );

  const renderGrid = () => {
    if (media.length === 1) {
      return (
        <div className="w-64 h-64 rounded-lg overflow-hidden">
          {renderMediaItem(media[0], 0)}
        </div>
      );
    }

    if (media.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 w-64 h-64 rounded-lg overflow-hidden">
          {media.slice(0, 2).map((item, index) => (
            <div key={index} className="h-full">
              {renderMediaItem(item, index)}
            </div>
          ))}
        </div>
      );
    }

    if (media.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 w-64 h-64 rounded-lg overflow-hidden">
          <div className="row-span-2">
            {renderMediaItem(media[0], 0)}
          </div>
          <div className="grid grid-rows-2 gap-1 h-full">
            <div>{renderMediaItem(media[1], 1)}</div>
            <div>{renderMediaItem(media[2], 2)}</div>
          </div>
        </div>
      );
    }

    // 4 or more items
    return (
      <div className="grid grid-cols-2 gap-1 w-64 h-64 rounded-lg overflow-hidden">
        {media.slice(0, 3).map((item, index) => (
          <div key={index} className={index === 0 ? 'row-span-2' : ''}>
            {renderMediaItem(item, index)}
          </div>
        ))}
        <div className="relative">
          {renderMediaItem(media[3], 3, true)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={className}>
        {renderGrid()}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {media.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextMedia}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-4xl w-full h-full flex items-center justify-center p-4">
            {media[currentIndex].type === 'image' ? (
              <img
                src={media[currentIndex].url}
                alt={`Media ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={media[currentIndex].url}
                controls
                className="max-w-full max-h-full"
                autoPlay
              />
            )}
          </div>

          {/* Media counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
            {currentIndex + 1} / {media.length}
          </div>
        </div>
      )}
    </>
  );
}