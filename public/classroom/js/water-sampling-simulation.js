/**
 * 地表水采样虚拟仿真模块
 * Water Sampling Simulation Module
 * 
 * 根据 HJ/T 91-2002《地表水和污水监测技术规范》
 * 提供完整的地表水采样虚拟仿真体验
 */

// ================= 仿真阶段枚举 =================

/**
 * 仿真阶段类型
 * @typedef {'point_selection'|'equipment_prep'|'sampling'|'field_test'|'preservation'|'complete'} SimulationPhase
 */
const SimulationPhase = {
    POINT_SELECTION: 'point_selection',     // 采样点位选择
    EQUIPMENT_PREP: 'equipment_prep',       // 器具准备
    SAMPLING: 'sampling',                   // 采样操作
    FIELD_TEST: 'field_test',               // 现场测定
    PRESERVATION: 'preservation',           // 样品保存
    COMPLETE: 'complete'                    // 完成
};

/**
 * 仿真阶段顺序
 */
const SIMULATION_PHASE_ORDER = [
    SimulationPhase.POINT_SELECTION,
    SimulationPhase.EQUIPMENT_PREP,
    SimulationPhase.SAMPLING,
    SimulationPhase.FIELD_TEST,
    SimulationPhase.PRESERVATION,
    SimulationPhase.COMPLETE
];

/**
 * 仿真阶段中文名称
 */
const SimulationPhaseNames = {
    [SimulationPhase.POINT_SELECTION]: '采样点位选择',
    [SimulationPhase.EQUIPMENT_PREP]: '器具准备',
    [SimulationPhase.SAMPLING]: '采样操作',
    [SimulationPhase.FIELD_TEST]: '现场测定',
    [SimulationPhase.PRESERVATION]: '样品保存',
    [SimulationPhase.COMPLETE]: '完成'
};

// ================= 数据模型接口 =================

/**
 * 河流配置接口
 * @typedef {Object} RiverConfig
 * @property {number} width - 河流宽度(米)
 * @property {number} depth - 平均水深(米)
 * @property {'left'|'right'} flowDirection - 水流方向
 * @property {{x: number, y: number, type: string}} pollutionSource - 污染源位置
 * @property {Array<{x: number, y: number, name: string}>} landmarks - 地标
 */

/**
 * 采样点位接口
 * @typedef {Object} SamplingPoint
 * @property {string} id - 点位ID
 * @property {string} sectionId - 所属断面ID
 * @property {{x: number, y: number, depth: number}} position - 位置
 * @property {'surface'|'middle'|'bottom'} type - 采样类型
 * @property {boolean} isValid - 是否有效
 * @property {string} [validationMessage] - 验证消息
 */

/**
 * 采样器具接口
 * @typedef {Object} Equipment
 * @property {string} id - 器具ID
 * @property {string} name - 器具名称
 * @property {'bottle'|'sampler'|'preservative'|'tool'} type - 器具类型
 * @property {string} material - 材质
 * @property {number} [volume] - 容量(mL)
 * @property {string[]} suitableFor - 适用监测项目
 * @property {string} notes - 使用注意事项
 */

/**
 * 采样操作接口
 * @typedef {Object} SamplingOperation
 * @property {string} id - 操作ID
 * @property {string} pointId - 点位ID
 * @property {'rinse'|'sample'|'seal'|'label'} step - 操作步骤
 * @property {number} timestamp - 时间戳
 * @property {number} duration - 持续时间
 * @property {boolean} isCorrect - 是否正确
 * @property {string} [notes] - 备注
 */

/**
 * 现场测定接口
 * @typedef {Object} FieldMeasurement
 * @property {string} id - 测定ID
 * @property {string} pointId - 点位ID
 * @property {'temperature'|'pH'|'DO'|'conductivity'|'turbidity'} parameter - 参数
 * @property {number} value - 测定值
 * @property {string} unit - 单位
 * @property {number} timestamp - 时间戳
 */

/**
 * 保存记录接口
 * @typedef {Object} PreservationRecord
 * @property {string} id - 记录ID
 * @property {string} sampleId - 样品ID
 * @property {string} method - 保存方法
 * @property {string} parameter - 监测项目
 * @property {boolean} isCorrect - 是否正确
 * @property {number} timestamp - 时间戳
 */

/**
 * 操作错误接口
 * @typedef {Object} OperationError
 * @property {string} id - 错误ID
 * @property {string} phase - 阶段
 * @property {string} description - 描述
 * @property {number} deduction - 扣分
 * @property {number} timestamp - 时间戳
 */

/**
 * 仿真状态接口
 * @typedef {Object} SimulationState
 * @property {SimulationPhase} phase - 当前阶段
 * @property {RiverConfig} riverConfig - 河流配置
 * @property {SamplingPoint[]} selectedPoints - 已选采样点
 * @property {Equipment[]} selectedEquipment - 已选器具
 * @property {SamplingOperation[]} samplingOperations - 采样操作记录
 * @property {FieldMeasurement[]} fieldMeasurements - 现场测定记录
 * @property {PreservationRecord[]} preservationMethods - 保存方法记录
 * @property {OperationError[]} errors - 操作错误记录
 * @property {number} startTime - 开始时间
 * @property {number} elapsedTime - 已用时间
 */

/**
 * 仿真配置接口
 * @typedef {Object} SimulationConfig
 * @property {string} taskId - 任务ID
 * @property {RiverConfig} riverConfig - 河流配置
 * @property {string[]} monitoringParameters - 监测项目
 */

/**
 * 验证结果接口
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 是否有效
 * @property {string} [message] - 消息
 * @property {string[]} [warnings] - 警告列表
 */

/**
 * 操作结果接口
 * @typedef {Object} OperationResult
 * @property {boolean} success - 是否成功
 * @property {string} [message] - 消息
 * @property {Object} [data] - 数据
 */

// ================= 默认配置 =================

/**
 * 默认河流配置
 */
const DEFAULT_RIVER_CONFIG = {
    width: 50,
    depth: 2,
    flowDirection: 'right',
    pollutionSource: { x: 100, y: 150, type: 'industrial' },
    landmarks: [
        { x: 50, y: 50, name: '工业园区' },
        { x: 200, y: 100, name: '监测断面' }
    ]
};

/**
 * 创建初始仿真状态
 * @param {RiverConfig} [riverConfig] - 河流配置
 * @returns {SimulationState}
 */
function createInitialState(riverConfig = DEFAULT_RIVER_CONFIG) {
    return {
        phase: SimulationPhase.POINT_SELECTION,
        riverConfig: { ...riverConfig },
        selectedPoints: [],
        selectedEquipment: [],
        samplingOperations: [],
        fieldMeasurements: [],
        preservationMethods: [],
        errors: [],
        startTime: Date.now(),
        elapsedTime: 0
    };
}

// ================= localStorage 键名 =================

const STORAGE_KEY = 'water_sampling_simulation_state';

// ================= HJ/T 91-2002 点位验证规则 =================

/**
 * HJ/T 91-2002 采样点位验证规则配置
 * 根据《地表水和污水监测技术规范》
 */
const HJT91_VALIDATION_RULES = {
    // 距岸距离要求：采样点应距河岸一定距离，避免岸边效应
    minDistanceFromBankRatio: 0.1,  // 最小距岸距离为河宽的10%
    
    // 表层采样深度要求：水面下0.3-0.5m，或水深的20%以内
    surfaceDepthMaxRatio: 0.2,      // 表层采样最大深度为水深的20%
    surfaceDepthAbsoluteMax: 0.5,   // 表层采样绝对最大深度0.5m
    
    // 中层采样深度要求：水深的40%-60%
    middleDepthMinRatio: 0.4,       // 中层采样最小深度比例
    middleDepthMaxRatio: 0.6,       // 中层采样最大深度比例
    
    // 底层采样深度要求：距河底0.5m以内，或水深的80%以上
    bottomDepthMinRatio: 0.8,       // 底层采样最小深度为水深的80%
    bottomDepthFromBottomMax: 0.5,  // 底层采样距河底最大距离0.5m
    
    // 河流宽度分类（用于确定断面布设）
    narrowRiverMaxWidth: 50,        // 小河：宽度≤50m
    mediumRiverMaxWidth: 100,       // 中等河流：50m < 宽度 ≤ 100m
    
    // 采样点数量要求（根据河宽）
    narrowRiverMinPoints: 1,        // 小河至少1个垂线
    mediumRiverMinPoints: 2,        // 中等河流至少2个垂线
    wideRiverMinPoints: 3           // 大河至少3个垂线
};

/**
 * 验证采样点位是否符合 HJ/T 91-2002 规范
 * @param {SamplingPoint} point - 采样点位
 * @param {RiverConfig} riverConfig - 河流配置
 * @returns {ValidationResult} 验证结果
 */
function validateSamplingPointHJT91(point, riverConfig) {
    const warnings = [];
    const errors = [];
    const rules = HJT91_VALIDATION_RULES;

    // 1. 检查是否在河流范围内（基本边界检查）
    if (point.position.x < 0 || point.position.x > riverConfig.width) {
        return { 
            isValid: false, 
            message: '【HJ/T 91-2002】采样点位超出河流范围：横向位置必须在0到河宽之间',
            warnings: [],
            errors: ['采样点位超出河流范围']
        };
    }

    // 2. 检查深度是否合理（基本边界检查）
    if (point.position.depth < 0) {
        return { 
            isValid: false, 
            message: '【HJ/T 91-2002】采样深度无效：深度不能为负值',
            warnings: [],
            errors: ['采样深度为负值']
        };
    }
    
    if (point.position.depth > riverConfig.depth) {
        return { 
            isValid: false, 
            message: '【HJ/T 91-2002】采样深度超出水深范围：采样深度不能超过河流水深',
            warnings: [],
            errors: ['采样深度超出水深范围']
        };
    }

    // 3. 检查距岸距离（HJ/T 91-2002 要求）
    const distanceFromLeftBank = point.position.x;
    const distanceFromRightBank = riverConfig.width - point.position.x;
    const distanceFromBank = Math.min(distanceFromLeftBank, distanceFromRightBank);
    const minDistanceFromBank = riverConfig.width * rules.minDistanceFromBankRatio;
    
    if (distanceFromBank < minDistanceFromBank) {
        const nearBank = distanceFromLeftBank < distanceFromRightBank ? '左岸' : '右岸';
        warnings.push(
            `【HJ/T 91-2002 4.2.2】采样点距${nearBank}过近（${distanceFromBank.toFixed(1)}m），` +
            `建议距岸距离不小于河宽的10%（${minDistanceFromBank.toFixed(1)}m），以避免岸边效应影响水样代表性`
        );
    }

    // 4. 根据采样类型检查深度比例
    const depthRatio = point.position.depth / riverConfig.depth;
    
    if (point.type === 'surface') {
        // 表层采样深度检查
        const maxSurfaceDepth = Math.min(
            riverConfig.depth * rules.surfaceDepthMaxRatio,
            rules.surfaceDepthAbsoluteMax
        );
        
        if (point.position.depth > maxSurfaceDepth) {
            warnings.push(
                `【HJ/T 91-2002 4.3.1】表层采样深度过深（${point.position.depth.toFixed(2)}m），` +
                `表层采样应在水面下0.3-0.5m或水深的20%以内（建议≤${maxSurfaceDepth.toFixed(2)}m）`
            );
        }
    } else if (point.type === 'middle') {
        // 中层采样深度检查
        const minMiddleDepth = riverConfig.depth * rules.middleDepthMinRatio;
        const maxMiddleDepth = riverConfig.depth * rules.middleDepthMaxRatio;
        
        if (point.position.depth < minMiddleDepth || point.position.depth > maxMiddleDepth) {
            warnings.push(
                `【HJ/T 91-2002 4.3.2】中层采样深度不在推荐范围内（当前${point.position.depth.toFixed(2)}m），` +
                `中层采样应在水深的40%-60%处（${minMiddleDepth.toFixed(2)}m - ${maxMiddleDepth.toFixed(2)}m）`
            );
        }
    } else if (point.type === 'bottom') {
        // 底层采样深度检查
        const minBottomDepth = riverConfig.depth * rules.bottomDepthMinRatio;
        const distanceFromBottom = riverConfig.depth - point.position.depth;
        
        if (point.position.depth < minBottomDepth) {
            warnings.push(
                `【HJ/T 91-2002 4.3.3】底层采样深度不足（当前${point.position.depth.toFixed(2)}m），` +
                `底层采样应在水深的80%以上（建议≥${minBottomDepth.toFixed(2)}m）`
            );
        }
        
        if (distanceFromBottom > rules.bottomDepthFromBottomMax) {
            warnings.push(
                `【HJ/T 91-2002 4.3.3】底层采样距河底过远（${distanceFromBottom.toFixed(2)}m），` +
                `底层采样应距河底0.5m以内`
            );
        }
    }

    // 5. 检查河流宽度与采样点布设建议
    if (riverConfig.width <= rules.narrowRiverMaxWidth) {
        // 小河：建议在河流中心线采样
        const centerX = riverConfig.width / 2;
        const distanceFromCenter = Math.abs(point.position.x - centerX);
        const maxDistanceFromCenter = riverConfig.width * 0.2; // 允许偏离中心20%
        
        if (distanceFromCenter > maxDistanceFromCenter) {
            warnings.push(
                `【HJ/T 91-2002 4.2.1】对于宽度≤50m的小河，建议在河流中心线附近采样，` +
                `当前点位偏离中心${distanceFromCenter.toFixed(1)}m`
            );
        }
    }

    // 构建返回结果
    const isValid = errors.length === 0;
    let message = '';
    
    if (!isValid) {
        message = errors.join('; ');
    } else if (warnings.length > 0) {
        message = warnings.join('\n');
    } else {
        message = '点位符合HJ/T 91-2002规范要求';
    }

    return { 
        isValid, 
        message,
        warnings,
        errors
    };
}

/**
 * 获取采样点位验证的详细报告
 * @param {SamplingPoint} point - 采样点位
 * @param {RiverConfig} riverConfig - 河流配置
 * @returns {Object} 详细验证报告
 */
function getSamplingPointValidationReport(point, riverConfig) {
    const validation = validateSamplingPointHJT91(point, riverConfig);
    const rules = HJT91_VALIDATION_RULES;
    
    // 计算各项指标
    const distanceFromLeftBank = point.position.x;
    const distanceFromRightBank = riverConfig.width - point.position.x;
    const distanceFromBank = Math.min(distanceFromLeftBank, distanceFromRightBank);
    const minDistanceFromBank = riverConfig.width * rules.minDistanceFromBankRatio;
    const depthRatio = point.position.depth / riverConfig.depth;
    
    return {
        validation,
        metrics: {
            distanceFromLeftBank: distanceFromLeftBank.toFixed(2),
            distanceFromRightBank: distanceFromRightBank.toFixed(2),
            distanceFromBank: distanceFromBank.toFixed(2),
            minDistanceFromBankRequired: minDistanceFromBank.toFixed(2),
            depthRatio: (depthRatio * 100).toFixed(1) + '%',
            samplingDepth: point.position.depth.toFixed(2),
            riverDepth: riverConfig.depth.toFixed(2),
            riverWidth: riverConfig.width.toFixed(2)
        },
        recommendations: generateSamplingRecommendations(point, riverConfig),
        standardReference: 'HJ/T 91-2002《地表水和污水监测技术规范》'
    };
}

/**
 * 生成采样点位改进建议
 * @param {SamplingPoint} point - 采样点位
 * @param {RiverConfig} riverConfig - 河流配置
 * @returns {string[]} 改进建议列表
 */
