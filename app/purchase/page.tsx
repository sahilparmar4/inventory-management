'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PurchaseView from '@/components/PurchaseView';

function PurchaseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reorderItemId = searchParams.get('reorder');

  return (
    <PurchaseView
      preselectedItemId={reorderItemId}
      onClearPreselect={() => router.replace('/purchase')}
    />
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading purchase orders...</div>}>
      <PurchaseContent />
    </Suspense>
  );
}