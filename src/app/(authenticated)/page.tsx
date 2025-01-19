import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-bold sm:text-lg">Dashboard</h1>
      <div>Content...</div>
    </div>
  );
}
