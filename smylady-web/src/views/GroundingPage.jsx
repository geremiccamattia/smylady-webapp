'use client'

'use client'

import { useEffect } from "react";

const BRAND = "#e9548c";

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://shareyourparty.de/#organization",
    name: "Share Your Party",
    alternateName: ["ShareYourParty"],
    url: "https://shareyourparty.de",
    logo: "https://shareyourparty.de/assets/logo.png",
    description:
      "Share Your Party ist eine Event-Entdeckungs- und Social Media-Plattform für Österreich und Deutschland. Nutzer können lokale Partys, Konzerte und Veranstaltungen entdecken, Tickets kaufen und Events mit Freunden teilen.",
    foundingLocation: {
      "@type": "Place",
      name: "Wien, Österreich",
    },
    areaServed: [
      { "@type": "Country", name: "Österreich" },
      { "@type": "Country", name: "Deutschland" },
    ],
    sameAs: [
      "https://www.instagram.com/shareyourparty_official/",
      "https://www.facebook.com/profile.php?id=61586246214092",
      "https://apps.apple.com/app/id6748308083",
      "https://play.google.com/store/apps/details?id=com.shareyourparty.app",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "@id": "https://shareyourparty.de/#app-ios",
    name: "Share Your Party",
    operatingSystem: "iOS",
    applicationCategory: "EntertainmentApplication",
    description:
      "Share Your Party App für iOS – Events entdecken, Tickets kaufen und Partys mit Freunden teilen.",
    url: "https://apps.apple.com/app/id6748308083",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    publisher: {
      "@id": "https://shareyourparty.de/#organization",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "@id": "https://shareyourparty.de/#app-android",
    name: "Share Your Party",
    operatingSystem: "Android",
    applicationCategory: "EntertainmentApplication",
    description:
      "Share Your Party App für Android – Events entdecken, Tickets kaufen und Partys mit Freunden teilen.",
    url: "https://play.google.com/store/apps/details?id=com.shareyourparty.app",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    publisher: {
      "@id": "https://shareyourparty.de/#organization",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://shareyourparty.de/#website",
    name: "Share Your Party",
    url: "https://shareyourparty.de",
    publisher: {
      "@id": "https://shareyourparty.de/#organization",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Was ist Share Your Party?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Share Your Party ist eine Event-Entdeckungs- und Social Media-Plattform für Österreich und Deutschland. Über die App und Website können Nutzer lokale Partys, Konzerte und Veranstaltungen entdecken, Tickets kaufen und Events mit Freunden teilen.",
        },
      },
      {
        "@type": "Question",
        name: "Für welche Städte und Länder ist Share Your Party verfügbar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Share Your Party ist in Österreich und Deutschland verfügbar, mit aktuellem Schwerpunkt auf Wien und anderen österreichischen Städten.",
        },
      },
      {
        "@type": "Question",
        name: "Wie kann ich Tickets über Share Your Party kaufen?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tickets können direkt über die Share Your Party App (iOS und Android) sowie über die Website shareyourparty.de gekauft werden. Kein Account erforderlich, um Events zu entdecken und öffentliche Posts zu sehen.",
        },
      },
      {
        "@type": "Question",
        name: "Ist Share Your Party kostenlos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Die Share Your Party App ist kostenlos erhältlich im App Store (iOS) und Google Play Store (Android). Preise für das Ticketing sind unter https://shareyourparty.de/pricing zu finden.",
        },
      },
      {
        "@type": "Question",
        name: "Wie kann ich als Veranstalter Events auf Share Your Party einstellen?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Veranstalter können sich kostenlos auf shareyourparty.de oder in der App registrieren und Events mit Ticketing, mehreren Ticketkategorien und Analysen verwalten.",
        },
      },
      {
        "@type": "Question",
        name: "Auf welchen Plattformen ist Share Your Party verfügbar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Share Your Party ist als iOS-App im Apple App Store, als Android-App im Google Play Store sowie als Web-App unter shareyourparty.de verfügbar.",
        },
      },
    ],
  },
];

