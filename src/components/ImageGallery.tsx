import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "./ui/carousel";

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageGallery = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageGalleryProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(initialIndex);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        api?.scrollPrev();
      } else if (e.key === "ArrowRight") {
        api?.scrollNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, api]);

  // Scroll to initial index when opening
  useEffect(() => {
    if (api && isOpen) {
      api.scrollTo(initialIndex, true);
      setCurrent(initialIndex);
    }
  }, [api, initialIndex, isOpen]);

  // Track current slide
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  const isSingleImage = images.length === 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
        onClick={onClose}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-[101] text-white hover:bg-white/20 h-12 w-12"
          onClick={onClose}
        >
          <X className="h-8 w-8" />
        </Button>

        {/* Image counter */}
        {!isSingleImage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[101] text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
            {current + 1} / {images.length}
          </div>
        )}

        {/* Gallery content */}
        <div
          className="w-full h-full flex items-center justify-center px-4 md:px-16"
          onClick={(e) => e.stopPropagation()}
        >
          {isSingleImage ? (
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              src={images[0]}
              alt="Visualização ampliada"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              onClick={onClose}
            />
          ) : (
            <Carousel
              setApi={setApi}
              className="w-full max-w-5xl"
              opts={{
                startIndex: initialIndex,
                loop: true,
              }}
            >
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index} className="flex items-center justify-center">
                    <motion.img
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={image}
                      alt={`Imagem ${index + 1} de ${images.length}`}
                      className="max-h-[85vh] max-w-full object-contain rounded-lg"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation arrows */}
              <CarouselPrevious
                className="left-2 md:left-4 h-12 w-12 bg-black/50 hover:bg-black/70 text-white border-none"
                onClick={(e) => e.stopPropagation()}
              />
              <CarouselNext
                className="right-2 md:right-4 h-12 w-12 bg-black/50 hover:bg-black/70 text-white border-none"
                onClick={(e) => e.stopPropagation()}
              />
            </Carousel>
          )}
        </div>

        {/* Dot indicators for mobile */}
        {!isSingleImage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[101] flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  api?.scrollTo(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  current === index
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
