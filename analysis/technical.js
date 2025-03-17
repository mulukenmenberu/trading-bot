import { normalizeData, detectArbitrageOpportunities, calculateCorrelation } from '../utils/dataProcessing.js';

/**
 * Performs technical analysis on the data from all exchanges
 * @param {Object} binanceData - Data from Binance
 * @param {Object} bibitData - Data from Bibit
 * @param {Object} kucoinData - Data from KuCoin
 * @returns {Object} - Technical analysis results
 */
export async function performTechnicalAnalysis(binanceData, bibitData, kucoinData) {
  console.log('Performing technical analysis...');
  
  // Normalize data across exchanges
  const normalizedData = normalizeData(binanceData, bibitData, kucoinData);
  
  // Detect arbitrage opportunities
  const arbitrageOpportunities = detectArbitrageOpportunities(normalizedData);
  
  // Analyze trend strength
  const trendStrength = analyzeTrendStrength(binanceData);
  
  // Analyze support and resistance levels
  const supportResistance = analyzeSupportsAndResistances(binanceData);
  
  // Analyze volatility
  const volatility = analyzeVolatility(binanceData);
  
  // Analyze momentum
  const momentum = analyzeMomentum(binanceData);
  
  // Analyze moving averages
  const movingAverages = analyzeMovingAverages(binanceData);
  
  // Analyze oscillators
  const oscillators = analyzeOscillators(binanceData);
  
  // Analyze price patterns
  const patterns = analyzePricePatterns(binanceData);
  
  // Analyze volume profile
  const volumeProfile = analyzeVolumeProfile(binanceData);
  
  // Analyze market structure
  const marketStructure = analyzeMarketStructure(binanceData);
  
  // Combine all analyses
  const technicalAnalysis = {
    normalizedData,
    arbitrageOpportunities,
    trendStrength,
    supportResistance,
    volatility,
    momentum,
    movingAverages,
    oscillators,
    patterns,
    volumeProfile,
    marketStructure,
    timestamp: Date.now()
  };
  
  console.log('Technical analysis completed');
  return technicalAnalysis;
}

/**
 * Analyzes trend strength using ADX and other indicators
 */
function analyzeTrendStrength(data) {
  const dailyKlines = data.klines['1d'];
  const closes = dailyKlines.map(k => k.close);
  
  // Get the last 30 days of data
  const recentCloses = closes.slice(-30);
  
  // Calculate linear regression
  const regression = calculateLinearRegression(recentCloses);
  
  // Calculate ADX (Average Directional Index) - simplified version
  const adx = calculateSimplifiedADX(dailyKlines.slice(-30));
  
  // Determine trend direction
  let trendDirection = 'neutral';
  if (regression.slope > 0.001) {
    trendDirection = 'bullish';
  } else if (regression.slope < -0.001) {
    trendDirection = 'bearish';
  }
  
  // Determine trend strength
  let trendStrength = 'weak';
  if (adx > 25) {
    trendStrength = 'moderate';
  }
  if (adx > 50) {
    trendStrength = 'strong';
  }
  if (adx > 75) {
    trendStrength = 'very strong';
  }
  
  return {
    direction: trendDirection,
    strength: trendStrength,
    adx,
    regression
  };
}

/**
 * Calculates a simplified version of ADX
 */
function calculateSimplifiedADX(klines) {
  // This is a simplified calculation for demonstration
  // In a real implementation, you would calculate +DI, -DI, and true ranges
  
  // Calculate price movements
  const movements = [];
  for (let i = 1; i < klines.length; i++) {
    const movement = Math.abs(klines[i].close - klines[i-1].close) / klines[i-1].close * 100;
    movements.push(movement);
  }
  
  // Calculate average movement (simplified ADX)
  return movements.reduce((sum, movement) => sum + movement, 0) / movements.length * 10;
}

/**
 * Calculates linear regression for a series of values
 */
