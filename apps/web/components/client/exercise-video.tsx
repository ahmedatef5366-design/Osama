"use client";

import { useState } from "react";

type ExerciseVideoProps = {
  videoUrl?: string;
  exerciseName: string;
};

export function ExerciseVideo({ videoUrl, exerciseName }: ExerciseVideoProps) {
  const [playing, setPlaying] = useState(false);

  if (!videoUrl) return null;

  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  const embedUrl = isYouTube
    ? videoUrl
        .replace("watch?v=", "embed/")
        .replace("youtu.be/", "youtube.com/embed/")
    : null;

  if (isYouTube && embedUrl) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-md">
        {playing ? (
          <iframe
            src={`${embedUrl}?autoplay=1`}
            title={exerciseName}
            className="h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group flex h-full w-full items-center justify-center bg-surface-high"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent transition-transform group-hover:scale-110">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#080B0F">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </button>
        )}
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      controls
      className="aspect-video w-full rounded-md bg-surface-high"
      preload="metadata"
    >
      <track kind="captions" />
    </video>
  );
}
