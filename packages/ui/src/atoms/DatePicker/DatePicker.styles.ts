import { motion } from 'framer-motion';
import { styled } from 'styled-components';
import { fromTheme, scale, scaleArbitrarily } from 'theme';

export const TriggerWrapper = styled.div<{ compact?: boolean; fullWidth?: boolean }>`
  --stroke: ${fromTheme('palette.scales.base.border.solid')};
  --fill: ${fromTheme('palette.scales.base.background.app')};
  --text: ${fromTheme('palette.scales.base.text.alt')};
  --placeholder-color: ${fromTheme('palette.scales.disabled.text.element')};

  position: relative;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  max-width: ${({ fullWidth }) => (fullWidth ? '100%' : 'var(--xseb-max-input-width)')};

  > i {
    position: absolute;
    inset-inline-end: ${scale('md')};
    color: ${fromTheme('palette.scales.base.text.element')};
    pointer-events: none;
    z-index: 1;
  }
`;

export const TriggerButton = styled.button<{ compact?: boolean; hasValue?: boolean }>`
  all: unset;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: ${fromTheme('radii.lg')};
  box-shadow: inset 0 0 0 ${scale('xs')} var(--master-stroke, var(--stroke));
  background-color: var(--fill);
  color: ${({ hasValue }) => (hasValue ? 'var(--text)' : 'var(--placeholder-color)')};
  font-size: calc(${fromTheme('font.baseSize')} - 1px);
  padding-block: 12.5px;
  padding-inline: ${scale('xxl')};
  padding-inline-end: calc(${scale('xxl')} + 24px + ${scale('sm')});
  transition:
    box-shadow 150ms linear,
    background-color 150ms linear;
  line-height: 1;

  &:hover:not(:disabled) {
    --stroke: ${fromTheme('palette.scales.disabled.text.element')};
  }

  &:focus-visible {
    --stroke: ${fromTheme('palette.focusColor')};
  }

  &[aria-expanded='true'] {
    --stroke: ${fromTheme('palette.focusColor')};
  }

  &[aria-invalid='true'] {
    --master-stroke: ${fromTheme('palette.scales.danger.border.element')};
  }

  &:disabled {
    --fill: ${fromTheme('palette.scales.disabled.background.solid')};
    --text: ${fromTheme('palette.scales.disabled.text.solid')};
    --stroke: ${fromTheme('palette.scales.disabled.border.solid')};
    pointer-events: none;
    color: var(--text);
  }

  ${({ compact }) =>
    compact &&
    `
    padding-block: 8px;
    font-size: 14px;
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px var(--master-stroke, var(--stroke));
  `}
`;

export const CalendarPanel = styled(motion.div)`
  background-color: ${fromTheme('palette.scales.base.background.app')};
  box-shadow: ${(props) => props.theme.shadows[3]};
  border-radius: ${fromTheme('radii.lg')};
  padding: ${scale('lg')};
  min-width: ${scaleArbitrarily(70)};
  z-index: 10;
`;

export const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${scale('md')};
`;

export const HeaderCenter = styled.div`
  display: flex;
  align-items: center;
  gap: ${scaleArbitrarily(1.5)};
`;

export const MonthLabel = styled.span`
  font-size: calc(${fromTheme('font.baseSize')} - 1px);
  font-weight: 600;
  color: ${fromTheme('palette.scales.base.text.alt')};
  user-select: none;
`;

export const YearButton = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  gap: ${scaleArbitrarily(1)};
  font-size: calc(${fromTheme('font.baseSize')} - 1px);
  font-weight: 600;
  color: ${fromTheme('palette.scales.base.text.alt')};
  background-color: ${fromTheme('palette.scales.base.background.element')};
  border-radius: ${fromTheme('radii.sm')};
  padding: 2px ${scaleArbitrarily(2)};
  cursor: pointer;
  transition: background-color 150ms linear;
  user-select: none;

  > i {
    color: ${fromTheme('palette.scales.base.text.element')};
  }

  &:hover {
    background-color: ${fromTheme('palette.scales.base.background.elementHovered')};
  }

  &:focus-visible {
    outline: 2px solid ${fromTheme('palette.focusColor')};
    outline-offset: 1px;
  }
`;

