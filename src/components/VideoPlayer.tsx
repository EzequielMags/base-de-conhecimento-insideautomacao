import { motion } from "framer-motion";

interface VideoPlayerProps {
  video: {
    type: 'upload' | 'embed';
    url: string;
    name?: string;
  };
  className?: string;
}

export const VideoPlayer = ({ video, className = "" }: VideoPlayerProps) => {
  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  };

  if (video.type === 'embed') {
    const embedUrl = getEmbedUrl(video.url);
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative w-full aspect-video rounded-lg overflow-hidden bg-black ${className}`}
      >
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </motion.div>
    );
  }

  return (
    <motion.video
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      controls
      className={`w-full rounded-lg ${className}`}
      src={video.url}
    >
      Seu navegador não suporta vídeos.
    </motion.video>
  );
};
