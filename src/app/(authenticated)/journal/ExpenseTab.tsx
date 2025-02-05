import { auth } from '@/auth';

export default async function ExpenseTab() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return <></>;
}
