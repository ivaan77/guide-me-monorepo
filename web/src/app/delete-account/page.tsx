import type { Metadata } from 'next'
import { SiteHeader } from '../_components/SiteHeader'
import { SiteFooter } from '../_components/SiteFooter'
import { LegalPage } from '../_components/LegalPage'

export const metadata: Metadata = {
  title: 'Delete Your Account — HeyLocal',
  description:
    'How to delete your HeyLocal account and what happens to your data. Delete in-app from Profile, or request deletion by email.',
}

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <LegalPage title="Delete Your Account" effectiveDate="27 November 2026">
        <p>
          You can delete your HeyLocal account at any time. This page explains
          how, and exactly what is removed.
        </p>

        <h2>Option 1 — Delete in the app (immediate)</h2>
        <p>
          Deletion is built into the HeyLocal app and takes effect right away:
        </p>
        <ul>
          <li>Open the HeyLocal app and go to the <strong>Profile</strong> tab.</li>
          <li>Scroll down to the <strong>Account</strong> section.</li>
          <li>Tap <strong>Delete account</strong>.</li>
          <li>Confirm when prompted.</li>
        </ul>
        <p>
          Your account and data are deleted immediately. The action cannot be
          undone.
        </p>

        <h2>Option 2 — Request deletion by email</h2>
        <p>
          If you cannot access the app — for example you have uninstalled it or
          lost access to your Google or Apple sign-in — email{' '}
          <a href="mailto:hello@heylocal.xyz">hello@heylocal.xyz</a> from the
          address associated with your account and ask us to delete it.
        </p>
        <p>
          We verify that the request comes from the account holder, then delete
          the account. We respond within one month, as required under GDPR.
        </p>

        <h2>What is deleted</h2>
        <ul>
          <li>
            <strong>Your profile record</strong> — the user document we store,
            including your Clerk user ID.
          </li>
          <li>
            <strong>Your favorites</strong> — every city, tour, place, and
            sub-stop you saved.
          </li>
          <li>
            <strong>Your sign-in identity</strong> — the account held by our
            authentication provider, Clerk, including the name and email address
            received from Google or Apple.
          </li>
        </ul>

        <h2>What is retained</h2>
        <ul>
          <li>
            <strong>Ratings you submitted are anonymized, not removed.</strong>{' '}
            The link between a rating and your identity is severed, so the
            rating can no longer be traced back to you, but the score stays
            counted in the public average for that city, tour, or place. Once
            anonymized, a rating cannot be attributed to you or retrieved.
          </li>
          <li>
            <strong>Aggregated analytics.</strong> Usage events are collected
            without your email address and are not linked to a recoverable
            identity after deletion.
          </li>
        </ul>
        <p>
          We keep anonymized ratings so that removing one account does not
          distort the public ratings other travellers rely on. This data no
          longer constitutes personal data, as it can no longer be associated
          with you.
        </p>

        <h2>Retention period</h2>
        <p>
          Deletion is immediate rather than scheduled — there is no grace period
          and no backup copy retained for later restoration. Once you confirm,
          the data described above is gone.
        </p>

        <h2>Questions</h2>
        <p>
          Contact <a href="mailto:hello@heylocal.xyz">hello@heylocal.xyz</a>.
          For full detail on what we collect and why, see our{' '}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </LegalPage>
      <SiteFooter />
    </main>
  )
}
