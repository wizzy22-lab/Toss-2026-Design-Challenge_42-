import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  Attendee,
  ChangeKind,
  ChangeRequest,
  DemoStage,
  LastChange,
  ScreenId,
  ViewAs,
} from "./types";
import { INITIAL_ATTENDEES, INITIAL_MEETING } from "./data";
import {
  evalAll,
  reCoordinate,
  topRecommendations,
  type ReCoordination,
  type SlotResult,
} from "./engine";

/** 기본 확정 슬롯 — 대면으로 성립하는 명확한 최선(월 11:00, 회피 2: 박준호·정지훈) */
const BEST_KEY = "mon-11";
/** 주최자 = 첫 번째 참석자(이가영) */
export const HOST_ID = INITIAL_ATTENDEES[0].id;
/** 변경 데모에서 "참석 어려워졌다"고 올리는 사람 (필수·대면) */
const CHANGE_DEMO_ID = "jihoon";
/** 확정 카드 초기 참석 확인 = 2명 미리 확인(윤지은·박준호) → "확인 2/6"에서 시작 */
const SEED_ATTEND_CONFIRM = ["jieun", "junho"];

interface State {
  title: string;
  durationLabel: string;
  rangeLabel: string;
  attendees: Attendee[];
  quorum: number; // 선택 참석자 최소 인원 (정족수 임계값)
  screen: ScreenId; // 데모 단계 = 채널 타임라인이 어디까지 진행됐는가
  viewAs: ViewAs; // 채널을 누구의 시점으로 볼까 (주최자 vs 참석자 수신)
  activeAttendeeId: string; // 참석자 관점의 "나"
  confirmedKey: string | null; // null이면 추천은 아직 주최자에게만 보이는 에페메럴
  /** 요청 카드에 응답을 마친 참석자 id들 — 채널의 "N명 응답" 진행도 */
  responded: string[];
  /** 참석자가 "참석 어려워요"로 올린 사정 (재조율 진행 중) */
  change: ChangeRequest | null;
  /** 방금 반영된 변경 — 중립적 변경 공지용 */
  lastChange: LastChange | null;
  /** 확정된 시간에 "참석 확인"한 사람 id들 (순수 표명 · 어떤 것의 조건도 아님) */
  attendConfirmed: string[];
}

type Action =
  | { type: "SET_SCREEN"; screen: ScreenId }
  | { type: "SET_VIEW_AS"; view: ViewAs }
  | { type: "DEMO"; stage: DemoStage }
  | { type: "SEND_REQUEST" }
  | { type: "RESPOND"; id: string }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_DURATION"; label: string }
  | { type: "SET_RANGE"; label: string }
  | { type: "TOGGLE_REQUIRED"; id: string }
  | { type: "TOGGLE_EXCLUDED"; id: string }
  | { type: "ADD_EXTERNAL"; name: string }
  | { type: "SET_QUORUM"; value: number }
  | { type: "SET_ACTIVE_ATTENDEE"; id: string }
  | { type: "TOGGLE_BUSY"; id: string; key: string }
  | { type: "TOGGLE_SOFT"; id: string; key: string }
  // 응답 제출 = 참석자의 안 되는/피하고 싶은 시간을 통째로 반영 (추천 즉시 재계산)
  | { type: "SET_AVAILABILITY"; id: string; busy: string[]; softSlots: string[] }
  | { type: "CONFIRM"; key: string }
  | { type: "CONFIRM_ATTEND"; id: string }
  // 변경/재조율
  | { type: "OPEN_CHANGE"; attendeeId: string }
  | { type: "CANCEL_CHANGE" }
  | { type: "RESOLVE_CHANGE"; kind: ChangeKind; newKey?: string }
  | { type: "RESET" };

const ALL_IDS = INITIAL_ATTENDEES.map((a) => a.id);

const initialState: State = {
  title: INITIAL_MEETING.title,
  durationLabel: INITIAL_MEETING.durationLabel,
  rangeLabel: INITIAL_MEETING.rangeLabel,
  attendees: INITIAL_ATTENDEES,
  quorum: 0,
  // 첫 화면 = 추천이 주최자에게 막 뜬 순간 (에페메럴 · 아직 채널 공지 전)
  screen: "dashboard",
  viewAs: "host",
  activeAttendeeId: "sohee", // 참석자 관점의 "나" = 한소희 (미연동·외근)
  confirmedKey: null,
  responded: ALL_IDS,
  change: null,
  lastChange: null,
  attendConfirmed: SEED_ATTEND_CONFIRM,
};

