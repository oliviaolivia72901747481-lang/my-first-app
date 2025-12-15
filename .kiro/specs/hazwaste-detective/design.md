# Design Document: 危废鉴别剧本杀

## Overview

危废鉴别剧本杀是一个沉浸式推理教学游戏，将枯燥的GB 5085系列危险废物鉴别标准学习转化为"破案"体验。学生扮演"环境侦探"，通过分析案件卷宗、策略性购买检测项目、收集线索证据，最终做出危废鉴别判定。系统根据学生的决策路径和预算使用效率进行评分，鼓励精准高效的鉴别思路。

### 核心功能
- 案件卷宗展示（废物来源、外观、气味、初步数据）
- 虚拟预算管理与检测项目购买
- 线索卡片收集与证据链构建
- 危废鉴别判定与结局生成
- 多维度评分与反馈系统
- 案件库管理（预设+自定义）
- 多人竞赛模式
- GB 5085知识库集成

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    危废鉴别剧本杀系统架构                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  案件选择器  │  │  检测商店   │  │  知识库面板  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────▼────────────────▼────────────────▼──────┐              │
│  │                游戏主界面                       │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │              │
│  │  │ 卷宗区  │ │ 线索区  │ │ 判定区  │         │              │
│  │  └─────────┘ └─────────┘ └─────────┘         │              │
│  └──────────────────┬───────────────────────────┘              │
│                     │                                           │
│  ┌──────────────────▼───────────────────────────┐              │
│  │              游戏状态管理器                     │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │              │
│  │  │当前案件 │ │预算余额 │ │已购线索 │         │              │
│  │  └─────────┘ └─────────┘ └─────────┘         │              │
│  └──────────────────┬───────────────────────────┘              │
│                     │                                           │
│  ┌─────────┬────────┴────────┬─────────┐                       │
│  │         │                 │         │                        │
│  ▼         ▼                 ▼         ▼                        │
│ ┌───────┐ ┌───────┐ ┌───────────┐ ┌─────────┐                  │
│ │评分器 │ │验证器 │ │本地存储   │ │案件数据 │                  │
│ └───────┘ └───────┘ └───────────┘ └─────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. DetectiveGame (主控制器)

```typescript
interface DetectiveGame {
  // 初始化
  init(): void;
  
  // 案件管理
  loadCase(caseId: string): void;
  getCurrentCase(): Case;
  getCaseList(): CaseInfo[];
  
  // 预算管理
  getBudget(): number;
  deductBudget(amount: number): boolean;
  
  // 检测购买
  purchaseDetection(itemId: string): DetectionResult | null;
  getPurchasedItems(): DetectionResult[];
  canPurchase(itemId: string): { allowed: boolean; reason?: string };
  
  // 判定提交
  submitJudgment(judgment: Judgment): JudgmentResult;
  
  // 游戏状态
  saveProgress(): void;
  loadProgress(): GameState | null;
  resetGame(): void;
  
  // 历史记录
  getHistory(): GameRecord[];
  replayCase(recordId: string): void;
}
```

### 2. CaseManager (案件管理器)

```typescript
interface CaseManager {
  // 案件操作
  getAllCases(): CaseInfo[];
  getCase(caseId: string): Case;
  getPresetCases(): Case[];
  
  // 教师功能
  createCase(caseData: CaseInput): Case;
  updateCase(caseId: string, caseData: Partial<CaseInput>): Case;
  deleteCase(caseId: string): boolean;
  validateCase(caseData: CaseInput): ValidationResult;
  
  // 案件数据
  getOptimalPath(caseId: string): DetectionItem[];
  getCorrectAnswer(caseId: string): CorrectAnswer;
}
```

### 3. DetectionShop (检测商店)

```typescript
interface DetectionShop {
  // 商品展示
  getAllItems(): DetectionItem[];
  getItemsByCategory(category: DetectionCategory): DetectionItem[];
  getItemDetail(itemId: string): DetectionItemDetail;
  
  // 购买逻辑
  purchase(itemId: string, gameState: GameState): PurchaseResult;
  getItemPrice(itemId: string): number;
  
  // 结果生成
  generateResult(itemId: string, caseId: string): DetectionResult;
}
```

### 4. ScoreCalculator (评分计算器)

```typescript
interface ScoreCalculator {
  // 评分计算
  calculate(gameState: GameState, judgment: Judgment): ScoreResult;
  
  // 分项评分
  scoreAccuracy(judgment: Judgment, correctAnswer: CorrectAnswer): number;
  scoreBudgetEfficiency(spent: number, total: number, optimalSpent: number): number;
  scorePathRationality(path: DetectionItem[], optimalPath: DetectionItem[]): number;
  scoreTime(elapsed: number, timeLimit: number): number;
  
  // 评级与成就
  getGrade(totalScore: number): Grade;
  getAchievements(gameState: GameState, scoreResult: ScoreResult): Achievement[];
  generateFeedback(scoreResult: ScoreResult): Feedback;
}
```

