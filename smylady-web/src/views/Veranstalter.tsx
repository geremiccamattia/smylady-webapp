"use client"

import { useEffect } from "react";
import { useTranslation } from 'react-i18next'

const PINK = "#e9548c";
const PINK_LIGHT = "#fdf0f5";
const PINK_MID = "#fce0ec";
const DARK = "#1a1020";
const MUTED = "#7a6a80";
const BORDER = "#ede8f2";
const CREATE_URL = "https://shareyourparty.de/create-event";
const IOS_URL = "https://apps.apple.com/app/id6748308083";
const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.shareyourparty.app";

const featuresDE = [
  { icon: "📣", title: "Event bewerben", desc: "Mit dem Spotlight-Feature hebst du dein Event im Entdecken-Feed hervor und erreichst gezielt mehr Nutzer – direkt auf der Plattform, ohne externe Werbekanäle.", tag: "Neu", highlight: true },
  { icon: "🔥", title: "Vibes – deine Community postet mit", desc: "Nutzer posten Stimmungsbilder und Inhalte direkt auf Share Your Party. Deine Events leben weiter – auch wenn die Party vorbei ist.", tag: "Einzigartig" },
  { icon: "📸", title: "Event Memories & Highlights", desc: "Teilnehmer hinterlegen Fotos zu deinem Event. Besondere Momente können als Highlights markiert werden – dein Event schreibt seine eigene Geschichte.", tag: "Community" },
  { icon: "🎟️", title: "Abendkassa", desc: "Verkaufe Tickets direkt an der Tür – digital, ohne Zettelwirtschaft. Abendkassa und Vorverkauf laufen parallel auf derselben Plattform.", tag: "Praktisch" },
  { icon: "✓", title: "Kostenlose Events willkommen", desc: "Du entscheidest ob dein Event kostenpflichtig oder kostenlos ist. Beides funktioniert – beides wird beworben.", tag: "Flexibel" },
];

const featuresEN = [
  { icon: "📣", title: "Promote your event", desc: "With the Spotlight feature, you can highlight your event in the Discover feed and reach more users directly on the platform – no external advertising needed.", tag: "New", highlight: true },
  { icon: "🔥", title: "Vibes – your community posts along", desc: "Users post atmosphere photos and content directly on Share Your Party. Your events live on – even after the party is over.", tag: "Unique" },
  { icon: "📸", title: "Event Memories & Highlights", desc: "Attendees upload photos to your event. Special moments can be marked as highlights – your event writes its own story.", tag: "Community" },
  { icon: "🎟️", title: "Door Sales", desc: "Sell tickets right at the door – digitally, without paperwork. Door sales and pre-sales run in parallel on the same platform.", tag: "Practical" },
  { icon: "✓", title: "Free events welcome", desc: "You decide whether your event is paid or free. Both work – both get promoted.", tag: "Flexible" },
];

const stepsDE = [
  { n: "01", title: "Registrieren", desc: "Kostenlos auf shareyourparty.de registrieren. In wenigen Minuten startklar." },
  { n: "02", title: "Event erstellen", desc: "Name, Beschreibung, Datum, Ort, Tickets – fertig. Einfacher als jede andere Plattform." },
  { n: "03", title: "Community erreichen", desc: "Dein Event ist sofort sichtbar für alle Share Your Party Nutzer in deiner Stadt." },
];

const stepsEN = [
  { n: "01", title: "Sign up", desc: "Register for free at shareyourparty.de. Ready to go in minutes." },
  { n: "02", title: "Create your event", desc: "Name, description, date, location, tickets – done. Easier than any other platform." },
  { n: "03", title: "Reach the community", desc: "Your event is instantly visible to all Share Your Party users in your city." },
];

