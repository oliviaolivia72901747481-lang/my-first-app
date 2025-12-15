# Design Document: 虚拟工位平台

## Overview

虚拟工位平台是一个面向高职教育的专业实训系统，区别于传统LMS的"管理导向"，专注于"技能习得"和"深度理解"。平台通过四大差异化功能——深度场景化虚拟工位、过程性数据无感采集、AI垂直领域助教、职业RPG成就系统——为环境监测等专业提供沉浸式实训体验。

### 核心设计理念
- **软件即工作流**：界面不是"章节作业"，而是"接受任务单→制定方案→执行操作→填写记录→生成报告"
- **无感数据采集**：自动记录学习过程，分析错误模式，精准定位教学难点
- **垂直领域AI**：基于RAG的专业知识库，引用国标规范回答，AI预批改方案
- **职业RPG激励**：见习工程师→助理工程师→项目经理的成长路径，虚拟上岗证与技能勋章

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         虚拟工位平台系统架构                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         前端展示层 (Frontend)                        │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │ 工位选择  │ │ 任务执行  │ │ AI对话框  │ │ 成就中心  │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │ 虚拟仿真  │ │ 知识库    │ │ 排行榜    │ │ 教师后台  │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────▼───────────────────────────────────┐   │
│  │                         业务逻辑层 (Services)                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │WorkstationSvc│ │TaskFlowSvc  │ │ProcessTracker│ │AITutorSvc   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │CareerSvc    │ │AchievementSvc│ │SimulationSvc│ │AnalyticsSvc │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────▼───────────────────────────────────┐   │
│  │                         数据存储层 (Storage)                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ Supabase    │ │ LocalStorage│ │ Vector DB   │ │ File Storage│   │   │
│  │  │ (主数据库)  │ │ (离线缓存) │ │ (AI知识库) │ │ (文档资料) │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. WorkstationService (工位服务)

```typescript
interface WorkstationService {
  // 工位管理
  getWorkstationList(): Promise<WorkstationInfo[]>;
  getWorkstation(workstationId: string): Promise<Workstation>;
  getWorkstationProgress(userId: string, workstationId: string): Promise<WorkstationProgress>;
  
  // 工位操作
  enterWorkstation(userId: string, workstationId: string): Promise<WorkstationSession>;
  exitWorkstation(sessionId: string): Promise<void>;
  
  // 教师功能
  createWorkstation(data: WorkstationInput): Promise<Workstation>;
  updateWorkstation(workstationId: string, data: Partial<WorkstationInput>): Promise<Workstation>;
  deleteWorkstation(workstationId: string): Promise<boolean>;
}
```

### 2. TaskFlowService (任务流服务)

```typescript
interface TaskFlowService {
  // 任务管理
  getTaskList(workstationId: string): Promise<Task[]>;
  getTask(taskId: string): Promise<Task>;
  getCurrentTask(sessionId: string): Promise<Task | null>;
  
  // 任务执行
  startTask(sessionId: string, taskId: string): Promise<TaskExecution>;
  submitStage(executionId: string, stageId: string, data: StageSubmission): Promise<StageResult>;
  completeTask(executionId: string): Promise<TaskResult>;
  
  // 任务验证
  validateSubmission(stageId: string, data: any): Promise<ValidationResult>;
  getStageTemplate(stageId: string): Promise<StageTemplate>;
}
```

### 3. ProcessTrackerService (过程追踪服务)

```typescript
interface ProcessTrackerService {
  // 行为记录
  logAction(sessionId: string, action: UserAction): Promise<void>;
  logPageView(sessionId: string, pageId: string, duration: number): Promise<void>;
  logModification(sessionId: string, fieldId: string, oldValue: any, newValue: any): Promise<void>;
  logHintView(sessionId: string, hintId: string): Promise<void>;
  
  // 数据分析
  getSessionAnalytics(sessionId: string): Promise<SessionAnalytics>;
  getStudentAnalytics(userId: string): Promise<StudentAnalytics>;
  getClassAnalytics(classId: string): Promise<ClassAnalytics>;
  
  // 难点识别
  identifyDifficultSteps(workstationId: string): Promise<DifficultStep[]>;
  getErrorPatterns(workstationId: string): Promise<ErrorPattern[]>;
}
```

### 4. AITutorService (AI助教服务)

```typescript
interface AITutorService {
  // 问答
  askQuestion(userId: string, question: string, context?: TaskContext): Promise<AIResponse>;
  getConversationHistory(userId: string): Promise<Conversation[]>;
  
  // 方案批改
  reviewSubmission(submissionId: string, submissionType: string): Promise<AIReview>;
  checkLogicErrors(content: string, taskType: string): Promise<LogicError[]>;
  
  // 知识库
  searchKnowledge(query: string): Promise<KnowledgeResult[]>;
  getStandardReference(standardId: string): Promise<StandardReference>;
}
```

