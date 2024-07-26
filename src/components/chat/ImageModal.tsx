import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const controls = useAnimation();

  const handleWheel = (event: WheelEvent) => {
    setZoom(prevZoom => Math.min(Math.max(0.5, prevZoom + event.deltaY * -0.01), 5));
  };

  const handlePinch = (event: TouchEvent) => {
    if (event.touches.length === 2) {
      const distance = Math.sqrt(
        Math.pow(event.touches[0].clientX - event.touches[1].clientX, 2) +
        Math.pow(event.touches[0].clientY - event.touches[1].clientY, 2)
      );
      if (prevDistance.current !== null) {
        const delta = distance - prevDistance.current;
        setZoom(prevZoom => Math.min(Math.max(0.5, prevZoom + delta * 0.01), 5));
      }
      prevDistance.current = distance;
    }
  };

  const prevDistance = React.useRef<number | null>(null);

  useEffect(() => {
    const handleTouchEnd = () => {
      prevDistance.current = null;
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('touchmove', handlePinch);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handlePinch);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    controls.start({ scale: zoom });
  }, [zoom, controls]);

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.img
        src={imageUrl}
        alt="Fullscreen"
        className="max-w-full max-h-full cursor-pointer"
        initial={{ scale: 1 }}
        animate={controls}
        onClick={(e) => e.stopPropagation()} // Prevent modal close on image click
      />
    </motion.div>
  );
};

export default ImageModal;
