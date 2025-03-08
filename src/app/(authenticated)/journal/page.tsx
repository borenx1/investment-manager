import type { Metadata } from 'next';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TradeTab from './TradeTab';
import IncomeTab from './IncomeTab';
import ExpenseTab from './ExpenseTab';

export const metadata: Metadata = {
  title: 'Journal',
};

export default function JournalPage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-8 font-bold">Journal</h1>
      <Tabs defaultValue="trade">
        <TabsList className="w-full">
          <TabsTrigger value="trade">Trades</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
        </TabsList>
        <div className="py-4">
          <TabsContent value="trade">
            <TradeTab />
          </TabsContent>
          <TabsContent value="income">
            <IncomeTab />
          </TabsContent>
          <TabsContent value="expense">
            <ExpenseTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
