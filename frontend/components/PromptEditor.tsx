// ABOUTME: CodeMirror-based editor component for prompt text editing
// ABOUTME: Provides line numbers, custom scrollbar, and viewport-relative sizing

'use client';

import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PromptEditor({ value, onChange, placeholder }: PromptEditorProps) {
  const [isFocused, setIsFocused] = useState(false);

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
  });

  // Extensions for line numbers and custom placeholder
  const extensions = [
    customTheme,
    EditorView.lineWrapping,
    EditorState.tabSize.of(2),
    ...(placeholder ? [
      EditorView.domEventHandlers({
        focus: () => setIsFocused(true),
        blur: () => setIsFocused(false),
      }),
    ] : []),
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
          foldGutter: false,
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
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: false,
        }}
      />
    </div>
  );
}
