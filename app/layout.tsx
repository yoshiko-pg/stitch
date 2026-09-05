import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'ito — クロスステッチ図案室',
  description: '画像から糸番号付きの図案へ。一針ずつ進める運針ガイド。',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
