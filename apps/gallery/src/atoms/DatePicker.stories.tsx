import { DatePicker } from '@acsbe/ui/src/atoms/DatePicker';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Flex, Grid } from '@acsbe/ui';

type StoryMeta = Meta<typeof DatePicker>;
type Story = StoryObj<typeof DatePicker>;

const meta: StoryMeta = {
  component: DatePicker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  title: 'Atoms/DatePicker',
};
export default meta;

export const Default: Story = {
  render(args) {
    const [value, setValue] = useState<Date | undefined>();
    return (
      <DatePicker
        {...args}
        onChange={setValue}
        value={value}
      />
    );
  },
};

export const WithValue: Story = {
  render(args) {
    const [value, setValue] = useState<Date | undefined>(new Date());
    return (
      <DatePicker
        {...args}
        onChange={setValue}
        value={value}
      />
    );
  },
};

export const Compact: Story = {
  render(args) {
    const [value, setValue] = useState<Date | undefined>();
    return (
      <DatePicker
        {...args}
        compact
        onChange={setValue}
        value={value}
      />
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Select date' },
};

export const WithMinMax: Story = {
  render(args) {
    const [value, setValue] = useState<Date | undefined>();
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5);
    const max = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);
    return (
      <DatePicker
        {...args}
        max={max}
        min={min}
        onChange={setValue}
        placeholder="Limited range"
        value={value}
      />
    );
  },
};

export const FullWidth: Story = {
  render(args) {
    const [value, setValue] = useState<Date | undefined>();
    return (
      <div style={{ width: 320 }}>
        <DatePicker
          {...args}
          fullWidth
          onChange={setValue}
          value={value}
        />
      </div>
    );
  },
};

export const Gallery: Story = {
  render() {
    const [value, setValue] = useState<Date | undefined>(new Date());
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5);
    const max = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);

    return (
      <Grid
        cols="repeat(2, min-content)"
        gap={1.5}
        padding="xxl"
        align="start"
      >
        <DatePicker
          onChange={setValue}
          placeholder="Default"
          value={value}
        />
        <DatePicker
          compact
          onChange={setValue}
          placeholder="Compact"
          value={value}
        />
        <DatePicker
          disabled
          placeholder="Disabled"
        />
        <DatePicker
          max={max}
          min={min}
          onChange={setValue}
          placeholder="With min/max"
          value={value}
        />
      </Grid>
    );
  },
};
