"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DayBundle } from "@/lib/types";
import { DayBoardSection } from "./DayBoardSection";
import { fetchMoreDays } from "@/lib/actions/archive";

type Props = {
  initial: DayBundle[];
};

export function ArchiveStream({ initial }: Props) {
  const [items, setItems] = useState<DayBundle[]>(initial);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    const last = items.at(-1);
    if (!last) return;
    setLoading(true);
    try {
      const more = await fetchMoreDays({ beforeDayNumber: last.day.day_number, limit: 3 });
      if (!more.length) {
        setDone(true);
      } else {
        setItems((prev) => [...prev, ...more]);
      }
    } finally {
      setLoading(false);
    }
  }, [items, loading, done]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <div className="w-full">
      {items.map((b) => (
        <DayBoardSection key={b.day.day_number} bundle={b} />
      ))}
      <div ref={sentinelRef} className="py-12 text-center mono text-[11px] tracking-wider3 text-ink-faint">
        {done ? "— 사이트 시작일까지 모두 보셨어요 —" : loading ? "별 펼치는 중…" : "스크롤로 더 보기"}
      </div>
    </div>
  );
}
