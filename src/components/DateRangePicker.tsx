import { useEffect, useMemo, useState } from "react";
import { Icon } from "../ui";
import {
  addDays,
  atMidnight,
  firstOfMonth,
  fmtRange,
  mondayOfWeek,
} from "../lib/date";

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];
type Preset = "next" | "this" | "custom";

/** 기간 칩과 동일한 세그먼트 칩 스타일 */
function segClass(active: boolean) {
  return `rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
    active
      ? "bg-brand-600 text-white shadow-sm"
      : "bg-sand-100 text-ink-soft hover:bg-sand-200"
  }`;
}

export default function DateRangePicker({
  onChange,
}: {
  onChange: (label: string) => void;
}) {
  const today = useMemo(() => atMidnight(new Date()), []);
  const thisMon = useMemo(() => mondayOfWeek(today), [today]);
  const thisFri = useMemo(() => addDays(thisMon, 4), [thisMon]);
  const nextMon = useMemo(() => addDays(thisMon, 7), [thisMon]);
  const nextFri = useMemo(() => addDays(thisMon, 11), [thisMon]);

  const [preset, setPreset] = useState<Preset | null>(null); // 미선택 시작
  const [start, setStart] = useState(nextMon);
  const [end, setEnd] = useState(nextFri);
  const [tab, setTab] = useState<"start" | "end">("start");
  // 달력이 보여주는 달 (기본 = 오늘이 든 달)
  const [viewMonth, setViewMonth] = useState(() => firstOfMonth(today));

  const labelFor = (p: Preset): string => {
    if (p === "next") return `다음 주 · ${fmtRange(nextMon, nextFri)}`;
    if (p === "this") return `이번 주 · ${fmtRange(thisMon, thisFri)}`;
    return `직접 선택 · ${fmtRange(start, end)}`;
  };

  // 선택했을 때만 상위로 라벨 반영 (미선택 시작 → 프리필 없음)
  useEffect(() => {
    if (preset !== null) onChange(labelFor(preset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, start, end]);

  // 해당 월 전체를 정확히 렌더 — 그 달 1일이 든 주의 월요일부터 6주(42칸)
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

  const pick = (d: Date) => {
    if (tab === "start") {
      setStart(d);
      if (d.getTime() > end.getTime()) setEnd(d);
      setTab("end");
    } else {
      if (d.getTime() < start.getTime()) {
        setEnd(start);
        setStart(d);
      } else {
        setEnd(d);
      }
      setTab("start");
    }
  };

  const lo = Math.min(start.getTime(), end.getTime());
  const hi = Math.max(start.getTime(), end.getTime());

  return (
    <div>
      {/* 프리셋 칩 — 시간순 [이번 주] → [다음 주] → [직접 선택], 미선택 시작 */}
      <div className="flex flex-wrap gap-2">
        {(["this", "next", "custom"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={segClass(preset === p)}
          >
            {p === "next" ? "다음 주" : p === "this" ? "이번 주" : "직접 선택"}
          </button>
        ))}
      </div>

      {/* 선택 요약 (프리셋 선택했을 때만) */}
      {preset !== null && preset !== "custom" && (
        <p className="mt-2 text-[13px] text-ink-faint">
          후보 기간{" "}
          <span className="font-semibold text-brand-600">
            {fmtRange(preset === "next" ? nextMon : thisMon, preset === "next" ? nextFri : thisFri)}
          </span>{" "}
          월–금 안에서 시간을 찾아요.
        </p>
      )}

      {/* 직접 선택 — 월 달력 (오늘 표시 · 과거/주말 비활성 · 컴팩트) */}
      {preset === "custom" && (
        <div className="mt-3 select-none rounded-xl border border-line p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-y-1">
            <div className="flex items-center gap-1">
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
            <div className="flex items-center gap-0.5 rounded-lg bg-sand-100 p-0.5">
              <button
                onClick={() => setTab("start")}
                className={`rounded-[10px] px-2.5 py-1 text-[13px] font-bold transition ${
                  tab === "start" ? "bg-white text-brand-600 shadow-sm" : "text-ink-faint"
                }`}
              >
                시작 {start.getMonth() + 1}/{start.getDate()}
              </button>
              <button
                onClick={() => setTab("end")}
                className={`rounded-[10px] px-2.5 py-1 text-[13px] font-bold transition ${
                  tab === "end" ? "bg-white text-brand-600 shadow-sm" : "text-ink-faint"
                }`}
              >
                종료 {end.getMonth() + 1}/{end.getDate()}
              </button>
            </div>
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
              const weekend = d.getDay() === 0 || d.getDay() === 6;
              const disabled = past || weekend || !inMonth;
              const isToday = t === today.getTime();
              const inRange = t >= lo && t <= hi;
              const endpoint = t === lo || t === hi;
              let cls = "text-ink-soft hover:bg-sand-100"; // 평일·선택가능 기본
              if (disabled) cls = "cursor-not-allowed text-ink-disabled";
              else if (inRange)
                cls = endpoint
                  ? "bg-brand-600 text-white"
                  : "bg-brand-100 text-brand-700";
              return (
                <button
                  key={t}
                  onClick={() => !disabled && pick(d)}
                  disabled={disabled}
                  className={`relative h-8 rounded-lg text-[13px] font-semibold transition ${cls} ${
                    // 오늘 = 링(선택 하이라이트와 다른 스타일)
                    isToday && !inRange ? "ring-1 ring-inset ring-brand-400" : ""
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
          <p className="mt-2 text-[13px] text-ink-faint">
            {tab === "start" ? "시작일" : "종료일"}을 눌러 정해요 · 평일만 · 현재{" "}
            <span className="font-semibold text-brand-600">{fmtRange(start, end)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
