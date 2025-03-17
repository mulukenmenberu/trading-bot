/**
 * Generates a trade recommendation based on all analyses
 * @param {string} symbol - Trading pair symbol
 * @param {Object} technicalAnalysis - Technical analysis results
 * @param {Object} sentimentAnalysis - Sentiment analysis results
 * @param {Object} volumeAnalysis - Volume analysis results
 * @returns {Object} - Trade recommendation
 */
export function generateTradeRecommendation(symbol, technicalAnalysis, sentimentAnalysis, volumeAnalysis) {
  console.log(`Generating trade recommendation for ${symbol}...`);
  
  try {
    // Determine trade direction (long, short, or neutral)
    const direction = determineTradeDirection(technicalAnalysis, sentimentAnalysis, volumeAnalysis);
    
    // If neutral, return early with no trade recommendation
    if (direction === 'neutral') {
      return {
        symbol,
        recommendation: 'neutral',
        confidence: 'low',
        reason: 'Conflicting signals or lack of clear direction in the market',
        timestamp: Date.now()
      };
    }
    
    // Calculate confidence level
    const confidence = calculateConfidence(technicalAnalysis, sentimentAnalysis, volumeAnalysis, direction);
    
    // Determine entry points
    const entries = determineEntryPoints(technicalAnalysis, direction);
    
    // Determine take profit targets
    const takeProfitTargets = determineTakeProfitTargets(technicalAnalysis, direction);
    
    // Determine stop loss
    const stopLoss = determineStopLoss(technicalAnalysis, direction, entries);
    
    // Calculate recommended leverage based on confidence and volatility
    const leverage = calculateLeverage(confidence, technicalAnalysis.volatility);
    
    // Generate reasoning for the trade
    const reasoning = generateReasoning(technicalAnalysis, sentimentAnalysis, volumeAnalysis, direction);
    
    // Combine all recommendations
    const recommendation = {
      symbol,
      recommendation: direction,
      confidence,
      entries,
      takeProfitTargets,
      stopLoss,
      leverage,
      reasoning,
      analysisTimestamp: Date.now(),
      technicalSummary: summarizeTechnicalAnalysis(technicalAnalysis),
      sentimentSummary: summarizeSentimentAnalysis(sentimentAnalysis),
      volumeSummary: summarizeVolumeAnalysis(volumeAnalysis)
    };
    
    console.log(`Trade recommendation generated for ${symbol}`);
    return recommendation;
  } catch (error) {
    console.error(`Error generating trade recommendation: ${error.message}`);
    
    // Return a neutral recommendation in case of error
    return {
      symbol,
      recommendation: 'neutral',
      confidence: 'low',
      reason: `Error generating recommendation: ${error.message}`,
      timestamp: Date.now()
    };
  }
}

/**
 * Determines the trade direction based on all analyses
 */
