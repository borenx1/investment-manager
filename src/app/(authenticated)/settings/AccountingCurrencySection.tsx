'use client';

import { useMemo, useState } from 'react';
import { EllipsisVertical, MousePointer2, Pencil } from 'lucide-react';

import { useResourceStore } from '@/providers/resource-store-provider';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AccountingCurrencyDialog from '@/components/AccountingCurrencyDialog';
import AddEditAssetDialog from '@/components/AddEditAssetDialog';

export default function AccountingCurrencySection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const accountingCurrency = useResourceStore((state) => state.accountingCurrency);
  const assets = useResourceStore((state) => state.assets);
  const isAccountingCurrencyLoaded = useResourceStore((state) => state.isAccountingCurrencyLoaded);
  const isAssetsLoaded = useResourceStore((state) => state.isAssetsLoaded);
  const isResourcesLoaded = useMemo(
    () => isAccountingCurrencyLoaded && isAssetsLoaded,
    [isAccountingCurrencyLoaded, isAssetsLoaded],
  );

  return (
    <>
      {isResourcesLoaded ? (
        accountingCurrency ? (
          <div className="max-w-4xl rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:min-w-[120px]">Ticker</TableHead>
                  <TableHead className="w-full sm:min-w-[120px]">Name</TableHead>
                  <TableHead className="sm:min-w-[110px]">Precision</TableHead>
                  <TableHead className="sm:min-w-[110px]">Price precision</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="pl-4">{accountingCurrency.ticker}</TableCell>
                  <TableCell>{accountingCurrency.name}</TableCell>
                  <TableCell className="text-end">{accountingCurrency.precision}</TableCell>
                  <TableCell className="text-end">{accountingCurrency.pricePrecision}</TableCell>
                  <TableCell className="text-center">{accountingCurrency.symbol}</TableCell>
                  <TableCell>
                    <AddEditAssetDialog asset={accountingCurrency}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost">
                            <span className="sr-only">Open menu</span>
                            <EllipsisVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
                            <MousePointer2 />
                            Change accounting currency
                          </DropdownMenuItem>
                          <DialogTrigger asChild>
                            <DropdownMenuItem>
                              <Pencil />
                              Edit asset
                            </DropdownMenuItem>
                          </DialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </AddEditAssetDialog>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <>
            <div className="italic">
              {assets.length
                ? 'Please select an accounting currency'
                : 'Please create a new asset then set it as the accounting currency'}
            </div>
            {!!assets.length && (
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <MousePointer2 />
                Select accounting currency
              </Button>
            )}
          </>
        )
      ) : (
        <div className="italic">Loading...</div>
      )}
      <AccountingCurrencyDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
