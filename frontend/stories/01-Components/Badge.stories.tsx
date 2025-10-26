// ABOUTME: Storybook stories for Badge component with all variants
// ABOUTME: Shows status indicators, labels, and counts

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/components/ui/badge';

const meta: Meta<typeof Badge> = {
  title: '01-Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'purple', 'success', 'warning', 'error'],
      description: 'Badge visual style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Interactive playground
export const Playground: Story = {
  args: {
    variant: 'default',
    children: 'Badge',
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="purple">Purple</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
    </div>
  ),
};

// Status indicators
export const StatusIndicators: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="success">Passing</Badge>
        <span className="text-sm text-neutral-600">All tests passed</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning">Malformed</Badge>
        <span className="text-sm text-neutral-600">Output format issue</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="error">Failed</Badge>
        <span className="text-sm text-neutral-600">Test failed</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="purple">Active</Badge>
        <span className="text-sm text-neutral-600">Currently running</span>
      </div>
    </div>
  ),
};

// Counts and labels
export const CountsAndLabels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="purple">3</Badge>
      <Badge variant="default">v3</Badge>
      <Badge variant="default">12k tokens</Badge>
      <Badge variant="success">85%</Badge>
      <Badge variant="purple">GPT-4</Badge>
    </div>
  ),
};

// In context (with text)
export const InContext: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="text-sm text-neutral-700">
        Prompt <Badge variant="purple">v3</Badge> achieved{' '}
        <Badge variant="success">95%</Badge> accuracy
      </div>
      <div className="text-sm text-neutral-700">
        Model: <Badge variant="default">GPT-4</Badge> • Status:{' '}
        <Badge variant="success">Passing</Badge>
      </div>
      <div className="text-sm text-neutral-700">
        Dataset contains <Badge variant="default">1,247 rows</Badge>
      </div>
    </div>
  ),
};
