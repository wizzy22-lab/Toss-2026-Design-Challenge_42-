import type { ReactNode } from "react";

/* ---------- 아이콘 (한 세트로 통일 · Lucide 경로 · currentColor 상속) ---------- */
type IconName =
  | "check"
  | "x"
  | "plus"
  | "play"
  | "chevron-down"
  | "chevron-right"
  | "rotate-ccw"
  | "arrow-right"
  | "calendar-check"
  | "refresh-cw"
  | "sparkles"
  | "link"
  | "menu"
  | "users"
  | "user"
  | "info"
  | "triangle"
  | "eye"
  | "clock";

const ICON_PATHS: Record<IconName, ReactNode> = {
  check: <polyline points="20 6 9 17 4 12" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M5 12h14M12 5v14" />,
  play: <polygon points="6 3 20 12 6 21" fill="currentColor" stroke="none" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  "rotate-ccw": (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  "arrow-right": <path d="M5 12h14M12 5l7 7-7 7" />,
  "calendar-check": (
    <>
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="m9 16 2 2 4-4" />
    </>
  ),
  "refresh-cw": (
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  sparkles: (
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  triangle: <path d="M12 4 21 19H3z" />, // ▲ (filled 권장)
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className = "",
  filled = false,
}: {
  name: IconName;
  size?: number;
  className?: string;
  filled?: boolean; // 속 채움(예: 아바타 글리프) — currentColor로 fill
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// 사람별 아바타 컬러 — 연한 틴트 배경 + 같은 계열 진한 이니셜(전부 대비 ≥4.5, 조화·muted).
// 색 단독 아님(이름도 함께 표시) → 1.4.1 OK. 배경 채팅에서 각자 구분되게.
const PERSON_TINT: Record<string, string> = {
  이가영: "bg-[#FFE7D6] text-[#B23A0E]", // 오렌지 5.04
  윤지은: "bg-[#D2EDE8] text-[#0F6B60]", // 틸 5.17
  박준호: "bg-[#DCE8FB] text-[#2A5AA6]", // 블루 5.46
  정지훈: "bg-[#E9E1F6] text-[#6A3D9E]", // 퍼플 5.97
  최민영: "bg-[#DCEFDE] text-[#22662C]", // 그린 5.81
  한소희: "bg-[#FBDED7] text-[#B23A2C]", // 코랄 4.68
};
export function personAvatar(name: string): string {
  return PERSON_TINT[name] ?? "bg-sand-200 text-ink-soft";
}

/** 참석 가능/불가 이진 표식 (대면 전용 — 참석 방식 개념 없음) */
export function AvailPill({ available }: { available: boolean }) {
  return available ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-ok px-2 py-0.5 text-[13px] font-semibold text-ok-ink ring-1 ring-inset ring-ok-ink/20">
      <span className="h-1.5 w-1.5 rounded-full bg-ok-ink" /> 참석 가능
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-block px-2 py-0.5 text-[13px] font-semibold text-block-ink ring-1 ring-inset ring-block-ink/15">
      <span className="h-1.5 w-1.5 rounded-full bg-block-ink" /> 불가
    </span>
  );
}

export function Badge({
  children,
  tone = "brand",
  className = "",
}: {
  children: ReactNode;
  tone?: "brand" | "emerald" | "amber" | "slate" | "cyan" | "rose";
  className?: string;
}) {
  // 상태 컬러(§1)에 매핑 — 추천/최선=brand(오렌지 전용), 가능=ok, 피해요=avoid(앰버), 대기=wait, 취소=danger
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    emerald: "bg-ok text-ok-ink ring-ok-ink/20",
    amber: "bg-avoid text-avoid-ink ring-avoid-ink/20",
    slate: "bg-wait text-ink-soft ring-black/5",
    cyan: "bg-ok text-ok-ink ring-ok-ink/20",
    rose: "bg-danger text-danger-ink ring-danger-ink/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-flame" : "bg-sand-300"
      }`}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/** 체크박스 (선택 표식) — 박스 + 라벨 */
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-flex shrink-0 items-center gap-1.5"
    >
      <span
        className={`grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition ${
          checked ? "border-brand-600 bg-brand-600 text-white" : "border-edge bg-white"
        }`}
      >
        {checked && <Icon name="check" size={13} />}
      </span>
      {label && (
        <span
          className={`text-[13px] font-semibold ${
            checked ? "text-brand-600" : "text-ink-faint"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-card ring-1 ring-line/70 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[16px] font-bold tracking-[-0.01em] text-ink-soft">
        {children}
      </h2>
      {hint ? <span className="text-[13px] text-ink-faint">{hint}</span> : null}
    </div>
  );
}

export function Initial({ name }: { name: string }) {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-[13px] font-bold text-brand-700">
      {name.slice(-2)}
    </span>
  );
}
