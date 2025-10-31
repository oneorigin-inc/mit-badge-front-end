import type { Metadata } from 'next';
import { Roboto, Roboto_Serif, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';

// DCC Brand Fonts - Roboto family
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-website'
});

const robotoSerif = Roboto_Serif({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-headline'
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-subhead'
});

// Set body font variable to Roboto Light
const robotoBody = Roboto({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: 'BadgeSmith - AI-Powered Badge Creator',
  description:
    'Create OpenBadges with AI assistance. Analyze content, get suggestions for title, description, and criteria, and export in OpenBadge 3.0 format.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${roboto.variable} ${robotoSerif.variable} ${robotoMono.variable} ${robotoBody.variable} font-website antialiased`}>
        <Header />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
