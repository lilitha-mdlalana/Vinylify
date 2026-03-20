import { SpotifyProfilePanel } from "@/components/spotify-profile-panel";
import "./VinylRecord.css";

export default function VinylRecord() {
  return (
    <div className="vinyl-player-root">
      <div className="vinyl-player-deck" data-speed="33">
        <div id="turntable" className="pause">
          <div className="vinyl-platter">
            <div id="record">
              <div id="record-inner">
                <div id="label">
                  <iframe
                    id="player"
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=Z7_iY8Ga3m7yxaj0"
                    title="Video player"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
            <div id="shine" aria-hidden />
            <div id="controls">
              <div id="arm">
                <div className="base" />
                <div className="arm">
                  <div className="head" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SpotifyProfilePanel />
    </div>
  );
}
