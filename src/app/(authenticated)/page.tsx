import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BalanceSection from './dashboard/BalanceSection';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-8 font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Balances</CardTitle>
            <CardDescription>View your asset balances</CardDescription>
          </CardHeader>
          <CardContent>
            <BalanceSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
