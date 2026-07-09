import { useEffect, useRef } from "react";

/** 소요시간 휠(스크롤) 피커 — 정시 단위(1~8시간). 스크롤 스냅으로 중앙 값 선택. */
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8];
const ITEM = 40; // 한 칸 높이(px)

export default function DurationWheel({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (h: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // 마운트 시 현재 값 위치로 스크롤(없으면 첫 칸)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = value ? Math.max(0, HOURS.indexOf(value)) : 0;
    el.scrollTop = idx * ITEM;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.min(
      HOURS.length - 1,
      Math.max(0, Math.round(el.scrollTop / ITEM)),
    );
    if (HOURS[idx] !== value) onChange(HOURS[idx]);
  };

  return (
    <div className="relative w-[120px]">
      {/* 중앙 선택 슬롯 표시 */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-[10px] bg-brand-50 ring-1 ring-brand-100" />
      {/* 위/아래 페이드 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white to-transparent" />
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar relative h-[120px] snap-y snap-mandatory overflow-y-auto"
      >
        <div style={{ height: ITEM }} aria-hidden />
        {HOURS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => {
              const el = ref.current;
              if (el) el.scrollTo({ top: HOURS.indexOf(h) * ITEM, behavior: "smooth" });
              onChange(h);
            }}
            className={`flex h-10 w-full snap-center items-center justify-center text-[16px] font-bold transition ${
              h === value ? "text-brand-700" : "text-ink-faint"
            }`}
          >
            {h}시간
          </button>
        ))}
        <div style={{ height: ITEM }} aria-hidden />
      </div>
    </div>
  );
}
