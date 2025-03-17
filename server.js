import express from 'express';
import cors from 'cors';
import { fetchBinanceData } from './exchanges/binance.js';
import { fetchBibitData } from './exchanges/bibit.js';
import { fetchKucoinData } from './exchanges/kucoin.js';
import { performTechnicalAnalysis } from './analysis/technical.js';
import { performSentimentAnalysis } from './analysis/sentiment.js';
import { performVolumeAnalysis } from './analysis/volume.js';
import { generateTradeRecommendation } from './recommendation/trade.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Main API endpoint for trade analysis
app.post('/api/analyze', async (req, res) => {
  try {
    let { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required (e.g., BTCUSDT)' });
    }
    symbol = symbol+'USDT'
    console.log(`Starting analysis for ${symbol}...`);
    
    // Fetch data from multiple exchanges in parallel
    const [binanceData, bibitData, kucoinData] = await Promise.all([
      fetchBinanceData(symbol),
      fetchBibitData(symbol),
      fetchKucoinData(symbol)
    ]);
    
    // Perform different types of analysis
    const technicalAnalysis = await performTechnicalAnalysis(binanceData, bibitData, kucoinData);
    const sentimentAnalysis = await performSentimentAnalysis(symbol);
    const volumeAnalysis = await performVolumeAnalysis(binanceData, bibitData, kucoinData);
    
    // Generate trade recommendation
    const recommendation = generateTradeRecommendation(
      symbol,
      technicalAnalysis,
      sentimentAnalysis,
      volumeAnalysis
    );
    
    console.log(`Analysis completed for ${symbol}`);
    res.json(recommendation);
  } catch (error) {
    console.error('Error in analysis:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;