// ABOUTME: Textarea editor for prompt markdown with autosave on blur (500ms debounce)
// ABOUTME: Auto-expands height; includes onboarding placeholder when empty

'use client';

import { useRef, useEffect, useState } from 'react';

interface PromptEditorProps {
  text: string;
  onChange: (text: string) => void;
}

const ONBOARDING_PLACEHOLDER = `Write your prompt here. Use {{variables}} for dynamic inputs.

Example:
You are a helpful assistant. The user asks: {{user_message}}
Respond professionally.`;

export function PromptEditor({ text, onChange }: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isChanged, setIsChanged] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (newText: string) => {
    onChange(newText);
    setIsChanged(true);

    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Debounce saves
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsChanged(false);
    }, 500);
  };

  useEffect(() => {
    // Initial height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Prompt</label>
        {isChanged && <span className="text-xs text-blue-500 font-medium">Saving...</span>}
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={ONBOARDING_PLACEHOLDER}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none min-h-[300px]"
      />
    </div>
  );
}
