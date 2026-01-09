import prompts from "prompts";
import { ArbitrageOpportunity } from "../types";
import { config } from "../config";

interface TradeDecision {
  shouldExecute: boolean;
  amount: number;
}

export class CLIInterface {
  async promptForTradeExecution(
    opportunities: ArbitrageOpportunity[]
  ): Promise<Map<string, TradeDecision>> {
    const decisions = new Map<string, TradeDecision>();

    for (const opportunity of opportunities) {
      const decision = await this.promptSingleOpportunity(opportunity);
      decisions.set(opportunity.marketId, decision);
    }

    return decisions;
  }

  private async promptSingleOpportunity(
    opportunity: ArbitrageOpportunity
  ): Promise<TradeDecision> {
    console.log("\n" + "─".repeat(80));
    this.displayOpportunity(opportunity);

    const { shouldExecute } = await prompts({
      type: "confirm",
      name: "shouldExecute",
      message: "Execute this trade?",
      initial: false,
    });

    if (!shouldExecute) {
      return { shouldExecute: false, amount: 0 };
    }

    const { amount } = await prompts({
      type: "number",
      name: "amount",
      message: "Trade amount (USD):",
      initial: Math.min(100, config.trading.maxTradeAmount),
      min: 1,
      max: config.trading.maxTradeAmount,
      validate: (value) =>
        value > 0 && value <= config.trading.maxTradeAmount
          ? true
          : `Amount must be between 1 and ${config.trading.maxTradeAmount}`,
    });

    return { shouldExecute: true, amount: amount || 0 };
  }

  private displayOpportunity(opportunity: ArbitrageOpportunity): void {
    const profitMargin = (opportunity.profitMargin * 100).toFixed(2);
    const expectedProfit = opportunity.expectedProfit.toFixed(4);

    console.log(`\n📊 ${opportunity.marketName}`);
    console.log(`   YES: $${opportunity.yesPrice.toFixed(4)}`);
    console.log(`   NO:  $${opportunity.noPrice.toFixed(4)}`);
    console.log(`   Total: $${opportunity.totalCost.toFixed(4)}`);
    console.log(`   Expected Profit: $${expectedProfit} (${profitMargin}%)`);

    if (opportunity.liquidity) {
      console.log(`   Liquidity: $${opportunity.liquidity.toFixed(0)}`);
    }
  }

  displayWelcomeBanner(): void {
    console.log("\n" + "═".repeat(80));
    console.log("   POLY SENTINEL - Polymarket Arbitrage Bot");
    console.log("═".repeat(80));
    console.log(`   Mode: ${config.trading.dryRun ? "🧪 Dry Run" : "💰 Live"}`);
    console.log(
      `   Min Profit: ${(config.trading.minProfitMargin * 100).toFixed(1)}%`
    );
    console.log(`   Max Trade: $${config.trading.maxTradeAmount}`);
    console.log("═".repeat(80) + "\n");
  }

  displayStats(stats: {
    opportunitiesFound: number;
    tradesExecuted: number;
    totalProfit: number;
  }): void {
    console.log("\n" + "─".repeat(80));
    console.log("📈 Statistics");
    console.log(`   Opportunities: ${stats.opportunitiesFound}`);
    console.log(`   Trades: ${stats.tradesExecuted}`);
    console.log(`   Profit: $${stats.totalProfit.toFixed(2)}`);
    console.log("─".repeat(80) + "\n");
  }

  async confirmExit(): Promise<boolean> {
    const { shouldExit } = await prompts({
      type: "confirm",
      name: "shouldExit",
      message: "Stop monitoring and exit?",
      initial: true,
    });

    return shouldExit;
  }

  displayError(message: string): void {
    console.error(`\n❌ ${message}\n`);
  }

  displaySuccess(message: string): void {
    console.log(`\n✅ ${message}\n`);
  }
}

export default CLIInterface;
