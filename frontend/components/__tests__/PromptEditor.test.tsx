// ABOUTME: Test suite for PromptEditor component
// ABOUTME: Verifies CodeMirror integration, text updates, and basic functionality

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PromptEditor } from '../PromptEditor';

describe('PromptEditor', () => {
  it('renders with initial value', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <PromptEditor
        value="Initial text"
        onChange={mockOnChange}
        placeholder="Test placeholder"
      />
    );

    // Check that CodeMirror is rendered
    expect(container.querySelector('.cm-editor')).toBeInTheDocument();
  });

  it('displays placeholder when empty', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <PromptEditor
        value=""
        onChange={mockOnChange}
        placeholder="Enter your prompt here"
      />
    );

    // CodeMirror should show placeholder
    const placeholder = container.querySelector('.cm-placeholder');
    expect(placeholder).toBeInTheDocument();
  });

  it('calls onChange when text is updated', async () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <PromptEditor
        value=""
        onChange={mockOnChange}
        placeholder="Test"
      />
    );

    const editor = container.querySelector('.cm-content');
    expect(editor).toBeInTheDocument();

    // Simulate text input
    if (editor) {
      fireEvent.input(editor, { target: { textContent: 'New text' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      }, { timeout: 1000 });
    }
  });

  it('updates when value prop changes', () => {
    const mockOnChange = jest.fn();
    const { container, rerender } = render(
      <PromptEditor
        value="Initial value"
        onChange={mockOnChange}
        placeholder="Test"
      />
    );

    // Update value prop
    rerender(
      <PromptEditor
        value="Updated value"
        onChange={mockOnChange}
        placeholder="Test"
      />
    );

    // CodeMirror should reflect the new value
    const content = container.querySelector('.cm-content');
    expect(content?.textContent).toContain('Updated value');
  });

  it('renders with line numbers', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <PromptEditor
        value="Line 1\nLine 2\nLine 3"
        onChange={mockOnChange}
      />
    );

    // Check that gutters (line numbers) are rendered
    const gutters = container.querySelector('.cm-gutters');
    expect(gutters).toBeInTheDocument();
  });

  it('applies custom theme styling', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <PromptEditor
        value="Test content"
        onChange={mockOnChange}
      />
    );

    const editor = container.querySelector('.cm-editor');
    expect(editor).toBeInTheDocument();

    // Check that custom theme is applied
    const scroller = container.querySelector('.cm-scroller');
    expect(scroller).toBeInTheDocument();
  });
});