export default function VeranstalterPage() {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const features = isEnglish ? featuresEN : featuresDE
  const steps = isEnglish ? stepsEN : stepsDE

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap";
    document.head.appendChild(link);
    const title = document.querySelector("title");
    if (title) title.textContent = isEnglish
      ? "Create Events & Sell Tickets | Share Your Party"
      : "Events erstellen & Tickets verkaufen | Share Your Party";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", isEnglish
      ? "Share Your Party is more than ticketing. Create events, promote them directly and build your own community around your events."
      : "Share Your Party ist mehr als Ticketing. Erstelle Events, bewirb sie gezielt und baue eine eigene Community rund um deine Veranstaltungen auf.");
    return () => { document.head.removeChild(link); };
  }, [isEnglish]);

  return (
    <div style={{ background: "#fff", color: DARK, fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      {/* HERO */}
      <section style={{ padding: "5rem 2rem 4rem", background: `linear-gradient(180deg, ${PINK_LIGHT} 0%, #fff 100%)` }}>
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          display: "flex", alignItems: "center",
          gap: "4rem", flexWrap: "wrap",
        }}>
          {/* LEFT: Text */}
          <div style={{ flex: "1 1 400px", textAlign: "left" }}>
            <h1 style={{
              fontFamily: "'Unbounded', sans-serif",
              fontSize: "clamp(1.75rem, 4.5vw, 3rem)",
              fontWeight: 900, lineHeight: 1.15,
              margin: "0 0 1.25rem", color: DARK,
            }}>
              {isEnglish ? "More than a ticketing platform." : "Mehr als eine Ticketing-Plattform."}
            </h1>
            <p style={{ fontSize: "1.1rem", color: MUTED, maxWidth: "520px", margin: "0 0 1.5rem", lineHeight: 1.75 }}>
              {isEnglish
                ? "Share Your Party connects events with community. Create events, promote them strategically and watch your guests create their own content."
                : "Share Your Party verbindet Events mit Community. Erstelle Events, bewirb sie gezielt und beobachte wie deine Gäste selbst Content erstellen."}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 3rem", display: "inline-block" }}>
              {[
                isEnglish ? { icon: "📈", text: "More reach for your events" } : { icon: "📈", text: "Mehr Reichweite für deine Events" },
                isEnglish ? { icon: "🤝", text: "Stronger community & viral growth" } : { icon: "🤝", text: "Stärkere Community & virales Wachstum" },
                isEnglish ? { icon: "🎟️", text: "Easy ticketing & event management" } : { icon: "🎟️", text: "Einfaches Ticketing & Eventmanagement" },
              ].map((item) => (
                <li key={item.text} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem", fontSize: "0.95rem", color: DARK }}>
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <div>
            <a href={CREATE_URL} style={{
              display: "inline-block", background: PINK, color: "#fff",
              textDecoration: "none", padding: "0.9rem 2.25rem",
              borderRadius: "100px", fontSize: "1rem", fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif", marginBottom: "1.25rem",
            }}>
              {isEnglish ? "Create event now →" : "Jetzt Event erstellen →"}
            </a></div>
            <p style={{ fontSize: "0.8rem", color: MUTED, margin: 0 }}>
              {isEnglish ? "Free · No credit card required" : "Kostenlos · Kein Kreditkarte erforderlich"}
            </p>
          </div>

          {/* RIGHT: App Screenshot */}
          <div style={{ flex: "0 1 280px", display: "flex", justifyContent: "center" }}>
            <img
              src={isEnglish ? "/app-screenshot-en.jpg" : "/app-screenshot-de.jpg"}
              alt={isEnglish ? "Share Your Party App" : "Share Your Party App"}
              style={{
                width: "100%", maxWidth: "260px",
                borderRadius: "24px",
                boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
              }}
            />
          </div>
        </div>
      </section>

      {/* DIFFERENTIATOR BANNER */}
      <div style={{ background: DARK, color: "#fff", padding: "1.5rem 2rem", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", letterSpacing: "0.01em" }}>
          {isEnglish
            ? <><>Other platforms sell tickets and goodbye.{" "}</><strong style={{ color: "#fff", fontWeight: 500 }}>We build communities around your events.</strong></>
            : <><>Andere verkaufen Tickets und tschüss.{" "}</><strong style={{ color: "#fff", fontWeight: 500 }}>Wir bauen Communities rund um deine Events.</strong></>}
        </p>
      </div>

      {/* FEATURES */}
      <section style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <SectionLabel>Features</SectionLabel>
          <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 700, margin: "0.75rem 0 0", lineHeight: 1.25 }}>
            {isEnglish ? "What Share Your Party offers" : "Was Share Your Party bietet"}
          </h2>
          <p style={{ fontSize: "1.1rem", color: MUTED, margin: "1.5rem 0 1.5rem" }}>
              {isEnglish
                ? "Share Your Party connects events with community. Create events, promote them strategically and watch your guests create their own content."
                : "Share Your Party verbindet Events mit Community. Erstelle Events, bewirb sie gezielt und beobachte wie deine Gäste selbst Content erstellen."}
            </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${BORDER}`, maxWidth: "1060px", margin: "0 auto" }} />

      {/* HOW IT WORKS */}
      <section style={{ padding: "5rem 2rem", maxWidth: "700px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <SectionLabel>{isEnglish ? "How it works" : "So einfach geht's"}</SectionLabel>
          <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 700, margin: "0.75rem 0 0", lineHeight: 1.25 }}>
            {isEnglish ? "Live in 3 steps" : "In 3 Schritten live"}
          </h2>
        </div>
        {steps.map((s, i) => <StepRow key={s.n} {...s} last={i === steps.length - 1} />)}
      </section>

      <div style={{ borderTop: `1px solid ${BORDER}`, maxWidth: "1060px", margin: "0 auto" }} />

      {/* APP DOWNLOADS */}
      <section style={{ padding: "3.5rem 2rem", textAlign: "center", background: PINK_LIGHT }}>
        <p style={{ color: MUTED, fontSize: "0.875rem", margin: "0 0 1rem" }}>
          {isEnglish ? "Manage events on the go" : "Events auch unterwegs verwalten"}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <AppLink href={IOS_URL} label="App Store (iOS)" />
          <AppLink href={ANDROID_URL} label="Google Play (Android)" />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "5rem 2rem 6rem", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 700, margin: "0 0 1rem", lineHeight: 1.25 }}>
            {isEnglish ? "Ready to launch your next event?" : "Bereit dein nächstes Event zu starten?"}
          </h2>
          <p style={{ color: MUTED, marginBottom: "2rem", lineHeight: 1.75 }}>
            {isEnglish
              ? "Sign up for free, create your event and reach the Share Your Party community directly."
              : "Kostenlos registrieren, Event anlegen und direkt die Share Your Party Community erreichen."}
          </p>
          <a href={CREATE_URL} style={{ display: "inline-block", background: PINK, color: "#fff", textDecoration: "none", padding: "0.9rem 2.5rem", borderRadius: "100px", fontSize: "1rem", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
            {isEnglish ? "Create event →" : "Event erstellen →"}
          </a>
          <p style={{ marginTop: "1.25rem", fontSize: "0.8rem", color: MUTED }}>
            <a href="https://shareyourparty.de" style={{ color: MUTED }}>shareyourparty.de</a>
          </p>
        </div>
      </section>

    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: PINK, fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function AppLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#fff", color: DARK, border: `1px solid ${BORDER}`, textDecoration: "none", padding: "0.55rem 1.25rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
      {label}
    </a>
  );
}

function FeatureCard({ icon, title, desc, tag, highlight = false }: { icon: string; title: string; desc: string; tag: string; highlight?: boolean }) {
  return (
    <div style={{ background: highlight ? PINK_LIGHT : "#fafafa", border: `1px solid ${highlight ? PINK_MID : BORDER}`, borderRadius: "16px", padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{icon}</span>
        <span style={{ background: highlight ? PINK_MID : "#ede8f2", color: highlight ? PINK : MUTED, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.3em 0.75em", borderRadius: "100px", whiteSpace: "nowrap" }}>
          {tag}
        </span>
      </div>
      <h3 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "0.9rem", fontWeight: 700, margin: 0, color: DARK, lineHeight: 1.3 }}>{title}</h3>
      <p style={{ color: MUTED, fontSize: "0.875rem", margin: 0, lineHeight: 1.75 }}>{desc}</p>
    </div>
  );
}

function StepRow({ n, title, desc, last }: { n: string; title: string; desc: string; last: boolean }) {
  return (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: PINK_LIGHT, border: `1px solid ${PINK_MID}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Unbounded', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: PINK }}>
          {n}
        </div>
        {!last && <div style={{ width: "1px", height: "2.5rem", background: BORDER, margin: "0.4rem 0" }} />}
      </div>
      <div style={{ paddingTop: "0.6rem", paddingBottom: last ? 0 : "0.75rem" }}>
        <h3 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.35rem", color: DARK }}>{title}</h3>
        <p style={{ color: MUTED, fontSize: "0.9rem", margin: 0, lineHeight: 1.7 }}>{desc}</p>
      </div>
    </div>
  );
}
