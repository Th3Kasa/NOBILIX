import type { Metadata } from "next";
import "@/styles/trapman-tokens.css";
import "./trapman.css";

export const metadata: Metadata = {
  title: { template: "%s · TrapMan Legal", default: "TrapMan Legal" },
};

export default function TrapManLayout({ children }: { children: React.ReactNode }) {
  return <div className="trapman-site">{children}</div>;
}
