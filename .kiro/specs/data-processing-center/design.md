# Design Document - 数据处理中心虚拟工位

## Overview

本模块为虚拟工位平台中"数据处理中心"工位提供完整的环境监测数据处理实训体验。学生将在虚拟环境中完成监测数据的录入、审核、统计分析、质量控制和报告生成等环节。系统将根据HJ 630-2011《环境监测质量管理技术导则》等标准对学生操作进行实时评估和反馈。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    数据处理中心架构                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  数据管理层  │  │  分析计算层  │  │  评分引擎层  │         │
│  │ DataManager │  │ AnalysisEngine│ │ ScoreEngine │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────┴────────────────┴────────────────┴──────┐         │
│  │              状态管理器                          │         │
│  │           DataProcessingStateManager           │         │
│  └──────────────────────┬────────────────────────┘         │
│                         │                                   │
│  ┌──────────────────────┴────────────────────────┐         │
│  │              数据模型层                          │         │
│  │  MonitoringData | QCData | StatResult | Report │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. DataProcessingStateManager - 状态管理器

```typescript
interface DataProcessingState {
  phase: 'data_entry' | 'data_review' | 'statistics' | 'quality_control' | 'report' | 'complete';
  monitoringData: MonitoringDataRecord[];
  reviewedData: ReviewedDataRecord[];
  statisticsResults: StatisticsResult[];
  qcResults: QCResult[];
  reportData: ReportData | null;
  errors: OperationError[];
  startTime: number;
  elapsedTime: number;
}

interface DataProcessingManager {
  init(config: ProcessingConfig): void;
  getState(): DataProcessingState;
  setPhase(phase: string): ValidationResult;
  addMonitoringData(data: MonitoringDataRecord): ValidationResult;
  updateDataReview(dataId: string, review: ReviewDecision): void;
  calculateStatistics(dataIds: string[], method: string): StatisticsResult;
  addQCData(qcData: QCDataRecord): QCResult;
  generateReport(template: string): ReportData;
  complete(): ProcessingResult;
}
```

### 2. DataValidator - 数据验证器

```typescript
interface ValidationRule {
  field: string;
  type: 'required' | 'range' | 'format' | 'custom';
  params: any;
  message: string;
}

interface DataValidator {
  validateFormat(value: any, format: string): ValidationResult;
  validateRange(value: number, min: number, max: number): ValidationResult;
  validateDataRecord(record: MonitoringDataRecord): ValidationResult;
  detectAnomalies(data: MonitoringDataRecord[]): AnomalyResult[];
}
```

### 3. StatisticsEngine - 统计分析引擎

```typescript
interface StatisticsResult {
  method: string;
  dataCount: number;
  mean: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  min: number;
  max: number;
  median: number;
  percentiles: { p25: number; p75: number; p90: number; p95: number };
  chartData: ChartData;
}

interface StatisticsEngine {
  calculateMean(values: number[]): number;
  calculateStandardDeviation(values: number[]): number;
  calculateCV(values: number[]): number;
  calculatePercentile(values: number[], percentile: number): number;
  detectOutliers(values: number[], method: 'iqr' | 'zscore'): number[];
  generateChartData(values: number[], chartType: string): ChartData;
}
```

### 4. QualityControlEngine - 质量控制引擎

```typescript
interface QCResult {
  type: 'blank' | 'parallel' | 'spike_recovery' | 'standard_curve';
  passed: boolean;
  value: number;
  threshold: number;
  message: string;
  suggestions?: string[];
}

interface QualityControlEngine {
  calculateBlankResult(blankValue: number, detectionLimit: number): QCResult;
  calculateParallelDeviation(value1: number, value2: number): QCResult;
  calculateSpikeRecovery(original: number, spiked: number, spikeAmount: number): QCResult;
  validateQCBatch(qcData: QCDataRecord[]): QCBatchResult;
  generateQCChart(qcResults: QCResult[]): ChartData;
}
```

### 5. ReportGenerator - 报告生成器

