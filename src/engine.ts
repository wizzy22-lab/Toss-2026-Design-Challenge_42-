import type { Attendee, Day, TimeSlot } from "./types";
import { DAYS, TIMES, slotKey } from "./data";

/** "wed-14" → { day:"wed", time:14 } */
export function parseKey(key: string): { day: Day; time: TimeSlot } {
  const i = key.lastIndexOf("-");
  return {
    day: key.slice(0, i) as Day,
    time: Number(key.slice(i + 1)) as TimeSlot,
  };
}

/**
 * 한 참석자가 특정 슬롯에 대면 참석 가능한가 (이진).
 * 기존 회의(busy)거나 종일 외근(awayDays)이면 불가. 그 외엔 가능.
 * (화상·비동기 같은 참석 방식은 없다 — 되거나, 안 되거나.)
 */
export function isAvailable(a: Attendee, day: Day, time: TimeSlot): boolean {
  const k = slotKey(day, time);
  return !a.busy.includes(k) && !a.awayDays.includes(day);
}

export function isSoftViolation(
  a: Attendee,
  day: Day,
  time: TimeSlot,
): boolean {
  return a.softSlots.includes(slotKey(day, time));
}

export interface AttendeeSlotState {
  attendee: Attendee;
  available: boolean;
  /** 참석은 되지만 "조금 불편"이라고 표시한 시간 */
  soft: boolean;
}

export interface SlotResult {
  day: Day;
  time: TimeSlot;
  key: string;
  states: AttendeeSlotState[];
  requiredStates: AttendeeSlotState[];
  optionalStates: AttendeeSlotState[];
  /** 필수 전원이 대면 가능한가 */
  requiredAllIn: boolean;
  /** 참석 가능한 선택 인원 수 */
  optionalIn: number;
  /** 회피(soft) 위반 수 (필수+선택 합산) */
  softViolations: number;
  /** 필수 참석자 중 회피(soft) 수 — 추천 순서 2단계 */
  requiredSoft: number;
  /** 선택 참석자 중 회피(soft) 수 — 추천 순서 4단계 */
  optionalSoft: number;
  /** 회피로 조금 불편한 사람들 이름 (트레이드오프 설명용) */
  softNames: string[];
  /** 불가한 필수 인원 이름 (필수 전원 불가 설명용) */
  blockedRequired: string[];
  /** 완벽 = 성립 + 회피 0 (전원 편하게 다 되는 시간). 설계상 존재하지 않음 */
  perfect: boolean;
  /** 성립 = 필수 전원 대면 가능 (명세 §3 — 선택 정족수는 성립 조건이 아님) */
  feasible: boolean;
  score: number;
  counts: { in: number; out: number };
}

export function evalSlot(
  day: Day,
  time: TimeSlot,
  attendees: Attendee[],
): SlotResult {
  const states: AttendeeSlotState[] = attendees.map((a) => ({
    attendee: a,
    available: isAvailable(a, day, time),
    soft: isAvailable(a, day, time) && isSoftViolation(a, day, time),
  }));

  const requiredStates = states.filter((s) => s.attendee.required);
  const optionalStates = states.filter((s) => !s.attendee.required);

  const requiredAllIn = requiredStates.every((s) => s.available);
  const optionalIn = optionalStates.filter((s) => s.available).length;
  const softNames = states.filter((s) => s.soft).map((s) => s.attendee.name);
  const softViolations = softNames.length;
  const requiredSoft = requiredStates.filter((s) => s.soft).length;
  const optionalSoft = optionalStates.filter((s) => s.soft).length;
  const blockedRequired = requiredStates
    .filter((s) => !s.available)
    .map((s) => s.attendee.name);

  const inCount = states.filter((s) => s.available).length;
  // 성립 = 필수 전원 대면 가능. 선택 인원 수는 성립 조건이 아니라 추천 순서 3단계에서 반영.
  const feasible = requiredAllIn;
  const perfect = feasible && softViolations === 0;

  // 점수 = 참석 가능 인원 − 회피 위반(불편)×2. 회피가 적을수록 상위.
  const score = inCount - softViolations * 2;

  return {
    day,
    time,
    key: slotKey(day, time),
    states,
    requiredStates,
    optionalStates,
    requiredAllIn,
    optionalIn,
    softViolations,
    requiredSoft,
    optionalSoft,
    softNames,
    blockedRequired,
    perfect,
    feasible,
    score,
    counts: { in: inCount, out: states.length - inCount },
  };
}

