import { useEffect, useMemo, useState } from "react";
import Dropdown from "./Dropdown";
import { addDays, atMidnight, fmtDay, fmtTime } from "../lib/date";

/** 응답 마감 = "~일 ~시까지" — 날짜 드롭다운 + 시간 드롭다운. 기본값 있음(저마찰). */
export default function DeadlinePicker({
  onChange,
}: {
  onChange: (label: string) => void;
}) {
  const today = useMemo(() => atMidnight(new Date()), []);
  // 날짜 = 내일부터 14일
  const dayOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => fmtDay(addDays(today, i + 1))),
    [today],
  );
  // 시간 = 09:00~22:00, 30분 단위
  const timeOptions = useMemo(
    () => Array.from({ length: 27 }, (_, i) => fmtTime(9 * 60 + i * 30)),
    [],
  );
  const [day, setDay] = useState(dayOptions[2]); // 기본 = 3일 뒤
  const [time, setTime] = useState(fmtTime(18 * 60)); // 기본 오후 6:00

  useEffect(() => {
    onChange(`${day} ${time}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, time]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dropdown
        value={day}
        options={dayOptions}
        onChange={setDay}
        widthClass="w-40"
      />
      <Dropdown
        value={time}
        options={timeOptions}
        onChange={setTime}
        widthClass="w-28"
      />
      <span className="text-[13px] font-semibold text-ink-faint">까지</span>
    </div>
  );
}
