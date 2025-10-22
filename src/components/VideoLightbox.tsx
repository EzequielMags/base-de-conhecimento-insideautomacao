import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { VideoPlayer } from "./VideoPlayer";

interface VideoLightboxProps {
  video: {
    type: 'upload' | 'embed';
    url: string;
    name?: string;
  } | null;
  onClose: () => void;
}

export const VideoLightbox = ({ video, onClose }: VideoLightboxProps) => {
  if (!video) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-8"
        onClick={onClose}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 z-[101] text-white hover:bg-white/20 h-12 w-12"
          onClick={onClose}
        >
          <X className="h-8 w-8" />
        </Button>
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-6xl"
          onClick={(e) => e.stopPropagation()}
        >
          <VideoPlayer video={video} className="max-h-[90vh]" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
