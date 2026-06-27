import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { CharacterShowcase } from "@/components/trapman/character-showcase";
import { CityHero } from "@/components/trapman/city-hero";
import { GameplayGallery } from "@/components/trapman/gameplay-gallery";
import { LeaderboardPreview } from "@/components/trapman/leaderboard-preview";
import { MusicStrip } from "@/components/trapman/music-strip";
import { ShopShowcase } from "@/components/trapman/shop-showcase";
import { TrapManHeader } from "@/components/trapman/trapman-header";
import { WorldSystem } from "@/components/trapman/world-system";

export default function TrapManPage() {
  return (
    <>
      <TrapManHeader />
      <div id="trapman-main">
        <section id="trapman-hero" aria-labelledby="trapman-title">
          <CityHero />
        </section>
        <Reveal>
          <section id="the-run" className="trapman-story-section trapman-run-section">
            <p className="trapman-kicker">Pixel soul. Premium stage.</p>
            <h2>A neon city runner built for the streets.</h2>
            <p>
              TrapMan is the endless pixel sprint through Sydney underground —
              a ranked mobile game where every run is a personal best waiting
              to be broken.
            </p>
            <GameplayGallery />
          </section>
        </Reveal>
        <Reveal>
          <section id="characters" className="trapman-story-section">
            <p className="trapman-kicker">Runner roster</p>
            <h2>Pick your runner. Own your style.</h2>
            <CharacterShowcase />
          </section>
        </Reveal>
        <Reveal>
          <section id="world" className="trapman-story-section">
            <WorldSystem />
          </section>
        </Reveal>
        <Reveal>
          <section id="music" className="trapman-story-section">
            <p className="trapman-kicker">Music culture</p>
            <h2>Move through a city that pulses like a track.</h2>
            <MusicStrip />
          </section>
        </Reveal>
        <Reveal>
          <section id="shop" className="trapman-story-section">
            <ShopShowcase />
          </section>
        </Reveal>
        <Reveal>
          <section id="leaderboard" className="trapman-story-section">
            <p className="trapman-kicker">Ranked runs</p>
            <h2>Own the leaderboard.</h2>
            <LeaderboardPreview />
          </section>
        </Reveal>
        <Reveal>
          <section id="account" className="trapman-story-section trapman-account-cta">
            <p className="trapman-kicker">Player account</p>
            <h2>Your run continues online.</h2>
            <p>Track progression and manage your TrapMan account from a mobile-friendly player surface.</p>
            <Link href="/trapman/account">Track my progression</Link>
          </section>
        </Reveal>
        <Reveal>
          <section id="support" className="trapman-story-section trapman-support">
            <p className="trapman-kicker">Support</p>
            <h2>Clear paths for players and parents.</h2>
            <Link href="/trapman/privacy-policy">Privacy</Link>
            <Link href="/trapman/data-compliance">Data &amp; compliance</Link>
            <Link href="/trapman/delete-account">Delete account</Link>
          </section>
        </Reveal>
      </div>
    </>
  );
}
