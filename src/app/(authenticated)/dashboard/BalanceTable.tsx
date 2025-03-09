'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';

import type { SelectAsset, SelectBalance, SelectPortfolioAccount } from '@/db/schema';
import { formatDecimalPlaces } from '@/lib/utils';
import { useResourceStore } from '@/providers/resource-store-provider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export default function BalanceTable({
  balances: balancesPromise,
}: {
  balances: Promise<
    {
      balance: SelectBalance;
      portfolio_account: SelectPortfolioAccount;
      asset: SelectAsset;
    }[]
  >;
}) {
  const balances = use(balancesPromise);
  const [isHideZeroBalances, setIsHideZeroBalances] = useState(false);
  const portfolioAccounts = useResourceStore((state) => state.portfolioAccounts);
  const assets = useResourceStore((state) => state.assets);
  const isResourcesLoaded = useResourceStore((state) => state.isResourcesLoaded);
  const activeAccount = useResourceStore((state) => state.activeAccount);
  const balancesByAsset = useMemo(
    () =>
      assets.map((asset) => ({
        asset,
        balances: portfolioAccounts.map((account) => ({
          portfolioAccount: account,
          balance: balances.find(
            ({ balance }) =>
              balance.portfolioAccountId === account.id && balance.assetId === asset.id,
          )?.balance,
        })),
      })),
    [balances, assets, portfolioAccounts],
  );
  const balanceValues = useMemo(
    () =>
      balancesByAsset.map(({ asset, balances }) => ({
        asset,
        balance: balances.reduce((acc, { portfolioAccount, balance }) => {
          if (activeAccount && portfolioAccount.id !== activeAccount.id) {
            return acc;
          }
          return acc + (balance ? Number(balance.balance) : 0);
        }, 0),
      })),
    [balancesByAsset, activeAccount],
  );
  const filteredBalanceValues = useMemo(
    () => balanceValues.filter(({ balance }) => !isHideZeroBalances || balance !== 0),
    [balanceValues, isHideZeroBalances],
  );

  return isResourcesLoaded ? (
    balanceValues.length ? (
      <div className="space-y-4">
        <div className="flex items-center justify-end space-x-2">
          <Switch
            id="hide-zero-balances-switch"
            checked={isHideZeroBalances}
            onCheckedChange={() => setIsHideZeroBalances((state) => !state)}
          />
          <Label htmlFor="hide-zero-balances-switch">Hide zero balances</Label>
        </div>
        {filteredBalanceValues.length ? (
          <Table>
            <TableBody>
              {filteredBalanceValues.map(({ asset, balance }) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.ticker}</TableCell>
                  <TableCell className="font-mono">
                    {formatDecimalPlaces(balance, asset.precision)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="italic">All your balances are zero</div>
        )}
      </div>
    ) : (
      <div>
        <div className="italic">No assets configured yet</div>
        <Button asChild size="sm" className="mt-4">
          <Link href="/settings">Create an asset</Link>
        </Button>
      </div>
    )
  ) : (
    <BalanceTableSkeleton />
  );
}

export function BalanceTableSkeleton() {
  return (
    <div className="space-y-2 overflow-hidden">
      <div className="max-w-[500px]">
        <Skeleton className="ml-auto h-[30px] max-w-[160px]" />
      </div>
      <Skeleton className="h-[30px] max-w-[500px]" />
      <Skeleton className="h-[30px] max-w-[500px]" />
      <Skeleton className="h-[30px] max-w-[500px]" />
      <Skeleton className="h-[30px] max-w-[500px]" />
    </div>
  );
}
