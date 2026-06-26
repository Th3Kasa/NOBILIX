import type { Metadata } from "next";
import { LegalShell } from "@/app/(public)/trapman/_legal/legal-shell";
import {
  PRIVACY_SECTIONS,
  PRIVACY_POLICY_LAST_UPDATED,
  TRAPMAN_DATA_INVENTORY,
  REQUIRES_ENGINEERING_VERIFICATION,
} from "@/content/trapman/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy — TrapMan",
  description:
    "How Nobilix collects, uses, and protects your personal information when you play TrapMan.",
  alternates: { canonical: "/trapman/privacy-policy" },
};

export default function TrapManPrivacyPolicyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      lastUpdated={PRIVACY_POLICY_LAST_UPDATED}
    >
      <section id="introduction">
        <h2>{PRIVACY_SECTIONS.introduction.heading}</h2>
        <p>{PRIVACY_SECTIONS.introduction.body}</p>
      </section>

      <section id="what-we-collect">
        <h2>{PRIVACY_SECTIONS.dataWeCollect.heading}</h2>
        <p>{PRIVACY_SECTIONS.dataWeCollect.body}</p>

        <table className="legal-data-table">
          <caption>Confirmed collected data</caption>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">System</th>
              <th scope="col">Location</th>
              <th scope="col">Purpose</th>
              <th scope="col">Deletable</th>
            </tr>
          </thead>
          <tbody>
            {TRAPMAN_DATA_INVENTORY.map((entry) => (
              <tr key={entry.key}>
                <td>{entry.label}</td>
                <td>{entry.system}</td>
                <td>
                  <code>{entry.location}</code>
                </td>
                <td>{entry.purpose}</td>
                <td>
                  {entry.deletable ? "Yes" : "Partial"}
                  {"deletionNote" in entry && entry.deletionNote && (
                    <span className="legal-deletion-note">
                      {" "}
                      {entry.deletionNote}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <aside className="legal-analytics-note">
          <p>{PRIVACY_SECTIONS.dataWeCollect.notes.analytics}</p>
          <p>{PRIVACY_SECTIONS.dataWeCollect.notes.adClosed}</p>
        </aside>
      </section>

      <section id="unverified-data">
        <h2>{PRIVACY_SECTIONS.unverifiedData.heading}</h2>
        <p>{PRIVACY_SECTIONS.unverifiedData.body}</p>
        <ul>
          {REQUIRES_ENGINEERING_VERIFICATION.map((item) => (
            <li key={item}>
              <em>Under engineering verification:</em> {item}
            </li>
          ))}
        </ul>
      </section>

      <section id="age-policy">
        <h2>{PRIVACY_SECTIONS.childrenPolicy.heading}</h2>
        <p>{PRIVACY_SECTIONS.childrenPolicy.body}</p>
      </section>

      <section id="retention">
        <h2>{PRIVACY_SECTIONS.dataRetention.heading}</h2>
        <p>{PRIVACY_SECTIONS.dataRetention.body}</p>
      </section>

      <section id="your-rights">
        <h2>{PRIVACY_SECTIONS.yourRights.heading}</h2>
        <p>{PRIVACY_SECTIONS.yourRights.body}</p>
      </section>

      <section id="contact">
        <h2>{PRIVACY_SECTIONS.contact.heading}</h2>
        <p>{PRIVACY_SECTIONS.contact.body}</p>
      </section>
    </LegalShell>
  );
}
