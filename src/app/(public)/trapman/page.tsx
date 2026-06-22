import { TrapManHeader } from "@/components/trapman/trapman-header";
import { CityHero } from "@/components/trapman/city-hero";
import { GameplayGallery } from "@/components/trapman/gameplay-gallery";
import { CharacterShowcase } from "@/components/trapman/character-showcase";
import { MusicStrip } from "@/components/trapman/music-strip";
import { LeaderboardPreview } from "@/components/trapman/leaderboard-preview";

export default function TrapManPage() {
  return (
    <>
      <TrapManHeader />
      <main id="trapman-main">
        <CityHero />
        <section id="the-run"><h2>Run the city</h2><GameplayGallery /></section>
        <section id="characters"><h2>Choose your runner</h2><CharacterShowcase /></section>
        <section id="music"><h2>Move to the beat</h2><MusicStrip /></section>
        <section id="leaderboard"><h2>Own the leaderboard</h2><LeaderboardPreview /></section>
        <section id="account"><h2>Your run continues online</h2><a href="/trapman/account">Track my progression</a></section>
        <section id="support"><h2>Player support</h2><a href="/trapman/privacy-policy">Privacy</a><a href="/trapman/delete-account">Delete account</a></section>
      </main>
    </>
  );
}
