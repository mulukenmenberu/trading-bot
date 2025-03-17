import fetch from 'node-fetch';

/**
 * Performs sentiment analysis for a cryptocurrency
 * @param {string} symbol - Trading pair symbol (e.g., BTCUSDT)
 * @returns {Promise<Object>} - Sentiment analysis results
 */
export async function performSentimentAnalysis(symbol) {
  console.log(`Performing sentiment analysis for ${symbol}...`);
  
  try {
    // Extract the base currency from the symbol (e.g., BTC from BTCUSDT)
    const baseCurrency = extractBaseCurrency(symbol);
    
    // Fetch social media sentiment
    const socialSentiment = await fetchSocialMediaSentiment(baseCurrency);
    
    // Fetch news sentiment
    const newsSentiment = await fetchNewsSentiment(baseCurrency);
    
    // Fetch market fear and greed index
    const fearGreedIndex = await fetchFearGreedIndex();
    
    // Fetch funding rates (for futures)
    const fundingRates = await fetchFundingRates(symbol);
    
    // Combine all sentiment data
    const sentimentAnalysis = {
      symbol,
      baseCurrency,
      social: socialSentiment,
      news: newsSentiment,
      fearGreedIndex,
      fundingRates,
      timestamp: Date.now()
    };
    
    // Calculate overall sentiment score
    sentimentAnalysis.overallSentiment = calculateOverallSentiment(sentimentAnalysis);
    
    console.log(`Sentiment analysis completed for ${symbol}`);
    return sentimentAnalysis;
  } catch (error) {
    console.error(`Error in sentiment analysis: ${error.message}`);
    
    // Return a default sentiment analysis with neutral values
    return {
      symbol,
      baseCurrency: extractBaseCurrency(symbol),
      social: { score: 0, sentiment: 'neutral', volume: 'medium' },
      news: { score: 0, sentiment: 'neutral', volume: 'medium' },
      fearGreedIndex: { value: 50, classification: 'neutral' },
      fundingRates: { average: 0, sentiment: 'neutral' },
      overallSentiment: { score: 0, classification: 'neutral' },
      timestamp: Date.now(),
      error: error.message
    };
  }
}

/**
 * Extracts the base currency from a trading pair symbol
 */
function extractBaseCurrency(symbol) {
  // Common quote currencies
  const quoteCurrencies = ['USDT', 'USD', 'BUSD', 'USDC', 'BTC', 'ETH'];
  
  // Find which quote currency is used
  for (const quote of quoteCurrencies) {
    if (symbol.endsWith(quote)) {
      return symbol.substring(0, symbol.length - quote.length);
    }
  }
  
  // Default fallback
  return symbol.substring(0, 3);
}

/**
 * Fetches social media sentiment
 * In a real implementation, this would connect to Twitter/X, Reddit, etc. APIs
 */
