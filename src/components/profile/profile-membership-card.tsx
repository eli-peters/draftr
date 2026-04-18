'use client';

import { IdentificationBadge } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { ContentCard } from '@/components/ui/content-card';
import { appContent } from '@/content/app';
import type { UserMembership } from '@/lib/profile/queries';

const { profile: content } = appContent;

interface ProfileMembershipCardProps {
  memberships: UserMembership[];
}

export function ProfileMembershipCard({ memberships }: ProfileMembershipCardProps) {
  if (memberships.length === 0) {
    return (
      <ContentCard icon={IdentificationBadge} heading={content.membership.heading}>
        <p className="text-base italic text-muted-foreground">{content.membership.noMembership}</p>
      </ContentCard>
    );
  }

  return (
    <ContentCard icon={IdentificationBadge} heading={content.membership.heading}>
      <div className="flex flex-col gap-4">
        {memberships.map((m) => (
          <dl key={m.id} className="flex flex-col gap-3">
            {m.member_number && (
              <Row label={content.membership.memberNumberLabel}>{m.member_number}</Row>
            )}
            {m.membership_type && (
              <Row label={content.membership.membershipTypeLabel}>
                {m.membership_type}
                {m.membership_subtype ? ` — ${m.membership_subtype}` : ''}
              </Row>
            )}
            {m.status && <Row label={content.membership.statusLabel}>{m.status}</Row>}
            {m.club_affiliations.length > 0 && (
              <Row label={content.membership.clubAffiliationsLabel}>
                <div className="flex flex-wrap gap-1.5">
                  {m.club_affiliations.map((a) => (
                    <Badge key={a.club_id} variant="secondary">
                      {a.club_name}
                    </Badge>
                  ))}
                </div>
              </Row>
            )}
          </dl>
        ))}
      </div>
    </ContentCard>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 select-text text-base font-semibold text-foreground">{children}</dd>
    </div>
  );
}
