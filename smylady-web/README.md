# Share Your Party - Web App

Die Web-Version der Share Your Party Event-App.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui Components
- **State Management:** TanStack Query (React Query) + Zustand
- **Routing:** React Router v6
- **API Client:** Axios
- **Real-time:** Socket.io Client

## Setup

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview
```

## Projektstruktur

```
smylady-web/
├── public/               # Static assets
├── src/
│   ├── components/       # UI Components
│   │   ├── auth/         # Auth-related components
│   │   ├── events/       # Event components (EventCard, etc.)
│   │   ├── layout/       # Layout components (Header, Footer, etc.)
│   │   └── ui/           # Base UI components (shadcn/ui style)
│   ├── contexts/         # React Contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and constants
│   ├── pages/            # Page components
│   │   ├── auth/         # Login, Register, ForgotPassword
│   │   └── ...
│   ├── services/         # API service functions
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Main App with routes
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── .env                  # Environment variables
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Features

- ✅ Event-Übersicht und Suche
- ✅ Event-Details mit Ticket-Kauf
- ✅ Benutzer-Authentifizierung
- ✅ Favoriten-System
- ✅ Ticket-Management
- ✅ Event-Erstellung
- ✅ Chat-System
- ✅ Benutzerprofil
- ✅ Responsive Design (Mobile-First)

## Environment Variables

```env
VITE_API_URL=https://smylady-backend.onrender.com
VITE_SOCKET_URL=https://smylady-backend.onrender.com
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Scripts

- `npm run dev` - Development server auf Port 5173
- `npm run build` - Production build erstellen
- `npm run preview` - Production build lokal testen
- `npm run lint` - ESLint ausführen

## Deployment

Die Web-App kann auf Vercel, Netlify oder ähnlichen Plattformen deployed werden:

1. Repository verbinden
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Environment Variables setzen
