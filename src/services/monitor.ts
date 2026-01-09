import { ArbitrageOpportunity, MonitorState } from "../types";
import { config } from "../config";
import { logger, monitorLogger } from "../utils/logger";
import PolymarketAPI from "./polymarket-api";
import ArbitrageDetector from "../core/arbitrage-detector";
import NotificationService from "./notification";

export class MonitorService {
  private api: PolymarketAPI;
  private detector: ArbitrageDetector;
  private notificationService: NotificationService;
  private state: MonitorState;
  private pollInterval: number;
  private intervalId: NodeJS.Timeout | null = null;
  private opportunityCallbacks: Array<
    (opportunities: ArbitrageOpportunity[]) => void
  > = [];

  constructor() {
    this.api = new PolymarketAPI();
    this.detector = new ArbitrageDetector(this.api);
    this.notificationService = new NotificationService();
    this.pollInterval = config.trading.pollIntervalMs;

    this.state = {
      isRunning: false,
      opportunitiesFound: 0,
      tradesExecuted: 0,
      totalProfit: 0,
    };
  }

  async start(): Promise<void> {
    if (this.state.isRunning) return;

    monitorLogger.started();

    const isHealthy = await this.api.healthCheck();
    if (!isHealthy) {
      throw new Error("API health check failed");
    }

    this.state.isRunning = true;
    await this.poll();

    this.intervalId = setInterval(async () => {
      try {
        await this.poll();
      } catch (error: any) {
        monitorLogger.error(error);
      }
    }, this.pollInterval);
  }

  stop(): void {
    if (!this.state.isRunning) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.state.isRunning = false;
    monitorLogger.stopped();
  }

  private async poll(): Promise<void> {
    try {
      const markets = await this.api.getActiveMarkets();
      if (markets.length === 0) return;

      const opportunities = await this.detector.detectOpportunities(markets);

      this.state.lastPollTime = new Date();
      this.state.opportunitiesFound += opportunities.length;

      if (opportunities.length > 0) {
        opportunities.forEach((opp) =>
          this.notificationService.notifyOpportunity(opp)
        );
        this.triggerOpportunityCallbacks(opportunities);
      }
    } catch (error: any) {
      monitorLogger.error(error);
    }
  }

  onOpportunityFound(
    callback: (opportunities: ArbitrageOpportunity[]) => void
  ): void {
    this.opportunityCallbacks.push(callback);
  }

  private triggerOpportunityCallbacks(
    opportunities: ArbitrageOpportunity[]
  ): void {
    this.opportunityCallbacks.forEach((callback) => {
      try {
        callback(opportunities);
      } catch (error: any) {
        logger.error("Callback error", { error: error.message });
      }
    });
  }

  getState(): MonitorState {
    return { ...this.state };
  }

  getNotificationService(): NotificationService {
    return this.notificationService;
  }

  async validateOpportunity(opportunity: ArbitrageOpportunity): Promise<boolean> {
    return await this.detector.validateOpportunity(opportunity);
  }

  calculateProfitability(
    opportunity: ArbitrageOpportunity,
    amount: number
  ): number {
    return this.detector.calculateProfitability(opportunity, amount);
  }

  recordTrade(success: boolean, profit: number = 0): void {
    if (success) {
      this.state.tradesExecuted++;
      this.state.totalProfit += profit;
    }
  }
}

export default MonitorService;
