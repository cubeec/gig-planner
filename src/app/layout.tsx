import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Divná Bára — Gig Planner',
  description: 'Band gig management for Divná Bára — add, view, and manage upcoming concerts.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
