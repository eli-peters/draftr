import { RouteForwardDirection } from './directions/route-forward';
import { SocialForwardDirection } from './directions/social-forward';
import { TimeNativeDirection } from './directions/time-native';
import { AirbnbLiteralDirection } from './directions/airbnb-literal';
import { MinimalIndexDirection } from './directions/minimal-index';

export const metadata = {
  title: 'Ride cards — exploration',
};

export default function RideCardsPreviewPage() {
  return (
    <div className="min-h-screen bg-surface-page">
      <div className="mx-auto max-w-3xl px-4 pb-32 pt-8 sm:px-6 sm:pt-12">
        <header className="mb-10 flex flex-col gap-3">
          <span className="font-sans text-overline font-semibold uppercase tracking-[0.08em] text-primary">
            Visual exploration
          </span>
          <h1 className="font-sans text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Ride cards — five directions
          </h1>
          <p className="max-w-prose font-sans text-sm text-muted-foreground">
            Five distinct systems for the Home hero and Rides agenda list. Each direction optimizes
            for a different mental model; none is meant to win on its own. Scroll through, note what
            resonates, and pick one (or blend two) to refine in the next pass.
          </p>
          <ul className="mt-2 grid grid-cols-1 gap-1 font-sans text-xs text-muted-foreground sm:grid-cols-2">
            <li>01 · Route-forward — route shape everywhere, distance anchors.</li>
            <li>02 · Social-forward — avatars lead, N-riding is the hook.</li>
            <li>03 · Time-native — agenda as calendar, not feed.</li>
            <li>04 · Airbnb-literal — image-rich listing cards.</li>
            <li>05 · Minimal index — strip the list, let hero do the work.</li>
          </ul>
        </header>
        <div className="space-y-8">
          <RouteForwardDirection />
          <SocialForwardDirection />
          <TimeNativeDirection />
          <AirbnbLiteralDirection />
          <MinimalIndexDirection />
        </div>
      </div>
    </div>
  );
}