function calculateLinearRegression(values) {
  const n = values.length;
  
  // Create x values (0, 1, 2, ...)
  const x = Array.from({ length: n }, (_, i) => i);
  
  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = values.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (values[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }
  
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  
  // Calculate R-squared
  let totalSumOfSquares = 0;
  let residualSumOfSquares = 0;
  
  for (let i = 0; i < n; i++) {
    totalSumOfSquares += Math.pow(values[i] - meanY, 2);
    residualSumOfSquares += Math.pow(values[i] - (intercept + slope * x[i]), 2);
  }
  
  const rSquared = 1 - (residualSumOfSquares / totalSumOfSquares);
  
  return {
    slope,
    intercept,
    rSquared
  };
}

/**
 * Analyzes support and resistance levels
 */
function analyzeSupportsAndResistances(data) {
  // Use the support and resistance levels from the Binance data
  const levels = data.indicators.supportResistance;
  
  // Get current price
  const currentPrice = data.klines['1d'][data.klines['1d'].length - 1].close;
  
  // Find nearest support and resistance
  const supports = levels.support.filter(level => level < currentPrice);
  const resistances = levels.resistance.filter(level => level > currentPrice);
  
  const nearestSupport = supports.length > 0 ? Math.max(...supports) : null;
  const nearestResistance = resistances.length > 0 ? Math.min(...resistances) : null;
  
  // Calculate distances
  const supportDistance = nearestSupport ? ((currentPrice - nearestSupport) / currentPrice) * 100 : null;
  const resistanceDistance = nearestResistance ? ((nearestResistance - currentPrice) / currentPrice) * 100 : null;
  
  return {
    levels,
    currentPrice,
    nearestSupport,
    nearestResistance,
    supportDistance,
    resistanceDistance
  };
}

/**
 * Analyzes volatility
 */
function analyzeVolatility(data) {
  const dailyKlines = data.klines['1d'];
  const hourlyKlines = data.klines['1h'];
  
  // Calculate daily volatility (using high-low range)
  const dailyVolatility = dailyKlines.slice(-14).map(k => 
    (k.high - k.low) / k.low * 100
  );
  
  // Calculate hourly volatility
  const hourlyVolatility = hourlyKlines.slice(-24).map(k => 
    (k.high - k.low) / k.low * 100
  );
  
  // Calculate average volatilities
  const avgDailyVolatility = dailyVolatility.reduce((sum, vol) => sum + vol, 0) / dailyVolatility.length;
  const avgHourlyVolatility = hourlyVolatility.reduce((sum, vol) => sum + vol, 0) / hourlyVolatility.length;
  
  // Calculate Bollinger Band width (as a volatility measure)
  const bbWidth = (data.indicators.bollingerBands.upper - data.indicators.bollingerBands.lower) / 
                  data.indicators.bollingerBands.middle * 100;
  
  // Determine volatility level
  let volatilityLevel = 'medium';
  if (avgDailyVolatility < 3) {
    volatilityLevel = 'low';
  } else if (avgDailyVolatility > 7) {
    volatilityLevel = 'high';
  }
  
  return {
    daily: avgDailyVolatility,
    hourly: avgHourlyVolatility,
    bollingerBandWidth: bbWidth,
    level: volatilityLevel
  };
}

/**
 * Analyzes momentum indicators
 */
function analyzeMomentum(data) {
  // Get RSI from the data
  const rsi = data.indicators.rsi;
  
  // Get MACD from the data
  const macd = data.indicators.macd;
  
  // Determine RSI condition
  let rsiCondition = 'neutral';
  if (rsi > 70) {
    rsiCondition = 'overbought';
  } else if (rsi < 30) {
    rsiCondition = 'oversold';
  }
  
  // Determine MACD condition
  let macdCondition = 'neutral';
  if (macd.macdLine > macd.signalLine && macd.histogram > 0) {
    macdCondition = 'bullish';
  } else if (macd.macdLine < macd.signalLine && macd.histogram < 0) {
    macdCondition = 'bearish';
  }
  
  // Determine overall momentum
  let overallMomentum = 'neutral';
  if (rsiCondition === 'overbought' && macdCondition === 'bearish') {
    overallMomentum = 'strongly bearish';
  } else if (rsiCondition === 'oversold' && macdCondition === 'bullish') {
    overallMomentum = 'strongly bullish';
  } else if (rsiCondition === 'overbought' || macdCondition === 'bearish') {
    overallMomentum = 'bearish';
  } else if (rsiCondition === 'oversold' || macdCondition === 'bullish') {
    overallMomentum = 'bullish';
  }
  
  return {
    rsi: {
      value: rsi,
      condition: rsiCondition
    },
    macd: {
      macdLine: macd.macdLine,
      signalLine: macd.signalLine,
      histogram: macd.histogram,
      condition: macdCondition
    },
    overallMomentum
  };
}

/**
 * Analyzes moving averages
 */
function analyzeMovingAverages(data) {
  const sma = data.indicators.sma;
  const currentPrice = data.klines['1d'][data.klines['1d'].length - 1].close;
  
  // Determine price position relative to moving averages
  const aboveSma20 = currentPrice > sma.sma20;
  const aboveSma50 = currentPrice > sma.sma50;
  const aboveSma200 = currentPrice > sma.sma200;
  
  // Check for golden cross (SMA50 crosses above SMA200)
  // This is simplified - in a real implementation, you would check if this happened recently
  const goldenCross = sma.sma50 > sma.sma200;
  
  // Check for death cross (SMA50 crosses below SMA200)
  const deathCross = sma.sma50 < sma.sma200;
  
  // Determine overall MA trend
  let maTrend = 'neutral';
  
  if (aboveSma20 && aboveSma50 && aboveSma200) {
    maTrend = 'strongly bullish';
  } else if (!aboveSma20 && !aboveSma50 && !aboveSma200) {
    maTrend = 'strongly bearish';
  } else if (aboveSma20 && aboveSma50) {
    maTrend = 'bullish';
  } else if (!aboveSma20 && !aboveSma50) {
    maTrend = 'bearish';
  }
  
  return {
    currentPrice,
    sma,
    aboveSma20,
    aboveSma50,
    aboveSma200,
    goldenCross,
    deathCross,
    maTrend
  };
}

/**
 * Analyzes oscillators
 */
function analyzeOscillators(data) {
  // RSI analysis (already done in momentum analysis)
  const rsi = data.indicators.rsi;
  
  // Stochastic oscillator (simplified calculation)
  const stochastic = calculateStochastic(data.klines['1d']);
  
  // CCI (Commodity Channel Index) calculation
  const cci = calculateCCI(data.klines['1d']);
  
  // Determine stochastic condition
  let stochasticCondition = 'neutral';
  if (stochastic.k > 80 && stochastic.d > 80) {
    stochasticCondition = 'overbought';
  } else if (stochastic.k < 20 && stochastic.d < 20) {
    stochasticCondition = 'oversold';
  }
  
  // Determine CCI condition
  let cciCondition = 'neutral';
  if (cci > 100) {
    cciCondition = 'overbought';
  } else if (cci < -100) {
    cciCondition = 'oversold';
  }
  
  // Determine overall oscillator consensus
  let oscillatorConsensus = 'neutral';
  
  // Count bullish and bearish signals
  let bullishCount = 0;
  let bearishCount = 0;
  
  if (rsi < 30) bullishCount++;
  if (rsi > 70) bearishCount++;
  
  if (stochasticCondition === 'oversold') bullishCount++;
  if (stochasticCondition === 'overbought') bearishCount++;
  
  if (cciCondition === 'oversold') bullishCount++;
  if (cciCondition === 'overbought') bearishCount++;
  
  if (bullishCount > bearishCount) {
    oscillatorConsensus = 'bullish';
  } else if (bearishCount > bullishCount) {
    oscillatorConsensus = 'bearish';
  }
  
  return {
    rsi: {
      value: rsi,
      condition: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
    },
    stochastic: {
      k: stochastic.k,
      d: stochastic.d,
      condition: stochasticCondition
    },
    cci: {
      value: cci,
      condition: cciCondition
    },
    consensus: oscillatorConsensus
  };
}

/**
 * Calculates Stochastic Oscillator
 */
function calculateStochastic(klines, kPeriod = 14, dPeriod = 3) {
  if (klines.length < kPeriod) {
    return { k: null, d: null };
  }
  
  // Calculate %K
  const recentKlines = klines.slice(-kPeriod - dPeriod);
  const kValues = [];
  
  for (let i = kPeriod - 1; i < recentKlines.length; i++) {
    const currentClose = recentKlines[i].close;
    
    // Find lowest low and highest high in the period
    const periodKlines = recentKlines.slice(i - kPeriod + 1, i + 1);
    const lowestLow = Math.min(...periodKlines.map(k => k.low));
    const highestHigh = Math.max(...periodKlines.map(k => k.high));
    
    // Calculate %K
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    kValues.push(k);
  }
  
  // Calculate %D (SMA of %K)
  const dValues = [];
  for (let i = dPeriod - 1; i < kValues.length; i++) {
    const periodKValues = kValues.slice(i - dPeriod + 1, i + 1);
    const d = periodKValues.reduce((sum, k) => sum + k, 0) / dPeriod;
    dValues.push(d);
  }
  
  return {
    k: kValues[kValues.length - 1],
    d: dValues[dValues.length - 1]
  };
}

/**
 * Calculates Commodity Channel Index (CCI)
 */
function calculateCCI(klines, period = 20) {
  if (klines.length < period) {
    return null;
  }
  
  const recentKlines = klines.slice(-period);
  
  // Calculate typical price for each candle
  const typicalPrices = recentKlines.map(k => (k.high + k.low + k.close) / 3);
  
  // Calculate SMA of typical prices
  const smaTypicalPrice = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;
  
  // Calculate mean deviation
  const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - smaTypicalPrice), 0) / period;
  
  // Calculate CCI
  const currentTypicalPrice = typicalPrices[typicalPrices.length - 1];
  const cci = (currentTypicalPrice - smaTypicalPrice) / (0.015 * meanDeviation);
  
  return cci;
}

