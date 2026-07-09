import Wheel from "./Wheel";

/** 소요시간 휠 — 정시 단위(1~8시간). 제네릭 Wheel 래퍼. */
const HOURS = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}시간`,
}));

export default function DurationWheel({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (h: number) => void;
}) {
  return <Wheel items={HOURS} value={value ?? 1} onChange={onChange} />;
}
