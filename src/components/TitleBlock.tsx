export function TitleBlock({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="text-center px-6 mt-8 md:mt-12">
      <div className="mono text-[11px] tracking-wider3 text-star/70">
        AN ANONYMOUS DIARY OF TEN
      </div>
      <h1 className="font-serif text-5xl md:text-7xl mt-4 text-ink font-normal tracking-tight">
        밤하늘의 <span className="text-star">별</span>
      </h1>
      {subtitle && (
        <div className="font-serif text-[15px] md:text-[17px] mt-6 text-ink-muted leading-relaxed max-w-2xl mx-auto">
          <p>
            매일 자정, 새 일기장이 열린다 ·{" "}
            <em className="not-italic text-star italic">단 열 사람만</em> 한 줄을 남길 수 있다
          </p>
          <p className="mt-1">
            이름도 없이, 시각만 남기고 · 누군가가 오늘 여기 있었다는 흔적
          </p>
        </div>
      )}
      <div className="mt-6 inline-flex items-center gap-2 opacity-50">
        <span className="block w-[1px] h-7 bg-star/40" />
      </div>
    </div>
  );
}
