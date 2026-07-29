type VideoSource =
  | { kind: 'direct'; src: string }
  | { kind: 'youtube'; src: string }
  | { kind: 'embed'; src: string };

const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogv', '.ogg'];

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

  if (source.kind === 'direct') {
    return (
      <div className="aspect-video overflow-hidden rounded-lg border border-black/10 bg-black">
        <video
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          className="h-full w-full"
          aria-label={`Video lesson: ${title}`}
        >
          <source src={source.src} />
          Your browser does not support HTML video.
        </video>
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
