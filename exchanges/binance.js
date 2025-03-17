import fetch from 'node-fetch';
import { calculateMovingAverages, normalizeData } from '../utils/dataProcessing.js';

/**
 * Fetches market data from Binance API
 * @param {string} symbol - Trading pair symbol (e.g., BTCUSDT)
 * @returns {Promise<Object>} - Processed market data
 */
export async function fetchBinanceData(symbol) {
  console.log(`Fetching Binance data for ${symbol}...`);
  
  try {
    // Fetch multiple timeframes for comprehensive analysis
    const [klines1h, klines4h, klines1d] = await Promise.all([
      fetchKlines(symbol, '1h', 100),
      fetchKlines(symbol, '4h', 100),
      fetchKlines(symbol, '1d', 100)
    ]);
    
    // Fetch order book data for liquidity analysis
    const orderBook = await fetchOrderBook(symbol);
    
    // Fetch recent trades for volume analysis
    const recentTrades = await fetchRecentTrades(symbol);
    
    // Process and structure the data
    const processedData = {
      exchange: 'binance',
      symbol,
      klines: {
        '1h': processKlines(klines1h),
        '4h': processKlines(klines4h),
        '1d': processKlines(klines1d)
      },
      orderBook: processOrderBook(orderBook),
      recentTrades: processRecentTrades(recentTrades),
      timestamp: Date.now()
    };
    
    // Calculate additional indicators
    processedData.indicators = calculateIndicators(processedData);
    
    console.log(`Successfully fetched Binance data for ${symbol}`);
    return processedData;
  } catch (error) {
    console.error(`Error fetching Binance data: ${error.message}`);
    throw new Error(`Binance data fetch failed: ${error.message}`);
  }
}

/**
 * Fetches kline/candlestick data from Binance
 */
async function fetchKlines(symbol, interval, limit) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Binance klines API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetches order book data from Binance
 */
