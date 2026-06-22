import Image from "next/image";
import Link from "next/link";

export function TrapManHeader() {
  return (
    <header className="trapman-header">
      <Link href="/trapman" aria-label="TrapMan home">
        <Image src="/assets/trapman-logo.png" alt="" width={56} height={56} priority />
        <span>TRAPMAN</span>
      </Link>
      <nav aria-label="TrapMan navigation">
        <Link href="/trapman#the-run">The Run</Link>
        <Link href="/trapman#characters">Characters</Link>
        <Link href="/trapman#leaderboard">Leaderboard</Link>
        <Link href="/trapman/account">My Account</Link>
      </nav>
    </header>
  );
}
