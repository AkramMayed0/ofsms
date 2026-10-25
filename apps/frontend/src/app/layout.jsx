import '../styles/globals.css';
import AuthBootstrap from '../components/AuthBootstrap';
import OfflineBanner from '../components/OfflineBanner';
import ThemeBootstrap from '../components/ThemeBootstrap';

export const metadata = {
  title: 'مؤسسة نماء التنموية الخيرية — نظام إدارة الأيتام والأسر',
  description: 'مؤسسة نماء التنموية الخيرية — منصة متكاملة لرعاية وتمكين الأيتام والأسر المحتاجة',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
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
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('ofsms_theme');
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                  if (document.body) document.body.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  if (document.body) document.body.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 text-gray-800 dark:bg-[#0B131B] dark:text-slate-100 transition-colors duration-200">
        <ThemeBootstrap />
        <OfflineBanner />
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
