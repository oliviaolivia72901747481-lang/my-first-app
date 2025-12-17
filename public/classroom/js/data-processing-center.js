/**
 * 数据处理中心虚拟工位模块
 * Data Processing Center Virtual Workstation Module
 * 
 * 根据 HJ 630-2011《环境监测质量管理技术导则》
 * 提供完整的环境监测数据处理实训体验
 */

// ================= 处理阶段枚举 =================

/**
 * 数据处理阶段类型
 * @typedef {'data_entry'|'data_review'|'statistics'|'quality_control'|'report'|'complete'} ProcessingPhase
 */
const ProcessingPhase = {
    DATA_ENTRY: 'data_entry',           // 数据录入
    DATA_REVIEW: 'data_review',         // 数据审核
    STATISTICS: 'statistics',           // 统计分析
    QUALITY_CONTROL: 'quality_control', // 质量控制
    REPORT: 'report',                   // 报告生成
    COMPLETE: 'complete'                // 完成
};

/**
 * 处理阶段顺序
 */
const PROCESSING_PHASE_ORDER = [
    ProcessingPhase.DATA_ENTRY,
    ProcessingPhase.DATA_REVIEW,
    ProcessingPhase.STATISTICS,
    ProcessingPhase.QUALITY_CONTROL,
    ProcessingPhase.REPORT,
    ProcessingPhase.COMPLETE
];

/**
 * 处理阶段中文名称
 */
const ProcessingPhaseNames = {
    [ProcessingPhase.DATA_ENTRY]: '数据录入',
    [ProcessingPhase.DATA_REVIEW]: '数据审核',
    [ProcessingPhase.STATISTICS]: '统计分析',
    [ProcessingPhase.QUALITY_CONTROL]: '质量控制',
    [ProcessingPhase.REPORT]: '报告生成',
    [ProcessingPhase.COMPLETE]: '完成'
};

// ================= 数据状态枚举 =================

const DataStatus = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};


// ================= 数据模型接口 =================

/**
 * 监测数据记录接口
 * @typedef {Object} MonitoringDataRecord
 * @property {string} id - 数据ID
 * @property {string} sampleId - 样品编号
 * @property {string} sampleType - 样品类型
 * @property {string} parameter - 监测项目
 * @property {number} value - 测量值
 * @property {string} unit - 单位
 * @property {string} measurementDate - 测定日期
 * @property {string} measurementTime - 测定时间
 * @property {string} analyst - 分析人员
 * @property {string} instrument - 使用仪器
 * @property {string} method - 分析方法
 * @property {string} status - 状态
 * @property {boolean} isValid - 是否有效
 * @property {string} [validationMessage] - 验证消息
 * @property {number} createdAt - 创建时间
 */

/**
 * 审核数据记录接口
 * @typedef {Object} ReviewedDataRecord
 * @property {string} dataId - 数据ID
 * @property {string} reviewerId - 审核人ID
 * @property {number} reviewDate - 审核日期
 * @property {number} originalValue - 原始值
 * @property {boolean} isAnomaly - 是否异常
 * @property {string} [anomalyType] - 异常类型
 * @property {string} decision - 处理决定
 * @property {number} [modifiedValue] - 修改后的值
 * @property {string} reason - 处理理由
 * @property {{min: number, max: number}} referenceRange - 参考范围
 */

/**
 * 质控数据记录接口
 * @typedef {Object} QCDataRecord
 * @property {string} id - 质控ID
 * @property {string} type - 质控类型
 * @property {string} parameter - 监测项目
 * @property {number[]} values - 测量值数组
 * @property {number} [spikeAmount] - 加标量
 * @property {number} [expectedValue] - 期望值
 * @property {number} [detectionLimit] - 检出限
 * @property {number} timestamp - 时间戳
 */

/**
 * 统计结果接口
 * @typedef {Object} StatisticsResult
 * @property {string} method - 统计方法
 * @property {number} dataCount - 数据数量
 * @property {number} mean - 均值
 * @property {number} standardDeviation - 标准差
 * @property {number} coefficientOfVariation - 变异系数
 * @property {number} min - 最小值
 * @property {number} max - 最大值
 * @property {number} median - 中位数
 * @property {Object} percentiles - 百分位数
 * @property {Object} chartData - 图表数据
 */

/**
 * 质控结果接口
 * @typedef {Object} QCResult
 * @property {string} type - 质控类型
 * @property {boolean} passed - 是否通过
 * @property {number} value - 计算值
 * @property {number} threshold - 阈值
 * @property {string} message - 结果消息
 * @property {string[]} [suggestions] - 建议
 */

/**
 * 操作错误接口
 * @typedef {Object} OperationError
 * @property {string} id - 错误ID
 * @property {string} phase - 阶段
 * @property {string} description - 描述
 * @property {number} deduction - 扣分
 * @property {string} standardReference - 标准引用
 * @property {number} timestamp - 时间戳
 */

/**
 * 数据处理状态接口
 * @typedef {Object} DataProcessingState
 * @property {ProcessingPhase} phase - 当前阶段
 * @property {MonitoringDataRecord[]} monitoringData - 监测数据
 * @property {ReviewedDataRecord[]} reviewedData - 审核数据
 * @property {StatisticsResult[]} statisticsResults - 统计结果
 * @property {QCResult[]} qcResults - 质控结果
 * @property {Object|null} reportData - 报告数据
 * @property {OperationError[]} errors - 操作错误
 * @property {number} startTime - 开始时间
 * @property {number} elapsedTime - 已用时间
 */

// ================= 默认配置 =================

const DATA_PROCESSING_STORAGE_KEY = 'data_processing_center_state';

/**
 * 监测项目参考范围配置
 */
const PARAMETER_REFERENCE_RANGES = {
    'pH': { min: 6.0, max: 9.0, unit: '' },
    'COD': { min: 0, max: 40, unit: 'mg/L' },
    'BOD5': { min: 0, max: 10, unit: 'mg/L' },
    'NH3-N': { min: 0, max: 2.0, unit: 'mg/L' },
    'TP': { min: 0, max: 0.4, unit: 'mg/L' },
    'TN': { min: 0, max: 2.0, unit: 'mg/L' },
    'DO': { min: 2, max: 15, unit: 'mg/L' },
    'SS': { min: 0, max: 150, unit: 'mg/L' },
    '水温': { min: 0, max: 40, unit: '°C' },
    '电导率': { min: 0, max: 2000, unit: 'μS/cm' },
    '浊度': { min: 0, max: 100, unit: 'NTU' },
    '总硬度': { min: 0, max: 450, unit: 'mg/L' },
    '氯化物': { min: 0, max: 250, unit: 'mg/L' },
    '硫酸盐': { min: 0, max: 250, unit: 'mg/L' },
    '铁': { min: 0, max: 0.3, unit: 'mg/L' },
    '锰': { min: 0, max: 0.1, unit: 'mg/L' },
    '铜': { min: 0, max: 1.0, unit: 'mg/L' },
    '锌': { min: 0, max: 1.0, unit: 'mg/L' },
    '铅': { min: 0, max: 0.05, unit: 'mg/L' },
    '镉': { min: 0, max: 0.005, unit: 'mg/L' },
    '汞': { min: 0, max: 0.001, unit: 'mg/L' },
    '砷': { min: 0, max: 0.05, unit: 'mg/L' },
    '六价铬': { min: 0, max: 0.05, unit: 'mg/L' }
};

/**
 * 质控阈值配置
 */
const QC_THRESHOLDS = {
    blank: { maxValue: 0.5 },  // 空白值不超过检出限的0.5倍
    parallel: { maxDeviation: 20 },  // 平行样相对偏差不超过20%
    spike_recovery: { minRecovery: 80, maxRecovery: 120 }  // 加标回收率80%-120%
};

/**
 * 创建初始数据处理状态
 * @returns {DataProcessingState}
 */
