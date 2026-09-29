import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'MeetSpace — Zoom Video Conferencing Clone',
  description:
    'Production-grade video conferencing web application inspired by Zoom with instant meetings, scheduling, meeting rooms, participant moderation, and live chat.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 text-zinc-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
