"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface ChapterCoverProps {
  imageUrl?: string;
}

export function ChapterCover({ imageUrl }: ChapterCoverProps) {
  if (!imageUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full aspect-video sm:aspect-[21/9] overflow-hidden mb-8"
    >
      <Image
        src={imageUrl}
        alt="Capa do Capítulo"
        className="w-full h-full object-cover"
        fill
      />
    </motion.div>
  );
}
