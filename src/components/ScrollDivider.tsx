export function ScrollDivider() {
  return (
    <div className="flex flex-col items-center py-16 md:py-20 opacity-80">
      <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/25 to-transparent" />
      <div className="mono text-[10px] tracking-[0.3em] text-ink-faint mt-4">
        지난 별들 · SCROLL FOR EARLIER NIGHTS
      </div>
      <div className="text-ink-faint mt-3 text-lg animate-pulse">↓</div>
    </div>
  );
}
