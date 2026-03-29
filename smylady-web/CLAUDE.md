# Share Your Party - Web App

Dieses Verzeichnis enthält die Web-Version der "Share Your Party" Event-App.

## Deployment Konfiguration

### URLs & Infrastruktur

| Komponente | URL / Service |
|------------|---------------|
| **Frontend (Web)** | https://www.shareyourparty.de |
| **Backend API** | https://app.shareyourparty.de |
| **Backend Hosting** | Render.com |
| **Datenbank** | MongoDB Atlas |
| **Frontend Hosting** | FTP Upload ins Root-Verzeichnis |

### Environment Variables

Die Environment-Variablen sind komplett auf **Render.com** konfiguriert.
Das Frontend verwendet die API-URL `https://app.shareyourparty.de`.

### Build & Deployment

```powershell
cd smylady-web
npm install
npm run build
```

Nach dem Build:
1. Inhalt des `dist/` Ordners per FTP ins Root-Verzeichnis von www.shareyourparty.de hochladen
2. Die `.htaccess` Datei aus `root-htaccess/` ebenfalls ins Root-Verzeichnis kopieren

**Wichtig:** Die App verwendet `index.html` (nicht .htm) als Entry Point.

## Schnellstart (Entwicklung)

```powershell
cd smylady-web
npm install
npm run dev
```

Die App läuft dann unter http://localhost:5173

## Features

- Event-Übersicht & Suche mit Filtern
- Event-Details mit Ticket-Kauf (Stripe)
- Benutzerregistrierung & Login
- Favoriten-System
- Ticket-Verwaltung mit QR-Codes
- Chat-System
- Benutzerprofil bearbeiten
- Responsive Design (Mobile & Desktop)

## Projektstruktur

```
smylady-web/
├── src/              # Source Code
├── dist/             # Build Output (wird per FTP hochgeladen)
├── root-htaccess/    # .htaccess für Apache SPA-Routing
├── public/           # Statische Assets
└── vite.config.ts    # Vite Konfiguration
```

## API Endpoints

Das Frontend kommuniziert mit dem Backend unter `https://app.shareyourparty.de`:
- Auth: `/api/auth/*`
- Events: `/api/events/*`
- Tickets: `/api/tickets/*`
- Users: `/api/users/*`
- Chat: `/api/chat/*`
- Notifications: `/api/notifications/*`

## WICHTIG: API Endpoint Konsistenz mit Mobile-App

Die Web-App MUSS die gleichen API-Endpoints wie die Mobile-App (`smylady-mobile`) verwenden!

### User Service Endpoints - ALLE mit /users/ (nicht /user/)
```typescript
// Öffentliches Profil eines Users abrufen
GET /users/:userId/profile  // ✅ NICHT: /user/:id

// User suchen
GET /users/search?q=query  // ✅ NICHT: /user/search

// Follow/Unfollow (Subscribe/Unsubscribe)
POST /users/:userId/subscribe    // ✅ Follow
DELETE /users/:userId/subscribe  // ✅ Unfollow

// Follower/Following
GET /users/:userId/subscribers  // ✅ Followers
GET /users/:userId/following    // ✅ Following

// Block/Unblock
POST /users/block/:userId    // ✅ Block
DELETE /users/block/:userId  // ✅ Unblock
GET /users/blocked           // ✅ Blocked users list
```

### User Profile Endpoints (PATCH, nicht PUT!)
```typescript
// Profil aktualisieren
PATCH /users/profile  // NICHT: PUT /user

// Profilbild hochladen (Feldname: "image")
PATCH /users/profile-image  // NICHT: POST /user/profile-image
// FormData-Feld muss "image" heißen, nicht "file"
```

### WICHTIG: Nach Profil-Update User neu laden!
```typescript
// FALSCH - überschreibt profileImage und andere Felder:
const updatedUser = await authService.updateProfile(formData)
updateUser(updatedUser)  // ❌ Backend gibt nur profile-Objekt zurück!

// RICHTIG - vollständigen User vom Server laden:
await authService.updateProfile(formData)
const freshUser = await authService.getCurrentUser()  // ✅ Lädt alle Felder inkl. profileImage
updateUser(freshUser)
```
Das Backend `/users/profile` gibt nur das Profile-Objekt zurück (ohne profileImage, etc.).
Daher MUSS nach dem Update der vollständige User mit `getCurrentUser()` geladen werden!

