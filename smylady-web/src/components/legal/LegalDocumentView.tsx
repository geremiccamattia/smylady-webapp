'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatLegalDate, parseInline, type LegalBlock, type LegalDocument } from '@/lib/legal'

/**
 * Rendert ein Rechtsdokument aus src/lib/legal.
 *
 * Gleiches Markup wie bisher in Terms/Privacy/Impressum (Container, Karten,
 * Tailwind-Klassen), aber aus Daten erzeugt. Ein Gegenstück für React Native
 * liegt in der Expo-App (src/components/legal/LegalDocumentView.tsx).
 */

function Inline({ text }: { text: string }) {
  const nodes = parseInline(text)
  return (
    <>
      {nodes.map((node, index) => {
        if (node.kind === 'bold') {
          return (
            <strong key={index} className="font-semibold text-foreground">
              {node.text}
            </strong>
          )
        }
        if (node.kind === 'link') {
          const internal = node.href.startsWith('/')
          if (internal) {
            return (
              <Link key={index} href={node.href} className="text-primary hover:underline">
                {node.text}
              </Link>
            )
          }
          const external = node.href.startsWith('http')
          return (
            <a
              key={index}
              href={node.href}
              className="text-primary hover:underline break-words"
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {node.text}
            </a>
          )
        }
        return <span key={index}>{node.text}</span>
      })}
    </>
  )
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="text-muted-foreground leading-relaxed">
          <Inline text={block.text} />
        </p>
      )
    case 'h3':
      return <h3 className="font-semibold text-foreground mt-2"><Inline text={block.text} /></h3>
    case 'ul':
      return (
        <ul className="list-disc list-outside text-muted-foreground space-y-1 ml-5 leading-relaxed">
          {block.items.map((item, index) => (
            <li key={index}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="list-decimal list-outside text-muted-foreground space-y-1 ml-5 leading-relaxed">
          {block.items.map((item, index) => (
            <li key={index}>
              <Inline text={item} />
            </li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-semibold text-foreground w-1/3">{block.head[0]}</th>
                <th className="text-left py-2 font-semibold text-foreground">{block.head[1]}</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr key={index} className="border-b last:border-b-0 align-top">
                  <td className="py-2 pr-4 text-foreground">
                    <Inline text={row[0]} />
                  </td>
                  <td className="py-2 text-muted-foreground">
                    <Inline text={row[1]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'note':
      return (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm text-foreground leading-relaxed">
          <Inline text={block.text} />
        </div>
      )
    default:
      return null
  }
}

interface Props {
  document: LegalDocument
  /** Zusätzlicher Inhalt oberhalb der Abschnitte, z. B. Cookie-Einstellungen. */
  children?: ReactNode
}

export default function LegalDocumentView({ document, children }: Props) {
  const router = useRouter()
  const isEnglish = document.language === 'en'

  return (
    <div>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEnglish ? 'Back' : 'Zurück'}
        </button>

        <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {isEnglish ? 'Version' : 'Fassung'} {document.version} · {isEnglish ? 'effective from' : 'gültig ab'}{' '}
          {formatLegalDate(document.effectiveDate, document.language)}
        </p>

        {document.intro && document.intro.length > 0 && (
          <div className="space-y-3 mb-8">
            {document.intro.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </div>
        )}

        {children}

        {document.sections.length > 6 && (
          <nav aria-label={isEnglish ? 'Contents' : 'Inhalt'} className="bg-muted/40 rounded-lg p-4 mb-8">
            <p className="font-semibold mb-2 text-sm">{isEnglish ? 'Contents' : 'Inhalt'}</p>
            <ol className="columns-1 md:columns-2 text-sm space-y-1">
              {document.sections.map(section => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-primary hover:underline">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="space-y-8 text-foreground">
          {document.sections.map(section => (
            <section key={section.id} id={section.id} className="bg-card rounded-lg p-6 border scroll-mt-24">
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
              <div className="space-y-3">
                {section.blocks.map((block, index) => (
                  <Block key={index} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {document.footer && <p className="mt-8 text-sm text-muted-foreground">{document.footer}</p>}
      </div>
    </div>
  )
}
