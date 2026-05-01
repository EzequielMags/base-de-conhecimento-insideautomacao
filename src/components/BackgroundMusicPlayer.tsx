import { useState, useRef, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const TRACKS = [
  { id: "track1", label: "Opera GX - Ambient Foco", url: "/assets/audio/opera-gx-track1.mp3" },
  { id: "track2", label: "Opera GX - Chill Synth", url: "/assets/audio/opera-gx-track2.mp3" },
  { id: "track3", label: "Opera GX - Lo-Fi Vibe", url: "/assets/audio/opera-gx-track3.mp3" },
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
    audio.preload = "auto";
    audioRef.current = audio;

    const handleEnded = () => {
      // Safety: re-play if loop somehow fails
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play()
        .then(() => setPlaying(true))
        .catch((err) => {
          console.error("Erro ao reproduzir áudio:", err);
          setPlaying(false);
        });
    }
  }, [playing]);

  const changeVolume = useCallback((v: number[]) => {
    const val = v[0];
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val / 100;
  }, []);

  const changeTrack = useCallback((value: string) => {
    const idx = TRACKS.findIndex((t) => t.id === value);
    if (idx < 0) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = TRACKS[idx].url;
    audio.loop = true;
    audio.volume = volume / 100;
    audio.load();
    setTrackIndex(idx);
    // Auto-play new track maintaining current volume
    audio.play()
      .then(() => setPlaying(true))
      .catch((err) => {
        console.error("Erro ao trocar faixa:", err);
        setPlaying(false);
      });
  }, [volume]);

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
