import type { Metadata } from 'next'
import { SiteHeader } from '../_components/SiteHeader'
import { SiteFooter } from '../_components/SiteFooter'
import { LegalPage } from '../_components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy — GuideMe',
  description:
    'How GuideMe collects, uses, and protects your personal data. GDPR-friendly.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <LegalPage title="Privacy Policy" effectiveDate="10 July 2026">
        <p>
          This Privacy Policy explains what personal data we collect when you use
          the GuideMe mobile app and website (the “<strong>Service</strong>”),
          why we collect it, and the rights you have over it. We designed the
          Service to collect as little data as possible — this policy reflects
          that.
        </p>

        <h2>1. Data Controller</h2>
        <p>
          The data controller responsible for your personal data is:
        </p>
        <ul>
          <li>
            <strong>Ivan Bošnjaković</strong>, operating under the trade name
            “GuideMe”
          </li>
          <li>Kalnička 15, 10000 Zagreb, Croatia</li>
          <li>
            Email:{' '}
            <a href="mailto:hello@guidemeapp.xyz">
              hello@guidemeapp.xyz
            </a>
          </li>
        </ul>

        <h2>2. What We Collect</h2>
        <p>We collect the following categories of personal data:</p>
        <ul>
          <li>
            <strong>Account data (from Clerk):</strong> when you sign in with
            Google or Apple, we receive your name, email address, profile picture,
            and a unique identifier from that provider. We store only the unique
            identifier (“Clerk user ID”) and a record that a user exists;
            everything else remains with our authentication provider, Clerk.
          </li>
          <li>
            <strong>Favorites:</strong> the cities, tours, places, and sub-stops
            you save in the app. We store these as references (type + slug),
            linked to your Clerk user ID.
          </li>
          <li>
            <strong>Location data:</strong> with your permission, the app uses
            your device location for map centring and walking directions. Location
            is processed on your device. Walking-direction requests may be sent to
            Google Maps (see “Third-Party Services” below) but are not stored by
            us.
          </li>
          <li>
            <strong>Technical data:</strong> IP address and standard request
            metadata received by our servers when your app or browser makes a
            request. We use this for security, rate-limiting, and error
            diagnostics; we do not link it to your account for profiling.
          </li>
          <li>
            <strong>Product analytics:</strong> the mobile app sends
            usage events to our analytics processor, PostHog. These events
            record actions like sign-in, starting or completing a walking
            tour, tapping a favorite, playing audio (duration in
            milliseconds), and switching language. Each event carries a
            pseudonymous device identifier and, once you sign in, your
            Clerk user ID so we can count unique users. The events also
            include coarse device and app metadata attached automatically
            by the analytics library — operating system name and version,
            app version, device type, locale, and timezone. We use this
            data only in aggregate to understand how the app is used and
            to publish community numbers on our marketing site. We do not
            sell it, share it with advertisers, or use it for profiling.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect: advertising identifiers,
          contact lists, photos, microphone data, health data, financial
          data, or any special-category data (as defined by Article 9
          GDPR).
        </p>

        <h2>3. Why We Use Your Data</h2>
        <ul>
          <li>
            <strong>To provide the Service</strong> — authenticate you, sync
            favorites across devices, show walking directions. Legal basis:
            performance of a contract (Art. 6(1)(b) GDPR).
          </li>
          <li>
            <strong>To keep the Service secure and working</strong> — detect
            abuse, prevent fraud, diagnose errors. Legal basis: our legitimate
            interests (Art. 6(1)(f) GDPR).
          </li>
          <li>
            <strong>To understand how the app is used in aggregate</strong>{' '}
            — measure feature adoption, spot broken flows, and publish
            community-level statistics on our marketing site. Legal
            basis: our legitimate interests (Art. 6(1)(f) GDPR). You can
            object at any time by deleting your account, which stops
            future analytics events tied to your identifier.
          </li>
          <li>
            <strong>To comply with legal obligations</strong> where they apply.
            Legal basis: compliance with a legal obligation (Art. 6(1)(c) GDPR).
          </li>
        </ul>

        <h2>4. Third-Party Services</h2>
        <p>
          We rely on a small number of processors to run the Service. Each is
          bound by a data-processing agreement:
        </p>
        <ul>
          <li>
            <strong>Clerk</strong> — authentication provider. Handles sign-in
            with Google/Apple and stores your profile attributes.{' '}
            <a href="https://clerk.com/privacy" target="_blank" rel="noreferrer">
              Clerk Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Google Maps Platform</strong> — provides map tiles and
            walking-direction routing. Location coordinates for directions are
            sent to Google.{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              Google Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>MongoDB Atlas</strong> — hosts our application database
            (your Clerk user ID and favorites). Data is stored on AWS in
            Frankfurt, Germany (<code>eu-central-1</code>).
          </li>
          <li>
            <strong>Render</strong> — hosts our API servers, deployed in the
            Frankfurt region.
          </li>
          <li>
            <strong>Vercel</strong> — hosts our website and admin dashboard.
          </li>
          <li>
            <strong>Google Cloud Storage</strong> — stores audio and image
            content that we publish (not user-generated content); bucket is
            located in <code>europe-west8</code> (Milan, Italy).
          </li>
          <li>
            <strong>PostHog</strong> — receives the product-analytics
            events described in section 2 and stores them for aggregation.
            We use the EU cloud instance (<code>eu.i.posthog.com</code>),
            which hosts data on infrastructure inside the European Union.{' '}
            <a
              href="https://posthog.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              PostHog Privacy Policy
            </a>
            .
          </li>
        </ul>

        <h2>5. International Transfers</h2>
        <p>
          Your personal data (account record, favorites, and product-
          analytics events) is stored on infrastructure located within the
          European Union — MongoDB Atlas in Frankfurt, Render in Frankfurt,
          and PostHog EU. Published media content is stored on Google
          Cloud in Milan.
        </p>
        <p>
          Some of the processors we rely on are headquartered outside the
          European Economic Area (EEA) — in particular Clerk and Google. Where
          personal data is transferred outside the EEA in connection with those
          services, we rely on the safeguards provided by those processors,
          including Standard Contractual Clauses approved by the European
          Commission and, where applicable, EU-U.S. Data Privacy Framework
          certifications.
        </p>

        <h2>6. How Long We Keep Your Data</h2>
        <ul>
          <li>
            <strong>Account and favorites:</strong> kept for as long as your
            account exists. Delete your account and both are erased immediately.
          </li>
          <li>
            <strong>Technical/server logs:</strong> retained for up to 30 days,
            then discarded, except where a longer period is required to
            investigate a security incident.
          </li>
          <li>
            <strong>Product-analytics events:</strong> retained by PostHog
            for aggregation according to PostHog's default retention (12
            months for events at time of writing). Events are never re-
            identified back to your account by us after collection; they
            are only used in aggregate.
          </li>
        </ul>

        <h2>7. Your Rights</h2>
        <p>Under GDPR and Croatian law, you have the right to:</p>
        <ul>
          <li>access the personal data we hold about you;</li>
          <li>request correction of inaccurate data;</li>
          <li>
            request erasure of your data — you can delete your account and
            associated data yourself from within the app (Profile → Delete
            account);
          </li>
          <li>restrict or object to certain processing;</li>
          <li>
            data portability — request a copy of the data you provided in a
            structured, machine-readable format;
          </li>
          <li>withdraw consent at any time where processing is based on consent;</li>
          <li>
            lodge a complaint with a supervisory authority, in Croatia the{' '}
            <em>Agencija za zaštitu osobnih podataka</em> (AZOP,{' '}
            <a href="https://azop.hr" target="_blank" rel="noreferrer">
              azop.hr
            </a>
            ), or your local authority in another EU member state.
          </li>
        </ul>
        <p>
          To exercise any right, email us at{' '}
          <a href="mailto:hello@guidemeapp.xyz">
            hello@guidemeapp.xyz
          </a>
          . We respond within one month.
        </p>

        <h2>8. Deleting Your Account</h2>
        <p>
          You can delete your account directly from the mobile app: open
          Profile, scroll to “Account”, and choose “Delete account”. This
          permanently deletes your profile record, favorites, and sign-in
          identity. This action cannot be undone.
        </p>

        <h2>9. Children</h2>
        <p>
          The Service is not intended for children under 13. We do not knowingly
          collect personal data from children under 13. If you believe a child
          has provided us with personal data, contact us and we will delete it.
        </p>

        <h2>10. Cookies and Similar Technologies</h2>
        <p>
          The GuideMe website (this site) does not set analytics or
          advertising cookies. The mobile app does not use browser
          cookies. Our authentication provider, Clerk, may set cookies
          necessary for sign-in if you sign in via the web. The mobile
          analytics library (PostHog) stores its pseudonymous device
          identifier in on-device storage (not a browser cookie); this
          identifier is cleared when you sign out or reinstall the app.
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes
          will be communicated through the Service or by updating the effective
          date above. Continued use of the Service after changes take effect
          constitutes acceptance.
        </p>

        <h2>12. Contact</h2>
        <p>
          For any privacy question or to exercise your rights, email us at{' '}
          <a href="mailto:hello@guidemeapp.xyz">
            hello@guidemeapp.xyz
          </a>
          .
        </p>
      </LegalPage>
      <SiteFooter />
    </main>
  )
}
