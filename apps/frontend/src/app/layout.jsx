import '../styles/globals.css';
import AuthBootstrap from '../components/AuthBootstrap';

export const metadata = {
  title: 'نظام إدارة الأيتام والأسر',
  description: 'منصة متكاملة لإدارة كفالة الأيتام والأسر المحتاجة — تتبع الكفالات، الصرفيات، والتقارير',
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
