import React from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import '@/styles/globals.css';

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata = {
  title: 'ThreadLearn',
  description: 'ThreadLearn - AI-powered concurrency learning platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className={jetBrainsMono.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