function determineTradeDirection(technicalAnalysis, sentimentAnalysis, volumeAnalysis) {
  // Count bullish and bearish signals from technical analysis
  let technicalBullishCount = 0;
  let technicalBearishCount = 0;
  
  // Trend analysis
  if (technicalAnalysis.trendStrength.direction === 'bullish') technicalBullishCount++;
  if (technicalAnalysis.trendStrength.direction === 'bearish') technicalBearishCount++;
  
  // Moving averages
  if (technicalAnalysis.movingAverages.maTrend.includes('bullish')) technicalBullishCount++;
  if (technicalAnalysis.movingAverages.maTrend.includes('bearish')) technicalBearishCount++;
  
  // Momentum
  if (technicalAnalysis.momentum.overallMomentum.includes('bullish')) technicalBullishCount++;
  if (technicalAnalysis.momentum.overallMomentum.includes('bearish')) technicalBearishCount++;
  
  // Oscillators
  if (technicalAnalysis.oscillators.consensus === 'bullish') technicalBullishCount++;
  if (technicalAnalysis.oscillators.consensus === 'bearish') technicalBearishCount++;
  
  // Price patterns
  if (technicalAnalysis.patterns.patternSignal === 'bullish') technicalBullishCount++;
  if (technicalAnalysis.patterns.patternSignal === 'bearish') technicalBearishCount++;
  
  // Market structure
  if (technicalAnalysis.marketStructure.structure === 'uptrend') technicalBullishCount++;
  if (technicalAnalysis.marketStructure.structure === 'downtrend') technicalBearishCount++;
  
  // Count sentiment signals
  let sentimentBullishCount = 0;
  let sentimentBearishCount = 0;
  
  // Overall sentiment
  if (sentimentAnalysis.overallSentiment.classification.includes('bullish')) sentimentBullishCount++;
  if (sentimentAnalysis.overallSentiment.classification.includes('bearish')) sentimentBearishCount++;
  
  // Social sentiment
  if (sentimentAnalysis.social.sentiment.includes('bullish')) sentimentBullishCount++;
  if (sentimentAnalysis.social.sentiment.includes('bearish')) sentimentBearishCount++;
  
  // News sentiment
  if (sentimentAnalysis.news.sentiment.includes('bullish')) sentimentBullishCount++;
  if (sentimentAnalysis.news.sentiment.includes('bearish')) sentimentBearishCount++;
  
  // Fear & Greed Index
  if (sentimentAnalysis.fearGreedIndex.classification === 'extreme greed') sentimentBullishCount++;
  if (sentimentAnalysis.fearGreedIndex.classification === 'extreme fear') sentimentBearishCount++;
  
  // Count volume signals
  let volumeBullishCount = 0;
  let volumeBearishCount = 0;
  
  // Volume trends
  if (volumeAnalysis.volumeTrends.classification === 'increasing') volumeBullishCount++;
  if (volumeAnalysis.volumeTrends.classification === 'decreasing') volumeBearishCount++;
  
  // Buy/sell ratio
  if (volumeAnalysis.buySellRatio.pressureClassification === 'buying') volumeBullishCount++;
  if (volumeAnalysis.buySellRatio.pressureClassification === 'selling') volumeBearishCount++;
  
  // Volume at price
  if (volumeAnalysis.volumeAtPrice.volumeWallClassification === 'strong support') volumeBullishCount++;
  if (volumeAnalysis.volumeAtPrice.volumeWallClassification === 'strong resistance') volumeBearishCount++;
  
  // Calculate total bullish and bearish signals
  const totalBullish = technicalBullishCount + sentimentBullishCount + volumeBullishCount;
  const totalBearish = technicalBearishCount + sentimentBearishCount + volumeBearishCount;
  
  // Determine direction based on signal counts
  if (totalBullish > totalBearish && totalBullish - totalBearish >= 3) {
    return 'long';
  } else if (totalBearish > totalBullish && totalBearish - totalBullish >= 3) {
    return 'short';
  } else {
    return 'neutral';
  }
}

/**
 * Calculates confidence level for the trade recommendation
 */
