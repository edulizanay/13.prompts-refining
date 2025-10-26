// ABOUTME: Storybook story showcasing typography scale from design-context.yaml
// ABOUTME: Displays all font sizes, line heights, and weights with examples

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: '00-Foundation/Typography',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const TypeSample = ({
  name,
  className,
  size,
  lineHeight,
  weight,
  usage
}: {
  name: string;
  className: string;
  size: string;
  lineHeight: string;
  weight: string;
  usage: string;
}) => (
  <div className="mb-8 pb-8 border-b border-neutral-200 last:border-0">
    <div className="mb-3">
      <span className="font-mono text-xs font-semibold text-neutral-900">{name}</span>
      <span className="text-xs text-neutral-500 ml-4">
        {size} / {lineHeight} / {weight}
      </span>
    </div>
    <div className={className}>
      The quick brown fox jumps over the lazy dog
    </div>
    <div className="text-xs text-neutral-500 mt-2">{usage}</div>
  </div>
);

export const AllScales: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Typography System</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Sans Serif (UI)</h2>

        <TypeSample
          name="display_large"
          className="text-4xl font-semibold text-neutral-900"
          size="36px"
          lineHeight="40px"
          weight="600"
          usage="Page titles, major section headers"
        />

        <TypeSample
          name="display"
          className="text-3xl font-semibold text-neutral-900"
          size="30px"
          lineHeight="36px"
          weight="600"
          usage="Section headers, modal titles"
        />

        <TypeSample
          name="heading_large"
          className="text-2xl font-semibold text-neutral-900"
          size="24px"
          lineHeight="32px"
          weight="600"
          usage="Card headers, subsection titles"
        />

        <TypeSample
          name="heading"
          className="text-xl font-semibold text-neutral-900"
          size="20px"
          lineHeight="28px"
          weight="600"
          usage="Component headers, labels"
        />

        <TypeSample
          name="subheading"
          className="text-lg font-medium text-neutral-900"
          size="18px"
          lineHeight="28px"
          weight="500"
          usage="Emphasized text, list headers"
        />

        <TypeSample
          name="body_large"
          className="text-base text-neutral-900"
          size="16px"
          lineHeight="24px"
          weight="400"
          usage="Primary content, comfortable reading"
        />

        <TypeSample
          name="body"
          className="text-sm text-neutral-900"
          size="14px"
          lineHeight="20px"
          weight="400"
          usage="Standard UI text, form labels"
        />

        <TypeSample
          name="small"
          className="text-xs text-neutral-900"
          size="12px"
          lineHeight="16px"
          weight="400"
          usage="Helper text, captions, metadata"
        />

        <TypeSample
          name="tiny"
          className="text-[11px] text-neutral-900"
          size="11px"
          lineHeight="14px"
          weight="400"
          usage="Timestamps, minor annotations"
        />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Monospace (Code/Technical)</h2>
        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="font-mono text-sm text-neutral-900 mb-2">
            function isPrime(n: number): boolean &#123;
          </div>
          <div className="font-mono text-sm text-neutral-900 ml-4 mb-2">
            if (n &lt;= 1) return false;
          </div>
          <div className="font-mono text-sm text-neutral-900 ml-4 mb-2">
            for (let i = 2; i * i &lt;= n; i++) &#123;
          </div>
          <div className="font-mono text-sm text-neutral-900 ml-8 mb-2">
            if (n % i === 0) return false;
          </div>
          <div className="font-mono text-sm text-neutral-900 ml-4 mb-2">
            &#125;
          </div>
          <div className="font-mono text-sm text-neutral-900 ml-4 mb-2">
            return true;
          </div>
          <div className="font-mono text-sm text-neutral-900">
            &#125;
          </div>
        </div>
        <div className="text-xs text-neutral-500 mt-3">
          Monospace font for code blocks, prompts, diffs, and technical content
        </div>
      </section>
    </div>
  ),
};
