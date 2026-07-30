import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookmarkPlus,
  Clock3,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';
import { videoBookmarksService } from '../../services/videoBookmarks';
import {
  type VideoWatchProgress,
  videoWatchProgressService,
} from '../../services/videoWatchProgress';
import { useAuthStore } from '../../store';
import type { LessonSubtitleTrack } from '../../types';
import { TranscriptPanel } from './TranscriptPanel';

type VideoSource =
  | { kind: 'direct'; src: string }
  | { kind: 'youtube'; src: string }
  | { kind: 'embed'; src: string };

const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogv', '.ogg'];
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

interface YouTubePlayerInstance {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayerInstance;
}

interface YouTubeApi {
  Player: new (
    element: HTMLIFrameElement,
    options: { events: { onReady: (event: YouTubePlayerEvent) => void } }
  ) => YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youTubeApiPromise: Promise<YouTubeApi> | null = null;

const loadYouTubeApi = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('YouTube is unavailable.'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youTubeApiPromise) return youTubeApiPromise;

  youTubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT?.Player) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });
  return youTubeApiPromise;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainder}`;
};

const validDuration = (seconds: number) =>
  Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;

function useVideoWatchProgress(lessonId: string, enabled: boolean) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const progressQuery = useQuery({
    queryKey: ['video-watch-progress', lessonId],
    queryFn: () => videoWatchProgressService.get(lessonId),
    enabled: Boolean(user && enabled),
  });
  const saveMutation = useMutation({
    mutationFn: videoWatchProgressService.save,
    onSuccess: (progress) =>
      queryClient.setQueryData(['video-watch-progress', lessonId], progress),
  });
  const resetMutation = useMutation({
    mutationFn: () => videoWatchProgressService.reset(lessonId),
    onSuccess: () => queryClient.setQueryData(['video-watch-progress', lessonId], null),
  });

  return {
    progress: progressQuery.data,
    isLoading: progressQuery.isLoading,
    save: useCallback(
      (currentTimeSeconds: number, durationSeconds?: number) => {
        if (!user) return;
        saveMutation.mutate({ lessonId, currentTimeSeconds, durationSeconds });
      },
      [lessonId, saveMutation, user]
    ),
    reset: resetMutation.mutate,
    isResetting: resetMutation.isPending,
  };
}

function ResumeVideoPrompt({
  progress,
  onResume,
  onRestart,
  isResetting,
}: {
  progress?: VideoWatchProgress | null;
  onResume: () => void;
  onRestart: () => void;
  isResetting?: boolean;
}) {
  if (!progress || progress.currentTimeSeconds < 5) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#a3e635]/60 bg-[#ecfccb] px-4 py-3 text-sm text-ink">
      <span>
        Continue watching from <strong>{formatTime(progress.currentTimeSeconds)}</strong>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRestart}
          disabled={isResetting}
          className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium hover:bg-white/70 disabled:opacity-50"
        >
          Start over
        </button>
        <button
          type="button"
          onClick={onResume}
          className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/85"
        >
          Resume
        </button>
      </div>
    </div>
  );
}

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

function VideoTimestampPanel({
  lessonId,
  currentTime,
  onSeek,
}: {
  lessonId: string;
  currentTime: number;
  onSeek: (timestampSeconds: number) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['video-bookmarks', lessonId],
    queryFn: () => videoBookmarksService.list(lessonId),
    enabled: Boolean(user),
  });
  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () =>
      videoBookmarksService.create({
        lessonId,
        timestampSeconds: Math.round(currentTime * 10) / 10,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['video-bookmarks', lessonId] });
      toast.success('Video timestamp saved.');
    },
    onError: () => toast.error('Could not save this video timestamp.'),
  });
  const { mutate: remove } = useMutation({
    mutationFn: videoBookmarksService.remove,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['video-bookmarks', lessonId] }),
    onError: () => toast.error('Could not remove this video timestamp.'),
  });

  if (!user) return null;

  return (
    <section
      className="rounded-lg border border-black/10 bg-white p-4"
      aria-label="Video timestamps"
    >
      <div className="flex items-center gap-2">
        <Clock3 size={16} />
        <h3 className="text-sm font-semibold text-ink">Video timestamps</h3>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Timestamp note"
          maxLength={280}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note for this moment"
          className="min-h-10 flex-1 rounded-lg border border-black/15 px-3 text-sm"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => save()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-black px-3 text-sm font-medium text-white disabled:opacity-50"
        >
          <BookmarkPlus size={16} />
          Save {formatTime(currentTime)}
        </button>
      </div>
      {isLoading ? (
        <p className="mt-3 text-xs text-black/50">Loading saved timestamps…</p>
      ) : bookmarks.length > 0 ? (
        <ul className="mt-3 divide-y divide-black/10">
          {bookmarks.map((bookmark) => (
            <li key={bookmark._id} className="flex items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => onSeek(bookmark.timestampSeconds)}
                className="rounded-md bg-[#d9f99d] px-2 py-1 text-xs font-semibold text-black"
              >
                {formatTime(bookmark.timestampSeconds)}
              </button>
              <span className="min-w-0 flex-1 truncate text-sm text-black/65">
                {bookmark.note || 'Saved timestamp'}
              </span>
              <button
                type="button"
                onClick={() => remove(bookmark._id)}
                className="rounded p-1 text-black/45 hover:bg-black/[0.05] hover:text-black"
                aria-label={`Remove timestamp ${formatTime(bookmark.timestampSeconds)}`}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-black/50">
          Save a timestamp to revisit an important moment.
        </p>
      )}
    </section>
  );
}

function YouTubeLessonPlayer({
  src,
  title,
  lessonId,
  transcript,
  transcriptLanguage,
  progress,
  onSaveProgress,
  onResetProgress,
  isResettingProgress,
}: {
  src: string;
  title: string;
  lessonId: string;
  transcript?: string;
  transcriptLanguage?: string;
  progress?: VideoWatchProgress | null;
  onSaveProgress: (currentTimeSeconds: number, durationSeconds?: number) => void;
  onResetProgress: () => void;
  isResettingProgress?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isResumePromptDismissed, setIsResumePromptDismissed] = useState(false);
  const lastSavedTimeRef = useRef(0);

  const resume = () => {
    if (!progress || !playerRef.current) return;
    playerRef.current.seekTo(progress.currentTimeSeconds, true);
    setCurrentTime(progress.currentTimeSeconds);
    setIsResumePromptDismissed(true);
  };

  const restart = () => {
    playerRef.current?.seekTo(0, true);
    setCurrentTime(0);
    lastSavedTimeRef.current = 0;
    setIsResumePromptDismissed(true);
    onResetProgress();
  };

  useEffect(() => {
    let isActive = true;
    let player: YouTubePlayerInstance | null = null;
    let timer: number | undefined;

    void loadYouTubeApi()
      .then((api) => {
        if (!iframeRef.current || !isActive) return;
        player = new api.Player(iframeRef.current, {
          events: {
            onReady: (event) => {
              if (!isActive) return;
              playerRef.current = event.target;
              setIsReady(true);
              timer = window.setInterval(() => {
                const nextTime = event.target.getCurrentTime();
                setCurrentTime(nextTime);
                if (nextTime - lastSavedTimeRef.current >= 15) {
                  lastSavedTimeRef.current = nextTime;
                  onSaveProgress(nextTime, validDuration(event.target.getDuration()));
                }
              }, 500);
            },
          },
        });
      })
      .catch(() => toast.error('Could not connect to the YouTube player.'));

    return () => {
      isActive = false;
      if (timer) window.clearInterval(timer);
      player?.destroy();
    };
  }, []);

  const playerUrl = new URL(src);
  playerUrl.searchParams.set('enablejsapi', '1');
  if (typeof window !== 'undefined') playerUrl.searchParams.set('origin', window.location.origin);

  return (
    <div className="space-y-3">
      <div className="aspect-video overflow-hidden rounded-lg border border-black/10 bg-black">
        <iframe
          ref={iframeRef}
          src={playerUrl.toString()}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title={title}
        />
      </div>
      <VideoTimestampPanel
        lessonId={lessonId}
        currentTime={currentTime}
        onSeek={(timestampSeconds) => playerRef.current?.seekTo(timestampSeconds, true)}
      />
      {!isResumePromptDismissed ? (
        <ResumeVideoPrompt
          progress={progress}
          onResume={resume}
          onRestart={restart}
          isResetting={isResettingProgress}
        />
      ) : null}
      <TranscriptPanel
        transcript={transcript}
        language={transcriptLanguage}
        onSeek={(timestampSeconds) => playerRef.current?.seekTo(timestampSeconds, true)}
      />
      {!isReady ? <p className="text-xs text-black/50">Connecting to YouTube player…</p> : null}
    </div>
  );
}

export function VideoLessonPlayer({
  videoUrl,
  title,
  lessonId,
  subtitleTracks = [],
  transcript,
  transcriptLanguage,
}: {
  videoUrl: string;
  title: string;
  lessonId: string;
  subtitleTracks?: LessonSubtitleTrack[];
  transcript?: string;
  transcriptLanguage?: string;
}) {
  const source = resolveVideoSource(videoUrl);
  const watchProgress = useVideoWatchProgress(lessonId, source.kind !== 'embed');
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const lastSavedTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeSubtitle, setActiveSubtitle] = useState('off');
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [isResumePromptDismissed, setIsResumePromptDismissed] = useState(false);

  const resumeDirect = () => {
    const timestamp = watchProgress.progress?.currentTimeSeconds;
    if (timestamp == null) return;
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    } else {
      setResumeAt(timestamp);
    }
    setIsResumePromptDismissed(true);
  };

  const restartDirect = () => {
    if (videoRef.current) videoRef.current.currentTime = 0;
    setCurrentTime(0);
    setResumeAt(null);
    lastSavedTimeRef.current = 0;
    setIsResumePromptDismissed(true);
    watchProgress.reset();
  };

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

  const selectSubtitle = (language: string) => {
    const video = videoRef.current;
    if (!video) return;
    Array.from(video.textTracks).forEach((track) => {
      track.mode = track.language === language ? 'showing' : 'disabled';
    });
    setActiveSubtitle(language);
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
      <div className="space-y-3">
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
            onPause={(event) => {
              setIsPlaying(false);
              const nextTime = event.currentTarget.currentTime;
              if (!event.currentTarget.ended && nextTime > 0) {
                lastSavedTimeRef.current = nextTime;
                watchProgress.save(nextTime, validDuration(event.currentTarget.duration));
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              lastSavedTimeRef.current = 0;
              watchProgress.reset();
            }}
            onLoadedMetadata={(event) => {
              setDuration(event.currentTarget.duration);
              if (resumeAt != null) {
                event.currentTarget.currentTime = resumeAt;
                setCurrentTime(resumeAt);
                setResumeAt(null);
              }
            }}
            onTimeUpdate={(event) => {
              const nextTime = event.currentTarget.currentTime;
              setCurrentTime(nextTime);
              if (nextTime - lastSavedTimeRef.current >= 15) {
                lastSavedTimeRef.current = nextTime;
                watchProgress.save(nextTime, validDuration(event.currentTarget.duration));
              }
            }}
          >
            <source src={source.src} />
            {subtitleTracks.map((track) => (
              <track
                key={`${track.language}-${track.url}`}
                kind="subtitles"
                srcLang={track.language}
                label={track.label ?? track.language.toUpperCase()}
                src={track.url}
              />
            ))}
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
                {subtitleTracks.length > 0 ? (
                  <select
                    aria-label="Subtitle language"
                    value={activeSubtitle}
                    onChange={(event) => selectSubtitle(event.target.value)}
                    className="rounded-md border border-white/25 bg-black/40 px-2 py-1 text-xs text-white"
                  >
                    <option value="off">CC off</option>
                    {subtitleTracks.map((track) => (
                      <option key={`${track.language}-${track.url}`} value={track.language}>
                        CC {track.label ?? track.language.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : null}
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
        <VideoTimestampPanel
          lessonId={lessonId}
          currentTime={currentTime}
          onSeek={(timestampSeconds) => {
            if (videoRef.current) videoRef.current.currentTime = timestampSeconds;
          }}
        />
        {!isResumePromptDismissed ? (
          <ResumeVideoPrompt
            progress={watchProgress.progress}
            onResume={resumeDirect}
            onRestart={restartDirect}
            isResetting={watchProgress.isResetting}
          />
        ) : null}
        <TranscriptPanel
          transcript={transcript}
          language={transcriptLanguage}
          onSeek={(timestampSeconds) => {
            if (videoRef.current) videoRef.current.currentTime = timestampSeconds;
          }}
        />
      </div>
    );
  }

  if (source.kind === 'youtube') {
    return (
      <YouTubeLessonPlayer
        src={source.src}
        title={title}
        lessonId={lessonId}
        transcript={transcript}
        transcriptLanguage={transcriptLanguage}
        progress={watchProgress.progress}
        onSaveProgress={watchProgress.save}
        onResetProgress={watchProgress.reset}
        isResettingProgress={watchProgress.isResetting}
      />
    );
  }

  return (
    <div className="space-y-3">
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
      <TranscriptPanel transcript={transcript} language={transcriptLanguage} />
    </div>
  );
}
