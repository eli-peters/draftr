import Link from 'next/link';
import { Plus, EnvelopeSimple, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { appContent } from '@/content/app';
import type { UserRole } from '@/config/navigation';

const { dashboard: content } = appContent;

interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ weight?: 'duotone' | 'bold'; className?: string }>;
}

function getActionsForRole(role: UserRole): QuickAction[] {
  const actions: QuickAction[] = [];

  if (role === 'ride_leader' || role === 'admin') {
    actions.push({
      label: content.leader.createRide,
      href: '/manage',
      icon: Plus,
    });
  }

  if (role === 'admin') {
    actions.push(
      {
        label: content.admin.inviteMember,
        href: '/manage',
        icon: EnvelopeSimple,
      },
      {
        label: content.admin.viewMembers,
        href: '/manage',
        icon: UsersThree,
      },
    );
  }

  return actions;
}

export function QuickActions({ role }: { role: UserRole }) {
  const actions = getActionsForRole(role);

  if (actions.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {content.admin.quickActions}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className="group block">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5">
              <action.icon weight="duotone" className="h-5 w-5 text-primary" />
              <span className="text-base font-medium text-foreground">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
