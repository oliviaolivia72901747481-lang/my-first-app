# Design Document - 地表水采样虚拟仿真模块

## Overview

本模块为"环境监测站"工位的第三阶段"模拟采样操作"提供交互式虚拟仿真体验。学生将在2D俯视图河流场景中完成完整的地表水采样流程，包括采样点位选择、器具准备、采样操作、现场测定和样品保存。系统将根据HJ/T 91-2002标准对学生操作进行实时评估和反馈。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    虚拟仿真模块架构                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  场景渲染层  │  │  交互控制层  │  │  评分引擎层  │         │
│  │ SceneRenderer│  │ Interaction │  │ ScoreEngine │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────┴────────────────┴────────────────┴──────┐         │
│  │              仿真状态管理器                      │         │
│  │           SimulationStateManager               │         │
│  └──────────────────────┬────────────────────────┘         │
│                         │                                   │
│  ┌──────────────────────┴────────────────────────┐         │
│  │              数据模型层                          │         │
│  │  River | SamplingPoint | Equipment | Sample    │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. SimulationStateManager - 仿真状态管理器

```typescript
interface SimulationState {
  phase: 'point_selection' | 'equipment_prep' | 'sampling' | 'field_test' | 'preservation' | 'complete';
  riverConfig: RiverConfig;
  selectedPoints: SamplingPoint[];
  selectedEquipment: Equipment[];
  samplingOperations: SamplingOperation[];
  fieldMeasurements: FieldMeasurement[];
  preservationMethods: PreservationRecord[];
  errors: OperationError[];
  startTime: number;
  elapsedTime: number;
}

interface SimulationManager {
  init(config: SimulationConfig): void;
  getState(): SimulationState;
  setPhase(phase: string): void;
  addSamplingPoint(point: SamplingPoint): ValidationResult;
  selectEquipment(equipment: Equipment): void;
  performOperation(operation: SamplingOperation): OperationResult;
  recordMeasurement(measurement: FieldMeasurement): void;
  setPreservation(record: PreservationRecord): ValidationResult;
  complete(): SimulationResult;
}
```

### 2. SceneRenderer - 场景渲染器

```typescript
interface RiverConfig {
  width: number;        // 河流宽度(米)
  depth: number;        // 平均水深(米)
  flowDirection: 'left' | 'right';
  pollutionSource: { x: number; y: number; type: string };
  landmarks: Landmark[];
}

interface SceneRenderer {
  renderRiverScene(container: HTMLElement, config: RiverConfig): void;
  renderCrossSectionView(point: SamplingPoint): void;
  highlightValidZones(): void;
  showPointMarker(point: SamplingPoint): void;
  playAnimation(type: 'rinse' | 'sample' | 'measure'): Promise<void>;
  showFeedback(message: string, type: 'success' | 'warning' | 'error'): void;
}
```

### 3. ScoreEngine - 评分引擎

```typescript
interface ScoreResult {
  totalScore: number;
  dimensions: {
    pointSelection: { score: number; maxScore: number; details: string[] };
    equipmentChoice: { score: number; maxScore: number; details: string[] };
    operationSteps: { score: number; maxScore: number; details: string[] };
    fieldMeasurement: { score: number; maxScore: number; details: string[] };
    preservation: { score: number; maxScore: number; details: string[] };
  };
  errors: { step: string; description: string; deduction: number }[];
  suggestions: string[];
  grade: 'excellent' | 'good' | 'pass' | 'fail';
}

interface ScoreEngine {
  calculateScore(state: SimulationState): ScoreResult;
  validatePointSelection(points: SamplingPoint[], config: RiverConfig): ValidationResult;
  validateEquipment(equipment: Equipment[], parameters: string[]): ValidationResult;
  validateOperationSequence(operations: SamplingOperation[]): ValidationResult;
  validatePreservation(records: PreservationRecord[]): ValidationResult;
}
```

## Data Models

### SamplingPoint - 采样点位

