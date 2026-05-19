"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

export type StarVariant = "filled" | "mine" | "empty";

type Props = {
  variant: StarVariant;
  size?: number;
  /** 채워진 별이 새로 떠오를 때 애니메이션 */
  animateRise?: boolean;
  className?: string;
  onClick?: () => void;
};

export function Star({ variant, size = 30, animateRise, className, onClick }: Props) {
  const isFilled = variant !== "empty";
  const fill =
    variant === "mine" ? "var(--star-mine)" : variant === "filled" ? "var(--star)" : "none";
  const stroke = variant === "empty" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.55)";

  return (
    <motion.svg
      role="img"
      aria-label={
        variant === "filled" ? "다녀간 별" : variant === "mine" ? "내가 남긴 별" : "빈 자리"
      }
      width={size}
      height={size}
      viewBox="0 0 40 40"
      initial={animateRise ? { opacity: 0, scale: 0.7, y: 8 } : false}
      animate={animateRise ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
      className={clsx("star-icon", variant === "mine" && "is-mine", className)}
      onClick={onClick}
      style={{ overflow: "visible" }}
    >
      {/* 빛 번짐 */}
      {isFilled && (
        <circle
          cx="20"
          cy="20"
          r="14"
          fill={fill}
          opacity="0.18"
          style={{ filter: "blur(6px)" }}
        />
      )}
      <path
        d="M20 4 L23.4 15.2 L35 16 L25.8 23.2 L29 34.5 L20 27.6 L11 34.5 L14.2 23.2 L5 16 L16.6 15.2 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}
