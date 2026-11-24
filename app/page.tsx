'use client';

import { useRouter } from 'next/navigation';
import DashboardView from '@/components/DashboardView';

export default function HomePage() {
  const router = useRouter();

  return (
    <DashboardView
      onNavigate={(tab) => router.push(tab === 'dashboard' ? '/' : `/${tab}`)}
      onQuickReorder={(itemId) => router.push(`/purchase?reorder=${itemId}`)}
    />
  );
}