import { config, printConfig } from "./config";
import { logger } from "./utils/logger";
import MonitorService from "./services/monitor";
import TradeExecutor from "./core/trade-executor";
import CLIInterface from "./cli/interface";
import { ArbitrageOpportunity } from "./types";

class PolySentinel {
  private monitor: MonitorService;
  private executor: TradeExecutor;
  private cli: CLIInterface;
  private isProcessingOpportunities = false;

  constructor() {
    this.monitor = new MonitorService();
    this.executor = new TradeExecutor();
    this.cli = new CLIInterface();
  }

  async start(): Promise<void> {
    this.cli.displayWelcomeBanner();
    printConfig();

    if (!this.executor.isWalletConfigured() && !config.trading.dryRun) {
      this.cli.displayError(
        "Wallet not configured. Set PRIVATE_KEY or MNEMONIC in .env"
      );
      return;
    }

    this.setupSignalHandlers();
    this.monitor.onOpportunityFound((opportunities) =>
      this.handleOpportunities(opportunities)
    );

    try {
      await this.monitor.start();
      console.log("🔍 Monitoring markets...\n");
      await this.keepAlive();
    } catch (error) {
      if (error instanceof Error) {
        this.cli.displayError(error.message);
        logger.error("Fatal error", { error: error.message });
      }
    }
  }

  private async handleOpportunities(
    opportunities: ArbitrageOpportunity[]
  ): Promise<void> {
    if (this.isProcessingOpportunities) return;

    this.isProcessingOpportunities = true;
    this.monitor.stop();

    try {
      const decisions = await this.cli.promptForTradeExecution(opportunities);

      for (const [marketId, decision] of decisions) {
        if (!decision.shouldExecute || decision.amount <= 0) continue;

        const opportunity = opportunities.find((o) => o.marketId === marketId);
        if (!opportunity) continue;

        await this.executeTrade(opportunity, decision.amount);
      }

      this.cli.displayStats(this.monitor.getState());
    } finally {
      this.isProcessingOpportunities = false;
      console.log("\n🔍 Resuming monitoring...\n");
      await this.monitor.start();
    }
  }

  private async executeTrade(
    opportunity: ArbitrageOpportunity,
    amount: number
  ): Promise<void> {
    console.log(`\n⚡ Executing trade for ${opportunity.marketName}...`);

    const isValid = await this.monitor.validateOpportunity(opportunity);
    if (!isValid) {
      this.cli.displayError("Opportunity no longer valid");
      return;
    }

    const result = await this.executor.executeBothSides(opportunity, amount);

    if (result.success) {
      this.cli.displaySuccess(
        `Trade executed! Profit: $${result.actualProfit?.toFixed(4) || "N/A"}`
      );
      this.monitor.recordTrade(true, result.actualProfit || 0);
    } else {
      this.cli.displayError(`Trade failed: ${result.error}`);
    }

    this.monitor
      .getNotificationService()
      .notifyTradeExecuted(opportunity, result);
  }

  private async keepAlive(): Promise<void> {
    return new Promise((resolve) => {
      process.on("SIGINT", () => resolve());
      process.on("SIGTERM", () => resolve());
    });
  }

  private setupSignalHandlers(): void {
    const shutdown = async () => {
      console.log("\n\n🛑 Shutting down...");
      this.monitor.stop();
      this.cli.displayStats(this.monitor.getState());
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
}

const main = async () => {
  try {
    const sentinel = new PolySentinel();
    await sentinel.start();
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Application error", { error: error.message });
      console.error(`\n❌ Fatal error: ${error.message}\n`);
    }
    process.exit(1);
  }
};

main();
