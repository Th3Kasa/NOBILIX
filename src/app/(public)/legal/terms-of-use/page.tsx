import type { Metadata } from "next";
import { NobilixLegalShell } from "@/app/(public)/legal/_shell/nobilix-legal-shell";

export const metadata: Metadata = {
  title: "Terms of Use — Nobilix Pty Ltd",
  description:
    "Terms governing access to and use of the Nobilix website, products, and developer console.",
  alternates: { canonical: "/legal/terms-of-use" },
};

const LAST_UPDATED = "2026-07-06";

export default function NobilixTermsOfUsePage() {
  return (
    <NobilixLegalShell
      title="Terms of Use"
      lastUpdated={LAST_UPDATED}
      currentPath="/legal/terms-of-use"
    >
      <section id="acceptance">
        <h2>Acceptance of Terms</h2>
        <p>
          By accessing or using any Nobilix Pty Ltd website, product, or
          service (collectively, the <strong>“Services”</strong>), you agree to
          be bound by these Terms of Use (the <strong>“Terms”</strong>). If you
          do not agree to these Terms, do not access or use the Services.
        </p>
        <p>
          These Terms apply to nobilix.com, the Nobilix developer console, and
          any other digital properties operated by Nobilix Pty Ltd. The TrapMan
          mobile game is governed by the separate{" "}
          <a href="/trapman/terms-of-use">TrapMan Terms of Use</a>.
        </p>
      </section>

      <section id="about">
        <h2>About Nobilix</h2>
        <p>
          Nobilix Pty Ltd is an independent technology studio incorporated in
          New South Wales, Australia. We build and publish products around
          people — including the TrapMan mobile game — and operate the
          associated developer infrastructure.
        </p>
      </section>

      <section id="permitted-use">
        <h2>Permitted Use</h2>
        <p>
          You may access and browse nobilix.com for lawful personal or
          informational purposes. You must not:
        </p>
        <ul>
          <li>
            Use the Services in any way that violates applicable law or
            regulation
          </li>
          <li>
            Attempt to gain unauthorised access to our systems, the developer
            console, or any accounts that do not belong to you
          </li>
          <li>
            Use automated tools (scrapers, bots, crawlers) to extract content
            from nobilix.com without our prior written consent
          </li>
          <li>
            Reproduce, distribute, or create derivative works from Nobilix
            content without authorisation (see Intellectual Property below)
          </li>
          <li>
            Transmit any harmful, malicious, or offensive material through our
            Services or contact channels
          </li>
        </ul>
      </section>

      <section id="console-access">
        <h2>Developer Console Access</h2>
        <p>
          Access to the Nobilix developer console is strictly limited to
          authorised Nobilix staff and approved contractors. Unauthorised access
          attempts are prohibited and may constitute a criminal offence under the{" "}
          <em>Criminal Code Act 1995 (Cth)</em> (Division 477 — Unauthorised
          Access to Computer Systems) and other applicable law.
        </p>
        <p>
          Authorised users must keep credentials confidential, enable
          multi-factor authentication, and immediately report any suspected
          compromise to{" "}
          <a href="mailto:help.nobilix@outlook.com">help.nobilix@outlook.com</a>.
        </p>
      </section>

      <section id="intellectual-property">
        <h2>Intellectual Property</h2>
        <p>
          All content on nobilix.com, including but not limited to text,
          graphics, logos, images, video, music, software, and the overall
          appearance and layout of the website, is owned by or licensed to
          Nobilix Pty Ltd and is protected by Australian and international
          intellectual property law.
        </p>
        <p>
          The Nobilix name, logo, and all product names including TrapMan are
          trademarks of Nobilix Pty Ltd. You must not use them without prior
          written permission.
        </p>
        <p>
          Nothing in these Terms grants you a licence to Nobilix intellectual
          property, except the limited right to access and use the website for
          the purposes permitted by these Terms.
        </p>
      </section>

      <section id="links">
        <h2>Third-Party Links</h2>
        <p>
          Our website may contain links to third-party websites or services that
          are not owned or controlled by Nobilix. We have no control over and
          accept no responsibility for the content, privacy policies, or
          practices of any third-party sites. We encourage you to review the
          terms and privacy policies of any third-party sites you visit.
        </p>
      </section>

      <section id="disclaimers">
        <h2>Disclaimers</h2>
        <p>
          The Services are provided on an <strong>“as is”</strong> and{" "}
          <strong>“as available”</strong> basis. To the maximum extent permitted
          by law, Nobilix makes no representations or warranties of any kind,
          express or implied, regarding the operation or availability of the
          Services, or the accuracy or completeness of any content.
        </p>
        <p>
          Nobilix does not warrant that the Services will be uninterrupted,
          error-free, or free from viruses or other harmful components.
        </p>
      </section>

      <section id="liability">
        <h2>Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law (including the{" "}
          <em>Australian Consumer Law</em> in Schedule 2 of the{" "}
          <em>Competition and Consumer Act 2010 (Cth)</em>), Nobilix Pty Ltd,
          its directors, employees, and contractors will not be liable for any
          indirect, incidental, special, consequential, or punitive damages,
          loss of profits, loss of data, or loss of goodwill arising out of or
          in connection with your use of, or inability to use, the Services.
        </p>
        <p>
          Where the Australian Consumer Law applies and cannot be excluded,
          Nobilix&apos;s liability is limited, at Nobilix&apos;s option, to:
          re-supplying the relevant service; or paying the cost of having the
          service re-supplied.
        </p>
      </section>

      <section id="australian-consumer-law">
        <h2>Australian Consumer Law</h2>
        <p>
          Nothing in these Terms excludes, restricts, or modifies any right or
          remedy, or any guarantee, warranty, or other term or condition,
          implied or imposed by the <em>Australian Consumer Law</em> that cannot
          lawfully be excluded or limited. If you are a consumer as defined in
          that legislation, you may have statutory guarantees that apply to the
          Services that cannot be excluded.
        </p>
      </section>

      <section id="indemnification">
        <h2>Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless Nobilix Pty Ltd and
          its officers, directors, employees, and agents from and against any
          claims, liabilities, damages, losses, and expenses (including
          reasonable legal fees) arising out of or in any way connected with
          your access to or use of the Services in breach of these Terms.
        </p>
      </section>

      <section id="governing-law">
        <h2>Governing Law and Jurisdiction</h2>
        <p>
          These Terms are governed by the laws of New South Wales, Australia,
          without regard to conflict-of-law provisions. You irrevocably submit
          to the exclusive jurisdiction of the courts of New South Wales and the
          Federal Court of Australia for the resolution of any dispute arising
          out of or in connection with these Terms.
        </p>
      </section>

      <section id="changes">
        <h2>Changes to These Terms</h2>
        <p>
          We reserve the right to update or revise these Terms at any time.
          Material changes will be posted on this page with an updated “Last
          updated” date. Your continued use of the Services after any change
          constitutes acceptance of the revised Terms. If you do not agree to
          the revised Terms, you must stop using the Services.
        </p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>
          Questions about these Terms should be directed to:
        </p>
        <address className="nobilix-legal-address">
          <strong>Nobilix Pty Ltd</strong>
          <br />
          New South Wales, Australia
          <br />
          <a href="mailto:help.nobilix@outlook.com">help.nobilix@outlook.com</a>
        </address>
      </section>
    </NobilixLegalShell>
  );
}
