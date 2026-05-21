import { PageHeader } from "@/components/PageHeader";
import { TitleBlock } from "@/components/TitleBlock";
import { StatsRow } from "@/components/StatsRow";
import { TodayBoard } from "@/components/TodayBoard";
import { Footer } from "@/components/Footer";
import { ComingSoon } from "@/components/ComingSoon";
import { getDayBundleByDate } from "@/lib/data/day-bundle";
import { todayKstDate, dayNumberFromDate, launchDate } from "@/lib/day/time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const date = todayKstDate();
  const launch = launchDate();
  const dayNumber = dayNumberFromDate(date, launch);

  // 사이트 오픈 전 — 첫 일기장이 열리기 전까지 카운트다운 페이지
  if (dayNumber < 1) {
    return <ComingSoon launchDateKst={launch} />;
  }

  const bundle = await getDayBundleByDate(date);
  const totalLines = bundle.slots.filter((s) => s.entry && !s.entry.is_deleted).length;

  return (
    <div className="min-h-svh flex flex-col">
      <PageHeader
        dayNumber={bundle.day.day_number}
        dateKst={bundle.day.date_kst}
        showCountdown
      />
      <main className="flex-1 flex flex-col">
        <TitleBlock />
        <StatsRow bundle={bundle} />
        <div className="flex-1 mt-6 md:mt-8">
          <TodayBoard bundle={bundle} />
        </div>
      </main>
      <Footer
        archiveLabel={`ARCHIVE · 001 – ${String(bundle.day.day_number).padStart(3, "0")}`}
        totalLines={totalLines}
        prevDayNumber={bundle.day.day_number > 1 ? bundle.day.day_number - 1 : null}
      />
    </div>
  );
}
