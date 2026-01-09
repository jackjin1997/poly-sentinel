# Poly Sentinel 🎯

Polymarket 套利监控与执行系统 - 从最基础的 MVP 开始深入浅出实践。

简洁、优雅的 Polymarket 预测市场套利机器人。

## 核心功能

- **YES/NO 套利检测**：识别 YES + NO ≠ 1 时的价格偏差机会
- **实时监控**：可配置轮询间隔的持续市场监控
- **半自动交易**：通过交互式 CLI 确认并执行交易
- **风险管理**：可配置的利润阈值、交易限额和模拟模式

## 快速开始

### 安装

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 配置

1. 复制环境变量示例文件：
```bash
cp .env.example .env
```

2. 配置环境变量：
   - 设置 `PRIVATE_KEY` 或 `MNEMONIC` 用于钱包访问
   - 调整交易参数（最小利润率、最大交易金额）
   - 设置 `DRY_RUN=true` 进行无风险测试

### 使用

开发模式运行：
```bash
pnpm dev
```

构建并运行生产版本：
```bash
pnpm build
pnpm start
```

测试 API 连接：
```bash
pnpm test:api
```

## 项目架构

```
src/
├── core/               # 核心业务逻辑
│   ├── arbitrage-detector.ts  # 套利检测
│   └── trade-executor.ts      # 交易执行
├── services/          # 外部服务集成
│   ├── polymarket-api.ts     # Polymarket API 客户端
│   ├── monitor.ts            # 监控服务
│   └── notification.ts       # 通知服务
├── cli/              # 命令行界面
│   └── interface.ts
├── utils/            # 工具函数
│   └── logger.ts
├── config/           # 配置管理
│   └── index.ts
├── types/            # TypeScript 类型定义
│   └── index.ts
└── index.ts          # 主入口
```

## 安全特性

- **模拟模式**：在不执行真实交易的情况下测试策略
- **交易限额**：可配置的最大交易金额
- **利润阈值**：仅执行超过最小利润率的交易
- **流动性过滤**：避免低流动性市场
- **Gas 优化**：智能 Gas 价格估算

## 工作原理

1. **市场扫描**：从 Polymarket CLOB API 获取活跃市场
2. **机会检测**：计算 YES + NO 价格并识别偏差
3. **盈利分析**：考虑手续费、Gas 成本和滑点
4. **用户确认**：通过 CLI 展示机会，等待手动批准
5. **交易执行**：同时买入 YES 和 NO 代币以锁定利润

## 示例

```
🔍 发现套利机会！

市场：比特币是否会在 2024 年底达到 $50k？
YES 价格：$0.45
NO 价格：$0.50
总成本：$0.95
预期利润：$0.05 (5.26%)

执行交易？(y/n)
```

## 文档

- [快速开始指南](QUICKSTART.md) - 5 分钟上手
- [架构文档](ARCHITECTURE.md) - 系统设计和组件
- [测试指南](TESTING.md) - 如何测试和验证
- [使用示例](EXAMPLE_SESSION.md) - 实际运行演示
- [项目总结](PROJECT_SUMMARY.md) - 完整概述
- [完成清单](CHECKLIST.md) - 已实现功能

## 设计哲学

本项目遵循**代码简洁之道** (Clean Code) 原则：

- **可读性**：清晰的命名，简单的逻辑
- **最小化**：MVP 只包含核心功能
- **可维护**：结构良好，文档完善
- **可测试**：易于验证和调试

## 开源协议

MIT
