'use client'

import ReactMarkdown from 'react-markdown'

/**
 * Anzeige von Markdown-Texten (Event- und Community-Beschreibungen).
 *
 * Das Styling steht bewusst hier als explizite Klassen an den einzelnen Elementen
 * und nicht über `prose`: Das Typography-Plugin von Tailwind ist in diesem Projekt
 * nicht installiert (siehe tailwind.config.ts — plugins: [tailwindcss-animate]).
 * Die `prose`-Klassen waren damit wirkungslos, und weil Tailwinds Preflight die
 * Abstände von <p>, <ul> und <h*> auf 0 setzt, standen alle Absätze direkt
 * untereinander.
 *
 * `whitespace-pre-line` an den Absätzen erhält zusätzlich einfache Zeilenumbrüche.
 * Markdown fasst zwei aufeinanderfolgende Zeilen sonst zu einem Fließtext zusammen —
 * der Umbruch steckt zwar als "\n" im Textknoten, wird von CSS aber zu einem
 * Leerzeichen zusammengezogen. Wer im Editor eine neue Zeile beginnt, erwartet aber
 * auch eine neue Zeile.
 */
export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  if (!content) return null
  return (
    <div className={`max-w-none space-y-3 ${className || ''}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="whitespace-pre-line leading-relaxed break-words">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 first:mt-0 break-words">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-4 first:mt-0 break-words">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-3 first:mt-0 break-words">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed break-words">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted pl-3 italic break-words">{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-[0.9em] break-words">{children}</code>
          ),
          /*
           * Ohne eigene Regel rendert der Browser <pre> mit `white-space: pre` —
           * das bricht NIE um. Vier führende Leerzeichen im Beschreibungstext
           * genügen, damit Markdown daraus einen Code-Block macht; die Zeile
           * schöbe dann die ganze Spalte über den Rand hinaus. `overflow-x-auto`
           * macht den Block zu einem eigenen Scrollbereich, dessen
           * Mindestbreite null ist — er kann die Spalte damit nicht mehr
           * aufziehen.
           */
          pre: ({ children }) => (
            <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-sm">{children}</pre>
          ),
          hr: () => <hr className="border-muted" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline break-words"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
