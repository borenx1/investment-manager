import 'server-only';
import { z } from 'zod';

const SUPPORTED_TICKERS = new Set([
  // Currencies.
  'aud', // Australian Dollar
  'cad', // Canadian Dollar
  'chf', // Swiss Franc
  'cny', // Chinese Yuan
  'eur', // Euro
  'gbp', // British Pound
  'hkd', // Hong Kong Dollar
  'inr', // Indian Rupee
  'jpy', // Japanese Yen
  'krw', // South Korean Won
  'mxn', // Mexican Peso
  'nzd', // New Zealand Dollar
  'rub', // Russian Ruble
  'sgd', // Singapore Dollar
  'try', // Turkish Lira
  'usd', // US Dollar
  // Cryptocurrencies.
  'ada', // Cardano
  'bnb', // Binance Coin
  'btc', // Bitcoin
  'doge', // Dogecoin
  'dot', // Polkadot
  'eth', // Ethereum
  'link', // Chainlink
  'ltc', // Litecoin
  'shib', // Shiba Inu
  'sol', // Solana
  'uni', // Uniswap
  'usdc', // USD Coin
  'usdt', // Tether
  'xmr', // Monero
  'xrp', // XRP
  'xlm', // Stellar
  // Commodities.
  'xag', // Silver
  'xau', // Gold
  'xpt', // Platinum
]);

const CURRENCIES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const LATEST_DATE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CurrenciesCache {
  currencies: Record<string, string>;
  timestamp: number;
}

interface LatestDateCache {
  date: string;
  timestamp: number;
}

let currenciesCache: CurrenciesCache | null = null;
let latestDateCache: LatestDateCache | null = null;

/**
 * Base URL for the Free Currency Exchange Rates API.
 * Using JSDelivr CDN as primary endpoint with Cloudflare as fallback
 * @see https://github.com/fawazahmed0/exchange-api
 */
function primaryApiUrl(date: string = 'latest') {
  return `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/`;
}

function fallbackApiUrl(date: string = 'latest') {
  return `https://${date}.currency-api.pages.dev/v1/`;
}

/**
 * Fetches data from the currency exchange API, with fallback support.
 * @param endpoint The endpoint to fetch from.
 * @param date The date to fetch the data from.
 * @returns The fetched data.
 */
async function fetchFromApi<T>(
  endpoint: string,
  date: string = 'latest',
): Promise<T> {
  try {
    const response = await fetch(new URL(endpoint, primaryApiUrl(date)));
    if (!response.ok) {
      throw new Error('Primary API failed');
    }
    return await response.json();
  } catch {
    // Try fallback URL if primary fails
    const response = await fetch(new URL(endpoint, fallbackApiUrl(date)));
    if (!response.ok) {
      throw new Error('Failed to fetch from both primary and fallback APIs');
    }
    return await response.json();
  }
}

/**
 * Fetches the latest date from the currency exchange API.
 * @returns The latest date in YYYY-MM-DD format.
 */
export async function getLatestDate(): Promise<string> {
  // Return cached data if it's still valid.
  if (
    latestDateCache &&
    Date.now() - latestDateCache.timestamp < LATEST_DATE_CACHE_DURATION
  ) {
    return latestDateCache.date;
  }

  const response = await fetch(
    new URL('currencies/nzd.min.json', fallbackApiUrl()),
  );
  if (!response.ok) {
    throw new Error('Failed to fetch latest date');
  }
  const data = await response.json();
  const parsedData = z.object({ date: z.string().date() }).safeParse(data);
  if (parsedData.success) {
    latestDateCache = {
      date: parsedData.data.date,
      timestamp: Date.now(),
    };
    return parsedData.data.date;
  }
  throw new Error('Invalid response from API');
}

/**
 * Fetches and caches the list of supported currencies from the currency
 * exchange API.
 * @returns A record of currency tickers to names.
 */
async function getApiSupportedCurrencies(): Promise<Record<string, string>> {
  // Return cached data if it's still valid.
  if (
    currenciesCache &&
    Date.now() - currenciesCache.timestamp < CURRENCIES_CACHE_DURATION
  ) {
    return currenciesCache.currencies;
  }

  const currencies = await fetchFromApi<Record<string, string>>(
    'currencies.min.json',
  );

  currenciesCache = {
    currencies,
    timestamp: Date.now(),
  };

  return currencies;
}

/**
 * Gets the list of supported currencies for this app. Returns a subset of the
 * currencies supported by the currency exchange API.
 */
export async function getSupportedCurrencies() {
  const allCurrencies = await getApiSupportedCurrencies();
  const supportedCurrencies: Record<string, string> = {};
  for (const [ticker, name] of Object.entries(allCurrencies)) {
    if (SUPPORTED_TICKERS.has(ticker.toLowerCase())) {
      // Some names are empty, use ticker as fallback..
      supportedCurrencies[ticker] = name || ticker.toUpperCase();
    }
  }
  return supportedCurrencies;
}