async function fetchSocialMediaSentiment(currency) {
  console.log(`Fetching social media sentiment for ${currency}...`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate simulated sentiment data
  // In a real implementation, this would analyze actual social media data
  
  // Generate a sentiment score between -1 and 1
  // Use the first character of the currency to seed the random number for consistency
  const seed = currency.charCodeAt(0) / 100;
  const sentimentScore = (Math.sin(seed) * 0.5) + (Math.random() * 0.5 - 0.25);
  
  // Determine sentiment classification
  let sentiment = 'neutral';
  if (sentimentScore > 0.3) sentiment = 'bullish';
  if (sentimentScore > 0.6) sentiment = 'very bullish';
  if (sentimentScore < -0.3) sentiment = 'bearish';
  if (sentimentScore < -0.6) sentiment = 'very bearish';
  
  // Determine volume classification
  const volumeScore = Math.abs(sentimentScore) + (Math.random() * 0.5);
  let volume = 'medium';
  if (volumeScore > 0.7) volume = 'high';
  if (volumeScore < 0.3) volume = 'low';
  
  return {
    score: parseFloat(sentimentScore.toFixed(2)),
    sentiment,
    volume,
    sources: {
      twitter: {
        score: parseFloat((sentimentScore * 1.1).toFixed(2)),
        volume: Math.floor(1000 + Math.random() * 9000)
      },
      reddit: {
        score: parseFloat((sentimentScore * 0.9).toFixed(2)),
        volume: Math.floor(500 + Math.random() * 4500)
      },
      telegram: {
        score: parseFloat((sentimentScore * 1.2).toFixed(2)),
        volume: Math.floor(300 + Math.random() * 2700)
      }
    }
  };
}

/**
 * Fetches news sentiment
 * In a real implementation, this would connect to news APIs and analyze articles
 */
async function fetchNewsSentiment(currency) {
  console.log(`Fetching news sentiment for ${currency}...`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate simulated news sentiment data
  // In a real implementation, this would analyze actual news articles
  
  // Generate a sentiment score between -1 and 1
  // Use the second character of the currency to seed the random number for consistency
  const seed = currency.charCodeAt(1) / 100;
  const sentimentScore = (Math.cos(seed) * 0.5) + (Math.random() * 0.5 - 0.25);
  
  // Determine sentiment classification
  let sentiment = 'neutral';
  if (sentimentScore > 0.3) sentiment = 'bullish';
  if (sentimentScore > 0.6) sentiment = 'very bullish';
  if (sentimentScore < -0.3) sentiment = 'bearish';
  if (sentimentScore < -0.6) sentiment = 'very bearish';
  
  // Determine volume classification
  const volumeScore = Math.abs(sentimentScore) + (Math.random() * 0.5);
  let volume = 'medium';
  if (volumeScore > 0.7) volume = 'high';
  if (volumeScore < 0.3) volume = 'low';
  
  // Generate recent headlines
  const headlines = generateHeadlines(currency, sentiment);
  
  return {
    score: parseFloat(sentimentScore.toFixed(2)),
    sentiment,
    volume,
    headlines
  };
}

/**
 * Generates simulated news headlines
 */
function generateHeadlines(currency, sentiment) {
  const bullishHeadlines = [
    `${currency} Poised for Breakout as Institutional Interest Grows`,
    `Analysts Predict ${currency} Will Outperform the Market This Quarter`,
    `New ${currency} Partnership Announcement Drives Price Higher`,
    `${currency} Technical Indicators Show Strong Buy Signal`,
    `Major Bank Adds ${currency} to Its Balance Sheet`
  ];
  
  const bearishHeadlines = [
    `${currency} Faces Regulatory Scrutiny in Major Markets`,
    `Investors Cautious as ${currency} Volatility Increases`,
    `${currency} Downtrend Continues Amid Market Uncertainty`,
    `Technical Analysis: ${currency} May Test Lower Support Levels`,
    `Large ${currency} Whale Moves Funds to Exchange, Sparking Sell-off Concerns`
  ];
  
  const neutralHeadlines = [
    `${currency} Price Stabilizes Following Recent Market Movements`,
    `Experts Divided on ${currency}'s Short-term Outlook`,
    `${currency} Trading Volume Remains Consistent Despite Market Fluctuations`,
    `New ${currency} Update Released, Market Impact Unclear`,
    `${currency} Maintains Position in Top Cryptocurrencies by Market Cap`
  ];
  
  // Select headlines based on sentiment
  let headlines;
  if (sentiment.includes('bullish')) {
    headlines = bullishHeadlines;
  } else if (sentiment.includes('bearish')) {
    headlines = bearishHeadlines;
  } else {
    headlines = neutralHeadlines;
  }
  
  // Shuffle and take 3 headlines
  return shuffleArray(headlines).slice(0, 3);
}

/**
 * Shuffles an array
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Fetches the Fear & Greed Index
 * In a real implementation, this would connect to the actual Fear & Greed Index API
 */
async function fetchFearGreedIndex() {
  console.log('Fetching Fear & Greed Index...');
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate a value between 0 and 100
  const value = Math.floor(Math.random() * 100);
  
  // Determine classification
  let classification;
  if (value <= 25) classification = 'extreme fear';
  else if (value <= 40) classification = 'fear';
  else if (value <= 60) classification = 'neutral';
  else if (value <= 75) classification = 'greed';
  else classification = 'extreme greed';
  
  return {
    value,
    classification
  };
}

/**
 * Fetches funding rates for futures contracts
 * In a real implementation, this would connect to exchange APIs
 */
async function fetchFundingRates(symbol) {
  console.log(`Fetching funding rates for ${symbol}...`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate simulated funding rates
  const binanceFunding = (Math.random() * 0.002 - 0.001).toFixed(4);
  const bybitFunding = (Math.random() * 0.002 - 0.001).toFixed(4);
  const ftxFunding = (Math.random() * 0.002 - 0.001).toFixed(4);
  
  // Calculate average funding rate
  const average = parseFloat(((parseFloat(binanceFunding) + parseFloat(bybitFunding) + parseFloat(ftxFunding)) / 3).toFixed(4));
  
  // Determine sentiment based on funding rate
  let sentiment = 'neutral';
  if (average > 0.0005) sentiment = 'bullish';
  if (average > 0.001) sentiment = 'very bullish';
  if (average < -0.0005) sentiment = 'bearish';
  if (average < -0.001) sentiment = 'very bearish';
  
  return {
    exchanges: {
      binance: parseFloat(binanceFunding),
      bybit: parseFloat(bybitFunding),
      ftx: parseFloat(ftxFunding)
    },
    average,
    sentiment
  };
}

/**
 * Calculates overall sentiment score based on all sentiment indicators
 */
function calculateOverallSentiment(sentimentData) {
  // Weights for different sentiment sources
  const weights = {
    social: 0.3,
    news: 0.2,
    fearGreed: 0.3,
    fundingRates: 0.2
  };
  
  // Normalize Fear & Greed Index to a -1 to 1 scale
  const fearGreedScore = (sentimentData.fearGreedIndex.value - 50) / 50;
  
  // Calculate weighted score
  const weightedScore = 
    (sentimentData.social.score * weights.social) +
    (sentimentData.news.score * weights.news) +
    (fearGreedScore * weights.fearGreed) +
    (sentimentData.fundingRates.average * 100 * weights.fundingRates);
  
  // Determine classification
  let classification = 'neutral';
  if (weightedScore > 0.2) classification = 'bullish';
  if (weightedScore > 0.5) classification = 'very bullish';
  if (weightedScore < -0.2) classification = 'bearish';
  if (weightedScore < -0.5) classification = 'very bearish';
  
  return {
    score: parseFloat(weightedScore.toFixed(2)),
    classification
  };
}

export default {
  performSentimentAnalysis
};