```typescript
interface ReportData {
  id: string;
  title: string;
  template: string;
  sections: ReportSection[];
  monitoringData: MonitoringDataRecord[];
  statisticsResults: StatisticsResult[];
  qcResults: QCResult[];
  conclusion: string;
  generatedAt: number;
}

interface ReportGenerator {
  loadTemplate(templateId: string): ReportTemplate;
  autoFillData(template: ReportTemplate, state: DataProcessingState): ReportData;
  validateReport(report: ReportData): ValidationResult;
  previewReport(report: ReportData): string;
  exportReport(report: ReportData, format: 'pdf' | 'word'): Blob;
}
```

### 6. DataImportExport - 数据导入导出组件

```typescript
interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errors: ImportError[];
  data: MonitoringDataRecord[];
}

interface ExportOptions {
  format: 'excel' | 'csv' | 'json';
  includeHeaders: boolean;
  dateFormat: string;
  encoding: string;
}

interface DataImportExport {
  parseExcel(file: File): Promise<ImportResult>;
  parseCSV(file: File, delimiter?: string): Promise<ImportResult>;
  validateImportData(data: any[]): ValidationResult;
  mapColumns(sourceColumns: string[], targetFields: string[]): ColumnMapping;
  exportToExcel(data: MonitoringDataRecord[], options: ExportOptions): Blob;
  exportToCSV(data: MonitoringDataRecord[], options: ExportOptions): string;
  exportToJSON(data: MonitoringDataRecord[]): string;
}
```

### 7. DataVisualization - 数据可视化组件

```typescript
interface ChartConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'boxplot' | 'heatmap' | 'radar';
  title: string;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: SeriesConfig[];
  legend: LegendConfig;
  tooltip: TooltipConfig;
  interactive: boolean;
}

interface VisualizationResult {
  chartId: string;
  config: ChartConfig;
  data: any[];
  imageUrl?: string;
}

interface DataVisualization {
  createBarChart(data: number[], labels: string[], config?: Partial<ChartConfig>): VisualizationResult;
  createLineChart(data: number[][], labels: string[], config?: Partial<ChartConfig>): VisualizationResult;
  createScatterPlot(xData: number[], yData: number[], config?: Partial<ChartConfig>): VisualizationResult;
  createBoxPlot(data: number[][], labels: string[]): VisualizationResult;
  createHeatmap(matrix: number[][], xLabels: string[], yLabels: string[]): VisualizationResult;
  createTrendChart(data: TimeSeriesData[], config?: Partial<ChartConfig>): VisualizationResult;
  createComparisonChart(datasets: DataSet[], chartType: string): VisualizationResult;
  exportChart(chartId: string, format: 'png' | 'svg' | 'pdf'): Blob;
  updateChartData(chartId: string, newData: any[]): void;
}
```

### 8. HistoryManager - 历史记录组件

```typescript
interface OperationRecord {
  id: string;
  timestamp: number;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'review' | 'export' | 'import';
  targetType: 'data' | 'qc' | 'report' | 'statistics';
  targetId: string;
  previousValue?: any;
  newValue?: any;
  description: string;
}

interface DataVersion {
  versionId: string;
  dataId: string;
  version: number;
  data: MonitoringDataRecord;
  createdAt: number;
  createdBy: string;
  changeDescription: string;
}

interface HistoryManager {
  recordOperation(operation: Omit<OperationRecord, 'id' | 'timestamp'>): void;
  getOperationHistory(filters?: HistoryFilter): OperationRecord[];
  createVersion(dataId: string, description: string): DataVersion;
  getVersionHistory(dataId: string): DataVersion[];
  restoreVersion(versionId: string): MonitoringDataRecord;
  compareVersions(versionId1: string, versionId2: string): VersionDiff;
  exportHistory(format: 'json' | 'csv'): string;
  clearHistory(beforeDate?: number): void;
}
```

### 9. AIAnalysisEngine - AI辅助分析引擎

