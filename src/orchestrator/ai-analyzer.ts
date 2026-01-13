import { ArbitrageOpportunity, AIAnalysis, AgentResult } from '../types';
import { BaseAgent, AgentAnalysis } from '../agents/base-agent';
import { SentimentAgent } from '../agents/sentiment-agent';
import { LLMClient, LLMConfig } from '../llm/openai-client';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * AI Analyzer orchestrates multiple AI agents to analyze arbitrage opportunities
 */
export class AIAnalyzer {
  private llmClient: LLMClient | null = null;
  private agents: Map<string, BaseAgent> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = config.ai?.enabled || false;

    if (this.enabled) {
      this.initializeLLM();
      this.initializeAgents();
    }
  }

  private initializeLLM(): void {
    if (!config.ai) {
      throw new Error('AI configuration not found');
    }

    const llmConfig: LLMConfig = {
      provider: config.ai.provider,
      apiKey: config.ai.apiKey,
      model: config.ai.model,
      baseUrl: config.ai.baseUrl,
      temperature: config.ai.temperature,
    };

    try {
      this.llmClient = new LLMClient(llmConfig);
      logger.info('LLM client initialized', {
        provider: llmConfig.provider,
        model: llmConfig.model,
      });
    } catch (error: any) {
      logger.error('Failed to initialize LLM client', { error: error.message });
      this.enabled = false;
    }
  }

  private initializeAgents(): void {
    if (!this.llmClient || !config.ai) {
      return;
    }

    const enabledAgents = config.ai.enabledAgents || [];

    // Initialize sentiment agent
    if (enabledAgents.includes('sentiment')) {
      this.agents.set('sentiment', new SentimentAgent(this.llmClient));
      logger.info('SentimentAgent initialized');
    }

    // Add more agents here in the future
    // if (enabledAgents.includes('risk')) {
    //   this.agents.set('risk', new RiskAgent(this.llmClient));
    // }

    logger.info(`Initialized ${this.agents.size} AI agent(s)`);
  }

  /**
   * Analyze an arbitrage opportunity using all enabled agents
   */
  async analyze(opportunity: ArbitrageOpportunity): Promise<AIAnalysis | null> {
    if (!this.enabled || this.agents.size === 0) {
      return null;
    }

    try {
      logger.info('Starting AI analysis', {
        marketId: opportunity.marketId,
        agents: Array.from(this.agents.keys()),
      });

      // Run all agents in parallel
      const agentResults = await this.runAgents(opportunity);

      // Aggregate results
      const analysis = this.aggregateResults(agentResults);

      logger.info('AI analysis complete', {
        marketId: opportunity.marketId,
        recommendation: analysis.finalRecommendation,
        confidence: analysis.aggregatedConfidence,
      });

      return analysis;
    } catch (error: any) {
      logger.error('AI analysis failed', {
        marketId: opportunity.marketId,
        error: error.message,
      });
      return null;
    }
  }

  private async runAgents(
    opportunity: ArbitrageOpportunity
  ): Promise<Map<string, AgentAnalysis>> {
    const results = new Map<string, AgentAnalysis>();

    const promises = Array.from(this.agents.entries()).map(
      async ([name, agent]) => {
        try {
          const result = await agent.analyze(opportunity);
          results.set(name, result);
        } catch (error: any) {
          logger.error(`Agent ${name} failed`, {
            marketId: opportunity.marketId,
            error: error.message,
          });
        }
      }
    );

    await Promise.all(promises);
    return results;
  }

  private aggregateResults(
    agentResults: Map<string, AgentAnalysis>
  ): AIAnalysis {
    // Convert agent results to simplified format
    const results: Record<string, AgentResult> = {};
    
    agentResults.forEach((analysis, agentName) => {
      results[agentName] = {
        confidence: analysis.confidence,
        recommendation: analysis.recommendation,
        reasoning: analysis.reasoning,
        score: analysis.score,
        riskFactors: analysis.riskFactors,
      };
    });

    // Calculate aggregated metrics
    const recommendations = Array.from(agentResults.values()).map(
      (a) => a.recommendation
    );
    const confidences = Array.from(agentResults.values()).map(
      (a) => a.confidence
    );

    // Aggregate confidence (weighted average)
    const aggregatedConfidence =
      confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    // Determine final recommendation
    const finalRecommendation = this.determineFinalRecommendation(
      agentResults
    );

    // Generate summary
    const summary = this.generateSummary(agentResults, finalRecommendation);

    return {
      sentiment: results.sentiment,
      risk: results.risk,
      event: results.event,
      technical: results.technical,
      finalRecommendation,
      aggregatedConfidence,
      summary,
    };
  }

  private determineFinalRecommendation(
    agentResults: Map<string, AgentAnalysis>
  ): 'BUY' | 'HOLD' | 'SKIP' {
    const results = Array.from(agentResults.values());

    // Count votes
    const votes = {
      BUY: 0,
      HOLD: 0,
      SKIP: 0,
    };

    results.forEach((result) => {
      // Weight by confidence
      votes[result.recommendation] += result.confidence;
    });

    // If any agent recommends SKIP with high confidence, skip
    const hasHighConfidenceSkip = results.some(
      (r) => r.recommendation === 'SKIP' && r.confidence > 0.7
    );
    if (hasHighConfidenceSkip) {
      return 'SKIP';
    }

    // Otherwise, take the highest weighted vote
    const maxVote = Math.max(votes.BUY, votes.HOLD, votes.SKIP);
    
    if (votes.BUY === maxVote) return 'BUY';
    if (votes.HOLD === maxVote) return 'HOLD';
    return 'SKIP';
  }

  private generateSummary(
    agentResults: Map<string, AgentAnalysis>,
    finalRecommendation: 'BUY' | 'HOLD' | 'SKIP'
  ): string {
    const results = Array.from(agentResults.entries());
    
    const agentSummaries = results
      .map(([name, result]) => {
        const emoji = result.recommendation === 'BUY' ? '✅' : 
                      result.recommendation === 'HOLD' ? '⏸️' : '❌';
        return `${emoji} ${name}: ${result.recommendation} (${(result.confidence * 100).toFixed(0)}% confidence)`;
      })
      .join('; ');

    return `${agentSummaries} → Final: ${finalRecommendation}`;
  }

  /**
   * Check if AI analysis is enabled and ready
   */
  isEnabled(): boolean {
    return this.enabled && this.agents.size > 0;
  }

  /**
   * Get list of enabled agents
   */
  getEnabledAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}

export default AIAnalyzer;
