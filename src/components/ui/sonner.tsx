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
      position="bottom-center"
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      richColors
      icons={{
        success: <CheckCircle weight="fill" className="size-7" />,
        info: <Info weight="fill" className="size-7" />,
        warning: <WarningCircle weight="fill" className="size-7" />,
        error: <XCircle weight="fill" className="size-7" />,
        loading: <SpinnerGap className="size-7 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--text-primary)',
          '--normal-text': 'var(--surface-default)',
          '--normal-border': 'transparent',
          '--success-bg': 'var(--feedback-success-default)',
          '--success-text': 'var(--surface-default)',
          '--success-border': 'transparent',
          '--error-bg': 'var(--action-danger-default)',
          '--error-text': 'var(--surface-default)',
          '--error-border': 'transparent',
          '--warning-bg': 'var(--feedback-warning-default)',
          '--warning-text': 'var(--text-primary)',
          '--warning-border': 'transparent',
          '--info-bg': 'var(--accent-secondary-default)',
          '--info-text': 'var(--surface-default)',
          '--info-border': 'transparent',
          '--border-radius': 'var(--radius-2xl)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'font-sans !shadow-md !items-start !gap-3 !px-4 !py-3',
          title: '!font-semibold',
          // Sonner's default [data-icon] container is 16×16 — force it to
          // match the 28px Phosphor icons so they don't overflow into the
          // flex gap and jam against the text.
          icon: '!m-0 !size-7 !self-start',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
