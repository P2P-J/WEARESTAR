import { PageHeader } from "@/components/PageHeader";
import { TitleBlock } from "@/components/TitleBlock";
import { StatsRow } from "@/components/StatsRow";
import { TodayBoard } from "@/components/TodayBoard";
import { Footer } from "@/components/Footer";
import { ComingSoon } from "@/components/ComingSoon";
import { ArchiveStream } from "@/components/ArchiveStream";
import { ScrollDivider } from "@/components/ScrollDivider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { db, isDbConfigured } from "@/lib/db/client";
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

  // ── 진단: 환경/연결 문제는 generic 500 대신 화면으로 표시 ──────────
  if (!isDbConfigured()) {
    return (
      <DebugScreen
        title="DATABASE_URL 미설정"
        detail="Vercel 환경변수에 DATABASE_URL 이 비어있어요. Project Settings → Environment Variables 에서 값을 추가하고 Redeploy 해주세요."
      />
    );
  }
  try {
    const sql = db();
    await sql`SELECT 1 AS ping`;
  } catch (e) {
    return (
      <DebugScreen
        title="DB 연결 실패"
        detail={`Neon Postgres 에 접속할 수 없어요. DATABASE_URL 이 올바른지, sslmode=require 가 붙어있는지 확인해주세요.\n\n${(e as Error).message ?? String(e)}`}
      />
    );
  }

  // ── 실제 페이지 렌더 ─────────────────────────────────────────────
  let bundle;
  let archive;
  try {
    bundle = await getDayBundleByDate(date);
    const todayDayNumber = bundle.day.day_number;
    archive =
      todayDayNumber > 1 ? await getRecentDayBundles(3, todayDayNumber) : [];
  } catch (e) {
    console.error("[Home] data fetch failed:", e);
    return (
      <DebugScreen
        title="페이지 데이터 로드 실패"
        detail={`오늘 일기장을 불러올 수 없어요.\n\n${(e as Error).message ?? String(e)}`}
      />
    );
  }

  const todayDayNumber = bundle.day.day_number;
  const totalLines = bundle.slots.filter((s) => s.entry && !s.entry.is_deleted).length;

  return (
    <div className="min-h-svh flex flex-col">
      <PageHeader
        dayNumber={todayDayNumber}
        dateKst={bundle.day.date_kst}
        showCountdown
      />
      <main className="flex-1 flex flex-col">
        <section className="min-h-[90svh] flex flex-col">
          <TitleBlock />
          <StatsRow bundle={bundle} />
          <div className="flex-1 mt-6 md:mt-8">
            <TodayBoard bundle={bundle} />
          </div>
        </section>
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

function DebugScreen({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center">
      <div className="mono text-[11px] tracking-[0.25em] text-star/70 mb-3">
        DIAGNOSTICS
      </div>
      <h1 className="font-serif text-2xl md:text-3xl text-ink">{title}</h1>
      <pre className="mt-6 max-w-2xl text-left whitespace-pre-wrap break-words text-[12px] mono text-ink-muted bg-night-900/60 border border-white/10 rounded-lg p-4">
        {detail}
      </pre>
      <p className="mt-6 text-[12px] text-ink-faint">
        문제 해결 후 Vercel <span className="mono">Redeploy</span> 하시면 정상 페이지로 돌아옵니다.
      </p>
    </div>
  );
}
