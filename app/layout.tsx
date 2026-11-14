import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Air Quality | APIVerve Template',
  description: 'The air quality right now in any city: an AQI score, pollutant levels and what it means for you. An APIVerve template.'
};

export const viewport: Viewport = { themeColor: '#eaf4f1' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