```typescript
interface AnomalyDetectionResult {
  dataId: string;
  isAnomaly: boolean;
  confidence: number;
  anomalyType: 'outlier' | 'trend_break' | 'seasonal_deviation' | 'pattern_anomaly';
  explanation: string;
  suggestedAction: string;
}

interface TrendPrediction {
  parameter: string;
  historicalData: TimeSeriesData[];
  predictedValues: PredictedValue[];
  confidence: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  seasonalPattern?: SeasonalPattern;
}

interface DataQualityAssessment {
  overallScore: number;
  completeness: number;
  consistency: number;
  accuracy: number;
  timeliness: number;
  issues: QualityIssue[];
  recommendations: string[];
}

interface AIAnalysisEngine {
  detectAnomalies(data: MonitoringDataRecord[], sensitivity?: number): AnomalyDetectionResult[];
  predictTrend(historicalData: TimeSeriesData[], periods: number): TrendPrediction;
  assessDataQuality(data: MonitoringDataRecord[]): DataQualityAssessment;
  suggestAnalysisMethod(data: MonitoringDataRecord[]): AnalysisSuggestion[];
  identifyCorrelations(datasets: MonitoringDataRecord[][]): CorrelationResult[];
  generateInsights(state: DataProcessingState): Insight[];
  classifyDataPattern(data: number[]): PatternClassification;
}

## Data Models

### MonitoringDataRecord - 监测数据记录

```typescript
interface MonitoringDataRecord {
  id: string;
  sampleId: string;           // 样品编号
  sampleType: string;         // 样品类型
  parameter: string;          // 监测项目
  value: number;              // 测量值
  unit: string;               // 单位
  measurementDate: string;    // 测定日期
  measurementTime: string;    // 测定时间
  analyst: string;            // 分析人员
  instrument: string;         // 使用仪器
  method: string;             // 分析方法
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  isValid: boolean;
  validationMessage?: string;
  createdAt: number;
}
```

### ReviewedDataRecord - 审核数据记录

```typescript
interface ReviewedDataRecord {
  dataId: string;
  reviewerId: string;
  reviewDate: number;
  originalValue: number;
  isAnomaly: boolean;
  anomalyType?: 'outlier' | 'format_error' | 'range_exceeded' | 'suspicious';
  decision: 'accept' | 'reject' | 'modify';
  modifiedValue?: number;
  reason: string;
  referenceRange: { min: number; max: number };
}
```

### QCDataRecord - 质控数据记录

```typescript
interface QCDataRecord {
  id: string;
  type: 'blank' | 'parallel' | 'spike_recovery' | 'standard_curve';
  parameter: string;
  values: number[];
  spikeAmount?: number;       // 加标量（用于加标回收）
  expectedValue?: number;     // 期望值
  detectionLimit?: number;    // 检出限
  timestamp: number;
}
```

### TimeSeriesData - 时间序列数据

```typescript
interface TimeSeriesData {
  timestamp: number;
  value: number;
  parameter: string;
  location?: string;
}
```

### PredictedValue - 预测值

```typescript
interface PredictedValue {
  timestamp: number;
  value: number;
  lowerBound: number;        // 置信区间下限
  upperBound: number;        // 置信区间上限
  confidence: number;
}
```

### Insight - 数据洞察

```typescript
interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'quality' | 'recommendation';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  relatedDataIds: string[];
  suggestedActions: string[];
  confidence: number;
}
```

### ColumnMapping - 列映射配置

```typescript
interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: (value: any) => any;
  required: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Data validation correctness
*For any* monitoring data input, the validation function should correctly identify format errors and range violations, returning appropriate error messages for invalid inputs and accepting valid inputs.
**Validates: Requirements 1.2, 1.3**

### Property 2: Data persistence round-trip
*For any* monitoring data record that is saved, retrieving the data by its ID should return an equivalent record with a unique, non-empty ID.
**Validates: Requirements 1.4**

### Property 3: Data filtering consistency
*For any* filter criteria applied to the data list, all returned records should match the filter criteria, and no matching records should be excluded.
**Validates: Requirements 1.5**

### Property 4: Anomaly detection accuracy
*For any* dataset containing values outside the defined reference range, the anomaly detection function should flag all out-of-range values and provide the reference range.
**Validates: Requirements 2.2, 2.3**

