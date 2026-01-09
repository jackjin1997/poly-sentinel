import { ethers } from "ethers";
import { ArbitrageOpportunity, TransactionResult } from "../types";
import { config } from "../config";
import { logger, tradeLogger } from "../utils/logger";

const CTF_EXCHANGE_ADDRESS = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E";

export class TradeExecutor {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | ethers.HDNodeWallet | null = null;
  private dryRun: boolean;

  constructor() {
    this.dryRun = config.trading.dryRun;
    this.provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    this.initializeWallet();
  }

  private initializeWallet(): void {
    if (config.wallet.privateKey) {
      try {
        this.wallet = new ethers.Wallet(config.wallet.privateKey, this.provider);
      } catch (error: any) {
        logger.error("Failed to initialize wallet", { error: error.message });
      }
    } else if (config.wallet.mnemonic) {
      try {
        this.wallet = ethers.Wallet.fromPhrase(
          config.wallet.mnemonic,
          this.provider
        );
      } catch (error: any) {
        logger.error("Failed to initialize wallet", { error: error.message });
      }
    }
  }

  async executeBothSides(
    opportunity: ArbitrageOpportunity,
    amount: number
  ): Promise<TransactionResult> {
    if (this.dryRun) {
      return this.simulateTrade(opportunity, amount);
    }

    if (!this.wallet) {
      return {
        success: false,
        error: "Wallet not initialized",
      };
    }

    try {
      const balance = await this.getWalletBalance();
      const requiredAmount = amount * opportunity.totalCost;

      if (balance < requiredAmount) {
        return {
          success: false,
          error: `Insufficient balance: ${balance.toFixed(2)} < ${requiredAmount.toFixed(2)}`,
        };
      }

      const result = await this.executeOrderViaCLOB(opportunity, amount);

      if (result.success) {
        tradeLogger.executed({
          marketId: opportunity.marketId,
          amount,
          profit: result.actualProfit,
        });
      } else {
        tradeLogger.failed({
          marketId: opportunity.marketId,
          error: result.error,
        });
      }

      return result;
    } catch (error: any) {
      const errorMsg = `Trade execution failed: ${error.message}`;
      logger.error(errorMsg);
      tradeLogger.failed({ marketId: opportunity.marketId, error: errorMsg });

      return { success: false, error: errorMsg };
    }
  }

  private async simulateTrade(
    opportunity: ArbitrageOpportunity,
    amount: number
  ): Promise<TransactionResult> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const grossProfit = opportunity.expectedProfit * amount;
    const estimatedGasFee = 0.02;
    const slippageCost = amount * config.trading.maxSlippage;
    const actualProfit = grossProfit - estimatedGasFee - slippageCost;

    tradeLogger.executed({
      marketId: opportunity.marketId,
      amount,
      profit: actualProfit,
      simulation: true,
    });

    return {
      success: true,
      yesTransaction: `0xSIM_YES_${Date.now()}`,
      noTransaction: `0xSIM_NO_${Date.now()}`,
      actualProfit,
    };
  }

  private async executeOrderViaCLOB(
    opportunity: ArbitrageOpportunity,
    amount: number
  ): Promise<TransactionResult> {
    logger.warn("Live trading not implemented");

    return {
      success: false,
      error: "Live trading not implemented. Enable DRY_RUN mode.",
    };
  }

  async getWalletBalance(): Promise<number> {
    if (!this.wallet) return 0;

    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error: any) {
      logger.error("Failed to get balance", { error: error.message });
      return 0;
    }
  }

  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  isWalletConfigured(): boolean {
    return this.wallet !== null;
  }

  async estimateGasCost(): Promise<number> {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits("30", "gwei");
      const estimatedGasUnits = 200000n;
      const totalGasCost = gasPrice * estimatedGasUnits;
      return parseFloat(ethers.formatEther(totalGasCost));
    } catch (error: any) {
      logger.error("Failed to estimate gas", { error: error.message });
      return 0.02;
    }
  }
}

export default TradeExecutor;
