import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// https://authjs.dev/getting-started/adapters/drizzle
export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ],
);

export const portfolioAccounts = pgTable(
  'portfolio_account',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('portfolio_account_name_check', sql`LENGTH(${table.name}) > 0`),
    index().on(table.order),
  ],
);

export type SelectPortfolioAccount = typeof portfolioAccounts.$inferSelect;
export type InsertPortfolioAccount = typeof portfolioAccounts.$inferInsert;

export const assets = pgTable(
  'asset',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ticker: varchar('ticker', { length: 10 }).notNull(),
    name: text('name').notNull(),
    symbol: varchar('symbol', { length: 10 }),
    isCurrency: boolean('is_currency').notNull().default(false),
    precision: smallint('precision').notNull().default(0),
    pricePrecision: smallint('price_precision').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('asset_ticker_check', sql`LENGTH(${table.ticker}) > 0`),
    check('asset_name_check', sql`LENGTH(${table.name}) > 0`),
    check('asset_symbol_check', sql`LENGTH(${table.symbol}) > 0`),
    check('asset_precision_check', sql`${table.precision} >= 0`),
    check('asset_price_precision_check', sql`${table.pricePrecision} >= 0`),
    index().on(table.ticker),
    unique().on(table.userId, table.ticker),
    unique().on(table.userId, table.symbol),
  ],
);

export type SelectAsset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

export const accountingCurrencies = pgTable(
  'accounting_currency',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assetId: integer('asset_id').references(() => assets.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.userId)],
);

export type SelectAccountingCurrency = typeof accountingCurrencies.$inferSelect;
export type InsertAccountingCurrency = typeof accountingCurrencies.$inferInsert;

export const transactions = pgTable(
  'transaction',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    date: timestamp('date', { withTimezone: false }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.date)],
);

export type SelectTransaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export const balances = pgTable(
  'balance',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    portfolioAccountId: integer('portfolio_account_id')
      .notNull()
      .references(() => portfolioAccounts.id, { onDelete: 'cascade' }),
    assetId: integer('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    balance: numeric('balance', { precision: 100, scale: 20 })
      .notNull()
      .default('0'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.portfolioAccountId, table.assetId)],
);

export type SelectBalance = typeof balances.$inferSelect;
export type InsertBalance = typeof balances.$inferInsert;

export const ledgerTypeEnum = pgEnum('ledger_type', [
  'asset',
  'liability',
  'capital',
  'income',
]);

export const ledgers = pgTable(
  'ledger',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    portfolioAccountId: integer('portfolio_account_id')
      .notNull()
      .references(() => portfolioAccounts.id, { onDelete: 'cascade' }),
    assetId: integer('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    type: ledgerTypeEnum('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.portfolioAccountId, table.assetId, table.type)],
);

export type SelectLedger = typeof ledgers.$inferSelect;
export type InsertLedger = typeof ledgers.$inferInsert;

export const ledgerEntries = pgTable(
  'ledger_entry',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    ledgerId: integer('ledger_id')
      .notNull()
      .references(() => ledgers.id, { onDelete: 'cascade' }),
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 100, scale: 20 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.amount)],
);

export type SelectLedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = typeof ledgerEntries.$inferInsert;

export const capitalTransactions = pgTable(
  'capital_transaction',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    assetEntryId: integer('asset_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    capitalEntryId: integer('capital_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    feeAssetEntryId: integer('fee_asset_entry_id').references(
      () => ledgerEntries.id,
      { onDelete: 'set null' },
    ),
    feeIncomeEntryId: integer('fee_income_entry_id').references(
      () => ledgerEntries.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.transactionId),
    unique().on(table.assetEntryId),
    unique().on(table.capitalEntryId),
    unique().on(table.feeAssetEntryId),
    unique().on(table.feeIncomeEntryId),
  ],
);

export type SelectCapitalTransaction = typeof capitalTransactions.$inferSelect;
export type InsertCapitalTransaction = typeof capitalTransactions.$inferInsert;

export const accountTransferTransactions = pgTable(
  'account_transfer_transaction',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    sourceAssetEntryId: integer('source_asset_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    sourceCapitalEntryId: integer('source_capital_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    targetAssetEntryId: integer('target_asset_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    targetCapitalEntryId: integer('target_capital_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    feeAssetEntryId: integer('fee_asset_entry_id').references(
      () => ledgerEntries.id,
      { onDelete: 'set null' },
    ),
    feeIncomeEntryId: integer('fee_income_entry_id').references(
      () => ledgerEntries.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.transactionId),
    unique().on(table.sourceAssetEntryId),
    unique().on(table.sourceCapitalEntryId),
    unique().on(table.targetAssetEntryId),
    unique().on(table.targetCapitalEntryId),
    unique().on(table.feeAssetEntryId),
    unique().on(table.feeIncomeEntryId),
  ],
);

export type SelectAccountTransferTransaction =
  typeof accountTransferTransactions.$inferSelect;
export type InsertAccountTransferTransaction =
  typeof accountTransferTransactions.$inferInsert;

export const tradeTransactions = pgTable(
  'trade_transaction',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    baseAssetEntryId: integer('base_asset_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    baseIncomeEntryId: integer('base_income_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    quoteAssetEntryId: integer('quote_asset_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    quoteIncomeEntryId: integer('quote_income_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    feeAssetEntryId: integer('fee_asset_entry_id').references(
      () => ledgerEntries.id,
      { onDelete: 'set null' },
    ),
    feeIncomeEntryId: integer('fee_income_entry_id').references(
      () => ledgerEntries.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.transactionId),
    unique().on(table.baseAssetEntryId),
    unique().on(table.baseIncomeEntryId),
    unique().on(table.quoteAssetEntryId),
    unique().on(table.quoteIncomeEntryId),
    unique().on(table.feeAssetEntryId),
    unique().on(table.feeIncomeEntryId),
  ],
);

export type SelectTradeTransaction = typeof tradeTransactions.$inferSelect;
export type InsertTradeTransaction = typeof tradeTransactions.$inferInsert;

export const incomeTransactions = pgTable(
  'income_transaction',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    assetEntryId: integer('asset_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    incomeEntryId: integer('income_entry_id')
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.transactionId),
    unique().on(table.assetEntryId),
    unique().on(table.incomeEntryId),
  ],
);

export type SelectIncomeTransaction = typeof incomeTransactions.$inferSelect;
export type InsertIncomeTransaction = typeof incomeTransactions.$inferInsert;
