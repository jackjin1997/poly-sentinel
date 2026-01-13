# AI-Hedge-Fund 整合计划

## 📋 概述

将 ai-hedge-fund 的多 Agent AI 决策框架整合到 poly-sentinel，提升套利决策的智能化水平。

## 🎯 整合目标

1. **多维度分析**：不仅基于价格差，还要考虑市场情绪、事件影响等
2. **智能决策**：使用 LLM 进行复杂的市场分析
3. **风险优化**：更智能的风险管理和头寸控制
4. **策略多样化**：支持多种套利策略

## 🏗️ 架构设计

### 新增模块

```
src/
├── agents/                      # AI Agent 系统
│   ├── base-agent.ts           # Agent 基类
│   ├── sentiment-agent.ts      # 市场情绪分析
│   ├── event-agent.ts          # 事件驱动分析
│   ├── technical-agent.ts      # 技术分析
│   ├── risk-agent.ts           # 风险评估
│   └── portfolio-agent.ts      # 组合管理
├── llm/                        # LLM 集成
│   ├── openai-client.ts        # OpenAI 客户端
│   ├── prompt-templates.ts     # 提示词模板
│   └── response-parser.ts      # 响应解析
├── analysis/                   # 数据分析
│   ├── sentiment-analyzer.ts   # 情绪分析器
│   ├── news-fetcher.ts         # 新闻获取
│   └── social-monitor.ts       # 社交媒体监控
└── orchestrator/               # Agent 编排
    └── decision-engine.ts      # 决策引擎
```

## 📊 Agent 设计

### 1. Sentiment Agent（情绪分析）
**职责**：分析市场情绪和社交媒体舆论

**输入**：
- 市场问题描述
- 相关新闻标题
- Twitter/Reddit 讨论

**输出**：
- 情绪评分（-1 到 1）
- 信心度（0 到 1）
- 关键见解

**示例提示词**：
```
分析以下 Polymarket 市场的情绪：
问题: "{market_question}"
相关新闻: {news_headlines}
社交讨论: {social_posts}

请评估：
1. 市场整体情绪（看涨/看跌）
2. 是否存在情绪偏差
3. 套利机会的可靠性
```

### 2. Event Agent（事件分析）
**职责**：分析事件发展和概率变化

**输入**：
- 事件描述
- 时间线
- 最新进展

**输出**：
- 事件概率估计
- 催化剂识别
- 时间敏感性

### 3. Risk Agent（风险评估）
**职责**：评估套利机会的风险

**输入**：
- 套利机会详情
- 市场流动性
- 历史波动性

**输出**：
- 风险评分
- 建议头寸大小
- 止损建议

### 4. Portfolio Agent（组合管理）
**职责**：跨市场的投资组合优化

**输入**：
- 当前持仓
- 新机会
- 风险预算

**输出**：
- 最优头寸分配
- 对冲建议
- 再平衡策略

## 🔄 决策流程

### 传统流程（现有）
```
市场扫描 → 价格差检测 → 利润率过滤 → 人工确认 → 执行
```

### AI 增强流程（新）
```
市场扫描 
  ↓
价格差检测 
  ↓
━━━━━━━━━ AI 分析开始 ━━━━━━━━━
  ↓
[Sentiment Agent] 情绪分析
[Event Agent] 事件分析
[Technical Agent] 技术分析
  ↓
[Risk Agent] 风险评估
  ↓
[Portfolio Agent] 组合优化
  ↓
决策引擎：综合所有 Agent 建议
  ↓
━━━━━━━━━ AI 分析结束 ━━━━━━━━━
  ↓
生成推荐（买入/观望/跳过）
  ↓
人工确认（可选）
  ↓
执行交易
```

## 💻 实现示例

### BaseAgent 接口

```typescript
export interface AgentAnalysis {
  confidence: number;      // 0-1
  recommendation: 'BUY' | 'HOLD' | 'SKIP';
  reasoning: string;
  metrics?: Record<string, any>;
}

export abstract class BaseAgent {
  protected llmClient: LLMClient;
  protected agentName: string;

  abstract async analyze(
    opportunity: ArbitrageOpportunity,
    context: MarketContext
  ): Promise<AgentAnalysis>;
}
```

### SentimentAgent 示例

```typescript
export class SentimentAgent extends BaseAgent {
  async analyze(
    opportunity: ArbitrageOpportunity,
    context: MarketContext
  ): Promise<AgentAnalysis> {
    // 1. 获取相关数据
    const news = await this.fetchNews(opportunity.marketName);
    const social = await this.fetchSocialData(opportunity.marketId);
    
    // 2. 构建提示词
    const prompt = this.buildPrompt(opportunity, news, social);
    
    // 3. 调用 LLM
    const response = await this.llmClient.complete(prompt);
    
    // 4. 解析响应
    return this.parseResponse(response);
  }

  private buildPrompt(
    opportunity: ArbitrageOpportunity,
    news: NewsItem[],
    social: SocialPost[]
  ): string {
    return `
你是一位预测市场情绪分析专家。

市场问题：${opportunity.marketName}
当前价格：YES ${opportunity.yesPrice}, NO ${opportunity.noPrice}
套利利润率：${(opportunity.profitMargin * 100).toFixed(2)}%

相关新闻：
${news.map(n => `- ${n.title}`).join('\n')}

社交讨论：
${social.map(s => `- ${s.content}`).join('\n')}

