import { Check, EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import { auth } from '@/auth';
import { getAssets } from '@/db/queries';
import { removeAsset } from '@/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import AddEditAssetDialog from '@/components/AddEditAssetDialog';

export default async function AssetSection() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const assets = await getAssets(userId);

  return (
    <>
      {assets.length ? (
        <div className="max-w-4xl rounded-lg border">
          <Table className="min-w-0">
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
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost">
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
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this asset?
                              <br />
                              {`(${asset.ticker}) ${asset.name}`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <form
                              action={async () => {
                                'use server';
                                await removeAsset(asset.id);
                              }}
                            >
                              <AlertDialogAction type="submit">
                                Delete
                              </AlertDialogAction>
                            </form>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </AddEditAssetDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="italic">No assets, please create a new asset</div>
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
