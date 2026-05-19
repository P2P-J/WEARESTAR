"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminEntry } from "@/app/admin/page";
import { adminSetEntryFlags } from "@/lib/actions/admin";
import { formatHHMM } from "@/lib/day/time";

export function AdminPanel({ rows }: { rows: AdminEntry[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  async function act(id: number, patch: Parameters<typeof adminSetEntryFlags>[0]) {
    setBusyId(id);
    try {
      await adminSetEntryFlags(patch);
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="font-serif text-ink-muted">
        신고된 글이 없어요. 깨끗한 밤하늘입니다.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li
          key={r.id}
          className="border border-white/10 rounded-lg p-4 md:p-5 bg-night-900/60"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="mono text-[11px] tracking-wider2 text-ink-faint">
              D + {r.day_number} · {r.date_kst} · slot {r.slot_number} ·{" "}
              {formatHHMM(r.created_at)}
            </div>
            <div className="flex gap-2 mono text-[10px] tracking-wider2">
              <span className="px-2 py-0.5 rounded bg-star/10 text-star">
                신고 {r.report_count}
              </span>
              {r.is_hidden && (
                <span className="px-2 py-0.5 rounded bg-white/10 text-ink-muted">
                  HIDDEN
                </span>
              )}
              {r.is_deleted && (
                <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-200">
                  DELETED
                </span>
              )}
            </div>
          </div>
          <p
            className={`font-serif text-[15px] ${
              r.is_deleted ? "line-through text-ink-faint" : "text-ink"
            }`}
          >
            {r.content}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!r.is_hidden ? (
              <Btn
                onClick={() => act(r.id, { entryId: r.id, isHidden: true })}
                disabled={busyId === r.id}
              >
                가리기
              </Btn>
            ) : (
              <Btn
                onClick={() => act(r.id, { entryId: r.id, isHidden: false })}
                disabled={busyId === r.id}
              >
                복구
              </Btn>
            )}
            {!r.is_deleted ? (
              <Btn
                variant="danger"
                onClick={() => act(r.id, { entryId: r.id, isDeleted: true })}
                disabled={busyId === r.id}
              >
                삭제
              </Btn>
            ) : (
              <Btn
                onClick={() => act(r.id, { entryId: r.id, isDeleted: false })}
                disabled={busyId === r.id}
              >
                삭제 취소
              </Btn>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Btn({
  children,
  variant,
  ...rest
}: {
  children: React.ReactNode;
  variant?: "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls =
    variant === "danger"
      ? "border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
      : "border-star/40 bg-star/10 text-star hover:bg-star/20";
  return (
    <button
      {...rest}
      className={`mono text-[11px] tracking-wider2 px-4 py-2 rounded border ${cls} disabled:opacity-40 transition`}
    >
      {children}
    </button>
  );
}
