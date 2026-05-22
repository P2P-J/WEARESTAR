"use client";

import { useEffect, useState } from "react";

/** 첫 화면 80% 이상 스크롤하면 우측 하단에 등장하는 '맨 위로' 버튼 */
export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="맨 위로 (오늘 일기장으로)"
      className={`fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full bg-night-900/80 border border-white/15 text-ink-muted hover:text-star hover:border-star/40 backdrop-blur transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      ↑
    </button>
  );
}