async function fetchOrderBook(symbol, limit = 100) {
  const url = `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Binance order book API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetches recent trades from Binance
 */
async function fetchRecentTrades(symbol, limit = 1000) {
  const url = `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=${limit}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Binance recent trades API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Processes raw kline data into a more usable format
 */
function processKlines(klines) {
  return klines.map(kline => ({
    openTime: kline[0],
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
    volume: parseFloat(kline[5]),
    closeTime: kline[6],
    quoteAssetVolume: parseFloat(kline[7]),
    numberOfTrades: parseInt(kline[8]),
    takerBuyBaseAssetVolume: parseFloat(kline[9]),
    takerBuyQuoteAssetVolume: parseFloat(kline[10])
  }));
}

/**
 * Processes order book data
 */
function processOrderBook(orderBook) {
  return {
    lastUpdateId: orderBook.lastUpdateId,
    bids: orderBook.bids.map(bid => ({
      price: parseFloat(bid[0]),
      quantity: parseFloat(bid[1])
    })),
    asks: orderBook.asks.map(ask => ({
      price: parseFloat(ask[0]),
      quantity: parseFloat(ask[1])
    })),
    bidSum: orderBook.bids.reduce((sum, bid) => sum + parseFloat(bid[1]), 0),
    askSum: orderBook.asks.reduce((sum, ask) => sum + parseFloat(ask[1]), 0),
    spread: parseFloat(orderBook.asks[0][0]) - parseFloat(orderBook.bids[0][0]),
    spreadPercentage: (parseFloat(orderBook.asks[0][0]) - parseFloat(orderBook.bids[0][0])) / parseFloat(orderBook.bids[0][0]) * 100
  };
}

/**
 * Processes recent trades data
 */
function processRecentTrades(trades) {
  const processedTrades = trades.map(trade => ({
    id: trade.id,
    price: parseFloat(trade.price),
    quantity: parseFloat(trade.qty),
    time: trade.time,
    isBuyerMaker: trade.isBuyerMaker,
    isBestMatch: trade.isBestMatch
  }));
  
  // Calculate buy/sell ratio
  const buyVolume = processedTrades
    .filter(trade => !trade.isBuyerMaker)
    .reduce((sum, trade) => sum + trade.quantity, 0);
    
  const sellVolume = processedTrades
    .filter(trade => trade.isBuyerMaker)
    .reduce((sum, trade) => sum + trade.quantity, 0);
  
  return {
    trades: processedTrades,
    buyVolume,
    sellVolume,
    buySellRatio: buyVolume / sellVolume,
    totalVolume: buyVolume + sellVolume,
    averagePrice: processedTrades.reduce((sum, trade) => sum + trade.price, 0) / processedTrades.length
  };
}

/**
 * Calculates technical indicators from the processed data
 */
function calculateIndicators(data) {
  const dailyKlines = data.klines['1d'];
  const hourlyKlines = data.klines['1h'];
  
  // Extract close prices
  const dailyCloses = dailyKlines.map(k => k.close);
  const hourlyCloses = hourlyKlines.map(k => k.close);
  
  // Calculate moving averages
  const sma20 = calculateMovingAverages(dailyCloses, 20);
  const sma50 = calculateMovingAverages(dailyCloses, 50);
  const sma200 = calculateMovingAverages(dailyCloses, 200);
  
  // Calculate RSI (14-period)
  const rsi = calculateRSI(dailyCloses, 14);
  
  // Calculate MACD
  const macd = calculateMACD(dailyCloses);
  
  // Calculate Bollinger Bands
  const bollingerBands = calculateBollingerBands(dailyCloses, 20, 2);
  
  // Calculate volatility
  const volatility = calculateVolatility(dailyCloses, 14);
  
  // Calculate support and resistance levels
  const supportResistance = identifySupportResistance(dailyKlines);
  
  return {
    sma: {
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1],
      sma200: sma200[sma200.length - 1]
    },
    rsi: rsi[rsi.length - 1],
    macd: {
      macdLine: macd.macdLine[macd.macdLine.length - 1],
      signalLine: macd.signalLine[macd.signalLine.length - 1],
      histogram: macd.histogram[macd.histogram.length - 1]
    },
    bollingerBands: {
      upper: bollingerBands.upper[bollingerBands.upper.length - 1],
      middle: bollingerBands.middle[bollingerBands.middle.length - 1],
      lower: bollingerBands.lower[bollingerBands.lower.length - 1]
    },
    volatility,
    supportResistance
  };
}

/**
 * Calculates Relative Strength Index (RSI)
 */
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) {
    return Array(prices.length).fill(null);
  }
  
  // Calculate price changes
  const deltas = [];
  for (let i = 1; i < prices.length; i++) {
    deltas.push(prices[i] - prices[i - 1]);
  }
  
  // Calculate gains and losses
  const gains = deltas.map(d => d > 0 ? d : 0);
  const losses = deltas.map(d => d < 0 ? Math.abs(d) : 0);
  
  // Calculate average gains and losses
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  const rsiValues = [null];
  
  // First RSI value
  if (avgLoss === 0) {
    rsiValues.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsiValues.push(100 - (100 / (1 + rs)));
  }
  
  // Calculate RSI for the rest of the data
  for (let i = period + 1; i < prices.length; i++) {
    const currentGain = gains[i - 1];
    const currentLoss = losses[i - 1];
    
    avgGain = ((avgGain * (period - 1)) + currentGain) / period;
    avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
    
    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsiValues;
}

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 */
function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  // Calculate EMAs
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // Calculate MACD line
  const macdLine = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < slowPeriod - 1) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const validMacdValues = macdLine.filter(value => value !== null);
  const signalLine = calculateEMA(validMacdValues, signalPeriod);
  
  // Pad signal line with nulls to match the length of the MACD line
  const paddedSignalLine = Array(macdLine.length - signalLine.length).fill(null).concat(signalLine);
  
  // Calculate histogram (MACD line - signal line)
  const histogram = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null || paddedSignalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i] - paddedSignalLine[i]);
    }
  }
  
  return {
    macdLine,
    signalLine: paddedSignalLine,
    histogram
  };
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
function calculateEMA(prices, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first EMA value
  const sma = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  ema.push(sma);
  
  // Calculate EMA for the rest of the data
  for (let i = period; i < prices.length; i++) {
    ema.push((prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }
  
  // Pad with nulls to match the length of the input array
  return Array(period - 1).fill(null).concat(ema);
}

/**
 * Calculates Bollinger Bands
 */
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const middle = calculateMovingAverages(prices, period);
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const std = calculateStandardDeviation(slice);
      upper.push(middle[i] + stdDev * std);
      lower.push(middle[i] - stdDev * std);
    }
  }
  
  return { upper, middle, lower };
}

