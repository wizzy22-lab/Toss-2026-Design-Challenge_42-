import { useEffect, useMemo, useState } from "react";
import Dropdown from "./Dropdown";
import { addDays, atMidnight, fmtDay, fmtTime24 } from "../lib/date";

/** 상위로 넘기는 응답 마감 — 라벨 + 마감 날짜(요일) */
export interface DeadlineSelection {
  label: string;
  date: Date;
}

/** 응답 마감 = "~일 ~시까지" — 날짜 드롭다운 + 시간 드롭다운. 기본값 있음(저마찰). */
export default function DeadlinePicker({
  onChange,
}: {
  onChange: (d: DeadlineSelection) => void;
}) {
  const today = useMemo(() => atMidnight(new Date()), []);
  // 날짜 = 회의 생성일 당일부터 14일
  const dayDates = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(today, i)),
    [today],
  );
  const dayOptions = useMemo(() => dayDates.map(fmtDay), [dayDates]);
  // 시간 = 09:00~22:00, 1시간 단위 (24시간제)
  const timeOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => fmtTime24((9 + i) * 60)),
    [],
  );
  const [day, setDay] = useState(dayOptions[2]); // 기본 = 2일 뒤
  const [time, setTime] = useState(fmtTime24(18 * 60)); // 기본 18:00

  useEffect(() => {
    const idx = Math.max(0, dayOptions.indexOf(day));
    onChange({ label: `${day} ${time}`, date: dayDates[idx] });
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
    </div>
  );
}
