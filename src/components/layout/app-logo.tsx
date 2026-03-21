import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
}

/**
 * Draftr brand mark — the "D" letterform.
 * Uses currentColor so it inherits text-primary or whatever the parent sets.
 */
export function AppLogo({ className }: AppLogoProps) {
  return (
    <svg
      viewBox="0 0 108 98"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-6 w-6', className)}
      aria-hidden="true"
    >
      <path
        d="M57.5322 0C90.905 0 108 15.4115 108 41.4648C108 78.019 84.752 97.518 50.832 97.518H8.9834L20.1533 27.0254C15.7887 25.3039 12.0771 22.1108 9.7666 17.8828L3.499 6.4053L0 0H57.5322ZM43.7197 73.923H51.1094C66.975 73.923 75.863 62.877 75.863 42.8252C75.863 30.2769 69.71 23.4601 56.8506 23.46H51.791L43.7197 73.923Z"
        fill="currentColor"
      />
    </svg>
  );
}
