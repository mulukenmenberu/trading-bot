/**
 * Utility functions for data processing and analysis
 */

/**
 * Calculates Simple Moving Average (SMA)
 * @param {Array<number>} data - Array of price data
 * @param {number} period - Period for the moving average
 * @returns {Array<number>} - Array of SMA values
 */
export function calculateMovingAverages(data, period) {
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((total, value) => total + value, 0);
      result.push(sum / period);
    }
  }
  
  return result;
}

/**
 * Normalizes data from different exchanges to a common format
 * @param {Object} binanceData - Data from Binance
 * @param {Object} bibitData - Data from Bibit
 * @param {Object} kucoinData - Data from KuCoin
 * @returns {Object} - Normalized data
 */
export function normalizeData(binanceData, bibitData, kucoinData) {
  // Extract the latest prices from each exchange
  const binancePrice = binanceData.klines['1d'][binanceData.klines['1d'].length - 1].close;
  const bibitPrice = bibitData.klines['1d'][bibitData.klines['1d'].length - 1].close;
  const kucoinPrice = kucoinData.klines['1d'][kucoinData.klines['1d'].length - 1].close;
  
  // Calculate the average price across exchanges
  const averagePrice = (binancePrice + bibitPrice + kucoinPrice) / 3;
  
  // Calculate price deviations
  const binanceDeviation = (binancePrice - averagePrice) / averagePrice * 100;
  const bibitDeviation = (bibitPrice - averagePrice) / averagePrice * 100;
  const kucoinDeviation = (kucoinPrice - averagePrice) / averagePrice * 100;
  
  // Normalize volume data
  const binanceVolume = binanceData.klines['1d'].reduce((sum, k) => sum + k.volume, 0);
  const bibitVolume = bibitData.klines['1d'].reduce((sum, k) => sum + k.volume, 0);
  const kucoinVolume = kucoinData.klines['1d'].reduce((sum, k) => sum + k.volume, 0);
  
  const totalVolume = binanceVolume + bibitVolume + kucoinVolume;
  
  return {
    symbol: binanceData.symbol,
    prices: {
      binance: binancePrice,
      bibit: bibitPrice,
      kucoin: kucoinPrice,
      average: averagePrice
    },
    deviations: {
      binance: binanceDeviation,
      bibit: bibitDeviation,
      kucoin: kucoinDeviation
    },
    volumes: {
      binance: binanceVolume,
      bibit: bibitVolume,
      kucoin: kucoinVolume,
      total: totalVolume,
      distribution: {
        binance: (binanceVolume / totalVolume) * 100,
        bibit: (bibitVolume / totalVolume) * 100,
        kucoin: (kucoinVolume / totalVolume) * 100
      }
    },
    timestamp: Date.now()
  };
}

/**
 * Detects arbitrage opportunities between exchanges
 * @param {Object} normalizedData - Normalized data from all exchanges
 * @returns {Object} - Arbitrage opportunities
 */
export function detectArbitrageOpportunities(normalizedData) {
  const { prices } = normalizedData;
  const opportunities = [];
  
  // Check for price differences greater than 0.5%
  const threshold = 0.5;
  
  // Binance -> Bibit
  const binanceToBibit = ((prices.bibit - prices.binance) / prices.binance) * 100;
  if (Math.abs(binanceToBibit) > threshold) {
    opportunities.push({
      from: binanceToBibit > 0 ? 'binance' : 'bibit',
      to: binanceToBibit > 0 ? 'bibit' : 'binance',
      priceDifference: Math.abs(binanceToBibit),
      potentialProfit: Math.abs(binanceToBibit) - 0.2 // Subtracting estimated fees
    });
  }
  
  // Binance -> KuCoin
  const binanceToKucoin = ((prices.kucoin - prices.binance) / prices.binance) * 100;
  if (Math.abs(binanceToKucoin) > threshold) {
    opportunities.push({
      from: binanceToKucoin > 0 ? 'binance' : 'kucoin',
      to: binanceToKucoin > 0 ? 'kucoin' : 'binance',
      priceDifference: Math.abs(binanceToKucoin),
      potentialProfit: Math.abs(binanceToKucoin) - 0.2 // Subtracting estimated fees
    });
  }
  
  // Bibit -> KuCoin
  const bibitToKucoin = ((prices.kucoin - prices.bibit) / prices.bibit) * 100;
  if (Math.abs(bibitToKucoin) > threshold) {
    opportunities.push({
      from: bibitToKucoin > 0 ? 'bibit' : 'kucoin',
      to: bibitToKucoin > 0 ? 'kucoin' : 'bibit',
      priceDifference: Math.abs(bibitToKucoin),
      potentialProfit: Math.abs(bibitToKucoin) - 0.2 // Subtracting estimated fees
    });
  }
  
  return {
    found: opportunities.length > 0,
    opportunities: opportunities.sort((a, b) => b.potentialProfit - a.potentialProfit)
  };
}

/**
 * Calculates correlation between two data series
 * @param {Array<number>} series1 - First data series
 * @param {Array<number>} series2 - Second data series
 * @returns {number} - Correlation coefficient (-1 to 1)
 */
export function calculateCorrelation(series1, series2) {
  if (series1.length !== series2.length) {
    throw new Error('Data series must have the same length');
  }
  
  const n = series1.length;
  
  // Calculate means
  const mean1 = series1.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = series2.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate covariance and variances
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = series1[i] - mean1;
    const diff2 = series2[i] - mean2;
    
    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }
  
  // Calculate correlation coefficient
  return covariance / (Math.sqrt(variance1) * Math.sqrt(variance2));
}

export default {
  calculateMovingAverages,
  normalizeData,
  detectArbitrageOpportunities,
  calculateCorrelation
};