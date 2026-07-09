import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../store";
import { DAYS, DAY_LABEL, TIMES, slotKey, timeLabel } from "../data";
import type { Attendee, Day, TimeSlot } from "../types";
import { Badge, Icon } from "../ui";
import { addDays, atMidnight, mondayOfWeek } from "../lib/date";

// 상태 2개만: 불가(hard) / 가능하면 피해요(soft). '외근'은 상태가 아니라 이유 → 삭제.
type CellKind = "free" | "busy" | "soft";

function cellKind(a: Attendee, d: Day, t: TimeSlot): CellKind {
  const k = slotKey(d, t);
  if (a.busy.includes(k)) return "busy";
  if (a.softSlots.includes(k)) return "soft";
  return "free";
}

export default function AttendeeInput({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const { state, dispatch } = useApp();
  const me = state.attendees.find((x) => x.id === state.activeAttendeeId)!;
  const host = state.attendees[0];
  // 주최자 본인 시간 입력(만들기 직후) — 참석자와 같은 그리드를 재사용
  const isSelfHost = me.id === host.id;
  const [submitted, setSubmitted] = useState(false);

  // 입력은 로컬 드래프트 → 제출 때 스토어에 통째로 반영(추천 즉시 재계산, 제출 전엔 비파괴).
  // 미연동(캘린더 없음·한소희)은 빈칸부터, 연동자는 캘린더 자동 채움에서 시작.
  const [localBusy, setLocalBusy] = useState<string[]>(() =>
    me.linked ? [...me.busy] : [],
  );
  const [localSoft, setLocalSoft] = useState<string[]>(() =>
    me.linked ? [...me.softSlots] : [],
  );
  useEffect(() => {
    setLocalBusy(me.linked ? [...me.busy] : []);
    setLocalSoft(me.linked ? [...me.softSlots] : []);
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id]);

  const view: Attendee = {
    ...me,
    busy: localBusy,
    softSlots: localSoft,
    awayDays: [],
  };

  // 클릭 순환: 없음 → 불가 → 가능하면 피해요 → 없음. (로컬 드래프트)
  const cycle = (d: Day, t: TimeSlot) => {
    const k = slotKey(d, t);
    const kind = cellKind(view, d, t);
    if (kind === "free") setLocalBusy((s) => [...s, k]);
    else if (kind === "busy") {
      setLocalBusy((s) => s.filter((x) => x !== k));
      setLocalSoft((s) => [...s, k]);
    } else setLocalSoft((s) => s.filter((x) => x !== k));
  };

  // 초기화 = 원래 캘린더 입력 상태로 (연동자=캘린더값, 미연동자=빈칸)
  const reset = () => {
    setLocalBusy(me.linked ? [...me.busy] : []);
    setLocalSoft(me.linked ? [...me.softSlots] : []);
  };

  // 제출 = 로컬 드래프트를 스토어에 반영 → 추천이 이 응답에 즉시 반응.
  const submit = () => {
    dispatch({
      type: "SET_AVAILABILITY",
      id: me.id,
      busy: localBusy,
      softSlots: localSoft,
    });
    setSubmitted(true);
  };

  // 요일 헤더 날짜 = 후보 기간(데모 기본 '다음 주' 월~금) 반영 → 월13·화14·수15·목16·금17
  const weekDates = useMemo(() => {
    const nextMon = addDays(mondayOfWeek(atMidnight(new Date())), 7);
    return DAYS.map((_, i) => addDays(nextMon, i).getDate());
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      {/* 패널 = flex 열. 헤더·CTA는 고정, 가운데 본문만 스크롤 → CTA 잘림 방지 */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="relative z-10 flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-line/70"
      >
        {/* 헤더 (고정) — 신호등 dot·역할 스위처 제거(역할 전환은 Demo 바에서만) */}
        <div className="flex shrink-0 items-center border-b border-line-soft px-4 py-2.5">
          <span className="text-[13px] font-semibold text-ink-faint">
            회의 시간 응답
          </span>
          <button
            onClick={onClose}
            className="ml-auto grid h-6 w-6 place-items-center rounded-[10px] text-ink-faint transition hover:bg-sand-100"
            aria-label="닫기"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* 맥락 헤더 (고정) — 응답 중엔 주최 안내가 주인공,
            완료 화면에선 맥락이라 회의 제목만 작게·뮤트로 강등. */}
        {submitted ? (
          <div className="shrink-0 px-6 pt-5">
            <p className="text-[13px] font-semibold text-ink-faint">
              {state.title}
            </p>
          </div>
        ) : (
          <div className="shrink-0 px-6 pt-6">
            {/* 아이브로(회의 제목) — H1과 4로 묶음 */}
            <p className="truncate text-[13px] font-normal text-ink-faint">
              {isSelfHost ? state.title : `주최 ${host.name} · ${state.title}`}
            </p>
            {/* H1 = 입력자의 할 일 */}
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.01em]">
              {isSelfHost
                ? "안 되는 시간만 알려주세요"
                : `${me.name}님, 안 되는 시간만 알려주세요`}
            </h1>
            {/* H1 → 보조문구 = 8 */}
            <p className="mt-2 text-[13px] text-ink-soft">
              가능한 시간은 따로 선택하지 않아도 돼요.
            </p>
            {/* '일정 자동' 태그 삭제(연동자는 헬퍼 문구가 대신). 미연동자 '직접 표시'만 유지 */}
            {!me.linked && (
              <div className="mt-2">
                <Badge tone="amber" className="!px-2 !py-0.5">
                  캘린더에 일정이 없어요 · 직접 표시
                </Badge>
              </div>
            )}
          </div>
        )}

        {submitted ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Receipt me={view} onEdit={() => setSubmitted(false)} onDone={onDone} />
          </div>
        ) : (
          <>
            {/* 본문 (스크롤) — 보조문구 → 그리드 리듬 24 */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-6">
              {/* 헬퍼 — (연동자) 캘린더 안내 + 탭 사이클 칩 */}
              <div className="mb-4 rounded-xl bg-sand-50 p-3">
                {me.linked && (
                  <p className="mb-2 text-[13px] leading-relaxed text-ink-soft">
                    <b className="text-ink">
                      {isSelfHost ? "내 캘린더" : `${me.name}님의 캘린더`}를
                      불러왔어요.
                    </b>{" "}
                    안 되는 시간만 확인하고 필요한 곳만 수정해주세요.
                  </p>
                )}
                <p className="text-[13px] text-ink-soft">
                  <b className="text-ink">탭할 때마다</b> 바뀌어요
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
                  <span className="inline-flex items-center gap-1 rounded-md bg-block px-2 py-1 text-block-ink">
                    <Icon name="x" size={13} /> 불가
                  </span>
                  <Icon name="arrow-right" size={13} className="text-ink-faint" />
                  <span className="inline-flex items-center gap-1 rounded-md bg-avoid px-2 py-1 text-avoid-ink">
                    <Icon name="triangle" size={11} filled /> 피하고 싶어요
                  </span>
                  <Icon name="arrow-right" size={13} className="text-ink-faint" />
                  <span className="rounded-md border border-line px-2 py-1 text-ink-faint">
                    해제
                  </span>
                </div>
              </div>

              {/* 초기화 — 원래 캘린더 입력 상태로 되돌리기 */}
              <div className="mb-2 flex justify-end">
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1 rounded-[10px] px-2 py-1 text-[13px] font-semibold text-ink-faint transition hover:bg-sand-100 hover:text-brand-600"
                >
                  <Icon name="rotate-ccw" size={13} /> 초기화
                </button>
              </div>

              {/* 그리드 셀 gap = 8 */}
              <div className="grid grid-cols-[36px_repeat(5,1fr)] sm:grid-cols-[44px_repeat(5,1fr)] gap-2">
                <div />
                {DAYS.map((d, i) => (
                  <div
                    key={d}
                    className="pb-1 text-center text-[13px] font-bold text-ink-faint"
                  >
                    {DAY_LABEL[d]} <span className="text-ink">{weekDates[i]}</span>
                  </div>
                ))}
                {TIMES.map((t) => (
                  <GridRow key={t} t={t} me={view} onCycle={cycle} />
                ))}
              </div>
            </div>

            {/* CTA (고정 · 하단) — 다크 primary(WCAG 통과). 중복 안내문 제거 */}
            <div className="shrink-0 border-t border-line-soft bg-white px-6 pb-6 pt-4">
              <button
                onClick={submit}
                className="h-12 w-full rounded-[10px] bg-ink text-[16px] font-bold text-white transition hover:bg-[#33291F]"
              >
                이대로 공유할게요
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function GridRow({
  t,
  me,
  onCycle,
}: {
  t: TimeSlot;
  me: Attendee;
  onCycle: (d: Day, t: TimeSlot) => void;
}) {
  const styles: Record<CellKind, string> = {
    free: "border-line bg-white hover:border-sand-300",
    busy: "border-block bg-block text-block-ink", // 불가 = slate #EBE4DC + X
    soft: "border-avoid bg-avoid text-avoid-ink", // 피하고 싶어요 = 앰버 #FBEDC8 + ▲
  };
  return (
    <>
      <div className="flex items-center justify-end pr-1 text-[13px] font-semibold text-ink-faint">
        {timeLabel(t)}
      </div>
      {DAYS.map((d) => {
        const kind = cellKind(me, d, t);
        const k = slotKey(d, t);
        return (
          <button
            key={k}
            onClick={() => onCycle(d, t)}
            aria-label={
              kind === "busy" ? "불가" : kind === "soft" ? "피하고 싶어요" : "가능"
            }
            className={`flex h-12 items-center justify-center rounded-lg border transition ${styles[kind]}`}
          >
            {kind === "busy" && <Icon name="x" size={18} />}
            {kind === "soft" && <Icon name="triangle" size={15} filled />}
          </button>
        );
      })}
    </>
  );
}

function echoLine(me: Attendee): string {
  const parts: string[] = [];
  if (me.busy.length > 0) parts.push("안 되는 시간 표시 완료");
  if (me.softSlots.length > 0)
    parts.push(`가능하면 피할 시간 ${me.softSlots.length}곳`);
  if (parts.length === 0) parts.push("모든 시간 가능으로 전했어요");
  return parts.join(" · ");
}

/** 제출 내용 검증용 미니 썸네일 (읽기 전용) */
function MiniGrid({ me }: { me: Attendee }) {
  return (
    <div className="inline-block rounded-lg bg-sand-50 p-2">
      <div className="mb-1 grid grid-cols-5 gap-[3px]">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[8px] font-bold text-ink-faint"
          >
            {DAY_LABEL[d]}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-[3px]">
        {TIMES.map((t) =>
          DAYS.map((d) => {
            const kind = cellKind(me, d, t);
            let c = "bg-white";
            if (kind === "busy") c = "bg-block-ink";
            else if (kind === "soft") c = "bg-avoid-ink";
            return (
              <span key={`${d}-${t}`} className={`h-3 w-4 rounded-[2px] ${c}`} />
            );
          }),
        )}
      </div>
    </div>
  );
}

function Receipt({
  me,
  onEdit,
  onDone,
}: {
  me: Attendee;
  onEdit: () => void;
  onDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-8 text-center"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok text-ok-ink">
        <Icon name="check" size={28} />
      </div>
      <h2 className="mt-4 text-xl font-bold">{me.name}님, 다 전했어요</h2>
      <p className="mt-1 text-[16px] text-ink-soft">
        이제 모두의 시간을 모아 회의 시간을 정하고 있어요. 정해지면 바로
        알려드릴게요.
      </p>

      <div className="mt-5">
        <div className="mb-2 text-[13px] font-bold text-ink-faint">
          이렇게 표시했어요
        </div>
        <MiniGrid me={me} />
        <p className="mt-2.5 text-[13px] font-semibold text-ink-soft">
          {echoLine(me)}
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-2.5 text-[13px] text-ink-faint">
          <span className="flex items-center gap-1 text-block-ink">
            <Icon name="x" size={13} /> 불가
          </span>
          <span className="flex items-center gap-1 text-avoid-ink">
            <Icon name="triangle" size={11} filled /> 피하고 싶어요
          </span>
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-[380px] gap-2">
        <button
          onClick={onEdit}
          className="flex-1 rounded-[10px] border border-edge py-2.5 text-[16px] font-bold text-ink-soft transition hover:bg-sand-50"
        >
          다시 수정하기
        </button>
        <button
          onClick={onDone}
          className="flex-1 rounded-[10px] bg-ink py-2.5 text-[16px] font-bold text-white transition hover:bg-[#33291F]"
        >
          이제 기다릴게요
        </button>
      </div>
    </motion.div>
  );
}
