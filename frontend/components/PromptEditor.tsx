// ABOUTME: CodeMirror-based editor component for prompt text editing
// ABOUTME: Provides line numbers, custom scrollbar, viewport-relative sizing, and syntax highlighting

'use client';

import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView, Decoration, ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';
import { EditorState, Range, StateEffect, StateField } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { foldService } from '@codemirror/language';
import { colors } from '@/tailwind.config';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

// Syntax highlighting plugin for {{variables}} and <tags>
const syntaxHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const decorations: Range<Decoration>[] = [];
      const text = view.state.doc.toString();

      // Match {{variables}}
      const variableRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
      let match: RegExpExecArray | null;

      while ((match = variableRegex.exec(text)) !== null) {
        const from = match.index;
        const to = from + match[0].length;
        decorations.push(
          Decoration.mark({
            class: 'cm-prompt-variable',
          }).range(from, to)
        );
      }

      // Match <tags>
      const tagRegex = /<\/?[a-zA-Z][a-zA-Z0-9]*>/g;
      while ((match = tagRegex.exec(text)) !== null) {
        const from = match.index;
        const to = from + match[0].length;
        decorations.push(
          Decoration.mark({
            class: 'cm-prompt-tag',
          }).range(from, to)
        );
      }

      // Match the word "json" (case-insensitive)
      const jsonRegex = /\bjson\b/gi;
      while ((match = jsonRegex.exec(text)) !== null) {
        const from = match.index;
        const to = from + match[0].length;
        decorations.push(
          Decoration.mark({
            class: 'cm-prompt-tag',
          }).range(from, to)
        );
      }

      return Decoration.set(decorations.sort((a, b) => a.from - b.from));
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// Indentation-based folding service
const indentFoldService = foldService.of((state, from) => {
  const line = state.doc.lineAt(from);
  const lineText = line.text;

  // Get indentation of current line
  const indent = lineText.match(/^\s*/)?.[0].length ?? 0;

  // Don't fold if line is empty or has no content after indent
  if (lineText.trim().length === 0) return null;

  let foldEnd = line.to;
  let nextLine = line.number + 1;

  // Find all subsequent lines with deeper indentation
  while (nextLine <= state.doc.lines) {
    const next = state.doc.line(nextLine);
    const nextText = next.text;
    const nextIndent = nextText.match(/^\s*/)?.[0].length ?? 0;

    // Skip empty lines
    if (nextText.trim().length === 0) {
      nextLine++;
      continue;
    }

    // Stop if we hit a line with same or less indentation
    if (nextIndent <= indent) break;

    foldEnd = next.to;
    nextLine++;
  }

  // Only fold if we found at least one indented line
  if (foldEnd > line.to) {
    return { from: line.to, to: foldEnd };
  }

  return null;
});

export function PromptEditor({ value, onChange, placeholder, onFocus, onBlur }: PromptEditorProps) {
  const [lineWrapping, setLineWrapping] = useState(true);

  // Custom theme with purple focus ring and styled scrollbar
  const customTheme = EditorView.theme({
    '&': {
      fontSize: '0.875rem',
      fontFamily: "'Courier New', Courier, monospace",
      height: '50vh',
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: '0.375rem',
      backgroundColor: 'white',
    },
    '&.cm-focused': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${colors.purple[500]}`,
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: "'Courier New', Courier, monospace",
    },
    '.cm-content': {
      padding: '0.5rem 0.75rem',
      fontFamily: "'Courier New', Courier, monospace",
    },
    '.cm-placeholder': {
      color: colors.neutral[400],
      fontFamily: "'Courier New', Courier, monospace",
    },
    // Line numbers styling
    '.cm-gutters': {
      backgroundColor: colors.neutral[50],
      borderRight: `1px solid ${colors.neutral[200]}`,
      color: colors.neutral[400],
      paddingRight: '0.5rem',
      minWidth: '2.5rem',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      minWidth: '2rem',
      textAlign: 'right',
      paddingRight: '0.5rem',
      color: colors.neutral[400],
    },
    // Scrollbar styling - only visible on hover
    '.cm-scroller::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '.cm-scroller::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '.cm-scroller::-webkit-scrollbar-thumb': {
      background: 'transparent',
      borderRadius: '3px',
    },
    '.cm-scroller:hover::-webkit-scrollbar-thumb': {
      background: colors.neutral[300],
    },
    '.cm-scroller::-webkit-scrollbar-thumb:hover': {
      background: colors.neutral[400],
    },
    // Syntax highlighting styles
    '.cm-prompt-variable': {
      color: colors.purple[500],
      fontWeight: '700',
      background: colors.purple[50],
      borderRadius: '2px',
      padding: '0 2px',
    },
    '.cm-prompt-tag': {
      color: colors.purple[500],
      fontWeight: '700',
      background: colors.purple[50],
      borderRadius: '2px',
      padding: '0 2px',
    },
    // Fold gutter styling
    '.cm-foldGutter': {
      backgroundColor: colors.neutral[50],
    },
    // Hide fold placeholder ([...])
    '.cm-foldPlaceholder': {
      display: 'none',
    },
  });

  // Focus and blur event handler extension
  const focusBlurHandler = EditorView.domEventHandlers({
    focus: () => {
      onFocus?.();
      return false;
    },
    blur: () => {
      onBlur?.();
      return false;
    },
  });

  // Toggle line wrapping keybinding (Ctrl+Shift+Z)
  const toggleWrapKeymap = keymap.of([
    {
      key: 'Ctrl-Shift-z',
      run: () => {
        setLineWrapping((prev) => !prev);
        return true;
      },
    },
  ]);

  // Extensions for line numbers, syntax highlighting, folding, and custom placeholder
  const extensions = [
    customTheme,
    syntaxHighlightPlugin,
    indentFoldService,
    focusBlurHandler,
    toggleWrapKeymap,
    ...(lineWrapping ? [EditorView.lineWrapping] : []),
    EditorState.tabSize.of(2),
  ];

  return (
    <div className="prompt-editor-wrapper">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightSelectionMatches: false,
          closeBracketsKeymap: true,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: false,
          lintKeymap: false,
        }}
      />
    </div>
  );
}
