// ABOUTME: Storybook story showcasing the complete color palette from design-context.yaml
// ABOUTME: Displays all color tokens (neutrals, purple accent, semantic colors) with swatches

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: '00-Foundation/Colors',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const ColorSwatch = ({ name, value, usage }: { name: string; value: string; usage: string }) => (
  <div className="flex items-center gap-4 mb-3">
    <div
      className="w-16 h-16 rounded-md border border-neutral-200 shadow-sm flex-shrink-0"
      style={{ backgroundColor: value }}
    />
    <div className="flex-1">
      <div className="font-mono text-sm font-semibold text-neutral-900">{name}</div>
      <div className="font-mono text-xs text-neutral-600">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{usage}</div>
    </div>
  </div>
);

export const AllColors: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Color System</h1>

      {/* Foundation - Neutrals */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Foundation (Neutrals)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <ColorSwatch name="white" value="#FFFFFF" usage="Content backgrounds, card surfaces" />
          <ColorSwatch name="neutral-50" value="#FAFAFA" usage="Page background, subtle separators" />
          <ColorSwatch name="neutral-100" value="#F5F5F5" usage="Hover states, inactive backgrounds" />
          <ColorSwatch name="neutral-200" value="#E5E5E5" usage="Borders, dividers, disabled states" />
          <ColorSwatch name="neutral-300" value="#D4D4D4" usage="Placeholder text, inactive icons" />
          <ColorSwatch name="neutral-400" value="#A3A3A3" usage="Secondary text, subtle icons" />
          <ColorSwatch name="neutral-500" value="#737373" usage="Body text, standard icons" />
          <ColorSwatch name="neutral-600" value="#525252" usage="Emphasis text, active icons" />
          <ColorSwatch name="neutral-700" value="#404040" usage="Headings, strong emphasis" />
          <ColorSwatch name="neutral-800" value="#262626" usage="Primary headings, high contrast" />
          <ColorSwatch name="neutral-900" value="#171717" usage="Maximum contrast, critical text" />
        </div>
      </section>

      {/* Accent - Purple */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Accent (Purple - Brand Color)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <ColorSwatch name="purple-50" value="#FAF8FF" usage="Subtle hover backgrounds, light accent" />
          <ColorSwatch name="purple-100" value="#F3EFFF" usage="Selected state backgrounds" />
          <ColorSwatch name="purple-200" value="#DEDBEE" usage="Borders on hover, subtle accents" />
          <ColorSwatch name="purple-500" value="#8685EF" usage="Primary interactive, brand color" />
          <ColorSwatch name="purple-600" value="#6B6AD4" usage="Hover states for primary actions" />
          <ColorSwatch name="purple-700" value="#5251B0" usage="Active/pressed states" />
        </div>
      </section>

      {/* Semantic Colors */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Semantic (Status Colors)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <ColorSwatch name="success-50" value="#F0FDF4" usage="Success message backgrounds" />
          <ColorSwatch name="success-500" value="#22C55E" usage="Success states, positive indicators" />
          <ColorSwatch name="success-600" value="#16A34A" usage="Success hover states" />
          <ColorSwatch name="warning-50" value="#FFFBEB" usage="Warning message backgrounds" />
          <ColorSwatch name="warning-500" value="#F59E0B" usage="Warning states, caution" />
          <ColorSwatch name="warning-600" value="#D97706" usage="Warning hover states" />
          <ColorSwatch name="error-50" value="#FEF2F2" usage="Error message backgrounds" />
          <ColorSwatch name="error-500" value="#EF4444" usage="Error states, critical indicators" />
          <ColorSwatch name="error-600" value="#DC2626" usage="Error hover states" />
        </div>
      </section>
    </div>
  ),
};
