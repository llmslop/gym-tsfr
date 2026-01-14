import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

export type MonthYear = {
  month: number; // 0-indexed
  year: number;
};

export function MonthPicker({
  value,
  onChange,
}: {
  value: MonthYear;
  onChange?: (newValue: MonthYear) => void;
}) {
  const t = useTranslations("datetime");
  const monthName = (m: number) => t("months." + m);
  const monthNameShort = (m: number) => t("monthsShort." + m);

  const [menuYear, setMenuYear] = useState<number>(value.year);

  const details = useRef<HTMLDetailsElement>(null);

  return (
    <div className="join">
      <button
        className="btn btn-primary join-item"
        onClick={() => {
          let newMonth = value.month - 1;
          const newYear = newMonth < 0 ? value.year - 1 : value.year;
          newMonth = (newMonth + 12) % 12;
          onChange?.({ month: newMonth, year: newYear });
        }}
      >
        {"<"}
      </button>
      <details
        className="join-item dropdown dropdown-center w-40"
        ref={details}
      >
        <summary className="btn btn-primary w-full">
          {monthName(value.month)}, {value.year}
        </summary>

        <div className="menu dropdown-content bg-base-300 rounded-box w-60 z-1 p-2 shadow-sm">
          <div className="w-full grid grid-cols-3">
            <div className="w-full col-start-1 col-span-3 flex items-center">
              <button
                className="btn btn-ghost join-item"
                onClick={() => setMenuYear(menuYear - 1)}
              >
                {"<"}
              </button>
              <span className="flex-1 text-center">{menuYear}</span>
              <button
                className="btn btn-ghost join-item"
                onClick={() => setMenuYear(menuYear + 1)}
              >
                {">"}
              </button>
            </div>
            {Array.from({ length: 12 }).map((_, month) => (
              <button
                key={`monthpicker-${month}`}
                className={
                  "btn " +
                  (month == value.month && menuYear == value.year
                    ? "btn-primary"
                    : "")
                }
                onClick={() => {
                  onChange?.({ month, year: menuYear });
                  details.current?.removeAttribute("open");
                }}
              >
                {monthNameShort(month)}
              </button>
            ))}
          </div>
        </div>
      </details>
      <button
        className="btn btn-primary join-item"
        onClick={() => {
          let newMonth = value.month + 1;
          const newYear = newMonth > 11 ? value.year + 1 : value.year;
          newMonth = newMonth % 12;
          onChange?.({ month: newMonth, year: newYear });
        }}
      >
        {">"}
      </button>
    </div>
  );
}