### 5. KnowledgeBase (知识库)

```typescript
interface KnowledgeBase {
  // 标准查询
  getStandardsByCategory(category: HazardCategory): Standard[];
  getStandardClause(clauseId: string): StandardClause;
  searchStandards(keyword: string): StandardClause[];
  
  // 术语解释
  getTermDefinition(term: string): string;
  
  // 关联查询
  getRelatedStandards(detectionItemId: string): StandardClause[];
  getLimitValues(category: HazardCategory): LimitValue[];
}
```

### 6. CompetitionManager (竞赛管理器)

```typescript
interface CompetitionManager {
  // 竞赛控制
  startCompetition(caseId: string, timeLimit: number): Competition;
  endCompetition(competitionId: string): CompetitionResult;
  
  // 排行榜
  getLeaderboard(competitionId: string): LeaderboardEntry[];
  updateLeaderboard(competitionId: string, entry: LeaderboardEntry): void;
  
  // 结果导出
  exportResults(competitionId: string): ExcelData;
}
```

## Data Models

### Case (案件)

```typescript
interface Case {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // 卷宗信息
  caseFile: {
    wasteSource: string;        // 废物来源/产生工艺
    appearance: string;         // 外观描述（颜色、形态）
    odor: string;               // 气味描述
    preliminaryData: {          // 初步检测数据
      ph?: number;
      temperature?: number;
      moisture?: number;
    };
    photos?: string[];          // 废物照片URL
    additionalInfo?: string;    // 其他信息
  };
  
  // 游戏设置
  budget: number;               // 初始预算
  timeLimit?: number;           // 时间限制（秒）
  
  // 答案与评分
  correctAnswer: CorrectAnswer;
  optimalPath: string[];        // 最优检测路径（检测项目ID列表）
  optimalCost: number;          // 最优路径花费
  
  // 检测结果映射
  detectionResults: Map<string, DetectionResultData>;
  
  // 元数据
  isPreset: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### DetectionItem (检测项目)

```typescript
interface DetectionItem {
  id: string;
  name: string;
  category: DetectionCategory;
  price: number;
  description: string;
  
  // 关联信息
  applicableWasteTypes: string[];
  relatedStandards: string[];   // GB 5085条款ID
  
  // 显示配置
  icon: string;
  color: string;
}

type DetectionCategory = 
  | 'corrosivity'      // 腐蚀性检测
  | 'acute_toxicity'   // 急性毒性检测
  | 'leaching_toxicity'// 浸出毒性检测
  | 'flammability'     // 易燃性检测
  | 'reactivity'       // 反应性检测
  | 'toxic_content';   // 毒性物质含量检测
```

### DetectionResult (检测结果/线索卡片)

```typescript
interface DetectionResult {
  id: string;
  itemId: string;
  itemName: string;
  category: DetectionCategory;
  
  // 检测数据
  value: number | string;
  unit: string;
  standardLimit: number | string;
  isExceeded: boolean;
  
  // 购买信息
  cost: number;
  purchaseOrder: number;
  purchaseTime: number;
}
```

### Judgment (鉴别判定)

```typescript
interface Judgment {
  result: 'hazardous' | 'non_hazardous' | 'need_further';
  hazardCharacteristics?: HazardCharacteristic[];  // 危险特性
  standardBasis?: string[];                         // 判定依据（国标条款）
  reasoning?: string;                               // 判定理由
}

type HazardCharacteristic = 
  | 'corrosivity'      // 腐蚀性 (C)
  | 'toxicity'         // 毒性 (T)
  | 'flammability'     // 易燃性 (I)
  | 'reactivity'       // 反应性 (R)
  | 'infectivity';     // 感染性 (In)
```

### CorrectAnswer (正确答案)

```typescript
interface CorrectAnswer {
  result: 'hazardous' | 'non_hazardous';
  hazardCharacteristics: HazardCharacteristic[];
  requiredEvidence: string[];   // 必须获取的检测项目ID
  standardBasis: string[];      // 正确的国标条款
}
```

### GameState (游戏状态)

```typescript
interface GameState {
  caseId: string;
  budget: number;
  remainingBudget: number;
  purchasedItems: DetectionResult[];
  startTime: number;
  elapsedTime: number;
  isCompleted: boolean;
  judgment?: Judgment;
  score?: ScoreResult;
}
```

### ScoreResult (评分结果)

```typescript
interface ScoreResult {
  totalScore: number;           // 总分 0-100
  breakdown: {
    accuracy: number;           // 判定准确性 (40%)
    budgetEfficiency: number;   // 预算使用效率 (30%)
    pathRationality: number;    // 检测路径合理性 (20%)
    timeScore: number;          // 用时得分 (10%)
  };
  grade: Grade;
  achievements: Achievement[];
  feedback: Feedback;
  optimalPathComparison: PathComparison;
}

