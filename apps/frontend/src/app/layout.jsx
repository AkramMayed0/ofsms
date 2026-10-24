import '../styles/globals.css';
import AuthBootstrap from '../components/AuthBootstrap';
import OfflineBanner from '../components/OfflineBanner';

export const metadata = {
  title: 'مؤسسة نماء التنموية الخيرية — نظام إدارة الأيتام والأسر',
  description: 'مؤسسة نماء التنموية الخيرية — منصة متكاملة لرعاية وتمكين الأيتام والأسر المحتاجة',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'نظام نماء',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1B5E8C',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/ikram-logo.png" />
      </head>
      <body>
        <OfflineBanner />
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
