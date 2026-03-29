import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Receipt, HelpCircle, ExternalLink, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TaxItem {
  title: string
  description: string
}

const taxItems: TaxItem[] = [
  {
    title: 'Steuerzahlerinformationen',
    description: 'In den meisten Ländern/Regionen ist die Eingabe von Steuerinformationen erforderlich.',
  },
  {
    title: 'Mehrwertsteuer (MwSt)',
    description: 'Bitte gib auch deine USt-IdNr. an, wenn du MwSt. berechnest.',
  },
]

export default function Taxes() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Steuern</h1>
      </div>

      {/* Tax Information Cards */}
      <div className="space-y-4">
        {taxItems.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-primary" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Mehr erfahren
                </Button>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  USt-IdNr. hinzufügen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Hilfe benötigt?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Finde Antworten auf Steuerfragen in unserem Hilfezentrum
              </p>
              <Button variant="link" className="p-0 h-auto mt-2 text-primary">
                Zum Hilfezentrum
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <p className="text-xs text-center text-muted-foreground">
        Die hier bereitgestellten Informationen ersetzen keine professionelle Steuerberatung.
        Bei Fragen wende dich bitte an einen Steuerberater.
      </p>
    </div>
  )
}