type Grade = 'gold_detective' | 'silver_detective' | 'bronze_detective' | 'trainee';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}
```

### GameRecord (游戏记录)

```typescript
interface GameRecord {
  id: string;
  caseId: string;
  caseName: string;
  score: number;
  grade: Grade;
  elapsedTime: number;
  purchasePath: string[];       // 检测项目ID顺序
  judgment: Judgment;
  timestamp: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 案件卷宗完整性
*For any* 案件数据，卷宗必须包含所有必需字段：废物来源、外观描述、气味描述、初步检测数据
**Validates: Requirements 1.2**

### Property 2: 预算交易完整性
*For any* 检测项目购买操作，以下规则必须成立：
- 购买后预算余额 = 购买前预算余额 - 项目价格
- 当项目价格 > 预算余额时，购买必须失败
- 当项目已被购买时，重复购买必须失败
**Validates: Requirements 2.3, 2.4, 2.6**

### Property 3: 购买记录完整性
*For any* 成功的检测项目购买，记录必须包含购买顺序（递增整数）和购买时间戳
**Validates: Requirements 2.7**

### Property 4: 检测项目分类正确性
*For any* 检测项目，必须属于且仅属于一个有效类别（腐蚀性/急性毒性/浸出毒性/易燃性/反应性/毒性物质含量）
**Validates: Requirements 2.2**

### Property 5: 判定验证正确性
*For any* 提交的鉴别判定，系统验证结果必须与案件预设的正确答案一致
**Validates: Requirements 4.4**

### Property 6: 评分范围约束
*For any* 完成的游戏，总分必须在0-100范围内，且各分项权重之和等于100%（准确性40% + 预算效率30% + 路径合理性20% + 用时10%）
**Validates: Requirements 5.1, 5.2**

### Property 7: 评级阈值正确性
*For any* 总分，评级必须满足：≥90分为"金牌侦探"，70-89分为"银牌侦探"，60-69分为"铜牌侦探"，<60分为"实习侦探"
**Validates: Requirements 5.6, 5.7**

### Property 8: 精准侦探奖励
*For any* 使用最优路径（最少必要检测项目）且判定正确的游戏，必须获得"精准侦探"成就和额外加分
**Validates: Requirements 5.3**

### Property 9: 案件验证完整性
*For any* 保存的案件，必须包含正确答案和至少一条关键线索（必要检测项目）
**Validates: Requirements 6.5**

### Property 10: 游戏进度持久化
*For any* 保存的游戏进度，加载后的游戏状态（案件ID、预算余额、已购线索）必须与保存时一致
**Validates: Requirements 7.1, 7.3**

### Property 11: 重玩状态重置
*For any* 重玩操作，游戏状态必须重置（预算恢复初始值、已购线索清空、计时重置）
**Validates: Requirements 7.5**

### Property 12: 排行榜排序正确性
*For any* 竞赛排行榜，条目必须按得分降序排列，得分相同时按用时升序排列
**Validates: Requirements 8.3, 8.4**

### Property 13: 知识库搜索正确性
*For any* 关键词搜索，返回的所有标准条款必须包含该关键词
**Validates: Requirements 9.3**

### Property 14: 检测项目标准关联
*For any* 检测项目，必须关联至少一个GB 5085标准条款
**Validates: Requirements 9.4**

## Error Handling

### 用户操作错误
- 预算不足购买：显示提示"预算不足，请谨慎选择检测项目"，不执行购买
- 重复购买检测：显示提示"该项目已检测，无需重复购买"
- 未收集足够证据就提交判定：显示警告"建议收集更多证据再做判定"，但允许提交
- 判定错误：显示失败结局和详细分析，不扣除已花费预算

### 系统错误
- 案件数据加载失败：显示重试按钮，提供默认案件
- 本地存储已满：提示用户清理历史记录
- 竞赛连接断开：自动重连，保留本地进度

### 数据验证
- 无效的案件数据：拒绝保存，提示缺失字段
- 损坏的游戏记录：跳过并提示用户
- 超时的竞赛提交：标记为超时，给予部分分数

## Testing Strategy

### 单元测试
使用 Vitest 进行单元测试，覆盖核心计算逻辑：
- 预算扣除计算
- 评分计算（各维度）
- 评级阈值判定
- 判定验证逻辑
- 排行榜排序

### 属性测试
使用 fast-check 进行属性测试，验证正确性属性：
- 每个属性测试运行至少100次迭代
- 测试注释格式：`**Feature: hazwaste-detective, Property {number}: {property_text}**`

### 集成测试
- 完整游戏流程（从案件加载到评分）
- 游戏进度保存与加载
- 竞赛模式同步

### 手动测试
- 各预设案件的游戏体验
- 知识库搜索和浏览
- 教师案件编辑功能