/**
 * Calculates standard deviation
 */
function calculateStandardDeviation(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculates historical volatility
 */
function calculateVolatility(prices, period = 14) {
  if (prices.length < period) {
    return null;
  }
  
  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  // Calculate standard deviation of returns
  const recentReturns = returns.slice(-period);
  return calculateStandardDeviation(recentReturns) * Math.sqrt(365); // Annualized volatility
}

/**
 * Identifies support and resistance levels
 */
function identifySupportResistance(klines) {
  // Extract highs and lows
  const highs = klines.map(k => k.high);
  const lows = klines.map(k => k.low);
  
  // Find local maxima and minima
  const resistanceLevels = findLocalExtrema(highs, true);
  const supportLevels = findLocalExtrema(lows, false);
  
  // Cluster nearby levels
  const clusteredResistance = clusterLevels(resistanceLevels);
  const clusteredSupport = clusterLevels(supportLevels);
  
  return {
    resistance: clusteredResistance.slice(0, 5), // Top 5 resistance levels
    support: clusteredSupport.slice(0, 5)        // Top 5 support levels
  };
}

/**
 * Finds local extrema (maxima or minima) in a data series
 */
function findLocalExtrema(data, findMaxima, windowSize = 5) {
  const extrema = [];
  
  for (let i = windowSize; i < data.length - windowSize; i++) {
    const window = data.slice(i - windowSize, i + windowSize + 1);
    const centerValue = data[i];
    
    if (findMaxima) {
      // For maxima, center value should be the highest in the window
      if (centerValue === Math.max(...window)) {
        extrema.push({ value: centerValue, index: i });
      }
    } else {
      // For minima, center value should be the lowest in the window
      if (centerValue === Math.min(...window)) {
        extrema.push({ value: centerValue, index: i });
      }
    }
  }
  
  return extrema;
}

/**
 * Clusters nearby price levels
 */
function clusterLevels(levels, threshold = 0.01) {
  if (levels.length === 0) return [];
  
  // Sort levels by value
  const sortedLevels = [...levels].sort((a, b) => a.value - b.value);
  
  const clusters = [];
  let currentCluster = [sortedLevels[0]];
  
  for (let i = 1; i < sortedLevels.length; i++) {
    const currentLevel = sortedLevels[i];
    const lastLevel = currentCluster[currentCluster.length - 1];
    
    // If the current level is close to the last level in the cluster, add it to the cluster
    if ((currentLevel.value - lastLevel.value) / lastLevel.value < threshold) {
      currentCluster.push(currentLevel);
    } else {
      // Otherwise, finish the current cluster and start a new one
      const avgValue = currentCluster.reduce((sum, level) => sum + level.value, 0) / currentCluster.length;
      clusters.push(avgValue);
      currentCluster = [currentLevel];
    }
  }
  
  // Add the last cluster
  if (currentCluster.length > 0) {
    const avgValue = currentCluster.reduce((sum, level) => sum + level.value, 0) / currentCluster.length;
    clusters.push(avgValue);
  }
  
  return clusters;
}

export default {
  fetchBinanceData
};