'use client';

import { Check, EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import { removeAsset } from '@/lib/actions';
import { useResourceStore } from '@/providers/resource-store-provider';
import { AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
import ActionAlertDialog from '@/components/ActionAlertDialog';
import AddEditAssetDialog from '@/components/AddEditAssetDialog';

export default function AssetSection() {
  const assets = useResourceStore((state) => state.assets);
  const isAssetsLoaded = useResourceStore((state) => state.isAssetsLoaded);

  return (
    <>
      {assets.length ? (
        <div className="max-w-4xl rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 sm:min-w-[120px]">Ticker</TableHead>
                <TableHead className="w-full sm:min-w-[120px]">Name</TableHead>
                <TableHead className="sm:min-w-[110px]">Precision</TableHead>
                <TableHead className="sm:min-w-[110px]">
                  Price precision
                </TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="pl-4">{asset.ticker}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell className="text-end">{asset.precision}</TableCell>
                  <TableCell className="text-end">
                    {asset.pricePrecision}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {asset.isCurrency && <Check className="size-4" />}
                      <span className="sr-only">
                        {asset.isCurrency ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{asset.symbol}</TableCell>
                  <TableCell>
                    <AddEditAssetDialog asset={asset}>
                      <ActionAlertDialog
                        title="Delete Asset"
                        description={
                          <>
                            Are you sure you want to delete this asset?
                            <br />
                            {`(${asset.ticker}) ${asset.name}`}
                          </>
                        }
                        actionText="Delete"
                        cancelText="Back"
                        onAction={async () => await removeAsset(asset.id)}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost">
                              <span className="sr-only">Open menu</span>
                              <EllipsisVertical />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DialogTrigger asChild>
                              <DropdownMenuItem>
                                <Pencil />
                                Edit
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem>
                                <Trash2 />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </ActionAlertDialog>
                    </AddEditAssetDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="italic">
          {isAssetsLoaded
            ? 'No assets, please create a new asset'
            : 'Loading...'}
        </div>
      )}
      <AddEditAssetDialog>
        <DialogTrigger asChild>
          <Button className="mt-4">
            <Plus />
            New asset
          </Button>
        </DialogTrigger>
      </AddEditAssetDialog>
    </>
  );
}
