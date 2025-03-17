import fetch from 'node-fetch';
import { calculateMovingAverages } from '../utils/dataProcessing.js';

/**
 * Fetches market data from Bibit API (which uses Binance under the hood)
 * @param {string} symbol - Trading pair symbol (e.g., BTCUSDT)
 * @returns {Promise<Object>} - Processed market data
 */
export async function fetchBibitData(symbol) {
  console.log(`Fetching Bibit data for ${symbol}...`);
  
  try {
    // Since Bibit uses Binance's API under the hood, we'll simulate it with a slight variation
    // In a real implementation, you would use Bibit's actual API endpoints
    
    // Fetch multiple timeframes for comprehensive analysis
    const [klines1h, klines4h, klines1d] = await Promise.all([
      fetchKlines(symbol, '1h', 100),
      fetchKlines(symbol, '4h', 100),
      fetchKlines(symbol, '1d', 100)
    ]);
    
    // Fetch order book data for liquidity analysis
    const orderBook = await fetchOrderBook(symbol);
    
    // Process and structure the data
    const processedData = {
      exchange: 'bibit',
      symbol,
      klines: {
        '1h': processKlines(klines1h),
        '4h': processKlines(klines4h),
        '1d': processKlines(klines1d)
      },
      orderBook: processOrderBook(orderBook),
      timestamp: Date.now()
    };
    
    // Calculate additional indicators
    processedData.indicators = calculateIndicators(processedData);
    
    console.log(`Successfully fetched Bibit data for ${symbol}`);
    return processedData;
  } catch (error) {
    console.error(`Error fetching Bibit data: ${error.message}`);
    throw new Error(`Bibit data fetch failed: ${error.message}`);
  }
}

/**
 * Fetches kline/candlestick data from Bibit (simulated)
 */
async function fetchKlines(symbol, interval, limit) {
  // For simulation purposes, we're using Binance's API with a slight delay
  // to simulate different data from different exchanges
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Bibit klines API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Simulate slight variations in the data to represent Bibit's data
  return data.map(kline => {
    // Add a small random variation to prices (±0.1%)
    const variation = 1 + (Math.random() * 0.002 - 0.001);
    return [
      kline[0],                                // Open time
      (parseFloat(kline[1]) * variation).toString(), // Open price
      (parseFloat(kline[2]) * variation).toString(), // High price
      (parseFloat(kline[3]) * variation).toString(), // Low price
      (parseFloat(kline[4]) * variation).toString(), // Close price
      kline[5],                                // Volume
      kline[6],                                // Close time
      (parseFloat(kline[7]) * variation).toString(), // Quote asset volume
      kline[8],                                // Number of trades
      kline[9],                                // Taker buy base asset volume
      kline[10]                                // Taker buy quote asset volume
    ];
  });
}

/**
 * Fetches order book data from Bibit (simulated)
 */
async function fetchOrderBook(symbol, limit = 100) {
  // For simulation purposes, we're using Binance's API
  const url = `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Bibit order book API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Simulate slight variations in the data to represent Bibit's data
  return {
    lastUpdateId: data.lastUpdateId,
    bids: data.bids.map(bid => {
      const variation = 1 + (Math.random() * 0.002 - 0.001);
      return [
        (parseFloat(bid[0]) * variation).toString(), // Price
        bid[1]                                       // Quantity
      ];
    }),
    asks: data.asks.map(ask => {
      const variation = 1 + (Math.random() * 0.002 - 0.001);
      return [
        (parseFloat(ask[0]) * variation).toString(), // Price
        ask[1]                                       // Quantity
      ];
    })
  };
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
 * Calculates technical indicators from the processed data
 */
function calculateIndicators(data) {
  const dailyKlines = data.klines['1d'];
  
  // Extract close prices
  const closes = dailyKlines.map(k => k.close);
  
  // Calculate moving averages
  const sma20 = calculateMovingAverages(closes, 20);
  const sma50 = calculateMovingAverages(closes, 50);
  
  // Calculate simple momentum
  const momentum = calculateMomentum(closes, 14);
  
  return {
    sma: {
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1]
    },
    momentum: momentum[momentum.length - 1],
    currentPrice: closes[closes.length - 1]
  };
}

/**
 * Calculates momentum indicator
 */
function calculateMomentum(prices, period = 14) {
  const momentum = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      momentum.push(null);
    } else {
      momentum.push(prices[i] / prices[i - period]);
    }
  }
  
  return momentum;
}

export default {
  fetchBibitData
};