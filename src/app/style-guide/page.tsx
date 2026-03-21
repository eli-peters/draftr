'use client';

import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun, Check } from '@phosphor-icons/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { styleGuideContent as content } from '@/content/style-guide';
import primitivesData from '@/tokens/primitives.json';
import semanticsData from '@/tokens/semantics.json';

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

type RampFamily = keyof typeof primitivesData.color;

const RAMP_ORDER: RampFamily[] = [
  'primary',
  'secondary',
  'neutral',
  'success',
  'warning',
  'error',
  'info',
];

function getSteps(family: RampFamily) {
  const data = primitivesData.color[family] as Record<string, { $value?: string; $type?: string }>;
  return Object.entries(data)
    .filter(([k, v]) => !k.startsWith('$') && v.$value)
    .map(([step, v]) => ({ step, hex: v.$value! }));
}

/** Determine if text on a colour should be light or dark */
function needsLightText(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

// Build semantic sections dynamically from semantics.json
// Mirrors the recursive walk in build-tokens.ts — tokens auto-update when JSON changes
interface SemanticToken {
  name: string;
  desc: string;
}
interface SemanticSection {
  title: string;
  tokens: SemanticToken[];
}

const CATEGORY_TITLES: Record<string, string> = {
  surface: 'Surfaces',
  text: 'Text',
  border: 'Borders',
  action: 'Actions',
  feedback: 'Feedback',
  accent: 'Accents',
  badge: 'Badges',
};

function collectTokens(obj: Record<string, unknown>, prefix: string): SemanticToken[] {
  const tokens: SemanticToken[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const node = value as Record<string, unknown>;
    const path = prefix ? `${prefix}-${key}` : key;
    if (node.$type === 'color') {
      const desc = (node.$description as string) ?? path.replaceAll('-', ' ');
      tokens.push({ name: `--${path}`, desc });
    } else {
      tokens.push(...collectTokens(node, path));
    }
  }
  return tokens;
}

// Categories in the same order as build-tokens.ts
const SEMANTIC_CATEGORIES = ['surface', 'text', 'border', 'action', 'feedback', 'accent', 'badge'];
const semanticsJson = semanticsData as unknown as Record<string, unknown>;

const SEMANTIC_SECTIONS: SemanticSection[] = SEMANTIC_CATEGORIES.filter(
  (cat) => semanticsJson[cat],
).map((cat) => ({
  title: CATEGORY_TITLES[cat] ?? cat,
  tokens: collectTokens(semanticsJson[cat] as Record<string, unknown>, cat),
}));

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function CopyToast({ text, show }: { text: string; show: boolean }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-surface-default px-4 py-2 font-mono text-sm shadow-lg transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
    >
      <span className="flex items-center gap-2">
        <Check size={14} weight="bold" className="text-feedback-success" />
        Copied {text}
      </span>
    </div>
  );
}

