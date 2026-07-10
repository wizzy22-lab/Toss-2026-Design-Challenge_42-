import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useApp } from "../store";
import { DAYS, DAY_LABEL, TIMES, timeLabel, slotKorean } from "../data";
import { topRecommendations, type SlotResult } from "../engine";
import type { TimeSlot } from "../types";
import { Icon } from "../ui";

type Tip = { r: SlotResult; x: number; y: number };

/* ---------- 히트맵 셀 (읽기 전용 · 톤(스트로크 X) · 호버 시 셀 위 툴팁) ---------- */
function HeatCell({
  r,
  confirmed,
  onHover,
}: {
  r: SlotResult;
  confirmed: boolean;
  onHover?: (t: Tip | null) => void;
}) {
  let tint = "bg-sand-50 text-ink-faint";
  let label = "";
  if (!r.requiredAllIn) {
    tint = "hatch bg-sand-50"; // 안 되는 사람 있음
  } else if (r.feasible && r.softViolations > 0) {
    tint = "bg-avoid text-avoid-ink"; // 아쉬운 사람 있음
    label = String(r.softViolations);
  } else if (r.feasible) {
    tint = "bg-ok"; // 다 돼요
  }
  return (
    <div
      onMouseEnter={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        onHover?.({ r, x: b.left + b.width / 2, y: b.top });
      }}
      onMouseLeave={() => onHover?.(null)}
      className={`flex h-9 cursor-default items-center justify-center rounded-lg text-[13px] font-bold transition ${tint} ${
        confirmed ? "ring-2 ring-brand-500 ring-offset-1" : "hover:brightness-95"
      }`}
    >
      {label}
    </div>
  );
}

/* 호버 툴팁 카드 (셀 바로 위) — ✕ 불가 / ▲ 피하고 싶어요 */
function TipCard({ r }: { r: SlotResult }) {
  const blocked = r.states
    .filter((s) => !s.available)
    .map((s) => s.attendee.name);
  const soft = r.states.filter((s) => s.soft).map((s) => s.attendee.name);
  const empty = !blocked.length && !soft.length;
  return (
    <div className="relative w-max max-w-[220px] rounded-lg bg-ink px-2.5 py-1.5 text-[13px] font-semibold leading-snug text-white shadow-pop">
      <div className="mb-1 font-bold text-white/55">
        {slotKorean(r.day, r.time)}
      </div>
      {empty ? (
        <div>다들 가능한 시간이에요</div>
      ) : (
        <div className="space-y-0.5">
          {blocked.length > 0 && (
            <div className="flex items-start gap-1">
              <Icon name="x" size={12} className="mt-0.5 shrink-0 text-white/70" />
              <span>{blocked.join("·")}</span>
            </div>
          )}
          {soft.length > 0 && (
            <div className="flex items-start gap-1">
              <Icon
                name="triangle"
                size={10}
                filled
                className="mt-0.5 shrink-0 text-avoid"
              />
              <span>{soft.join("·")}</span>
            </div>
          )}
        </div>
      )}
      {/* 아래 화살표 */}
      <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-ink" />
    </div>
  );
}

/* ---------- 회의 시간 정하기 (모달) ----------
   답-먼저 한 스크롤: 추천 하나 크게 → 대안(탭하면 top으로 승격 · FLIP) → 전체 히트맵 → 참석자 요약. */
