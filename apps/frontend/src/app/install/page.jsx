'use client';

import Link from 'next/link';
import InstallAppCard from '../../components/InstallAppCard';
import ThemeToggleFab from '../../components/ThemeToggleFab';

export default function InstallPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#0B131B]">
      <InstallAppCard />
      <Link href="/landing" className="mt-6 text-sm text-primary dark:text-sky-400 font-medium">
        العودة للموقع
      </Link>
      <ThemeToggleFab />
    </div>
  );
}
