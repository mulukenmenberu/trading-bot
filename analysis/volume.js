/**
 * Performs volume analysis on the data from all exchanges
 * @param {Object} binanceData - Data from Binance
 * @param {Object} bibitData - Data from Bibit
 * @param {Object} kucoinData - Data from KuCoin
 * @returns {Object} - Volume analysis results
 */
export async function performVolumeAnalysis(binanceData, bibitData, kucoinData) {
  console.log('Performing volume analysis...');
  
  try {
    // Analyze volume trends
    const volumeTrends = analyzeVolumeTrends(binanceData);
    
    // Analyze volume distribution across exchanges
    const volumeDistribution = analyzeVolumeDistribution(binanceData, bibitData, kucoinData);
    
    // Analyze buy/sell volume ratio
    const buySellRatio = analyzeBuySellRatio(binanceData);
    
    // Analyze volume at price levels
    const volumeAtPrice = analyzeVolumeAtPrice(binanceData);
    
    // Analyze volume anomalies
    const volumeAnomalies = detectVolumeAnomalies(binanceData);
    
    // Combine all analyses
    const volumeAnalysis = {
      volumeTrends,
      volumeDistribution,
      buySellRatio,
      volumeAtPrice,
      volumeAnomalies,
      timestamp: Date.now()
    };
    
    console.log('Volume analysis completed');
    return volumeAnalysis;
  } catch (error) {
    console.error(`Error in volume analysis: ${error.message}`);
    throw new Error(`Volume analysis failed: ${error.message}`);
  }
}

/**
 * Analyzes volume trends over different time periods
 */
function analyzeVolumeTrends(data) {
  const hourlyKlines = data.klines['1h'];
  const dailyKlines = data.klines['1d'];
  
  // Extract volumes
  const hourlyVolumes = hourlyKlines.map(k => k.volume);
  const dailyVolumes = dailyKlines.map(k => k.volume);
  
  // Calculate average volumes for different periods
  const last24hVolume = hourlyVolumes.slice(-24).reduce((sum, vol) => sum + vol, 0);
  const last7dVolume = dailyVolumes.slice(-7).reduce((sum, vol) => sum + vol, 0);
  const last30dVolume = dailyVolumes.slice(-30).reduce((sum, vol) => sum + vol, 0);
  
  // Calculate average daily volumes
  const avgDaily24h = last24hVolume;
  const avgDaily7d = last7dVolume / 7;
  const avgDaily30d = last30dVolume / 30;
  
  // Calculate volume trends
  const trend24hVs7d = (avgDaily24h / avgDaily7d - 1) * 100;
  const trend7dVs30d = (avgDaily7d / avgDaily30d - 1) * 100;
  
  // Determine volume trend classification
  let trendClassification = 'stable';
  if (trend24hVs7d > 20) {
    trendClassification = 'increasing';
  } else if (trend24hVs7d < -20) {
    trendClassification = 'decreasing';
  }
  
  // Check for volume spikes in the last 24 hours
  const volumeSpikes = hourlyVolumes.slice(-24).filter(vol => vol > avgDaily7d).length;
  
  return {
    volumes: {
      last24h: last24hVolume,
      last7d: last7dVolume,
      last30d: last30dVolume
    },
    averages: {
      daily24h: avgDaily24h,
      daily7d: avgDaily7d,
      daily30d: avgDaily30d
    },
    trends: {
      trend24hVs7d,
      trend7dVs30d
    },
    classification: trendClassification,
    volumeSpikes
  };
}

/**
 * Analyzes volume distribution across exchanges
 */
