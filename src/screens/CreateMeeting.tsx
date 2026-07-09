import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../store";
import { Checkbox, Icon, personAvatar } from "../ui";
import DateRangePicker from "../components/DateRangePicker";
import DeadlinePicker from "../components/DeadlinePicker";
import Dropdown from "../components/Dropdown";

// 소요시간 = 1시간 단위, 1~24시간 (기본 1시간)
const DURATIONS = Array.from({ length: 24 }, (_, i) => `${i + 1}시간`);

/** 섹션 라벨 — 전 섹션 동일 스타일(크기·굵기·아래 간격) */
const LBL = "mb-2 block text-[16px] font-bold text-ink-soft";

export default function CreateMeeting({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { state, dispatch } = useApp();
  // 프리필 금지 — 로컬 드래프트, 미선택 시작. 제출 때만 커밋.
  const [title, setTitle] = useState("");
  const [rangeLabel, setRangeLabel] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>("1시간"); // 기본 1시간
  const [, setDeadlineLabel] = useState(""); // 응답 마감 조합 라벨(저마찰·기본값 있음)
  const [showInvite, setShowInvite] = useState(false);
  const [showInfo, setShowInfo] = useState(false); // '필참이란?' 안내
  const [invite, setInvite] = useState("");
  const [attempted, setAttempted] = useState(false); // 제출 시도(인라인 에러 표시)
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2200);
  };

  const canSubmit =
    title.trim() !== "" && rangeLabel !== null && duration !== null;

  const handleSubmit = () => {
    // 비활성 느낌이되 클릭 시 안내(토스트+인라인). 갖춰지면 제출.
    if (!canSubmit) {
      setAttempted(true);
      showToast(
        title.trim() === ""
          ? "회의 이름을 정해주세요"
          : rangeLabel === null
            ? "후보 기간을 정해주세요"
            : "소요시간을 정해주세요",
      );
      return;
    }
    dispatch({ type: "SET_TITLE", title: title.trim() });
    dispatch({ type: "SET_RANGE", label: rangeLabel! });
    dispatch({ type: "SET_DURATION", label: duration! });
    onSubmit();
  };

  const copyLink = () => {
    navigator.clipboard
      ?.writeText("https://42.app/i/커머스팀-스프린트")
      .catch(() => {});
    showToast("링크가 복사됐어요");
  };
  const addExternal = () => {
    if (!invite.trim()) return;
    dispatch({ type: "ADD_EXTERNAL", name: invite.trim() });
    setInvite("");
  };

  const included = state.attendees.filter((a) => !a.excluded);
  const excluded = state.attendees.filter((a) => a.excluded);
  const titleErr = attempted && title.trim() === "";
  const rangeErr = attempted && rangeLabel === null;
  const durErr = attempted && duration === null;

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
        className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-line/70"
      >
        {/* 헤더 — 제목이 이미 말하므로 + 아이콘 제거 */}
        <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
          <h1 className="text-2xl font-bold tracking-[-0.01em]">회의 만들기</h1>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-[10px] text-ink-faint transition hover:bg-sand-100"
            aria-label="닫기"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* 본문 스크롤 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* 회의 이름 — 주인공, 전체폭 단독 */}
          <div>
            <label className={LBL}>회의 이름</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex) 주간회의"
              className={`w-full rounded-[10px] border px-3.5 py-2.5 text-[16px] font-bold outline-none placeholder:font-normal placeholder:text-[#C7BFB6] focus:ring-2 focus:ring-brand-100 ${
                titleErr
                  ? "border-danger-ink focus:border-danger-ink"
                  : "border-edge focus:border-brand-400"
              }`}
            />
            {titleErr && (
              <p className="mt-1 text-[13px] font-semibold text-danger-ink">
                회의 이름을 정해주세요.
              </p>
            )}
          </div>

          {/* 후보 기간 — 전체폭(달력 여유) */}
          <div className="mt-5">
            <label className={LBL}>후보 기간</label>
            <DateRangePicker onChange={setRangeLabel} />
            {rangeErr && (
              <p className="mt-1 text-[13px] font-semibold text-danger-ink">
                후보 기간을 정해주세요.
              </p>
            )}
          </div>

          {/* 소설정 페어 — 소요시간 · 응답 마감 (가벼운 드롭다운, 한 줄) */}
          <div className="mt-5 grid grid-cols-1 items-start gap-x-4 gap-y-5 sm:grid-cols-2">
            <div>
              <label className={LBL}>소요시간</label>
              <Dropdown
                value={duration}
                options={DURATIONS}
                onChange={setDuration}
                error={durErr}
                widthClass="w-full"
              />
              {durErr && (
                <p className="mt-1 text-[13px] font-semibold text-danger-ink">
                  소요시간을 정해주세요.
                </p>
              )}
            </div>
            <div>
              <label className={LBL}>응답 마감</label>
              <DeadlinePicker onChange={setDeadlineLabel} />
              <p className="mt-1.5 text-[13px] text-ink-faint">
                이때까지 참석자가 안 되는 시간을 알려줘요.
              </p>
            </div>
          </div>

          {/* 참석자 — 2열 그리드로 한눈에 (스크롤 X) */}
          <div className="mt-6">
            <label className={LBL}>참석자 {included.length}명</label>
            <div className="mb-2">
              <p className="text-[13px] text-ink-faint">
                기본은 모두 <b className="text-brand-600">필참</b>이에요. 필요하면
                바꿔주세요.
              </p>
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                aria-expanded={showInfo}
                className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600"
              >
                <Icon name="info" size={14} /> 필참이란?
              </button>
              {showInfo && (
                <p className="mt-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[13px] leading-relaxed text-ink-soft">
                  필참은 모두 참석할 수 있는 시간으로 회의를 추천해드려요.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2">
              {included.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-xl border border-line px-2.5 py-2"
                >
                  {/* 색 아바타 (이니셜 없음 — 이름이 정체성 전달) */}
                  <span
                    className={`h-7 w-7 shrink-0 rounded-full ${personAvatar(
                      a.name,
                    )}`}
                  />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[13px] font-bold text-ink">
                      {a.name}
                    </div>
                    {(a.role || a.external) && (
                      <div className="truncate text-[13px] text-ink-faint">
                        {a.external ? "외부" : a.role}
                      </div>
                    )}
                  </div>
                  {/* 필참 체크박스 */}
                  <Checkbox
                    checked={a.required}
                    onChange={() =>
                      dispatch({ type: "TOGGLE_REQUIRED", id: a.id })
                    }
                    label="필참"
                  />
                  <button
                    onClick={() =>
                      dispatch({ type: "TOGGLE_EXCLUDED", id: a.id })
                    }
                    aria-label={`${a.name} 빼기`}
                    title="이 회의에서 빼기"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-[10px] text-ink-faint transition hover:bg-danger hover:text-danger-ink"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}

              {/* 외부 초대 타일 */}
              <button
                onClick={() => setShowInvite((v) => !v)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-edge px-2.5 py-2 text-[13px] font-bold text-ink-soft transition hover:bg-sand-50"
              >
                <Icon name="plus" size={14} /> 외부 초대
              </button>
            </div>

            {/* 뺀 사람 — 다시 넣기 */}
            {excluded.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] font-bold text-ink-faint">
                  뺀 사람
                </span>
                {excluded.map((a) => (
                  <button
                    key={a.id}
                    onClick={() =>
                      dispatch({ type: "TOGGLE_EXCLUDED", id: a.id })
                    }
                    title="다시 넣기"
                    className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2 py-0.5 text-[13px] font-semibold text-ink-soft transition hover:text-brand-600"
                  >
                    {a.name} <Icon name="plus" size={12} />
                  </button>
                ))}
              </div>
            )}

            {/* 외부 초대 입력 (타일 클릭 시 펼침) */}
            {showInvite && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-sand-50 p-2.5">
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
                  className="shrink-0 rounded-[10px] bg-ink px-3 py-2 text-[13px] font-bold text-white transition hover:bg-[#33291F]"
                >
                  초대
                </button>
                <button
                  onClick={copyLink}
                  className="inline-flex shrink-0 items-center gap-1 rounded-[10px] border border-edge px-3 py-2 text-[13px] font-bold text-ink-soft transition hover:bg-sand-50"
                >
                  <Icon name="link" size={14} /> 링크
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 토스트 (검증·링크복사 공통) */}
        {toast && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[76px] z-20 flex justify-center">
            <span className="rounded-lg bg-ink px-3 py-1.5 text-[13px] font-semibold text-white shadow-lg">
              {toast}
            </span>
          </div>
        )}

        {/* 하단 CTA — 갖춰지면 활성. 미충족이면 낮은 불투명도+not-allowed(클릭 시 안내) */}
        <div className="border-t border-line-soft px-6 pb-6 pt-4">
          <button
            onClick={handleSubmit}
            aria-disabled={!canSubmit}
            className={`inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink text-[16px] font-bold text-white transition ${
              canSubmit
                ? "hover:bg-[#33291F]"
                : "cursor-not-allowed opacity-40"
            }`}
          >
            만들고 #커머스팀에 요청 보내기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
