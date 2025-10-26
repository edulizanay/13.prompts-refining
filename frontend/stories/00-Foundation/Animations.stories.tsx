// ABOUTME: Storybook story showcasing all animation utilities
// ABOUTME: Displays fade, slide, scale, spin, and pulse animations with examples

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const meta: Meta = {
  title: '00-Foundation/Animations',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const AnimationDemo = ({
  animationClass,
  label
}: {
  animationClass: string;
  label: string;
}) => {
  const [key, setKey] = useState(0);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm font-semibold text-neutral-900">{animationClass}</span>
        <Button
          variant="secondary"
          size="small"
          onClick={() => setKey(k => k + 1)}
        >
          Replay
        </Button>
      </div>
      <div className="flex items-center justify-center p-8 bg-neutral-50 rounded-lg border border-neutral-200">
        <div
          key={key}
          className={`px-6 py-3 bg-purple-500 text-white rounded-md font-medium ${animationClass}`}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

export const FadeAnimations: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Fade Animations</h1>

      <AnimationDemo animationClass="animate-fade-in" label="Fade In (200ms)" />
      <AnimationDemo animationClass="animate-fade-out" label="Fade Out (150ms)" />
    </div>
  ),
};

export const SlideAnimations: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Slide Animations</h1>

      <h2 className="text-lg font-semibold text-neutral-700 mb-4">Slide In</h2>
      <AnimationDemo animationClass="animate-slide-in-from-top" label="Slide In from Top" />
      <AnimationDemo animationClass="animate-slide-in-from-bottom" label="Slide In from Bottom" />
      <AnimationDemo animationClass="animate-slide-in-from-left" label="Slide In from Left" />
      <AnimationDemo animationClass="animate-slide-in-from-right" label="Slide In from Right" />

      <h2 className="text-lg font-semibold text-neutral-700 mb-4 mt-8">Slide Out</h2>
      <AnimationDemo animationClass="animate-slide-out-to-top" label="Slide Out to Top" />
      <AnimationDemo animationClass="animate-slide-out-to-bottom" label="Slide Out to Bottom" />
    </div>
  ),
};

export const ScaleAnimations: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Scale Animations</h1>

      <AnimationDemo animationClass="animate-scale-in" label="Scale In (200ms)" />
      <AnimationDemo animationClass="animate-scale-out" label="Scale Out (150ms)" />
    </div>
  ),
};

export const LoadingAnimations: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Loading Animations</h1>

      <div className="space-y-6">
        {/* Spin */}
        <div>
          <span className="font-mono text-sm font-semibold text-neutral-900 mb-2 block">animate-spin</span>
          <div className="flex items-center gap-4 p-8 bg-neutral-50 rounded-lg border border-neutral-200">
            <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-neutral-600">Loading spinner (infinite rotation)</span>
          </div>
        </div>

        {/* Pulse */}
        <div>
          <span className="font-mono text-sm font-semibold text-neutral-900 mb-2 block">animate-pulse</span>
          <div className="flex items-center gap-4 p-8 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="w-12 h-12 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-neutral-600">Pulsing indicator (infinite fade)</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const CombinedExample: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Combined Example</h1>

        <div className="space-y-4">
          <Button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? 'Hide' : 'Show'} Modal Example
          </Button>

          {isOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-neutral-900/50 animate-fade-in z-40" onClick={() => setIsOpen(false)} />

              {/* Modal */}
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div
                  className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full animate-scale-in pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Example Modal</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    This modal uses <span className="font-mono text-xs">animate-scale-in</span> for the content
                    and <span className="font-mono text-xs">animate-fade-in</span> for the backdrop.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={() => setIsOpen(false)}>
                      Confirm
                    </Button>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Usage Example</h3>
          <pre className="text-xs font-mono text-neutral-700 overflow-x-auto">
{`// Modal backdrop
<div className="animate-fade-in" />

// Modal content
<div className="animate-scale-in">
  ...
</div>`}
          </pre>
        </div>
      </div>
    );
  },
};

export const AllAnimations: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">All Animations</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-neutral-700 mb-4">Fade</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-xs font-mono text-neutral-600">animate-fade-in</div>
            <div className="text-xs font-mono text-neutral-600">animate-fade-out</div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-700 mb-4">Slide In</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-xs font-mono text-neutral-600">animate-slide-in-from-top</div>
            <div className="text-xs font-mono text-neutral-600">animate-slide-in-from-bottom</div>
            <div className="text-xs font-mono text-neutral-600">animate-slide-in-from-left</div>
            <div className="text-xs font-mono text-neutral-600">animate-slide-in-from-right</div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-700 mb-4">Slide Out</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-xs font-mono text-neutral-600">animate-slide-out-to-top</div>
            <div className="text-xs font-mono text-neutral-600">animate-slide-out-to-bottom</div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-700 mb-4">Scale</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-xs font-mono text-neutral-600">animate-scale-in</div>
            <div className="text-xs font-mono text-neutral-600">animate-scale-out</div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-700 mb-4">Loading</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-xs font-mono text-neutral-600">animate-spin</div>
            <div className="text-xs font-mono text-neutral-600">animate-pulse</div>
          </div>
        </section>
      </div>

      <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="text-sm font-semibold text-purple-900 mb-2">💡 Best Practices</h3>
        <ul className="text-xs text-purple-800 space-y-1">
          <li>• Use fade-in/scale-in for modals and dialogs</li>
          <li>• Use slide animations for dropdowns and tooltips</li>
          <li>• Use spin for loading indicators</li>
          <li>• Use pulse for skeleton screens or attention states</li>
          <li>• Keep animations subtle (200-300ms) for professional feel</li>
        </ul>
      </div>
    </div>
  ),
};
