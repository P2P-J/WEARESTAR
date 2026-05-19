"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { reportEntry } from "@/lib/actions/report";

type Props = {
  open: boolean;
  entry: { id: number; content: string } | null;
  dayId: number;
  clientFp: string | null;
  onClose: () => void;
  onReported: () => void;
};

export function ReportPopover({ open, entry, dayId, clientFp, onClose, onReported }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open && entry && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute inset-0 bg-night-950/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-night-900/90 p-6"
          >
            <div className="mono text-[11px] tracking-wider3 text-star/70">REPORT</div>
            <p className="font-serif text-[15px] text-ink mt-3 leading-relaxed">
              이 한 줄이 부적절하다고 신고하시겠어요?
            </p>
            <blockquote className="font-serif text-[13px] text-ink-muted bg-night-800/60 rounded p-3 mt-3 border-l-2 border-white/15">
              {entry.content}
            </blockquote>
            <p className="font-serif text-[12px] text-ink-faint mt-3 leading-relaxed">
              3회 신고가 누적되면 자동으로 가려져요. 한 사람이 같은 글을 두 번 신고할 수는 없어요.
            </p>
            {msg && (
              <div className="font-serif text-[13px] text-star mt-3">{msg}</div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="mono text-[12px] tracking-wider2 px-4 py-2 text-ink-faint hover:text-ink transition"
              >
                CANCEL
              </button>
              <button
                disabled={busy || !clientFp}
                onClick={async () => {
                  if (!clientFp) return;
                  setBusy(true);
                  setMsg(null);
                  const r = await reportEntry({
                    entryId: entry.id,
                    dayId,
                    clientFp,
                  });
                  if (r.ok) {
                    setMsg(
                      r.isHidden
                        ? "신고 접수 — 이 글은 가려졌어요."
                        : `신고 접수 — 현재 ${r.reportCount}회 누적.`
                    );
                    onReported();
                    setTimeout(onClose, 1200);
                  } else {
                    setMsg(r.message);
                  }
                  setBusy(false);
                }}
                className="mono text-[12px] tracking-wider2 px-5 py-2 rounded border border-star/40 bg-star/10 text-star hover:bg-star/20 disabled:opacity-40 transition"
              >
                {busy ? "..." : "REPORT"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
