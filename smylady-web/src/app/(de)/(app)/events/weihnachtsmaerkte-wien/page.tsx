import type { Metadata } from 'next'
import WeihnachtsmaerkteWien from '@/views/WeihnachtsmaerkteWien'
import JsonLd from '@/components/seo/JsonLd'
import { canonicalUrl, localeAlternates, SITE_URL } from '@/lib/seo'
import { PAGE_PATH, buildPageModel, fetchChristmasEventsWien, tx } from '@/lib/weihnachtenWien'
import { buildBreadcrumbSchema, buildFaqSchema, buildItemListSchema } from '@/lib/weihnachtenWienSchema'

/*
 * Wie die Pop-up-Seite: revalidate auf der Route, der Abruf selbst stündlich.
 * Neu angelegte Weihnachtsmärkte erscheinen damit ohne Deploy.
 */
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const model = buildPageModel(await fetchChristmasEventsWien(), 'de')
  const title = tx('de', 'seo.title', { year: model.year })
  const description = tx('de', 'seo.description', { year: model.year })
  return {
    // Ohne " | Share Your Party" — den Brand hängt das Template im Root-Layout an.
    title,
    description,
    alternates: localeAlternates(PAGE_PATH, 'de'),
    // Ein openGraph-Objekt hier ERSETZT das aus root-shell.tsx — siteName,
    // type und Bild deshalb mitgeben.
    openGraph: {
      title,
      description,
      url: canonicalUrl(PAGE_PATH, 'de'),
      siteName: 'Share Your Party',
      type: 'website',
      locale: 'de_AT',
      images: [{ url: `${SITE_URL}/logo.png` }],
    },
  }
}

export default async function WeihnachtsmaerkteWienPage() {
  // Serverseitig geholt und gerendert: Die Märkte stehen im Quelltext.
  const model = buildPageModel(await fetchChristmasEventsWien(), 'de')
  const itemList = buildItemListSchema(model)

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema('de')} />
      <JsonLd data={buildFaqSchema(model)} />
      {itemList && <JsonLd data={itemList} />}
      <WeihnachtsmaerkteWien model={model} />
    </>
  )
}
