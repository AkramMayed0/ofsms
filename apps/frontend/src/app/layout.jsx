import '../styles/globals.css';

export const metadata = {
  title: 'نظام إدارة الأيتام والأسر',
  description: 'منصة إدارة كفالة الأيتام والأسر المحتاجة',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
