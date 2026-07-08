import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../store";
import { DAYS, DAY_LABEL, TIMES, timeLabel } from "../data";
import { type SlotResult } from "../engine";
import type { TimeSlot } from "../types";
import { Badge, Toggle, Icon } from "../ui";

// 트레이드오프 = 평어, 내부어 금지. "회피" 대신 "아쉬움 / 피하고 싶어 해요".
function heroWhy(r: SlotResult, isBest: boolean): string {
  if (r.softViolations === 0)
    return "꼭 올 사람은 다 올 수 있는, 다들 편한 시간이에요.";
  const names = r.softNames.join("·");
  return isBest
    ? `${names}님이 피하고 싶어 한 시간이지만, 꼭 올 사람은 다 올 수 있는 최선이에요.`
    : `${names}님이 피하고 싶어 하지만, 꼭 올 사람은 다 올 수 있어요.`;
}
const regretText = (r: SlotResult) =>
  r.softViolations > 0 ? `${r.softViolations}명 아쉬움` : "다들 편해요";

/* ---------- 히트맵 셀 (읽기 전용 · 셀 1색) ---------- */
function HeatCell({ r, confirmed }: { r: SlotResult; confirmed: boolean }) {
  let tint = "border-dashed border-line bg-white";
  let label = "";
  if (!r.requiredAllIn) {
    tint = "hatch border-line bg-sand-50"; // 안 되는 사람 있음
  } else if (r.feasible && r.softViolations > 0) {
    tint = "border-avoid bg-avoid text-avoid-ink"; // 아쉬운 사람 있음
    label = String(r.softViolations);
  } else if (r.feasible) {
    tint = "border-ok bg-ok"; // 다 돼요
  }
  return (
    <div
      className={`flex h-9 items-center justify-center rounded-lg border text-[13px] font-bold ${tint} ${
        confirmed ? "ring-2 ring-brand-500 ring-offset-1" : ""
      }`}
    >
      {label}
    </div>
  );
}

/* ---------- 참석자 조정 행 (2차 액션에서만 펼쳐 보임) ---------- */
function AttendeeRow({ id }: { id: string }) {
  const { state, dispatch } = useApp();
  const a = state.attendees.find((x) => x.id === id)!;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line p-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-[13px] font-bold text-brand-700">
        {a.name.slice(-2)}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold">{a.name}</div>
        <span className="text-[13px] text-ink-faint">
          {a.linked ? "일정 자동" : "직접 표시"}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span
          className={`text-[13px] font-semibold ${
            a.required ? "text-brand-600" : "text-ink-faint"
          }`}
        >
          {a.required ? "꼭 와요" : "와도 좋아요"}
        </span>
        <Toggle
          checked={a.required}
          onChange={() => dispatch({ type: "TOGGLE_REQUIRED", id: a.id })}
        />
      </div>
    </div>
  );
}

/* ---------- 회의 시간 정하기 (모달) ----------
   답-먼저 한 스크롤: 히어로(추천 하나) → 대안(작은 행) → 전체 시간 → 참석자 요약.
   채널 카드의 "자세히 보기"로 열리고, 닫으면 채널로 복귀. */
