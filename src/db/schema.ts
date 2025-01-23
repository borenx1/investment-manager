import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
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
