import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useApp } from "../store";
import { DAY_LABEL, TIMES, timeLabel, slotKorean } from "../data";
import type { Day } from "../types";
import {
  rankedCandidates,
  topRecommendations,
  type SlotResult,
} from "../engine";
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
    tint = "hatch bg-sand-50 text-ink-faint"; // 안 되는 사람 있음
    label = String(r.counts.out); // 숫자 = 안 되는 사람 수
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

/* ---------- 성립 0 후보 행 — 시간 + 가능/불가/피해요 칩 + secondary '이 시간으로 정하기' ---------- */
function ListRow({
  r,
  onPick,
}: {
  r: SlotResult;
  onPick: (r: SlotResult) => void;
}) {
  const blockedReq = r.states
    .filter((s) => s.attendee.required && !s.available)
    .map((s) => s.attendee.name);
  const blockedOpt = r.states
    .filter((s) => !s.attendee.required && !s.available)
    .map((s) => s.attendee.name);
  const softNames = r.states.filter((s) => s.soft).map((s) => s.attendee.name);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[14px] bg-white p-4 ring-1 ring-line/70 transition hover:bg-[#F7F1EC]">
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold tracking-[-0.01em] text-ink [font-variant-numeric:tabular-nums]">
          {DAY_LABEL[r.day]} {timeLabel(r.time)}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[13px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-md bg-ok px-2 py-0.5 text-ok-ink">
            <Icon name="check" size={12} /> {r.counts.in}명 가능
          </span>
          {blockedReq.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-1 rounded-md bg-danger px-2 py-0.5 text-danger-ink"
            >
              <Icon name="warn" size={12} /> {n} · 꼭 참석
            </span>
          ))}
          {blockedOpt.map((n) => (
            <span
              key={n}
              className="hatch inline-flex items-center gap-1 rounded-md bg-block px-2 py-0.5 text-block-ink"
            >
              <Icon name="x" size={12} /> {n} · 선택
            </span>
          ))}
          {softNames.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-1 rounded-md bg-avoid px-2 py-0.5 text-avoid-ink"
            >
              <Icon name="minus" size={12} /> {n} · 피하고 싶어요
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => onPick(r)}
        className="h-11 shrink-0 rounded-[10px] border border-edge px-3 text-[13px] font-bold text-ink-soft transition hover:bg-sand-50"
      >
        이 시간으로 정하기
      </button>
    </div>
  );
}

/* ---------- 회의 시간 정하기 (모달) ----------
   답-먼저 한 스크롤: 추천 하나 크게 → 대안(탭하면 top으로 승격 · FLIP) → 전체 히트맵 → 참석자 요약. */
