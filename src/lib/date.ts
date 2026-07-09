/* 날짜 유틸 (앱 런타임 — new Date() 사용 가능) */
export const DAY = 24 * 60 * 60 * 1000;

export function atMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function addDays(d: Date, n: number) {
  return atMidnight(new Date(d.getTime() + n * DAY));
}
export function mondayOfWeek(d: Date) {
  const m = atMidnight(d);
  const wd = (m.getDay() + 6) % 7; // 월=0
  return addDays(m, -wd);
}
export function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export const WD = ["일", "월", "화", "수", "목", "금", "토"];
export const wd = (d: Date) => WD[d.getDay()];

/** "7월 12일(금)" */
export function fmtDay(d: Date) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${wd(d)})`;
}

/** 범위: "7월 13일(월)~17일(금)" */
export function fmtRange(start: Date, end: Date) {
  const a = start.getTime() <= end.getTime() ? start : end;
  const b = start.getTime() <= end.getTime() ? end : start;
  if (a.getMonth() === b.getMonth() && a.getDate() === b.getDate())
    return fmtDay(a);
  if (a.getMonth() === b.getMonth())
    return `${a.getMonth() + 1}월 ${a.getDate()}일(${wd(a)})~${b.getDate()}일(${wd(b)})`;
  return `${fmtDay(a)} ~ ${fmtDay(b)}`;
}

/** 분(자정 기준) → "오후 6:00" 12h 한국어 */
export function fmtTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(m).padStart(2, "0")}`;
}
