import type { Metadata } from "next";
import "./trapman.css";

export const metadata: Metadata = {
  title: "TrapMan",
  description: "Run the neon city, climb the leaderboard, and own the night.",
  alternates: { canonical: "/trapman" },
  openGraph: { title: "TrapMan by Nobilix", url: "/trapman", type: "website" },
};

export default function TrapManLayout({ children }: { children: React.ReactNode }) {
  return <div className="trapman-site">{children}</div>;
}
