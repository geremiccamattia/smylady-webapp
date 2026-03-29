# Share Your Party - Web App Feature TODO

> Ziel: Mobile App 1:1 in Web App übertragen
> Erstellt: 2026-02-28
> Letzte Aktualisierung: 2026-02-28

## Status-Legende
- [ ] Nicht begonnen
- [x] Abgeschlossen
- [~] In Arbeit
- [!] Blockiert

---

## PRIORITÄT 1: KRITISCH (Core Features)

### 1.1 Memories-System (Event-Fotos/Videos)
- [ ] Memory Upload Service erstellen (`/services/memories.ts`)
- [ ] Memory-Galerie Komponente pro Event
- [ ] Memory-Detail Modal mit Vollbild-Ansicht
- [ ] Memory liken (Emoji-Reaktionen)
- [ ] Memory kommentieren
- [ ] Kommentar-Replies auf Memories
- [ ] Freunde in Memories taggen (@mention)
- [ ] Privacy-Einstellungen (public/private/friends)
- [ ] Memory löschen (nur eigene)
- [ ] User Memory Timeline auf Profil
- [ ] Memory in Ticket-Detail Seite integrieren
- [ ] Endpoints:
  - `GET /tickets/:ticketId/memories`
  - `POST /tickets/:ticketId/memories` (multipart)
  - `DELETE /memories/:id`
  - `POST /memories/:id/like`
  - `POST /memories/:id/comments`
  - `POST /memories/:id/comments/:commentId/replies`

### 1.2 QR-Scanner für Organizer
- [ ] Webcam-basierter QR-Scanner (html5-qrcode oder @zxing/browser)
- [ ] Scanner-Page erstellen (`/pages/QRScanner.tsx`)
- [ ] Ticket-Validierung nach Scan
- [ ] Erfolg/Fehler-Feedback anzeigen
- [ ] Scan-Sound abspielen
- [ ] Route: `/scan/:eventId`
- [ ] Endpoints:
  - `POST /tickets/verify`
  - `POST /tickets/:ticketId/scan`

### 1.3 Scan-Statistiken & Analytics
- [ ] Statistik-Dashboard für Organizer
- [ ] Gesamt-Scans anzeigen
- [ ] Scans nach Zeitraum (Diagramm)
- [ ] Check-in Rate berechnen
- [ ] Route: `/events/:eventId/statistics`
- [ ] Endpoints:
  - `GET /tickets/event/:eventId/scan-statistics`

### 1.4 Real-time Chat (WebSocket)
- [ ] Socket.io Client richtig initialisieren
- [ ] WebSocket-Verbindung statt Polling
- [ ] Typing-Indicator implementieren
- [ ] Online-Status anzeigen
- [ ] Message Replies/Threading
- [ ] Nachrichten bearbeiten
- [ ] File-Previews (Bilder, Videos)
- [ ] Unread-Badge in Header aktualisieren
- [ ] Reconnect-Logik bei Verbindungsabbruch

### 1.5 Reporting-System
- [ ] Report-Modal Komponente erstellen
- [ ] Report-Gründe (Dropdown): spam, inappropriate, harassment, other
- [ ] Beschreibungsfeld
- [ ] Events melden
- [ ] Posts melden
- [ ] Kommentare melden
- [ ] Memories melden
- [ ] User melden
- [ ] Service: `/services/reports.ts`
- [ ] Endpoints:
  - `POST /complaints`

### 1.6 Legal Pages
- [x] Impressum Page (`/imprint`)
- [x] Privacy Policy Page (`/privacy`)
- [x] Terms & Conditions Page (`/terms`)
- [x] Cookie Consent Banner
- [x] Cookie-Einstellungen speichern (localStorage)
- [x] Footer-Links zu Legal Pages
- [x] Contact Page (`/contact`)
- [ ] Code of Conduct Page (`/code-of-conduct`)

### 1.7 Multi-Language Support (i18n)
- [x] i18next installieren
- [x] Sprachdateien erstellen (`/src/i18n/locales/de.json`, `/src/i18n/locales/en.json`)
- [x] Language Switcher in Header
- [ ] Alle statischen Texte übersetzen (in progress - Header done)
- [x] Sprache in localStorage speichern
- [x] Browser-Sprache als Default

---

## PRIORITÄT 2: WICHTIG (Feature Parität)