function calculateConfidence(technicalAnalysis, sentimentAnalysis, volumeAnalysis, direction) {
  // Base confidence score
  let confidenceScore = 0;
  
  // Add confidence based on trend strength
  if (technicalAnalysis.trendStrength.strength === 'strong' && 
      technicalAnalysis.trendStrength.direction === (direction === 'long' ? 'bullish' : 'bearish')) {
    confidenceScore += 2;
  } else if (technicalAnalysis.trendStrength.strength === 'moderate' && 
             technicalAnalysis.trendStrength.direction === (direction === 'long' ? 'bullish' : 'bearish')) {
    confidenceScore += 1;
  }
  
  // Add confidence based on momentum
  const momentumDirection = direction === 'long' ? 'bullish' : 'bearish';
  if (technicalAnalysis.momentum.overallMomentum.includes('strongly') && 
      technicalAnalysis.momentum.overallMomentum.includes(momentumDirection)) {
    confidenceScore += 2;
  } else if (technicalAnalysis.momentum.overallMomentum === momentumDirection) {
    confidenceScore += 1;
  }
  
  // Add confidence based on moving averages
  const maDirection = direction === 'long' ? 'bullish' : 'bearish';
  if (technicalAnalysis.movingAverages.maTrend.includes('strongly') && 
      technicalAnalysis.movingAverages.maTrend.includes(maDirection)) {
    confidenceScore += 2;
  } else if (technicalAnalysis.movingAverages.maTrend === maDirection) {
    confidenceScore += 1;
  }
  
  // Add confidence based on sentiment
  const sentimentDirection = direction === 'long' ? 'bullish' : 'bearish';
  if (sentimentAnalysis.overallSentiment.classification.includes('very') && 
      sentimentAnalysis.overallSentiment.classification.includes(sentimentDirection)) {
    confidenceScore += 2;
  } else if (sentimentAnalysis.overallSentiment.classification === sentimentDirection) {
    confidenceScore += 1;
  }
  
  // Add confidence based on volume
  if (volumeAnalysis.buySellRatio.pressureClassification === (direction === 'long' ? 'buying' : 'selling')) {
    confidenceScore += 1;
  }
  
  if (volumeAnalysis.volumeAtPrice.volumeWallClassification === 
      (direction === 'long' ? 'strong support' : 'strong resistance')) {
    confidenceScore += 1;
  }
  
  // Determine confidence level
  if (confidenceScore >= 7) {
    return 'very high';
  } else if (confidenceScore >= 5) {
    return 'high';
  } else if (confidenceScore >= 3) {
    return 'moderate';
  } else {
    return 'low';
  }
}

/**
 * Determines entry points for the trade
 */
function determineEntryPoints(technicalAnalysis, direction) {
  const currentPrice = technicalAnalysis.supportResistance.currentPrice;
  const entries = [];
  
  if (direction === 'long') {
    // For long positions, consider current price and support levels
    
    // Entry at current price
    entries.push({
      price: currentPrice,
      type: 'market',
      allocation: 0.4, // 40% of position
      reason: 'Immediate market entry'
    });
    
    // Entry at nearest support
    if (technicalAnalysis.supportResistance.nearestSupport) {
      const supportPrice = technicalAnalysis.supportResistance.nearestSupport;
      entries.push({
        price: supportPrice,
        type: 'limit',
        allocation: 0.3, // 30% of position
        reason: 'Entry at nearest support level'
      });
    }
    
    // Entry at lower support if available
    const supports = technicalAnalysis.supportResistance.levels.support;
    if (supports.length >= 2) {
      const lowerSupport = supports[1]; // Second strongest support
      entries.push({
        price: lowerSupport,
        type: 'limit',
        allocation: 0.3, // 30% of position
        reason: 'Entry at secondary support level'
      });
    }
  } else if (direction === 'short') {
    // For short positions, consider current price and resistance levels
    
    // Entry at current price
    entries.push({
      price: currentPrice,
      type: 'market',
      allocation: 0.4, // 40% of position
      reason: 'Immediate market entry'
    });
    
    // Entry at nearest resistance
    if (technicalAnalysis.supportResistance.nearestResistance) {
      const resistancePrice = technicalAnalysis.supportResistance.nearestResistance;
      entries.push({
        price: resistancePrice,
        type: 'limit',
        allocation: 0.3, // 30% of position
        reason: 'Entry at nearest resistance level'
      });
    }
    
    // Entry at higher resistance if available
    const resistances = technicalAnalysis.supportResistance.levels.resistance;
    if (resistances.length >= 2) {
      const higherResistance = resistances[1]; // Second strongest resistance
      entries.push({
        price: higherResistance,
        type: 'limit',
        allocation: 0.3, // 30% of position
        reason: 'Entry at secondary resistance level'
      });
    }
  }
  
  return entries;
}

/**
 * Determines take profit targets for the trade
 */