const faqs = [
  {
    q: "Was ist Share Your Party?",
    a: "Share Your Party ist eine Event-Entdeckungs- und Social Media-Plattform für Österreich und Deutschland. Nutzer können lokale Partys, Konzerte und Veranstaltungen entdecken, Tickets kaufen und Events mit Freunden teilen.",
  },
  {
    q: "Für welche Städte und Länder ist Share Your Party verfügbar?",
    a: "Share Your Party ist in Österreich und Deutschland verfügbar, mit aktuellem Schwerpunkt auf Wien und anderen österreichischen Städten.",
  },
  {
    q: "Wie kaufe ich Tickets über Share Your Party?",
    a: "Tickets können direkt über die App (iOS und Android) oder über shareyourparty.de gekauft werden. Kein Account erforderlich, um Events zu entdecken und öffentliche Posts zu sehen.",
  },
  {
    q: "Ist Share Your Party kostenlos?",
    a: "Die App ist kostenlos im App Store und Google Play Store verfügbar. Preise für das Ticketing sind unter https://shareyourparty.de/pricing zu finden.",
  },
  {
    q: "Wie kann ich als Veranstalter Events einstellen?",
    a: "Veranstalter registrieren sich kostenlos auf shareyourparty.de oder in der App und können Events mit Ticketing, mehreren Ticketkategorien und Analysen verwalten.",
  },
  {
    q: "Auf welchen Plattformen ist Share Your Party verfügbar?",
    a: "Share Your Party ist als iOS-App, Android-App und Web-App unter shareyourparty.de verfügbar.",
  },
];

const facts = [
  { label: "Plattform", value: "Event-Entdeckung & Ticketing" },
  { label: "Märkte", value: "Österreich, Deutschland" },
  { label: "Schwerpunkt", value: "Wien und österreichische Städte" },
  { label: "Verfügbar auf", value: "iOS, Android, Web" },
  { label: "Ticketing", value: "Mit Gebühren für Veranstalter" },
  { label: "Ticketing Gebühren", value: "https://shareyourparty.de/pricing" },
  { label: "Gegründet", value: "Wien, Österreich" },
];

