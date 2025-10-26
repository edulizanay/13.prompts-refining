// ABOUTME: Root layout for Next.js app
// ABOUTME: Sets up global styles, metadata, and page structure

import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Promptster',
  description: 'Test and compare LLM prompts across different models',
  icons: {
    icon: {
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%231a1a1a"/><g fill="%23ffffff"><ellipse cx="10" cy="11" rx="2.5" ry="3.5"/><ellipse cx="22" cy="11" rx="2.5" ry="3.5"/><circle cx="16" cy="17" r="7"/><circle cx="13" cy="16" r="1.5" fill="%231a1a1a"/><circle cx="19" cy="16" r="1.5" fill="%231a1a1a"/><ellipse cx="16" cy="20" rx="3" ry="2" fill="%23e0e0e0"/><circle cx="14.5" cy="20" r="0.6" fill="%231a1a1a"/><circle cx="17.5" cy="20" r="0.6" fill="%231a1a1a"/></g></svg>',
      type: 'image/svg+xml',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50">{children}</body>
    </html>
  );
}
