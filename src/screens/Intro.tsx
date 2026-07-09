import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "../ui";

/**
 * 데모 첫 진입 인트로 — 제품이 흐릿하게 뒤에 보이는 딤 배경.
 * 2단계: ① 주최자/참석자 두 갈래만 → ② 참석자 클릭 시 5명 리스트 펼침(아코디언).
 * 카드 = 크림 + 소프트 글로우(우상단). 오렌지는 로고·화살표 액센트로만(프레임 없음).
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
  const [showAttendees, setShowAttendees] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
      {/* 딤 배경 rgba(0,0,0,.4) — 채널 맥락 살아있게 */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md" />

      {/* 카드 = 크림 · 라운드 18 · 우상단 소프트 글로우 · shadow-3. 오렌지 보더(프레임) 없음 */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="glow-accent relative z-10 my-auto w-full max-w-lg overflow-hidden rounded-[18px] bg-cream shadow-pop"
      >
        <div className="px-6 py-6 sm:px-8 sm:py-7">
          {/* 로고 — 오렌지 액센트 #C23E12 */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide text-brand-600">
            <span className="grid h-4 w-4 place-items-center rounded bg-ink text-[9px] font-bold text-white">
              42
            </span>
            42 Demo
          </span>

          {/* H1 — 최상위 앵커(가장 크게·굵게) */}
          <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink">
            6명이 회의 시간을 잡는 경험
          </h1>
          <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">
            회사에서 회의 잡기 — 서로 언제 되는지 몰라 늘 번거로웠죠.
          </p>

          {/* 프롬프트 헤더 — 18·600·primary. subtitle과는 띄우고(mt-7) 카드와는 붙여(카드 mt-2) 한 그룹 */}
          <p className="mt-7 text-[18px] font-semibold text-ink">
            어느 입장에서 볼까요?
          </p>

          {/* ① 주최자 — 다크 fill 카드. 아바타는 오렌지-틴트로 다크 위에서 pop */}
          <button
            onClick={onHost}
            className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-left text-white transition hover:bg-[#33291F]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-recommend text-[16px] font-bold text-brand-600">
              가영
            </span>
            <div className="min-w-0">
              <div className="text-[16px] font-bold">주최자로 보기 · 이가영</div>
              <div className="text-[13px] text-white/80">
                회의를 만들고 → 추천받아 → 정해요
              </div>
            </div>
            <Icon name="arrow-right" size={18} className="ml-auto" />
          </button>

          {/* ① 참석자 — 라이트 fill 카드(스트로크 대신 톤으로 surface 정의). 다크(주최자)와 fill 언어 통일 */}
          <button
            onClick={() => setShowAttendees((v) => !v)}
            aria-expanded={showAttendees}
            className="mt-2.5 flex w-full items-center gap-3 rounded-2xl bg-[#F4EEE8] px-4 py-3.5 text-left transition hover:bg-[#F7F1EC]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-soft">
              <Icon name="users" size={18} />
            </span>
            <div className="min-w-0">
              {/* 라벨 — 18·600·primary (주최자 프롬프트와 같은 급) */}
              <div className="text-[18px] font-semibold text-ink">
                참석자로 보기
              </div>
              <div className="text-[13px] text-ink-faint">
                사람마다 상황이 달라요
              </div>
            </div>
            <Icon
              name="chevron-down"
              size={20}
              className={`ml-auto text-brand-600 transition-transform ${
                showAttendees ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* ② 참석자 5명 — 펼친 뒤 주인공. 상황 태그(가중치 라벨 아님) */}
          {showAttendees && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-2 space-y-1.5"
            >
              {ATTENDEES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onAttendee(a.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left transition hover:border-edge hover:bg-sand-50"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand-100 text-[13px] font-bold text-ink-soft">
                    {a.name.slice(-2)}
                  </span>
                  <span className="text-[16px] font-bold text-ink">
                    {a.name}
                  </span>
                  {/* 상황 태그 = 뮤트(대비 유지): #F1ECE7 / #726A61 */}
                  <span className="ml-auto rounded-full bg-wait px-2.5 py-1 text-[13px] font-semibold text-wait-ink">
                    {a.tag}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
