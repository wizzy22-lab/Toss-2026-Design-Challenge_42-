import { useState, type ReactNode } from "react";
import { useApp } from "../store";
import type { DemoStage, ViewAs } from "../types";
import { Icon } from "../ui";

/**
 * 사내 메신저 셸 — 메인 컨테이너 (정적 세트 드레싱).
 * 슬랙의 "패턴"만 차용하고 브랜드는 복제하지 않음. 조용하고 낮은 대비.
 * 데모 스위처는 두 축 — 관점(주최자/참석자) × 단계(만들기~변경).
 */

const CHANNELS = [
  { name: "커머스팀", active: true, unread: false },
  { name: "일반", active: false, unread: false },
  { name: "공지", active: false, unread: false },
  { name: "랜덤", active: false, unread: false },
];

// 채널 참석자 6명 전원 — 좌측 DM 목록에 그대로 노출
const DMS = [
  { name: "이가영", present: true },
  { name: "윤지은", present: true },
  { name: "박준호", present: false },
  { name: "정지훈", present: true },
  { name: "최민영", present: false },
  { name: "한소희", present: true },
];

// 스테이지 탭 = 선택한 역할의 여정만 노출 (혼선 제거).
//  - 주최자: 만들기 → 추천 → 확정 (생성·결정). '내 시간'은 만들기 안에 흡수.
//  - 참석자: 응답 → 확정 (응답·통보). '만들기'는 안 보임.
// (변경은 확정 카드의 "시간 조정" escape hatch로만 진입 — 회고로 뺌)
const STAGE_TABS: Record<ViewAs, { id: DemoStage; label: string }[]> = {
  host: [
    { id: "create", label: "만들기" },
    { id: "collect", label: "응답" },
    { id: "recommend", label: "추천" },
    { id: "confirmed", label: "확정" },
  ],
  attendee: [
    { id: "collect", label: "응답" },
    { id: "confirmed", label: "확정" },
  ],
};

// Demo 바 상태 표시용 — 모든 스테이지의 한국어 라벨
const STAGE_LABEL: Record<DemoStage, string> = {
  create: "만들기",
  collect: "응답",
  recommend: "추천",
  confirmed: "확정",
  change: "변경",
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pb-1 text-[13px] font-bold uppercase tracking-wide text-[#A69E96]">
      {children}
    </div>
  );
}

