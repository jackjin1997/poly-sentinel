# AI 功能快速入门指南

本指南将帮助你在 5 分钟内启用 AI 增强的套利分析。

## 🎯 AI 功能概述

AI 系统为每个套利机会提供：
- 🧠 **情绪分析**：评估市场定价是否合理
- 📊 **智能推荐**：BUY（执行）、HOLD（观察）或 SKIP（跳过）
- ⚠️ **风险识别**：自动识别潜在风险因素
- 💯 **信心评分**：AI 对分析结果的信心度

## 🚀 快速开始

### 方案 1：使用 OpenAI（推荐）

**优点**：最强分析能力，低成本

1. 安装依赖（已完成）
2. 获取 OpenAI API Key：https://platform.openai.com/api-keys
3. 配置环境变量：

```bash
# 编辑 .env 文件
AI_ENABLED=true
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
AI_MODEL=gpt-4o-mini
AI_ENABLED_AGENTS=sentiment
```

4. 运行：

```bash
pnpm dev
```

**成本估算**：
- 每次分析约 $0.0001
- 每天扫描 100 个机会 = $0.01
- **每月约 $0.30**

### 方案 2：使用 Ollama（本地免费）

**优点**：完全免费，隐私保护

1. 安装 Ollama：

```bash
# macOS
brew install ollama

# 启动 Ollama
ollama serve
```

2. 下载模型：

```bash
ollama pull llama3.2
```

3. 配置环境变量：

```bash
AI_ENABLED=true
AI_PROVIDER=ollama
AI_MODEL=llama3.2
AI_ENABLED_AGENTS=sentiment
```

4. 运行：

```bash
pnpm dev
```

**要求**：
- 8GB+ RAM
- 首次下载约 2GB

## 📊 使用示例

启用 AI 后，你会看到增强的输出：

```
📊 Will Bitcoin reach $100k by end of 2024?
   YES: $0.4500
   NO:  $0.5000
   Total: $0.9500
   Expected Profit: $0.0500 (5.26%)
   Liquidity: $50000

🤖 AI Analysis:
   ✅ sentiment: BUY (85% confidence) → Final: BUY
   Confidence: 85%
   Recommendation: ✅ BUY

   💭 Sentiment: Market shows classic inefficiency with emotional 
       pricing. YES+NO sum below 1 indicates strong arbitrage opportunity.
       High liquidity supports execution.
   
   ⚠️  Risks: Price volatility, execution timing

Execute this trade? (y/n)
```

## 🎛️ 配置选项

### AI 提供商

| 提供商 | 成本 | 速度 | 质量 | 适用场景 |
|--------|------|------|------|----------|
| OpenAI GPT-4o-mini | $ | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 生产环境 |
| OpenAI GPT-4o | $$$ | ⚡⚡ | ⭐⭐⭐⭐⭐ | 高价值交易 |
| Ollama (Llama 3.2) | 免费 | ⚡⚡ | ⭐⭐⭐⭐ | 开发/测试 |
| DeepSeek | $ | ⚡⚡⚡ | ⭐⭐⭐⭐ | 成本敏感 |

### AI Agents

当前支持的 Agents：

```bash
AI_ENABLED_AGENTS=sentiment          # 情绪分析（已实现）
# AI_ENABLED_AGENTS=sentiment,risk   # 未来：风险评估
# AI_ENABLED_AGENTS=sentiment,event  # 未来：事件分析
```

### 温度设置

```bash
AI_TEMPERATURE=0.7   # 默认，平衡创造力和准确性
AI_TEMPERATURE=0.3   # 更保守，适合生产
AI_TEMPERATURE=1.0   # 更有创造力，适合探索
```

## 🔧 故障排除

### 问题 1：AI 分析失败

```
❌ SentimentAgent analysis failed
```

**解决**：
1. 检查 API Key 是否正确
2. 检查网络连接
3. 查看日志：`tail -f logs/combined.log`

### 问题 2：Ollama 连接失败

```
❌ LLM completion error: connect ECONNREFUSED
```

**解决**：
```bash
# 确保 Ollama 正在运行
ollama serve

# 在另一个终端测试
curl http://localhost:11434/v1/models
```

### 问题 3：分析太慢

**优化**：
1. 使用 `gpt-4o-mini` 而非 `gpt-4o`
2. 降低 `AI_TEMPERATURE`
3. 使用本地 Ollama

## 📈 效果对比

| 功能 | 无 AI | 有 AI |
|------|-------|-------|
| 检测机会 | ✅ | ✅ |
| 情绪分析 | ❌ | ✅ |
| 风险识别 | ❌ | ✅ |
| 推荐理由 | ❌ | ✅ |
| 假阳性过滤 | ❌ | ✅ |

## 🎓 高级用法

### 1. 自定义提示词

修改 `src/agents/sentiment-agent.ts` 中的 `buildPrompt` 方法。

### 2. 添加新 Agent

参考 `INTEGRATION_PLAN.md` 中的指南。

### 3. 调整推荐逻辑

修改 `src/orchestrator/ai-analyzer.ts` 中的 `determineFinalRecommendation` 方法。

## 💡 最佳实践

### 开发阶段
```bash
AI_ENABLED=true
AI_PROVIDER=ollama
AI_MODEL=llama3.2
DRY_RUN=true
```

### 生产环境
```bash
AI_ENABLED=true
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
DRY_RUN=false
MIN_PROFIT_MARGIN=0.03  # 更保守
```

### 成本优化
```bash
AI_ENABLED=true
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
AI_TEMPERATURE=0.5
# 只对高利润机会启用 AI（通过代码过滤）
```

## 📚 更多资源

- [完整整合计划](INTEGRATION_PLAN.md)
- [Agent 架构文档](src/agents/base-agent.ts)
- [ai-hedge-fund 参考](https://github.com/virattt/ai-hedge-fund)

## 🆘 获取帮助

遇到问题？
1. 查看日志：`tail -f logs/combined.log`
2. 启用调试：`LOG_LEVEL=debug pnpm dev`
3. 查看源码注释

---

**下一步**：启用 AI 后，运行几个周期观察效果，然后决定是否启用实盘交易。
