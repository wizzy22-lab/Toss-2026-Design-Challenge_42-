import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../store";
import { DAY_LABEL, timeLabel } from "../data";
import { evalAll, parseKey, topRecommendations } from "../engine";
import { Icon } from "../ui";

/**
 * "참석이 어려워졌나요?" 진입 모달.
 * 원칙: 설계 논리("확정은 잠금이 아니다" 등)는 케이스스터디로, 여기 UI는 행동만.
 * 맥락은 팩트 한 줄, 그 아래는 무엇을 할지 선택지만 — 대안 제안 / (선택자면) 불참 / 개인 메시지.
 */
export default function ChangeEntry({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { state, dispatch } = useApp();
  const isHost = state.viewAs === "host";
  const roster = state.attendees.filter((a) => !a.excluded);

  const [who, setWho] = useState(
    isHost
      ? state.attendees.find((a) => a.id !== "gayoung")?.id ?? roster[0].id
      : state.activeAttendeeId,
  );
  // 고른 것(복수선택): 대안 슬롯 key들 · "drop"(선택자 불참). 비면 CTA 비활성.
  const [choices, setChoices] = useState<string[]>([]);
  const toggle = (key: string) =>
    setChoices((c) =>
      c.includes(key) ? c.filter((x) => x !== key) : [...c, key],
    );

  const slot = useMemo(
    () => (state.confirmedKey ? parseKey(state.confirmedKey) : null),
    [state.confirmedKey],
  );
  const whoAttendee = state.attendees.find((a) => a.id === who);
  const whoName = whoAttendee?.name ?? "";
  const whoRequired = whoAttendee?.required ?? true;

  // 대안 시간 — who를 확정 슬롯 불가로 두고 '다들 되는' 최선 2~3개 (확정 슬롯 제외).
  const alternatives = useMemo(() => {
    if (!state.confirmedKey) return [];
    const key = state.confirmedKey;
    const reData = roster.map((a) =>
      a.id === who ? { ...a, busy: [...a.busy, key] } : a,
    );
    return topRecommendations(
      evalAll(reData, state.quorum, state.activeDays),
      3,
    ).filter((r) => r.key !== key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.attendees, state.confirmedKey, who, state.quorum, state.activeDays]);

  // who가 바뀌면(주최자 select) 선택 초기화
  const pickWho = (id: string) => {
    setWho(id);
    setChoices([]);
  };

  // 제안/불참 모두 주최자에게 올림 — 고른 대안 시간을 함께 전달(재조율 카드에 노출).
  const submit = () => {
    const proposedKeys = choices.filter((c) => c !== "drop");
    dispatch({ type: "OPEN_CHANGE", attendeeId: who, proposedKeys });
    onSubmit();
  };

  const optClass = (on: boolean) =>
    `flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
      on
        ? "border-brand-400 bg-brand-50 ring-1 ring-brand-100"
        : "border-line hover:border-sand-300"
    }`;
  // 복수선택 = 체크박스(사각)
  const checkbox = (on: boolean) => (
    <span
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${
        on ? "border-brand-600 bg-brand-600 text-white" : "border-sand-300"
      }`}
    >
      {on && <Icon name="check" size={11} />}
    </span>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-3 sm:p-4 sm:items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="relative z-10 my-auto w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-line/70"
      >
        <div className="flex items-center gap-1.5 border-b border-line-soft px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sand-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-200" />
          <span className="ml-2 text-[13px] font-semibold text-ink-faint">
            42 · 참석 조정
          </span>
          <button
            onClick={onClose}
            className="ml-auto grid h-6 w-6 place-items-center rounded-[10px] text-ink-faint transition hover:bg-sand-100"
            aria-label="닫기"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <h1 className="text-2xl font-bold tracking-[-0.01em]">
            참석이 어려워졌나요?
          </h1>
          {/* 맥락 = 팩트 한 줄 (서비스 설명톤은 케이스스터디로) */}
          {slot && (
            <p className="mt-1 text-[13px] text-ink-soft">
              지금 확정{" "}
              <b className="font-bold text-ink">
                {DAY_LABEL[slot.day]} {timeLabel(slot.time)}
              </b>
            </p>
          )}

          {/* 주최자: 누가 어려운지 고르기 */}
          {isHost && (
            <div className="mt-4">
              <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">
                누가 참석이 어려운가요?
              </label>
              <select
                value={who}
                onChange={(e) => pickWho(e.target.value)}
                className="w-full rounded-[10px] border border-edge px-3 py-2.5 text-[16px] font-semibold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {roster.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.required ? " · 필수" : " · 선택"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isHost ? (
            <button
              onClick={submit}
              className="mt-5 w-full rounded-[10px] bg-ink py-3 text-[16px] font-bold text-white transition hover:bg-[#33291F]"
            >
              조정안 보기
            </button>
          ) : (
            <>
              {/* 행동 선택지 — 설계 논리 대신 '무엇을 할지'만 */}
              <p className="mt-4 text-[13px] font-bold text-ink">
                {whoRequired
                  ? `${whoName}님은 꼭 필요한 분이에요. 다른 시간을 제안해볼까요?`
                  : "다른 시간을 제안하거나, 나 없이 진행하도록 알릴 수 있어요."}
              </p>

              <div className="mt-2.5 space-y-1.5">
                {alternatives.length === 0 && whoRequired && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] leading-relaxed text-amber-700">
                    받아둔 응답만으론 다들 되는 다른 시간이 없어요. 개인 메시지로
                    알리거나, 주최자가 후보 기간을 넓혀야 해요.
                  </p>
                )}

                {/* 대안 시간 Top 2~3 (다들 되는 시간) */}
                {alternatives.map((r) => {
                  const on = choices.includes(r.key);
                  return (
                    <button
                      key={r.key}
                      onClick={() => toggle(r.key)}
                      className={optClass(on)}
                    >
                      {checkbox(on)}
                      <span className="text-[13px] font-bold text-ink">
                        {DAY_LABEL[r.day]} {timeLabel(r.time)}
                      </span>
                      <span className="ml-auto text-[13px] font-semibold text-ok-ink">
                        다들 가능
                      </span>
                    </button>
                  );
                })}

                {/* 선택 참석자 — 불참 허용 */}
                {!whoRequired && (
                  <button
                    onClick={() => toggle("drop")}
                    className={optClass(choices.includes("drop"))}
                  >
                    {checkbox(choices.includes("drop"))}
                    <span className="text-[13px] font-bold text-ink">
                      나 없이 진행해도 괜찮아요
                    </span>
                    <span className="ml-auto text-[13px] font-semibold text-ink-faint">
                      시간 그대로
                    </span>
                  </button>
                )}
              </div>

              {/* 주 CTA */}
              <button
                onClick={submit}
                disabled={choices.length === 0}
                className="mt-5 w-full rounded-[10px] bg-ink py-3 text-[16px] font-bold text-white transition hover:bg-[#33291F] disabled:cursor-not-allowed disabled:bg-sand-200 disabled:text-ink-faint"
              >
                {choices.length === 1 && choices[0] === "drop"
                  ? "나 없이 진행하도록 알리기"
                  : `이 시간${
                      choices.filter((c) => c !== "drop").length > 1 ? "들" : ""
                    }을 주최자에게 제안하기`}
              </button>

              {/* DM — 구조화 제안 대신 개인적으로 알리고 싶을 때 */}
              <button
                onClick={onClose}
                className="mt-2 w-full rounded-[10px] border border-edge py-2.5 text-[13px] font-bold text-ink-soft transition hover:bg-sand-50"
              >
                주최자에게 개인 메시지
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