export function evalAll(
  attendees: Attendee[],
  days: Day[] = DAYS,
): SlotResult[] {
  const out: SlotResult[] = [];
  for (const d of days)
    for (const t of TIMES) out.push(evalSlot(d, t, attendees));
  return out;
}

/**
 * 명세(§3~6·§10·§11)의 추천 순서를 그대로 옮긴 단일 사전식 비교기.
 *   1. 필수 전원 가능 (불가한 필수가 적을수록 위 — 성립 0 폴백에서 '가장 가까운 시간'도 이 키로 정렬)
 *   2. 필수 참석자 중 '피하고 싶어요' 적은 순
 *   3. 추가로 참석 가능한 선택 인원 많은 순
 *   4. 선택 참석자 중 '피하고 싶어요' 적은 순
 *   5. 더 이른 시간
 * 필수의 불편(2)이 선택의 참석 여부·불편(3·4)보다 항상 우선한다.
 */
export function bySpec(a: SlotResult, b: SlotResult): number {
  if (a.blockedRequired.length !== b.blockedRequired.length)
    return a.blockedRequired.length - b.blockedRequired.length; // 1
  if (a.requiredSoft !== b.requiredSoft)
    return a.requiredSoft - b.requiredSoft; // 2
  if (b.optionalIn !== a.optionalIn) return b.optionalIn - a.optionalIn; // 3
  if (a.optionalSoft !== b.optionalSoft)
    return a.optionalSoft - b.optionalSoft; // 4
  return TIMES.indexOf(a.time) - TIMES.indexOf(b.time); // 5
}

/**
 * 성립 0 상세 뷰용 — 전 슬롯을 명세 순서로. (점수 숫자는 UI 비노출)
 * 불가한 필수가 적은(=가장 가까운) 시간부터, 그다음 필수 선호 → 선택 인원 → 선택 선호 → 시간.
 */
export function rankedCandidates(results: SlotResult[]): SlotResult[] {
  return [...results].sort(bySpec);
}

/** 상위 추천 (성립 슬롯만, 명세 추천 순서대로) */
export function topRecommendations(
  results: SlotResult[],
  n = 3,
): SlotResult[] {
  return [...results].filter((r) => r.feasible).sort(bySpec).slice(0, n);
}

/**
 * 변경/재조율 — "방해 최소 사다리(least-disruptive)". 대면 전용이라 화상 유지 옵션은 없다.
 * 확정된 회의에서 한 참석자가 "참석 어려워요"를 눌렀을 때, 재수집 없이:
 *   ① (필수 아니면) 그 시간 그대로 두고 그 사람만 이번엔 빠짐 → 나머지 방해 0
 *   ② 받아둔 응답으로 새 최선 시간 재추천
 * 시스템은 계산만 하고 최종 선택은 주최자가 한다.
 */
export interface ReCoordination {
  changer: Attendee;
  fromKey: string;
  fromDay: Day;
  fromTime: TimeSlot;
  /** ① 이 사람을 빼도 성립하는가 (필수가 아닐 때만 의미) */
  canDrop: boolean;
  /** ② 재추천된 새 슬롯 (없으면 null) */
  newSlot: SlotResult | null;
}

export function reCoordinate(
  attendees: Attendee[],
  fromKey: string,
  changerId: string,
  days: Day[] = DAYS,
): ReCoordination | null {
  const changer = attendees.find((a) => a.id === changerId);
  if (!changer) return null;
  const { day, time } = parseKey(fromKey);

  // ① 이 사람을 빼면 성립하는가 (필수면 애초에 제외 불가)
  const without = attendees.filter((a) => a.id !== changerId);
  const rWithout = evalSlot(day, time, without);
  const canDrop = !changer.required && rWithout.feasible;

  // ② 그 사람이 그 슬롯엔 불가(busy)라고 보고 새 최선 시간을 다시 찾는다.
  const reData = attendees.map((a) =>
    a.id === changerId ? { ...a, busy: [...a.busy, fromKey] } : a,
  );
  const reTop = topRecommendations(evalAll(reData, days), 3).filter(
    (r) => r.key !== fromKey,
  );

  return {
    changer,
    fromKey,
    fromDay: day,
    fromTime: time,
    canDrop,
    newSlot: reTop[0] ?? null,
  };
}
