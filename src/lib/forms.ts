import { z } from 'zod';

const portfolioAccountFormSchema = z.object({
  name: z.string().trim().nonempty('Account name is required').max(50, 'Maximum 50 characters'),
});

export const portfolioAccountForm = {
  clientSchema: portfolioAccountFormSchema,
  serverSchema: portfolioAccountFormSchema,
} as const;

const assetFormSchema = z.object({
  name: z.string().trim().nonempty('Name is required').max(50, 'Maximum 50 characters'),
  ticker: z
    .string()
    .trim()
    .nonempty('Ticker is required')
    .regex(/^[a-zA-Z0-9.]+$/, 'Only letters, numbers, and dots are allowed')
    .max(10, 'Maximum 10 characters'),
  symbol: z.string().trim().max(10, 'Maximum 10 characters'),
  precision: z.coerce
    .number()
    .int('Must be an integer')
    .nonnegative('Must be a positive number')
    .max(20, 'Maximum 20'),
  pricePrecision: z.coerce
    .number()
    .int('Must be an integer')
    .nonnegative('Must be a positive number')
    .max(20, 'Maximum 20'),
  isCurrency: z.boolean(),
  externalTicker: z.string().trim().max(20, 'Maximum 20 characters').nullable(),
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

const assetPriceFormSchema = z.object({
  date: z.date({ message: 'Select a date' }),
  price: z.coerce
    .number({ message: 'Price is required' })
    .positive('Must be a positive number')
    .finite()
    .safe(),
});

export const assetPriceForm = {
  clientSchema: assetPriceFormSchema,
  serverSchema: assetPriceFormSchema
    .extend({
      date: z.string().date(),
      assetId: z.coerce.number().int(),
      quoteAssetId: z.coerce.number().int(),
    })
    .refine((form) => form.assetId !== form.quoteAssetId, {
      message: 'Asset and quote asset cannot be the same',
      path: ['assetId'],
    }),
} as const;

const capitalTransactionFormSchema = z.object({
  date: z.date({ message: 'Select a date' }),
  portfolioAccountId: z.coerce.number({ message: 'Select a portfolio account' }).int(),
  assetId: z.coerce.number({ message: 'Select an asset' }).int(),
  amount: z.coerce
    .number({ message: 'Amount is required' })
    .positive('Must be a positive number')
    .finite()
    .safe(),
  type: z.enum(['contributions', 'drawings']),
  fee: z.coerce.number().nonnegative('Must be a non-negative number').finite().safe(),
  description: z.string().trim().max(200, 'Maximum 200 characters'),
});

export const capitalTransactionForm = {
  clientSchema: capitalTransactionFormSchema,
  serverSchema: capitalTransactionFormSchema.extend({
    fee: capitalTransactionFormSchema.shape.fee.nullable(),
    description: capitalTransactionFormSchema.shape.description.nullable(),
  }),
} as const;

const accountTransferTxFormSchema = z.object({
  date: z.date({ message: 'Select a date' }),
  sourcePortfolioAccountId: z.coerce.number({ message: 'Select a portfolio account' }).int(),
  targetPortfolioAccountId: z.coerce.number({ message: 'Select a portfolio account' }).int(),
  assetId: z.coerce.number({ message: 'Select an asset' }).int(),
  amount: z.coerce
    .number({ message: 'Amount is required' })
    .positive('Must be a positive number')
    .finite()
    .safe(),
  fee: z.coerce.number().nonnegative('Must be a non-negative number').finite().safe(),
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
    .refine((form) => form.sourcePortfolioAccountId !== form.targetPortfolioAccountId, {
      message: 'Source and target accounts cannot be the same',
      path: ['targetPortfolioAccountId'],
    }),
} as const;

const tradeTransactionFormSchema = z.object({
  date: z.date({ message: 'Select a date' }),
  portfolioAccountId: z.coerce.number({ message: 'Select a portfolio account' }).int(),
  baseAssetId: z.coerce.number({ message: 'Select an asset' }).int(),
  baseAmount: z.coerce
    .number({ message: 'Amount is required' })
    .positive('Must be a positive number')
    .finite()
    .safe(),
  quoteAssetId: z.coerce.number({ message: 'Select an asset' }).int(),
  quoteAmount: z.coerce
    .number({ message: 'Amount is required' })
    .positive('Must be a positive number')
    .finite()
    .safe(),
  type: z.enum(['buy', 'sell']),
  feeAsset: z.enum(['base', 'quote']),
  feeAmount: z.coerce.number().nonnegative('Must be a non-negative number').finite().safe(),
  description: z.string().trim().max(200, 'Maximum 200 characters'),
});

export const tradeTransactionForm = {
  clientSchema: tradeTransactionFormSchema.refine(
    (form) => form.baseAssetId !== form.quoteAssetId,
    {
      message: 'Base and quote assets cannot be the same',
      path: ['quoteAssetId'],
    },
  ),
  serverSchema: tradeTransactionFormSchema
    .extend({
      feeAmount: tradeTransactionFormSchema.shape.feeAmount.nullable(),
      description: tradeTransactionFormSchema.shape.description.nullable(),
    })
    .refine((form) => form.baseAssetId !== form.quoteAssetId, {
      message: 'Base and quote assets cannot be the same',
      path: ['quoteAssetId'],
    }),
} as const;

const incomeTransactionFormSchema = z.object({
  date: z.date({ message: 'Select a date' }),
  portfolioAccountId: z.coerce.number({ message: 'Select a portfolio account' }).int(),
  assetId: z.coerce.number({ message: 'Select an asset' }).int(),
  amount: z.coerce
    .number({ message: 'Amount is required' })
    .positive('Must be a positive number')
    .finite()
    .safe(),
  description: z.string().trim().max(200, 'Maximum 200 characters'),
});

export const incomeTransactionForm = {
  clientSchema: incomeTransactionFormSchema,
  serverSchema: incomeTransactionFormSchema.extend({
    description: incomeTransactionFormSchema.shape.description.nullable(),
  }),
} as const;

export const expenseTransactionForm = incomeTransactionForm;
