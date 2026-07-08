import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../store";
import { Toggle, Icon } from "../ui";
import DateRangePicker from "../components/DateRangePicker";

const DURATIONS = ["30분", "1시간", "1시간 30분", "2시간"];

/** 기간 칩과 동일한 세그먼트 칩 스타일 */
function segClass(active: boolean) {
  return `rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
    active
      ? "bg-brand-600 text-white shadow-sm"
      : "bg-sand-100 text-ink-soft hover:bg-sand-200"
  }`;
}

export default function CreateMeeting({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { state, dispatch } = useApp();
  const [invite, setInvite] = useState("");
  // QA: 프리필 금지 — 로컬 드래프트로 '빈/미선택' 시작. 제출 때만 스토어에 커밋.
  // (데모/UT는 의식적 선택·이해 관찰이 목적 → 스마트 디폴트 대신 미선택 채택)
  const [title, setTitle] = useState("");
  const [rangeLabel, setRangeLabel] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [customDur, setCustomDur] = useState("");
  const durIsCustom = duration !== null && !DURATIONS.includes(duration);

  // 보내기 = 이름 + 후보기간 + 소요시간 셋 다 정해졌을 때만 활성
  const canSubmit =
    title.trim() !== "" && rangeLabel !== null && duration !== null;
  const submit = () => {
    if (!canSubmit) return;
    dispatch({ type: "SET_TITLE", title: title.trim() });
    dispatch({ type: "SET_RANGE", label: rangeLabel! });
    dispatch({ type: "SET_DURATION", label: duration! });
    onSubmit();
  };
  // '링크 복사' = 링크만 복사 + 토스트 (외부인 자동 추가 아님)
  const [toast, setToast] = useState<string | null>(null);
  const copyLink = () => {
    const link = "https://meetsync.app/i/커머스팀-스프린트";
    navigator.clipboard?.writeText(link).catch(() => {});
    setToast("링크가 복사됐어요");
    window.setTimeout(() => setToast(null), 1800);
  };

  const included = state.attendees.filter((a) => !a.excluded);
  const excluded = state.attendees.filter((a) => a.excluded);

  const addExternal = () => {
    dispatch({ type: "ADD_EXTERNAL", name: invite.trim() });
    setInvite("");
  };

  return (
    // 플러그인 앱 액션 = 정중앙 모달 (슬랙/Teams 표준). 딤 배경 + 적정 폭.
    // 사이드바 오프셋(md:pl-60) 제거 → 뷰포트 정중앙, 우측 치우침 없음.
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      {/* 모달 — 정중앙, ~672px, 길면 내부 스크롤 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="relative z-10 flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-line/70"
      >
        {/* 헤더 */}
        <div className="border-b border-line-soft px-6 pt-4">
          <div className="flex items-center justify-between pb-3">
            {/* 헤더 — 서브텍스트 제거(CTA와 중복·baseline 정렬 문제). 아이콘 + 제목만 */}
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-[10px] bg-brand-600 text-white">
                <Icon name="plus" size={16} />
              </span>
              <h1 className="text-2xl font-bold tracking-[-0.01em]">
                회의 만들기
              </h1>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-[10px] text-ink-faint transition hover:bg-sand-100"
              aria-label="닫기"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* 본문 스크롤 — 좌우 24 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* 회의 이름 — 유저 직접 입력(프리필 금지). 라벨 + 빈 필드 + 회색 placeholder */}
          <label className="mb-2 block text-[16px] font-bold text-ink-soft">
            회의 이름
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="커머스팀 스프린트 결정 회의"
            className="w-full rounded-[10px] border border-edge px-3.5 py-3 text-[16px] font-bold outline-none placeholder:font-normal placeholder:text-ink-disabled focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />

          {/* 후보 기간 — 프리셋 칩 (기본 다음 주) */}
          <div className="mt-5">
            <label className="mb-2 block text-[16px] font-bold text-ink-soft">
              후보 기간
            </label>
            <DateRangePicker onChange={setRangeLabel} />
          </div>

          {/* 소요시간 — 세그먼트 칩 (기본 1시간), 기간 칩과 같은 스타일 */}
          <div className="mt-5">
            <label className="mb-2 block text-[16px] font-bold text-ink-soft">
              소요시간
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={segClass(duration === d)}
                >
                  {d}
                </button>
              ))}
              {/* 2시간 초과·비정형은 직접 입력 (후보 기간 '직접 선택'과 같은 패턴) */}
              <button
                onClick={() => {
                  const v = customDur || "3시간";
                  setCustomDur(v);
                  setDuration(v);
                }}
                className={segClass(durIsCustom)}
              >
                직접 입력
              </button>
            </div>

            {durIsCustom && (
              <div className="mt-3 rounded-xl border border-line p-3">
                <input
                  value={customDur}
                  onChange={(e) => {
                    setCustomDur(e.target.value);
                    setDuration(e.target.value);
                  }}
                  placeholder="예: 3시간 · 반나절 · 45분"
                  className="w-full rounded-[10px] border border-edge px-3 py-2 text-[16px] font-bold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <p className="mt-1.5 text-[13px] text-ink-faint">
                  2시간을 넘거나 정형 칩에 없는 길이는 여기에 직접 적어요.
                </p>
              </div>
            )}
          </div>

          {/* 참석자 — 채널 인원 자동 초대 */}
          <div className="mt-6">
            {/* '자동 초대' 문구 제거 — 6명 노출 + 아래 헬퍼로 자명(중복 제거) */}
            <div className="text-[16px] font-bold text-ink-soft">
              참석자 {included.length}명
            </div>
            <p className="mt-0.5 text-[13px] text-ink-faint">
              #커머스팀 인원을 자동으로 넣었어요. 기본은{" "}
              <b className="text-brand-600">전원 필참</b> — 빼고 싶은 사람만{" "}
              <b>선택으로</b> 내리고, 무관하면 오른쪽 <b>X</b>로 빼요.
            </p>

            <div className="mt-2.5 space-y-2">
              {included.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-[13px] font-bold text-brand-700">
                    {a.name.slice(-2)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[16px] font-bold">
                        {a.name}
                      </span>
                      {/* 직무는 여기(참석자 리스트)에만 가볍게 — 필수/선택을 정당화하는 정도 */}
                      {a.role && (
                        <span className="shrink-0 truncate text-[13px] font-normal text-ink-faint">
                          · {a.role}
                        </span>
                      )}
                      {a.external && (
                        <span className="shrink-0 rounded bg-sand-100 px-1.5 py-0.5 text-[13px] font-bold text-ink-soft ring-1 ring-sand-300">
                          외부
                        </span>
                      )}
                    </div>
                    {/* 연동자=일정 자동 · 캘린더 빈 사람/외부=본인이 직접 표시 */}
                    <span
                      className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[13px] font-semibold ring-1 ring-inset ${
                        a.linked
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {a.linked
                        ? "캘린더 연동 · 일정 자동"
                        : "캘린더에 일정이 없어요 · 직접 표시"}
                    </span>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {/* 필참/선택 = 가중치 (참여는 함) — 주 컨트롤 */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[13px] font-semibold ${
                          a.required ? "text-brand-600" : "text-ink-faint"
                        }`}
                      >
                        {a.required ? "필참" : "선택"}
                      </span>
                      <Toggle
                        checked={a.required}
                        onChange={() =>
                          dispatch({ type: "TOGGLE_REQUIRED", id: a.id })
                        }
                      />
                    </div>
                    {/* 이 회의와 무관한 사람 빼기 (필참 해제와 다름) — 부 컨트롤, 옅은 X */}
                    <button
                      onClick={() =>
                        dispatch({ type: "TOGGLE_EXCLUDED", id: a.id })
                      }
                      aria-label={`${a.name} 빼기`}
                      title="이 회의에서 빼기"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] text-ink-faint transition hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 제외된 인원 — 복원 가능 */}
            {excluded.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl bg-sand-50 px-3 py-2.5">
                <span className="text-[13px] font-bold text-ink-faint">
                  뺀 사람
                </span>
                {excluded.map((a) => (
                  <button
                    key={a.id}
                    onClick={() =>
                      dispatch({ type: "TOGGLE_EXCLUDED", id: a.id })
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[13px] font-semibold text-ink-soft ring-1 ring-line hover:text-brand-600"
                    title="다시 넣기"
                  >
                    {a.name} <Icon name="plus" size={12} className="text-ink-faint" />
                  </button>
                ))}
              </div>
            )}

            {/* 외부 인원 초대 — 다른 워크스페이스/외부 (이메일·링크) */}
            <div className="mt-3 rounded-xl border border-dashed border-sand-300 p-3">
              <div className="text-[13px] font-bold text-ink-soft">
                외부 인원 초대
              </div>
              <p className="mt-0.5 text-[13px] text-ink-faint">
                다른 워크스페이스·외부 인원을 이메일이나 초대 링크로 불러요.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={invite}
                  onChange={(e) => setInvite(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addExternal();
                  }}
                  placeholder="이메일 주소 입력"
                  className="min-w-0 flex-1 rounded-[10px] border border-edge px-3 py-2 text-[13px] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  onClick={addExternal}
                  className="shrink-0 rounded-[10px] bg-slate-800 px-3 py-2 text-[13px] font-bold text-white transition hover:bg-slate-900"
                >
                  초대
                </button>
                <button
                  onClick={copyLink}
                  className="inline-flex shrink-0 items-center gap-1 rounded-[10px] border border-edge px-3 py-2 text-[13px] font-bold text-ink-soft transition hover:bg-sand-50"
                >
                  <Icon name="link" size={14} /> 링크 복사
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 링크 복사 토스트 */}
        {toast && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[74px] z-20 flex justify-center">
            <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white shadow-lg">
              ✓ {toast}
            </span>
          </div>
        )}

        {/* 하단 CTA — 만들면 요청 게시 + 주최자 본인 시간 입력으로 이어짐 */}
        <div className="border-t border-line-soft px-6 pb-6 pt-4">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink text-[16px] font-bold text-white transition hover:bg-[#33291F] disabled:cursor-not-allowed disabled:bg-sand-200 disabled:text-ink-faint"
          >
            만들고 #커머스팀에 요청 보내기
          </button>
          {!canSubmit && (
            <p className="mt-2 text-center text-[13px] text-ink-faint">
              회의 이름 · 후보 기간 · 소요시간을 정하면 보낼 수 있어요.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