function createInitialProcessingState() {
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


// ================= DataProcessingSimulation 类 =================

/**
 * 数据处理中心仿真管理器
 */
class DataProcessingSimulation {
    constructor(config = null) {
        /** @type {DataProcessingState} */
        this._state = null;
        /** @type {Object} */
        this._config = config;
        /** @type {Function[]} */
        this._listeners = [];
        /** @type {Object[]} */
        this._operationHistory = [];
        /** @type {Object[]} */
        this._dataVersions = [];
    }

    /**
     * 初始化仿真
     * @param {Object} config - 配置
     */
    init(config = {}) {
        this._config = config;
        this._state = createInitialProcessingState();
        this._operationHistory = [];
        this._dataVersions = [];
        this._saveState();
        this._notifyListeners();
    }

    /**
     * 获取当前状态
     * @returns {DataProcessingState}
     */
    getState() {
        if (!this._state) {
            this._loadState();
        }
        return this._state ? { ...this._state } : null;
    }

    /**
     * 获取当前阶段
     * @returns {ProcessingPhase}
     */
    getPhase() {
        return this._state?.phase || ProcessingPhase.DATA_ENTRY;
    }

    /**
     * 设置阶段
     * @param {ProcessingPhase} phase - 目标阶段
     * @returns {Object} 验证结果
     */
    setPhase(phase) {
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

        return { isValid: true, message: `已进入${ProcessingPhaseNames[phase]}阶段` };
    }

    /**
     * 验证阶段转换
     * @private
     */
    _validatePhaseTransition(currentPhase, targetPhase) {
        const currentIndex = PROCESSING_PHASE_ORDER.indexOf(currentPhase);
        const targetIndex = PROCESSING_PHASE_ORDER.indexOf(targetPhase);

        if (targetIndex === -1) {
            return { isValid: false, message: '无效的目标阶段' };
        }

        if (targetIndex <= currentIndex + 1) {
            return { isValid: true };
        }

        return { 
            isValid: false, 
            message: `不能从${ProcessingPhaseNames[currentPhase]}直接跳转到${ProcessingPhaseNames[targetPhase]}` 
        };
    }

    /**
     * 前进到下一阶段
     * @returns {Object}
     */
    nextPhase() {
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

    /**
     * 回退到上一阶段
     * @returns {Object}
     */
    previousPhase() {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        const currentIndex = PROCESSING_PHASE_ORDER.indexOf(this._state.phase);
        if (currentIndex <= 0) {
            return { isValid: false, message: '已经是第一阶段' };
        }

        const prevPhase = PROCESSING_PHASE_ORDER[currentIndex - 1];
        return this.setPhase(prevPhase);
    }

    // ================= 数据录入功能 =================

    /**
     * 生成唯一数据编号
     * @returns {string}
     */
    generateDataId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `DATA-${timestamp}-${random}`.toUpperCase();
    }

    /**
     * 添加监测数据
     * @param {Partial<MonitoringDataRecord>} data - 数据记录
     * @returns {Object} 验证结果
     */
    addMonitoringData(data) {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        // 验证数据
        const validation = this.validateDataRecord(data);
        
        const record = {
            ...data,
            id: data.id || this.generateDataId(),
            status: DataStatus.PENDING,
            isValid: validation.isValid,
            validationMessage: validation.message,
            createdAt: Date.now()
        };

        this._state.monitoringData.push(record);
        
        // 记录操作历史
        this._recordOperation('create', 'data', record.id, null, record, '添加监测数据');

        // 如果数据无效，记录错误
        if (!validation.isValid) {
            this._addError('data_entry', validation.message, 2, 'HJ 630-2011');
        }

        this._saveState();
        this._notifyListeners();

        return { isValid: validation.isValid, message: validation.message, data: record };
    }

    /**
     * 更新监测数据
     * @param {string} dataId - 数据ID
     * @param {Partial<MonitoringDataRecord>} updates - 更新内容
     * @returns {Object}
     */
    updateMonitoringData(dataId, updates) {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        const index = this._state.monitoringData.findIndex(d => d.id === dataId);
        if (index === -1) {
            return { isValid: false, message: '数据不存在' };
        }

        const previousValue = { ...this._state.monitoringData[index] };
        
        // 创建版本
        this._createVersion(dataId, '更新数据');

        // 更新数据
        this._state.monitoringData[index] = {
            ...this._state.monitoringData[index],
            ...updates
        };

        // 重新验证
        const validation = this.validateDataRecord(this._state.monitoringData[index]);
        this._state.monitoringData[index].isValid = validation.isValid;
        this._state.monitoringData[index].validationMessage = validation.message;

        // 记录操作历史
        this._recordOperation('update', 'data', dataId, previousValue, this._state.monitoringData[index], '更新监测数据');

        this._saveState();
        this._notifyListeners();

        return { isValid: true, message: '数据已更新', data: this._state.monitoringData[index] };
    }

    /**
     * 删除监测数据
     * @param {string} dataId - 数据ID
     * @returns {boolean}
     */
    deleteMonitoringData(dataId) {
        if (!this._state) return false;

        const index = this._state.monitoringData.findIndex(d => d.id === dataId);
        if (index === -1) return false;

        const deletedData = this._state.monitoringData[index];
        this._state.monitoringData.splice(index, 1);

        // 记录操作历史
        this._recordOperation('delete', 'data', dataId, deletedData, null, '删除监测数据');

        this._saveState();
        this._notifyListeners();
        return true;
    }

    /**
     * 获取监测数据
     * @param {string} dataId - 数据ID
     * @returns {MonitoringDataRecord|null}
     */
    getMonitoringData(dataId) {
        if (!this._state) return null;
        return this._state.monitoringData.find(d => d.id === dataId) || null;
    }

    /**
     * 获取所有监测数据
     * @returns {MonitoringDataRecord[]}
     */
    getAllMonitoringData() {
        if (!this._state) return [];
        return [...this._state.monitoringData];
    }

    /**
     * 筛选监测数据
     * @param {Object} filters - 筛选条件
     * @returns {MonitoringDataRecord[]}
     */
    filterMonitoringData(filters = {}) {
        if (!this._state) return [];

        return this._state.monitoringData.filter(data => {
            for (const [key, value] of Object.entries(filters)) {
                if (value === undefined || value === null || value === '') continue;
                
                if (key === 'parameter' && data.parameter !== value) return false;
                if (key === 'status' && data.status !== value) return false;
                if (key === 'sampleType' && data.sampleType !== value) return false;
                if (key === 'isValid' && data.isValid !== value) return false;
                if (key === 'dateFrom' && new Date(data.measurementDate) < new Date(value)) return false;
                if (key === 'dateTo' && new Date(data.measurementDate) > new Date(value)) return false;
                if (key === 'valueMin' && data.value < value) return false;
                if (key === 'valueMax' && data.value > value) return false;
            }
            return true;
        });
    }

    /**
     * 排序监测数据
     * @param {string} field - 排序字段
     * @param {string} order - 排序顺序 'asc' | 'desc'
     * @returns {MonitoringDataRecord[]}
     */
    sortMonitoringData(field, order = 'asc') {
        if (!this._state) return [];

        const data = [...this._state.monitoringData];
        data.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }


    // ================= 数据验证功能 =================

    /**
     * 验证数据记录
     * @param {Partial<MonitoringDataRecord>} data - 数据记录
     * @returns {Object} 验证结果
     */
    validateDataRecord(data) {
        const errors = [];
        const warnings = [];

        // 必填字段验证
        if (!data.sampleId || data.sampleId.trim() === '') {
            errors.push('样品编号不能为空');
        } else if (!/^[A-Z]{2}\d{6,10}$/.test(data.sampleId)) {
            warnings.push('样品编号格式建议为：2位大写字母+6-10位数字');
        }

        if (!data.parameter || data.parameter.trim() === '') {
            errors.push('监测项目不能为空');
        }

        if (data.value === undefined || data.value === null || data.value === '') {
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

        // 范围验证
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

    /**
     * 验证数据格式
     * @param {any} value - 值
     * @param {string} format - 格式类型
     * @returns {Object}
     */
    validateFormat(value, format) {
        const formats = {
            'number': { test: (v) => typeof v === 'number' && !isNaN(v), message: '必须是有效数字' },
            'positive_number': { test: (v) => typeof v === 'number' && !isNaN(v) && v >= 0, message: '必须是非负数' },
            'date': { test: (v) => !isNaN(Date.parse(v)), message: '必须是有效日期' },
            'sample_id': { test: (v) => /^[A-Z]{2}\d{6,10}$/.test(v), message: '格式应为2位大写字母+6-10位数字' },
            'non_empty': { test: (v) => v !== undefined && v !== null && v !== '', message: '不能为空' }
        };

        const formatConfig = formats[format];
        if (!formatConfig) {
            return { isValid: true, message: '未知格式类型' };
        }

        const isValid = formatConfig.test(value);
        return { isValid, message: isValid ? '格式正确' : formatConfig.message };
    }

    /**
     * 验证数据范围
     * @param {number} value - 值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {Object}
     */
    validateRange(value, min, max) {
        if (typeof value !== 'number' || isNaN(value)) {
            return { isValid: false, message: '值必须是有效数字' };
        }

        const isValid = value >= min && value <= max;
        return { 
            isValid, 
            message: isValid ? '范围正确' : `值(${value})超出范围(${min}-${max})`,
            referenceRange: { min, max }
        };
    }

    // ================= 数据审核功能 =================

    /**
     * 检测异常值
     * @param {MonitoringDataRecord[]} data - 数据列表
     * @param {string} method - 检测方法 'range' | 'iqr' | 'zscore'
     * @returns {Object[]} 异常检测结果
     */
    detectAnomalies(data = null, method = 'range') {
        const dataList = data || this._state?.monitoringData || [];
        if (dataList.length === 0) return [];

        const results = [];

        dataList.forEach(record => {
            const anomalyResult = {
                dataId: record.id,
                isAnomaly: false,
                anomalyType: null,
                confidence: 0,
                explanation: '',
                referenceRange: null
            };

            // 基于范围的检测
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

            // 基于IQR的检测
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

            // 基于Z-score的检测
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

    /**
     * 更新数据审核决策
     * @param {string} dataId - 数据ID
     * @param {Object} review - 审核决策
     * @returns {Object}
     */
    updateDataReview(dataId, review) {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        const dataIndex = this._state.monitoringData.findIndex(d => d.id === dataId);
        if (dataIndex === -1) {
            return { isValid: false, message: '数据不存在' };
        }

        const data = this._state.monitoringData[dataIndex];
        
        // 创建审核记录
        const reviewRecord = {
            dataId,
            reviewerId: review.reviewerId || 'user',
            reviewDate: Date.now(),
            originalValue: data.value,
            isAnomaly: review.isAnomaly || false,
            anomalyType: review.anomalyType,
            decision: review.decision, // 'accept' | 'reject' | 'modify'
            modifiedValue: review.modifiedValue,
            reason: review.reason || '',
            referenceRange: review.referenceRange || PARAMETER_REFERENCE_RANGES[data.parameter] || { min: 0, max: 100 }
        };

        // 更新数据状态
        if (review.decision === 'accept') {
            this._state.monitoringData[dataIndex].status = DataStatus.APPROVED;
        } else if (review.decision === 'reject') {
            this._state.monitoringData[dataIndex].status = DataStatus.REJECTED;
        } else if (review.decision === 'modify' && review.modifiedValue !== undefined) {
            this._state.monitoringData[dataIndex].value = review.modifiedValue;
            this._state.monitoringData[dataIndex].status = DataStatus.REVIEWED;
        }

        // 添加到审核记录
        const existingIndex = this._state.reviewedData.findIndex(r => r.dataId === dataId);
        if (existingIndex >= 0) {
            this._state.reviewedData[existingIndex] = reviewRecord;
        } else {
            this._state.reviewedData.push(reviewRecord);
        }

        // 记录操作历史
        this._recordOperation('review', 'data', dataId, null, reviewRecord, `审核数据: ${review.decision}`);

        this._saveState();
        this._notifyListeners();

        return { isValid: true, message: '审核决策已记录', review: reviewRecord };
    }

    /**
     * 获取审核记录
     * @param {string} dataId - 数据ID
     * @returns {ReviewedDataRecord|null}
     */
    getReviewRecord(dataId) {
        if (!this._state) return null;
        return this._state.reviewedData.find(r => r.dataId === dataId) || null;
    }


    // ================= 统计分析功能 =================

    /**
     * 计算均值
     * @param {number[]} values - 数值数组
     * @returns {number}
     */
    calculateMean(values) {
        if (!values || values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * 计算标准差
     * @param {number[]} values - 数值数组
     * @returns {number}
     */
    calculateStandardDeviation(values) {
        if (!values || values.length < 2) return 0;
        const mean = this.calculateMean(values);
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
    }

    /**
     * 计算变异系数
     * @param {number[]} values - 数值数组
     * @returns {number}
     */
    calculateCV(values) {
        const mean = this.calculateMean(values);
        if (mean === 0) return 0;
        const std = this.calculateStandardDeviation(values);
        return (std / mean) * 100;
    }

    /**
     * 计算百分位数
     * @param {number[]} values - 数值数组
     * @param {number} percentile - 百分位 (0-100)
     * @returns {number}
     */
    _calculatePercentile(values, percentile) {
        if (!values || values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return sorted[lower];
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
    }

    /**
     * 计算中位数
     * @param {number[]} values - 数值数组
     * @returns {number}
     */
    calculateMedian(values) {
        return this._calculatePercentile(values, 50);
    }

    /**
     * 执行统计分析
     * @param {string[]} dataIds - 数据ID列表
     * @param {string} method - 统计方法
     * @returns {StatisticsResult}
     */
    calculateStatistics(dataIds = null, method = 'descriptive') {
        if (!this._state) return null;

        // 获取数据
        let data;
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
                chartData: { labels: [], values: [] }
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
            chartData: this._generateChartData(data, 'bar')
        };

        // 保存统计结果
        this._state.statisticsResults.push(result);
        this._saveState();
        this._notifyListeners();

        return result;
    }

    /**
     * 生成图表数据
     * @param {MonitoringDataRecord[]} data - 数据
     * @param {string} chartType - 图表类型
     * @returns {Object}
     */
    _generateChartData(data, chartType) {
        const chartData = {
            type: chartType,
            labels: [],
            datasets: []
        };

        if (chartType === 'bar' || chartType === 'line') {
            // 按参数分组
            const grouped = {};
            data.forEach(d => {
                if (!grouped[d.parameter]) {
                    grouped[d.parameter] = [];
                }
                grouped[d.parameter].push(d.value);
            });

            chartData.labels = Object.keys(grouped);
            chartData.datasets = [{
                label: '测量值',
                data: chartData.labels.map(param => this.calculateMean(grouped[param]))
            }];
        } else if (chartType === 'boxplot') {
            const grouped = {};
            data.forEach(d => {
                if (!grouped[d.parameter]) {
                    grouped[d.parameter] = [];
                }
                grouped[d.parameter].push(d.value);
            });

            chartData.labels = Object.keys(grouped);
            chartData.datasets = chartData.labels.map(param => {
                const values = grouped[param].sort((a, b) => a - b);
                return {
                    label: param,
                    min: Math.min(...values),
                    q1: this._calculatePercentile(values, 25),
                    median: this._calculatePercentile(values, 50),
                    q3: this._calculatePercentile(values, 75),
                    max: Math.max(...values)
                };
            });
        }

        return chartData;
    }

    // ================= 质量控制功能 =================

    /**
     * 添加质控数据
     * @param {QCDataRecord} qcData - 质控数据
     * @returns {QCResult}
     */
    addQCData(qcData) {
        if (!this._state) {
            return { type: qcData.type, passed: false, value: 0, threshold: 0, message: '仿真未初始化' };
        }

        const record = {
            ...qcData,
            id: qcData.id || `QC-${Date.now()}`,
            timestamp: Date.now()
        };

        // 计算质控结果
        let result;
        switch (qcData.type) {
            case 'blank':
                result = this.calculateBlankResult(qcData.values[0], qcData.detectionLimit || 0.1);
                break;
            case 'parallel':
                result = this.calculateParallelDeviation(qcData.values[0], qcData.values[1]);
                break;
            case 'spike_recovery':
                result = this.calculateSpikeRecovery(qcData.values[0], qcData.values[1], qcData.spikeAmount);
                break;
            default:
                result = { type: qcData.type, passed: true, value: 0, threshold: 0, message: '未知质控类型' };
        }

        // 保存质控结果
        this._state.qcResults.push(result);

        // 如果质控失败，记录错误
        if (!result.passed) {
            this._addError('quality_control', result.message, 5, 'HJ 630-2011');
        }

        this._saveState();
        this._notifyListeners();

        return result;
    }

    /**
     * 计算空白结果
     * @param {number} blankValue - 空白值
     * @param {number} detectionLimit - 检出限
     * @returns {QCResult}
     */
    calculateBlankResult(blankValue, detectionLimit) {
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
            suggestions: passed ? [] : [
                '检查试剂纯度',
                '检查器皿清洁度',
                '检查实验环境是否有污染源'
            ]
        };
    }

    /**
     * 计算平行样相对偏差
     * @param {number} value1 - 测量值1
     * @param {number} value2 - 测量值2
     * @returns {QCResult}
     */
    calculateParallelDeviation(value1, value2) {
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
            suggestions: passed ? [] : [
                '检查样品均匀性',
                '检查分析操作一致性',
                '考虑增加平行样数量'
            ]
        };
    }

    /**
     * 计算加标回收率
     * @param {number} original - 原始值
     * @param {number} spiked - 加标后测量值
     * @param {number} spikeAmount - 加标量
     * @returns {QCResult}
     */
    calculateSpikeRecovery(original, spiked, spikeAmount) {
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
            suggestions: passed ? [] : [
                recovery < minRecovery ? '检查是否存在基质干扰' : '检查加标量是否准确',
                '检查分析方法是否适用',
                '考虑使用标准加入法'
            ]
        };
    }

    /**
     * 获取所有质控结果
     * @returns {QCResult[]}
     */
    getQCResults() {
        if (!this._state) return [];
        return [...this._state.qcResults];
    }


    // ================= 报告生成功能 =================

    /**
     * 生成报告
     * @param {string} template - 模板类型
     * @returns {Object}
     */
    generateReport(template = 'standard') {
        if (!this._state) {
            return null;
        }

        const report = {
            id: `RPT-${Date.now()}`,
            title: '环境监测数据处理报告',
            template,
            sections: [],
            monitoringData: [...this._state.monitoringData],
            statisticsResults: [...this._state.statisticsResults],
            qcResults: [...this._state.qcResults],
            conclusion: '',
            generatedAt: Date.now()
        };

        // 自动填充报告内容
        report.sections = this._autoFillReportSections(report);
        report.conclusion = this._generateConclusion();

        this._state.reportData = report;
        this._saveState();
        this._notifyListeners();

        return report;
    }

    /**
     * 自动填充报告章节
     * @private
     */
    _autoFillReportSections(report) {
        const sections = [];

        // 1. 概述
        sections.push({
            id: 'overview',
            title: '一、概述',
            content: `本报告包含${report.monitoringData.length}条监测数据记录，` +
                     `涉及${[...new Set(report.monitoringData.map(d => d.parameter))].length}个监测项目。`
        });

        // 2. 数据汇总
        const approvedData = report.monitoringData.filter(d => d.status === DataStatus.APPROVED);
        const rejectedData = report.monitoringData.filter(d => d.status === DataStatus.REJECTED);
        sections.push({
            id: 'data_summary',
            title: '二、数据汇总',
            content: `共录入数据${report.monitoringData.length}条，` +
                     `审核通过${approvedData.length}条，` +
                     `审核拒绝${rejectedData.length}条。`
        });

        // 3. 统计分析结果
        if (report.statisticsResults.length > 0) {
            const latestStats = report.statisticsResults[report.statisticsResults.length - 1];
            sections.push({
                id: 'statistics',
                title: '三、统计分析结果',
                content: `数据统计结果：均值=${latestStats.mean.toFixed(4)}，` +
                         `标准差=${latestStats.standardDeviation.toFixed(4)}，` +
                         `变异系数=${latestStats.coefficientOfVariation.toFixed(2)}%。`
            });
        }

        // 4. 质量控制结果
        if (report.qcResults.length > 0) {
            const passedQC = report.qcResults.filter(r => r.passed).length;
            sections.push({
                id: 'quality_control',
                title: '四、质量控制结果',
                content: `共进行${report.qcResults.length}项质控检查，` +
                         `${passedQC}项合格，${report.qcResults.length - passedQC}项不合格。`
            });
        }

        return sections;
    }

    /**
     * 生成结论
     * @private
     */
    _generateConclusion() {
        if (!this._state) return '';

        const totalData = this._state.monitoringData.length;
        const validData = this._state.monitoringData.filter(d => d.isValid).length;
        const qcPassed = this._state.qcResults.filter(r => r.passed).length;
        const qcTotal = this._state.qcResults.length;

        let conclusion = '根据本次数据处理结果：';
        
        if (validData === totalData && qcPassed === qcTotal) {
            conclusion += '所有数据均通过验证，质量控制全部合格，数据质量良好。';
        } else if (validData / totalData >= 0.9 && qcPassed / qcTotal >= 0.8) {
            conclusion += '大部分数据通过验证，质量控制基本合格，数据质量可接受。';
        } else {
            conclusion += '部分数据存在问题，建议进行复核或重新采样分析。';
        }

        return conclusion;
    }

    /**
     * 获取报告数据
     * @returns {Object|null}
     */
    getReportData() {
        return this._state?.reportData || null;
    }

    /**
     * 预览报告
     * @returns {string}
     */
    previewReport() {
        const report = this._state?.reportData;
        if (!report) return '';

        let preview = `# ${report.title}\n\n`;
        preview += `生成时间: ${new Date(report.generatedAt).toLocaleString()}\n\n`;

        report.sections.forEach(section => {
            preview += `## ${section.title}\n\n${section.content}\n\n`;
        });

        preview += `## 五、结论\n\n${report.conclusion}\n`;

        return preview;
    }

    // ================= 评分系统 =================

    /**
     * 计算综合评分
     * @returns {Object}
     */
    calculateScore() {
        if (!this._state) return null;

        const result = {
            totalScore: 0,
            dimensions: {
                dataEntry: { score: 0, maxScore: 20, details: [] },
                dataReview: { score: 0, maxScore: 20, details: [] },
                statistics: { score: 0, maxScore: 20, details: [] },
                qualityControl: { score: 0, maxScore: 20, details: [] },
                report: { score: 0, maxScore: 20, details: [] }
            },
            errors: [],
            grade: 'fail',
            suggestions: []
        };

        // 数据录入得分
        const totalData = this._state.monitoringData.length;
        const validData = this._state.monitoringData.filter(d => d.isValid).length;
        if (totalData > 0) {
            result.dimensions.dataEntry.score = Math.round((validData / totalData) * 20);
            result.dimensions.dataEntry.details.push(`有效数据: ${validData}/${totalData}`);
        }

        // 数据审核得分
        const reviewedData = this._state.reviewedData.length;
        const pendingData = this._state.monitoringData.filter(d => d.status === DataStatus.PENDING).length;
        if (totalData > 0) {
            const reviewRate = (totalData - pendingData) / totalData;
            result.dimensions.dataReview.score = Math.round(reviewRate * 20);
            result.dimensions.dataReview.details.push(`已审核: ${totalData - pendingData}/${totalData}`);
        }

        // 统计分析得分
        if (this._state.statisticsResults.length > 0) {
            result.dimensions.statistics.score = 20;
            result.dimensions.statistics.details.push(`完成统计分析: ${this._state.statisticsResults.length}次`);
        }

        // 质量控制得分
        const qcTotal = this._state.qcResults.length;
        const qcPassed = this._state.qcResults.filter(r => r.passed).length;
        if (qcTotal > 0) {
            result.dimensions.qualityControl.score = Math.round((qcPassed / qcTotal) * 20);
            result.dimensions.qualityControl.details.push(`质控合格: ${qcPassed}/${qcTotal}`);
        }

        // 报告生成得分
        if (this._state.reportData) {
            result.dimensions.report.score = 20;
            result.dimensions.report.details.push('已生成报告');
        }

        // 计算总分
        result.totalScore = Object.values(result.dimensions).reduce((sum, d) => sum + d.score, 0);

        // 扣分项
        result.errors = this._state.errors.map(e => ({
            step: e.phase,
            description: e.description,
            deduction: e.deduction,
            standardReference: e.standardReference
        }));
        const totalDeduction = result.errors.reduce((sum, e) => sum + e.deduction, 0);
        result.totalScore = Math.max(0, result.totalScore - totalDeduction);

        // 评级
        if (result.totalScore >= 90) result.grade = 'excellent';
        else if (result.totalScore >= 80) result.grade = 'good';
        else if (result.totalScore >= 60) result.grade = 'pass';
        else result.grade = 'fail';

        // 建议
        if (result.dimensions.dataEntry.score < 15) {
            result.suggestions.push('建议加强数据录入规范性，注意数据格式和范围');
        }
        if (result.dimensions.qualityControl.score < 15) {
            result.suggestions.push('建议加强质量控制，确保质控样品分析合格');
        }

        return result;
    }

    // ================= 历史记录功能 =================

    /**
     * 记录操作
     * @private
     */
    _recordOperation(action, targetType, targetId, previousValue, newValue, description) {
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

    /**
     * 获取操作历史
     * @param {Object} filters - 筛选条件
     * @returns {Object[]}
     */
    getOperationHistory(filters = {}) {
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

    /**
     * 创建数据版本
     * @private
     */
    _createVersion(dataId, description) {
        const data = this._state.monitoringData.find(d => d.id === dataId);
        if (!data) return null;

        const existingVersions = this._dataVersions.filter(v => v.dataId === dataId);
        const version = {
            versionId: `VER-${Date.now()}`,
            dataId,
            version: existingVersions.length + 1,
            data: { ...data },
            createdAt: Date.now(),
            createdBy: 'user',
            changeDescription: description
        };

        this._dataVersions.push(version);
        return version;
    }

    /**
     * 获取版本历史
     * @param {string} dataId - 数据ID
     * @returns {Object[]}
     */
    getVersionHistory(dataId) {
        return this._dataVersions.filter(v => v.dataId === dataId).sort((a, b) => b.version - a.version);
    }

    /**
     * 恢复版本
     * @param {string} versionId - 版本ID
     * @returns {Object}
     */
    restoreVersion(versionId) {
        const version = this._dataVersions.find(v => v.versionId === versionId);
        if (!version) {
            return { isValid: false, message: '版本不存在' };
        }

        const dataIndex = this._state.monitoringData.findIndex(d => d.id === version.dataId);
        if (dataIndex === -1) {
            return { isValid: false, message: '原数据不存在' };
        }

        // 创建当前版本备份
        this._createVersion(version.dataId, '恢复前备份');

        // 恢复数据
        this._state.monitoringData[dataIndex] = { ...version.data };

        this._recordOperation('update', 'data', version.dataId, null, version.data, `恢复到版本${version.version}`);

        this._saveState();
        this._notifyListeners();

        return { isValid: true, message: `已恢复到版本${version.version}`, data: version.data };
    }


    // ================= 错误记录 =================

    /**
     * 添加错误记录
     * @private
     */
    _addError(phase, description, deduction, standardReference = '') {
        this._state.errors.push({
            id: `ERR-${Date.now()}`,
            phase,
            description,
            deduction,
            standardReference,
            timestamp: Date.now()
        });
    }

    /**
     * 获取错误列表
     * @returns {OperationError[]}
     */
    getErrors() {
        if (!this._state) return [];
        return [...this._state.errors];
    }

    // ================= 完成和重置 =================

    /**
     * 完成数据处理
     * @returns {Object}
     */
    complete() {
        if (!this._state) {
            return null;
        }

        this._state.phase = ProcessingPhase.COMPLETE;
        this._state.elapsedTime = Date.now() - this._state.startTime;
        this._saveState();
        this._notifyListeners();

        return {
            state: { ...this._state },
            score: this.calculateScore(),
            summary: {
                totalData: this._state.monitoringData.length,
                validData: this._state.monitoringData.filter(d => d.isValid).length,
                reviewedData: this._state.reviewedData.length,
                statisticsCount: this._state.statisticsResults.length,
                qcCount: this._state.qcResults.length,
                qcPassed: this._state.qcResults.filter(r => r.passed).length,
                hasReport: !!this._state.reportData,
                totalErrors: this._state.errors.length,
                elapsedTime: this._state.elapsedTime
            }
        };
    }

    /**
     * 重置仿真
     */
    reset() {
        this._state = createInitialProcessingState();
        this._operationHistory = [];
        this._dataVersions = [];
        this._saveState();
        this._notifyListeners();
    }

    // ================= 状态订阅 =================

    /**
     * 添加状态变化监听器
     * @param {Function} listener - 监听函数
     * @returns {Function} 取消监听函数
     */
    subscribe(listener) {
        this._listeners.push(listener);
        return () => {
            const index = this._listeners.indexOf(listener);
            if (index > -1) {
                this._listeners.splice(index, 1);
            }
        };
    }

    /**
     * 通知所有监听器
     * @private
     */
    _notifyListeners() {
        const state = this.getState();
        this._listeners.forEach(listener => {
            try {
                listener(state);
            } catch (e) {
                console.error('Listener error:', e);
            }
        });
    }

    // ================= 状态持久化 =================

    /**
     * 保存状态到 localStorage
     * @private
     */
    _saveState() {
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

    /**
     * 从 localStorage 加载状态
     * @private
     */
    _loadState() {
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

    /**
     * 清除保存的状态
     */
    clearSavedState() {
        try {
            localStorage.removeItem(DATA_PROCESSING_STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear processing state:', e);
        }
        this._state = null;
        this._operationHistory = [];
        this._dataVersions = [];
    }

    /**
     * 检查是否有保存的状态
     * @returns {boolean}
     */
    hasSavedState() {
        try {
            return localStorage.getItem(DATA_PROCESSING_STORAGE_KEY) !== null;
        } catch (e) {
            return false;
        }
    }

    /**
     * 恢复保存的状态
     * @returns {boolean}
     */
    restoreSavedState() {
        this._loadState();
        if (this._state) {
            this._notifyListeners();
            return true;
        }
        return false;
    }
}

// ================= UI 组件函数 =================

/**
 * 样品类型选项
 */
const SAMPLE_TYPES = ['地表水', '地下水', '废水', '饮用水', '海水', '雨水'];

/**
 * 监测项目选项
 */
const MONITORING_PARAMETERS = Object.keys(PARAMETER_REFERENCE_RANGES);

/**
 * 创建数据录入表单
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {HTMLElement} container - 容器元素
 * @param {Function} onSubmit - 提交回调
 * @returns {HTMLElement}
 */
function createDataEntryForm(simulation, container, onSubmit) {
    const form = document.createElement('div');
    form.className = 'data-entry-form';
    form.innerHTML = `
        <div class="form-header">
            <h3>📝 监测数据录入</h3>
            <p class="form-hint">请按照规范填写监测数据，带 <span class="required">*</span> 为必填项</p>
        </div>
        
        <div class="form-body">
            <div class="form-section">
                <h4>样品信息</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="sampleId">样品编号 <span class="required">*</span></label>
                        <input type="text" id="sampleId" name="sampleId" placeholder="如: WS20240101" />
                        <span class="field-hint">格式: 2位大写字母+6-10位数字</span>
                        <span class="validation-message" id="sampleId-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="sampleType">样品类型 <span class="required">*</span></label>
                        <select id="sampleType" name="sampleType">
                            <option value="">请选择</option>
                            ${SAMPLE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                        <span class="validation-message" id="sampleType-error"></span>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h4>监测项目</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="parameter">监测项目 <span class="required">*</span></label>
                        <select id="parameter" name="parameter">
                            <option value="">请选择</option>
                            ${MONITORING_PARAMETERS.map(p => {
                                const range = PARAMETER_REFERENCE_RANGES[p];
                                return `<option value="${p}">${p} (${range.min}-${range.max}${range.unit})</option>`;
                            }).join('')}
                        </select>
                        <span class="validation-message" id="parameter-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="value">测量值 <span class="required">*</span></label>
                        <input type="number" id="value" name="value" step="0.001" placeholder="输入测量值" />
                        <span class="field-hint" id="value-range-hint">请先选择监测项目</span>
                        <span class="validation-message" id="value-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="unit">单位</label>
                        <input type="text" id="unit" name="unit" readonly placeholder="自动填充" />
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h4>测定信息</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="measurementDate">测定日期 <span class="required">*</span></label>
                        <input type="date" id="measurementDate" name="measurementDate" />
                        <span class="validation-message" id="measurementDate-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="measurementTime">测定时间</label>
                        <input type="time" id="measurementTime" name="measurementTime" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="analyst">分析人员 <span class="required">*</span></label>
                        <input type="text" id="analyst" name="analyst" placeholder="输入分析人员姓名" />
                        <span class="validation-message" id="analyst-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="instrument">使用仪器</label>
                        <input type="text" id="instrument" name="instrument" placeholder="如: 分光光度计" />
                    </div>
                    <div class="form-group">
                        <label for="method">分析方法</label>
                        <input type="text" id="method" name="method" placeholder="如: GB/T 11893-1989" />
                    </div>
                </div>
            </div>
        </div>
        
        <div class="form-footer">
            <button type="button" class="btn btn-secondary" id="resetFormBtn">重置</button>
            <button type="button" class="btn btn-primary" id="submitDataBtn">提交数据</button>
        </div>
    `;

    // 监测项目变化时更新单位和范围提示
    const parameterSelect = form.querySelector('#parameter');
    const unitInput = form.querySelector('#unit');
    const valueRangeHint = form.querySelector('#value-range-hint');
    
    parameterSelect.addEventListener('change', () => {
        const param = parameterSelect.value;
        if (param && PARAMETER_REFERENCE_RANGES[param]) {
            const range = PARAMETER_REFERENCE_RANGES[param];
            unitInput.value = range.unit;
            valueRangeHint.textContent = `参考范围: ${range.min}-${range.max}${range.unit}`;
            valueRangeHint.className = 'field-hint';
        } else {
            unitInput.value = '';
            valueRangeHint.textContent = '请先选择监测项目';
        }
    });

    // 实时验证
    const valueInput = form.querySelector('#value');
    valueInput.addEventListener('input', () => {
        const param = parameterSelect.value;
        const value = parseFloat(valueInput.value);
        const errorSpan = form.querySelector('#value-error');
        
        if (param && PARAMETER_REFERENCE_RANGES[param] && !isNaN(value)) {
            const range = PARAMETER_REFERENCE_RANGES[param];
            if (value < range.min || value > range.max) {
                errorSpan.textContent = `⚠️ 超出参考范围 (${range.min}-${range.max})`;
                errorSpan.className = 'validation-message warning';
            } else {
                errorSpan.textContent = '✓ 在参考范围内';
                errorSpan.className = 'validation-message success';
            }
        } else {
            errorSpan.textContent = '';
            errorSpan.className = 'validation-message';
        }
    });

    // 提交按钮
    const submitBtn = form.querySelector('#submitDataBtn');
    submitBtn.addEventListener('click', () => {
        const formData = getFormData(form);
        
        // 清除之前的错误
        form.querySelectorAll('.validation-message').forEach(el => {
            el.textContent = '';
            el.className = 'validation-message';
        });

        // 验证数据
        const validation = simulation.validateDataRecord(formData);
        
        if (!validation.isValid) {
            // 显示错误
            validation.errors.forEach(error => {
                if (error.includes('样品编号')) {
                    showFieldError(form, 'sampleId', error);
                } else if (error.includes('监测项目')) {
                    showFieldError(form, 'parameter', error);
                } else if (error.includes('测量值')) {
                    showFieldError(form, 'value', error);
                } else if (error.includes('测定日期')) {
                    showFieldError(form, 'measurementDate', error);
                } else if (error.includes('分析人员')) {
                    showFieldError(form, 'analyst', error);
                }
            });
            return;
        }

        // 添加数据
        const result = simulation.addMonitoringData(formData);
        
        if (onSubmit) {
            onSubmit(result);
        }

        // 成功后重置表单
        if (result.isValid || result.data) {
            resetForm(form);
        }
    });

    // 重置按钮
    const resetBtn = form.querySelector('#resetFormBtn');
    resetBtn.addEventListener('click', () => resetForm(form));

    if (container) {
        container.appendChild(form);
    }

    return form;
}

/**
 * 获取表单数据
 * @param {HTMLElement} form - 表单元素
 * @returns {Object}
 */
function getFormData(form) {
    return {
        sampleId: form.querySelector('#sampleId').value.trim(),
        sampleType: form.querySelector('#sampleType').value,
        parameter: form.querySelector('#parameter').value,
        value: parseFloat(form.querySelector('#value').value) || undefined,
        unit: form.querySelector('#unit').value,
        measurementDate: form.querySelector('#measurementDate').value,
        measurementTime: form.querySelector('#measurementTime').value,
        analyst: form.querySelector('#analyst').value.trim(),
        instrument: form.querySelector('#instrument').value.trim(),
        method: form.querySelector('#method').value.trim()
    };
}

/**
 * 显示字段错误
 * @param {HTMLElement} form - 表单元素
 * @param {string} fieldId - 字段ID
 * @param {string} message - 错误消息
 */
function showFieldError(form, fieldId, message) {
    const errorSpan = form.querySelector(`#${fieldId}-error`);
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.className = 'validation-message error';
    }
}

/**
 * 重置表单
 * @param {HTMLElement} form - 表单元素
 */
function resetForm(form) {
    form.querySelectorAll('input').forEach(input => {
        if (input.type !== 'button' && input.type !== 'submit') {
            input.value = '';
        }
    });
    form.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    form.querySelectorAll('.validation-message').forEach(el => {
        el.textContent = '';
        el.className = 'validation-message';
    });
    form.querySelector('#value-range-hint').textContent = '请先选择监测项目';
}

/**
 * 创建数据列表表格
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {HTMLElement} container - 容器元素
 * @param {Object} options - 选项
 * @returns {HTMLElement}
 */
function createDataListTable(simulation, container, options = {}) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'data-list-wrapper';
    
    // 工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'data-list-toolbar';
    toolbar.innerHTML = `
        <div class="toolbar-left">
            <h3>📊 数据列表</h3>
            <span class="data-count">共 <span id="dataCount">0</span> 条数据</span>
        </div>
        <div class="toolbar-right">
            <div class="filter-group">
                <label>监测项目:</label>
                <select id="filterParameter">
                    <option value="">全部</option>
                    ${MONITORING_PARAMETERS.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label>状态:</label>
                <select id="filterStatus">
                    <option value="">全部</option>
                    <option value="pending">待审核</option>
                    <option value="approved">已通过</option>
                    <option value="rejected">已拒绝</option>
                    <option value="reviewed">已修改</option>
                </select>
            </div>
            <button class="btn btn-sm" id="refreshDataBtn">🔄 刷新</button>
        </div>
    `;
    tableWrapper.appendChild(toolbar);

    // 表格
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th data-sort="sampleId">样品编号 ↕</th>
                <th data-sort="parameter">监测项目 ↕</th>
                <th data-sort="value">测量值 ↕</th>
                <th>单位</th>
                <th data-sort="measurementDate">测定日期 ↕</th>
                <th>分析人员</th>
                <th data-sort="status">状态 ↕</th>
                <th>验证</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody id="dataTableBody">
        </tbody>
    `;
    tableWrapper.appendChild(table);

    // 排序功能
    let currentSort = { field: 'createdAt', order: 'desc' };
    table.querySelectorAll('th[data-sort]').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (currentSort.field === field) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = field;
                currentSort.order = 'asc';
            }
            refreshTable();
        });
    });

    // 筛选功能
    const filterParameter = toolbar.querySelector('#filterParameter');
    const filterStatus = toolbar.querySelector('#filterStatus');
    
    filterParameter.addEventListener('change', refreshTable);
    filterStatus.addEventListener('change', refreshTable);

    // 刷新按钮
    toolbar.querySelector('#refreshDataBtn').addEventListener('click', refreshTable);

    // 刷新表格函数
    function refreshTable() {
        const filters = {
            parameter: filterParameter.value || undefined,
            status: filterStatus.value || undefined
        };

        let data = simulation.filterMonitoringData(filters);
        data = simulation.sortMonitoringData(currentSort.field, currentSort.order);
        
        // 应用筛选
        if (filters.parameter) {
            data = data.filter(d => d.parameter === filters.parameter);
        }
        if (filters.status) {
            data = data.filter(d => d.status === filters.status);
        }

        renderTableBody(data);
        tableWrapper.querySelector('#dataCount').textContent = data.length;
    }

    // 渲染表格内容
    function renderTableBody(data) {
        const tbody = table.querySelector('#dataTableBody');
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="9">暂无数据，请先录入监测数据</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(record => `
            <tr data-id="${record.id}" class="${record.status === 'rejected' ? 'rejected-row' : ''}">
                <td>${record.sampleId || '-'}</td>
                <td>${record.parameter || '-'}</td>
                <td class="${isValueOutOfRange(record) ? 'out-of-range' : ''}">${record.value !== undefined ? record.value : '-'}</td>
                <td>${record.unit || '-'}</td>
                <td>${record.measurementDate || '-'}</td>
                <td>${record.analyst || '-'}</td>
                <td><span class="status-badge status-${record.status}">${getStatusText(record.status)}</span></td>
                <td><span class="validation-badge ${record.isValid ? 'valid' : 'invalid'}">${record.isValid ? '✓' : '✗'}</span></td>
                <td>
                    <button class="btn btn-xs btn-view" data-action="view" data-id="${record.id}">查看</button>
                    ${record.status === 'pending' ? `<button class="btn btn-xs btn-delete" data-action="delete" data-id="${record.id}">删除</button>` : ''}
                </td>
            </tr>
        `).join('');

        // 绑定操作按钮事件
        tbody.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const id = e.target.dataset.id;
                
                if (action === 'view' && options.onView) {
                    options.onView(id);
                } else if (action === 'delete') {
                    if (confirm('确定要删除这条数据吗？')) {
                        simulation.deleteMonitoringData(id);
                        refreshTable();
                    }
                }
            });
        });
    }

    // 辅助函数
    function isValueOutOfRange(record) {
        if (!record.parameter || record.value === undefined) return false;
        const range = PARAMETER_REFERENCE_RANGES[record.parameter];
        if (!range) return false;
        return record.value < range.min || record.value > range.max;
    }

    function getStatusText(status) {
        const statusMap = {
            'pending': '待审核',
            'reviewed': '已修改',
            'approved': '已通过',
            'rejected': '已拒绝'
        };
        return statusMap[status] || status;
    }

    if (container) {
        container.appendChild(tableWrapper);
    }

    // 初始加载
    refreshTable();

    // 返回带刷新方法的元素
    tableWrapper.refresh = refreshTable;
    return tableWrapper;
}

/**
 * 创建数据详情面板
 * @param {MonitoringDataRecord} data - 数据记录
 * @returns {HTMLElement}
 */
function createDataDetailPanel(data) {
    const panel = document.createElement('div');
    panel.className = 'data-detail-panel';
    
    const range = PARAMETER_REFERENCE_RANGES[data.parameter];
    const isOutOfRange = range && (data.value < range.min || data.value > range.max);

    panel.innerHTML = `
        <div class="detail-header">
            <h3>数据详情</h3>
            <span class="data-id">${data.id}</span>
        </div>
        <div class="detail-body">
            <div class="detail-section">
                <h4>样品信息</h4>
                <div class="detail-row">
                    <span class="label">样品编号:</span>
                    <span class="value">${data.sampleId}</span>
                </div>
                <div class="detail-row">
                    <span class="label">样品类型:</span>
                    <span class="value">${data.sampleType || '-'}</span>
                </div>
            </div>
            <div class="detail-section">
                <h4>监测数据</h4>
                <div class="detail-row">
                    <span class="label">监测项目:</span>
                    <span class="value">${data.parameter}</span>
                </div>
                <div class="detail-row">
                    <span class="label">测量值:</span>
                    <span class="value ${isOutOfRange ? 'out-of-range' : ''}">${data.value} ${data.unit}</span>
                    ${range ? `<span class="range-info">(参考范围: ${range.min}-${range.max}${range.unit})</span>` : ''}
                </div>
            </div>
            <div class="detail-section">
                <h4>测定信息</h4>
                <div class="detail-row">
                    <span class="label">测定日期:</span>
                    <span class="value">${data.measurementDate} ${data.measurementTime || ''}</span>
                </div>
                <div class="detail-row">
                    <span class="label">分析人员:</span>
                    <span class="value">${data.analyst}</span>
                </div>
                <div class="detail-row">
                    <span class="label">使用仪器:</span>
                    <span class="value">${data.instrument || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">分析方法:</span>
                    <span class="value">${data.method || '-'}</span>
                </div>
            </div>
            <div class="detail-section">
                <h4>状态信息</h4>
                <div class="detail-row">
                    <span class="label">数据状态:</span>
                    <span class="status-badge status-${data.status}">${getStatusTextForDetail(data.status)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">验证结果:</span>
                    <span class="validation-badge ${data.isValid ? 'valid' : 'invalid'}">${data.isValid ? '验证通过' : '验证失败'}</span>
                </div>
                ${data.validationMessage ? `
                <div class="detail-row">
                    <span class="label">验证消息:</span>
                    <span class="value">${data.validationMessage}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="label">创建时间:</span>
                    <span class="value">${new Date(data.createdAt).toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;

    function getStatusTextForDetail(status) {
        const statusMap = {
            'pending': '待审核',
            'reviewed': '已修改',
            'approved': '已通过',
            'rejected': '已拒绝'
        };
        return statusMap[status] || status;
    }

    return panel;
}

/**
 * 创建数据录入界面
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {HTMLElement} container - 容器元素
 * @returns {HTMLElement}
 */
function createDataEntryUI(simulation, container) {
    const ui = document.createElement('div');
    ui.className = 'data-entry-ui';

    // 阶段指示器
    const phaseIndicator = document.createElement('div');
    phaseIndicator.className = 'phase-indicator';
    phaseIndicator.innerHTML = `
        <div class="phase-steps">
            ${PROCESSING_PHASE_ORDER.slice(0, -1).map((phase, index) => `
                <div class="phase-step ${phase === ProcessingPhase.DATA_ENTRY ? 'active' : ''}" data-phase="${phase}">
                    <span class="step-number">${index + 1}</span>
                    <span class="step-name">${ProcessingPhaseNames[phase]}</span>
                </div>
            `).join('')}
        </div>
    `;
    ui.appendChild(phaseIndicator);

    // 主内容区
    const mainContent = document.createElement('div');
    mainContent.className = 'data-entry-main';
    
    // 左侧：录入表单
    const formSection = document.createElement('div');
    formSection.className = 'form-section-container';
    createDataEntryForm(simulation, formSection, (result) => {
        // 刷新数据列表
        if (dataTable && dataTable.refresh) {
            dataTable.refresh();
        }
        // 显示提示
        showNotification(result.isValid ? '数据录入成功' : '数据已保存（存在警告）', result.isValid ? 'success' : 'warning');
    });
    mainContent.appendChild(formSection);

    // 右侧：数据列表
    const listSection = document.createElement('div');
    listSection.className = 'list-section-container';
    const dataTable = createDataListTable(simulation, listSection, {
        onView: (id) => {
            const data = simulation.getMonitoringData(id);
            if (data) {
                showDataDetailModal(data);
            }
        }
    });
    mainContent.appendChild(listSection);

    ui.appendChild(mainContent);

    // 底部操作栏
    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    actionBar.innerHTML = `
        <div class="action-info">
            <span>当前阶段: <strong>${ProcessingPhaseNames[ProcessingPhase.DATA_ENTRY]}</strong></span>
        </div>
        <div class="action-buttons">
            <button class="btn btn-secondary" id="resetAllBtn">重置所有数据</button>
            <button class="btn btn-primary" id="nextPhaseBtn">进入下一阶段 →</button>
        </div>
    `;
    ui.appendChild(actionBar);

    // 重置按钮
    actionBar.querySelector('#resetAllBtn').addEventListener('click', () => {
        if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
            simulation.reset();
            if (dataTable && dataTable.refresh) {
                dataTable.refresh();
            }
            showNotification('数据已重置', 'info');
        }
    });

    // 下一阶段按钮
    actionBar.querySelector('#nextPhaseBtn').addEventListener('click', () => {
        const allData = simulation.getAllMonitoringData();
        if (allData.length === 0) {
            showNotification('请先录入至少一条数据', 'warning');
            return;
        }
        
        const result = simulation.nextPhase();
        if (result.isValid) {
            showNotification(result.message, 'success');
            // 触发阶段变化事件
            ui.dispatchEvent(new CustomEvent('phaseChange', { detail: { phase: simulation.getPhase() } }));
        } else {
            showNotification(result.message, 'error');
        }
    });

    if (container) {
        container.appendChild(ui);
    }

    return ui;
}

/**
 * 显示通知
 * @param {string} message - 消息
 * @param {string} type - 类型 'success' | 'warning' | 'error' | 'info'
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span class="notification-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // 动画显示
    setTimeout(() => notification.classList.add('show'), 10);
    
    // 自动消失
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * 显示数据详情模态框
 * @param {MonitoringDataRecord} data - 数据记录
 */
function showDataDetailModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    
    const detailPanel = createDataDetailPanel(data);
    content.appendChild(detailPanel);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', () => modal.remove());
    content.appendChild(closeBtn);
    
    modal.appendChild(content);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

// ================= 数据审核 UI 组件 =================

/**
 * 创建数据审核界面
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {HTMLElement} container - 容器元素
 * @returns {HTMLElement}
 */
function createDataReviewUI(simulation, container) {
    const ui = document.createElement('div');
    ui.className = 'data-review-ui';

    // 阶段指示器
    const phaseIndicator = createPhaseIndicator(ProcessingPhase.DATA_REVIEW);
    ui.appendChild(phaseIndicator);

    // 主内容区
    const mainContent = document.createElement('div');
    mainContent.className = 'data-review-main';

    // 左侧：待审核数据列表
    const listSection = document.createElement('div');
    listSection.className = 'review-list-section';
    const reviewList = createReviewDataList(simulation, listSection, {
        onSelect: (id) => {
            updateReviewPanel(id);
        }
    });
    mainContent.appendChild(listSection);

    // 右侧：审核工具面板
    const toolSection = document.createElement('div');
    toolSection.className = 'review-tool-section';
    let currentDataId = null;
    
    function updateReviewPanel(dataId) {
        currentDataId = dataId;
        toolSection.innerHTML = '';
        if (dataId) {
            const data = simulation.getMonitoringData(dataId);
            if (data) {
                const reviewPanel = createReviewToolPanel(simulation, data, () => {
                    reviewList.refresh();
                    updateReviewPanel(null);
                    updateProgress();
                });
                toolSection.appendChild(reviewPanel);
            }
        } else {
            toolSection.innerHTML = '<div class="no-selection">请从左侧列表选择要审核的数据</div>';
        }
    }
    updateReviewPanel(null);
    mainContent.appendChild(toolSection);

    ui.appendChild(mainContent);

    // 进度信息
    const progressBar = document.createElement('div');
    progressBar.className = 'review-progress';
    progressBar.innerHTML = `
        <div class="progress-info">
            <span>审核进度: <span id="reviewedCount">0</span> / <span id="totalCount">0</span></span>
            <span class="progress-percent" id="progressPercent">0%</span>
        </div>
        <div class="progress-bar-container">
            <div class="progress-bar" id="progressBar" style="width: 0%"></div>
        </div>
    `;
    ui.appendChild(progressBar);

    function updateProgress() {
        const allData = simulation.getAllMonitoringData();
        const reviewedData = allData.filter(d => d.status !== DataStatus.PENDING);
        const total = allData.length;
        const reviewed = reviewedData.length;
        const percent = total > 0 ? Math.round((reviewed / total) * 100) : 0;

        progressBar.querySelector('#reviewedCount').textContent = reviewed;
        progressBar.querySelector('#totalCount').textContent = total;
        progressBar.querySelector('#progressPercent').textContent = `${percent}%`;
        progressBar.querySelector('#progressBar').style.width = `${percent}%`;
    }
    updateProgress();

    // 底部操作栏
    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    actionBar.innerHTML = `
        <div class="action-info">
            <span>当前阶段: <strong>${ProcessingPhaseNames[ProcessingPhase.DATA_REVIEW]}</strong></span>
        </div>
        <div class="action-buttons">
            <button class="btn btn-secondary" id="prevPhaseBtn">← 返回上一阶段</button>
            <button class="btn btn-primary" id="nextPhaseBtn">进入下一阶段 →</button>
        </div>
    `;
    ui.appendChild(actionBar);

    // 上一阶段按钮
    actionBar.querySelector('#prevPhaseBtn').addEventListener('click', () => {
        const result = simulation.previousPhase();
        if (result.isValid) {
            showNotification(result.message, 'success');
            ui.dispatchEvent(new CustomEvent('phaseChange', { detail: { phase: simulation.getPhase() } }));
        } else {
            showNotification(result.message, 'error');
        }
    });

    // 下一阶段按钮
    actionBar.querySelector('#nextPhaseBtn').addEventListener('click', () => {
        const allData = simulation.getAllMonitoringData();
        const pendingData = allData.filter(d => d.status === DataStatus.PENDING);
        
        if (pendingData.length > 0) {
            showNotification(`还有 ${pendingData.length} 条数据未审核`, 'warning');
            return;
        }
        
        const result = simulation.nextPhase();
        if (result.isValid) {
            showNotification(result.message, 'success');
            ui.dispatchEvent(new CustomEvent('phaseChange', { detail: { phase: simulation.getPhase() } }));
        } else {
            showNotification(result.message, 'error');
        }
    });

    if (container) {
        container.appendChild(ui);
    }

    return ui;
}

/**
 * 创建阶段指示器
 * @param {ProcessingPhase} currentPhase - 当前阶段
 * @returns {HTMLElement}
 */
function createPhaseIndicator(currentPhase) {
    const indicator = document.createElement('div');
    indicator.className = 'phase-indicator';
    
    const phaseIndex = PROCESSING_PHASE_ORDER.indexOf(currentPhase);
    
    indicator.innerHTML = `
        <div class="phase-steps">
            ${PROCESSING_PHASE_ORDER.slice(0, -1).map((phase, index) => `
                <div class="phase-step ${index < phaseIndex ? 'completed' : ''} ${phase === currentPhase ? 'active' : ''}" data-phase="${phase}">
                    <span class="step-number">${index < phaseIndex ? '✓' : index + 1}</span>
                    <span class="step-name">${ProcessingPhaseNames[phase]}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    return indicator;
}

/**
 * 创建待审核数据列表
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {HTMLElement} container - 容器元素
 * @param {Object} options - 选项
 * @returns {HTMLElement}
 */
function createReviewDataList(simulation, container, options = {}) {
    const listWrapper = document.createElement('div');
    listWrapper.className = 'review-data-list';

    // 工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'review-toolbar';
    toolbar.innerHTML = `
        <h3>📋 待审核数据</h3>
        <div class="toolbar-actions">
            <button class="btn btn-sm" id="runAnomalyDetection">🔍 异常检测</button>
            <select id="anomalyMethod">
                <option value="range">范围检测</option>
                <option value="iqr">IQR检测</option>
                <option value="zscore">Z-score检测</option>
                <option value="all">综合检测</option>
            </select>
        </div>
    `;
    listWrapper.appendChild(toolbar);

    // 异常检测结果
    const anomalyResults = document.createElement('div');
    anomalyResults.className = 'anomaly-results';
    anomalyResults.style.display = 'none';
    listWrapper.appendChild(anomalyResults);

    // 数据列表
    const dataList = document.createElement('div');
    dataList.className = 'data-items';
    listWrapper.appendChild(dataList);

    // 异常检测按钮
    toolbar.querySelector('#runAnomalyDetection').addEventListener('click', () => {
        const method = toolbar.querySelector('#anomalyMethod').value;
        const results = simulation.detectAnomalies(null, method);
        const anomalies = results.filter(r => r.isAnomaly);
        
        if (anomalies.length > 0) {
            anomalyResults.style.display = 'block';
            anomalyResults.innerHTML = `
                <div class="anomaly-header">
                    <span class="anomaly-icon">⚠️</span>
                    <span>检测到 ${anomalies.length} 条异常数据</span>
                </div>
                <ul class="anomaly-list">
                    ${anomalies.map(a => `
                        <li class="anomaly-item" data-id="${a.dataId}">
                            <span class="anomaly-type">${a.anomalyType}</span>
                            <span class="anomaly-explanation">${a.explanation}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            // 点击异常项选中对应数据
            anomalyResults.querySelectorAll('.anomaly-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    selectDataItem(id);
                    if (options.onSelect) options.onSelect(id);
                });
            });
        } else {
            anomalyResults.style.display = 'block';
            anomalyResults.innerHTML = `
                <div class="anomaly-header success">
                    <span class="anomaly-icon">✓</span>
                    <span>未检测到异常数据</span>
                </div>
            `;
        }
        
        showNotification(`异常检测完成，发现 ${anomalies.length} 条异常`, anomalies.length > 0 ? 'warning' : 'success');
    });

    // 刷新列表
    function refreshList() {
        const allData = simulation.getAllMonitoringData();
        
        if (allData.length === 0) {
            dataList.innerHTML = '<div class="empty-list">暂无数据</div>';
            return;
        }

        dataList.innerHTML = allData.map(data => {
            const range = PARAMETER_REFERENCE_RANGES[data.parameter];
            const isOutOfRange = range && (data.value < range.min || data.value > range.max);
            
            return `
                <div class="data-item ${data.status !== 'pending' ? 'reviewed' : ''} ${isOutOfRange ? 'anomaly' : ''}" data-id="${data.id}">
                    <div class="item-header">
                        <span class="sample-id">${data.sampleId}</span>
                        <span class="status-badge status-${data.status}">${getStatusLabel(data.status)}</span>
                    </div>
                    <div class="item-body">
                        <span class="parameter">${data.parameter}</span>
                        <span class="value ${isOutOfRange ? 'out-of-range' : ''}">${data.value} ${data.unit}</span>
                    </div>
                    <div class="item-footer">
                        <span class="date">${data.measurementDate}</span>
                        ${isOutOfRange ? '<span class="warning-badge">⚠️ 超范围</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        // 绑定点击事件
        dataList.querySelectorAll('.data-item').forEach(item => {
            item.addEventListener('click', () => {
                selectDataItem(item.dataset.id);
                if (options.onSelect) options.onSelect(item.dataset.id);
            });
        });
    }

    function selectDataItem(id) {
        dataList.querySelectorAll('.data-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.id === id);
        });
    }

    function getStatusLabel(status) {
        const labels = {
            'pending': '待审核',
            'reviewed': '已修改',
            'approved': '已通过',
            'rejected': '已拒绝'
        };
        return labels[status] || status;
    }

    if (container) {
        container.appendChild(listWrapper);
    }

    refreshList();
    listWrapper.refresh = refreshList;
    return listWrapper;
}

/**
 * 创建审核工具面板
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {MonitoringDataRecord} data - 数据记录
 * @param {Function} onComplete - 完成回调
 * @returns {HTMLElement}
 */
function createReviewToolPanel(simulation, data, onComplete) {
    const panel = document.createElement('div');
    panel.className = 'review-tool-panel';

    const range = PARAMETER_REFERENCE_RANGES[data.parameter];
    const isOutOfRange = range && (data.value < range.min || data.value > range.max);

    // 检测异常
    const anomalyResults = simulation.detectAnomalies([data], 'all');
    const anomaly = anomalyResults.find(r => r.dataId === data.id);

    panel.innerHTML = `
        <div class="panel-header">
            <h3>🔍 数据审核</h3>
            <span class="data-id">${data.id}</span>
        </div>
        
        <div class="panel-body">
            <div class="data-summary">
                <div class="summary-row">
                    <span class="label">样品编号:</span>
                    <span class="value">${data.sampleId}</span>
                </div>
                <div class="summary-row">
                    <span class="label">监测项目:</span>
                    <span class="value">${data.parameter}</span>
                </div>
                <div class="summary-row highlight">
                    <span class="label">测量值:</span>
                    <span class="value ${isOutOfRange ? 'out-of-range' : ''}">${data.value} ${data.unit}</span>
                </div>
                ${range ? `
                <div class="summary-row">
                    <span class="label">参考范围:</span>
                    <span class="value">${range.min} - ${range.max} ${range.unit}</span>
                </div>
                ` : ''}
            </div>

            ${anomaly && anomaly.isAnomaly ? `
            <div class="anomaly-alert">
                <div class="alert-header">⚠️ 异常检测结果</div>
                <div class="alert-body">
                    <p><strong>异常类型:</strong> ${anomaly.anomalyType}</p>
                    <p><strong>说明:</strong> ${anomaly.explanation}</p>
                    <p><strong>置信度:</strong> ${(anomaly.confidence * 100).toFixed(0)}%</p>
                </div>
            </div>
            ` : `
            <div class="normal-alert">
                <div class="alert-header">✓ 数据正常</div>
                <div class="alert-body">未检测到异常</div>
            </div>
            `}

            <div class="review-form">
                <h4>审核决策</h4>
                
                <div class="decision-options">
                    <label class="decision-option">
                        <input type="radio" name="decision" value="accept" ${!anomaly?.isAnomaly ? 'checked' : ''}>
                        <span class="option-label">✓ 接受</span>
                        <span class="option-desc">数据正常，通过审核</span>
                    </label>
                    <label class="decision-option">
                        <input type="radio" name="decision" value="modify">
                        <span class="option-label">✎ 修改</span>
                        <span class="option-desc">修正数据值后通过</span>
                    </label>
                    <label class="decision-option">
                        <input type="radio" name="decision" value="reject" ${anomaly?.isAnomaly ? 'checked' : ''}>
                        <span class="option-label">✗ 拒绝</span>
                        <span class="option-desc">数据无效，需重新采样</span>
                    </label>
                </div>

                <div class="modify-value-group" style="display: none;">
                    <label for="modifiedValue">修正值:</label>
                    <input type="number" id="modifiedValue" step="0.001" value="${data.value}" />
                    ${range ? `<span class="hint">参考范围: ${range.min} - ${range.max}</span>` : ''}
                </div>

                <div class="reason-group">
                    <label for="reviewReason">处理理由:</label>
                    <textarea id="reviewReason" rows="3" placeholder="请输入处理理由...">${anomaly?.isAnomaly ? anomaly.explanation : '数据在正常范围内'}</textarea>
                </div>
            </div>
        </div>

        <div class="panel-footer">
            <button class="btn btn-secondary" id="cancelReviewBtn">取消</button>
            <button class="btn btn-primary" id="submitReviewBtn">提交审核</button>
        </div>
    `;

    // 显示/隐藏修改值输入框
    const decisionRadios = panel.querySelectorAll('input[name="decision"]');
    const modifyGroup = panel.querySelector('.modify-value-group');
    
    decisionRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            modifyGroup.style.display = radio.value === 'modify' ? 'block' : 'none';
        });
    });

    // 取消按钮
    panel.querySelector('#cancelReviewBtn').addEventListener('click', () => {
        if (onComplete) onComplete();
    });

    // 提交审核
    panel.querySelector('#submitReviewBtn').addEventListener('click', () => {
        const decision = panel.querySelector('input[name="decision"]:checked').value;
        const reason = panel.querySelector('#reviewReason').value.trim();
        const modifiedValue = parseFloat(panel.querySelector('#modifiedValue').value);

        if (!reason) {
            showNotification('请输入处理理由', 'warning');
            return;
        }

        const reviewData = {
            decision,
            reason,
            isAnomaly: anomaly?.isAnomaly || false,
            anomalyType: anomaly?.anomalyType,
            referenceRange: range || { min: 0, max: 100 }
        };

        if (decision === 'modify') {
            if (isNaN(modifiedValue)) {
                showNotification('请输入有效的修正值', 'warning');
                return;
            }
            reviewData.modifiedValue = modifiedValue;
        }

        const result = simulation.updateDataReview(data.id, reviewData);
        
        if (result.isValid) {
            showNotification('审核决策已保存', 'success');
            if (onComplete) onComplete();
        } else {
            showNotification(result.message, 'error');
        }
    });

    return panel;
}

// ================= 统计分析 UI 组件 =================

/**
 * 创建统计分析界面
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {HTMLElement} container - 容器元素
 * @returns {HTMLElement}
 */
function createStatisticsUI(simulation, container) {
    const ui = document.createElement('div');
    ui.className = 'statistics-ui';

    // 阶段指示器
    const phaseIndicator = createPhaseIndicator(ProcessingPhase.STATISTICS);
    ui.appendChild(phaseIndicator);

    // 主内容区
    const mainContent = document.createElement('div');
    mainContent.className = 'statistics-main';

    // 左侧：数据选择和统计方法
    const controlSection = document.createElement('div');
    controlSection.className = 'statistics-control-section';
    
    // 数据选择
    const dataSelector = createDataSelector(simulation);
    controlSection.appendChild(dataSelector);
    
    // 统计方法选择
    const methodSelector = createStatisticsMethodSelector();
    controlSection.appendChild(methodSelector);
    
    // 执行按钮
    const executeBtn = document.createElement('button');
    executeBtn.className = 'btn btn-primary btn-block';
    executeBtn.textContent = '📊 执行统计分析';
    executeBtn.addEventListener('click', () => {
        const selectedIds = getSelectedDataIds(dataSelector);
        const method = methodSelector.querySelector('#statisticsMethod').value;
        
        if (selectedIds.length === 0) {
            showNotification('请选择要分析的数据', 'warning');
            return;
        }
        
        const result = simulation.calculateStatistics(selectedIds, method);
        if (result) {
            renderStatisticsResult(resultSection, result);
            showNotification('统计分析完成', 'success');
        }
    });
    controlSection.appendChild(executeBtn);
    
    mainContent.appendChild(controlSection);

    // 右侧：统计结果展示
    const resultSection = document.createElement('div');
    resultSection.className = 'statistics-result-section';
    resultSection.innerHTML = '<div class="no-result">请选择数据并执行统计分析</div>';
    mainContent.appendChild(resultSection);

    ui.appendChild(mainContent);

    // 底部操作栏
    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    actionBar.innerHTML = `
        <div class="action-info">
            <span>当前阶段: <strong>${ProcessingPhaseNames[ProcessingPhase.STATISTICS]}</strong></span>
        </div>
        <div class="action-buttons">
            <button class="btn btn-secondary" id="prevPhaseBtn">← 返回上一阶段</button>
            <button class="btn btn-primary" id="nextPhaseBtn">进入下一阶段 →</button>
        </div>
    `;
    ui.appendChild(actionBar);

    // 上一阶段按钮
    actionBar.querySelector('#prevPhaseBtn').addEventListener('click', () => {
        const result = simulation.previousPhase();
        if (result.isValid) {
            showNotification(result.message, 'success');
            ui.dispatchEvent(new CustomEvent('phaseChange', { detail: { phase: simulation.getPhase() } }));
        } else {
            showNotification(result.message, 'error');
        }
    });

    // 下一阶段按钮
    actionBar.querySelector('#nextPhaseBtn').addEventListener('click', () => {
        const state = simulation.getState();
        if (!state || state.statisticsResults.length === 0) {
            showNotification('请先完成至少一次统计分析', 'warning');
            return;
        }
        
        const result = simulation.nextPhase();
        if (result.isValid) {
            showNotification(result.message, 'success');
            ui.dispatchEvent(new CustomEvent('phaseChange', { detail: { phase: simulation.getPhase() } }));
        } else {
            showNotification(result.message, 'error');
        }
    });

    if (container) {
        container.appendChild(ui);
    }

    return ui;
}

/**
 * 创建数据选择器
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @returns {HTMLElement}
 */
function createDataSelector(simulation) {
    const selector = document.createElement('div');
    selector.className = 'data-selector';
    
    const allData = simulation.getAllMonitoringData().filter(d => d.status !== DataStatus.REJECTED);
    const parameters = [...new Set(allData.map(d => d.parameter))];
    
    selector.innerHTML = `
        <h4>📋 选择分析数据</h4>
        <div class="selector-controls">
            <div class="filter-row">
                <label>按监测项目筛选:</label>
                <select id="parameterFilter">
                    <option value="">全部项目</option>
                    ${parameters.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
            </div>
            <div class="select-actions">
                <button class="btn btn-sm" id="selectAllBtn">全选</button>
                <button class="btn btn-sm" id="deselectAllBtn">取消全选</button>
            </div>
        </div>
        <div class="data-checkbox-list" id="dataCheckboxList">
            ${allData.map(d => `
                <label class="data-checkbox-item" data-parameter="${d.parameter}">
                    <input type="checkbox" value="${d.id}" checked>
                    <span class="item-info">
                        <span class="sample-id">${d.sampleId}</span>
                        <span class="parameter">${d.parameter}</span>
                        <span class="value">${d.value} ${d.unit}</span>
                    </span>
                </label>
            `).join('')}
        </div>
        <div class="selection-summary">
            已选择 <span id="selectedCount">${allData.length}</span> / ${allData.length} 条数据
        </div>
    `;

    // 筛选功能
    const parameterFilter = selector.querySelector('#parameterFilter');
    const checkboxList = selector.querySelector('#dataCheckboxList');
    
    parameterFilter.addEventListener('change', () => {
        const filterValue = parameterFilter.value;
        checkboxList.querySelectorAll('.data-checkbox-item').forEach(item => {
            if (!filterValue || item.dataset.parameter === filterValue) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // 全选/取消全选
    selector.querySelector('#selectAllBtn').addEventListener('click', () => {
        checkboxList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (cb.closest('.data-checkbox-item').style.display !== 'none') {
                cb.checked = true;
            }
        });
        updateSelectedCount();
    });

    selector.querySelector('#deselectAllBtn').addEventListener('click', () => {
        checkboxList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        updateSelectedCount();
    });

    // 更新选中计数
    function updateSelectedCount() {
        const count = checkboxList.querySelectorAll('input[type="checkbox"]:checked').length;
        selector.querySelector('#selectedCount').textContent = count;
    }

    checkboxList.addEventListener('change', updateSelectedCount);

    return selector;
}

/**
 * 获取选中的数据ID
 * @param {HTMLElement} selector - 选择器元素
 * @returns {string[]}
 */
function getSelectedDataIds(selector) {
    const checkboxes = selector.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * 创建统计方法选择器
 * @returns {HTMLElement}
 */
function createStatisticsMethodSelector() {
    const selector = document.createElement('div');
    selector.className = 'method-selector';
    
    selector.innerHTML = `
        <h4>📐 统计方法</h4>
        <div class="method-options">
            <select id="statisticsMethod">
                <option value="descriptive">描述性统计</option>
                <option value="distribution">分布分析</option>
                <option value="comparison">对比分析</option>
            </select>
        </div>
        <div class="method-description">
            <p id="methodDesc">计算均值、标准差、变异系数、中位数、百分位数等基本统计量</p>
        </div>
    `;

    const methodSelect = selector.querySelector('#statisticsMethod');
    const methodDesc = selector.querySelector('#methodDesc');
    
    const descriptions = {
        'descriptive': '计算均值、标准差、变异系数、中位数、百分位数等基本统计量',
        'distribution': '分析数据分布特征，包括偏度、峰度等',
        'comparison': '对比不同监测项目或时间段的数据差异'
    };

    methodSelect.addEventListener('change', () => {
        methodDesc.textContent = descriptions[methodSelect.value];
    });

    return selector;
}

/**
 * 渲染统计结果
 * @param {HTMLElement} container - 容器元素
 * @param {StatisticsResult} result - 统计结果
 */
function renderStatisticsResult(container, result) {
    container.innerHTML = `
        <div class="statistics-result">
            <div class="result-header">
                <h3>📊 统计分析结果</h3>
                <span class="result-meta">数据量: ${result.dataCount} 条</span>
            </div>
            
            <div class="result-body">
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-label">均值 (Mean)</span>
                        <span class="stat-value">${result.mean.toFixed(4)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">标准差 (Std Dev)</span>
                        <span class="stat-value">${result.standardDeviation.toFixed(4)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">变异系数 (CV)</span>
                        <span class="stat-value">${result.coefficientOfVariation.toFixed(2)}%</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">中位数 (Median)</span>
                        <span class="stat-value">${result.median.toFixed(4)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">最小值 (Min)</span>
                        <span class="stat-value">${result.min.toFixed(4)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">最大值 (Max)</span>
                        <span class="stat-value">${result.max.toFixed(4)}</span>
                    </div>
                </div>
                
                <div class="percentiles-section">
                    <h4>百分位数</h4>
                    <div class="percentiles-grid">
                        <div class="percentile-item">
                            <span class="label">P25</span>
                            <span class="value">${result.percentiles.p25.toFixed(4)}</span>
                        </div>
                        <div class="percentile-item">
                            <span class="label">P75</span>
                            <span class="value">${result.percentiles.p75.toFixed(4)}</span>
                        </div>
                        <div class="percentile-item">
                            <span class="label">P90</span>
                            <span class="value">${result.percentiles.p90.toFixed(4)}</span>
                        </div>
                        <div class="percentile-item">
                            <span class="label">P95</span>
                            <span class="value">${result.percentiles.p95.toFixed(4)}</span>
                        </div>
                    </div>
                </div>
                
                ${result.chartData ? `
                <div class="chart-section">
                    <h4>数据可视化</h4>
                    <div class="chart-placeholder" id="statisticsChart">
                        ${renderSimpleBarChart(result.chartData)}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * 渲染简单柱状图
 * @param {Object} chartData - 图表数据
 * @returns {string}
 */
function renderSimpleBarChart(chartData) {
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
        return '<div class="no-chart">暂无图表数据</div>';
    }

    const maxValue = Math.max(...(chartData.datasets[0]?.data || [1]));
    
    return `
        <div class="simple-bar-chart">
            ${chartData.labels.map((label, i) => {
                const value = chartData.datasets[0]?.data[i] || 0;
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                return `
                    <div class="bar-item">
                        <div class="bar-container">
                            <div class="bar" style="height: ${height}%"></div>
                        </div>
                        <span class="bar-label">${label}</span>
                        <span class="bar-value">${value.toFixed(2)}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ================= 质量控制 UI 组件 =================

/**
 * 创建质量控制界面
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {HTMLElement} container - 容器元素
 * @returns {HTMLElement}
 */
function createQualityControlUI(simulation, container) {
    const ui = document.createElement('div');
    ui.className = 'quality-control-ui';

    // 阶段指示器
    const phaseIndicator = createPhaseIndicator(ProcessingPhase.QUALITY_CONTROL);
    ui.appendChild(phaseIndicator);

    // 主内容区
    const mainContent = document.createElement('div');
    mainContent.className = 'qc-main';

    // 左侧：质控项目列表和录入
    const inputSection = document.createElement('div');
    inputSection.className = 'qc-input-section';
    
    // 质控类型选择
    const qcTypeSelector = createQCTypeSelector();
    inputSection.appendChild(qcTypeSelector);
    
    // 质控数据录入表单
    const qcForm = createQCDataForm(simulation, () => {
        refreshQCResults();
    });
    inputSection.appendChild(qcForm);
    
    mainContent.appendChild(inputSection);

    // 右侧：质控结果展示
    const resultSection = document.createElement('div');
    resultSection.className = 'qc-result-section';
    resultSection.innerHTML = '<div class="no-result">请录入质控数据</div>';
    
    function refreshQCResults() {
        const results = simulation.getQCResults();
        renderQCResults(resultSection, results);
    }
    
    mainContent.appendChild(resultSection);

    ui.appendChild(mainContent);

    // 底部操作栏
    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    actionBar.innerHTML = `
        <div class="action-info">
            <span>当前阶段: <strong>${ProcessingPhaseNames[ProcessingPhase.QUALITY_CONTROL]}</strong></span>
        </div>
        <div class="action-buttons">
            <button class="btn btn-secondary" id="prevPhaseBtn">← 返回上一阶段</button>
            <button class="btn btn-primary" id="nextPhaseBtn">进入下一阶段 →</button>
        </div>
    `;
    ui.appendChild(actionBar);

    // 上一阶段按钮
    actionBar.querySelector('#prevPhaseBtn').addEventListener('click', () => {
        const result = simulation.previousPhase();
        if (result.isValid) {
            showNotification(result.message, 'success');
            ui.dispatchEvent(new CustomEvent('phaseChange', { detail: { phase: simulation.getPhase() } }));
        } else {
            showNotification(result.message, 'error');
        }
    });

    // 下一阶段按钮
    actionBar.querySelector('#nextPhaseBtn').addEventListener('click', () => {
        const state = simulation.getState();
        if (!state || state.qcResults.length === 0) {
            showNotification('请先完成至少一项质控检查', 'warning');
            return;
        }
        
        const result = simulation.nextPhase();
        if (result.isValid) {
            showNotification(result.message, 'success');
            ui.dispatchEvent(new CustomEvent('phaseChange', { detail: { phase: simulation.getPhase() } }));
        } else {
            showNotification(result.message, 'error');
        }
    });

    if (container) {
        container.appendChild(ui);
    }

    // 初始加载结果
    refreshQCResults();

    return ui;
}

/**
 * 创建质控类型选择器
 * @returns {HTMLElement}
 */
function createQCTypeSelector() {
    const selector = document.createElement('div');
    selector.className = 'qc-type-selector';
    
    selector.innerHTML = `
        <h4>🔬 质控项目</h4>
        <div class="qc-type-cards">
            <div class="qc-type-card active" data-type="blank">
                <span class="type-icon">🧪</span>
                <span class="type-name">空白试验</span>
                <span class="type-desc">检验试剂和器皿的污染</span>
            </div>
            <div class="qc-type-card" data-type="parallel">
                <span class="type-icon">⚖️</span>
                <span class="type-name">平行样</span>
                <span class="type-desc">检验分析精密度</span>
            </div>
            <div class="qc-type-card" data-type="spike_recovery">
                <span class="type-icon">📈</span>
                <span class="type-name">加标回收</span>
                <span class="type-desc">检验分析准确度</span>
            </div>
        </div>
    `;

    // 切换质控类型
    selector.querySelectorAll('.qc-type-card').forEach(card => {
        card.addEventListener('click', () => {
            selector.querySelectorAll('.qc-type-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            // 触发类型变化事件
            selector.dispatchEvent(new CustomEvent('typeChange', { 
                detail: { type: card.dataset.type } 
            }));
        });
    });

    return selector;
}

/**
 * 创建质控数据录入表单
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {Function} onSubmit - 提交回调
 * @returns {HTMLElement}
 */
function createQCDataForm(simulation, onSubmit) {
    const form = document.createElement('div');
    form.className = 'qc-data-form';
    
    let currentType = 'blank';
    
    function renderForm() {
        if (currentType === 'blank') {
            form.innerHTML = `
                <h4>空白试验数据</h4>
                <div class="form-group">
                    <label>监测项目</label>
                    <select id="qcParameter">
                        ${MONITORING_PARAMETERS.map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>空白值</label>
                    <input type="number" id="blankValue" step="0.001" placeholder="输入空白测量值" />
                </div>
                <div class="form-group">
                    <label>检出限</label>
                    <input type="number" id="detectionLimit" step="0.001" value="0.1" />
                </div>
                <button class="btn btn-primary" id="submitQCBtn">提交质控数据</button>
            `;
        } else if (currentType === 'parallel') {
            form.innerHTML = `
                <h4>平行样数据</h4>
                <div class="form-group">
                    <label>监测项目</label>
                    <select id="qcParameter">
                        ${MONITORING_PARAMETERS.map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>测量值1</label>
                    <input type="number" id="parallelValue1" step="0.001" placeholder="第一次测量值" />
                </div>
                <div class="form-group">
                    <label>测量值2</label>
                    <input type="number" id="parallelValue2" step="0.001" placeholder="第二次测量值" />
                </div>
                <button class="btn btn-primary" id="submitQCBtn">提交质控数据</button>
            `;
        } else if (currentType === 'spike_recovery') {
            form.innerHTML = `
                <h4>加标回收数据</h4>
                <div class="form-group">
                    <label>监测项目</label>
                    <select id="qcParameter">
                        ${MONITORING_PARAMETERS.map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>原始值</label>
                    <input type="number" id="originalValue" step="0.001" placeholder="加标前测量值" />
                </div>
                <div class="form-group">
                    <label>加标后测量值</label>
                    <input type="number" id="spikedValue" step="0.001" placeholder="加标后测量值" />
                </div>
                <div class="form-group">
                    <label>加标量</label>
                    <input type="number" id="spikeAmount" step="0.001" placeholder="加入的标准物质量" />
                </div>
                <button class="btn btn-primary" id="submitQCBtn">提交质控数据</button>
            `;
        }

        // 绑定提交事件
        form.querySelector('#submitQCBtn').addEventListener('click', () => {
            const qcData = collectQCData();
            if (!qcData) return;
            
            const result = simulation.addQCData(qcData);
            showNotification(result.message, result.passed ? 'success' : 'warning');
            
            if (onSubmit) onSubmit(result);
        });
    }

    function collectQCData() {
        const parameter = form.querySelector('#qcParameter').value;
        
        if (currentType === 'blank') {
            const blankValue = parseFloat(form.querySelector('#blankValue').value);
            const detectionLimit = parseFloat(form.querySelector('#detectionLimit').value);
            
            if (isNaN(blankValue)) {
                showNotification('请输入空白值', 'warning');
                return null;
            }
            
            return {
                type: 'blank',
                parameter,
                values: [blankValue],
                detectionLimit: detectionLimit || 0.1
            };
        } else if (currentType === 'parallel') {
            const value1 = parseFloat(form.querySelector('#parallelValue1').value);
            const value2 = parseFloat(form.querySelector('#parallelValue2').value);
            
            if (isNaN(value1) || isNaN(value2)) {
                showNotification('请输入两个平行样测量值', 'warning');
                return null;
            }
            
            return {
                type: 'parallel',
                parameter,
                values: [value1, value2]
            };
        } else if (currentType === 'spike_recovery') {
            const original = parseFloat(form.querySelector('#originalValue').value);
            const spiked = parseFloat(form.querySelector('#spikedValue').value);
            const spikeAmount = parseFloat(form.querySelector('#spikeAmount').value);
            
            if (isNaN(original) || isNaN(spiked) || isNaN(spikeAmount)) {
                showNotification('请输入完整的加标回收数据', 'warning');
                return null;
            }
            
            return {
                type: 'spike_recovery',
                parameter,
                values: [original, spiked],
                spikeAmount
            };
        }
        
        return null;
    }

    // 监听类型变化
    document.addEventListener('typeChange', (e) => {
        currentType = e.detail.type;
        renderForm();
    });

    // 初始渲染
    renderForm();

    return form;
}

/**
 * 渲染质控结果
 * @param {HTMLElement} container - 容器元素
 * @param {QCResult[]} results - 质控结果列表
 */
function renderQCResults(container, results) {
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="no-result">暂无质控结果</div>';
        return;
    }

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    container.innerHTML = `
        <div class="qc-results">
            <div class="results-header">
                <h3>📋 质控结果汇总</h3>
                <div class="results-summary">
                    <span class="summary-item passed">合格: ${passedCount}</span>
                    <span class="summary-item failed">不合格: ${totalCount - passedCount}</span>
                </div>
            </div>
            
            <div class="results-list">
                ${results.map((result, index) => `
                    <div class="qc-result-item ${result.passed ? 'passed' : 'failed'}">
                        <div class="result-header">
                            <span class="result-type">${getQCTypeName(result.type)}</span>
                            <span class="result-status ${result.passed ? 'passed' : 'failed'}">
                                ${result.passed ? '✓ 合格' : '✗ 不合格'}
                            </span>
                        </div>
                        <div class="result-body">
                            <div class="result-value">
                                <span class="label">计算值:</span>
                                <span class="value">${typeof result.value === 'number' ? result.value.toFixed(4) : result.value}</span>
                            </div>
                            <div class="result-threshold">
                                <span class="label">阈值:</span>
                                <span class="value">${formatThreshold(result.threshold)}</span>
                            </div>
                        </div>
                        <div class="result-message">${result.message}</div>
                        ${result.suggestions && result.suggestions.length > 0 ? `
                        <div class="result-suggestions">
                            <span class="suggestions-title">改进建议:</span>
                            <ul>
                                ${result.suggestions.map(s => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * 获取质控类型名称
 * @param {string} type - 质控类型
 * @returns {string}
 */
function getQCTypeName(type) {
    const names = {
        'blank': '空白试验',
        'parallel': '平行样',
        'spike_recovery': '加标回收'
    };
    return names[type] || type;
}

/**
 * 格式化阈值显示
 * @param {number|Object} threshold - 阈值
 * @returns {string}
 */
function formatThreshold(threshold) {
    if (typeof threshold === 'number') {
        return threshold.toFixed(4);
    } else if (threshold && typeof threshold === 'object') {
        return `${threshold.min}-${threshold.max}`;
    }
    return '-';
}

// ================= 报告生成 UI 组件 =================

/**
 * 创建报告生成界面
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @param {HTMLElement} container - 容器元素
 * @returns {HTMLElement}
 */
function createReportUI(simulation, container) {
    const ui = document.createElement('div');
    ui.className = 'report-ui';

    // 阶段指示器
    const phaseIndicator = createPhaseIndicator(ProcessingPhase.REPORT);
    ui.appendChild(phaseIndicator);

    // 主内容区
    const mainContent = document.createElement('div');
    mainContent.className = 'report-main';

    // 左侧：报告模板和生成控制
    const controlSection = document.createElement('div');
    controlSection.className = 'report-control-section';
    
    // 模板选择
    const templateSelector = createReportTemplateSelector();
    controlSection.appendChild(templateSelector);
    
    // 生成按钮
    const generateBtn = document.createElement('button');
    generateBtn.className = 'btn btn-primary btn-block';
    generateBtn.textContent = '📄 生成报告';
    generateBtn.addEventListener('click', () => {
        const template = templateSelector.querySelector('#reportTemplate').value;
        const report = simulation.generateReport(template);
        if (report) {
            renderReportPreview(previewSection, report, simulation);
            showNotification('报告生成成功', 'success');
        }
    });
    controlSection.appendChild(generateBtn);
    
    // 报告信息摘要
    const summaryPanel = createReportSummaryPanel(simulation);
    controlSection.appendChild(summaryPanel);
    
    mainContent.appendChild(controlSection);

    // 右侧：报告预览
    const previewSection = document.createElement('div');
    previewSection.className = 'report-preview-section';
    previewSection.innerHTML = '<div class="no-preview">请点击"生成报告"按钮</div>';
    mainContent.appendChild(previewSection);

    ui.appendChild(mainContent);

    // 底部操作栏
    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    actionBar.innerHTML = `
        <div class="action-info">
            <span>当前阶段: <strong>${ProcessingPhaseNames[ProcessingPhase.REPORT]}</strong></span>
        </div>
        <div class="action-buttons">
            <button class="btn btn-secondary" id="prevPhaseBtn">← 返回上一阶段</button>
            <button class="btn btn-success" id="completeBtn">✓ 完成数据处理</button>
        </div>
    `;
    ui.appendChild(actionBar);

    // 上一阶段按钮
    actionBar.querySelector('#prevPhaseBtn').addEventListener('click', () => {
        const result = simulation.previousPhase();
        if (result.isValid) {
            showNotification(result.message, 'success');
            ui.dispatchEvent(new CustomEvent('phaseChange', { detail: { phase: simulation.getPhase() } }));
        } else {
            showNotification(result.message, 'error');
        }
    });

    // 完成按钮
    actionBar.querySelector('#completeBtn').addEventListener('click', () => {
        const state = simulation.getState();
        if (!state || !state.reportData) {
            showNotification('请先生成报告', 'warning');
            return;
        }
        
        const completionResult = simulation.complete();
        if (completionResult) {
            showNotification('数据处理完成！', 'success');
            showCompletionModal(completionResult);
            ui.dispatchEvent(new CustomEvent('phaseChange', { detail: { phase: simulation.getPhase() } }));
        }
    });

    if (container) {
        container.appendChild(ui);
    }

    return ui;
}

/**
 * 创建报告模板选择器
 * @returns {HTMLElement}
 */
function createReportTemplateSelector() {
    const selector = document.createElement('div');
    selector.className = 'template-selector';
    
    selector.innerHTML = `
        <h4>📋 报告模板</h4>
        <div class="template-options">
            <select id="reportTemplate">
                <option value="standard">标准监测报告</option>
                <option value="summary">简要汇总报告</option>
                <option value="detailed">详细分析报告</option>
            </select>
        </div>
        <div class="template-description">
            <p id="templateDesc">包含完整的监测数据、统计分析和质控结果</p>
        </div>
    `;

    const templateSelect = selector.querySelector('#reportTemplate');
    const templateDesc = selector.querySelector('#templateDesc');
    
    const descriptions = {
        'standard': '包含完整的监测数据、统计分析和质控结果',
        'summary': '仅包含关键数据和结论的简要报告',
        'detailed': '包含详细的数据分析、图表和建议的完整报告'
    };

    templateSelect.addEventListener('change', () => {
        templateDesc.textContent = descriptions[templateSelect.value];
    });

    return selector;
}

/**
 * 创建报告摘要面板
 * @param {DataProcessingSimulation} simulation - 仿真实例
 * @returns {HTMLElement}
 */
function createReportSummaryPanel(simulation) {
    const panel = document.createElement('div');
    panel.className = 'report-summary-panel';
    
    const state = simulation.getState();
    const totalData = state?.monitoringData.length || 0;
    const validData = state?.monitoringData.filter(d => d.isValid).length || 0;
    const statsCount = state?.statisticsResults.length || 0;
    const qcCount = state?.qcResults.length || 0;
    const qcPassed = state?.qcResults.filter(r => r.passed).length || 0;

    panel.innerHTML = `
        <h4>📊 数据摘要</h4>
        <div class="summary-items">
            <div class="summary-item">
                <span class="label">监测数据:</span>
                <span class="value">${totalData} 条 (有效: ${validData})</span>
            </div>
            <div class="summary-item">
                <span class="label">统计分析:</span>
                <span class="value">${statsCount} 次</span>
            </div>
            <div class="summary-item">
                <span class="label">质控检查:</span>
                <span class="value">${qcCount} 项 (合格: ${qcPassed})</span>
            </div>
        </div>
    `;

    return panel;
}

/**
 * 渲染报告预览
 * @param {HTMLElement} container - 容器元素
 * @param {Object} report - 报告数据
 * @param {DataProcessingSimulation} simulation - 仿真实例
 */
function renderReportPreview(container, report, simulation) {
    const preview = simulation.previewReport();
    
    container.innerHTML = `
        <div class="report-preview">
            <div class="preview-header">
                <h3>📄 报告预览</h3>
                <div class="preview-actions">
                    <button class="btn btn-sm" id="exportPdfBtn">导出 PDF</button>
                    <button class="btn btn-sm" id="exportWordBtn">导出 Word</button>
                </div>
            </div>
            <div class="preview-content">
                <div class="report-document">
                    ${formatReportPreview(preview)}
                </div>
            </div>
        </div>
    `;

    // 导出按钮事件
    container.querySelector('#exportPdfBtn').addEventListener('click', () => {
        showNotification('PDF导出功能开发中...', 'info');
    });

    container.querySelector('#exportWordBtn').addEventListener('click', () => {
        showNotification('Word导出功能开发中...', 'info');
    });
}

/**
 * 格式化报告预览内容
 * @param {string} preview - 预览文本
 * @returns {string}
 */
function formatReportPreview(preview) {
    if (!preview) return '<p>暂无报告内容</p>';
    
    // 简单的Markdown转HTML
    return preview
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, '<p>$1</p>')
        .replace(/<p><\/p>/g, '');
}

/**
 * 显示完成模态框
 * @param {Object} result - 完成结果
 */
function showCompletionModal(result) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const score = result.score;
    const gradeText = {
        'excellent': '优秀',
        'good': '良好',
        'pass': '合格',
        'fail': '不合格'
    };

    modal.innerHTML = `
        <div class="modal-content completion-modal">
            <div class="completion-header">
                <span class="completion-icon">🎉</span>
                <h2>数据处理完成！</h2>
            </div>
            <div class="completion-body">
                <div class="score-display">
                    <span class="score-value">${score.totalScore}</span>
                    <span class="score-label">总分</span>
                    <span class="grade-badge grade-${score.grade}">${gradeText[score.grade]}</span>
                </div>
                <div class="score-breakdown">
                    <h4>各维度得分</h4>
                    <div class="dimension-scores">
                        ${Object.entries(score.dimensions).map(([key, dim]) => `
                            <div class="dimension-item">
                                <span class="dim-name">${getDimensionName(key)}</span>
                                <span class="dim-score">${dim.score}/${dim.maxScore}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${score.suggestions.length > 0 ? `
                <div class="suggestions">
                    <h4>改进建议</h4>
                    <ul>
                        ${score.suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            <div class="completion-footer">
                <button class="btn btn-primary" id="closeCompletionBtn">确定</button>
            </div>
        </div>
    `;

    modal.querySelector('#closeCompletionBtn').addEventListener('click', () => {
        modal.remove();
    });

    document.body.appendChild(modal);
}

/**
 * 获取维度名称
 * @param {string} key - 维度键
 * @returns {string}
 */
function getDimensionName(key) {
    const names = {
        'dataEntry': '数据录入',
        'dataReview': '数据审核',
        'statistics': '统计分析',
        'qualityControl': '质量控制',
        'report': '报告生成'
    };
    return names[key] || key;
}

// ================= 数据导入导出功能 =================

/**
 * 数据导入导出管理器
 * DataImportExport class for handling data import/export operations
 */
class DataImportExport {
    constructor(simulation) {
        /** @type {DataProcessingSimulation} */
        this._simulation = simulation;
    }

    /**
     * 列映射配置 - 默认映射
     */
    static get DEFAULT_COLUMN_MAPPING() {
        return {
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
    }

    /**
     * 解析Excel文件
     * @param {File} file - Excel文件
     * @param {Object} options - 解析选项
     * @returns {Promise<ImportResult>}
     */
    async parseExcel(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    // 使用SheetJS (xlsx) 库解析
                    if (typeof XLSX === 'undefined') {
                        // 如果没有XLSX库，尝试作为CSV处理
                        resolve(this._parseAsCSVFallback(e.target.result, options));
                        return;
                    }

                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 获取第一个工作表
                    const sheetName = options.sheetName || workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // 转换为JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: options.hasHeader !== false ? undefined : 1,
                        defval: ''
                    });

                    const result = this._processImportData(jsonData, options);
                    resolve(result);
                } catch (error) {
                    resolve({
                        success: false,
                        totalRows: 0,
                        importedRows: 0,
                        errors: [{ row: 0, field: '', message: `解析Excel文件失败: ${error.message}` }],
                        data: []
                    });
                }
            };

            reader.onerror = () => {
                resolve({
                    success: false,
                    totalRows: 0,
                    importedRows: 0,
                    errors: [{ row: 0, field: '', message: '读取文件失败' }],
                    data: []
                });
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 解析CSV文件
     * @param {File} file - CSV文件
     * @param {Object} options - 解析选项
     * @returns {Promise<ImportResult>}
     */
    async parseCSV(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const delimiter = options.delimiter || ',';
            const encoding = options.encoding || 'UTF-8';

            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const result = this._parseCSVText(text, delimiter, options);
                    resolve(result);
                } catch (error) {
                    resolve({
                        success: false,
                        totalRows: 0,
                        importedRows: 0,
                        errors: [{ row: 0, field: '', message: `解析CSV文件失败: ${error.message}` }],
                        data: []
                    });
                }
            };

            reader.onerror = () => {
                resolve({
                    success: false,
                    totalRows: 0,
                    importedRows: 0,
                    errors: [{ row: 0, field: '', message: '读取文件失败' }],
                    data: []
                });
            };

            reader.readAsText(file, encoding);
        });
    }

    /**
     * 解析CSV文本
     * @private
     */
    _parseCSVText(text, delimiter = ',', options = {}) {
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

        // 解析表头
        const hasHeader = options.hasHeader !== false;
        let headers = [];
        let dataStartIndex = 0;

        if (hasHeader) {
            headers = this._parseCSVLine(lines[0], delimiter);
            dataStartIndex = 1;
        } else {
            // 使用默认列名
            const firstLine = this._parseCSVLine(lines[0], delimiter);
            headers = firstLine.map((_, i) => `column${i + 1}`);
        }

        // 解析数据行
        const jsonData = [];
        for (let i = dataStartIndex; i < lines.length; i++) {
            const values = this._parseCSVLine(lines[i], delimiter);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] !== undefined ? values[index] : '';
            });
            jsonData.push(row);
        }

        return this._processImportData(jsonData, options);
    }

    /**
     * 解析CSV行（处理引号内的分隔符）
     * @private
     */
    _parseCSVLine(line, delimiter = ',') {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
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
     * 处理导入数据
     * @private
     */
    _processImportData(jsonData, options = {}) {
        const columnMapping = options.columnMapping || DataImportExport.DEFAULT_COLUMN_MAPPING;
        const errors = [];
        const importedData = [];
        let importedRows = 0;

        jsonData.forEach((row, index) => {
            const rowNumber = index + 2; // +2 because of 0-index and header row
            const mappedData = this._mapColumns(row, columnMapping);
            
            // 转换数值类型
            if (mappedData.value !== undefined && mappedData.value !== '') {
                const numValue = parseFloat(mappedData.value);
                if (!isNaN(numValue)) {
                    mappedData.value = numValue;
                }
            }

            // 验证数据
            const validation = this._validateImportRow(mappedData, rowNumber);
            
            if (validation.errors.length > 0) {
                errors.push(...validation.errors);
            }

            if (validation.isValid) {
                importedData.push(mappedData);
                importedRows++;
            } else if (options.skipInvalid !== true) {
                // 即使无效也添加，但标记错误
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
     * 映射列名
     * @private
     */
    _mapColumns(row, columnMapping) {
        const mapped = {};
        
        for (const [sourceCol, value] of Object.entries(row)) {
            const targetField = columnMapping[sourceCol] || columnMapping[sourceCol.trim()];
            if (targetField) {
                mapped[targetField] = value;
            }
        }

        return mapped;
    }

    /**
     * 验证导入行
     * @private
     */
    _validateImportRow(data, rowNumber) {
        const errors = [];

        // 必填字段验证
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
     * 验证导入数据
     * @param {Array} data - 数据数组
     * @returns {Object} 验证结果
     */
    validateImportData(data) {
        const errors = [];
        const validData = [];

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
     * 配置列映射
     * @param {string[]} sourceColumns - 源列名
     * @param {string[]} targetFields - 目标字段名
     * @returns {Object} 列映射配置
     */
    mapColumns(sourceColumns, targetFields) {
        const mapping = {};
        const minLength = Math.min(sourceColumns.length, targetFields.length);
        
        for (let i = 0; i < minLength; i++) {
            if (sourceColumns[i] && targetFields[i]) {
                mapping[sourceColumns[i]] = targetFields[i];
            }
        }

        return mapping;
    }

    /**
     * 导出为Excel格式
     * @param {MonitoringDataRecord[]} data - 数据
     * @param {Object} options - 导出选项
     * @returns {Blob|null}
     */
    exportToExcel(data, options = {}) {
        if (typeof XLSX === 'undefined') {
            console.error('XLSX library not loaded');
            return null;
        }

        const exportData = this._prepareExportData(data, options);
        
        // 创建工作表
        const worksheet = XLSX.utils.json_to_sheet(exportData, {
            header: options.includeHeaders !== false ? undefined : []
        });

        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || '监测数据');

        // 生成文件
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }

    /**
     * 导出为CSV格式
     * @param {MonitoringDataRecord[]} data - 数据
     * @param {Object} options - 导出选项
     * @returns {string}
     */
    exportToCSV(data, options = {}) {
        const delimiter = options.delimiter || ',';
        const exportData = this._prepareExportData(data, options);
        
        if (exportData.length === 0) {
            return '';
        }

        const lines = [];
        
        // 添加表头
        if (options.includeHeaders !== false) {
            const headers = Object.keys(exportData[0]);
            lines.push(headers.map(h => this._escapeCSVField(h, delimiter)).join(delimiter));
        }

        // 添加数据行
        exportData.forEach(row => {
            const values = Object.values(row).map(v => this._escapeCSVField(v, delimiter));
            lines.push(values.join(delimiter));
        });

        return lines.join('\n');
    }

    /**
     * 导出为JSON格式
     * @param {MonitoringDataRecord[]} data - 数据
     * @returns {string}
     */
    exportToJSON(data) {
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
     * 准备导出数据
     * @private
     */
    _prepareExportData(data, options = {}) {
        const dateFormat = options.dateFormat || 'YYYY-MM-DD';
        const useChineseHeaders = options.useChineseHeaders !== false;

        return data.map(record => {
            const row = {};
            
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
     * 转义CSV字段
     * @private
     */
    _escapeCSVField(value, delimiter = ',') {
        if (value === null || value === undefined) {
            return '';
        }
        
        const stringValue = String(value);
        
        // 如果包含分隔符、引号或换行符，需要用引号包裹
        if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        
        return stringValue;
    }

    /**
     * CSV回退解析（当没有XLSX库时）
     * @private
     */
    _parseAsCSVFallback(arrayBuffer, options) {
        try {
            const decoder = new TextDecoder(options.encoding || 'UTF-8');
            const text = decoder.decode(arrayBuffer);
            return this._parseCSVText(text, ',', options);
        } catch (error) {
            return {
                success: false,
                totalRows: 0,
                importedRows: 0,
                errors: [{ row: 0, field: '', message: `解析失败: ${error.message}` }],
                data: []
            };
        }
    }

    /**
     * 导入数据到仿真
     * @param {Array} data - 导入的数据
     * @returns {Object} 导入结果
     */
    importToSimulation(data) {
        if (!this._simulation) {
            return { success: false, message: '仿真未初始化', imported: 0 };
        }

        let imported = 0;
        const errors = [];

        data.forEach((record, index) => {
            const result = this._simulation.addMonitoringData(record);
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

// ================= 数据可视化增强功能 =================

/**
 * 数据可视化管理器
 * DataVisualization class for advanced chart types and interactions
 */
class DataVisualization {
    constructor() {
        /** @type {Map<string, Object>} */
        this._charts = new Map();
        /** @type {number} */
        this._chartIdCounter = 0;
    }

    /**
     * 生成唯一图表ID
     * @returns {string}
     */
    _generateChartId() {
        return `chart-${Date.now()}-${++this._chartIdCounter}`;
    }

    /**
     * 创建散点图数据
     * @param {number[]} xData - X轴数据
     * @param {number[]} yData - Y轴数据
     * @param {Object} config - 配置选项
     * @returns {Object} 可视化结果
     */
    createScatterPlot(xData, yData, config = {}) {
        if (!xData || !yData || xData.length === 0 || yData.length === 0) {
            return {
                chartId: null,
                config: null,
                data: [],
                error: '数据不能为空'
            };
        }

        const chartId = this._generateChartId();
        const minLength = Math.min(xData.length, yData.length);
        
        // 生成散点数据
        const points = [];
        for (let i = 0; i < minLength; i++) {
            if (typeof xData[i] === 'number' && typeof yData[i] === 'number' &&
                !isNaN(xData[i]) && !isNaN(yData[i])) {
                points.push({ x: xData[i], y: yData[i], index: i });
            }
        }

        // 计算统计信息
        const xValues = points.map(p => p.x);
        const yValues = points.map(p => p.y);
        
        const chartConfig = {
            type: 'scatter',
            title: config.title || '散点图',
            xAxis: {
                label: config.xLabel || 'X轴',
                min: Math.min(...xValues),
                max: Math.max(...xValues)
            },
            yAxis: {
                label: config.yLabel || 'Y轴',
                min: Math.min(...yValues),
                max: Math.max(...yValues)
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

        // 计算相关系数
        if (points.length >= 2) {
            const correlation = this._calculateCorrelation(xValues, yValues);
            chartConfig.statistics = {
                correlation,
                pointCount: points.length
            };
        }

        const result = {
            chartId,
            config: chartConfig,
            data: points
        };

        this._charts.set(chartId, result);
        return result;
    }

    /**
     * 创建热力图数据
     * @param {number[][]} matrix - 数据矩阵
     * @param {string[]} xLabels - X轴标签
     * @param {string[]} yLabels - Y轴标签
     * @param {Object} config - 配置选项
     * @returns {Object} 可视化结果
     */
    createHeatmap(matrix, xLabels, yLabels, config = {}) {
        if (!matrix || matrix.length === 0) {
            return {
                chartId: null,
                config: null,
                data: [],
                error: '矩阵数据不能为空'
            };
        }

        const chartId = this._generateChartId();
        
        // 展平矩阵为热力图数据点
        const heatmapData = [];
        let minValue = Infinity;
        let maxValue = -Infinity;

        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                const value = matrix[y][x];
                if (typeof value === 'number' && !isNaN(value)) {
                    heatmapData.push({
                        x,
                        y,
                        value,
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
            series: [{
                name: config.seriesName || '热力值',
                data: heatmapData
            }],
            legend: { show: config.showLegend !== false },
            tooltip: { show: config.showTooltip !== false },
            interactive: config.interactive !== false
        };

        const result = {
            chartId,
            config: chartConfig,
            data: heatmapData,
            matrix: matrix
        };

        this._charts.set(chartId, result);
        return result;
    }

    /**
     * 创建雷达图数据
     * @param {Object[]} datasets - 数据集数组，每个包含 name 和 values
     * @param {string[]} indicators - 指标名称数组
     * @param {Object} config - 配置选项
     * @returns {Object} 可视化结果
     */
    createRadarChart(datasets, indicators, config = {}) {
        if (!datasets || datasets.length === 0 || !indicators || indicators.length === 0) {
            return {
                chartId: null,
                config: null,
                data: [],
                error: '数据集和指标不能为空'
            };
        }

        const chartId = this._generateChartId();
        
        // 计算每个指标的最大值用于归一化
        const maxValues = indicators.map((_, i) => {
            let max = 0;
            datasets.forEach(ds => {
                if (ds.values && ds.values[i] !== undefined) {
                    max = Math.max(max, Math.abs(ds.values[i]));
                }
            });
            return max || 1;
        });

        // 处理数据集
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

        const result = {
            chartId,
            config: chartConfig,
            data: processedDatasets,
            indicators
        };

        this._charts.set(chartId, result);
        return result;
    }

    /**
     * 创建柱状图数据
     * @param {number[]} data - 数据数组
     * @param {string[]} labels - 标签数组
     * @param {Object} config - 配置选项
     * @returns {Object} 可视化结果
     */
    createBarChart(data, labels, config = {}) {
        if (!data || data.length === 0) {
            return {
                chartId: null,
                config: null,
                data: [],
                error: '数据不能为空'
            };
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

        const result = {
            chartId,
            config: chartConfig,
            data: chartData
        };

        this._charts.set(chartId, result);
        return result;
    }

    /**
     * 创建折线图数据
     * @param {number[][]} data - 多条线的数据数组
     * @param {string[]} labels - X轴标签
     * @param {Object} config - 配置选项
     * @returns {Object} 可视化结果
     */
    createLineChart(data, labels, config = {}) {
        if (!data || data.length === 0) {
            return {
                chartId: null,
                config: null,
                data: [],
                error: '数据不能为空'
            };
        }

        const chartId = this._generateChartId();
        
        // 处理单条线或多条线
        const datasets = Array.isArray(data[0]) ? data : [data];
        
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

        const result = {
            chartId,
            config: chartConfig,
            data: series
        };

        this._charts.set(chartId, result);
        return result;
    }

    /**
     * 创建箱线图数据
     * @param {number[][]} data - 多组数据
     * @param {string[]} labels - 组标签
     * @param {Object} config - 配置选项
     * @returns {Object} 可视化结果
     */
    createBoxPlot(data, labels, config = {}) {
        if (!data || data.length === 0) {
            return {
                chartId: null,
                config: null,
                data: [],
                error: '数据不能为空'
            };
        }

        const chartId = this._generateChartId();
        
        const boxData = data.map((values, index) => {
            const sorted = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
            if (sorted.length === 0) {
                return {
                    label: labels && labels[index] ? labels[index] : `组${index + 1}`,
                    min: 0, q1: 0, median: 0, q3: 0, max: 0, outliers: []
                };
            }

            const q1 = this._calculatePercentile(sorted, 25);
            const median = this._calculatePercentile(sorted, 50);
            const q3 = this._calculatePercentile(sorted, 75);
            const iqr = q3 - q1;
            const lowerFence = q1 - 1.5 * iqr;
            const upperFence = q3 + 1.5 * iqr;

            const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
            const inRange = sorted.filter(v => v >= lowerFence && v <= upperFence);

            return {
                label: labels && labels[index] ? labels[index] : `组${index + 1}`,
                min: inRange.length > 0 ? Math.min(...inRange) : sorted[0],
                q1,
                median,
                q3,
                max: inRange.length > 0 ? Math.max(...inRange) : sorted[sorted.length - 1],
                outliers
            };
        });

        const chartConfig = {
            type: 'boxplot',
            title: config.title || '箱线图',
            xAxis: {
                label: config.xLabel || '组别',
                categories: boxData.map(d => d.label)
            },
            yAxis: {
                label: config.yLabel || '值'
            },
            series: [{
                name: config.seriesName || '数据分布',
                data: boxData
            }],
            legend: { show: config.showLegend !== false },
            tooltip: { show: config.showTooltip !== false },
            interactive: config.interactive !== false
        };

        const result = {
            chartId,
            config: chartConfig,
            data: boxData
        };

        this._charts.set(chartId, result);
        return result;
    }

    /**
     * 更新图表数据
     * @param {string} chartId - 图表ID
     * @param {any} newData - 新数据
     * @returns {boolean} 是否成功
     */
    updateChartData(chartId, newData) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return false;
        }

        chart.data = newData;
        this._charts.set(chartId, chart);
        return true;
    }

    /**
     * 获取图表
     * @param {string} chartId - 图表ID
     * @returns {Object|null}
     */
    getChart(chartId) {
        return this._charts.get(chartId) || null;
    }

    /**
     * 删除图表
     * @param {string} chartId - 图表ID
     * @returns {boolean}
     */
    deleteChart(chartId) {
        return this._charts.delete(chartId);
    }

    /**
     * 导出图表为PNG格式（返回数据URL或配置）
     * @param {string} chartId - 图表ID
     * @param {Object} options - 导出选项
     * @returns {Object} 导出结果
     */
    exportChartToPNG(chartId, options = {}) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return { success: false, error: '图表不存在' };
        }

        // 返回导出配置，实际渲染需要在浏览器环境中使用Canvas
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

    /**
     * 导出图表为SVG格式
     * @param {string} chartId - 图表ID
     * @param {Object} options - 导出选项
     * @returns {Object} 导出结果
     */
    exportChartToSVG(chartId, options = {}) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return { success: false, error: '图表不存在' };
        }

        const width = options.width || 800;
        const height = options.height || 600;

        // 生成基础SVG结构
        let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${options.backgroundColor || '#ffffff'}"/>
  <text x="${width/2}" y="30" text-anchor="middle" font-size="16" font-weight="bold">${chart.config.title || ''}</text>
  <!-- Chart data would be rendered here based on type -->
  <g class="chart-content" transform="translate(60, 50)">`;

        // 根据图表类型生成不同的SVG内容
        if (chart.config.type === 'scatter' && chart.data) {
            const plotWidth = width - 120;
            const plotHeight = height - 100;
            const xMin = chart.config.xAxis.min;
            const xMax = chart.config.xAxis.max;
            const yMin = chart.config.yAxis.min;
            const yMax = chart.config.yAxis.max;

            chart.data.forEach(point => {
                const cx = ((point.x - xMin) / (xMax - xMin)) * plotWidth;
                const cy = plotHeight - ((point.y - yMin) / (yMax - yMin)) * plotHeight;
                svgContent += `\n    <circle cx="${cx}" cy="${cy}" r="4" fill="${chart.config.series[0].color || '#4A90D9'}" opacity="0.7"/>`;
            });
        } else if (chart.config.type === 'bar' && chart.data) {
            const plotWidth = width - 120;
            const plotHeight = height - 100;
            const barWidth = plotWidth / chart.data.length * 0.8;
            const maxValue = Math.max(...chart.data.map(d => d.value));

            chart.data.forEach((item, i) => {
                const x = (i + 0.1) * (plotWidth / chart.data.length);
                const barHeight = (item.value / maxValue) * plotHeight;
                const y = plotHeight - barHeight;
                svgContent += `\n    <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${chart.config.series[0].color || '#4A90D9'}"/>`;
            });
        }

        svgContent += `\n  </g>\n</svg>`;

        return {
            success: true,
            format: 'svg',
            chartId,
            content: svgContent,
            mimeType: 'image/svg+xml'
        };
    }

    /**
     * 计算百分位数
     * @private
     */
    _calculatePercentile(sortedValues, percentile) {
        if (!sortedValues || sortedValues.length === 0) return 0;
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return sortedValues[lower];
        return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
    }

    /**
     * 计算相关系数
     * @private
     */
    _calculateCorrelation(xValues, yValues) {
        const n = xValues.length;
        if (n < 2) return 0;

        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
        const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * 获取默认颜色
     * @private
     */
    _getDefaultColor(index) {
        const colors = [
            '#4A90D9', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
            '#00CED1', '#FF6347', '#9370DB', '#3CB371', '#FFD700'
        ];
        return colors[index % colors.length];
    }

    /**
     * 获取图表交互配置
     * @param {string} chartId - 图表ID
     * @returns {Object} 交互配置
     */
    getInteractionConfig(chartId) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return null;
        }

        return {
            chartId,
            type: chart.config.type,
            zoom: {
                enabled: true,
                type: 'xy',
                minZoom: 0.5,
                maxZoom: 10
            },
            pan: {
                enabled: true,
                mode: 'xy'
            },
            tooltip: {
                enabled: chart.config.tooltip.show,
                trigger: 'item',
                formatter: this._getTooltipFormatter(chart.config.type)
            },
            legend: {
                enabled: chart.config.legend.show,
                interactive: true
            }
        };
    }

    /**
     * 获取提示框格式化函数描述
     * @private
     */
    _getTooltipFormatter(chartType) {
        const formatters = {
            scatter: '({x}, {y})',
            heatmap: '{xLabel}, {yLabel}: {value}',
            radar: '{indicator}: {value}',
            bar: '{label}: {value}',
            line: '{series}: {value}',
            boxplot: '最小值: {min}, Q1: {q1}, 中位数: {median}, Q3: {q3}, 最大值: {max}'
        };
        return formatters[chartType] || '{value}';
    }

    /**
     * 设置图表缩放
     * @param {string} chartId - 图表ID
     * @param {number} zoomLevel - 缩放级别 (0.5 - 10)
     * @param {Object} center - 缩放中心点 {x, y}
     * @returns {Object} 缩放结果
     */
    setZoom(chartId, zoomLevel, center = null) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return { success: false, error: '图表不存在' };
        }

        const clampedZoom = Math.max(0.5, Math.min(10, zoomLevel));
        
        if (!chart.viewState) {
            chart.viewState = {
                zoom: 1,
                panX: 0,
                panY: 0
            };
        }

        chart.viewState.zoom = clampedZoom;
        if (center) {
            chart.viewState.zoomCenter = center;
        }

        this._charts.set(chartId, chart);

        return {
            success: true,
            chartId,
            zoom: clampedZoom,
            viewState: chart.viewState
        };
    }

    /**
     * 设置图表平移
     * @param {string} chartId - 图表ID
     * @param {number} deltaX - X方向偏移
     * @param {number} deltaY - Y方向偏移
     * @returns {Object} 平移结果
     */
    setPan(chartId, deltaX, deltaY) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return { success: false, error: '图表不存在' };
        }

        if (!chart.viewState) {
            chart.viewState = {
                zoom: 1,
                panX: 0,
                panY: 0
            };
        }

        chart.viewState.panX += deltaX;
        chart.viewState.panY += deltaY;

        this._charts.set(chartId, chart);

        return {
            success: true,
            chartId,
            panX: chart.viewState.panX,
            panY: chart.viewState.panY,
            viewState: chart.viewState
        };
    }

    /**
     * 重置图表视图
     * @param {string} chartId - 图表ID
     * @returns {Object} 重置结果
     */
    resetView(chartId) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return { success: false, error: '图表不存在' };
        }

        chart.viewState = {
            zoom: 1,
            panX: 0,
            panY: 0
        };

        this._charts.set(chartId, chart);

        return {
            success: true,
            chartId,
            viewState: chart.viewState
        };
    }

    /**
     * 获取数据点悬停信息
     * @param {string} chartId - 图表ID
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     * @param {Object} chartDimensions - 图表尺寸 {width, height, padding}
     * @returns {Object|null} 悬停的数据点信息
     */
    getHoverInfo(chartId, x, y, chartDimensions = {}) {
        const chart = this._charts.get(chartId);
        if (!chart || !chart.data) {
            return null;
        }

        const width = chartDimensions.width || 800;
        const height = chartDimensions.height || 600;
        const padding = chartDimensions.padding || { top: 50, right: 60, bottom: 50, left: 60 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;

        // 转换为图表坐标
        const chartX = x - padding.left;
        const chartY = y - padding.top;

        if (chartX < 0 || chartX > plotWidth || chartY < 0 || chartY > plotHeight) {
            return null;
        }

        const chartType = chart.config.type;
        let nearestPoint = null;
        let minDistance = Infinity;
        const hitRadius = 10; // 点击检测半径

        if (chartType === 'scatter') {
            const xMin = chart.config.xAxis.min;
            const xMax = chart.config.xAxis.max;
            const yMin = chart.config.yAxis.min;
            const yMax = chart.config.yAxis.max;

            chart.data.forEach((point, index) => {
                const px = ((point.x - xMin) / (xMax - xMin)) * plotWidth;
                const py = plotHeight - ((point.y - yMin) / (yMax - yMin)) * plotHeight;
                const distance = Math.sqrt(Math.pow(chartX - px, 2) + Math.pow(chartY - py, 2));

                if (distance < minDistance && distance < hitRadius) {
                    minDistance = distance;
                    nearestPoint = {
                        index,
                        data: point,
                        screenX: px + padding.left,
                        screenY: py + padding.top,
                        tooltip: `X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}`
                    };
                }
            });
        } else if (chartType === 'bar') {
            const barCount = chart.data.length;
            const barWidth = plotWidth / barCount * 0.8;
            const barGap = plotWidth / barCount * 0.2;
            const maxValue = Math.max(...chart.data.map(d => d.value));

            chart.data.forEach((item, index) => {
                const barX = index * (barWidth + barGap) + barGap / 2;
                const barHeight = (item.value / maxValue) * plotHeight;
                const barY = plotHeight - barHeight;

                if (chartX >= barX && chartX <= barX + barWidth &&
                    chartY >= barY && chartY <= plotHeight) {
                    nearestPoint = {
                        index,
                        data: item,
                        screenX: barX + barWidth / 2 + padding.left,
                        screenY: barY + padding.top,
                        tooltip: `${item.label}: ${item.value.toFixed(2)}`
                    };
                }
            });
        } else if (chartType === 'heatmap') {
            const cellWidth = plotWidth / chart.config.xAxis.categories.length;
            const cellHeight = plotHeight / chart.config.yAxis.categories.length;
            const cellX = Math.floor(chartX / cellWidth);
            const cellY = Math.floor(chartY / cellHeight);

            const point = chart.data.find(p => p.x === cellX && p.y === cellY);
            if (point) {
                nearestPoint = {
                    index: cellY * chart.config.xAxis.categories.length + cellX,
                    data: point,
                    screenX: cellX * cellWidth + cellWidth / 2 + padding.left,
                    screenY: cellY * cellHeight + cellHeight / 2 + padding.top,
                    tooltip: `${point.xLabel}, ${point.yLabel}: ${point.value.toFixed(2)}`
                };
            }
        }

        return nearestPoint;
    }

    /**
     * 切换图例项可见性
     * @param {string} chartId - 图表ID
     * @param {string} seriesName - 系列名称
     * @returns {Object} 切换结果
     */
    toggleLegendItem(chartId, seriesName) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return { success: false, error: '图表不存在' };
        }

        if (!chart.legendState) {
            chart.legendState = {};
        }

        // 切换可见性
        const currentState = chart.legendState[seriesName] !== false;
        chart.legendState[seriesName] = !currentState;

        this._charts.set(chartId, chart);

        return {
            success: true,
            chartId,
            seriesName,
            visible: chart.legendState[seriesName],
            legendState: chart.legendState
        };
    }

    /**
     * 获取图例状态
     * @param {string} chartId - 图表ID
     * @returns {Object|null} 图例状态
     */
    getLegendState(chartId) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return null;
        }

        // 初始化图例状态（所有系列默认可见）
        if (!chart.legendState) {
            chart.legendState = {};
            if (chart.config.series) {
                chart.config.series.forEach(s => {
                    chart.legendState[s.name] = true;
                });
            }
        }

        return {
            chartId,
            legendState: chart.legendState,
            series: chart.config.series ? chart.config.series.map(s => ({
                name: s.name,
                visible: chart.legendState[s.name] !== false,
                color: s.color
            })) : []
        };
    }

    /**
     * 获取可见数据（根据图例状态过滤）
     * @param {string} chartId - 图表ID
     * @returns {Object|null} 可见数据
     */
    getVisibleData(chartId) {
        const chart = this._charts.get(chartId);
        if (!chart) {
            return null;
        }

        const legendState = chart.legendState || {};
        
        if (chart.config.type === 'radar' || chart.config.type === 'line') {
            // 对于多系列图表，过滤不可见的系列
            const visibleSeries = (chart.config.series || []).filter(s => 
                legendState[s.name] !== false
            );
            return {
                chartId,
                series: visibleSeries,
                data: chart.data.filter(d => legendState[d.name] !== false)
            };
        }

        return {
            chartId,
            data: chart.data
        };
    }
}

// ================= AI辅助分析引擎 =================

/**
 * AI辅助分析引擎
 * 提供智能异常检测、趋势预测、数据质量评估和洞察生成功能
 * Requirements: 2.2, 2.3, 3.2 (extended)
 */
class AIAnalysisEngine {
    constructor() {
        this._cache = new Map();
        this._cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
    }

    // ================= 智能异常检测 =================

    /**
     * 检测数据异常 - 基于多种统计模型
     * Requirements: 2.2, 2.3 (extended)
     * @param {MonitoringDataRecord[]} data - 监测数据列表
     * @param {number} sensitivity - 敏感度 (0-1)，默认0.5
     * @returns {AnomalyDetectionResult[]} 异常检测结果
     */
    detectAnomalies(data, sensitivity = 0.5) {
        if (!data || data.length === 0) return [];

        const results = [];
        
        // 按参数分组数据
        const groupedData = this._groupByParameter(data);

        data.forEach(record => {
            const result = {
                dataId: record.id,
                isAnomaly: false,
                confidence: 0,
                anomalyType: null,
                explanation: '',
                suggestedAction: ''
            };

            // 1. 范围检测
            const rangeResult = this._detectRangeAnomaly(record);
            if (rangeResult.isAnomaly) {
                result.isAnomaly = true;
                result.confidence = Math.max(result.confidence, rangeResult.confidence);
                result.anomalyType = rangeResult.anomalyType;
                result.explanation = rangeResult.explanation;
                result.suggestedAction = rangeResult.suggestedAction;
            }

            // 2. 统计异常检测 (Z-score)
            const sameParamData = groupedData[record.parameter] || [];
            if (sameParamData.length >= 3 && !result.isAnomaly) {
                const zscoreResult = this._detectZScoreAnomaly(record, sameParamData, sensitivity);
                if (zscoreResult.isAnomaly) {
                    result.isAnomaly = true;
                    result.confidence = Math.max(result.confidence, zscoreResult.confidence);
                    result.anomalyType = zscoreResult.anomalyType;
                    result.explanation = zscoreResult.explanation;
                    result.suggestedAction = zscoreResult.suggestedAction;
                }
            }

            // 3. IQR异常检测
            if (sameParamData.length >= 4 && !result.isAnomaly) {
                const iqrResult = this._detectIQRAnomaly(record, sameParamData, sensitivity);
                if (iqrResult.isAnomaly) {
                    result.isAnomaly = true;
                    result.confidence = Math.max(result.confidence, iqrResult.confidence);
                    result.anomalyType = iqrResult.anomalyType;
                    result.explanation = iqrResult.explanation;
                    result.suggestedAction = iqrResult.suggestedAction;
                }
            }

            // 4. 趋势突变检测
            if (sameParamData.length >= 5 && !result.isAnomaly) {
                const trendResult = this._detectTrendBreak(record, sameParamData, sensitivity);
                if (trendResult.isAnomaly) {
                    result.isAnomaly = true;
                    result.confidence = Math.max(result.confidence, trendResult.confidence);
                    result.anomalyType = trendResult.anomalyType;
                    result.explanation = trendResult.explanation;
                    result.suggestedAction = trendResult.suggestedAction;
                }
            }

            results.push(result);
        });

        return results;
    }

    /**
     * 范围异常检测
     * @private
     */
    _detectRangeAnomaly(record) {
        const range = PARAMETER_REFERENCE_RANGES[record.parameter];
        if (!range || typeof record.value !== 'number') {
            return { isAnomaly: false };
        }

        if (record.value < range.min || record.value > range.max) {
            const deviation = record.value < range.min 
                ? (range.min - record.value) / range.min 
                : (record.value - range.max) / range.max;
            
            return {
                isAnomaly: true,
                confidence: Math.min(0.95, 0.7 + deviation * 0.5),
                anomalyType: 'outlier',
                explanation: `${record.parameter}值(${record.value})超出参考范围(${range.min}-${range.max}${range.unit})`,
                suggestedAction: deviation > 0.5 
                    ? '建议重新采样或检查仪器校准' 
                    : '建议核实数据或标记为异常值'
            };
        }

        return { isAnomaly: false };
    }

    /**
     * Z-score异常检测
     * @private
     */
    _detectZScoreAnomaly(record, sameParamData, sensitivity) {
        const values = sameParamData.map(d => d.value).filter(v => typeof v === 'number');
        if (values.length < 3) return { isAnomaly: false };

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
        
        if (std === 0) return { isAnomaly: false };

        const zscore = Math.abs((record.value - mean) / std);
        const threshold = 3 - sensitivity; // 敏感度越高，阈值越低

        if (zscore > threshold) {
            return {
                isAnomaly: true,
                confidence: Math.min(0.95, 0.6 + (zscore - threshold) * 0.1),
                anomalyType: 'outlier',
                explanation: `${record.parameter}值(${record.value})的Z-score为${zscore.toFixed(2)}，超过${threshold.toFixed(1)}倍标准差`,
                suggestedAction: '建议检查该数据点的采样或分析过程'
            };
        }

        return { isAnomaly: false };
    }

    /**
     * IQR异常检测
     * @private
     */
    _detectIQRAnomaly(record, sameParamData, sensitivity) {
        const values = sameParamData.map(d => d.value).filter(v => typeof v === 'number').sort((a, b) => a - b);
        if (values.length < 4) return { isAnomaly: false };

        const q1 = this._calculatePercentile(values, 25);
        const q3 = this._calculatePercentile(values, 75);
        const iqr = q3 - q1;
        
        if (iqr === 0) return { isAnomaly: false };

        const multiplier = 1.5 + (1 - sensitivity); // 敏感度越高，multiplier越小
        const lowerBound = q1 - multiplier * iqr;
        const upperBound = q3 + multiplier * iqr;

        if (record.value < lowerBound || record.value > upperBound) {
            return {
                isAnomaly: true,
                confidence: 0.85,
                anomalyType: 'outlier',
                explanation: `${record.parameter}值(${record.value})超出IQR范围(${lowerBound.toFixed(2)}-${upperBound.toFixed(2)})`,
                suggestedAction: '建议与相邻数据点进行比较分析'
            };
        }

        return { isAnomaly: false };
    }

    /**
     * 趋势突变检测
     * @private
     */
    _detectTrendBreak(record, sameParamData, sensitivity) {
        // 按时间排序
        const sortedData = [...sameParamData].sort((a, b) => 
            new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime()
        );
        
        const recordIndex = sortedData.findIndex(d => d.id === record.id);
        if (recordIndex < 2) return { isAnomaly: false };

        // 计算前几个点的移动平均
        const windowSize = Math.min(3, recordIndex);
        const prevValues = sortedData.slice(recordIndex - windowSize, recordIndex).map(d => d.value);
        const movingAvg = prevValues.reduce((a, b) => a + b, 0) / prevValues.length;
        const movingStd = Math.sqrt(prevValues.reduce((sum, v) => sum + Math.pow(v - movingAvg, 2), 0) / prevValues.length);

        if (movingStd === 0) return { isAnomaly: false };

        const deviation = Math.abs(record.value - movingAvg) / movingStd;
        const threshold = 2.5 - sensitivity;

        if (deviation > threshold) {
            return {
                isAnomaly: true,
                confidence: Math.min(0.9, 0.5 + deviation * 0.1),
                anomalyType: 'trend_break',
                explanation: `${record.parameter}值(${record.value})与近期趋势(均值${movingAvg.toFixed(2)})偏差较大`,
                suggestedAction: '建议检查是否存在环境变化或采样条件改变'
            };
        }

        return { isAnomaly: false };
    }

    // ================= 趋势预测 =================

    /**
     * 预测数据趋势
     * Requirements: 3.2 (extended)
     * @param {TimeSeriesData[]} historicalData - 历史时间序列数据
     * @param {number} periods - 预测周期数
     * @returns {TrendPrediction} 趋势预测结果
     */
    predictTrend(historicalData, periods = 3) {
        if (!historicalData || historicalData.length < 3) {
            return {
                parameter: '',
                historicalData: [],
                predictedValues: [],
                confidence: 0,
                trendDirection: 'stable',
                seasonalPattern: null
            };
        }

        // 按时间排序
        const sortedData = [...historicalData].sort((a, b) => a.timestamp - b.timestamp);
        const values = sortedData.map(d => d.value);
        const timestamps = sortedData.map(d => d.timestamp);

        // 计算线性回归
        const regression = this._linearRegression(timestamps, values);
        
        // 判断趋势方向
        const trendDirection = this._determineTrendDirection(regression.slope, values);
        
        // 计算置信度
        const confidence = Math.min(0.95, Math.abs(regression.r2));

        // 生成预测值
        const predictedValues = [];
        const lastTimestamp = timestamps[timestamps.length - 1];
        const avgInterval = (lastTimestamp - timestamps[0]) / (timestamps.length - 1);
        
        // 计算残差标准差用于置信区间
        const residuals = values.map((v, i) => v - (regression.slope * timestamps[i] + regression.intercept));
        const residualStd = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);

        for (let i = 1; i <= periods; i++) {
            const futureTimestamp = lastTimestamp + avgInterval * i;
            const predictedValue = regression.slope * futureTimestamp + regression.intercept;
            const marginOfError = 1.96 * residualStd * Math.sqrt(1 + 1/values.length);
            
            predictedValues.push({
                timestamp: futureTimestamp,
                value: predictedValue,
                lowerBound: predictedValue - marginOfError,
                upperBound: predictedValue + marginOfError,
                confidence: Math.max(0.5, confidence - i * 0.1)
            });
        }

        return {
            parameter: sortedData[0].parameter || '',
            historicalData: sortedData,
            predictedValues,
            confidence,
            trendDirection,
            seasonalPattern: this._detectSeasonalPattern(values)
        };
    }

    /**
     * 线性回归计算
     * @private
     */
    _linearRegression(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // 计算R²
        const yMean = sumY / n;
        const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
        const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

        return { slope, intercept, r2 };
    }

    /**
     * 判断趋势方向
     * @private
     */
    _determineTrendDirection(slope, values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const relativeSlope = mean !== 0 ? Math.abs(slope / mean) : Math.abs(slope);

        if (relativeSlope < 0.01) return 'stable';
        if (slope > 0) return 'increasing';
        return 'decreasing';
    }

    /**
     * 检测季节性模式
     * @private
     */
    _detectSeasonalPattern(values) {
        if (values.length < 6) return null;

        // 简单的周期性检测
        const diffs = [];
        for (let i = 1; i < values.length; i++) {
            diffs.push(values[i] - values[i - 1]);
        }

        // 检查是否有交替的正负差值（可能的周期性）
        let signChanges = 0;
        for (let i = 1; i < diffs.length; i++) {
            if (diffs[i] * diffs[i - 1] < 0) signChanges++;
        }

        const changeRatio = signChanges / (diffs.length - 1);
        if (changeRatio > 0.6) {
            return { type: 'oscillating', period: 2 };
        }

        return null;
    }

    // ================= 数据质量评估 =================

    /**
     * 评估数据质量
     * Requirements: 2.2 (extended)
     * @param {MonitoringDataRecord[]} data - 监测数据列表
     * @returns {DataQualityAssessment} 数据质量评估结果
     */
    assessDataQuality(data) {
        if (!data || data.length === 0) {
            return {
                overallScore: 0,
                completeness: 0,
                consistency: 0,
                accuracy: 0,
                timeliness: 0,
                issues: [],
                recommendations: ['没有数据可供评估']
            };
        }

        const issues = [];
        const recommendations = [];

        // 1. 完整性评估
        const completeness = this._assessCompleteness(data, issues);

        // 2. 一致性评估
        const consistency = this._assessConsistency(data, issues);

        // 3. 准确性评估
        const accuracy = this._assessAccuracy(data, issues);

        // 4. 时效性评估
        const timeliness = this._assessTimeliness(data, issues);

        // 计算总分
        const overallScore = Math.round(
            completeness * 0.3 + 
            consistency * 0.25 + 
            accuracy * 0.3 + 
            timeliness * 0.15
        );

        // 生成建议
        if (completeness < 80) {
            recommendations.push('建议补充缺失的必填字段数据');
        }
        if (consistency < 80) {
            recommendations.push('建议检查数据格式和单位的一致性');
        }
        if (accuracy < 80) {
            recommendations.push('建议复核超出参考范围的数据');
        }
        if (timeliness < 80) {
            recommendations.push('建议及时录入最新的监测数据');
        }

        return {
            overallScore,
            completeness,
            consistency,
            accuracy,
            timeliness,
            issues,
            recommendations
        };
    }

    /**
     * 评估数据完整性
     * @private
     */
    _assessCompleteness(data, issues) {
        const requiredFields = ['sampleId', 'parameter', 'value', 'measurementDate', 'analyst'];
        let totalFields = data.length * requiredFields.length;
        let filledFields = 0;

        data.forEach(record => {
            requiredFields.forEach(field => {
                if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
                    filledFields++;
                }
            });
        });

        const completeness = Math.round((filledFields / totalFields) * 100);
        
        if (completeness < 100) {
            issues.push({
                type: 'completeness',
                severity: completeness < 80 ? 'high' : 'medium',
                description: `数据完整性为${completeness}%，存在缺失字段`
            });
        }

        return completeness;
    }

    /**
     * 评估数据一致性
     * @private
     */
    _assessConsistency(data, issues) {
        let consistencyScore = 100;
        
        // 检查单位一致性
        const paramUnits = {};
        data.forEach(record => {
            if (!paramUnits[record.parameter]) {
                paramUnits[record.parameter] = new Set();
            }
            if (record.unit) {
                paramUnits[record.parameter].add(record.unit);
            }
        });

        Object.entries(paramUnits).forEach(([param, units]) => {
            if (units.size > 1) {
                consistencyScore -= 10;
                issues.push({
                    type: 'consistency',
                    severity: 'medium',
                    description: `${param}存在多种单位：${[...units].join(', ')}`
                });
            }
        });

        // 检查日期格式一致性
        const dateFormats = new Set();
        data.forEach(record => {
            if (record.measurementDate) {
                const format = record.measurementDate.includes('/') ? 'slash' : 'dash';
                dateFormats.add(format);
            }
        });

        if (dateFormats.size > 1) {
            consistencyScore -= 5;
            issues.push({
                type: 'consistency',
                severity: 'low',
                description: '日期格式不一致'
            });
        }

        return Math.max(0, consistencyScore);
    }

    /**
     * 评估数据准确性
     * @private
     */
    _assessAccuracy(data, issues) {
        let inRangeCount = 0;
        let totalWithRange = 0;

        data.forEach(record => {
            const range = PARAMETER_REFERENCE_RANGES[record.parameter];
            if (range && typeof record.value === 'number') {
                totalWithRange++;
                if (record.value >= range.min && record.value <= range.max) {
                    inRangeCount++;
                }
            }
        });

        const accuracy = totalWithRange > 0 
            ? Math.round((inRangeCount / totalWithRange) * 100) 
            : 100;

        if (accuracy < 100) {
            const outOfRange = totalWithRange - inRangeCount;
            issues.push({
                type: 'accuracy',
                severity: accuracy < 80 ? 'high' : 'medium',
                description: `${outOfRange}条数据超出参考范围`
            });
        }

        return accuracy;
    }

    /**
     * 评估数据时效性
     * @private
     */
    _assessTimeliness(data, issues) {
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const oneMonth = 30 * 24 * 60 * 60 * 1000;

        let recentCount = 0;
        data.forEach(record => {
            const recordDate = new Date(record.measurementDate).getTime();
            if (now - recordDate < oneWeek) {
                recentCount++;
            }
        });

        const timeliness = Math.round((recentCount / data.length) * 100);

        if (timeliness < 50) {
            issues.push({
                type: 'timeliness',
                severity: 'medium',
                description: '大部分数据超过一周未更新'
            });
        }

        return Math.min(100, timeliness + 30); // 给予基础分
    }

    // ================= 智能洞察生成 =================

    /**
     * 生成数据洞察
     * Requirements: 3.2 (extended)
     * @param {DataProcessingState} state - 数据处理状态
     * @returns {Insight[]} 洞察列表
     */
    generateInsights(state) {
        if (!state) return [];

        const insights = [];
        const data = state.monitoringData || [];

        // 1. 数据量洞察
        if (data.length > 0) {
            insights.push({
                id: `insight-count-${Date.now()}`,
                type: 'info',
                title: '数据概览',
                description: `当前共有${data.length}条监测数据，涉及${[...new Set(data.map(d => d.parameter))].length}个监测项目`,
                severity: 'info',
                relatedDataIds: [],
                suggestedActions: [],
                confidence: 1
            });
        }

        // 2. 异常数据洞察
        const anomalies = this.detectAnomalies(data);
        const anomalyCount = anomalies.filter(a => a.isAnomaly).length;
        if (anomalyCount > 0) {
            insights.push({
                id: `insight-anomaly-${Date.now()}`,
                type: 'anomaly',
                title: '异常数据提醒',
                description: `检测到${anomalyCount}条可能的异常数据，建议进行复核`,
                severity: anomalyCount > data.length * 0.1 ? 'warning' : 'info',
                relatedDataIds: anomalies.filter(a => a.isAnomaly).map(a => a.dataId),
                suggestedActions: ['进入数据审核阶段检查异常值', '核实采样和分析过程'],
                confidence: 0.85
            });
        }

        // 3. 质量控制洞察
        const qcResults = state.qcResults || [];
        if (qcResults.length > 0) {
            const failedQC = qcResults.filter(r => !r.passed);
            if (failedQC.length > 0) {
                insights.push({
                    id: `insight-qc-${Date.now()}`,
                    type: 'quality',
                    title: '质控问题提醒',
                    description: `${failedQC.length}项质控检查未通过，可能影响数据可靠性`,
                    severity: 'warning',
                    relatedDataIds: [],
                    suggestedActions: failedQC.flatMap(r => r.suggestions || []),
                    confidence: 0.9
                });
            }
        }

        // 4. 趋势洞察
        const groupedData = this._groupByParameter(data);
        Object.entries(groupedData).forEach(([param, paramData]) => {
            if (paramData.length >= 5) {
                const timeSeriesData = paramData.map(d => ({
                    timestamp: new Date(d.measurementDate).getTime(),
                    value: d.value,
                    parameter: d.parameter
                }));
                const trend = this.predictTrend(timeSeriesData, 1);
                
                if (trend.trendDirection !== 'stable' && trend.confidence > 0.6) {
                    insights.push({
                        id: `insight-trend-${param}-${Date.now()}`,
                        type: 'trend',
                        title: `${param}趋势变化`,
                        description: `${param}呈${trend.trendDirection === 'increasing' ? '上升' : '下降'}趋势，置信度${Math.round(trend.confidence * 100)}%`,
                        severity: 'info',
                        relatedDataIds: paramData.map(d => d.id),
                        suggestedActions: ['持续监测该指标变化', '分析可能的影响因素'],
                        confidence: trend.confidence
                    });
                }
            }
        });

        // 5. 数据质量洞察
        const qualityAssessment = this.assessDataQuality(data);
        if (qualityAssessment.overallScore < 80) {
            insights.push({
                id: `insight-quality-${Date.now()}`,
                type: 'quality',
                title: '数据质量待提升',
                description: `数据质量评分${qualityAssessment.overallScore}分，${qualityAssessment.recommendations[0] || '建议改进数据录入流程'}`,
                severity: qualityAssessment.overallScore < 60 ? 'critical' : 'warning',
                relatedDataIds: [],
                suggestedActions: qualityAssessment.recommendations,
                confidence: 0.9
            });
        }

        return insights;
    }

    // ================= 辅助方法 =================

    /**
     * 按参数分组数据
     * @private
     */
    _groupByParameter(data) {
        const grouped = {};
        data.forEach(record => {
            if (!grouped[record.parameter]) {
                grouped[record.parameter] = [];
            }
            grouped[record.parameter].push(record);
        });
        return grouped;
    }

    /**
     * 计算百分位数
     * @private
     */
    _calculatePercentile(sortedValues, percentile) {
        if (!sortedValues || sortedValues.length === 0) return 0;
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return sortedValues[lower];
        return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
    }
}

// ================= 导出 =================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DataProcessingSimulation,
        DataImportExport,
        DataVisualization,
        AIAnalysisEngine,
        ProcessingPhase,
        PROCESSING_PHASE_ORDER,
        ProcessingPhaseNames,
        DataStatus,
        PARAMETER_REFERENCE_RANGES,
        QC_THRESHOLDS,
        DATA_PROCESSING_STORAGE_KEY,
        createInitialProcessingState,
        // UI functions - Data Entry
        SAMPLE_TYPES,
        MONITORING_PARAMETERS,
        createDataEntryForm,
        createDataListTable,
        createDataDetailPanel,
        createDataEntryUI,
        showNotification,
        showDataDetailModal,
        // UI functions - Data Review
        createDataReviewUI,
        createPhaseIndicator,
        createReviewDataList,
        createReviewToolPanel,
        // UI functions - Statistics
        createStatisticsUI,
        createDataSelector,
        createStatisticsMethodSelector,
        renderStatisticsResult,
        renderSimpleBarChart,
        // UI functions - Quality Control
        createQualityControlUI,
        createQCTypeSelector,
        createQCDataForm,
        renderQCResults,
        getQCTypeName,
        formatThreshold,
        // UI functions - Report
        createReportUI,
        createReportTemplateSelector,
        createReportSummaryPanel,
        renderReportPreview,
        formatReportPreview,
        showCompletionModal,
        getDimensionName
    };
}
