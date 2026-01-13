import dotenv from "dotenv";
import { Config } from "../types";

// Load environment variables
dotenv.config();

function getRequiredEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getNumericEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric value for ${key}: ${value}`);
  }
  return parsed;
}

function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

export const config: Config = {
  polymarket: {
    apiUrl: getOptionalEnv("POLYMARKET_API_URL", "https://clob.polymarket.com"),
    gammaApiUrl: getOptionalEnv(
      "GAMMA_API_URL",
      "https://gamma-api.polymarket.com"
    ),
  },
  wallet: {
    privateKey: process.env.PRIVATE_KEY,
    mnemonic: process.env.MNEMONIC,
  },
  network: {
    rpcUrl: getOptionalEnv("POLYGON_RPC_URL", "https://polygon-rpc.com"),
    chainId: getNumericEnv("CHAIN_ID", 137),
  },
  trading: {
    minProfitMargin: getNumericEnv("MIN_PROFIT_MARGIN", 0.02),
    maxTradeAmount: getNumericEnv("MAX_TRADE_AMOUNT", 100),
    pollIntervalMs: getNumericEnv("POLL_INTERVAL_MS", 10000),
    dryRun: getBooleanEnv("DRY_RUN", true),
    minLiquidity: getNumericEnv("MIN_LIQUIDITY", 1000),
    maxSlippage: getNumericEnv("MAX_SLIPPAGE", 0.01),
    gasPriceMultiplier: getNumericEnv("GAS_PRICE_MULTIPLIER", 1.2),
  },
  ai: {
    enabled: getBooleanEnv("AI_ENABLED", false),
    provider: (getOptionalEnv("AI_PROVIDER", "openai") as "openai" | "ollama"),
    apiKey: process.env.OPENAI_API_KEY,
    model: getOptionalEnv("AI_MODEL", "gpt-4o-mini"),
    baseUrl: process.env.AI_BASE_URL,
    temperature: getNumericEnv("AI_TEMPERATURE", 0.7),
    enabledAgents: getOptionalEnv("AI_ENABLED_AGENTS", "sentiment")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s),
  },
};

// Validate wallet configuration
if (!config.wallet.privateKey && !config.wallet.mnemonic) {
  console.warn(
    "⚠️  Warning: No wallet credentials configured. Trading will be disabled."
  );
  console.warn(
    "   Set PRIVATE_KEY or MNEMONIC in .env file to enable trading."
  );
}

// Display configuration summary
export function printConfig(): void {
  console.log("📋 Configuration Summary:");
  console.log("  Polymarket API:", config.polymarket.apiUrl);
  console.log(
    "  Network:",
    config.network.chainId === 137
      ? "Polygon Mainnet"
      : `Chain ${config.network.chainId}`
  );
  console.log(
    "  Min Profit Margin:",
    `${(config.trading.minProfitMargin * 100).toFixed(2)}%`
  );
  console.log("  Max Trade Amount:", `$${config.trading.maxTradeAmount}`);
  console.log("  Poll Interval:", `${config.trading.pollIntervalMs / 1000}s`);
  console.log(
    "  Mode:",
    config.trading.dryRun ? "🧪 DRY RUN" : "💰 LIVE TRADING"
  );
  console.log(
    "  Wallet:",
    config.wallet.privateKey || config.wallet.mnemonic
      ? "✅ Configured"
      : "❌ Not configured"
  );
  
  // AI configuration
  if (config.ai?.enabled) {
    console.log("  🤖 AI Analysis: ✅ Enabled");
    console.log(`     Provider: ${config.ai.provider}`);
    console.log(`     Model: ${config.ai.model}`);
    console.log(`     Agents: ${config.ai.enabledAgents.join(", ")}`);
  } else {
    console.log("  🤖 AI Analysis: ❌ Disabled");
  }
  
  console.log("");
}

export default config;
