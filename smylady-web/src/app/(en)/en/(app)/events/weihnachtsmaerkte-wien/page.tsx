import type { Metadata } from 'next'
import WeihnachtsmaerkteWien from '@/views/WeihnachtsmaerkteWien'
import JsonLd from '@/components/seo/JsonLd'
import { canonicalUrl, localeAlternates, SITE_URL } from '@/lib/seo'
import { PAGE_PATH, buildPageModel, fetchChristmasEventsWien, tx } from '@/lib/weihnachtenWien'
import { buildBreadcrumbSchema, buildFaqSchema, buildItemListSchema } from '@/lib/weihnachtenWienSchema'

// Same approach as the German page.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const model = buildPageModel(await fetchChristmasEventsWien(), 'en')
  const title = tx('en', 'seo.title', { year: model.year })
  const description = tx('en', 'seo.description', { year: model.year })
  return {
    // Without the brand suffix — the root layout template appends it.
    title,
    description,
    alternates: localeAlternates(PAGE_PATH, 'en'),
    // A page-level openGraph object REPLACES the one from root-shell.tsx.
    openGraph: {
      title,
      description,
      url: canonicalUrl(PAGE_PATH, 'en'),
      siteName: 'Share Your Party',
      type: 'website',
      locale: 'en_GB',
      images: [{ url: `${SITE_URL}/logo.png` }],
    },
  }
}

export default async function WeihnachtsmaerkteWienEnPage() {
  // Fetched and rendered on the server: the markets are in the page source.
  const model = buildPageModel(await fetchChristmasEventsWien(), 'en')
  const itemList = buildItemListSchema(model)

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema('en')} />
      <JsonLd data={buildFaqSchema(model)} />
      {itemList && <JsonLd data={itemList} />}
      <WeihnachtsmaerkteWien model={model} />
    </>
  )
}
