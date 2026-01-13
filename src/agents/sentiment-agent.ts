import { BaseAgent, AgentAnalysis, MarketContext } from './base-agent';
import { ArbitrageOpportunity } from '../types';
import { LLMClient } from '../llm/openai-client';
import { logger } from '../utils/logger';

/**
 * Sentiment Agent analyzes market sentiment and pricing psychology
 * to determine if the arbitrage opportunity is reliable.
 */
export class SentimentAgent extends BaseAgent {
  constructor(llmClient: LLMClient) {
    super(
      llmClient,
      'SentimentAgent',
      'Market sentiment and psychology analyst'
    );
  }

  async analyze(
    opportunity: ArbitrageOpportunity,
    context?: MarketContext
  ): Promise<AgentAnalysis> {
    try {
      const marketContext = context || this.createContext(opportunity);
      const prompt = this.buildPrompt(opportunity, marketContext);
      
      const response = await this.llmClient.completeWithRetry(prompt);
      const parsed = this.parseJsonResponse(response.content);
      const analysis = this.validateAnalysis(parsed);

      this.logAnalysis(analysis, opportunity);
      return analysis;
    } catch (error: any) {
      logger.error('SentimentAgent analysis failed', {
        marketId: opportunity.marketId,
        error: error.message,
      });

      // Return conservative fallback
      return {
        confidence: 0.3,
        recommendation: 'HOLD',
        reasoning: `Analysis failed: ${error.message}. Recommending caution.`,
        riskFactors: ['Analysis error'],
      };
    }
  }

  private buildPrompt(
    opportunity: ArbitrageOpportunity,
    context: MarketContext
  ): string {
    const profitPct = (opportunity.profitMargin * 100).toFixed(2);
    const totalCost = opportunity.totalCost.toFixed(4);

    return `You are an expert market sentiment analyst for prediction markets.

**Market Question:** ${context.marketQuestion}

**Current Pricing:**
- YES token: $${opportunity.yesPrice.toFixed(4)}
- NO token: $${opportunity.noPrice.toFixed(4)}
- Total cost: $${totalCost}
- Implied probability sum: ${(opportunity.totalCost * 100).toFixed(2)}%

**Arbitrage Opportunity:**
- Expected profit per $1 invested: $${opportunity.expectedProfit.toFixed(4)}
- Profit margin: ${profitPct}%
${opportunity.liquidity ? `- Market liquidity: $${opportunity.liquidity.toFixed(0)}` : ''}
${opportunity.volume ? `- 24h volume: $${opportunity.volume.toFixed(0)}` : ''}

**Your Task:**
Analyze this arbitrage opportunity from a sentiment perspective:

1. **Pricing Psychology**: Why might YES + NO < 1? Is this likely due to:
   - Market inefficiency (good for arbitrage)
   - Information asymmetry
   - Emotional/irrational trading
   - Liquidity issues
   - Technical factors

2. **Reliability**: How confident are you that this price discrepancy will persist until execution?

3. **Risk Factors**: What could go wrong?
   - Price movement before execution
   - Market resolution risks
   - Liquidity constraints

4. **Recommendation**: Should we:
   - BUY: Execute this arbitrage (high confidence)
   - HOLD: Promising but needs monitoring
   - SKIP: Too risky or unreliable

**Response Format (JSON only):**
{
  "sentiment_score": <-1 to 1: negative to positive sentiment about this opportunity>,
  "confidence": <0 to 1: your confidence in this analysis>,
  "recommendation": <"BUY" | "HOLD" | "SKIP">,
  "reasoning": <2-3 sentence explanation of your recommendation>,
  "risk_factors": [<array of identified risk factors>],
  "metrics": {
    "market_efficiency_score": <0-10>,
    "execution_risk": <"low" | "medium" | "high">
  }
}

Provide only the JSON response, no additional text.`;
  }
}

export default SentimentAgent;
