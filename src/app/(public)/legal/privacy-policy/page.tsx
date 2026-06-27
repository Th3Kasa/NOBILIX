import type { Metadata } from "next";
import { NobilixLegalShell } from "@/app/(public)/legal/_shell/nobilix-legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — Nobilix Pty Ltd",
  description:
    "How Nobilix Pty Ltd collects, uses, and protects personal information across its website, products, and services.",
  alternates: { canonical: "/legal/privacy-policy" },
};

const LAST_UPDATED = "2026-06-27";

export default function NobilixPrivacyPolicyPage() {
  return (
    <NobilixLegalShell title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <section id="introduction">
        <h2>Introduction</h2>
        <p>
          Nobilix Pty Ltd (ABN pending) (<strong>"Nobilix"</strong>,{" "}
          <strong>"we"</strong>, <strong>"us"</strong>, <strong>"our"</strong>)
          is a game development studio incorporated in New South Wales,
          Australia. We operate the nobilix.com website, the TrapMan mobile
          game, and associated developer tools.
        </p>
        <p>
          This Privacy Policy explains what personal information we collect,
          why we collect it, how we use it, and your rights under the{" "}
          <em>Privacy Act 1988 (Cth)</em> and the Australian Privacy Principles
          (APPs).
        </p>
        <p>
          By accessing our website or using our services, you acknowledge that
          you have read and understood this policy.
        </p>
      </section>

      <section id="what-we-collect">
        <h2>What We Collect</h2>
        <p>
          We collect only the minimum personal information necessary to operate
          our services. The information we collect depends on how you interact
          with Nobilix:
        </p>
        <h3>Website visitors</h3>
        <p>
          When you browse nobilix.com, no personally identifiable information
          is collected beyond standard server logs (IP address, browser type,
          page visited, timestamp). Server logs are retained for up to 90 days
          for security and debugging purposes and are not used for marketing.
        </p>
        <h3>Contact enquiries</h3>
        <p>
          If you contact us by email, we collect your email address and any
          personal information you include in your message. This information is
          used solely to respond to your enquiry and is not used for marketing
          without your separate consent.
        </p>
        <h3>Console and developer access</h3>
        <p>
          Authorised Nobilix staff and contractors who access the internal
          developer console are required to register with a verified email
          address and multi-factor authentication. We collect and retain email
          addresses and audit logs of console activity (action taken, timestamp,
          account identifier) for security and accountability purposes.
        </p>
        <h3>TrapMan game data</h3>
        <p>
          Personal data collected in connection with the TrapMan mobile game is
          covered by the separate{" "}
          <a href="/trapman/privacy-policy">TrapMan Privacy Policy</a>.
          That policy governs player accounts, gameplay data, and in-app
          purchases.
        </p>
      </section>

      <section id="how-we-use">
        <h2>How We Use Your Information</h2>
        <p>We use collected personal information to:</p>
        <ul>
          <li>Respond to enquiries and provide requested services</li>
          <li>
            Maintain the security and integrity of our systems (audit logs,
            intrusion detection)
          </li>
          <li>
            Comply with legal obligations under Australian law, including tax
            and financial record-keeping requirements
          </li>
          <li>
            Investigate and resolve disputes or complaints relating to our
            services
          </li>
        </ul>
        <p>
          We do not sell, rent, or trade personal information with third
          parties. We do not use personal information collected on nobilix.com
          for targeted advertising.
        </p>
      </section>

      <section id="disclosure">
        <h2>Disclosure to Third Parties</h2>
        <p>
          We may disclose your personal information to third parties only in the
          following circumstances:
        </p>
        <ul>
          <li>
            <strong>Service providers:</strong> cloud infrastructure providers
            (hosting, authentication) engaged to operate our systems, bound by
            confidentiality obligations.
          </li>
          <li>
            <strong>Legal compliance:</strong> where required or authorised by
            Australian law, a court order, or a regulatory authority.
          </li>
          <li>
            <strong>Business transfers:</strong> in the event of a merger,
            acquisition, or sale of all or part of our business, personal
            information may be transferred to the acquiring entity subject to
            equivalent privacy protections.
          </li>
        </ul>
        <p>
          Where we engage overseas service providers (for example, cloud
          services with servers outside Australia), we take reasonable steps to
          ensure those providers handle personal information in a manner
          consistent with the Australian Privacy Principles.
        </p>
      </section>

      <section id="data-security">
        <h2>Data Security</h2>
        <p>
          We implement industry-standard technical and organisational measures
          to protect personal information from unauthorised access, disclosure,
          alteration, and destruction. These measures include encrypted
          connections (HTTPS), multi-factor authentication for system access,
          and access controls limiting internal visibility to need-to-know
          personnel.
        </p>
        <p>
          No transmission of data over the internet is entirely secure. If you
          believe your personal information has been compromised, contact us
          immediately at{" "}
          <a href="mailto:support@nobilix.com">support@nobilix.com</a>.
        </p>
      </section>

      <section id="your-rights">
        <h2>Your Rights</h2>
        <p>
          Under the Australian Privacy Principles, you have the right to:
        </p>
        <ul>
          <li>
            <strong>Access</strong> the personal information we hold about you
          </li>
          <li>
            <strong>Correct</strong> inaccurate, incomplete, or outdated
            personal information
          </li>
          <li>
            <strong>Request deletion</strong> of personal information we no
            longer have a legal obligation or legitimate business purpose to
            retain
          </li>
          <li>
            <strong>Complain</strong> about our handling of your personal
            information to the Office of the Australian Information Commissioner
            (OAIC) at{" "}
            <a
              href="https://www.oaic.gov.au"
              target="_blank"
              rel="noopener noreferrer"
            >
              oaic.gov.au
            </a>
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:legal@nobilix.com">legal@nobilix.com</a>. We will
          respond within 30 days.
        </p>
      </section>

      <section id="retention">
        <h2>Data Retention</h2>
        <p>
          We retain personal information only for as long as necessary to fulfil
          the purpose for which it was collected, or as required by law:
        </p>
        <ul>
          <li>
            Contact enquiry emails: retained for up to 2 years or until the
            matter is resolved
          </li>
          <li>
            Console audit logs: retained for up to 7 years for security and
            compliance purposes
          </li>
          <li>
            Server access logs: retained for up to 90 days
          </li>
        </ul>
        <p>
          When personal information is no longer required, we delete or
          anonymise it in accordance with our internal data lifecycle procedures.
        </p>
      </section>

      <section id="cookies">
        <h2>Cookies and Tracking</h2>
        <p>
          The nobilix.com website uses only technically necessary cookies
          required for the website to function (for example, session state for
          authenticated users). We do not use tracking cookies, advertising
          cookies, or third-party analytics that identify individual visitors on
          this website.
        </p>
      </section>

      <section id="children">
        <h2>Children&apos;s Privacy</h2>
        <p>
          The nobilix.com website and developer console are intended for adults
          and verified Nobilix staff only. We do not knowingly collect personal
          information from children under 13 on this website.
        </p>
        <p>
          For information about how TrapMan handles children&apos;s privacy in
          the context of the mobile game, see the{" "}
          <a href="/trapman/privacy-policy">TrapMan Privacy Policy</a>.
        </p>
      </section>

      <section id="changes">
        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or applicable law. Material changes will be posted on
          this page with an updated "Last updated" date. We encourage you to
          review this policy periodically.
        </p>
      </section>

      <section id="contact">
        <h2>Contact Us</h2>
        <p>
          For privacy enquiries, access requests, or complaints, contact:
        </p>
        <address className="nobilix-legal-address">
          <strong>Nobilix Pty Ltd</strong>
          <br />
          New South Wales, Australia
          <br />
          <a href="mailto:legal@nobilix.com">legal@nobilix.com</a>
          <br />
          <a href="mailto:support@nobilix.com">support@nobilix.com</a>
        </address>
      </section>
    </NobilixLegalShell>
  );
}
