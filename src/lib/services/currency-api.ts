import 'server-only';

/**
 * @see https://github.com/fawazahmed0/exchange-api
 * Base URL for the currency API
 * Using JSDelivr CDN as primary endpoint with Cloudflare as fallback
 */
function primaryApiUrl(date: string = 'latest') {
  return `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1`;
}

function fallbackApiUrl(date: string = 'latest') {
  return `https://${date}.currency-api.pages.dev/v1`;
}

/**
 * Cache duration in milliseconds (24 hours)
 */
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface CurrencyCache {
  currencies: Record<string, string>;
  timestamp: number;
}

let currencyCache: CurrencyCache | null = null;

/**
 * Fetches data from the currency API, with fallback support.
 * @param endpoint The endpoint to fetch from.
 * @param date The date to fetch the data from.
 * @returns The fetched data.
 */
async function fetchFromApi<T>(
  endpoint: string,
  date: string = 'latest',
): Promise<T> {
  try {
    const response = await fetch(`${primaryApiUrl(date)}${endpoint}`);
    if (!response.ok) {
      throw new Error('Primary API failed');
    }
    return await response.json();
  } catch {
    // Try fallback URL if primary fails
    const response = await fetch(`${fallbackApiUrl(date)}${endpoint}`);
    if (!response.ok) {
      throw new Error('Failed to fetch from both primary and fallback APIs');
    }
    return await response.json();
  }
}

/**
 * Fetches and caches the list of supported currencies from the API.
 * @returns A record of currency tickers to names.
 */
export async function getSupportedCurrencies(): Promise<
  Record<string, string>
> {
  // Return cached data if it's still valid
  if (currencyCache && Date.now() - currencyCache.timestamp < CACHE_DURATION) {
    return currencyCache.currencies;
  }

  const currencies = await fetchFromApi<Record<string, string>>(
    '/currencies.min.json',
  );

  currencyCache = {
    currencies,
    timestamp: Date.now(),
  };

  return currencies;
}
