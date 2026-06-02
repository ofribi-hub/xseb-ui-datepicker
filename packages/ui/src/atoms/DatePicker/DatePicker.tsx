import * as Popover from '@radix-ui/react-popover';
import { AnimatePresence, useAnimationControls } from 'framer-motion';
import {
  ComponentProps,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { StrokeIcon } from '../icons';
import {
  CalendarHeader,
  CalendarPanel,
  DayCell,
  DayGrid,
  HeaderCenter,
  MonthLabel,
  NavButton,
  TriggerButton,
  TriggerWrapper,
  WeekdayGrid,
  WeekdayLabel,
  YearButton,
  YearList,
  YearOption,
} from './DatePicker.styles';

export interface DatePickerProps extends Omit<ComponentProps<'button'>, 'onChange' | 'value'> {
  compact?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  invalid?: boolean;
  locale?: string;
  max?: Date;
  min?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  value?: Date;
  weekStartOverride?: 0 | 1;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getWeekStart(locale: string): number {
  // 1=Monday, 7=Sunday in Intl.Locale weekInfo
  // Returns 0 (Sun) or 1 (Mon) for use with Date.getDay()
  try {
    const loc = new Intl.Locale(locale) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const firstDay = loc.weekInfo?.firstDay ?? loc.getWeekInfo?.()?.firstDay ?? 7;
    return firstDay === 7 ? 0 : firstDay; // Intl uses 7 for Sunday
  } catch {
    return 0; // fallback: Sunday
  }
}

function getDaysInGrid(year: number, month: number, weekStart: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  // offset = how many days to prepend before the 1st
  const offset = (first.getDay() - weekStart + 7) % 7;
  for (let i = offset; i > 0; i--) days.push(new Date(year, month, 1 - i));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) days.push(new Date(year, month + 1, d));
  return days;
}

function getWeekdayLabels(locale: string, weekStart: number): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(2024, 0, 7 + (weekStart + i) % 7); // Jan 7 2024 = Sunday
    return day.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2).toUpperCase();
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  return (
    new Date(a.getFullYear(), a.getMonth(), a.getDate()) <
    new Date(b.getFullYear(), b.getMonth(), b.getDate())
  );
}

function isAfterDay(a: Date, b: Date): boolean {
  return (
    new Date(a.getFullYear(), a.getMonth(), a.getDate()) >
    new Date(b.getFullYear(), b.getMonth(), b.getDate())
  );
}


const panelVariants = {
  closed: { opacity: 0, scale: 0.93, transition: { duration: 0.12, ease: 'linear' } },
  open: { opacity: 1, scale: 1, transition: { duration: 0.15, ease: 'linear' } },
};

const yearListVariants = {
  closed: { opacity: 0, scale: 0.93, transition: { duration: 0.1, ease: 'linear' } },
  open: { opacity: 1, scale: 1, transition: { duration: 0.12, ease: 'linear' } },
};

const YEAR_LIST_WIDTH = 88;
const YEAR_LIST_MAX_HEIGHT = 180;

