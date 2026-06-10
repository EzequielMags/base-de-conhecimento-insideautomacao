import { useState, useRef, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const STORAGE_KEY = "app:bg-music:history-v1";
const MAX_HISTORY = 6;

interface HistoryItem {
  videoId: string;
  url: string;
  title?: string;
}

const extractVideoId = (raw: string): string | null => {
  const url = raw.trim();
  if (!url) return null;
  // raw 11-char id
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      // /embed/<id> /shorts/<id> /live/<id>
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") return parts[1] ?? null;
    }
  } catch { /* not a url */ }
  return null;
};

let ytApiLoading: Promise<void> | null = null;
const loadYouTubeAPI = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiLoading) return ytApiLoading;

  ytApiLoading = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
  return ytApiLoading;
};

export const BackgroundMusicPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(40);
  const [ready, setReady] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [urlInput, setUrlInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const saveHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, []);

  // Init YouTube player once
  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            try { e.target.setVolume(40); } catch { /* ignore */ }
            setReady(true);
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              try { e.target.seekTo(0); e.target.playVideo(); } catch { /* ignore */ }
            } else if (e.data === window.YT.PlayerState.PLAYING) {
              setPlaying(true);
              setLoadingTrack(false);
              try {
                const d = playerRef.current?.getVideoData?.();
                if (d?.title) setCurrentTitle(d.title);
              } catch { /* ignore */ }
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setPlaying(false);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
    };
  }, []);

  const playVideo = useCallback((videoId: string, sourceUrl?: string) => {
    const p = playerRef.current;
    if (!p || !ready) return;
    setLoadingTrack(true);
    setCurrentId(videoId);
    setCurrentTitle("");
    try {
      p.loadVideoById({ videoId });
      setTimeout(() => { try { p.setVolume(volume); } catch { /* ignore */ } }, 300);
    } catch (err) {
      console.error("YT play error:", err);
      setLoadingTrack(false);
    }
    // Update history
    const item: HistoryItem = { videoId, url: sourceUrl || `https://youtu.be/${videoId}` };
    const next = [item, ...history.filter((h) => h.videoId !== videoId)].slice(0, MAX_HISTORY);
    saveHistory(next);
  }, [ready, volume, history, saveHistory]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const id = extractVideoId(urlInput);
    if (!id) return;
    playVideo(id, urlInput);
    setUrlInput("");
  }, [urlInput, playVideo]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p || !ready || !currentId) return;
    try {
      if (playing) p.pauseVideo();
      else { p.unMute?.(); p.setVolume(volume); p.playVideo(); }
    } catch (err) { console.error("YT toggle:", err); }
  }, [playing, ready, currentId, volume]);

  const changeVolume = useCallback((v: number[]) => {
    const val = v[0];
    setVolume(val);
    try { playerRef.current?.setVolume?.(val); } catch { /* ignore */ }
  }, []);

  const removeHistory = useCallback((id: string) => {
    saveHistory(history.filter((h) => h.videoId !== id));
  }, [history, saveHistory]);

  return (
    <>
      {/* Hidden YouTube player container */}
      <div style={{ position: "fixed", left: -9999, top: -9999, width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div ref={containerRef} />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button
            className="relative flex items-end gap-[3px] h-9 w-9 justify-center rounded-full hover:bg-accent/50 transition-colors p-1.5"
            aria-label="Música ambiente"
            title="Música ambiente (YouTube)"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={cn(
                  "w-[3px] rounded-full bg-primary transition-all",
                  playing ? "animate-soundbar" : "h-2 opacity-50"
                )}
                style={playing ? {
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: `${0.4 + i * 0.08}s`,
                } : undefined}
              />
            ))}
            {!playing && !currentId && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-5 h-[2px] bg-muted-foreground/60 rotate-45 rounded" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 space-y-4" align="end" side="top">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Link do YouTube
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Cole um link do YouTube"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-sm"
              />
              <Button type="submit" size="icon" variant="default" disabled={!ready || !extractVideoId(urlInput)}>
                <LinkIcon className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {currentId && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tocando agora
              </p>
              <p className="text-xs text-foreground/90 line-clamp-2">
                {loadingTrack ? "Carregando..." : (currentTitle || `https://youtu.be/${currentId}`)}
              </p>

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume</p>
                <Slider value={[volume]} onValueChange={changeVolume} max={100} step={1} />
              </div>

              <Button
                onClick={togglePlay}
                disabled={!ready}
                variant={playing ? "secondary" : "default"}
                className="w-full gap-2"
                size="sm"
              >
                {loadingTrack ? <Loader2 className="h-4 w-4 animate-spin" /> :
                  playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {loadingTrack ? "Carregando..." : playing ? "Pausar" : "Reproduzir"}
              </Button>
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recentes
              </p>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.videoId}
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent/60 cursor-pointer",
                      currentId === h.videoId && "bg-accent/40"
                    )}
                    onClick={() => playVideo(h.videoId, h.url)}
                    role="button"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${h.videoId}/default.jpg`}
                      alt=""
                      className="h-8 w-12 rounded object-cover flex-shrink-0"
                      loading="lazy"
                    />
                    <span className="flex-1 truncate text-foreground/90">{h.title || h.url}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeHistory(h.videoId); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                      aria-label="Remover do histórico"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!currentId && history.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Cole um link do YouTube acima para começar.
            </p>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
};
