import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Shed',
  description: 'A focused practice environment for jazz improvisation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
