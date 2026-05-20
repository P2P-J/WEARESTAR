"use client";

import { DayBundle } from "@/lib/types";
import { Constellation } from "./Constellation";

/** 아카이브/특정 날짜 페이지에서 사용. 작성/신고 비활성. */
export function ReadOnlyBoard({ bundle }: { bundle: DayBundle }) {
  return <Constellation bundle={bundle} mySlot={null} />;
}
