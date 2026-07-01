import Image from "next/image";
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
            <div className="trapman-account-cta__plate" aria-hidden="true">
              <Image
                src="/assets/generated/trapman/account-cta-plate.webp"
                alt=""
                width={1536}
                height={864}
                sizes="(max-width: 900px) 100vw, 60vw"
              />
            </div>
            <div className="trapman-account-cta__copy">
              <p className="trapman-kicker">Player account</p>
              <h2>Your run continues online.</h2>
              <p>Track progression and manage your TrapMan account from a mobile-friendly player surface.</p>
              <div className="trapman-cta-links">
                <Link href="/trapman/account" className="trapman-btn trapman-btn--primary">Track my progression</Link>
              </div>
            </div>
          </section>
        </Reveal>
        <Reveal>
          <section id="support" className="trapman-story-section trapman-support">
            <div className="trapman-support__plate" aria-hidden="true">
              <Image
                src="/assets/generated/trapman/support-plate.webp"
                alt=""
                width={1536}
                height={864}
                sizes="(max-width: 900px) 100vw, 60vw"
              />
            </div>
            <div className="trapman-support__copy">
              <p className="trapman-kicker">Support</p>
              <h2>Clear paths for players and parents.</h2>
              <p className="trapman-support__desc">Questions, data requests, or account issues — we&apos;re reachable at <a href="mailto:help.nobilix@outlook.com">help.nobilix@outlook.com</a></p>
              <div className="trapman-support__links">
                <Link href="/trapman/privacy-policy" className="trapman-btn">Privacy policy</Link>
                <Link href="/trapman/terms-of-use" className="trapman-btn">Terms of use</Link>
                <Link href="/trapman/data-compliance" className="trapman-btn">Data &amp; compliance</Link>
                <Link href="/trapman/delete-account" className="trapman-btn trapman-btn--danger">Delete account</Link>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </>
  );
}