/**
 * Analyzes price patterns
 */
function analyzePricePatterns(data) {
  const dailyKlines = data.klines['1d'].slice(-30); // Last 30 days
  
  // Check for double top pattern
  const doubleTop = detectDoubleTop(dailyKlines);
  
  // Check for double bottom pattern
  const doubleBottom = detectDoubleBottom(dailyKlines);
  
  // Check for head and shoulders pattern
  const headAndShoulders = detectHeadAndShoulders(dailyKlines);
  
  // Check for inverse head and shoulders pattern
  const inverseHeadAndShoulders = detectInverseHeadAndShoulders(dailyKlines);
  
  // Check for bullish and bearish engulfing patterns
  const engulfingPatterns = detectEngulfingPatterns(dailyKlines);
  
  // Determine overall pattern signal
  let patternSignal = 'neutral';
  
  if (doubleBottom.detected || inverseHeadAndShoulders.detected || engulfingPatterns.bullish) {
    patternSignal = 'bullish';
  } else if (doubleTop.detected || headAndShoulders.detected || engulfingPatterns.bearish) {
    patternSignal = 'bearish';
  }
  
  return {
    doubleTop,
    doubleBottom,
    headAndShoulders,
    inverseHeadAndShoulders,
    engulfingPatterns,
    patternSignal
  };
}

