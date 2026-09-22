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
    // Without the brand suffix — the root layout template appends it.
    // localeAlternates provides the canonical and the full hreflang set.
    title: SEO.en.title,
    description: SEO.en.description,
    alternates: localeAlternates(PAGE_PATH, 'en'),
  }
}

export default function HalloweenWienEnPage() {
  return (
    <>
      <JsonLd data={buildBreadcrumbSchema('en')} />
      <JsonLd data={buildFaqSchema('en')} />
      <JsonLd data={buildItemListSchema('en')} />
      <HalloweenWien />
    </>
  )
}