### 5. KnowledgeBaseService (知识库服务)

```typescript
interface KnowledgeBaseService {
  // 文档管理
  uploadDocument(file: File, metadata: DocumentMetadata): Promise<Document>;
  updateDocument(docId: string, file: File): Promise<Document>;
  deleteDocument(docId: string): Promise<boolean>;
  
  // 索引管理
  rebuildIndex(docId: string): Promise<void>;
  getIndexStatus(): Promise<IndexStatus>;
  
  // 搜索
  search(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
  semanticSearch(query: string, topK: number): Promise<SemanticResult[]>;
  
  // 标准管理
  getStandardList(): Promise<Standard[]>;
  getStandardContent(standardId: string): Promise<StandardContent>;
}
```

### 6. CareerService (职业成长服务)

```typescript
interface CareerService {
  // 等级管理
  getCareerProfile(userId: string): Promise<CareerProfile>;
  addExperience(userId: string, xp: number, source: string): Promise<CareerProfile>;
  checkLevelUp(userId: string): Promise<LevelUpResult | null>;
  
  // 等级配置
  getLevelConfig(): Promise<LevelConfig[]>;
  getUnlockedFeatures(level: number): Promise<Feature[]>;
}
```

### 7. AchievementService (成就服务)

```typescript
interface AchievementService {
  // 成就管理
  getAchievements(userId: string): Promise<Achievement[]>;
  getUnlockedAchievements(userId: string): Promise<Achievement[]>;
  getLockedAchievements(userId: string): Promise<Achievement[]>;
  
  // 成就检查
  checkAchievements(userId: string, event: AchievementEvent): Promise<Achievement[]>;
  grantAchievement(userId: string, achievementId: string): Promise<Achievement>;
  
  // 上岗证
  getCertificates(userId: string): Promise<Certificate[]>;
  grantCertificate(userId: string, workstationId: string): Promise<Certificate>;
  
  // 分享
  generateShareCard(achievementId: string): Promise<string>;
}
```

### 8. SimulationService (虚拟仿真服务)

```typescript
interface SimulationService {
  // 仿真管理
  loadSimulation(simulationId: string): Promise<SimulationConfig>;
  startSimulation(sessionId: string, simulationId: string): Promise<SimulationSession>;
  
  // 交互处理
  handleDragDrop(simSessionId: string, action: DragDropAction): Promise<DragDropResult>;
  handleParameterChange(simSessionId: string, parameterId: string, value: number): Promise<ParameterEffect>;
  validateAssembly(simSessionId: string): Promise<AssemblyValidation>;
  
  // 评估
  evaluateOperation(simSessionId: string): Promise<OperationEvaluation>;
  getOperationPath(simSessionId: string): Promise<OperationStep[]>;
}
```

## Data Models

### Workstation (工位)

```typescript
interface Workstation {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: WorkstationCategory;
  
  // 配置
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;  // 预计完成时间（分钟）
  requiredLevel: number;  // 解锁所需等级
  
  // 任务
  tasks: Task[];
  totalTasks: number;
  
  // 奖励
  xpReward: number;
  certificateId?: string;
  
  // 元数据
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

type WorkstationCategory = 
  | 'env_monitoring'    // 环境监测
  | 'hazwaste'          // 危废鉴别
  | 'sampling'          // 采样规划
  | 'data_analysis'     // 数据处理
  | 'instrument'        // 仪器操作
  | 'emergency';        // 应急响应
```

### Task (任务)

```typescript
interface Task {
  id: string;
  workstationId: string;
  name: string;
  description: string;
  order: number;
  
  // 任务单
  taskBrief: {
    background: string;
    objectives: string[];
    requirements: string[];
    deadline?: number;
  };
  
  // 阶段
  stages: TaskStage[];
  
  // 评分
  scoringRules: ScoringRule[];
  maxScore: number;
  passingScore: number;
  
  // 奖励
  xpReward: number;
  achievements?: string[];
}

interface TaskStage {
  id: string;
  name: string;
  type: StageType;
  order: number;
  
  // 内容
  instructions: string;
  template?: StageTemplate;
  simulation?: SimulationConfig;
  
  // 验证
  validationRules: ValidationRule[];
  requiredFields: string[];
  
  // 提示
  hints: Hint[];
  hintCost: number;  // 查看提示扣除的分数
}

type StageType = 
  | 'task_receipt'      // 接受任务单
  | 'plan_design'       // 制定方案
  | 'operation'         // 执行操作
  | 'record_filling'    // 填写记录
  | 'report_generation' // 生成报告
  | 'simulation';       // 虚拟仿真
```

