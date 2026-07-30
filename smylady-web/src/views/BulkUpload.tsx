'use client'

import { useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Upload, Download, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BulkUploadError {
  row: number
  field: string
  message: string
}

interface BulkUploadResult {
  imported: number
  failed: number
  errors: BulkUploadError[]
}

interface BulkUploadProps {
  onBack: () => void
}

const TEMPLATE_URL = 'https://docs.google.com/spreadsheets/d/1YWqArillO-1ypGs6Yg9-q4nkhmCwUbupjQVCyUyOY-o/copy'

function BulkUploadContent({ onBack }: BulkUploadProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const communityIdFromUrl = searchParams.get('communityId')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<BulkUploadResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Nur CSV-Dateien erlaubt', variant: 'destructive' })
      return
    }
    setSelectedFile(file)
    setResult(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (communityIdFromUrl) {
        formData.append('communityId', communityIdFromUrl)
      }

      const response = await apiClient.post('/events/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(response.data)

      if (response.data.imported > 0) {
        toast({
          title: `${response.data.imported} Event${response.data.imported !== 1 ? 's' : ''} erfolgreich hochgeladen`,
          description: 'Sie werden nach Prüfung freigeschaltet.',
        })
      }
    } catch {
      toast({ title: 'Upload fehlgeschlagen', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Events per CSV hochladen</h1>
          <p className="text-muted-foreground text-sm">
            Lade mehrere Events auf einmal hoch
          </p>
        </div>
      </div>

      <div className="p-5 border rounded-xl space-y-3">
        <h2 className="font-semibold">1. CSV-Template herunterladen</h2>
        <p className="text-sm text-muted-foreground">
          Füll das Template aus. Pflichtfelder: Name, Adresse, Datum, Uhrzeit, Kategorie, Beschreibung, Bild-URL.
        </p>
        <Button variant="outline" onClick={() => window.open(TEMPLATE_URL, '_blank')} className="gap-2">
          <Download className="h-4 w-4" />
          Google Sheet Template öffnen
        </Button>
      </div>

      <div className="p-5 border rounded-xl space-y-3">
        <h2 className="font-semibold">2. Ausgefüllte CSV hochladen</h2>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {selectedFile ? selectedFile.name : 'CSV auswählen'}
          </Button>
          {selectedFile && (
            <Button onClick={handleUpload} disabled={isLoading} className="gap-2">
              {isLoading ? 'Wird hochgeladen...' : 'Hochladen'}
            </Button>
          )}
        </div>
      </div>

      {result && (
        <div className="p-5 border rounded-xl space-y-4">
          <h2 className="font-semibold">Ergebnis</h2>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{result.imported} importiert</span>
            </div>
            {result.failed > 0 && (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{result.failed} fehlerhaft</span>
              </div>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-500">Fehlerhafte Zeilen:</p>
              {result.errors.map((error, i) => (
                <div key={i} className="text-sm p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <span className="font-medium">Zeile {error.row}:</span>{' '}
                  <span className="text-muted-foreground">{error.field} — {error.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BulkUpload({ onBack }: BulkUploadProps) {
  return (
    <Suspense>
      <BulkUploadContent onBack={onBack} />
    </Suspense>
  )
}
