import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useApp } from "../store";
import { DAY_LABEL, slotKorean, timeLabel } from "../data";
import { parseKey, type SlotResult } from "../engine";
import {
  changeAnnounceLine,
  confirmedLine,
  requestLine,
} from "../copy";
import { Badge, Icon, personAvatar } from "../ui";

/**
 * 채널 #커머스팀 타임라인 — 관점(주최자/참석자)에 따라 다르게 그린다.
 *  - 추천은 주최자에게만 보이는 에페메럴("나에게만 보여요"). 정해야 채널 공지로.
 *  - 정하기/변경은 풀스크린 전환 없이 이 자리에서 인라인.
 *  - 참석자 관점은 "받은 것"만 본다: 요청 카드(ⓐ), 확정 공지(ⓑ).
 */

/* ---------- 사람 메시지 (정적·뮤트) ---------- */
function HumanMessage({
  name,
  time,
  children,
}: {
  name: string;
  time: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2.5 px-1">
      <span
        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[13px] font-bold ${personAvatar(
          name,
        )}`}
      >
        {name.slice(-2)}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-ink-soft">{name}</span>
          <span className="text-[13px] text-ink-faint">{time}</span>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-soft">{children}</p>
      </div>
    </div>
  );
}

/* ---------- 봇 메시지 래퍼 (밝은 무대 · 채널 공개) ---------- */
function BotMessage({ time, children }: { time: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="flex gap-2.5 px-1"
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ink text-[16px] font-bold text-white shadow-sm">
        42
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-ink">42</span>
          <span className="rounded bg-brand-50 px-1 text-[13px] font-bold text-brand-600">
            앱
          </span>
          <span className="text-[13px] text-ink-faint">{time}</span>
        </div>
        <div className="mt-1.5 max-w-[560px]">{children}</div>
      </div>
    </motion.div>
  );
}

/* ---------- 에페메럴 래퍼 (주최자에게만 · "나에게만 보여요") ---------- */
function EphemeralMessage({
  time,
  children,
}: {
  time: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="flex gap-2.5 px-1"
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ink text-[16px] font-bold text-white shadow-sm">
        42
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-ink">42</span>
          {/* '나에게만 보여요' = navy 배지 폐기 → eye 아이콘 + 웜뉴트럴 pill */}
          <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2 py-0.5 text-[13px] font-semibold text-ink-soft">
            <Icon name="eye" size={13} /> 나에게만 보여요
          </span>
          <span className="text-[13px] text-ink-faint">{time}</span>
        </div>
        {/* 에페메럴 = 점선 스트로크 폐기 → 은은한 틴트 면으로 구분(상태=스트로크 금지) */}
        <div className="mt-2 max-w-[560px] rounded-2xl bg-sand-50 p-1.5">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- 응답 현황 (N/전체 + 진행바 + 체크 태그) ----------
   팀 전체 공개. animateFill = 주최자 요청 직후 1/6에서 하나씩 채워 6/6 (한소희 마지막).
   순간이동 금지 · 압박/설계논리 문구 없음 — 회색 태그만으로 미응답 전달. */
function ResponseRoster({ animateFill = false }: { animateFill?: boolean }) {
  const { state } = useApp();
  const roster = state.attendees.filter((a) => !a.excluded);
  const total = roster.length;
  const realDone = state.responded.filter((id) =>
    roster.some((a) => a.id === id),
  ).length;
  // 채워지는 순서 — 외근자 한소희를 마지막으로 (5/6에서 잠깐 회색 → 6/6)
  const fillOrder = [...roster].sort(
    (a, b) => (a.id === "sohee" ? 1 : 0) - (b.id === "sohee" ? 1 : 0),
  );

  const [shown, setShown] = useState(animateFill ? 1 : realDone);
  useEffect(() => {
    if (!animateFill) {
      setShown(realDone);
      return;
    }
    setShown(1); // "1/6 · 요청을 보냈어요"로 시작
    const timers: number[] = [];
    for (let n = 2; n <= total; n++) {
      timers.push(window.setTimeout(() => setShown(n), 700 * (n - 1)));
    }
    return () => timers.forEach((t) => clearTimeout(t));
  }, [animateFill, realDone, total]);

  const done = animateFill ? shown : realDone;
  const doneIds = new Set(fillOrder.slice(0, done).map((a) => a.id));
  const allIn = done >= total;

  return (
    <>
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="font-bold text-ink-soft">
          {total}명 중 <span className="text-brand-600">{done}명</span> 응답
        </span>
        {allIn ? (
          <span className="inline-flex items-center gap-1 font-semibold text-ok-ink">
            전원 응답 완료 <Icon name="check" size={14} />
          </span>
        ) : done <= 1 ? (
          <span className="text-ink-faint">요청을 보냈어요</span>
        ) : null}
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-sand-100">
        <motion.div
          className="h-full rounded-full bg-brand-500"
          initial={false}
          animate={{ width: `${(done / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {roster.map((a) => {
          const ok = doneIds.has(a.id);
          return (
            <span
              key={a.id}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px] font-semibold transition-colors ${
                ok
                  ? "bg-ok text-ok-ink ring-1 ring-ok-ink/20"
                  : "bg-wait text-wait-ink"
              }`}
            >
              {ok ? <Icon name="check" size={13} /> : "…"} {a.name}
            </span>
          );
        })}
      </div>
    </>
  );
}

/* ---------- 요청 카드 (주최자 관점 · 응답 진행도) ---------- */
function RequestProgress() {
  const { state } = useApp();
  const roster = state.attendees.filter((a) => !a.excluded);
  const total = roster.length;
  // 아직 전원이 응답 전이면(수집 단계) 1→6 채우기 애니메이션
  const realDone = state.responded.filter((id) =>
    roster.some((a) => a.id === id),
  ).length;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
      <div className="border-b border-line-soft px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold tracking-[-0.01em] text-ink">
            회의 시간 요청
          </span>
          <Badge tone="slate" className="!px-2 !py-0.5">
            참석자 {total}명
          </Badge>
        </div>
        <p className="mt-1 text-[13px] font-bold text-ink">
          {state.title}
        </p>
        <p className="text-[13px] text-ink-faint">
          {state.durationLabel} · {state.rangeLabel} · 주최{" "}
          {state.attendees[0].name}
        </p>
      </div>

      <div className="px-4 py-3">
        <ResponseRoster animateFill={realDone < total} />
      </div>
    </div>
  );
}

/* ---------- 에페메럴 추천 (주최자 · 하나 크게 + 더보기) ---------- */
function EphemeralReco({
  onDecide,
  onDetails,
}: {
  onDecide: () => void;
  onDetails: () => void;
}) {
  const { state, derived } = useApp();
  const best = derived.top[0];
  const others = Math.max(0, derived.top.length - 1);
  const roster = state.attendees.filter((a) => !a.excluded);
  const hasOptional = roster.some((a) => !a.required);
  const who = hasOptional ? "필수 참석자" : "다들"; // park: 선택 없으면 '다들'

  // L3 — 성립 0(필수 전원 되는 시간 없음): 정직 + 조정 레버(변경 플로우 재사용)
  if (!best) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-avoid-ink/20">
        <div className="border-b border-line-soft bg-avoid/60 px-4 py-3">
          <p className="text-[13px] font-bold tracking-[-0.01em] text-ink">
            {who}가 모두 참석하는 시간은 없어요.
          </p>
          <p className="text-[13px] text-ink-soft">
            지금 받은 응답으론 다 되는 시간이 없어요 — 가장 가까운 시간으로
            조정해볼까요?
          </p>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onDetails}
              className="rounded-[10px] border border-edge px-3 py-2 text-[13px] font-bold text-ink-soft transition hover:bg-sand-50"
            >
              후보 기간 넓히기
            </button>
            <button
              onClick={onDetails}
              className="rounded-[10px] border border-edge px-3 py-2 text-[13px] font-bold text-ink-soft transition hover:bg-sand-50"
            >
              참석자 조정
            </button>
          </div>
        </div>
      </div>
    );
  }

  const perfect = best.softViolations === 0; // L1 여부
  const avoidNames = best.softNames.map((n) => `${n}님`).join("·");

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-100">
      <div className="border-b border-line-soft bg-gradient-to-r from-brand-50/80 to-white px-4 py-3">
        <p className="text-[13px] font-bold tracking-[-0.01em] text-ink">
          {roster.length}명 모두 답했어요.
        </p>
        {/* 긍정 프레임 — 참석 가능(피하고 싶은 건 아래 WHY로) */}
        <p className="text-[13px] text-ink-soft">
          다들 참석할 수 있는 시간이에요.
        </p>
      </div>

      <div className="px-4 py-4">
        <div className="text-3xl font-bold tracking-[-0.01em] text-ink">
          {DAY_LABEL[best.day]} {timeLabel(best.time)}
        </div>
        {/* WHY — L2에서만: 누가 피하고 싶어했는지 (△ + 투명) */}
        {!perfect && avoidNames && (
          <p className="mt-2 flex items-start gap-1.5 text-[13px] font-semibold text-ink-soft">
            <Icon
              name="triangle"
              size={12}
              filled
              className="mt-0.5 shrink-0 text-avoid-ink"
            />
            {avoidNames}이 피하고 싶어 한 시간이에요.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={onDetails}
            className="inline-flex items-center gap-1 rounded-[10px] px-3 py-3 text-[13px] font-bold text-brand-600 transition hover:bg-brand-50"
          >
            다른 시간 보기{others > 0 ? ` (${others})` : ""}
            <Icon name="arrow-right" size={16} />
          </button>
          <button
            onClick={onDecide}
            className="rounded-[10px] bg-ink px-4 py-3 text-[13px] font-bold text-white transition hover:bg-[#33291F]"
          >
            이 시간으로 정하기
          </button>
        </div>
        <p className="mt-2 text-[13px] text-ink-faint">
          정하면 채널에 바로 알려드려요.
        </p>
      </div>
    </div>
  );
}

/* ---------- 캘린더 추가 버튼 — 누르면 초록 체크로 '추가됨' 활성 상태 ---------- */
function AddToCalendarButton({
  className = "",
  onAdd,
}: {
  className?: string;
  onAdd?: () => void;
}) {
  const [added, setAdded] = useState(false);
  return (
    <button
      onClick={() => {
        setAdded(true);
        onAdd?.();
      }}
      aria-pressed={added}
      className={`inline-flex items-center gap-1 rounded-[10px] px-3 py-1.5 text-[13px] font-bold transition ${
        added
          ? "bg-ok text-ok-ink ring-1 ring-ok-ink/20"
          : "bg-ink text-white hover:bg-[#33291F]"
      } ${className}`}
    >
      {added ? (
        <>
          <Icon name="check" size={14} /> 캘린더에 추가됨
        </>
      ) : (
        "캘린더에 추가"
      )}
    </button>
  );
}

/* ---------- 확정 공지 (채널 공개) + 변경 진입 ---------- */
function ConfirmedAnnouncement({
  r,
  showChangeEntry,
  onChangeEntry,
  onCalendar,
  muted,
}: {
  r: SlotResult;
  showChangeEntry: boolean;
  onChangeEntry: () => void;
  onCalendar: () => void;
  muted?: boolean;
}) {
  const { state } = useApp();
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70 ${
        muted ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ok text-lg text-ok-ink">
          <Icon name="calendar-check" size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink">
            회의가 정해졌어요 — {DAY_LABEL[r.day]} {timeLabel(r.time)}
          </p>
        </div>
        {!muted && (
          <AddToCalendarButton className="ml-auto shrink-0" onAdd={onCalendar} />
        )}
      </div>

      {/* 배려 있는 확정 문구 — 누가 양보했는지 콕 집지 않고, 화상도 2등화 안 함 */}
      <div className="border-t border-line-soft px-4 py-3">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          {confirmedLine(state.title, slotKorean(r.day, r.time))}
        </p>
      </div>

      {/* 빠져나갈 구멍은 항상 — 확정은 잠금이 아니다 */}
      {showChangeEntry && !muted && (
        <div className="flex items-center gap-2 border-t border-line-soft bg-sand-50/70 px-4 py-3">
          <span className="text-[13px] text-ink-faint">
            참석이 어려워지면 언제든 바꿀 수 있어요.
          </span>
          <button
            onClick={onChangeEntry}
            className="ml-auto rounded-[10px] px-2.5 py-1.5 text-[13px] font-bold text-ink-faint transition hover:bg-sand-50 hover:text-brand-600"
          >
            참석 어려워요 / 시간 조정
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- 재조율 사다리 (주최자 · 에페메럴 · 방해 최소순) ---------- */
function ReCoordCard() {
  const { derived, dispatch, state } = useApp();
  const rc = derived.recoord;
  if (!rc) return null;
  const name = rc.changer.name;
  const others = state.attendees.filter((a) => !a.excluded).length - 1;

  const Option = ({
    order,
    title,
    note,
    tone,
    cta,
    onClick,
  }: {
    order: number;
    title: string;
    note: string;
    tone: "emerald" | "amber" | "brand";
    cta: string;
    onClick: () => void;
  }) => {
    const ring = {
      emerald: "ring-ok-ink/20",
      amber: "ring-amber-200",
      brand: "ring-brand-100",
    }[tone];
    return (
      <div
        className={`flex items-center gap-3 rounded-xl bg-white px-3 py-3 ring-1 ${ring}`}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand-100 text-[13px] font-bold text-ink-soft">
          {order}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink">{title}</p>
          <p className="text-[13px] text-ink-faint">{note}</p>
        </div>
        <button
          onClick={onClick}
          className="ml-auto shrink-0 rounded-[10px] bg-ink px-3 py-1.5 text-[13px] font-bold text-white transition hover:bg-[#33291F]"
        >
          {cta}
        </button>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-100">
      <div className="border-b border-line-soft bg-gradient-to-r from-brand-50/80 to-white px-4 py-3">
        <p className="text-[13px] font-bold tracking-[-0.01em] text-ink">
          {name}님이 참석이 어려워졌어요
        </p>
        <p className="text-[13px] text-ink-soft">
          받아둔 응답으로 바로 정리했어요. 가장 적게 흔드는 순서로 골랐어요.
        </p>
      </div>
      <div className="space-y-2 px-4 py-4">
        {rc.canDrop && (
          <Option
            order={1}
            tone="emerald"
            title={`그 시간 그대로, ${name}님만 이번엔 빠짐`}
            note={`선택 참석자라 제외해도 나머지 ${others}명은 그대로 진행돼요 · 결과는 공유`}
            cta="이대로 유지"
            onClick={() => dispatch({ type: "RESOLVE_CHANGE", kind: "drop" })}
          />
        )}
        {rc.newSlot ? (
          // 새 시간은 메인 추천처럼 크게 — "새로 추천"은 작은 라벨, WHY 한 줄.
          <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-brand-100">
            <div className="flex items-center gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand-100 text-[13px] font-bold text-ink-soft">
                {rc.canDrop ? 2 : 1}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-brand-500">새로 추천</p>
                <p className="text-xl font-bold tracking-[-0.01em] text-ink">
                  {DAY_LABEL[rc.newSlot.day]} {timeLabel(rc.newSlot.time)}
                </p>
              </div>
              <button
                onClick={() =>
                  dispatch({
                    type: "RESOLVE_CHANGE",
                    kind: "reschedule",
                    newKey: rc.newSlot!.key,
                  })
                }
                className="ml-auto shrink-0 rounded-[10px] bg-ink px-3 py-2 text-[13px] font-bold text-white transition hover:bg-[#33291F]"
              >
                이 시간으로 변경
              </button>
            </div>
            <p className="mt-2 text-[13px] text-ink-soft">
              {name}님도 올 수 있는 다음 시간이에요 · 재수집 없이 바로 찾았어요.
            </p>
          </div>
        ) : (
          !rc.canDrop && (
            <p className="rounded-xl bg-amber-50 px-3 py-3 text-[13px] text-amber-700">
              필수 참석자라 제외할 수 없어요. 후보 기간을 넓히거나 참석자를 다시
              정할 수 있어요.
            </p>
          )
        )}
        <button
          onClick={() => dispatch({ type: "CANCEL_CHANGE" })}
          className="w-full rounded-[10px] px-3 py-2 text-[13px] font-semibold text-ink-faint transition hover:bg-sand-50"
        >
          아직 그대로 둘게요
        </button>
        {/* 조정이 안 될 때의 마지막 갈래 — 라이트하게 회의 취소 */}
        <button
          onClick={() => dispatch({ type: "RESOLVE_CHANGE", kind: "cancel" })}
          className="w-full rounded-[10px] px-3 py-2 text-[13px] font-semibold text-ink-faint transition hover:bg-rose-50 hover:text-rose-500"
        >
          이 회의는 취소할게요
        </button>
      </div>
      <div className="border-t border-line-soft px-4 py-2">
        <p className="text-[13px] text-ink-faint">
          정하면 모두에게 자동으로 알리고 캘린더도 갱신돼요.
        </p>
      </div>
    </div>
  );
}

/* ---------- 회의 취소 카드 (조정 실패 결과 · 라이트) ---------- */
function CancelledAnnouncement() {
  const { state } = useApp();
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger text-lg text-danger-ink">
          <Icon name="x" size={16} />
        </span>
        <p className="text-[13px] font-bold text-ink">
          회의가 취소됐어요
        </p>
      </div>
      <div className="border-t border-line-soft px-4 py-3">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          {changeAnnounceLine("cancel", state.title, "", "", "")}
        </p>
      </div>
    </div>
  );
}

/* ---------- 변경 공지 (채널 공개 · 중립) ---------- */
function ChangeAnnouncement() {
  const { state } = useApp();
  const lc = state.lastChange;
  if (!lc) return null;
  if (lc.kind === "cancel") return <CancelledAnnouncement />;
  const from = parseKey(lc.fromKey);
  const to = parseKey(lc.toKey);
  const line = changeAnnounceLine(
    lc.kind,
    state.title,
    lc.attendeeName,
    slotKorean(from.day, from.time),
    slotKorean(to.day, to.time),
  );
  const calCta = lc.kind === "reschedule" ? "캘린더 갱신" : "캘린더 유지";
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-lg text-brand-600">
          <Icon name="refresh-cw" size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink">
            회의 시간이 조정됐어요
          </p>
        </div>
        <button className="ml-auto shrink-0 rounded-[10px] bg-ink px-3 py-1.5 text-[13px] font-bold text-white transition hover:bg-[#33291F]">
          {calCta}
        </button>
      </div>
      <div className="border-t border-line-soft px-4 py-3">
        <p className="text-[13px] leading-relaxed text-ink-soft">{line}</p>
      </div>
    </div>
  );
}

/* ---------- 참석자 수신: ⓐ 요청 카드 받은 상태 ---------- */
function ReceivedRequest({ onRespond }: { onRespond: () => void }) {
  const { state } = useApp();
  const me = state.attendees.find((a) => a.id === state.activeAttendeeId)!;
  const host = state.attendees[0];
  const iResponded = state.responded.includes(me.id);
  const roster = state.attendees.filter((a) => !a.excluded);
  const allIn = roster.every((a) => state.responded.includes(a.id));

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-100">
      <div className="px-4 py-4">
        <p className="text-[16px] font-bold leading-relaxed text-ink">
          {requestLine(host.name, state.title)}
        </p>
        <p className="mt-1 text-[13px] text-ink-faint">
          {state.durationLabel} · {state.rangeLabel}
        </p>

        {iResponded ? (
          <div className="mt-3 rounded-xl bg-ok px-3 py-3 text-[13px] font-semibold text-ok-ink">
            <Icon
              name="check"
              size={14}
              className="mr-0.5 inline align-text-bottom"
            />{" "}
            {me.name}님 응답 완료 —{" "}
            {allIn
              ? "주최자가 시간을 정하는 중이에요."
              : "나머지 참석자를 기다리는 중이에요."}
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onRespond}
              className="rounded-[10px] bg-ink px-4 py-3 text-[13px] font-bold text-white transition hover:bg-[#33291F]"
            >
              응답하기
            </button>
            <span className="text-[13px] text-ink-faint">
              가능한 시간은 따로 선택하지 않아도 돼요.
            </span>
          </div>
        )}
      </div>

      {/* 응답 현황 — 참석자도 팀 전체 공개 상태를 봄 (같은 데이터, 표면만 다름) */}
      <div className="border-t border-line-soft px-4 py-3">
        <ResponseRoster />
      </div>
    </div>
  );
}

/* ---------- 참석자 수신: ⓑ 확정 공지 받은 상태 ---------- */
function ReceivedConfirmed({
  r,
  onChangeEntry,
}: {
  r: SlotResult;
  onChangeEntry: () => void;
}) {
  const { state } = useApp();
  const me = state.attendees.find((a) => a.id === state.activeAttendeeId)!;
  const myState = r.states.find((s) => s.attendee.id === me.id);
  const raised = state.change?.attendeeId === me.id;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ok text-lg text-ok-ink">
          <Icon name="calendar-check" size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink">
            {DAY_LABEL[r.day]} {timeLabel(r.time)}로 정해졌어요
          </p>
        </div>
        {myState && (
          <span
            className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[13px] font-semibold ring-1 ring-inset ${
              myState.available
                ? "bg-ok text-ok-ink ring-ok-ink/20"
                : "bg-block text-block-ink ring-block-ink/15"
            }`}
          >
            {myState.available ? "참석 가능" : "이 시간은 어려워요"}
          </span>
        )}
      </div>
      <div className="border-t border-line-soft px-4 py-3">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          {confirmedLine(state.title, slotKorean(r.day, r.time))}
        </p>
      </div>

      {/* 두 액션 한 줄 — 참석 어려워요(부·좌, escape hatch 상시)
          ··· 캘린더에 추가(주·우, 전진/확정 관례 + 균형). */}
      <div className="flex items-center gap-2 border-t border-line-soft bg-sand-50/70 px-4 py-3">
        {raised ? (
          <span className="text-[13px] font-semibold text-brand-600">
            조정 요청을 보냈어요 · 주최자가 조율 중이에요.
          </span>
        ) : (
          <button
            onClick={onChangeEntry}
            className="rounded-[10px] px-2.5 py-1.5 text-[13px] font-bold text-ink-faint transition hover:bg-sand-50 hover:text-brand-600"
          >
            참석 어려워요
          </button>
        )}
        <AddToCalendarButton className="ml-auto" />
      </div>
    </div>
  );
}

/* ---------- 타임라인 ---------- */
export default function Channel({
  onRespond,
  onDecide,
  onDetails,
  onChangeEntry,
}: {
  onRespond: () => void;
  onDecide: () => void;
  onDetails: () => void;
  onChangeEntry: () => void;
}) {
  const { state, derived } = useApp();
  const isHost = state.viewAs === "host";
  const sent = state.screen !== "create";
  const roster = state.attendees.filter((a) => !a.excluded);
  const allIn = roster.every((a) => state.responded.includes(a.id));
  const confirmed = state.confirmedKey !== null;
  const confirmedResult = confirmed
    ? derived.results.find((r) => r.key === state.confirmedKey) ?? null
    : null;
  const changing = state.change !== null;
  const changed = state.lastChange !== null;

  return (
    <div className="flex max-w-3xl flex-col gap-4 px-4 py-5 md:px-6">
      {/* 채널 시작 안내 (정적) — 좌측 정렬(채팅과 동일, 슬랙 채널 인트로 패턴) */}
      <div className="pb-1">
        <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-sand-200 text-lg font-bold text-ink-soft">
          #
        </div>
        <p className="text-[13px] font-bold text-ink-soft">
          #커머스팀 채널의 시작이에요
        </p>
        <p className="text-[13px] text-ink-faint">
          42 봇이 이 채널에 추가됐어요.
        </p>
      </div>

      {/* 사람 대화 (뮤트) — 회의와 무관한 일반 잡담 */}
      <HumanMessage name="이가영" time="오전 9:12">
        다들 좋은 아침이에요. 날씨 좋은데 점심 같이 나갈 사람?
      </HumanMessage>
      <HumanMessage name="정지훈" time="오전 9:14">
        저요! 어제 공유해주신 거 잘 봤어요. 이따 짧게 얘기 나눠요
      </HumanMessage>
      <HumanMessage name="최민영" time="오전 9:15">
        오 좋아요. 저도 몇 개 메모해뒀어요
      </HumanMessage>

      {/* create 단계: 아직 봇 카드 없음 — 안내 문구 없이 자연스러운 채널 상태.
          진행은 컴포저의 '회의 만들기' CTA(디제틱) + Demo 바 단계가 안내한다. */}

      {/* ===== 주최자 관점 ===== */}
      {isHost && sent && (
        <BotMessage time="오전 9:46">
          <RequestProgress />
        </BotMessage>
      )}
      {isHost && sent && allIn && !confirmed && !changed && (
        <EphemeralMessage time="오전 10:02">
          <EphemeralReco onDecide={onDecide} onDetails={onDetails} />
        </EphemeralMessage>
      )}
      {isHost && confirmedResult && (
        <BotMessage time="오전 10:03">
          <ConfirmedAnnouncement
            r={confirmedResult}
            showChangeEntry={!changed}
            onChangeEntry={onChangeEntry}
            onCalendar={() => {}}
            muted={changing || changed}
          />
        </BotMessage>
      )}
      {isHost && changing && (
        <EphemeralMessage time="오전 10:05">
          <ReCoordCard />
        </EphemeralMessage>
      )}
      {isHost && changed && (
        <BotMessage time="오전 10:06">
          <ChangeAnnouncement />
        </BotMessage>
      )}

      {/* ===== 참석자 수신 관점 ===== */}
      {!isHost && sent && !confirmed && !changed && (
        <BotMessage time="오전 9:46">
          <ReceivedRequest onRespond={onRespond} />
        </BotMessage>
      )}
      {!isHost && confirmedResult && (
        <BotMessage time="오전 10:03">
          <ReceivedConfirmed r={confirmedResult} onChangeEntry={onChangeEntry} />
        </BotMessage>
      )}
      {!isHost && changed && (
        <BotMessage time="오전 10:06">
          <ChangeAnnouncement />
        </BotMessage>
      )}
    </div>
  );
}