### BehaviorLog (行为日志)

```typescript
interface BehaviorLog {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: number;
  
  // 行为类型
  actionType: ActionType;
  
  // 行为详情
  details: {
    pageId?: string;
    fieldId?: string;
    duration?: number;
    oldValue?: any;
    newValue?: any;
    hintId?: string;
    errorType?: string;
  };
}

type ActionType = 
  | 'page_view'         // 页面浏览
  | 'field_focus'       // 字段聚焦
  | 'field_blur'        // 字段失焦
  | 'field_modify'      // 字段修改
  | 'hint_view'         // 查看提示
  | 'submission'        // 提交内容
  | 'error_occur'       // 发生错误
  | 'simulation_action';// 仿真操作
```

### CareerProfile (职业档案)

```typescript
interface CareerProfile {
  userId: string;
  
  // 等级
  level: number;
  levelTitle: CareerLevel;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  
  // 统计
  completedWorkstations: number;
  completedTasks: number;
  totalStudyTime: number;  // 分钟
  
  // 成就
  achievementCount: number;
  certificateCount: number;
  
  // 排名
  classRank?: number;
  globalRank?: number;
}

type CareerLevel = 
  | 'intern'            // 实习生 (Lv.1-2)
  | 'trainee_engineer'  // 见习工程师 (Lv.3-5)
  | 'assistant_engineer'// 助理工程师 (Lv.6-8)
  | 'engineer'          // 工程师 (Lv.9-11)
  | 'senior_engineer'   // 高级工程师 (Lv.12-14)
  | 'project_manager';  // 项目经理 (Lv.15+)
```

### Achievement (成就)

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  
  // 解锁条件
  condition: AchievementCondition;
  
  // 奖励
  xpReward: number;
  
  // 状态
  isUnlocked: boolean;
  unlockedAt?: number;
}

interface AchievementCondition {
  type: 'task_complete' | 'workstation_complete' | 'streak' | 'score' | 'time' | 'special';
  target: string | number;
  current?: number;
}
```

### AIConversation (AI对话)

```typescript
interface AIConversation {
  id: string;
  userId: string;
  
  messages: AIMessage[];
  
  // 上下文
  context?: {
    workstationId?: string;
    taskId?: string;
    stageId?: string;
  };
  
  createdAt: number;
  updatedAt: number;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  
  // 引用
  references?: StandardReference[];
  
  timestamp: number;
}

interface StandardReference {
  standardId: string;
  standardName: string;
  clause: string;
  content: string;
  link?: string;
}
```

### AnalyticsReport (分析报告)

```typescript
interface ClassAnalytics {
  classId: string;
  period: { start: number; end: number };
  
  // 整体统计
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  averageScore: number;
  
  // 难点分析
  difficultSteps: DifficultStep[];
  commonErrors: ErrorPattern[];
  
  // 行为分析
  averageStudyTime: number;
  hintUsageRate: number;
  completionRate: number;
}

interface DifficultStep {
  stepId: string;
  stepName: string;
  workstationId: string;
  
  // 指标
  averageDuration: number;
  hintViewRate: number;
  errorRate: number;
  retryRate: number;
  
  // 建议
  teachingSuggestion: string;
}

interface ErrorPattern {
  patternId: string;
  errorType: string;
  description: string;
  
  // 统计
  occurrenceCount: number;
  affectedStudents: number;
  affectedPercentage: number;
  
