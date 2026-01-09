/**
 * Simple API test script to verify Polymarket connectivity
 * Run with: pnpm tsx scripts/test-api.ts
 */

import PolymarketAPI from "../src/services/polymarket-api";

async function testAPI() {
  console.log("🧪 Testing Polymarket API connectivity...\n");

  const api = new PolymarketAPI();

  try {
    // Health check
    console.log("1. Health Check");
    const healthy = await api.healthCheck();
    console.log(`   Status: ${healthy ? "✅ OK" : "❌ Failed"}\n`);

    if (!healthy) {
      console.error("API is not accessible. Check your internet connection.");
      return;
    }

    // Fetch markets
    console.log("2. Fetching Active Markets (limit 5)");
    const markets = await api.getActiveMarkets(5);
    console.log(`   Found: ${markets.length} markets\n`);

    // Display first market
    if (markets.length > 0) {
      const market = markets[0];
      console.log("3. Sample Market:");
      console.log(`   Question: ${market.question}`);
      console.log(`   ID: ${market.id}`);
      console.log(`   Active: ${market.active}`);
      console.log(`   Liquidity: $${market.liquidity?.toFixed(0) || "N/A"}`);
      console.log(`   Volume: $${market.volume?.toFixed(0) || "N/A"}`);

      // Try to get prices
      if (market.tokens && market.tokens.length >= 2) {
        console.log("\n4. Fetching Prices:");
        const prices = await api.getBestPrices(market);

        if (prices) {
          console.log(`   YES: $${prices.yes.toFixed(4)}`);
          console.log(`   NO: $${prices.no.toFixed(4)}`);
          console.log(`   Total: $${(prices.yes + prices.no).toFixed(4)}`);

          const diff = 1 - (prices.yes + prices.no);
          console.log(
            `   Deviation: $${Math.abs(diff).toFixed(4)} ${diff < 0 ? "(premium)" : "(discount)"}`
          );
        } else {
          console.log("   ⚠️  Could not fetch prices");
        }
      }
    }

    console.log("\n✅ API test completed successfully!");
  } catch (error) {
    if (error instanceof Error) {
      console.error("\n❌ Test failed:", error.message);
    }
  }
}

testAPI();