### 2.1 Social Login (OAuth)
- [ ] Google OAuth implementieren
- [ ] Facebook OAuth implementieren
- [ ] Apple Sign-In implementieren (optional für Web)
- [ ] OAuth-Buttons auf Login/Register Seite
- [ ] Connected Accounts in Settings verwalten
- [ ] Endpoints:
  - `POST /auth/google`
  - `POST /auth/facebook`
  - `POST /auth/apple`

### 2.2 Organizer Dashboard
- [ ] Dashboard-Seite erstellen (`/organizer/dashboard`)
- [ ] Meine Events Übersicht
- [ ] Ticket-Verkäufe pro Event
- [ ] Einnahmen-Übersicht
- [ ] Gäste-Management (`/events/:eventId/guests`)
- [ ] Subscriber/Follower Liste
- [ ] Endpoints:
  - `GET /events/:eventId/attendees`
  - `GET /organizer-subscriptions/subscribers`

### 2.3 Auszahlungen (Withdrawals)
- [ ] Withdrawal-Request Seite
- [ ] Verfügbares Guthaben anzeigen
- [ ] Auszahlung anfordern
- [ ] Auszahlungs-Historie
- [ ] Steuerinformationen eingeben
- [ ] Route: `/payments`
- [ ] Endpoints:
  - `GET /payments/balance`
  - `POST /payments/withdraw`
  - `GET /payments/history`
  - `PUT /payments/tax-info`

### 2.4 Event Drafts
- [ ] Draft lokal in localStorage speichern
- [ ] Drafts-Liste anzeigen
- [ ] Draft laden und weiterbearbeiten
- [ ] Draft löschen
- [ ] Auto-Save beim Erstellen

### 2.5 Emoji-Reaktionen (Posts & Kommentare)
- [ ] Emoji-Picker Komponente (emoji-mart oder custom)
- [ ] Reaktion auf Posts (statt nur Like)
- [ ] Reaktion auf Kommentare
- [ ] Reaktions-Bubbles anzeigen (wie Facebook)
- [ ] Reaktions-Modal ("Wer hat reagiert")
- [ ] Endpoints:
  - `POST /posts/:postId/reactions`
  - `POST /posts/:postId/comments/:commentId/reactions`

### 2.6 @Mention System
- [ ] MentionInput Komponente
- [ ] User-Suche beim Tippen von @
- [ ] Autocomplete-Dropdown
- [ ] Mentions in Posts
- [ ] Mentions in Kommentaren
- [ ] Mentions in Memory-Kommentaren
- [ ] Klickbare @mentions (-> User-Profil)
- [ ] Mention-Notifications

### 2.7 Kommentar-Replies (Nested Comments)
- [ ] Reply-Button unter Kommentaren
- [ ] Replies eingerückt anzeigen
- [ ] Reply-Input mit @username prefill
- [ ] Replies auf Posts
- [ ] Replies auf Memory-Kommentare
- [ ] "X Antworten anzeigen" Button

### 2.8 Story-Erweiterungen
- [ ] Story-Replies (als DM senden)
- [ ] @Mention in Stories
- [ ] Video-Stories hochladen
- [ ] Story-Viewers Liste vollständig
- [ ] Story-Likers Liste

---

## PRIORITÄT 3: MITTEL (UX Verbesserungen)

### 3.1 Notifications-Erweiterungen
- [ ] Browser Push Notifications (Service Worker)
- [ ] Notification Detail Modal
- [ ] Alle 18+ Notification-Typen abdecken
- [ ] Deep-Links zu Kontext verbessern
- [ ] Notification-Sound
- [ ] Notification-Preferences in Settings

### 3.2 User Profile Erweiterungen
- [ ] Registrations & Security Screen
- [ ] Connected Accounts verwalten
- [ ] Followers/Following Listen (vollständig)
- [ ] User Posts Timeline (vollständig)
- [ ] User Stories Timeline
- [ ] User Memories Timeline
- [ ] Account-Aktivität anzeigen

### 3.3 Location Features
- [ ] GPS-Erkennung verbessern
- [ ] Location-Permission Modal
- [ ] Google Maps Integration (Event-Standorte)
- [ ] Nearby Events optimieren
- [ ] Location in Event-Karte anzeigen

### 3.4 Token-Refresh
- [ ] Automatisches Token-Refresh vor Ablauf
- [ ] Refresh-Token Logik implementieren
- [ ] Silent Refresh im Hintergrund
- [ ] Endpoints:
  - `POST /auth/refresh-token`