  // 关联
  relatedSteps: string[];
  relatedKnowledge: string[];
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 工位列表完整性
*For any* 工位数据，工位列表显示必须包含所有必需字段：工位名称、描述、进度状态
**Validates: Requirements 1.1**

### Property 2: 任务阶段顺序正确性
*For any* 包含多个阶段的任务，阶段流转必须按预设顺序进行：接受任务单→制定方案→执行操作→填写记录→生成报告
**Validates: Requirements 1.5, 2.1**

### Property 3: 方案验证完整性
*For any* 提交的方案，验证逻辑必须正确识别缺失的必填项并返回对应错误信息
**Validates: Requirements 2.3, 2.6**

### Property 4: 行为日志记录完整性
*For any* 用户操作，行为日志必须包含：操作时间戳、操作类型、相关上下文（页面ID/字段ID）
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: 停顿阈值判断正确性
*For any* 步骤停顿时间，当停顿时间超过设定阈值时，该步骤必须被标记为"疑难点"
**Validates: Requirements 3.4**

### Property 6: 统计计算正确性
*For any* 班级行为数据集，平均停顿时间、提示查看率、错误率的计算结果必须与原始数据一致
**Validates: Requirements 3.5**

### Property 7: 错误分类正确性
*For any* 提交的错误内容，错误必须被正确分类为：概念错误、计算错误、流程错误、格式错误之一
**Validates: Requirements 4.1**

### Property 8: 共性问题识别正确性
*For any* 错误数据集，当同一错误在超过设定比例的学生中出现时，必须被标记为"共性问题"
**Validates: Requirements 4.2**

### Property 9: AI回答标准引用格式
*For any* 涉及国家标准的AI回答，必须包含标准编号（如GB xxxx.x-xxxx）和具体条款内容
**Validates: Requirements 5.2**

### Property 10: 知识库版本历史完整性
*For any* 知识文档更新操作，版本历史必须记录：更新时间、更新内容、更新者，且支持回滚到任意历史版本
**Validates: Requirements 6.3**

### Property 11: 知识库搜索正确性
*For any* 关键词搜索，返回的所有结果必须包含该关键词
**Validates: Requirements 6.5**

### Property 12: 经验值计算正确性
*For any* 完成的任务，经验值奖励必须根据任务难度和完成质量（得分）正确计算
**Validates: Requirements 7.1**

### Property 13: 等级晋升正确性
*For any* 经验值变化，当累计经验值达到等级阈值时，职业等级必须自动晋升到对应等级
**Validates: Requirements 7.2**

### Property 14: 等级解锁正确性
*For any* 职业等级，该等级解锁的工位和任务必须与配置一致
**Validates: Requirements 7.4**

### Property 15: 上岗证颁发正确性
*For any* 工位，当学生完成该工位的全部任务时，必须颁发对应的虚拟上岗证
**Validates: Requirements 8.1**

### Property 16: 成就条件判断正确性
*For any* 成就条件，当学生满足条件时必须颁发对应勋章，未满足时不颁发
**Validates: Requirements 8.2**

### Property 17: 仿真组装验证正确性
*For any* 仪器组装操作，验证逻辑必须正确判断组装顺序和连接是否符合预设规则
**Validates: Requirements 9.2**

### Property 18: 仿真参数效果正确性
*For any* 设备参数调节，参数变化必须触发正确的后果计算和显示
**Validates: Requirements 9.3**

### Property 19: 竞赛排行榜排序正确性
*For any* 竞赛排行榜，条目必须按得分降序排列，得分相同时按用时升序排列
**Validates: Requirements 10.2, 10.3**

### Property 20: 进度保存持久化
*For any* 保存的学习进度，重新加载后的状态（工位ID、任务进度、已填写内容）必须与保存时一致
**Validates: Requirements 11.1, 11.3**

### Property 21: 历史记录完整性
*For any* 完成的任务，历史记录必须包含：任务ID、得分、用时、完成时间
**Validates: Requirements 11.3, 11.4**

### Property 22: 数据导出完整性
*For any* 导出的数据报告，必须包含所有请求的数据字段且格式正确
**Validates: Requirements 10.5, 12.4**

## Error Handling

### 用户操作错误
- 未完成前置阶段就跳转：阻止跳转并提示"请先完成当前阶段"
- 提交不完整的方案/报告：显示缺失字段列表，不允许提交
- 仿真操作错误：显示错误提示和正确操作演示，允许重试
- 网络断开时操作：本地缓存操作，恢复连接后自动同步

### 系统错误
- 工位数据加载失败：显示重试按钮，提供离线模式（如有缓存）
- AI服务不可用：显示"AI助教暂时离线"，提供知识库直接搜索
- 进度保存失败：本地备份并提示用户，下次自动重试
- 知识库索引失败：记录错误日志，通知管理员

### 数据验证
- 无效的任务数据：拒绝保存，提示缺失字段
- 损坏的进度记录：尝试恢复，失败则提示用户重新开始
- 超时的竞赛提交：标记为超时，给予部分分数
- 重复的成就颁发：幂等处理，不重复颁发

## Testing Strategy

### 单元测试
使用 Vitest 进行单元测试，覆盖核心计算逻辑：
- 经验值计算
- 等级晋升判断
- 成就条件检查
- 统计数据计算（平均值、比率等）
- 排行榜排序
- 方案/报告验证逻辑

### 属性测试
使用 fast-check 进行属性测试，验证正确性属性：
- 每个属性测试运行至少100次迭代
- 测试注释格式：`**Feature: virtual-station, Property {number}: {property_text}**`

### 集成测试
- 完整任务流程（从进入工位到完成报告）
- 进度保存与加载
- AI问答流程
- 竞赛模式同步

### 手动测试
- 各工位的用户体验
- 虚拟仿真交互
- 知识库搜索和浏览
- 教师后台功能