function analyzeVolumeDistribution(binanceData, bibitData, kucoinData) {
  // Extract 24h volumes from each exchange
  const binanceVolume = binanceData.klines['1h'].slice(-24).reduce((sum, k) => sum + k.volume, 0);
  const bibitVolume = bibitData.klines['1h'].slice(-24).reduce((sum, k) => sum + k.volume, 0);
  const kucoinVolume = kucoinData.klines['1h'].slice(-24).reduce((sum, k) => sum + k.volume, 0);
  
  // Calculate total volume
  const totalVolume = binanceVolume + bibitVolume + kucoinVolume;
  
  // Calculate percentages
  const binancePercentage = (binanceVolume / totalVolume) * 100;
  const bibitPercentage = (bibitVolume / totalVolume) * 100;
  const kucoinPercentage = (kucoinVolume / totalVolume) * 100;
  
  // Determine dominant exchange
  let dominantExchange = 'binance';
  let dominantPercentage = binancePercentage;
  
  if (bibitPercentage > dominantPercentage) {
    dominantExchange = 'bibit';
    dominantPercentage = bibitPercentage;
  }
  
  if (kucoinPercentage > dominantPercentage) {
    dominantExchange = 'kucoin';
    dominantPercentage = kucoinPercentage;
  }
  
  // Calculate volume concentration
  const volumeConcentration = dominantPercentage;
  
  // Determine concentration classification
  let concentrationClassification = 'moderate';
  if (volumeConcentration > 70) {
    concentrationClassification = 'high';
  } else if (volumeConcentration < 40) {
    concentrationClassification = 'low';
  }
  
  return {
    volumes: {
      binance: binanceVolume,
      bibit: bibitVolume,
      kucoin: kucoinVolume,
      total: totalVolume
    },
    percentages: {
      binance: binancePercentage,
      bibit: bibitPercentage,
      kucoin: kucoinPercentage
    },
    dominantExchange,
    dominantPercentage,
    concentrationClassification
  };
}

/**
 * Analyzes buy/sell volume ratio
 */
function analyzeBuySellRatio(data) {
  // Use recent trades data if available
  if (data.recentTrades) {
    const buyVolume = data.recentTrades.buyVolume;
    const sellVolume = data.recentTrades.sellVolume;
    const ratio = data.recentTrades.buySellRatio;
    
    // Determine pressure classification
    let pressureClassification = 'neutral';
    if (ratio > 1.2) {
      pressureClassification = 'buying';
    } else if (ratio < 0.8) {
      pressureClassification = 'selling';
    }
    
    return {
      buyVolume,
      sellVolume,
      ratio,
      pressureClassification
    };
  }
  
  // If recent trades data is not available, use candle data as a proxy
  const hourlyKlines = data.klines['1h'].slice(-24);
  
  let buyVolume = 0;
  let sellVolume = 0;
  
  for (const kline of hourlyKlines) {
    if (kline.close > kline.open) {
      // Green candle - approximate as buying volume
      buyVolume += kline.volume;
    } else {
      // Red candle - approximate as selling volume
      sellVolume += kline.volume;
    }
  }
  
  const ratio = buyVolume / (sellVolume || 1); // Avoid division by zero
  
  // Determine pressure classification
  let pressureClassification = 'neutral';
  if (ratio > 1.2) {
    pressureClassification = 'buying';
  } else if (ratio < 0.8) {
    pressureClassification = 'selling';
  }
  
  return {
    buyVolume,
    sellVolume,
    ratio,
    pressureClassification,
    note: 'Approximated from candle data'
  };
}

/**
 * Analyzes volume at different price levels
 */