function determineTakeProfitTargets(technicalAnalysis, direction) {
  const currentPrice = technicalAnalysis.supportResistance.currentPrice;
  const takeProfitTargets = [];
  
  if (direction === 'long') {
    // For long positions, use resistance levels as take profit targets
    const resistances = technicalAnalysis.supportResistance.levels.resistance;
    
    // If we have resistance levels, use them
    if (resistances.length > 0) {
      // First take profit at nearest resistance
      takeProfitTargets.push({
        price: resistances[0],
        allocation: 0.3, // 30% of position
        percentageGain: ((resistances[0] - currentPrice) / currentPrice) * 100,
        reason: 'First take profit at nearest resistance'
      });
      
      // Second take profit at next resistance if available
      if (resistances.length > 1) {
        takeProfitTargets.push({
          price: resistances[1],
          allocation: 0.3, // 30% of position
          percentageGain: ((resistances[1] - currentPrice) / currentPrice) * 100,
          reason: 'Second take profit at higher resistance'
        });
      }
      
      // Third take profit at highest resistance or projected level
      if (resistances.length > 2) {
        takeProfitTargets.push({
          price: resistances[2],
          allocation: 0.4, // 40% of position
          percentageGain: ((resistances[2] - currentPrice) / currentPrice) * 100,
          reason: 'Final take profit at major resistance'
        });
      } else {
        // If we don't have a third resistance level, project one
        const projectedTarget = currentPrice * 1.1; // 10% above current price
        takeProfitTargets.push({
          price: projectedTarget,
          allocation: 0.4, // 40% of position
          percentageGain: 10,
          reason: 'Final take profit at projected target'
        });
      }
    } else {
      // If no resistance levels are available, use percentage-based targets
      takeProfitTargets.push({
        price: currentPrice * 1.03, // 3% above current price
        allocation: 0.3,
        percentageGain: 3,
        reason: 'First take profit at 3% gain'
      });
      
      takeProfitTargets.push({
        price: currentPrice * 1.05, // 5% above current price
        allocation: 0.3,
        percentageGain: 5,
        reason: 'Second take profit at 5% gain'
      });
      
      takeProfitTargets.push({
        price: currentPrice * 1.1, // 10% above current price
        allocation: 0.4,
        percentageGain: 10,
        reason: 'Final take profit at 10% gain'
      });
    }
  } else if (direction === 'short') {
    // For short positions, use support levels as take profit targets
    const supports = technicalAnalysis.supportResistance.levels.support;
    
    // If we have support levels, use them
    if (supports.length > 0) {
      // First take profit at nearest support
      takeProfitTargets.push({
        price: supports[0],
        allocation: 0.3, // 30% of position
        percentageGain: ((currentPrice - supports[0]) / currentPrice) * 100,
        reason: 'First take profit at nearest support'
      });
      
      // Second take profit at next support if available
      if (supports.length > 1) {
        takeProfitTargets.push({
          price: supports[1],
          allocation: 0.3, // 30% of position
          percentageGain: ((currentPrice - supports[1]) / currentPrice) * 100,
          reason: 'Second take profit at lower support'
        });
      }
      
      // Third take profit at lowest support or projected level
      if (supports.length > 2) {
        takeProfitTargets.push({
          price: supports[2],
          allocation: 0.4, // 40% of position
          percentageGain: ((currentPrice - supports[2]) / currentPrice) * 100,
          reason: 'Final take profit at major support'
        });
      } else {
        // If we don't have a third support level, project one
        const projectedTarget = currentPrice * 0.9; // 10% below current price
        takeProfitTargets.push({
          price: projectedTarget,
          allocation: 0.4, // 40% of position
          percentageGain: 10,
          reason: 'Final take profit at projected target'
        });
      }
    } else {
      // If no support levels are available, use percentage-based targets
      takeProfitTargets.push({
        price: currentPrice * 0.97, // 3% below current price
        allocation: 0.3,
        percentageGain: 3,
        reason: 'First take profit at 3% gain'
      });
      
      takeProfitTargets.push({
        price: currentPrice * 0.95, // 5% below current price
        allocation: 0.3,
        percentageGain: 5,
        reason: 'Second take profit at 5% gain'
      });
      
      takeProfitTargets.push({
        price: currentPrice * 0.9, // 10% below current price
        allocation: 0.4,
        percentageGain: 10,
        reason: 'Final take profit at 10% gain'
      });
    }
  }
  
  return takeProfitTargets;
}

