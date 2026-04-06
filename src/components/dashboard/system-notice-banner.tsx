import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

interface SystemNoticeBannerProps {
  icon: PhosphorIcon;
  title: string;
  body: string;
}

export function SystemNoticeBanner({ icon: Icon, title, body }: SystemNoticeBannerProps) {
  return (
    <div className="bg-muted/60 px-5 py-3 md:px-6" role="status">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-md mb-1 font-semibold text-muted-foreground">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground/75">{body}</p>
        </div>
      </div>
    </div>
  );
}
