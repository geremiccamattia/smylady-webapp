// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://120a1272fa2b94f4c645ebbd453eaffe@o4511955015041024.ingest.de.sentry.io/4511955022512208",

  // Nur in Produktion an Sentry senden — lokale Dev-Fehler und Preview-Builds
  // sollen das Dashboard nicht zumüllen.
  enabled: process.env.NODE_ENV === "production",

  // Keine automatisch mitgesendeten personenbezogenen Daten (IP, Cookies, ...).
  sendDefaultPii: false,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  // Verwirft Events, deren Fehler-Frame (der Stackframe am tatsächlichen
  // Fehlerort) aus einer dieser URLs stammt — ausgewertet von Sentrys
  // eingebauter eventFiltersIntegration (Teil der Default-Integrationen,
  // siehe node_modules/@sentry/core/.../integrations/eventFilters.js).
  // Das ist der zuverlässigste Filter für Fehler, die nicht aus unserem
  // eigenen Code stammen: er trifft die QUELLE, nicht den Wortlaut der
  // Meldung, und greift daher auch bei Varianten mit anderem Wortlaut.
  denyUrls: [
    // In-App-Browser (Instagram, Facebook, ...): eigener nativer WebView-Code,
    // z.B. "app://navigation_performance_logger_android". Wir schalten
    // bezahlte Anzeigen, die dort landen — ohne diesen Filter würde das
    // unser Sentry-Kontingent aufbrauchen. NICHT als überflüssig entfernen.
    "app://",
    // Fehler aus Browser-Erweiterungen der Nutzer — nicht unser Code.
    "chrome-extension://",
    "moz-extension://",
    "safari-extension://",
    "safari-web-extension://",
  ],

  // Zusätzliches Wortlaut-Netz für dieselbe Familie von In-App-Browser-
  // Fehlern: greift auch, wenn der Stacktrace fehlt oder aus anderen Gründen
  // nicht auf app:// zeigt (z.B. bei degradierten WebView-Fehlerberichten),
  // die Meldung aber eindeutig zuordenbar ist. Siehe denyUrls oben für die
  // Begründung, warum diese Events überhaupt gefiltert werden.
  ignoreErrors: [
    "Java object is gone",
    "Error invoking postMessage",
    "JavaScript interface is gone",
  ],

  beforeSend(event, hint) {
    // 401 = ein Gast ruft einen geschützten Endpoint auf, 429 = Rate-Limit des
    // ThrottlerGuard. Beides sind erwartete Antworten unseres eigenen Backends
    // (siehe src/services/api.ts), keine echten Fehler — sollen also nicht als
    // Sentry-Issue landen.
    const status = (hint?.originalException as any)?.response?.status;
    if (status === 401 || status === 429) {
      return null;
    }
    return event;
  },

  beforeBreadcrumb(breadcrumb) {
    // Die axios-Interceptors (src/services/api.ts) setzen bei jedem authentifizierten
    // Request einen Bearer-Token in den Authorization-Header. Sentry protokolliert
    // Request-Header von XHR/fetch standardmäßig als Breadcrumb-Daten — der Token darf
    // dort nicht landen, sonst steht er im Klartext im Sentry-Dashboard.
    if ((breadcrumb.category === "xhr" || breadcrumb.category === "fetch") && breadcrumb.data) {
      delete breadcrumb.data.Authorization;
      delete breadcrumb.data.authorization;
    }
    return breadcrumb;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
