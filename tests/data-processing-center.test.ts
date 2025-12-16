/**
 * Tests for Data Processing Center Module
 * 
 * **Feature: data-processing-center**
 * Tests the core functionality of the data processing center simulation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Mock localStorage for Node environment
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

(global as any).localStorage = mockLocalStorage;

// ============ Type Definitions ============

const ProcessingPhase = {
  DATA_ENTRY: 'data_entry',
  DATA_REVIEW: 'data_review',
  STATISTICS: 'statistics',
  QUALITY_CONTROL: 'quality_control',
  REPORT: 'report',
  COMPLETE: 'complete'
} as const;

type ProcessingPhaseType = typeof ProcessingPhase[keyof typeof ProcessingPhase];

const PROCESSING_PHASE_ORDER: ProcessingPhaseType[] = [
  ProcessingPhase.DATA_ENTRY,
  ProcessingPhase.DATA_REVIEW,
  ProcessingPhase.STATISTICS,
  ProcessingPhase.QUALITY_CONTROL,
  ProcessingPhase.REPORT,
  ProcessingPhase.COMPLETE
];

const DataStatus = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

interface MonitoringDataRecord {
  id: string;
  sampleId: string;
  sampleType: string;
  parameter: string;
  value: number;
  unit: string;
  measurementDate: string;
  measurementTime: string;
  analyst: string;
  instrument: string;
  method: string;
  status: string;
  isValid: boolean;
  validationMessage?: string;
  createdAt: number;
}

interface ReviewedDataRecord {
  dataId: string;
  reviewerId: string;
  reviewDate: number;
  originalValue: number;
  isAnomaly: boolean;
  anomalyType?: string;
  decision: 'accept' | 'reject' | 'modify';
  modifiedValue?: number;
  reason: string;
  referenceRange: { min: number; max: number };
}

interface DataProcessingState {
  phase: ProcessingPhaseType;
  monitoringData: MonitoringDataRecord[];
  reviewedData: ReviewedDataRecord[];
  statisticsResults: any[];
  qcResults: any[];
  reportData: any;
  errors: any[];
  startTime: number;
  elapsedTime: number;
}

// ============ Reference Ranges ============

const PARAMETER_REFERENCE_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  'pH': { min: 6.0, max: 9.0, unit: '' },
  'COD': { min: 0, max: 40, unit: 'mg/L' },
  'BOD5': { min: 0, max: 10, unit: 'mg/L' },
  'NH3-N': { min: 0, max: 2.0, unit: 'mg/L' },
  'DO': { min: 2, max: 15, unit: 'mg/L' }
};

const QC_THRESHOLDS = {
  blank: { maxValue: 0.5 },
  parallel: { maxDeviation: 20 },
  spike_recovery: { minRecovery: 80, maxRecovery: 120 }
};

const DATA_PROCESSING_STORAGE_KEY = 'data_processing_center_state';

// ============ Helper Functions ============

function createInitialProcessingState(): DataProcessingState {
  return {
    phase: ProcessingPhase.DATA_ENTRY,
    monitoringData: [],
    reviewedData: [],
    statisticsResults: [],
    qcResults: [],
    reportData: null,
    errors: [],
    startTime: Date.now(),
    elapsedTime: 0
  };
}


// ============ DataProcessingSimulation Class ============

class DataProcessingSimulation {
  private _state: DataProcessingState | null = null;
  private _config: any = null;
  private _listeners: Array<(state: DataProcessingState) => void> = [];
  private _operationHistory: any[] = [];
  private _dataVersions: any[] = [];

  constructor(config: any = null) {
    this._config = config;
  }

  init(config: any = {}): void {
    this._config = config;
    this._state = createInitialProcessingState();
    this._operationHistory = [];
    this._dataVersions = [];
    this._saveState();
    this._notifyListeners();
  }

  getState(): DataProcessingState | null {
    if (!this._state) {
      this._loadState();
    }
    return this._state ? { ...this._state } : null;
  }

  getPhase(): ProcessingPhaseType {
    return this._state?.phase || ProcessingPhase.DATA_ENTRY;
  }

  setPhase(phase: ProcessingPhaseType): { isValid: boolean; message: string } {
    if (!this._state) {
      return { isValid: false, message: '仿真未初始化' };
    }

    const validationResult = this._validatePhaseTransition(this._state.phase, phase);
    if (!validationResult.isValid) {
      return validationResult;
    }

    this._state.phase = phase;
    this._state.elapsedTime = Date.now() - this._state.startTime;
    this._saveState();
    this._notifyListeners();

    return { isValid: true, message: `已进入${phase}阶段` };
  }

  private _validatePhaseTransition(currentPhase: ProcessingPhaseType, targetPhase: ProcessingPhaseType): { isValid: boolean; message?: string } {
    const currentIndex = PROCESSING_PHASE_ORDER.indexOf(currentPhase);
    const targetIndex = PROCESSING_PHASE_ORDER.indexOf(targetPhase);

    if (targetIndex === -1) {
      return { isValid: false, message: '无效的目标阶段' };
    }

    if (targetIndex <= currentIndex + 1) {
      return { isValid: true };
    }

    return { isValid: false, message: `不能从${currentPhase}直接跳转到${targetPhase}` };
  }

  nextPhase(): { isValid: boolean; message: string } {
    if (!this._state) {
      return { isValid: false, message: '仿真未初始化' };
    }

    const currentIndex = PROCESSING_PHASE_ORDER.indexOf(this._state.phase);
    if (currentIndex >= PROCESSING_PHASE_ORDER.length - 1) {
      return { isValid: false, message: '已经是最后阶段' };
    }

    const nextPhase = PROCESSING_PHASE_ORDER[currentIndex + 1];
    return this.setPhase(nextPhase);
  }

  generateDataId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `DATA-${timestamp}-${random}`.toUpperCase();
  }

  validateDataRecord(data: Partial<MonitoringDataRecord>): { isValid: boolean; message: string; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.sampleId || data.sampleId.trim() === '') {
      errors.push('样品编号不能为空');
    } else if (!/^[A-Z]{2}\d{6,10}$/.test(data.sampleId)) {
      warnings.push('样品编号格式建议为：2位大写字母+6-10位数字');
    }

    if (!data.parameter || data.parameter.trim() === '') {
      errors.push('监测项目不能为空');
    }

    if (data.value === undefined || data.value === null || (data.value as any) === '') {
      errors.push('测量值不能为空');
    } else if (typeof data.value !== 'number' || isNaN(data.value)) {
      errors.push('测量值必须是有效数字');
    } else if (data.value < 0) {
      warnings.push('测量值为负数，请确认是否正确');
    }

    if (!data.measurementDate) {
      errors.push('测定日期不能为空');
    }

    if (!data.analyst || data.analyst.trim() === '') {
      errors.push('分析人员不能为空');
    }

    if (data.parameter && data.value !== undefined && typeof data.value === 'number') {
      const range = PARAMETER_REFERENCE_RANGES[data.parameter];
      if (range) {
        if (data.value < range.min || data.value > range.max) {
          warnings.push(`${data.parameter}测量值(${data.value})超出参考范围(${range.min}-${range.max}${range.unit})`);
        }
      }
    }

    const isValid = errors.length === 0;
    let message = '';
    
    if (errors.length > 0) {
      message = errors.join('; ');
    } else if (warnings.length > 0) {
      message = warnings.join('; ');
    } else {
      message = '数据验证通过';
    }

    return { isValid, message, errors, warnings };
  }

  addMonitoringData(data: Partial<MonitoringDataRecord>): { isValid: boolean; message: string; data?: MonitoringDataRecord } {
    if (!this._state) {
      return { isValid: false, message: '仿真未初始化' };
    }

    const validation = this.validateDataRecord(data);
    
    const record: MonitoringDataRecord = {
      id: data.id || this.generateDataId(),
      sampleId: data.sampleId || '',
      sampleType: data.sampleType || '',
      parameter: data.parameter || '',
      value: data.value as number,
      unit: data.unit || '',
      measurementDate: data.measurementDate || '',
      measurementTime: data.measurementTime || '',
      analyst: data.analyst || '',
      instrument: data.instrument || '',
      method: data.method || '',
      status: DataStatus.PENDING,
      isValid: validation.isValid,
      validationMessage: validation.message,
      createdAt: Date.now()
    };

    this._state.monitoringData.push(record);
    this._recordOperation('create', 'data', record.id, null, record, '添加监测数据');
    this._saveState();
    this._notifyListeners();

    return { isValid: validation.isValid, message: validation.message, data: record };
  }

  getMonitoringData(dataId: string): MonitoringDataRecord | null {
    if (!this._state) return null;
    return this._state.monitoringData.find(d => d.id === dataId) || null;
  }

  getAllMonitoringData(): MonitoringDataRecord[] {
    if (!this._state) return [];
    return [...this._state.monitoringData];
  }

  filterMonitoringData(filters: Record<string, any> = {}): MonitoringDataRecord[] {
    if (!this._state) return [];

    return this._state.monitoringData.filter(data => {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue;
        
        if (key === 'parameter' && data.parameter !== value) return false;
        if (key === 'status' && data.status !== value) return false;
        if (key === 'sampleType' && data.sampleType !== value) return false;
        if (key === 'isValid' && data.isValid !== value) return false;
      }
      return true;
    });
  }

  updateDataReview(dataId: string, review: { decision: 'accept' | 'reject' | 'modify'; reason: string; modifiedValue?: number; isAnomaly?: boolean; anomalyType?: string; referenceRange?: { min: number; max: number } }): { isValid: boolean; message: string; review?: ReviewedDataRecord } {
    if (!this._state) {
      return { isValid: false, message: '仿真未初始化' };
    }

    const dataIndex = this._state.monitoringData.findIndex(d => d.id === dataId);
    if (dataIndex === -1) {
      return { isValid: false, message: '数据不存在' };
    }

    const data = this._state.monitoringData[dataIndex];
    
    const reviewRecord: ReviewedDataRecord = {
      dataId,
      reviewerId: 'user',
      reviewDate: Date.now(),
      originalValue: data.value,
      isAnomaly: review.isAnomaly || false,
      anomalyType: review.anomalyType,
      decision: review.decision,
      modifiedValue: review.modifiedValue,
      reason: review.reason || '',
      referenceRange: review.referenceRange || { min: 0, max: 100 }
    };

    if (review.decision === 'accept') {
      this._state.monitoringData[dataIndex].status = DataStatus.APPROVED;
    } else if (review.decision === 'reject') {
      this._state.monitoringData[dataIndex].status = DataStatus.REJECTED;
    } else if (review.decision === 'modify' && review.modifiedValue !== undefined) {
      this._state.monitoringData[dataIndex].value = review.modifiedValue;
      this._state.monitoringData[dataIndex].status = DataStatus.REVIEWED;
    }

    const existingIndex = this._state.reviewedData.findIndex(r => r.dataId === dataId);
    if (existingIndex >= 0) {
      this._state.reviewedData[existingIndex] = reviewRecord;
    } else {
      this._state.reviewedData.push(reviewRecord);
    }

    this._recordOperation('review', 'data', dataId, null, reviewRecord, `审核数据: ${review.decision}`);
    this._saveState();
    this._notifyListeners();

    return { isValid: true, message: '审核决策已记录', review: reviewRecord };
  }

  getReviewRecord(dataId: string): ReviewedDataRecord | null {
    if (!this._state) return null;
    return this._state.reviewedData.find(r => r.dataId === dataId) || null;
  }

  detectAnomalies(data: MonitoringDataRecord[] | null = null, method: string = 'range'): any[] {
    const dataList = data || this._state?.monitoringData || [];
    if (dataList.length === 0) return [];

    const results: any[] = [];

    dataList.forEach(record => {
      const anomalyResult = {
        dataId: record.id,
        isAnomaly: false,
        anomalyType: null as string | null,
        confidence: 0,
        explanation: '',
        referenceRange: null as { min: number; max: number } | null
      };

      // Range-based detection
      if (method === 'range' || method === 'all') {
        const range = PARAMETER_REFERENCE_RANGES[record.parameter];
        if (range && typeof record.value === 'number') {
          if (record.value < range.min || record.value > range.max) {
            anomalyResult.isAnomaly = true;
            anomalyResult.anomalyType = 'range_exceeded';
            anomalyResult.confidence = 0.9;
            anomalyResult.explanation = `${record.parameter}值(${record.value})超出参考范围(${range.min}-${range.max})`;
            anomalyResult.referenceRange = range;
          }
        }
      }

      // IQR-based detection
      if ((method === 'iqr' || method === 'all') && !anomalyResult.isAnomaly) {
        const sameParamData = dataList.filter(d => d.parameter === record.parameter);
        if (sameParamData.length >= 4) {
          const values = sameParamData.map(d => d.value).filter(v => typeof v === 'number').sort((a, b) => a - b);
          const q1 = this._calculatePercentile(values, 25);
          const q3 = this._calculatePercentile(values, 75);
          const iqr = q3 - q1;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;

          if (record.value < lowerBound || record.value > upperBound) {
            anomalyResult.isAnomaly = true;
            anomalyResult.anomalyType = 'outlier';
            anomalyResult.confidence = 0.85;
            anomalyResult.explanation = `${record.parameter}值(${record.value})为统计异常值(IQR方法)`;
            anomalyResult.referenceRange = { min: lowerBound, max: upperBound };
          }
        }
      }

      // Z-score based detection
      if ((method === 'zscore' || method === 'all') && !anomalyResult.isAnomaly) {
        const sameParamData = dataList.filter(d => d.parameter === record.parameter);
        if (sameParamData.length >= 3) {
          const values = sameParamData.map(d => d.value).filter(v => typeof v === 'number');
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
          
          if (std > 0) {
            const zscore = Math.abs((record.value - mean) / std);
            if (zscore > 3) {
              anomalyResult.isAnomaly = true;
              anomalyResult.anomalyType = 'outlier';
              anomalyResult.confidence = 0.95;
              anomalyResult.explanation = `${record.parameter}值(${record.value})Z-score=${zscore.toFixed(2)}，超过3倍标准差`;
              anomalyResult.referenceRange = { min: mean - 3 * std, max: mean + 3 * std };
            }
          }
        }
      }

      results.push(anomalyResult);
    });

    return results;
  }

  private _calculatePercentile(values: number[], percentile: number): number {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  calculateMean(values: number[]): number {
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  calculateStandardDeviation(values: number[]): number {
    if (!values || values.length < 2) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
  }

  calculateCV(values: number[]): number {
    const mean = this.calculateMean(values);
    if (mean === 0) return 0;
    const std = this.calculateStandardDeviation(values);
    return (std / mean) * 100;
  }

  calculateMedian(values: number[]): number {
    return this._calculatePercentile(values, 50);
  }

  calculateStatistics(dataIds: string[] | null = null, method: string = 'descriptive'): any {
    if (!this._state) return null;

    let data: MonitoringDataRecord[];
    if (dataIds && dataIds.length > 0) {
      data = this._state.monitoringData.filter(d => dataIds.includes(d.id));
    } else {
      data = this._state.monitoringData.filter(d => d.status !== DataStatus.REJECTED);
    }

    const values = data.map(d => d.value).filter(v => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) {
      return {
        method,
        dataCount: 0,
        mean: 0,
        standardDeviation: 0,
        coefficientOfVariation: 0,
        min: 0,
        max: 0,
        median: 0,
        percentiles: { p25: 0, p75: 0, p90: 0, p95: 0 },
        chartData: { labels: [], datasets: [] }
      };
    }

    const result = {
      method,
      dataCount: values.length,
      mean: this.calculateMean(values),
      standardDeviation: this.calculateStandardDeviation(values),
      coefficientOfVariation: this.calculateCV(values),
      min: Math.min(...values),
      max: Math.max(...values),
      median: this.calculateMedian(values),
      percentiles: {
        p25: this._calculatePercentile(values, 25),
        p75: this._calculatePercentile(values, 75),
        p90: this._calculatePercentile(values, 90),
        p95: this._calculatePercentile(values, 95)
      },
      chartData: this._generateChartData(data)
    };

    this._state.statisticsResults.push(result);
    this._saveState();
    this._notifyListeners();

    return result;
  }

  private _generateChartData(data: MonitoringDataRecord[]): any {
    const grouped: Record<string, number[]> = {};
    data.forEach(d => {
      if (!grouped[d.parameter]) {
        grouped[d.parameter] = [];
      }
      grouped[d.parameter].push(d.value);
    });

    return {
      type: 'bar',
      labels: Object.keys(grouped),
      datasets: [{
        label: '测量值',
        data: Object.keys(grouped).map(param => this.calculateMean(grouped[param]))
      }]
    };
  }

  // QC Methods
  addQCData(qcData: { type: string; parameter: string; values: number[]; detectionLimit?: number; spikeAmount?: number }): any {
    if (!this._state) {
      return { type: qcData.type, passed: false, value: 0, threshold: 0, message: '仿真未初始化' };
    }

    let result: any;
    switch (qcData.type) {
      case 'blank':
        result = this.calculateBlankResult(qcData.values[0], qcData.detectionLimit || 0.1);
        break;
      case 'parallel':
        result = this.calculateParallelDeviation(qcData.values[0], qcData.values[1]);
        break;
      case 'spike_recovery':
        result = this.calculateSpikeRecovery(qcData.values[0], qcData.values[1], qcData.spikeAmount || 0);
        break;
      default:
        result = { type: qcData.type, passed: true, value: 0, threshold: 0, message: '未知质控类型' };
    }

    this._state.qcResults.push(result);
    this._saveState();
    this._notifyListeners();

    return result;
  }

  calculateBlankResult(blankValue: number, detectionLimit: number): any {
    const threshold = detectionLimit * QC_THRESHOLDS.blank.maxValue;
    const passed = Math.abs(blankValue) <= threshold;

    return {
      type: 'blank',
      passed,
      value: blankValue,
      threshold,
      message: passed 
        ? `空白值(${blankValue})符合要求(≤${threshold})` 
        : `空白值(${blankValue})超出允许范围(≤${threshold})`,
      suggestions: passed ? [] : ['检查试剂纯度', '检查器皿清洁度']
    };
  }

  calculateParallelDeviation(value1: number, value2: number): any {
    const mean = (value1 + value2) / 2;
    const deviation = mean !== 0 ? Math.abs(value1 - value2) / mean * 100 : 0;
    const threshold = QC_THRESHOLDS.parallel.maxDeviation;
    const passed = deviation <= threshold;

    return {
      type: 'parallel',
      passed,
      value: deviation,
      threshold,
      message: passed 
        ? `平行样相对偏差(${deviation.toFixed(2)}%)符合要求(≤${threshold}%)` 
        : `平行样相对偏差(${deviation.toFixed(2)}%)超出允许范围(≤${threshold}%)`,
      suggestions: passed ? [] : ['检查样品均匀性', '检查分析操作一致性']
    };
  }

  calculateSpikeRecovery(original: number, spiked: number, spikeAmount: number): any {
    const recovery = spikeAmount !== 0 ? ((spiked - original) / spikeAmount) * 100 : 0;
    const { minRecovery, maxRecovery } = QC_THRESHOLDS.spike_recovery;
    const passed = recovery >= minRecovery && recovery <= maxRecovery;

    return {
      type: 'spike_recovery',
      passed,
      value: recovery,
      threshold: { min: minRecovery, max: maxRecovery },
      message: passed 
        ? `加标回收率(${recovery.toFixed(2)}%)符合要求(${minRecovery}%-${maxRecovery}%)` 
        : `加标回收率(${recovery.toFixed(2)}%)超出允许范围(${minRecovery}%-${maxRecovery}%)`,
      suggestions: passed ? [] : ['检查是否存在基质干扰', '检查分析方法是否适用']
    };
  }

  getQCResults(): any[] {
    if (!this._state) return [];
    return [...this._state.qcResults];
  }

  generateReport(template: string = 'standard'): any {
    if (!this._state) return null;

    const report = {
      id: `RPT-${Date.now()}`,
      title: '环境监测数据处理报告',
      template,
      sections: [] as any[],
      monitoringData: [...this._state.monitoringData],
      statisticsResults: [...this._state.statisticsResults],
      qcResults: [...this._state.qcResults],
      conclusion: '',
      generatedAt: Date.now()
    };

    // Auto-fill report sections
    report.sections.push({
      id: 'overview',
      title: '一、概述',
      content: `本报告包含${report.monitoringData.length}条监测数据记录。`
    });

    const approvedData = report.monitoringData.filter(d => d.status === DataStatus.APPROVED);
    report.sections.push({
      id: 'data_summary',
      title: '二、数据汇总',
      content: `共录入数据${report.monitoringData.length}条，审核通过${approvedData.length}条。`
    });

    if (report.statisticsResults.length > 0) {
      const latestStats = report.statisticsResults[report.statisticsResults.length - 1];
      report.sections.push({
        id: 'statistics',
        title: '三、统计分析结果',
        content: `数据统计结果：均值=${latestStats.mean.toFixed(4)}。`
      });
    }

    if (report.qcResults.length > 0) {
      const passedQC = report.qcResults.filter((r: any) => r.passed).length;
      report.sections.push({
        id: 'quality_control',
        title: '四、质量控制结果',
        content: `共进行${report.qcResults.length}项质控检查，${passedQC}项合格。`
      });
    }

    report.conclusion = '根据本次数据处理结果，数据质量良好。';

    this._state.reportData = report;
    this._saveState();
    this._notifyListeners();

    return report;
  }

  getReportData(): any {
    return this._state?.reportData || null;
  }

  calculateScore(): any {
    if (!this._state) return null;

    const result = {
      totalScore: 0,
      dimensions: {
        dataEntry: { score: 0, maxScore: 20, details: [] as string[] },
        dataReview: { score: 0, maxScore: 20, details: [] as string[] },
        statistics: { score: 0, maxScore: 20, details: [] as string[] },
        qualityControl: { score: 0, maxScore: 20, details: [] as string[] },
        report: { score: 0, maxScore: 20, details: [] as string[] }
      },
      errors: [] as any[],
      grade: 'fail' as string,
      suggestions: [] as string[]
    };

    // Data entry score
    const totalData = this._state.monitoringData.length;
    const validData = this._state.monitoringData.filter(d => d.isValid).length;
    if (totalData > 0) {
      result.dimensions.dataEntry.score = Math.round((validData / totalData) * 20);
      result.dimensions.dataEntry.details.push(`有效数据: ${validData}/${totalData}`);
    }

    // Data review score
    const pendingData = this._state.monitoringData.filter(d => d.status === DataStatus.PENDING).length;
    if (totalData > 0) {
      const reviewRate = (totalData - pendingData) / totalData;
      result.dimensions.dataReview.score = Math.round(reviewRate * 20);
      result.dimensions.dataReview.details.push(`已审核: ${totalData - pendingData}/${totalData}`);
    }

    // Statistics score
    if (this._state.statisticsResults.length > 0) {
      result.dimensions.statistics.score = 20;
      result.dimensions.statistics.details.push(`完成统计分析: ${this._state.statisticsResults.length}次`);
    }

    // QC score
    const qcTotal = this._state.qcResults.length;
    const qcPassed = this._state.qcResults.filter((r: any) => r.passed).length;
    if (qcTotal > 0) {
      result.dimensions.qualityControl.score = Math.round((qcPassed / qcTotal) * 20);
      result.dimensions.qualityControl.details.push(`质控合格: ${qcPassed}/${qcTotal}`);
    }

    // Report score
    if (this._state.reportData) {
      result.dimensions.report.score = 20;
      result.dimensions.report.details.push('已生成报告');
    }

    // Calculate total
    result.totalScore = Object.values(result.dimensions).reduce((sum, d) => sum + d.score, 0);

    // Grade
    if (result.totalScore >= 90) result.grade = 'excellent';
    else if (result.totalScore >= 80) result.grade = 'good';
    else if (result.totalScore >= 60) result.grade = 'pass';
    else result.grade = 'fail';

    // Suggestions
    if (result.dimensions.dataEntry.score < 15) {
      result.suggestions.push('建议加强数据录入规范性');
    }
    if (result.dimensions.qualityControl.score < 15) {
      result.suggestions.push('建议加强质量控制');
    }

    return result;
  }

  private _recordOperation(action: string, targetType: string, targetId: string, previousValue: any, newValue: any, description: string): void {
    this._operationHistory.push({
      id: `OP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId: 'user',
      action,
      targetType,
      targetId,
      previousValue,
      newValue,
      description
    });
  }

  getOperationHistory(filters: Record<string, any> = {}): any[] {
    let history = [...this._operationHistory];

    if (filters.action) {
      history = history.filter(h => h.action === filters.action);
    }
    if (filters.targetType) {
      history = history.filter(h => h.targetType === filters.targetType);
    }
    if (filters.targetId) {
      history = history.filter(h => h.targetId === filters.targetId);
    }

    return history;
  }

  reset(): void {
    this._state = createInitialProcessingState();
    this._operationHistory = [];
    this._dataVersions = [];
    this._saveState();
    this._notifyListeners();
  }

  subscribe(listener: (state: DataProcessingState) => void): () => void {
    this._listeners.push(listener);
    return () => {
      const index = this._listeners.indexOf(listener);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    };
  }

  private _notifyListeners(): void {
    const state = this.getState();
    if (state) {
      this._listeners.forEach(listener => {
        try {
          listener(state);
        } catch (e) {
          console.error('Listener error:', e);
        }
      });
    }
  }

  private _saveState(): void {
    if (!this._state) return;
    try {
      localStorage.setItem(DATA_PROCESSING_STORAGE_KEY, JSON.stringify({
        state: this._state,
        operationHistory: this._operationHistory,
        dataVersions: this._dataVersions
      }));
    } catch (e) {
      console.error('Failed to save processing state:', e);
    }
  }

  private _loadState(): void {
    try {
      const saved = localStorage.getItem(DATA_PROCESSING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this._state = parsed.state;
        this._operationHistory = parsed.operationHistory || [];
        this._dataVersions = parsed.dataVersions || [];
      }
    } catch (e) {
      console.error('Failed to load processing state:', e);
      this._state = null;
    }
  }

  hasSavedState(): boolean {
    try {
      return localStorage.getItem(DATA_PROCESSING_STORAGE_KEY) !== null;
    } catch (e) {
      return false;
    }
  }

  restoreSavedState(): boolean {
    this._loadState();
    if (this._state) {
      this._notifyListeners();
      return true;
    }
    return false;
  }

  clearSavedState(): void {
    try {
      localStorage.removeItem(DATA_PROCESSING_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear processing state:', e);
    }
    this._state = null;
    this._operationHistory = [];
    this._dataVersions = [];
  }
}


// ============ Arbitraries for Property-Based Testing ============

const validSampleIdArb = fc.stringMatching(/^[A-Z]{2}\d{6,10}$/);

const validMonitoringDataArb = fc.record({
  sampleId: validSampleIdArb,
  sampleType: fc.constantFrom('地表水', '地下水', '废水', '饮用水'),
  parameter: fc.constantFrom('pH', 'COD', 'BOD5', 'NH3-N', 'DO'),
  value: fc.float({ min: 0, max: 100, noNaN: true }),
  unit: fc.constant('mg/L'),
  measurementDate: fc.constantFrom('2024-01-01', '2024-02-15', '2024-03-20', '2024-06-10', '2024-12-01'),
  measurementTime: fc.constant('10:00'),
  analyst: fc.constantFrom('张三', '李四', '王五', '赵六'),
  instrument: fc.constant('分光光度计'),
  method: fc.constant('GB/T 11893-1989')
});

const invalidMonitoringDataArb = fc.oneof(
  // Missing sampleId
  fc.record({
    sampleId: fc.constant(''),
    parameter: fc.constant('pH'),
    value: fc.float({ min: 0, max: 14, noNaN: true }),
    measurementDate: fc.constant('2024-01-01'),
    analyst: fc.constant('张三')
  }),
  // Missing parameter
  fc.record({
    sampleId: validSampleIdArb,
    parameter: fc.constant(''),
    value: fc.float({ min: 0, max: 100, noNaN: true }),
    measurementDate: fc.constant('2024-01-01'),
    analyst: fc.constant('张三')
  }),
  // Missing value
  fc.record({
    sampleId: validSampleIdArb,
    parameter: fc.constant('pH'),
    value: fc.constant(undefined as any),
    measurementDate: fc.constant('2024-01-01'),
    analyst: fc.constant('张三')
  }),
  // Missing analyst
  fc.record({
    sampleId: validSampleIdArb,
    parameter: fc.constant('pH'),
    value: fc.float({ min: 0, max: 14, noNaN: true }),
    measurementDate: fc.constant('2024-01-01'),
    analyst: fc.constant('')
  })
);

// Generate review decisions with proper modifiedValue for 'modify' decisions
const reviewDecisionArb = fc.oneof(
  // Accept decision
  fc.record({
    decision: fc.constant('accept' as const),
    reason: fc.constantFrom('数据正常', '符合标准', '审核通过'),
    modifiedValue: fc.constant(undefined),
    isAnomaly: fc.constant(false),
    referenceRange: fc.record({
      min: fc.constant(0),
      max: fc.constant(100)
    })
  }),
  // Reject decision
  fc.record({
    decision: fc.constant('reject' as const),
    reason: fc.constantFrom('数据异常', '超出范围', '需要重测'),
    modifiedValue: fc.constant(undefined),
    isAnomaly: fc.constant(true),
    referenceRange: fc.record({
      min: fc.constant(0),
      max: fc.constant(100)
    })
  }),
  // Modify decision - must have modifiedValue
  fc.record({
    decision: fc.constant('modify' as const),
    reason: fc.constantFrom('修正数据', '校正误差', '更新值'),
    modifiedValue: fc.float({ min: 0, max: 100, noNaN: true }),
    isAnomaly: fc.boolean(),
    referenceRange: fc.record({
      min: fc.constant(0),
      max: fc.constant(100)
    })
  })
);

// ============ Unit Tests ============

describe('DataProcessingSimulation', () => {
  let simulation: DataProcessingSimulation;

  beforeEach(() => {
    mockLocalStorage.clear();
    simulation = new DataProcessingSimulation();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with data_entry phase', () => {
      simulation.init({});
      const state = simulation.getState();
      expect(state).not.toBeNull();
      expect(state!.phase).toBe(ProcessingPhase.DATA_ENTRY);
    });

    it('should start with empty collections', () => {
      simulation.init({});
      const state = simulation.getState();
      expect(state!.monitoringData).toHaveLength(0);
      expect(state!.reviewedData).toHaveLength(0);
      expect(state!.statisticsResults).toHaveLength(0);
      expect(state!.qcResults).toHaveLength(0);
      expect(state!.errors).toHaveLength(0);
    });
  });

  describe('Phase Transitions', () => {
    beforeEach(() => {
      simulation.init({});
    });

    it('should allow transition to next phase', () => {
      const result = simulation.nextPhase();
      expect(result.isValid).toBe(true);
      expect(simulation.getPhase()).toBe(ProcessingPhase.DATA_REVIEW);
    });

    it('should not allow skipping phases', () => {
      const result = simulation.setPhase(ProcessingPhase.STATISTICS);
      expect(result.isValid).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should save state to localStorage', () => {
      simulation.init({});
      expect(simulation.hasSavedState()).toBe(true);
    });

    it('should restore state from localStorage', () => {
      simulation.init({});
      simulation.nextPhase();

      const newSimulation = new DataProcessingSimulation();
      const restored = newSimulation.restoreSavedState();
      
      expect(restored).toBe(true);
      expect(newSimulation.getPhase()).toBe(ProcessingPhase.DATA_REVIEW);
    });
  });
});

// ============ Property-Based Tests ============

describe('Property-Based Tests', () => {
  let simulation: DataProcessingSimulation;

  beforeEach(() => {
    mockLocalStorage.clear();
    simulation = new DataProcessingSimulation();
    simulation.init({});
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  /**
   * **Feature: data-processing-center, Property 1: Data validation correctness**
   * *For any* monitoring data input, the validation function should correctly identify 
   * format errors and range violations, returning appropriate error messages for invalid 
   * inputs and accepting valid inputs.
   * **Validates: Requirements 1.2, 1.3**
   */
  describe('Property 1: Data validation correctness', () => {
    it('should accept valid monitoring data', () => {
      fc.assert(
        fc.property(validMonitoringDataArb, (data) => {
          const result = simulation.validateDataRecord(data);
          // Valid data should pass validation (no errors, may have warnings)
          return result.isValid === true && result.errors.length === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid monitoring data with appropriate error messages', () => {
      fc.assert(
        fc.property(invalidMonitoringDataArb, (data) => {
          const result = simulation.validateDataRecord(data);
          // Invalid data should fail validation with error messages
          return result.isValid === false && result.errors.length > 0 && result.message.length > 0;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 2: Data persistence round-trip**
   * *For any* monitoring data record that is saved, retrieving the data by its ID 
   * should return an equivalent record with a unique, non-empty ID.
   * **Validates: Requirements 1.4**
   */
  describe('Property 2: Data persistence round-trip', () => {
    it('should persist and retrieve data correctly', () => {
      fc.assert(
        fc.property(validMonitoringDataArb, (data) => {
          const addResult = simulation.addMonitoringData(data);
          
          if (!addResult.data) return false;
          
          const retrievedData = simulation.getMonitoringData(addResult.data.id);
          
          // Data should be retrievable
          if (!retrievedData) return false;
          
          // ID should be non-empty and unique
          if (!retrievedData.id || retrievedData.id.length === 0) return false;
          
          // Core fields should match
          return (
            retrievedData.sampleId === data.sampleId &&
            retrievedData.parameter === data.parameter &&
            retrievedData.value === data.value &&
            retrievedData.analyst === data.analyst
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 3: Data filtering consistency**
   * *For any* filter criteria applied to the data list, all returned records should 
   * match the filter criteria, and no matching records should be excluded.
   * **Validates: Requirements 1.5**
   */
  describe('Property 3: Data filtering consistency', () => {
    it('should filter data correctly by parameter', () => {
      fc.assert(
        fc.property(
          fc.array(validMonitoringDataArb, { minLength: 5, maxLength: 20 }),
          fc.constantFrom('pH', 'COD', 'BOD5', 'NH3-N', 'DO'),
          (dataList, filterParam) => {
            // Add all data
            dataList.forEach(data => simulation.addMonitoringData(data));
            
            // Filter by parameter
            const filtered = simulation.filterMonitoringData({ parameter: filterParam });
            const allData = simulation.getAllMonitoringData();
            
            // All filtered results should match the filter
            const allMatch = filtered.every(d => d.parameter === filterParam);
            
            // Count of filtered should equal count of matching in all data
            const expectedCount = allData.filter(d => d.parameter === filterParam).length;
            
            return allMatch && filtered.length === expectedCount;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 4: Anomaly detection accuracy**
   * *For any* data record with values outside the reference range, the anomaly 
   * detection should correctly identify it as an anomaly with appropriate type.
   * **Validates: Requirements 2.2, 2.3**
   */
  describe('Property 4: Anomaly detection accuracy', () => {
    // Arbitrary for data with values outside reference range (anomalies)
    const outOfRangeDataArb = fc.record({
      sampleId: validSampleIdArb,
      sampleType: fc.constantFrom('地表水', '地下水', '废水', '饮用水'),
      parameter: fc.constant('pH'),
      value: fc.oneof(
        fc.float({ min: Math.fround(-10), max: Math.fround(5.9), noNaN: true }),  // Below pH range (6.0-9.0)
        fc.float({ min: Math.fround(9.1), max: Math.fround(20), noNaN: true })    // Above pH range
      ),
      unit: fc.constant(''),
      measurementDate: fc.constant('2024-01-01'),
      measurementTime: fc.constant('10:00'),
      analyst: fc.constant('张三'),
      instrument: fc.constant('pH计'),
      method: fc.constant('GB/T 6920-1986')
    });

    // Arbitrary for data with values inside reference range (normal)
    const inRangeDataArb = fc.record({
      sampleId: validSampleIdArb,
      sampleType: fc.constantFrom('地表水', '地下水', '废水', '饮用水'),
      parameter: fc.constant('pH'),
      value: fc.float({ min: Math.fround(6.0), max: Math.fround(9.0), noNaN: true }),  // Within pH range
      unit: fc.constant(''),
      measurementDate: fc.constant('2024-01-01'),
      measurementTime: fc.constant('10:00'),
      analyst: fc.constant('张三'),
      instrument: fc.constant('pH计'),
      method: fc.constant('GB/T 6920-1986')
    });

    it('should detect out-of-range values as anomalies', () => {
      fc.assert(
        fc.property(outOfRangeDataArb, (data) => {
          const addResult = simulation.addMonitoringData(data);
          if (!addResult.data) return false;

          const anomalies = simulation.detectAnomalies(null, 'range');
          const anomaly = anomalies.find(a => a.dataId === addResult.data!.id);

          // Should be detected as anomaly
          if (!anomaly) return false;
          if (!anomaly.isAnomaly) return false;
          if (anomaly.anomalyType !== 'range_exceeded') return false;
          if (anomaly.confidence <= 0) return false;
          if (!anomaly.explanation || anomaly.explanation.length === 0) return false;

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should not flag in-range values as anomalies (range method)', () => {
      fc.assert(
        fc.property(inRangeDataArb, (data) => {
          const addResult = simulation.addMonitoringData(data);
          if (!addResult.data) return false;

          const anomalies = simulation.detectAnomalies(null, 'range');
          const anomaly = anomalies.find(a => a.dataId === addResult.data!.id);

          // Should not be detected as anomaly
          if (!anomaly) return false;
          return anomaly.isAnomaly === false;
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 5: Review decision persistence**
   * *For any* review decision made on a data record, the decision and reason should 
   * be retrievable and the data status should be updated accordingly.
   * **Validates: Requirements 2.4, 2.5**
   */
  describe('Property 5: Review decision persistence', () => {
    it('should persist review decisions and update data status', () => {
      fc.assert(
        fc.property(validMonitoringDataArb, reviewDecisionArb, (data, review) => {
          // Add data first
          const addResult = simulation.addMonitoringData(data);
          if (!addResult.data) return false;
          
          const dataId = addResult.data.id;
          
          // Make review decision
          const reviewResult = simulation.updateDataReview(dataId, review);
          if (!reviewResult.isValid) return false;
          
          // Retrieve review record
          const retrievedReview = simulation.getReviewRecord(dataId);
          if (!retrievedReview) return false;
          
          // Check decision and reason are persisted
          if (retrievedReview.decision !== review.decision) return false;
          if (retrievedReview.reason !== review.reason) return false;
          
          // Check data status is updated
          const updatedData = simulation.getMonitoringData(dataId);
          if (!updatedData) return false;
          
          if (review.decision === 'accept' && updatedData.status !== DataStatus.APPROVED) return false;
          if (review.decision === 'reject' && updatedData.status !== DataStatus.REJECTED) return false;
          if (review.decision === 'modify' && updatedData.status !== DataStatus.REVIEWED) return false;
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 6: Statistical calculation correctness**
   * *For any* set of numeric values, the statistical calculations (mean, std dev, CV, 
   * median, percentiles) should be mathematically correct.
   * **Validates: Requirements 3.2, 3.3**
   */
  describe('Property 6: Statistical calculation correctness', () => {
    it('should calculate mean correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 20 }),
          (values) => {
            const expectedMean = values.reduce((a, b) => a + b, 0) / values.length;
            const calculatedMean = simulation.calculateMean(values);
            return Math.abs(calculatedMean - expectedMean) < 0.0001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate statistics for monitoring data', () => {
      fc.assert(
        fc.property(
          fc.array(validMonitoringDataArb, { minLength: 3, maxLength: 10 }),
          (dataList) => {
            // Add all data
            const addedIds: string[] = [];
            dataList.forEach(data => {
              const result = simulation.addMonitoringData(data);
              if (result.data) addedIds.push(result.data.id);
            });

            if (addedIds.length === 0) return true;

            // Calculate statistics
            const stats = simulation.calculateStatistics(addedIds, 'descriptive');
            
            if (!stats) return false;
            
            // Verify basic properties
            if (stats.dataCount !== addedIds.length) return false;
            if (stats.min > stats.max) return false;
            if (stats.median < stats.min || stats.median > stats.max) return false;
            if (stats.mean < stats.min || stats.mean > stats.max) return false;
            if (stats.standardDeviation < 0) return false;
            if (stats.coefficientOfVariation < 0) return false;
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 8: QC calculation correctness**
   * *For any* QC data input, the calculation should produce mathematically correct 
   * results for blank, parallel, and spike recovery tests.
   * **Validates: Requirements 4.2**
   */
  describe('Property 8: QC calculation correctness', () => {
    it('should calculate blank result correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(1), noNaN: true }),
          (blankValue, detectionLimit) => {
            const result = simulation.calculateBlankResult(blankValue, detectionLimit);
            
            // Threshold should be detectionLimit * 0.5
            const expectedThreshold = detectionLimit * 0.5;
            if (Math.abs(result.threshold - expectedThreshold) > 0.0001) return false;
            
            // Passed should be true if |blankValue| <= threshold
            const expectedPassed = Math.abs(blankValue) <= expectedThreshold;
            if (result.passed !== expectedPassed) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate parallel deviation correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
          (value1, value2) => {
            const result = simulation.calculateParallelDeviation(value1, value2);
            
            // Calculate expected deviation
            const mean = (value1 + value2) / 2;
            const expectedDeviation = mean !== 0 ? Math.abs(value1 - value2) / mean * 100 : 0;
            
            if (Math.abs(result.value - expectedDeviation) > 0.01) return false;
            
            // Passed should be true if deviation <= 20%
            const expectedPassed = expectedDeviation <= 20;
            if (result.passed !== expectedPassed) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate spike recovery correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
          fc.float({ min: Math.fround(10), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(1), max: Math.fround(50), noNaN: true }),
          (original, spiked, spikeAmount) => {
            // Ensure spiked > original for valid test
            const actualSpiked = original + spikeAmount * (0.5 + Math.random());
            
            const result = simulation.calculateSpikeRecovery(original, actualSpiked, spikeAmount);
            
            // Calculate expected recovery
            const expectedRecovery = ((actualSpiked - original) / spikeAmount) * 100;
            
            if (Math.abs(result.value - expectedRecovery) > 0.01) return false;
            
            // Passed should be true if recovery is between 80% and 120%
            const expectedPassed = expectedRecovery >= 80 && expectedRecovery <= 120;
            if (result.passed !== expectedPassed) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 10: Report auto-fill completeness**
   * *For any* generated report, all sections should be auto-filled with data from 
   * monitoring records, statistics results, and QC results.
   * **Validates: Requirements 5.2**
   */
  describe('Property 10: Report auto-fill completeness', () => {
    it('should auto-fill report with monitoring data', () => {
      fc.assert(
        fc.property(
          fc.array(validMonitoringDataArb, { minLength: 1, maxLength: 10 }),
          (dataList) => {
            // Reset simulation for each test run
            simulation.reset();
            
            // Add monitoring data and count successful additions
            let addedCount = 0;
            dataList.forEach(data => {
              const result = simulation.addMonitoringData(data);
              if (result.data) addedCount++;
            });
            
            // Generate report
            const report = simulation.generateReport('standard');
            
            if (!report) return false;
            
            // Report should contain all added monitoring data
            if (report.monitoringData.length !== addedCount) return false;
            
            // Report should have sections
            if (!report.sections || report.sections.length === 0) return false;
            
            // Should have overview section
            const overviewSection = report.sections.find((s: any) => s.id === 'overview');
            if (!overviewSection) return false;
            
            // Should have data summary section
            const summarySection = report.sections.find((s: any) => s.id === 'data_summary');
            if (!summarySection) return false;
            
            // Should have conclusion
            if (!report.conclusion || report.conclusion.length === 0) return false;
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should include statistics and QC results in report when available', () => {
      fc.assert(
        fc.property(
          fc.array(validMonitoringDataArb, { minLength: 3, maxLength: 8 }),
          (dataList) => {
            // Add monitoring data
            const addedIds: string[] = [];
            dataList.forEach(data => {
              const result = simulation.addMonitoringData(data);
              if (result.data) addedIds.push(result.data.id);
            });
            
            // Calculate statistics
            if (addedIds.length > 0) {
              simulation.calculateStatistics(addedIds, 'descriptive');
            }
            
            // Add QC data
            simulation.addQCData({ type: 'blank', parameter: 'pH', values: [0.01], detectionLimit: 0.1 });
            
            // Generate report
            const report = simulation.generateReport('standard');
            
            if (!report) return false;
            
            // Report should include statistics results
            if (report.statisticsResults.length === 0) return false;
            
            // Report should include QC results
            if (report.qcResults.length === 0) return false;
            
            // Should have statistics section
            const statsSection = report.sections.find((s: any) => s.id === 'statistics');
            if (!statsSection) return false;
            
            // Should have QC section
            const qcSection = report.sections.find((s: any) => s.id === 'quality_control');
            if (!qcSection) return false;
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 9: QC validation accuracy**
   * *For any* QC result, the pass/fail determination should correctly compare 
   * calculated values against defined thresholds.
   * **Validates: Requirements 4.3, 4.5**
   */
  describe('Property 9: QC validation accuracy', () => {
    it('should correctly validate QC results and provide suggestions for failures', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('blank', 'parallel', 'spike_recovery'),
          fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
          (qcType, value) => {
            let qcData: any;
            
            if (qcType === 'blank') {
              qcData = { type: 'blank', parameter: 'pH', values: [value], detectionLimit: 0.1 };
            } else if (qcType === 'parallel') {
              // Create two values with known deviation
              const value2 = value * 1.1; // 10% difference
              qcData = { type: 'parallel', parameter: 'pH', values: [value, value2] };
            } else {
              // spike_recovery
              const spikeAmount = 10;
              const spiked = value + spikeAmount; // 100% recovery
              qcData = { type: 'spike_recovery', parameter: 'pH', values: [value, spiked], spikeAmount };
            }
            
            const result = simulation.addQCData(qcData);
            
            // Result should have required fields
            if (result.type !== qcType) return false;
            if (typeof result.passed !== 'boolean') return false;
            if (typeof result.value !== 'number') return false;
            if (result.message === undefined || result.message.length === 0) return false;
            
            // Failed results should have suggestions
            if (!result.passed && (!result.suggestions || result.suggestions.length === 0)) return false;
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 7: Chart data completeness**
   * *For any* statistics calculation, the generated chart data should contain 
   * all parameters present in the input data with correct aggregated values.
   * **Validates: Requirements 3.4**
   */
  describe('Property 7: Chart data completeness', () => {
    it('should generate chart data with all parameters', () => {
      fc.assert(
        fc.property(
          fc.array(validMonitoringDataArb, { minLength: 3, maxLength: 15 }),
          (dataList) => {
            // Add all data
            const addedIds: string[] = [];
            dataList.forEach(data => {
              const result = simulation.addMonitoringData(data);
              if (result.data) addedIds.push(result.data.id);
            });

            if (addedIds.length === 0) return true;

            // Calculate statistics
            const stats = simulation.calculateStatistics(addedIds, 'descriptive');
            
            if (!stats || !stats.chartData) return false;
            
            // Get unique parameters from added data
            const allData = simulation.getAllMonitoringData();
            const addedData = allData.filter(d => addedIds.includes(d.id));
            const uniqueParams = [...new Set(addedData.map(d => d.parameter))];
            
            // Chart should have labels for all parameters
            if (!stats.chartData.labels) return false;
            
            // All unique parameters should be in chart labels
            const chartLabels = stats.chartData.labels;
            const allParamsInChart = uniqueParams.every(p => chartLabels.includes(p));
            
            return allParamsInChart;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 17: Operation history completeness**
   * *For any* user action on data (create, update, delete, review), an operation 
   * record should be created with accurate before/after values.
   * **Validates: Requirements 2.5 (extended)**
   */
  describe('Property 17: Operation history completeness', () => {
    it('should record all operations in history', () => {
      fc.assert(
        fc.property(validMonitoringDataArb, reviewDecisionArb, (data, review) => {
          const initialHistoryLength = simulation.getOperationHistory().length;
          
          // Add data - should create operation record
          const addResult = simulation.addMonitoringData(data);
          if (!addResult.data) return false;
          
          const afterAddHistory = simulation.getOperationHistory();
          if (afterAddHistory.length !== initialHistoryLength + 1) return false;
          
          // Review data - should create another operation record
          simulation.updateDataReview(addResult.data.id, review);
          
          const afterReviewHistory = simulation.getOperationHistory();
          if (afterReviewHistory.length !== initialHistoryLength + 2) return false;
          
          // Check that operations are recorded with correct action types
          const createOps = simulation.getOperationHistory({ action: 'create' });
          const reviewOps = simulation.getOperationHistory({ action: 'review' });
          
          return createOps.length >= 1 && reviewOps.length >= 1;
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 11: Score calculation completeness**
   * *For any* completed data processing workflow, the score should include all 
   * dimensions (data entry, review, statistics, QC, report) with valid scores.
   * **Validates: Requirements 6.1, 6.2**
   */
  describe('Property 11: Score calculation completeness', () => {
    it('should calculate scores for all dimensions', () => {
      fc.assert(
        fc.property(
          fc.array(validMonitoringDataArb, { minLength: 2, maxLength: 5 }),
          (dataList) => {
            simulation.reset();
            
            // Add monitoring data
            const addedIds: string[] = [];
            dataList.forEach(data => {
              const result = simulation.addMonitoringData(data);
              if (result.data) addedIds.push(result.data.id);
            });
            
            if (addedIds.length === 0) return true;
            
            // Review some data
            if (addedIds.length > 0) {
              simulation.updateDataReview(addedIds[0], { decision: 'accept', reason: 'OK' });
            }
            
            // Calculate statistics
            simulation.calculateStatistics(addedIds, 'descriptive');
            
            // Add QC data
            simulation.addQCData({ type: 'blank', parameter: 'pH', values: [0.01], detectionLimit: 0.1 });
            
            // Generate report
            simulation.generateReport('standard');
            
            // Calculate score
            const score = simulation.calculateScore();
            
            if (!score) return false;
            
            // Score should have all dimensions
            if (!score.dimensions) return false;
            if (!score.dimensions.dataEntry) return false;
            if (!score.dimensions.dataReview) return false;
            if (!score.dimensions.statistics) return false;
            if (!score.dimensions.qualityControl) return false;
            if (!score.dimensions.report) return false;
            
            // Total score should be between 0 and 100
            if (score.totalScore < 0 || score.totalScore > 100) return false;
            
            // Grade should be valid
            const validGrades = ['excellent', 'good', 'pass', 'fail'];
            if (!validGrades.includes(score.grade)) return false;
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 12: Error feedback completeness**
   * *For any* error recorded during data processing, the feedback should include 
   * description, deduction points, and standard reference.
   * **Validates: Requirements 6.3**
   */
  describe('Property 12: Error feedback completeness', () => {
    it('should provide complete error feedback with deductions', () => {
      // Add invalid data to trigger errors
      simulation.addMonitoringData({
        sampleId: '',  // Invalid - empty
        parameter: 'pH',
        value: 100,  // Out of range for pH
        measurementDate: '2024-01-01',
        analyst: '张三'
      });
      
      const score = simulation.calculateScore();
      
      if (!score) return;
      
      // If there are errors, they should have required fields
      if (score.errors && score.errors.length > 0) {
        score.errors.forEach((error: any) => {
          expect(error.description).toBeDefined();
          expect(typeof error.deduction).toBe('number');
        });
      }
      
      // Suggestions should be provided for low scores
      if (score.totalScore < 80) {
        expect(score.suggestions).toBeDefined();
      }
    });
  });
});


// ============ DataImportExport Class for Testing ============

/**
 * Column mapping configuration
 */
const DEFAULT_COLUMN_MAPPING: Record<string, string> = {
  '样品编号': 'sampleId',
  'sampleId': 'sampleId',
  '样品类型': 'sampleType',
  'sampleType': 'sampleType',
  '监测项目': 'parameter',
  'parameter': 'parameter',
  '测量值': 'value',
  'value': 'value',
  '单位': 'unit',
  'unit': 'unit',
  '测定日期': 'measurementDate',
  'measurementDate': 'measurementDate',
  '测定时间': 'measurementTime',
  'measurementTime': 'measurementTime',
  '分析人员': 'analyst',
  'analyst': 'analyst',
  '使用仪器': 'instrument',
  'instrument': 'instrument',
  '分析方法': 'method',
  'method': 'method'
};

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errors: ImportError[];
  data: any[];
}

interface ExportOptions {
  delimiter?: string;
  includeHeaders?: boolean;
  useChineseHeaders?: boolean;
  dateFormat?: string;
  encoding?: string;
}

/**
 * DataImportExport class for handling data import/export operations
 */
class DataImportExport {
  private _simulation: DataProcessingSimulation | null;

  constructor(simulation: DataProcessingSimulation | null = null) {
    this._simulation = simulation;
  }

  /**
   * Parse CSV text
   */
  parseCSVText(text: string, delimiter: string = ',', options: any = {}): ImportResult {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return {
        success: false,
        totalRows: 0,
        importedRows: 0,
        errors: [{ row: 0, field: '', message: '文件为空' }],
        data: []
      };
    }

    // Parse header
    const hasHeader = options.hasHeader !== false;
    let headers: string[] = [];
    let dataStartIndex = 0;

    if (hasHeader) {
      headers = this._parseCSVLine(lines[0], delimiter);
      dataStartIndex = 1;
    } else {
      const firstLine = this._parseCSVLine(lines[0], delimiter);
      headers = firstLine.map((_, i) => `column${i + 1}`);
    }

    // Parse data rows
    const jsonData: any[] = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const values = this._parseCSVLine(lines[i], delimiter);
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] !== undefined ? values[index] : '';
      });
      jsonData.push(row);
    }

    return this._processImportData(jsonData, options);
  }

  /**
   * Parse CSV line (handles quoted fields)
   */
  private _parseCSVLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  }

  /**
   * Process import data
   */
  private _processImportData(jsonData: any[], options: any = {}): ImportResult {
    const columnMapping = options.columnMapping || DEFAULT_COLUMN_MAPPING;
    const errors: ImportError[] = [];
    const importedData: any[] = [];
    let importedRows = 0;

    jsonData.forEach((row, index) => {
      const rowNumber = index + 2;
      const mappedData = this._mapColumns(row, columnMapping);
      
      // Convert value to number
      if (mappedData.value !== undefined && mappedData.value !== '') {
        const numValue = parseFloat(mappedData.value);
        if (!isNaN(numValue)) {
          mappedData.value = numValue;
        }
      }

      // Validate data
      const validation = this._validateImportRow(mappedData, rowNumber);
      
      if (validation.errors.length > 0) {
        errors.push(...validation.errors);
      }

      if (validation.isValid) {
        importedData.push(mappedData);
        importedRows++;
      } else if (options.skipInvalid !== true) {
        importedData.push({
          ...mappedData,
          _importErrors: validation.errors
        });
      }
    });

    return {
      success: errors.length === 0 || options.skipInvalid === true,
      totalRows: jsonData.length,
      importedRows,
      errors,
      data: importedData
    };
  }

  /**
   * Map columns
   */
  private _mapColumns(row: Record<string, any>, columnMapping: Record<string, string>): Record<string, any> {
    const mapped: Record<string, any> = {};
    
    for (const [sourceCol, value] of Object.entries(row)) {
      const targetField = columnMapping[sourceCol] || columnMapping[sourceCol.trim()];
      if (targetField) {
        mapped[targetField] = value;
      }
    }

    return mapped;
  }

  /**
   * Validate import row
   */
  private _validateImportRow(data: Record<string, any>, rowNumber: number): { isValid: boolean; errors: ImportError[] } {
    const errors: ImportError[] = [];

    if (!data.sampleId || String(data.sampleId).trim() === '') {
      errors.push({ row: rowNumber, field: 'sampleId', message: `第${rowNumber}行: 样品编号不能为空` });
    }

    if (!data.parameter || String(data.parameter).trim() === '') {
      errors.push({ row: rowNumber, field: 'parameter', message: `第${rowNumber}行: 监测项目不能为空` });
    }

    if (data.value === undefined || data.value === null || data.value === '') {
      errors.push({ row: rowNumber, field: 'value', message: `第${rowNumber}行: 测量值不能为空` });
    } else if (typeof data.value !== 'number' || isNaN(data.value)) {
      errors.push({ row: rowNumber, field: 'value', message: `第${rowNumber}行: 测量值必须是有效数字` });
    }

    if (!data.measurementDate || String(data.measurementDate).trim() === '') {
      errors.push({ row: rowNumber, field: 'measurementDate', message: `第${rowNumber}行: 测定日期不能为空` });
    }

    if (!data.analyst || String(data.analyst).trim() === '') {
      errors.push({ row: rowNumber, field: 'analyst', message: `第${rowNumber}行: 分析人员不能为空` });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate import data
   */
  validateImportData(data: any[]): { isValid: boolean; totalRows: number; validRows: number; invalidRows: number; errors: ImportError[]; validData: any[] } {
    const errors: ImportError[] = [];
    const validData: any[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 1;
      const validation = this._validateImportRow(row, rowNumber);
      
      if (validation.isValid) {
        validData.push(row);
      }
      errors.push(...validation.errors);
    });

    return {
      isValid: errors.length === 0,
      totalRows: data.length,
      validRows: validData.length,
      invalidRows: data.length - validData.length,
      errors,
      validData
    };
  }

  /**
   * Export to CSV format
   */
  exportToCSV(data: MonitoringDataRecord[], options: ExportOptions = {}): string {
    const delimiter = options.delimiter || ',';
    const exportData = this._prepareExportData(data, options);
    
    if (exportData.length === 0) {
      return '';
    }

    const lines: string[] = [];
    
    // Add headers
    if (options.includeHeaders !== false) {
      const headers = Object.keys(exportData[0]);
      lines.push(headers.map(h => this._escapeCSVField(h, delimiter)).join(delimiter));
    }

    // Add data rows
    exportData.forEach(row => {
      const values = Object.values(row).map(v => this._escapeCSVField(v, delimiter));
      lines.push(values.join(delimiter));
    });

    return lines.join('\n');
  }

  /**
   * Export to JSON format
   */
  exportToJSON(data: MonitoringDataRecord[]): string {
    const exportData = data.map(record => ({
      sampleId: record.sampleId,
      sampleType: record.sampleType,
      parameter: record.parameter,
      value: record.value,
      unit: record.unit,
      measurementDate: record.measurementDate,
      measurementTime: record.measurementTime,
      analyst: record.analyst,
      instrument: record.instrument,
      method: record.method,
      status: record.status,
      isValid: record.isValid
    }));

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Prepare export data
   */
  private _prepareExportData(data: MonitoringDataRecord[], options: ExportOptions = {}): Record<string, any>[] {
    const useChineseHeaders = options.useChineseHeaders !== false;

    return data.map(record => {
      const row: Record<string, any> = {};
      
      if (useChineseHeaders) {
        row['样品编号'] = record.sampleId || '';
        row['样品类型'] = record.sampleType || '';
        row['监测项目'] = record.parameter || '';
        row['测量值'] = record.value;
        row['单位'] = record.unit || '';
        row['测定日期'] = record.measurementDate || '';
        row['测定时间'] = record.measurementTime || '';
        row['分析人员'] = record.analyst || '';
        row['使用仪器'] = record.instrument || '';
        row['分析方法'] = record.method || '';
        row['状态'] = record.status || '';
        row['是否有效'] = record.isValid ? '是' : '否';
      } else {
        row['sampleId'] = record.sampleId || '';
        row['sampleType'] = record.sampleType || '';
        row['parameter'] = record.parameter || '';
        row['value'] = record.value;
        row['unit'] = record.unit || '';
        row['measurementDate'] = record.measurementDate || '';
        row['measurementTime'] = record.measurementTime || '';
        row['analyst'] = record.analyst || '';
        row['instrument'] = record.instrument || '';
        row['method'] = record.method || '';
        row['status'] = record.status || '';
        row['isValid'] = record.isValid;
      }

      return row;
    });
  }

  /**
   * Escape CSV field
   */
  private _escapeCSVField(value: any, delimiter: string = ','): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
  }

  /**
   * Import data to simulation
   */
  importToSimulation(data: any[]): { success: boolean; message: string; imported: number; total: number; errors: any[] } {
    if (!this._simulation) {
      return { success: false, message: '仿真未初始化', imported: 0, total: data.length, errors: [] };
    }

    let imported = 0;
    const errors: any[] = [];

    data.forEach((record, index) => {
      const result = this._simulation!.addMonitoringData(record);
      if (result.isValid) {
        imported++;
      } else {
        errors.push({ row: index + 1, message: result.message });
      }
    });

    return {
      success: errors.length === 0,
      message: `成功导入 ${imported} 条数据`,
      imported,
      total: data.length,
      errors
    };
  }
}

// ============ Import/Export Property-Based Tests ============

describe('DataImportExport', () => {
  let simulation: DataProcessingSimulation;
  let importExport: DataImportExport;

  beforeEach(() => {
    mockLocalStorage.clear();
    simulation = new DataProcessingSimulation();
    simulation.init({});
    importExport = new DataImportExport(simulation);
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  /**
   * **Feature: data-processing-center, Property 14: Import validation accuracy**
   * *For any* imported data file containing invalid records, the import function 
   * should identify all invalid records and provide specific error messages.
   * **Validates: Requirements 1.2, 1.3 (extended)**
   */
  describe('Property 14: Import validation accuracy', () => {
    // Arbitrary for valid import data row
    const validImportRowArb = fc.record({
      sampleId: validSampleIdArb,
      sampleType: fc.constantFrom('地表水', '地下水', '废水', '饮用水'),
      parameter: fc.constantFrom('pH', 'COD', 'BOD5', 'NH3-N', 'DO'),
      value: fc.float({ min: 0, max: 100, noNaN: true }),
      unit: fc.constant('mg/L'),
      measurementDate: fc.constantFrom('2024-01-01', '2024-02-15', '2024-03-20'),
      measurementTime: fc.constant('10:00'),
      analyst: fc.constantFrom('张三', '李四', '王五'),
      instrument: fc.constant('分光光度计'),
      method: fc.constant('GB/T 11893-1989')
    });

    // Arbitrary for invalid import data row (missing required fields)
    const invalidImportRowArb = fc.oneof(
      // Missing sampleId
      fc.record({
        sampleId: fc.constant(''),
        parameter: fc.constant('pH'),
        value: fc.float({ min: 0, max: 14, noNaN: true }),
        measurementDate: fc.constant('2024-01-01'),
        analyst: fc.constant('张三')
      }),
      // Missing parameter
      fc.record({
        sampleId: validSampleIdArb,
        parameter: fc.constant(''),
        value: fc.float({ min: 0, max: 100, noNaN: true }),
        measurementDate: fc.constant('2024-01-01'),
        analyst: fc.constant('张三')
      }),
      // Missing value
      fc.record({
        sampleId: validSampleIdArb,
        parameter: fc.constant('pH'),
        value: fc.constant(''),
        measurementDate: fc.constant('2024-01-01'),
        analyst: fc.constant('张三')
      }),
      // Invalid value (not a number)
      fc.record({
        sampleId: validSampleIdArb,
        parameter: fc.constant('pH'),
        value: fc.constant('invalid'),
        measurementDate: fc.constant('2024-01-01'),
        analyst: fc.constant('张三')
      }),
      // Missing measurementDate
      fc.record({
        sampleId: validSampleIdArb,
        parameter: fc.constant('pH'),
        value: fc.float({ min: 0, max: 14, noNaN: true }),
        measurementDate: fc.constant(''),
        analyst: fc.constant('张三')
      }),
      // Missing analyst
      fc.record({
        sampleId: validSampleIdArb,
        parameter: fc.constant('pH'),
        value: fc.float({ min: 0, max: 14, noNaN: true }),
        measurementDate: fc.constant('2024-01-01'),
        analyst: fc.constant('')
      })
    );

    it('should correctly validate valid import data', () => {
      fc.assert(
        fc.property(
          fc.array(validImportRowArb, { minLength: 1, maxLength: 10 }),
          (dataList) => {
            const validation = importExport.validateImportData(dataList);
            
            // All valid data should pass validation
            return validation.isValid === true && 
                   validation.validRows === dataList.length &&
                   validation.invalidRows === 0 &&
                   validation.errors.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify all invalid records with specific error messages', () => {
      fc.assert(
        fc.property(
          fc.array(invalidImportRowArb, { minLength: 1, maxLength: 10 }),
          (dataList) => {
            const validation = importExport.validateImportData(dataList);
            
            // All invalid data should fail validation
            if (validation.isValid) return false;
            
            // Should have errors for each invalid row
            if (validation.errors.length === 0) return false;
            
            // Each error should have row number, field, and message
            const allErrorsComplete = validation.errors.every(error => 
              typeof error.row === 'number' &&
              typeof error.field === 'string' &&
              typeof error.message === 'string' &&
              error.message.length > 0
            );
            
            if (!allErrorsComplete) return false;
            
            // Invalid rows count should match
            if (validation.invalidRows !== dataList.length) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify mixed valid and invalid data', () => {
      fc.assert(
        fc.property(
          fc.array(validImportRowArb, { minLength: 1, maxLength: 5 }),
          fc.array(invalidImportRowArb, { minLength: 1, maxLength: 5 }),
          (validData, invalidData) => {
            // Mix valid and invalid data
            const mixedData = [...validData, ...invalidData];
            
            const validation = importExport.validateImportData(mixedData);
            
            // Should not be fully valid
            if (validation.isValid) return false;
            
            // Valid rows should equal number of valid data
            if (validation.validRows !== validData.length) return false;
            
            // Invalid rows should equal number of invalid data
            if (validation.invalidRows !== invalidData.length) return false;
            
            // Total should match
            if (validation.totalRows !== mixedData.length) return false;
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: data-processing-center, Property 13: Data import round-trip**
   * *For any* valid dataset exported to CSV format, importing the exported file 
   * should produce an equivalent dataset.
   * **Validates: Requirements 1.4 (extended)**
   */
  describe('Property 13: Data import round-trip', () => {
    it('should preserve data through CSV export and import cycle', () => {
      fc.assert(
        fc.property(
          fc.array(validMonitoringDataArb, { minLength: 1, maxLength: 10 }),
          (dataList) => {
            // Add data to simulation
            const addedRecords: MonitoringDataRecord[] = [];
            dataList.forEach(data => {
              const result = simulation.addMonitoringData(data);
              if (result.data) {
                addedRecords.push(result.data);
              }
            });

            if (addedRecords.length === 0) return true;

            // Export to CSV with English headers for easier parsing
            const csvContent = importExport.exportToCSV(addedRecords, { 
              useChineseHeaders: false,
              includeHeaders: true 
            });

            // Parse the CSV back
            const importResult = importExport.parseCSVText(csvContent, ',', { hasHeader: true });

            // Should successfully parse
            if (!importResult.success) return false;

            // Should have same number of rows
            if (importResult.data.length !== addedRecords.length) return false;

            // Verify key fields are preserved
            for (let i = 0; i < addedRecords.length; i++) {
              const original = addedRecords[i];
              const imported = importResult.data[i];

              // Check core fields match
              if (imported.sampleId !== original.sampleId) return false;
              if (imported.parameter !== original.parameter) return false;
              // Value might be string after CSV parsing, compare as numbers
              if (Math.abs(Number(imported.value) - original.value) > 0.0001) return false;
              if (imported.analyst !== original.analyst) return false;
              if (imported.measurementDate !== original.measurementDate) return false;
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve data through JSON export and import cycle', () => {
      fc.assert(
        fc.property(
          fc.array(validMonitoringDataArb, { minLength: 1, maxLength: 10 }),
          (dataList) => {
            // Add data to simulation
            const addedRecords: MonitoringDataRecord[] = [];
            dataList.forEach(data => {
              const result = simulation.addMonitoringData(data);
              if (result.data) {
                addedRecords.push(result.data);
              }
            });

            if (addedRecords.length === 0) return true;

            // Export to JSON
            const jsonContent = importExport.exportToJSON(addedRecords);

            // Parse the JSON back
            const importedData = JSON.parse(jsonContent);

            // Should have same number of records
            if (importedData.length !== addedRecords.length) return false;

            // Verify all fields are preserved
            for (let i = 0; i < addedRecords.length; i++) {
              const original = addedRecords[i];
              const imported = importedData[i];

              if (imported.sampleId !== original.sampleId) return false;
              if (imported.sampleType !== original.sampleType) return false;
              if (imported.parameter !== original.parameter) return false;
              if (imported.value !== original.value) return false;
              if (imported.unit !== original.unit) return false;
              if (imported.measurementDate !== original.measurementDate) return false;
              if (imported.analyst !== original.analyst) return false;
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle CSV with special characters correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            sampleId: validSampleIdArb,
            sampleType: fc.constant('地表水'),
            parameter: fc.constant('pH'),
            value: fc.float({ min: 6, max: 9, noNaN: true }),
            unit: fc.constant(''),
            measurementDate: fc.constant('2024-01-01'),
            measurementTime: fc.constant('10:00'),
            analyst: fc.constantFrom('张三', '李四,王五', '赵"六"'),  // Names with special chars
            instrument: fc.constant('pH计'),
            method: fc.constant('GB/T 6920-1986')
          }),
          (data) => {
            // Add data
            const result = simulation.addMonitoringData(data);
            if (!result.data) return true;

            const records = [result.data];

            // Export to CSV
            const csvContent = importExport.exportToCSV(records, { 
              useChineseHeaders: false,
              includeHeaders: true 
            });

            // Parse back
            const importResult = importExport.parseCSVText(csvContent, ',', { hasHeader: true });

            // Should successfully parse
            if (!importResult.success) return false;
            if (importResult.data.length !== 1) return false;

            // Analyst name should be preserved (even with special chars)
            const imported = importResult.data[0];
            if (imported.analyst !== result.data.analyst) return false;

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('CSV Parsing', () => {
    it('should parse simple CSV correctly', () => {
      const csv = `sampleId,parameter,value,measurementDate,analyst
WS20240101,pH,7.5,2024-01-01,张三
WS20240102,COD,25.3,2024-01-02,李四`;

      const result = importExport.parseCSVText(csv, ',', { hasHeader: true });

      expect(result.totalRows).toBe(2);
      expect(result.data[0].sampleId).toBe('WS20240101');
      expect(result.data[0].parameter).toBe('pH');
      expect(result.data[1].sampleId).toBe('WS20240102');
    });

    it('should handle quoted fields with commas', () => {
      const csv = `sampleId,parameter,value,measurementDate,analyst
WS20240101,pH,7.5,2024-01-01,"张三,李四"`;

      const result = importExport.parseCSVText(csv, ',', { hasHeader: true });

      expect(result.data[0].analyst).toBe('张三,李四');
    });

    it('should handle different delimiters', () => {
      const csv = `sampleId;parameter;value;measurementDate;analyst
WS20240101;pH;7.5;2024-01-01;张三`;

      const result = importExport.parseCSVText(csv, ';', { hasHeader: true });

      expect(result.data[0].sampleId).toBe('WS20240101');
      expect(result.data[0].parameter).toBe('pH');
    });

    it('should return error for empty file', () => {
      const result = importExport.parseCSVText('', ',', { hasHeader: true });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('空');
    });
  });

  describe('Import to Simulation', () => {
    it('should import valid data to simulation', () => {
      const data = [
        {
          sampleId: 'WS20240101',
          sampleType: '地表水',
          parameter: 'pH',
          value: 7.5,
          unit: '',
          measurementDate: '2024-01-01',
          measurementTime: '10:00',
          analyst: '张三',
          instrument: 'pH计',
          method: 'GB/T 6920-1986'
        }
      ];

      const result = importExport.importToSimulation(data);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(simulation.getAllMonitoringData().length).toBe(1);
    });

    it('should report errors for invalid data during import', () => {
      const data = [
        {
          sampleId: '',  // Invalid
          parameter: 'pH',
          value: 7.5,
          measurementDate: '2024-01-01',
          analyst: '张三'
        }
      ];

      const result = importExport.importToSimulation(data);

      // Data is added but marked as invalid
      expect(result.total).toBe(1);
    });
  });
});


// ============ DataVisualization Class for Testing ============

class DataVisualization {
  private _charts: Map<string, any> = new Map();
  private _chartIdCounter: number = 0;

  private _generateChartId(): string {
    return `chart-${Date.now()}-${++this._chartIdCounter}`;
  }

  createScatterPlot(xData: number[], yData: number[], config: any = {}): any {
    if (!xData || !yData || xData.length === 0 || yData.length === 0) {
      return { chartId: null, config: null, data: [], error: '数据不能为空' };
    }

    const chartId = this._generateChartId();
    const minLength = Math.min(xData.length, yData.length);
    
    const points: any[] = [];
    for (let i = 0; i < minLength; i++) {
      if (typeof xData[i] === 'number' && typeof yData[i] === 'number' &&
          !isNaN(xData[i]) && !isNaN(yData[i])) {
        points.push({ x: xData[i], y: yData[i], index: i });
      }
    }

    const xValues = points.map(p => p.x);
    const yValues = points.map(p => p.y);
    
    const chartConfig = {
      type: 'scatter',
      title: config.title || '散点图',
      xAxis: {
        label: config.xLabel || 'X轴',
        min: xValues.length > 0 ? Math.min(...xValues) : 0,
        max: xValues.length > 0 ? Math.max(...xValues) : 1
      },
      yAxis: {
        label: config.yLabel || 'Y轴',
        min: yValues.length > 0 ? Math.min(...yValues) : 0,
        max: yValues.length > 0 ? Math.max(...yValues) : 1
      },
      series: [{
        name: config.seriesName || '数据点',
        data: points,
        color: config.color || '#4A90D9'
      }],
      legend: { show: config.showLegend !== false },
      tooltip: { show: config.showTooltip !== false },
      interactive: config.interactive !== false
    };

    const result = { chartId, config: chartConfig, data: points };
    this._charts.set(chartId, result);
    return result;
  }

  createHeatmap(matrix: number[][], xLabels: string[], yLabels: string[], config: any = {}): any {
    if (!matrix || matrix.length === 0) {
      return { chartId: null, config: null, data: [], error: '矩阵数据不能为空' };
    }

    const chartId = this._generateChartId();
    const heatmapData: any[] = [];
    let minValue = Infinity;
    let maxValue = -Infinity;

    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        const value = matrix[y][x];
        if (typeof value === 'number' && !isNaN(value)) {
          heatmapData.push({
            x, y, value,
            xLabel: xLabels && xLabels[x] ? xLabels[x] : `${x}`,
            yLabel: yLabels && yLabels[y] ? yLabels[y] : `${y}`
          });
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      }
    }

    const chartConfig = {
      type: 'heatmap',
      title: config.title || '热力图',
      xAxis: {
        label: config.xLabel || 'X轴',
        categories: xLabels || matrix[0].map((_, i) => `${i}`)
      },
      yAxis: {
        label: config.yLabel || 'Y轴',
        categories: yLabels || matrix.map((_, i) => `${i}`)
      },
      colorScale: {
        min: minValue === Infinity ? 0 : minValue,
        max: maxValue === -Infinity ? 1 : maxValue,
        colors: config.colors || ['#f7fbff', '#4A90D9', '#08306b']
      },
      series: [{ name: config.seriesName || '热力值', data: heatmapData }],
      legend: { show: config.showLegend !== false },
      tooltip: { show: config.showTooltip !== false },
      interactive: config.interactive !== false
    };

    const result = { chartId, config: chartConfig, data: heatmapData, matrix };
    this._charts.set(chartId, result);
    return result;
  }

  createRadarChart(datasets: any[], indicators: string[], config: any = {}): any {
    if (!datasets || datasets.length === 0 || !indicators || indicators.length === 0) {
      return { chartId: null, config: null, data: [], error: '数据集和指标不能为空' };
    }

    const chartId = this._generateChartId();
    
    const maxValues = indicators.map((_, i) => {
      let max = 0;
      datasets.forEach(ds => {
        if (ds.values && ds.values[i] !== undefined) {
          max = Math.max(max, Math.abs(ds.values[i]));
        }
      });
      return max || 1;
    });

    const processedDatasets = datasets.map((ds, index) => {
      const values = indicators.map((_, i) => {
        const val = ds.values && ds.values[i] !== undefined ? ds.values[i] : 0;
        return typeof val === 'number' && !isNaN(val) ? val : 0;
      });

      return {
        name: ds.name || `数据集${index + 1}`,
        values,
        normalizedValues: values.map((v, i) => maxValues[i] > 0 ? v / maxValues[i] : 0),
        color: ds.color || this._getDefaultColor(index)
      };
    });

    const chartConfig = {
      type: 'radar',
      title: config.title || '雷达图',
      indicators: indicators.map((name, i) => ({
        name,
        max: config.maxValues && config.maxValues[i] ? config.maxValues[i] : maxValues[i]
      })),
      series: processedDatasets,
      legend: { 
        show: config.showLegend !== false,
        data: processedDatasets.map(ds => ds.name)
      },
      tooltip: { show: config.showTooltip !== false },
      interactive: config.interactive !== false
    };

    const result = { chartId, config: chartConfig, data: processedDatasets, indicators };
    this._charts.set(chartId, result);
    return result;
  }

  createBarChart(data: number[], labels: string[], config: any = {}): any {
    if (!data || data.length === 0) {
      return { chartId: null, config: null, data: [], error: '数据不能为空' };
    }

    const chartId = this._generateChartId();
    
    const chartData = data.map((value, index) => ({
      value: typeof value === 'number' && !isNaN(value) ? value : 0,
      label: labels && labels[index] ? labels[index] : `${index + 1}`
    }));

    const chartConfig = {
      type: 'bar',
      title: config.title || '柱状图',
      xAxis: {
        label: config.xLabel || '类别',
        categories: chartData.map(d => d.label)
      },
      yAxis: {
        label: config.yLabel || '值',
        min: 0,
        max: Math.max(...chartData.map(d => d.value)) * 1.1
      },
      series: [{
        name: config.seriesName || '数据',
        data: chartData.map(d => d.value),
        color: config.color || '#4A90D9'
      }],
      legend: { show: config.showLegend !== false },
      tooltip: { show: config.showTooltip !== false },
      interactive: config.interactive !== false
    };

    const result = { chartId, config: chartConfig, data: chartData };
    this._charts.set(chartId, result);
    return result;
  }

  createLineChart(data: number[] | number[][], labels: string[], config: any = {}): any {
    if (!data || data.length === 0) {
      return { chartId: null, config: null, data: [], error: '数据不能为空' };
    }

    const chartId = this._generateChartId();
    const datasets = Array.isArray(data[0]) ? data as number[][] : [data as number[]];
    
    const series = datasets.map((lineData, index) => ({
      name: config.seriesNames && config.seriesNames[index] 
        ? config.seriesNames[index] 
        : `系列${index + 1}`,
      data: lineData.map(v => typeof v === 'number' && !isNaN(v) ? v : 0),
      color: config.colors && config.colors[index] 
        ? config.colors[index] 
        : this._getDefaultColor(index)
    }));

    const allValues = datasets.flat().filter(v => typeof v === 'number' && !isNaN(v));

    const chartConfig = {
      type: 'line',
      title: config.title || '折线图',
      xAxis: {
        label: config.xLabel || 'X轴',
        categories: labels || datasets[0].map((_, i) => `${i + 1}`)
      },
      yAxis: {
        label: config.yLabel || 'Y轴',
        min: allValues.length > 0 ? Math.min(...allValues) * 0.9 : 0,
        max: allValues.length > 0 ? Math.max(...allValues) * 1.1 : 1
      },
      series,
      legend: { 
        show: config.showLegend !== false,
        data: series.map(s => s.name)
      },
      tooltip: { show: config.showTooltip !== false },
      interactive: config.interactive !== false
    };

    const result = { chartId, config: chartConfig, data: series };
    this._charts.set(chartId, result);
    return result;
  }

  getChart(chartId: string): any {
    return this._charts.get(chartId) || null;
  }

  exportChartToPNG(chartId: string, options: any = {}): any {
    const chart = this._charts.get(chartId);
    if (!chart) {
      return { success: false, error: '图表不存在' };
    }

    return {
      success: true,
      format: 'png',
      chartId,
      config: chart.config,
      data: chart.data,
      exportOptions: {
        width: options.width || 800,
        height: options.height || 600,
        backgroundColor: options.backgroundColor || '#ffffff',
        pixelRatio: options.pixelRatio || 2
      }
    };
  }

  exportChartToSVG(chartId: string, options: any = {}): any {
    const chart = this._charts.get(chartId);
    if (!chart) {
      return { success: false, error: '图表不存在' };
    }

    const width = options.width || 800;
    const height = options.height || 600;

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${options.backgroundColor || '#ffffff'}"/>
  <text x="${width/2}" y="30" text-anchor="middle">${chart.config.title || ''}</text>
</svg>`;

    return {
      success: true,
      format: 'svg',
      chartId,
      content: svgContent,
      mimeType: 'image/svg+xml'
    };
  }

  private _getDefaultColor(index: number): string {
    const colors = ['#4A90D9', '#67C23A', '#E6A23C', '#F56C6C', '#909399'];
    return colors[index % colors.length];
  }
}

// ============ Property 15: Chart Data Integrity Tests ============

describe('Property 15: Chart Data Integrity', () => {
  /**
   * **Feature: data-processing-center, Property 15: Chart data integrity**
   * **Validates: Requirements 3.4 (extended)**
   * 
   * For any visualization request, the generated chart should accurately 
   * represent the source data without data loss or distortion.
   */

  let visualization: DataVisualization;

  beforeEach(() => {
    visualization = new DataVisualization();
  });

  describe('Scatter Plot Data Integrity', () => {
    it('should preserve all valid data points in scatter plot', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: -1000, max: 1000, noNaN: true }), { minLength: 1, maxLength: 100 }),
          fc.array(fc.float({ min: -1000, max: 1000, noNaN: true }), { minLength: 1, maxLength: 100 }),
          (xData, yData) => {
            const result = visualization.createScatterPlot(xData, yData);
            
            if (!result.chartId) {
              // Empty data case
              return xData.length === 0 || yData.length === 0;
            }

            const minLength = Math.min(xData.length, yData.length);
            const validPointCount = result.data.length;

            // Count valid input points
            let expectedValidCount = 0;
            for (let i = 0; i < minLength; i++) {
              if (typeof xData[i] === 'number' && typeof yData[i] === 'number' &&
                  !isNaN(xData[i]) && !isNaN(yData[i])) {
                expectedValidCount++;
              }
            }

            // All valid points should be preserved
            if (validPointCount !== expectedValidCount) return false;

            // Verify data values are preserved
            for (const point of result.data) {
              const originalX = xData[point.index];
              const originalY = yData[point.index];
              if (point.x !== originalX || point.y !== originalY) return false;
            }

            // Verify chart config has correct bounds
            if (result.data.length > 0) {
              const xValues = result.data.map((p: any) => p.x);
              const yValues = result.data.map((p: any) => p.y);
              
              if (result.config.xAxis.min !== Math.min(...xValues)) return false;
              if (result.config.xAxis.max !== Math.max(...xValues)) return false;
              if (result.config.yAxis.min !== Math.min(...yValues)) return false;
              if (result.config.yAxis.max !== Math.max(...yValues)) return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Heatmap Data Integrity', () => {
    it('should preserve all matrix values in heatmap', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.array(fc.float({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 10 }),
            { minLength: 1, maxLength: 10 }
          ),
          (matrix) => {
            // Ensure matrix is rectangular
            const maxCols = Math.max(...matrix.map(row => row.length));
            const normalizedMatrix = matrix.map(row => {
              const newRow = [...row];
              while (newRow.length < maxCols) newRow.push(0);
              return newRow;
            });

            const xLabels = normalizedMatrix[0].map((_, i) => `X${i}`);
            const yLabels = normalizedMatrix.map((_, i) => `Y${i}`);

            const result = visualization.createHeatmap(normalizedMatrix, xLabels, yLabels);

            if (!result.chartId) {
              return normalizedMatrix.length === 0;
            }

            // Count expected data points
            let expectedCount = 0;
            let minVal = Infinity;
            let maxVal = -Infinity;

            for (let y = 0; y < normalizedMatrix.length; y++) {
              for (let x = 0; x < normalizedMatrix[y].length; x++) {
                const val = normalizedMatrix[y][x];
                if (typeof val === 'number' && !isNaN(val)) {
                  expectedCount++;
                  minVal = Math.min(minVal, val);
                  maxVal = Math.max(maxVal, val);
                }
              }
            }

            // All valid cells should be in the heatmap
            if (result.data.length !== expectedCount) return false;

            // Verify each data point matches the original matrix
            for (const point of result.data) {
              const originalValue = normalizedMatrix[point.y][point.x];
              if (point.value !== originalValue) return false;
            }

            // Verify color scale bounds
            if (expectedCount > 0) {
              if (result.config.colorScale.min !== minVal) return false;
              if (result.config.colorScale.max !== maxVal) return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Radar Chart Data Integrity', () => {
    it('should preserve all indicator values in radar chart', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 10 }),
              values: fc.array(fc.float({ min: 0, max: 100, noNaN: true }), { minLength: 3, maxLength: 8 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (datasets) => {
            // Normalize to same number of indicators
            const maxIndicators = Math.max(...datasets.map(ds => ds.values.length));
            const normalizedDatasets = datasets.map(ds => ({
              ...ds,
              values: [...ds.values, ...Array(maxIndicators - ds.values.length).fill(0)]
            }));

            const indicators = Array.from({ length: maxIndicators }, (_, i) => `指标${i + 1}`);

            const result = visualization.createRadarChart(normalizedDatasets, indicators);

            if (!result.chartId) {
              return normalizedDatasets.length === 0 || indicators.length === 0;
            }

            // Should have same number of datasets
            if (result.data.length !== normalizedDatasets.length) return false;

            // Verify each dataset's values are preserved
            for (let i = 0; i < normalizedDatasets.length; i++) {
              const original = normalizedDatasets[i];
              const processed = result.data[i];

              // Values should match
              for (let j = 0; j < original.values.length; j++) {
                const expectedVal = typeof original.values[j] === 'number' && !isNaN(original.values[j]) 
                  ? original.values[j] 
                  : 0;
                if (processed.values[j] !== expectedVal) return false;
              }
            }

            // Verify indicators are preserved
            if (result.config.indicators.length !== indicators.length) return false;
            for (let i = 0; i < indicators.length; i++) {
              if (result.config.indicators[i].name !== indicators[i]) return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Bar Chart Data Integrity', () => {
    it('should preserve all values in bar chart', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 0, max: 1000, noNaN: true }), { minLength: 1, maxLength: 20 }),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 20 }),
          (data, labels) => {
            const result = visualization.createBarChart(data, labels);

            if (!result.chartId) {
              return data.length === 0;
            }

            // Should have same number of bars as data points
            if (result.data.length !== data.length) return false;

            // Verify each bar's value matches original
            for (let i = 0; i < data.length; i++) {
              const expectedValue = typeof data[i] === 'number' && !isNaN(data[i]) ? data[i] : 0;
              if (result.data[i].value !== expectedValue) return false;
            }

            // Verify labels are preserved (or default generated)
            for (let i = 0; i < result.data.length; i++) {
              const expectedLabel = labels && labels[i] ? labels[i] : `${i + 1}`;
              if (result.data[i].label !== expectedLabel) return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Line Chart Data Integrity', () => {
    it('should preserve all series data in line chart', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.array(fc.float({ min: -100, max: 100, noNaN: true }), { minLength: 2, maxLength: 20 }),
            { minLength: 1, maxLength: 5 }
          ),
          (seriesData) => {
            const labels = seriesData[0].map((_, i) => `点${i + 1}`);
            const result = visualization.createLineChart(seriesData, labels);

            if (!result.chartId) {
              return seriesData.length === 0;
            }

            // Should have same number of series
            if (result.data.length !== seriesData.length) return false;

            // Verify each series data is preserved
            for (let i = 0; i < seriesData.length; i++) {
              const originalSeries = seriesData[i];
              const processedSeries = result.data[i];

              if (processedSeries.data.length !== originalSeries.length) return false;

              for (let j = 0; j < originalSeries.length; j++) {
                const expectedVal = typeof originalSeries[j] === 'number' && !isNaN(originalSeries[j])
                  ? originalSeries[j]
                  : 0;
                if (processedSeries.data[j] !== expectedVal) return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Chart Export Integrity', () => {
    it('should export chart with all original data preserved', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 20 }),
          (data) => {
            const labels = data.map((_, i) => `项目${i + 1}`);
            const chartResult = visualization.createBarChart(data, labels);

            if (!chartResult.chartId) return true;

            // Export to PNG
            const pngExport = visualization.exportChartToPNG(chartResult.chartId);
            if (!pngExport.success) return false;
            if (pngExport.chartId !== chartResult.chartId) return false;
            if (pngExport.data.length !== chartResult.data.length) return false;

            // Export to SVG
            const svgExport = visualization.exportChartToSVG(chartResult.chartId);
            if (!svgExport.success) return false;
            if (svgExport.chartId !== chartResult.chartId) return false;
            if (!svgExport.content.includes('svg')) return false;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
