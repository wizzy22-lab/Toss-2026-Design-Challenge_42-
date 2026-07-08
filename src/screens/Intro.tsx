import { motion } from "framer-motion";
import { Icon } from "../ui";

/**
 * 데모 첫 진입 인트로 — 제품이 흐릿하게 뒤에 보이는 딤 배경.
 * 역할(주최자/참석자·5명)을 고르면 그 여정의 첫 화면으로 진입한다.
 * ("자유롭게 둘러보기"는 없음 — 선택 후 Demo 바에서 자유 이동 가능.)
 */
const ATTENDEES: { id: string; name: string; tag: string }[] = [
  { id: "jieun", name: "윤지은", tag: "회의 많은 편" },
  { id: "junho", name: "박준호", tag: "점심 직후 피함" },
  { id: "jihoon", name: "정지훈", tag: "점심 직후 피함" },
  { id: "minyoung", name: "최민영", tag: "일정 적은 편" },
  { id: "sohee", name: "한소희", tag: "외근" },
];

export default function Intro({
  onHost,
  onAttendee,
}: {
  onHost: () => void;
  onAttendee: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
      {/* 제품이 흐릿하게 뒤에 — 딤 + 블러 */}
      <div className="fixed inset-0 bg-black/45 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="orange-frame relative z-10 my-auto w-full max-w-lg rounded-[20px] p-2.5 shadow-pop"
      >
        <div className="overflow-hidden rounded-[14px] bg-cream glow-accent">
          <div className="px-6 py-6 sm:px-8 sm:py-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide text-brand-700">
            <span className="grid h-4 w-4 place-items-center rounded bg-ink text-[9px] font-bold text-white">
              M
            </span>
            MeetSync Demo
          </span>

          <h1 className="mt-3 text-2xl font-bold tracking-[-0.01em] text-ink">
            6명이 회의 시간을 잡는 경험
          </h1>
          <p className="mt-1.5 text-[16px] leading-relaxed text-ink-soft">
            회사에서 회의 잡기 — 서로 언제 되는지 몰라 늘 번거로웠죠.
          </p>

          <p className="mt-5 text-[13px] font-bold text-ink">
            어느 입장에서 볼까요?
          </p>

          {/* 주최자 — 오렌지 primary · 추천 경로 */}
          <button
            onClick={onHost}
            className="mt-2.5 flex w-full items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-left text-white transition hover:bg-[#33291F]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-[16px] font-bold">
              가영
            </span>
            <div className="min-w-0">
              <div className="text-[16px] font-bold">
                주최자로 보기 · 이가영
              </div>
              <div className="text-[13px] text-white/80">
                회의를 만들고 → 추천받아 → 정해요
              </div>
            </div>
            <Icon name="arrow-right" size={18} className="ml-auto" />
          </button>

          {/* 참석자 — 5명, 각자 상황 태그 */}
          <div className="mt-5">
            <p className="text-[13px] font-bold text-ink">
              참석자로 보기{" "}
              <span className="font-normal text-ink-faint">
                · 사람마다 상황이 달라요
              </span>
            </p>
            <div className="mt-2 space-y-1.5">
              {ATTENDEES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onAttendee(a.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand-100 text-[13px] font-bold text-ink-soft">
                    {a.name.slice(-2)}
                  </span>
                  <span className="text-[16px] font-bold text-ink">
                    {a.name}
                  </span>
                  <span className="ml-auto rounded-full bg-sand-100 px-2.5 py-1 text-[13px] font-semibold text-ink-soft">
                    {a.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
