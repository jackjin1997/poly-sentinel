# 示例运行会话

## 场景：发现并执行套利机会

### 1. 启动程序

```bash
$ pnpm dev
```

### 2. 系统初始化

```
═══════════════════════════════════════════════════════════════
   POLY SENTINEL - Polymarket Arbitrage Bot
═══════════════════════════════════════════════════════════════
   Mode: 🧪 Dry Run
   Min Profit: 2.0%
   Max Trade: $100
═══════════════════════════════════════════════════════════════

📋 Configuration Summary:
  Polymarket API: https://clob.polymarket.com
  Network: Polygon Mainnet
  Min Profit Margin: 2.00%
  Max Trade Amount: $100
  Poll Interval: 10s
  Mode: 🧪 DRY RUN
  Wallet: ❌ Not configured

🔍 Monitoring markets...
```

### 3. 监控中（无机会）

系统静默运行，每 10 秒扫描市场。没有机会时不打印任何信息。

```
[10秒后]
[20秒后]
[30秒后]
...
```

### 4. 发现套利机会

```
════════════════════════════════════════════════════════════════════════════════
🔔 ARBITRAGE OPPORTUNITY DETECTED!
════════════════════════════════════════════════════════════════════════════════
Market: Will Bitcoin reach $50k by end of 2024?
YES Price: $0.4500
NO Price: $0.5200
Total Cost: $0.9700
Expected Profit: $0.0300
Profit Margin: 3.09%
Liquidity: $5000
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────

📊 Will Bitcoin reach $50k by end of 2024?
   YES: $0.4500
   NO:  $0.5200
   Total: $0.9700
   Expected Profit: $0.0300 (3.09%)
   Liquidity: $5000

? Execute this trade? (y/N)
```

### 5. 用户确认交易

```
? Execute this trade? › Yes
? Trade amount (USD): › 50
```

### 6. 执行交易

```
⚡ Executing trade for Will Bitcoin reach $50k by end of 2024?...

🧪 SIMULATING TRADE (DRY RUN)

✅ Trade executed! Profit: $1.4500

────────────────────────────────────────────────────────────────
✅ TRADE EXECUTED SUCCESSFULLY
YES Transaction: 0xSIM_YES_1736391234567
NO Transaction: 0xSIM_NO_1736391234568
Actual Profit: $1.4500
────────────────────────────────────────────────────────────────

🔍 Resuming monitoring...
```

### 7. 继续监控

系统继续扫描市场，寻找新的机会...

### 8. 退出程序

按 `Ctrl+C` 退出：

```
^C

🛑 Shutting down...

────────────────────────────────────────────────────────────────
📈 Statistics
   Opportunities: 1
   Trades: 1
   Profit: $1.45
────────────────────────────────────────────────────────────────
```

## 场景：多个机会同时出现

```
════════════════════════════════════════════════════════════════
🔔 ARBITRAGE OPPORTUNITY DETECTED!
════════════════════════════════════════════════════════════════
Market: Will ETH reach $3000?
YES Price: $0.4800
NO Price: $0.4900
Total Cost: $0.9700
Expected Profit: $0.0300
Profit Margin: 3.09%
════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────

📊 Will ETH reach $3000?
   YES: $0.4800
   NO:  $0.4900
   Total: $0.9700
   Expected Profit: $0.0300 (3.09%)

? Execute this trade? › No

────────────────────────────────────────────────────────────────

📊 Will Bitcoin reach $50k by end of 2024?
   YES: $0.4500
   NO:  $0.5200
   Total: $0.9700
   Expected Profit: $0.0300 (3.09%)

? Execute this trade? › Yes
? Trade amount (USD): › 100

⚡ Executing trade...
✅ Trade executed! Profit: $2.9000
```

## 场景：机会已失效

```
⚡ Executing trade for Will Bitcoin reach $50k?...

❌ Opportunity no longer valid

────────────────────────────────────────────────────────────────
📈 Statistics
   Opportunities: 1
   Trades: 0
   Profit: $0.00
────────────────────────────────────────────────────────────────

🔍 Resuming monitoring...
```

## 场景：API 连接失败

```
❌ API health check failed. Cannot start monitor.

❌ Fatal error: API health check failed
```

## 日志文件内容

### logs/combined.log
```json
{"timestamp":"2024-01-09 11:20:15","level":"info","message":"MONITOR_STARTED","type":"monitor"}
{"timestamp":"2024-01-09 11:20:25","level":"info","message":"OPPORTUNITY_FOUND","type":"opportunity","marketId":"0x123..."}
{"timestamp":"2024-01-09 11:20:40","level":"info","message":"TRADE_EXECUTED","type":"trade","marketId":"0x123...","amount":50,"profit":1.45}
```

### logs/error.log
```json
{"timestamp":"2024-01-09 11:19:50","level":"error","message":"API health check failed","error":"Network timeout"}
```

## 配置调整示例

### 找不到机会？降低阈值

编辑 `.env`:
```env
MIN_PROFIT_MARGIN=0.01  # 从 2% 降到 1%
```

重启程序，将看到更多机会。

### 扫描太慢？提高频率

```env
POLL_INTERVAL_MS=5000  # 从 10 秒改为 5 秒
```

## 实际使用建议

1. **开始时保持默认配置**
   - 2% 最小利润率是合理的起点
   - 观察市场规律

2. **记录统计数据**
   - 每天发现多少机会
   - 价格偏差的分布
   - 哪些市场最活跃

3. **逐步调整参数**
   - 根据观察结果优化配置
   - 平衡机会数量和质量

4. **准备好快速响应**
   - 套利窗口通常很短（秒级）
   - 考虑自动化执行（未来版本）

5. **监控资金效率**
   - 计算每小时、每天的收益
   - 评估是否值得投入时间

---

**提示**: 以上是模拟输出。实际运行时的机会和价格会根据真实市场情况变化。