### Property 5: Review decision persistence
*For any* review decision made on a data record, the decision and reason should be retrievable and the data status should be updated accordingly.
**Validates: Requirements 2.4, 2.5**

### Property 6: Statistical calculation correctness
*For any* numeric dataset, the statistical calculations (mean, standard deviation, CV) should produce mathematically correct results within floating-point precision.
**Validates: Requirements 3.2, 3.3**

### Property 7: Chart data completeness
*For any* visualization request, the generated chart data should contain all required fields for the specified chart type.
**Validates: Requirements 3.4**

### Property 8: QC calculation correctness
*For any* QC data input, the calculated QC metrics (relative deviation, recovery rate) should match the standard formulas within acceptable precision.
**Validates: Requirements 4.2**

### Property 9: QC validation accuracy
*For any* QC result that exceeds the allowed threshold, the system should mark it as failed and provide corrective suggestions.
**Validates: Requirements 4.3, 4.5**

### Property 10: Report auto-fill completeness
*For any* report template, the auto-fill function should populate all data fields from the current processing state.
**Validates: Requirements 5.2**

### Property 11: Score calculation completeness
*For any* completed data processing session, the score result should contain scores for all five dimensions (data entry, review, statistics, QC, report) with detailed breakdown.
**Validates: Requirements 6.1, 6.2**

### Property 12: Error feedback completeness
*For any* operation error recorded during processing, the feedback should include an explanation and reference to the relevant standard.
**Validates: Requirements 6.3**

### Property 13: Data import round-trip
*For any* valid dataset exported to CSV/Excel format, importing the exported file should produce an equivalent dataset.
**Validates: Requirements 1.4 (extended)**

### Property 14: Import validation accuracy
*For any* imported data file containing invalid records, the import function should identify all invalid records and provide specific error messages.
**Validates: Requirements 1.2, 1.3 (extended)**

### Property 15: Chart data integrity
*For any* visualization request, the generated chart should accurately represent the source data without data loss or distortion.
**Validates: Requirements 3.4 (extended)**

### Property 16: Version history consistency
*For any* data modification, a version record should be created, and restoring any version should produce the exact data state at that point.
**Validates: Requirements 2.4 (extended)**

### Property 17: Operation history completeness
*For any* user action on data (create, update, delete, review), an operation record should be created with accurate before/after values.
**Validates: Requirements 2.5 (extended)**

### Property 18: AI anomaly detection consistency
*For any* dataset with known outliers (values beyond 3 standard deviations), the AI anomaly detection should identify these outliers with high confidence.
**Validates: Requirements 2.2, 2.3 (extended)**

### Property 19: Trend prediction validity
*For any* time series data with a clear trend, the prediction should correctly identify the trend direction and provide reasonable confidence intervals.
**Validates: Requirements 3.2 (extended)**

## Error Handling

1. **数据格式错误**: 显示具体的格式要求和示例，允许用户修正
2. **数据范围超限**: 标记异常值，提供参考范围，允许用户确认或修改
3. **质控失败**: 显示失败原因和纠正措施建议，记录但不阻止继续操作
4. **统计计算异常**: 处理空数据集、单值数据集等边界情况
5. **报告生成失败**: 提示缺失的必要数据，引导用户补充

## Testing Strategy

### Unit Tests
- 测试数据验证逻辑的各种边界情况
- 测试统计计算的数学正确性
- 测试质控指标计算的准确性
- 测试状态管理器的状态转换
- 测试数据导入解析的正确性
- 测试版本管理的一致性

### Property-Based Tests (使用 fast-check)
- Property 1-19 的属性测试
- 随机生成监测数据、质控数据进行验证
- 测试统计计算对各种数据分布的正确性
- 测试导入导出的往返一致性
- 测试AI异常检测的准确性

### Integration Tests
- 完整流程测试：从数据录入到报告生成
- UI交互测试：数据表格、图表、报告预览
- 数据导入导出流程测试
- 历史记录和版本恢复测试
- AI分析功能集成测试

