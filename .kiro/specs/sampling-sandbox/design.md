# Design Document: 采样布点沙盘

## Overview

采样布点沙盘是一个基于Canvas的交互式教学工具，用于固体废物监测课程中采样布点方法的教学和练习。系统提供可视化的沙盘界面，学生可以在不同场景中练习采样点布设，系统实时验证布点方案并给出评分反馈。

### 核心功能
- Canvas画布交互（缩放、平移、网格显示）
- 采样点的添加、移动、删除操作
- 多种采样方法支持（随机、系统、分层、对角线）
- 多场景模板（堆存场、运输车辆、包装容器、填埋场）
- 布点方案验证与评分
- 练习记录保存与回顾
- 教师演示模式

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    采样布点沙盘系统架构                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   场景选择   │  │   工具栏    │  │   知识面板   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────▼────────────────▼────────────────▼──────┐              │
│  │              Canvas 渲染引擎                   │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │              │
│  │  │ 网格层  │ │ 场景层  │ │ 采样点层│         │              │
│  │  └─────────┘ └─────────┘ └─────────┘         │              │
│  └──────────────────┬───────────────────────────┘              │
│                     │                                           │
│  ┌──────────────────▼───────────────────────────┐              │
│  │              状态管理器                        │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │              │
│  │  │采样点列表│ │当前场景 │ │操作历史 │         │              │
│  │  └─────────┘ └─────────┘ └─────────┘         │              │
│  └──────────────────┬───────────────────────────┘              │
│                     │                                           │
│  ┌─────────┬────────┴────────┬─────────┐                       │
│  │         │                 │         │                        │
│  ▼         ▼                 ▼         ▼                        │
│ ┌───────┐ ┌───────┐ ┌───────────┐ ┌─────────┐                  │
│ │验证器 │ │评分器 │ │本地存储   │ │场景数据 │                  │
│ └───────┘ └───────┘ └───────────┘ └─────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. SamplingSandbox (主控制器)

```typescript
interface SamplingSandbox {
  // 初始化
  init(): void;
  
  // 画布操作
  setZoom(scale: number): void;
  pan(dx: number, dy: number): void;
  resetView(): void;
  
  // 采样点操作
  addPoint(x: number, y: number): SamplingPoint | null;
  movePoint(pointId: string, x: number, y: number): boolean;
  deletePoint(pointId: string): boolean;
  clearAllPoints(): void;
  
  // 场景管理
  loadScenario(scenarioId: string): void;
  getCurrentScenario(): Scenario;
  
  // 采样方法
  setSamplingMethod(method: SamplingMethod): void;
  getSamplingMethod(): SamplingMethod;
  
  // 验证与评分
  validatePlan(): ValidationResult;
  calculateScore(): ScoreResult;
  
  // 历史操作
  undo(): void;
  redo(): void;
  
  // 练习记录
  saveRecord(): void;
  loadRecord(recordId: string): void;
  getRecords(): PracticeRecord[];
}
```

### 2. CanvasRenderer (画布渲染器)

```typescript
interface CanvasRenderer {
  // 渲染控制
  render(): void;
  clear(): void;
  
  // 图层渲染
  renderGrid(): void;
  renderScenario(scenario: Scenario): void;
  renderPoints(points: SamplingPoint[]): void;
  renderHelpers(method: SamplingMethod): void;
  
  // 交互反馈
  highlightCell(x: number, y: number): void;
  highlightPoint(pointId: string): void;
  showTooltip(x: number, y: number, text: string): void;
  
  // 坐标转换
  screenToCanvas(screenX: number, screenY: number): {x: number, y: number};
  canvasToScreen(canvasX: number, canvasY: number): {x: number, y: number};
  canvasToGrid(canvasX: number, canvasY: number): {row: number, col: number};
}
```

### 3. PointValidator (布点验证器)

```typescript
interface PointValidator {
  // 验证方法
  validate(points: SamplingPoint[], scenario: Scenario): ValidationResult;
  
  // 单项验证
  validatePointCount(points: SamplingPoint[], scenario: Scenario): ValidationItem;
  validateDistribution(points: SamplingPoint[], scenario: Scenario): ValidationItem;
  validatePositions(points: SamplingPoint[], scenario: Scenario): ValidationItem;
  
  // 辅助计算
  calculateMinPoints(wasteVolume: number): number;
  calculateCoverage(points: SamplingPoint[], area: Area): number;
  isPointInValidArea(point: SamplingPoint, scenario: Scenario): boolean;
}
```