/**
 * Detects double top pattern
 */
function detectDoubleTop(klines) {
  // Simplified detection - in a real implementation, this would be more sophisticated
  const closes = klines.map(k => k.close);
  const highs = klines.map(k => k.high);
  
  // Find local maxima
  const localMaxima = [];
  for (let i = 2; i < highs.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
        highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      localMaxima.push({ index: i, value: highs[i] });
    }
  }
  
  // Check if we have at least 2 local maxima
  if (localMaxima.length < 2) {
    return { detected: false };
  }
  
  // Check for similar highs (within 2%)
  for (let i = 0; i < localMaxima.length - 1; i++) {
    for (let j = i + 1; j < localMaxima.length; j++) {
      const diff = Math.abs(localMaxima[i].value - localMaxima[j].value) / localMaxima[i].value;
      
      if (diff < 0.02 && Math.abs(localMaxima[i].index - localMaxima[j].index) > 5) {
        // Check if there's a significant drop between the peaks
        const minBetween = Math.min(...closes.slice(localMaxima[i].index, localMaxima[j].index));
        const dropPercentage = (localMaxima[i].value - minBetween) / localMaxima[i].value;
        
        if (dropPercentage > 0.03) {
          return {
            detected: true,
            firstPeak: localMaxima[i],
            secondPeak: localMaxima[j],
            dropPercentage
          };
        }
      }
    }
  }
  
  return { detected: false };
}

