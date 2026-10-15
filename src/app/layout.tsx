import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: '../../public/fonts/geist.woff2',
  variable: '--font-geist-sans',
});

const geistMono = localFont({
  src: '../../public/fonts/geist-mono.woff2',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'SazonareFood - Sistema ERP & POS',
  description: 'Plataforma de comandas en tiempo real y administración para restaurante',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100">{children}</body>
    </html>
  );
}