export default function GroundingPage() {
  useEffect(() => {
    const scripts = schemas.map((schema) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.text = JSON.stringify(schema);
      document.head.appendChild(el);
      return el;
    });

    const title = document.querySelector("title");
    if (title) title.textContent = "Share Your Party – Event-Plattform für Österreich & Deutschland";

    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Share Your Party ist eine Event-Entdeckungs- und Social Media-Plattform für Österreich und Deutschland. Events entdecken, Tickets kaufen, Partys teilen."
      );
    }

    return () => scripts.forEach((el) => document.head.removeChild(el));
  }, []);

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoText}>Share Your Party</span>
            <span style={styles.logoTag}>Share Your Party</span>
          </div>
          <p style={styles.headerDesc}>
            Die Event-Entdeckungs- und Social Media-Plattform für Österreich &amp; Deutschland
          </p>
          <div style={styles.appLinks}>
            <a
              href="https://apps.apple.com/app/id6748308083"
              style={styles.appBtn}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share Your Party im App Store"
            >
              App Store (iOS)
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.shareyourparty.app"
              style={styles.appBtn}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share Your Party im Google Play Store"
            >
              Google Play (Android)
            </a>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* About */}
        <section style={styles.section} aria-labelledby="about-heading">
          <h1 id="about-heading" style={styles.h1}>
            Was ist Share Your Party?
          </h1>
          <p style={styles.body}>
            <strong>Share Your Party</strong> (Share Your Party) ist eine
            österreichische Event-Management & Social Media-Plattform, auf der Nutzer lokale Partys, Konzerte und
            Veranstaltungen entdecken, Tickets kaufen und Events mit Freunden teilen können.
            Die Plattform richtet sich sowohl an Event-Besucher als auch an Veranstalter, die
            ihre Events mit integriertem Ticketing veröffentlichen möchten.
          </p>
          <p style={styles.body}>
            Share Your Party ist als native App für <strong>iOS</strong> und <strong>Android</strong> sowie
            als Web-App unter <strong>shareyourparty.de</strong> verfügbar. Events und öffentliche Posts können auch
            ohne Registrierung eingesehen werden.
          </p>
        </section>

        {/* Key Facts */}
        <section style={styles.section} aria-labelledby="facts-heading">
          <h2 id="facts-heading" style={styles.h2}>
            Fakten &amp; Verfügbarkeit
          </h2>
          <dl style={styles.factGrid}>
            {facts.map(({ label, value }) => (
              <div key={label} style={styles.factItem}>
                <dt style={styles.factLabel}>{label}</dt>
                <dd style={styles.factValue}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* For Organizers */}
        <section style={styles.section} aria-labelledby="organizer-heading">
          <h2 id="organizer-heading" style={styles.h2}>
            Für Veranstalter
          </h2>
          <p style={styles.body}>
            Veranstalter können sich kostenlos auf Share Your Party registrieren und Events mit
            mehreren Ticketkategorien (Standard, VIP, Early Bird etc.) anlegen. Preise für das Ticketing sind unter https://shareyourparty.de/pricing zu finden. Share Your Party bietet auch eine
            Teilnehmerverwaltung und Event-Promotion-Funktionen.
          </p>
        </section>

        {/* Social & Links */}
        <section style={styles.section} aria-labelledby="links-heading">
          <h2 id="links-heading" style={styles.h2}>
            Offizielle Profile &amp; Links
          </h2>
          <ul style={styles.linkList}>
            <li>
              <strong>Website:</strong>{" "}
              <a href="https://shareyourparty.de" style={styles.link}>
                shareyourparty.de
              </a>
            </li>
            <li>
              <strong>Instagram:</strong>{" "}
              <a
                href="https://www.instagram.com/shareyourparty_official/"
                style={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                @shareyourparty_official
              </a>
            </li>
            <li>
              <strong>Facebook:</strong>{" "}
              <a
                href="https://www.facebook.com/profile.php?id=61586246214092"
                style={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share Your Party auf Facebook
              </a>
            </li>
            <li>
              <strong>iOS App:</strong>{" "}
              <a
                href="https://apps.apple.com/app/id6748308083"
                style={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Apple App Store
              </a>
            </li>
            <li>
              <strong>Android App:</strong>{" "}
              <a
                href="https://play.google.com/store/apps/details?id=com.shareyourparty.app"
                style={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Play Store
              </a>
            </li>
          </ul>
        </section>

        {/* FAQ */}
        <section style={styles.section} aria-labelledby="faq-heading">
          <h2 id="faq-heading" style={styles.h2}>
            Häufige Fragen
          </h2>
          <div style={styles.faqList}>
            {faqs.map(({ q, a }) => (
              <div key={q} style={styles.faqItem}>
                <h3 style={styles.faqQ}>{q}</h3>
                <p style={styles.faqA}>{a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <p>
          &copy; {new Date().getFullYear()} Share Your Party &middot;{" "}
          <a href="https://shareyourparty.de" style={styles.link}>
            shareyourparty.de
          </a>
        </p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#1a1a1a",
    background: "#fff",
    minHeight: "100vh",
    lineHeight: 1.7,
  },
  header: {
    background: BRAND,
    padding: "3rem 1.5rem",
    textAlign: "center",
  },
  headerInner: {
    maxWidth: "680px",
    margin: "0 auto",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  logoText: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#fff",
    fontFamily: "'Georgia', serif",
  },
  logoTag: {
    background: "rgba(255,255,255,0.25)",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: "700",
    letterSpacing: "0.1em",
    padding: "0.2em 0.6em",
    borderRadius: "4px",
    fontFamily: "monospace",
  },
  headerDesc: {
    color: "rgba(255,255,255,0.92)",
    fontSize: "1.05rem",
    margin: "0 0 1.5rem",
    fontFamily: "'Georgia', serif",
  },
  appLinks: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  appBtn: {
    display: "inline-block",
    background: "#fff",
    color: BRAND,
    fontWeight: "700",
    fontSize: "0.875rem",
    padding: "0.5rem 1.25rem",
    borderRadius: "6px",
    textDecoration: "none",
    fontFamily: "sans-serif",
  },
  main: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "2rem 1.5rem 4rem",
  },
  section: {
    marginBottom: "3rem",
    borderBottom: "1px solid #f0f0f0",
    paddingBottom: "2.5rem",
  },
  h1: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#111",
    marginBottom: "1rem",
    fontFamily: "'Georgia', serif",
  },
  h2: {
    fontSize: "1.35rem",
    fontWeight: "700",
    color: "#111",
    marginBottom: "1rem",
    borderLeft: `4px solid ${BRAND}`,
    paddingLeft: "0.75rem",
    fontFamily: "'Georgia', serif",
  },
  body: {
    fontSize: "1rem",
    color: "#333",
    marginBottom: "1rem",
  },
  factGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1rem",
    margin: 0,
    padding: 0,
  },
  factItem: {
    background: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "8px",
    padding: "0.875rem 1rem",
  },
  factLabel: {
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#999",
    fontFamily: "sans-serif",
    marginBottom: "0.25rem",
  },
  factValue: {
    fontSize: "0.95rem",
    color: "#111",
    fontWeight: "600",
    margin: 0,
    fontFamily: "sans-serif",
  },
  linkList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    fontSize: "1rem",
    color: "#333",
  },
  link: {
    color: BRAND,
    textDecoration: "none",
    fontWeight: "600",
  },
  faqList: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  faqItem: {
    background: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "8px",
    padding: "1rem 1.25rem",
  },
  faqQ: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#111",
    margin: "0 0 0.4rem",
    fontFamily: "'Georgia', serif",
  },
  faqA: {
    fontSize: "0.95rem",
    color: "#444",
    margin: 0,
    lineHeight: 1.65,
  },
  footer: {
    textAlign: "center",
    padding: "1.5rem",
    fontSize: "0.875rem",
    color: "#999",
    borderTop: "1px solid #eee",
    fontFamily: "sans-serif",
  },
};