请分析：
1. 市场情绪是否存在偏差？
2. 价格是否反映了最新信息？
3. 这个套利机会的可靠性如何（1-10分）？
4. 是否建议执行这笔交易？

请以 JSON 格式回复：
{
  "sentiment_score": <-1到1的情绪评分>,
  "confidence": <0到1的信心度>,
  "recommendation": <"BUY"|"HOLD"|"SKIP">,
  "reasoning": <你的分析理由>,
  "risk_factors": [<识别的风险因素>]
}
`;
  }
}
```

## 🔧 技术栈

### LLM 提供商（选择一个或多个）
- ✅ **OpenAI** (GPT-4o) - 最强推理能力
- ✅ **Anthropic** (Claude Sonnet) - 长文本分析
- ✅ **DeepSeek** - 成本效益比高
- ✅ **Ollama** - 本地运行（隐私优先）

### 数据源
- 📰 **新闻**：Google News API, NewsAPI
- 🐦 **社交媒体**：Twitter API, Reddit API
- 📊 **历史数据**：Polymarket API
- 💹 **实时数据**：WebSocket feeds

### 存储
- 🗄️ **时序数据**：SQLite / PostgreSQL
- 💾 **缓存**：Redis（可选）
- 📝 **日志**：现有 Winston 系统

## 📈 实施路线图

### Phase 1: 基础 AI 集成 (Week 1-2)
- [ ] 添加 OpenAI/LLM 客户端
- [ ] 实现 BaseAgent 抽象类
- [ ] 创建 SentimentAgent
- [ ] 集成到现有决策流程

**预期成果**：每个套利机会都有 AI 情绪分析

### Phase 2: 多 Agent 系统 (Week 3-4)
- [ ] 实现 EventAgent
- [ ] 实现 RiskAgent
- [ ] 实现 TechnicalAgent
- [ ] 创建 DecisionEngine 编排器

**预期成果**：多维度分析，综合决策

### Phase 3: 数据增强 (Week 5-6)
- [ ] 集成新闻 API
- [ ] 集成社交媒体监控
- [ ] 历史数据分析
- [ ] 市场情绪仪表板

**预期成果**：丰富的数据支持决策

### Phase 4: 高级功能 (Week 7-8)
- [ ] PortfolioAgent 组合优化
- [ ] 回测系统
- [ ] A/B 测试框架
- [ ] 性能监控

**预期成果**：生产级 AI 系统

## 💰 成本估算

### LLM API 调用成本
假设每天扫描 100 个机会，每个机会 3 个 agents：

| 提供商 | 每次调用 | 每天 (300次) | 每月 |
|--------|----------|--------------|------|
| OpenAI GPT-4o-mini | $0.0001 | $0.03 | $0.90 |
| DeepSeek | $0.00001 | $0.003 | $0.09 |
| Ollama (本地) | $0 | $0 | $0 |

**建议**：
- 开发/测试：使用 Ollama 本地模型
- 生产：使用 GPT-4o-mini 或 DeepSeek

### 数据源成本
- NewsAPI: $449/月（开发版免费）
- Twitter API: $100/月（基础版）
- Reddit API: 免费

## 🎯 成功指标

### 量化指标
- 📈 **准确率提升**：AI 推荐的成功率 vs 传统方法
- 💰 **收益改善**：平均每笔交易利润
- ⏱️ **响应速度**：从发现到执行的时间
- 🎲 **风险调整收益**：夏普比率改善

### 质量指标
- ✅ **假阳性率**：错误机会的识别率
- ⚠️ **风险避免**：避免的潜在亏损
- 🎯 **决策质量**：Agent 建议的一致性

## ⚠️ 注意事项

### 技术风险
1. **延迟**：LLM 调用增加决策时间（2-5秒）
   - 缓解：并行调用 agents，设置超时
2. **成本**：API 调用费用
   - 缓解：使用本地模型或缓存结果
3. **可靠性**：LLM 响应质量波动
   - 缓解：多次采样，验证机制

### 业务风险
1. **过度依赖 AI**：机器不能完全取代判断
   - 缓解：保持人工审核环节
2. **数据偏差**：训练数据可能过时
   - 缓解：定期更新提示词，使用最新数据

## 📚 参考资源

### ai-hedge-fund 关键代码
- [Agent 架构](https://github.com/virattt/ai-hedge-fund/tree/main/src/agents)
- [决策流程](https://github.com/virattt/ai-hedge-fund/blob/main/src/main.py)
- [风险管理](https://github.com/virattt/ai-hedge-fund/blob/main/src/agents/risk_manager.py)

### 学习材料
- LangGraph 多 Agent 系统
- Polymarket 市场微观结构
- 预测市场套利策略

## 🚀 快速开始

### 最小可行实现（1小时）

只添加一个简单的 SentimentAgent：

```bash
# 1. 安装依赖
pnpm add openai

# 2. 添加环境变量
echo "OPENAI_API_KEY=your-key" >> .env

# 3. 创建 sentiment-agent.ts（我可以帮你写）

# 4. 集成到 arbitrage-detector.ts
```

这样你可以立即看到 AI 分析的效果！

---

## 总结

整合 ai-hedge-fund 的多 Agent 架构可以让 poly-sentinel 从简单的价格差检测器进化为智能决策系统。关键是循序渐进，先实现一个 Agent，验证效果后再扩展。

你想从哪个阶段开始？我可以帮你实现！
