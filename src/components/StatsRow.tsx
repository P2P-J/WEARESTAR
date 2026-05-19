import { DayBundle } from "@/lib/types";
import { formatHHMM } from "@/lib/day/time";

export function StatsRow({ bundle }: { bundle: DayBundle }) {
  const entries = bundle.slots.filter((s) => s.entry && !s.entry.is_deleted);
  const lit = entries.length;
  const left = 10 - lit;
  const lastEntry = entries
    .map((s) => s.entry!.created_at)
    .sort()
    .at(-1);

  return (
    <div className="mt-6 flex items-center justify-center gap-10 md:gap-20 text-center">
      <Stat label="STARS LIT" value={`${String(lit).padStart(2, "0")} / 10`} />
      <Divider />
      <Stat
        label="LAST ENTRY"
        value={lastEntry ? formatHHMM(lastEntry) : "--:--"}
      />
      <Divider />
      <Stat
        label="SLOTS LEFT"
        value={String(left).padStart(2, "0")}
        accent={left > 0}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={`mono font-light text-[28px] md:text-[34px] tabular-nums ${
          accent ? "text-star" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="mono text-[10px] tracking-wider3 text-ink-faint mt-1">{label}</div>
    </div>
  );
}

function Divider() {
  return <span className="block w-[1px] h-8 bg-white/12" />;
}
