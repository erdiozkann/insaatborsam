import { requireStaff, canManage } from '@/lib/admin/guards'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/admin/format'
import { verifySellerAction, unverifySellerAction } from '../actions'

export default async function AdminSellersPage() {
  const { roleName } = await requireStaff('/admin/saticilar')
  const manage = canManage(roleName)

  const supabase = await createClient()

  // Staff RLS read (seller_profiles_staff_read). Vitrin + doğrulama verisi (IBAN/PII gösterilmez).
  const { data: sellers } = await supabase
    .from('seller_profiles')
    .select('id, store_name, company_name, primary_city, is_verified, subscription_tier, rating_avg, rating_count, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="px-5 md:px-8 py-8 flex flex-col gap-6">
      <h1 className="text-[26px] font-extrabold tracking-tight text-ink leading-9">Satıcılar</h1>

      {!sellers || sellers.length === 0 ? (
        <div className="border border-border bg-surface-container-lowest p-8 text-center">
          <p className="text-sm text-ink-secondary">Henüz satıcı yok.</p>
        </div>
      ) : (
        <div className="border border-border bg-surface-container-lowest overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Mağaza</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Şehir</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Plan</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider">Puan</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider">Kayıt</th>
                {manage && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {sellers.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'}>
                  <td className="px-4 py-3">
                    <span className="font-bold text-ink">{s.store_name}</span>
                    <span className="block text-xs text-ink-muted">{s.company_name}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{s.primary_city ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-secondary uppercase">{s.subscription_tier ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">
                    {s.rating_count > 0 ? `${s.rating_avg.toFixed(1)} (${s.rating_count})` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.is_verified
                      ? <span className="text-xs font-bold uppercase tracking-wider text-state-success border border-state-success px-2 py-0.5">Doğrulandı</span>
                      : <span className="text-xs font-bold uppercase tracking-wider text-ink-muted border border-border px-2 py-0.5">Bekliyor</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(s.created_at)}</td>
                  {manage && (
                    <td className="px-4 py-3 text-right">
                      {s.is_verified ? (
                        <form action={unverifySellerAction.bind(null, s.id)}>
                          <button type="submit" className="border border-state-error text-state-error font-bold text-xs uppercase tracking-wider px-3 py-1.5 hover:bg-surface-container transition-colors">
                            Doğrulamayı Kaldır
                          </button>
                        </form>
                      ) : (
                        <form action={verifySellerAction.bind(null, s.id)}>
                          <button type="submit" className="bg-brand text-navy font-bold text-xs uppercase tracking-wider px-3 py-1.5 hover:opacity-90 transition-opacity">
                            Doğrula
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
