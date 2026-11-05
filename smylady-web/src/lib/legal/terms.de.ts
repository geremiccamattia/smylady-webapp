import { OPERATOR, operatorAddressLine, operatorDisplayName, operatorOwnersLine } from './operator'
import type { LegalDocument } from './types'

export const TERMS_VERSION = '2026-11-05'

export const TERMS_DE: LegalDocument = {
  kind: 'terms',
  language: 'de',
  title: 'Allgemeine Geschäftsbedingungen (AGB)',
  shortTitle: 'AGB',
  version: TERMS_VERSION,
  effectiveDate: TERMS_VERSION,
  intro: [
    {
      type: 'p',
      text: `Diese AGB gelten für die Nutzung der Plattform „Share Your Party" (Website shareyourparty.de, iOS- und Android-App) von ${operatorDisplayName()}, ${operatorOwnersLine()}, ${operatorAddressLine('de')} (nachfolgend „Share Your Party", „wir" oder „uns"). Kontakt: [${OPERATOR.email}](mailto:${OPERATOR.email}).`,
    },
    {
      type: 'p',
      text: 'Die AGB sind in Teile gegliedert. Teil A gilt für alle. Teil B gilt für Gäste, die Tickets buchen. Teil C gilt für Veranstalter. Teil D gilt für Creator. Teil E gilt für Brands (Unternehmen, die Creator buchen). Teil F enthält die Widerrufsbelehrung für Verbraucher. Teil G regelt Guthaben, Gewinnspiele und Zusatzleistungen. Teil H enthält Inhalte, Haftung und Schlussbestimmungen.',
    },
  ],
  sections: [
    // ────────────────────────────────────────────── Teil A
    {
      id: 'a1',
      title: 'A.1 Geltungsbereich und Begriffe',
      blocks: [
        {
          type: 'p',
          text: 'Mit der Registrierung eines Kontos oder der Nutzung der Plattform erkennst du diese AGB an. Entgegenstehende Bedingungen von Nutzerinnen und Nutzern gelten nicht, auch wenn wir ihnen nicht ausdrücklich widersprechen.',
        },
        {
          type: 'ul',
          items: [
            '**Plattform**: Website, Web-App und mobile Apps von Share Your Party einschließlich aller Funktionen (Eventsuche, Tickets, Feed, Chat, Erinnerungen, Creator Club, Brand-Bereich).',
            '**Nutzer**: jede Person mit einem Konto. **Verbraucher** ist, wer die Plattform zu Zwecken nutzt, die nicht zu einer unternehmerischen Tätigkeit gehören (§ 1 KSchG); **Unternehmer** ist, wer sie im Rahmen seines Unternehmens nutzt.',
            '**Gast**: Nutzer, der ein Ticket bucht oder an einem Event teilnimmt.',
            '**Veranstalter**: Nutzer, der ein Event veröffentlicht und dafür Tickets anbietet. Veranstalter können Unternehmer oder Privatpersonen sein.',
            '**Creator**: Nutzer, der in den Creator Club aufgenommen wurde und Aufträge von Brands über die Plattform annimmt.',
            '**Brand**: Unternehmen, das über die Plattform Creator für Veranstaltungen oder Kampagnen bucht.',
            '**Ticket**: digitale Zutrittsberechtigung mit QR-Code für ein konkretes Event zu einem festgelegten Termin.',
          ],
        },
        {
          type: 'p',
          text: 'Für Verbraucher gelten die zwingenden Bestimmungen des Konsumentenschutzgesetzes (KSchG) und des Fern- und Auswärtsgeschäfte-Gesetzes (FAGG). Soweit diese AGB davon abweichen, gehen die gesetzlichen Bestimmungen zugunsten des Verbrauchers vor.',
        },
      ],
    },
    {
      id: 'a2',
      title: 'A.2 Unsere Rolle: Plattform und Vermittlung',
      blocks: [
        {
          type: 'p',
          text: 'Share Your Party stellt die technische Plattform bereit, auf der Veranstalter Events veröffentlichen und Gäste Tickets buchen können. **Der Vertrag über den Besuch eines Events (Ticketvertrag) kommt ausschließlich zwischen dem Gast und dem jeweiligen Veranstalter zustande.** Wir sind nicht Veranstalter dieser Events und nicht Partei des Ticketvertrags, sofern wir ein Event nicht ausdrücklich als eigenes Event kennzeichnen.',
        },
        {
          type: 'p',
          text: 'Wir vermitteln den Ticketvertrag, wickeln die Zahlung über unseren Zahlungsdienstleister ab, stellen das digitale Ticket aus und leiten den Erlös abzüglich der vereinbarten Gebühren an den Veranstalter weiter. Für diese Vermittlungs- und Zahlungsleistungen schließen wir mit dem Gast und dem Veranstalter jeweils einen eigenen Nutzungsvertrag nach diesen AGB.',
        },
        {
          type: 'p',
          text: 'Bei Aufträgen zwischen Brands und Creatorn (Teil E) ist Share Your Party selbst Vertragspartner der Brand und beauftragt die Creator als selbstständige Dienstleister.',
        },
        {
          type: 'p',
          text: 'Bei jedem Event zeigen wir an, ob der Veranstalter als Unternehmer oder als Privatperson auftritt, soweit uns diese Angabe vorliegt. **Ist der Veranstalter eine Privatperson, gelten für den Ticketvertrag die verbraucherschutzrechtlichen Bestimmungen (insbesondere KSchG und FAGG) nicht**, weil kein Vertrag zwischen Unternehmer und Verbraucher vorliegt. Unsere eigenen Pflichten als Plattform bleiben davon unberührt.',
        },
      ],
    },
    {
      id: 'a3',
      title: 'A.3 Registrierung, Konto und Mindestalter',
      blocks: [
        {
          type: 'p',
          text: 'Die Nutzung der Plattform setzt ein Konto voraus. **Die Registrierung ist ab 18 Jahren zulässig.** Wir fragen das Geburtsdatum ab und können Altersnachweise verlangen. Konten von Personen unter 18 Jahren werden gelöscht. Veranstalter sind unabhängig davon verpflichtet, die jugendschutzrechtlichen Altersgrenzen ihrer Events einzuhalten.',
        },
        {
          type: 'p',
          text: 'Bei der Registrierung sind wahrheitsgemäße Angaben zu machen und aktuell zu halten. Das Konto ist persönlich und nicht übertragbar. Du bist verpflichtet, deine Zugangsdaten geheim zu halten und uns einen Missbrauch unverzüglich mitzuteilen. Handlungen, die über dein Konto vorgenommen werden, werden dir zugerechnet, soweit du den Missbrauch zu vertreten hast.',
        },
        {
          type: 'p',
          text: 'Die Anmeldung über Google, Apple oder Facebook ist freiwillig. Dabei übermittelt der jeweilige Anbieter uns Name, E-Mail-Adresse und eine Kennung. Da diese Anbieter kein Geburtsdatum übermitteln, fragen wir es nach der ersten Anmeldung ab; ohne Angabe eines Geburtsdatums, das ein Alter von mindestens 18 Jahren ergibt, kann das Konto nicht genutzt werden. Einzelheiten stehen in der [Datenschutzerklärung](/privacy).',
        },
        {
          type: 'p',
          text: 'Der Nutzungsvertrag wird auf unbestimmte Zeit geschlossen und ist kostenlos. Du kannst dein Konto jederzeit in den Einstellungen löschen; zur Sicherheit bestätigst du die Löschung mit einem Code, den wir an deine E-Mail-Adresse senden. Damit endet der Nutzungsvertrag. Bestehende Zahlungspflichten, laufende Aufträge und gesetzliche Aufbewahrungspflichten bleiben bestehen (siehe Datenschutzerklärung). Wir können den Nutzungsvertrag mit einer Frist von 14 Tagen per E-Mail kündigen; das Recht zur Sperre aus wichtigem Grund (H.3) bleibt unberührt.',
        },
      ],
    },
    {
      id: 'a4',
      title: 'A.4 Vertragssprache, Speicherung des Vertragstexts',
      blocks: [
        {
          type: 'p',
          text: 'Vertragssprache ist Deutsch. Die englische Fassung dieser AGB dient der Information; bei Abweichungen gilt die deutsche Fassung. Wir speichern den Vertragstext nicht gesondert für dich; die jeweils geltenden AGB sind jederzeit unter [shareyourparty.de/terms](/terms) abrufbar und können gespeichert oder gedruckt werden. Bei jeder Buchung erhältst du eine Bestätigung per E-Mail mit den wesentlichen Vertragsdaten.',
        },
      ],
    },
    // ────────────────────────────────────────────── Teil B
    {
      id: 'b1',
      title: 'B.1 Tickets buchen: Angebot und Vertragsschluss',
      blocks: [
        {
          type: 'p',
          text: 'Die Darstellung eines Events auf der Plattform ist ein verbindliches Angebot des Veranstalters zum Abschluss eines Ticketvertrags, solange Tickets verfügbar sind. Mit Klick auf „Zahlungspflichtig buchen" (bzw. „Bin dabei" bei kostenlosen Tickets) nimmst du das Angebot an. Der Vertrag kommt mit der Bestätigung der Zahlung bzw. der Ausstellung des Tickets zustande. Bei kostenpflichtigen Tickets entsteht das Ticket erst, wenn die Zahlung bestätigt ist.',
        },
        {
          type: 'p',
          text: 'Vor der Buchung siehst du den Gesamtpreis einschließlich aller Gebühren und der gesetzlichen Umsatzsteuer, die Anzahl der Tickets, die Ticketkategorie und gegebenenfalls Zeitfenster. Eingaben kannst du bis zum Klick auf den Buchungsbutton korrigieren. Manche Veranstalter stellen vor der Buchung Fragen (z. B. Namen der Begleitpersonen); diese Antworten werden an den Veranstalter übermittelt.',
        },
        {
          type: 'p',
          text: 'Das Ticket wird dir als digitales Ticket mit QR-Code im Konto bereitgestellt und per E-Mail bestätigt. Es ist pro Person einmal gültig und wird beim Einlass entwertet. Du bist dafür verantwortlich, den QR-Code nicht weiterzugeben; bei doppelter Vorlage gilt die erste Entwertung.',
        },
      ],
    },
    {
      id: 'b2',
      title: 'B.2 Preise, Gästegebühr und Zahlung',
      blocks: [
        {
          type: 'p',
          text: 'Der Ticketpreis wird vom Veranstalter festgelegt. Zusätzlich erheben wir für kostenpflichtige Tickets eine **Gästegebühr** als Entgelt für unsere Vermittlungs- und Zahlungsleistung. Ihre Höhe richtet sich nach dem Ticketpreis und wird vor der Buchung im Gesamtpreis ausgewiesen; die aktuellen Sätze stehen unter [Preise & Konditionen](/pricing). Für kostenlose Tickets fallen keine Gebühren an. Alle Preise verstehen sich in Euro inklusive der gesetzlichen Umsatzsteuer.',
        },
        {
          type: 'p',
          text: 'Die Zahlung erfolgt über den Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd., Irland) mit den jeweils angebotenen Zahlungsarten (z. B. Karte, Apple Pay, Google Pay). Für die Zahlung gelten ergänzend die Bedingungen von Stripe. Der Ticketpreis wird vom Veranstalter über uns vereinnahmt und an ihn ausbezahlt; die Gästegebühr ist unser Entgelt.',
        },
        {
          type: 'p',
          text: 'Vorhandenes Guthaben (G.1) kann im Kaufprozess eingesetzt werden; es wird auf die Plattformgebühren angerechnet und niemals ausbezahlt.',
        },
      ],
    },
    {
      id: 'b3',
      title: 'B.3 Rücktritt, Stornierung und Rückerstattung',
      blocks: [
        {
          type: 'note',
          text: '**Kein gesetzliches Rücktrittsrecht bei Tickets.** Tickets betreffen Dienstleistungen im Zusammenhang mit Freizeitbetätigungen, für die ein bestimmter Zeitpunkt oder Zeitraum vorgesehen ist. Für solche Verträge besteht gemäß § 18 Abs. 1 Z 10 FAGG kein Rücktrittsrecht nach § 11 FAGG, auch nicht für Verbraucher. Das gilt für den Ticketvertrag mit dem Veranstalter ebenso wie für unsere damit verbundene Vermittlungsleistung.',
        },
        {
          type: 'p',
          text: 'Unabhängig davon räumen wir dir eine **freiwillige Stornomöglichkeit** ein: Ein Ticket kann bis zum Beginn des Events im Konto storniert werden, sofern es noch nicht entwertet wurde und, bei Gewinnspiel-Events, die Ziehung noch nicht stattgefunden hat. Den zu erstattenden Betrag und allfällige einbehaltene Gebühren zeigen wir vor der Bestätigung der Stornierung an. Die Erstattung erfolgt auf das ursprüngliche Zahlungsmittel, in der Regel innerhalb von 5 bis 10 Werktagen.',
        },
        {
          type: 'p',
          text: 'Sagt der Veranstalter das Event ab oder verlegt er es wesentlich (Datum, Ort), wirst du benachrichtigt und erhältst den Ticketpreis einschließlich Gästegebühr zurück. Verantwortlich für die Rückabwicklung ist der Veranstalter; wir wickeln die Erstattung über die Plattform ab, soweit die Mittel verfügbar sind, und unterstützen dich bei der Durchsetzung deiner Ansprüche gegenüber dem Veranstalter.',
        },
        {
          type: 'p',
          text: 'Kein Anspruch auf Erstattung besteht, wenn du ein Event nicht besuchst, zu spät kommst, vom Veranstalter wegen Verstoßes gegen die Hausordnung oder gegen Jugendschutz- und Sicherheitsvorschriften abgewiesen wirst oder wenn das Event aus Gründen, die der Veranstalter nicht zu vertreten hat (z. B. höhere Gewalt), nur eingeschränkt stattfindet.',
        },
      ],
    },
    {
      id: 'b4',
      title: 'B.4 Teilnahme am Event',
      blocks: [
        {
          type: 'p',
          text: 'Es gelten die Hausordnung und die Einlassbedingungen des Veranstalters (z. B. Mindestalter, Dresscode, Ausweispflicht). Der Veranstalter übt das Hausrecht aus. Gäste verhalten sich respektvoll gegenüber anderen Gästen, dem Personal und der Nachbarschaft. Verstöße können zum Verweis vom Event ohne Erstattung und zur Sperre des Kontos führen.',
        },
        {
          type: 'p',
          text: 'Für Schäden, Verletzungen oder Verluste beim Event haftet der Veranstalter nach den gesetzlichen Bestimmungen. Share Your Party haftet für den Ablauf des Events nicht (siehe H.5).',
        },
      ],
    },
    // ────────────────────────────────────────────── Teil C
    {
      id: 'c1',
      title: 'C.1 Events erstellen und veröffentlichen',
      blocks: [
        {
          type: 'p',
          text: 'Veranstalter können Events kostenlos erstellen. Vor der Veröffentlichung prüfen wir Events stichprobenartig oder vollständig und können sie ablehnen, wenn sie gegen diese AGB, gegen Gesetze oder gegen Rechte Dritter verstoßen. Ein Anspruch auf Veröffentlichung besteht nicht.',
        },
        {
          type: 'p',
          text: 'Der Veranstalter ist allein verantwortlich für Richtigkeit und Vollständigkeit der Eventangaben (Datum, Ort, Programm, Preise, Altersgrenzen, Barrierefreiheit), für die Durchführung des Events, für alle behördlichen Genehmigungen und Anmeldungen (z. B. Veranstaltungsgesetz, Gewerbeordnung, Jugendschutz, Sperrstunden, AKM/Musikrechte, Steuern) und für die Sicherheit der Gäste.',
        },
        {
          type: 'p',
          text: 'Veranstalter, die Unternehmer sind, müssen dies bei der Eventerstellung angeben und ihr Impressum bzw. ihre Identität und Kontaktdaten hinterlegen; diese werden den Gästen vor der Buchung angezeigt. Veranstalter, die als Privatpersonen auftreten, bestätigen, dass sie nicht gewerbsmäßig handeln. Wer regelmäßig oder mit Gewinnabsicht Events veranstaltet, ist in der Regel Unternehmer und muss dies angeben.',
        },
        {
          type: 'p',
          text: 'Mit dem Hochladen von Bildern, Texten und Musikangaben räumt der Veranstalter uns das nicht ausschließliche, weltweite Recht ein, diese Inhalte zur Darstellung und Bewerbung des Events auf der Plattform, in unseren Apps, in Benachrichtigungen, Newslettern und sozialen Medien zu nutzen. Der Veranstalter sichert zu, über die dafür nötigen Rechte zu verfügen.',
        },
      ],
    },
    {
      id: 'c2',
      title: 'C.2 Ticketverkauf, Veranstaltergebühr und Auszahlung',
      blocks: [
        {
          type: 'p',
          text: 'Der Veranstalter legt Ticketpreise und Kontingente fest. Für jedes verkaufte kostenpflichtige Ticket erheben wir eine **Veranstaltergebühr** in Prozent des Ticketpreises; sie wird bei der Eventerstellung angezeigt und ist unter [Preise & Konditionen](/pricing) veröffentlicht. Zusätzlich zahlt der Gast die Gästegebühr (B.2). Gebühren des Zahlungsdienstleisters sind in unseren Gebühren enthalten. Änderungen der Gebührensätze gelten nur für Events, die nach Bekanntgabe der Änderung erstellt werden.',
        },
        {
          type: 'p',
          text: 'Voraussetzung für den Verkauf kostenpflichtiger Tickets ist ein verifiziertes Auszahlungskonto bei unserem Zahlungsdienstleister Stripe (Stripe Connect). Der Veranstalter schließt dafür einen eigenen Vertrag mit Stripe und durchläuft dessen Identitätsprüfung. Die Ticketerlöse abzüglich der Veranstaltergebühr werden dem Auszahlungskonto des Veranstalters gutgeschrieben und nach dem Zeitplan von Stripe ausbezahlt. Wir können Auszahlungen zurückhalten, solange berechtigte Beschwerden, Rückbuchungen oder der Verdacht auf Missbrauch bestehen.',
        },
        {
          type: 'p',
          text: 'Bei Absage oder wesentlicher Änderung des Events ist der Veranstalter verpflichtet, die Gäste unverzüglich über die Plattform zu informieren und die Ticketpreise zu erstatten. Wir sind berechtigt, Erstattungen an Gäste aus dem Guthaben des Veranstalters vorzunehmen oder den Betrag vom Veranstalter zurückzufordern. Bei Stornierungen durch Gäste (B.3) wird der jeweilige Betrag vom Erlös des Veranstalters abgezogen.',
        },
        {
          type: 'p',
          text: 'Der Veranstalter ist für die steuerliche Behandlung seiner Einnahmen (insbesondere Umsatz- und Einkommensteuer) selbst verantwortlich. Wir stellen keine Rechnungen im Namen des Veranstalters an Gäste aus. **Hinweis:** Als Plattformbetreiber können wir gesetzlich verpflichtet sein, Angaben zu Verkäufern und deren Einnahmen an die Finanzverwaltung zu melden (Digitale Plattformen-Meldepflichtgesetz, DAC7). Veranstalter sind verpflichtet, die dafür nötigen Angaben (z. B. Steuernummer, Anschrift) auf Anfrage zu ergänzen.',
        },
      ],
    },
    {
      id: 'c3',
      title: 'C.3 Gästedaten',
      blocks: [
        {
          type: 'p',
          text: 'Der Veranstalter erhält zur Durchführung des Events Name, E-Mail-Adresse, Ticketdaten und die Antworten der Gäste auf seine Fragen (Gästeliste). Er ist für diese Daten eigenständiger Verantwortlicher im Sinne der DSGVO und darf sie ausschließlich zur Durchführung des Events verwenden. Eine Nutzung für Werbung oder eine Weitergabe an Dritte ist nur mit ausdrücklicher Einwilligung des jeweiligen Gastes zulässig. Nach dem Event sind die Daten zu löschen, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.',
        },
      ],
    },
    // ────────────────────────────────────────────── Teil D
    {
      id: 'd1',
      title: 'D.1 Creator Club: Bewerbung und Mitgliedschaft',
      blocks: [
        {
          type: 'p',
          text: 'Nutzer ab 18 Jahren können sich für den Creator Club bewerben. Über die Aufnahme entscheiden wir nach freiem Ermessen; ein Anspruch besteht nicht. Creator können die Mitgliedschaft jederzeit beenden; laufende Aufträge sind zu Ende zu führen.',
        },
        {
          type: 'p',
          text: 'Creator entscheiden selbst, ob Brands ihr Profil (Name, Kanäle, Kategorien, Stadt, Kurzbeschreibung) einsehen dürfen. Ohne diese Freigabe werden sie Brands nicht vorgeschlagen.',
        },
      ],
    },
    {
      id: 'd2',
      title: 'D.2 Aufträge annehmen und erbringen',
      blocks: [
        {
          type: 'p',
          text: 'Wir können Creator für konkrete Brand-Aufträge anfragen. Die Anfrage enthält Leistung, Termin, Ort und die Vergütung des Creators. Die Anfrage ist innerhalb der angegebenen Frist (in der Regel 48 Stunden) anzunehmen oder abzulehnen. **Mit der Annahme gibt der Creator ein verbindliches Angebot ab**, die Leistung zu den genannten Bedingungen zu erbringen. Der Vertrag zwischen Share Your Party und dem Creator kommt zustande, sobald die Brand das darauf aufbauende Angebot annimmt und bezahlt; der Creator wird darüber benachrichtigt. Nimmt die Brand nicht fristgerecht an, erlischt das Angebot des Creators.',
        },
        {
          type: 'p',
          text: 'Creator handeln als selbstständige Dienstleister. Sie sind nicht in unsere Organisation eingegliedert, nicht weisungsgebunden hinsichtlich der künstlerischen Umsetzung und frei, für andere tätig zu sein. Es entsteht kein Arbeits- oder Dienstverhältnis mit Share Your Party oder der Brand.',
        },
        {
          type: 'p',
          text: 'Creator erbringen die Leistung persönlich, pünktlich und in der vereinbarten Qualität. Sie halten die Kennzeichnungspflichten für Werbung ein (insbesondere § 26 MedienG, § 6 ECG, UWG; Kennzeichnung als „Werbung"/„bezahlte Partnerschaft"), die Richtlinien der genutzten Plattformen und die Vorgaben der Brand zu Marke und Inhalten. Rechtswidrige, diskriminierende oder jugendgefährdende Inhalte sind untersagt.',
        },
        {
          type: 'p',
          text: 'Ist der Creator verhindert, informiert er uns unverzüglich. Eine Absage weniger als 48 Stunden vor dem Termin ohne wichtigen Grund oder ein Nichterscheinen führt zum Entfall der Vergütung und kann zum Ausschluss aus dem Creator Club führen.',
        },
      ],
    },
    {
      id: 'd3',
      title: 'D.3 Leistungsprüfung, Vergütung und Auszahlung',
      blocks: [
        {
          type: 'p',
          text: 'Nach dem Event hat die Brand sieben Tage Zeit, die Leistung zu bestätigen oder ein Problem zu melden (E.4). Meldet die Brand ein Problem, kann der Creator innerhalb von fünf Tagen Stellung nehmen und Belege hochladen. Danach entscheiden wir nach billigem Ermessen, ob die Vergütung vollständig, teilweise oder nicht ausbezahlt wird, und begründen die Entscheidung gegenüber beiden Seiten. Erfolgt innerhalb der sieben Tage keine Meldung, gilt die Leistung als bestätigt.',
        },
        {
          type: 'p',
          text: 'Die Vergütung wird nach bestätigter Leistung über Stripe Connect auf das Auszahlungskonto des Creators überwiesen. Voraussetzung ist ein vollständig verifiziertes Stripe-Konto sowie die Hinterlegung von Name und Anschrift für den Auszahlungsbeleg. Der Creator erhält zu jeder Auszahlung einen Auszahlungsbeleg. Der angegebene Betrag ist der Gesamtbetrag; **der Creator ist für die steuerliche Behandlung seiner Einnahmen (Einkommensteuer, gegebenenfalls Umsatzsteuer, Sozialversicherung) selbst verantwortlich** und hat erforderliche Gewerbeberechtigungen selbst einzuholen. Die Meldepflicht nach C.2 (DAC7) gilt entsprechend.',
        },
        {
          type: 'p',
          text: 'Die Vergütung ist bis zur Auszahlung nicht abtretbar. Aufrechnungen durch den Creator sind nur mit unbestrittenen oder rechtskräftig festgestellten Forderungen zulässig.',
        },
      ],
    },
    {
      id: 'd4',
      title: 'D.4 Nutzungsrechte an Creator-Inhalten',
      blocks: [
        {
          type: 'p',
          text: 'Soweit ein Auftrag die Erstellung von Inhalten (Fotos, Videos, Beiträge) umfasst, räumt der Creator der Brand und Share Your Party das nicht ausschließliche, zeitlich und örtlich unbeschränkte Recht ein, diese Inhalte zur Bewerbung des Events, der Brand und der Plattform zu nutzen, soweit im Auftrag nichts anderes vereinbart ist. Der Creator sichert zu, dass abgebildete Personen zugestimmt haben und keine Rechte Dritter verletzt werden.',
        },
      ],
    },
    // ────────────────────────────────────────────── Teil E
    {
      id: 'e1',
      title: 'E.1 Brands: Geltung und Unternehmereigenschaft',
      blocks: [
        {
          type: 'p',
          text: 'Der Brand-Bereich richtet sich ausschließlich an Unternehmer im Sinne des § 1 UGB bzw. § 1 KSchG. Mit der Registrierung als Brand bestätigt die handelnde Person, dass sie für ein Unternehmen handelt und vertretungsbefugt ist. Verbraucherschutzrechtliche Bestimmungen finden auf Brand-Aufträge keine Anwendung.',
        },
        {
          type: 'p',
          text: 'Brands können Teammitglieder einladen. Handlungen von Teammitgliedern werden der Brand zugerechnet. Der Inhaber des Brand-Kontos haftet für die Zahlung aller über das Konto erteilten Aufträge.',
        },
      ],
    },
    {
      id: 'e2',
      title: 'E.2 Auftrag, Angebot und Vertragsschluss',
      blocks: [
        {
          type: 'p',
          text: 'Die Brand beschreibt in einer Anfrage Event oder Kampagne, Zeitraum, Ort, gewünschte Creator-Profile und Budget. Die Anfrage ist unverbindlich. Wir schlagen passende Creator vor; die Brand nimmt jeden vorgeschlagenen Creator an oder lehnt ihn ab. **Die Annahme eines Creators ist verbindlich** und berechtigt uns, den Creator anzufragen. Danach erstellen wir ein Angebot mit Gesamtpreis, Leistungsumfang und Terminen.',
        },
        {
          type: 'p',
          text: 'Das Angebot gilt für die darin genannte Frist (in der Regel sieben Tage). **Der Vertrag kommt zustande, wenn die Brand das Angebot annimmt und die Zahlung über den bereitgestellten Zahlungslink abschließt** (bei Überweisung: mit Zahlungseingang). Bis dahin kann die Brand den Auftrag kostenfrei stornieren. Nach Fristablauf ohne Zahlung wird der Auftrag automatisch storniert.',
        },
        {
          type: 'p',
          text: 'Vertragspartner der Brand ist Share Your Party. Wir erbringen die Leistung durch die ausgewählten Creator als Erfüllungsgehilfen. Fällt ein Creator aus, bemühen wir uns um gleichwertigen Ersatz; gelingt das nicht, erstatten wir den auf diesen Creator entfallenden Anteil.',
        },
      ],
    },
    {
      id: 'e3',
      title: 'E.3 Preise, Zahlung und Rechnung',
      blocks: [
        {
          type: 'p',
          text: 'Der Angebotspreis ist ein Gesamtpreis in Euro. Für Brands mit Sitz in Österreich sowie für EU-Brands ohne gültige UID-Nummer enthält er die österreichische Umsatzsteuer; für EU-Brands mit gültiger UID-Nummer geht die Steuerschuld auf den Leistungsempfänger über (Reverse Charge); für Brands außerhalb der EU ist die Leistung in Österreich nicht steuerbar. Die Zahlung erfolgt vorab über Stripe Checkout (Karte, SEPA-Lastschrift oder Überweisung). Die Rechnung wird nach Zahlungseingang automatisch per E-Mail zugestellt und steht im Brand-Bereich zum Download bereit.',
        },
        {
          type: 'p',
          text: 'Zusatzleistungen (z. B. zusätzliche Creator, längere Einsätze) werden gesondert angeboten und abgerechnet. Zahlungsverzug berechtigt uns, die Leistung zurückzubehalten und Verzugszinsen in gesetzlicher Höhe (§ 456 UGB) sowie Mahn- und Betreibungskosten zu verlangen.',
        },
      ],
    },
    {
      id: 'e4',
      title: 'E.4 Leistungsprüfung, Stornierung und Erstattung',
      blocks: [
        {
          type: 'p',
          text: 'Innerhalb von **sieben Tagen nach Ende des Events** kann die Brand im Auftragsbereich je Creator die Leistung bestätigen oder ein Problem melden (z. B. Nichterscheinen, Verspätung, fehlende Inhalte, Fehlverhalten) und Belege hochladen. Nach Ablauf der Frist gilt die Leistung als bestätigt. Der Creator erhält fünf Tage zur Stellungnahme. Anschließend entscheiden wir, ob die Vergütung des Creators vollständig, anteilig oder nicht ausbezahlt wird, und erstatten der Brand den nicht ausbezahlten Anteil der Creator-Vergütung über das ursprüngliche Zahlungsmittel. Die Entscheidung wird beiden Seiten begründet mitgeteilt. Weitergehende gesetzliche Gewährleistungs- und Schadenersatzansprüche bleiben unberührt.',
        },
        {
          type: 'p',
          text: 'Nach Vertragsschluss kann die Brand den Auftrag nur noch über uns stornieren. Bei Stornierung mehr als 14 Tage vor dem Event erstatten wir den Angebotspreis abzüglich bereits angefallener Kosten und einer Bearbeitungspauschale von 10 %; bei Stornierung innerhalb von 14 Tagen vor dem Event 50 %; bei Stornierung innerhalb von 48 Stunden vor dem Event oder bei Nichtstattfinden aus Gründen der Brand ist keine Erstattung vorgesehen. Der Brand bleibt der Nachweis vorbehalten, dass uns ein geringerer Schaden entstanden ist.',
        },
        {
          type: 'p',
          text: 'Erstellt die Brand im Rahmen eines Auftrags ein eigenes Event mit Ticketverkauf, gelten dafür zusätzlich die Bestimmungen für Veranstalter (Teil C).',
        },
      ],
    },
    // ────────────────────────────────────────────── Teil F
    {
      id: 'f1',
      title: 'F.1 Widerrufsbelehrung für Verbraucher (Rücktrittsrecht nach FAGG)',
      blocks: [
        {
          type: 'p',
          text: 'Diese Belehrung gilt für Verbraucher, die mit uns als Unternehmer einen kostenpflichtigen Vertrag im Fernabsatz schließen, **soweit kein gesetzlicher Ausnahmetatbestand greift**. Für Tickets besteht gemäß § 18 Abs. 1 Z 10 FAGG kein Rücktrittsrecht (siehe B.3). Das Rücktrittsrecht betrifft daher insbesondere kostenpflichtige Zusatzleistungen wie Event-Boost oder Spotlight, wenn du diese als Verbraucher buchst.',
        },
        {
          type: 'h3',
          text: 'Rücktrittsrecht',
        },
        {
          type: 'p',
          text: 'Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen von diesem Vertrag zurückzutreten. Die Rücktrittsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses. Um dein Rücktrittsrecht auszuüben, musst du uns (' +
            `${operatorDisplayName()}, ${operatorAddressLine('de')}, E-Mail ${OPERATOR.email}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über deinen Entschluss, von diesem Vertrag zurückzutreten, informieren. Du kannst dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Rücktrittsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Rücktrittsrechts vor Ablauf der Rücktrittsfrist absendest.`,
        },
        {
          type: 'h3',
          text: 'Folgen des Rücktritts',
        },
        {
          type: 'p',
          text: 'Wenn du von diesem Vertrag zurücktrittst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Rücktritt bei uns eingegangen ist. Für die Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet. Hast du verlangt, dass die Dienstleistung während der Rücktrittsfrist beginnen soll, so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem du uns von der Ausübung des Rücktrittsrechts unterrichtest, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.',
        },
        {
          type: 'h3',
          text: 'Vorzeitiges Erlöschen',
        },
        {
          type: 'p',
          text: 'Das Rücktrittsrecht erlischt bei Dienstleistungen, wenn wir die Dienstleistung vollständig erbracht haben und mit der Ausführung erst begonnen haben, nachdem du ausdrücklich zugestimmt und zur Kenntnis genommen hast, dass du dein Rücktrittsrecht bei vollständiger Vertragserfüllung verlierst (§ 18 Abs. 1 Z 1 FAGG). Bei Buchung einer Sichtbarkeitsleistung (Boost, Spotlight) mit sofortigem Start bitten wir um diese Zustimmung im Bestellprozess.',
        },
        {
          type: 'h3',
          text: 'Muster-Widerrufsformular',
        },
        {
          type: 'note',
          text: `An ${operatorDisplayName()}, ${operatorAddressLine('de')}, E-Mail: ${OPERATOR.email} — Hiermit trete ich/treten wir (*) von dem von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*) zurück: … — Bestellt am (*): … — Name des/der Verbraucher(s): … — Anschrift des/der Verbraucher(s): … — Unterschrift (nur bei Mitteilung auf Papier): … — Datum: … — (*) Unzutreffendes streichen.`,
        },
      ],
    },
    // ────────────────────────────────────────────── Teil G
    {
      id: 'g1',
      title: 'G.1 Guthaben und Empfehlungsprogramm',
      blocks: [
        {
          type: 'p',
          text: 'Wer eine neue Person über den persönlichen Einladungscode wirbt, erhält ein Guthaben von 20 Euro; die geworbene Person erhält ebenfalls 20 Euro. Das Guthaben wird gutgeschrieben, sobald die geworbene Person ihr Konto verifiziert und ein Profilbild hochgeladen hat. Pro Person ist nur ein Konto zulässig; wir prüfen Mehrfachregistrierungen (u. a. über E-Mail-Adresse und Gerätemerkmale) und verweigern in diesen Fällen die Gutschrift.',
        },
        {
          type: 'p',
          text: 'Guthaben kann ausschließlich beim Kauf kostenpflichtiger Tickets eingesetzt werden und wird auf die Plattformgebühren des jeweiligen Kaufs angerechnet. Es wird nicht in bar ausbezahlt, ist nicht übertragbar und wird bei Stornierung eines Tickets in gleicher Höhe wieder gutgeschrieben. Guthaben aus dem Empfehlungsprogramm verfällt drei Jahre nach Gutschrift, soweit es bis dahin nicht eingesetzt wurde, sowie mit Löschung des Kontos; der Verfall wird im Guthabenverlauf ausgewiesen. Wir können das Programm jederzeit mit Wirkung für die Zukunft ändern oder beenden; bereits gutgeschriebenes Guthaben bleibt erhalten. Bei Missbrauch (Eigenwerbung, Scheinkonten, automatisierte Registrierungen) können wir Guthaben streichen und Konten sperren.',
        },
      ],
    },
    {
      id: 'g2',
      title: 'G.2 Gewinnspiele',
      blocks: [
        {
          type: 'p',
          text: 'Veranstalter und Share Your Party können kostenlose Gewinnspiele mit Events verbinden. Für jedes Gewinnspiel gelten eigene Teilnahmebedingungen, die auf der Eventseite verlinkt sind; sie nennen Veranstalter, Preis, Zeitraum, Teilnahmevoraussetzungen und Art der Ziehung. Die Teilnahme ist kostenlos und unabhängig vom Kauf einer Ware oder Leistung; teilnahmeberechtigt sind Personen ab 18 Jahren. Eine Barablöse von Gewinnen ist ausgeschlossen; der Rechtsweg ist ausgeschlossen, soweit gesetzlich zulässig.',
        },
        {
          type: 'p',
          text: 'Stellt ein Partner den Gewinn bereit, geben wir Teilnehmerdaten an diesen Partner nur weiter, wenn du bei der Teilnahme gesondert einwilligst. Die Einwilligung ist freiwillig; ohne sie ist die Teilnahme ebenfalls möglich, sofern die Teilnahmebedingungen nichts anderes vorsehen. Einzelheiten stehen in der [Datenschutzerklärung](/privacy).',
        },
      ],
    },
    {
      id: 'g3',
      title: 'G.3 Kostenpflichtige Sichtbarkeitsleistungen (Boost, Spotlight)',
      blocks: [
        {
          type: 'p',
          text: 'Veranstalter können gegen Entgelt die Reichweite ihrer Events erhöhen (Event-Boost mit Budget und Radius, Spotlight-Platzierungen). Preise, Laufzeit und Umfang werden vor der Buchung angezeigt und verstehen sich inklusive Umsatzsteuer. Beworbene Events sowie Events von Partnern, die in Empfehlungen bevorzugt angezeigt werden, werden für Gäste als „Anzeige" gekennzeichnet. Ein bestimmter Erfolg (Reichweite, Verkäufe) wird nicht geschuldet. Die Leistung beginnt mit Zahlungseingang; für Verbraucher gilt Teil F.',
        },
        {
          type: 'p',
          text: 'Boost und Spotlight enden mit Ablauf der gebuchten Laufzeit bzw. mit Verbrauch des gebuchten Budgets und verlängern sich nicht automatisch. Abonnements bieten wir derzeit nicht an; sollten wir sie einführen, werden Laufzeit, Verlängerung und Kündigung vor der Buchung angezeigt, und Verbraucher werden vor einer Verlängerung rechtzeitig per E-Mail informiert.',
        },
      ],
    },
    // ────────────────────────────────────────────── Teil H
    {
      id: 'h1',
      title: 'H.1 Inhalte der Nutzer und eingeräumte Rechte',
      blocks: [
        {
          type: 'p',
          text: 'Nutzer können Beiträge, Kommentare, Stories, Fotos und Videos („Erinnerungen"), Bewertungen und Nachrichten veröffentlichen. Sie bleiben Inhaber der Rechte an ihren Inhalten und räumen uns das nicht ausschließliche, unentgeltliche, weltweite Recht ein, die Inhalte zum Betrieb der Plattform zu speichern, zu vervielfältigen, anzuzeigen, technisch anzupassen (z. B. Vorschaubilder, Übersetzungen) und innerhalb der Plattform anderen Nutzern entsprechend der gewählten Sichtbarkeit zugänglich zu machen. Dieses Recht endet mit der Löschung des Inhalts, ausgenommen technische Sicherungskopien und Inhalte, die andere Nutzer bereits geteilt haben.',
        },
        {
          type: 'p',
          text: 'Wer Fotos oder Videos hochlädt, auf denen andere Personen erkennbar sind, bestätigt, dass diese mit der Veröffentlichung einverstanden sind (§ 78 UrhG, Recht am eigenen Bild). Abgebildete Personen können die Entfernung über die Funktion „Melden" oder per E-Mail verlangen; wir entfernen solche Inhalte nach Prüfung. Markierungen von Personen auf Fotos können von den markierten Personen jederzeit entfernt werden.',
        },
      ],
    },
    {
      id: 'h2',
      title: 'H.2 Verbotene Inhalte und Verhaltensregeln',
      blocks: [
        {
          type: 'p',
          text: 'Untersagt sind insbesondere:',
        },
        {
          type: 'ul',
          items: [
            'rechtswidrige Inhalte, insbesondere Verhetzung, Gewaltdarstellungen, Darstellungen sexuellen Missbrauchs, terroristische Inhalte, Verleumdung, Beleidigung und Drohungen;',
            'Belästigung, Stalking, Diskriminierung wegen Geschlecht, Herkunft, Religion, Behinderung, Alter oder sexueller Orientierung;',
            'Inhalte, die Rechte Dritter verletzen (Urheber-, Marken-, Persönlichkeitsrechte), sowie die Veröffentlichung personenbezogener Daten Dritter ohne deren Zustimmung;',
            'irreführende Eventangaben, Scheinevents, Ticketbetrug, Weiterverkauf von Tickets über dem Nennpreis, Mehrfachkonten und Manipulation von Bewertungen oder des Empfehlungsprogramms;',
            'Werbung für Drogen, Waffen, Glücksspiel ohne Lizenz, pornografische Angebote sowie unverlangte Werbung (Spam) in Nachrichten und Kommentaren;',
            'technische Eingriffe: Scraping, automatisierte Zugriffe, Umgehung von Sicherheitsmaßnahmen, Einschleusen von Schadcode, Überlastung der Dienste;',
            'die Nutzung der Standortfreigabe oder der Sicherheitsfunktionen zur Überwachung anderer Personen ohne deren Wissen.',
          ],
        },
        {
          type: 'p',
          text: 'Events mit Alkoholausschank oder Altersbeschränkung sind entsprechend zu kennzeichnen. Veranstalter sind für die Einhaltung des Jugendschutzes verantwortlich.',
        },
      ],
    },
    {
      id: 'h3',
      title: 'H.3 Moderation, Meldungen, Sperren (Art. 14 bis 17 und 20 DSA)',
      blocks: [
        {
          type: 'p',
          text: 'Jeder Inhalt und jedes Konto kann über die Funktion „Melden" oder per E-Mail an [' +
            `${OPERATOR.email}](mailto:${OPERATOR.email}) gemeldet werden. Wir prüfen Meldungen zeitnah, sorgfältig und ohne Willkür. Dabei setzen wir keine automatisierten Entscheidungssysteme ein; über Maßnahmen entscheiden Menschen. Meldende und betroffene Nutzer werden über das Ergebnis informiert.`,
        },
        {
          type: 'p',
          text: 'Bei Verstößen gegen diese AGB oder gegen Gesetze können wir je nach Schwere Inhalte entfernen oder ihre Sichtbarkeit einschränken, Funktionen (z. B. Kommentare, Eventerstellung, Auszahlungen) vorübergehend sperren, Konten vorübergehend oder dauerhaft sperren und Guthaben einbehalten. Bei einer Maßnahme teilen wir dir die Gründe und die Rechtsgrundlage per E-Mail mit (Art. 17 DSA), es sei denn, dies ist gesetzlich untersagt oder gefährdet Ermittlungen. Du kannst innerhalb von sechs Monaten kostenlos Beschwerde gegen die Maßnahme einlegen; wir überprüfen sie dann erneut. Offensichtlich unbegründete oder missbräuchliche Meldungen können zur Sperre der meldenden Person führen.',
        },
        {
          type: 'p',
          text: 'Bei Verdacht auf Straftaten, die eine Gefahr für Leben oder Sicherheit von Personen darstellen, informieren wir die zuständigen Behörden (Art. 18 DSA).',
        },
      ],
    },
    {
      id: 'h4',
      title: 'H.4 Chat, Standortfreigabe und Sicherheitsfunktionen',
      blocks: [
        {
          type: 'p',
          text: 'Der Chat dient der Kommunikation zwischen Nutzern. Nachrichten sind nicht öffentlich; wir lesen sie nicht mit, außer zur Prüfung einer Meldung oder soweit gesetzlich vorgeschrieben. Die Freigabe des eigenen Standorts im Chat und die Funktion „Sicherheitsbegleitung" sind freiwillig, können jederzeit beendet werden und ersetzen keine Notrufdienste. In Notfällen wende dich an die Notrufnummer 112.',
        },
      ],
    },
    {
      id: 'h5',
      title: 'H.5 Verfügbarkeit, Gewährleistung und Haftung',
      blocks: [
        {
          type: 'p',
          text: 'Wir bemühen uns um eine hohe Verfügbarkeit der Plattform, schulden aber keine ununterbrochene Erreichbarkeit. Wartungsarbeiten kündigen wir nach Möglichkeit an. Für die kostenlosen Funktionen der Plattform gelten die gesetzlichen Gewährleistungsregeln nur, soweit sie auf unentgeltliche Leistungen anwendbar sind; für kostenpflichtige Leistungen gelten die gesetzlichen Gewährleistungsbestimmungen (bei Verbrauchern insbesondere das Verbrauchergewährleistungsgesetz).',
        },
        {
          type: 'p',
          text: 'Wir haften unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, für Vorsatz und grobe Fahrlässigkeit sowie nach dem Produkthaftungsgesetz. Bei leichter Fahrlässigkeit haften wir gegenüber Unternehmern nicht; gegenüber Verbrauchern haften wir bei leichter Fahrlässigkeit nur für die Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren, vertragstypischen Schaden. Ausgeschlossen ist, soweit gesetzlich zulässig, die Haftung für entgangenen Gewinn und mittelbare Schäden gegenüber Unternehmern.',
        },
        {
          type: 'p',
          text: 'Für die Inhalte, Durchführung und Sicherheit der von Nutzern veranstalteten Events sowie für die Richtigkeit von Nutzerinhalten haften wir nicht; verantwortlich ist der jeweilige Veranstalter bzw. Nutzer. Wir haften nicht für Leistungen des Zahlungsdienstleisters, soweit wir diese nicht zu vertreten haben.',
        },
        {
          type: 'p',
          text: 'Nutzer stellen uns von Ansprüchen Dritter frei, die auf einer schuldhaften Verletzung dieser AGB oder geltenden Rechts durch den Nutzer beruhen, einschließlich angemessener Kosten der Rechtsverteidigung. Gegenüber Verbrauchern gilt dies nur bei Vorsatz oder grober Fahrlässigkeit.',
        },
      ],
    },
    {
      id: 'h6',
      title: 'H.6 Änderungen der AGB und der Plattform',
      blocks: [
        {
          type: 'p',
          text: 'Wir können diese AGB ändern, wenn dafür ein sachlicher Grund besteht (z. B. Gesetzesänderungen, neue Funktionen, Änderungen der Gebührenstruktur, Anforderungen von Zahlungsdienstleistern oder App-Stores). Änderungen kündigen wir mindestens 30 Tage vor Inkrafttreten per E-Mail oder in der App an und heben die geänderten Stellen hervor. Widersprichst du nicht bis zum Inkrafttreten, gelten die geänderten AGB als angenommen; darauf weisen wir in der Ankündigung ausdrücklich hin. Du kannst den Nutzungsvertrag bis zum Inkrafttreten jederzeit kostenlos beenden. Änderungen, die Hauptleistungen oder das Entgelt zu deinem Nachteil betreffen, bedürfen deiner ausdrücklichen Zustimmung. Für Unternehmer gilt eine Ankündigungsfrist von 15 Tagen (Art. 3 Verordnung (EU) 2019/1150).',
        },
        {
          type: 'p',
          text: 'Wir entwickeln die Plattform laufend weiter und können Funktionen ändern, ergänzen oder einstellen, soweit dies für dich zumutbar ist. Bereits bezahlte Leistungen bleiben davon unberührt oder werden anteilig erstattet.',
        },
      ],
    },
    {
      id: 'h7',
      title: 'H.7 Ranking und Sichtbarkeit (Art. 5 Verordnung (EU) 2019/1150, Art. 27 DSA)',
      blocks: [
        {
          type: 'p',
          text: 'Die Reihenfolge von Events in Suchergebnissen, Empfehlungen und Listen richtet sich hauptsächlich nach: Entfernung zum gewählten Standort, Datum und Uhrzeit des Events, Übereinstimmung mit den angegebenen Interessen und Suchbegriffen, Aktivität rund um das Event (Favoriten, Ticketverkäufe, Bewertungen) sowie der Vollständigkeit der Eventangaben. Kostenpflichtige Sichtbarkeitsleistungen (G.3) können Events zusätzlich hervorheben; solche Platzierungen werden gekennzeichnet. Nutzer können die Sortierung in der Suche selbst ändern (z. B. nach Datum oder Entfernung).',
        },
      ],
    },
    {
      id: 'h8',
      title: 'H.8 Beschwerden, Streitbeilegung, anwendbares Recht, Gerichtsstand',
      blocks: [
        {
          type: 'p',
          text: `Beschwerden richte bitte an [${OPERATOR.email}](mailto:${OPERATOR.email}). Wir antworten in der Regel innerhalb von 14 Tagen. Unternehmer (Veranstalter, Creator, Brands) können über dieselbe Adresse das interne Beschwerdemanagement nach Art. 11 Verordnung (EU) 2019/1150 nutzen. Verbraucher können sich an die ${OPERATOR.consumerArbitration.name} ([${OPERATOR.consumerArbitration.website.replace('https://', '')}](${OPERATOR.consumerArbitration.website})) wenden; zur Teilnahme an einem Schlichtungsverfahren sind wir nicht verpflichtet.`,
        },
        {
          type: 'p',
          text: 'Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts und der Verweisungsnormen des internationalen Privatrechts. Für Verbraucher mit gewöhnlichem Aufenthalt in einem anderen Staat der EU bleiben die zwingenden Verbraucherschutzbestimmungen dieses Staates anwendbar, soweit sie günstiger sind.',
        },
        {
          type: 'p',
          text: 'Für Klagen gegen Verbraucher mit Wohnsitz, gewöhnlichem Aufenthalt oder Beschäftigungsort in Österreich ist ausschließlich das Gericht zuständig, in dessen Sprengel dieser Ort liegt (§ 14 KSchG). Für Verträge mit Unternehmern ist das sachlich zuständige Gericht in Wien ausschließlich zuständig.',
        },
      ],
    },
    {
      id: 'h9',
      title: 'H.9 Schlussbestimmungen',
      blocks: [
        {
          type: 'p',
          text: 'Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Gegenüber Verbrauchern tritt an die Stelle der unwirksamen Bestimmung die gesetzliche Regelung. Nebenabreden bestehen nicht. Wir können Rechte und Pflichten aus diesem Vertrag auf einen Rechtsnachfolger übertragen, der den Betrieb der Plattform fortführt; wir informieren dich darüber, und du kannst den Nutzungsvertrag in diesem Fall jederzeit beenden.',
        },
        {
          type: 'p',
          text: 'Die Datenschutzerklärung ist nicht Bestandteil dieser AGB; sie informiert über die Verarbeitung personenbezogener Daten und ist unter [shareyourparty.de/privacy](/privacy) abrufbar.',
        },
      ],
    },
  ],
  footer: 'Stand: 5. November 2026 – Version 2026-11',
}