export default function Dashboard({ onClose }: { onClose: () => void }) {
  const { state, dispatch, derived } = useApp();
  const { results } = derived;
  const days = state.activeDays; // 후보 기간의 활성 요일 (히트맵 열)
  const reduce = useReducedMotion();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null); // 꼭 참석자 불가 확인

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

  // 성립 0 후보 리스트 — 점수순 정렬 후 필수 전원 가능/불가로 분리
  const ranked = useMemo(() => rankedCandidates(results), [results]);
  const okReq = ranked.filter((r) => r.requiredAllIn);
  const blockedReq = ranked.filter((r) => !r.requiredAllIn).slice(0, 8);

  const confirm = (key: string) => {
    dispatch({ type: "CONFIRM", key });
    onClose();
  };
  // 행 선택 — 꼭 참석자 불가면 확인 다이얼로그 1회, 아니면 바로 확정
  const pick = (r: SlotResult) => {
    const reqBlocked = r.states.some((s) => s.attendee.required && !s.available);
    if (reqBlocked) setConfirmKey(r.key);
    else confirm(r.key);
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
              {sel ? "회의 시간 정하기" : "후보 시간"}
            </h1>
            <p className="truncate text-[13px] text-ink-faint">
              {sel
                ? state.title
                : "다 되는 시간은 없지만, 가까운 순으로 모았어요."}
            </p>
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
            </>
          ) : (
            /* 성립 0 — 후보 시간 리스트(추천 없음·점수순·주최자 직접 선택) */
            <>
              {okReq.length > 0 && (
                <div className="space-y-2">
                  {okReq.map((r) => (
                    <ListRow key={r.key} r={r} onPick={pick} />
                  ))}
                </div>
              )}
              {blockedReq.length > 0 && (
                <div className={okReq.length > 0 ? "mt-5" : ""}>
                  <p className="mb-2 text-[13px] font-semibold text-ink-soft">
                    꼭 와야 하는 사람이 어려운 시간이에요
                  </p>
                  <div className="space-y-2">
                    {blockedReq.map((r) => (
                      <ListRow key={r.key} r={r} onPick={pick} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 전체 시간 히트맵 — 성립 여부와 무관하게 항상 열람 가능 */}
          <div className="mt-6">
            <p className="mb-3 text-[13px] font-bold text-ink-soft">전체 시간</p>
            <div className="mb-2 flex flex-wrap items-center gap-2.5 text-[13px] text-ink-soft">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-ok" /> 다 돼요
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-avoid" /> 아쉬운 사람
                있음(숫자=인원)
              </span>
              <span className="flex items-center gap-1">
                <span className="hatch h-2.5 w-2.5 rounded bg-sand-50" /> 안 되는
                사람 있음(숫자=인원)
              </span>
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `36px repeat(${days.length}, minmax(0,1fr))`,
              }}
            >
              <div />
              {days.map((d) => (
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
                  days={days}
                />
              ))}
            </div>
            <p className="mt-2 text-[13px] text-ink-faint">
              칸에 마우스를 올리면 누가 불가·피하고 싶어 하는지 볼 수 있어요.
            </p>
          </div>

          {/* 성립 0 폴백 — 이미 받은 응답으로 푸는 길이 먼저, 구조 변경은 강등 */}
          {!sel && (
            <div className="mt-6 border-t border-line-soft pt-4">
              <p className="text-[13px] text-ink-soft">맞는 시간이 없나요?</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                <button
                  onClick={onClose}
                  className="py-1 text-[14px] font-semibold text-brand-600"
                >
                  후보 기간 넓히기
                </button>
                <button
                  onClick={onClose}
                  className="py-1 text-[14px] font-semibold text-brand-600"
                >
                  참석자 조정
                </button>
              </div>
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

      {/* 꼭 참석자 불가 슬롯 선택 시 확인 1회 */}
      {confirmKey &&
        (() => {
          const r = byKey.get(confirmKey);
          if (!r) return null;
          const names = r.states
            .filter((s) => s.attendee.required && !s.available)
            .map((s) => s.attendee.name)
            .join("·");
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setConfirmKey(null)}
              />
              <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-pop">
                <p className="text-[16px] font-bold leading-relaxed text-ink">
                  {names}님(꼭 참석)이 올 수 없는 시간이에요. 이대로 정할까요?
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmKey(null)}
                    className="rounded-[10px] px-3 py-2 text-[13px] font-bold text-ink-soft transition hover:bg-sand-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => confirm(confirmKey)}
                    className="rounded-[10px] bg-ink px-3 py-2 text-[13px] font-bold text-white transition hover:bg-[#33291F]"
                  >
                    이대로 정하기
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

function Row({
  time,
  byKey,
  confirmedKey,
  onHover,
  days,
}: {
  time: TimeSlot;
  byKey: Map<string, SlotResult>;
  confirmedKey: string | null;
  onHover?: (t: Tip | null) => void;
  days: Day[];
}) {
  return (
    <>
      <div className="flex items-center justify-end pr-1 text-[13px] font-semibold text-ink-faint">
        {timeLabel(time)}
      </div>
      {days.map((d) => {
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
