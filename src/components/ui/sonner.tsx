'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import {
  CheckCircle,
  Info,
  WarningCircle,
  XCircle,
  SpinnerGap,
} from '@phosphor-icons/react/dist/ssr';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      richColors
      icons={{
        success: <CheckCircle weight="fill" className="size-4" />,
        info: <Info weight="fill" className="size-4" />,
        warning: <WarningCircle weight="fill" className="size-4" />,
        error: <XCircle weight="fill" className="size-4" />,
        loading: <SpinnerGap className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--surface-default)',
          '--normal-text': 'var(--text-primary)',
          '--normal-border': 'var(--border-subtle)',
          '--success-bg': 'var(--toast-success-bg)',
          '--success-text': 'var(--feedback-success-text)',
          '--success-border': 'color-mix(in srgb, var(--feedback-success-text) 20%, transparent)',
          '--error-bg': 'var(--toast-error-bg)',
          '--error-text': 'var(--feedback-error-text)',
          '--error-border': 'color-mix(in srgb, var(--feedback-error-text) 20%, transparent)',
          '--warning-bg': 'var(--toast-warning-bg)',
          '--warning-text': 'var(--feedback-warning-text)',
          '--warning-border': 'color-mix(in srgb, var(--feedback-warning-text) 20%, transparent)',
          '--info-bg': 'var(--toast-info-bg)',
          '--info-text': 'var(--feedback-info-text)',
          '--info-border': 'color-mix(in srgb, var(--feedback-info-text) 20%, transparent)',
          '--border-radius': 'var(--radius-lg)',
        } as React.CSSProperties
      }
      mobileOffset={80}
      toastOptions={{
        classNames: {
          toast: 'font-sans !shadow-md',
          title: '!font-medium',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