/**
 * Detects double bottom pattern
 */
function detectDoubleBottom(klines) {
  // Simplified detection - in a real implementation, this would be more sophisticated
  const closes = klines.map(k => k.close);
  const lows = klines.map(k => k.low);
  
  // Find local minima
  const localMinima = [];
  for (let i = 2; i < lows.length - 2; i++) {
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
        lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      localMinima.push({ index: i, value: lows[i] });
    }
  }
  
  // Check if we have at least 2 local minima
  if (localMinima.length < 2) {
    return { detected: false };
  }
  
  // Check for similar lows (within 2%)
  for (let i = 0; i < localMinima.length - 1; i++) {
    for (let j = i + 1; j < localMinima.length; j++) {
      const diff = Math.abs(localMinima[i].value - localMinima[j].value) / localMinima[i].value;
      
      if (diff < 0.02 && Math.abs(localMinima[i].index - localMinima[j].index) > 5) {
        // Check if there's a significant rise between the bottoms
        const maxBetween = Math.max(...closes.slice(localMinima[i].index, localMinima[j].index));
        const risePercentage = (maxBetween - localMinima[i].value) / localMinima[i].value;
        
        if (risePercentage > 0.03) {
          return {
            detected: true,
            firstBottom: localMinima[i],
            secondBottom: localMinima[j],
            risePercentage
          };
        }
      }
    }
  }
  
  return { detected: false };
}

/**
 * Detects head and shoulders pattern
 */
function detectHeadAndShoulders(klines) {
  // This is a simplified implementation
  // In a real system, this would be more sophisticated
  return { detected: false };
}

/**
 * Detects inverse head and shoulders pattern
 */
function detectInverseHeadAndShoulders(klines) {
  // This is a simplified implementation
  // In a real system, this would be more sophisticated
  return { detected: false };
}

/**
 * Detects bullish and bearish engulfing patterns
 */
function detectEngulfingPatterns(klines) {
  let bullish = false;
  let bearish = false;
  
  // Check the last few candles
  for (let i = 1; i < Math.min(5, klines.length); i++) {
    const current = klines[klines.length - i];
    const previous = klines[klines.length - i - 1];
    
    // Bullish engulfing
    if (current.close > current.open && 
        previous.close < previous.open &&
        current.open < previous.close &&
        current.close > previous.open) {
      bullish = true;
    }
    
    // Bearish engulfing
    if (current.close < current.open && 
        previous.close > previous.open &&
        current.open > previous.close &&
        current.close < previous.open) {
      bearish = true;
    }
  }
  
  return { bullish, bearish };
}

/**
 * Analyzes volume profile
 */
function analyzeVolumeProfile(data) {
  const dailyKlines = data.klines['1d'];
  
  // Calculate average volume
  const volumes = dailyKlines.map(k => k.volume);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  // Calculate recent volume (last 5 days)
  const recentVolumes = volumes.slice(-5);
  const avgRecentVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
  
  // Calculate volume trend
  const volumeTrend = avgRecentVolume / avgVolume;
  
  // Check for volume spikes
  const volumeSpikes = detectVolumeSpikes(dailyKlines);
  
  // Check for volume divergence
  const volumeDivergence = detectVolumeDivergence(dailyKlines);
  
  // Determine volume signal
  let volumeSignal = 'neutral';
  
  if (volumeTrend > 1.5 && volumeSpikes.recent) {
    volumeSignal = 'strong';
  } else if (volumeTrend > 1.2) {
    volumeSignal = 'increasing';
  } else if (volumeTrend < 0.8) {
    volumeSignal = 'decreasing';
  }
  
  return {
    avgVolume,
    avgRecentVolume,
    volumeTrend,
    volumeSpikes,
    volumeDivergence,
    volumeSignal
  };
}

/**
 * Detects volume spikes
 */