function Swatch({
  step,
  hex,
  onCopy,
}: {
  step: string;
  hex: string;
  onCopy: (hex: string) => void;
}) {
  const light = needsLightText(hex);
  return (
    <button
      onClick={() => onCopy(hex)}
      className="group flex aspect-[1.2] cursor-pointer flex-col justify-end rounded-lg border border-black/5 p-2 transition-transform hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: hex, color: light ? '#fff' : '#272123' }}
    >
      <span className="font-mono text-[10px] font-semibold">{step}</span>
      <span className="font-mono text-[10px] opacity-80">{hex}</span>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 text-lg font-semibold tracking-tight">{children}</h3>;
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 max-w-prose text-sm text-text-secondary leading-relaxed">{children}</p>;
}

function TokenSwatch({ name, desc }: { name: string; desc: string }) {
  const [resolved, setResolved] = useState('');
  const { resolvedColorMode } = useTheme();

  useEffect(() => {
    // Read after a frame to ensure CSS has applied (especially after mode toggle)
    const id = requestAnimationFrame(() => {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      setResolved(val);
    });
    return () => cancelAnimationFrame(id);
  }, [name, resolvedColorMode]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-default p-3 transition-colors hover:border-border-default">
      <div
        className="h-10 w-10 shrink-0 rounded-lg border border-black/5"
        style={{ background: `var(${name})` }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-xs font-semibold text-text-primary">{name}</div>
        <div className="truncate font-mono text-[11px] text-text-tertiary">
          {resolved} — {desc}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Colours
// ---------------------------------------------------------------------------

function ColoursTab() {
  const [toast, setToast] = useState({ show: false, text: '' });

  const copyHex = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex);
    setToast({ show: true, text: hex });
    setTimeout(() => setToast({ show: false, text: '' }), 1500);
  }, []);

  return (
    <div className="space-y-10">
      {/* Primitive ramps */}
      <section>
        <SectionTitle>{content.colours.primitivesTitle}</SectionTitle>
        <SectionDesc>{content.colours.primitivesDesc}</SectionDesc>
        <div className="space-y-6">
          {RAMP_ORDER.map((family) => {
            const label = content.rampLabels[family as keyof typeof content.rampLabels] ?? family;
            return (
              <div key={family}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  {label}
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1">
                  {getSteps(family).map((s) => (
                    <Swatch key={s.step} step={s.step} hex={s.hex} onCopy={copyHex} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Semantic tokens */}
      <section>
        <SectionTitle>{content.colours.semanticTitle}</SectionTitle>
        <SectionDesc>{content.colours.semanticDesc}</SectionDesc>
        <div className="space-y-6">
          {SEMANTIC_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {section.title}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {section.tokens.map((t) => (
                  <TokenSwatch key={t.name} name={t.name} desc={t.desc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Surfaces demo */}
      <section>
        <SectionTitle>{content.colours.surfacesTitle}</SectionTitle>
        <SectionDesc>{content.colours.surfacesDesc}</SectionDesc>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { name: 'Page', cls: 'bg-surface-page' },
            { name: 'Default', cls: 'bg-surface-default' },
            { name: 'Raised', cls: 'bg-surface-raised' },
            { name: 'Sunken', cls: 'bg-surface-sunken' },
          ].map((s) => (
            <div
              key={s.name}
              className={`flex min-h-24 flex-col justify-end rounded-lg border border-border-subtle p-3 ${s.cls}`}
            >
              <span className="font-mono text-xs font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feedback banners */}
      <section>
        <SectionTitle>{content.colours.statesTitle}</SectionTitle>
        <SectionDesc>{content.colours.statesDesc}</SectionDesc>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-lg bg-feedback-success-bg p-4 text-feedback-success-text">
            <span className="text-lg">✓</span>
            <div>
              <h4 className="text-sm font-semibold">Ride confirmed</h4>
              <p className="text-xs opacity-85">
                You&apos;re signed up for the Saturday morning ride.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-feedback-warning-bg p-4 text-feedback-warning-text">
            <span className="text-lg">⚠</span>
            <div>
              <h4 className="text-sm font-semibold">Weather advisory</h4>
              <p className="text-xs opacity-85">
                Rain expected after 10:00 AM. Route may be shortened.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-feedback-error-bg p-4 text-feedback-error-text">
            <span className="text-lg">✕</span>
            <div>
              <h4 className="text-sm font-semibold">Ride cancelled</h4>
              <p className="text-xs opacity-85">Cancelled due to extreme conditions. Stay safe.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-feedback-info-bg p-4 text-feedback-info-text">
            <span className="text-lg">ℹ</span>
            <div>
              <h4 className="text-sm font-semibold">Route update</h4>
              <p className="text-xs opacity-85">The ride leader posted an updated route.</p>
            </div>
          </div>
        </div>
      </section>

      <CopyToast text={toast.text} show={toast.show} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Typography
// ---------------------------------------------------------------------------

const TYPE_SCALE = [
  {
    token: 'display/2xl',
    preview: 'Ride day',
    font: 'font-display',
    style: 'text-5xl font-extrabold tracking-[-0.04em]',
  },
  {
    token: 'display/xl',
    preview: 'Your club',
    font: 'font-display',
    style: 'text-4xl font-bold tracking-[-0.03em]',
  },
  {
    token: 'display/lg',
    preview: 'Upcoming rides',
    font: 'font-display',
    style: 'text-[2rem] font-bold tracking-[-0.025em]',
  },
  {
    token: 'heading/lg',
    preview: 'Saturday Morning Ride',
    font: 'font-display',
    style: 'text-2xl font-semibold tracking-[-0.02em]',
  },
  {
    token: 'heading/md',
    preview: 'Ride details',
    font: 'font-display',
    style: 'text-xl font-semibold tracking-[-0.015em]',
  },
  {
    token: 'heading/sm',
    preview: 'Route map',
    font: 'font-display',
    style: 'text-lg font-semibold tracking-[-0.01em]',
  },
  {
    token: 'body/lg',
    preview: 'Join the Saturday ride at 7am.',
    font: 'font-sans',
    style: 'text-base',
  },
  {
    token: 'body/md',
    preview: 'Regroup at the turnaround.',
    font: 'font-sans',
    style: 'text-sm',
  },
  {
    token: 'body/sm',
    preview: 'Route may be shortened.',
    font: 'font-sans',
    style: 'text-[0.8125rem]',
  },
  {
    token: 'caption',
    preview: 'Sat, Mar 21 · 7:00 AM',
    font: 'font-sans',
    style: 'text-xs font-medium',
  },
  {
    token: 'overline',
    preview: 'UPCOMING RIDES',
    font: 'font-sans',
    style: 'text-[0.6875rem] font-semibold uppercase tracking-[0.06em]',
  },
  {
    token: 'data/lg',
    preview: '65.2 km',
    font: 'font-mono',
    style: 'text-2xl font-semibold tracking-[-0.02em]',
  },
  {
    token: 'data/md',
    preview: '1:48:30',
    font: 'font-mono',
    style: 'text-base font-medium',
  },
  {
    token: 'data/sm',
    preview: '36.1 km/h avg',
    font: 'font-mono',
    style: 'text-xs',
  },
];

const WEIGHTS = [
  {
    family: 'Outfit (display)',
    font: 'font-display',
    weights: [
      { w: 600, label: 'SemiBold', usage: 'heading/sm–lg' },
      { w: 700, label: 'Bold', usage: 'display/lg–xl' },
      { w: 800, label: 'ExtraBold', usage: 'display/2xl' },
    ],
  },
  {
    family: 'DM Sans (body)',
    font: 'font-sans',
    weights: [
      { w: 400, label: 'Regular', usage: 'body, descriptions' },
      { w: 500, label: 'Medium', usage: 'captions, labels' },
      { w: 600, label: 'SemiBold', usage: 'buttons, badges' },
      { w: 700, label: 'Bold', usage: 'emphasis (rare)' },
    ],
  },
  {
    family: 'JetBrains Mono (data)',
    font: 'font-mono',
    weights: [
      { w: 400, label: 'Regular', usage: 'secondary stats' },
      { w: 500, label: 'Medium', usage: 'inline stats' },
      { w: 600, label: 'SemiBold', usage: 'hero stats' },
    ],
  },
];

function TypographyTab() {
  return (
    <div className="space-y-10">
      {/* Type scale */}
      <section>
        <SectionTitle>{content.typography.scaleTitle}</SectionTitle>
        <SectionDesc>{content.typography.scaleDesc}</SectionDesc>
        <div className="space-y-0 divide-y divide-border-subtle">
          {TYPE_SCALE.map((item) => (
            <div key={item.token} className="flex items-center gap-4 py-3">
              <div className="w-28 shrink-0">
                <span className="font-mono text-xs font-medium text-action-primary">
                  {item.token}
                </span>
              </div>
              <div className="flex-1">
                <span className={`${item.font} ${item.style} leading-tight`}>{item.preview}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weight map */}
      <section>
        <SectionTitle>{content.typography.weightTitle}</SectionTitle>
        <SectionDesc>{content.typography.weightDesc}</SectionDesc>
        <div className="space-y-6">
          {WEIGHTS.map((group) => (
            <div key={group.family}>
              <h4 className="mb-3 text-sm font-semibold">{group.family}</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {group.weights.map((w) => (
                  <div
                    key={w.w}
                    className="rounded-lg border border-border-subtle bg-surface-default p-4 text-center"
                  >
                    <div
                      className={`${group.font} mb-2 text-3xl leading-tight`}
                      style={{ fontWeight: w.w }}
                    >
                      Ag
                    </div>
                    <div className="font-mono text-[10px] text-text-secondary">
                      {w.w} · {w.label}
                    </div>
                    <div className="font-mono text-[10px] text-text-tertiary">{w.usage}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Font specimens */}
      <section>
        <SectionTitle>{content.typography.pairingTitle}</SectionTitle>
        <SectionDesc>{content.typography.pairingDesc}</SectionDesc>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Display · Outfit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-semibold tracking-tight">
                Saturday Morning Ride
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                Geometric sans-serif with sporty quality. Tight tracking at large sizes for premium
                editorial feel.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Body · DM Sans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-sans text-base">Join the club, find your rhythm.</p>
              <p className="mt-2 text-xs text-text-secondary">
                Rounded humanist-geometric hybrid. Excellent legibility at 13–16px where most UI
                text lives.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mono · JetBrains Mono</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-base font-medium">65.2 km · 1:48:30</p>
              <p className="mt-2 text-xs text-text-secondary">
                Tabular figures by default. Critical for ride stats, distances, and timestamps.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Components
// ---------------------------------------------------------------------------

function ComponentsTab() {
  return (
    <div className="space-y-10">
      {/* Buttons */}
      <section>
        <SectionTitle>{content.components.buttonsTitle}</SectionTitle>
        <SectionDesc>{content.components.buttonsDesc}</SectionDesc>
        <div className="flex flex-wrap gap-3">
          <Button>Join ride</Button>
          <Button variant="secondary">View details</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="ghost">Learn more</Button>
          <Button variant="destructive">Delete ride</Button>
          <Button disabled>Unavailable</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button size="sm">Small primary</Button>
          <Button size="sm" variant="secondary">
            Small secondary
          </Button>
          <Button size="sm" variant="outline">
            Small outline
          </Button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <SectionTitle>Badges</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <Badge>A pace</Badge>
          <Badge variant="secondary">C pace</Badge>
          <Badge variant="outline">Draft</Badge>
          <Badge variant="destructive">Cancelled</Badge>
          <Badge variant="warning">Weather alert</Badge>
        </div>
      </section>

      {/* Cards */}
      <section>
        <SectionTitle>{content.components.cardsTitle}</SectionTitle>
        <SectionDesc>{content.components.cardsDesc}</SectionDesc>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">Saturday Morning Ride</CardTitle>
                  <p className="text-xs text-text-secondary">Sat, Mar 21 · 7:00 AM · 65 km</p>
                </div>
                <Badge>A pace</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-text-secondary">
                High Park → Lakeshore → Humber loop. Regroup at the turnaround.
              </p>
              <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                <span className="text-xs text-text-tertiary">6 riders joined</span>
                <Button size="sm">Join ride</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">Wednesday Social Spin</CardTitle>
                  <p className="text-xs text-text-secondary">Wed, Mar 25 · 6:30 PM · 35 km</p>
                </div>
                <Badge variant="secondary">C pace</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-text-secondary">
                Easy neighbourhood loop ending at a patio. All welcome.
              </p>
              <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                <span className="text-xs text-text-tertiary">12 riders joined</span>
                <Button size="sm" variant="secondary">
                  View details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-[3px] border-l-destructive">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">Sunday Century Ride</CardTitle>
                  <p className="text-xs text-text-secondary">Sun, Mar 22 · 6:00 AM · 160 km</p>
                </div>
                <Badge variant="destructive">Cancelled</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">
                Cancelled due to ice warning. Stay safe out there.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Inputs */}
      <section>
        <SectionTitle>{content.components.inputsTitle}</SectionTitle>
        <SectionDesc>{content.components.inputsDesc}</SectionDesc>
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ride name</label>
            <Input placeholder="Saturday Morning Ride" defaultValue="Saturday Morning Ride" />
            <p className="text-xs text-text-tertiary">Give your ride a clear name.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Max riders</label>
            <Input type="number" defaultValue="-3" className="border-destructive" />
            <p className="text-xs text-destructive">Must be a positive number.</p>
          </div>
        </div>
      </section>

      {/* Banners */}
      <section>
        <SectionTitle>{content.components.bannersTitle}</SectionTitle>
        <SectionDesc>{content.components.bannersDesc}</SectionDesc>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-lg bg-feedback-success-bg p-4 text-feedback-success-text">
            <span className="text-lg">✓</span>
            <div>
              <h4 className="text-sm font-semibold">Ride confirmed</h4>
              <p className="text-xs opacity-85">See you at 7:00 AM.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-feedback-warning-bg p-4 text-feedback-warning-text">
            <span className="text-lg">⚠</span>
            <div>
              <h4 className="text-sm font-semibold">Weather advisory</h4>
              <p className="text-xs opacity-85">Rain expected after 10 AM.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-feedback-error-bg p-4 text-feedback-error-text">
            <span className="text-lg">✕</span>
            <div>
              <h4 className="text-sm font-semibold">Ride cancelled</h4>
              <p className="text-xs opacity-85">Extreme conditions.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-feedback-info-bg p-4 text-feedback-info-text">
            <span className="text-lg">ℹ</span>
            <div>
              <h4 className="text-sm font-semibold">Route update</h4>
              <p className="text-xs opacity-85">Updated route posted.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StyleGuidePage() {
  const { resolvedColorMode, setColorMode } = useTheme();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-16 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-action-primary">Draftr</span> Design System
          </h1>
          <p className="mt-1 text-sm text-text-secondary">{content.meta.subtitle}</p>
        </div>
        <button
          onClick={() => setColorMode(resolvedColorMode === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-default px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-raised"
        >
          {resolvedColorMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {resolvedColorMode === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="colours">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="colours">{content.tabs.colours}</TabsTrigger>
          <TabsTrigger value="typography">{content.tabs.typography}</TabsTrigger>
          <TabsTrigger value="components">{content.tabs.components}</TabsTrigger>
        </TabsList>

        <TabsContent value="colours">
          <ColoursTab />
        </TabsContent>
        <TabsContent value="typography">
          <TypographyTab />
        </TabsContent>
        <TabsContent value="components">
          <ComponentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
