import { OPERATOR, operatorAddressLine, operatorDisplayName, operatorOwnersLine } from './operator'
import type { LegalDocument } from './types'

export const PRIVACY_VERSION = '2026-11-05'

const DSB = OPERATOR.dataProtectionAuthority

export const PRIVACY_DE: LegalDocument = {
  kind: 'privacy',
  language: 'de',
  title: 'Datenschutzerklärung',
  shortTitle: 'Datenschutz',
  version: PRIVACY_VERSION,
  effectiveDate: PRIVACY_VERSION,
  intro: [
    {
      type: 'p',
      text: 'Diese Datenschutzerklärung informiert dich nach Art. 13 und 14 DSGVO darüber, welche personenbezogenen Daten wir bei der Nutzung der Website shareyourparty.de, der Web-App und der Share-Your-Party-Apps für iOS und Android verarbeiten, zu welchen Zwecken, auf welcher Rechtsgrundlage, wie lange und welche Rechte du hast.',
    },
  ],
  sections: [
    {
      id: 'controller',
      title: '1. Verantwortlicher und Kontakt',
      blocks: [
        {
          type: 'p',
          text: `Verantwortlich für die Datenverarbeitung ist ${operatorDisplayName()}, ${operatorOwnersLine()}, ${operatorAddressLine('de')}, E-Mail: [${OPERATOR.email}](mailto:${OPERATOR.email}) (Betreff „Datenschutz"). Ein Datenschutzbeauftragter ist gesetzlich nicht vorgeschrieben und nicht bestellt.`,
        },
      ],
    },
    {
      id: 'overview',
      title: '2. Überblick: Rechtsgrundlagen und Grundsätze',
      blocks: [
        { type: 'p', text: 'Wir verarbeiten Daten nur, soweit eine der folgenden Rechtsgrundlagen greift:' },
        {
          type: 'ul',
          items: [
            '**Vertrag** (Art. 6 Abs. 1 lit. b DSGVO): alles, was für dein Konto, Ticketbuchungen, Aufträge, Auszahlungen und die Funktionen der Plattform erforderlich ist.',
            '**Einwilligung** (Art. 6 Abs. 1 lit. a DSGVO, § 165 Abs. 3 TKG 2021): Analyse- und Marketing-Technologien, App-Tracking, Standortzugriff, Benachrichtigungen, Weitergabe von Gewinnspieldaten an Partner. Eine Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen.',
            '**Rechtliche Verpflichtung** (Art. 6 Abs. 1 lit. c DSGVO): Aufbewahrung von Rechnungen und Zahlungsbelegen, steuerliche Meldepflichten, Auskünfte an Behörden.',
            '**Berechtigtes Interesse** (Art. 6 Abs. 1 lit. f DSGVO): Sicherheit und Stabilität der Plattform, Betrugsprävention, Fehleranalyse, Durchsetzung unserer AGB, Verteidigung von Rechtsansprüchen. Gegen diese Verarbeitungen kannst du Widerspruch einlegen (Abschnitt 15).',
          ],
        },
        {
          type: 'p',
          text: 'Wir verkaufen keine personenbezogenen Daten. Wir treffen keine Entscheidungen, die ausschließlich auf automatisierter Verarbeitung beruhen und dir gegenüber rechtliche Wirkung entfalten (Art. 22 DSGVO). Prüfungen von Meldungen, Kontosperren und Auszahlungsentscheidungen werden von Menschen getroffen.',
        },
      ],
    },
    {
      id: 'hosting',
      title: '3. Bereitstellung der Website und Apps, Server-Logs',
      blocks: [
        {
          type: 'p',
          text: 'Beim Aufruf der Website oder der Nutzung der Apps verarbeiten unsere Server technisch notwendige Daten: IP-Adresse (im Anwendungsprotokoll gekürzt), Datum und Uhrzeit, aufgerufener Pfad ohne Parameter, Statuscode, übertragene Datenmenge, Browser- bzw. App-Version, Betriebssystem und Gerätetyp. Diese Daten dienen der Auslieferung der Inhalte, der Sicherheit (Abwehr von Angriffen, Rate-Limiting) und der Fehlersuche. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren Betrieb. Server-Logs werden nach spätestens 30 Tagen gelöscht.',
        },
        { type: 'p', text: 'Dafür setzen wir folgende Auftragsverarbeiter ein:' },
        {
          type: 'table',
          head: ['Dienst', 'Zweck und Standort'],
          rows: [
            ['Vercel Inc., USA', 'Hosting der Website und Web-App (Content Delivery Network, Serverless-Funktionen). Datenübermittlung in die USA auf Grundlage des EU-US Data Privacy Framework und von Standardvertragsklauseln.'],
            ['Render Services, Inc., USA', 'Hosting des Backends (API, Echtzeit-Chat). Serverstandort EU (Frankfurt); Zugriff aus den USA ist durch Standardvertragsklauseln abgesichert.'],
            ['MongoDB Ltd. (Irland) / MongoDB Inc. (USA) – MongoDB Atlas', 'Datenbank-Hosting für Konten, Events, Tickets, Nachrichten und Belege. Serverstandort EU; Absicherung über Standardvertragsklauseln.'],
            ['Amazon Web Services EMEA SARL, Luxemburg – S3', 'Speicherung von Bildern und Videos (Profil- und Eventbilder, Erinnerungen, Chat-Medien, Belege zur Leistungsprüfung) in der Region Frankfurt (eu-central-1).'],
            ['Functional Software, Inc. (Sentry), USA', 'Fehler- und Absturzberichte (siehe Abschnitt 12), Datenverarbeitung in der EU-Region von Sentry.'],
          ],
        },
      ],
    },
    {
      id: 'account',
      title: '4. Registrierung, Konto und Profil',
      blocks: [
        {
          type: 'p',
          text: 'Für ein Konto verarbeiten wir Name, E-Mail-Adresse, Passwort (nur als Hash gespeichert), Geburtsdatum (zur Prüfung des Mindestalters von 18 Jahren), gewählte Sprache, Rolle (Gast, Veranstalter, Creator, Brand) sowie Zeitpunkt und Version deiner Zustimmung zu den AGB. Freiwillig kannst du Profilbild, Benutzername, Telefonnummer, Wohnort, Interessen, Kurzbeschreibung und Einstellungen zur Sichtbarkeit von Alter und Wohnort ergänzen. Rechtsgrundlage ist die Vertragserfüllung.',
        },
        {
          type: 'p',
          text: 'Zur Bestätigung der E-Mail-Adresse und bei Passwort-Änderungen senden wir Einmalcodes per E-Mail. Optional kannst du eine Zwei-Faktor-Authentifizierung aktivieren; das Geheimnis dafür speichern wir verschlüsselt.',
        },
        {
          type: 'p',
          text: 'Dein öffentliches Profil (Benutzername, Profilbild, Kurzbeschreibung, von dir veröffentlichte Beiträge und Erinnerungen sowie, wenn du es freigegeben hast, Alter und Wohnort) ist für andere Nutzer sichtbar. Alter und Wohnort sind standardmäßig nicht sichtbar. Welche Events du besucht hast, sehen andere Nutzer nur für Events, die sie selbst sehen dürfen (öffentliche Events; Events für Abonnenten oder Eingeladene nur, wenn sie dazugehören).',
        },
        {
          type: 'h3',
          text: 'Anmeldung mit Google, Apple, Facebook',
        },
        {
          type: 'p',
          text: 'Bei der Anmeldung über einen dieser Dienste erhalten wir vom Anbieter Name, E-Mail-Adresse (bei Apple auf Wunsch eine Weiterleitungsadresse), Profilbild und eine Kennung. Der Anbieter erfährt, dass du dich bei Share Your Party anmeldest. Da diese Dienste kein Geburtsdatum übermitteln, fragen wir es nach der ersten Anmeldung ab. Verantwortliche: Google Ireland Ltd., Apple Distribution International Ltd. (beide Irland), Meta Platforms Ireland Ltd. (Irland). Rechtsgrundlage ist die Vertragserfüllung; die Nutzung ist freiwillig, alternativ steht die Registrierung per E-Mail zur Verfügung.',
        },
        {
          type: 'h3',
          text: 'Spotify-Verknüpfung (optional)',
        },
        {
          type: 'p',
          text: 'Du kannst dein Spotify-Konto verknüpfen, damit wir Events nach deinem Musikgeschmack vorschlagen. Dabei speichern wir die von Spotify erhaltenen Zugriffstoken (verschlüsselt) sowie deine Top-Künstler und Genres. Rechtsgrundlage ist deine Einwilligung; die Verknüpfung kannst du in den Einstellungen jederzeit lösen, dann löschen wir die Spotify-Daten. Anbieter: Spotify AB, Schweden.',
        },
      ],
    },
    {
      id: 'tickets',
      title: '5. Events, Tickets, Zahlungen und Belege',
      blocks: [
        {
          type: 'p',
          text: 'Bei einer Ticketbuchung verarbeiten wir Eventdaten, Ticketkategorie, Preis, Gebühren, Zahlungsstatus, Zeitpunkt des Einlasses (Scan) und deine Antworten auf Fragen des Veranstalters. **Zahlungsdaten** (Kartennummer, Bank- oder Wallet-Daten) werden ausschließlich von unserem Zahlungsdienstleister Stripe erhoben und verarbeitet; wir erhalten nur Zahlungsreferenz, Betrag, Status und bei Bedarf die letzten vier Ziffern des Zahlungsmittels. Rechtsgrundlage ist die Vertragserfüllung.',
        },
        {
          type: 'p',
          text: 'Stripe Payments Europe, Ltd., Irland (und Stripe, Inc., USA als Unterauftragsverarbeiter mit Zertifizierung nach dem EU-US Data Privacy Framework) ist für die Zahlungsabwicklung teilweise eigenständig Verantwortlicher, etwa für Betrugsprävention und gesetzliche Pflichten. Informationen: [stripe.com/at/privacy](https://stripe.com/at/privacy). Veranstalter, Creator und Brands, die Auszahlungen erhalten oder Rechnungen bezahlen, schließen zusätzlich einen Vertrag mit Stripe (Stripe Connect bzw. Stripe Checkout); Stripe erhebt dafür Identitäts-, Adress- und Bankdaten direkt.',
        },
        {
          type: 'p',
          text: '**Weitergabe an den Veranstalter:** Der Veranstalter erhält zur Durchführung des Events deinen Namen, deine E-Mail-Adresse, deine Ticketdaten und deine Antworten auf seine Fragen. Er ist dafür eigenständig Verantwortlicher und darf diese Daten nur für das Event nutzen (siehe AGB, C.3). Beim Einlass sieht das Scan-Personal Name und Ticketstatus.',
        },
        {
          type: 'p',
          text: 'Für Brand-Aufträge erstellen wir Rechnungen, Korrekturbelege und Auszahlungsbelege mit Name, Anschrift, gegebenenfalls UID-Nummer und Beträgen. Diese Belege bewahren wir sieben Jahre auf (§ 132 BAO, § 212 UGB). Rechtsgrundlage ist die rechtliche Verpflichtung.',
        },
      ],
    },
    {
      id: 'business',
      title: '6. Veranstalter, Creator und Brands',
      blocks: [
        {
          type: 'p',
          text: '**Veranstalter:** Zusätzlich zu den Kontodaten verarbeiten wir die Eventangaben, Verkaufszahlen, Auszahlungsstatus, Bewertungen durch Gäste und den Status deines Stripe-Auszahlungskontos. Als Plattformbetreiber können wir gesetzlich verpflichtet sein, Angaben zu Verkäufern (Name, Anschrift, Steuernummer, Umsätze) an das Finanzamt zu melden (Digitale Plattformen-Meldepflichtgesetz); Rechtsgrundlage ist dann die rechtliche Verpflichtung.',
        },
        {
          type: 'p',
          text: '**Creator:** Bei der Bewerbung verarbeiten wir Vor- und Nachname, Wohnort, Alter, Social-Media-Kanäle mit Follower-Spanne, Kategorien, Portfolio-Links und deine Abrechnungsdaten (Name, Anschrift, optional Firma, UID- oder Steuernummer). Im Rahmen von Aufträgen verarbeiten wir Zusagen, Einsatzzeiten, die Vergütung, die Leistungsprüfung (Rückmeldungen der Brand, deine Stellungnahme, hochgeladene Belege) und Auszahlungen. **Brands sehen dein Profil (Name, Kanäle, Kategorien, Stadt, Kurzbeschreibung) nur, wenn du dies im Creator-Bereich freigegeben hast**; diese Freigabe kannst du jederzeit widerrufen. Rechtsgrundlage ist die Vertragserfüllung bzw. deine Einwilligung für die Freigabe.',
        },
        {
          type: 'p',
          text: '**Brands:** Wir verarbeiten Firmenname, Ansprechperson mit Name, E-Mail und Position, Branche, Website, Social-Media-Kanäle, Teammitglieder, Auftragsdaten, Rechnungsadresse und UID-Nummer (über Stripe Checkout erhoben) sowie die Leistungsprüfung. Rechtsgrundlage ist die Vertragserfüllung. Angaben zur Ansprechperson sind personenbezogene Daten dieser Person.',
        },
      ],
    },
    {
      id: 'location',
      title: '7. Standortdaten',
      blocks: [
        {
          type: 'p',
          text: '**Events in der Nähe:** Wenn du den Standortzugriff im Browser oder in der App erlaubst, übermitteln wir deine aktuellen Koordinaten an unseren Server, um Events in deiner Umgebung anzuzeigen. Wir speichern diese Koordinaten nicht dauerhaft in deinem Konto; in den Apps werden zuletzt gewählte Orte lokal auf deinem Gerät gespeichert. Alternativ kannst du einen Ort manuell wählen. Rechtsgrundlage ist deine Einwilligung (Systemberechtigung), die du in den Geräte- bzw. Browsereinstellungen jederzeit widerrufen kannst.',
        },
        {
          type: 'p',
          text: '**Standort im Chat teilen:** Du kannst in einer Unterhaltung deinen Standort als Kartenlink teilen und, wenn du es aktivierst, für die Dauer der Freigabe laufend aktualisieren lassen. Die Nachricht wird wie jede andere Chatnachricht gespeichert. Rechtsgrundlage ist deine Einwilligung durch aktives Teilen. Wir protokollieren Standortfreigaben zusätzlich zur Missbrauchsprävention (Absender, Empfänger, Zeitpunkt) und löschen dieses Protokoll nach 90 Tagen.',
        },
        {
          type: 'p',
          text: '**Sicherheitsbegleitung:** Du kannst für ein Event andere Nutzer als Sicherheitsbegleitung festlegen. Diese sehen, dass du das Event besuchst, sowie Ort und Zeit des Events. Dein Live-Standort wird dabei nicht übertragen.',
        },
        {
          type: 'p',
          text: '**Adressen von Events** werden zur Kartendarstellung in Koordinaten umgewandelt (Geocoding) über den Dienst Nominatim der OpenStreetMap Foundation (Vereinigtes Königreich, Angemessenheitsbeschluss der EU). Dabei wird nur die eingegebene Adresse übermittelt.',
        },
      ],
    },
    {
      id: 'content',
      title: '8. Beiträge, Erinnerungen, Stories, Kommentare und Chat',
      blocks: [
        {
          type: 'p',
          text: 'Inhalte, die du veröffentlichst (Beiträge, Kommentare, Stories, Fotos und Videos als „Erinnerungen", Bewertungen, Reaktionen), sind entsprechend der gewählten Sichtbarkeit für andere Nutzer sichtbar. Die Standardsichtbarkeit von Erinnerungen kannst du in den Einstellungen festlegen. Auf Fotos können Personen markiert werden; markierte Personen werden benachrichtigt und können die Markierung entfernen. Stories sind 24 Stunden sichtbar und werden danach gelöscht. Rechtsgrundlage ist die Vertragserfüllung (Bereitstellung der Community-Funktionen).',
        },
        {
          type: 'p',
          text: 'Chatnachrichten (Text, Bilder, geteilte Standorte, Musiktitel) werden auf unseren Servern gespeichert, damit beide Seiten sie abrufen können. Wir werten Nachrichten nicht aus und lesen sie nur, wenn eine Nachricht gemeldet wird oder wir gesetzlich dazu verpflichtet sind. Nachrichten werden gelöscht, wenn du die Unterhaltung löschst oder dein Konto gelöscht wird.',
        },
        {
          type: 'p',
          text: 'Eventtexte (Titel, Beschreibung, Einschränkungen) übersetzen wir automatisch zwischen Deutsch und Englisch über DeepL SE, Köln (Deutschland). Dabei werden nur die Eventtexte übermittelt, keine Kontodaten.',
        },
      ],
    },
    {
      id: 'communication',
      title: '9. E-Mails und Push-Benachrichtigungen',
      blocks: [
        {
          type: 'p',
          text: '**Transaktions-E-Mails** (Bestätigungscodes, Ticketbestätigungen mit Kalendereintrag, Änderungen an Events, Zahlungs- und Auszahlungsbelege, Erinnerungen an bevorstehende Events, Auftragsnachrichten, Sicherheitshinweise) versenden wir über Twilio Inc. (SendGrid), USA, mit Zertifizierung nach dem EU-US Data Privacy Framework. Rechtsgrundlage ist die Vertragserfüllung. **Werbe-E-Mails (Newsletter)** senden wir nur mit deiner vorherigen Einwilligung (§ 174 TKG 2021); jede Werbe-E-Mail enthält einen Abmeldelink.',
        },
        {
          type: 'p',
          text: '**Push-Benachrichtigungen** in den Apps erhältst du nur, wenn du sie im Betriebssystem erlaubst. Das dafür nötige Geräte-Token speichern wir in deinem Konto und löschen es beim Abmelden. Die Zustellung erfolgt über Expo (650 Industries, Inc., USA), Apple Push Notification Service und Google Firebase Cloud Messaging. Benachrichtigungen betreffen deine Tickets, Nachrichten, Aufträge und Interaktionen; Ankündigungen mit werblichem Inhalt senden wir nur mit gesonderter Einwilligung, die du in den Einstellungen widerrufen kannst. Wir erfassen, ob eine Benachrichtigung geöffnet wurde, um die Zustellung zu verbessern.',
        },
      ],
    },
    {
      id: 'raffles',
      title: '10. Gewinnspiele',
      blocks: [
        {
          type: 'p',
          text: 'Bei der Teilnahme an einem Gewinnspiel verarbeiten wir Name, E-Mail-Adresse, Ticketdaten und deine Antworten auf Gewinnspielfragen, um die Ziehung durchzuführen und Gewinner zu benachrichtigen. Rechtsgrundlage ist die Vertragserfüllung (Teilnahmevertrag). **Eine Weitergabe deiner Daten an einen Gewinnspielpartner oder die Nutzung deiner E-Mail-Adresse für dessen Werbung erfolgt nur, wenn du bei der Teilnahme gesondert eingewilligt hast.** Die Einwilligung kannst du jederzeit bei uns oder beim Partner widerrufen. Gewinnspieldaten löschen wir drei Monate nach Abschluss des Gewinnspiels, soweit keine Aufbewahrungspflichten bestehen.',
        },
      ],
    },
    {
      id: 'fraud',
      title: '11. Empfehlungsprogramm, Betrugsprävention und Sicherheit',
      blocks: [
        {
          type: 'p',
          text: 'Zum Schutz vor Missbrauch des Empfehlungsprogramms (Mehrfachkonten zur Erschleichung von Guthaben) und zur Sicherheit der Konten erzeugen wir bei der Registrierung eine technische Gerätekennung (Hash aus Gerätemerkmalen wie Browser- bzw. Gerätetyp, Betriebssystem und Bildschirmeigenschaften) und gleichen sie mit bestehenden Konten ab. Die Kennung lässt keinen Rückschluss auf deine Identität zu und wird nicht zu Werbezwecken genutzt. Rechtsgrundlage ist unser berechtigtes Interesse an der Verhinderung von Betrug (Art. 6 Abs. 1 lit. f DSGVO); du kannst dieser Verarbeitung widersprechen, dann prüfen wir Empfehlungsgutschriften manuell. Die Kennung wird mit dem Konto gelöscht.',
        },
        {
          type: 'p',
          text: 'Zum Schutz der Plattform setzen wir Zugriffsbegrenzungen (Rate-Limiting) je Nutzer bzw. IP-Adresse ein und speichern sicherheitsrelevante Ereignisse (fehlgeschlagene Anmeldungen, Sperren) für bis zu 90 Tage.',
        },
      ],
    },
    {
      id: 'errors',
      title: '12. Fehleranalyse (Sentry)',
      blocks: [
        {
          type: 'p',
          text: 'Um Abstürze und Fehler zu erkennen, nutzen wir Sentry (Functional Software, Inc., USA; Datenverarbeitung in der EU-Region, Standardvertragsklauseln). Bei einem Fehler werden Fehlermeldung, Programmzustand, App- bzw. Browserversion, Betriebssystem, Gerätetyp und ein Zeitstempel übermittelt. Wir haben Sentry so konfiguriert, dass IP-Adressen, Cookies, Zugangstoken, E-Mail-Adressen und Zahlungsreferenzen nicht übertragen bzw. vor dem Versand entfernt werden. Rechtsgrundlage ist unser berechtigtes Interesse an einem stabilen Dienst. Fehlerberichte werden nach 90 Tagen gelöscht.',
        },
      ],
    },
    {
      id: 'cookies',
      title: '13. Cookies, Analyse und Marketing',
      blocks: [
        {
          type: 'h3',
          text: 'Unbedingt erforderliche Speicherung',
        },
        {
          type: 'p',
          text: 'Für Anmeldung, Sprache, Sicherheit und die Speicherung deiner Cookie-Entscheidung verwenden wir technisch notwendige Cookies und lokale Speicher (z. B. Anmelde-Token, gewählte Sprache, Entwürfe, Cookie-Einstellung „syp_consent", 12 Monate). Dafür ist keine Einwilligung erforderlich (§ 165 Abs. 3 TKG 2021).',
        },
        {
          type: 'h3',
          text: 'Analyse und Marketing nur mit Einwilligung',
        },
        {
          type: 'p',
          text: 'Die folgenden Dienste setzen wir auf der Website nur ein, wenn du im Cookie-Banner zustimmst. Ohne Zustimmung bleiben sie deaktiviert (Google Consent Mode v2, Standard „abgelehnt"). Deine Auswahl kannst du jederzeit über den Link „Cookie-Einstellungen" im Footer und in den Einstellungen ändern oder widerrufen.',
        },
        {
          type: 'table',
          head: ['Dienst', 'Zweck, Anbieter, Hinweise'],
          rows: [
            ['Google Tag Manager', 'Verwaltung der nachfolgenden Tags. Google Ireland Ltd., Irland. Lädt die übrigen Dienste erst nach deiner Zustimmung.'],
            ['Google Analytics 4 (Kategorie Analyse)', 'Reichweitenmessung, Nutzungsstatistiken mit gekürzter IP-Adresse. Speicherdauer der Daten bei Google 14 Monate. Übermittlung in die USA auf Grundlage des EU-US Data Privacy Framework. Widerspruch zusätzlich über [tools.google.com/dlpage/gaoptout](https://tools.google.com/dlpage/gaoptout).'],
            ['Google Ads Conversion und Remarketing (Kategorie Marketing)', 'Messung der Wirksamkeit unserer Anzeigen und Ansprache von Besuchern über das Google-Werbenetzwerk. Einstellungen bei Google: [myadcenter.google.com](https://myadcenter.google.com).'],
            ['Google AdSense (Kategorie Marketing)', 'Anzeige von Werbung Dritter auf einzelnen Seiten; wird erst nach Zustimmung geladen.'],
            ['Meta Pixel und Conversions API (Kategorie Marketing)', 'Messung von Registrierungen und Käufen nach Klick auf unsere Anzeigen bei Facebook/Instagram sowie Zielgruppenbildung. Meta Platforms Ireland Ltd.; Meta Platforms, Inc., USA (EU-US Data Privacy Framework). Auch die Übermittlung aus unseren Formularen (Creator-Bewerbung, Business-Anfrage) an die Conversions API erfolgt nur mit deiner Marketing-Einwilligung und ohne IP-Adresse. Für die Datenerhebung besteht eine gemeinsame Verantwortlichkeit nach Art. 26 DSGVO; Informationen: [facebook.com/privacy/policy](https://www.facebook.com/privacy/policy).'],
          ],
        },
        {
          type: 'h3',
          text: 'Analyse und Tracking in den Apps',
        },
        {
          type: 'p',
          text: 'In den iOS- und Android-Apps fragen wir beim ersten Start, ob du Nutzungsanalyse (Google Analytics 4 über das Measurement Protocol mit einer zufälligen App-Kennung) und Marketing-Messung (Meta Conversions API, Facebook SDK) erlaubst. Auf iOS gilt zusätzlich die Systemabfrage „App-Tracking". Ohne deine Zustimmung werden diese Daten nicht gesendet. Die Auswahl kannst du in den App-Einstellungen unter „Datenschutz" jederzeit ändern.',
        },
        {
          type: 'h3',
          text: 'Google Sign-In und Google Fonts',
        },
        {
          type: 'p',
          text: 'Auf den Anmelde- und Registrierungsseiten laden wir die Anmeldebibliothek von Google, damit „Mit Google anmelden" funktioniert; dabei wird deine IP-Adresse an Google übermittelt. Schriftarten binden wir lokal ein, ohne Verbindung zu Google-Servern.',
        },
      ],
    },
    {
      id: 'embeds',
      title: '14. Eingebettete Inhalte Dritter',
      blocks: [
        {
          type: 'p',
          text: 'Einzelne Seiten enthalten Inhalte von Drittanbietern, die erst nach einem Klick geladen werden (Zwei-Klick-Lösung): Instagram-Beiträge (Meta Platforms Ireland Ltd.), Spotify-Vorschauen (Spotify AB), YouTube-Videos (Google Ireland Ltd.). Erst mit dem Klick werden deine IP-Adresse und Geräteinformationen an den Anbieter übermittelt; der Anbieter kann dabei Cookies setzen. Rechtsgrundlage ist deine Einwilligung durch den Klick. Links zu Google Maps öffnen den Kartendienst außerhalb unserer Plattform.',
        },
        {
          type: 'p',
          text: 'Events von Ticketmaster werden aus öffentlichen Schnittstellen importiert; dabei werden keine Daten über dich an Ticketmaster übermittelt. Der Blog unter blog.shareyourparty.de wird mit WordPress betrieben; für ihn gilt diese Datenschutzerklärung entsprechend.',
        },
      ],
    },
    {
      id: 'moderation',
      title: '15. Meldungen, Moderation und Support',
      blocks: [
        {
          type: 'p',
          text: 'Wenn du Inhalte oder Nutzer meldest, speichern wir die Meldung, den Grund, den gemeldeten Inhalt und deine Kontokennung, um die Meldung zu prüfen und dich über das Ergebnis zu informieren. Gemeldete Nutzer erfahren nicht, wer sie gemeldet hat. Bei Sperren speichern wir Grund und Zeitpunkt für die Dauer der Sperre und zur Abwehr erneuter Registrierungen und teilen dir Grund und Rechtsgrundlage per E-Mail mit. Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren Plattform und die Erfüllung unserer Pflichten nach dem Digital Services Act.',
        },
        {
          type: 'p',
          text: 'Support-Anfragen per E-Mail verarbeiten wir zur Beantwortung deiner Anfrage und löschen sie zwölf Monate nach Abschluss. Das Kontaktformular öffnet dein E-Mail-Programm; die Nachricht wird nicht über unsere Server versendet.',
        },
      ],
    },
    {
      id: 'recipients',
      title: '16. Empfänger und Übermittlung in Drittländer',
      blocks: [
        {
          type: 'p',
          text: 'Deine Daten erhalten nur Empfänger, die sie für die genannten Zwecke benötigen: die in dieser Erklärung genannten Auftragsverarbeiter (Hosting, Datenbank, Speicher, E-Mail, Push, Fehleranalyse, Übersetzung), Stripe als Zahlungsdienstleister, Veranstalter und Brands im beschriebenen Umfang, Gewinnspielpartner nur mit Einwilligung, Steuerberatung und Behörden bei gesetzlicher Verpflichtung. Mit allen Auftragsverarbeitern bestehen Verträge nach Art. 28 DSGVO.',
        },
        {
          type: 'p',
          text: 'Soweit Daten in Länder außerhalb des Europäischen Wirtschaftsraums übermittelt werden (insbesondere USA), stützen wir dies auf Angemessenheitsbeschlüsse der EU-Kommission (EU-US Data Privacy Framework für zertifizierte Anbieter, Vereinigtes Königreich) oder auf Standardvertragsklauseln nach Art. 46 Abs. 2 lit. c DSGVO mit ergänzenden Maßnahmen. Eine Kopie der Garantien erhältst du auf Anfrage.',
        },
      ],
    },
    {
      id: 'retention',
      title: '17. Speicherdauer',
      blocks: [
        {
          type: 'p',
          text: 'Wir speichern personenbezogene Daten nur so lange, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen:',
        },
        {
          type: 'table',
          head: ['Daten', 'Speicherdauer'],
          rows: [
            ['Konto- und Profildaten, Inhalte, Nachrichten, Favoriten, hochgeladene Medien', 'bis zur Löschung des Kontos; danach Löschung innerhalb von 30 Tagen'],
            ['Benachrichtigungen in der App', '180 Tage'],
            ['Aktivitätstage (nur Kontokennung und Datum, für Nutzungsstatistiken)', '400 Tage'],
            ['Tickets, Zahlungen, Rechnungen, Auszahlungsbelege, Gutschriften', '7 Jahre ab Ende des Kalenderjahres (§ 132 BAO, § 212 UGB); nach Kontolöschung nur noch in pseudonymisierter Form für Buchhaltung und Steuer'],
            ['Zustimmung zu AGB und Einwilligungen (Zeitpunkt, Version)', '3 Jahre nach Ende des Nutzungsvertrags bzw. nach Widerruf (Nachweispflicht)'],
            ['Server-Logs, Sicherheitsereignisse', 'bis zu 30 Tage (Logs) bzw. 90 Tage (Sicherheitsereignisse)'],
            ['Fehlerberichte (Sentry)', '90 Tage'],
            ['Einmalcodes (OTP)', 'bis zur Verwendung, längstens 24 Stunden'],
            ['Stories', '24 Stunden'],
            ['Protokoll geteilter Standorte', '90 Tage'],
            ['Meldungen und Moderationsentscheidungen', '12 Monate nach Abschluss; bei Sperren für die Dauer der Sperre'],
            ['Gewinnspieldaten', '3 Monate nach Abschluss des Gewinnspiels'],
            ['Bewerbungen für den Creator Club (abgelehnt)', '6 Monate nach Entscheidung'],
            ['Cookie-Einstellung', '12 Monate'],
          ],
        },
        {
          type: 'p',
          text: 'Nach Löschung deines Kontos bleiben Inhalte, die andere Nutzer betreffen (z. B. Kommentare unter fremden Beiträgen, Bewertungen für Veranstalter), in anonymisierter Form erhalten. Daten, die wir zur Abwehr von Rechtsansprüchen benötigen, bewahren wir bis zum Ablauf der Verjährungsfristen auf.',
        },
      ],
    },
    {
      id: 'rights',
      title: '18. Deine Rechte',
      blocks: [
        { type: 'p', text: 'Du hast gegenüber uns folgende Rechte:' },
        {
          type: 'ul',
          items: [
            '**Auskunft** (Art. 15 DSGVO) über die zu deiner Person gespeicherten Daten,',
            '**Berichtigung** (Art. 16) unrichtiger Daten; die meisten Angaben kannst du selbst im Profil ändern,',
            '**Löschung** (Art. 17); dein Konto kannst du jederzeit in den Einstellungen löschen (Bestätigung per E-Mail-Code). Tickets und Zahlungsdaten, für die Aufbewahrungspflichten bestehen, bleiben pseudonymisiert erhalten,',
            '**Einschränkung der Verarbeitung** (Art. 18),',
            '**Datenübertragbarkeit** (Art. 20): In den Einstellungen kannst du die von dir bereitgestellten Daten jederzeit in einem maschinenlesbaren Format (JSON) herunterladen,',
            '**Widerruf erteilter Einwilligungen** (Art. 7 Abs. 3) mit Wirkung für die Zukunft, z. B. über die Cookie-Einstellungen, die App-Einstellungen oder per E-Mail.',
          ],
        },
        {
          type: 'note',
          text: '**Widerspruchsrecht (Art. 21 DSGVO):** Du kannst Verarbeitungen, die wir auf ein berechtigtes Interesse stützen, jederzeit aus Gründen widersprechen, die sich aus deiner besonderen Situation ergeben. Verarbeiten wir Daten für Direktwerbung, kannst du dem jederzeit ohne Angabe von Gründen widersprechen; wir verwenden deine Daten dann nicht mehr für diesen Zweck.',
        },
        {
          type: 'p',
          text: `Zur Ausübung deiner Rechte genügt eine E-Mail an [${OPERATOR.email}](mailto:${OPERATOR.email}). Wir antworten innerhalb eines Monats. Zur Sicherheit können wir eine Bestätigung über die bei uns hinterlegte E-Mail-Adresse verlangen.`,
        },
        {
          type: 'p',
          text: `**Beschwerderecht:** Wenn du der Ansicht bist, dass die Verarbeitung deiner Daten gegen Datenschutzrecht verstößt, kannst du dich bei einer Aufsichtsbehörde beschweren, insbesondere bei der ${DSB.name.de}, ${DSB.street}, ${DSB.postalCode} ${DSB.city}, Telefon ${DSB.phone}, E-Mail [${DSB.email}](mailto:${DSB.email}), [${DSB.website.replace('https://', '')}](${DSB.website}).`,
        },
      ],
    },
    {
      id: 'minors',
      title: '19. Minderjährige',
      blocks: [
        {
          type: 'p',
          text: 'Unsere Dienste richten sich an Personen ab 18 Jahren. Wir erheben wissentlich keine Daten von Personen unter 18 Jahren. Erfahren wir von einem solchen Konto, löschen wir es. Eltern und Erziehungsberechtigte können sich dazu jederzeit an uns wenden.',
        },
      ],
    },
    {
      id: 'security',
      title: '20. Datensicherheit',
      blocks: [
        {
          type: 'p',
          text: 'Wir übertragen Daten ausschließlich verschlüsselt (TLS), speichern Passwörter nur als Hash, beschränken Zugriffe nach dem Need-to-know-Prinzip, protokollieren Administrationszugriffe und sichern unsere Datenbanken regelmäßig. Zahlungsdaten verlassen nie unseren Zahlungsdienstleister. Trotz aller Maßnahmen kann kein absoluter Schutz garantiert werden; bitte wähle ein sicheres Passwort und aktiviere die Zwei-Faktor-Authentifizierung.',
        },
      ],
    },
    {
      id: 'changes',
      title: '21. Änderungen dieser Datenschutzerklärung',
      blocks: [
        {
          type: 'p',
          text: 'Wir passen diese Erklärung an, wenn sich unsere Verarbeitungen oder die Rechtslage ändern. Die jeweils aktuelle Fassung findest du unter [shareyourparty.de/privacy](/privacy) und in den Apps. Über wesentliche Änderungen informieren wir dich per E-Mail oder in der App.',
        },
      ],
    },
  ],
  footer: 'Stand: 5. November 2026 – Version 2026-11',
}
