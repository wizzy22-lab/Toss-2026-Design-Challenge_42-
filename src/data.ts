import type { Attendee, Day, MeetingMeta, TimeSlot } from "./types";

export const DAYS: Day[] = ["mon", "tue", "wed", "thu", "fri"];
export const DAY_LABEL: Record<Day, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
};
export const TIMES: TimeSlot[] = [10, 11, 13, 14, 15, 16, 17];
export const timeLabel = (t: TimeSlot) => `${t}:00`;
export const slotKey = (d: Day, t: TimeSlot) => `${d}-${t}`;

/** 공지·카피용 한국어 라벨 (짧은 라벨과 별개) */
export const DAY_FULL: Record<Day, string> = {
  mon: "월요일",
  tue: "화요일",
  wed: "수요일",
  thu: "목요일",
  fri: "금요일",
};
/** 15 → "오후 3시", 10 → "오전 10시", 13 → "오후 1시" */
export const timeKorean = (t: TimeSlot): string => {
  const ampm = t < 12 ? "오전" : "오후";
  const h = t <= 12 ? t : t - 12;
  return `${ampm} ${h}시`;
};
/** "수요일 오후 2시" */
export const slotKorean = (d: Day, t: TimeSlot): string =>
  `${DAY_FULL[d]} ${timeKorean(t)}`;

export const INITIAL_MEETING: MeetingMeta = {
  title: "커머스팀 스프린트 결정 회의",
  durationLabel: "1시간",
  rangeLabel: "다음 주 월–금",
};

/**
 * 대면 전용 busy/soft 맵 (크로스펑셔널 커머스팀 · 최민영만 선택 참석):
 *  - 성립(필수 5명 대면 가능) 슬롯은 3개: 월-11, 수-14, 금-15.
 *  - 어떤 성립 슬롯도 "완벽(회피 0)"이 아님 → 항상 트레이드오프가 남음.
 *    (최민영이 선택이라 빠질 수 있는 월15·수15·금10은 필수자 일정으로 막아 성립에서 제외 —
 *     '완벽한 시간 없음' 전제 유지.)
 *  - 최선 = 월 11:00 (회피 2: 박준호·정지훈). 회피 수로 명확한 1등 —
 *    수-14(회피 3) · 금-15(회피 4) 순. 동점 아님 → 랭킹이 정당(human-in-loop).
 *  - 정지훈이 월-11 불가가 되면 재추천 = 수 14:00 (재수집 없이).
 *  - 화·목은 한소희가 종일 '불가'로 표시 → 두 요일 전체가 성립 불가.
 *  - 연동자(5명) busy 는 캘린더 자동. 한소희는 캘린더가 비어 있어(외근을 안 적음)
 *    시스템이 일정을 몰라서 본인이 직접 '불가'를 표시 — '외근'이라는 별도 상태는 없음.
 */
export const INITIAL_ATTENDEES: Attendee[] = [
  {
    id: "gayoung",
    name: "이가영",
    role: "프로덕트 디자이너",
    required: true,
    linked: true,
    softAvoidLunch: true,
    softSlots: ["fri-15", "wed-14"], // 금15·수14 되지만 피하고 싶음
    busy: ["mon-10", "wed-17", "fri-13", "tue-11", "thu-15"],
    awayDays: [],
    excluded: false,
  },
  {
    id: "jieun",
    name: "윤지은",
    role: "PO",
    required: true,
    linked: true,
    softAvoidLunch: false,
    softSlots: ["fri-15", "wed-14"],
    // mon-15 = 최민영(선택)이 빠져도 월15가 '완벽 슬롯'이 되지 않게 막는 필수자 일정
    busy: ["mon-17", "wed-10", "tue-14", "thu-16", "mon-15"],
    awayDays: [],
    excluded: false,
  },
  {
    id: "junho",
    name: "박준호",
    role: "서버 개발자",
    required: true,
    linked: true,
    softAvoidLunch: false,
    softSlots: ["mon-11", "fri-15"],
    busy: ["mon-13", "wed-11", "fri-17", "tue-13", "thu-10", "wed-15"],
    awayDays: [],
    excluded: false,
  },
  {
    id: "jihoon",
    name: "정지훈",
    role: "클라이언트 개발자",
    required: true,
    linked: true,
    softAvoidLunch: false,
    softSlots: ["mon-11"],
    busy: ["mon-14", "wed-16", "fri-16", "tue-10", "thu-13", "fri-10"],
    awayDays: [],
    excluded: false,
  },
  {
    id: "minyoung",
    name: "최민영",
    role: "데이터 분석가",
    required: true, // 기본은 6명 모두 필참
    linked: true,
    softAvoidLunch: false,
    softSlots: ["wed-14", "fri-15"], // 수14·금15 피하고 싶음
    busy: ["mon-15", "wed-15", "fri-10", "tue-17", "thu-17"],
    awayDays: [],
    excluded: false,
  },
  {
    id: "sohee",
    name: "한소희",
    role: "클라이언트 개발자",
    required: true,
    // 연동은 됐지만 캘린더가 비어 있음(외근을 캘린더에 안 적는 사람) →
    // 시스템이 일정을 몰라 본인이 직접 표시. UX상 '미연동'과 같은 빈 그리드.
    linked: false,
    softAvoidLunch: false,
    softSlots: [],
    // '외근'은 상태가 아니라 이유 → 별도 개념 없이 화·목을 본인이 '불가'로 표시한 것.
    busy: [
      "mon-16",
      "wed-13",
      "fri-11",
      "fri-14",
      ...TIMES.map((t) => slotKey("tue", t)),
      ...TIMES.map((t) => slotKey("thu", t)),
    ],
    awayDays: [],
    excluded: false,
  },
];
