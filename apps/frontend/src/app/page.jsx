export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-primary">
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
        <h1 className="text-3xl font-bold text-primary mb-2">نظام إدارة الأيتام والأسر</h1>
        <p className="text-gray-500 mb-6">جارٍ تحميل النظام…</p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </main>
  );
}
