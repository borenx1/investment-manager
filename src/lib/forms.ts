import { z } from 'zod';

const portfolioAccountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty('Account name is required')
    .max(50, 'Maximum 50 characters'),
});

export const portfolioAccountForm = {
  clientSchema: portfolioAccountFormSchema,
  serverSchema: portfolioAccountFormSchema,
} as const;

const assetFormSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty('Name is required')
    .max(50, 'Maximum 50 characters'),
  ticker: z
    .string()
    .trim()
    .nonempty('Ticker is required')
    .max(10, 'Maximum 10 characters'),
  symbol: z.string().trim().max(10, 'Maximum 10 characters'),
  precision: z.coerce
    .number()
    .int()
    .nonnegative('Must be a positive number')
    .max(20, 'Maximum 20'),
  pricePrecision: z.coerce
    .number()
    .int()
    .nonnegative('Must be a positive number')
    .max(20, 'Maximum 20'),
  isCurrency: z.boolean(),
});

export const assetForm = {
  clientSchema: assetFormSchema,
  serverSchema: assetFormSchema.extend({
    symbol: assetFormSchema.shape.symbol.nullable(),
  }),
} as const;

const accountingCurrencyFormSchema = z.object({
  assetId: z.coerce.number({ message: 'Select an asset' }).int(),
});

export const accountingCurrencyForm = {
  clientSchema: accountingCurrencyFormSchema,
  serverSchema: accountingCurrencyFormSchema,
} as const;

const capitalTransactionFormSchema = z.object({
  date: z.date({ message: 'Select a date' }),
  portfolioAccountId: z.coerce
    .number({ message: 'Select a portfolio account' })
    .int(),
  assetId: z.coerce.number({ message: 'Select an asset' }).int(),
  amount: z.coerce
    .number({ message: 'Amount is required' })
    .positive('Must be a positive number'),
  type: z.enum(['contribution', 'drawings']),
  fee: z.coerce.number().nonnegative('Must be a non-negative number'),
  description: z.string().trim().max(200, 'Maximum 200 characters'),
});

export const capitalTransactionForm = {
  clientSchema: capitalTransactionFormSchema,
  serverSchema: capitalTransactionFormSchema
    .extend({
      fee: capitalTransactionFormSchema.shape.fee.nullable(),
      description: capitalTransactionFormSchema.shape.description.nullable(),
    })
    .omit({ type: true }),
} as const;

const accountTransferTxFormSchema = z.object({
  date: z.date({ message: 'Select a date' }),
  sourcePortfolioAccountId: z.coerce
    .number({ message: 'Select a portfolio account' })
    .int(),
  targetPortfolioAccountId: z.coerce
    .number({ message: 'Select a portfolio account' })
    .int(),
  assetId: z.coerce.number({ message: 'Select an asset' }).int(),
  amount: z.coerce
    .number({ message: 'Amount is required' })
    .positive('Must be a positive number'),
  fee: z.coerce.number().nonnegative('Must be a non-negative number'),
  isFeeInclusive: z.boolean(),
  description: z.string().trim().max(200, 'Maximum 200 characters'),
});

export const accountTransferTxForm = {
  clientSchema: accountTransferTxFormSchema.refine(
    (form) => form.sourcePortfolioAccountId !== form.targetPortfolioAccountId,
    {
      message: 'Source and target accounts cannot be the same',
      path: ['targetPortfolioAccountId'],
    },
  ),
  serverSchema: accountTransferTxFormSchema
    .extend({
      fee: accountTransferTxFormSchema.shape.fee.nullable(),
      description: accountTransferTxFormSchema.shape.description.nullable(),
    })
    .omit({ isFeeInclusive: true })
    .refine(
      (form) => form.sourcePortfolioAccountId !== form.targetPortfolioAccountId,
      {
        message: 'Source and target accounts cannot be the same',
        path: ['targetPortfolioAccountId'],
      },
    ),
} as const;
