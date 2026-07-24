'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { Bold, Italic, Link2, List, Eye, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  maxLength?: number
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = '120px',
  maxLength,
}: MarkdownEditorProps) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wrapSelection = useCallback(
    (before: string, after: string, fallback?: string) => {
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const selected = value.substring(start, end)
      const text = selected || fallback || ''
      const newValue =
        value.substring(0, start) + before + text + after + value.substring(end)
      onChange(newValue)
      setTimeout(() => {
        ta.focus()
        const cursorPos = start + before.length + text.length + after.length
        ta.setSelectionRange(
          selected ? cursorPos : start + before.length,
          selected ? cursorPos : start + before.length + text.length,
        )
      }, 0)
    },
    [value, onChange],
  )

  const insertLink = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.substring(start, end)
    const isUrl = selected.startsWith('http://') || selected.startsWith('https://')
    if (isUrl) {
      const newValue =
        value.substring(0, start) + `[Link](${selected})` + value.substring(end)
      onChange(newValue)
    } else {
      const linkText = selected || 'Link'
      const newValue =
        value.substring(0, start) + `[${linkText}](https://)` + value.substring(end)
      onChange(newValue)
      setTimeout(() => {
        ta.focus()
        const urlStart = start + linkText.length + 3
        ta.setSelectionRange(urlStart, urlStart + 8)
      }, 0)
    }
  }, [value, onChange])

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-muted/50 border-b">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => wrapSelection('**', '**', 'Fett')}
          title={t('editor.bold', { defaultValue: 'Fett' })}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => wrapSelection('*', '*', 'Kursiv')}
          title={t('editor.italic', { defaultValue: 'Kursiv' })}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={insertLink}
          title={t('editor.link', { defaultValue: 'Link einfügen' })}
        >
          <Link2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => wrapSelection('\n- ', '', 'Listeneintrag')}
          title={t('editor.list', { defaultValue: 'Liste' })}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => setPreview(!preview)}
        >
          {preview ? <Edit className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {preview
            ? t('editor.edit', { defaultValue: 'Bearbeiten' })
            : t('editor.preview', { defaultValue: 'Vorschau' })}
        </Button>
      </div>

      {preview ? (
        <div
          className="px-3 py-2 prose prose-sm dark:prose-invert max-w-none"
          style={{ minHeight }}
        >
          {value ? (
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">{placeholder}</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="w-full px-3 py-2 bg-background resize-y focus:outline-none"
          style={{ minHeight }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      )}
    </div>
  )
}
