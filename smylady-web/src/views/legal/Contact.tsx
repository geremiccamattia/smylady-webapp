'use client'

import { useState } from 'react'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function Contact() {
  const { toast } = useToast()
  const router = useRouter()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast({ title: t('common.error'), description: t('contact.errorName', { defaultValue: 'Bitte gib deinen Namen ein.' }), variant: 'destructive' })
      return
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: t('common.error'), description: t('contact.errorEmail', { defaultValue: 'Bitte gib eine gültige E-Mail-Adresse ein.' }), variant: 'destructive' })
      return
    }
    if (!formData.subject.trim()) {
      toast({ title: t('common.error'), description: t('contact.errorSubject', { defaultValue: 'Bitte gib einen Betreff ein.' }), variant: 'destructive' })
      return
    }
    if (!formData.message.trim()) {
      toast({ title: t('common.error'), description: t('contact.errorMessage', { defaultValue: 'Bitte gib eine Nachricht ein.' }), variant: 'destructive' })
      return
    }

    setIsSubmitting(true)

    // Open mailto link
    const mailtoLink = `mailto:office@shareyourparty.de?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `Name: ${formData.name}\nE-Mail: ${formData.email}\n\n${formData.message}`
    )}`

    try {
      window.open(mailtoLink, '_self')
      toast({
        title: t('common.success'),
        description: t('contact.successDesc', { defaultValue: 'Dein E-Mail-Programm wird geöffnet.' })
      })
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch {
      toast({
        title: t('common.error'),
        description: t('contact.errorMailClient', { defaultValue: 'Es konnte kein E-Mail-Programm gefunden werden.' }),
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back', { defaultValue: 'Zurück' })}
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('contact.title', { defaultValue: 'Kontaktformular' })}</h1>
          <p className="text-muted-foreground">
            {t('contact.subtitle', { defaultValue: 'Hast du Fragen oder Anregungen? Schreib uns eine Nachricht!' })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-lg p-6 border">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('auth.name', { defaultValue: 'Name' })}</Label>
            <Input
              id="name"
              name="name"
              placeholder={t('contact.namePlaceholder', { defaultValue: 'Dein Name' })}
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email', { defaultValue: 'E-Mail' })}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t('contact.emailPlaceholder', { defaultValue: 'Deine E-Mail-Adresse' })}
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">{t('contact.subject', { defaultValue: 'Betreff' })}</Label>
            <Input
              id="subject"
              name="subject"
              placeholder={t('contact.subjectPlaceholder', { defaultValue: 'Worum geht es?' })}
              value={formData.subject}
              onChange={handleChange}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">{t('contact.message', { defaultValue: 'Nachricht' })}</Label>
            <textarea
              id="message"
              name="message"
              placeholder={t('contact.messagePlaceholder', { defaultValue: 'Deine Nachricht an uns...' })}
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full gradient-bg"
            disabled={isSubmitting}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? t('contact.sending', { defaultValue: 'Wird gesendet...' }) : t('contact.send', { defaultValue: 'Nachricht senden' })}
          </Button>
        </form>

        {/* Alternative Contact */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>{t('contact.orEmail', { defaultValue: 'Oder schreib uns direkt an:' })}</p>
          <a
            href="mailto:office@shareyourparty.de"
            className="text-primary hover:underline"
          >
            office@shareyourparty.de
          </a>
        </div>

      </div>
    </div>
  )
}
