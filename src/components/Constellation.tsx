"use client";

import { useMemo, useRef, useState } from "react";
import { Star } from "./Star";
import { DayBundle, StarSlot, HIDDEN_CONTENT_MASK } from "@/lib/types";
import { formatHHMM } from "@/lib/day/time";

type Props = {
  bundle: DayBundle;
  /** 사용자 본인의 슬롯 (있을 때 핑크) */
  mySlot?: number | null;
  /** 빈 슬롯 클릭 시 호출 (오늘 페이지에서만 활성) */
  onClaimSlot?: () => void;
  /** 신고 버튼 클릭 시 호출 — 별 자체 클릭이 아니라 명시적 신고 버튼 */
  onReport?: (entry: { id: number; content: string }) => void;
  /** 새로 떠오를 슬롯 (애니메이션 트리거) */
  risingSlot?: number | null;
};

export function Constellation({
  bundle,
  mySlot,
  onClaimSlot,
  onReport,
  risingSlot,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const slots = useMemo(
    () => [...bundle.slots].sort((a, b) => a.slot - b.slot),
    [bundle]
  );

  const emptyPlaceholders = useMemo(
    () => ["아직 비어 있는 자리", "누군가의 한 줄을 기다리는 중", "오늘의 마지막 별"],
    []
  );

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
          : isHidden || s.entry!.content === HIDDEN_CONTENT_MASK
            ? "🤍 (가려진 글)"
            : s.entry!.content;

        const timeLabel = isFilled ? formatHHMM(s.entry!.created_at) : null;

        const canReport =
          isFilled && !isMine && !isHidden && !!s.entry && !!onReport;

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
            onStarClick={() => {
              if (!isFilled && onClaimSlot) onClaimSlot();
            }}
            onReportClick={
              canReport
                ? () => onReport!({ id: s.entry!.id, content: s.entry!.content })
                : undefined
            }
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
  onStarClick,
  onReportClick,
}: {
  slot: StarSlot;
  variant: "filled" | "mine" | "empty";
  text: string;
  timeLabel: string | null;
  risingNow: boolean;
  isHover: boolean;
  onHover: (on: boolean) => void;
  onStarClick: () => void;
  onReportClick?: () => void;
}) {
  const x = `${slot.x}%`;
  const y = `${slot.y}%`;
  const isEmpty = variant === "empty";

  return (
    <div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
      style={{ left: x, top: y }}
    >
      {timeLabel && (
        <span className="mono text-[10px] tracking-[0.2em] text-star-soft/80 mb-1">
          {timeLabel}
        </span>
      )}

      <button
        type="button"
        onClick={onStarClick}
        disabled={!isEmpty}
        aria-label={
          isEmpty
            ? "빈 자리 — 한 줄 남기기"
            : variant === "mine"
              ? "내가 남긴 별"
              : "다녀간 별"
        }
        className={`focus:outline-none ${isEmpty ? "cursor-pointer" : "cursor-default"}`}
      >
        <Star variant={variant} size={isEmpty ? 28 : 34} animateRise={risingNow} />
      </button>

      <span
        className={`mt-2 text-center font-serif leading-snug px-2 ${
          isEmpty
            ? "text-ink-faint/70 italic"
            : variant === "mine"
              ? "text-[color:var(--star-mine)]"
              : "text-ink-muted"
        }`}
        style={{
          fontSize: isEmpty ? "0.78rem" : "0.82rem",
          maxWidth: 180,
        }}
      >
        {text}
      </span>

      {/* 신고 버튼: 호버 또는 포커스 시에만 표시 */}
      {onReportClick && (
        <button
          type="button"
          onClick={onReportClick}
          className={`mono text-[10px] tracking-[0.2em] mt-1.5 px-2 py-1 rounded-full border border-white/15 text-ink-faint hover:text-star hover:border-star/40 transition-opacity ${
            isHover ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-label="이 한 줄 신고하기"
        >
          신고
        </button>
      )}

      {/* 빈 자리 호버 힌트 */}
      {isEmpty && isHover && (
        <span className="mono text-[9px] tracking-widest text-ink-faint mt-1">
          click — 한 줄 남기기
        </span>
      )}

      {/* 내 별 표시 */}
      {variant === "mine" && isHover && (
        <span className="mono text-[9px] tracking-widest text-[color:var(--star-mine)]/70 mt-1">
          내 별
        </span>
      )}
    </div>
  );
}
