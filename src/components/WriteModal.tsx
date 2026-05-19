"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  /** 외부에서 막혔을 때 메시지(예: 이미 작성/날의 끝) */
  blockMessage?: string;
};

const MAX = 150;

export function WriteModal({ open, onClose, onSubmit, blockMessage }: Props) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      setErr(null);
      setVal("");
      setTimeout(() => textareaRef.current?.focus(), 60);
    }
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const remaining = MAX - val.length;
  const disabled = busy || val.trim().length === 0 || val.length > MAX;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute inset-0 bg-night-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="relative z-10 w-full max-w-xl rounded-xl border border-white/10 bg-night-900/85 backdrop-blur p-7 md:p-9 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          >
            <div className="mono text-[11px] tracking-wider3 text-star/80">
              오늘의 한 줄 · TODAY'S LINE
            </div>
            <h3 className="font-serif text-2xl md:text-3xl mt-3 text-ink">
              한 줄을 남기고 갑니다
            </h3>
            <p className="font-serif text-[14px] text-ink-muted mt-2 leading-relaxed">
              이름도, 닉네임도 없이. 150자 안에 오늘 어디쯤 다녀갔는지를 남겨주세요.
            </p>

            {blockMessage ? (
              <div className="mt-6 rounded-md border border-star/30 bg-star/5 px-4 py-3 text-ink-muted text-[14px] font-serif">
                {blockMessage}
              </div>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={val}
                  onChange={(e) => setVal(e.target.value.slice(0, MAX))}
                  placeholder="예) 점심엔 비가 그쳤다. 그게 오늘의 다행."
                  rows={4}
                  className="mt-5 w-full bg-night-800/60 border border-white/10 rounded-md p-3 text-ink placeholder:text-ink-faint/70 font-serif text-[15px] focus:outline-none focus:border-star/50 focus:ring-1 focus:ring-star/30 resize-none"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className={`mono text-[11px] tracking-wider2 ${remaining < 20 ? "text-star" : "text-ink-faint"}`}>
                    {val.length} / {MAX}
                  </span>
                  {err && (
                    <span className="font-serif text-[13px] text-star">{err}</span>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="mono text-[12px] tracking-wider2 px-4 py-2 text-ink-faint hover:text-ink transition"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={async () => {
                      setBusy(true);
                      setErr(null);
                      try {
                        await onSubmit(val.trim());
                      } catch (e: unknown) {
                        setErr(e instanceof Error ? e.message : String(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="mono text-[12px] tracking-wider2 px-5 py-2 rounded border border-star/40 bg-star/10 text-star hover:bg-star/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {busy ? "SENDING…" : "별을 띄우기"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
