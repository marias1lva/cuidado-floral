import * as React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

import { cn } from "./utils";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
};

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
};

function DatePicker({
  value,
  onChange,
  placeholder = "Selecione a data",
  min,
  max,
  required,
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState(() =>
    value ? parseDate(value) : startOfMonth(new Date()),
  );
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value) {
      setVisibleMonth(startOfMonth(parseDate(value)));
    }
  }, [value]);

  useOutsideClick(rootRef, () => setOpen(false));

  const days = React.useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const displayValue = value ? formatDisplayDate(value) : placeholder;

  function selectDate(day: Date) {
    const nextValue = toIsoDate(day);
    if (isDateDisabled(nextValue, min, max)) {
      return;
    }
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-invalid={ariaInvalid}
        aria-required={required}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-[var(--input-background)] px-3.5 py-2.5 text-left text-sm text-gray-700 shadow-sm outline-none transition-[border-color,box-shadow] hover:border-pink-300 focus-visible:border-pink-300 focus-visible:ring-2 focus-visible:ring-pink-100 aria-invalid:border-red-400 aria-invalid:bg-red-50",
          className,
        )}
      >
        <span className={cn("min-w-0 truncate", !value && "text-[var(--muted-foreground)]")}>
          {displayValue}
        </span>
        <CalendarDays className="size-4 shrink-0 text-pink-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[20rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-pink-200 bg-white p-3 shadow-xl shadow-pink-100/70">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
              className="flex size-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-sm font-semibold capitalize text-gray-700">
              {MONTH_FORMATTER.format(visibleMonth)}
            </div>
            <button
              type="button"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
              className="flex size-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
              aria-label="Próximo mês"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400">
            {WEEKDAYS.map((weekday, index) => (
              <div key={`${weekday}-${index}`} className="py-1">
                {weekday}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const iso = toIsoDate(day);
              const isSelected = value === iso;
              const isOutside = day.getMonth() !== visibleMonth.getMonth();
              const isToday = iso === toIsoDate(new Date());
              const disabled = isDateDisabled(iso, min, max);

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => selectDate(day)}
                  disabled={disabled}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl text-sm transition-colors",
                    isOutside && "text-gray-300",
                    !isOutside && "text-gray-700 hover:bg-pink-50",
                    isToday && "font-semibold text-pink-600",
                    isSelected && "bg-pink-100 font-semibold text-pink-700 hover:bg-pink-100",
                    disabled && "cursor-not-allowed text-gray-200 hover:bg-transparent",
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-pink-100 pt-3">
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="rounded-full bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 transition-colors hover:bg-pink-100"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimePicker({
  value,
  onChange,
  placeholder = "Selecione o horário",
  required,
  className,
  "aria-invalid": ariaInvalid,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const options = React.useMemo(() => buildTimeOptions(value), [value]);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  useOutsideClick(rootRef, () => setOpen(false));

  function selectTime(nextValue: string) {
    setDraft(nextValue);
    onChange(nextValue);
    setOpen(false);
  }

  function updateManualTime(nextDraft: string) {
    const formattedDraft = formatTimeDraft(nextDraft);
    setDraft(formattedDraft);

    if (/^\d{2}:\d{2}$/.test(formattedDraft)) {
      onChange(formattedDraft);
    }

    if (!formattedDraft) {
      onChange("");
    }
  }

  function commitManualTime() {
    const normalized = normalizeTimeDraft(draft);
    setDraft(normalized);
    onChange(normalized);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-invalid={ariaInvalid}
        aria-required={required}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-[var(--input-background)] px-3.5 py-2.5 text-left text-sm text-gray-700 shadow-sm outline-none transition-[border-color,box-shadow] hover:border-pink-300 focus-visible:border-pink-300 focus-visible:ring-2 focus-visible:ring-pink-100 aria-invalid:border-red-400 aria-invalid:bg-red-50",
          className,
        )}
      >
        <span className={cn("min-w-0 truncate", !value && "text-[var(--muted-foreground)]")}>
          {value || placeholder}
        </span>
        <Clock className="size-4 shrink-0 text-pink-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[18rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-pink-200 bg-white p-3 shadow-xl shadow-pink-100/70">
          <label className="mb-2 block text-xs font-semibold text-gray-500">
            Horário manual
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(event) => updateManualTime(event.target.value)}
            onBlur={commitManualTime}
            placeholder="HH:mm"
            className="mb-3 h-10 w-full rounded-2xl border border-pink-200 bg-[var(--input-background)] px-3 text-sm text-gray-700 outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted-foreground)] focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          />

          <div className="pretty-scrollbar grid max-h-52 grid-cols-3 gap-1 overflow-y-auto pr-1">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectTime(option)}
                className={cn(
                  "rounded-xl px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-pink-50",
                  value === option && "bg-pink-100 font-semibold text-pink-700 hover:bg-pink-100",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-3 flex justify-end border-t border-pink-100 pt-3">
            <button
              type="button"
              onClick={() => {
                setDraft("");
                onChange("");
              }}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function useOutsideClick(
  ref: React.RefObject<HTMLElement>,
  onOutsideClick: () => void,
) {
  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onOutsideClick();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onOutsideClick, ref]);
}

function buildCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function buildTimeOptions(currentValue: string) {
  const options = new Set<string>();

  for (let hour = 6; hour <= 20; hour += 1) {
    options.add(`${String(hour).padStart(2, "0")}:00`);
    options.add(`${String(hour).padStart(2, "0")}:30`);
  }

  if (/^\d{2}:\d{2}$/.test(currentValue)) {
    options.add(currentValue);
  }

  return Array.from(options).sort();
}

function formatTimeDraft(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  const hours = Math.min(Number(digits.slice(0, 2)), 23);
  const minutes = Math.min(Number(digits.slice(2, 4)), 59);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeTimeDraft(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    const hours = Math.min(Number(digits), 23);
    return `${String(hours).padStart(2, "0")}:00`;
  }

  return formatTimeDraft(digits);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  return DATE_FORMATTER.format(parseDate(value));
}

function isDateDisabled(value: string, min?: string, max?: string) {
  return Boolean((min && value < min) || (max && value > max));
}

export { DatePicker, TimePicker };