export default function Dashboard({ onClose }: { onClose: () => void }) {
  const { state, dispatch, derived } = useApp();
  const { results } = derived;
  const reduce = useReducedMotion();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);

  const byKey = useMemo(() => {
    const m = new Map<string, SlotResult>();
    results.forEach((r) => m.set(r.key, r));
    return m;
  }, [results]);

  // 성립 슬롯 전체를 회피 적은 순으로 (덤프 금지 → 상위 3만 노출)
  const sorted = useMemo(
    () => topRecommendations(results, results.length),
    [results],
  );
  const feasibleCount = sorted.length;
  const best = sorted[0] ?? null;
  const sel = (selectedKey && sorted.find((r) => r.key === selectedKey)) || best;

  // 선택한 카드를 top으로 승격한 순서 (FLIP 레이아웃 애니 대상)
  const ordered = sel ? [sel, ...sorted.filter((r) => r.key !== sel.key)] : [];
  const visible = expanded ? ordered : ordered.slice(0, 3);
  const moreCount = ordered.length - 3;

  const roster = state.attendees.filter((a) => !a.excluded);
  // park: 선택 참석자 있으면 "필참자는 모두", 없으면(전원 필참) "다들"
  const hasOptional = roster.some((a) => !a.required);
  const availLine = hasOptional
    ? "필참자는 모두 참석할 수 있어요."
    : "다들 참석할 수 있어요.";

  const confirm = (key: string) => {
    dispatch({ type: "CONFIRM", key });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="relative z-10 flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-line/70"
      >
        {/* 헤더 */}
        <div className="flex items-center gap-2 border-b border-line-soft px-6 py-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-[-0.01em]">
              회의 시간 정하기
            </h1>
            <p className="truncate text-[13px] text-ink-faint">{state.title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-ink-faint transition hover:bg-sand-100"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {sel ? (
            <>
              <p className="text-[13px] font-semibold text-ink-soft">
                다 되는 시간 {feasibleCount}개 찾았어요 · 이 중에 정하면 돼요
              </p>

              {/* 추천 + 대안 — 탭하면 top으로 슬라이드 승격(FLIP). '추천' 배지는 객관적 1등에 유지 */}
              <div className="mt-3 space-y-2">
                {visible.map((r) => {
                  const isHero = r.key === sel.key;
                  const isBest = r.key === best?.key;
                  return (
                    <motion.div
                      key={r.key}
                      layout={!reduce}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                      className={`overflow-hidden rounded-2xl ${
                        isHero ? "bg-brand-50" : "bg-sand-50"
                      }`}
                    >
                      {isHero ? (
                        <div className="p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-2xl font-bold tracking-[-0.01em] text-ink">
                              {slotKorean(r.day, r.time)}
                            </span>
                            {isBest ? (
                              <span className="rounded-full bg-recommend px-2 py-0.5 text-[13px] font-bold text-recommend-ink">
                                추천
                              </span>
                            ) : (
                              <span className="rounded-full bg-ink px-2 py-0.5 text-[13px] font-bold text-white">
                                선택됨
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-[13px] text-ink-soft">
                            {availLine}
                          </p>
                          {r.softViolations > 0 && (
                            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-avoid-ink">
                              <Icon name="triangle" size={12} filled />
                              {r.softNames.map((n) => `${n}님`).join("·")}
                            </p>
                          )}
                          <button
                            onClick={() => confirm(r.key)}
                            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink text-[16px] font-bold text-white transition hover:bg-[#33291F]"
                          >
                            이 시간으로 정하기
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedKey(r.key)}
                          className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 text-left transition hover:bg-[#F2EAE2]"
                        >
                          <span className="text-[16px] font-bold text-ink">
                            {slotKorean(r.day, r.time)}
                          </span>
                          {isBest && (
                            <span className="rounded-full bg-recommend px-2 py-0.5 text-[13px] font-bold text-recommend-ink">
                              추천
                            </span>
                          )}
                          <span className="text-[13px] text-ink-soft">
                            {availLine}
                          </span>
                          {r.softViolations > 0 && (
                            <span className="ml-auto flex items-center gap-1 text-[13px] font-semibold text-avoid-ink">
                              <Icon name="triangle" size={11} filled />
                              {r.softViolations}명
                            </span>
                          )}
                        </button>
                      )}
                    </motion.div>
                  );
                })}

                {/* 3개 이상 성립 시 — 전부 덤프 대신 더 보기 링크 */}
                {!expanded && moreCount > 0 && (
                  <button
                    onClick={() => setExpanded(true)}
                    className="flex w-full items-center justify-center gap-1 rounded-2xl bg-sand-50 px-4 py-2.5 text-[13px] font-bold text-brand-600 transition hover:bg-[#F2EAE2]"
                  >
                    다른 시간 더 보기 ({moreCount})
                    <Icon name="chevron-down" size={14} />
                  </button>
                )}
              </div>

              {/* 전체 시간 히트맵 (톤) — 칸 호버 시 누가 불가/피하고 싶어 하는지 */}
              <div className="mt-6">
                <p className="mb-3 text-[13px] font-bold text-ink-soft">
                  전체 시간
                </p>
                <div className="mb-2 flex flex-wrap items-center gap-2.5 text-[13px] text-ink-soft">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-ok" /> 다 돼요
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-avoid" /> 아쉬운 사람
                    있음(숫자=인원)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="hatch h-2.5 w-2.5 rounded bg-sand-50" /> 안
                    되는 사람 있음
                  </span>
                </div>
                <div className="grid grid-cols-[36px_repeat(5,1fr)] gap-2">
                  <div />
                  {DAYS.map((d) => (
                    <div
                      key={d}
                      className="pb-1 text-center text-[13px] font-bold text-ink-soft"
                    >
                      {DAY_LABEL[d]}
                    </div>
                  ))}
                  {TIMES.map((t) => (
                    <Row
                      key={t}
                      time={t}
                      byKey={byKey}
                      confirmedKey={state.confirmedKey}
                      onHover={setTip}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[13px] text-ink-faint">
                  칸에 마우스를 올리면 누가 불가·피하고 싶어 하는지 볼 수 있어요.
                </p>
              </div>
            </>
          ) : (
            /* 성립 0 — 톤 카드 */
            <div className="rounded-2xl bg-avoid/60 p-6">
              <p className="text-[16px] font-bold text-ink">
                다 되는 시간이 없어요
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                지금 응답으론 필참자가 다 되는 시간이 없어요. 후보 기간을 넓히면
                찾을 수 있어요.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 호버 툴팁 — 셀 rect 기준 fixed 좌표, 포털로 스크롤/transform 클리핑 회피 */}
      {tip &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: tip.x,
              top: tip.y,
              transform: "translate(-50%, calc(-100% - 8px))",
            }}
            className="pointer-events-none z-[100]"
          >
            <TipCard r={tip.r} />
          </div>,
          document.body,
        )}
    </div>
  );
}

function Row({
  time,
  byKey,
  confirmedKey,
  onHover,
}: {
  time: TimeSlot;
  byKey: Map<string, SlotResult>;
  confirmedKey: string | null;
  onHover?: (t: Tip | null) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-end pr-1 text-[13px] font-semibold text-ink-faint">
        {timeLabel(time)}
      </div>
      {DAYS.map((d) => {
        const key = `${d}-${time}`;
        const r = byKey.get(key)!;
        return (
          <HeatCell
            key={key}
            r={r}
            confirmed={confirmedKey === key}
            onHover={onHover}
          />
        );
      })}
    </>
  );
}
