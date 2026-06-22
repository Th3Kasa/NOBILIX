import { existsSync } from "node:fs";
import { join } from "node:path";

function hasAudioFile(): boolean {
  try {
    return existsSync(join(process.cwd(), "public/assets/trapman/music-preview.mp3"));
  } catch {
    return false;
  }
}

export function MusicStrip() {
  const audioAvailable = hasAudioFile();

  return (
    <div className="music-strip">
      <div className="music-waveform" aria-hidden="true">
        {Array.from({ length: 32 }, (_, i) => (
          <span key={i} className="music-bar" style={{ "--bar-i": i } as React.CSSProperties} />
        ))}
      </div>
      {audioAvailable ? (
        <div className="music-player">
          <audio controls preload="none" className="music-audio">
            <source src="/assets/trapman/music-preview.mp3" type="audio/mpeg" />
            Your browser does not support audio playback.
          </audio>
        </div>
      ) : (
        <p className="music-soon">Music preview coming soon</p>
      )}
      <p className="music-label">Original synthwave soundtrack by Nobilix</p>
    </div>
  );
}