function useYearListPosition(
  btnRef: React.RefObject<HTMLButtonElement>,
  open: boolean
): React.CSSProperties {
  const [style, setStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow >= YEAR_LIST_MAX_HEIGHT + 8
        ? rect.bottom + 4
        : rect.top - Math.min(YEAR_LIST_MAX_HEIGHT, rect.top - 8) - 4;
    setStyle({ top, left: rect.left + rect.width / 2 - YEAR_LIST_WIDTH / 2, width: YEAR_LIST_WIDTH });
  }, [open, btnRef]);
  return style;
}

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      compact,
      disabled,
      fullWidth,
      invalid,
      locale = 'en-US',
      max,
      min,
      onChange,
      placeholder = 'Select date',
      value,
      weekStartOverride,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(() => startOfMonth(value ?? new Date()));
    const [focusedIdx, setFocusedIdx] = useState<number>(-1);

    const controls = useAnimationControls();
    const yearControls = useAnimationControls();
    const triggerId = useId();
    const gridId = useId();
    const yearBtnRef = useRef<HTMLButtonElement>(null);
    const activeYearRef = useRef<HTMLButtonElement>(null);
    const dayRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const yearListRef = useRef<HTMLDivElement>(null);
    const yearListPosition = useYearListPosition(yearBtnRef, yearOpen);

    useEffect(() => {
      if (value) setViewDate(startOfMonth(value));
    }, [value]);

    const weekStart: 0 | 1 = weekStartOverride !== undefined ? weekStartOverride : (getWeekStart(locale) as 0 | 1);

    // ── Calendar open/close ──────────────────────────────────────────────────

    const closeCalendar = useCallback(async () => {
      await controls.start('closed');
      setOpen(false);
    }, [controls]);

    useEffect(() => {
      if (!open) return;
      controls.start('open');
      // focus the selected day, today, or the first enabled day
      const today = new Date();
      setTimeout(() => {
        const days = getDaysInGrid(viewDate.getFullYear(), viewDate.getMonth(), weekStart);
        const targetIdx =
          days.findIndex((d) => value && isSameDay(d, value)) !== -1
            ? days.findIndex((d) => value && isSameDay(d, value))
            : days.findIndex((d) => isSameDay(d, today) && d.getMonth() === viewDate.getMonth());
        const idx = targetIdx >= 0 ? targetIdx : days.findIndex((d) => d.getMonth() === viewDate.getMonth());
        setFocusedIdx(idx);
        dayRefs.current[idx]?.focus();
      }, 50);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset focus index when view month changes
    useEffect(() => {
      if (!open) return;
      const days = getDaysInGrid(viewDate.getFullYear(), viewDate.getMonth(), weekStart);
      const idx = days.findIndex((d) => d.getMonth() === viewDate.getMonth());
      setFocusedIdx(idx);
      setTimeout(() => dayRefs.current[idx]?.focus(), 0);
    }, [viewDate]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Year list open/close ─────────────────────────────────────────────────

    const closeYearList = useCallback(async () => {
      await yearControls.start('closed');
      setYearOpen(false);
    }, [yearControls]);

    const openYearList = useCallback(() => setYearOpen(true), []);

    useEffect(() => {
      if (!yearOpen) return;
      yearControls.start('open');
      setTimeout(() => {
        activeYearRef.current?.scrollIntoView({ block: 'center' });
        activeYearRef.current?.focus();
      }, 0);
    }, [yearOpen, yearControls]);

    // ── Computed values ──────────────────────────────────────────────────────

    const days = useMemo(
      () => getDaysInGrid(viewDate.getFullYear(), viewDate.getMonth(), weekStart),
      [viewDate, weekStart]
    );

    const weekdayLabels = useMemo(
      () => getWeekdayLabels(locale, weekStart),
      [locale, weekStart]
    );

    const monthLabel = useMemo(
      () => viewDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
      [viewDate, locale]
    );

    const monthName = useMemo(
      () => viewDate.toLocaleDateString(locale, { month: 'long' }),
      [viewDate, locale]
    );

    const minYear = min ? min.getFullYear() : viewDate.getFullYear() - 50;
    const maxYear = max ? max.getFullYear() : viewDate.getFullYear() + 20;
    const years = useMemo(
      () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
      [minYear, maxYear]
    );

    const displayValue = useMemo(
      () =>
        value
          ? value.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
          : null,
      [value, locale]
    );

    // ── Navigation helpers ───────────────────────────────────────────────────

    const goToPrevMonth = useCallback(
      () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)),
      []
    );

    const goToNextMonth = useCallback(
      () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)),
      []
    );

    const handleDayClick = useCallback(
      (day: Date) => {
        onChange?.(day);
        closeCalendar();
      },
      [onChange, closeCalendar]
    );

    const handleYearSelect = useCallback(
      (year: number) => {
        setViewDate((d) => new Date(year, d.getMonth(), 1));
        closeYearList();
        setTimeout(() => yearBtnRef.current?.focus(), 0);
      },
      [closeYearList]
    );

    // ── Keyboard: day grid ───────────────────────────────────────────────────

    const handleDayKeyDown = useCallback(
      (e: React.KeyboardEvent, idx: number) => {
        const total = days.length;
        let next = idx;

        switch (e.key) {
          case 'ArrowRight':
            next = idx + 1;
            break;
          case 'ArrowLeft':
            next = idx - 1;
            break;
          case 'ArrowDown':
            next = idx + 7;
            break;
          case 'ArrowUp':
            next = idx - 7;
            break;
          case 'Home':
            next = idx - (idx % 7); // start of week
            break;
          case 'End':
            next = idx - (idx % 7) + 6; // end of week
            break;
          case 'PageDown':
            e.preventDefault();
            goToNextMonth();
            return;
          case 'PageUp':
            e.preventDefault();
            goToPrevMonth();
            return;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (!dayRefs.current[idx]?.disabled) handleDayClick(days[idx]);
            return;
          case 'Escape':
            closeCalendar();
            return;
          case 'Tab':
            // allow natural tab to reach nav buttons
            return;
          default:
            return;
        }

        e.preventDefault();
        next = Math.max(0, Math.min(total - 1, next));
        setFocusedIdx(next);
        dayRefs.current[next]?.focus();
      },
      [days, goToNextMonth, goToPrevMonth, handleDayClick, closeCalendar]
    );

    // ── Keyboard: year list ──────────────────────────────────────────────────

    const handleYearListKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const currentYear = viewDate.getFullYear();
        const currentIdx = years.indexOf(currentYear);

        switch (e.key) {
          case 'ArrowDown': {
            e.preventDefault();
            const next = years[Math.min(currentIdx + 1, years.length - 1)];
            // focus next option
            const el = yearListRef.current?.querySelectorAll('button')[Math.min(currentIdx + 1, years.length - 1)];
            (el as HTMLButtonElement)?.focus();
            break;
          }
          case 'ArrowUp': {
            e.preventDefault();
            const el = yearListRef.current?.querySelectorAll('button')[Math.max(currentIdx - 1, 0)];
            (el as HTMLButtonElement)?.focus();
            break;
          }
          case 'Escape':
            closeYearList();
            setTimeout(() => yearBtnRef.current?.focus(), 0);
            break;
          case 'Tab':
            closeYearList();
            break;
        }
      },
      [viewDate, years, closeYearList]
    );

    // ── Keyboard: calendar panel (catch-all Escape) ──────────────────────────

    const handlePanelKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && !yearOpen) {
          closeCalendar();
        }
      },
      [yearOpen, closeCalendar]
    );

    const today = new Date();

    return (
      <Popover.Root
        onOpenChange={(next) => {
          if (!next) closeCalendar();
          else setOpen(true);
        }}
        open={open}
      >
        <TriggerWrapper compact={compact} fullWidth={fullWidth}>
          <Popover.Trigger asChild>
            <TriggerButton
              {...props}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-invalid={invalid || undefined}
              aria-label={displayValue ?? placeholder}
              compact={compact}
              disabled={disabled}
              hasValue={!!displayValue}
              id={triggerId}
              ref={ref}
              type="button"
            >
              {displayValue ?? placeholder}
            </TriggerButton>
          </Popover.Trigger>

          <StrokeIcon name="CalendarBlank" size={16} />
        </TriggerWrapper>

        <AnimatePresence>
          {open && (
            <Popover.Portal forceMount>
              <Popover.Content
                asChild
                onInteractOutside={(e) => {
                  if ((e.target as Element)?.closest('[data-year-list]')) return;
                  closeCalendar();
                }}
                sideOffset={6}
              >
                <CalendarPanel
                  animate={controls}
                  aria-label="Date picker"
                  dir="auto"
                  exit="closed"
                  initial="closed"
                  onKeyDown={handlePanelKeyDown}
                  role="dialog"
                  variants={panelVariants}
                >
                  <CalendarHeader>
                    <NavButton
                      aria-label="Previous month"
                      disabled={
                        min
                          ? !isAfterDay(
                              new Date(viewDate.getFullYear(), viewDate.getMonth(), 1),
                              startOfMonth(min)
                            )
                          : false
                      }
                      onClick={goToPrevMonth}
                      type="button"
                    >
                      <StrokeIcon name="CaretLeft" size={16} />
                    </NavButton>

                    <HeaderCenter>
                      <MonthLabel aria-live="polite" id={`${gridId}-label`}>
                        {monthName}
                      </MonthLabel>

                      <YearButton
                        ref={yearBtnRef}
                        aria-expanded={yearOpen}
                        aria-haspopup="listbox"
                        aria-label={`Select year, currently ${viewDate.getFullYear()}`}
                        onClick={() => (yearOpen ? closeYearList() : openYearList())}
                        type="button"
                      >
                        {viewDate.getFullYear()}
                        <StrokeIcon name="CaretDown" size={10} />
                      </YearButton>
                    </HeaderCenter>

                    <NavButton
                      aria-label="Next month"
                      disabled={
                        max
                          ? isAfterDay(
                              new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
                              new Date(max.getFullYear(), max.getMonth() + 1, 1)
                            )
                          : false
                      }
                      onClick={goToNextMonth}
                      type="button"
                    >
                      <StrokeIcon name="CaretRight" size={16} />
                    </NavButton>
                  </CalendarHeader>

                  <WeekdayGrid aria-hidden>
                    {weekdayLabels.map((wd, i) => (
                      <WeekdayLabel key={i}>{wd}</WeekdayLabel>
                    ))}
                  </WeekdayGrid>

                  <DayGrid
                    aria-labelledby={`${gridId}-label`}
                    aria-multiselectable={false}
                    role="grid"
                  >
                    {days.map((day, idx) => {
                      const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                      const isSelected = value ? isSameDay(day, value) : false;
                      const isToday = isSameDay(day, today);
                      const isDisabled =
                        (min ? isBeforeDay(day, min) : false) ||
                        (max ? isAfterDay(day, max) : false);

                      return (
                        <DayCell
                          key={idx}
                          ref={(el) => { dayRefs.current[idx] = el; }}
                          aria-label={day.toLocaleDateString(locale, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                          aria-pressed={isSelected}
                          aria-selected={isSelected}
                          disabled={isDisabled}
                          isOutsideMonth={!isCurrentMonth}
                          isSelected={isSelected}
                          isToday={isToday}
                          onClick={() => handleDayClick(day)}
                          onKeyDown={(e) => handleDayKeyDown(e, idx)}
                          role="gridcell"
                          tabIndex={idx === focusedIdx ? 0 : -1}
                          type="button"
                        >
                          {day.getDate()}
                        </DayCell>
                      );
                    })}
                  </DayGrid>
                </CalendarPanel>
              </Popover.Content>
            </Popover.Portal>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {yearOpen &&
            createPortal(
              <YearList
                ref={yearListRef}
                animate={yearControls}
                aria-label="Select year"
                data-year-list
                exit="closed"
                initial="closed"
                onKeyDown={handleYearListKeyDown}
                role="listbox"
                style={yearListPosition}
                variants={yearListVariants}
              >
                {years.map((y) => {
                  const isActive = y === viewDate.getFullYear();
                  return (
                    <YearOption
                      key={y}
                      ref={isActive ? activeYearRef : undefined}
                      aria-selected={isActive}
                      isActive={isActive}
                      onClick={() => handleYearSelect(y)}
                      role="option"
                      type="button"
                    >
                      {y}
                    </YearOption>
                  );
                })}
              </YearList>,
              document.body
            )}
        </AnimatePresence>
      </Popover.Root>
    );
  }
);

DatePicker.displayName = 'DatePicker';
