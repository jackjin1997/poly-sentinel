import { ArbitrageOpportunity } from '../types';
import { LLMClient } from '../llm/openai-client';
import { logger } from '../utils/logger';

export type RecommendationType = 'BUY' | 'HOLD' | 'SKIP';

export interface AgentAnalysis {
  confidence: number;           // 0-1, agent's confidence in the analysis
  recommendation: RecommendationType;
  reasoning: string;            // explanation of the recommendation
  score?: number;               // optional numerical score (e.g., sentiment score)
  metrics?: Record<string, any>; // additional metrics
  riskFactors?: string[];       // identified risks
}

export interface MarketContext {
  marketQuestion: string;
  currentPrices: {
    yes: number;
    no: number;
  };
  profitMargin: number;
  liquidity?: number;
  volume?: number;
  additionalData?: Record<string, any>;
}

export abstract class BaseAgent {
  protected llmClient: LLMClient;
  protected agentName: string;
  protected agentRole: string;

  constructor(llmClient: LLMClient, agentName: string, agentRole: string) {
    this.llmClient = llmClient;
    this.agentName = agentName;
    this.agentRole = agentRole;
  }

  /**
   * Main analysis method to be implemented by each agent
   */
  abstract analyze(
    opportunity: ArbitrageOpportunity,
    context?: MarketContext
  ): Promise<AgentAnalysis>;

  /**
   * Helper to create market context from opportunity
   */
  protected createContext(opportunity: ArbitrageOpportunity): MarketContext {
    return {
      marketQuestion: opportunity.marketName,
      currentPrices: {
        yes: opportunity.yesPrice,
        no: opportunity.noPrice,
      },
      profitMargin: opportunity.profitMargin,
      liquidity: opportunity.liquidity,
      volume: opportunity.volume,
    };
  }

  /**
   * Parse JSON response from LLM
   */
  protected parseJsonResponse(content: string): any {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse directly
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = content.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr);
      }

      throw new Error('No valid JSON found in response');
    } catch (error: any) {
      logger.error('Failed to parse LLM JSON response', {
        agent: this.agentName,
        error: error.message,
        content,
      });
      throw new Error(`JSON parse error: ${error.message}`);
    }
  }

  /**
   * Log analysis result
   */
  protected logAnalysis(analysis: AgentAnalysis, opportunity: ArbitrageOpportunity): void {
    logger.info(`${this.agentName} analysis`, {
      marketId: opportunity.marketId,
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning.substring(0, 100),
    });
  }

  /**
   * Validate analysis result
   */
  protected validateAnalysis(analysis: any): AgentAnalysis {
    if (typeof analysis.confidence !== 'number' || 
        analysis.confidence < 0 || 
        analysis.confidence > 1) {
      throw new Error('Invalid confidence value');
    }

    if (!['BUY', 'HOLD', 'SKIP'].includes(analysis.recommendation)) {
      throw new Error('Invalid recommendation');
    }

    if (typeof analysis.reasoning !== 'string' || !analysis.reasoning) {
      throw new Error('Missing reasoning');
    }

    return {
      confidence: analysis.confidence,
      recommendation: analysis.recommendation as RecommendationType,
      reasoning: analysis.reasoning,
      score: analysis.score,
      metrics: analysis.metrics,
      riskFactors: analysis.risk_factors || analysis.riskFactors || [],
    };
  }
}

export default BaseAgent;
