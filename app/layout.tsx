import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { InventoryProvider } from '@/context/InventoryContext';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StockFlow — Inventory Management OS',
  description: 'Next.js 16 Inventory Management with connected Stock, Sales, Purchase, Godowns & Reports',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InventoryProvider>
          <Sidebar>{children}</Sidebar>
        </InventoryProvider>
      </body>
    </html>
  );
}