"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Star } from "./Star";
import { DayBundle, StarSlot } from "@/lib/types";
import { formatHHMM } from "@/lib/day/time";

type Props = {
  bundle: DayBundle;
  /** 사용자 본인의 슬롯 (있을 때 핑크) */
  mySlot?: number | null;
  /** 빈 슬롯 클릭 시 호출 (오늘 페이지에서만 활성) */
  onClaimSlot?: () => void;
  /** 별을 클릭하면 신고 등 메뉴 등장 */
  onEntryAction?: (entry: { id: number; content: string }) => void;
  /** 새로 떠오를 슬롯 (애니메이션 트리거) */
  risingSlot?: number | null;
};

export function Constellation({
  bundle,
  mySlot,
  onClaimSlot,
  onEntryAction,
  risingSlot,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  // 슬롯 정렬: 1..10
  const slots = useMemo(
    () => [...bundle.slots].sort((a, b) => a.slot - b.slot),
    [bundle]
  );

  // 빈 슬롯 placeholder 텍스트 (시각적 다양성)
  const emptyPlaceholders = useMemo(() => {
    const opts = ["아직 비어 있는 자리", "누군가의 한 줄을 기다리는 중", "오늘의 마지막 별"];
    return opts;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: "min(56vh, 520px)" }}
    >
      {slots.map((s, i) => {
        const isFilled = !!s.entry && !s.entry.is_deleted;
        const isMine = s.slot === mySlot;
        const isHidden = !!s.entry?.is_hidden;
        const variant = !isFilled ? "empty" : isMine ? "mine" : "filled";

        const text = !isFilled
          ? emptyPlaceholders[i % emptyPlaceholders.length]
          : isHidden
            ? "🤍 (가려진 글)"
            : s.entry!.content;

        const timeLabel = isFilled
          ? formatHHMM(s.entry!.created_at)
          : null;

        return (
          <SlotMarker
            key={s.slot}
            slot={s}
            variant={variant}
            text={text}
            timeLabel={timeLabel}
            risingNow={risingSlot === s.slot}
            isHover={hover === s.slot}
            onHover={(on) => setHover(on ? s.slot : null)}
            onClick={() => {
              if (!isFilled && onClaimSlot) {
                onClaimSlot();
              } else if (isFilled && !isMine && !isHidden && s.entry && onEntryAction) {
                onEntryAction({ id: s.entry.id, content: s.entry.content });
              }
            }}
          />
        );
      })}
    </div>
  );
}

function SlotMarker({
  slot,
  variant,
  text,
  timeLabel,
  risingNow,
  isHover,
  onHover,
  onClick,
}: {
  slot: StarSlot;
  variant: "filled" | "mine" | "empty";
  text: string;
  timeLabel: string | null;
  risingNow: boolean;
  isHover: boolean;
  onHover: (on: boolean) => void;
  onClick: () => void;
}) {
  const x = `${slot.x}%`;
  const y = `${slot.y}%`;

  return (
    <button
      type="button"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group focus:outline-none"
      style={{ left: x, top: y }}
      aria-label={variant === "empty" ? "빈 자리" : `슬롯 ${slot.slot}`}
    >
      {timeLabel && (
        <span className="mono text-[10px] tracking-[0.2em] text-star-soft/80 mb-1">
          {timeLabel}
        </span>
      )}
      <Star variant={variant} size={variant === "empty" ? 28 : 34} animateRise={risingNow} />
      <span
        className={`mt-2 text-center font-serif leading-snug px-2 ${
          variant === "empty"
            ? "text-ink-faint/70 italic"
            : variant === "mine"
              ? "text-[color:var(--star-mine)]"
              : "text-ink-muted"
        }`}
        style={{
          fontSize: variant === "empty" ? "0.78rem" : "0.82rem",
          maxWidth: 180,
        }}
      >
        {text}
      </span>
      {isHover && variant !== "empty" && (
        <span className="mono text-[9px] tracking-widest text-ink-faint mt-1">
          {variant === "mine" ? "내 별" : "click — 신고"}
        </span>
      )}
    </button>
  );
}
