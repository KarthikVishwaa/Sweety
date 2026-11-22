import bouncingPoster from '@/assets/mascot/bouncing.webp';
import bouncingMp4 from '@/assets/mascot/bouncing.mp4';
import bouncingWebm from '@/assets/mascot/bouncing.webm';
import floatingMp4 from '@/assets/mascot/floating.mp4';
import floatingPoster from '@/assets/mascot/floating.webp';
import floatingWebm from '@/assets/mascot/floating.webm';
import loveMp4 from '@/assets/mascot/love.mp4';
import lovePoster from '@/assets/mascot/love.webp';
import loveWebm from '@/assets/mascot/love.webm';
import manifest from '@/assets/mascot/manifest.json';
import wavingMp4 from '@/assets/mascot/waving.mp4';
import wavingPoster from '@/assets/mascot/waving.webp';
import wavingWebm from '@/assets/mascot/waving.webm';

export type MascotVariant = 'floating' | 'waving' | 'bouncing' | 'love';

interface MascotSources {
  mp4: string;
  webm: string;
  poster: string;
}

export const MASCOT_SOURCES: Record<MascotVariant, MascotSources> = {
  floating: { mp4: floatingMp4, webm: floatingWebm, poster: floatingPoster },
  waving: { mp4: wavingMp4, webm: wavingWebm, poster: wavingPoster },
  bouncing: { mp4: bouncingMp4, webm: bouncingWebm, poster: bouncingPoster },
  love: { mp4: loveMp4, webm: loveWebm, poster: lovePoster },
};

export const MASCOT_ASPECT_RATIO = `${manifest.width} / ${manifest.height}`;
