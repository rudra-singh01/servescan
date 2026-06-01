import type { Metadata } from 'next';
import { Syne, DM_Sans, JetBrains_Mono, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: '--font-devanagari',
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'ScanServe — QR Digital Menu for Restaurants',
  description: 'Create beautiful digital menus with QR codes. No app download needed.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrains.variable} ${notoDevanagari.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
