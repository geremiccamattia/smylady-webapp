import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandRegister from '@/views/auth/BrandRegister'

/*
 * Liegt bewusst UNTER /register statt auf einem eigenen Zweig wie /brands/…:
 *
 * Der Response-Interceptor in services/api.ts wirft bei einem 401 auf jede
 * nicht-öffentliche Seite nach /login um. '/register' steht in dessen
 * publicPaths, '/brands' nicht — als /brands/register hätte ein abgelaufenes
 * Token den Nutzer beim Absenden des Markenprofils aus dem Formular geworfen,
 * statt ihm wie gefordert einen Hinweis zu zeigen und die Eingaben zu erhalten.
 *
 * noindex wie die Auswahlseite: ein Formular, keine Landingpage.
 */
export const metadata: Metadata = {
  title: 'Als Marke registrieren',
  description: 'Lege ein Markenprofil auf Share Your Party an und erreiche die Community direkt.',
  robots: { index: false, follow: true },
  alternates: localeAlternates('/register/brand', 'de'),
}

export default function BrandRegisterPage() {
  return <BrandRegister />
}
