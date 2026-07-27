"use client";

import Image from "next/image";
import { motion } from "motion/react";

type HeartBackgroundProps = {
  loosened?: boolean;
};

export function HeartBackground({
  loosened = false,
}: HeartBackgroundProps) {
  return (
    <div className="heart-glow absolute inset-0 overflow-hidden rounded-[28%]">
      <Image
        alt="Большое розовое сердце, перевязанное нежной лентой"
        className="object-contain"
        fill
        loading="eager"
        sizes="(max-width: 1024px) 94vw, 640px"
        src="/art/heart-ribbon.png"
      />
      <motion.div
        animate={{ opacity: loosened ? 1 : 0 }}
        className="absolute inset-0"
        initial={false}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      >
        <Image
          alt=""
          aria-hidden="true"
          className="object-contain"
          fill
          sizes="(max-width: 1024px) 94vw, 640px"
          src="/art/heart-ribbon-loose.png"
        />
      </motion.div>
    </div>
  );
}