### Notifications Endpoints
```typescript
// Alle Notifications abrufen
GET /notifications/get-all-notifications

// Einzelne Notification als gelesen markieren
PATCH /notifications/:id

// Alle als gelesen markieren
PATCH /notifications/mark-all-as-read

// WICHTIG: Es gibt KEINEN /notifications/unread-count Endpoint!
// Der Unread-Count muss client-seitig berechnet werden:
const unreadCount = notifications.filter(n => !n.isRead && !n.read).length
```

### localStorage Keys
```typescript
// RICHTIG (wie in STORAGE_KEYS definiert):
syp_token  // Auth Token
syp_user   // User Object (JSON)

// FALSCH (nicht verwenden!):
auth_token
user
```

### User ID Prüfung - IMMER beide Felder prüfen!
```typescript
// FALSCH - Backend kann "id" ODER "_id" zurückgeben:
if (parsedUser && parsedUser._id)  // ❌ Funktioniert nicht wenn nur "id" vorhanden

// RICHTIG - beide Varianten prüfen:
if (parsedUser && (parsedUser._id || parsedUser.id))  // ✅

// Beim Zugriff auf User ID:
const userId = user._id || user.id  // ✅ Immer beide prüfen
```

### Socket.io Verbindung
- Socket verbindet sich nur wenn User eingeloggt ist
- Credentials aus `syp_token` und `syp_user` lesen
- "No authentication credentials" Error ist normal wenn nicht eingeloggt

### Posts/Feed API Response - User Info Struktur

Das Backend gibt User-Info in einem separaten `user` Feld zurück, NICHT im `userId` Feld!

```typescript
// Backend Response für Posts:
{
  _id: "...",
  userId: "675abc123...",  // ← ObjectId als String!
  user: {                   // ← Populated User-Info hier!
    _id: "675abc123...",
    name: "Max Mustermann",
    username: "max123",
    profileImage: "https://..."
  },
  text: "...",
  comments: [
    {
      userId: "675xyz...",   // ← ObjectId als String
      user: {                 // ← Populated User-Info
        _id: "675xyz...",
        name: "Lisa Test",
        profileImage: "https://..."
      },
      text: "...",
      replies: [...]          // Gleiche Struktur
    }
  ]
}

// FALSCH - funktioniert nicht:
<AvatarImage src={post.userId.profileImage} />  // ❌ userId ist nur ein String!

// RICHTIG - user Feld verwenden:
const postUser = post.user || post.userId  // Fallback falls userId populated ist
<AvatarImage src={postUser.profileImage} />  // ✅

// Für Kommentare/Replies gleich:
const commentUser = comment.user || comment.userId
const replyUser = reply.user || reply.userId
```

**WICHTIG**: Bei Type-Definitionen beides erlauben:
```typescript
interface Post {
  userId: string | { _id: string; name: string; profileImage?: string }
  user?: { _id: string; name: string; profileImage?: string }
}
```

### Event API Response - offerings/restrictions als String

Das Backend speichert `offerings` und `restrictions` als **comma-separated String**, NICHT als Array!

```typescript
// Backend Response für Event:
{
  offerings: "DJ, Getränke, Garderobe",  // ← String! NICHT Array!
  restrictions: "Mindestalter 18, Keine Turnschuhe"
}

// FALSCH - führt zu "offerings.map is not a function":
{event.offerings.map(...)}  // ❌ offerings ist ein String!

// RICHTIG - erst in Array konvertieren:
const offeringsArray = typeof event.offerings === 'string'
  ? event.offerings.split(',').map(s => s.trim()).filter(Boolean)
  : Array.isArray(event.offerings) ? event.offerings : []

{offeringsArray.map(...)}  // ✅
```

**Type-Definition**:
```typescript
interface Event {
  offerings: string | string[]   // Backend gibt String, kann aber auch Array sein
  restrictions: string | string[]
}
```
