// ABOUTME: Storybook story showcasing spacing scale from design-context.yaml
// ABOUTME: Visualizes the 8px-based spacing system with examples

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: '00-Foundation/Spacing',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const SpacingExample = ({ token, value, usage }: { token: string; value: string; usage: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-4 mb-2">
      <span className="font-mono text-sm font-semibold text-neutral-900 w-16">{token}</span>
      <span className="font-mono text-xs text-neutral-600 w-16">{value}</span>
      <div className="flex-1">
        <div className="bg-purple-500 rounded" style={{ width: value, height: '24px' }} />
      </div>
    </div>
    <div className="text-xs text-neutral-500 ml-32">{usage}</div>
  </div>
);

export const AllSpacing: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Spacing System</h1>

      <p className="text-sm text-neutral-600 mb-8">
        8px base grid for consistent rhythm and comfortable breathing room
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Spacing Scale</h2>

        <SpacingExample token="0.5" value="2px" usage="Tight coupling (icon-to-text gaps)" />
        <SpacingExample token="1" value="4px" usage="Minimal spacing (button padding internals)" />
        <SpacingExample token="2" value="8px" usage="Base rhythm (standard gaps)" />
        <SpacingExample token="3" value="12px" usage="Comfortable spacing (form elements)" />
        <SpacingExample token="4" value="16px" usage="Section padding (card internals)" />
        <SpacingExample token="5" value="20px" usage="Comfortable sections" />
        <SpacingExample token="6" value="24px" usage="Major spacing (between components)" />
        <SpacingExample token="8" value="32px" usage="Large sections (page padding)" />
        <SpacingExample token="10" value="40px" usage="Major sections" />
        <SpacingExample token="12" value="48px" usage="Dramatic separation" />
        <SpacingExample token="16" value="64px" usage="Hero spacing" />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Semantic Usage Examples</h2>

        <div className="space-y-6">
          {/* Component Internal Gap */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Component Internal Gap (space-2 = 8px)</h3>
            <div className="inline-flex gap-2 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="w-12 h-12 bg-purple-500 rounded" />
              <div className="w-12 h-12 bg-purple-500 rounded" />
              <div className="w-12 h-12 bg-purple-500 rounded" />
            </div>
          </div>

          {/* Component Padding */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Component Padding (p-4 = 16px)</h3>
            <div className="inline-block p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="w-24 h-12 bg-purple-500 rounded" />
            </div>
          </div>

          {/* Between Components */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Between Components (space-6 = 24px)</h3>
            <div className="inline-flex flex-col gap-6">
              <div className="w-48 h-12 bg-neutral-50 border border-neutral-200 rounded-lg" />
              <div className="w-48 h-12 bg-neutral-50 border border-neutral-200 rounded-lg" />
            </div>
          </div>

          {/* Section Padding */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Section Padding (p-8 = 32px)</h3>
            <div className="inline-block p-8 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="w-32 h-16 bg-purple-500 rounded" />
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};