function generateSamplingRecommendations(point, riverConfig) {
    const recommendations = [];
    const rules = HJT91_VALIDATION_RULES;
    
    // 距岸距离建议
    const distanceFromBank = Math.min(point.position.x, riverConfig.width - point.position.x);
    const minDistanceFromBank = riverConfig.width * rules.minDistanceFromBankRatio;
    
    if (distanceFromBank < minDistanceFromBank) {
        const suggestedX = point.position.x < riverConfig.width / 2 
            ? minDistanceFromBank 
            : riverConfig.width - minDistanceFromBank;
        recommendations.push(`建议将横向位置调整至 ${suggestedX.toFixed(1)}m 处`);
    }
    
    // 深度建议
    if (point.type === 'surface') {
        const maxSurfaceDepth = Math.min(
            riverConfig.depth * rules.surfaceDepthMaxRatio,
            rules.surfaceDepthAbsoluteMax
        );
        if (point.position.depth > maxSurfaceDepth) {
            recommendations.push(`建议将表层采样深度调整至 ${maxSurfaceDepth.toFixed(2)}m 以内`);
        }
    } else if (point.type === 'middle') {
        const idealMiddleDepth = riverConfig.depth * 0.5;
        if (Math.abs(point.position.depth - idealMiddleDepth) > riverConfig.depth * 0.1) {
            recommendations.push(`建议将中层采样深度调整至 ${idealMiddleDepth.toFixed(2)}m 附近`);
        }
    } else if (point.type === 'bottom') {
        const idealBottomDepth = riverConfig.depth * 0.9;
        if (point.position.depth < riverConfig.depth * rules.bottomDepthMinRatio) {
            recommendations.push(`建议将底层采样深度调整至 ${idealBottomDepth.toFixed(2)}m 附近`);
        }
    }
    
    return recommendations;
}

/**
 * 显示点位验证警告提示
 * @param {ValidationResult} validation - 验证结果
 * @param {HTMLElement} [container] - 显示容器（可选）
 * @returns {HTMLElement|null} 创建的警告元素
 */
function showPointValidationWarning(validation, container = null) {
    if (validation.isValid && (!validation.warnings || validation.warnings.length === 0)) {
        return null;
    }
    
    // 创建警告元素
    const warningDiv = document.createElement('div');
    warningDiv.className = 'point-validation-warning';
    warningDiv.style.cssText = `
        background: ${validation.isValid ? '#fff3cd' : '#f8d7da'};
        border: 1px solid ${validation.isValid ? '#ffc107' : '#f5c6cb'};
        border-radius: 8px;
        padding: 12px 16px;
        margin: 10px 0;
        font-size: 14px;
        line-height: 1.6;
    `;
    
    // 标题
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
        font-weight: bold;
        color: ${validation.isValid ? '#856404' : '#721c24'};
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    titleDiv.innerHTML = `
        <span style="font-size: 18px;">${validation.isValid ? '⚠️' : '❌'}</span>
        <span>${validation.isValid ? '点位验证警告' : '点位验证失败'}</span>
    `;
    warningDiv.appendChild(titleDiv);
    
    // 消息内容
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        color: ${validation.isValid ? '#856404' : '#721c24'};
        white-space: pre-line;
    `;
    messageDiv.textContent = validation.message;
    warningDiv.appendChild(messageDiv);
    
    // 如果有容器，添加到容器中
    if (container) {
        // 移除之前的警告
        const existingWarning = container.querySelector('.point-validation-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        container.appendChild(warningDiv);
    }
    
    return warningDiv;
}

/**
 * 显示器具不匹配警告提示
 * @param {ValidationResult} validation - 验证结果
 * @param {HTMLElement} [container] - 显示容器（可选）
 * @returns {HTMLElement|null} 创建的警告元素
 */
function showEquipmentMismatchWarning(validation, container = null) {
    if (validation.isValid && (!validation.warnings || validation.warnings.length === 0)) {
        return null;
    }
    
    // 创建警告元素
    const warningDiv = document.createElement('div');
    warningDiv.className = 'equipment-mismatch-warning';
    warningDiv.style.cssText = `
        background: ${validation.isValid ? '#fff3cd' : '#f8d7da'};
        border: 1px solid ${validation.isValid ? '#ffc107' : '#f5c6cb'};
        border-radius: 8px;
        padding: 12px 16px;
        margin: 10px 0;
        font-size: 14px;
        line-height: 1.6;
    `;
    
    // 标题
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
        font-weight: bold;
        color: ${validation.isValid ? '#856404' : '#721c24'};
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    titleDiv.innerHTML = `
        <span style="font-size: 18px;">${validation.isValid ? '⚠️' : '❌'}</span>
        <span>${validation.isValid ? '器具选择提示' : '器具选择不匹配'}</span>
    `;
    warningDiv.appendChild(titleDiv);
    
    // 消息内容
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        color: ${validation.isValid ? '#856404' : '#721c24'};
        white-space: pre-line;
    `;
    messageDiv.textContent = validation.message;
    warningDiv.appendChild(messageDiv);
    
    // 如果有规则描述，显示推荐信息
    if (validation.rules && validation.rules.description) {
        const descDiv = document.createElement('div');
        descDiv.style.cssText = `
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed ${validation.isValid ? '#ffc107' : '#f5c6cb'};
            font-size: 12px;
            color: #666;
        `;
        descDiv.innerHTML = `<strong>📋 标准要求：</strong>${validation.rules.description}`;
        warningDiv.appendChild(descDiv);
    }
    
    // 如果有容器，添加到容器中
    if (container) {
        // 移除之前的警告
        const existingWarning = container.querySelector('.equipment-mismatch-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        container.appendChild(warningDiv);
    }
    
    return warningDiv;
}

// ================= WaterSamplingSimulation 类 =================

/**
 * 地表水采样虚拟仿真管理器
 */
class WaterSamplingSimulation {
    /**
     * @param {SimulationConfig} [config] - 仿真配置
     */
    constructor(config = null) {
        /** @type {SimulationState} */
        this._state = null;
        /** @type {SimulationConfig} */
        this._config = config;
        /** @type {Function[]} */
        this._listeners = [];
    }

    /**
     * 初始化仿真
     * @param {SimulationConfig} config - 仿真配置
     */
    init(config) {
        this._config = config;
        const riverConfig = config?.riverConfig || DEFAULT_RIVER_CONFIG;
        this._state = createInitialState(riverConfig);
        this._saveState();
        this._notifyListeners();
    }

    /**
     * 获取当前状态
     * @returns {SimulationState}
     */
    getState() {
        if (!this._state) {
            this._loadState();
        }
        return this._state ? { ...this._state } : null;
    }

    /**
     * 获取当前阶段
     * @returns {SimulationPhase}
     */
    getPhase() {
        return this._state?.phase || SimulationPhase.POINT_SELECTION;
    }

    /**
     * 设置阶段
     * @param {SimulationPhase} phase - 目标阶段
     * @returns {ValidationResult}
     */
    setPhase(phase) {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        // 验证阶段转换是否有效
        const validationResult = this._validatePhaseTransition(this._state.phase, phase);
        if (!validationResult.isValid) {
            return validationResult;
        }

        this._state.phase = phase;
        this._state.elapsedTime = Date.now() - this._state.startTime;
        this._saveState();
        this._notifyListeners();

        return { isValid: true, message: `已进入${SimulationPhaseNames[phase]}阶段` };
    }

    /**
     * 验证阶段转换
     * @param {SimulationPhase} currentPhase - 当前阶段
     * @param {SimulationPhase} targetPhase - 目标阶段
     * @returns {ValidationResult}
     * @private
     */
    _validatePhaseTransition(currentPhase, targetPhase) {
        const currentIndex = SIMULATION_PHASE_ORDER.indexOf(currentPhase);
        const targetIndex = SIMULATION_PHASE_ORDER.indexOf(targetPhase);

        // 检查目标阶段是否有效
        if (targetIndex === -1) {
            return { isValid: false, message: '无效的目标阶段' };
        }

        // 允许前进到下一阶段或回退到之前的阶段
        if (targetIndex <= currentIndex + 1) {
            return { isValid: true };
        }

        // 不允许跳过阶段
        return { 
            isValid: false, 
            message: `不能从${SimulationPhaseNames[currentPhase]}直接跳转到${SimulationPhaseNames[targetPhase]}` 
        };
    }

    /**
     * 前进到下一阶段
     * @returns {ValidationResult}
     */
    nextPhase() {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        const currentIndex = SIMULATION_PHASE_ORDER.indexOf(this._state.phase);
        if (currentIndex >= SIMULATION_PHASE_ORDER.length - 1) {
            return { isValid: false, message: '已经是最后阶段' };
        }

        const nextPhase = SIMULATION_PHASE_ORDER[currentIndex + 1];
        return this.setPhase(nextPhase);
    }

    /**
     * 回退到上一阶段
     * @returns {ValidationResult}
     */
    previousPhase() {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        const currentIndex = SIMULATION_PHASE_ORDER.indexOf(this._state.phase);
        if (currentIndex <= 0) {
            return { isValid: false, message: '已经是第一阶段' };
        }

        const prevPhase = SIMULATION_PHASE_ORDER[currentIndex - 1];
        return this.setPhase(prevPhase);
    }

    /**
     * 添加采样点位
     * @param {SamplingPoint} point - 采样点位
     * @returns {ValidationResult}
     */
    addSamplingPoint(point) {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        // 验证点位
        const validation = this._validateSamplingPoint(point);
        
        // 添加点位（即使无效也添加，但标记为无效）
        const pointWithValidation = {
            ...point,
            id: point.id || `point-${Date.now()}`,
            isValid: validation.isValid,
            validationMessage: validation.message
        };

        this._state.selectedPoints.push(pointWithValidation);
        
        // 如果点位无效，记录错误
        if (!validation.isValid) {
            this._addError('point_selection', validation.message, 5);
        }

        this._saveState();
        this._notifyListeners();

        return validation;
    }

    /**
     * 验证采样点位
     * @param {SamplingPoint} point - 采样点位
     * @returns {ValidationResult}
     * @private
     */
    _validateSamplingPoint(point) {
        return validateSamplingPointHJT91(point, this._state.riverConfig);
    }

    /**
     * 移除采样点位
     * @param {string} pointId - 点位ID
     * @returns {boolean}
     */
    removeSamplingPoint(pointId) {
        if (!this._state) return false;

        const index = this._state.selectedPoints.findIndex(p => p.id === pointId);
        if (index === -1) return false;

        this._state.selectedPoints.splice(index, 1);
        this._saveState();
        this._notifyListeners();
        return true;
    }

    /**
     * 选择器具
     * @param {Equipment} equipment - 器具
     */
    selectEquipment(equipment) {
        if (!this._state) return;

        // 检查是否已选择
        const exists = this._state.selectedEquipment.some(e => e.id === equipment.id);
        if (!exists) {
            this._state.selectedEquipment.push({ ...equipment });
            this._saveState();
            this._notifyListeners();
        }
    }

    /**
     * 移除器具
     * @param {string} equipmentId - 器具ID
     * @returns {boolean}
     */
    removeEquipment(equipmentId) {
        if (!this._state) return false;

        const index = this._state.selectedEquipment.findIndex(e => e.id === equipmentId);
        if (index === -1) return false;

        this._state.selectedEquipment.splice(index, 1);
        this._saveState();
        this._notifyListeners();
        return true;
    }

    /**
     * 获取工具箱中的所有器具
     * @returns {Equipment[]} 已选器具列表
     */
    getSelectedEquipment() {
        if (!this._state) return [];
        return [...this._state.selectedEquipment];
    }

    /**
     * 检查器具是否在工具箱中
     * @param {string} equipmentId - 器具ID
     * @returns {boolean}
     */
    hasEquipment(equipmentId) {
        if (!this._state) return false;
        return this._state.selectedEquipment.some(e => e.id === equipmentId);
    }

    /**
     * 清空工具箱
     */
    clearToolbox() {
        if (!this._state) return;
        this._state.selectedEquipment = [];
        this._saveState();
        this._notifyListeners();
    }

    /**
     * 获取工具箱中器具数量
     * @returns {number}
     */
    getToolboxCount() {
        if (!this._state) return 0;
        return this._state.selectedEquipment.length;
    }

    /**
     * 验证器具选择是否匹配监测项目
     * @param {string} monitoringParameter - 监测项目
     * @returns {ValidationResult}
     */
    validateEquipmentForParameter(monitoringParameter) {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        const selectedEquipment = this._state.selectedEquipment;
        const rules = EQUIPMENT_MATCHING_RULES[monitoringParameter];
        
        if (!rules) {
            return { isValid: true, message: '未知监测项目，无法验证器具匹配', warnings: [], errors: [] };
        }

        const warnings = [];
        const errors = [];
        const selectedIds = selectedEquipment.map(e => e.id);

        // 检查必需的采样瓶
        if (rules.requiredBottle && rules.requiredBottle.length > 0) {
            const hasRequiredBottle = rules.requiredBottle.some(id => selectedIds.includes(id));
            if (!hasRequiredBottle) {
                const requiredNames = rules.requiredBottle
                    .map(id => EQUIPMENT_DATABASE.find(e => e.id === id)?.name)
                    .filter(Boolean)
                    .join('或');
                errors.push(`缺少必需的采样瓶：${requiredNames}`);
            }
        }

        // 检查必需的保存剂
        if (rules.requiredPreservative && rules.requiredPreservative.length > 0) {
            const hasRequiredPreservative = rules.requiredPreservative.some(id => selectedIds.includes(id));
            if (!hasRequiredPreservative) {
                const requiredNames = rules.requiredPreservative
                    .map(id => EQUIPMENT_DATABASE.find(e => e.id === id)?.name)
                    .filter(Boolean)
                    .join('或');
                errors.push(`缺少必需的保存剂：${requiredNames}`);
            }
        }

        // 检查必需的工具
        if (rules.requiredTools && rules.requiredTools.length > 0) {
            const missingTools = rules.requiredTools.filter(id => !selectedIds.includes(id));
            if (missingTools.length > 0) {
                const missingNames = missingTools
                    .map(id => EQUIPMENT_DATABASE.find(e => e.id === id)?.name)
                    .filter(Boolean)
                    .join('、');
                warnings.push(`建议添加工具：${missingNames}`);
            }
        }

        // 检查是否有不适合的器具（不匹配提示）
        selectedEquipment.forEach(equipment => {
            if (equipment.suitableFor && 
                !equipment.suitableFor.includes(monitoringParameter) && 
                !equipment.suitableFor.includes('all') && 
                !equipment.suitableFor.includes('general')) {
                warnings.push(`${equipment.name} 可能不适用于 ${monitoringParameter} 监测`);
            }
        });

        const isValid = errors.length === 0;
        let message = '';
        
        if (errors.length > 0) {
            message = errors.join('\n');
        } else if (warnings.length > 0) {
            message = warnings.join('\n');
        } else {
            message = `器具选择符合 ${monitoringParameter} 监测要求`;
        }

        return { isValid, message, warnings, errors, rules };
    }

    /**
     * 获取器具不匹配警告信息
     * @param {Equipment} equipment - 器具
     * @param {string} monitoringParameter - 监测项目
     * @returns {string|null} 警告信息，如果匹配则返回null
     */
    getEquipmentMismatchWarning(equipment, monitoringParameter) {
        if (!equipment.suitableFor) {
            return null;
        }
        
        // 检查器具是否适用于该监测项目
        if (equipment.suitableFor.includes(monitoringParameter) || 
            equipment.suitableFor.includes('all') || 
            equipment.suitableFor.includes('general')) {
            return null;
        }
        
        return `${equipment.name} 可能不适用于 ${monitoringParameter} 监测，建议选择适合的器具`;
    }

    /**
     * 执行采样操作
     * @param {SamplingOperation} operation - 操作
     * @returns {OperationResult}
     */
    performOperation(operation) {
        if (!this._state) {
            return { success: false, message: '仿真未初始化' };
        }

        // 验证操作序列
        const validation = this._validateOperationSequence(operation);
        
        const operationRecord = {
            ...operation,
            id: operation.id || `op-${Date.now()}`,
            timestamp: Date.now(),
            isCorrect: validation.isValid
        };

        this._state.samplingOperations.push(operationRecord);

        // 如果操作不正确，记录错误
        if (!validation.isValid) {
            this._addError('sampling', validation.message, 10);
        }

        this._saveState();
        this._notifyListeners();

        return { 
            success: true, 
            message: validation.isValid ? '操作正确' : validation.message,
            data: operationRecord
        };
    }

    /**
     * 验证操作序列
     * @param {SamplingOperation} operation - 操作
     * @returns {ValidationResult}
     * @private
     */
    _validateOperationSequence(operation) {
        const pointOperations = this._state.samplingOperations.filter(
            op => op.pointId === operation.pointId
        );

        // 检查是否跳过了冲洗步骤
        if (operation.step === 'sample') {
            const hasRinse = pointOperations.some(op => op.step === 'rinse');
            if (!hasRinse) {
                return { 
                    isValid: false, 
                    message: '采样前应先进行冲洗操作' 
                };
            }
        }

        // 检查是否跳过了采样步骤
        if (operation.step === 'seal') {
            const hasSample = pointOperations.some(op => op.step === 'sample');
            if (!hasSample) {
                return { 
                    isValid: false, 
                    message: '封口前应先完成采样操作' 
                };
            }
        }

        // 检查是否跳过了封口步骤
        if (operation.step === 'label') {
            const hasSeal = pointOperations.some(op => op.step === 'seal');
            if (!hasSeal) {
                return { 
                    isValid: false, 
                    message: '贴标签前应先完成封口操作' 
                };
            }
        }

        return { isValid: true };
    }

    /**
     * 记录现场测定
     * @param {FieldMeasurement} measurement - 测定记录
     */
    recordMeasurement(measurement) {
        if (!this._state) return;

        const record = {
            ...measurement,
            id: measurement.id || `measure-${Date.now()}`,
            timestamp: Date.now()
        };

        this._state.fieldMeasurements.push(record);
        this._saveState();
        this._notifyListeners();
    }

    /**
     * 设置保存方法
     * @param {PreservationRecord} record - 保存记录
     * @returns {ValidationResult}
     */
    setPreservation(record) {
        if (!this._state) {
            return { isValid: false, message: '仿真未初始化' };
        }

        // 验证保存方法
        const validation = this._validatePreservationMethod(record);

        const preservationRecord = {
            ...record,
            id: record.id || `preserve-${Date.now()}`,
            timestamp: Date.now(),
            isCorrect: validation.isValid
        };

        this._state.preservationMethods.push(preservationRecord);

        // 如果保存方法不正确，记录错误
        if (!validation.isValid) {
            this._addError('preservation', validation.message, 5);
        }

        this._saveState();
        this._notifyListeners();

        return validation;
    }

    /**
     * 验证保存方法
     * @param {PreservationRecord} record - 保存记录
     * @returns {ValidationResult}
     * @private
     */
    _validatePreservationMethod(record) {
        // 保存方法与监测项目的匹配规则
        const preservationRules = {
            'temperature': ['none'],
            'pH': ['none'],
            'DO': ['none', 'fixation'],
            'COD': ['acid', 'refrigeration'],
            'BOD': ['refrigeration'],
            'ammonia': ['acid', 'refrigeration'],
            'nitrate': ['refrigeration'],
            'phosphate': ['refrigeration'],
            'heavy_metals': ['acid']
        };

        const validMethods = preservationRules[record.parameter];
        if (!validMethods) {
            return { isValid: true, message: '未知监测项目，无法验证' };
        }

        if (!validMethods.includes(record.method)) {
            return { 
                isValid: false, 
                message: `${record.parameter}的保存方法应为: ${validMethods.join('或')}` 
            };
        }

        return { isValid: true };
    }

    /**
     * 添加错误记录
     * @param {string} phase - 阶段
     * @param {string} description - 描述
     * @param {number} deduction - 扣分
     * @private
     */
    _addError(phase, description, deduction) {
        this._state.errors.push({
            id: `error-${Date.now()}`,
            phase,
            description,
            deduction,
            timestamp: Date.now()
        });
    }

    /**
     * 完成仿真
     * @returns {Object} 仿真结果
     */
    complete() {
        if (!this._state) {
            return null;
        }

        this._state.phase = SimulationPhase.COMPLETE;
        this._state.elapsedTime = Date.now() - this._state.startTime;
        this._saveState();
        this._notifyListeners();

        return {
            state: { ...this._state },
            summary: {
                totalPoints: this._state.selectedPoints.length,
                validPoints: this._state.selectedPoints.filter(p => p.isValid).length,
                totalEquipment: this._state.selectedEquipment.length,
                totalOperations: this._state.samplingOperations.length,
                correctOperations: this._state.samplingOperations.filter(op => op.isCorrect).length,
                totalMeasurements: this._state.fieldMeasurements.length,
                totalPreservations: this._state.preservationMethods.length,
                correctPreservations: this._state.preservationMethods.filter(p => p.isCorrect).length,
                totalErrors: this._state.errors.length,
                totalDeduction: this._state.errors.reduce((sum, e) => sum + e.deduction, 0),
                elapsedTime: this._state.elapsedTime
            }
        };
    }

    /**
     * 重置仿真
     */
    reset() {
        const riverConfig = this._config?.riverConfig || DEFAULT_RIVER_CONFIG;
        this._state = createInitialState(riverConfig);
        this._saveState();
        this._notifyListeners();
    }

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

    /**
     * 保存状态到 localStorage
     * @private
     */
    _saveState() {
        if (!this._state) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
        } catch (e) {
            console.error('Failed to save simulation state:', e);
        }
    }

    /**
     * 从 localStorage 加载状态
     * @private
     */
    _loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                this._state = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load simulation state:', e);
            this._state = null;
        }
    }

    /**
     * 清除保存的状态
     */
    clearSavedState() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear simulation state:', e);
        }
        this._state = null;
    }

    /**
     * 检查是否有保存的状态
     * @returns {boolean}
     */
    hasSavedState() {
        try {
            return localStorage.getItem(STORAGE_KEY) !== null;
        } catch (e) {
            return false;
        }
    }

    /**
     * 恢复保存的状态
     * @returns {boolean} 是否成功恢复
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

// ================= 场景渲染器 =================

/**
 * 场景渲染配置
 */
