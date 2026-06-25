import '../styles/globals.css';
import AuthBootstrap from '../components/AuthBootstrap';

export const metadata = {
  title: 'نظام إدارة الأيتام والأسر',
  description: 'منصة إدارة كفالة الأيتام والأسر المحتاجة',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
