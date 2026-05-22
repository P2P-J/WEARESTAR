"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center">
      <div className="mono text-[11px] tracking-[0.25em] text-star/70 mb-3">
        SOMETHING WENT QUIET
      </div>
      <h1 className="font-serif text-3xl md:text-4xl text-ink">
        잠깐 별이 꺼졌어요
      </h1>
      <p className="font-serif text-[14px] text-ink-muted mt-4 max-w-md leading-relaxed">
        서버에 일시적인 문제가 있었습니다.
        {error.digest && (
          <span className="block mt-2 mono text-[11px] text-ink-faint">
            ref: {error.digest}
          </span>
        )}
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="mono text-[12px] tracking-wider2 px-5 py-2.5 rounded border border-star/40 bg-star/10 text-star hover:bg-star/20 transition"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="mono text-[12px] tracking-wider2 px-5 py-2.5 rounded border border-white/15 text-ink-muted hover:text-ink hover:border-white/30 transition"
        >
          처음으로
        </Link>
      </div>
    </div>
  );
}
