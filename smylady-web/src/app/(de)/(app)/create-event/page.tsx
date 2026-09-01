'use client'

import { useState } from 'react'
import CreateEvent from '@/views/CreateEvent'
import BulkUpload from '@/views/BulkUpload'
import { FileText, CalendarPlus } from 'lucide-react'

type Choice = null | 'single' | 'bulk'

export default function CreateEventPage() {
  const [choice, setChoice] = useState<Choice>(null)

  if (choice === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Event erstellen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Wie möchtest du Events hinzufügen?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setChoice('single')}
            className="p-6 border rounded-xl text-left hover:border-primary hover:bg-accent transition-colors space-y-3"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Einzelnes Event</p>
              <p className="text-sm text-muted-foreground mt-1">
                Schritt für Schritt durch das Formular
              </p>
            </div>
          </button>

          <button
            onClick={() => setChoice('bulk')}
            className="p-6 border rounded-xl text-left hover:border-primary hover:bg-accent transition-colors space-y-3"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Mehrere Events per CSV</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ideal für Veranstalter mit vielen Events
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  if (choice === 'bulk') {
    return <BulkUpload onBack={() => setChoice(null)} />
  }

  return <CreateEvent />
}
