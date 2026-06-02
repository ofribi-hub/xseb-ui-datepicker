# DatePicker — Component Specification

> Package: `@acsbe/ui` · Atom · Status: Stable

---

## 1. Overview

`DatePicker` is a fully accessible, locale-aware date-selection input built for the xseb-ui design system. It renders a styled trigger button that opens a popover calendar (via Radix UI Popover) with a month grid, an animated year-picker portal (via framer-motion + `createPortal`), and full keyboard navigation conforming to the ARIA Grid pattern. All visual tokens (color, spacing, radius, typography) are sourced from `fromTheme()` — consistent with the `Input`, `Select`, and `Button` atom patterns. No additional npm packages are required beyond those already present in the monorepo.

---

## 2. File Structure

```
packages/ui/src/atoms/DatePicker/
  DatePicker.tsx          — component logic, keyboard navigation, year portal
  DatePicker.styles.ts    — all styled-components
  index.ts                — named re-export
packages/ui/src/atoms/index.tsx   — export line added here
apps/gallery/src/atoms/DatePicker.stories.tsx — Storybook stories
```

---

## 3. Installation / Integration

Follow these steps when adding `DatePicker` to an existing monorepo workspace.

### Step 1 — Copy the component folder

```bash
cp -r DatePicker/ packages/ui/src/atoms/DatePicker/
```

### Step 2 — Verify the barrel export

Open `packages/ui/src/atoms/index.tsx` and confirm the following line is present (add it if missing):

```ts
export { DatePicker } from './DatePicker';
```

### Step 3 — Verify the icon dependency

`DatePicker.tsx` imports `CaretDown` from `StrokeIcon`. Confirm that icon exists:

```ts
import { StrokeIcon } from '../StrokeIcon';
// uses: <StrokeIcon name="CaretDown" />
```

If `CaretDown` is not available in the current icon set, replace it with `ChevronDown` or whichever caret/chevron variant the project exposes.

### Step 4 — Build and type-check

```bash
pnpm --filter @acsbe/ui build
```

Resolve any TypeScript errors before proceeding.

### Step 5 — Import in consuming code

```ts
import { DatePicker } from '@acsbe/ui';
```

---

## 4. Dependencies

All dependencies are already installed in the monorepo. No new packages are required.

| Package | Usage |
|---|---|
| `@radix-ui/react-popover` | Calendar popover overlay |
| `framer-motion` | Year-list open/close animation |
| `react-dom` (`createPortal`) | Year list rendered outside popover DOM node |
| `styled-components` | All component styles |

---

## 5. Usage Examples

### Basic uncontrolled usage

```tsx
import { DatePicker } from '@acsbe/ui';
import { useState } from 'react';

function Example() {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <DatePicker
      value={date}
      onChange={setDate}
      placeholder="Select a date"
    />
  );
}
```

### With min/max date constraints

```tsx
<DatePicker
  value={date}
  onChange={setDate}
  min={new Date('2024-01-01')}
  max={new Date('2024-12-31')}
/>
```

Dates outside the range are rendered in the calendar as visually dimmed and are not selectable.

### Compact + full-width inside a form

```tsx
<DatePicker
  value={date}
  onChange={setDate}
  compact
  fullWidth
  invalid={!!formErrors.date}
  placeholder="Date of birth"
/>
```

### Locale-aware rendering (French, Monday week start)

```tsx
<DatePicker
  value={date}
  onChange={setDate}
  locale="fr-FR"
/>
```

Weekday headers render as "LU MA ME JE VE SA DI". Week start is auto-detected from the locale. To force a specific week start regardless of locale, use `weekStartOverride`.

---

## 6. Props API

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `Date \| undefined` | `undefined` | Currently selected date. |
| `onChange` | `(date: Date) => void` | `undefined` | Callback fired when the user selects a day. |
| `min` | `Date \| undefined` | `undefined` | Earliest selectable date (inclusive). Days before this are disabled. |
| `max` | `Date \| undefined` | `undefined` | Latest selectable date (inclusive). Days after this are disabled. |
| `placeholder` | `string` | `"Select date"` | Text shown in the trigger when no date is selected. |
| `disabled` | `boolean` | `false` | Disables the trigger button and prevents the calendar from opening. |
| `compact` | `boolean` | `false` | Reduces padding and font size — suitable for dense form layouts. |
| `fullWidth` | `boolean` | `false` | Sets the trigger width to `100%` of its container. |
| `invalid` | `boolean` | `false` | Applies a danger-colored border to the trigger — for form validation state. |
| `locale` | `string` | `"en-US"` | BCP 47 locale tag. Controls weekday label language, week start day, and date display format. |
| `weekStartOverride` | `0 \| 1` | auto | Force week start: `0` = Sunday, `1` = Monday. Overrides locale-derived value. |

---

## 7. Keyboard Navigation

`DatePicker` implements the [ARIA Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) keyboard pattern for the day grid.

### Calendar grid

| Key | Action |
|---|---|
| `Arrow Left / Right` | Move focus to the previous / next day |
| `Arrow Up / Down` | Move focus one week backward / forward |
| `Home` | Move focus to the first day of the current week row |
| `End` | Move focus to the last day of the current week row |
| `Page Up` | Navigate to the previous month |
| `Page Down` | Navigate to the next month |
| `Enter` or `Space` | Select the focused day and close the calendar |
| `Escape` | Close the calendar popover |

