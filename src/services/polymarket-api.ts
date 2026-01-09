import axios, { AxiosInstance } from "axios";
import { Market, OrderBook, BestPrices } from "../types";
import { logger } from "../utils/logger";
import { config } from "../config";

export class PolymarketAPI {
  private clobClient: AxiosInstance;
  private gammaClient: AxiosInstance;

  constructor() {
    this.clobClient = axios.create({
      baseURL: config.polymarket.apiUrl,
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });

    this.gammaClient = axios.create({
      baseURL: config.polymarket.gammaApiUrl,
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });
  }

  async getActiveMarkets(limit: number = 100): Promise<Market[]> {
    try {
      const response = await this.gammaClient.get("/markets", {
        params: { active: true, closed: false, limit },
      });

      return response.data.map((market: any) => ({
        id: market.condition_id,
        question: market.question,
        description: market.description,
        active: market.active,
        closed: market.closed,
        volume: parseFloat(market.volume || "0"),
        liquidity: parseFloat(market.liquidity || "0"),
        outcomes: market.outcomes || ["Yes", "No"],
        outcomePrices: market.outcomePrices || [],
        tokens: market.tokens || [],
      }));
    } catch (error: any) {
      logger.error("Failed to fetch markets", {
        error: error.message,
        status: error.response?.status,
      });
      throw new Error(`Failed to fetch markets: ${error.message}`);
    }
  }

  async getOrderBook(tokenId: string): Promise<OrderBook> {
    try {
      const response = await this.clobClient.get("/book", {
        params: { token_id: tokenId },
      });

      return {
        market: response.data.market || tokenId,
        asset_id: response.data.asset_id || tokenId,
        bids: response.data.bids || [],
        asks: response.data.asks || [],
      };
    } catch (error: any) {
      logger.error("Failed to fetch order book", {
        tokenId,
        error: error.message,
      });
      throw new Error(`Failed to fetch order book: ${error.message}`);
    }
  }

  async getBestPrices(market: Market): Promise<BestPrices | null> {
    try {
      if (!market.tokens || market.tokens.length < 2) {
        return null;
      }

      const yesToken = market.tokens.find(
        (t) => t.outcome.toLowerCase() === "yes" || t.outcome === "1"
      );
      const noToken = market.tokens.find(
        (t) => t.outcome.toLowerCase() === "no" || t.outcome === "0"
      );

      if (!yesToken || !noToken) {
        return null;
      }

      const [yesBook, noBook] = await Promise.all([
        this.getOrderBook(yesToken.token_id),
        this.getOrderBook(noToken.token_id),
      ]);

      const yesBestAsk =
        yesBook.asks.length > 0 ? parseFloat(yesBook.asks[0].price) : null;
      const noBestAsk =
        noBook.asks.length > 0 ? parseFloat(noBook.asks[0].price) : null;

      if (yesBestAsk === null || noBestAsk === null) {
        return null;
      }

      return {
        yes: yesBestAsk,
        no: noBestAsk,
        yesAskSize:
          yesBook.asks.length > 0 ? parseFloat(yesBook.asks[0].size) : 0,
        noAskSize:
          noBook.asks.length > 0 ? parseFloat(noBook.asks[0].size) : 0,
      };
    } catch (error: any) {
      logger.error("Failed to get best prices", {
        marketId: market.id,
        error: error.message,
      });
      return null;
    }
  }

  async getMarket(marketId: string): Promise<Market | null> {
    try {
      const response = await this.gammaClient.get(`/markets/${marketId}`);
      const market = response.data;

      return {
        id: market.condition_id,
        question: market.question,
        description: market.description,
        active: market.active,
        closed: market.closed,
        volume: parseFloat(market.volume || "0"),
        liquidity: parseFloat(market.liquidity || "0"),
        outcomes: market.outcomes || ["Yes", "No"],
        outcomePrices: market.outcomePrices || [],
        tokens: market.tokens || [],
      };
    } catch (error: any) {
      logger.error("Failed to fetch market", {
        marketId,
        error: error.message,
      });
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.gammaClient.get("/markets", { params: { limit: 1 } });
      return true;
    } catch (error: any) {
      logger.error("API health check failed", { error: error.message });
      return false;
    }
  }
}

export default PolymarketAPI;
