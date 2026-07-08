import type { Metadata } from "next";
import { LegalShell } from "@/app/(public)/trapman/_legal/legal-shell";
import {
  COMPLIANCE_SECTIONS,
  COMPLIANCE_LAST_UPDATED,
  TRAPMAN_DATA_INVENTORY,
  REQUIRES_ENGINEERING_VERIFICATION,
} from "@/content/trapman/compliance";

export const metadata: Metadata = {
  title: "Data & Compliance — TrapMan",
  description:
    "Technical data inventory and compliance information for TrapMan by Nobilix.",
  alternates: { canonical: "/trapman/data-compliance" },
};

export default function TrapManDataCompliancePage() {
  return (
    <LegalShell
      title="Data & Compliance"
      lastUpdated={COMPLIANCE_LAST_UPDATED}
      currentPath="/trapman/data-compliance"
    >
      <section id="overview">
        <h2>{COMPLIANCE_SECTIONS.overview.heading}</h2>
        <p className="legal-preline">{COMPLIANCE_SECTIONS.overview.body}</p>
      </section>

      <section id="confirmed-data">
        <h2>Confirmed Collected Data</h2>
        <p>
          The following data categories have been confirmed by engineering
          review:
        </p>

        <div
          className="legal-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="TrapMan confirmed data inventory table, scrolls sideways"
        >
          <table className="legal-data-table legal-data-table--full">
            <caption>TrapMan confirmed data inventory</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">System</th>
                <th scope="col">Location</th>
                <th scope="col">Purpose</th>
                <th scope="col">Deletable</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {TRAPMAN_DATA_INVENTORY.map((entry) => (
                <tr key={entry.key}>
                  <td>
                    <code>{entry.label}</code>
                  </td>
                  <td>{entry.system}</td>
                  <td>
                    <code>{entry.location}</code>
                  </td>
                  <td>{entry.purpose}</td>
                  <td>{entry.deletable ? "Yes" : "Partial"}</td>
                  <td>{"deletionNote" in entry ? entry.deletionNote : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="legal-table-hint" aria-hidden="true">
          Scroll the table sideways to see every column.
        </p>
      </section>

      <section id="under-verification">
        <h2>{COMPLIANCE_SECTIONS.verificationNotice.heading}</h2>
        <p className="legal-preline">{COMPLIANCE_SECTIONS.verificationNotice.body}</p>

        <ul className="legal-unverified-list">
          {REQUIRES_ENGINEERING_VERIFICATION.map((item) => (
            <li key={item} className="legal-unverified-item">
              <span className="legal-unverified-badge">
                Under engineering verification; not claimed as collected until
                confirmed.
              </span>{" "}
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section id="deletion">
        <h2>{COMPLIANCE_SECTIONS.deletionRights.heading}</h2>
        <p className="legal-preline">
          {COMPLIANCE_SECTIONS.deletionRights.body}
        </p>
      </section>

    </LegalShell>
  );
}
