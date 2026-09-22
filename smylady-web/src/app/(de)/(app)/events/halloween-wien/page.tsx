import type { Metadata } from 'next'
import HalloweenWien from '@/views/HalloweenWien'
import JsonLd from '@/components/seo/JsonLd'
import { localeAlternates } from '@/lib/seo'
import { PAGE_PATH, SEO } from '@/lib/halloweenWien'
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
} from '@/lib/halloweenWienSchema'

export async function generateMetadata(): Promise<Metadata> {
  return {
    /*
     * OHNE " | Share Your Party": Den Brand hängt das Template im Root-Layout an
     * (src/app/(de)/layout.tsx).
     *
     * localeAlternates liefert Canonical UND den vollständigen hreflang-Satz
     * (de, en, x-default). Die älteren Kategorieseiten setzen nur `canonical`
     * von Hand und haben deshalb kein hreflang.
     */
    title: SEO.de.title,
    description: SEO.de.description,
    alternates: localeAlternates(PAGE_PATH, 'de'),
  }
}

export default function HalloweenWienPage() {
  return (
    <>
      <JsonLd data={buildBreadcrumbSchema('de')} />
      <JsonLd data={buildFaqSchema('de')} />
      <JsonLd data={buildItemListSchema('de')} />
      <HalloweenWien />
    </>
  )
}