export default function Dashboard({ onClose }: { onClose: () => void }) {
  const { state, dispatch, derived } = useApp();
  const { results, top } = derived;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showRoster, setShowRoster] = useState(false);

  const byKey = useMemo(() => {
    const m = new Map<string, SlotResult>();
    results.forEach((r) => m.set(r.key, r));
    return m;
  }, [results]);

  const feasibleCount = results.filter((r) => r.feasible).length;
  const best = top[0] ?? null;
  // 히어로 = 고른 후보(기본 = 추천). 대안 클릭 시 히어로로 승격.
  const sel = (selectedKey && top.find((r) => r.key === selectedKey)) || best;
  const alternatives = sel ? top.filter((r) => r.key !== sel.key) : [];
  const roster = state.attendees.filter((a) => !a.excluded);
  const unlinked = roster.filter((a) => !a.linked);

  // 확정 → 채널로 돌아가 확정 카드가 보이게 (모달 닫기).
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
        {/* 헤더 — 모달 좌우 24 */}
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

        {/* 본문 (답 먼저 · 한 스크롤) — 좌우 24 · 상하 24 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {sel ? (
            <>
              <p className="text-[13px] font-semibold text-ink-soft">
                다 되는 시간 {feasibleCount}개 찾았어요 · 이 중에 정하면 돼요
              </p>

              {/* 히어로 — 답 하나 크게. V2: 오렌지 프레임 + 크림 카드 + 코너 글로우 + 큰 flame 시간 + 다크 버튼 */}
              <div className="orange-frame mt-2 rounded-[18px] p-2.5 shadow-glow">
                <div className="glow-accent rounded-xl bg-cream p-6">
                  <span className="text-[13px] font-bold text-brand-600">
                    {sel.key === best?.key ? "이 시간을 추천해요" : "고른 시간"}
                  </span>
                  <div className="mt-1 text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-flame">
                    {DAY_LABEL[sel.day]} {timeLabel(sel.time)}
                  </div>
                  <p className="mt-2 text-[13px] font-normal text-ink-soft">
                    {heroWhy(sel, sel.key === best?.key)}
                  </p>
                  <button
                    onClick={() => confirm(sel.key)}
                    className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink text-[16px] font-bold text-white transition hover:bg-[#33291F] sm:w-auto sm:px-6"
                  >
                    이 시간으로 정하기
                  </button>
                </div>
              </div>

              {/* 대안 — 작은 행. 클릭하면 위 히어로로 올라와요 (블록 분리 24) */}
              {alternatives.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-[13px] font-bold text-ink-soft">
                    다른 시간도 있어요
                  </p>
                  <div className="space-y-2">
                    {alternatives.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => setSelectedKey(r.key)}
                        className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-line px-4 py-3 text-left transition hover:border-brand-400 hover:bg-[#F7F1EC]"
                      >
                        <span className="text-[16px] font-bold text-ink">
                          {DAY_LABEL[r.day]} {timeLabel(r.time)}
                        </span>
                        {r.key === best?.key && (
                          <span className="rounded bg-recommend px-1.5 py-0.5 text-[13px] font-bold text-recommend-ink">
                            추천
                          </span>
                        )}
                        <Badge tone="emerald" className="!px-2 !py-0.5">
                          꼭 올 사람은 다 돼요
                        </Badge>
                        <span className="ml-auto text-[13px] font-semibold text-avoid-ink">
                          {regretText(r)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 전체 시간 — 답 아래에 그냥 표시 (블록 분리 24) */}
              <div className="mt-6">
                <p className="mb-3 text-[13px] font-bold text-ink-soft">
                  전체 시간
                </p>
                <div className="mb-2 flex flex-wrap items-center gap-2.5 text-[13px] text-ink-soft">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-ok ring-1 ring-ok-ink/20" />{" "}
                    다 돼요
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-avoid ring-1 ring-avoid-ink/20" />{" "}
                    아쉬운 사람 있음(숫자=인원)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="hatch h-2.5 w-2.5 rounded bg-sand-50 ring-1 ring-line" />{" "}
                    안 되는 사람 있음
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
                    />
                  ))}
                </div>
              </div>

              {/* 참석자 — 요약만. 조정은 눈에 덜 띄는 2차 액션 (블록 분리 24) */}
              <div className="mt-6 rounded-xl bg-sand-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-ink-soft">
                    참석자 {roster.length}명 · {roster.length - unlinked.length}명
                    일정 자동
                    {unlinked.length > 0 &&
                      ` · ${unlinked.map((a) => a.name).join("·")} 직접 표시`}
                  </p>
                  <button
                    onClick={() => setShowRoster((v) => !v)}
                    className="ml-auto inline-flex items-center gap-1 text-[13px] font-bold text-ink-faint transition hover:text-brand-600"
                  >
                    참석자 조정
                    <Icon
                      name={showRoster ? "chevron-down" : "chevron-right"}
                      size={14}
                    />
                  </button>
                </div>
                {showRoster && (
                  <div className="mt-2.5 space-y-2">
                    {roster.map((a) => (
                      <AttendeeRow key={a.id} id={a.id} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* 다 되는 시간이 없을 때 — 참석자 조정으로 유도 */
            <div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-[16px] font-bold text-amber-900">
                  다 되는 시간이 없어요
                </p>
                <p className="mt-2 text-[13px] text-amber-800">
                  지금 응답으론 꼭 올 사람이 다 되는 시간이 없어요. 아래에서
                  참석자를 조정하거나 후보 기간을 넓혀 보세요.
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {roster.map((a) => (
                  <AttendeeRow key={a.id} id={a.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Row({
  time,
  byKey,
  confirmedKey,
}: {
  time: TimeSlot;
  byKey: Map<string, SlotResult>;
  confirmedKey: string | null;
}) {
  return (
    <>
      <div className="flex items-center justify-end pr-1 text-[13px] font-semibold text-ink-faint">
        {timeLabel(time)}
      </div>
      {DAYS.map((d) => {
        const key = `${d}-${time}`;
        const r = byKey.get(key)!;
        return <HeatCell key={key} r={r} confirmed={confirmedKey === key} />;
      })}
    </>
  );
}