```typescript
interface SamplingPoint {
  id: string;
  sectionId: string;      // 所属断面ID
  position: {
    x: number;            // 横向位置(距左岸距离)
    y: number;            // 纵向位置(沿河流方向)
    depth: number;        // 采样深度
  };
  type: 'surface' | 'middle' | 'bottom';  // 表层/中层/底层
  isValid: boolean;
  validationMessage?: string;
}
```

### Equipment - 采样器具

```typescript
interface Equipment {
  id: string;
  name: string;
  type: 'bottle' | 'sampler' | 'preservative' | 'tool';
  material: string;       // 材质(玻璃/塑料等)
  volume?: number;        // 容量(mL)
  suitableFor: string[];  // 适用的监测项目
  notes: string;          // 使用注意事项
}
```

### SamplingOperation - 采样操作

```typescript
interface SamplingOperation {
  id: string;
  pointId: string;
  step: 'rinse' | 'sample' | 'seal' | 'label';
  timestamp: number;
  duration: number;
  isCorrect: boolean;
  notes?: string;
}
```

### FieldMeasurement - 现场测定

```typescript
interface FieldMeasurement {
  id: string;
  pointId: string;
  parameter: 'temperature' | 'pH' | 'DO' | 'conductivity' | 'turbidity';
  value: number;
  unit: string;
  timestamp: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid sampling points within river bounds
*For any* click position on the river scene, if the position is within the river boundaries, then a sampling point should be creatable at that position.
**Validates: Requirements 1.2**

### Property 2: Invalid point selection triggers warning
*For any* sampling point that violates HJ/T 91-2002 requirements (e.g., too close to bank, wrong depth ratio), the system should display a warning message explaining the violation.
**Validates: Requirements 1.4**

### Property 3: Point data persistence
*For any* completed point selection session, all selected points with their positions and types should be retrievable from the state.
**Validates: Requirements 1.5**

### Property 4: Equipment-parameter matching validation
*For any* equipment selection that does not match the required monitoring parameters, the system should provide a mismatch warning.
**Validates: Requirements 2.3**

### Property 5: Toolbox contains selected equipment
*For any* equipment added to the toolbox, querying the toolbox should return that equipment.
**Validates: Requirements 2.4**

### Property 6: Operation sequence validation
*For any* sampling operation sequence that skips required steps (e.g., sampling without rinsing), the system should record an operation error.
**Validates: Requirements 3.4**

### Property 7: Field measurement value ranges
*For any* field measurement simulation, the generated values should be within physically reasonable ranges (e.g., pH 0-14, temperature -5 to 40°C).
**Validates: Requirements 4.2**

### Property 8: Preservation method validation
*For any* preservation method that does not match the monitoring parameter requirements, the system should record an operation error.
**Validates: Requirements 4.4**

### Property 9: Score calculation completeness
*For any* completed simulation, the score result should contain scores for all five dimensions (point selection, equipment, operations, measurement, preservation).
**Validates: Requirements 5.1, 5.2**

### Property 10: Error feedback completeness
*For any* operation error recorded during simulation, the final report should include an explanation and the correct procedure.
**Validates: Requirements 5.3**

## Error Handling

1. **无效点位选择**: 显示警告提示，说明违反的规范条款，不阻止继续操作但记录扣分
2. **器具选择错误**: 提供提示信息，允许重新选择
3. **操作步骤遗漏**: 记录错误，在评分时扣分，提供正确操作说明
4. **保存方法错误**: 记录错误，显示正确的保存方法要求
5. **系统异常**: 自动保存当前进度，允许恢复继续

## Testing Strategy

### Unit Tests
- 测试点位有效性验证逻辑
- 测试器具匹配验证逻辑
- 测试评分计算逻辑
- 测试状态管理器的状态转换

### Property-Based Tests (使用 fast-check)
- Property 1-10 的属性测试
- 随机生成点位、器具、操作序列进行验证

### Integration Tests
- 完整流程测试：从点位选择到最终评分
- UI交互测试：点击、拖拽、动画播放
