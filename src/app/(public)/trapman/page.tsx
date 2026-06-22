import { TrapManHeader } from "@/components/trapman/trapman-header";
import { CityHero } from "@/components/trapman/city-hero";
import { GameplayGallery } from "@/components/trapman/gameplay-gallery";
import { CharacterShowcase } from "@/components/trapman/character-showcase";
import { MusicStrip } from "@/components/trapman/music-strip";
import { LeaderboardPreview } from "@/components/trapman/leaderboard-preview";
import { RevealObserver } from "@/components/trapman/reveal-observer";

export default function TrapManPage() {
  return (
    <>
      <a className="skip-link" href="#trapman-main">Skip to content</a>
      <TrapManHeader />
      <main id="trapman-main">
        <RevealObserver />
        <CityHero />
        <section id="the-run" className="reveal"><h2>Run the city</h2><GameplayGallery /></section>
        <section id="characters" className="reveal"><h2>Choose your runner</h2><CharacterShowcase /></section>
        <section id="music" className="reveal"><h2>Move to the beat</h2><MusicStrip /></section>
        <section id="leaderboard" className="reveal"><h2>Own the leaderboard</h2><LeaderboardPreview /></section>
        <section id="account" className="reveal"><h2>Your run continues online</h2><a href="/trapman/account">Track my progression</a></section>
        <section id="support" className="reveal"><h2>Player support</h2><a href="/trapman/privacy-policy">Privacy</a><a href="/trapman/delete-account">Delete account</a></section>
      </main>
    </>
  );
}