/**
 * Determines stop loss level for the trade
 */
function determineStopLoss(technicalAnalysis, direction, entries) {
  const currentPrice = technicalAnalysis.supportResistance.currentPrice;
  
  if (direction === 'long') {
    // For long positions, stop loss should be below a support level
    
    // If we have a support level, use it
    if (technicalAnalysis.supportResistance.nearestSupport) {
      const supportPrice = technicalAnalysis.supportResistance.nearestSupport;
      const stopPrice = supportPrice * 0.98; // 2% below support
      
      return {
        price: stopPrice,
        percentageLoss: ((currentPrice - stopPrice) / currentPrice) * 100,
        reason: 'Stop loss placed below nearest support level'
      };
    } else {
      // If no support level is available, use a percentage-based stop loss
      // Use the lowest entry point as reference
      const lowestEntry = Math.min(...entries.map(entry => entry.price));
      const stopPrice = lowestEntry * 0.95; // 5% below lowest entry
      
      return {
        price: stopPrice,
        percentageLoss: ((currentPrice - stopPrice) / currentPrice) * 100,
        reason: 'Stop loss placed 5% below lowest entry point'
      };
    }
  } else if (direction === 'short') {
    // For short positions, stop loss should be above a resistance level
    
    // If we have a resistance level, use it
    if (technicalAnalysis.supportResistance.nearestResistance) {
      const resistancePrice = technicalAnalysis.supportResistance.nearestResistance;
      const stopPrice = resistancePrice * 1.02; // 2% above resistance
      
      return {
        price: stopPrice,
        percentageLoss: ((stopPrice - currentPrice) / currentPrice) * 100,
        reason: 'Stop loss placed above nearest resistance level'
      };
    } else {
      // If no resistance level is available, use a percentage-based stop loss
      // Use the highest entry point as reference
      const highestEntry = Math.max(...entries.map(entry => entry.price));
      const stopPrice = highestEntry * 1.05; // 5% above highest entry
      
      return {
        price: stopPrice,
        percentageLoss: ((stopPrice - currentPrice) / currentPrice) * 100,
        reason: 'Stop loss placed 5% above highest entry point'
      };
    }
  }
}

/**
 * Calculates recommended leverage based on confidence and volatility
 */
function calculateLeverage(confidence, volatility) {
  // Base leverage based on confidence
  let baseLeverage = 1; // Default to 1x
  
  if (confidence === 'very high') {
    baseLeverage = 5;
  } else if (confidence === 'high') {
    baseLeverage = 3;
  } else if (confidence === 'moderate') {
    baseLeverage = 2;
  }
  
  // Adjust leverage based on volatility
  let volatilityMultiplier = 1;
  
  if (volatility.level === 'low') {
    volatilityMultiplier = 1.5;
  } else if (volatility.level === 'high') {
    volatilityMultiplier = 0.5;
  }
  
  // Calculate final leverage
  const finalLeverage = Math.round(baseLeverage * volatilityMultiplier);
  
  // Determine risk level
  let riskLevel = 'moderate';
  if (finalLeverage >= 4) {
    riskLevel = 'high';
  } else if (finalLeverage <= 2) {
    riskLevel = 'low';
  }
  
  return {
    recommended: finalLeverage,
    riskLevel,
    reason: `Leverage based on ${confidence} confidence and ${volatility.level} volatility`
  };
}

/**
 * Generates reasoning for the trade recommendation
 */
