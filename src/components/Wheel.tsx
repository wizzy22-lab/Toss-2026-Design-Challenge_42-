import { useEffect, useRef } from "react";

/** 스크롤 스냅 휠 피커 (제네릭) — 중앙 슬롯 값 선택. 소요시간·시간 등 공용. */
const ITEM = 40; // 한 칸 높이(px)

export type WheelItem = { value: number; label: string };

export default function Wheel({
  items,
  value,
  onChange,
  width = "120px",
}: {
  items: WheelItem[];
  value: number;
  onChange: (v: number) => void;
  width?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // 마운트 시 현재 값 위치로 스크롤
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(
      0,
      items.findIndex((i) => i.value === value),
    );
    el.scrollTop = idx * ITEM;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.min(
      items.length - 1,
      Math.max(0, Math.round(el.scrollTop / ITEM)),
    );
    if (items[idx].value !== value) onChange(items[idx].value);
  };

  return (
    <div className="relative" style={{ width }}>
      {/* 중앙 선택 슬롯 */}
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
        {items.map((it) => (
          <button
            key={it.value}
            type="button"
            onClick={() => {
              const el = ref.current;
              if (el)
                el.scrollTo({
                  top: items.findIndex((i) => i.value === it.value) * ITEM,
                  behavior: "smooth",
                });
              onChange(it.value);
            }}
            className={`flex h-10 w-full snap-center items-center justify-center whitespace-nowrap text-[16px] font-bold transition ${
              it.value === value ? "text-brand-700" : "text-ink-faint"
            }`}
          >
            {it.label}
          </button>
        ))}
        <div style={{ height: ITEM }} aria-hidden />
      </div>
    </div>
  );
}