function detectVolumeSpikes(klines) {
  const volumes = klines.map(k => k.volume);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  // Check for recent volume spike (last 3 days)
  const recentSpike = volumes.slice(-3).some(vol => vol > avgVolume * 2);
  
  // Count number of spikes in the dataset
  const spikeCount = volumes.filter(vol => vol > avgVolume * 2).length;
  
  return {
    recent: recentSpike,
    count: spikeCount,
    percentage: (spikeCount / volumes.length) * 100
  };
}

/**
 * Detects volume divergence
 */
function detectVolumeDivergence(klines) {
  // This is a simplified implementation
  // In a real system, this would be more sophisticated
  
  // Check if price is increasing but volume is decreasing
  const prices = klines.map(k => k.close);
  const volumes = klines.map(k => k.volume);
  
  const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
  const volumeChange = (volumes[volumes.length - 1] - volumes[0]) / volumes[0];
  
  const bearishDivergence = priceChange > 0 && volumeChange < 0;
  const bullishDivergence = priceChange < 0 && volumeChange > 0;
  
  return {
    bearish: bearishDivergence,
    bullish: bullishDivergence
  };
}

/**
 * Analyzes market structure
 */
function analyzeMarketStructure(data) {
  const dailyKlines = data.klines['1d'];
  
  // Check for higher highs and higher lows (uptrend)
  const higherHighsLows = checkHigherHighsLows(dailyKlines);
  
  // Check for lower highs and lower lows (downtrend)
  const lowerHighsLows = checkLowerHighsLows(dailyKlines);
  
  // Determine market structure
  let marketStructure = 'ranging';
  
  if (higherHighsLows.higherHighs && higherHighsLows.higherLows) {
    marketStructure = 'uptrend';
  } else if (lowerHighsLows.lowerHighs && lowerHighsLows.lowerLows) {
    marketStructure = 'downtrend';
  }
  
  return {
    higherHighsLows,
    lowerHighsLows,
    structure: marketStructure
  };
}

/**
 * Checks for higher highs and higher lows
 */
function checkHigherHighsLows(klines) {
  // Get the last 10 candles
  const recentKlines = klines.slice(-10);
  
  // Find local highs and lows
  const localHighs = [];
  const localLows = [];
  
  for (let i = 1; i < recentKlines.length - 1; i++) {
    if (recentKlines[i].high > recentKlines[i-1].high && recentKlines[i].high > recentKlines[i+1].high) {
      localHighs.push(recentKlines[i].high);
    }
    
    if (recentKlines[i].low < recentKlines[i-1].low && recentKlines[i].low < recentKlines[i+1].low) {
      localLows.push(recentKlines[i].low);
    }
  }
  
  // Check if we have enough data points
  if (localHighs.length < 2 || localLows.length < 2) {
    return { higherHighs: false, higherLows: false };
  }
  
  // Check for higher highs
  const higherHighs = localHighs[localHighs.length - 1] > localHighs[0];
  
  // Check for higher lows
  const higherLows = localLows[localLows.length - 1] > localLows[0];
  
  return { higherHighs, higherLows };
}

/**
 * Checks for lower highs and lower lows
 */
function checkLowerHighsLows(klines) {
  // Get the last 10 candles
  const recentKlines = klines.slice(-10);
  
  // Find local highs and lows
  const localHighs = [];
  const localLows = [];
  
  for (let i = 1; i < recentKlines.length - 1; i++) {
    if (recentKlines[i].high > recentKlines[i-1].high && recentKlines[i].high > recentKlines[i+1].high) {
      localHighs.push(recentKlines[i].high);
    }
    
    if (recentKlines[i].low < recentKlines[i-1].low && recentKlines[i].low < recentKlines[i+1].low) {
      localLows.push(recentKlines[i].low);
    }
  }
  
  // Check if we have enough data points
  if (localHighs.length < 2 || localLows.length < 2) {
    return { lowerHighs: false, lowerLows: false };
  }
  
  // Check for lower highs
  const lowerHighs = localHighs[localHighs.length - 1] < localHighs[0];
  
  // Check for lower lows
  const lowerLows = localLows[localLows.length - 1] < localLows[0];
  
  return { lowerHighs, lowerLows };
}

export default {
  performTechnicalAnalysis
};