### 4. ScoreCalculator (评分计算器)

```typescript
interface ScoreCalculator {
  // 评分计算
  calculate(points: SamplingPoint[], scenario: Scenario, method: SamplingMethod): ScoreResult;
  
  // 分项评分
  scorePointCount(points: SamplingPoint[], scenario: Scenario): number;
  scoreDistribution(points: SamplingPoint[], scenario: Scenario): number;
  scoreMethodCorrectness(points: SamplingPoint[], method: SamplingMethod): number;
  scoreOperationStandard(operationHistory: Operation[]): number;
  
  // 评级
  getGrade(totalScore: number): Grade;
  generateFeedback(scoreResult: ScoreResult): string;
}
```

### 5. ScenarioManager (场景管理器)

```typescript
interface ScenarioManager {
  // 场景操作
  getScenarioList(): ScenarioInfo[];
  loadScenario(id: string): Scenario;
  getStandardAnswer(scenarioId: string): SamplingPoint[];
  
  // 场景数据
  getScenarioRequirements(id: string): SamplingRequirements;
  getScenarioDescription(id: string): string;
}
```

## Data Models

### SamplingPoint (采样点)

```typescript
interface SamplingPoint {
  id: string;           // 唯一标识 (UUID)
  label: string;        // 显示标签 (S1, S2, ...)
  x: number;            // Canvas X坐标
  y: number;            // Canvas Y坐标
  gridRow: number;      // 网格行号
  gridCol: number;      // 网格列号
  createdAt: number;    // 创建时间戳
  properties?: {        // 可选属性
    depth?: number;     // 采样深度
    note?: string;      // 备注
  };
}
```

### Scenario (场景)

```typescript
interface Scenario {
  id: string;
  name: string;
  description: string;
  type: 'storage' | 'vehicle' | 'container' | 'landfill';
  
  // 区域定义
  bounds: {
    width: number;
    height: number;
  };
  validAreas: Area[];       // 有效采样区域
  invalidAreas: Area[];     // 无效区域（如危险区）
  
  // 采样要求
  requirements: {
    wasteVolume: number;    // 废物堆存量(吨)
    minPoints: number;      // 最少采样点数
    recommendedMethod: SamplingMethod;
  };
  
  // 标准答案
  standardAnswer?: SamplingPoint[];
  
  // 显示配置
  backgroundImage?: string;
  gridSize: number;
}
```

### Area (区域)

```typescript
interface Area {
  type: 'rectangle' | 'polygon' | 'circle';
  points?: {x: number, y: number}[];  // 多边形顶点
  center?: {x: number, y: number};    // 圆心
  radius?: number;                     // 半径
  color?: string;                      // 显示颜色
  label?: string;                      // 区域标签
}
```

### SamplingMethod (采样方法)

```typescript
type SamplingMethod = 'random' | 'systematic' | 'stratified' | 'diagonal';

interface MethodConfig {
  method: SamplingMethod;
  name: string;
  description: string;
  applicableScenarios: string[];
  helpers: {
    showGrid: boolean;
    showDiagonal: boolean;
    enableSnap: boolean;
  };
}
```

### ValidationResult (验证结果)

```typescript
interface ValidationResult {
  passed: boolean;
  items: ValidationItem[];
  suggestions: string[];
}

interface ValidationItem {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}
```

### ScoreResult (评分结果)

```typescript
interface ScoreResult {
  totalScore: number;       // 总分 0-100
  breakdown: {
    pointCount: number;     // 采样点数量得分 (30%)
    distribution: number;   // 分布均匀性得分 (30%)
    methodCorrectness: number; // 方法正确性得分 (20%)
    operationStandard: number; // 操作规范性得分 (20%)
  };
  grade: Grade;
  feedback: string;
}

type Grade = 'excellent' | 'good' | 'pass' | 'fail';
```

### PracticeRecord (练习记录)

