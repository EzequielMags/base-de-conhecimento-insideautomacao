import { useState, useRef, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const TRACKS = [
  { id: "track1", label: "Ambient Foco", videoId: "EUIOgd_CNl4" },
  { id: "track2", label: "Chill Synth", videoId: "qmbAxI2wsAU" },
  { id: "track3", label: "Lo-Fi Vibe", videoId: "EUIOgd_CNl4" },
];

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

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
  const [volume, setVolume] = useState(50);
  const [trackIndex, setTrackIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "0",
        width: "0",
        videoId: TRACKS[0].videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: TRACKS[0].videoId, // required for loop
        },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(50);
            setReady(true);
          },
          onStateChange: (e: any) => {
            // 0 = ended, 1 = playing, 2 = paused
            if (e.data === window.YT.PlayerState.ENDED) {
              try {
                e.target.seekTo(0);
                e.target.playVideo();
              } catch {}
            } else if (e.data === window.YT.PlayerState.PLAYING) {
              setPlaying(true);
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setPlaying(false);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    try {
      if (playing) {
        p.pauseVideo();
        setPlaying(false);
      } else {
        p.unMute?.();
        p.setVolume(volume);
        p.playVideo();
        setPlaying(true);
      }
    } catch (err) {
      console.error("YT toggle error:", err);
    }
  }, [playing, ready, volume]);

  const changeVolume = useCallback((v: number[]) => {
    const val = v[0];
    setVolume(val);
    try {
      playerRef.current?.setVolume?.(val);
    } catch {}
  }, []);

  const changeTrack = useCallback((value: string) => {
    const idx = TRACKS.findIndex((t) => t.id === value);
    if (idx < 0) return;
    setTrackIndex(idx);
    const p = playerRef.current;
    if (!p || !ready) return;
    try {
      p.loadVideoById({ videoId: TRACKS[idx].videoId });
      // Re-set loop playlist after load
      setTimeout(() => {
        try {
          p.setLoop?.(true);
          p.setVolume(volume);
        } catch {}
      }, 300);
      setPlaying(true);
    } catch (err) {
      console.error("YT change track error:", err);
    }
  }, [ready, volume]);

  return (
    <>
      {/* Hidden YouTube player container */}
      <div style={{ position: "fixed", left: -9999, top: -9999, width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div ref={containerRef} />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button
            className="relative flex items-end gap-[3px] h-8 w-8 justify-center rounded-full hover:bg-accent/50 transition-colors p-1.5"
            aria-label="Background Music"
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
            {!playing && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-5 h-[2px] bg-muted-foreground/60 rotate-45 rounded" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 space-y-4" align="end">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faixa</p>
            <Select value={TRACKS[trackIndex].id} onValueChange={changeTrack}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACKS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volume</p>
            <Slider value={[volume]} onValueChange={changeVolume} max={100} step={1} className="w-full" />
          </div>

          <Button
            onClick={togglePlay}
            disabled={!ready}
            variant={playing ? "secondary" : "default"}
            className="w-full gap-2"
            size="sm"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pausar" : ready ? "Reproduzir" : "Carregando..."}
          </Button>
        </PopoverContent>
      </Popover>
    </>
  );
};
