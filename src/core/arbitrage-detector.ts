import { Market, ArbitrageOpportunity, BestPrices } from "../types";
import { config } from "../config";
import { logger } from "../utils/logger";
import PolymarketAPI from "../services/polymarket-api";
import { AIAnalyzer } from "../orchestrator/ai-analyzer";

export class ArbitrageDetector {
  private api: PolymarketAPI;
  private minProfitMargin: number;
  private minLiquidity: number;
  private aiAnalyzer: AIAnalyzer | null = null;

  constructor(api: PolymarketAPI, aiAnalyzer?: AIAnalyzer) {
    this.api = api;
    this.minProfitMargin = config.trading.minProfitMargin;
    this.minLiquidity = config.trading.minLiquidity;
    
    // Initialize AI analyzer if provided or if AI is enabled
    if (aiAnalyzer) {
      this.aiAnalyzer = aiAnalyzer;
    } else if (config.ai?.enabled) {
      this.aiAnalyzer = new AIAnalyzer();
    }
    
    if (this.aiAnalyzer?.isEnabled()) {
      logger.info('ArbitrageDetector initialized with AI analysis', {
        agents: this.aiAnalyzer.getEnabledAgents(),
      });
    }
  }

  async detectOpportunities(markets: Market[]): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    const batchSize = 10;

    for (let i = 0; i < markets.length; i += batchSize) {
      const batch = markets.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((market) => this.analyzeMarket(market))
      );

      results.forEach((result) => {
        if (result) opportunities.push(result);
      });
    }

    return opportunities;
  }

  async analyzeMarket(market: Market): Promise<ArbitrageOpportunity | null> {
    try {
      if (market.liquidity && market.liquidity < this.minLiquidity) {
        return null;
      }

      const prices = await this.api.getBestPrices(market);
      if (!prices) return null;

      const opportunity = this.calculateOpportunity(market, prices);
      if (!opportunity) return null;

      if (opportunity.profitMargin < this.minProfitMargin) {
        return null;
      }

      // Enhance with AI analysis if enabled
      if (this.aiAnalyzer?.isEnabled()) {
        const aiAnalysis = await this.aiAnalyzer.analyze(opportunity);
        if (aiAnalysis) {
          opportunity.aiAnalysis = aiAnalysis;
          
          // Filter based on AI recommendation
          if (aiAnalysis.finalRecommendation === 'SKIP') {
            logger.info('AI recommended skipping opportunity', {
              marketId: opportunity.marketId,
              reason: aiAnalysis.summary,
            });
            return null;
          }
        }
      }

      return opportunity;
    } catch (error: any) {
      logger.error("Error analyzing market", {
        marketId: market.id,
        error: error.message,
      });
      return null;
    }
  }

  private calculateOpportunity(
    market: Market,
    prices: BestPrices
  ): ArbitrageOpportunity | null {
    const totalCost = prices.yes + prices.no;

    if (totalCost >= 1) return null;

    const expectedProfit = 1 - totalCost;
    const profitMargin = expectedProfit / totalCost;

    const yesToken = market.tokens?.find(
      (t) => t.outcome.toLowerCase() === "yes" || t.outcome === "1"
    );
    const noToken = market.tokens?.find(
      (t) => t.outcome.toLowerCase() === "no" || t.outcome === "0"
    );

    return {
      marketId: market.id,
      marketName: market.question,
      yesPrice: prices.yes,
      noPrice: prices.no,
      totalCost,
      expectedProfit,
      profitMargin,
      liquidity: market.liquidity,
      volume: market.volume,
      timestamp: new Date(),
      yesTokenId: yesToken?.token_id,
      noTokenId: noToken?.token_id,
    };
  }

  calculateProfitability(
    opportunity: ArbitrageOpportunity,
    tradeAmount: number = 100
  ): number {
    const grossProfit = opportunity.expectedProfit * tradeAmount;
    const estimatedGasFee = 0.02;
    const slippageCost = tradeAmount * config.trading.maxSlippage;
    return grossProfit - estimatedGasFee - slippageCost;
  }

  async validateOpportunity(
    opportunity: ArbitrageOpportunity
  ): Promise<boolean> {
    try {
      const market = await this.api.getMarket(opportunity.marketId);
      if (!market || !market.active || market.closed) {
        return false;
      }

      const prices = await this.api.getBestPrices(market);
      if (!prices) return false;

      const priceDifference = Math.abs(
        prices.yes + prices.no - (opportunity.yesPrice + opportunity.noPrice)
      );

      return priceDifference <= 0.05;
    } catch (error: any) {
      logger.error("Error validating opportunity", {
        marketId: opportunity.marketId,
        error: error.message,
      });
      return false;
    }
  }
}

export default ArbitrageDetector;
