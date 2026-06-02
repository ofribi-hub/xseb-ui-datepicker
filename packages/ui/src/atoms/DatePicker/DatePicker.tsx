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
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];

  for (let i = first.getDay(); i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }
  return days;
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

const WEEKDAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
    setStyle({
      top,
      left: rect.left + rect.width / 2 - YEAR_LIST_WIDTH / 2,
      width: YEAR_LIST_WIDTH,
    });
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
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(() => startOfMonth(value ?? new Date()));
    const controls = useAnimationControls();
    const yearControls = useAnimationControls();
    const triggerId = useId();
    const yearBtnRef = useRef<HTMLButtonElement>(null);
    const activeYearRef = useRef<HTMLButtonElement>(null);
    const yearListPosition = useYearListPosition(yearBtnRef, yearOpen);

    useEffect(() => {
      if (value) setViewDate(startOfMonth(value));
    }, [value]);

    const closeCalendar = useCallback(async () => {
      await controls.start('closed');
      setOpen(false);
    }, [controls]);

    useEffect(() => {
      if (open) controls.start('open');
    }, [open, controls]);

    const closeYearList = useCallback(async () => {
      await yearControls.start('closed');
      setYearOpen(false);
    }, [yearControls]);

    const openYearList = useCallback(() => {
      setYearOpen(true);
    }, []);

    useEffect(() => {
      if (yearOpen) {
        yearControls.start('open');
        // scroll active year into view after render
        setTimeout(() => activeYearRef.current?.scrollIntoView({ block: 'center' }), 0);
      }
    }, [yearOpen, yearControls]);

    const days = useMemo(
      () => getDaysInGrid(viewDate.getFullYear(), viewDate.getMonth()),
      [viewDate]
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

    const handlePrevMonth = () =>
      setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));

    const handleNextMonth = () =>
      setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const handleDayClick = (day: Date) => {
      onChange?.(day);
      closeCalendar();
    };

    const handleYearSelect = (year: number) => {
      setViewDate(new Date(year, viewDate.getMonth(), 1));
      closeYearList();
    };

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
                  // don't close calendar when interacting with year list portal
                  if ((e.target as Element)?.closest('[data-year-list]')) return;
                  closeCalendar();
                }}
                sideOffset={6}
              >
                <CalendarPanel
                  animate={controls}
                  aria-label="Date picker"
                  exit="closed"
                  initial="closed"
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
                      onClick={handlePrevMonth}
                      type="button"
                    >
                      <StrokeIcon name="CaretLeft" size={16} />
                    </NavButton>

                    <HeaderCenter>
                      <MonthLabel aria-live="polite">{monthName}</MonthLabel>

                      <YearButton
                        ref={yearBtnRef}
                        aria-expanded={yearOpen}
                        aria-haspopup="listbox"
                        aria-label="Select year"
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
                      onClick={handleNextMonth}
                      type="button"
                    >
                      <StrokeIcon name="CaretRight" size={16} />
                    </NavButton>
                  </CalendarHeader>

                  <WeekdayGrid aria-hidden>
                    {WEEKDAYS_SHORT.map((wd) => (
                      <WeekdayLabel key={wd}>{wd}</WeekdayLabel>
                    ))}
                  </WeekdayGrid>

                  <DayGrid aria-label={monthLabel} role="grid">
                    {days.map((day, idx) => {
                      const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                      const isSelected = value ? isSameDay(day, value) : false;
                      const isToday = isSameDay(day, today);
                      const isDisabled =
                        (min ? isBeforeDay(day, min) : false) ||
                        (max ? isAfterDay(day, max) : false);

                      return (
                        <DayCell
                          aria-label={day.toLocaleDateString(locale, {
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
                          key={idx}
                          onClick={() => handleDayClick(day)}
                          role="gridcell"
                          tabIndex={isSelected || (!value && isToday) ? 0 : -1}
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
                animate={yearControls}
                data-year-list
                exit="closed"
                initial="closed"
                role="listbox"
                aria-label="Select year"
                style={yearListPosition}
                variants={yearListVariants}
              >
                {years.map((y) => {
                  const isActive = y === viewDate.getFullYear();
                  return (
                    <YearOption
                      aria-selected={isActive}
                      isActive={isActive}
                      key={y}
                      onClick={() => handleYearSelect(y)}
                      ref={isActive ? activeYearRef : undefined}
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
