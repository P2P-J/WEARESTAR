import { DayBundle } from "@/lib/types";
import { formatKstHeader } from "@/lib/day/time";
import { ReadOnlyBoard } from "./ReadOnlyBoard";
import { StatsRow } from "./StatsRow";
import Link from "next/link";

/** 아카이브 스트림에서 1개의 날짜 카드를 그리는 섹션 */
export function DayBoardSection({ bundle }: { bundle: DayBundle }) {
  return (
    <section className="min-h-[90svh] flex flex-col border-t border-white/5 py-12 md:py-20">
      <div className="flex items-baseline justify-between px-6 md:px-10">
        <div>
          <div className="mono text-[11px] tracking-wider3 text-ink-faint">
            ARCHIVED PAGE
          </div>
          <div className="mono text-[12px] tracking-wider2 text-ink mt-1">
            {formatKstHeader(bundle.day.date_kst)}
          </div>
        </div>
        <Link
          href={`/d/${bundle.day.day_number}`}
          className="mono text-[12px] tracking-wider2 text-ink-faint hover:text-star transition"
        >
          D + {bundle.day.day_number} →
        </Link>
      </div>

      <div className="mt-4">
        <StatsRow bundle={bundle} />
      </div>

      <div className="flex-1 mt-6">
        <ReadOnlyBoard bundle={bundle} />
      </div>
    </section>
  );
}
