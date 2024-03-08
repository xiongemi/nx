import type { Meta, StoryObj } from '@storybook/react';
import { TaskInputsAccordion } from './task-inputs-accordion';

const meta: Meta<typeof TaskInputsAccordion> = {
  component: TaskInputsAccordion,
  title: 'Tooltips/TaskInputsAccordion',
};

export default meta;
type Story = StoryObj<typeof TaskInputsAccordion>;

export const Primary: Story = {
  args: {
    id: 'my-lib:build',
    inputs: {
      'my-lib': ['file1', 'file2'],
      general: ['file2', 'file3'],
      external: ['file4', 'file5'],
    },
  },
  render: (args) => <TaskInputsAccordion {...args} />,
};
