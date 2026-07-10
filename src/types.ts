export type Day = "mon" | "tue" | "wed" | "thu" | "fri";
export type TimeSlot = 10 | 11 | 13 | 14 | 15 | 16 | 17;

/**
 * 회의는 대면 전용 — 축은 오직 '시간' 하나.
 * 한 참석자는 한 슬롯에서 '참석 가능(대면)' 또는 '불가' 둘 중 하나다.
 * (화상·비동기 같은 '참석 방식' 개념은 없다.)
 */

export interface Attendee {
  id: string;
  name: string;
  /** 크로스펑셔널 스쿼드에서의 직무 — 회의 만들기 참석자 리스트에만 가볍게 표시 */
  role: string;
  /** 가중치: 필수 참석자 vs 선택 참석자 */
  required: boolean;
  /** 캘린더 연동 여부 (연동 시 busy가 자동 hard) */
  linked: boolean;
  /** soft: 선호 회피 (점심 직후 등). UI 카피용 플래그 */
  softAvoidLunch: boolean;
  /** soft: 회피 선호 슬롯. "day-time" 키. 참석은 되지만 "조금 불편" */
  softSlots: string[];

  /** hard 불가: 기존 회의(busy). "day-time" 키. 연동자는 자동, 미연동자는 수동 */
  busy: string[];
  /** hard 불가: 종일 외근(offsite) 날 — 그냥 '안 됨' (화상 대안 없음) */
  awayDays: Day[];

  /** 조율자 조절: 이 회의에서 아예 제외(빠짐). 필참 해제(=선택)와 다름 */
  excluded: boolean;
  /** 외부 인원(다른 워크스페이스·외부 이메일/링크). 채널 자동 초대가 아님 */
  external?: boolean;
}

export interface MeetingMeta {
  title: string;
  durationLabel: string;
  rangeLabel: string;
}

export type ScreenId = "create" | "attendee" | "dashboard" | "confirm";

/** 데모 관점 — 채널을 누구의 시점으로 볼까 (주최자 vs 참석자 수신) */
export type ViewAs = "host" | "attendee";

/** 데모 단계 — 타임라인 위치 (변경/재조율 포함) */
export type DemoStage =
  | "create"
  | "collect"
  | "recommend"
  | "confirmed"
  | "change";

/** 변경/재조율 결과 (대면 전용 — 화상 유지 옵션 없음). cancel = 조정 실패로 회의 취소 */
export type ChangeKind = "drop" | "reschedule" | "cancel";

/** 참석자가 "참석 어려워요"로 올린 구조화된 사정 */
export interface ChangeRequest {
  attendeeId: string;
  /** 참석자가 고른 대안 시간 슬롯 키들 (재조율 카드에서 주최자에게 제안으로 표시) */
  proposedKeys?: string[];
}

/** 방금 반영된 변경 — 중립적 변경 공지 카드용 */
export interface LastChange {
  kind: ChangeKind;
  attendeeName: string;
  fromKey: string;
  toKey: string;
}
