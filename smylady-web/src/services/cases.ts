import * as Sentry from '@sentry/nextjs';

export interface WordPressCase {
  id: number;
  slug: string;
  title: { rendered: string };
  cases_fields?: {
    'reel-url'?: string;
    kunde?: string;
    kennzahlen?: string;
    // Klammernotation wegen des Bindestrichs im WordPress-Feldnamen.
    'kennzahlen-en'?: string;
    sonstiges?: string;
  };
}

export interface CaseStudy {
  id: number;
  slug: string;
  title: string;
  client: string | null;
  reelUrl: string | null;
  reelShortcode: string | null;
  metrics: string[];
}

const CMS_BASE_URL = process.env.WP_CMS_URL ?? 'https://blog.shareyourparty.de';
const REVALIDATE_SECONDS = 300;

export function extractInstagramShortcode(url: string | undefined | null): string | null {
  if (!url) return null;
  const match = /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/.exec(url);
  return match ? match[1] : null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function parseMetrics(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => decodeHtmlEntities(entry).trim())
    .filter((entry) => entry.length > 0);
}

function mapCase(item: WordPressCase, locale: 'de' | 'en'): CaseStudy {
  const fields = item.cases_fields ?? {};
  const reelUrl = fields['reel-url']?.trim() || null;

  // Rueckfall auf Deutsch, wenn das englische Feld fehlt oder nur Leerzeichen
  // enthaelt — ein leerer Chip-Bereich waere schlechter als deutsche Zahlen.
  const rawMetrics =
    locale === 'en' && fields['kennzahlen-en']?.trim()
      ? fields['kennzahlen-en']
      : fields.kennzahlen;

  return {
    id: item.id,
    slug: item.slug,
    title: decodeHtmlEntities(item.title?.rendered ?? '').trim(),
    client: fields.kunde?.trim() || null,
    reelUrl,
    reelShortcode: extractInstagramShortcode(reelUrl),
    metrics: parseMetrics(rawMetrics),
  };
}

// Wirft bei Fehlern bewusst, damit Next.js kein leeres Ergebnis fuer die volle
// Revalidate-Dauer cacht. Die Aufrufstelle faengt ab und rendert die Sektion nicht.
export async function fetchCaseStudies(locale: 'de' | 'en' = 'de'): Promise<CaseStudy[]> {
  const response = await fetch(
    `${CMS_BASE_URL}/wp-json/wp/v2/cases?per_page=12&orderby=date&order=desc`,
    { next: { revalidate: REVALIDATE_SECONDS } },
  );

  if (!response.ok) {
    throw new Error(`[cases] WordPress antwortete mit ${response.status}`);
  }

  const data = (await response.json()) as WordPressCase[];
  if (!Array.isArray(data)) {
    throw new Error('[cases] Unerwartetes Antwortformat');
  }

  // Bewusst keine Kurzform `data.map(mapCase)`: map() reicht als zweites
  // Argument den Index durch, der landete sonst als `locale`.
  return data
    .map((item) => mapCase(item, locale))
    .filter((entry) => entry.reelShortcode !== null);
}

export async function fetchCaseStudiesSafe(locale: 'de' | 'en' = 'de'): Promise<CaseStudy[]> {
  try {
    return await fetchCaseStudies(locale);
  } catch (error) {
    console.error('[cases] Abruf fehlgeschlagen:', error);
    // Der Abruf laeuft server-seitig; erfasst wird ueber sentry.server.config.ts,
    // registriert in src/instrumentation.ts. Ohne diese Meldung bliebe ein
    // Ausfall des CMS unsichtbar — die Sektion entfaellt dann stillschweigend.
    Sentry.captureException(error);
    return [];
  }
}