function generateReasoning(technicalAnalysis, sentimentAnalysis, volumeAnalysis, direction) {
  const reasons = [];
  
  // Add technical analysis reasons
  if (direction === 'long') {
    // Reasons for long position
    if (technicalAnalysis.trendStrength.direction === 'bullish') {
      reasons.push(`Market is in a ${technicalAnalysis.trendStrength.strength} bullish trend`);
    }
    
    if (technicalAnalysis.movingAverages.maTrend.includes('bullish')) {
      reasons.push(`Price is trading above key moving averages (${technicalAnalysis.movingAverages.aboveSma20 ? 'above SMA20' : ''} ${technicalAnalysis.movingAverages.aboveSma50 ? 'above SMA50' : ''} ${technicalAnalysis.movingAverages.aboveSma200 ? 'above SMA200' : ''})`);
    }
    
    if (technicalAnalysis.momentum.overallMomentum.includes('bullish')) {
      reasons.push(`Momentum indicators are showing ${technicalAnalysis.momentum.overallMomentum} signals`);
    }
    
    if (technicalAnalysis.oscillators.consensus === 'bullish') {
      reasons.push('Oscillators are in bullish territory');
    }
    
    if (technicalAnalysis.patterns.doubleBottom.detected) {
      reasons.push('Double bottom pattern detected, indicating potential reversal');
    }
    
    if (technicalAnalysis.patterns.inverseHeadAndShoulders.detected) {
      reasons.push('Inverse head and shoulders pattern detected, indicating potential reversal');
    }
    
    if (technicalAnalysis.marketStructure.structure === 'uptrend') {
      reasons.push('Market structure shows higher highs and higher lows, confirming uptrend');
    }
  } else if (direction === 'short') {
    // Reasons for short position
    if (technicalAnalysis.trendStrength.direction === 'bearish') {
      reasons.push(`Market is in a ${technicalAnalysis.trendStrength.strength} bearish trend`);
    }
    
    if (technicalAnalysis.movingAverages.maTrend.includes('bearish')) {
      reasons.push(`Price is trading below key moving averages (${!technicalAnalysis.movingAverages.aboveSma20 ? 'below SMA20' : ''} ${!technicalAnalysis.movingAverages.aboveSma50 ? 'below SMA50' : ''} ${!technicalAnalysis.movingAverages.aboveSma200 ? 'below SMA200' : ''})`);
    }
    
    if (technicalAnalysis.momentum.overallMomentum.includes('bearish')) {
      reasons.push(`Momentum indicators are showing ${technicalAnalysis.momentum.overallMomentum} signals`);
    }
    
    if (technicalAnalysis.oscillators.consensus === 'bearish') {
      reasons.push('Oscillators are in bearish territory');
    }
    
    if (technicalAnalysis.patterns.doubleTop.detected) {
      reasons.push('Double top pattern detected, indicating potential reversal');
    }
    
    if (technicalAnalysis.patterns.headAndShoulders.detected) {
      reasons.push('Head and shoulders pattern detected, indicating potential reversal');
    }
    
    if (technicalAnalysis.marketStructure.structure === 'downtrend') {
      reasons.push('Market structure shows lower highs and lower lows, confirming downtrend');
    }
  }
  
  // Add sentiment analysis reasons
  if (sentimentAnalysis.overallSentiment.classification.includes(direction === 'long' ? 'bullish' : 'bearish')) {
    reasons.push(`Overall market sentiment is ${sentimentAnalysis.overallSentiment.classification}`);
  }
  
  if (sentimentAnalysis.social.sentiment.includes(direction === 'long' ? 'bullish' : 'bearish')) {
    reasons.push(`Social media sentiment is ${sentimentAnalysis.social.sentiment} with ${sentimentAnalysis.social.volume} volume`);
  }
  
  if (sentimentAnalysis.news.sentiment.includes(direction === 'long' ? 'bullish' : 'bearish')) {
    reasons.push(`News sentiment is ${sentimentAnalysis.news.sentiment}`);
  }
  
  if (direction === 'long' && sentimentAnalysis.fearGreedIndex.classification === 'extreme fear') {
    reasons.push('Market is in extreme fear, potential contrarian buy signal');
  } else if (direction === 'short' && sentimentAnalysis.fearGreedIndex.classification === 'extreme greed') {
    reasons.push('Market is in extreme greed, potential contrarian sell signal');
  }
  
  // Add volume analysis reasons
  if (volumeAnalysis.volumeTrends.classification === (direction === 'long' ? 'increasing' : 'decreasing')) {
    reasons.push(`Volume is ${volumeAnalysis.volumeTrends.classification}, supporting the ${direction} position`);
  }
  
  if (volumeAnalysis.buySellRatio.pressureClassification === (direction === 'long' ? 'buying' : 'selling')) {
    reasons.push(`${direction === 'long' ? 'Buying' : 'Selling'} pressure is dominant with a ${volumeAnalysis.buySellRatio.ratio.toFixed(2)} buy/sell ratio`);
  }
  
  if (direction === 'long' && volumeAnalysis.volumeAtPrice.volumeWallClassification === 'strong support') {
    reasons.push('Strong volume support detected below current price');
  } else if (direction === 'short' && volumeAnalysis.volumeAtPrice.volumeWallClassification === 'strong resistance') {
    reasons.push('Strong volume resistance detected above current price');
  }
  
  // Add risk warnings
  if (direction === 'long') {
    reasons.push(`Key risk: Stop loss placed at ${technicalAnalysis.supportResistance.nearestSupport ? 'support level' : '5% below entry'}`);
  } else {
    reasons.push(`Key risk: Stop loss placed at ${technicalAnalysis.supportResistance.nearestResistance ? 'resistance level' : '5% above entry'}`);
  }
  
  return reasons;
}

