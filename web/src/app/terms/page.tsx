import type { Metadata } from 'next'
import { SiteHeader } from '../_components/SiteHeader'
import { SiteFooter } from '../_components/SiteFooter'
import { LegalPage } from '../_components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service — GuideMe',
  description:
    'The terms under which GuideMe provides its audio-guided city tour app and website.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <LegalPage title="Terms of Service" effectiveDate="8 July 2026">
        <p>
          These Terms of Service (“<strong>Terms</strong>”) govern your use of the
          GuideMe mobile app, website, and related services (together, the “
          <strong>Service</strong>”) provided by <strong>Ivan Bošnjaković</strong>,
          Kalnička 15, 10000 Zagreb, Croatia, operating under the trade name
          “GuideMe” (“<strong>we</strong>”, “<strong>us</strong>”, “
          <strong>our</strong>”). By using the Service you agree to these Terms.
          If you do not agree, do not use the Service.
        </p>

        <h2>1. The Service</h2>
        <p>
          GuideMe offers audio-guided walking tours and curated recommendations
          (restaurants, cafés, shops, points of interest). Content is created and
          curated by us. The Service is provided on an “as-is” and “as-available”
          basis; features may be added, changed, or removed at any time.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 13 years old to use the Service. If you are between
          13 and the age of majority in your country, you may use the Service only
          with the involvement of a parent or legal guardian who agrees to these
          Terms on your behalf.
        </p>

        <h2>3. Accounts</h2>
        <p>
          You can sign in using a third-party identity provider (currently Google
          or Apple) via our authentication provider, Clerk. You are responsible
          for keeping your sign-in credentials secure and for activity on your
          account. Notify us promptly at{' '}
          <a href="mailto:hello@guidemeapp.xyz">
            hello@guidemeapp.xyz
          </a>{' '}
          if you suspect unauthorized use.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service for any unlawful purpose or in violation of these Terms;</li>
          <li>
            attempt to access, tamper with, or reverse-engineer parts of the
            Service not intended for you;
          </li>
          <li>
            copy, redistribute, or commercially exploit our content (audio, text,
            imagery, curated lists) without our written permission;
          </li>
          <li>
            interfere with or disrupt the Service, its servers, or the networks it
            runs on;
          </li>
          <li>use automated means to scrape or bulk-download content.</li>
        </ul>

        <h2>5. Your Content</h2>
        <p>
          The Service lets you save items (cities, tours, places, sub-stops) as
          favorites. These lists are personal to your account. You retain any
          rights to items you save; by saving them you grant us a limited licence
          to store and display them to you across your devices.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          All content in the Service (including audio narration, imagery, text,
          maps overlays, curated lists, logos, and design) is owned by us or
          licensed to us and is protected by copyright and other intellectual-
          property laws. You are granted a personal, non-transferable,
          non-exclusive, revocable licence to use the Service for personal,
          non-commercial purposes.
        </p>

        <h2>7. Third-Party Services</h2>
        <p>
          The Service integrates third-party services, including Clerk
          (authentication) and Google Maps (mapping and walking directions). Your
          use of those integrations is also subject to their respective terms.
          We are not responsible for third-party services or content.
        </p>

        <h2>8. Location and Directions</h2>
        <p>
          The Service uses your device location (with your permission) to centre
          the map, compute walking directions, and improve your tour experience.
          Location is processed on your device and not stored on our servers.
          Walking-direction requests may be sent to Google Maps for routing.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          The Service is provided “as is” without warranties of any kind, whether
          express or implied. We do not warrant that curated information,
          opening hours, prices, or points of interest are accurate, complete, or
          current. Use good judgement when following directions and be aware of
          your surroundings — do not rely on the Service in a way that risks your
          safety.
        </p>

        <h2>10. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any
          indirect, incidental, consequential, special, or punitive damages, or
          for loss of profits or data, arising out of or in connection with your
          use of the Service. Nothing in these Terms limits liability that
          cannot be limited under applicable law, including your statutory rights
          as a consumer under EU and Croatian law.
        </p>

        <h2>11. Termination</h2>
        <p>
          You may stop using the Service at any time and delete your account from
          within the app (Profile → Delete account). We may suspend or terminate
          your access if you breach these Terms or if we discontinue the Service.
        </p>

        <h2>12. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will be
          communicated through the Service or by updating the effective date at
          the top of this page. Continued use of the Service after changes take
          effect constitutes acceptance of the updated Terms.
        </p>

        <h2>13. Governing Law and Disputes</h2>
        <p>
          These Terms are governed by the laws of the Republic of Croatia. The
          courts of Croatia have jurisdiction over any dispute arising from or
          related to these Terms, unless mandatory consumer-protection law grants
          you the right to bring the dispute in your country of residence within
          the EU.
        </p>

        <h2>14. Contact</h2>
        <p>
          Questions about these Terms? Email us at{' '}
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
