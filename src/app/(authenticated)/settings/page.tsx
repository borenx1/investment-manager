import type { Metadata } from 'next';

import { Separator } from '@/components/ui/separator';
import PortfolioAccountSection from './PortfolioAccountSection';
import AccountingCurrencySection from './AccountingCurrencySection';
import AssetSection from './AssetSection';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-8 font-bold">Settings</h1>
      <div className="max-w-4xl space-y-8">
        <section>
          <h2 className="text-lg sm:text-xl">Portfolio Accounts</h2>
          <Separator className="my-2" />
          <PortfolioAccountSection />
        </section>
        <section>
          <h2 className="text-lg sm:text-xl">Accounting Currency</h2>
          <Separator className="my-2" />
          <AccountingCurrencySection />
        </section>
        <section>
          <h2 className="text-lg sm:text-xl">Assets</h2>
          <Separator className="my-2" />
          <AssetSection />
        </section>
      </div>
    </div>
  );
}
