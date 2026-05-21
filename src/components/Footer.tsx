import Link from "next/link";

type Props = {
  archiveLabel?: string;
  totalLines?: number;
  /** 어제로 가는 직접 링크 (홈에서 사용) */
  prevDayNumber?: number | null;
};

export function Footer({ archiveLabel, totalLines, prevDayNumber }: Props) {
  return (
    <footer className="px-6 md:px-10 py-6 flex flex-wrap items-center justify-between gap-y-3">
      <div className="flex items-center gap-5 text-[11px] text-ink-faint">
        <Legend color="var(--star)" label="채워진 칸" />
        <Legend color="var(--star-mine)" label="내가 남긴 자리" />
        <Legend color="transparent" outline label="빈 자리" />
      </div>
      <div className="mono text-[11px] tracking-wider2 flex items-center gap-4">
        {prevDayNumber ? (
          <Link
            href={`/d/${prevDayNumber}`}
            className="text-ink-faint hover:text-star transition"
          >
            ← 어제 (D + {prevDayNumber})
          </Link>
        ) : null}
        <Link
          href="/archive"
          className="text-ink-faint hover:text-star underline-offset-4 hover:underline transition"
        >
          {archiveLabel ? archiveLabel : "ARCHIVE"}
          {typeof totalLines === "number" && (
            <span className="ml-3">· {totalLines} LINES</span>
          )}
        </Link>
      </div>
    </footer>
  );
}

function Legend({
  color,
  label,
  outline,
}: {
  color: string;
  label: string;
  outline?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 font-serif">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{
          background: outline ? "transparent" : color,
          border: outline ? "1px solid rgba(255,255,255,0.35)" : "none",
        }}
      />
      <span className="text-ink-muted">{label}</span>
    </span>
  );
}