```typescript
interface PracticeRecord {
  id: string;
  scenarioId: string;
  scenarioName: string;
  method: SamplingMethod;
  points: SamplingPoint[];
  score: number;
  grade: Grade;
  timestamp: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 画布缩放范围约束
*For any* 缩放操作，缩放比例应始终保持在50%-200%范围内，超出范围的值应被钳制到边界值
**Validates: Requirements 1.3**

### Property 2: 采样点增删一致性
*For any* 采样点添加或删除操作序列，采样点计数显示应始终等于采样点数组的实际长度
**Validates: Requirements 2.1, 2.4, 2.5**

### Property 3: 采样点编号唯一性
*For any* 采样点集合，所有采样点的编号（label）应互不相同
**Validates: Requirements 2.6**

### Property 4: 边界验证正确性
*For any* 点击位置，如果该位置在场景的无效区域内，则不应创建采样点
**Validates: Requirements 2.7**

### Property 5: 网格吸附计算正确性
*For any* 启用网格吸附时的点击位置，创建的采样点坐标应位于最近的网格交点上
**Validates: Requirements 3.3, 7.2**

### Property 6: 场景切换状态重置
*For any* 场景切换操作，切换后采样点数组应为空
**Validates: Requirements 4.5**

### Property 7: 最少采样点数计算
*For any* 废物堆存量，计算出的最少采样点数应符合国标公式：n = √(废物量/采样单元面积)，且不少于5个
**Validates: Requirements 5.2**

### Property 8: 分布均匀性计算
*For any* 采样点集合和采样区域，分布均匀性得分应基于采样点覆盖的网格单元数与总网格单元数的比值
**Validates: Requirements 5.3**

### Property 9: 评分范围约束
*For any* 布点方案，计算出的总分应在0-100范围内，且各分项得分权重之和等于100%
**Validates: Requirements 6.1, 6.2**

### Property 10: 评级阈值正确性
*For any* 总分，评级应满足：≥80分为"优秀"，60-79分为"良好"或"及格"，<60分为"需要改进"
**Validates: Requirements 6.5, 6.6**

### Property 11: 距离计算正确性
*For any* 两个采样点，显示的距离应等于欧几里得距离公式计算结果
**Validates: Requirements 7.3**

### Property 12: 面积计算正确性
*For any* 矩形采样区域，显示的面积应等于宽度×高度
**Validates: Requirements 7.4**

### Property 13: 撤销操作正确性
*For any* 操作序列，执行撤销后状态应与该操作执行前的状态一致
**Validates: Requirements 7.7**

### Property 14: 练习记录数量限制
*For any* 练习记录集合，记录数量应不超过20条，超出时应删除最旧的记录
**Validates: Requirements 9.5**

### Property 15: 练习记录加载一致性
*For any* 保存的练习记录，加载后的采样点集合应与保存时完全一致
**Validates: Requirements 9.1, 9.3**

## Error Handling

### 用户操作错误
- 点击无效区域：显示提示"该区域不可采样"，不创建采样点
- 采样点数量不足：验证时提示"采样点数量不足，建议至少X个"
- 采样点分布不均：验证时高亮显示空白区域，提示"以下区域缺少采样点"

### 系统错误
- Canvas不支持：显示降级提示，建议使用现代浏览器
- 本地存储已满：提示用户清理历史记录
- 场景数据加载失败：显示重试按钮，提供默认场景

### 数据验证
- 坐标越界：自动钳制到有效范围
- 无效的采样方法：回退到默认方法（随机布点）
- 损坏的练习记录：跳过并提示用户

## Testing Strategy

### 单元测试
使用 Vitest 进行单元测试，覆盖核心计算逻辑：
- 坐标转换函数
- 网格吸附计算
- 距离和面积计算
- 最少采样点数计算
- 分布均匀性计算
- 评分计算

### 属性测试
使用 fast-check 进行属性测试，验证正确性属性：
- 每个属性测试运行至少100次迭代
- 测试注释格式：`**Feature: sampling-sandbox, Property {number}: {property_text}**`

### 集成测试
- Canvas渲染与状态同步
- 场景加载与切换
- 练习记录保存与加载

### 手动测试
- 各种采样方法的交互体验
- 不同场景的视觉效果
- 教师演示模式功能
