import { useState } from "react";
import { Icon } from "../ui";

/** 공용 드롭다운 — 버튼(선택값) + 메뉴 + 바깥 클릭 닫기. */
export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = "선택",
  error = false,
  widthClass = "w-full sm:w-56",
}: {
  value: string | null;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  widthClass?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${widthClass}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-[10px] border px-3.5 py-2.5 text-[15px] font-bold outline-none transition ${
          error ? "border-danger-ink" : "border-edge hover:bg-sand-50"
        }`}
      >
        <span className={value ? "text-ink" : "font-normal text-ink-disabled"}>
          {value ?? placeholder}
        </span>
        <Icon
          name="chevron-down"
          size={16}
          className={`shrink-0 text-ink-faint transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-[10px] border border-line bg-white py-1 shadow-pop">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-[15px] transition hover:bg-sand-50 ${
                  value === o ? "font-bold text-brand-600" : "text-ink"
                }`}
              >
                {o}
                {value === o && (
                  <Icon name="check" size={15} className="text-brand-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
