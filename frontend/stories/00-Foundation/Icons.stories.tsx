// ABOUTME: Storybook story showcasing Lucide icons from design-context.yaml
// ABOUTME: Displays common icons at different sizes with usage guidelines

import type { Meta, StoryObj } from '@storybook/react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Copy,
  Download,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  File,
  FileText,
  Image,
  Code,
  Terminal,
} from 'lucide-react';

const meta: Meta = {
  title: '00-Foundation/Icons',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const IconShowcase = ({ name, icon: Icon }: { name: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-3 p-3 rounded hover:bg-neutral-50">
    <Icon className="w-5 h-5 text-neutral-700" />
    <span className="text-sm font-mono text-neutral-900">{name}</span>
  </div>
);

export const AllIcons: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Icon System</h1>

      <p className="text-sm text-neutral-600 mb-8">
        Using Lucide Icons with 2px stroke width, inheriting parent text color
      </p>

      {/* Icon Sizes */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Icon Sizes</h2>
        <div className="flex items-end gap-6">
          <div className="text-center">
            <AlertCircle className="w-3 h-3 text-neutral-700 mb-2 mx-auto" />
            <div className="text-xs text-neutral-500">xs (12px)</div>
          </div>
          <div className="text-center">
            <AlertCircle className="w-4 h-4 text-neutral-700 mb-2 mx-auto" />
            <div className="text-xs text-neutral-500">sm (16px)</div>
          </div>
          <div className="text-center">
            <AlertCircle className="w-5 h-5 text-neutral-700 mb-2 mx-auto" />
            <div className="text-xs text-neutral-500">base (20px)</div>
          </div>
          <div className="text-center">
            <AlertCircle className="w-6 h-6 text-neutral-700 mb-2 mx-auto" />
            <div className="text-xs text-neutral-500">lg (24px)</div>
          </div>
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-neutral-700 mb-2 mx-auto" />
            <div className="text-xs text-neutral-500">xl (32px)</div>
          </div>
        </div>
      </section>

      {/* Navigation Icons */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <IconShowcase name="ChevronLeft" icon={ChevronLeft} />
          <IconShowcase name="ChevronRight" icon={ChevronRight} />
          <IconShowcase name="ChevronDown" icon={ChevronDown} />
          <IconShowcase name="Menu" icon={Menu} />
          <IconShowcase name="X" icon={X} />
        </div>
      </section>

      {/* Action Icons */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <IconShowcase name="Plus" icon={Plus} />
          <IconShowcase name="Minus" icon={Minus} />
          <IconShowcase name="Edit" icon={Edit} />
          <IconShowcase name="Trash2" icon={Trash2} />
          <IconShowcase name="Save" icon={Save} />
          <IconShowcase name="Copy" icon={Copy} />
          <IconShowcase name="Download" icon={Download} />
        </div>
      </section>

      {/* Status Icons */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-3 p-3 rounded bg-success-50">
            <Check className="w-5 h-5 text-success-600" />
            <span className="text-sm font-mono text-success-600">Check (Success)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded bg-error-50">
            <XCircle className="w-5 h-5 text-error-600" />
            <span className="text-sm font-mono text-error-600">XCircle (Error)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded bg-warning-50">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <span className="text-sm font-mono text-warning-600">AlertTriangle (Warning)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded bg-neutral-100">
            <AlertCircle className="w-5 h-5 text-neutral-600" />
            <span className="text-sm font-mono text-neutral-600">AlertCircle (Info)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded bg-neutral-100">
            <Info className="w-5 h-5 text-neutral-600" />
            <span className="text-sm font-mono text-neutral-600">Info</span>
          </div>
        </div>
      </section>

      {/* Content Icons */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Content</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <IconShowcase name="File" icon={File} />
          <IconShowcase name="FileText" icon={FileText} />
          <IconShowcase name="Image" icon={Image} />
          <IconShowcase name="Code" icon={Code} />
          <IconShowcase name="Terminal" icon={Terminal} />
        </div>
      </section>
    </div>
  ),
};
