"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DayBundle } from "@/lib/types";
import { Constellation } from "./Constellation";
import { WriteModal } from "./WriteModal";
import { ReportPopover } from "./ReportPopover";
import { getClientFingerprint } from "@/lib/fingerprint/client";
import { writeEntry } from "@/lib/actions/write";
import { findMySlot } from "@/lib/actions/me";

type Props = {
  bundle: DayBundle;
};

export function TodayBoard({ bundle }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fp, setFp] = useState<string | null>(null);
  const [mySlot, setMySlot] = useState<number | null>(null);
  const [risingSlot, setRisingSlot] = useState<number | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: number; content: string } | null>(null);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);

  const litCount = useMemo(
    () => bundle.slots.filter((s) => s.entry && !s.entry.is_deleted).length,
    [bundle]
  );
  const isFull = litCount >= 10;

  // 1) fingerprint 만들고 my slot 조회
  useEffect(() => {
    let alive = true;
    (async () => {
      const f = await getClientFingerprint();
      if (!alive) return;
      setFp(f);
      if (bundle.day.id > 0) {
        const r = await findMySlot({ clientFp: f, dayId: bundle.day.id });
        if (alive && r.slot) setMySlot(r.slot);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bundle.day.id]);

  const canWrite = !isFull && mySlot === null;

  function openWrite() {
    if (!canWrite) {
      setBlockMessage(
        mySlot !== null
          ? "오늘은 이미 한 줄을 남기셨어요. 내일 0시에 새 일기장이 열려요."
          : "오늘의 일기장은 모두 채워졌어요. 내일 0시에 새 일기장이 열려요."
      );
    } else {
      setBlockMessage(null);
    }
    setWriteOpen(true);
  }

  async function submitWrite(content: string) {
    if (!fp) throw new Error("브라우저 식별 정보가 준비되지 않았어요.");
    const r = await writeEntry({ content, clientFp: fp });
    if (!r.ok) {
      throw new Error(r.message);
    }
    setMySlot(r.slot);
    setRisingSlot(r.slot);
    setWriteOpen(false);
    // 서버 데이터 새로고침
    startTransition(() => router.refresh());
    setTimeout(() => setRisingSlot(null), 1200);
  }

  return (
    <>
      <Constellation
        bundle={bundle}
        mySlot={mySlot}
        risingSlot={risingSlot}
        onClaimSlot={openWrite}
        onEntryAction={(e) => setReportTarget(e)}
      />

      <div className="text-center mt-2 mb-4">
        {canWrite ? (
          <button
            onClick={openWrite}
            disabled={pending}
            className="mono text-[12px] tracking-wider3 px-6 py-3 rounded-full border border-star/40 bg-star/10 text-star hover:bg-star/20 transition"
          >
            한 줄 남기기
          </button>
        ) : mySlot !== null ? (
          <p className="font-serif text-[14px] text-ink-muted">
            오늘은 이미 한 줄을 남기셨어요. 내일 0시에 새 일기장이 열려요.
          </p>
        ) : (
          <p className="font-serif text-[14px] text-ink-muted">
            오늘의 일기장은 모두 채워졌어요. 내일 0시에 새 일기장이 열려요.
          </p>
        )}
      </div>

      <WriteModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onSubmit={submitWrite}
        blockMessage={blockMessage ?? undefined}
      />

      <ReportPopover
        open={!!reportTarget}
        entry={reportTarget}
        dayId={bundle.day.id}
        clientFp={fp}
        onClose={() => setReportTarget(null)}
        onReported={() => startTransition(() => router.refresh())}
      />
    </>
  );
}
