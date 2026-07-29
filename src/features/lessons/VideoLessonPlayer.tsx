type VideoSource =
  | { kind: 'direct'; src: string }
  | { kind: 'youtube'; src: string }
  | { kind: 'embed'; src: string };

const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogv', '.ogg'];
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainder}`;
};

const getYouTubeId = (url: URL) => {
  const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
  const candidate =
    hostname === 'youtu.be'
      ? url.pathname.split('/')[1]
      : hostname.endsWith('youtube.com')
        ? (url.searchParams.get('v') ??
          url.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/)?.[1])
        : undefined;
  return candidate && /^[\w-]{11}$/.test(candidate) ? candidate : null;
};

export const resolveVideoSource = (videoUrl: string): VideoSource => {
  try {
    const url = new URL(videoUrl);
    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
      return {
        kind: 'youtube',
        src: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`,
      };
    }
    if (
      DIRECT_VIDEO_EXTENSIONS.some((extension) =>
        url.pathname.toLowerCase().endsWith(extension)
      )
    ) {
      return { kind: 'direct', src: videoUrl };
    }
  } catch {
    // Keep the legacy iframe behavior for non-standard video URLs.
  }
  return { kind: 'embed', src: videoUrl };
};

export function VideoLessonPlayer({
  videoUrl,
  title,
}: {
  videoUrl: string;
  title: string;
}) {
  const source = resolveVideoSource(videoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play();
    else video.pause();
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(
      0,
      Math.min(video.duration || 0, video.currentTime + seconds)
    );
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleMuted = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await playerRef.current.requestFullscreen();
  };

  const handleKeyboardShortcut = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'k') {
      event.preventDefault();
      void togglePlayback();
    } else if (key === 'arrowleft') {
      event.preventDefault();
      seekBy(-10);
    } else if (key === 'arrowright') {
      event.preventDefault();
      seekBy(10);
    } else if (key === '<') {
      event.preventDefault();
      const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
      changePlaybackRate(PLAYBACK_RATES[Math.max(0, currentIndex - 1)]);
    } else if (key === '>') {
      event.preventDefault();
      const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
      changePlaybackRate(
        PLAYBACK_RATES[Math.min(PLAYBACK_RATES.length - 1, currentIndex + 1)]
      );
    } else if (key === 'm') {
      event.preventDefault();
      toggleMuted();
    } else if (key === 'f') {
      event.preventDefault();
      void toggleFullscreen();
    }
  };

  if (source.kind === 'direct') {
    return (
      <div
        ref={playerRef}
        tabIndex={0}
        onKeyDown={handleKeyboardShortcut}
        onMouseDown={(event) => event.currentTarget.focus()}
        className="group relative aspect-video overflow-hidden rounded-lg border border-black/10 bg-black outline-none focus-visible:ring-2 focus-visible:ring-[#d9f99d]"
        aria-label={`Video player for ${title}. Press Space or K to play or pause.`}
      >
        <video
          controlsList="nodownload"
          playsInline
          preload="metadata"
          className="h-full w-full"
          aria-label={`Video lesson: ${title}`}
          ref={videoRef}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        >
          <source src={source.src} />
          Your browser does not support HTML video.
        </video>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-10 text-white sm:px-4">
          <input
            aria-label="Seek within video"
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => {
              const video = videoRef.current;
              if (!video) return;
              video.currentTime = Number(event.target.value);
            }}
            className="mb-3 w-full accent-[#d9f99d]"
          />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => void togglePlayback()}
              className="inline-flex size-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9f99d]"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              type="button"
              onClick={() => seekBy(-10)}
              className="inline-flex size-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9f99d]"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw size={18} />
              <span className="sr-only">10 seconds</span>
            </button>
            <button
              type="button"
              onClick={() => seekBy(10)}
              className="inline-flex size-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9f99d]"
              aria-label="Forward 10 seconds"
            >
              <RotateCw size={18} />
              <span className="sr-only">10 seconds</span>
            </button>
            <span className="min-w-24 text-xs tabular-nums text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMuted}
                className="inline-flex size-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9f99d]"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <label className="sr-only" htmlFor="video-playback-rate">
                Playback speed
              </label>
              <select
                id="video-playback-rate"
                value={playbackRate}
                onChange={(event) => changePlaybackRate(Number(event.target.value))}
                className="rounded-md border border-white/25 bg-black/40 px-2 py-1 text-xs text-white"
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}x
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="inline-flex size-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9f99d]"
                aria-label="Toggle fullscreen"
              >
                <Maximize size={18} />
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-white/60">
            Shortcuts: Space/K play, ←/→ seek, &lt;/&gt; speed, M mute, F fullscreen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-lg border border-black/10 bg-black">
      <iframe
        src={source.src}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        title={title}
      />
    </div>
  );
}
import React, { useRef, useState } from 'react';
import {
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
