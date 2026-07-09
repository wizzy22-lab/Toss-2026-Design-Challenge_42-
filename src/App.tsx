import { useEffect, useState } from "react";
import { useApp } from "./store";
import type { DemoStage } from "./types";
import Shell from "./shell/Shell";
import Channel from "./shell/Channel";
import CreateMeeting from "./screens/CreateMeeting";
import AttendeeInput from "./screens/AttendeeInput";
import Dashboard from "./screens/Dashboard";
import ChangeEntry from "./screens/ChangeEntry";
import Intro from "./screens/Intro";

/** 셸 위에 얹히는 오버레이 — 한 번에 하나만. 확정은 풀스크린 없이 채널 인라인. */
type Overlay = "create" | "attendee" | "dashboard" | "change" | null;

/** 상태에서 현재 데모 단계를 역산 — 스위처 하이라이트용 */
function currentStage(
  screen: string,
  confirmedKey: string | null,
  changing: boolean,
  changed: boolean,
  allIn: boolean,
): DemoStage {
  if (changing || changed) return "change";
  if (confirmedKey) return "confirmed";
  if (screen === "create") return "create";
  if (allIn) return "recommend";
  return "collect";
}

export default function App() {
  const { state, dispatch, derived } = useApp();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [showIntro, setShowIntro] = useState(true); // 데모 첫 진입 인트로
  const close = () => setOverlay(null);

  const roster = state.attendees.filter((a) => !a.excluded);
  const allIn = roster.every((a) => state.responded.includes(a.id));
  const stage = currentStage(
    state.screen,
    state.confirmedKey,
    state.change !== null,
    state.lastChange !== null,
    allIn,
  );

  // (a) 자동 체이닝 — 주최자 collect: 응답이 1→6으로 채워지고(약 700ms×5),
  // 6명 다 응답한 뒤 3초 delay → 추천 카드 자동 등장. (오버레이 없을 때만)
  useEffect(() => {
    if (state.viewAs !== "host" || stage !== "collect" || overlay !== null)
      return;
    const fillMs = 700 * Math.max(0, roster.length - 1); // 응답 채워지는 시간
    const t = window.setTimeout(() => {
      dispatch({ type: "DEMO", stage: "recommend" });
    }, fillMs + 3000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.viewAs, stage, overlay, roster.length]);

  // 참석자 응답 완료 → 3초 delay 후 다음 카드(확정) 자동 등장. (오버레이 없을 때만)
  useEffect(() => {
    if (
      state.viewAs !== "attendee" ||
      overlay !== null ||
      state.confirmedKey ||
      state.change ||
      state.lastChange ||
      !state.responded.includes(state.activeAttendeeId)
    )
      return;
    const t = window.setTimeout(() => {
      if (derived.top[0]) dispatch({ type: "CONFIRM", key: derived.top[0].key });
    }, 3000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.viewAs,
    state.responded,
    state.activeAttendeeId,
    state.confirmedKey,
    state.change,
    state.lastChange,
    overlay,
  ]);

  // 정하기 = 최선(top[0])을 그대로 확정. 풀스크린 전환 없이 — confirmedKey만
  // 세팅되면 채널 카드가 인라인으로 확정 상태가 됨.
  const decide = () => {
    if (derived.top[0]) dispatch({ type: "CONFIRM", key: derived.top[0].key });
  };

  // 데모 스위처 — 단계 점프 & 관점 전환
  const onDemo = (s: DemoStage) => {
    dispatch({ type: "DEMO", stage: s });
    setOverlay(null);
  };
  // 인트로에서 역할/사람 선택 → 그 역할 첫 화면으로 진입 + 인트로 닫힘.
  const startAsHost = () => {
    dispatch({ type: "SET_VIEW_AS", view: "host" });
    dispatch({ type: "DEMO", stage: "create" });
    setOverlay(null);
    setShowIntro(false);
  };
  const startAsAttendee = (id: string) => {
    dispatch({ type: "SET_ACTIVE_ATTENDEE", id });
    dispatch({ type: "SET_VIEW_AS", view: "attendee" });
    dispatch({ type: "DEMO", stage: "collect" });
    setOverlay(null);
    setShowIntro(false);
  };

  return (
    <>
      <Shell
        stage={stage}
        viewAs={state.viewAs}
        onDemo={onDemo}
        onCreate={() => setOverlay("create")}
        onRestart={() => setShowIntro(true)}
      >
        <Channel
          onRespond={() => setOverlay("attendee")}
          onDecide={decide}
          onDetails={() => setOverlay("dashboard")}
          onChangeEntry={() => setOverlay("change")}
        />
      </Shell>

      {overlay === "create" && (
        <CreateMeeting
          onClose={close}
          onSubmit={() => {
            // 만들면 요청 게시 → 주최자(이가영) 본인 시간을 그리드로 첫 응답.
            dispatch({ type: "SET_ACTIVE_ATTENDEE", id: "gayoung" });
            dispatch({ type: "SEND_REQUEST" });
            setOverlay("attendee");
          }}
        />
      )}
      {overlay === "attendee" && (
        <AttendeeInput
          onClose={close}
          onDone={() => {
            dispatch({ type: "RESPOND", id: state.activeAttendeeId });
            close();
          }}
        />
      )}
      {overlay === "dashboard" && <Dashboard onClose={close} />}
      {overlay === "change" && (
        <ChangeEntry onClose={close} onSubmit={close} />
      )}

      {showIntro && (
        <Intro onHost={startAsHost} onAttendee={startAsAttendee} />
      )}
    </>
  );
}
