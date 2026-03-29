import { useState } from 'react'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function Contact() {
  const { toast } = useToast()
  const navigate = useNavigate()
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
      toast({ title: 'Fehler', description: 'Bitte gib deinen Namen ein.', variant: 'destructive' })
      return
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: 'Fehler', description: 'Bitte gib eine gültige E-Mail-Adresse ein.', variant: 'destructive' })
      return
    }
    if (!formData.subject.trim()) {
      toast({ title: 'Fehler', description: 'Bitte gib einen Betreff ein.', variant: 'destructive' })
      return
    }
    if (!formData.message.trim()) {
      toast({ title: 'Fehler', description: 'Bitte gib eine Nachricht ein.', variant: 'destructive' })
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
        title: 'Erfolg',
        description: 'Dein E-Mail-Programm wird geöffnet.'
      })
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch {
      toast({
        title: 'Fehler',
        description: 'Es konnte kein E-Mail-Programm gefunden werden.',
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
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Kontaktformular</h1>
          <p className="text-muted-foreground">
            Hast du Fragen oder Anregungen? Schreib uns eine Nachricht!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-lg p-6 border">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Dein Name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Deine E-Mail-Adresse"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Betreff</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Worum geht es?"
              value={formData.subject}
              onChange={handleChange}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Nachricht</Label>
            <textarea
              id="message"
              name="message"
              placeholder="Deine Nachricht an uns..."
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
            {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
          </Button>
        </form>

        {/* Alternative Contact */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Oder schreib uns direkt an:</p>
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
