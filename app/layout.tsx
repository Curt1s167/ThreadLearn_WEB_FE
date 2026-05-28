import React from 'react';
import { Providers } from '@/components/providers/Providers';
import '@/styles/globals.css';

export const metadata = {
  title: 'ThreadLearn',
  description: 'ThreadLearn — Developer learning platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
