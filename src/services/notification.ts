import { Notification, NotificationType, ArbitrageOpportunity } from "../types";
import { logger } from "../utils/logger";

export class NotificationService {
  private sentNotifications: Set<string> = new Set();

  /**
   * Send a notification
   */
  notify(type: NotificationType, message: string, data?: any): void {
    const notification: Notification = {
      type,
      message,
      data,
      timestamp: new Date(),
    };

    // Log the notification
    switch (type) {
      case NotificationType.ERROR:
        logger.error(message, data);
        break;
      case NotificationType.OPPORTUNITY:
        logger.info(message, data);
        break;
      case NotificationType.TRADE:
        logger.info(message, data);
        break;
      case NotificationType.INFO:
      default:
        logger.info(message, data);
        break;
    }

    // Play sound for important notifications (optional)
    if (type === NotificationType.OPPORTUNITY) {
      this.playNotificationSound();
    }
  }

  /**
   * Notify about arbitrage opportunity
   */
  notifyOpportunity(opportunity: ArbitrageOpportunity): void {
    const key = this.getOpportunityKey(opportunity);

    // Avoid duplicate notifications for the same opportunity
    if (this.sentNotifications.has(key)) {
      return;
    }

    this.sentNotifications.add(key);

    const message = `🎯 Arbitrage Opportunity: ${opportunity.marketName}`;
    const data = {
      marketId: opportunity.marketId,
      yesPrice: opportunity.yesPrice,
      noPrice: opportunity.noPrice,
      totalCost: opportunity.totalCost,
      expectedProfit: opportunity.expectedProfit,
      profitMargin: `${(opportunity.profitMargin * 100).toFixed(2)}%`,
    };

    this.notify(NotificationType.OPPORTUNITY, message, data);

    // Print to console with formatting
    console.log("\n" + "=".repeat(60));
    console.log("🔔 ARBITRAGE OPPORTUNITY DETECTED!");
    console.log("=".repeat(60));
    console.log(`Market: ${opportunity.marketName}`);
    console.log(`YES Price: $${opportunity.yesPrice.toFixed(4)}`);
    console.log(`NO Price: $${opportunity.noPrice.toFixed(4)}`);
    console.log(`Total Cost: $${opportunity.totalCost.toFixed(4)}`);
    console.log(`Expected Profit: $${opportunity.expectedProfit.toFixed(4)}`);
    console.log(
      `Profit Margin: ${(opportunity.profitMargin * 100).toFixed(2)}%`
    );
    if (opportunity.liquidity) {
      console.log(`Liquidity: $${opportunity.liquidity.toFixed(0)}`);
    }
    console.log("=".repeat(60) + "\n");

    // Clean up old notifications (keep last 100)
    if (this.sentNotifications.size > 100) {
      const entries = Array.from(this.sentNotifications);
      entries.slice(0, 50).forEach((key) => this.sentNotifications.delete(key));
    }
  }

  /**
   * Notify about trade execution
   */
  notifyTradeExecuted(opportunity: ArbitrageOpportunity, result: any): void {
    const message = result.success
      ? `✅ Trade executed successfully: ${opportunity.marketName}`
      : `❌ Trade failed: ${opportunity.marketName}`;

    this.notify(NotificationType.TRADE, message, {
      marketId: opportunity.marketId,
      success: result.success,
      yesTransaction: result.yesTransaction,
      noTransaction: result.noTransaction,
      error: result.error,
    });

    console.log("\n" + "-".repeat(60));
    if (result.success) {
      console.log("✅ TRADE EXECUTED SUCCESSFULLY");
      if (result.yesTransaction) {
        console.log(`YES Transaction: ${result.yesTransaction}`);
      }
      if (result.noTransaction) {
        console.log(`NO Transaction: ${result.noTransaction}`);
      }
      if (result.actualProfit !== undefined) {
        console.log(`Actual Profit: $${result.actualProfit.toFixed(4)}`);
      }
    } else {
      console.log("❌ TRADE FAILED");
      console.log(`Error: ${result.error}`);
    }
    console.log("-".repeat(60) + "\n");
  }

  /**
   * Notify about error
   */
  notifyError(message: string, error?: Error): void {
    this.notify(NotificationType.ERROR, message, {
      error: error?.message,
      stack: error?.stack,
    });

    console.error("\n⚠️  ERROR:", message);
    if (error) {
      console.error(error.message);
    }
    console.log("");
  }

  /**
   * Generate unique key for opportunity
   */
  private getOpportunityKey(opportunity: ArbitrageOpportunity): string {
    return `${opportunity.marketId}-${opportunity.timestamp.getTime()}`;
  }

  /**
   * Play notification sound (cross-platform)
   */
  private playNotificationSound(): void {
    try {
      // Try to play system beep
      process.stdout.write("\x07");
    } catch (error) {
      // Silently fail if not supported
    }
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.sentNotifications.clear();
  }
}

export default NotificationService;
