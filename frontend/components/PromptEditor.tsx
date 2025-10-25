// ABOUTME: CodeMirror-based editor component for prompt text editing
// ABOUTME: Provides line numbers, custom scrollbar, viewport-relative sizing, and syntax highlighting

'use client';

import CodeMirror from '@uiw/react-codemirror';
import { EditorView, Decoration, ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';
import { EditorState, Range } from '@codemirror/state';
import { foldService } from '@codemirror/language';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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

export function PromptEditor({ value, onChange, placeholder }: PromptEditorProps) {
  // Custom theme with purple focus ring and styled scrollbar
  const customTheme = EditorView.theme({
    '&': {
      fontSize: '0.875rem',
      fontFamily: "'Courier New', Courier, monospace",
      minHeight: '30vh',
      maxHeight: '60vh',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      backgroundColor: 'white',
    },
    '&.cm-focused': {
      outline: 'none',
      boxShadow: '0 0 0 2px #8685ef',
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
      color: '#9ca3af',
      fontFamily: "'Courier New', Courier, monospace",
    },
    // Line numbers styling
    '.cm-gutters': {
      backgroundColor: '#fafafa',
      borderRight: '1px solid #e5e7eb',
      color: '#c4b5fd',
      paddingRight: '0.5rem',
      minWidth: '2.5rem',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      minWidth: '2rem',
      textAlign: 'right',
      paddingRight: '0.5rem',
      color: '#c4b5fd',
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
      background: '#d1d5db',
    },
    '.cm-scroller::-webkit-scrollbar-thumb:hover': {
      background: '#9ca3af',
    },
    // Syntax highlighting styles
    '.cm-prompt-variable': {
      color: '#8685ef',
      fontWeight: '700',
      background: '#faf8ff',
      borderRadius: '2px',
      padding: '0 2px',
    },
    '.cm-prompt-tag': {
      color: '#8685ef',
      fontWeight: '700',
      background: '#faf8ff',
      borderRadius: '2px',
      padding: '0 2px',
    },
    // Fold gutter styling
    '.cm-foldGutter': {
      backgroundColor: '#fafafa',
    },
    // Hide fold placeholder ([...])
    '.cm-foldPlaceholder': {
      display: 'none',
    },
  });

  // Extensions for line numbers, syntax highlighting, folding, and custom placeholder
  const extensions = [
    customTheme,
    syntaxHighlightPlugin,
    indentFoldService,
    EditorView.lineWrapping,
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
