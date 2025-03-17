import fetch from "node-fetch"
import { calculateMovingAverages } from "../utils/dataProcessing.js"

/**
 * Fetches market data from KuCoin API
 * @param {string} symbol - Trading pair symbol (e.g., BTCUSDT)
 * @returns {Promise<Object>} - Processed market data
 */
export async function fetchKucoinData(symbol) {
  console.log(`Fetching KuCoin data for ${symbol}...`)

  try {
    // Convert Binance symbol format to KuCoin format (e.g., BTCUSDT -> BTC-USDT)
    const kucoinSymbol = convertSymbolFormat(symbol)

    // Fetch multiple timeframes for comprehensive analysis
    const [klines1h, klines4h, klines1d] = await Promise.all([
      fetchKlines(kucoinSymbol, "1hour", 100),
      fetchKlines(kucoinSymbol, "4hour", 100),
      fetchKlines(kucoinSymbol, "1day", 100),
    ])

    // Fetch order book data for liquidity analysis
    const orderBook = await fetchOrderBook(kucoinSymbol)

    // Fetch market statistics
    const marketStats = await fetchMarketStats(kucoinSymbol)

    // Process and structure the data
    const processedData = {
      exchange: "kucoin",
      symbol: kucoinSymbol,
      originalSymbol: symbol,
      klines: {
        "1h": processKlines(klines1h),
        "4h": processKlines(klines4h),
        "1d": processKlines(klines1d),
      },
      orderBook: processOrderBook(orderBook),
      marketStats: marketStats,
      timestamp: Date.now(),
    }

    // Calculate additional indicators
    processedData.indicators = calculateIndicators(processedData)

    console.log(`Successfully fetched KuCoin data for ${kucoinSymbol}`)
    return processedData
  } catch (error) {
    console.error(`Error fetching KuCoin data: ${error.message}`)
    throw new Error(`KuCoin data fetch failed: ${error.message}`)
  }
}

/**
 * Converts Binance symbol format to KuCoin format
 * e.g., BTCUSDT -> BTC-USDT
 */
function convertSymbolFormat(binanceSymbol) {
  // Common base currencies
  const baseCurrencies = ["USDT", "BTC", "ETH", "BNB", "USD", "BUSD", "USDC"]

  // Find which base currency is used
  let baseCurrency = ""
  for (const currency of baseCurrencies) {
    if (binanceSymbol.endsWith(currency)) {
      baseCurrency = currency
      break
    }
  }

  if (!baseCurrency) {
    throw new Error(`Could not determine base currency for symbol: ${binanceSymbol}`)
  }

  // Extract the quote currency
  const quoteCurrency = binanceSymbol.substring(0, binanceSymbol.length - baseCurrency.length)

  // Return in KuCoin format
  return `${quoteCurrency}-${baseCurrency}`
}

/**
 * Fetches kline/candlestick data from KuCoin
 */
async function fetchKlines(symbol, interval, limit) {
  // KuCoin API endpoint for klines
  const url = `https://api.kucoin.com/api/v1/market/candles?symbol=${symbol}&type=${interval}&limit=${limit}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`KuCoin klines API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.code !== "200000") {
    throw new Error(`KuCoin API error: ${data.code} ${data.msg}`)
  }

  return data.data
}

/**
 * Fetches order book data from KuCoin
 */
async function fetchOrderBook(symbol, depth = 100) {
  const url = `https://api.kucoin.com/api/v1/market/orderbook/level2_${depth}?symbol=${symbol}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`KuCoin order book API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.code !== "200000") {
    throw new Error(`KuCoin API error: ${data.code} ${data.msg}`)
  }

  return data.data
}

/**
 * Fetches market statistics from KuCoin
 */
async function fetchMarketStats(symbol) {
  const url = `https://api.kucoin.com/api/v1/market/stats?symbol=${symbol}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`KuCoin market stats API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.code !== "200000") {
    throw new Error(`KuCoin API error: ${data.code} ${data.msg}`)
  }

  return data.data
}

/**
 * Processes raw kline data from KuCoin into a standardized format
 * KuCoin format: [timestamp, open, close, high, low, volume, turnover]
 */
function processKlines(klines) {
  return klines.map((kline) => ({
    openTime: Number.parseInt(kline[0]) * 1000, // Convert to milliseconds
    open: Number.parseFloat(kline[1]),
    high: Number.parseFloat(kline[3]),
    low: Number.parseFloat(kline[4]),
    close: Number.parseFloat(kline[2]),
    volume: Number.parseFloat(kline[5]),
    quoteVolume: Number.parseFloat(kline[6]),
  }))
}

/**
 * Processes order book data from KuCoin
 */
function processOrderBook(orderBook) {
  return {
    sequence: orderBook.sequence,
    bids: orderBook.bids.map((bid) => ({
      price: Number.parseFloat(bid[0]),
      quantity: Number.parseFloat(bid[1]),
    })),
    asks: orderBook.asks.map((ask) => ({
      price: Number.parseFloat(ask[0]),
      quantity: Number.parseFloat(ask[1]),
    })),
    bidSum: orderBook.bids.reduce((sum, bid) => sum + Number.parseFloat(bid[1]), 0),
    askSum: orderBook.asks.reduce((sum, ask) => sum + Number.parseFloat(ask[1]), 0),
    spread: Number.parseFloat(orderBook.asks[0][0]) - Number.parseFloat(orderBook.bids[0][0]),
    spreadPercentage:
      ((Number.parseFloat(orderBook.asks[0][0]) - Number.parseFloat(orderBook.bids[0][0])) /
        Number.parseFloat(orderBook.bids[0][0])) *
      100,
  }
}

/**
 * Calculates technical indicators from the processed data
 */
function calculateIndicators(data) {
  const dailyKlines = data.klines["1d"]

  // Extract close prices
  const closes = dailyKlines.map((k) => k.close)

  // Calculate moving averages
  const sma20 = calculateMovingAverages(closes, 20)
  const sma50 = calculateMovingAverages(closes, 50)

  // Calculate ATR (Average True Range)
  const atr = calculateATR(dailyKlines, 14)

  return {
    sma: {
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1],
    },
    atr: atr[atr.length - 1],
    currentPrice: closes[closes.length - 1],
    marketStats: data.marketStats,
  }
}

/**
 * Calculates Average True Range (ATR)
 */
function calculateATR(klines, period = 14) {
  const trueRanges = []

  // Calculate True Range for each candle
  for (let i = 0; i < klines.length; i++) {
    if (i === 0) {
      // First candle, TR is simply High - Low
      trueRanges.push(klines[i].high - klines[i].low)
    } else {
      // Calculate the three differences
      const highLow = klines[i].high - klines[i].low
      const highPrevClose = Math.abs(klines[i].high - klines[i - 1].close)
      const lowPrevClose = Math.abs(klines[i].low - klines[i - 1].close)

      // True Range is the maximum of the three
      trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose))
    }
  }

  // Calculate ATR using Simple Moving Average of True Ranges
  const atr = []

  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      atr.push(null)
    } else {
      const slice = trueRanges.slice(i - period + 1, i + 1)
      const avg = slice.reduce((sum, tr) => sum + tr, 0) / period
      atr.push(avg)
    }
  }

  return atr
}

export default {
  fetchKucoinData,
}

