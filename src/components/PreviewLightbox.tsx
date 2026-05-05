import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

export interface PreviewItem {
  url: string;
  type?: "image" | "pdf";
}

interface PreviewLightboxProps {
  items: PreviewItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

const isPdfUrl = (u: string) => /\.pdf(\?|$)/i.test(u);

export const PreviewLightbox = ({ items, index, onClose, onIndexChange }: PreviewLightboxProps) => {
  const [internalIndex, setInternalIndex] = useState(index ?? 0);

  useEffect(() => {
    if (index !== null) setInternalIndex(index);
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line
  }, [index, internalIndex, items.length]);

  if (index === null || items.length === 0) return null;

  const current = items[internalIndex];
  const pdf = current?.type === "pdf" || isPdfUrl(current?.url || "");

  const next = () => {
    const ni = (internalIndex + 1) % items.length;
    setInternalIndex(ni);
    onIndexChange(ni);
  };
  const prev = () => {
    const ni = (internalIndex - 1 + items.length) % items.length;
    setInternalIndex(ni);
    onIndexChange(ni);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95"
        onClick={onClose}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-[121] text-white hover:bg-white/20 h-12 w-12"
          onClick={onClose}
        >
          <X className="h-7 w-7" />
        </Button>

        {items.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[121] text-white hover:bg-white/20 h-14 w-14"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="h-10 w-10" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[121] text-white hover:bg-white/20 h-14 w-14"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="h-10 w-10" />
            </Button>
          </>
        )}

        <div
          className="relative w-full h-full flex items-center justify-center p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {pdf ? (
              <motion.iframe
                key={current.url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={current.url}
                className="w-[90vw] h-[88vh] bg-white rounded"
                title={`Preview ${internalIndex + 1}`}
              />
            ) : (
              <motion.img
                key={current.url}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) next();
                  else if (info.offset.x > 80) prev();
                }}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={current.url}
                alt={`Preview ${internalIndex + 1}`}
                className="max-h-[90vh] max-w-[92vw] object-contain select-none cursor-grab active:cursor-grabbing"
                draggable={false}
              />
            )}
          </AnimatePresence>

          {items.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full">
              {internalIndex + 1} / {items.length}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