const SCENE_CONFIG = {
    // Canvas 尺寸
    canvasWidth: 800,
    canvasHeight: 500,
    
    // 河流渲染区域（相对于 Canvas）
    riverArea: {
        x: 50,
        y: 100,
        width: 700,
        height: 300
    },
    
    // 颜色配置
    colors: {
        river: '#4A90D9',
        riverDark: '#3A7BC8',
        bank: '#8B7355',
        bankGrass: '#6B8E23',
        industrialZone: '#A0A0A0',
        pollutionSource: '#FF6B6B',
        landmark: '#FFD700',
        samplingPoint: '#00FF00',
        samplingSection: '#FF4500',
        text: '#333333',
        grid: 'rgba(255, 255, 255, 0.3)'
    },
    
    // 比例尺（像素/米）
    scale: 10
};

/**
 * 河流场景渲染器
 * 负责渲染河流俯视图场景
 */
class RiverSceneRenderer {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @param {RiverConfig} riverConfig - 河流配置
     */
    constructor(canvas, riverConfig) {
        /** @type {HTMLCanvasElement} */
        this.canvas = canvas;
        /** @type {CanvasRenderingContext2D} */
        this.ctx = canvas.getContext('2d');
        /** @type {RiverConfig} */
        this.riverConfig = riverConfig;
        /** @type {Array<{x: number, y: number, id: string}>} */
        this.samplingMarkers = [];
        /** @type {Array<{y: number, id: string, points: SamplingPoint[]}>} */
        this.samplingSections = [];
        
        // 设置 Canvas 尺寸
        this.canvas.width = SCENE_CONFIG.canvasWidth;
        this.canvas.height = SCENE_CONFIG.canvasHeight;
    }

    /**
     * 渲染完整场景
     */
    render() {
        this.clear();
        this.drawBackground();
        this.drawRiverBanks();
        this.drawRiver();
        this.drawFlowDirection();
        this.drawGrid();
        this.drawLandmarks();
        this.drawPollutionSource();
        this.drawSamplingSections();
        this.drawSamplingMarkers();
        this.drawScaleBar();
        this.drawLegend();
    }

