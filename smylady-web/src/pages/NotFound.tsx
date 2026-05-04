import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  useEffect(() => {
    if (window.location.pathname.startsWith('/blog')) {
      const blogPath = window.location.pathname.replace('/blog', '') || '/'
      window.location.href = `https://blog.shareyourparty.de${blogPath}`
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-3xl font-bold mb-4">Seite nicht gefunden</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Die Seite die du suchst existiert nicht oder wurde verschoben.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Link to="/">
            <Button variant="gradient">
              <Home className="h-4 w-4 mr-2" />
              Zur Startseite
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
