import { Suspense } from 'react';
import type { Metadata } from 'next';

import { auth } from '@/auth';
import { getAssetPrices } from '@/db/queries';
import PriceSection, { PriceSectionSkeleton } from './PriceSection';

export const metadata: Metadata = {
  title: 'Prices',
};

export default async function PricesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const assetPrices = getAssetPrices(userId);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-8 font-bold">Prices</h1>

      <Suspense fallback={<PriceSectionSkeleton />}>
        <PriceSection prices={assetPrices} />
      </Suspense>
    </div>
  );
}
