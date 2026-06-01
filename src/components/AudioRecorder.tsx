import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value?: string | null; // existing audio url
  onChange: (blob: Blob | null) => void;
  className?: string;
}

export const AudioRecorder = ({ value, onChange, className }: Props) => {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    setPreviewUrl(value ?? null);
  }, [value]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onChange(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e) {
      console.error(e);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = () => {
    setPreviewUrl(null);
    onChange(null);
    setPlaying(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {!previewUrl && !recording && (
        <Button type="button" size="sm" variant="outline" onClick={start} className="gap-1">
          <Mic className="h-4 w-4" /> Gravar áudio
        </Button>
      )}
      {recording && (
        <Button type="button" size="sm" variant="destructive" onClick={stop} className="gap-1 animate-pulse">
          <Square className="h-4 w-4" /> Parar ({fmt(elapsed)})
        </Button>
      )}
      {previewUrl && !recording && (
        <>
          <Button type="button" size="sm" variant="outline" onClick={togglePlay} className="gap-1">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pausar" : "Ouvir"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset} className="gap-1 text-destructive">
            <Trash2 className="h-4 w-4" /> Remover
          </Button>
          <audio
            ref={audioRef}
            src={previewUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />
        </>
      )}
    </div>
  );
};
