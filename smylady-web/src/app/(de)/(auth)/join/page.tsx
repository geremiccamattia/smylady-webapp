import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import SignupChoice from '@/views/auth/SignupChoice'

/*
 * Anders als die Nachbarn /register und /login eine Server-Komponente: Nur so
 * lassen sich Metadaten und hreflang setzen. Die Ansicht selbst ist 'use client'.
 *
 * noindex, weil die Seite nur ein Wegweiser ins Registrierungsformular ist. Sie
 * trägt keinen eigenen Inhalt, für den jemand suchen würde, und steht deshalb
 * auch nicht in der Sitemap.
 */
export const metadata: Metadata = {
  title: 'Dabei sein',
  description: 'Wähle, wie du bei Share Your Party dabei sein willst: als Gast, Creator oder Marke.',
  robots: { index: false, follow: true },
  alternates: localeAlternates('/join', 'de'),
}

export default function JoinPage() {
  return <SignupChoice />
}
