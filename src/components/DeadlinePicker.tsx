import { useEffect, useMemo, useState } from "react";
import { Icon } from "../ui";
import Wheel, { type WheelItem } from "./Wheel";
import {
  addDays,
  atMidnight,
  firstOfMonth,
  fmtDay,
  fmtTime,
  mondayOfWeek,
} from "../lib/date";

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];
// 30분 슬롯(하루 전체)
const TIME_ITEMS: WheelItem[] = Array.from({ length: 48 }, (_, i) => ({
  value: i * 30,
  label: fmtTime(i * 30),
}));

export default function DeadlinePicker({
  onChange,
}: {
  onChange: (label: string) => void;
}) {
  const today = useMemo(() => atMidnight(new Date()), []);
  const [date, setDate] = useState(() => addDays(today, 2)); // 기본 = 가까운 날
  const [min, setMin] = useState(18 * 60); // 기본 18:00
  const [open, setOpen] = useState<"date" | "time" | null>(null);
  const [viewMonth, setViewMonth] = useState(() => firstOfMonth(date));

  // 값 바뀔 때 상위로 조합 라벨 반영 (기본값 있어 항상 채워짐)
  useEffect(() => {
    onChange(`${fmtDay(date)} ${fmtTime(min)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, min]);

  const gridStart = useMemo(() => mondayOfWeek(viewMonth), [viewMonth]);
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );
  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;
  const curMonthStart = useMemo(() => firstOfMonth(today), [today]);
  const canPrev = viewMonth.getTime() > curMonthStart.getTime();
  const stepMonth = (n: number) =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  const fieldCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-[13px] font-bold transition ${
      active
        ? "border-brand-400 text-brand-600"
        : "border-edge text-ink hover:bg-sand-50"
    }`;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setOpen((o) => (o === "date" ? null : "date"))}
          className={fieldCls(open === "date")}
        >
          <Icon name="calendar-check" size={14} />
          {fmtDay(date)}
          <Icon
            name="chevron-down"
            size={14}
            className={open === "date" ? "rotate-180" : ""}
          />
        </button>
        <button
          onClick={() => setOpen((o) => (o === "time" ? null : "time"))}
          className={fieldCls(open === "time")}
        >
          {fmtTime(min)}
          <Icon
            name="chevron-down"
            size={14}
            className={open === "time" ? "rotate-180" : ""}
          />
        </button>
      </div>

      {/* 마감일 — 미니 월 달력(단일 선택) */}
      {open === "date" && (
        <div className="mt-2 select-none rounded-xl border border-line p-3">
          <div className="mb-2 flex items-center justify-center gap-1">
            <button
              onClick={() => stepMonth(-1)}
              disabled={!canPrev}
              aria-label="이전 달"
              className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft transition hover:bg-sand-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Icon name="chevron-right" size={16} className="rotate-180" />
            </button>
            <span className="min-w-[92px] text-center text-[16px] font-bold text-ink">
              {monthLabel}
            </span>
            <button
              onClick={() => stepMonth(1)}
              aria-label="다음 달"
              className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft transition hover:bg-sand-100"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEK.map((w, i) => (
              <div
                key={w}
                className={`text-center text-[13px] font-bold ${
                  i >= 5 ? "text-ink-disabled" : "text-ink-faint"
                }`}
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const t = d.getTime();
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const past = t < today.getTime();
              const disabled = past || !inMonth; // 마감은 주말 허용, 과거만 비활성
              const isToday = t === today.getTime();
              const selected = t === date.getTime();
              let cls = "text-ink-soft hover:bg-sand-100";
              if (disabled) cls = "cursor-not-allowed text-ink-disabled";
              else if (selected) cls = "bg-brand-600 text-white";
              return (
                <button
                  key={t}
                  onClick={() => {
                    if (disabled) return;
                    setDate(d);
                    setOpen(null);
                  }}
                  disabled={disabled}
                  className={`relative h-8 rounded-lg text-[13px] font-semibold transition ${cls} ${
                    isToday && !selected ? "ring-1 ring-inset ring-brand-400" : ""
                  }`}
                >
                  {d.getDate()}
                  {isToday && (
                    <span className="pointer-events-none absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 시간 — 30분 휠 */}
      {open === "time" && (
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-line p-3">
          <Wheel items={TIME_ITEMS} value={min} onChange={setMin} />
          <p className="text-[13px] text-ink-faint">
            위아래로 굴려 30분 단위로 골라요.
            <br />
            현재 <span className="font-bold text-brand-600">{fmtTime(min)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
