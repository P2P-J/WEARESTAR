"use client";

import { useEffect, useState } from "react";
import { msUntilNextKstMidnight } from "@/lib/day/time";

function fmt(ms: number): string {
  if (ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function Countdown() {
  const [text, setText] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () => setText(fmt(msUntilNextKstMidnight()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="mono tabular-nums">{text}</span>;
}