function analyzeVolumeAtPrice(data) {
  // Use order book data to analyze volume at price levels
  const orderBook = data.orderBook;
  
  // Calculate total bid and ask volumes
  const totalBidVolume = orderBook.bidSum;
  const totalAskVolume = orderBook.askSum;
  
  // Calculate bid/ask ratio
  const bidAskRatio = totalBidVolume / totalAskVolume;
  
  // Determine support/resistance levels based on volume
  const volumeThreshold = totalBidVolume * 0.1; // 10% of total bid volume
  
  // Find support levels (price levels with high bid volume)
  const supportLevels = [];
  let cumulativeVolume = 0;
  
  for (const bid of orderBook.bids) {
    cumulativeVolume += bid.quantity;
    if (cumulativeVolume > volumeThreshold) {
      supportLevels.push({
        price: bid.price,
        volume: cumulativeVolume
      });
      cumulativeVolume = 0;
    }
  }
  
  // Find resistance levels (price levels with high ask volume)
  const resistanceLevels = [];
  cumulativeVolume = 0;
  
  for (const ask of orderBook.asks) {
    cumulativeVolume += ask.quantity;
    if (cumulativeVolume > volumeThreshold) {
      resistanceLevels.push({
        price: ask.price,
        volume: cumulativeVolume
      });
      cumulativeVolume = 0;
    }
  }
  
  // Determine volume wall classification
  let volumeWallClassification = 'balanced';
  if (bidAskRatio > 1.5) {
    volumeWallClassification = 'strong support';
  } else if (bidAskRatio < 0.67) {
    volumeWallClassification = 'strong resistance';
  }
  
  return {
    bidVolume: totalBidVolume,
    askVolume: totalAskVolume,
    bidAskRatio,
    supportLevels: supportLevels.slice(0, 3), // Top 3 support levels
    resistanceLevels: resistanceLevels.slice(0, 3), // Top 3 resistance levels
    volumeWallClassification
  };
}

/**
 * Detects volume anomalies
 */
function detectVolumeAnomalies(data) {
  const hourlyKlines = data.klines['1h'];
  const dailyKlines = data.klines['1d'];
  
  // Extract volumes
  const hourlyVolumes = hourlyKlines.map(k => k.volume);
  const dailyVolumes = dailyKlines.map(k => k.volume);
  
  // Calculate average and standard deviation for hourly volumes
  const hourlyAvg = hourlyVolumes.reduce((sum, vol) => sum + vol, 0) / hourlyVolumes.length;
  const hourlyStdDev = Math.sqrt(
    hourlyVolumes.reduce((sum, vol) => sum + Math.pow(vol - hourlyAvg, 2), 0) / hourlyVolumes.length
  );
  
  // Calculate average and standard deviation for daily volumes
  const dailyAvg = dailyVolumes.reduce((sum, vol) => sum + vol, 0) / dailyVolumes.length;
  const dailyStdDev = Math.sqrt(
    dailyVolumes.reduce((sum, vol) => sum + Math.pow(vol - dailyAvg, 2), 0) / dailyVolumes.length
  );
  
  // Detect hourly anomalies (volumes more than 3 standard deviations from the mean)
  const hourlyAnomalies = [];
  for (let i = 0; i < hourlyVolumes.length; i++) {
    const zScore = (hourlyVolumes[i] - hourlyAvg) / hourlyStdDev;
    if (Math.abs(zScore) > 3) {
      hourlyAnomalies.push({
        index: i,
        timestamp: hourlyKlines[i].openTime,
        volume: hourlyVolumes[i],
        zScore
      });
    }
  }
  
  // Detect daily anomalies
  const dailyAnomalies = [];
  for (let i = 0; i < dailyVolumes.length; i++) {
    const zScore = (dailyVolumes[i] - dailyAvg) / dailyStdDev;
    if (Math.abs(zScore) > 3) {
      dailyAnomalies.push({
        index: i,
        timestamp: dailyKlines[i].openTime,
        volume: dailyVolumes[i],
        zScore
      });
    }
  }
  
  // Check for recent anomalies (last 24 hours)
  const recentHourlyAnomalies = hourlyAnomalies.filter(
    anomaly => anomaly.index >= hourlyVolumes.length - 24
  );
  
  // Check for recent anomalies (last 7 days)
  const recentDailyAnomalies = dailyAnomalies.filter(
    anomaly => anomaly.index >= dailyVolumes.length - 7
  );
  
  return {
    hourly: {
      anomalies: hourlyAnomalies,
      recentAnomalies: recentHourlyAnomalies,
      hasRecentAnomalies: recentHourlyAnomalies.length > 0
    },
    daily: {
      anomalies: dailyAnomalies,
      recentAnomalies: recentDailyAnomalies,
      hasRecentAnomalies: recentDailyAnomalies.length > 0
    }
  };
}

export default {
  performVolumeAnalysis
};