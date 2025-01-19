import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financials',
};

export default function FinancialsPage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-bold sm:text-lg">Financials</h1>
      <div>Content...</div>
    </div>
  );
}
