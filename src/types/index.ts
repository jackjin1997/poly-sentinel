// Market and Order Book Types
export interface Market {
  id: string;
  question: string;
  description?: string;
  active: boolean;
  closed: boolean;
  volume?: number;
  liquidity?: number;
  outcomes: string[];
  outcomePrices?: string[];
  tokens?: Token[];
}

export interface Token {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

export interface OrderBook {
  market: string;
  asset_id: string;
  bids: Order[];
  asks: Order[];
}

export interface Order {
  price: string;
  size: string;
}

export interface BestPrices {
  yes: number;
  no: number;
  yesBidSize?: number;
  yesAskSize?: number;
  noBidSize?: number;
  noAskSize?: number;
}

// Arbitrage Opportunity Types
export interface ArbitrageOpportunity {
  marketId: string;
  marketName: string;
  yesPrice: number;
  noPrice: number;
  totalCost: number;
  expectedProfit: number;
  profitMargin: number;
  liquidity?: number;
  volume?: number;
  timestamp: Date;
  yesTokenId?: string;
  noTokenId?: string;
}

// Trading Types
export interface TradeRequest {
  opportunity: ArbitrageOpportunity;
  amount: number;
}

export interface TransactionResult {
  success: boolean;
  yesTransaction?: string;
  noTransaction?: string;
  error?: string;
  gasUsed?: string;
  actualProfit?: number;
}

// Configuration Types
export interface Config {
  polymarket: {
    apiUrl: string;
    gammaApiUrl: string;
  };
  wallet: {
    privateKey?: string;
    mnemonic?: string;
  };
  network: {
    rpcUrl: string;
    chainId: number;
  };
  trading: {
    minProfitMargin: number;
    maxTradeAmount: number;
    pollIntervalMs: number;
    dryRun: boolean;
    minLiquidity: number;
    maxSlippage: number;
    gasPriceMultiplier: number;
  };
}

// Monitor Types
export interface MonitorState {
  isRunning: boolean;
  lastPollTime?: Date;
  opportunitiesFound: number;
  tradesExecuted: number;
  totalProfit: number;
}

// Notification Types
export enum NotificationType {
  INFO = 'info',
  OPPORTUNITY = 'opportunity',
  TRADE = 'trade',
  ERROR = 'error',
}

export interface Notification {
  type: NotificationType;
  message: string;
  data?: any;
  timestamp: Date;
}
