import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="text-7xl">🍕</p>
        <h1 className="mt-4 text-3xl font-black text-ink">الصفحة غير موجودة</h1>
        <p className="mt-2 text-ink-muted">عذراً، يبدو أن هذه الصفحة خرجت من الفرن ولم تعد!</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">الرئيسية</Link>
          <Link href="/menu" className="btn-outline">المنيو</Link>
        </div>
      </div>
    </div>
  );
}
