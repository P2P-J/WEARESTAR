"use client";

import { useState } from "react";
import { DayBundle } from "@/lib/types";
import { Constellation } from "./Constellation";

/** 아카이브/특정 날짜 페이지에서 사용. 클릭 가능하지만 작성/신고 비활성. */
export function ReadOnlyBoard({ bundle }: { bundle: DayBundle }) {
  const [, setHover] = useState<number | null>(null);
  return (
    <Constellation
      bundle={bundle}
      mySlot={null}
      onClaimSlot={undefined}
      onEntryAction={(e) => {
        // 아카이브에서는 신고 비활성. (필요 시 이 자리에서 신고 모달 활성화 가능)
        void e;
        setHover(null);
      }}
    />
  );
}
