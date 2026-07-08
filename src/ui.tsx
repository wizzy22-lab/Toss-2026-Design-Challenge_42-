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
  | "users";

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
};

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
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