### 3.5 Ticket-Erweiterungen
- [ ] Ticket-Stornierung (nicht nur Refund)
- [ ] Refund-Vorschau vor Stornierung
- [ ] Multi-Ticket Auswahl (Anzahl)
- [ ] Ticket-Transfer an andere User

---

## PRIORITÄT 4: NICE-TO-HAVE

### 4.1 UI/UX Polish
- [ ] Onboarding-Flow für neue User
- [ ] Image Cropper für Profilbild/Event-Bilder
- [ ] Interest Selection bei Registration
- [ ] Contact Form (`/contact`)
- [ ] Skeleton Loaders verbessern
- [ ] Pull-to-Refresh (wo sinnvoll)
- [ ] Infinite Scroll optimieren

### 4.2 PWA Features
- [ ] Service Worker für Offline-Support
- [ ] App-Manifest für "Add to Home Screen"
- [ ] Offline-Fallback Seite
- [ ] Cache-Strategie für Assets

### 4.3 Performance
- [ ] Lazy Loading für Routen
- [ ] Image Optimization (WebP, srcset)
- [ ] Bundle Splitting
- [ ] Preload kritische Assets

### 4.4 Accessibility
- [ ] Keyboard Navigation
- [ ] Screen Reader Support
- [ ] ARIA Labels
- [ ] Focus Management

---

## BEREITS IMPLEMENTIERT (Referenz)

### Authentication
- [x] Login mit Email/Username
- [x] Registration mit OTP
- [x] Passwort vergessen
- [x] Token-basierte Auth

### Events
- [x] Events durchsuchen/filtern
- [x] Event-Details
- [x] Events erstellen/bearbeiten
- [x] Event-Kategorien

### Tickets
- [x] Tickets kaufen (Stripe)
- [x] QR-Code anzeigen
- [x] Meine Tickets Liste

### Social
- [x] Posts erstellen/liken/kommentieren
- [x] Stories erstellen/anzeigen
- [x] Follow/Unfollow
- [x] Block/Unblock

### Chat
- [x] Chat-Liste
- [x] Nachrichten senden
- [x] Bilder senden

### Profile
- [x] Profil bearbeiten
- [x] Profilbild hochladen
- [x] Passwort ändern

### Sonstiges
- [x] Favoriten
- [x] Reviews
- [x] Safety Companions
- [x] Notifications (basic)

---

## TECHNISCHE NOTIZEN

### Zu installierende Pakete
```bash
# QR Scanner
npm install html5-qrcode
# oder
npm install @zxing/browser @zxing/library

# Emoji Picker
npm install @emoji-mart/react @emoji-mart/data

# i18n
npm install i18next react-i18next i18next-browser-languagedetector

# Socket.io (bereits installiert, nur korrekt nutzen)
# socket.io-client bereits in package.json
```

### API Base URL
- Production: `https://app.shareyourparty.de`
- Development: `http://localhost:3000` (oder Backend-Port)

### Wichtige Dateien
- Router: `/src/App.tsx`
- API Client: `/src/services/api.ts`
- Auth Context: `/src/contexts/AuthContext.tsx`
- Komponenten: `/src/components/`
- Seiten: `/src/pages/`

### Mobile App Referenz
- Pfad: `C:\Users\Donatec\Desktop\event\smylady-mobile`
- Screens: `/src/screens/`
- Components: `/src/components/`
- Hooks: `/src/hooks/`
- Services: `/src/services/`
- Locales: `/src/locales/de.json`, `/src/locales/en.json`

---

## FORTSCHRITT TRACKER

| Kategorie | Total | Done | Progress |
|-----------|-------|------|----------|
| Priorität 1 (Kritisch) | 45 | 13 | 29% |
| Priorität 2 (Wichtig) | 35 | 0 | 0% |
| Priorität 3 (Mittel) | 20 | 0 | 0% |
| Priorität 4 (Nice-to-have) | 15 | 0 | 0% |
| **GESAMT** | **115** | **13** | **11%** |

---

## NÄCHSTE SCHRITTE

1. **Start mit Priorität 1.1**: Memories-System implementieren
2. **Dann 1.2**: QR-Scanner für Organizer
3. **Parallel 1.6**: Legal Pages (einfach, schnell erledigt)
4. **Dann 1.7**: Multi-Language Support

---

> **Hinweis**: Diese Datei bei jedem Session-Start lesen, um den aktuellen Stand zu kennen.
> Pfad: `smylady-web/TODO_FEATURES.md`
