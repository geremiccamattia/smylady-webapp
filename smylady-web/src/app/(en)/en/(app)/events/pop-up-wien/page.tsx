import type { Metadata } from 'next'
import PopupWien from '@/views/PopupWien'
import JsonLd from '@/components/seo/JsonLd'
import { localeAlternates } from '@/lib/seo'
import { SEO, fetchPopupEventsWien } from '@/lib/popupWien'
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
} from '@/lib/popupWienSchema'

// Year derived from the date, same approach as the German page.
export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear()

  return {
    // Without the brand suffix — the root layout template appends it.
    title: SEO.en.title(year),
    description: SEO.en.description,
    alternates: localeAlternates('/events/pop-up-wien', 'en'),
  }
}

export default async function PopupWienEnPage() {
  const events = await fetchPopupEventsWien()
  const itemList = buildItemListSchema(events, 'en')

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema('en')} />
      <JsonLd data={buildFaqSchema('en')} />
      {itemList && <JsonLd data={itemList} />}
      <PopupWien />
    </>
  )
}
