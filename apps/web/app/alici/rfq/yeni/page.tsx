import type { Metadata } from 'next'
import Link from 'next/link'
import { requireBuyer } from '@/lib/rfq/guards'
import { createClient } from '@/lib/supabase/server'
import { RfqCreateForm } from './RfqCreateForm'

export const metadata: Metadata = {
  title: 'Yeni Teklif Talebi | İnşaat Borsam',
  robots: { index: false },
}

export default async function RfqYeniPage() {
  await requireBuyer('/alici/rfq/yeni')

  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('display_order')

  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
                Alıcı Paneli
              </span>
              <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
                Yeni Teklif Talebi
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/alici/rfq"
                className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Taleplerim
              </Link>
              <Link
                href="/alici/panel"
                className="border border-border text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Panel
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="max-w-3xl">
            <RfqCreateForm categories={categories ?? []} />
          </div>
        </div>
      </section>
    </>
  )
}