    /**
     * 清除画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制背景
     */
    drawBackground() {
        const ctx = this.ctx;
        
        // 绘制天空/背景渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#E8F4E8');
        gradient.addColorStop(1, '#D4E8D4');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制河岸
     */
    drawRiverBanks() {
        const ctx = this.ctx;
        const area = SCENE_CONFIG.riverArea;
        const bankWidth = 30;
        
        // 上河岸（北岸）
        ctx.fillStyle = SCENE_CONFIG.colors.bankGrass;
        ctx.fillRect(area.x - 10, area.y - bankWidth, area.width + 20, bankWidth);
        
        // 下河岸（南岸）
        ctx.fillRect(area.x - 10, area.y + area.height, area.width + 20, bankWidth);
        
        // 河岸边缘
        ctx.fillStyle = SCENE_CONFIG.colors.bank;
        ctx.fillRect(area.x - 10, area.y - 5, area.width + 20, 5);
        ctx.fillRect(area.x - 10, area.y + area.height, area.width + 20, 5);
    }

    /**
     * 绘制河流
     */
    drawRiver() {
        const ctx = this.ctx;
        const area = SCENE_CONFIG.riverArea;
        
        // 河流主体渐变
        const gradient = ctx.createLinearGradient(area.x, area.y, area.x, area.y + area.height);
        gradient.addColorStop(0, SCENE_CONFIG.colors.riverDark);
        gradient.addColorStop(0.5, SCENE_CONFIG.colors.river);
        gradient.addColorStop(1, SCENE_CONFIG.colors.riverDark);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(area.x, area.y, area.width, area.height);
        
        // 添加水波纹效果
        this.drawWaterRipples();
    }

    /**
     * 绘制水波纹效果
     */
    drawWaterRipples() {
        const ctx = this.ctx;
        const area = SCENE_CONFIG.riverArea;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        // 绘制波纹线
        for (let i = 0; i < 5; i++) {
            const y = area.y + (area.height / 6) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(area.x, y);
            
            for (let x = area.x; x < area.x + area.width; x += 20) {
                const waveY = y + Math.sin((x + i * 30) * 0.05) * 3;
                ctx.lineTo(x, waveY);
            }
            ctx.stroke();
        }
    }

    /**
     * 绘制水流方向指示
     */
    drawFlowDirection() {
        const ctx = this.ctx;
        const area = SCENE_CONFIG.riverArea;
        const direction = this.riverConfig.flowDirection;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px Arial';
        
        // 绘制箭头
        const arrowY = area.y + area.height / 2;
        const arrowSpacing = 100;
        
        for (let x = area.x + 50; x < area.x + area.width - 50; x += arrowSpacing) {
            this.drawArrow(x, arrowY, direction === 'right' ? 30 : -30, 0);
        }
        
        // 标注水流方向
        const labelX = direction === 'right' ? area.x + area.width - 80 : area.x + 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('水流方向 →', labelX, area.y + 20);
    }

    /**
     * 绘制箭头
     * @param {number} x - 起点 X
     * @param {number} y - 起点 Y
     * @param {number} dx - X 方向偏移
     * @param {number} dy - Y 方向偏移
     */
    drawArrow(x, y, dx, dy) {
        const ctx = this.ctx;
        const headLen = 10;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.lineTo(x + dx - headLen * Math.cos(angle - Math.PI / 6), y + dy - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x + dx - headLen * Math.cos(angle + Math.PI / 6), y + dy - headLen * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * 绘制网格
     */
    drawGrid() {
        const ctx = this.ctx;
        const area = SCENE_CONFIG.riverArea;
        const gridSize = 50; // 像素
        
        ctx.strokeStyle = SCENE_CONFIG.colors.grid;
        ctx.lineWidth = 0.5;
        
        // 垂直线
        for (let x = area.x; x <= area.x + area.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, area.y);
            ctx.lineTo(x, area.y + area.height);
            ctx.stroke();
        }
        
        // 水平线
        for (let y = area.y; y <= area.y + area.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(area.x, y);
            ctx.lineTo(area.x + area.width, y);
            ctx.stroke();
        }
    }

    /**
     * 绘制地标
     */
    drawLandmarks() {
        const ctx = this.ctx;
        const area = SCENE_CONFIG.riverArea;
        
        this.riverConfig.landmarks.forEach(landmark => {
            // 将地标坐标转换为 Canvas 坐标
            const canvasX = this.riverXToCanvas(landmark.x);
            const canvasY = landmark.y < 0 ? area.y - 50 : area.y + area.height + 30;
            
            // 绘制地标图标
            ctx.fillStyle = SCENE_CONFIG.colors.landmark;
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制地标名称
            ctx.fillStyle = SCENE_CONFIG.colors.text;
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(landmark.name, canvasX, canvasY + 20);
        });
    }

    /**
     * 绘制污染源
     */
    drawPollutionSource() {
        const ctx = this.ctx;
        const area = SCENE_CONFIG.riverArea;
        const source = this.riverConfig.pollutionSource;
        
        // 将污染源坐标转换为 Canvas 坐标
        const canvasX = this.riverXToCanvas(source.x);
        const canvasY = area.y - 40;
        
        // 绘制工业园区区域
        ctx.fillStyle = SCENE_CONFIG.colors.industrialZone;
        ctx.fillRect(canvasX - 40, canvasY - 30, 80, 40);
        
        // 绘制污染源标记
        ctx.fillStyle = SCENE_CONFIG.colors.pollutionSource;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY + 20, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制排放口指示
        ctx.strokeStyle = SCENE_CONFIG.colors.pollutionSource;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(canvasX, canvasY + 30);
        ctx.lineTo(canvasX, area.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 标注
        ctx.fillStyle = SCENE_CONFIG.colors.text;
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('污染源', canvasX, canvasY - 35);
        ctx.fillText(`(${source.type})`, canvasX, canvasY - 22);
    }

    /**
     * 绘制采样断面
     */
    drawSamplingSections() {
        const ctx = this.ctx;
        const area = SCENE_CONFIG.riverArea;
        
        this.samplingSections.forEach((section, index) => {
            const canvasX = this.riverYToCanvasX(section.y);
            
            // 绘制断面线
            ctx.strokeStyle = SCENE_CONFIG.colors.samplingSection;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(canvasX, area.y);
            ctx.lineTo(canvasX, area.y + area.height);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 绘制断面标签
            ctx.fillStyle = SCENE_CONFIG.colors.samplingSection;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`断面 ${index + 1}`, canvasX, area.y - 10);
            
            // 绘制断面上的采样点
            section.points.forEach(point => {
                this.drawSamplingPointOnSection(canvasX, point);
            });
        });
    }

    /**
     * 在断面上绘制采样点
     * @param {number} sectionX - 断面 X 坐标
     * @param {SamplingPoint} point - 采样点
     */
    drawSamplingPointOnSection(sectionX, point) {
        const ctx = this.ctx;
        const area = SCENE_CONFIG.riverArea;
        
        // 计算点位在河流中的 Y 坐标（基于 x 位置，即距左岸距离）
        const relativeX = point.position.x / this.riverConfig.width;
        const canvasY = area.y + relativeX * area.height;
        
        // 绘制采样点
        ctx.fillStyle = point.isValid ? SCENE_CONFIG.colors.samplingPoint : SCENE_CONFIG.colors.pollutionSource;
        ctx.beginPath();
        ctx.arc(sectionX, canvasY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制点位类型标签
        const typeLabels = { surface: '表', middle: '中', bottom: '底' };
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typeLabels[point.type] || '', sectionX, canvasY);
    }

    /**
     * 绘制采样标记点
     */
    drawSamplingMarkers() {
        const ctx = this.ctx;
        
        this.samplingMarkers.forEach(marker => {
            // 绘制标记点
            ctx.fillStyle = SCENE_CONFIG.colors.samplingPoint;
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制标记边框
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    /**
     * 绘制比例尺
     */
    drawScaleBar() {
        const ctx = this.ctx;
        const barX = 60;
        const barY = this.canvas.height - 30;
        const barLength = 100; // 像素
        const realLength = barLength / SCENE_CONFIG.scale; // 米
        
        // 绘制比例尺线
        ctx.strokeStyle = SCENE_CONFIG.colors.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barX, barY);
        ctx.lineTo(barX + barLength, barY);
        ctx.moveTo(barX, barY - 5);
        ctx.lineTo(barX, barY + 5);
        ctx.moveTo(barX + barLength, barY - 5);
        ctx.lineTo(barX + barLength, barY + 5);
        ctx.stroke();
        
        // 绘制比例尺标签
        ctx.fillStyle = SCENE_CONFIG.colors.text;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${realLength}米`, barX + barLength / 2, barY + 18);
    }

    /**
     * 绘制图例
     */
    drawLegend() {
        const ctx = this.ctx;
        const legendX = this.canvas.width - 150;
        const legendY = 20;
        const itemHeight = 20;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(legendX - 10, legendY - 5, 140, 100);
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX - 10, legendY - 5, 140, 100);
        
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        
        const items = [
            { color: SCENE_CONFIG.colors.pollutionSource, label: '污染源' },
            { color: SCENE_CONFIG.colors.samplingSection, label: '采样断面' },
            { color: SCENE_CONFIG.colors.samplingPoint, label: '采样点位' },
            { color: SCENE_CONFIG.colors.landmark, label: '地标' }
        ];
        
        items.forEach((item, index) => {
            const y = legendY + index * itemHeight + 10;
            
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(legendX + 5, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = SCENE_CONFIG.colors.text;
            ctx.fillText(item.label, legendX + 20, y + 4);
        });
    }

    /**
     * 将河流 X 坐标（沿河流方向）转换为 Canvas X 坐标
     * @param {number} riverX - 河流 X 坐标（米）
     * @returns {number} Canvas X 坐标
     */
    riverXToCanvas(riverX) {
        const area = SCENE_CONFIG.riverArea;
        // 假设河流长度为 200 米
        const riverLength = 200;
        return area.x + (riverX / riverLength) * area.width;
    }

    /**
     * 将河流 Y 坐标（沿河流方向的位置）转换为 Canvas X 坐标
     * @param {number} riverY - 河流 Y 坐标（米）
     * @returns {number} Canvas X 坐标
     */
    riverYToCanvasX(riverY) {
        const area = SCENE_CONFIG.riverArea;
        const riverLength = 200;
        return area.x + (riverY / riverLength) * area.width;
    }

    /**
     * 将 Canvas 坐标转换为河流坐标
     * @param {number} canvasX - Canvas X 坐标
     * @param {number} canvasY - Canvas Y 坐标
     * @returns {{x: number, y: number, inRiver: boolean}} 河流坐标和是否在河流内
     */
    canvasToRiver(canvasX, canvasY) {
        const area = SCENE_CONFIG.riverArea;
        const riverLength = 200;
        
        // 检查是否在河流区域内
        const inRiver = canvasX >= area.x && canvasX <= area.x + area.width &&
                       canvasY >= area.y && canvasY <= area.y + area.height;
        
        // 计算河流坐标
        // x: 距左岸距离（基于 canvasY）
        // y: 沿河流方向位置（基于 canvasX）
        const x = ((canvasY - area.y) / area.height) * this.riverConfig.width;
        const y = ((canvasX - area.x) / area.width) * riverLength;
        
        return { x, y, inRiver };
    }

    /**
     * 添加采样断面
     * @param {number} riverY - 河流 Y 坐标（沿河流方向位置）
     * @returns {string} 断面 ID
     */
    addSamplingSection(riverY) {
        const sectionId = `section-${Date.now()}`;
        this.samplingSections.push({
            id: sectionId,
            y: riverY,
            points: []
        });
        this.render();
        return sectionId;
    }

    /**
     * 向断面添加采样点
     * @param {string} sectionId - 断面 ID
     * @param {SamplingPoint} point - 采样点
     */
    addPointToSection(sectionId, point) {
        const section = this.samplingSections.find(s => s.id === sectionId);
        if (section) {
            section.points.push(point);
            this.render();
        }
    }

    /**
     * 添加临时标记点
     * @param {number} canvasX - Canvas X 坐标
     * @param {number} canvasY - Canvas Y 坐标
     * @returns {string} 标记 ID
     */
    addMarker(canvasX, canvasY) {
        const markerId = `marker-${Date.now()}`;
        this.samplingMarkers.push({ x: canvasX, y: canvasY, id: markerId });
        this.render();
        return markerId;
    }

    /**
     * 移除标记点
     * @param {string} markerId - 标记 ID
     */
    removeMarker(markerId) {
        const index = this.samplingMarkers.findIndex(m => m.id === markerId);
        if (index !== -1) {
            this.samplingMarkers.splice(index, 1);
            this.render();
        }
    }

    /**
     * 清除所有标记
     */
    clearMarkers() {
        this.samplingMarkers = [];
        this.render();
    }

    /**
     * 清除所有断面
     */
    clearSections() {
        this.samplingSections = [];
        this.render();
    }

    /**
     * 获取河流区域边界
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getRiverBounds() {
        return { ...SCENE_CONFIG.riverArea };
    }

    /**
     * 检查点击位置是否在河流内
     * @param {number} canvasX - Canvas X 坐标
     * @param {number} canvasY - Canvas Y 坐标
     * @returns {boolean}
     */
    isPointInRiver(canvasX, canvasY) {
        const area = SCENE_CONFIG.riverArea;
        return canvasX >= area.x && canvasX <= area.x + area.width &&
               canvasY >= area.y && canvasY <= area.y + area.height;
    }
}

// ================= 场景交互控制器 =================

/**
 * 河流场景交互控制器
 * 处理用户点击、采样断面设置等交互
 */
class RiverSceneInteraction {
    /**
     * @param {RiverSceneRenderer} renderer - 场景渲染器
     * @param {WaterSamplingSimulation} simulation - 仿真管理器
     */
    constructor(renderer, simulation) {
        /** @type {RiverSceneRenderer} */
        this.renderer = renderer;
        /** @type {WaterSamplingSimulation} */
        this.simulation = simulation;
        /** @type {HTMLCanvasElement} */
        this.canvas = renderer.canvas;
        /** @type {Function[]} */
        this._clickListeners = [];
        /** @type {Function[]} */
        this._sectionListeners = [];
        /** @type {boolean} */
        this._enabled = true;
        /** @type {string|null} */
        this._currentSectionId = null;
        /** @type {'section'|'point'} */
        this._interactionMode = 'section';
        
        this._bindEvents();
    }

    /**
     * 绑定事件监听器
     * @private
     */
    _bindEvents() {
        this._handleClick = this._handleClick.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseLeave = this._handleMouseLeave.bind(this);
        
        this.canvas.addEventListener('click', this._handleClick);
        this.canvas.addEventListener('mousemove', this._handleMouseMove);
        this.canvas.addEventListener('mouseleave', this._handleMouseLeave);
        
        // 设置鼠标样式
        this.canvas.style.cursor = 'crosshair';
    }

    /**
     * 处理点击事件
     * @param {MouseEvent} event
     * @private
     */
    _handleClick(event) {
        if (!this._enabled) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        // 检查是否点击在河流区域内
        if (!this.renderer.isPointInRiver(canvasX, canvasY)) {
            this._notifyClickListeners({
                canvasX,
                canvasY,
                riverCoords: null,
                inRiver: false
            });
            return;
        }
        
        // 转换为河流坐标
        const riverCoords = this.renderer.canvasToRiver(canvasX, canvasY);
        
        // 根据交互模式处理
        if (this._interactionMode === 'section') {
            this._handleSectionClick(canvasX, canvasY, riverCoords);
        } else if (this._interactionMode === 'point') {
            this._handlePointClick(canvasX, canvasY, riverCoords);
        }
        
        // 通知点击监听器
        this._notifyClickListeners({
            canvasX,
            canvasY,
            riverCoords,
            inRiver: true
        });
    }

    /**
     * 处理断面设置点击
     * @param {number} canvasX
     * @param {number} canvasY
     * @param {{x: number, y: number, inRiver: boolean}} riverCoords
     * @private
     */
    _handleSectionClick(canvasX, canvasY, riverCoords) {
        // 在点击位置添加采样断面
        const sectionId = this.renderer.addSamplingSection(riverCoords.y);
        this._currentSectionId = sectionId;
        
        // 通知断面监听器
        this._notifySectionListeners({
            type: 'section_added',
            sectionId,
            riverY: riverCoords.y,
            canvasX
        });
    }

    /**
     * 处理采样点设置点击
     * @param {number} canvasX
     * @param {number} canvasY
     * @param {{x: number, y: number, inRiver: boolean}} riverCoords
     * @private
     */
    _handlePointClick(canvasX, canvasY, riverCoords) {
        if (!this._currentSectionId) {
            console.warn('No section selected for point placement');
            return;
        }
        
        // 创建采样点
        const point = {
            id: `point-${Date.now()}`,
            sectionId: this._currentSectionId,
            position: {
                x: riverCoords.x,
                y: riverCoords.y,
                depth: 0 // 默认表层，后续可通过断面详情视图设置
            },
            type: 'surface',
            isValid: true
        };
        
        // 添加到仿真状态
        const validation = this.simulation.addSamplingPoint(point);
        point.isValid = validation.isValid;
        point.validationMessage = validation.message;
        
        // 添加到渲染器
        this.renderer.addPointToSection(this._currentSectionId, point);
        
        // 通知断面监听器
        this._notifySectionListeners({
            type: 'point_added',
            sectionId: this._currentSectionId,
            point,
            validation
        });
    }

    /**
     * 处理鼠标移动事件
     * @param {MouseEvent} event
     * @private
     */
    _handleMouseMove(event) {
        if (!this._enabled) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        // 更新鼠标样式
        if (this.renderer.isPointInRiver(canvasX, canvasY)) {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'default';
        }
        
        // 显示坐标提示（可选）
        this._updateCoordinateTooltip(canvasX, canvasY);
    }

    /**
     * 处理鼠标离开事件
     * @private
     */
    _handleMouseLeave() {
        this.canvas.style.cursor = 'default';
        this._hideCoordinateTooltip();
    }

    /**
     * 更新坐标提示
     * @param {number} canvasX
     * @param {number} canvasY
     * @private
     */
    _updateCoordinateTooltip(canvasX, canvasY) {
        // 如果有提示元素，更新其内容
        if (this._tooltipElement) {
            if (this.renderer.isPointInRiver(canvasX, canvasY)) {
                const riverCoords = this.renderer.canvasToRiver(canvasX, canvasY);
                this._tooltipElement.textContent = 
                    `距左岸: ${riverCoords.x.toFixed(1)}m, 沿河: ${riverCoords.y.toFixed(1)}m`;
                this._tooltipElement.style.display = 'block';
            } else {
                this._tooltipElement.style.display = 'none';
            }
        }
    }

    /**
     * 隐藏坐标提示
     * @private
     */
    _hideCoordinateTooltip() {
        if (this._tooltipElement) {
            this._tooltipElement.style.display = 'none';
        }
    }

    /**
     * 设置坐标提示元素
     * @param {HTMLElement} element
     */
    setTooltipElement(element) {
        this._tooltipElement = element;
    }

    /**
     * 设置交互模式
     * @param {'section'|'point'} mode
     */
    setInteractionMode(mode) {
        this._interactionMode = mode;
    }

    /**
     * 获取当前交互模式
     * @returns {'section'|'point'}
     */
    getInteractionMode() {
        return this._interactionMode;
    }

    /**
     * 设置当前断面
     * @param {string} sectionId
     */
    setCurrentSection(sectionId) {
        this._currentSectionId = sectionId;
    }

    /**
     * 获取当前断面 ID
     * @returns {string|null}
     */
    getCurrentSection() {
        return this._currentSectionId;
    }

    /**
     * 启用交互
     */
    enable() {
        this._enabled = true;
        this.canvas.style.cursor = 'crosshair';
    }

    /**
     * 禁用交互
     */
    disable() {
        this._enabled = false;
        this.canvas.style.cursor = 'not-allowed';
    }

    /**
     * 检查是否启用
     * @returns {boolean}
     */
    isEnabled() {
        return this._enabled;
    }

    /**
     * 添加点击监听器
     * @param {Function} listener
     * @returns {Function} 取消监听函数
     */
    onRiverClick(listener) {
        this._clickListeners.push(listener);
        return () => {
            const index = this._clickListeners.indexOf(listener);
            if (index > -1) {
                this._clickListeners.splice(index, 1);
            }
        };
    }

    /**
     * 添加断面事件监听器
     * @param {Function} listener
     * @returns {Function} 取消监听函数
     */
    onSectionEvent(listener) {
        this._sectionListeners.push(listener);
        return () => {
            const index = this._sectionListeners.indexOf(listener);
            if (index > -1) {
                this._sectionListeners.splice(index, 1);
            }
        };
    }

    /**
     * 通知点击监听器
     * @param {Object} data
     * @private
     */
    _notifyClickListeners(data) {
        this._clickListeners.forEach(listener => {
            try {
                listener(data);
            } catch (e) {
                console.error('Click listener error:', e);
            }
        });
    }

    /**
     * 通知断面监听器
     * @param {Object} data
     * @private
     */
    _notifySectionListeners(data) {
        this._sectionListeners.forEach(listener => {
            try {
                listener(data);
            } catch (e) {
                console.error('Section listener error:', e);
            }
        });
    }

    /**
     * 销毁交互控制器
     */
    destroy() {
        this.canvas.removeEventListener('click', this._handleClick);
        this.canvas.removeEventListener('mousemove', this._handleMouseMove);
        this.canvas.removeEventListener('mouseleave', this._handleMouseLeave);
        this._clickListeners = [];
        this._sectionListeners = [];
    }
}

/**
 * 创建完整的河流场景（渲染器 + 交互控制器）
 * @param {HTMLElement} container - 容器元素
 * @param {RiverConfig} riverConfig - 河流配置
 * @param {WaterSamplingSimulation} simulation - 仿真管理器
 * @returns {{renderer: RiverSceneRenderer, interaction: RiverSceneInteraction, canvas: HTMLCanvasElement}}
 */
function createRiverScene(container, riverConfig, simulation) {
    // 创建 Canvas 元素
    const canvas = document.createElement('canvas');
    canvas.id = 'river-scene-canvas';
    canvas.className = 'river-scene-canvas';
    container.appendChild(canvas);
    
    // 创建坐标提示元素
    const tooltip = document.createElement('div');
    tooltip.className = 'river-scene-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        display: none;
        pointer-events: none;
    `;
    container.appendChild(tooltip);
    
    // 设置容器样式
    container.style.position = 'relative';
    
    // 创建渲染器
    const renderer = new RiverSceneRenderer(canvas, riverConfig);
    
    // 创建交互控制器
    const interaction = new RiverSceneInteraction(renderer, simulation);
    interaction.setTooltipElement(tooltip);
    
    // 初始渲染
    renderer.render();
    
    return { renderer, interaction, canvas, tooltip };
}

// ================= 断面详情视图 (Cross-Section View) =================

/**
 * 断面详情视图配置
 */
const CROSS_SECTION_CONFIG = {
    width: 600,
    height: 400,
    padding: { top: 60, right: 40, bottom: 60, left: 60 },
    colors: {
        water: '#4A90D9',
        waterGradientTop: '#6BB3E8',
        waterGradientBottom: '#2A5A8A',
        riverbed: '#8B7355',
        bank: '#6B8E23',
        depthMarker: '#FF6B6B',
        surfaceZone: 'rgba(255, 255, 0, 0.3)',
        middleZone: 'rgba(0, 255, 0, 0.2)',
        bottomZone: 'rgba(255, 165, 0, 0.3)',
        selectedPoint: '#00FF00',
        invalidPoint: '#FF0000',
        grid: 'rgba(255, 255, 255, 0.2)',
        text: '#333333'
    }
};

/**
 * 河流断面详情视图渲染器
 * 显示河流横截面，允许选择表层/中层/底层采样点
 */
class CrossSectionRenderer {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @param {RiverConfig} riverConfig - 河流配置
     */
    constructor(canvas, riverConfig) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.riverConfig = riverConfig;
        this.selectedPoints = [];
        this.hoveredZone = null;
        
        // 设置 Canvas 尺寸
        this.canvas.width = CROSS_SECTION_CONFIG.width;
        this.canvas.height = CROSS_SECTION_CONFIG.height;
        
        // 计算绘图区域
        this.drawArea = {
            x: CROSS_SECTION_CONFIG.padding.left,
            y: CROSS_SECTION_CONFIG.padding.top,
            width: CROSS_SECTION_CONFIG.width - CROSS_SECTION_CONFIG.padding.left - CROSS_SECTION_CONFIG.padding.right,
            height: CROSS_SECTION_CONFIG.height - CROSS_SECTION_CONFIG.padding.top - CROSS_SECTION_CONFIG.padding.bottom
        };
    }

    /**
     * 渲染完整断面视图
     */
    render() {
        this.clear();
        this.drawBackground();
        this.drawRiverBanks();
        this.drawWater();
        this.drawDepthZones();
        this.drawDepthScale();
        this.drawWidthScale();
        this.drawSelectedPoints();
        this.drawTitle();
        this.drawLegend();
    }

    /**
     * 清除画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制背景
     */
    drawBackground() {
        const ctx = this.ctx;
        ctx.fillStyle = '#E8F4F8';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制河岸
     */
    drawRiverBanks() {
        const ctx = this.ctx;
        const area = this.drawArea;
        const bankWidth = 30;
        
        // 左岸
        ctx.fillStyle = CROSS_SECTION_CONFIG.colors.bank;
        ctx.beginPath();
        ctx.moveTo(area.x - bankWidth, area.y);
        ctx.lineTo(area.x, area.y);
        ctx.lineTo(area.x, area.y + area.height);
        ctx.lineTo(area.x - bankWidth, area.y + area.height + 20);
        ctx.closePath();
        ctx.fill();
        
        // 右岸
        ctx.beginPath();
        ctx.moveTo(area.x + area.width, area.y);
        ctx.lineTo(area.x + area.width + bankWidth, area.y);
        ctx.lineTo(area.x + area.width + bankWidth, area.y + area.height + 20);
        ctx.lineTo(area.x + area.width, area.y + area.height);
        ctx.closePath();
        ctx.fill();
        
        // 河岸标签
        ctx.fillStyle = CROSS_SECTION_CONFIG.colors.text;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('左岸', area.x - bankWidth / 2, area.y - 10);
        ctx.fillText('右岸', area.x + area.width + bankWidth / 2, area.y - 10);
    }

    /**
     * 绘制水体
     */
    drawWater() {
        const ctx = this.ctx;
        const area = this.drawArea;
        
        // 水体渐变
        const gradient = ctx.createLinearGradient(area.x, area.y, area.x, area.y + area.height);
        gradient.addColorStop(0, CROSS_SECTION_CONFIG.colors.waterGradientTop);
        gradient.addColorStop(1, CROSS_SECTION_CONFIG.colors.waterGradientBottom);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(area.x, area.y, area.width, area.height);
        
        // 水面线
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x + area.width, area.y);
        ctx.stroke();
        
        // 河床
        ctx.fillStyle = CROSS_SECTION_CONFIG.colors.riverbed;
        ctx.fillRect(area.x, area.y + area.height, area.width, 15);
    }

    /**
     * 绘制深度分区（表层/中层/底层）
     */
    drawDepthZones() {
        const ctx = this.ctx;
        const area = this.drawArea;
        const depth = this.riverConfig.depth;
        const rules = HJT91_VALIDATION_RULES;
        
        // 表层区域 (0-20%)
        const surfaceHeight = area.height * rules.surfaceDepthMaxRatio;
        ctx.fillStyle = CROSS_SECTION_CONFIG.colors.surfaceZone;
        ctx.fillRect(area.x, area.y, area.width, surfaceHeight);
        
        // 中层区域 (40-60%)
        const middleTop = area.height * rules.middleDepthMinRatio;
        const middleHeight = area.height * (rules.middleDepthMaxRatio - rules.middleDepthMinRatio);
        ctx.fillStyle = CROSS_SECTION_CONFIG.colors.middleZone;
        ctx.fillRect(area.x, area.y + middleTop, area.width, middleHeight);
        
        // 底层区域 (80-100%)
        const bottomTop = area.height * rules.bottomDepthMinRatio;
        const bottomHeight = area.height * (1 - rules.bottomDepthMinRatio);
        ctx.fillStyle = CROSS_SECTION_CONFIG.colors.bottomZone;
        ctx.fillRect(area.x, area.y + bottomTop, area.width, bottomHeight);
        
        // 区域标签
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('表层 (0-20%)', area.x + 10, area.y + surfaceHeight / 2 + 5);
        ctx.fillText('中层 (40-60%)', area.x + 10, area.y + middleTop + middleHeight / 2 + 5);
        ctx.fillText('底层 (80-100%)', area.x + 10, area.y + bottomTop + bottomHeight / 2 + 5);
    }

    /**
     * 绘制深度刻度
     */
    drawDepthScale() {
        const ctx = this.ctx;
        const area = this.drawArea;
        const depth = this.riverConfig.depth;
        
        ctx.strokeStyle = CROSS_SECTION_CONFIG.colors.text;
        ctx.fillStyle = CROSS_SECTION_CONFIG.colors.text;
        ctx.lineWidth = 1;
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        
        // 绘制刻度线和标签
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const ratio = i / numTicks;
            const y = area.y + ratio * area.height;
            const depthValue = (ratio * depth).toFixed(1);
            
            // 刻度线
            ctx.beginPath();
            ctx.moveTo(area.x - 5, y);
            ctx.lineTo(area.x, y);
            ctx.stroke();
            
            // 刻度标签
            ctx.fillText(`${depthValue}m`, area.x - 10, y + 4);
        }
        
        // 深度轴标题
        ctx.save();
        ctx.translate(15, area.y + area.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('水深 (m)', 0, 0);
        ctx.restore();
    }

    /**
     * 绘制宽度刻度
     */
    drawWidthScale() {
        const ctx = this.ctx;
        const area = this.drawArea;
        const width = this.riverConfig.width;
        
        ctx.strokeStyle = CROSS_SECTION_CONFIG.colors.text;
        ctx.fillStyle = CROSS_SECTION_CONFIG.colors.text;
        ctx.lineWidth = 1;
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        
        // 绘制刻度线和标签
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const ratio = i / numTicks;
            const x = area.x + ratio * area.width;
            const widthValue = (ratio * width).toFixed(0);
            
            // 刻度线
            ctx.beginPath();
            ctx.moveTo(x, area.y + area.height);
            ctx.lineTo(x, area.y + area.height + 5);
            ctx.stroke();
            
            // 刻度标签
            ctx.fillText(`${widthValue}m`, x, area.y + area.height + 20);
        }
        
        // 宽度轴标题
        ctx.font = 'bold 12px Arial';
        ctx.fillText('距左岸距离 (m)', area.x + area.width / 2, area.y + area.height + 45);
    }

    /**
     * 绘制已选采样点
     */
    drawSelectedPoints() {
        const ctx = this.ctx;
        const area = this.drawArea;
        
        this.selectedPoints.forEach(point => {
            const x = area.x + (point.position.x / this.riverConfig.width) * area.width;
            const y = area.y + (point.position.depth / this.riverConfig.depth) * area.height;
            
            // 点位圆圈
            ctx.fillStyle = point.isValid ? CROSS_SECTION_CONFIG.colors.selectedPoint : CROSS_SECTION_CONFIG.colors.invalidPoint;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // 点位边框
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 点位类型标签
            const typeLabels = { surface: '表', middle: '中', bottom: '底' };
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(typeLabels[point.type] || '?', x, y);
        });
    }

    /**
     * 绘制标题
     */
    drawTitle() {
        const ctx = this.ctx;
        ctx.fillStyle = CROSS_SECTION_CONFIG.colors.text;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('河流断面详情 - 采样点位选择', this.canvas.width / 2, 25);
        
        ctx.font = '12px Arial';
        ctx.fillText(`河宽: ${this.riverConfig.width}m | 水深: ${this.riverConfig.depth}m`, this.canvas.width / 2, 45);
    }

    /**
     * 绘制图例
     */
    drawLegend() {
        const ctx = this.ctx;
        const legendX = this.canvas.width - 150;
        const legendY = 60;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(legendX - 10, legendY - 5, 140, 80);
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX - 10, legendY - 5, 140, 80);
        
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        
        const items = [
            { color: CROSS_SECTION_CONFIG.colors.surfaceZone, label: '表层采样区' },
            { color: CROSS_SECTION_CONFIG.colors.middleZone, label: '中层采样区' },
            { color: CROSS_SECTION_CONFIG.colors.bottomZone, label: '底层采样区' }
        ];
        
        items.forEach((item, index) => {
            const y = legendY + index * 22 + 10;
            
            ctx.fillStyle = item.color;
            ctx.fillRect(legendX, y - 8, 16, 16);
            ctx.strokeStyle = '#666';
            ctx.strokeRect(legendX, y - 8, 16, 16);
            
            ctx.fillStyle = CROSS_SECTION_CONFIG.colors.text;
            ctx.fillText(item.label, legendX + 22, y + 4);
        });
    }

    /**
     * 将 Canvas 坐标转换为河流坐标
     * @param {number} canvasX - Canvas X 坐标
     * @param {number} canvasY - Canvas Y 坐标
     * @returns {{x: number, depth: number, inWater: boolean, zone: string|null}}
     */
    canvasToRiver(canvasX, canvasY) {
        const area = this.drawArea;
        
        const inWater = canvasX >= area.x && canvasX <= area.x + area.width &&
                       canvasY >= area.y && canvasY <= area.y + area.height;
        
        const x = ((canvasX - area.x) / area.width) * this.riverConfig.width;
        const depth = ((canvasY - area.y) / area.height) * this.riverConfig.depth;
        
        // 确定所在区域
        let zone = null;
        if (inWater) {
            const depthRatio = depth / this.riverConfig.depth;
            if (depthRatio <= HJT91_VALIDATION_RULES.surfaceDepthMaxRatio) {
                zone = 'surface';
            } else if (depthRatio >= HJT91_VALIDATION_RULES.middleDepthMinRatio && 
                       depthRatio <= HJT91_VALIDATION_RULES.middleDepthMaxRatio) {
                zone = 'middle';
            } else if (depthRatio >= HJT91_VALIDATION_RULES.bottomDepthMinRatio) {
                zone = 'bottom';
            }
        }
        
        return { x: Math.max(0, Math.min(x, this.riverConfig.width)), 
                 depth: Math.max(0, Math.min(depth, this.riverConfig.depth)), 
                 inWater, 
                 zone };
    }

    /**
     * 添加采样点
     * @param {SamplingPoint} point
     */
    addPoint(point) {
        this.selectedPoints.push(point);
        this.render();
    }

    /**
     * 移除采样点
     * @param {string} pointId
     */
    removePoint(pointId) {
        const index = this.selectedPoints.findIndex(p => p.id === pointId);
        if (index !== -1) {
            this.selectedPoints.splice(index, 1);
            this.render();
        }
    }

    /**
     * 清除所有采样点
     */
    clearPoints() {
        this.selectedPoints = [];
        this.render();
    }

    /**
     * 更新河流配置
     * @param {RiverConfig} riverConfig
     */
    updateRiverConfig(riverConfig) {
        this.riverConfig = riverConfig;
        this.render();
    }
}

/**
 * 断面详情视图交互控制器
 */
class CrossSectionInteraction {
    /**
     * @param {CrossSectionRenderer} renderer
     * @param {WaterSamplingSimulation} simulation
     * @param {string} sectionId - 当前断面ID
     */
    constructor(renderer, simulation, sectionId) {
        this.renderer = renderer;
        this.simulation = simulation;
        this.sectionId = sectionId;
        this.canvas = renderer.canvas;
        this._enabled = true;
        this._pointListeners = [];
        this._selectedType = 'surface'; // 默认选择表层
        
        this._bindEvents();
    }

    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        this._handleClick = this._handleClick.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        
        this.canvas.addEventListener('click', this._handleClick);
        this.canvas.addEventListener('mousemove', this._handleMouseMove);
        this.canvas.style.cursor = 'crosshair';
    }

    /**
     * 处理点击事件
     * @param {MouseEvent} event
     * @private
     */
    _handleClick(event) {
        if (!this._enabled) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        const riverCoords = this.renderer.canvasToRiver(canvasX, canvasY);
        
        if (!riverCoords.inWater) return;
        
        // 创建采样点
        const point = {
            id: `point-${Date.now()}`,
            sectionId: this.sectionId,
            position: {
                x: riverCoords.x,
                y: 0, // 断面视图中 y 固定
                depth: riverCoords.depth
            },
            type: riverCoords.zone || this._selectedType,
            isValid: true
        };
        
        // 验证并添加点位
        const validation = this.simulation.addSamplingPoint(point);
        point.isValid = validation.isValid;
        point.validationMessage = validation.message;
        
        // 添加到渲染器
        this.renderer.addPoint(point);
        
        // 通知监听器
        this._notifyPointListeners({
            type: 'point_added',
            point,
            validation
        });
    }

    /**
     * 处理鼠标移动
     * @param {MouseEvent} event
     * @private
     */
    _handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        const riverCoords = this.renderer.canvasToRiver(canvasX, canvasY);
        
        if (riverCoords.inWater) {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * 设置采样类型
     * @param {'surface'|'middle'|'bottom'} type
     */
    setSelectedType(type) {
        this._selectedType = type;
    }

    /**
     * 添加点位事件监听器
     * @param {Function} listener
     * @returns {Function}
     */
    onPointEvent(listener) {
        this._pointListeners.push(listener);
        return () => {
            const index = this._pointListeners.indexOf(listener);
            if (index > -1) {
                this._pointListeners.splice(index, 1);
            }
        };
    }

    /**
     * 通知点位监听器
     * @param {Object} data
     * @private
     */
    _notifyPointListeners(data) {
        this._pointListeners.forEach(listener => {
            try {
                listener(data);
            } catch (e) {
                console.error('Point listener error:', e);
            }
        });
    }

    /**
     * 启用/禁用交互
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
        this.canvas.style.cursor = enabled ? 'crosshair' : 'not-allowed';
    }

    /**
     * 销毁
     */
    destroy() {
        this.canvas.removeEventListener('click', this._handleClick);
        this.canvas.removeEventListener('mousemove', this._handleMouseMove);
        this._pointListeners = [];
    }
}

/**
 * 创建断面详情视图
 * @param {HTMLElement} container - 容器元素
 * @param {RiverConfig} riverConfig - 河流配置
 * @param {WaterSamplingSimulation} simulation - 仿真管理器
 * @param {string} sectionId - 断面ID
 * @returns {{renderer: CrossSectionRenderer, interaction: CrossSectionInteraction, canvas: HTMLCanvasElement}}
 */
function createCrossSectionView(container, riverConfig, simulation, sectionId) {
    // 创建 Canvas 元素
    const canvas = document.createElement('canvas');
    canvas.id = 'cross-section-canvas';
    canvas.className = 'cross-section-canvas';
    container.appendChild(canvas);
    
    // 创建渲染器
    const renderer = new CrossSectionRenderer(canvas, riverConfig);
    
    // 创建交互控制器
    const interaction = new CrossSectionInteraction(renderer, simulation, sectionId);
    
    // 初始渲染
    renderer.render();
    
    return { renderer, interaction, canvas };
}

/**
 * 创建采样点类型选择器UI
 * @param {HTMLElement} container - 容器元素
 * @param {CrossSectionInteraction} interaction - 交互控制器
 * @returns {HTMLElement}
 */
function createPointTypeSelector(container, interaction) {
    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'point-type-selector';
    selectorDiv.style.cssText = `
        display: flex;
        gap: 10px;
        margin: 10px 0;
        justify-content: center;
    `;
    
    const types = [
        { value: 'surface', label: '表层采样', color: '#FFD700' },
        { value: 'middle', label: '中层采样', color: '#32CD32' },
        { value: 'bottom', label: '底层采样', color: '#FFA500' }
    ];
    
    types.forEach((type, index) => {
        const btn = document.createElement('button');
        btn.className = `point-type-btn ${index === 0 ? 'active' : ''}`;
        btn.dataset.type = type.value;
        btn.style.cssText = `
            padding: 8px 16px;
            border: 2px solid ${type.color};
            background: ${index === 0 ? type.color : 'white'};
            color: ${index === 0 ? 'white' : type.color};
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s;
        `;
        btn.textContent = type.label;
        
        btn.addEventListener('click', () => {
            // 更新按钮样式
            selectorDiv.querySelectorAll('.point-type-btn').forEach((b, i) => {
                const t = types[i];
                b.style.background = b === btn ? t.color : 'white';
                b.style.color = b === btn ? 'white' : t.color;
                b.classList.toggle('active', b === btn);
            });
            
            // 更新交互控制器
            interaction.setSelectedType(type.value);
        });
        
        selectorDiv.appendChild(btn);
    });
    
    container.appendChild(selectorDiv);
    return selectorDiv;
}

// ================= 采样器具数据和验证 =================

/**
 * 采样器具数据库
 * 包含采样瓶、采样器、保存剂等器具
 */
const EQUIPMENT_DATABASE = [
    // 采样瓶
    {
        id: 'bottle-glass-500',
        name: '玻璃采样瓶',
        type: 'bottle',
        material: '硼硅玻璃',
        volume: 500,
        suitableFor: ['pH', 'DO', 'BOD', 'COD', 'oil', 'volatile'],
        notes: '适用于有机物分析，使用前需酸洗',
        icon: '🧪'
    },
    {
        id: 'bottle-pe-1000',
        name: '聚乙烯瓶',
        type: 'bottle',
        material: '高密度聚乙烯(HDPE)',
        volume: 1000,
        suitableFor: ['heavy_metals', 'nutrients', 'anions', 'cations'],
        notes: '适用于重金属和无机离子分析，避免玻璃吸附',
        icon: '🫙'
    },
    {
        id: 'bottle-brown-250',
        name: '棕色玻璃瓶',
        type: 'bottle',
        material: '棕色硼硅玻璃',
        volume: 250,
        suitableFor: ['chlorophyll', 'photosensitive'],
        notes: '适用于光敏物质，避光保存',
        icon: '🍶'
    },
    {
        id: 'bottle-bod-300',
        name: 'BOD瓶',
        type: 'bottle',
        material: '玻璃',
        volume: 300,
        suitableFor: ['BOD', 'DO'],
        notes: '专用于BOD和溶解氧测定，磨口玻璃塞',
        icon: '⚗️'
    },
    // 采样器
    {
        id: 'sampler-bucket',
        name: '采样桶',
        type: 'sampler',
        material: '不锈钢/塑料',
        suitableFor: ['general', 'surface'],
        notes: '适用于表层水样采集',
        icon: '🪣'
    },
    {
        id: 'sampler-depth',
        name: '深水采样器',
        type: 'sampler',
        material: '不锈钢',
        suitableFor: ['middle', 'bottom', 'depth'],
        notes: '适用于不同深度水样采集，带深度标尺',
        icon: '🔧'
    },
    {
        id: 'sampler-horizontal',
        name: '横式采样器',
        type: 'sampler',
        material: '有机玻璃',
        suitableFor: ['DO', 'volatile', 'depth'],
        notes: '适用于溶解氧等易挥发参数采样',
        icon: '📏'
    },
    // 保存剂
    {
        id: 'preservative-hno3',
        name: '硝酸(HNO₃)',
        type: 'preservative',
        material: '优级纯硝酸',
        suitableFor: ['heavy_metals'],
        notes: '加酸至pH<2，用于重金属样品固定',
        icon: '🧴'
    },
    {
        id: 'preservative-h2so4',
        name: '硫酸(H₂SO₄)',
        type: 'preservative',
        material: '优级纯硫酸',
        suitableFor: ['COD', 'ammonia', 'oil'],
        notes: '加酸至pH<2，用于COD、氨氮等样品固定',
        icon: '🧴'
    },
    {
        id: 'preservative-naoh',
        name: '氢氧化钠(NaOH)',
        type: 'preservative',
        material: '优级纯氢氧化钠',
        suitableFor: ['cyanide', 'sulfide'],
        notes: '加碱至pH>12，用于氰化物、硫化物固定',
        icon: '🧴'
    },
    {
        id: 'preservative-mnso4',
        name: '硫酸锰溶液',
        type: 'preservative',
        material: '硫酸锰+碱性碘化钾',
        suitableFor: ['DO'],
        notes: '溶解氧固定剂，现场固定',
        icon: '💧'
    },
    // 工具
    {
        id: 'tool-thermometer',
        name: '温度计',
        type: 'tool',
        material: '玻璃/电子',
        suitableFor: ['temperature'],
        notes: '现场测定水温，精度0.1°C',
        icon: '🌡️'
    },
    {
        id: 'tool-ph-meter',
        name: 'pH计',
        type: 'tool',
        material: '便携式电子',
        suitableFor: ['pH'],
        notes: '现场测定pH值，使用前需校准',
        icon: '📊'
    },
    {
        id: 'tool-do-meter',
        name: '溶解氧仪',
        type: 'tool',
        material: '便携式电子',
        suitableFor: ['DO'],
        notes: '现场测定溶解氧，使用前需校准',
        icon: '📈'
    },
    {
        id: 'tool-ice-box',
        name: '冷藏箱',
        type: 'tool',
        material: '保温材料',
        suitableFor: ['refrigeration', 'all'],
        notes: '样品冷藏保存，保持4°C以下',
        icon: '🧊'
    },
    {
        id: 'tool-label',
        name: '标签纸',
        type: 'tool',
        material: '防水标签',
        suitableFor: ['all'],
        notes: '样品标识，记录采样信息',
        icon: '🏷️'
    }
];

/**
 * 监测项目与器具匹配规则
 */
const EQUIPMENT_MATCHING_RULES = {
    // 重金属采样要求
    'heavy_metals': {
        requiredBottle: ['bottle-pe-1000'],
        requiredPreservative: ['preservative-hno3'],
        requiredTools: ['tool-ice-box', 'tool-label'],
        description: '重金属采样需使用聚乙烯瓶（避免玻璃吸附），加硝酸固定至pH<2'
    },
    // pH测定要求
    'pH': {
        requiredBottle: ['bottle-glass-500'],
        requiredPreservative: [],
        requiredTools: ['tool-ph-meter', 'tool-label'],
        description: 'pH需现场测定，不需保存剂'
    },
    // 溶解氧测定要求
    'DO': {
        requiredBottle: ['bottle-bod-300'],
        requiredPreservative: ['preservative-mnso4'],
        requiredTools: ['tool-do-meter', 'tool-label'],
        optionalSampler: ['sampler-horizontal'],
        description: '溶解氧需现场固定或测定，使用BOD瓶和横式采样器'
    },
    // COD测定要求
    'COD': {
        requiredBottle: ['bottle-glass-500'],
        requiredPreservative: ['preservative-h2so4'],
        requiredTools: ['tool-ice-box', 'tool-label'],
        description: 'COD样品需加硫酸固定并冷藏保存'
    },
    // BOD测定要求
    'BOD': {
        requiredBottle: ['bottle-bod-300'],
        requiredPreservative: [],
        requiredTools: ['tool-ice-box', 'tool-label'],
        description: 'BOD样品需冷藏保存，24小时内测定'
    },
    // 氨氮测定要求
    'ammonia': {
        requiredBottle: ['bottle-pe-1000', 'bottle-glass-500'],
        requiredPreservative: ['preservative-h2so4'],
        requiredTools: ['tool-ice-box', 'tool-label'],
        description: '氨氮样品需加硫酸固定并冷藏保存'
    },
    // 水温测定要求
    'temperature': {
        requiredBottle: [],
        requiredPreservative: [],
        requiredTools: ['tool-thermometer'],
        description: '水温需现场测定'
    }
};

/**
 * 验证器具选择是否匹配监测项目
 * @param {Equipment[]} selectedEquipment - 已选器具列表
 * @param {string} monitoringParameter - 监测项目
 * @returns {ValidationResult}
 */
function validateEquipmentSelection(selectedEquipment, monitoringParameter) {
    const rules = EQUIPMENT_MATCHING_RULES[monitoringParameter];
    if (!rules) {
        return { isValid: true, message: '未知监测项目，无法验证器具匹配' };
    }

    const warnings = [];
    const errors = [];
    const selectedIds = selectedEquipment.map(e => e.id);

    // 检查必需的采样瓶
    if (rules.requiredBottle && rules.requiredBottle.length > 0) {
        const hasRequiredBottle = rules.requiredBottle.some(id => selectedIds.includes(id));
        if (!hasRequiredBottle) {
            const requiredNames = rules.requiredBottle
                .map(id => EQUIPMENT_DATABASE.find(e => e.id === id)?.name)
                .filter(Boolean)
                .join('或');
            errors.push(`缺少必需的采样瓶：${requiredNames}`);
        }
    }

    // 检查必需的保存剂
    if (rules.requiredPreservative && rules.requiredPreservative.length > 0) {
        const hasRequiredPreservative = rules.requiredPreservative.some(id => selectedIds.includes(id));
        if (!hasRequiredPreservative) {
            const requiredNames = rules.requiredPreservative
                .map(id => EQUIPMENT_DATABASE.find(e => e.id === id)?.name)
                .filter(Boolean)
                .join('或');
            errors.push(`缺少必需的保存剂：${requiredNames}`);
        }
    }

    // 检查必需的工具
    if (rules.requiredTools && rules.requiredTools.length > 0) {
        const missingTools = rules.requiredTools.filter(id => !selectedIds.includes(id));
        if (missingTools.length > 0) {
            const missingNames = missingTools
                .map(id => EQUIPMENT_DATABASE.find(e => e.id === id)?.name)
                .filter(Boolean)
                .join('、');
            warnings.push(`建议添加工具：${missingNames}`);
        }
    }

    // 检查是否有不适合的器具
    selectedEquipment.forEach(equipment => {
        if (equipment.suitableFor && !equipment.suitableFor.includes(monitoringParameter) && 
            !equipment.suitableFor.includes('all') && !equipment.suitableFor.includes('general')) {
            warnings.push(`${equipment.name} 可能不适用于 ${monitoringParameter} 监测`);
        }
    });

    const isValid = errors.length === 0;
    let message = '';
    
    if (errors.length > 0) {
        message = errors.join('\n');
    } else if (warnings.length > 0) {
        message = warnings.join('\n');
    } else {
        message = `器具选择符合 ${monitoringParameter} 监测要求`;
    }

    return { isValid, message, warnings, errors, rules };
}

/**
 * 获取监测项目推荐的器具列表
 * @param {string} monitoringParameter - 监测项目
 * @returns {Equipment[]}
 */
function getRecommendedEquipment(monitoringParameter) {
    const rules = EQUIPMENT_MATCHING_RULES[monitoringParameter];
    if (!rules) return [];

    const recommendedIds = [
        ...(rules.requiredBottle || []),
        ...(rules.requiredPreservative || []),
        ...(rules.requiredTools || []),
        ...(rules.optionalSampler || [])
    ];

    return recommendedIds
        .map(id => EQUIPMENT_DATABASE.find(e => e.id === id))
        .filter(Boolean);
}

/**
 * 创建器具选择界面
 * @param {HTMLElement} container - 容器元素
 * @param {WaterSamplingSimulation} simulation - 仿真管理器
 * @param {string} monitoringParameter - 监测项目
 * @returns {Object}
 */
function createEquipmentSelector(container, simulation, monitoringParameter) {
    const state = {
        selectedEquipment: [],
        monitoringParameter
    };

    // 创建主容器
    const mainDiv = document.createElement('div');
    mainDiv.className = 'equipment-selector';
    mainDiv.style.cssText = 'display: flex; gap: 20px; padding: 20px;';

    // 左侧：器具列表
    const listDiv = document.createElement('div');
    listDiv.className = 'equipment-list';
    listDiv.style.cssText = 'flex: 2; max-height: 500px; overflow-y: auto;';
    
    const listTitle = document.createElement('h3');
    listTitle.textContent = '可用器具';
    listTitle.style.cssText = 'margin: 0 0 15px 0; color: #333;';
    listDiv.appendChild(listTitle);

    // 按类型分组显示器具
    const groupedEquipment = {
        bottle: { name: '采样瓶', items: [] },
        sampler: { name: '采样器', items: [] },
        preservative: { name: '保存剂', items: [] },
        tool: { name: '工具', items: [] }
    };

    EQUIPMENT_DATABASE.forEach(eq => {
        if (groupedEquipment[eq.type]) {
            groupedEquipment[eq.type].items.push(eq);
        }
    });

    // 渲染器具分组
    Object.entries(groupedEquipment).forEach(([type, group]) => {
        if (group.items.length === 0) return;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'equipment-group';
        groupDiv.style.cssText = 'margin-bottom: 20px;';

        const groupTitle = document.createElement('h4');
        groupTitle.textContent = group.name;
        groupTitle.style.cssText = 'margin: 0 0 10px 0; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 5px;';
        groupDiv.appendChild(groupTitle);

        group.items.forEach(equipment => {
            const card = createEquipmentCard(equipment, monitoringParameter, () => {
                addToToolbox(equipment);
            });
            groupDiv.appendChild(card);
        });

        listDiv.appendChild(groupDiv);
    });

    // 右侧：工具箱
    const toolboxDiv = document.createElement('div');
    toolboxDiv.className = 'toolbox';
    toolboxDiv.style.cssText = `
        flex: 1;
        background: #f8f9fa;
        border-radius: 10px;
        padding: 15px;
        min-height: 300px;
    `;

    const toolboxTitle = document.createElement('h3');
    toolboxTitle.textContent = '🧰 我的工具箱';
    toolboxTitle.style.cssText = 'margin: 0 0 15px 0; color: #333;';
    toolboxDiv.appendChild(toolboxTitle);

    const toolboxContent = document.createElement('div');
    toolboxContent.className = 'toolbox-content';
    toolboxContent.style.cssText = 'min-height: 200px;';
    toolboxDiv.appendChild(toolboxContent);

    const validationDiv = document.createElement('div');
    validationDiv.className = 'toolbox-validation';
    validationDiv.style.cssText = 'margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;';
    toolboxDiv.appendChild(validationDiv);

    // 添加到工具箱函数
    function addToToolbox(equipment) {
        if (state.selectedEquipment.some(e => e.id === equipment.id)) {
            return; // 已存在
        }
        
        state.selectedEquipment.push(equipment);
        simulation.selectEquipment(equipment);
        updateToolboxDisplay();
    }

    // 从工具箱移除函数
    function removeFromToolbox(equipmentId) {
        const index = state.selectedEquipment.findIndex(e => e.id === equipmentId);
        if (index !== -1) {
            state.selectedEquipment.splice(index, 1);
            simulation.removeEquipment(equipmentId);
            updateToolboxDisplay();
        }
    }

    // 更新工具箱显示
    function updateToolboxDisplay() {
        toolboxContent.innerHTML = '';
        
        if (state.selectedEquipment.length === 0) {
            toolboxContent.innerHTML = '<p style="color: #999; text-align: center;">点击左侧器具添加到工具箱</p>';
        } else {
            state.selectedEquipment.forEach(equipment => {
                const item = document.createElement('div');
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: white;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                `;
                item.innerHTML = `
                    <span>${equipment.icon || '📦'} ${equipment.name}</span>
                    <button style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">移除</button>
                `;
                item.querySelector('button').addEventListener('click', () => removeFromToolbox(equipment.id));
                toolboxContent.appendChild(item);
            });
        }

        // 更新验证状态
        const validation = validateEquipmentSelection(state.selectedEquipment, monitoringParameter);
        validationDiv.innerHTML = '';
        
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            padding: 10px;
            border-radius: 6px;
            background: ${validation.isValid ? '#d4edda' : '#f8d7da'};
            color: ${validation.isValid ? '#155724' : '#721c24'};
        `;
        statusDiv.innerHTML = `
            <strong>${validation.isValid ? '✅ 器具选择正确' : '⚠️ 器具选择不完整'}</strong>
            <p style="margin: 5px 0 0 0; font-size: 13px;">${validation.message}</p>
        `;
        validationDiv.appendChild(statusDiv);
    }

    mainDiv.appendChild(listDiv);
    mainDiv.appendChild(toolboxDiv);
    container.appendChild(mainDiv);

    // 初始化显示
    updateToolboxDisplay();

    return {
        element: mainDiv,
        getSelectedEquipment: () => [...state.selectedEquipment],
        validate: () => validateEquipmentSelection(state.selectedEquipment, monitoringParameter),
        addEquipment: addToToolbox,
        removeEquipment: removeFromToolbox
    };
}

/**
 * 创建器具卡片
 * @param {Equipment} equipment - 器具数据
 * @param {string} monitoringParameter - 监测项目
 * @param {Function} onSelect - 选择回调
 * @returns {HTMLElement}
 */
function createEquipmentCard(equipment, monitoringParameter, onSelect) {
    const isRecommended = equipment.suitableFor.includes(monitoringParameter) || 
                          equipment.suitableFor.includes('all');
    
    const card = document.createElement('div');
    card.className = 'equipment-card';
    card.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background: ${isRecommended ? '#e8f5e9' : 'white'};
        border: 2px solid ${isRecommended ? '#4caf50' : '#ddd'};
        border-radius: 8px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.2s;
    `;

    card.innerHTML = `
        <div style="font-size: 32px;">${equipment.icon || '📦'}</div>
        <div style="flex: 1;">
            <div style="font-weight: bold; color: #333;">
                ${equipment.name}
                ${isRecommended ? '<span style="background: #4caf50; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">推荐</span>' : ''}
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                ${equipment.material}${equipment.volume ? ` | ${equipment.volume}mL` : ''}
            </div>
            <div style="font-size: 11px; color: #888; margin-top: 4px;">${equipment.notes}</div>
        </div>
        <button style="background: #007bff; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">添加</button>
    `;

    card.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect(equipment);
    });

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
    });

    return card;
}

// ================= 采样操作仿真 =================

/**
 * 采样操作步骤定义
 */
const SAMPLING_STEPS = [
    { id: 'rinse', name: '润洗', requiredCount: 2, description: '用待采水样润洗采样瓶2-3次', icon: '🔄' },
    { id: 'sample', name: '采样', requiredCount: 1, description: '采集水样至采样瓶', icon: '💧' },
    { id: 'seal', name: '封口', requiredCount: 1, description: '密封采样瓶', icon: '🔒' },
    { id: 'label', name: '贴标签', requiredCount: 1, description: '贴上样品标签', icon: '🏷️' }
];

/**
 * 获取采样点位类型的中文名称
 * @param {string} type - 点位类型
 * @returns {string} 中文名称
 */
function getSamplingPointTypeName(type) {
    const typeNames = {
        'surface': '表层',
        'middle': '中层',
        'bottom': '底层'
    };
    return typeNames[type] || type;
}

/**
 * 创建采样点位信息面板
 * @param {SamplingPoint} point - 采样点位
 * @param {RiverConfig} riverConfig - 河流配置
 * @returns {HTMLElement}
 */
function createPointInfoPanel(point, riverConfig) {
    const panel = document.createElement('div');
    panel.className = 'point-info-panel';
    panel.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    `;
    
    const typeName = getSamplingPointTypeName(point.type);
    const depthPercent = ((point.position.depth / riverConfig.depth) * 100).toFixed(1);
    const distanceFromBank = Math.min(point.position.x, riverConfig.width - point.position.x);
    
    panel.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
            <div style="font-size: 40px;">📍</div>
            <div>
                <h3 style="margin: 0; font-size: 18px;">当前采样点位</h3>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">ID: ${point.id}</p>
            </div>
            <div style="margin-left: auto; text-align: right;">
                <span style="background: ${point.isValid ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)'}; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                    ${point.isValid ? '✓ 有效点位' : '⚠ 需要调整'}
                </span>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">${typeName}</div>
                <div style="font-size: 12px; opacity: 0.8;">采样层位</div>
            </div>
            <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">${point.position.depth.toFixed(2)}m</div>
                <div style="font-size: 12px; opacity: 0.8;">采样深度 (${depthPercent}%)</div>
            </div>
            <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">${distanceFromBank.toFixed(1)}m</div>
                <div style="font-size: 12px; opacity: 0.8;">距岸距离</div>
            </div>
        </div>
        ${point.validationMessage && !point.isValid ? `
        <div style="margin-top: 15px; background: rgba(255,193,7,0.2); border-radius: 8px; padding: 10px; font-size: 13px;">
            <strong>⚠️ 提示：</strong>${point.validationMessage}
        </div>
        ` : ''}
    `;
    
    return panel;
}

/**
 * 创建可用器具面板
 * @param {Equipment[]} selectedEquipment - 已选器具列表
 * @param {Function} onEquipmentSelect - 器具选择回调
 * @returns {HTMLElement}
 */
function createEquipmentPanel(selectedEquipment, onEquipmentSelect) {
    const panel = document.createElement('div');
    panel.className = 'equipment-panel';
    panel.style.cssText = `
        background: #f8f9fa;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 20px;
    `;
    
    panel.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
            <h4 style="margin: 0; color: #333; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🧰</span> 可用器具
            </h4>
            <span style="background: #007bff; color: white; padding: 4px 10px; border-radius: 15px; font-size: 12px;">
                ${selectedEquipment.length} 件
            </span>
        </div>
    `;
    
    const equipmentGrid = document.createElement('div');
    equipmentGrid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px;';
    
    if (selectedEquipment.length === 0) {
        equipmentGrid.innerHTML = `
            <div style="width: 100%; text-align: center; color: #999; padding: 20px;">
                <p>暂无已选器具</p>
                <p style="font-size: 12px;">请先在"器具准备"阶段选择采样器具</p>
            </div>
        `;
    } else {
        selectedEquipment.forEach(equipment => {
            const equipmentItem = document.createElement('div');
            equipmentItem.className = 'equipment-item';
            equipmentItem.style.cssText = `
                background: white;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                padding: 10px 15px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            equipmentItem.innerHTML = `
                <span style="font-size: 20px;">${equipment.icon || '📦'}</span>
                <span style="font-size: 13px; font-weight: 500;">${equipment.name}</span>
            `;
            
            equipmentItem.addEventListener('mouseenter', () => {
                equipmentItem.style.borderColor = '#007bff';
                equipmentItem.style.transform = 'translateY(-2px)';
                equipmentItem.style.boxShadow = '0 4px 12px rgba(0,123,255,0.2)';
            });
            
            equipmentItem.addEventListener('mouseleave', () => {
                equipmentItem.style.borderColor = '#e9ecef';
                equipmentItem.style.transform = 'translateY(0)';
                equipmentItem.style.boxShadow = 'none';
            });
            
            equipmentItem.addEventListener('click', () => {
                if (onEquipmentSelect) {
                    onEquipmentSelect(equipment);
                }
            });
            
            equipmentGrid.appendChild(equipmentItem);
        });
    }
    
    panel.appendChild(equipmentGrid);
    return panel;
}

/**
 * 创建操作步骤指示器
 * @param {string} currentStep - 当前步骤ID
 * @param {Object} stepCounts - 各步骤完成次数
 * @returns {HTMLElement}
 */
function createStepIndicator(currentStep, stepCounts) {
    const indicator = document.createElement('div');
    indicator.className = 'step-indicator';
    indicator.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        margin-bottom: 25px;
        padding: 15px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    `;
    
    SAMPLING_STEPS.forEach((step, index) => {
        const currentIndex = SAMPLING_STEPS.findIndex(s => s.id === currentStep);
        const isComplete = index < currentIndex || (stepCounts[step.id] >= step.requiredCount);
        const isActive = step.id === currentStep;
        const count = stepCounts[step.id] || 0;
        
        // 步骤圆圈
        const stepEl = document.createElement('div');
        stepEl.className = `step-item step-${step.id}`;
        stepEl.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            position: relative;
        `;
        
        const circle = document.createElement('div');
        circle.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: all 0.3s;
            ${isComplete ? 'background: #28a745; color: white;' : 
              isActive ? 'background: #007bff; color: white; box-shadow: 0 0 0 4px rgba(0,123,255,0.3);' : 
              'background: #e9ecef; color: #666;'}
        `;
        circle.innerHTML = isComplete ? '✓' : step.icon;
        
        const label = document.createElement('div');
        label.style.cssText = `
            font-size: 12px;
            font-weight: ${isActive ? 'bold' : 'normal'};
            color: ${isComplete ? '#28a745' : isActive ? '#007bff' : '#666'};
        `;
        label.textContent = step.name;
        
        // 显示完成次数（如果需要多次）
        if (step.requiredCount > 1) {
            const countBadge = document.createElement('div');
            countBadge.style.cssText = `
                font-size: 10px;
                color: ${count >= step.requiredCount ? '#28a745' : '#999'};
            `;
            countBadge.textContent = `${count}/${step.requiredCount}`;
            stepEl.appendChild(circle);
            stepEl.appendChild(label);
            stepEl.appendChild(countBadge);
        } else {
            stepEl.appendChild(circle);
            stepEl.appendChild(label);
        }
        
        indicator.appendChild(stepEl);
        
        // 添加连接线（除了最后一个）
        if (index < SAMPLING_STEPS.length - 1) {
            const connector = document.createElement('div');
            connector.style.cssText = `
                width: 40px;
                height: 3px;
                background: ${index < currentIndex ? '#28a745' : '#e9ecef'};
                margin-bottom: 25px;
                border-radius: 2px;
            `;
            indicator.appendChild(connector);
        }
    });
    
    return indicator;
}

/**
 * 创建采样操作界面
 */
function createSamplingOperationUI(container, simulation, pointId) {
    const state = { rinseCount: 0, currentStep: 'rinse', operations: [], waterLevel: 0 };
    
    const mainDiv = document.createElement('div');
    mainDiv.className = 'sampling-operation';
    mainDiv.style.cssText = 'padding: 20px; text-align: center;';
    
    // 步骤指示器
    const stepsDiv = document.createElement('div');
    stepsDiv.style.cssText = 'display: flex; justify-content: center; gap: 20px; margin-bottom: 30px;';
    SAMPLING_STEPS.forEach((step, i) => {
        const stepEl = document.createElement('div');
        stepEl.id = `step-${step.id}`;
        stepEl.style.cssText = `padding: 10px 20px; border-radius: 20px; background: ${i === 0 ? '#007bff' : '#e9ecef'}; color: ${i === 0 ? 'white' : '#666'};`;
        stepEl.textContent = `${i + 1}. ${step.name}`;
        stepsDiv.appendChild(stepEl);
    });
    mainDiv.appendChild(stepsDiv);
    
    // 采样瓶动画区域
    const bottleDiv = document.createElement('div');
    bottleDiv.style.cssText = 'position: relative; width: 120px; height: 200px; margin: 0 auto 30px; border: 3px solid #333; border-radius: 0 0 20px 20px; background: linear-gradient(to top, #4A90D9 0%, transparent 0%); transition: background 0.5s;';
    bottleDiv.innerHTML = '<div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); width: 60px; height: 20px; background: #333; border-radius: 5px 5px 0 0;"></div>';
    mainDiv.appendChild(bottleDiv);
    
    // 操作按钮
    const btnDiv = document.createElement('div');
    btnDiv.style.cssText = 'display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;';
    
    const rinseBtn = createOpButton('🔄 润洗', '#17a2b8', () => performRinse());
    const sampleBtn = createOpButton('💧 采样', '#28a745', () => performSample());
    const sealBtn = createOpButton('🔒 封口', '#ffc107', () => performSeal());
    const labelBtn = createOpButton('🏷️ 贴标签', '#6c757d', () => performLabel());
    
    sampleBtn.disabled = true; sealBtn.disabled = true; labelBtn.disabled = true;
    btnDiv.append(rinseBtn, sampleBtn, sealBtn, labelBtn);
    mainDiv.appendChild(btnDiv);
    
    // 状态提示
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = 'margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px;';
    statusDiv.innerHTML = '<p>请先进行<strong>润洗操作</strong>（至少2次）</p>';
    mainDiv.appendChild(statusDiv);
    
    function createOpButton(text, color, onClick) {
        const btn = document.createElement('button');
        btn.style.cssText = `padding: 12px 24px; background: ${color}; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;`;
        btn.textContent = text;
        btn.addEventListener('click', onClick);
        return btn;
    }
    
    function performRinse() {
        state.rinseCount++;
        state.waterLevel = 30;
        bottleDiv.style.background = `linear-gradient(to top, #4A90D9 ${state.waterLevel}%, transparent ${state.waterLevel}%)`;
        setTimeout(() => { state.waterLevel = 0; bottleDiv.style.background = 'linear-gradient(to top, #4A90D9 0%, transparent 0%)'; }, 500);
        
        simulation.performOperation({ pointId, step: 'rinse', duration: 500 });
        
        if (state.rinseCount >= 2) {
            sampleBtn.disabled = false;
            updateStep('sample');
            statusDiv.innerHTML = `<p>✅ 润洗完成（${state.rinseCount}次），可以开始<strong>采样</strong></p>`;
        } else {
            statusDiv.innerHTML = `<p>润洗 ${state.rinseCount}/2 次，请继续润洗</p>`;
        }
    }
    
    function performSample() {
        state.waterLevel = 80;
        bottleDiv.style.background = `linear-gradient(to top, #4A90D9 ${state.waterLevel}%, transparent ${state.waterLevel}%)`;
        simulation.performOperation({ pointId, step: 'sample', duration: 1000 });
        sampleBtn.disabled = true; sealBtn.disabled = false;
        updateStep('seal');
        statusDiv.innerHTML = '<p>✅ 采样完成，请进行<strong>封口</strong></p>';
    }
    
    function performSeal() {
        simulation.performOperation({ pointId, step: 'seal', duration: 300 });
        sealBtn.disabled = true; labelBtn.disabled = false;
        updateStep('label');
        statusDiv.innerHTML = '<p>✅ 封口完成，请<strong>贴标签</strong></p>';
    }
    
    function performLabel() {
        simulation.performOperation({ pointId, step: 'label', duration: 300 });
        labelBtn.disabled = true;
        updateStep('complete');
        statusDiv.innerHTML = '<p style="color: #28a745;">🎉 采样操作完成！</p>';
    }
    
    function updateStep(stepId) {
        state.currentStep = stepId;
        SAMPLING_STEPS.forEach((step, i) => {
            const el = mainDiv.querySelector(`#step-${step.id}`);
            const isActive = step.id === stepId;
            const isComplete = SAMPLING_STEPS.findIndex(s => s.id === stepId) > i;
            el.style.background = isComplete ? '#28a745' : (isActive ? '#007bff' : '#e9ecef');
            el.style.color = (isComplete || isActive) ? 'white' : '#666';
        });
    }
    
    container.appendChild(mainDiv);
    return { element: mainDiv, getState: () => ({ ...state }) };
}

// ================= 现场测定功能 =================

/**
 * 现场测定参数配置
 */
const FIELD_MEASUREMENT_CONFIG = {
    temperature: { name: '水温', unit: '°C', min: 5, max: 30, precision: 1 },
    pH: { name: 'pH值', unit: '', min: 6.5, max: 8.5, precision: 2 },
    DO: { name: '溶解氧', unit: 'mg/L', min: 4, max: 12, precision: 2 },
    conductivity: { name: '电导率', unit: 'μS/cm', min: 100, max: 1000, precision: 0 },
    turbidity: { name: '浊度', unit: 'NTU', min: 1, max: 50, precision: 1 }
};

/**
 * 生成模拟测定值
 */
function generateMeasurementValue(parameter) {
    const config = FIELD_MEASUREMENT_CONFIG[parameter];
    if (!config) return null;
    const value = config.min + Math.random() * (config.max - config.min);
    return Number(value.toFixed(config.precision));
}

/**
 * 创建现场测定界面
 */
function createFieldMeasurementUI(container, simulation, pointId) {
    const mainDiv = document.createElement('div');
    mainDiv.style.cssText = 'padding: 20px;';
    mainDiv.innerHTML = '<h3 style="text-align: center; margin-bottom: 20px;">📊 现场测定</h3>';
    
    const gridDiv = document.createElement('div');
    gridDiv.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;';
    
    Object.entries(FIELD_MEASUREMENT_CONFIG).forEach(([param, config]) => {
        const card = document.createElement('div');
        card.style.cssText = 'background: white; border: 1px solid #ddd; border-radius: 10px; padding: 15px; text-align: center;';
        card.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">${param === 'temperature' ? '🌡️' : param === 'pH' ? '📊' : param === 'DO' ? '💨' : '📈'}</div>
            <div style="font-weight: bold; margin-bottom: 5px;">${config.name}</div>
            <div id="value-${param}" style="font-size: 28px; color: #007bff; margin: 10px 0;">--</div>
            <div style="color: #666; font-size: 12px;">${config.unit}</div>
            <button id="btn-${param}" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">测定</button>
        `;
        
        card.querySelector(`#btn-${param}`).addEventListener('click', () => {
            const value = generateMeasurementValue(param);
            card.querySelector(`#value-${param}`).textContent = value + (config.unit ? ' ' + config.unit : '');
            simulation.recordMeasurement({ pointId, parameter: param, value, unit: config.unit });
            card.querySelector(`#btn-${param}`).textContent = '✓ 已测定';
            card.querySelector(`#btn-${param}`).disabled = true;
            card.querySelector(`#btn-${param}`).style.background = '#28a745';
        });
        
        gridDiv.appendChild(card);
    });
    
    mainDiv.appendChild(gridDiv);
    container.appendChild(mainDiv);
    return { element: mainDiv };
}

// ================= 样品保存功能 =================

/**
 * 保存方法配置
 */
const PRESERVATION_METHODS = {
    none: { name: '不加保存剂', description: '现场测定项目', icon: '⭕' },
    acid: { name: '加酸(pH<2)', description: '重金属、COD等', icon: '🧪' },
    alkali: { name: '加碱(pH>12)', description: '氰化物、硫化物', icon: '🧴' },
    refrigeration: { name: '冷藏(4°C)', description: 'BOD、营养盐等', icon: '🧊' },
    fixation: { name: '固定剂', description: '溶解氧', icon: '💧' }
};

/**
 * 创建样品保存界面
 */
function createPreservationUI(container, simulation, monitoringParameter) {
    const mainDiv = document.createElement('div');
    mainDiv.style.cssText = 'padding: 20px;';
    mainDiv.innerHTML = '<h3 style="text-align: center; margin-bottom: 20px;">🧊 样品保存</h3>';
    
    const gridDiv = document.createElement('div');
    gridDiv.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;';
    
    Object.entries(PRESERVATION_METHODS).forEach(([method, config]) => {
        const card = document.createElement('div');
        card.style.cssText = 'background: white; border: 2px solid #ddd; border-radius: 10px; padding: 15px; text-align: center; cursor: pointer; transition: all 0.2s;';
        card.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 10px;">${config.icon}</div>
            <div style="font-weight: bold;">${config.name}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">${config.description}</div>
        `;
        
        card.addEventListener('click', () => {
            gridDiv.querySelectorAll('div').forEach(c => { c.style.borderColor = '#ddd'; c.style.background = 'white'; });
            card.style.borderColor = '#007bff';
            card.style.background = '#e7f3ff';
            
            const result = simulation.setPreservation({ sampleId: `sample-${Date.now()}`, method, parameter: monitoringParameter });
            
            const existingMsg = mainDiv.querySelector('.preservation-msg');
            if (existingMsg) existingMsg.remove();
            
            const msgDiv = document.createElement('div');
            msgDiv.className = 'preservation-msg';
            msgDiv.style.cssText = `margin-top: 20px; padding: 15px; border-radius: 8px; background: ${result.isValid ? '#d4edda' : '#f8d7da'}; color: ${result.isValid ? '#155724' : '#721c24'};`;
            msgDiv.innerHTML = `<strong>${result.isValid ? '✅ 保存方法正确' : '⚠️ 保存方法不匹配'}</strong><p style="margin: 5px 0 0 0;">${result.message || ''}</p>`;
            mainDiv.appendChild(msgDiv);
        });
        
        gridDiv.appendChild(card);
    });
    
    mainDiv.appendChild(gridDiv);
    container.appendChild(mainDiv);
    return { element: mainDiv };
}

// ================= 评分系统 =================

/**
 * 评分权重配置
 */
const SCORE_WEIGHTS = {
    pointSelection: 20,
    equipmentChoice: 20,
    operationSteps: 30,
    fieldMeasurement: 15,
    preservation: 15
};

/**
 * 计算综合评分
 */
function calculateScore(simulationState) {
    const result = {
        totalScore: 0,
        dimensions: {},
        errors: [],
        grade: 'fail',
        suggestions: []
    };
    
    // 点位选择得分
    const validPoints = simulationState.selectedPoints.filter(p => p.isValid).length;
    const totalPoints = simulationState.selectedPoints.length;
    const pointScore = totalPoints > 0 ? (validPoints / totalPoints) * SCORE_WEIGHTS.pointSelection : 0;
    result.dimensions.pointSelection = { score: Math.round(pointScore), maxScore: SCORE_WEIGHTS.pointSelection, details: [`有效点位: ${validPoints}/${totalPoints}`] };
    
    // 器具选择得分
    const equipmentScore = simulationState.selectedEquipment.length > 0 ? SCORE_WEIGHTS.equipmentChoice : 0;
    result.dimensions.equipmentChoice = { score: equipmentScore, maxScore: SCORE_WEIGHTS.equipmentChoice, details: [`已选器具: ${simulationState.selectedEquipment.length}种`] };
    
    // 操作规范得分
    const correctOps = simulationState.samplingOperations.filter(op => op.isCorrect).length;
    const totalOps = simulationState.samplingOperations.length;
    const opScore = totalOps > 0 ? (correctOps / totalOps) * SCORE_WEIGHTS.operationSteps : 0;
    result.dimensions.operationSteps = { score: Math.round(opScore), maxScore: SCORE_WEIGHTS.operationSteps, details: [`正确操作: ${correctOps}/${totalOps}`] };
    
    // 现场测定得分
    const measureScore = simulationState.fieldMeasurements.length > 0 ? SCORE_WEIGHTS.fieldMeasurement : 0;
    result.dimensions.fieldMeasurement = { score: measureScore, maxScore: SCORE_WEIGHTS.fieldMeasurement, details: [`测定项目: ${simulationState.fieldMeasurements.length}项`] };
    
    // 样品保存得分
    const correctPreserve = simulationState.preservationMethods.filter(p => p.isCorrect).length;
    const totalPreserve = simulationState.preservationMethods.length;
    const preserveScore = totalPreserve > 0 ? (correctPreserve / totalPreserve) * SCORE_WEIGHTS.preservation : 0;
    result.dimensions.preservation = { score: Math.round(preserveScore), maxScore: SCORE_WEIGHTS.preservation, details: [`正确保存: ${correctPreserve}/${totalPreserve}`] };
    
    // 计算总分
    result.totalScore = Object.values(result.dimensions).reduce((sum, d) => sum + d.score, 0);
    
    // 扣分项
    result.errors = simulationState.errors.map(e => ({ step: e.phase, description: e.description, deduction: e.deduction }));
    const totalDeduction = result.errors.reduce((sum, e) => sum + e.deduction, 0);
    result.totalScore = Math.max(0, result.totalScore - totalDeduction);
    
    // 评级
    if (result.totalScore >= 90) result.grade = 'excellent';
    else if (result.totalScore >= 80) result.grade = 'good';
    else if (result.totalScore >= 60) result.grade = 'pass';
    else result.grade = 'fail';
    
    return result;
}

/**
 * 创建评分报告界面
 */
function createScoreReportUI(container, scoreResult) {
    const gradeColors = { excellent: '#28a745', good: '#17a2b8', pass: '#ffc107', fail: '#dc3545' };
    const gradeNames = { excellent: '优秀', good: '良好', pass: '及格', fail: '不及格' };
    
    const mainDiv = document.createElement('div');
    mainDiv.style.cssText = 'padding: 20px; max-width: 600px; margin: 0 auto;';
    
    // 总分显示
    mainDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; font-weight: bold; color: ${gradeColors[scoreResult.grade]};">${scoreResult.totalScore}</div>
            <div style="font-size: 24px; color: ${gradeColors[scoreResult.grade]};">${gradeNames[scoreResult.grade]}</div>
        </div>
    `;
    
    // 各维度得分
    const dimensionsDiv = document.createElement('div');
    dimensionsDiv.style.cssText = 'background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 20px;';
    dimensionsDiv.innerHTML = '<h4 style="margin: 0 0 15px 0;">📊 各项得分</h4>';
    
    const dimNames = { pointSelection: '点位选择', equipmentChoice: '器具选择', operationSteps: '操作规范', fieldMeasurement: '现场测定', preservation: '样品保存' };
    Object.entries(scoreResult.dimensions).forEach(([key, dim]) => {
        const percent = (dim.score / dim.maxScore) * 100;
        dimensionsDiv.innerHTML += `
            <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${dimNames[key]}</span>
                    <span>${dim.score}/${dim.maxScore}</span>
                </div>
                <div style="background: #e9ecef; border-radius: 5px; height: 10px;">
                    <div style="background: ${percent >= 80 ? '#28a745' : percent >= 60 ? '#ffc107' : '#dc3545'}; width: ${percent}%; height: 100%; border-radius: 5px;"></div>
                </div>
            </div>
        `;
    });
    mainDiv.appendChild(dimensionsDiv);
    
    // 扣分项
    if (scoreResult.errors.length > 0) {
        const errorsDiv = document.createElement('div');
        errorsDiv.style.cssText = 'background: #fff3cd; border-radius: 10px; padding: 20px;';
        errorsDiv.innerHTML = '<h4 style="margin: 0 0 15px 0;">⚠️ 扣分项</h4>';
        scoreResult.errors.forEach(err => {
            errorsDiv.innerHTML += `<div style="padding: 8px 0; border-bottom: 1px solid #ffc107;">• ${err.description} (-${err.deduction}分)</div>`;
        });
        mainDiv.appendChild(errorsDiv);
    }
    
    container.appendChild(mainDiv);
    return { element: mainDiv };
}

// ================= 导出 =================

// 如果在模块环境中，导出类和常量
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WaterSamplingSimulation,
        SimulationPhase,
        SIMULATION_PHASE_ORDER,
        SimulationPhaseNames,
        DEFAULT_RIVER_CONFIG,
        createInitialState,
        STORAGE_KEY,
        RiverSceneRenderer,
        SCENE_CONFIG,
        RiverSceneInteraction,
        createRiverScene,
        // HJ/T 91-2002 点位验证相关
        HJT91_VALIDATION_RULES,
        validateSamplingPointHJT91,
        getSamplingPointValidationReport,
        generateSamplingRecommendations,
        showPointValidationWarning,
        // 断面详情视图相关
        CROSS_SECTION_CONFIG,
        CrossSectionRenderer,
        CrossSectionInteraction,
        createCrossSectionView,
        createPointTypeSelector,
        // 采样器具相关
        EQUIPMENT_DATABASE,
        EQUIPMENT_MATCHING_RULES,
        validateEquipmentSelection,
        getRecommendedEquipment,
        createEquipmentSelector,
        createEquipmentCard,
        showEquipmentMismatchWarning,
        // 采样操作相关
        SAMPLING_STEPS,
        createSamplingOperationUI,
        // 现场测定相关
        FIELD_MEASUREMENT_CONFIG,
        generateMeasurementValue,
        createFieldMeasurementUI,
        // 样品保存相关
        PRESERVATION_METHODS,
        createPreservationUI,
        // 评分系统相关
        SCORE_WEIGHTS,
        calculateScore,
        createScoreReportUI
    };
}
