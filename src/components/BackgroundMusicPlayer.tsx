import { useState, useRef, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const TRACKS = [
  { id: "focus", label: "Foco Profundo", url: "https://cdn.pixabay.com/audio/2024/11/28/audio_3a179effab.mp3" },
  { id: "relax", label: "Ambiente Relax", url: "https://cdn.pixabay.com/audio/2024/09/10/audio_6e4e1c08e1.mp3" },
  { id: "lofi", label: "Lo-Fi Chill", url: "https://cdn.pixabay.com/audio/2022/05/17/audio_407cace4c6.mp3" },
];

export const BackgroundMusicPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [trackIndex, setTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(TRACKS[0].url);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setPlaying(!playing);
  }, [playing]);

  const changeVolume = useCallback((v: number[]) => {
    const val = v[0];
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val / 100;
  }, []);

  const changeTrack = useCallback((idx: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = playing;
    audio.pause();
    audio.src = TRACKS[idx].url;
    audio.load();
    setTrackIndex(idx);
    if (wasPlaying) {
      audio.play().catch(() => {});
    }
  }, [playing]);

  return (
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
          <div className="space-y-1">
            {TRACKS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => changeTrack(i)}
                className={cn(
                  "w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors",
                  i === trackIndex
                    ? "bg-primary/15 text-primary font-medium"
                    : "hover:bg-accent text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volume</p>
          <Slider value={[volume]} onValueChange={changeVolume} max={100} step={1} className="w-full" />
        </div>

        <Button
          onClick={togglePlay}
          variant={playing ? "secondary" : "default"}
          className="w-full gap-2"
          size="sm"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? "Pausar" : "Reproduzir"}
        </Button>
      </PopoverContent>
    </Popover>
  );
};