function SidebarBody({ persona }: { persona: string }) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-black/20 bg-[#211D1A] px-4 py-4 shadow-sm">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-[#3C3630] text-[13px] font-bold text-white">
          우
        </div>
        <span className="text-[16px] font-bold text-white">우리팀 워크스페이스</span>
        <Icon name="chevron-down" size={14} className="ml-auto text-[#A69E96]" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 text-[13px]">
        <SectionLabel>채널</SectionLabel>
        <ul className="mb-4 space-y-0.5">
          {CHANNELS.map((c) => (
            <li
              key={c.name}
              className={`flex items-center gap-2 rounded-md px-2 py-2 ${
                c.active
                  ? "bg-brand-600 font-semibold text-white"
                  : "text-[#C3BBB2]"
              }`}
            >
              <span className={c.active ? "text-white/80" : "text-[#A69E96]"}>
                #
              </span>
              <span className="truncate">{c.name}</span>
            </li>
          ))}
        </ul>

        <SectionLabel>다이렉트 메시지</SectionLabel>
        <ul className="mb-4 space-y-0.5">
          {DMS.map((d) => (
            <li
              key={d.name}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-[#C3BBB2]"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  d.present ? "bg-[#2BAC76]" : "border border-[#A69E96]"
                }`}
              />
              <span className="truncate">{d.name}</span>
            </li>
          ))}
        </ul>

        <SectionLabel>앱</SectionLabel>
        {/* 셸은 지금 채널(#커머스팀)을 보는 중 — active는 채널 하나뿐.
            MeetSync 앱은 앱 홈 뷰일 때만 하이라이트하므로 여기선 비활성. */}
        <ul className="space-y-0.5">
          <li className="flex items-center gap-2 rounded-md px-2 py-2 text-[#C3BBB2]">
            <span className="grid h-4 w-4 place-items-center rounded bg-ink text-[9px] font-bold text-white">
              M
            </span>
            <span className="truncate">MeetSync</span>
            <span className="ml-auto rounded bg-white/[0.08] px-1 text-[9px] font-bold text-[#A69E96]">
              앱
            </span>
          </li>
        </ul>
      </nav>

      {/* 내 계정 — 현재 관점의 페르소나를 반영 */}
      <div className="flex items-center gap-2 border-t border-black/20 px-4 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[#3C3630] text-[13px] font-bold text-white">
          {persona.slice(-2)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-white">
            {persona}
          </div>
          <div className="flex items-center gap-1 text-[13px] text-[#A69E96]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2BAC76]" /> 온라인
          </div>
        </div>
      </div>
    </>
  );
}

/* 데스크톱 = 정적 사이드바(≥768). 모바일 = 햄버거로 여는 드로어. 내용은 SidebarBody 재사용. */
function Sidebar({ persona }: { persona: string }) {
  return (
    <aside className="hidden w-[260px] shrink-0 flex-col bg-[#2B2724] text-[#A69E96] md:flex">
      <SidebarBody persona={persona} />
    </aside>
  );
}

function SidebarDrawer({
  persona,
  onClose,
}: {
  persona: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="absolute left-0 top-0 flex h-full w-[260px] flex-col bg-[#2B2724] text-[#A69E96] shadow-pop">
        <SidebarBody persona={persona} />
      </aside>
    </div>
  );
}

/* 데모 바 — 뉴트럴 다크 메타 크롬. 왼쪽 브랜드 · 가운데 현재 상태(텍스트) · 오른쪽 진행점+처음부터.
   역할/사람 전환은 '처음부터'(인트로)로, 단계 이동은 진행 점으로. */
function DemoSwitcher({
  stage,
  viewAs,
  onDemo,
  onRestart,
}: {
  stage: DemoStage;
  viewAs: ViewAs;
  onDemo: (s: DemoStage) => void;
  onRestart: () => void;
}) {
  const { state } = useApp();

  const persona =
    viewAs === "host"
      ? state.attendees[0].name
      : state.attendees.find((a) => a.id === state.activeAttendeeId)?.name ??
        state.attendees[0].name;
  const roleLabel = viewAs === "host" ? "주최자" : "참석자";
  const seq = STAGE_TABS[viewAs];
  const curIdx = seq.findIndex((t) => t.id === stage);

  return (
    <div className="ml-auto flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#2C2C2A] px-3 py-2">
      {/* 왼쪽: 브랜드 */}
      <span className="flex items-center gap-1.5 text-[13px] font-bold text-white/85">
        <Icon name="play" size={12} className="text-brand-500" />
        MeetSync Demo
      </span>

      <span className="hidden h-4 w-px bg-white/15 sm:inline-block" />

      {/* 가운데: 현재 상태 (텍스트만, 아바타 없음) */}
      <span className="text-[13px] font-normal text-white/50">
        <span className="hidden sm:inline">지금 보는 화면 — </span>
        <span className="font-semibold text-white/85">
          {persona} · {roleLabel} · {STAGE_LABEL[stage]}
        </span>
      </span>

      <span className="hidden h-4 w-px bg-white/15 sm:inline-block" />

      {/* 오른쪽: 진행 점(단계 이동) + 처음부터 */}
      <div className="flex items-center gap-0.5">
        {seq.map((t, i) => (
          <button
            key={t.id}
            onClick={() => onDemo(t.id)}
            title={t.label}
            aria-label={t.label}
            className="group grid h-6 w-6 place-items-center rounded-full"
          >
            <span
              className={`h-2 w-2 rounded-full transition ${
                i === curIdx
                  ? "bg-brand-500"
                  : i < curIdx
                    ? "bg-white/70"
                    : "bg-white/25 group-hover:bg-white/50"
              }`}
            />
          </button>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="flex items-center gap-1 rounded-[10px] px-2 py-1 text-[13px] font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
      >
        <Icon name="rotate-ccw" size={14} />
        처음부터
      </button>
    </div>
  );
}

export default function Shell({
  children,
  stage,
  viewAs,
  onDemo,
  onCreate,
  onRestart,
}: {
  children: ReactNode;
  stage: DemoStage;
  viewAs: ViewAs;
  onDemo: (s: DemoStage) => void;
  onCreate: () => void;
  onRestart: () => void;
}) {
  const { state } = useApp();
  const [navOpen, setNavOpen] = useState(false);
  // 현재 관점의 페르소나 — 주최자=이가영, 참석자=내가 보는 사람
  const persona =
    viewAs === "host"
      ? state.attendees[0].name
      : state.attendees.find((a) => a.id === state.activeAttendeeId)?.name ??
        state.attendees[0].name;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-cream text-ink">
      <Sidebar persona={persona} />
      {navOpen && (
        <SidebarDrawer persona={persona} onClose={() => setNavOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 채널 헤더 (정적) + 데모 스위처. 좁은 폭에선 데모 바가 둘째 줄로 내려감 */}
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-white px-4 py-3 md:px-6">
          {/* 모바일 햄버거 — 사이드바 드로어 열기 */}
          <button
            onClick={() => setNavOpen(true)}
            aria-label="메뉴 열기"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-ink-soft transition hover:bg-sand-100 md:hidden"
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="min-w-0 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-ink-faint">#</span>
              <h1 className="truncate text-[16px] font-bold text-ink">
                커머스팀
              </h1>
              <span className="hidden text-[13px] text-ink-faint sm:inline">
                · 멤버 6
              </span>
            </div>
            <p className="hidden truncate text-[13px] text-ink-faint lg:block">
              스프린트 · 리서치 · 회의 조율
            </p>
          </div>

          <DemoSwitcher
            stage={stage}
            viewAs={viewAs}
            onDemo={onDemo}
            onRestart={onRestart}
          />
        </header>

        {/* 메시지 영역 — MeetSync 무대 */}
        <main className="flex-1 overflow-y-auto bg-cream">{children}</main>

        {/* 컴포저 (정적 입력 + MeetSync 진입 버튼) */}
        <div className="border-t border-line bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 rounded-[10px] border border-line bg-white px-2 py-2 shadow-sm">
            <button
              onClick={onCreate}
              className="flex shrink-0 items-center gap-1 rounded-[10px] bg-ink px-3 py-2 text-[13px] font-bold text-white transition hover:bg-[#33291F]"
            >
              <Icon name="plus" size={16} /> 회의 만들기
            </button>
            <div className="flex-1 truncate px-1.5 text-[13px] text-ink-faint">
              #커머스팀에 메시지 보내기…
            </div>
            <span className="hidden shrink-0 items-center gap-2 pr-1 text-ink-faint sm:flex">
              <span className="text-base">＠</span>
              <span className="text-base">😊</span>
              <span className="text-base">📎</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
