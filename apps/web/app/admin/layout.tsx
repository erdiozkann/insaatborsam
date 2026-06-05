import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaff } from '@/lib/admin/guards'
import { AdminNav } from './AdminNav'

export const metadata: Metadata = {
  title: 'Yönetim | İnşaat Borsam',
  robots: { index: false },
}

// Admin layout — public Navbar/Footer bu route'ta gizlenir (bkz. Navbar/Footer guard).
// requireStaff: aktif staff değilse /giris veya /profil'e redirect.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { roleDisplayName, user } = await requireStaff('/admin')

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Topbar */}
      <header className="bg-navy text-white border-b border-navy">
        <div className="px-5 md:px-8 h-14 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-extrabold uppercase tracking-wider">İnşaat Borsam</span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand">Yönetim</span>
          </Link>
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-xs uppercase tracking-wider text-white/70 hidden sm:inline">
              {roleDisplayName}
            </span>
            <span className="text-xs text-white/70 truncate max-w-[180px]">{user.email}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sol menü */}
        <aside className="w-56 flex-shrink-0 border-r border-border bg-surface-container-lowest hidden md:block">
          <AdminNav />
        </aside>

        {/* İçerik */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
