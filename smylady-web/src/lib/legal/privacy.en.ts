import { OPERATOR, operatorAddressLine, operatorDisplayName, operatorOwnersLineEn } from './operator'
import { PRIVACY_VERSION } from './privacy.de'
import type { LegalDocument } from './types'

const DSB = OPERATOR.dataProtectionAuthority

export const PRIVACY_EN: LegalDocument = {
  kind: 'privacy',
  language: 'en',
  title: 'Privacy Policy',
  shortTitle: 'Privacy',
  version: PRIVACY_VERSION,
  effectiveDate: PRIVACY_VERSION,
  intro: [
    {
      type: 'p',
      text: 'This is a convenience translation. The German version is legally binding.',
    },
    {
      type: 'p',
      text: 'This Privacy Policy informs you pursuant to Art. 13 and 14 GDPR about which personal data we process when you use the website shareyourparty.de, the web app and the Share Your Party apps for iOS and Android, for which purposes, on which legal basis, for how long, and which rights you have.',
    },
  ],
  sections: [
    {
      id: 'controller',
      title: '1. Controller and contact',
      blocks: [
        {
          type: 'p',
          text: `The controller responsible for data processing is ${operatorDisplayName()}, ${operatorOwnersLineEn()}, ${operatorAddressLine('en')}, email: [${OPERATOR.email}](mailto:${OPERATOR.email}) (subject "Data protection"). A data protection officer is not legally required and has not been appointed.`,
        },
      ],
    },
    {
      id: 'overview',
      title: '2. Overview: legal bases and principles',
      blocks: [
        { type: 'p', text: 'We process data only where one of the following legal bases applies:' },
        {
          type: 'ul',
          items: [
            '**Contract** (Art. 6 (1) (b) GDPR): everything required for your account, ticket bookings, assignments, payouts and the platform features.',
            '**Consent** (Art. 6 (1) (a) GDPR, § 165 (3) Austrian Telecommunications Act 2021): analytics and marketing technologies, app tracking, location access, notifications, passing raffle data to partners. You can withdraw consent at any time with effect for the future.',
            '**Legal obligation** (Art. 6 (1) (c) GDPR): retention of invoices and payment records, tax reporting duties, information to authorities.',
            '**Legitimate interest** (Art. 6 (1) (f) GDPR): security and stability of the platform, fraud prevention, error analysis, enforcement of our Terms, defence of legal claims. You can object to these processing operations (section 18).',
          ],
        },
        {
          type: 'p',
          text: 'We do not sell personal data. We do not make decisions based solely on automated processing that produce legal effects concerning you (Art. 22 GDPR). Reviews of reports, account suspensions and payout decisions are made by people.',
        },
      ],
    },
    {
      id: 'hosting',
      title: '3. Provision of the website and apps, server logs',
      blocks: [
        {
          type: 'p',
          text: 'When you access the website or use the apps, our servers process technically necessary data: IP address (truncated in the application log), date and time, requested path without parameters, status code, amount of data transferred, browser or app version, operating system and device type. This data serves to deliver the content, for security (defence against attacks, rate limiting) and for troubleshooting. The legal basis is our legitimate interest in secure operation. Server logs are deleted after 30 days at the latest.',
        },
        { type: 'p', text: 'We use the following processors for this:' },
        {
          type: 'table',
          head: ['Service', 'Purpose and location'],
          rows: [
            ['Vercel Inc., USA', 'Hosting of the website and web app (content delivery network, serverless functions). Transfer to the USA based on the EU-US Data Privacy Framework and standard contractual clauses.'],
            ['Render Services, Inc., USA', 'Hosting of the backend (API, real-time chat). Server location EU (Frankfurt); access from the USA is safeguarded by standard contractual clauses.'],
            ['MongoDB Ltd. (Ireland) / MongoDB Inc. (USA) – MongoDB Atlas', 'Database hosting for accounts, events, tickets, messages and documents. Server location EU; safeguarded by standard contractual clauses.'],
            ['Amazon Web Services EMEA SARL, Luxembourg – S3', 'Storage of images and videos (profile and event images, memories, chat media, evidence for performance reviews) in the Frankfurt region (eu-central-1).'],
            ['Functional Software, Inc. (Sentry), USA', 'Error and crash reports (see section 12), data processed in Sentry’s EU region.'],
          ],
        },
      ],
    },
    {
      id: 'account',
      title: '4. Registration, account and profile',
      blocks: [
        {
          type: 'p',
          text: 'For an account we process name, email address, password (stored only as a hash), date of birth (to verify the minimum age of 18), chosen language, role (guest, organiser, creator, brand) and the time and version of your acceptance of the Terms. Optionally you can add a profile picture, username, phone number, place of residence, interests, short bio and settings for the visibility of age and residence. The legal basis is performance of the contract.',
        },
        {
          type: 'p',
          text: 'To confirm your email address and for password changes we send one-time codes by email. Optionally you can enable two-factor authentication; we store the secret for this in encrypted form.',
        },
        {
          type: 'p',
          text: 'Your public profile (username, profile picture, short bio, posts and memories you have published and, if you have enabled it, age and place of residence) is visible to other users. Age and place of residence are not visible by default. Other users only see which events you attended for events they are allowed to see themselves (public events; events for subscribers or invited guests only if they belong to that group).',
        },
        { type: 'h3', text: 'Sign in with Google, Apple, Facebook' },
        {
          type: 'p',
          text: 'When signing in via one of these services we receive from the provider your name, email address (with Apple optionally a relay address), profile picture and an identifier. The provider learns that you sign in to Share Your Party. As these services do not transmit a date of birth, we ask for it after your first sign-in. Controllers: Google Ireland Ltd., Apple Distribution International Ltd. (both Ireland), Meta Platforms Ireland Ltd. (Ireland). The legal basis is performance of the contract; use is voluntary, registration by email is available as an alternative.',
        },
        { type: 'h3', text: 'Spotify connection (optional)' },
        {
          type: 'p',
          text: 'You can connect your Spotify account so that we can suggest events matching your music taste. We store the access tokens received from Spotify (encrypted) and your top artists and genres. The legal basis is your consent; you can disconnect at any time in the settings, after which we delete the Spotify data. Provider: Spotify AB, Sweden.',
        },
      ],
    },
    {
      id: 'tickets',
      title: '5. Events, tickets, payments and documents',
      blocks: [
        {
          type: 'p',
          text: 'For a ticket booking we process event data, ticket category, price, fees, payment status, time of entry (scan) and your answers to the organiser’s questions. **Payment data** (card number, bank or wallet details) is collected and processed exclusively by our payment service provider Stripe; we only receive the payment reference, amount, status and, if required, the last four digits of the payment method. The legal basis is performance of the contract.',
        },
        {
          type: 'p',
          text: 'Stripe Payments Europe, Ltd., Ireland (and Stripe, Inc., USA as sub-processor certified under the EU-US Data Privacy Framework) is partly an independent controller for payment processing, e.g. for fraud prevention and legal obligations. Information: [stripe.com/at/privacy](https://stripe.com/at/privacy). Organisers, creators and brands who receive payouts or pay invoices additionally conclude an agreement with Stripe (Stripe Connect or Stripe Checkout); Stripe collects identity, address and bank data directly for this.',
        },
        {
          type: 'p',
          text: '**Disclosure to the organiser:** To run the event, the organiser receives your name, email address, ticket data and your answers to their questions. The organiser is an independent controller for this and may use the data only for the event (see Terms, C.3). At entry, scanning staff see your name and ticket status.',
        },
        {
          type: 'p',
          text: 'For brand assignments we create invoices, correction documents and payout statements with name, address, VAT ID where applicable and amounts. We retain these documents for seven years (§ 132 Federal Fiscal Code, § 212 Commercial Code). The legal basis is the legal obligation.',
        },
      ],
    },
    {
      id: 'business',
      title: '6. Organisers, creators and brands',
      blocks: [
        {
          type: 'p',
          text: '**Organisers:** In addition to account data we process event details, sales figures, payout status, reviews by guests and the status of your Stripe payout account. As a platform operator we may be legally obliged to report seller information (name, address, tax number, turnover) to the tax office (Austrian Digital Platforms Reporting Act); the legal basis is then the legal obligation.',
        },
        {
          type: 'p',
          text: '**Creators:** For the application we process first and last name, place of residence, age, social media channels with follower range, categories, portfolio links and your billing details (name, address, optionally company, VAT or tax number). Within assignments we process confirmations, working times, remuneration, the performance review (feedback from the brand, your response, uploaded evidence) and payouts. **Brands only see your profile (name, channels, categories, city, short bio) if you have enabled this in the creator area**; you can withdraw this release at any time. The legal basis is performance of the contract or your consent for the release.',
        },
        {
          type: 'p',
          text: '**Brands:** We process company name, contact person with name, email and position, industry, website, social media channels, team members, assignment data, billing address and VAT ID (collected via Stripe Checkout) and the performance review. The legal basis is performance of the contract. Details of the contact person are personal data of that person.',
        },
      ],
    },
    {
      id: 'location',
      title: '7. Location data',
      blocks: [
        {
          type: 'p',
          text: '**Events nearby:** If you allow location access in the browser or app, we transmit your current coordinates to our server to show events around you. We do not permanently store these coordinates in your account; in the apps, recently chosen places are stored locally on your device. Alternatively you can select a place manually. The legal basis is your consent (system permission), which you can withdraw at any time in the device or browser settings.',
        },
        {
          type: 'p',
          text: '**Sharing location in chat:** You can share your location in a conversation as a map link and, if you enable it, have it updated continuously for the duration of sharing. The message is stored like any other chat message. The legal basis is your consent through actively sharing. We additionally log location shares for abuse prevention (sender, recipient, time) and delete this log after 90 days.',
        },
        {
          type: 'p',
          text: '**Safety Companion:** You can designate other users as safety companions for an event. They see that you attend the event and the place and time of the event. Your live location is not transmitted.',
        },
        {
          type: 'p',
          text: '**Event addresses** are converted into coordinates for map display (geocoding) via the Nominatim service of the OpenStreetMap Foundation (United Kingdom, EU adequacy decision). Only the entered address is transmitted.',
        },
      ],
    },
    {
      id: 'content',
      title: '8. Posts, memories, stories, comments and chat',
      blocks: [
        {
          type: 'p',
          text: 'Content you publish (posts, comments, stories, photos and videos as "memories", reviews, reactions) is visible to other users according to the chosen visibility. You can set the default visibility of memories in the settings. Persons can be tagged on photos; tagged persons are notified and can remove the tag. Stories are visible for 24 hours and are deleted afterwards. The legal basis is performance of the contract (provision of the community features).',
        },
        {
          type: 'p',
          text: 'Chat messages (text, images, shared locations, music tracks) are stored on our servers so that both sides can retrieve them. We do not analyse messages and only read them if a message is reported or we are legally obliged to. Messages are deleted when you delete the conversation or your account is deleted.',
        },
        {
          type: 'p',
          text: 'We automatically translate event texts (title, description, restrictions) between German and English via DeepL SE, Cologne (Germany). Only the event texts are transmitted, no account data.',
        },
      ],
    },
    {
      id: 'communication',
      title: '9. Emails and push notifications',
      blocks: [
        {
          type: 'p',
          text: '**Transactional emails** (confirmation codes, ticket confirmations with calendar entry, event changes, payment and payout documents, reminders of upcoming events, assignment messages, security notices) are sent via Twilio Inc. (SendGrid), USA, certified under the EU-US Data Privacy Framework. The legal basis is performance of the contract. **Marketing emails (newsletter)** are sent only with your prior consent (§ 174 Telecommunications Act 2021); every marketing email contains an unsubscribe link.',
        },
        {
          type: 'p',
          text: '**Push notifications** in the apps are only received if you allow them in the operating system. We store the required device token in your account and delete it when you log out. Delivery is via Expo (650 Industries, Inc., USA), Apple Push Notification Service and Google Firebase Cloud Messaging. Notifications concern your tickets, messages, assignments and interactions; announcements with promotional content are sent only with separate consent, which you can withdraw in the settings. We record whether a notification was opened to improve delivery.',
        },
      ],
    },
    {
      id: 'raffles',
      title: '10. Raffles',
      blocks: [
        {
          type: 'p',
          text: 'When you participate in a raffle we process your name, email address, ticket data and your answers to raffle questions to conduct the draw and notify winners. The legal basis is performance of the contract (participation agreement). **Your data is only passed on to a raffle partner, or your email address used for their advertising, if you have given separate consent when participating.** You can withdraw consent at any time with us or the partner. We delete raffle data three months after the raffle ends unless retention obligations apply.',
        },
      ],
    },
    {
      id: 'fraud',
      title: '11. Referral programme, fraud prevention and security',
      blocks: [
        {
          type: 'p',
          text: 'To protect against abuse of the referral programme (multiple accounts to obtain credit) and for account security, we generate a technical device identifier at registration (hash of device characteristics such as browser or device type, operating system and screen properties) and match it against existing accounts. The identifier does not allow conclusions about your identity and is not used for advertising. The legal basis is our legitimate interest in preventing fraud (Art. 6 (1) (f) GDPR); you can object to this processing, in which case we review referral credits manually. The identifier is deleted with the account.',
        },
        {
          type: 'p',
          text: 'To protect the platform we use access limits (rate limiting) per user or IP address and store security-relevant events (failed logins, suspensions) for up to 90 days.',
        },
      ],
    },
    {
      id: 'errors',
      title: '12. Error analysis (Sentry)',
      blocks: [
        {
          type: 'p',
          text: 'To detect crashes and errors we use Sentry (Functional Software, Inc., USA; data processed in the EU region, standard contractual clauses). In case of an error, the error message, programme state, app or browser version, operating system, device type and a timestamp are transmitted. We have configured Sentry so that IP addresses, cookies, access tokens, email addresses and payment references are not transmitted or are removed before sending. The legal basis is our legitimate interest in a stable service. Error reports are deleted after 90 days.',
        },
      ],
    },
    {
      id: 'cookies',
      title: '13. Cookies, analytics and marketing',
      blocks: [
        { type: 'h3', text: 'Strictly necessary storage' },
        {
          type: 'p',
          text: 'For login, language, security and storing your cookie decision we use technically necessary cookies and local storage (e.g. login token, chosen language, drafts, cookie setting "syp_consent", 12 months). No consent is required for this (§ 165 (3) Telecommunications Act 2021).',
        },
        { type: 'h3', text: 'Analytics and marketing only with consent' },
        {
          type: 'p',
          text: 'We only use the following services on the website if you agree in the cookie banner. Without consent they remain disabled (Google Consent Mode v2, default "denied"). You can change or withdraw your choice at any time via the "Cookie settings" link in the footer and in the settings.',
        },
        {
          type: 'table',
          head: ['Service', 'Purpose, provider, notes'],
          rows: [
            ['Google Tag Manager', 'Management of the tags below. Google Ireland Ltd., Ireland. Loads the other services only after your consent.'],
            ['Google Analytics 4 (analytics category)', 'Reach measurement, usage statistics with truncated IP address. Data retention at Google 14 months. Transfer to the USA based on the EU-US Data Privacy Framework. Additional opt-out via [tools.google.com/dlpage/gaoptout](https://tools.google.com/dlpage/gaoptout).'],
            ['Google Ads conversion and remarketing (marketing category)', 'Measuring the effectiveness of our ads and addressing visitors via the Google advertising network. Settings at Google: [myadcenter.google.com](https://myadcenter.google.com).'],
            ['Google AdSense (marketing category)', 'Display of third-party advertising on individual pages; loaded only after consent.'],
            ['Meta Pixel and Conversions API (marketing category)', 'Measuring registrations and purchases after clicking on our ads on Facebook/Instagram and building audiences. Meta Platforms Ireland Ltd.; Meta Platforms, Inc., USA (EU-US Data Privacy Framework). Transmission from our forms (creator application, business enquiry) to the Conversions API also takes place only with your marketing consent and without your IP address. Joint controllership under Art. 26 GDPR applies to data collection; information: [facebook.com/privacy/policy](https://www.facebook.com/privacy/policy).'],
          ],
        },
        { type: 'h3', text: 'Analytics and tracking in the apps' },
        {
          type: 'p',
          text: 'In the iOS and Android apps we ask at first launch whether you allow usage analytics (Google Analytics 4 via the Measurement Protocol with a random app identifier) and marketing measurement (Meta Conversions API, Facebook SDK). On iOS the system prompt "App Tracking" additionally applies. Without your consent this data is not sent. You can change your choice at any time in the app settings under "Privacy".',
        },
        { type: 'h3', text: 'Google Sign-In and Google Fonts' },
        {
          type: 'p',
          text: 'On the login and registration pages we load Google’s sign-in library so that "Sign in with Google" works; your IP address is transmitted to Google in the process. Fonts are embedded locally without connecting to Google servers.',
        },
      ],
    },
    {
      id: 'embeds',
      title: '14. Embedded third-party content',
      blocks: [
        {
          type: 'p',
          text: 'Individual pages contain third-party content that is loaded only after a click (two-click solution): Instagram posts (Meta Platforms Ireland Ltd.), Spotify previews (Spotify AB), YouTube videos (Google Ireland Ltd.). Only upon clicking are your IP address and device information transmitted to the provider, who may set cookies. The legal basis is your consent by clicking. Links to Google Maps open the map service outside our platform.',
        },
        {
          type: 'p',
          text: 'Events from Ticketmaster are imported from public interfaces; no data about you is transmitted to Ticketmaster. The blog at blog.shareyourparty.de runs on WordPress; this Privacy Policy applies to it accordingly.',
        },
      ],
    },
    {
      id: 'moderation',
      title: '15. Reports, moderation and support',
      blocks: [
        {
          type: 'p',
          text: 'If you report content or users, we store the report, the reason, the reported content and your account identifier to review the report and inform you of the outcome. Reported users do not learn who reported them. For suspensions we store the reason and time for the duration of the suspension and to prevent re-registration, and we inform you of the reason and legal basis by email. The legal basis is our legitimate interest in a safe platform and the fulfilment of our obligations under the Digital Services Act.',
        },
        {
          type: 'p',
          text: 'We process support requests by email to answer your request and delete them twelve months after completion. The contact form opens your email programme; the message is not sent via our servers.',
        },
      ],
    },
    {
      id: 'recipients',
      title: '16. Recipients and transfers to third countries',
      blocks: [
        {
          type: 'p',
          text: 'Your data is only received by recipients who need it for the stated purposes: the processors named in this policy (hosting, database, storage, email, push, error analysis, translation), Stripe as payment service provider, organisers and brands to the extent described, raffle partners only with consent, tax advisors and authorities where legally required. Contracts under Art. 28 GDPR are in place with all processors.',
        },
        {
          type: 'p',
          text: 'Where data is transferred to countries outside the European Economic Area (in particular the USA), we rely on adequacy decisions of the EU Commission (EU-US Data Privacy Framework for certified providers, United Kingdom) or on standard contractual clauses under Art. 46 (2) (c) GDPR with supplementary measures. A copy of the safeguards is available on request.',
        },
      ],
    },
    {
      id: 'retention',
      title: '17. Retention periods',
      blocks: [
        {
          type: 'p',
          text: 'We store personal data only as long as necessary for the respective purpose or as required by statutory retention obligations:',
        },
        {
          type: 'table',
          head: ['Data', 'Retention period'],
          rows: [
            ['Account and profile data, content, messages, favourites, uploaded media', 'until the account is deleted; then deletion within 30 days'],
            ['In-app notifications', '180 days'],
            ['Activity days (account identifier and date only, for usage statistics)', '400 days'],
            ['Tickets, payments, invoices, payout statements, credit notes', '7 years from the end of the calendar year (§ 132 Federal Fiscal Code, § 212 Commercial Code); after account deletion only in pseudonymised form for accounting and tax'],
            ['Acceptance of Terms and consents (time, version)', '3 years after the end of the user agreement or after withdrawal (burden of proof)'],
            ['Server logs, security events', 'up to 30 days (logs) or 90 days (security events)'],
            ['Error reports (Sentry)', '90 days'],
            ['One-time codes (OTP)', 'until used, at most 24 hours'],
            ['Stories', '24 hours'],
            ['Log of shared locations', '90 days'],
            ['Reports and moderation decisions', '12 months after completion; for suspensions, for the duration of the suspension'],
            ['Raffle data', '3 months after the raffle ends'],
            ['Creator Club applications (rejected)', '6 months after the decision'],
            ['Cookie setting', '12 months'],
          ],
        },
        {
          type: 'p',
          text: 'After deletion of your account, content concerning other users (e.g. comments under other users’ posts, reviews of organisers) is retained in anonymised form. Data we need to defend legal claims is retained until the limitation periods expire.',
        },
      ],
    },
    {
      id: 'rights',
      title: '18. Your rights',
      blocks: [
        { type: 'p', text: 'You have the following rights towards us:' },
        {
          type: 'ul',
          items: [
            '**Access** (Art. 15 GDPR) to the data stored about you,',
            '**Rectification** (Art. 16) of inaccurate data; you can change most details yourself in your profile,',
            '**Erasure** (Art. 17); you can delete your account at any time in the settings (confirmation by email code). Tickets and payment data subject to retention obligations are kept in pseudonymised form,',
            '**Restriction of processing** (Art. 18),',
            '**Data portability** (Art. 20): in the settings you can download the data you provided in a machine-readable format (JSON) at any time,',
            '**Withdrawal of consent** (Art. 7 (3)) with effect for the future, e.g. via the cookie settings, the app settings or by email.',
          ],
        },
        {
          type: 'note',
          text: '**Right to object (Art. 21 GDPR):** You can object at any time, on grounds relating to your particular situation, to processing we base on a legitimate interest. If we process data for direct marketing, you can object at any time without giving reasons; we will then no longer use your data for this purpose.',
        },
        {
          type: 'p',
          text: `To exercise your rights, an email to [${OPERATOR.email}](mailto:${OPERATOR.email}) is sufficient. We respond within one month. For security we may request confirmation via the email address registered with us.`,
        },
        {
          type: 'p',
          text: `**Right to lodge a complaint:** If you believe that the processing of your data violates data protection law, you can complain to a supervisory authority, in particular the ${DSB.name.en}, ${DSB.street}, ${DSB.postalCode} ${DSB.city}, Austria, phone ${DSB.phone}, email [${DSB.email}](mailto:${DSB.email}), [${DSB.website.replace('https://', '')}](${DSB.website}).`,
        },
      ],
    },
    {
      id: 'minors',
      title: '19. Minors',
      blocks: [
        {
          type: 'p',
          text: 'Our services are aimed at persons aged 18 or over. We do not knowingly collect data from persons under 18. If we become aware of such an account, we delete it. Parents and guardians can contact us at any time.',
        },
      ],
    },
    {
      id: 'security',
      title: '20. Data security',
      blocks: [
        {
          type: 'p',
          text: 'We transmit data exclusively encrypted (TLS), store passwords only as hashes, restrict access on a need-to-know basis, log administrative access and back up our databases regularly. Payment data never leaves our payment service provider. Despite all measures, absolute protection cannot be guaranteed; please choose a secure password and enable two-factor authentication.',
        },
      ],
    },
    {
      id: 'changes',
      title: '21. Changes to this Privacy Policy',
      blocks: [
        {
          type: 'p',
          text: 'We adapt this policy when our processing operations or the legal situation change. The current version is available at [shareyourparty.de/privacy](/en/privacy) and in the apps. We inform you of material changes by email or in the app.',
        },
      ],
    },
  ],
  footer: 'Last updated: 5 November 2026 – version 2026-11',
}