/** 데모 단계별 응답 진행도 정규화 */
function respondedForScreen(state: State, screen: ScreenId): string[] {
  const allIds = state.attendees.filter((a) => !a.excluded).map((a) => a.id);
  if (screen === "create") return [];
  if (screen === "attendee")
    return allIds.filter((id) => id !== state.activeAttendeeId);
  return allIds;
}

function mapAttendee(
  attendees: Attendee[],
  id: string,
  fn: (a: Attendee) => Attendee,
): Attendee[] {
  return attendees.map((a) => (a.id === id ? fn(a) : a));
}

function toggleInList(list: string[], key: string): string[] {
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}

function pushUnique(list: string[], key: string): string[] {
  return list.includes(key) ? list : [...list, key];
}

/** DEMO 단계 = 관련 상태를 한 번에 세팅 (관점은 그대로 유지) */
function applyDemo(state: State, stage: DemoStage): State {
  const allIds = state.attendees.filter((a) => !a.excluded).map((a) => a.id);
  const base: State = { ...state, change: null, lastChange: null };
  switch (stage) {
    case "create":
      return { ...base, screen: "create", confirmedKey: null, responded: [] };
    case "collect":
      return {
        ...base,
        screen: "attendee",
        confirmedKey: null,
        // 주최자 관점 = 본인만 응답한 1/6에서 시작(카드가 6/6까지 채워짐).
        // 참석자 관점 = 남들은 응답 완료, 나만 남음.
        responded:
          state.viewAs === "host"
            ? [HOST_ID]
            : allIds.filter((id) => id !== state.activeAttendeeId),
      };
    case "recommend":
      return {
        ...base,
        screen: "dashboard",
        confirmedKey: null,
        responded: allIds,
      };
    case "confirmed":
      return {
        ...base,
        screen: "dashboard",
        confirmedKey: BEST_KEY,
        responded: allIds,
      };
    case "change":
      return {
        ...base,
        screen: "dashboard",
        confirmedKey: BEST_KEY,
        responded: allIds,
        change: { attendeeId: CHANGE_DEMO_ID },
      };
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SCREEN":
      return {
        ...state,
        screen: action.screen,
        responded: respondedForScreen(state, action.screen),
      };
    case "SET_VIEW_AS":
      return { ...state, viewAs: action.view };
    case "DEMO":
      return applyDemo(state, action.stage);
    case "SEND_REQUEST":
      return {
        ...state,
        screen: "attendee",
        confirmedKey: null,
        responded: [], // 생성 직후 0명 — 주최자 첫 응답으로 1/6에서 시작
      };
    case "RESPOND": {
      const responded = state.responded.includes(action.id)
        ? state.responded
        : [...state.responded, action.id];
      const roster = state.attendees.filter((a) => !a.excluded);
      const allIn = roster.every((a) => responded.includes(a.id));
      return { ...state, responded, screen: allIn ? "dashboard" : state.screen };
    }
    case "SET_TITLE":
      return { ...state, title: action.title };
    case "SET_DURATION":
      return { ...state, durationLabel: action.label };
    case "SET_RANGE":
      return { ...state, rangeLabel: action.label };
    case "TOGGLE_REQUIRED":
      return {
        ...state,
        attendees: mapAttendee(state.attendees, action.id, (a) => ({
          ...a,
          required: !a.required,
        })),
      };
    case "TOGGLE_EXCLUDED":
      return {
        ...state,
        attendees: mapAttendee(state.attendees, action.id, (a) => ({
          ...a,
          excluded: !a.excluded,
        })),
        responded: state.responded.filter((id) => id !== action.id),
      };
    case "ADD_EXTERNAL": {
      const n = state.attendees.filter((a) => a.external).length + 1;
      return {
        ...state,
        attendees: [
          ...state.attendees,
          {
            id: `external-${n}`,
            name: action.name || `외부 게스트 ${n}`,
            role: "", // 외부 게스트는 '외부' 뱃지로 구분 — 직무 라벨 없음
            required: true,
            linked: false, // 외부 = 미연동, 본인이 직접 표시
            softAvoidLunch: false,
            softSlots: [],
            busy: [],
            awayDays: [],
            excluded: false,
            external: true,
          },
        ],
      };
    }
    case "SET_QUORUM":
      return { ...state, quorum: Math.max(0, action.value) };
    case "SET_ACTIVE_ATTENDEE":
      return { ...state, activeAttendeeId: action.id };
    case "TOGGLE_BUSY":
      return {
        ...state,
        attendees: mapAttendee(state.attendees, action.id, (a) => ({
          ...a,
          busy: toggleInList(a.busy, action.key),
          softSlots: a.softSlots.filter((k) => k !== action.key),
        })),
      };
    case "TOGGLE_SOFT":
      return {
        ...state,
        attendees: mapAttendee(state.attendees, action.id, (a) => ({
          ...a,
          softSlots: toggleInList(a.softSlots, action.key),
          busy: a.busy.filter((k) => k !== action.key),
        })),
      };
    case "SET_AVAILABILITY":
      return {
        ...state,
        attendees: mapAttendee(state.attendees, action.id, (a) => ({
          ...a,
          busy: action.busy,
          softSlots: action.softSlots,
        })),
      };
    case "CONFIRM":
      // 정하기 = 에페메럴 추천을 채널 공지로 전환 (인라인). 확정 순간 캘린더 전원 자동 추가(개념).
      return { ...state, confirmedKey: action.key, screen: "confirm" };
    case "CONFIRM_ATTEND":
      // 참석 확인 = 순수 표명(조건 아님). 기존 카드 제자리 갱신 · 새 메시지 없음.
      return { ...state, attendConfirmed: pushUnique(state.attendConfirmed, action.id) };
    case "OPEN_CHANGE":
      return { ...state, change: { attendeeId: action.attendeeId } };
    case "CANCEL_CHANGE":
      return { ...state, change: null };
    case "RESOLVE_CHANGE": {
      if (!state.change || !state.confirmedKey) return state;
      const id = state.change.attendeeId;
      const changer = state.attendees.find((a) => a.id === id);
      if (!changer) return state;
      const fromKey = state.confirmedKey;

      if (action.kind === "cancel") {
        // ③ 조정 실패 → 회의 취소 (확정 시간 사라짐). 중립적 취소 카드로 공지.
        return {
          ...state,
          confirmedKey: null,
          change: null,
          lastChange: {
            kind: "cancel",
            attendeeName: changer.name,
            fromKey,
            toKey: fromKey,
          },
        };
      }
      if (action.kind === "drop") {
        // ① 그 시간 그대로, 이 사람만 이번엔 빠짐 (선택 참석자일 때만 제시됨)
        return {
          ...state,
          attendees: mapAttendee(state.attendees, id, (a) => ({
            ...a,
            excluded: true,
          })),
          responded: state.responded.filter((x) => x !== id),
          change: null,
          lastChange: {
            kind: "drop",
            attendeeName: changer.name,
            fromKey,
            toKey: fromKey,
          },
        };
      }
      // ② 새 시간 재추천 — 그 사람은 이 시간엔 불가로 두고 시간만 옮김
      const toKey = action.newKey ?? fromKey;
      return {
        ...state,
        attendees: mapAttendee(state.attendees, id, (a) => ({
          ...a,
          busy: pushUnique(a.busy, fromKey),
        })),
        confirmedKey: toKey,
        change: null,
        attendConfirmed: SEED_ATTEND_CONFIRM, // 새 확정 = 참석 확인 새로 시작
        lastChange: {
          kind: "reschedule",
          attendeeName: changer.name,
          fromKey,
          toKey,
        },
      };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface Derived {
  results: SlotResult[];
  top: SlotResult[];
  hasPerfect: boolean;
  /** 변경/재조율 진행 중일 때의 방해 최소 사다리 */
  recoord: ReCoordination | null;
}

interface Ctx {
  state: State;
  dispatch: React.Dispatch<Action>;
  derived: Derived;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const derived = useMemo<Derived>(() => {
    const active = state.attendees.filter((a) => !a.excluded);
    const results = evalAll(active, state.quorum);
    const recoord =
      state.change && state.confirmedKey
        ? reCoordinate(
            active,
            state.confirmedKey,
            state.change.attendeeId,
            state.quorum,
          )
        : null;
    return {
      results,
      top: topRecommendations(results, 3),
      hasPerfect: results.some((r) => r.perfect),
      recoord,
    };
  }, [state.attendees, state.quorum, state.confirmedKey, state.change]);

  return (
    <AppContext.Provider value={{ state, dispatch, derived }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
