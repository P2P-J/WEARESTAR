"use client";

import { useEffect, useState } from "react";
import { TitleBlock } from "./TitleBlock";

type Props = {
  launchDateKst: string; // 'YYYY-MM-DD'
};

function msUntil(targetKstDate: string, now: Date): number {
  const target = new Date(`${targetKstDate}T00:00:00+09:00`).getTime();
  return target - now.getTime();
}

function fmtCountdown(ms: number): { d: string; h: string; m: string; s: string } {
  if (ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    d: String(d).padStart(2, "0"),
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

export function ComingSoon({ launchDateKst }: Props) {
  const [parts, setParts] = useState(() => fmtCountdown(0));
  useEffect(() => {
    const tick = () => setParts(fmtCountdown(msUntil(launchDateKst, new Date())));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [launchDateKst]);

  const [y, mo, da] = launchDateKst.split("-");

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center">
      <div className="mono text-[11px] tracking-[0.25em] text-star/70 mb-2">
        OPENING SOON
      </div>
      <TitleBlock subtitle={false} />
      <p className="font-serif text-[15px] md:text-[17px] mt-6 text-ink-muted leading-relaxed max-w-xl">
        매일 자정, 단 열 사람만 한 줄을 남기는 익명 일기장.<br />
        첫 일기장은 <span className="text-star">{y}·{mo}·{da}</span> 자정 (KST) 에 열립니다.
      </p>

      <div className="mt-10 flex items-baseline gap-4 md:gap-7 mono text-ink">
        <CountdownUnit value={parts.d} label="DAYS" />
        <span className="text-ink-faint text-3xl md:text-5xl">:</span>
        <CountdownUnit value={parts.h} label="HOURS" />
        <span className="text-ink-faint text-3xl md:text-5xl">:</span>
        <CountdownUnit value={parts.m} label="MINS" />
        <span className="text-ink-faint text-3xl md:text-5xl">:</span>
        <CountdownUnit value={parts.s} label="SECS" />
      </div>

      <p className="font-serif text-[13px] text-ink-faint mt-12 leading-relaxed max-w-md">
        이름도 없이, 시각만 남기고 — 누군가가 그날 거기 있었다는 흔적.<br />
        그게 전부인 사이트.
      </p>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl md:text-6xl font-light tabular-nums">{value}</div>
      <div className="text-[10px] tracking-[0.25em] text-ink-faint mt-2">{label}</div>
    </div>
  );
}