### Year list

| Key | Action |
|---|---|
| `Arrow Up / Down` | Navigate between years |
| `Enter` or `Space` | Select the focused year (focus returns to year button) |
| `Escape` | Close the year list without selecting |

### Focus management

When the calendar opens, focus is placed on:
1. The currently selected date — if one is set.
2. Today's date — if no date is selected and today is in the displayed month.
3. The first day of the displayed month — otherwise.

---

## 8. Locale & Internationalization

### Week start day

Week start is derived automatically from `Intl.Locale.weekInfo` for the given `locale` prop. This means:

- `"en-US"` → Sunday start
- `"fr-FR"`, `"de-DE"`, `"he-IL"` → Monday start

To override the auto-detected value, pass `weekStartOverride={0}` (Sunday) or `weekStartOverride={1}` (Monday).

### Weekday header labels

Headers are generated using `Intl.DateTimeFormat` with `{ weekday: 'short' }` for the active locale. For example:

| Locale | Headers |
|---|---|
| `en-US` | Su Mo Tu We Th Fr Sa |
| `fr-FR` | LU MA ME JE VE SA DI |
| `he-IL` | א׳ ב׳ ג׳ ד׳ ה׳ ו׳ ש׳ |

### Date display in trigger

The trigger button formats the selected date using `date.toLocaleDateString(locale)`, so output matches OS/browser locale conventions automatically.

### RTL support

For RTL locales (`he`, `ar`, and others), the component sets `dir="auto"` on the root element. Styled-components rules that need directional adjustment should use logical CSS properties where possible.

---

## 9. Design System Alignment

### Token usage

All design values are consumed via `fromTheme()` — no hardcoded colors, spacing, or radii. The component follows the same token conventions as `Input`, `Select`, and `Button`:

| Token category | Usage |
|---|---|
| Colors | Trigger border, focus ring, disabled state, danger (`invalid`) border, selected-day background, today ring |
| Spacing | Trigger padding (default and `compact`), calendar cell size, year list item padding |
| Border radius | Trigger, popover container, individual day cells |
| Typography | Trigger font size (default and `compact`), weekday headers, day numbers, year list items |

### Visual states mapped to existing patterns

| State | Visual treatment | Mirrors |
|---|---|---|
| `disabled` | Reduced opacity on trigger, pointer-events none | `Input[disabled]` |
| `invalid` | Danger-color border on trigger | `Input[invalid]` |
| `compact` | Smaller padding + font | `Input[compact]` / `Select[compact]` |
| `fullWidth` | `width: 100%` | `Input[fullWidth]` |
| Today | Primary-color border ring on day cell | — |
| Selected day | Primary background on day cell | `Button[variant=primary]` |
| Out-of-month days | Dimmed text | — |
| Disabled days (min/max) | Dimmed + `pointer-events: none` | — |

---

## 10. Storybook Reference

Stories live at:

```
apps/gallery/src/atoms/DatePicker.stories.tsx
```

| Story name | What it demonstrates |
|---|---|
| `Default` | Uncontrolled trigger, no selected date |
| `WithValue` | Pre-selected date |
| `Compact` | Reduced-size variant |
| `Disabled` | Disabled trigger state |
| `WithMinMax` | Date range constraints |
| `FullWidth` | Full-container-width trigger |
| `Gallery` | All variants side-by-side |

Run Storybook from the repo root:

```bash
pnpm --filter gallery storybook
```

---

## 11. Edge Cases

| Scenario | Behavior |
|---|---|
| Day is before `min` or after `max` | Rendered dimmed, `aria-disabled="true"`, not focusable or selectable |
| Days outside the current display month | Shown for grid completeness, visually dimmed |
| Year list opens near bottom of viewport | Position adapts — opens upward if insufficient space below |
| Year list scrolling | Auto-scrolls to the current calendar year when opened |
| Clicking outside the popover | Closes the calendar; clicks inside the year list portal do not accidentally close the popover |
| Calendar closes after selection | Fires `onChange`, then closes the popover in the same interaction |
| No `onChange` provided | Component renders but selection is a no-op (no runtime error) |

---

## 12. Known Limitations & Open Questions

- **`Intl.Locale.weekInfo` browser support:** `weekInfo` is not available in Safari < 15.4 and some older Chromium versions. In unsupported environments the component falls back to Sunday (`0`) as the week start day. If Monday-by-default is required in those environments, pass `weekStartOverride={1}` explicitly.
- **Time values:** The component selects calendar dates only (midnight local time). If the consuming feature needs time-of-day, a separate `TimePicker` or combined `DateTimePicker` would be needed.
- **Year range:** The year list range is currently fixed. If the product requires dynamic or configurable year bounds, a `minYear` / `maxYear` prop would need to be added.
- **Single-date only:** Range selection (start date + end date) is not supported. A `DateRangePicker` would be a separate component.
- **Controlled month navigation:** There is no prop to control or read the currently displayed month from outside the component. This is an internal concern today; if external control is needed, a `displayMonth` / `onDisplayMonthChange` prop pair would be required.
