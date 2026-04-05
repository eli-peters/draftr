import { MobileGate } from '@/components/manage/mobile-gate';

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <MobileGate>{children}</MobileGate>;
}
