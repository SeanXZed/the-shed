import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter, Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'The Shed',
  description: 'A focused practice environment for jazz improvisation.',
};

/** Shrinks the layout viewport when the virtual keyboard opens (Android Chrome); pairs with practice-page flex tweaks. */
export const viewport: Viewport = {
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable, instrumentSerif.variable)}>
      <body className="font-sans">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
