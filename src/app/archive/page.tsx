import Link from "next/link";
import { ArchiveStream } from "@/components/ArchiveStream";
import { getRecentDayBundles } from "@/lib/data/day-bundle";
import { todayKstDate, dayNumberFromDate, launchDate } from "@/lib/day/time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ArchivePage() {
  const dayNumber = dayNumberFromDate(todayKstDate(), launchDate());
  const initial = dayNumber >= 1 ? await getRecentDayBundles(3) : [];

  return (
    <div className="min-h-svh flex flex-col">
      <header className="flex items-start justify-between px-6 pt-6 md:px-10 md:pt-10">
        <div>
          <div className="mono text-[11px] tracking-wider3 text-star/70">
            <span className="font-serif text-ink-muted text-[12px] mr-2">아카이브</span>· ARCHIVE
          </div>
          <div className="mono text-[11px] tracking-wider2 text-ink-faint mt-1">
            지나간 별들을 한 권의 두루마리처럼 펼쳐봅니다.
          </div>
        </div>
        <Link
          href="/"
          className="mono text-[11px] tracking-wider2 text-ink-faint hover:text-star transition"
        >
          ← BACK TO TODAY
        </Link>
      </header>
      {initial.length === 0 ? (
        <p className="px-6 md:px-10 py-20 text-center font-serif text-ink-muted">
          아직 열린 일기장이 없어요. 첫 일기장은 자정에 열립니다.
        </p>
      ) : (
        <ArchiveStream initial={initial} />
      )}
    </div>
  );
}
