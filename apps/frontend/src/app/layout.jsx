import '../styles/globals.css';
import AuthBootstrap from '../components/AuthBootstrap';

export const metadata = {
  title: 'مؤسسة نماء التنموية الخيرية — نظام إدارة الأيتام والأسر',
  description: 'مؤسسة نماء التنموية الخيرية — منصة متكاملة لرعاية وتمكين الأيتام والأسر المحتاجة',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
