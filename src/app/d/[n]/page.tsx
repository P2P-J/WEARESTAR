import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { TitleBlock } from "@/components/TitleBlock";
import { StatsRow } from "@/components/StatsRow";
import { ReadOnlyBoard } from "@/components/ReadOnlyBoard";
import { Footer } from "@/components/Footer";
import { getDayBundleByNumber } from "@/lib/data/day-bundle";
import { todayKstDate, dayNumberFromDate, launchDate } from "@/lib/day/time";

export const dynamic = "force-dynamic";

type Params = { n: string };

export default async function DayPage({ params }: { params: Promise<Params> }) {
  const { n } = await params;
  const dayNumber = parseInt(n, 10);
  if (!Number.isFinite(dayNumber) || dayNumber < 1) notFound();

  const today = dayNumberFromDate(todayKstDate(), launchDate());
  if (dayNumber > today) notFound();

  const bundle = await getDayBundleByNumber(dayNumber);
  const totalLines = bundle.slots.filter((s) => s.entry && !s.entry.is_deleted).length;

  const prevN = dayNumber > 1 ? dayNumber - 1 : null;
  const nextN = dayNumber < today ? dayNumber + 1 : null;

  return (
    <div className="min-h-svh flex flex-col">
      <PageHeader
        dayNumber={bundle.day.day_number}
        dateKst={bundle.day.date_kst}
        label="ARCHIVED PAGE"
      />
      <main className="flex-1 flex flex-col">
        <TitleBlock subtitle={false} />
        <StatsRow bundle={bundle} />
        <div className="flex-1 mt-6 md:mt-8">
          <ReadOnlyBoard bundle={bundle} />
        </div>

        <nav className="flex items-center justify-between px-6 md:px-10 py-6">
          {prevN ? (
            <Link
              href={`/d/${prevN}`}
              className="mono text-[12px] tracking-wider2 text-ink-faint hover:text-star transition"
            >
              ← D + {prevN}
            </Link>
          ) : <span />}
          <Link
            href="/archive"
            className="mono text-[11px] tracking-wider2 text-ink-faint hover:text-star transition"
          >
            ARCHIVE
          </Link>
          {nextN ? (
            <Link
              href={`/d/${nextN}`}
              className="mono text-[12px] tracking-wider2 text-ink-faint hover:text-star transition"
            >
              D + {nextN} →
            </Link>
          ) : (
            <Link
              href="/"
              className="mono text-[12px] tracking-wider2 text-ink-faint hover:text-star transition"
            >
              TODAY →
            </Link>
          )}
        </nav>
      </main>
      <Footer totalLines={totalLines} />
    </div>
  );
}
