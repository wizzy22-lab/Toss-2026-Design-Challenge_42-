import { useEffect, useMemo, useState } from "react";

/* 날짜 유틸 (앱 런타임이라 new Date() 사용 가능) */
const DAY = 24 * 60 * 60 * 1000;
function atMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  return atMidnight(new Date(d.getTime() + n * DAY));
}
function mondayOfWeek(d: Date) {
  const m = atMidnight(d);
  const wd = (m.getDay() + 6) % 7; // 월=0
  return addDays(m, -wd);
}
// 요일까지 표시: "7월 13일(월)~17일(금)"
const WD = ["일", "월", "화", "수", "목", "금", "토"];
const wd = (d: Date) => WD[d.getDay()];
function fmt(start: Date, end: Date) {
  const a = start.getTime() <= end.getTime() ? start : end;
  const b = start.getTime() <= end.getTime() ? end : start;
  if (a.getMonth() === b.getMonth() && a.getDate() === b.getDate())
    return `${a.getMonth() + 1}월 ${a.getDate()}일(${wd(a)})`;
  if (a.getMonth() === b.getMonth())
    return `${a.getMonth() + 1}월 ${a.getDate()}일(${wd(a)})~${b.getDate()}일(${wd(b)})`;
  return `${a.getMonth() + 1}월 ${a.getDate()}일(${wd(a)}) ~ ${b.getMonth() + 1}월 ${b.getDate()}일(${wd(b)})`;
}

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

  const [preset, setPreset] = useState<Preset>("next");
  // 직접 선택용
  const [start, setStart] = useState(nextMon);
  const [end, setEnd] = useState(nextFri);
  const [tab, setTab] = useState<"start" | "end">("start");

  const labelFor = (p: Preset): string => {
    if (p === "next") return `다음 주 · ${fmt(nextMon, nextFri)}`;
    if (p === "this") return `이번 주 · ${fmt(thisMon, thisFri)}`;
    return `직접 선택 · ${fmt(start, end)}`;
  };

  // 프리셋/직접선택이 바뀔 때마다 상위로 라벨 반영 (기본값 '다음 주' 포함)
  useEffect(() => {
    onChange(labelFor(preset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, start, end]);

  const gridStart = useMemo(() => mondayOfWeek(nextMon), [nextMon]);
  const days = useMemo(
    () => Array.from({ length: 35 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );
  const monthLabel = `${nextMon.getFullYear()}년 ${nextMon.getMonth() + 1}월`;

  const pick = (d: Date) => {
    if (d.getTime() < today.getTime()) return;
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
      {/* 프리셋 칩 — 기본 '다음 주' */}
      <div className="flex flex-wrap gap-2">
        {(["next", "this", "custom"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={segClass(preset === p)}
          >
            {p === "next" ? "다음 주" : p === "this" ? "이번 주" : "직접 선택"}
          </button>
        ))}
      </div>

      {/* 선택 요약 (프리셋일 때) */}
      {preset !== "custom" && (
        <p className="mt-2 text-[13px] text-ink-faint">
          후보 기간{" "}
          <span className="font-semibold text-brand-600">
            {fmt(preset === "next" ? nextMon : thisMon, preset === "next" ? nextFri : thisFri)}
          </span>{" "}
          월–금 안에서 시간을 찾아요.
        </p>
      )}

      {/* 직접 선택만 시작/종료 탭 + 달력 */}
      {preset === "custom" && (
        <div className="mt-3 select-none rounded-xl border border-line p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[16px] font-bold text-ink">{monthLabel}</span>
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
                  i >= 5 ? "text-ink-faint" : "text-ink-faint"
                }`}
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const t = d.getTime();
              const past = t < today.getTime();
              const inRange = t >= lo && t <= hi;
              const isStart = t === lo;
              const isEnd = t === hi;
              const weekend = (d.getDay() + 6) % 7 >= 5;
              return (
                <button
                  key={t}
                  onClick={() => pick(d)}
                  disabled={past}
                  className={`h-9 rounded-lg text-[13px] font-semibold transition ${
                    past
                      ? "cursor-not-allowed text-sand-300"
                      : inRange
                        ? isStart || isEnd
                          ? "bg-brand-600 text-white"
                          : "bg-brand-100 text-brand-700"
                        : weekend
                          ? "text-ink-faint hover:bg-sand-50"
                          : "text-ink-soft hover:bg-sand-100"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[13px] text-ink-faint">
            {tab === "start" ? "시작일" : "종료일"}을 눌러 정해요 · 현재{" "}
            <span className="font-semibold text-brand-600">{fmt(start, end)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
