import { OPERATOR, operatorAddressLine, operatorDisplayName, operatorOwnersLineEn } from './operator'
import { TERMS_VERSION } from './terms.de'
import type { LegalDocument } from './types'

export const TERMS_EN: LegalDocument = {
  kind: 'terms',
  language: 'en',
  title: 'Terms and Conditions',
  shortTitle: 'Terms',
  version: TERMS_VERSION,
  effectiveDate: TERMS_VERSION,
  intro: [
    {
      type: 'p',
      text: 'This is a convenience translation. The German version of these Terms is legally binding.',
    },
    {
      type: 'p',
      text: `These Terms govern the use of the "Share Your Party" platform (website shareyourparty.de, iOS and Android apps) operated by ${operatorDisplayName()}, ${operatorOwnersLineEn()}, ${operatorAddressLine('en')} (hereinafter "Share Your Party", "we" or "us"). Contact: [${OPERATOR.email}](mailto:${OPERATOR.email}).`,
    },
    {
      type: 'p',
      text: 'The Terms are divided into parts. Part A applies to everyone. Part B applies to guests who book tickets. Part C applies to organisers. Part D applies to creators. Part E applies to brands (companies booking creators). Part F contains the withdrawal information for consumers. Part G covers credit, raffles and additional services. Part H contains content rules, liability and final provisions.',
    },
  ],
  sections: [
    {
      id: 'a1',
      title: 'A.1 Scope and definitions',
      blocks: [
        {
          type: 'p',
          text: 'By registering an account or using the platform you accept these Terms. Conflicting terms of users do not apply, even if we do not expressly object to them.',
        },
        {
          type: 'ul',
          items: [
            '**Platform**: the website, web app and mobile apps of Share Your Party including all features (event search, tickets, feed, chat, memories, Creator Club, brand area).',
            '**User**: any person with an account. A **consumer** is a person who uses the platform for purposes outside their trade or business (§ 1 Austrian Consumer Protection Act, KSchG); a **business user** uses it within their business.',
            '**Guest**: a user who books a ticket or attends an event.',
            '**Organiser**: a user who publishes an event and offers tickets for it. Organisers may be businesses or private individuals.',
            '**Creator**: a user admitted to the Creator Club who accepts brand assignments via the platform.',
            '**Brand**: a company that books creators for events or campaigns via the platform.',
            '**Ticket**: a digital admission right with a QR code for a specific event at a fixed date.',
          ],
        },
        {
          type: 'p',
          text: 'Mandatory provisions of the Austrian Consumer Protection Act (KSchG) and the Distance and Off-Premises Contracts Act (FAGG) apply to consumers. Where these Terms deviate, the statutory provisions prevail in favour of the consumer.',
        },
      ],
    },
    {
      id: 'a2',
      title: 'A.2 Our role: platform and intermediary',
      blocks: [
        {
          type: 'p',
          text: 'Share Your Party provides the technical platform on which organisers publish events and guests book tickets. **The contract for attending an event (ticket contract) is concluded exclusively between the guest and the respective organiser.** We are not the organiser of these events and not a party to the ticket contract unless we expressly label an event as our own.',
        },
        {
          type: 'p',
          text: 'We broker the ticket contract, process payment through our payment service provider, issue the digital ticket and forward the proceeds, less the agreed fees, to the organiser. For these brokerage and payment services we conclude a separate user agreement under these Terms with the guest and with the organiser.',
        },
        {
          type: 'p',
          text: 'For assignments between brands and creators (Part E), Share Your Party itself is the contracting party of the brand and engages creators as independent service providers.',
        },
        {
          type: 'p',
          text: 'For each event we indicate whether the organiser acts as a business or as a private individual, where this information is available to us. **If the organiser is a private individual, consumer protection provisions (in particular KSchG and FAGG) do not apply to the ticket contract**, because there is no contract between a business and a consumer. Our own obligations as a platform remain unaffected.',
        },
      ],
    },
    {
      id: 'a3',
      title: 'A.3 Registration, account and minimum age',
      blocks: [
        {
          type: 'p',
          text: 'Use of the platform requires an account. **Registration is permitted from the age of 18.** We ask for the date of birth and may request proof of age. Accounts of persons under 18 will be deleted. Organisers remain obliged to comply with the youth protection age limits applicable to their events.',
        },
        {
          type: 'p',
          text: 'Information provided at registration must be truthful and kept up to date. The account is personal and non-transferable. You must keep your login details secret and notify us immediately of any misuse. Actions taken through your account are attributed to you insofar as you are responsible for the misuse.',
        },
        {
          type: 'p',
          text: 'Signing in with Google, Apple or Facebook is optional. The respective provider transmits your name, email address and an identifier to us. As these providers do not transmit a date of birth, we ask for it after your first sign-in; without a date of birth showing an age of at least 18, the account cannot be used. Details are set out in the [Privacy Policy](/en/privacy).',
        },
        {
          type: 'p',
          text: 'The user agreement is concluded for an indefinite period and is free of charge. You can delete your account at any time in the settings; for security you confirm the deletion with a code we send to your email address. This ends the user agreement. Existing payment obligations, ongoing assignments and statutory retention duties remain (see Privacy Policy). We may terminate the user agreement by email with 14 days notice; the right to suspend for good cause (H.3) remains unaffected.',
        },
      ],
    },
    {
      id: 'a4',
      title: 'A.4 Contract language, storage of the contract text',
      blocks: [
        {
          type: 'p',
          text: 'The contract language is German. The English version of these Terms is for information only; in case of discrepancies the German version prevails. We do not store the contract text separately for you; the current Terms are available at any time at [shareyourparty.de/terms](/en/terms) and can be saved or printed. For every booking you receive a confirmation email with the essential contract data.',
        },
      ],
    },
    {
      id: 'b1',
      title: 'B.1 Booking tickets: offer and conclusion of contract',
      blocks: [
        {
          type: 'p',
          text: 'The presentation of an event on the platform constitutes a binding offer by the organiser to conclude a ticket contract as long as tickets are available. By clicking "Book with obligation to pay" (or "Count me in" for free tickets) you accept the offer. The contract is concluded upon confirmation of payment or issue of the ticket. For paid tickets, the ticket is only created once payment has been confirmed.',
        },
        {
          type: 'p',
          text: 'Before booking you see the total price including all fees and statutory VAT, the number of tickets, the ticket category and any time slots. You can correct your input until you click the booking button. Some organisers ask questions before booking (e.g. names of accompanying persons); these answers are transmitted to the organiser.',
        },
        {
          type: 'p',
          text: 'The ticket is provided in your account as a digital ticket with a QR code and confirmed by email. It is valid once per person and is cancelled upon entry. You are responsible for not sharing the QR code; if presented twice, the first scan counts.',
        },
      ],
    },
    {
      id: 'b2',
      title: 'B.2 Prices, guest fee and payment',
      blocks: [
        {
          type: 'p',
          text: 'The ticket price is set by the organiser. In addition, for paid tickets we charge a **guest fee** as remuneration for our brokerage and payment service. Its amount depends on the ticket price and is shown in the total price before booking; the current rates are published under [Pricing](/en/pricing). No fees apply to free tickets. All prices are in euros and include statutory VAT.',
        },
        {
          type: 'p',
          text: 'Payment is processed by the payment service provider Stripe (Stripe Payments Europe, Ltd., Ireland) using the payment methods offered (e.g. card, Apple Pay, Google Pay). The terms of Stripe apply in addition. The ticket price is collected on behalf of the organiser and paid out to them; the guest fee is our remuneration.',
        },
        {
          type: 'p',
          text: 'Existing credit (G.1) can be applied during checkout; it is credited against the platform fees and is never paid out.',
        },
      ],
    },
    {
      id: 'b3',
      title: 'B.3 Withdrawal, cancellation and refunds',
      blocks: [
        {
          type: 'note',
          text: '**No statutory right of withdrawal for tickets.** Tickets relate to services connected with leisure activities for which a specific date or period is provided. Pursuant to § 18 (1) no. 10 FAGG there is no right of withdrawal under § 11 FAGG for such contracts, including for consumers. This applies to the ticket contract with the organiser as well as to our associated brokerage service.',
        },
        {
          type: 'p',
          text: 'Independently of this, we grant you a **voluntary cancellation option**: a ticket can be cancelled in your account until the event starts, provided it has not yet been scanned and, for raffle events, the draw has not yet taken place. We show the refund amount and any retained fees before you confirm the cancellation. The refund is made to the original payment method, usually within 5 to 10 business days.',
        },
        {
          type: 'p',
          text: 'If the organiser cancels the event or changes it materially (date, venue), you will be notified and refunded the ticket price including the guest fee. The organiser is responsible for the reversal; we process the refund via the platform where funds are available and support you in enforcing your claims against the organiser.',
        },
        {
          type: 'p',
          text: 'There is no entitlement to a refund if you do not attend an event, arrive late, are refused entry by the organiser for violating house rules or youth protection and safety regulations, or if the event takes place only to a limited extent for reasons the organiser is not responsible for (e.g. force majeure).',
        },
      ],
    },
    {
      id: 'b4',
      title: 'B.4 Attending the event',
      blocks: [
        {
          type: 'p',
          text: 'The house rules and admission conditions of the organiser apply (e.g. minimum age, dress code, ID requirement). The organiser exercises the right of the house. Guests behave respectfully towards other guests, staff and neighbours. Violations may lead to expulsion from the event without refund and to suspension of the account.',
        },
        {
          type: 'p',
          text: 'The organiser is liable under statutory provisions for damage, injury or loss at the event. Share Your Party is not liable for the conduct of the event (see H.5).',
        },
      ],
    },
    {
      id: 'c1',
      title: 'C.1 Creating and publishing events',
      blocks: [
        {
          type: 'p',
          text: 'Organisers can create events free of charge. Before publication we review events on a sample or full basis and may reject them if they violate these Terms, the law or the rights of third parties. There is no entitlement to publication.',
        },
        {
          type: 'p',
          text: 'The organiser is solely responsible for the accuracy and completeness of the event information (date, venue, programme, prices, age limits, accessibility), for running the event, for all official permits and registrations (e.g. events law, trade law, youth protection, closing hours, music licensing, taxes) and for the safety of guests.',
        },
        {
          type: 'p',
          text: 'Organisers who are businesses must state this when creating the event and provide their legal notice or identity and contact details; these are shown to guests before booking. Organisers acting as private individuals confirm that they do not act commercially. Anyone who organises events regularly or with the intention of making a profit is generally a business and must declare this.',
        },
        {
          type: 'p',
          text: 'By uploading images, texts and music information the organiser grants us the non-exclusive, worldwide right to use this content to present and promote the event on the platform, in our apps, notifications, newsletters and social media. The organiser warrants that they hold the necessary rights.',
        },
      ],
    },
    {
      id: 'c2',
      title: 'C.2 Ticket sales, organiser fee and payout',
      blocks: [
        {
          type: 'p',
          text: 'The organiser sets ticket prices and quotas. For each paid ticket sold we charge an **organiser fee** as a percentage of the ticket price; it is shown when creating the event and published under [Pricing](/en/pricing). In addition, the guest pays the guest fee (B.2). Payment provider fees are included in our fees. Changes to fee rates only apply to events created after the change is announced.',
        },
        {
          type: 'p',
          text: 'Selling paid tickets requires a verified payout account with our payment service provider Stripe (Stripe Connect). The organiser concludes a separate agreement with Stripe for this and completes its identity verification. Ticket proceeds less the organiser fee are credited to the organiser’s payout account and paid out according to Stripe’s schedule. We may withhold payouts as long as justified complaints, chargebacks or suspected abuse exist.',
        },
        {
          type: 'p',
          text: 'If the event is cancelled or materially changed, the organiser must inform guests immediately via the platform and refund ticket prices. We are entitled to make refunds to guests from the organiser’s balance or to reclaim the amount from the organiser. For cancellations by guests (B.3) the respective amount is deducted from the organiser’s proceeds.',
        },
        {
          type: 'p',
          text: 'The organiser is responsible for the tax treatment of their income (in particular VAT and income tax). We do not issue invoices to guests on behalf of the organiser. **Note:** As a platform operator we may be legally obliged to report information on sellers and their income to the tax authorities (Austrian Digital Platforms Reporting Act, DAC7). Organisers must provide the required information (e.g. tax number, address) on request.',
        },
      ],
    },
    {
      id: 'c3',
      title: 'C.3 Guest data',
      blocks: [
        {
          type: 'p',
          text: 'To run the event, the organiser receives the name, email address, ticket data and the guests’ answers to the organiser’s questions (guest list). The organiser is an independent controller for this data under the GDPR and may use it exclusively to run the event. Use for advertising or disclosure to third parties is only permitted with the express consent of the respective guest. After the event the data must be deleted unless statutory retention obligations apply.',
        },
      ],
    },
    {
      id: 'd1',
      title: 'D.1 Creator Club: application and membership',
      blocks: [
        {
          type: 'p',
          text: 'Users aged 18 or over may apply to the Creator Club. We decide on admission at our discretion; there is no entitlement. Creators may end their membership at any time; ongoing assignments must be completed.',
        },
        {
          type: 'p',
          text: 'Creators decide themselves whether brands may view their profile (name, channels, categories, city, short bio). Without this release they are not proposed to brands.',
        },
      ],
    },
    {
      id: 'd2',
      title: 'D.2 Accepting and performing assignments',
      blocks: [
        {
          type: 'p',
          text: 'We may request creators for specific brand assignments. The request states the service, date, location and the creator’s remuneration. It must be accepted or declined within the stated period (usually 48 hours). **By accepting, the creator makes a binding offer** to perform the service on the stated conditions. The contract between Share Your Party and the creator is concluded once the brand accepts and pays the offer based on it; the creator is notified. If the brand does not accept in time, the creator’s offer lapses.',
        },
        {
          type: 'p',
          text: 'Creators act as independent service providers. They are not integrated into our organisation, are not bound by instructions regarding artistic execution and are free to work for others. No employment relationship with Share Your Party or the brand is created.',
        },
        {
          type: 'p',
          text: 'Creators perform the service personally, punctually and in the agreed quality. They comply with advertising labelling obligations (in particular § 26 Austrian Media Act, § 6 ECG, Unfair Competition Act; labelling as "advertisement"/"paid partnership"), the policies of the platforms used and the brand’s guidelines on brand and content. Illegal, discriminatory or content harmful to minors is prohibited.',
        },
        {
          type: 'p',
          text: 'If the creator is unable to attend, they inform us immediately. Cancelling less than 48 hours before the date without good cause, or failing to appear, results in forfeiture of the remuneration and may lead to exclusion from the Creator Club.',
        },
      ],
    },
    {
      id: 'd3',
      title: 'D.3 Performance review, remuneration and payout',
      blocks: [
        {
          type: 'p',
          text: 'After the event the brand has seven days to confirm the service or report a problem (E.4). If the brand reports a problem, the creator may respond within five days and upload evidence. We then decide at our reasonable discretion whether the remuneration is paid in full, in part or not at all, and give reasons to both sides. If no report is made within the seven days, the service is deemed confirmed.',
        },
        {
          type: 'p',
          text: 'The remuneration is transferred to the creator’s payout account via Stripe Connect after the service has been confirmed. A fully verified Stripe account and the name and address for the payout statement are required. The creator receives a payout statement for each payout. The stated amount is the total amount; **the creator is responsible for the tax treatment of their income (income tax, VAT where applicable, social insurance)** and must obtain any required trade licences themselves. The reporting obligation under C.2 (DAC7) applies accordingly.',
        },
        {
          type: 'p',
          text: 'The remuneration is not assignable before payout. Set-off by the creator is only permitted with undisputed or legally established claims.',
        },
      ],
    },
    {
      id: 'd4',
      title: 'D.4 Rights of use in creator content',
      blocks: [
        {
          type: 'p',
          text: 'Where an assignment includes the creation of content (photos, videos, posts), the creator grants the brand and Share Your Party the non-exclusive right, unlimited in time and territory, to use this content to promote the event, the brand and the platform, unless otherwise agreed in the assignment. The creator warrants that persons depicted have consented and that no third-party rights are infringed.',
        },
      ],
    },
    {
      id: 'e1',
      title: 'E.1 Brands: scope and business status',
      blocks: [
        {
          type: 'p',
          text: 'The brand area is aimed exclusively at businesses within the meaning of § 1 Austrian Commercial Code (UGB) or § 1 KSchG. By registering as a brand, the acting person confirms that they act for a company and are authorised to represent it. Consumer protection provisions do not apply to brand assignments.',
        },
        {
          type: 'p',
          text: 'Brands can invite team members. Actions of team members are attributed to the brand. The owner of the brand account is liable for payment of all assignments placed through the account.',
        },
      ],
    },
    {
      id: 'e2',
      title: 'E.2 Assignment, offer and conclusion of contract',
      blocks: [
        {
          type: 'p',
          text: 'In a request the brand describes the event or campaign, period, location, desired creator profiles and budget. The request is non-binding. We propose suitable creators; the brand accepts or declines each proposed creator. **Accepting a creator is binding** and entitles us to request the creator. We then prepare an offer with total price, scope of services and dates.',
        },
        {
          type: 'p',
          text: 'The offer is valid for the period stated in it (usually seven days). **The contract is concluded when the brand accepts the offer and completes payment via the payment link provided** (for bank transfer: upon receipt of payment). Until then the brand can cancel the assignment free of charge. If the period expires without payment, the assignment is cancelled automatically.',
        },
        {
          type: 'p',
          text: 'The brand’s contracting party is Share Your Party. We perform the service through the selected creators as our agents. If a creator drops out, we endeavour to find an equivalent replacement; if this is not possible, we refund the share attributable to that creator.',
        },
      ],
    },
    {
      id: 'e3',
      title: 'E.3 Prices, payment and invoice',
      blocks: [
        {
          type: 'p',
          text: 'The offer price is a total price in euros. For brands based in Austria and for EU brands without a valid VAT ID it includes Austrian VAT; for EU brands with a valid VAT ID the tax liability shifts to the recipient (reverse charge); for brands outside the EU the service is not taxable in Austria. Payment is made in advance via Stripe Checkout (card, SEPA direct debit or bank transfer). The invoice is sent automatically by email after receipt of payment and is available for download in the brand area.',
        },
        {
          type: 'p',
          text: 'Additional services (e.g. additional creators, longer engagements) are offered and invoiced separately. Default in payment entitles us to withhold the service and to claim statutory default interest (§ 456 UGB) as well as reminder and collection costs.',
        },
      ],
    },
    {
      id: 'e4',
      title: 'E.4 Performance review, cancellation and refund',
      blocks: [
        {
          type: 'p',
          text: 'Within **seven days after the end of the event** the brand can confirm the service for each creator in the assignment area or report a problem (e.g. no-show, lateness, missing content, misconduct) and upload evidence. After the deadline the service is deemed confirmed. The creator has five days to respond. We then decide whether the creator’s remuneration is paid in full, in part or not at all, and refund the brand the unpaid share of the creator remuneration to the original payment method. The decision is communicated to both sides with reasons. Further statutory warranty and damages claims remain unaffected.',
        },
        {
          type: 'p',
          text: 'After conclusion of the contract the brand can only cancel the assignment through us. For cancellation more than 14 days before the event we refund the offer price less costs already incurred and a handling fee of 10%; for cancellation within 14 days before the event, 50%; for cancellation within 48 hours before the event or if the event does not take place for reasons attributable to the brand, no refund is provided. The brand may prove that we incurred a lower loss.',
        },
        {
          type: 'p',
          text: 'If the brand creates its own event with ticket sales as part of an assignment, the provisions for organisers (Part C) also apply.',
        },
      ],
    },
    {
      id: 'f1',
      title: 'F.1 Withdrawal information for consumers (right of withdrawal under FAGG)',
      blocks: [
        {
          type: 'p',
          text: 'This information applies to consumers who conclude a paid distance contract with us as a business, **unless a statutory exception applies**. There is no right of withdrawal for tickets pursuant to § 18 (1) no. 10 FAGG (see B.3). The right of withdrawal therefore concerns in particular paid additional services such as Event Boost or Spotlight when booked by a consumer.',
        },
        { type: 'h3', text: 'Right of withdrawal' },
        {
          type: 'p',
          text: 'You have the right to withdraw from this contract within fourteen days without giving any reason. The withdrawal period is fourteen days from the day of conclusion of the contract. To exercise the right of withdrawal, you must inform us (' +
            `${operatorDisplayName()}, ${operatorAddressLine('en')}, email ${OPERATOR.email}) of your decision to withdraw from this contract by an unequivocal statement (e.g. a letter sent by post or an email). You may use the model withdrawal form below, but it is not obligatory. To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.`,
        },
        { type: 'h3', text: 'Effects of withdrawal' },
        {
          type: 'p',
          text: 'If you withdraw from this contract, we shall reimburse to you all payments received from you without undue delay and in any event not later than fourteen days from the day on which we are informed about your decision to withdraw from this contract. We will carry out such reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise; in any event, you will not incur any fees as a result of such reimbursement. If you requested to begin the performance of services during the withdrawal period, you shall pay us an amount which is in proportion to what has been provided until you have communicated to us your withdrawal from this contract, in comparison with the full coverage of the contract.',
        },
        { type: 'h3', text: 'Early expiry' },
        {
          type: 'p',
          text: 'For services, the right of withdrawal expires if we have fully performed the service and performance began only after you expressly consented and acknowledged that you lose your right of withdrawal upon full performance of the contract (§ 18 (1) no. 1 FAGG). When booking a visibility service (Boost, Spotlight) with immediate start, we ask for this consent during the order process.',
        },
        { type: 'h3', text: 'Model withdrawal form' },
        {
          type: 'note',
          text: `To ${operatorDisplayName()}, ${operatorAddressLine('en')}, email: ${OPERATOR.email} — I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service (*): … — Ordered on (*): … — Name of consumer(s): … — Address of consumer(s): … — Signature of consumer(s) (only if this form is notified on paper): … — Date: … — (*) Delete as appropriate.`,
        },
      ],
    },
    {
      id: 'g1',
      title: 'G.1 Credit and referral programme',
      blocks: [
        {
          type: 'p',
          text: 'Anyone who refers a new person using their personal invitation code receives a credit of 20 euros; the referred person also receives 20 euros. The credit is granted once the referred person has verified their account and uploaded a profile picture. Only one account per person is permitted; we check for multiple registrations (including by email address and device characteristics) and refuse the credit in such cases.',
        },
        {
          type: 'p',
          text: 'Credit can only be used when purchasing paid tickets and is applied against the platform fees of the respective purchase. It is not paid out in cash, is not transferable and is re-credited in the same amount if a ticket is cancelled. Referral credit expires three years after it is granted, to the extent it has not been used by then, and upon deletion of the account; the expiry is shown in your credit history. We may change or end the programme at any time with effect for the future; credit already granted remains. In case of abuse (self-referral, fake accounts, automated registrations) we may cancel credit and suspend accounts.',
        },
      ],
    },
    {
      id: 'g2',
      title: 'G.2 Raffles',
      blocks: [
        {
          type: 'p',
          text: 'Organisers and Share Your Party may combine free raffles with events. Separate participation conditions apply to each raffle and are linked on the event page; they state the promoter, prize, period, eligibility and the type of draw. Participation is free of charge and independent of the purchase of goods or services; persons aged 18 or over are eligible. Cash payment of prizes is excluded; legal recourse is excluded to the extent permitted by law.',
        },
        {
          type: 'p',
          text: 'If a partner provides the prize, we only pass participant data on to that partner if you give separate consent when participating. Consent is voluntary; participation is also possible without it unless the participation conditions provide otherwise. Details are set out in the [Privacy Policy](/en/privacy).',
        },
      ],
    },
    {
      id: 'g3',
      title: 'G.3 Paid visibility services (Boost, Spotlight)',
      blocks: [
        {
          type: 'p',
          text: 'Organisers can increase the reach of their events for a fee (Event Boost with budget and radius, Spotlight placements). Prices, duration and scope are shown before booking and include VAT. Promoted events, as well as events of partners that are given preference in recommendations, are labelled "Ad" for guests. No specific result (reach, sales) is owed. The service starts upon receipt of payment; Part F applies to consumers.',
        },
        {
          type: 'p',
          text: 'Boost and Spotlight end when the booked term expires or the booked budget is used up and do not renew automatically. We currently do not offer subscriptions; should we introduce them, term, renewal and cancellation will be shown before booking, and consumers will be informed by email in good time before a renewal.',
        },
      ],
    },
    {
      id: 'h1',
      title: 'H.1 User content and rights granted',
      blocks: [
        {
          type: 'p',
          text: 'Users can publish posts, comments, stories, photos and videos ("memories"), reviews and messages. They remain the owners of the rights in their content and grant us the non-exclusive, royalty-free, worldwide right to store, reproduce, display, technically adapt (e.g. thumbnails, translations) and make the content available to other users within the platform in accordance with the chosen visibility. This right ends when the content is deleted, except for technical backups and content already shared by other users.',
        },
        {
          type: 'p',
          text: 'Anyone uploading photos or videos in which other persons are recognisable confirms that these persons agree to the publication (§ 78 Austrian Copyright Act, right to one’s own image). Depicted persons can request removal via the "Report" function or by email; we remove such content after review. Tags of persons on photos can be removed by the tagged persons at any time.',
        },
      ],
    },
    {
      id: 'h2',
      title: 'H.2 Prohibited content and rules of conduct',
      blocks: [
        { type: 'p', text: 'The following in particular are prohibited:' },
        {
          type: 'ul',
          items: [
            'illegal content, in particular incitement to hatred, depictions of violence, depictions of sexual abuse, terrorist content, defamation, insults and threats;',
            'harassment, stalking, discrimination on grounds of gender, origin, religion, disability, age or sexual orientation;',
            'content infringing third-party rights (copyright, trademark, personality rights) and publishing personal data of third parties without their consent;',
            'misleading event information, fake events, ticket fraud, resale of tickets above face value, multiple accounts and manipulation of reviews or the referral programme;',
            'advertising for drugs, weapons, unlicensed gambling, pornographic offers and unsolicited advertising (spam) in messages and comments;',
            'technical interference: scraping, automated access, circumvention of security measures, injection of malicious code, overloading the services;',
            'using location sharing or safety features to monitor other persons without their knowledge.',
          ],
        },
        {
          type: 'p',
          text: 'Events serving alcohol or with age restrictions must be labelled accordingly. Organisers are responsible for compliance with youth protection.',
        },
      ],
    },
    {
      id: 'h3',
      title: 'H.3 Moderation, reports, suspensions (Art. 14 to 17 and 20 DSA)',
      blocks: [
        {
          type: 'p',
          text: 'Any content and any account can be reported via the "Report" function or by email to [' +
            `${OPERATOR.email}](mailto:${OPERATOR.email}). We review reports promptly, diligently and without arbitrariness. We do not use automated decision-making systems; measures are decided by people. Reporting and affected users are informed of the outcome.`,
        },
        {
          type: 'p',
          text: 'In case of violations of these Terms or the law we may, depending on severity, remove content or restrict its visibility, temporarily block features (e.g. comments, event creation, payouts), suspend accounts temporarily or permanently and withhold credit. When taking a measure we inform you of the reasons and the legal basis by email (Art. 17 DSA) unless this is prohibited by law or would jeopardise investigations. You can lodge a complaint against the measure free of charge within six months; we will then review it again. Manifestly unfounded or abusive reports may lead to suspension of the reporting person.',
        },
        {
          type: 'p',
          text: 'If we suspect criminal offences involving a threat to the life or safety of persons, we inform the competent authorities (Art. 18 DSA).',
        },
      ],
    },
    {
      id: 'h4',
      title: 'H.4 Chat, location sharing and safety features',
      blocks: [
        {
          type: 'p',
          text: 'The chat serves communication between users. Messages are not public; we do not read them except to review a report or where required by law. Sharing your own location in the chat and the "Safety Companion" feature are voluntary, can be ended at any time and do not replace emergency services. In an emergency call 112.',
        },
      ],
    },
    {
      id: 'h5',
      title: 'H.5 Availability, warranty and liability',
      blocks: [
        {
          type: 'p',
          text: 'We strive for high availability of the platform but do not owe uninterrupted accessibility. We announce maintenance where possible. For the free features of the platform the statutory warranty rules apply only insofar as they are applicable to services free of charge; for paid services the statutory warranty provisions apply (for consumers in particular the Consumer Warranty Act).',
        },
        {
          type: 'p',
          text: 'We are liable without limitation for damage resulting from injury to life, body or health, for intent and gross negligence, and under the Product Liability Act. In case of slight negligence we are not liable towards businesses; towards consumers we are liable for slight negligence only for the breach of essential contractual obligations and limited to the foreseeable damage typical for the contract. To the extent permitted by law, liability for lost profit and indirect damage towards businesses is excluded.',
        },
        {
          type: 'p',
          text: 'We are not liable for the content, conduct and safety of events organised by users or for the accuracy of user content; the respective organiser or user is responsible. We are not liable for services of the payment service provider unless we are responsible for them.',
        },
        {
          type: 'p',
          text: 'Users indemnify us against third-party claims based on a culpable violation of these Terms or applicable law by the user, including reasonable costs of legal defence. Towards consumers this applies only in case of intent or gross negligence.',
        },
      ],
    },
    {
      id: 'h6',
      title: 'H.6 Changes to the Terms and the platform',
      blocks: [
        {
          type: 'p',
          text: 'We may amend these Terms where there is a valid reason (e.g. changes in the law, new features, changes to the fee structure, requirements of payment service providers or app stores). We announce changes at least 30 days before they take effect by email or in the app and highlight the amended passages. If you do not object before the changes take effect, the amended Terms are deemed accepted; we point this out expressly in the announcement. You may terminate the user agreement free of charge at any time before the changes take effect. Changes affecting main services or the price to your detriment require your express consent. For businesses a notice period of 15 days applies (Art. 3 Regulation (EU) 2019/1150).',
        },
        {
          type: 'p',
          text: 'We continuously develop the platform and may change, add or discontinue features insofar as this is reasonable for you. Services already paid for remain unaffected or are refunded pro rata.',
        },
      ],
    },
    {
      id: 'h7',
      title: 'H.7 Ranking and visibility (Art. 5 Regulation (EU) 2019/1150, Art. 27 DSA)',
      blocks: [
        {
          type: 'p',
          text: 'The order of events in search results, recommendations and lists is determined mainly by: distance to the selected location, date and time of the event, match with the stated interests and search terms, activity around the event (favourites, ticket sales, reviews) and the completeness of the event information. Paid visibility services (G.3) may additionally highlight events; such placements are labelled. Users can change the sort order in the search themselves (e.g. by date or distance).',
        },
      ],
    },
    {
      id: 'h8',
      title: 'H.8 Complaints, dispute resolution, applicable law, jurisdiction',
      blocks: [
        {
          type: 'p',
          text: `Please send complaints to [${OPERATOR.email}](mailto:${OPERATOR.email}). We usually respond within 14 days. Business users (organisers, creators, brands) can use the internal complaint-handling system under Art. 11 Regulation (EU) 2019/1150 via the same address. Consumers may contact the ${OPERATOR.consumerArbitration.name} ([${OPERATOR.consumerArbitration.website.replace('https://', '')}](${OPERATOR.consumerArbitration.website})); we are not obliged to participate in arbitration proceedings.`,
        },
        {
          type: 'p',
          text: 'Austrian law applies, excluding the UN Convention on Contracts for the International Sale of Goods and the conflict-of-law rules of private international law. For consumers habitually resident in another EU member state, the mandatory consumer protection provisions of that state remain applicable where they are more favourable.',
        },
        {
          type: 'p',
          text: 'For actions against consumers domiciled, habitually resident or employed in Austria, the court in whose district that place is located has exclusive jurisdiction (§ 14 KSchG). For contracts with businesses the competent court in Vienna has exclusive jurisdiction.',
        },
      ],
    },
    {
      id: 'h9',
      title: 'H.9 Final provisions',
      blocks: [
        {
          type: 'p',
          text: 'Should individual provisions of these Terms be or become invalid, the validity of the remaining provisions remains unaffected. Towards consumers the statutory provision replaces the invalid provision. There are no side agreements. We may transfer rights and obligations under this agreement to a legal successor who continues to operate the platform; we will inform you and you may terminate the user agreement at any time in this case.',
        },
        {
          type: 'p',
          text: 'The Privacy Policy is not part of these Terms; it informs about the processing of personal data and is available at [shareyourparty.de/privacy](/en/privacy).',
        },
      ],
    },
  ],
  footer: 'Last updated: 5 November 2026 – version 2026-11',
}
