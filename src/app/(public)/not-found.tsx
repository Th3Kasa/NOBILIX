import Link from "next/link";

export default function PublicNotFound() {
  return (
    <section className="public-not-found">
      <p>404</p>
      <h1>This world does not exist.</h1>
      <Link href="/">Return to Nobilix</Link>
    </section>
  );
}