export const YearList = styled(motion.div)`
  position: fixed;
  background-color: ${fromTheme('palette.scales.base.background.app')};
  box-shadow: ${(props) => props.theme.shadows[3]};
  border-radius: ${fromTheme('radii.lg')};
  overflow-y: auto;
  max-height: ${scaleArbitrarily(45)};
  min-width: ${scaleArbitrarily(20)};
  z-index: 9999;
  padding: ${scaleArbitrarily(1)} 0;
`;

export const YearOption = styled.button<{ isActive?: boolean }>`
  all: unset;
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: ${scaleArbitrarily(1.5)} ${scale('md')};
  font-size: calc(${fromTheme('font.baseSize')} - 2px);
  cursor: pointer;
  text-align: center;
  transition: background-color 100ms linear;

  color: ${({ isActive, theme }) =>
    isActive ? theme.palette.scales.primary.text.element : theme.palette.scales.base.text.alt};

  font-weight: ${({ isActive }) => (isActive ? 700 : 400)};

  background-color: ${({ isActive, theme }) =>
    isActive
      ? `color-mix(in srgb, ${theme.palette.scales.primary.background.solid} 10%, transparent)`
      : 'transparent'};

  &:hover {
    background-color: ${fromTheme('palette.scales.base.background.element')};
  }

  &:focus-visible {
    outline: 2px solid ${fromTheme('palette.focusColor')};
    outline-offset: -2px;
  }
`;

export const NavButton = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${scaleArbitrarily(8)};
  height: ${scaleArbitrarily(8)};
  border-radius: ${fromTheme('radii.md')};
  color: ${fromTheme('palette.scales.base.text.element')};
  cursor: pointer;
  transition: background-color 150ms linear;

  &:hover {
    background-color: ${fromTheme('palette.scales.base.background.solid')};
    color: ${fromTheme('palette.scales.base.text.solid')};
  }

  &:focus-visible {
    outline: 2px solid ${fromTheme('palette.focusColor')};
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.35;
    pointer-events: none;
  }
`;

export const WeekdayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: ${scale('sm')};
`;

export const WeekdayLabel = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(${fromTheme('font.baseSize')} - 3px);
  font-weight: 700;
  color: ${fromTheme('palette.scales.base.text.element')};
  user-select: none;
  padding-block: ${scale('xs')};
  text-transform: uppercase;
`;

export const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${scaleArbitrarily(0.5)};
`;

export const DayCell = styled.button<{
  isSelected?: boolean;
  isToday?: boolean;
  isOutsideMonth?: boolean;
}>`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${scaleArbitrarily(9)};
  height: ${scaleArbitrarily(9)};
  border-radius: ${fromTheme('radii.md')};
  font-size: calc(${fromTheme('font.baseSize')} - 2px);
  cursor: pointer;
  transition:
    background-color 150ms linear,
    color 150ms linear,
    box-shadow 150ms linear;
  user-select: none;

  color: ${({ isOutsideMonth, isSelected, theme }) => {
    if (isSelected) return theme.palette.scales.primary.text.solid;
    if (isOutsideMonth) return theme.palette.scales.disabled.text.element;
    return theme.palette.scales.base.text.alt;
  }};

  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.palette.scales.primary.background.solid : 'transparent'};

  box-shadow: ${({ isToday, isSelected, theme }) =>
    isToday && !isSelected ? `inset 0 0 0 1px ${theme.palette.scales.primary.border.element}` : 'none'};

  font-weight: ${({ isSelected }) => (isSelected ? 600 : 400)};

  &:hover:not(:disabled) {
    background-color: ${({ isSelected, theme }) =>
      isSelected
        ? theme.palette.scales.primary.background.solidHovered
        : theme.palette.scales.base.background.solid};
    color: ${({ isSelected, theme }) =>
      isSelected ? theme.palette.scales.primary.text.solid : theme.palette.scales.base.text.solid};
  }

  &:active:not(:disabled) {
    background-color: ${({ isSelected, theme }) =>
      isSelected
        ? theme.palette.scales.primary.background.solidActive
        : theme.palette.scales.base.background.solidActive};
  }

  &:focus-visible {
    outline: 2px solid ${fromTheme('palette.focusColor')};
    outline-offset: 1px;
  }

  &:disabled {
    color: ${fromTheme('palette.scales.disabled.text.element')};
    pointer-events: none;
    opacity: 0.5;
  }
`;