/**
 * Summarizes technical analysis for the recommendation
 */
function summarizeTechnicalAnalysis(technicalAnalysis) {
  return {
    trend: {
      direction: technicalAnalysis.trendStrength.direction,
      strength: technicalAnalysis.trendStrength.strength
    },
    movingAverages: {
      trend: technicalAnalysis.movingAverages.maTrend,
      sma20: technicalAnalysis.movingAverages.sma.sma20,
      sma50: technicalAnalysis.movingAverages.sma.sma50,
      sma200: technicalAnalysis.movingAverages.sma.sma200
    },
    momentum: {
      overall: technicalAnalysis.momentum.overallMomentum,
      rsi: technicalAnalysis.momentum.rsi.value,
      macd: {
        line: technicalAnalysis.momentum.macd.macdLine,
        signal: technicalAnalysis.momentum.macd.signalLine,
        histogram: technicalAnalysis.momentum.macd.histogram
      }
    },
    supportResistance: {
      nearestSupport: technicalAnalysis.supportResistance.nearestSupport,
      nearestResistance: technicalAnalysis.supportResistance.nearestResistance
    },
    volatility: {
      level: technicalAnalysis.volatility.level,
      daily: technicalAnalysis.volatility.daily
    }
  };
}

/**
 * Summarizes sentiment analysis for the recommendation
 */
function summarizeSentimentAnalysis(sentimentAnalysis) {
  return {
    overall: {
      classification: sentimentAnalysis.overallSentiment.classification,
      score: sentimentAnalysis.overallSentiment.score
    },
    social: {
      sentiment: sentimentAnalysis.social.sentiment,
      volume: sentimentAnalysis.social.volume
    },
    news: {
      sentiment: sentimentAnalysis.news.sentiment,
      headlines: sentimentAnalysis.news.headlines
    },
    fearGreedIndex: {
      value: sentimentAnalysis.fearGreedIndex.value,
      classification: sentimentAnalysis.fearGreedIndex.classification
    }
  };
}

/**
 * Summarizes volume analysis for the recommendation
 */
function summarizeVolumeAnalysis(volumeAnalysis) {
  return {
    trends: {
      classification: volumeAnalysis.volumeTrends.classification,
      last24h: volumeAnalysis.volumeTrends.volumes.last24h
    },
    buySellRatio: {
      ratio: volumeAnalysis.buySellRatio.ratio,
      pressure: volumeAnalysis.buySellRatio.pressureClassification
    },
    volumeAtPrice: {
      classification: volumeAnalysis.volumeAtPrice.volumeWallClassification,
      bidAskRatio: volumeAnalysis.volumeAtPrice.bidAskRatio
    }
  };
}

export default {
  generateTradeRecommendation
};