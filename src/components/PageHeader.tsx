import Link from "next/link";
import { formatKstHeader } from "@/lib/day/time";
import { Countdown } from "./Countdown";

type Props = {
  dayNumber: number;
  dateKst: string;
  /** 카운트다운 보이기 (오늘 페이지에서만 true) */
  showCountdown?: boolean;
  /** "TODAY'S PAGE" 또는 "ARCHIVED" 등 라벨 */
  label?: string;
};

export function PageHeader({ dayNumber, dateKst, showCountdown, label = "TODAY'S PAGE" }: Props) {
  return (
    <header className="flex items-start justify-between px-6 pt-6 pb-2 md:px-10 md:pt-10">
      <div>
        <div className="mono text-[11px] tracking-wider3 text-star/70">
          <span className="font-serif text-ink-muted text-[12px] mr-2">오늘의 일기장</span>
          <span>· {label}</span>
        </div>
        <div className="mono text-[11px] tracking-wider2 text-ink-faint mt-1">
          {formatKstHeader(dateKst)}
        </div>
      </div>
      <div className="text-right">
        <div className="mono text-[14px] tracking-wider2 text-ink">
          D <span className="text-star">+ {dayNumber}</span>
        </div>
        {showCountdown && (
          <div className="mono text-[11px] tracking-wider2 text-ink-faint mt-1">
            NEXT PAGE OPENS IN <Countdown />
          </div>
        )}
        {!showCountdown && (
          <Link
            href="/"
            className="mono text-[11px] tracking-wider2 text-ink-faint mt-1 hover:text-star transition"
          >
            ← BACK TO TODAY
          </Link>
        )}
      </div>
    </header>
  );
}
