import { PageHeader } from "@/components/PageHeader";
import { TitleBlock } from "@/components/TitleBlock";
import { StatsRow } from "@/components/StatsRow";
import { TodayBoard } from "@/components/TodayBoard";
import { Footer } from "@/components/Footer";
import { ComingSoon } from "@/components/ComingSoon";
import { ArchiveStream } from "@/components/ArchiveStream";
import { ScrollDivider } from "@/components/ScrollDivider";
import { ScrollToTop } from "@/components/ScrollToTop";
import {
  getDayBundleByDate,
  getRecentDayBundles,
} from "@/lib/data/day-bundle";
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
  const todayDayNumber = bundle.day.day_number;
  const totalLines = bundle.slots.filter((s) => s.entry && !s.entry.is_deleted).length;

  // 어제 이전 일기장을 함께 미리 로드 (스크롤 내려가면 자연스럽게 이어짐)
  const archive =
    todayDayNumber > 1 ? await getRecentDayBundles(3, todayDayNumber) : [];

  return (
    <div className="min-h-svh flex flex-col">
      <PageHeader
        dayNumber={todayDayNumber}
        dateKst={bundle.day.date_kst}
        showCountdown
      />
      <main className="flex-1 flex flex-col">
        {/* 오늘 일기장 — 인터랙티브 (작성/신고) */}
        <section className="min-h-[90svh] flex flex-col">
          <TitleBlock />
          <StatsRow bundle={bundle} />
          <div className="flex-1 mt-6 md:mt-8">
            <TodayBoard bundle={bundle} />
          </div>
        </section>

        {/* 어제부터 과거 일기장 — 스크롤로 무한 펼쳐짐 (읽기 전용) */}
        {archive.length > 0 && (
          <>
            <ScrollDivider />
            <ArchiveStream initial={archive} />
          </>
        )}
      </main>
      <Footer
        archiveLabel={`ARCHIVE · 001 – ${String(todayDayNumber).padStart(3, "0")}`}
        totalLines={totalLines}
      />
      <ScrollToTop />
    </div>
  );
}
