// ABOUTME: Storybook stories for Button component with all variants and states
// ABOUTME: Interactive controls for testing different button configurations

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Save, Trash2, Plus } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: '01-Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
      description: 'Button visual style',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Interactive playground
export const Playground: Story = {
  args: {
    variant: 'primary',
    size: 'medium',
    children: 'Click me',
    disabled: false,
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

// All sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">
        <Save className="w-4 h-4" />
        Save
      </Button>
      <Button variant="secondary">
        <Plus className="w-4 h-4" />
        Add Item
      </Button>
      <Button variant="outline">
        <Plus className="w-4 h-4" />
        Add Item
      </Button>
      <Button variant="destructive">
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
    </div>
  ),
};

// Icon only
export const IconOnly: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary" className="w-9 px-0">
        <Plus className="w-4 h-4" />
      </Button>
      <Button variant="secondary" className="w-9 px-0">
        <Save className="w-4 h-4" />
      </Button>
      <Button variant="ghost" className="w-9 px-0">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  ),
};

// Disabled states
export const DisabledStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary" disabled>
        Primary Disabled
      </Button>
      <Button variant="secondary" disabled>
        Secondary Disabled
      </Button>
      <Button variant="outline" disabled>
        Outline Disabled
      </Button>
      <Button variant="ghost" disabled>
        Ghost Disabled
      </Button>
      <Button variant="destructive" disabled>
        Destructive Disabled
      </Button>
    </div>
  ),
};

// Loading state (custom implementation)
export const LoadingState: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary" disabled>
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
      </Button>
      <Button variant="secondary" disabled>
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      </Button>
    </div>
  ),
};

// Full width
export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      <Button variant="primary" className="w-full">
        Full Width Primary
      </Button>
      <Button variant="secondary" className="w-full">
        Full Width Secondary
      </Button>
    </div>
  ),
};
