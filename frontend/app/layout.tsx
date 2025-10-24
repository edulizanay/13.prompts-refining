// ABOUTME: Root layout for Next.js app
// ABOUTME: Sets up global styles, metadata, and page structure

import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Prompt Refinement UI',
  description: 'Test and compare LLM prompts across different models',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background">{children}</body>
    </html>
  );
}
