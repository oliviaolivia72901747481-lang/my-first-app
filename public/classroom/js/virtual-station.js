/**
 * 虚拟工位平台核心模块
 * Virtual Station Platform Core Module
 * 
 * 提供深度场景化实训的核心系统，包含：
 * - 工位管理 (WorkstationService)
 * - 任务流管理 (TaskFlowService)
 * - 过程追踪 (ProcessTrackerService)
 * - 职业成长 (CareerService)
 * - 成就系统 (AchievementService)
 */

// ================= 性能优化工具函数 =================

/**
 * 防抖函数 - 减少频繁调用
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数 - 限制调用频率
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit = 1000) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 批量请求管理器 - 合并多个请求减少API调用
 */
class BatchRequestManager {
    constructor(batchDelay = 50) {
        this._pendingRequests = new Map();
        this._batchDelay = batchDelay;
        this._timers = new Map();
    }

    /**
     * 添加请求到批次
     * @param {string} key 请求类型标识
     * @param {string} id 请求ID
     * @param {Function} executor 执行函数
     * @returns {Promise} 请求结果
     */
    add(key, id, executor) {
        return new Promise((resolve, reject) => {
            if (!this._pendingRequests.has(key)) {
                this._pendingRequests.set(key, new Map());
            }
            
            const batch = this._pendingRequests.get(key);
            batch.set(id, { resolve, reject, executor });
            
            // 清除之前的定时器
            if (this._timers.has(key)) {
                clearTimeout(this._timers.get(key));
            }
            
            // 设置新的定时器
            this._timers.set(key, setTimeout(() => {
                this._executeBatch(key);
            }, this._batchDelay));
        });
    }

    async _executeBatch(key) {
        const batch = this._pendingRequests.get(key);
        if (!batch || batch.size === 0) return;
        
        this._pendingRequests.delete(key);
        this._timers.delete(key);
        
        // 执行批量请求
        for (const [id, { resolve, reject, executor }] of batch) {
            try {
                const result = await executor();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }
    }
}

// 全局批量请求管理器实例
const batchRequestManager = new BatchRequestManager();

// ================= 数据模型定义 =================

/**
 * 工位类别枚举
 * @typedef {'env_monitoring'|'hazwaste'|'sampling'|'data_analysis'|'instrument'|'emergency'} WorkstationCategory
 */
const WorkstationCategory = {
    ENV_MONITORING: 'env_monitoring',    // 环境监测
    HAZWASTE: 'hazwaste',                // 危废鉴别
    SAMPLING: 'sampling',                // 采样规划
    DATA_ANALYSIS: 'data_analysis',      // 数据处理
    INSTRUMENT: 'instrument',            // 仪器操作
    EMERGENCY: 'emergency'               // 应急响应
};

/**
 * 工位类别中文名称映射
 */
const WorkstationCategoryNames = {
    [WorkstationCategory.ENV_MONITORING]: '环境监测',
    [WorkstationCategory.HAZWASTE]: '危废鉴别',
    [WorkstationCategory.SAMPLING]: '采样规划',
    [WorkstationCategory.DATA_ANALYSIS]: '数据处理',
    [WorkstationCategory.INSTRUMENT]: '仪器操作',
    [WorkstationCategory.EMERGENCY]: '应急响应'
};

/**
 * 工位难度枚举
 * @typedef {'beginner'|'intermediate'|'advanced'} WorkstationDifficulty
 */
const WorkstationDifficulty = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced'
};

/**
 * 工位难度中文名称映射
 */
const WorkstationDifficultyNames = {
    [WorkstationDifficulty.BEGINNER]: '入门',
    [WorkstationDifficulty.INTERMEDIATE]: '进阶',
    [WorkstationDifficulty.ADVANCED]: '高级'
};

/**
 * 工位接口定义
 * @typedef {Object} Workstation
 * @property {string} id - 工位唯一标识
 * @property {string} name - 工位名称
 * @property {string} description - 工位描述
 * @property {string} icon - 图标类名 (remixicon)
 * @property {string} color - 主题颜色
 * @property {WorkstationCategory} category - 工位类别
 * @property {WorkstationDifficulty} difficulty - 难度等级
 * @property {number} estimatedTime - 预计完成时间（分钟）
 * @property {number} requiredLevel - 解锁所需等级
 * @property {number} totalTasks - 总任务数
 * @property {number} xpReward - 完成奖励经验值
 * @property {string} [certificateId] - 关联的上岗证ID
 * @property {boolean} isActive - 是否已激活
 * @property {string} [mode] - 特殊模式标签（如"剧本杀模式"、"沙盒模式"）
 * @property {string} [linkUrl] - 跳转链接（如果有独立页面）
 * @property {number} [createdAt] - 创建时间戳
 * @property {number} [updatedAt] - 更新时间戳
 */

/**
 * 工位进度接口定义
 * @typedef {Object} WorkstationProgress
 * @property {string} workstationId - 工位ID
 * @property {string} userId - 用户ID
 * @property {number} progress - 进度百分比 (0-100)
 * @property {number} completedTasks - 已完成任务数
 * @property {number} totalTasks - 总任务数
 * @property {string} status - 状态 ('not_started'|'in_progress'|'completed')
 * @property {number} [lastAccessedAt] - 最后访问时间
 * @property {number} [totalStudyTime] - 累计学习时长（分钟）
 */

/**
 * 工位信息（含进度）接口定义
 * @typedef {Workstation & { progress?: WorkstationProgress }} WorkstationInfo
 */

/**
 * 任务阶段类型枚举
 * @typedef {'task_receipt'|'plan_design'|'operation'|'record_filling'|'report_generation'|'simulation'} StageType
 */
const StageType = {
    TASK_RECEIPT: 'task_receipt',           // 接受任务单
    PLAN_DESIGN: 'plan_design',             // 制定方案
    OPERATION: 'operation',                 // 执行操作
    RECORD_FILLING: 'record_filling',       // 填写记录
    REPORT_GENERATION: 'report_generation', // 生成报告
    SIMULATION: 'simulation'                // 虚拟仿真
};

/**
 * 阶段类型中文名称映射
 */
const StageTypeNames = {
    [StageType.TASK_RECEIPT]: '接受任务单',
    [StageType.PLAN_DESIGN]: '制定方案',
    [StageType.OPERATION]: '执行操作',
    [StageType.RECORD_FILLING]: '填写记录',
    [StageType.REPORT_GENERATION]: '生成报告',
    [StageType.SIMULATION]: '虚拟仿真'
};

/**
 * 标准任务阶段顺序（用于验证）
 */
const STANDARD_STAGE_ORDER = [
    StageType.TASK_RECEIPT,
    StageType.PLAN_DESIGN,
    StageType.OPERATION,
    StageType.RECORD_FILLING,
    StageType.REPORT_GENERATION
];

/**
 * 任务简报接口定义
 * @typedef {Object} TaskBrief
 * @property {string} background - 任务背景
 * @property {string[]} objectives - 任务目标列表
 * @property {string[]} requirements - 任务要求列表
 * @property {number} [deadline] - 截止时间戳
 */

/**
 * 提示信息接口定义
 * @typedef {Object} Hint
 * @property {string} id - 提示ID
 * @property {string} content - 提示内容
 * @property {string} type - 提示类型 ('info'|'warning'|'tip')
 * @property {number} [cost] - 查看提示扣除的分数
 */

/**
 * 验证规则接口定义
 * @typedef {Object} ValidationRule
 * @property {string} field - 字段名
 * @property {string} type - 规则类型 ('required'|'minLength'|'maxLength'|'pattern'|'custom')
 * @property {any} value - 规则值
 * @property {string} message - 错误提示信息
 */

/**
 * 阶段模板接口定义
 * @typedef {Object} StageTemplate
 * @property {string} id - 模板ID
 * @property {string} name - 模板名称
 * @property {Object[]} fields - 模板字段列表
 * @property {string} [description] - 模板描述
 */

/**
 * 任务阶段接口定义
 * @typedef {Object} TaskStage
 * @property {string} id - 阶段ID
 * @property {string} name - 阶段名称
 * @property {StageType} type - 阶段类型
 * @property {number} order - 阶段顺序
 * @property {string} instructions - 阶段说明
 * @property {StageTemplate} [template] - 阶段模板
 * @property {Object} [simulation] - 仿真配置
 * @property {ValidationRule[]} validationRules - 验证规则
 * @property {string[]} requiredFields - 必填字段
 * @property {Hint[]} hints - 提示列表
 * @property {number} hintCost - 查看提示扣除的分数
 */

/**
 * 评分规则接口定义
 * @typedef {Object} ScoringRule
 * @property {string} id - 规则ID
 * @property {string} name - 规则名称
 * @property {number} maxScore - 最高分
 * @property {string} criteria - 评分标准描述
 */

/**
 * 任务接口定义
 * @typedef {Object} Task
 * @property {string} id - 任务ID
 * @property {string} workstationId - 所属工位ID
 * @property {string} name - 任务名称
 * @property {string} description - 任务描述
 * @property {number} order - 任务顺序
 * @property {TaskBrief} taskBrief - 任务简报
 * @property {TaskStage[]} stages - 任务阶段列表
 * @property {ScoringRule[]} scoringRules - 评分规则
 * @property {number} maxScore - 最高分
 * @property {number} passingScore - 及格分
 * @property {number} xpReward - 经验值奖励
 * @property {string[]} [achievements] - 关联成就ID列表
 */

/**
 * 任务执行状态枚举
 */
const TaskExecutionStatus = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

/**
 * 任务执行记录接口定义
 * @typedef {Object} TaskExecution
 * @property {string} id - 执行ID
 * @property {string} sessionId - 会话ID
 * @property {string} taskId - 任务ID
 * @property {string} userId - 用户ID
 * @property {number} startedAt - 开始时间
 * @property {number} [completedAt] - 完成时间
 * @property {number} currentStageIndex - 当前阶段索引
 * @property {string} status - 执行状态
 * @property {Object} stageData - 各阶段提交的数据
 * @property {number} score - 当前得分
 */

/**
 * 职业等级枚举
 * @typedef {'intern'|'trainee_engineer'|'assistant_engineer'|'engineer'|'senior_engineer'|'project_manager'} CareerLevel
 */
const CareerLevel = {
    INTERN: 'intern',                       // 实习生 (Lv.1-2)
    TRAINEE_ENGINEER: 'trainee_engineer',   // 见习工程师 (Lv.3-5)
    ASSISTANT_ENGINEER: 'assistant_engineer', // 助理工程师 (Lv.6-8)
    ENGINEER: 'engineer',                   // 工程师 (Lv.9-11)
    SENIOR_ENGINEER: 'senior_engineer',     // 高级工程师 (Lv.12-14)
    PROJECT_MANAGER: 'project_manager'      // 项目经理 (Lv.15+)
};

/**
 * 行为类型枚举
 * @typedef {'page_view'|'field_focus'|'field_blur'|'field_modify'|'hint_view'|'submission'|'error_occur'|'simulation_action'} ActionType
 */
const ActionType = {
    PAGE_VIEW: 'page_view',
    FIELD_FOCUS: 'field_focus',
    FIELD_BLUR: 'field_blur',
    FIELD_MODIFY: 'field_modify',
    HINT_VIEW: 'hint_view',
    SUBMISSION: 'submission',
    ERROR_OCCUR: 'error_occur',
    SIMULATION_ACTION: 'simulation_action'
};

/**
 * 成就稀有度枚举
 */
const AchievementRarity = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

/**
 * 成就稀有度中文名称映射
 */
const AchievementRarityNames = {
    [AchievementRarity.COMMON]: '普通',
    [AchievementRarity.RARE]: '稀有',
    [AchievementRarity.EPIC]: '史诗',
    [AchievementRarity.LEGENDARY]: '传说'
};

/**
 * 成就稀有度颜色映射
 */
const AchievementRarityColors = {
    [AchievementRarity.COMMON]: { bg: 'from-gray-500 to-gray-600', border: 'border-gray-400', text: 'text-gray-300' },
    [AchievementRarity.RARE]: { bg: 'from-blue-500 to-cyan-600', border: 'border-blue-400', text: 'text-blue-300' },
    [AchievementRarity.EPIC]: { bg: 'from-purple-500 to-pink-600', border: 'border-purple-400', text: 'text-purple-300' },
    [AchievementRarity.LEGENDARY]: { bg: 'from-amber-500 to-orange-600', border: 'border-amber-400', text: 'text-amber-300' }
};

/**
 * 成就条件类型枚举
 * @typedef {'task_complete'|'workstation_complete'|'streak'|'score'|'time'|'special'|'level'|'tasks_count'|'first_try_pass'} AchievementConditionType
 */
const AchievementConditionType = {
    TASK_COMPLETE: 'task_complete',           // 完成特定任务
    WORKSTATION_COMPLETE: 'workstation_complete', // 完成特定工位
    STREAK: 'streak',                         // 连续学习天数
    SCORE: 'score',                           // 达到特定分数
    TIME: 'time',                             // 累计学习时长
    SPECIAL: 'special',                       // 特殊条件
    LEVEL: 'level',                           // 达到特定等级
    TASKS_COUNT: 'tasks_count',               // 完成任务数量
    FIRST_TRY_PASS: 'first_try_pass'          // 首次尝试通过
};

/**
 * 成就接口定义
 * @typedef {Object} Achievement
 * @property {string} id - 成就唯一标识
 * @property {string} name - 成就名称
 * @property {string} description - 成就描述
 * @property {string} icon - 图标类名 (remixicon)
 * @property {AchievementRarity} rarity - 稀有度
 * @property {AchievementCondition} condition - 解锁条件
 * @property {number} xpReward - 经验值奖励
 * @property {boolean} [isUnlocked] - 是否已解锁
 * @property {number} [unlockedAt] - 解锁时间戳
 * @property {number} [current] - 当前进度（用于显示）
 */

/**
 * 成就条件接口定义
 * @typedef {Object} AchievementCondition
 * @property {AchievementConditionType} type - 条件类型
 * @property {string|number} target - 目标值
 * @property {number} [current] - 当前进度
 */

/**
 * 上岗证接口定义
 * @typedef {Object} Certificate
 * @property {string} id - 证书唯一标识
 * @property {string} userId - 用户ID
 * @property {string} workstationId - 工位ID
 * @property {string} workstationName - 工位名称
 * @property {number} grantedAt - 颁发时间戳
 * @property {string} [certificateNumber] - 证书编号
 */


// ================= 等级配置 =================

/**
 * 职业等级配置表
 */
const LEVEL_CONFIG = [
    { level: 1, title: CareerLevel.INTERN, titleCN: '实习生', xpRequired: 0, icon: 'ri-user-line' },
    { level: 2, title: CareerLevel.INTERN, titleCN: '实习生', xpRequired: 200, icon: 'ri-user-line' },
    { level: 3, title: CareerLevel.TRAINEE_ENGINEER, titleCN: '见习工程师', xpRequired: 500, icon: 'ri-user-star-line' },
    { level: 4, title: CareerLevel.TRAINEE_ENGINEER, titleCN: '见习工程师', xpRequired: 900, icon: 'ri-user-star-line' },
    { level: 5, title: CareerLevel.TRAINEE_ENGINEER, titleCN: '见习工程师', xpRequired: 1400, icon: 'ri-user-star-line' },
    { level: 6, title: CareerLevel.ASSISTANT_ENGINEER, titleCN: '助理工程师', xpRequired: 2000, icon: 'ri-user-settings-line' },
    { level: 7, title: CareerLevel.ASSISTANT_ENGINEER, titleCN: '助理工程师', xpRequired: 2700, icon: 'ri-user-settings-line' },
    { level: 8, title: CareerLevel.ASSISTANT_ENGINEER, titleCN: '助理工程师', xpRequired: 3500, icon: 'ri-user-settings-line' },
    { level: 9, title: CareerLevel.ENGINEER, titleCN: '工程师', xpRequired: 4500, icon: 'ri-user-follow-line' },
    { level: 10, title: CareerLevel.ENGINEER, titleCN: '工程师', xpRequired: 5600, icon: 'ri-user-follow-line' },
    { level: 11, title: CareerLevel.ENGINEER, titleCN: '工程师', xpRequired: 6800, icon: 'ri-user-follow-line' },
    { level: 12, title: CareerLevel.SENIOR_ENGINEER, titleCN: '高级工程师', xpRequired: 8200, icon: 'ri-user-star-fill' },
    { level: 13, title: CareerLevel.SENIOR_ENGINEER, titleCN: '高级工程师', xpRequired: 9800, icon: 'ri-user-star-fill' },
    { level: 14, title: CareerLevel.SENIOR_ENGINEER, titleCN: '高级工程师', xpRequired: 11600, icon: 'ri-user-star-fill' },
    { level: 15, title: CareerLevel.PROJECT_MANAGER, titleCN: '项目经理', xpRequired: 15000, icon: 'ri-vip-crown-line' }
];

/**
 * 停顿阈值配置（秒）
 */
const PAUSE_THRESHOLD = {
    DEFAULT: 60,        // 默认60秒
    SIMPLE_TASK: 30,    // 简单任务30秒
    COMPLEX_TASK: 120   // 复杂任务120秒
};

/**
 * 共性问题阈值（百分比）
 */
const COMMON_ERROR_THRESHOLD = 0.2; // 20%的学生出现同一错误则标记为共性问题

// ================= 预设工位数据 =================

/**
 * 预设工位数据列表
 * 包含环境监测站、危废鉴别实验室、采样规划中心等实训场景
 * @type {Workstation[]}
 */
const PRESET_WORKSTATIONS = [
    {
        id: 'env-monitoring',
        name: '环境监测站',
        description: '水质监测、大气监测、土壤监测全流程实训',
        icon: 'ri-flask-line',
        color: 'cyan',
        category: WorkstationCategory.ENV_MONITORING,
        difficulty: WorkstationDifficulty.INTERMEDIATE,
        estimatedTime: 120,
        requiredLevel: 1,
        totalTasks: 7,
        xpReward: 500,
        certificateId: 'cert-env-monitoring',
        isActive: true,
        mode: null,
        linkUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'hazwaste-lab',
        name: '危废鉴别实验室',
        description: 'GB 5085系列标准学习，沉浸式推理鉴别',
        icon: 'ri-skull-line',
        color: 'orange',
        category: WorkstationCategory.HAZWASTE,
        difficulty: WorkstationDifficulty.ADVANCED,
        estimatedTime: 90,
        requiredLevel: 3,
        totalTasks: 5,
        xpReward: 600,
        certificateId: 'cert-hazwaste',
        isActive: true,
        mode: '剧本杀模式',
        linkUrl: 'hazwaste-detective.html',
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'sampling-center',
        name: '采样规划中心',
        description: '布点方案设计、采样计划制定、现场模拟',
        icon: 'ri-map-pin-line',
        color: 'emerald',
        category: WorkstationCategory.SAMPLING,
        difficulty: WorkstationDifficulty.INTERMEDIATE,
        estimatedTime: 60,
        requiredLevel: 2,
        totalTasks: 4,
        xpReward: 400,
        certificateId: 'cert-sampling',
        isActive: true,
        mode: '沙盒模式',
        linkUrl: 'sampling-sandbox.html',
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'data-center',
        name: '数据处理中心',
        description: '监测数据分析、报告生成、质量控制',
        icon: 'ri-database-2-line',
        color: 'purple',
        category: WorkstationCategory.DATA_ANALYSIS,
        difficulty: WorkstationDifficulty.INTERMEDIATE,
        estimatedTime: 90,
        requiredLevel: 4,
        totalTasks: 6,
        xpReward: 450,
        certificateId: 'cert-data-analysis',
        isActive: false,
        mode: null,
        linkUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'instrument-room',
        name: '仪器操作室',
        description: '分析仪器虚拟操作、参数调节、故障排除',
        icon: 'ri-microscope-line',
        color: 'pink',
        category: WorkstationCategory.INSTRUMENT,
        difficulty: WorkstationDifficulty.ADVANCED,
        estimatedTime: 120,
        requiredLevel: 5,
        totalTasks: 8,
        xpReward: 700,
        certificateId: 'cert-instrument',
        isActive: false,
        mode: null,
        linkUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'emergency-center',
        name: '应急响应中心',
        description: '环境应急预案、事故处置、现场指挥模拟',
        icon: 'ri-alarm-warning-line',
        color: 'red',
        category: WorkstationCategory.EMERGENCY,
        difficulty: WorkstationDifficulty.ADVANCED,
        estimatedTime: 150,
        requiredLevel: 8,
        totalTasks: 10,
        xpReward: 1000,
        certificateId: 'cert-emergency',
        isActive: false,
        mode: null,
        linkUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }
];

// ================= 预设任务数据 =================

/**
 * 预设任务数据列表
 * 包含各工位的实训任务
 * @type {Task[]}
 */
const PRESET_TASKS = [
    // 环境监测站任务
    {
        id: 'task-env-water-sampling',
        workstationId: 'env-monitoring',
        name: '地表水采样方案设计',
        description: '根据监测目的设计完整的地表水采样方案',
        order: 1,
        taskBrief: {
            background: '某河流下游出现水质异常，需要对该河段进行水质监测。监测断面位于工业园区下游2公里处，河流宽度约50米，平均水深2米。',
            objectives: [
                '确定采样点位布设方案',
                '选择合适的采样方法和采样器具',
                '制定采样频次和时间安排',
                '编制采样记录表'
            ],
            requirements: [
                '符合HJ/T 91-2002《地表水和污水监测技术规范》',
                '采样点位应具有代表性',
                '采样方法应符合相关标准要求',
                '记录表格式规范完整'
            ],
            deadline: null
        },
        stages: [
            {
                id: 'stage-env-water-1',
                name: '接受任务单',
                type: StageType.TASK_RECEIPT,
                order: 1,
                instructions: '请仔细阅读任务背景、目标和要求，确认理解后点击"接受任务"开始。',
                template: null,
                validationRules: [],
                requiredFields: ['confirmed'],
                hints: [
                    { id: 'hint-1-1', content: '注意阅读任务背景中的关键信息：河流宽度、水深等', type: 'tip', cost: 0 }
                ],
                hintCost: 0
            },
            {
                id: 'stage-env-water-2',
                name: '制定采样方案',
                type: StageType.PLAN_DESIGN,
                order: 2,
                instructions: '根据任务要求，设计完整的采样方案。',
                template: {
                    id: 'tpl-sampling-plan',
                    name: '采样方案模板',
                    description: '地表水采样方案设计模板',
                    fields: [
                        { name: 'samplingPurpose', label: '监测目的', type: 'textarea', required: true },
                        { name: 'samplingPoints', label: '采样点位', type: 'textarea', required: true },
                        { name: 'samplingMethod', label: '采样方法', type: 'select', options: ['直接采样法', '混合采样法', '自动采样法'], required: true },
                        { name: 'samplingFrequency', label: '采样频次', type: 'text', required: true },
                        { name: 'samplingTime', label: '采样时间', type: 'text', required: true },
                        { name: 'preservationMethod', label: '样品保存方法', type: 'textarea', required: true },
                        { name: 'qualityControl', label: '质量控制措施', type: 'textarea', required: true }
                    ]
                },
                validationRules: [
                    { field: 'samplingPurpose', type: 'required', value: true, message: '请填写监测目的' },
                    { field: 'samplingPurpose', type: 'minLength', value: 20, message: '监测目的描述不少于20字' },
                    { field: 'samplingPoints', type: 'required', value: true, message: '请填写采样点位' },
                    { field: 'samplingMethod', type: 'required', value: true, message: '请选择采样方法' },
                    { field: 'samplingFrequency', type: 'required', value: true, message: '请填写采样频次' },
                    { field: 'preservationMethod', type: 'required', value: true, message: '请填写样品保存方法' }
                ],
                requiredFields: ['samplingPurpose', 'samplingPoints', 'samplingMethod', 'samplingFrequency', 'preservationMethod'],
                hints: [
                    { id: 'hint-2-1', content: '根据HJ/T 91-2002，河流采样断面应设置在水质均匀处', type: 'info', cost: 5 },
                    { id: 'hint-2-2', content: '采样频次应考虑污染物排放规律和水文条件', type: 'tip', cost: 5 }
                ],
                hintCost: 5
            },
            {
                id: 'stage-env-water-3',
                name: '模拟采样操作',
                type: StageType.OPERATION,
                order: 3,
                instructions: '按照制定的方案，在虚拟环境中完成采样操作。',
                template: null,
                simulation: {
                    type: 'water_sampling',
                    config: { riverWidth: 50, riverDepth: 2 }
                },
                validationRules: [],
                requiredFields: ['operationCompleted'],
                hints: [
                    { id: 'hint-3-1', content: '采样前应先用采样水冲洗采样器具2-3次', type: 'warning', cost: 5 }
                ],
                hintCost: 5
            },
            {
                id: 'stage-env-water-4',
                name: '填写采样记录',
                type: StageType.RECORD_FILLING,
                order: 4,
                instructions: '根据采样操作情况，填写原始采样记录表。',
                template: {
                    id: 'tpl-sampling-record',
                    name: '采样记录表',
                    description: '地表水采样原始记录表',
                    fields: [
                        { name: 'sampleId', label: '样品编号', type: 'text', required: true },
                        { name: 'samplingDate', label: '采样日期', type: 'date', required: true },
                        { name: 'samplingTime', label: '采样时间', type: 'time', required: true },
                        { name: 'samplingLocation', label: '采样位置', type: 'text', required: true },
                        { name: 'waterTemperature', label: '水温(℃)', type: 'number', required: true },
                        { name: 'pH', label: 'pH值', type: 'number', required: true },
                        { name: 'dissolvedOxygen', label: '溶解氧(mg/L)', type: 'number', required: true },
                        { name: 'weatherCondition', label: '天气状况', type: 'text', required: true },
                        { name: 'sampler', label: '采样人', type: 'text', required: true },
                        { name: 'remarks', label: '备注', type: 'textarea', required: false }
                    ]
                },
                validationRules: [
                    { field: 'sampleId', type: 'required', value: true, message: '请填写样品编号' },
                    { field: 'sampleId', type: 'pattern', value: '^[A-Z]{2}\\d{8}$', message: '样品编号格式应为：2位大写字母+8位数字' },
                    { field: 'samplingDate', type: 'required', value: true, message: '请填写采样日期' },
                    { field: 'waterTemperature', type: 'required', value: true, message: '请填写水温' },
                    { field: 'pH', type: 'required', value: true, message: '请填写pH值' }
                ],
                requiredFields: ['sampleId', 'samplingDate', 'samplingTime', 'samplingLocation', 'waterTemperature', 'pH', 'sampler'],
                hints: [
                    { id: 'hint-4-1', content: '样品编号应具有唯一性，建议采用"地点代码+日期+序号"格式', type: 'tip', cost: 5 }
                ],
                hintCost: 5
            },
            {
                id: 'stage-env-water-5',
                name: '生成采样报告',
                type: StageType.REPORT_GENERATION,
                order: 5,
                instructions: '根据采样方案和记录，生成完整的采样报告。',
                template: {
                    id: 'tpl-sampling-report',
                    name: '采样报告模板',
                    description: '地表水采样报告模板',
                    fields: [
                        { name: 'reportTitle', label: '报告标题', type: 'text', required: true },
                        { name: 'projectOverview', label: '项目概况', type: 'textarea', required: true },
                        { name: 'samplingOverview', label: '采样概况', type: 'textarea', required: true },
                        { name: 'qualityAssurance', label: '质量保证', type: 'textarea', required: true },
                        { name: 'conclusion', label: '结论与建议', type: 'textarea', required: true }
                    ]
                },
                validationRules: [
                    { field: 'reportTitle', type: 'required', value: true, message: '请填写报告标题' },
                    { field: 'projectOverview', type: 'required', value: true, message: '请填写项目概况' },
                    { field: 'projectOverview', type: 'minLength', value: 50, message: '项目概况不少于50字' },
                    { field: 'samplingOverview', type: 'required', value: true, message: '请填写采样概况' },
                    { field: 'conclusion', type: 'required', value: true, message: '请填写结论与建议' }
                ],
                requiredFields: ['reportTitle', 'projectOverview', 'samplingOverview', 'qualityAssurance', 'conclusion'],
                hints: [
                    { id: 'hint-5-1', content: '报告应包含采样依据、方法、结果和质量控制等内容', type: 'info', cost: 5 }
                ],
                hintCost: 5
            }
        ],
        scoringRules: [
            { id: 'rule-1', name: '方案完整性', maxScore: 30, criteria: '采样方案包含所有必要内容' },
            { id: 'rule-2', name: '方案合理性', maxScore: 25, criteria: '采样点位、方法、频次设计合理' },
            { id: 'rule-3', name: '记录规范性', maxScore: 25, criteria: '采样记录填写规范完整' },
            { id: 'rule-4', name: '报告质量', maxScore: 20, criteria: '报告格式规范、内容完整' }
        ],
        maxScore: 100,
        passingScore: 60,
        xpReward: 100,
        achievements: ['water-sampler']
    },
    // 采样规划中心任务
    {
        id: 'task-sampling-soil',
        workstationId: 'sampling-center',
        name: '土壤采样布点方案',
        description: '设计建设用地土壤污染状况调查的采样布点方案',
        order: 1,
        taskBrief: {
            background: '某化工厂搬迁后，需要对原厂址进行土壤污染状况调查。场地面积约5公顷，历史上主要生产有机溶剂和电镀产品。',
            objectives: [
                '确定调查范围和重点区域',
                '设计采样点位布设方案',
                '确定采样深度和样品数量',
                '编制采样计划书'
            ],
            requirements: [
                '符合HJ 25.1-2019《建设用地土壤污染状况调查技术导则》',
                '采样点位应覆盖潜在污染区域',
                '采样深度应考虑污染物迁移特性',
                '样品数量应满足统计分析要求'
            ],
            deadline: null
        },
        stages: [
            {
                id: 'stage-soil-1',
                name: '接受任务单',
                type: StageType.TASK_RECEIPT,
                order: 1,
                instructions: '请仔细阅读任务背景、目标和要求，确认理解后点击"接受任务"开始。',
                template: null,
                validationRules: [],
                requiredFields: ['confirmed'],
                hints: [],
                hintCost: 0
            },
            {
                id: 'stage-soil-2',
                name: '制定布点方案',
                type: StageType.PLAN_DESIGN,
                order: 2,
                instructions: '根据场地特征和历史信息，设计采样布点方案。',
                template: {
                    id: 'tpl-soil-plan',
                    name: '土壤采样布点方案模板',
                    description: '建设用地土壤采样布点方案',
                    fields: [
                        { name: 'siteDescription', label: '场地概况', type: 'textarea', required: true },
                        { name: 'pollutionHistory', label: '污染历史分析', type: 'textarea', required: true },
                        { name: 'samplingStrategy', label: '布点策略', type: 'select', options: ['系统布点法', '专业判断布点法', '分区布点法'], required: true },
                        { name: 'samplingPoints', label: '采样点位设计', type: 'textarea', required: true },
                        { name: 'samplingDepth', label: '采样深度设计', type: 'textarea', required: true },
                        { name: 'sampleCount', label: '样品数量', type: 'number', required: true }
                    ]
                },
                validationRules: [
                    { field: 'siteDescription', type: 'required', value: true, message: '请填写场地概况' },
                    { field: 'pollutionHistory', type: 'required', value: true, message: '请填写污染历史分析' },
                    { field: 'samplingStrategy', type: 'required', value: true, message: '请选择布点策略' },
                    { field: 'samplingPoints', type: 'required', value: true, message: '请填写采样点位设计' },
                    { field: 'sampleCount', type: 'required', value: true, message: '请填写样品数量' }
                ],
                requiredFields: ['siteDescription', 'pollutionHistory', 'samplingStrategy', 'samplingPoints', 'samplingDepth', 'sampleCount'],
                hints: [
                    { id: 'hint-soil-2-1', content: '根据HJ 25.1-2019，重点区域应加密布点', type: 'info', cost: 5 }
                ],
                hintCost: 5
            },
            {
                id: 'stage-soil-3',
                name: '沙盒模拟布点',
                type: StageType.OPERATION,
                order: 3,
                instructions: '在沙盒地图上标注采样点位，验证布点方案的可行性。',
                template: null,
                simulation: {
                    type: 'soil_sampling_sandbox',
                    config: { siteArea: 50000, gridSize: 20 }
                },
                validationRules: [],
                requiredFields: ['operationCompleted'],
                hints: [],
                hintCost: 5
            },
            {
                id: 'stage-soil-4',
                name: '填写布点记录',
                type: StageType.RECORD_FILLING,
                order: 4,
                instructions: '记录各采样点位的坐标、深度等信息。',
                template: {
                    id: 'tpl-soil-record',
                    name: '布点记录表',
                    description: '土壤采样布点记录表',
                    fields: [
                        { name: 'pointId', label: '点位编号', type: 'text', required: true },
                        { name: 'coordinates', label: '坐标(经纬度)', type: 'text', required: true },
                        { name: 'depth', label: '采样深度(m)', type: 'text', required: true },
                        { name: 'soilType', label: '土壤类型', type: 'text', required: true },
                        { name: 'targetPollutants', label: '目标污染物', type: 'textarea', required: true }
                    ]
                },
                validationRules: [
                    { field: 'pointId', type: 'required', value: true, message: '请填写点位编号' },
                    { field: 'coordinates', type: 'required', value: true, message: '请填写坐标' },
                    { field: 'depth', type: 'required', value: true, message: '请填写采样深度' }
                ],
                requiredFields: ['pointId', 'coordinates', 'depth', 'soilType', 'targetPollutants'],
                hints: [],
                hintCost: 5
            },
            {
                id: 'stage-soil-5',
                name: '生成布点报告',
                type: StageType.REPORT_GENERATION,
                order: 5,
                instructions: '生成完整的采样布点方案报告。',
                template: {
                    id: 'tpl-soil-report',
                    name: '布点方案报告',
                    description: '土壤采样布点方案报告模板',
                    fields: [
                        { name: 'reportTitle', label: '报告标题', type: 'text', required: true },
                        { name: 'siteOverview', label: '场地概况', type: 'textarea', required: true },
                        { name: 'samplingDesign', label: '采样设计', type: 'textarea', required: true },
                        { name: 'qualityControl', label: '质量控制', type: 'textarea', required: true },
                        { name: 'schedule', label: '实施计划', type: 'textarea', required: true }
                    ]
                },
                validationRules: [
                    { field: 'reportTitle', type: 'required', value: true, message: '请填写报告标题' },
                    { field: 'siteOverview', type: 'required', value: true, message: '请填写场地概况' },
                    { field: 'samplingDesign', type: 'required', value: true, message: '请填写采样设计' }
                ],
                requiredFields: ['reportTitle', 'siteOverview', 'samplingDesign', 'qualityControl', 'schedule'],
                hints: [],
                hintCost: 5
            }
        ],
        scoringRules: [
            { id: 'rule-1', name: '方案科学性', maxScore: 35, criteria: '布点策略选择合理，点位设计科学' },
            { id: 'rule-2', name: '方案完整性', maxScore: 30, criteria: '方案内容完整，覆盖所有必要环节' },
            { id: 'rule-3', name: '记录规范性', maxScore: 20, criteria: '记录填写规范准确' },
            { id: 'rule-4', name: '报告质量', maxScore: 15, criteria: '报告格式规范、逻辑清晰' }
        ],
        maxScore: 100,
        passingScore: 60,
        xpReward: 80,
        achievements: ['sampling-master']
    }
];

// ================= 虚拟工位平台核心类 =================

/**
 * 虚拟工位平台主控制器
 */
class VirtualStationPlatform {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.currentSession = null;
        this.initialized = false;
        
        // 服务实例
        this.workstationService = null;
        this.taskFlowService = null;
        this.processTracker = null;
        this.careerService = null;
        this.achievementService = null;
        this.progressAutoSave = null;
    }

    /**
     * 初始化平台
     */
    async init() {
        if (this.initialized) return;

        // 初始化Supabase连接
        this.supabase = this._initSupabase();
        
        // 检查用户身份
        this.currentUser = this._checkUserAuth();
        
        // 初始化各服务
        this.workstationService = new WorkstationService(this.supabase);
        this.taskFlowService = new TaskFlowService(this.supabase);
        this.processTracker = new ProcessTrackerService(this.supabase);
        this.careerService = new CareerService(this.supabase);
        this.achievementService = new AchievementService(this.supabase);
        this.progressAutoSave = new ProgressAutoSaveService(this.supabase);

        // 从本地存储恢复进度
        await this._restoreProgress();

        // 如果有用户，启动自动保存服务
        if (this.currentUser) {
            this.progressAutoSave.start(this.currentUser.id);
        }

        this.initialized = true;
        console.log('✅ 虚拟工位平台初始化完成');
    }

    /**
     * 初始化Supabase连接
     */
    _initSupabase() {
        if (window.ClassroomCommon && window.ClassroomCommon.createSupabaseClient) {
            return window.ClassroomCommon.createSupabaseClient();
        }
        
        // 备用方案：直接创建
        if (typeof supabase !== 'undefined') {
            const config = window.ClassroomCommon?.SUPABASE_CONFIG || {
                url: 'https://urqxrtlzaifvambytoci.supabase.co',
                key: 'sb_publishable_UWJrATWMObB576H3ODCicQ_FXX5Li8h'
            };
            return supabase.createClient(config.url, config.key);
        }
        
        console.error('Supabase library not loaded');
        return null;
    }

    /**
     * 检查用户身份
     */
    _checkUserAuth() {
        const myName = localStorage.getItem('my_name');
        const myId = localStorage.getItem('my_id');
        
        if (!myName || !myId) {
            return null;
        }
        
        return { name: myName, id: myId };
    }

    /**
     * 从本地存储恢复进度
     */
    async _restoreProgress() {
        const savedProgress = localStorage.getItem('vs_progress');
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                this.currentSession = progress.session || null;
                console.log('📂 已恢复上次进度');
            } catch (e) {
                console.warn('恢复进度失败:', e);
            }
        }
    }

    /**
     * 保存进度到本地存储
     */
    saveProgress(data) {
        const progress = {
            session: this.currentSession,
            timestamp: Date.now(),
            ...data
        };
        localStorage.setItem('vs_progress', JSON.stringify(progress));
        
        // 标记有待保存的更改
        if (this.progressAutoSave) {
            this.progressAutoSave.markPendingChanges();
        }
    }

    /**
     * 获取当前用户的职业档案
     */
    async getCareerProfile() {
        if (!this.currentUser) return null;
        return this.careerService.getCareerProfile(this.currentUser.id);
    }

    /**
     * 进入工位（集成自动保存）
     * @param {string} workstationId - 工位ID
     * @returns {Promise<Object>} 会话信息
     */
    async enterWorkstation(workstationId) {
        if (!this.currentUser) {
            throw new Error('用户未登录');
        }

        // 创建会话
        const session = await this.workstationService.enterWorkstation(
            this.currentUser.id,
            workstationId
        );
        this.currentSession = session;

        // 设置自动保存的当前工位
        if (this.progressAutoSave) {
            this.progressAutoSave.setCurrentWorkstation(workstationId);
            
            // 尝试恢复之前的进度
            const savedProgress = await this.progressAutoSave.restoreProgress(
                this.currentUser.id,
                workstationId
            );
            
            if (savedProgress) {
                console.log('📂 已恢复工位进度:', savedProgress);
            }
        }

        return session;
    }

    /**
     * 退出工位（集成自动保存）
     */
    async exitWorkstation() {
        if (!this.currentSession) return;

        // 立即保存进度
        if (this.progressAutoSave) {
            await this.progressAutoSave.saveNow();
            await this.progressAutoSave.syncNow();
            this.progressAutoSave.setCurrentWorkstation(null);
        }

        // 退出会话
        await this.workstationService.exitWorkstation(this.currentSession.id);
        this.currentSession = null;
    }

    /**
     * 立即保存当前进度
     * @returns {Promise<Object>} 保存结果
     */
    async saveProgressNow() {
        if (!this.progressAutoSave) {
            return { success: false, reason: 'service_not_initialized' };
        }
        return this.progressAutoSave.saveNow();
    }

    /**
     * 立即同步进度到云端
     * @returns {Promise<Object>} 同步结果
     */
    async syncProgressToCloud() {
        if (!this.progressAutoSave) {
            return { success: false, reason: 'service_not_initialized' };
        }
        return this.progressAutoSave.syncNow();
    }

    /**
     * 获取进度备份列表
     * @param {string} workstationId - 工位ID
     * @returns {Array} 备份列表
     */
    getProgressBackups(workstationId) {
        if (!this.currentUser || !this.progressAutoSave) {
            return [];
        }
        return this.progressAutoSave.getBackups(this.currentUser.id, workstationId);
    }

    /**
     * 从备份恢复进度
     * @param {string} workstationId - 工位ID
     * @param {string} backupId - 备份ID
     * @returns {Object|null} 恢复的进度数据
     */
    restoreProgressFromBackup(workstationId, backupId) {
        if (!this.currentUser || !this.progressAutoSave) {
            return null;
        }
        return this.progressAutoSave.restoreFromBackup(
            this.currentUser.id,
            workstationId,
            backupId
        );
    }

    /**
     * 获取上次同步时间
     * @returns {number|null} 时间戳
     */
    getLastSyncTime() {
        if (!this.progressAutoSave) return null;
        return this.progressAutoSave.getLastSyncTime();
    }
}


// ================= 工位服务 =================

/**
 * 工位服务类
 */
class WorkstationService {
    constructor(supabase) {
        this.supabase = supabase;
        // 缓存配置
        this._cache = {
            workstations: null,
            workstationDetails: new Map(),
            progress: new Map(),
            lastFetch: 0
        };
        this._cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期
    }

    /**
     * 检查缓存是否有效
     */
    _isCacheValid() {
        return this._cache.lastFetch > 0 && 
               (Date.now() - this._cache.lastFetch) < this._cacheExpiry;
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this._cache.workstations = null;
        this._cache.workstationDetails.clear();
        this._cache.progress.clear();
        this._cache.lastFetch = 0;
    }

    /**
     * 获取工位列表（带缓存）
     * @param {boolean} forceRefresh 是否强制刷新
     * @returns {Promise<Array>} 工位信息列表
     */
    async getWorkstationList(forceRefresh = false) {
        // 检查缓存
        if (!forceRefresh && this._cache.workstations && this._isCacheValid()) {
            return this._cache.workstations;
        }

        if (!this.supabase) {
            this._cache.workstations = this._getPresetWorkstations();
            this._cache.lastFetch = Date.now();
            return this._cache.workstations;
        }

        const { data, error } = await this.supabase
            .from('vs_workstations')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) {
            console.warn('获取工位列表失败，使用预设数据:', error);
            this._cache.workstations = this._getPresetWorkstations();
        } else {
            this._cache.workstations = data || this._getPresetWorkstations();
        }
        
        this._cache.lastFetch = Date.now();
        return this._cache.workstations;
    }

    /**
     * 获取单个工位详情（带缓存）
     * @param {string} workstationId 工位ID
     * @param {boolean} forceRefresh 是否强制刷新
     */
    async getWorkstation(workstationId, forceRefresh = false) {
        // 检查缓存
        if (!forceRefresh && this._cache.workstationDetails.has(workstationId) && this._isCacheValid()) {
            return this._cache.workstationDetails.get(workstationId);
        }

        if (!this.supabase) {
            const preset = this._getPresetWorkstations().find(w => w.id === workstationId);
            if (preset) {
                this._cache.workstationDetails.set(workstationId, preset);
            }
            return preset;
        }

        const { data, error } = await this.supabase
            .from('vs_workstations')
            .select('*, vs_tasks(*)')
            .eq('id', workstationId)
            .single();

        if (error) {
            console.error('获取工位详情失败:', error);
            return null;
        }

        // 缓存结果
        if (data) {
            this._cache.workstationDetails.set(workstationId, data);
        }
        return data;
    }

    /**
     * 获取用户在工位的进度（带缓存）
     * @param {string} userId 用户ID
     * @param {string} workstationId 工位ID
     * @param {boolean} forceRefresh 是否强制刷新
     */
    async getWorkstationProgress(userId, workstationId, forceRefresh = false) {
        const cacheKey = `${userId}_${workstationId}`;
        
        // 检查缓存（进度缓存时间较短，1分钟）
        if (!forceRefresh && this._cache.progress.has(cacheKey)) {
            const cached = this._cache.progress.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) {
                return cached.data;
            }
        }

        if (!this.supabase) {
            const localProgress = this._getLocalProgress(userId, workstationId);
            this._cache.progress.set(cacheKey, { data: localProgress, timestamp: Date.now() });
            return localProgress;
        }

        const { data, error } = await this.supabase
            .from('vs_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('workstation_id', workstationId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('获取进度失败:', error);
        }

        const result = data || { progress: 0, completed_tasks: 0, total_tasks: 0 };
        this._cache.progress.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    }

    /**
     * 进入工位
     * @param {string} userId 用户ID
     * @param {string} workstationId 工位ID
     */
    async enterWorkstation(userId, workstationId) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const session = {
            id: sessionId,
            user_id: userId,
            workstation_id: workstationId,
            started_at: Date.now(),
            status: 'active'
        };

        if (this.supabase) {
            await this.supabase.from('vs_sessions').insert(session);
        }

        // 保存到本地
        localStorage.setItem('vs_current_session', JSON.stringify(session));

        return session;
    }

    /**
     * 退出工位
     * @param {string} sessionId 会话ID
     */
    async exitWorkstation(sessionId) {
        if (this.supabase) {
            await this.supabase
                .from('vs_sessions')
                .update({ status: 'ended', ended_at: Date.now() })
                .eq('id', sessionId);
        }

        localStorage.removeItem('vs_current_session');
    }

    /**
     * 获取预设工位数据
     * @returns {Workstation[]} 预设工位列表
     */
    _getPresetWorkstations() {
        return PRESET_WORKSTATIONS;
    }

    /**
     * 获取本地存储的进度
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @returns {WorkstationProgress} 工位进度
     */
    _getLocalProgress(userId, workstationId) {
        const key = `vs_progress_${userId}_${workstationId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return this._createDefaultProgress(userId, workstationId);
            }
        }
        return this._createDefaultProgress(userId, workstationId);
    }

    /**
     * 创建默认进度对象
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @returns {WorkstationProgress} 默认进度
     */
    _createDefaultProgress(userId, workstationId) {
        const workstation = PRESET_WORKSTATIONS.find(w => w.id === workstationId);
        return {
            workstationId: workstationId,
            userId: userId,
            progress: 0,
            completedTasks: 0,
            totalTasks: workstation ? workstation.totalTasks : 0,
            status: 'not_started',
            lastAccessedAt: null,
            totalStudyTime: 0
        };
    }

    /**
     * 保存工位进度到本地存储
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @param {Partial<WorkstationProgress>} progressData - 进度数据
     */
    async saveWorkstationProgress(userId, workstationId, progressData) {
        const key = `vs_progress_${userId}_${workstationId}`;
        const currentProgress = this._getLocalProgress(userId, workstationId);
        
        const updatedProgress = {
            ...currentProgress,
            ...progressData,
            lastAccessedAt: Date.now()
        };

        // 计算进度百分比
        if (updatedProgress.totalTasks > 0) {
            updatedProgress.progress = Math.round(
                (updatedProgress.completedTasks / updatedProgress.totalTasks) * 100
            );
        }

        // 更新状态
        if (updatedProgress.completedTasks === 0) {
            updatedProgress.status = 'not_started';
        } else if (updatedProgress.completedTasks >= updatedProgress.totalTasks) {
            updatedProgress.status = 'completed';
        } else {
            updatedProgress.status = 'in_progress';
        }

        localStorage.setItem(key, JSON.stringify(updatedProgress));

        // 同步到数据库
        if (this.supabase) {
            await this.supabase
                .from('vs_progress')
                .upsert(updatedProgress, { onConflict: 'user_id,workstation_id' });
        }

        return updatedProgress;
    }

    /**
     * 获取工位列表（含用户进度）
     * @param {string} userId - 用户ID
     * @returns {Promise<WorkstationInfo[]>} 工位信息列表（含进度）
     */
    async getWorkstationListWithProgress(userId) {
        const workstations = await this.getWorkstationList();
        
        const workstationsWithProgress = await Promise.all(
            workstations.map(async (workstation) => {
                const progress = await this.getWorkstationProgress(userId, workstation.id);
                return {
                    ...workstation,
                    progress: {
                        workstationId: workstation.id,
                        userId: userId,
                        progress: progress.progress || 0,
                        completedTasks: progress.completed_tasks || progress.completedTasks || 0,
                        totalTasks: progress.total_tasks || progress.totalTasks || workstation.totalTasks,
                        status: this._calculateStatus(progress),
                        lastAccessedAt: progress.lastAccessedAt || progress.last_accessed_at || null,
                        totalStudyTime: progress.totalStudyTime || progress.total_study_time || 0
                    }
                };
            })
        );

        return workstationsWithProgress;
    }

    /**
     * 计算进度状态
     * @param {Object} progress - 进度数据
     * @returns {string} 状态
     */
    _calculateStatus(progress) {
        const completedTasks = progress.completed_tasks || progress.completedTasks || 0;
        const totalTasks = progress.total_tasks || progress.totalTasks || 0;
        
        if (completedTasks === 0) return 'not_started';
        if (completedTasks >= totalTasks && totalTasks > 0) return 'completed';
        return 'in_progress';
    }

    /**
     * 验证工位数据完整性
     * 确保工位包含所有必需字段：名称、描述、进度状态
     * @param {Workstation} workstation - 工位数据
     * @returns {{ valid: boolean, missingFields: string[] }} 验证结果
     */
    validateWorkstation(workstation) {
        const requiredFields = ['id', 'name', 'description', 'category', 'difficulty', 'totalTasks', 'isActive'];
        const missingFields = requiredFields.filter(field => 
            workstation[field] === undefined || workstation[field] === null
        );

        return {
            valid: missingFields.length === 0,
            missingFields
        };
    }

    /**
     * 获取所有工位并验证完整性
     * @returns {Promise<{ workstations: Workstation[], allValid: boolean, invalidWorkstations: string[] }>}
     */
    async getValidatedWorkstationList() {
        const workstations = await this.getWorkstationList();
        const invalidWorkstations = [];

        for (const ws of workstations) {
            const validation = this.validateWorkstation(ws);
            if (!validation.valid) {
                invalidWorkstations.push(`${ws.id || 'unknown'}: missing ${validation.missingFields.join(', ')}`);
            }
        }

        return {
            workstations,
            allValid: invalidWorkstations.length === 0,
            invalidWorkstations
        };
    }

    /**
     * 更新任务完成数
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @param {number} completedTasks - 已完成任务数
     */
    async updateCompletedTasks(userId, workstationId, completedTasks) {
        return this.saveWorkstationProgress(userId, workstationId, { completedTasks });
    }

    /**
     * 增加学习时长
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @param {number} minutes - 增加的分钟数
     */
    async addStudyTime(userId, workstationId, minutes) {
        const currentProgress = this._getLocalProgress(userId, workstationId);
        const newStudyTime = (currentProgress.totalStudyTime || 0) + minutes;
        return this.saveWorkstationProgress(userId, workstationId, { totalStudyTime: newStudyTime });
    }

    /**
     * 获取用户所有工位的总体进度统计
     * @param {string} userId - 用户ID
     * @returns {Promise<Object>} 总体统计
     */
    async getUserOverallProgress(userId) {
        const workstations = await this.getWorkstationListWithProgress(userId);
        
        let totalWorkstations = 0;
        let completedWorkstations = 0;
        let inProgressWorkstations = 0;
        let totalTasks = 0;
        let completedTasks = 0;
        let totalStudyTime = 0;

        for (const ws of workstations) {
            if (!ws.isActive) continue;
            
            totalWorkstations++;
            totalTasks += ws.totalTasks;
            
            if (ws.progress) {
                completedTasks += ws.progress.completedTasks || 0;
                totalStudyTime += ws.progress.totalStudyTime || 0;
                
                if (ws.progress.status === 'completed') {
                    completedWorkstations++;
                } else if (ws.progress.status === 'in_progress') {
                    inProgressWorkstations++;
                }
            }
        }

        return {
            totalWorkstations,
            completedWorkstations,
            inProgressWorkstations,
            notStartedWorkstations: totalWorkstations - completedWorkstations - inProgressWorkstations,
            totalTasks,
            completedTasks,
            overallProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            totalStudyTime
        };
    }

    /**
     * 获取最近访问的工位
     * @param {string} userId - 用户ID
     * @param {number} limit - 返回数量限制
     * @returns {Promise<WorkstationInfo[]>} 最近访问的工位列表
     */
    async getRecentWorkstations(userId, limit = 3) {
        const workstations = await this.getWorkstationListWithProgress(userId);
        
        // 过滤有访问记录的工位并按最后访问时间排序
        const recentWorkstations = workstations
            .filter(ws => ws.progress && ws.progress.lastAccessedAt)
            .sort((a, b) => (b.progress.lastAccessedAt || 0) - (a.progress.lastAccessedAt || 0))
            .slice(0, limit);

        return recentWorkstations;
    }

    /**
     * 检查工位是否已完成
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @returns {Promise<boolean>} 是否已完成
     */
    async isWorkstationCompleted(userId, workstationId) {
        const progress = await this.getWorkstationProgress(userId, workstationId);
        return progress.status === 'completed' || 
               (progress.completedTasks >= progress.totalTasks && progress.totalTasks > 0);
    }

    /**
     * 重置工位进度
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     */
    async resetWorkstationProgress(userId, workstationId) {
        const key = `vs_progress_${userId}_${workstationId}`;
        localStorage.removeItem(key);

        if (this.supabase) {
            await this.supabase
                .from('vs_progress')
                .delete()
                .eq('user_id', userId)
                .eq('workstation_id', workstationId);
        }

        return this._createDefaultProgress(userId, workstationId);
    }
}


// ================= 任务流服务 =================

/**
 * 任务流服务类 - 管理任务流程和阶段执行
 */
class TaskFlowService {
    constructor(supabase) {
        this.supabase = supabase;
        this.currentExecution = null;
    }

    /**
     * 获取工位的任务列表
     * @param {string} workstationId 工位ID
     * @returns {Promise<Task[]>} 任务列表
     */
    async getTaskList(workstationId) {
        // 先尝试从预设数据获取
        const presetTasks = PRESET_TASKS.filter(t => t.workstationId === workstationId);
        if (presetTasks.length > 0) {
            return presetTasks.sort((a, b) => a.order - b.order);
        }

        // 从数据库获取
        if (this.supabase) {
            const { data, error } = await this.supabase
                .from('vs_tasks')
                .select('*')
                .eq('workstation_id', workstationId)
                .order('order', { ascending: true });

            if (!error && data) {
                return data;
            }
        }

        return [];
    }

    /**
     * 获取任务详情
     * @param {string} taskId 任务ID
     * @returns {Promise<Task|null>} 任务详情
     */
    async getTask(taskId) {
        // 先从预设数据查找
        const presetTask = PRESET_TASKS.find(t => t.id === taskId);
        if (presetTask) {
            return presetTask;
        }

        // 从数据库获取
        if (this.supabase) {
            const { data, error } = await this.supabase
                .from('vs_tasks')
                .select('*, vs_task_stages(*)')
                .eq('id', taskId)
                .single();

            if (!error && data) {
                return data;
            }
        }

        return null;
    }

    /**
     * 获取当前会话的任务
     * @param {string} sessionId 会话ID
     * @returns {Promise<Task|null>} 当前任务
     */
    async getCurrentTask(sessionId) {
        const execution = this._getLocalExecution();
        if (execution && execution.sessionId === sessionId) {
            return this.getTask(execution.taskId);
        }
        return null;
    }

    /**
     * 获取当前执行记录
     * @returns {TaskExecution|null} 执行记录
     */
    getCurrentExecution() {
        return this._getLocalExecution();
    }

    /**
     * 开始任务
     * @param {string} sessionId 会话ID
     * @param {string} taskId 任务ID
     * @returns {Promise<TaskExecution>} 任务执行记录
     */
    async startTask(sessionId, taskId) {
        const task = await this.getTask(taskId);
        if (!task) {
            throw new Error('任务不存在');
        }

        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userId = localStorage.getItem('my_id') || 'guest';
        
        const execution = {
            id: executionId,
            sessionId: sessionId,
            taskId: taskId,
            userId: userId,
            startedAt: Date.now(),
            completedAt: null,
            currentStageIndex: 0,
            status: TaskExecutionStatus.IN_PROGRESS,
            stageData: {},
            score: 0
        };

        // 保存到本地
        localStorage.setItem('vs_current_execution', JSON.stringify(execution));
        this.currentExecution = execution;

        // 保存到数据库
        if (this.supabase) {
            await this.supabase.from('vs_task_executions').insert({
                id: executionId,
                session_id: sessionId,
                task_id: taskId,
                user_id: userId,
                started_at: execution.startedAt,
                current_stage_index: 0,
                status: execution.status,
                stage_data: {},
                score: 0
            });
        }

        return execution;
    }

    /**
     * 获取当前阶段
     * @param {string} executionId 执行ID
     * @returns {Promise<TaskStage|null>} 当前阶段
     */
    async getCurrentStage(executionId) {
        const execution = this._getLocalExecution();
        if (!execution || execution.id !== executionId) {
            return null;
        }

        const task = await this.getTask(execution.taskId);
        if (!task || !task.stages) {
            return null;
        }

        return task.stages[execution.currentStageIndex] || null;
    }

    /**
     * 提交阶段内容
     * @param {string} executionId 执行ID
     * @param {string} stageId 阶段ID
     * @param {Object} data 提交数据
     * @returns {Promise<Object>} 验证结果
     */
    async submitStage(executionId, stageId, data) {
        const execution = this._getLocalExecution();
        if (!execution || execution.id !== executionId) {
            return { valid: false, errors: ['执行记录不存在'] };
        }

        const task = await this.getTask(execution.taskId);
        if (!task) {
            return { valid: false, errors: ['任务不存在'] };
        }

        const stage = task.stages.find(s => s.id === stageId);
        if (!stage) {
            return { valid: false, errors: ['阶段不存在'] };
        }

        // 验证提交内容
        const result = this.validateStageSubmission(stage, data);
        
        // 保存阶段数据
        execution.stageData[stageId] = {
            data: data,
            submittedAt: Date.now(),
            validationResult: result
        };

        // 如果验证通过，进入下一阶段
        if (result.valid) {
            execution.currentStageIndex++;
            execution.score += result.score;
        }

        // 更新本地存储
        localStorage.setItem('vs_current_execution', JSON.stringify(execution));

        // 保存到数据库
        if (this.supabase) {
            await this.supabase.from('vs_stage_submissions').insert({
                execution_id: executionId,
                stage_id: stageId,
                data: data,
                validation_result: result,
                submitted_at: Date.now()
            });

            await this.supabase
                .from('vs_task_executions')
                .update({
                    current_stage_index: execution.currentStageIndex,
                    stage_data: execution.stageData,
                    score: execution.score
                })
                .eq('id', executionId);
        }

        return result;
    }

    /**
     * 验证阶段提交内容
     * @param {TaskStage} stage 阶段定义
     * @param {Object} data 提交数据
     * @returns {Object} 验证结果
     */
    validateStageSubmission(stage, data) {
        const errors = [];
        let score = 100;

        // 检查必填字段
        const requiredFields = stage.requiredFields || [];
        for (const field of requiredFields) {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors.push(`缺少必填项: ${this._getFieldLabel(stage, field) || field}`);
                score -= 20;
            }
        }

        // 应用验证规则
        const validationRules = stage.validationRules || [];
        for (const rule of validationRules) {
            const fieldValue = data[rule.field];
            const fieldLabel = this._getFieldLabel(stage, rule.field) || rule.field;

            switch (rule.type) {
                case 'required':
                    if (rule.value && (!fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim()))) {
                        if (!errors.some(e => e.includes(fieldLabel))) {
                            errors.push(rule.message || `${fieldLabel}为必填项`);
                            score -= 10;
                        }
                    }
                    break;
                case 'minLength':
                    if (fieldValue && typeof fieldValue === 'string' && fieldValue.length < rule.value) {
                        errors.push(rule.message || `${fieldLabel}长度不能少于${rule.value}字`);
                        score -= 10;
                    }
                    break;
                case 'maxLength':
                    if (fieldValue && typeof fieldValue === 'string' && fieldValue.length > rule.value) {
                        errors.push(rule.message || `${fieldLabel}长度不能超过${rule.value}字`);
                        score -= 10;
                    }
                    break;
                case 'pattern':
                    if (fieldValue && typeof fieldValue === 'string') {
                        const regex = new RegExp(rule.value);
                        if (!regex.test(fieldValue)) {
                            errors.push(rule.message || `${fieldLabel}格式不正确`);
                            score -= 10;
                        }
                    }
                    break;
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            score: Math.max(0, score)
        };
    }

    /**
     * 获取字段标签
     * @param {TaskStage} stage 阶段
     * @param {string} fieldName 字段名
     * @returns {string|null} 字段标签
     */
    _getFieldLabel(stage, fieldName) {
        if (stage.template && stage.template.fields) {
            const field = stage.template.fields.find(f => f.name === fieldName);
            return field ? field.label : null;
        }
        return null;
    }

    /**
     * 接受任务单（第一阶段特殊处理）
     * @param {string} executionId 执行ID
     * @returns {Promise<Object>} 结果
     */
    async acceptTask(executionId) {
        const execution = this._getLocalExecution();
        if (!execution || execution.id !== executionId) {
            return { success: false, error: '执行记录不存在' };
        }

        const task = await this.getTask(execution.taskId);
        if (!task) {
            return { success: false, error: '任务不存在' };
        }

        const firstStage = task.stages[0];
        if (!firstStage || firstStage.type !== StageType.TASK_RECEIPT) {
            return { success: false, error: '任务阶段配置错误' };
        }

        // 提交接受确认
        return this.submitStage(executionId, firstStage.id, { confirmed: true, acceptedAt: Date.now() });
    }

    /**
     * 完成任务
     * @param {string} executionId 执行ID
     * @returns {Promise<Object>} 完成结果
     */
    async completeTask(executionId) {
        const execution = this._getLocalExecution();
        if (!execution || execution.id !== executionId) {
            return { completed: false, error: '执行记录不存在' };
        }

        const task = await this.getTask(execution.taskId);
        if (!task) {
            return { completed: false, error: '任务不存在' };
        }

        // 检查是否所有阶段都已完成
        if (execution.currentStageIndex < task.stages.length) {
            return { completed: false, error: '还有未完成的阶段' };
        }

        const endTime = Date.now();
        const duration = endTime - execution.startedAt;

        // 计算最终得分
        const finalScore = this._calculateFinalScore(execution, task);

        // 更新执行记录
        execution.status = TaskExecutionStatus.COMPLETED;
        execution.completedAt = endTime;
        execution.score = finalScore;

        localStorage.setItem('vs_current_execution', JSON.stringify(execution));

        // 保存到数据库
        if (this.supabase) {
            await this.supabase
                .from('vs_task_executions')
                .update({
                    status: TaskExecutionStatus.COMPLETED,
                    completed_at: endTime,
                    score: finalScore
                })
                .eq('id', executionId);
        }

        // 保存到历史
        await this.saveToHistory(execution);

        // 清除当前执行记录
        localStorage.removeItem('vs_current_execution');

        // 更新工位进度并检查上岗证颁发
        let certificate = null;
        let newAchievements = [];
        const workstation = PRESET_WORKSTATIONS.find(w => w.id === task.workstationId);
        if (workstation) {
            // 获取该工位已完成的任务数
            const historyKey = `vs_task_history_${execution.userId}`;
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            const completedTasksInWorkstation = history.filter(h => 
                h.status === TaskExecutionStatus.COMPLETED && 
                PRESET_TASKS.find(t => t.id === h.taskId && t.workstationId === task.workstationId)
            );
            const completedCount = new Set(completedTasksInWorkstation.map(h => h.taskId)).size;
            
            // 检查是否应颁发上岗证
            if (window.VirtualStation && window.VirtualStation.achievementService) {
                certificate = await window.VirtualStation.achievementService.checkCertificateEligibility(
                    execution.userId,
                    task.workstationId,
                    completedCount,
                    workstation.totalTasks
                );
                
                // 检查任务完成相关的成就
                const tasksKey = `vs_completed_tasks_${execution.userId}`;
                const allCompletedTasks = JSON.parse(localStorage.getItem(tasksKey) || '[]');
                if (!allCompletedTasks.includes(task.id)) {
                    allCompletedTasks.push(task.id);
                    localStorage.setItem(tasksKey, JSON.stringify(allCompletedTasks));
                }
                
                newAchievements = await window.VirtualStation.achievementService.checkAchievements(
                    execution.userId,
                    {
                        type: 'task_complete',
                        taskId: task.id,
                        tasksCount: allCompletedTasks.length,
                        score: finalScore
                    }
                );
                
                // 如果是满分，检查满分成就
                if (finalScore >= 100) {
                    const scoreAchievements = await window.VirtualStation.achievementService.checkAchievements(
                        execution.userId,
                        { type: 'score', score: finalScore }
                    );
                    newAchievements = [...newAchievements, ...scoreAchievements];
                }
            }
        }

        return {
            completed: true,
            completedAt: endTime,
            duration: duration,
            score: finalScore,
            xpReward: task.xpReward,
            passed: finalScore >= task.passingScore,
            certificate: certificate,
            newAchievements: newAchievements
        };
    }

    /**
     * 计算最终得分
     * @param {TaskExecution} execution 执行记录
     * @param {Task} task 任务定义
     * @returns {number} 最终得分
     */
    _calculateFinalScore(execution, task) {
        let totalScore = 0;
        let stageCount = 0;

        for (const stageId in execution.stageData) {
            const stageResult = execution.stageData[stageId];
            if (stageResult.validationResult && stageResult.validationResult.score) {
                totalScore += stageResult.validationResult.score;
                stageCount++;
            }
        }

        return stageCount > 0 ? Math.round(totalScore / stageCount) : 0;
    }

    /**
     * 获取阶段模板
     * @param {string} taskId 任务ID
     * @param {string} stageId 阶段ID
     * @returns {Promise<StageTemplate|null>} 阶段模板
     */
    async getStageTemplate(taskId, stageId) {
        const task = await this.getTask(taskId);
        if (!task) return null;

        const stage = task.stages.find(s => s.id === stageId);
        return stage?.template || null;
    }

    /**
     * 获取阶段详情
     * @param {string} taskId 任务ID
     * @param {string} stageId 阶段ID
     * @returns {Promise<TaskStage|null>} 阶段详情
     */
    async getStage(taskId, stageId) {
        const task = await this.getTask(taskId);
        if (!task) return null;

        return task.stages.find(s => s.id === stageId) || null;
    }

    /**
     * 获取阶段提示
     * @param {string} taskId 任务ID
     * @param {string} stageId 阶段ID
     * @param {string} hintId 提示ID
     * @returns {Promise<Hint|null>} 提示内容
     */
    async getHint(taskId, stageId, hintId) {
        const stage = await this.getStage(taskId, stageId);
        if (!stage || !stage.hints) return null;

        return stage.hints.find(h => h.id === hintId) || null;
    }

    /**
     * 验证任务阶段顺序
     * @param {TaskStage[]} stages 阶段列表
     * @returns {boolean} 是否按正确顺序
     */
    validateStageOrder(stages) {
        if (!stages || stages.length === 0) return true;

        // 过滤出标准阶段（排除simulation等特殊阶段）
        const standardStages = stages.filter(s => STANDARD_STAGE_ORDER.includes(s.type));
        
        for (let i = 0; i < standardStages.length - 1; i++) {
            const currentIndex = STANDARD_STAGE_ORDER.indexOf(standardStages[i].type);
            const nextIndex = STANDARD_STAGE_ORDER.indexOf(standardStages[i + 1].type);
            if (currentIndex >= nextIndex) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 获取任务简报
     * @param {string} taskId 任务ID
     * @returns {Promise<TaskBrief|null>} 任务简报
     */
    async getTaskBrief(taskId) {
        const task = await this.getTask(taskId);
        return task?.taskBrief || null;
    }

    /**
     * 生成原始记录模板
     * 根据任务类型和方案数据自动生成预填充的记录模板
     * @param {string} taskId 任务ID
     * @param {Object} planData 方案数据（来自方案制定阶段）
     * @param {Object} [options] 可选配置
     * @param {string} [options.userId] 用户ID
     * @param {number} [options.recordIndex] 记录序号（用于批量生成）
     * @returns {Promise<Object>} 记录模板，包含预填充数据
     */
    async generateRecordTemplate(taskId, planData, options = {}) {
        const task = await this.getTask(taskId);
        if (!task) return null;

        // 找到记录填写阶段
        const recordStage = task.stages.find(s => s.type === StageType.RECORD_FILLING);
        if (!recordStage || !recordStage.template) return null;

        // 深拷贝模板以避免修改原始数据
        const template = JSON.parse(JSON.stringify(recordStage.template));
        
        // 初始化预填充数据对象
        template.prefilled = {};
        template.metadata = {
            generatedAt: Date.now(),
            taskId: taskId,
            taskName: task.name,
            workstationId: task.workstationId
        };

        // 生成样品编号（如果模板包含此字段）
        const sampleIdField = template.fields?.find(f => 
            f.name === 'sampleId' || f.name === 'pointId' || f.name === 'recordId'
        );
        if (sampleIdField) {
            template.prefilled[sampleIdField.name] = this._generateSampleId(
                task.workstationId, 
                options.recordIndex || 1
            );
        }

        // 自动填充日期字段
        const dateFields = template.fields?.filter(f => f.type === 'date') || [];
        for (const field of dateFields) {
            template.prefilled[field.name] = this._formatDate(new Date());
        }

        // 自动填充时间字段
        const timeFields = template.fields?.filter(f => f.type === 'time') || [];
        for (const field of timeFields) {
            template.prefilled[field.name] = this._formatTime(new Date());
        }

        // 根据方案数据自动填充相关字段
        if (planData) {
            // 采样方法
            if (planData.samplingMethod) {
                template.prefilled.method = planData.samplingMethod;
                template.prefilled.samplingMethod = planData.samplingMethod;
            }
            // 采样点位/位置
            if (planData.samplingPoints) {
                template.prefilled.location = planData.samplingPoints;
                template.prefilled.samplingLocation = planData.samplingPoints;
            }
            // 采样频次
            if (planData.samplingFrequency) {
                template.prefilled.frequency = planData.samplingFrequency;
            }
            // 保存方法
            if (planData.preservationMethod) {
                template.prefilled.preservationMethod = planData.preservationMethod;
            }
            // 目标污染物
            if (planData.targetPollutants) {
                template.prefilled.targetPollutants = planData.targetPollutants;
            }
            // 采样深度
            if (planData.samplingDepth) {
                template.prefilled.depth = planData.samplingDepth;
            }
            // 布点策略
            if (planData.samplingStrategy) {
                template.prefilled.strategy = planData.samplingStrategy;
            }
        }

        // 填充采样人（如果有用户信息）
        if (options.userId) {
            const userName = localStorage.getItem('my_name');
            if (userName) {
                template.prefilled.sampler = userName;
                template.prefilled.recorder = userName;
                template.prefilled.operator = userName;
            }
        }

        // 添加字段提示信息
        template.fieldHints = this._generateFieldHints(template.fields, task.workstationId);

        return template;
    }

    /**
     * 生成样品编号
     * 格式：工位代码(2位) + 日期(8位) + 序号(2位)
     * @param {string} workstationId 工位ID
     * @param {number} index 序号
     * @returns {string} 样品编号
     */
    _generateSampleId(workstationId, index = 1) {
        const prefixMap = {
            'env-monitoring': 'EM',
            'hazwaste-lab': 'HW',
            'sampling-center': 'SC',
            'data-center': 'DC',
            'instrument-room': 'IR',
            'emergency-center': 'EC'
        };
        const prefix = prefixMap[workstationId] || 'XX';
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const indexStr = String(index).padStart(2, '0');
        return `${prefix}${dateStr}${indexStr}`;
    }

    /**
     * 格式化日期为 YYYY-MM-DD
     * @param {Date} date 日期对象
     * @returns {string} 格式化的日期字符串
     */
    _formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    /**
     * 格式化时间为 HH:MM
     * @param {Date} date 日期对象
     * @returns {string} 格式化的时间字符串
     */
    _formatTime(date) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    /**
     * 生成字段提示信息
     * @param {Array} fields 字段列表
     * @param {string} workstationId 工位ID
     * @returns {Object} 字段提示映射
     */
    _generateFieldHints(fields, workstationId) {
        const hints = {};
        const commonHints = {
            sampleId: '样品编号应具有唯一性，格式：工位代码+日期+序号',
            samplingDate: '填写实际采样日期',
            samplingTime: '填写实际采样时间（24小时制）',
            samplingLocation: '详细描述采样位置，包括经纬度或相对位置',
            waterTemperature: '使用温度计现场测量，精确到0.1℃',
            pH: '使用pH计现场测量，精确到0.01',
            dissolvedOxygen: '使用溶解氧仪现场测量，单位mg/L',
            weatherCondition: '描述天气状况：晴/多云/阴/雨等',
            sampler: '填写采样人员姓名',
            remarks: '记录特殊情况或异常现象',
            coordinates: '使用GPS定位，格式：经度,纬度',
            depth: '采样深度，单位：米',
            soilType: '描述土壤类型：粘土/砂土/壤土等'
        };

        if (fields) {
            for (const field of fields) {
                if (commonHints[field.name]) {
                    hints[field.name] = commonHints[field.name];
                }
            }
        }

        return hints;
    }

    /**
     * 批量生成记录模板
     * 用于需要多个采样点的情况
     * @param {string} taskId 任务ID
     * @param {Object} planData 方案数据
     * @param {number} count 生成数量
     * @returns {Promise<Array>} 记录模板数组
     */
    async generateBatchRecordTemplates(taskId, planData, count) {
        const templates = [];
        const userId = localStorage.getItem('my_id');
        
        for (let i = 1; i <= count; i++) {
            const template = await this.generateRecordTemplate(taskId, planData, {
                userId,
                recordIndex: i
            });
            if (template) {
                templates.push(template);
            }
        }
        
        return templates;
    }

    /**
     * 验证报告格式
     * 对报告内容进行全面的格式和内容验证
     * @param {Object} reportData 报告数据
     * @param {string} taskId 任务ID
     * @param {Object} [previousStageData] 前置阶段数据（用于一致性检查）
     * @returns {Promise<Object>} 验证结果
     */
    async validateReportFormat(reportData, taskId, previousStageData = null) {
        const task = await this.getTask(taskId);
        if (!task) {
            return { valid: false, errors: ['任务不存在'], score: 0 };
        }

        // 找到报告生成阶段
        const reportStage = task.stages.find(s => s.type === StageType.REPORT_GENERATION);
        if (!reportStage) {
            return { valid: false, errors: ['报告阶段不存在'], score: 0 };
        }

        const errors = [];
        const warnings = [];
        let score = 100;

        // 1. 基础验证（必填字段和验证规则）
        const baseValidation = this.validateStageSubmission(reportStage, reportData);
        errors.push(...baseValidation.errors);
        score = Math.min(score, baseValidation.score);

        // 2. 报告标题格式验证
        if (reportData.reportTitle) {
            const titleValidation = this._validateReportTitle(reportData.reportTitle, task);
            if (!titleValidation.valid) {
                errors.push(...titleValidation.errors);
                score -= 5;
            }
        }

        // 3. 内容长度验证
        const contentFields = ['projectOverview', 'samplingOverview', 'siteOverview', 
                              'samplingDesign', 'qualityAssurance', 'conclusion'];
        for (const field of contentFields) {
            if (reportData[field]) {
                const lengthValidation = this._validateContentLength(field, reportData[field]);
                if (!lengthValidation.valid) {
                    warnings.push(lengthValidation.warning);
                }
            }
        }

        // 4. 与前置阶段数据的一致性检查
        if (previousStageData) {
            const consistencyCheck = this._checkReportConsistency(reportData, previousStageData);
            if (!consistencyCheck.consistent) {
                warnings.push(...consistencyCheck.warnings);
            }
        }

        // 5. 报告结构完整性检查
        const structureCheck = this._validateReportStructure(reportData, reportStage);
        if (!structureCheck.valid) {
            errors.push(...structureCheck.errors);
            score -= structureCheck.penalty;
        }

        // 6. 专业术语和格式检查
        const formatCheck = this._validateProfessionalFormat(reportData);
        if (formatCheck.suggestions.length > 0) {
            warnings.push(...formatCheck.suggestions);
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            score: Math.max(0, score),
            details: {
                baseValidation: baseValidation.valid,
                titleValid: !errors.some(e => e.includes('标题')),
                structureComplete: structureCheck.valid,
                consistencyChecked: previousStageData !== null
            }
        };
    }

    /**
     * 验证报告标题格式
     * @param {string} title 报告标题
     * @param {Task} task 任务对象
     * @returns {Object} 验证结果
     */
    _validateReportTitle(title, task) {
        const errors = [];
        
        // 标题不能为空或过短
        if (!title || title.trim().length < 5) {
            errors.push('报告标题过短，应至少包含5个字符');
        }
        
        // 标题不能过长
        if (title && title.length > 100) {
            errors.push('报告标题过长，应不超过100个字符');
        }
        
        // 标题应包含关键信息（可选检查）
        const keywords = ['报告', '方案', '记录', '调查', '监测', '采样'];
        const hasKeyword = keywords.some(kw => title.includes(kw));
        if (!hasKeyword && title.length > 10) {
            // 这是一个建议，不是错误
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 验证内容长度
     * @param {string} fieldName 字段名
     * @param {string} content 内容
     * @returns {Object} 验证结果
     */
    _validateContentLength(fieldName, content) {
        const minLengths = {
            projectOverview: 50,
            samplingOverview: 30,
            siteOverview: 50,
            samplingDesign: 50,
            qualityAssurance: 30,
            conclusion: 30
        };

        const fieldLabels = {
            projectOverview: '项目概况',
            samplingOverview: '采样概况',
            siteOverview: '场地概况',
            samplingDesign: '采样设计',
            qualityAssurance: '质量保证',
            conclusion: '结论与建议'
        };

        const minLength = minLengths[fieldName] || 20;
        const label = fieldLabels[fieldName] || fieldName;

        if (content.length < minLength) {
            return {
                valid: false,
                warning: `${label}内容较短（${content.length}字），建议至少${minLength}字以确保内容完整`
            };
        }

        return { valid: true };
    }

    /**
     * 检查报告与前置阶段数据的一致性
     * @param {Object} reportData 报告数据
     * @param {Object} previousData 前置阶段数据
     * @returns {Object} 一致性检查结果
     */
    _checkReportConsistency(reportData, previousData) {
        const warnings = [];

        // 检查方案数据是否在报告中有所体现
        if (previousData.planData) {
            const plan = previousData.planData;
            
            // 检查采样方法是否一致
            if (plan.samplingMethod && reportData.samplingOverview) {
                if (!reportData.samplingOverview.includes(plan.samplingMethod)) {
                    warnings.push('报告中的采样概况未提及方案中确定的采样方法');
                }
            }
        }

        // 检查记录数据是否在报告中有所体现
        if (previousData.recordData) {
            const record = previousData.recordData;
            
            // 检查样品编号是否被引用
            if (record.sampleId && reportData.samplingOverview) {
                if (!reportData.samplingOverview.includes(record.sampleId)) {
                    warnings.push('建议在报告中引用样品编号以便追溯');
                }
            }
        }

        return {
            consistent: warnings.length === 0,
            warnings: warnings
        };
    }

    /**
     * 验证报告结构完整性
     * @param {Object} reportData 报告数据
     * @param {TaskStage} reportStage 报告阶段定义
     * @returns {Object} 结构验证结果
     */
    _validateReportStructure(reportData, reportStage) {
        const errors = [];
        let penalty = 0;

        // 检查必需的报告章节
        const requiredSections = reportStage.requiredFields || [];
        const missingSections = requiredSections.filter(section => {
            const value = reportData[section];
            return !value || (typeof value === 'string' && !value.trim());
        });

        if (missingSections.length > 0) {
            const sectionLabels = missingSections.map(s => 
                this._getFieldLabel(reportStage, s) || s
            );
            errors.push(`报告缺少必要章节: ${sectionLabels.join('、')}`);
            penalty = missingSections.length * 10;
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            penalty: penalty
        };
    }

    /**
     * 验证专业格式
     * @param {Object} reportData 报告数据
     * @returns {Object} 格式检查结果
     */
    _validateProfessionalFormat(reportData) {
        const suggestions = [];

        // 检查是否包含标准引用
        const allContent = Object.values(reportData)
            .filter(v => typeof v === 'string')
            .join(' ');

        // 检查是否引用了相关标准
        const standardPatterns = [
            /GB\s*\d+/i,
            /HJ\s*\d+/i,
            /HJ\/T\s*\d+/i,
            /GB\/T\s*\d+/i
        ];
        
        const hasStandardRef = standardPatterns.some(pattern => pattern.test(allContent));
        if (!hasStandardRef && allContent.length > 200) {
            suggestions.push('建议在报告中引用相关国家标准或行业标准（如GB、HJ等）');
        }

        // 检查是否包含日期
        const datePattern = /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}/;
        if (!datePattern.test(allContent) && allContent.length > 100) {
            suggestions.push('建议在报告中明确标注相关日期');
        }

        return {
            suggestions: suggestions
        };
    }

    /**
     * 获取报告模板（带预填充数据）
     * 基于前置阶段数据生成报告模板
     * @param {string} taskId 任务ID
     * @param {Object} stageData 各阶段已提交的数据
     * @returns {Promise<Object>} 报告模板
     */
    async generateReportTemplate(taskId, stageData) {
        const task = await this.getTask(taskId);
        if (!task) return null;

        const reportStage = task.stages.find(s => s.type === StageType.REPORT_GENERATION);
        if (!reportStage || !reportStage.template) return null;

        const template = JSON.parse(JSON.stringify(reportStage.template));
        template.prefilled = {};
        template.metadata = {
            generatedAt: Date.now(),
            taskId: taskId,
            taskName: task.name
        };

        // 从方案阶段提取数据
        const planStageId = task.stages.find(s => s.type === StageType.PLAN_DESIGN)?.id;
        const planData = planStageId && stageData[planStageId]?.data;

        // 从记录阶段提取数据
        const recordStageId = task.stages.find(s => s.type === StageType.RECORD_FILLING)?.id;
        const recordData = recordStageId && stageData[recordStageId]?.data;

        // 自动生成报告标题
        if (planData || recordData) {
            const date = this._formatDate(new Date());
            template.prefilled.reportTitle = `${task.name}报告 - ${date}`;
        }

        // 自动生成项目概况
        if (task.taskBrief) {
            template.prefilled.projectOverview = task.taskBrief.background;
        }

        // 自动生成采样概况（基于方案和记录数据）
        if (planData) {
            let overview = '';
            if (planData.samplingMethod) {
                overview += `采样方法：${planData.samplingMethod}。`;
            }
            if (planData.samplingFrequency) {
                overview += `采样频次：${planData.samplingFrequency}。`;
            }
            if (planData.samplingPoints) {
                overview += `采样点位：${planData.samplingPoints}。`;
            }
            if (overview) {
                template.prefilled.samplingOverview = overview;
            }
        }

        return template;
    }

    /**
     * 获取本地执行记录
     * @returns {TaskExecution|null} 执行记录
     */
    _getLocalExecution() {
        const saved = localStorage.getItem('vs_current_execution');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * 获取用户的任务执行历史
     * @param {string} userId 用户ID
     * @param {string} [workstationId] 工位ID（可选）
     * @returns {Promise<TaskExecution[]>} 执行历史
     */
    async getTaskHistory(userId, workstationId = null) {
        const key = `vs_task_history_${userId}`;
        const saved = localStorage.getItem(key);
        let history = saved ? JSON.parse(saved) : [];

        if (workstationId) {
            history = history.filter(h => {
                const task = PRESET_TASKS.find(t => t.id === h.taskId);
                return task && task.workstationId === workstationId;
            });
        }

        return history;
    }

    /**
     * 保存任务执行到历史
     * Requirements: 11.3 - 保存完成任务的完整记录（任务ID、得分、用时、操作路径）
     * @param {TaskExecution} execution 执行记录
     */
    async saveToHistory(execution) {
        const key = `vs_task_history_${execution.userId}`;
        const saved = localStorage.getItem(key);
        const history = saved ? JSON.parse(saved) : [];

        // 确保历史记录包含所有必需字段
        const historyRecord = {
            id: execution.id,
            userId: execution.userId,
            taskId: execution.taskId,
            sessionId: execution.sessionId,
            score: execution.score || 0,
            startedAt: execution.startedAt,
            completedAt: execution.completedAt,
            status: execution.status,
            stageData: execution.stageData || {},
            currentStageIndex: execution.currentStageIndex
        };

        // 添加到历史（避免重复）
        const existingIndex = history.findIndex(h => h.id === execution.id);
        if (existingIndex >= 0) {
            history[existingIndex] = historyRecord;
        } else {
            history.push(historyRecord);
        }

        localStorage.setItem(key, JSON.stringify(history));

        // 同步到数据库（如果可用）
        if (this.supabase && execution.status === TaskExecutionStatus.COMPLETED) {
            try {
                const task = PRESET_TASKS.find(t => t.id === execution.taskId);
                const workstationId = task ? task.workstationId : null;
                const timeSpent = execution.completedAt && execution.startedAt 
                    ? Math.round((execution.completedAt - execution.startedAt) / 1000) 
                    : 0;

                // 检查是否是最高分
                const existingRecords = history.filter(h => 
                    h.taskId === execution.taskId && 
                    h.status === TaskExecutionStatus.COMPLETED
                );
                const isBestScore = existingRecords.every(r => (r.score || 0) <= (execution.score || 0));

                await this.supabase
                    .from('vs_history_records')
                    .upsert({
                        id: execution.id,
                        user_id: execution.userId,
                        workstation_id: workstationId,
                        task_id: execution.taskId,
                        execution_id: execution.id,
                        score: execution.score || 0,
                        time_spent: timeSpent,
                        completed_at: execution.completedAt,
                        is_best_score: isBestScore,
                        operation_path: execution.stageData
                    }, { onConflict: 'id' });
            } catch (error) {
                console.error('保存历史记录到数据库失败:', error);
            }
        }
    }

    /**
     * 获取用户的任务执行历史（带详细信息）
     * Requirements: 11.4 - 显示已完成任务列表和各项得分
     * @param {string} userId 用户ID
     * @param {Object} [options] 选项
     * @param {string} [options.workstationId] 工位ID筛选
     * @param {string} [options.sortBy] 排序方式 ('time-desc'|'time-asc'|'score-desc'|'score-asc')
     * @param {number} [options.limit] 限制数量
     * @returns {Promise<Array>} 历史记录列表（含任务和工位信息）
     */
    async getTaskHistoryWithDetails(userId, options = {}) {
        let history = await this.getTaskHistory(userId, options.workstationId);

        // 添加任务和工位详细信息
        history = history.map(record => {
            const task = PRESET_TASKS.find(t => t.id === record.taskId);
            const workstation = task ? PRESET_WORKSTATIONS.find(w => w.id === task.workstationId) : null;

            return {
                ...record,
                taskName: task ? task.name : '未知任务',
                taskDescription: task ? task.description : '',
                workstationId: task ? task.workstationId : null,
                workstationName: workstation ? workstation.name : '未知工位',
                workstationIcon: workstation ? workstation.icon : 'ri-question-line',
                workstationColor: workstation ? workstation.color : 'gray',
                xpReward: task ? task.xpReward : 0,
                passingScore: task ? task.passingScore : 60,
                maxScore: task ? task.maxScore : 100,
                timeSpent: record.completedAt && record.startedAt 
                    ? record.completedAt - record.startedAt 
                    : 0
            };
        });

        // 排序
        if (options.sortBy) {
            switch (options.sortBy) {
                case 'time-desc':
                    history.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
                    break;
                case 'time-asc':
                    history.sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));
                    break;
                case 'score-desc':
                    history.sort((a, b) => (b.score || 0) - (a.score || 0));
                    break;
                case 'score-asc':
                    history.sort((a, b) => (a.score || 0) - (b.score || 0));
                    break;
            }
        } else {
            // 默认按完成时间降序
            history.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
        }

        // 限制数量
        if (options.limit && options.limit > 0) {
            history = history.slice(0, options.limit);
        }

        return history;
    }

    /**
     * 获取历史记录统计
     * Requirements: 11.3, 11.4 - 统计完成任务数、平均得分、最高得分、总用时
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 统计数据
     */
    async getHistoryStats(userId) {
        const history = await this.getTaskHistory(userId);
        const completedRecords = history.filter(r => r.status === TaskExecutionStatus.COMPLETED);

        if (completedRecords.length === 0) {
            return {
                totalCompleted: 0,
                averageScore: 0,
                bestScore: 0,
                totalTimeMs: 0,
                totalTimeFormatted: '0h'
            };
        }

        const scores = completedRecords.map(r => r.score || 0);
        const totalTimeMs = completedRecords.reduce((sum, r) => {
            if (r.completedAt && r.startedAt) {
                return sum + (r.completedAt - r.startedAt);
            }
            return sum;
        }, 0);

        const totalHours = Math.round(totalTimeMs / 3600000 * 10) / 10;

        return {
            totalCompleted: completedRecords.length,
            averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            bestScore: Math.max(...scores),
            totalTimeMs: totalTimeMs,
            totalTimeFormatted: totalHours > 0 ? `${totalHours}h` : '0h'
        };
    }

    /**
     * 获取指定任务的最高分
     * Requirements: 11.5 - 保留最高分记录
     * @param {string} userId 用户ID
     * @param {string} taskId 任务ID
     * @returns {Promise<number>} 最高分，如果没有记录则返回0
     */
    async getTaskHighScore(userId, taskId) {
        const history = await this.getTaskHistory(userId);
        const taskRecords = history.filter(r => 
            r.taskId === taskId && 
            r.status === TaskExecutionStatus.COMPLETED
        );
        
        if (taskRecords.length === 0) return 0;
        return Math.max(...taskRecords.map(r => r.score || 0));
    }

    /**
     * 获取指定任务的所有历史记录
     * Requirements: 11.5 - 支持查看历史任务详情
     * @param {string} userId 用户ID
     * @param {string} taskId 任务ID
     * @returns {Promise<Array>} 该任务的所有历史记录
     */
    async getTaskAttempts(userId, taskId) {
        const history = await this.getTaskHistory(userId);
        return history
            .filter(r => r.taskId === taskId)
            .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    }

    /**
     * 开始重新挑战任务
     * Requirements: 11.5 - 支持重玩历史任务，保留最高分记录
     * @param {string} sessionId 会话ID
     * @param {string} taskId 任务ID
     * @param {string} userId 用户ID
     * @returns {Promise<{execution: TaskExecution, previousHighScore: number, attemptCount: number}>} 执行记录和历史信息
     */
    async startRetryChallenge(sessionId, taskId, userId) {
        // 获取之前的最高分和尝试次数
        const previousHighScore = await this.getTaskHighScore(userId, taskId);
        const attempts = await this.getTaskAttempts(userId, taskId);
        const attemptCount = attempts.filter(a => a.status === TaskExecutionStatus.COMPLETED).length;

        // 开始新的任务执行
        const execution = await this.startTask(sessionId, taskId);

        // 标记为重新挑战
        execution.isRetry = true;
        execution.previousHighScore = previousHighScore;
        execution.attemptNumber = attemptCount + 1;

        // 更新本地存储
        localStorage.setItem('vs_current_execution', JSON.stringify(execution));
        this.currentExecution = execution;

        return {
            execution,
            previousHighScore,
            attemptCount
        };
    }

    /**
     * 检查是否刷新了最高分
     * Requirements: 11.5 - 保留最高分记录
     * @param {string} userId 用户ID
     * @param {string} taskId 任务ID
     * @param {number} newScore 新得分
     * @returns {Promise<{isNewHighScore: boolean, previousHighScore: number, improvement: number}>}
     */
    async checkHighScoreImprovement(userId, taskId, newScore) {
        const previousHighScore = await this.getTaskHighScore(userId, taskId);
        const isNewHighScore = newScore > previousHighScore;
        const improvement = isNewHighScore ? newScore - previousHighScore : 0;

        return {
            isNewHighScore,
            previousHighScore,
            improvement
        };
    }
}


// ================= 过程追踪服务 =================

/**
 * 行为日志接口定义
 * @typedef {Object} BehaviorLog
 * @property {string} id - 日志唯一标识
 * @property {string} sessionId - 会话ID
 * @property {string} userId - 用户ID
 * @property {number} timestamp - 时间戳
 * @property {string} actionType - 行为类型
 * @property {Object} details - 行为详情
 * @property {string} [details.pageId] - 页面ID
 * @property {string} [details.fieldId] - 字段ID
 * @property {number} [details.duration] - 停留时长（毫秒）
 * @property {any} [details.oldValue] - 修改前的值
 * @property {any} [details.newValue] - 修改后的值
 * @property {string} [details.hintId] - 提示ID
 * @property {string} [details.hintType] - 提示类型
 * @property {string} [details.errorType] - 错误类型
 * @property {string} [details.stepId] - 步骤ID
 * @property {string} [details.stageId] - 阶段ID
 */

/**
 * 字段修改统计接口
 * @typedef {Object} FieldModificationStats
 * @property {string} fieldId - 字段ID
 * @property {number} modificationCount - 修改次数
 * @property {Array<{oldValue: any, newValue: any, timestamp: number}>} history - 修改历史
 */

/**
 * 页面停留统计接口
 * @typedef {Object} PageDurationStats
 * @property {string} pageId - 页面ID
 * @property {number} totalDuration - 总停留时长（毫秒）
 * @property {number} visitCount - 访问次数
 * @property {number} averageDuration - 平均停留时长（毫秒）
 */

/**
 * 提示查看统计接口
 * @typedef {Object} HintViewStats
 * @property {string} hintId - 提示ID
 * @property {string} hintType - 提示类型
 * @property {number} viewCount - 查看次数
 * @property {number} firstViewAt - 首次查看时间
 * @property {number} lastViewAt - 最后查看时间
 */

/**
 * 过程追踪服务类 - 无感采集学习行为数据
 * 
 * 功能：
 * - 记录操作时间戳、页面停留时长
 * - 记录字段修改（修改次数、前后差异）
 * - 记录提示查看（类型和时间点）
 * - 识别疑难点（停顿超过阈值）
 * - 统计分析（平均停顿时间、提示查看率、错误率）
 */
class ProcessTrackerService {
    constructor(supabase) {
        this.supabase = supabase;
        /** @type {BehaviorLog[]} */
        this.localLogs = [];
        this.syncInterval = null;
        
        // 页面停留追踪
        this.pageEnterTime = {};  // { pageId: enterTimestamp }
        
        // 字段修改追踪
        /** @type {Map<string, FieldModificationStats>} */
        this.fieldModifications = new Map();
        
        // 提示查看追踪
        /** @type {Map<string, HintViewStats>} */
        this.hintViews = new Map();
        
        // 疑难点标记
        /** @type {Set<string>} */
        this.difficultPoints = new Set();
        
        // 当前会话信息
        this.currentSessionId = null;
        this.currentStepId = null;
        this.currentStageId = null;
        
        // 启动自动同步
        this._startAutoSync();
    }

    /**
     * 启动自动同步
     * @private
     */
    _startAutoSync() {
        // 每30秒同步一次
        this.syncInterval = setInterval(() => {
            this._syncLogs();
        }, 30000);
    }

    /**
     * 停止自动同步
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * 设置当前会话
     * @param {string} sessionId - 会话ID
     */
    setCurrentSession(sessionId) {
        this.currentSessionId = sessionId;
    }

    /**
     * 设置当前步骤/阶段上下文
     * @param {string} stepId - 步骤ID
     * @param {string} stageId - 阶段ID
     */
    setCurrentContext(stepId, stageId) {
        this.currentStepId = stepId;
        this.currentStageId = stageId;
    }

    /**
     * 创建行为日志对象
     * @param {string} sessionId - 会话ID
     * @param {string} actionType - 行为类型
     * @param {Object} details - 行为详情
     * @returns {BehaviorLog} 行为日志对象
     */
    _createLog(sessionId, actionType, details) {
        return {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: sessionId,
            userId: localStorage.getItem('my_id') || 'guest',
            timestamp: Date.now(),
            actionType: actionType,
            details: {
                ...details,
                stepId: this.currentStepId,
                stageId: this.currentStageId
            }
        };
    }

    /**
     * 记录用户行为
     * @param {string} sessionId 会话ID
     * @param {Object} action 行为对象
     * @returns {Promise<BehaviorLog>} 记录的日志
     */
    async logAction(sessionId, action) {
        const log = this._createLog(
            sessionId,
            action.type,
            action.details || {}
        );

        this.localLogs.push(log);

        // 批量同步到服务器
        if (this.localLogs.length >= 10) {
            await this._syncLogs();
        }

        return log;
    }

    // ================= 页面停留时长记录 =================

    /**
     * 记录进入页面
     * @param {string} sessionId - 会话ID
     * @param {string} pageId - 页面ID
     */
    enterPage(sessionId, pageId) {
        this.pageEnterTime[pageId] = Date.now();
        this.logAction(sessionId, {
            type: ActionType.PAGE_VIEW,
            details: { pageId, event: 'enter' }
        });
    }

    /**
     * 记录离开页面并计算停留时长
     * @param {string} sessionId - 会话ID
     * @param {string} pageId - 页面ID
     * @returns {Promise<number>} 停留时长（毫秒）
     */
    async leavePage(sessionId, pageId) {
        const enterTime = this.pageEnterTime[pageId];
        if (!enterTime) return 0;

        const duration = Date.now() - enterTime;
        delete this.pageEnterTime[pageId];

        await this.logPageView(sessionId, pageId, duration);

        // 检查是否为疑难点
        if (this.isDifficultPoint(duration)) {
            this.difficultPoints.add(`${pageId}_${this.currentStepId}`);
            await this.logAction(sessionId, {
                type: ActionType.PAGE_VIEW,
                details: { 
                    pageId, 
                    duration, 
                    isDifficultPoint: true,
                    threshold: PAUSE_THRESHOLD.DEFAULT * 1000
                }
            });
        }

        return duration;
    }

    /**
     * 记录页面浏览
     * @param {string} sessionId 会话ID
     * @param {string} pageId 页面ID
     * @param {number} duration 停留时长（毫秒）
     * @returns {Promise<BehaviorLog>} 记录的日志
     */
    async logPageView(sessionId, pageId, duration) {
        return await this.logAction(sessionId, {
            type: ActionType.PAGE_VIEW,
            details: { pageId, duration, event: 'leave' }
        });
    }

    // ================= 字段修改记录 =================

    /**
     * 记录字段聚焦
     * @param {string} sessionId - 会话ID
     * @param {string} fieldId - 字段ID
     * @param {any} currentValue - 当前值
     */
    async logFieldFocus(sessionId, fieldId, currentValue) {
        // 初始化字段修改统计
        if (!this.fieldModifications.has(fieldId)) {
            this.fieldModifications.set(fieldId, {
                fieldId: fieldId,
                modificationCount: 0,
                history: [],
                lastValue: currentValue
            });
        }

        await this.logAction(sessionId, {
            type: ActionType.FIELD_FOCUS,
            details: { fieldId, currentValue }
        });
    }

    /**
     * 记录字段失焦
     * @param {string} sessionId - 会话ID
     * @param {string} fieldId - 字段ID
     * @param {any} newValue - 新值
     */
    async logFieldBlur(sessionId, fieldId, newValue) {
        const stats = this.fieldModifications.get(fieldId);
        if (stats && stats.lastValue !== newValue) {
            // 记录修改
            await this.logModification(sessionId, fieldId, stats.lastValue, newValue);
        }

        await this.logAction(sessionId, {
            type: ActionType.FIELD_BLUR,
            details: { fieldId, value: newValue }
        });
    }

    /**
     * 记录字段修改
     * @param {string} sessionId 会话ID
     * @param {string} fieldId 字段ID
     * @param {any} oldValue 旧值
     * @param {any} newValue 新值
     * @returns {Promise<BehaviorLog>} 记录的日志
     */
    async logModification(sessionId, fieldId, oldValue, newValue) {
        // 更新字段修改统计
        let stats = this.fieldModifications.get(fieldId);
        if (!stats) {
            stats = {
                fieldId: fieldId,
                modificationCount: 0,
                history: [],
                lastValue: oldValue
            };
            this.fieldModifications.set(fieldId, stats);
        }

        stats.modificationCount++;
        stats.history.push({
            oldValue: oldValue,
            newValue: newValue,
            timestamp: Date.now()
        });
        stats.lastValue = newValue;

        return await this.logAction(sessionId, {
            type: ActionType.FIELD_MODIFY,
            details: { 
                fieldId, 
                oldValue, 
                newValue,
                modificationCount: stats.modificationCount
            }
        });
    }

    /**
     * 获取字段修改统计
     * @param {string} fieldId - 字段ID
     * @returns {FieldModificationStats|null} 字段修改统计
     */
    getFieldModificationStats(fieldId) {
        return this.fieldModifications.get(fieldId) || null;
    }

    /**
     * 获取所有字段修改统计
     * @returns {FieldModificationStats[]} 所有字段修改统计
     */
    getAllFieldModificationStats() {
        return Array.from(this.fieldModifications.values());
    }

    // ================= 提示查看记录 =================

    /**
     * 记录提示查看
     * @param {string} sessionId 会话ID
     * @param {string} hintId 提示ID
     * @param {string} [hintType='info'] 提示类型
     * @returns {Promise<BehaviorLog>} 记录的日志
     */
    async logHintView(sessionId, hintId, hintType = 'info') {
        const now = Date.now();
        
        // 更新提示查看统计
        let stats = this.hintViews.get(hintId);
        if (!stats) {
            stats = {
                hintId: hintId,
                hintType: hintType,
                viewCount: 0,
                firstViewAt: now,
                lastViewAt: now
            };
            this.hintViews.set(hintId, stats);
        }

        stats.viewCount++;
        stats.lastViewAt = now;

        return await this.logAction(sessionId, {
            type: ActionType.HINT_VIEW,
            details: { 
                hintId, 
                hintType,
                viewCount: stats.viewCount,
                viewedAt: now
            }
        });
    }

    /**
     * 获取提示查看统计
     * @param {string} hintId - 提示ID
     * @returns {HintViewStats|null} 提示查看统计
     */
    getHintViewStats(hintId) {
        return this.hintViews.get(hintId) || null;
    }

    /**
     * 获取所有提示查看统计
     * @returns {HintViewStats[]} 所有提示查看统计
     */
    getAllHintViewStats() {
        return Array.from(this.hintViews.values());
    }

    /**
     * 计算提示查看率
     * @param {number} totalHints - 总提示数
     * @returns {number} 提示查看率 (0-1)
     */
    calculateHintViewRate(totalHints) {
        if (totalHints <= 0) return 0;
        const viewedHints = this.hintViews.size;
        return viewedHints / totalHints;
    }

    // ================= 错误记录 =================

    /**
     * 错误类型枚举
     */
    /**
     * 错误类型枚举
     * @enum {string}
     */
    static ErrorTypes = {
        CONCEPT: 'concept_error',      // 概念错误：专业术语、标准引用、定义理解错误
        CALCULATION: 'calculation_error', // 计算错误：数值计算、公式应用、单位换算错误
        PROCESS: 'process_error',      // 流程错误：步骤顺序、操作流程、方法选择错误
        FORMAT: 'format_error'         // 格式错误：格式规范、必填项、模板填写错误
    };

    /**
     * 错误类型中文名称映射
     */
    static ErrorTypeNames = {
        [ProcessTrackerService.ErrorTypes.CONCEPT]: '概念错误',
        [ProcessTrackerService.ErrorTypes.CALCULATION]: '计算错误',
        [ProcessTrackerService.ErrorTypes.PROCESS]: '流程错误',
        [ProcessTrackerService.ErrorTypes.FORMAT]: '格式错误'
    };

    /**
     * 错误分类关键词配置
     * 用于基于消息内容自动分类错误
     */
    static ErrorClassificationKeywords = {
        [ProcessTrackerService.ErrorTypes.CONCEPT]: [
            '概念', '定义', '标准', '规范', '术语', '原理', '理论',
            '含义', '意义', '理解', '认识', '知识', '专业', '国标',
            'GB', 'HJ', '标准号', '条款', '规定', '要求', '依据',
            '方法', '原则', '基础', '基本', '核心', '关键'
        ],
        [ProcessTrackerService.ErrorTypes.CALCULATION]: [
            '计算', '数值', '公式', '单位', '换算', '结果', '数据',
            '精度', '误差', '偏差', '范围', '阈值', '限值', '浓度',
            '含量', '比例', '百分比', '平均', '总量', '数量', '面积',
            '体积', '质量', '重量', '温度', '湿度', 'pH', '溶解氧',
            'mg/L', 'μg/L', '℃', '%', '小数', '整数', '四舍五入'
        ],
        [ProcessTrackerService.ErrorTypes.PROCESS]: [
            '流程', '步骤', '顺序', '先后', '操作', '程序', '方法',
            '阶段', '环节', '过程', '次序', '前后', '之前', '之后',
            '首先', '然后', '最后', '接着', '跳过', '遗漏', '缺少',
            '重复', '颠倒', '混淆', '采样', '保存', '运输', '分析'
        ],
        [ProcessTrackerService.ErrorTypes.FORMAT]: [
            '格式', '模板', '填写', '必填', '空白', '缺失', '遗漏',
            '规范', '样式', '编号', '日期', '时间', '签名', '盖章',
            '表格', '字段', '内容', '长度', '字数', '字符', '输入',
            '选择', '勾选', '上传', '附件', '图片', '文件'
        ]
    };

    /**
     * 字段类型与错误类型的映射
     * 用于基于字段类型辅助分类
     */
    static FieldTypeErrorMapping = {
        // 数值类型字段通常关联计算错误
        'number': ProcessTrackerService.ErrorTypes.CALCULATION,
        'decimal': ProcessTrackerService.ErrorTypes.CALCULATION,
        'percentage': ProcessTrackerService.ErrorTypes.CALCULATION,
        // 选择类型字段通常关联概念错误
        'select': ProcessTrackerService.ErrorTypes.CONCEPT,
        'radio': ProcessTrackerService.ErrorTypes.CONCEPT,
        'checkbox': ProcessTrackerService.ErrorTypes.CONCEPT,
        // 文本类型字段通常关联格式错误
        'text': ProcessTrackerService.ErrorTypes.FORMAT,
        'textarea': ProcessTrackerService.ErrorTypes.FORMAT,
        // 日期时间类型字段通常关联格式错误
        'date': ProcessTrackerService.ErrorTypes.FORMAT,
        'time': ProcessTrackerService.ErrorTypes.FORMAT,
        'datetime': ProcessTrackerService.ErrorTypes.FORMAT
    };

    /**
     * 验证规则类型与错误类型的映射
     */
    static ValidationRuleErrorMapping = {
        'required': ProcessTrackerService.ErrorTypes.FORMAT,
        'minLength': ProcessTrackerService.ErrorTypes.FORMAT,
        'maxLength': ProcessTrackerService.ErrorTypes.FORMAT,
        'pattern': ProcessTrackerService.ErrorTypes.FORMAT,
        'min': ProcessTrackerService.ErrorTypes.CALCULATION,
        'max': ProcessTrackerService.ErrorTypes.CALCULATION,
        'range': ProcessTrackerService.ErrorTypes.CALCULATION,
        'precision': ProcessTrackerService.ErrorTypes.CALCULATION,
        'enum': ProcessTrackerService.ErrorTypes.CONCEPT,
        'custom': ProcessTrackerService.ErrorTypes.CONCEPT
    };

    /**
     * 记录错误发生
     * @param {string} sessionId 会话ID
     * @param {string} errorType 错误类型
     * @param {Object} errorDetails 错误详情
     * @returns {Promise<BehaviorLog>} 记录的日志
     */
    async logError(sessionId, errorType, errorDetails) {
        return await this.logAction(sessionId, {
            type: ActionType.ERROR_OCCUR,
            details: { 
                errorType, 
                errorTypeName: ProcessTrackerService.ErrorTypeNames[errorType] || '未知错误',
                ...errorDetails,
                occurredAt: Date.now()
            }
        });
    }

    /**
     * 自动分类并记录错误
     * @param {string} sessionId 会话ID
     * @param {Object} error 错误对象
     * @param {string} error.message 错误消息
     * @param {string} [error.field] 相关字段
     * @param {string} [error.fieldType] 字段类型
     * @param {any} [error.value] 错误值
     * @param {string} [error.validationRule] 验证规则类型
     * @param {Object} [error.context] 额外上下文
     * @returns {Promise<{log: BehaviorLog, errorType: string}>} 记录的日志和错误类型
     */
    async classifyAndLogError(sessionId, error) {
        const errorType = this.classifyError(error);
        const log = await this.logError(sessionId, errorType, {
            message: error.message,
            field: error.field,
            fieldType: error.fieldType,
            value: error.value,
            validationRule: error.validationRule,
            context: error.context
        });
        return { log, errorType };
    }

    /**
     * 分类错误
     * 使用多维度分析来确定错误类型：
     * 1. 消息关键词匹配
     * 2. 字段类型推断
     * 3. 验证规则类型推断
     * 4. 值模式分析
     * 
     * @param {Object} error - 错误对象
     * @param {string} error.message - 错误消息
     * @param {string} [error.field] - 相关字段
     * @param {string} [error.fieldType] - 字段类型
     * @param {any} [error.value] - 错误值
     * @param {string} [error.validationRule] - 验证规则类型
     * @returns {string} 错误类型
     */
    classifyError(error) {
        const scores = {
            [ProcessTrackerService.ErrorTypes.CONCEPT]: 0,
            [ProcessTrackerService.ErrorTypes.CALCULATION]: 0,
            [ProcessTrackerService.ErrorTypes.PROCESS]: 0,
            [ProcessTrackerService.ErrorTypes.FORMAT]: 0
        };

        // 1. 基于消息关键词分析
        const messageScore = this._analyzeMessageKeywords(error.message || '');
        for (const [type, score] of Object.entries(messageScore)) {
            scores[type] += score * 3; // 消息关键词权重最高
        }

        // 2. 基于字段类型分析
        if (error.fieldType) {
            const fieldTypeError = ProcessTrackerService.FieldTypeErrorMapping[error.fieldType];
            if (fieldTypeError) {
                scores[fieldTypeError] += 2;
            }
        }

        // 3. 基于验证规则类型分析
        if (error.validationRule) {
            const ruleTypeError = ProcessTrackerService.ValidationRuleErrorMapping[error.validationRule];
            if (ruleTypeError) {
                scores[ruleTypeError] += 2;
            }
        }

        // 4. 基于值模式分析
        if (error.value !== undefined && error.value !== null) {
            const valueScore = this._analyzeValuePattern(error.value);
            for (const [type, score] of Object.entries(valueScore)) {
                scores[type] += score;
            }
        }

        // 5. 基于字段名分析
        if (error.field) {
            const fieldScore = this._analyzeFieldName(error.field);
            for (const [type, score] of Object.entries(fieldScore)) {
                scores[type] += score;
            }
        }

        // 找出得分最高的错误类型
        let maxScore = 0;
        let resultType = ProcessTrackerService.ErrorTypes.FORMAT; // 默认为格式错误

        for (const [type, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                resultType = type;
            }
        }

        return resultType;
    }

    /**
     * 分析消息中的关键词
     * @param {string} message - 错误消息
     * @returns {Object} 各错误类型的得分
     * @private
     */
    _analyzeMessageKeywords(message) {
        const scores = {
            [ProcessTrackerService.ErrorTypes.CONCEPT]: 0,
            [ProcessTrackerService.ErrorTypes.CALCULATION]: 0,
            [ProcessTrackerService.ErrorTypes.PROCESS]: 0,
            [ProcessTrackerService.ErrorTypes.FORMAT]: 0
        };

        const lowerMessage = message.toLowerCase();

        for (const [errorType, keywords] of Object.entries(ProcessTrackerService.ErrorClassificationKeywords)) {
            for (const keyword of keywords) {
                if (lowerMessage.includes(keyword.toLowerCase())) {
                    scores[errorType]++;
                }
            }
        }

        return scores;
    }

    /**
     * 分析值的模式
     * @param {any} value - 错误值
     * @returns {Object} 各错误类型的得分
     * @private
     */
    _analyzeValuePattern(value) {
        const scores = {
            [ProcessTrackerService.ErrorTypes.CONCEPT]: 0,
            [ProcessTrackerService.ErrorTypes.CALCULATION]: 0,
            [ProcessTrackerService.ErrorTypes.PROCESS]: 0,
            [ProcessTrackerService.ErrorTypes.FORMAT]: 0
        };

        const strValue = String(value);

        // 检查是否为数值相关
        if (!isNaN(parseFloat(strValue)) || /[\d.]+/.test(strValue)) {
            scores[ProcessTrackerService.ErrorTypes.CALCULATION]++;
        }

        // 检查是否包含单位
        if (/mg\/L|μg\/L|℃|%|ppm|ppb|mol|g\/L/i.test(strValue)) {
            scores[ProcessTrackerService.ErrorTypes.CALCULATION]++;
        }

        // 检查是否为空或格式问题
        if (strValue.trim() === '' || strValue === 'undefined' || strValue === 'null') {
            scores[ProcessTrackerService.ErrorTypes.FORMAT]++;
        }

        // 检查是否包含标准编号
        if (/GB|HJ|DB|NY|SL|CJ/i.test(strValue)) {
            scores[ProcessTrackerService.ErrorTypes.CONCEPT]++;
        }

        return scores;
    }

    /**
     * 分析字段名
     * @param {string} fieldName - 字段名
     * @returns {Object} 各错误类型的得分
     * @private
     */
    _analyzeFieldName(fieldName) {
        const scores = {
            [ProcessTrackerService.ErrorTypes.CONCEPT]: 0,
            [ProcessTrackerService.ErrorTypes.CALCULATION]: 0,
            [ProcessTrackerService.ErrorTypes.PROCESS]: 0,
            [ProcessTrackerService.ErrorTypes.FORMAT]: 0
        };

        const lowerField = fieldName.toLowerCase();

        // 数值相关字段
        const calculationFields = ['temperature', 'ph', 'concentration', 'value', 'amount', 
            'quantity', 'weight', 'volume', 'area', 'depth', 'width', 'height', 'count',
            '温度', '浓度', '含量', '数量', '重量', '体积', '面积', '深度'];
        for (const field of calculationFields) {
            if (lowerField.includes(field)) {
                scores[ProcessTrackerService.ErrorTypes.CALCULATION]++;
                break;
            }
        }

        // 概念相关字段
        const conceptFields = ['method', 'type', 'category', 'standard', 'purpose',
            '方法', '类型', '类别', '标准', '目的', '原理'];
        for (const field of conceptFields) {
            if (lowerField.includes(field)) {
                scores[ProcessTrackerService.ErrorTypes.CONCEPT]++;
                break;
            }
        }

        // 流程相关字段
        const processFields = ['step', 'stage', 'phase', 'order', 'sequence',
            '步骤', '阶段', '顺序', '流程'];
        for (const field of processFields) {
            if (lowerField.includes(field)) {
                scores[ProcessTrackerService.ErrorTypes.PROCESS]++;
                break;
            }
        }

        // 格式相关字段
        const formatFields = ['id', 'code', 'number', 'date', 'time', 'name', 'title',
            '编号', '日期', '时间', '名称', '标题'];
        for (const field of formatFields) {
            if (lowerField.includes(field)) {
                scores[ProcessTrackerService.ErrorTypes.FORMAT]++;
                break;
            }
        }

        return scores;
    }

    /**
     * 获取错误类型的中文名称
     * @param {string} errorType - 错误类型
     * @returns {string} 中文名称
     */
    getErrorTypeName(errorType) {
        return ProcessTrackerService.ErrorTypeNames[errorType] || '未知错误';
    }

    /**
     * 获取所有错误类型
     * @returns {Object} 错误类型枚举
     */
    static getErrorTypes() {
        return ProcessTrackerService.ErrorTypes;
    }

    /**
     * 验证错误类型是否有效
     * @param {string} errorType - 错误类型
     * @returns {boolean} 是否有效
     */
    static isValidErrorType(errorType) {
        return Object.values(ProcessTrackerService.ErrorTypes).includes(errorType);
    }

    // ================= 疑难点识别 =================

    /**
     * 检查是否为疑难点（停顿超过阈值）
     * @param {number} duration 停顿时长（毫秒）
     * @param {number} threshold 阈值（秒），默认使用DEFAULT
     * @returns {boolean} 是否为疑难点
     */
    isDifficultPoint(duration, threshold = PAUSE_THRESHOLD.DEFAULT) {
        return duration > threshold * 1000;
    }

    /**
     * 标记疑难点
     * @param {string} sessionId - 会话ID
     * @param {string} stepId - 步骤ID
     * @param {number} duration - 停顿时长（毫秒）
     * @param {string} [reason] - 标记原因
     */
    async markDifficultPoint(sessionId, stepId, duration, reason = 'pause_threshold_exceeded') {
        this.difficultPoints.add(stepId);
        
        await this.logAction(sessionId, {
            type: ActionType.PAGE_VIEW,
            details: {
                stepId,
                duration,
                isDifficultPoint: true,
                reason,
                threshold: PAUSE_THRESHOLD.DEFAULT * 1000
            }
        });
    }

    /**
     * 获取当前会话的疑难点列表
     * @returns {string[]} 疑难点步骤ID列表
     */
    getDifficultPoints() {
        return Array.from(this.difficultPoints);
    }

    /**
     * 识别疑难步骤（从数据库分析）
     * @param {string} workstationId 工位ID
     * @returns {Promise<Array>} 疑难步骤列表
     */
    async identifyDifficultSteps(workstationId) {
        // 先从本地日志分析
        const localAnalysis = this._analyzeLocalDifficultSteps(workstationId);
        
        if (!this.supabase) {
            return localAnalysis;
        }

        const { data: logs, error } = await this.supabase
            .from('vs_behavior_logs')
            .select('*')
            .eq('workstation_id', workstationId);

        if (error) return localAnalysis;

        // 分析停顿时间超过阈值的步骤
        const stepDurations = {};
        const stepHints = {};
        const stepErrors = {};
        const stepVisitors = {};

        for (const log of logs || []) {
            const stepId = log.details?.stepId;
            if (!stepId) continue;

            const actionType = log.action_type || log.actionType;

            if (actionType === ActionType.PAGE_VIEW) {
                if (!stepDurations[stepId]) stepDurations[stepId] = [];
                stepDurations[stepId].push(log.details.duration || 0);
                
                if (!stepVisitors[stepId]) stepVisitors[stepId] = new Set();
                stepVisitors[stepId].add(log.user_id || log.userId);
            }
            if (actionType === ActionType.HINT_VIEW) {
                stepHints[stepId] = (stepHints[stepId] || 0) + 1;
            }
            if (actionType === ActionType.ERROR_OCCUR) {
                stepErrors[stepId] = (stepErrors[stepId] || 0) + 1;
            }
        }

        const difficultSteps = [];
        for (const stepId of Object.keys(stepDurations)) {
            const durations = stepDurations[stepId];
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const visitorCount = stepVisitors[stepId]?.size || 0;
            const hintViewCount = stepHints[stepId] || 0;
            const errorCount = stepErrors[stepId] || 0;
            
            // 计算疑难指数
            const hintViewRate = visitorCount > 0 ? hintViewCount / visitorCount : 0;
            const errorRate = visitorCount > 0 ? errorCount / visitorCount : 0;
            
            if (avgDuration > PAUSE_THRESHOLD.DEFAULT * 1000 || 
                hintViewRate > 0.5 || 
                errorRate > 0.3) {
                difficultSteps.push({
                    stepId,
                    averageDuration: avgDuration,
                    hintViewCount: hintViewCount,
                    hintViewRate: hintViewRate,
                    errorCount: errorCount,
                    errorRate: errorRate,
                    visitorCount: visitorCount,
                    isDifficult: true,
                    difficultyScore: this._calculateDifficultyScore(avgDuration, hintViewRate, errorRate)
                });
            }
        }

        // 按疑难指数排序
        return difficultSteps.sort((a, b) => b.difficultyScore - a.difficultyScore);
    }

    /**
     * 计算疑难指数
     * @param {number} avgDuration - 平均停顿时长（毫秒）
     * @param {number} hintViewRate - 提示查看率
     * @param {number} errorRate - 错误率
     * @returns {number} 疑难指数 (0-100)
     */
    _calculateDifficultyScore(avgDuration, hintViewRate, errorRate) {
        // 停顿时长得分 (0-40分)
        const durationScore = Math.min(40, (avgDuration / (PAUSE_THRESHOLD.DEFAULT * 1000)) * 20);
        
        // 提示查看率得分 (0-30分)
        const hintScore = hintViewRate * 30;
        
        // 错误率得分 (0-30分)
        const errorScore = errorRate * 30;
        
        return Math.round(durationScore + hintScore + errorScore);
    }

    /**
     * 分析本地日志中的疑难步骤
     * @param {string} workstationId - 工位ID
     * @returns {Array} 疑难步骤列表
     */
    _analyzeLocalDifficultSteps(workstationId) {
        const stepDurations = {};
        
        for (const log of this.localLogs) {
            const stepId = log.details?.stepId;
            if (!stepId) continue;
            
            if (log.actionType === ActionType.PAGE_VIEW && log.details?.duration) {
                if (!stepDurations[stepId]) stepDurations[stepId] = [];
                stepDurations[stepId].push(log.details.duration);
            }
        }

        const difficultSteps = [];
        for (const stepId of Object.keys(stepDurations)) {
            const durations = stepDurations[stepId];
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            
            if (avgDuration > PAUSE_THRESHOLD.DEFAULT * 1000) {
                difficultSteps.push({
                    stepId,
                    averageDuration: avgDuration,
                    isDifficult: true
                });
            }
        }

        return difficultSteps;
    }

    // ================= 统计分析功能 =================

    /**
     * 获取会话分析数据
     * @param {string} sessionId 会话ID
     * @returns {Promise<Object>} 会话分析数据
     */
    async getSessionAnalytics(sessionId) {
        const logs = await this._getSessionLogs(sessionId);
        
        const pageViews = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.PAGE_VIEW
        );
        const modifications = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.FIELD_MODIFY
        );
        const hintsViewed = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.HINT_VIEW
        );
        const errors = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.ERROR_OCCUR
        );

        // 计算各项统计
        const avgDuration = this._calculateAverageDuration(pageViews);
        const totalDuration = pageViews.reduce((sum, l) => sum + (l.details?.duration || 0), 0);
        
        // 统计疑难点
        const difficultPointLogs = pageViews.filter(l => l.details?.isDifficultPoint);

        return {
            totalActions: logs.length,
            pageViews: pageViews.length,
            modifications: modifications.length,
            hintsViewed: hintsViewed.length,
            errors: errors.length,
            averageDuration: avgDuration,
            totalDuration: totalDuration,
            difficultPoints: difficultPointLogs.length,
            fieldModificationStats: this.getAllFieldModificationStats(),
            hintViewStats: this.getAllHintViewStats()
        };
    }

    /**
     * 获取学生分析数据
     * @param {string} userId - 用户ID
     * @returns {Promise<Object>} 学生分析数据
     */
    async getStudentAnalytics(userId) {
        let logs = this.localLogs.filter(l => l.userId === userId);
        
        if (this.supabase) {
            const { data, error } = await this.supabase
                .from('vs_behavior_logs')
                .select('*')
                .eq('user_id', userId);
            
            if (!error && data) {
                logs = [...logs, ...data];
            }
        }

        const pageViews = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.PAGE_VIEW
        );
        const modifications = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.FIELD_MODIFY
        );
        const hintsViewed = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.HINT_VIEW
        );
        const errors = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.ERROR_OCCUR
        );

        // 按步骤分组统计
        const stepStats = this._groupByStep(logs);

        return {
            userId,
            totalActions: logs.length,
            totalStudyTime: pageViews.reduce((sum, l) => sum + (l.details?.duration || 0), 0),
            averagePauseDuration: this._calculateAverageDuration(pageViews),
            totalModifications: modifications.length,
            totalHintsViewed: hintsViewed.length,
            totalErrors: errors.length,
            stepStats: stepStats,
            errorsByType: this._groupErrorsByType(errors)
        };
    }

    /**
     * 获取班级分析数据
     * @param {string} classId 班级ID
     * @returns {Promise<Object>} 班级分析数据
     */
    async getClassAnalytics(classId) {
        let logs = [];
        
        if (this.supabase) {
            const { data, error } = await this.supabase
                .from('vs_behavior_logs')
                .select('*')
                .eq('class_id', classId);

            if (error) {
                console.error('获取班级分析失败:', error);
                return null;
            }
            logs = data || [];
        }

        return this._analyzeClassData(logs);
    }

    /**
     * 计算班级统计数据
     * @param {string} classId - 班级ID
     * @param {string} workstationId - 工位ID（可选）
     * @returns {Promise<Object>} 班级统计数据
     */
    async calculateClassStatistics(classId, workstationId = null) {
        const classAnalytics = await this.getClassAnalytics(classId);
        if (!classAnalytics) return null;

        const difficultSteps = workstationId 
            ? await this.identifyDifficultSteps(workstationId)
            : [];

        return {
            ...classAnalytics,
            difficultSteps,
            commonErrors: await this._identifyCommonErrors(classId)
        };
    }

    /**
     * 生成班级分析报告
     * @param {string} classId - 班级ID
     * @param {Object} options - 报告选项
     * @returns {Promise<Object>} 分析报告
     */
    async generateClassReport(classId, options = {}) {
        const { workstationId, startDate, endDate } = options;
        
        const classStats = await this.calculateClassStatistics(classId, workstationId);
        if (!classStats) return null;

        return {
            reportId: `report_${Date.now()}`,
            generatedAt: Date.now(),
            classId,
            workstationId,
            period: { startDate, endDate },
            summary: {
                totalStudents: classStats.totalStudents,
                activeStudents: classStats.activeStudents || classStats.totalStudents,
                averageProgress: classStats.averageProgress || 0,
                averageScore: classStats.averageScore || 0
            },
            behaviorAnalysis: {
                averagePauseDuration: classStats.averagePauseDuration,
                hintViewRate: classStats.hintViewRate,
                errorRate: classStats.errorRate
            },
            difficultSteps: classStats.difficultSteps,
            commonErrors: classStats.commonErrors,
            recommendations: this._generateRecommendations(classStats)
        };
    }

    /**
     * 生成教学建议
     * @param {Object} classStats - 班级统计数据
     * @returns {string[]} 教学建议列表
     */
    _generateRecommendations(classStats) {
        const recommendations = [];

        if (classStats.averagePauseDuration > PAUSE_THRESHOLD.DEFAULT * 1000) {
            recommendations.push('学生在某些步骤停顿时间较长，建议增加相关知识点的讲解');
        }

        if (classStats.hintViewRate > 0.5) {
            recommendations.push('提示查看率较高，建议在课前加强相关内容的预习指导');
        }

        if (classStats.errorRate > 0.3) {
            recommendations.push('错误率较高，建议针对常见错误进行专项练习');
        }

        if (classStats.difficultSteps && classStats.difficultSteps.length > 0) {
            const topDifficult = classStats.difficultSteps[0];
            recommendations.push(`步骤"${topDifficult.stepId}"是主要疑难点，建议重点讲解`);
        }

        return recommendations;
    }

    // ================= 内部辅助方法 =================

    /**
     * 同步日志到服务器
     */
    async _syncLogs() {
        if (!this.supabase || this.localLogs.length === 0) return;

        const logsToSync = [...this.localLogs];
        this.localLogs = [];

        // 转换字段名为数据库格式
        const dbLogs = logsToSync.map(log => ({
            id: log.id,
            session_id: log.sessionId,
            user_id: log.userId,
            timestamp: log.timestamp,
            action_type: log.actionType,
            details: log.details
        }));

        const { error } = await this.supabase
            .from('vs_behavior_logs')
            .insert(dbLogs);

        if (error) {
            console.error('同步日志失败:', error);
            // 失败时放回本地队列
            this.localLogs = [...logsToSync, ...this.localLogs];
        }
    }

    /**
     * 获取会话日志
     * @param {string} sessionId - 会话ID
     * @returns {Promise<BehaviorLog[]>} 日志列表
     */
    async _getSessionLogs(sessionId) {
        // 本地日志
        const localLogs = this.localLogs.filter(l => l.sessionId === sessionId);
        
        if (!this.supabase) {
            return localLogs;
        }

        const { data, error } = await this.supabase
            .from('vs_behavior_logs')
            .select('*')
            .eq('session_id', sessionId);

        if (error) return localLogs;
        
        // 合并本地和远程日志
        return [...localLogs, ...(data || [])];
    }

    /**
     * 计算平均停留时长
     * @param {Array} logs - 日志列表
     * @returns {number} 平均停留时长（毫秒）
     */
    _calculateAverageDuration(logs) {
        const pageViews = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.PAGE_VIEW &&
            l.details?.duration
        );
        if (pageViews.length === 0) return 0;
        
        const totalDuration = pageViews.reduce((sum, l) => sum + (l.details?.duration || 0), 0);
        return totalDuration / pageViews.length;
    }

    /**
     * 分析班级数据
     * @param {Array} logs - 日志列表
     * @returns {Object} 班级分析数据
     */
    _analyzeClassData(logs) {
        const students = new Set(logs.map(l => l.user_id || l.userId));
        const pageViews = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.PAGE_VIEW
        );
        const hints = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.HINT_VIEW
        );
        const errors = logs.filter(l => 
            (l.action_type || l.actionType) === ActionType.ERROR_OCCUR
        );

        const totalStudents = students.size;

        return {
            totalStudents: totalStudents,
            averagePauseDuration: this._calculateAverageDuration(pageViews),
            hintViewRate: totalStudents > 0 ? hints.length / totalStudents : 0,
            errorRate: totalStudents > 0 ? errors.length / totalStudents : 0,
            totalPageViews: pageViews.length,
            totalHintViews: hints.length,
            totalErrors: errors.length
        };
    }

    /**
     * 按步骤分组统计
     * @param {Array} logs - 日志列表
     * @returns {Object} 步骤统计
     */
    _groupByStep(logs) {
        const stepStats = {};
        
        for (const log of logs) {
            const stepId = log.details?.stepId;
            if (!stepId) continue;
            
            if (!stepStats[stepId]) {
                stepStats[stepId] = {
                    stepId,
                    totalDuration: 0,
                    visitCount: 0,
                    modificationCount: 0,
                    hintViewCount: 0,
                    errorCount: 0
                };
            }
            
            const actionType = log.action_type || log.actionType;
            
            if (actionType === ActionType.PAGE_VIEW) {
                stepStats[stepId].totalDuration += log.details?.duration || 0;
                stepStats[stepId].visitCount++;
            } else if (actionType === ActionType.FIELD_MODIFY) {
                stepStats[stepId].modificationCount++;
            } else if (actionType === ActionType.HINT_VIEW) {
                stepStats[stepId].hintViewCount++;
            } else if (actionType === ActionType.ERROR_OCCUR) {
                stepStats[stepId].errorCount++;
            }
        }
        
        return stepStats;
    }

    /**
     * 按错误类型分组
     * @param {Array} errorLogs - 错误日志列表
     * @returns {Object} 错误类型统计
     */
    _groupErrorsByType(errorLogs) {
        const errorsByType = {};
        
        for (const log of errorLogs) {
            const errorType = log.details?.errorType || 'unknown';
            if (!errorsByType[errorType]) {
                errorsByType[errorType] = 0;
            }
            errorsByType[errorType]++;
        }
        
        return errorsByType;
    }

    /**
     * 识别共性问题
     * @param {string} classId - 班级ID
     * @returns {Promise<Array>} 共性问题列表
     */
    async _identifyCommonErrors(classId) {
        let logs = [];
        
        if (this.supabase) {
            const { data, error } = await this.supabase
                .from('vs_behavior_logs')
                .select('*')
                .eq('class_id', classId)
                .eq('action_type', ActionType.ERROR_OCCUR);
            
            if (!error && data) {
                logs = data;
            }
        }

        // 统计每种错误的出现次数和影响学生数
        const errorStats = {};
        const students = new Set();
        
        for (const log of logs) {
            const userId = log.user_id || log.userId;
            students.add(userId);
            
            const errorKey = `${log.details?.errorType}_${log.details?.stepId}`;
            if (!errorStats[errorKey]) {
                errorStats[errorKey] = {
                    errorType: log.details?.errorType,
                    stepId: log.details?.stepId,
                    count: 0,
                    affectedStudents: new Set()
                };
            }
            errorStats[errorKey].count++;
            errorStats[errorKey].affectedStudents.add(userId);
        }

        const totalStudents = students.size;
        const commonErrors = [];

        for (const key of Object.keys(errorStats)) {
            const stats = errorStats[key];
            const affectedPercentage = totalStudents > 0 
                ? stats.affectedStudents.size / totalStudents 
                : 0;
            
            // 超过阈值则标记为共性问题
            if (affectedPercentage >= COMMON_ERROR_THRESHOLD) {
                commonErrors.push({
                    errorType: stats.errorType,
                    stepId: stats.stepId,
                    occurrenceCount: stats.count,
                    affectedStudents: stats.affectedStudents.size,
                    affectedPercentage: affectedPercentage,
                    isCommonError: true
                });
            }
        }

        return commonErrors.sort((a, b) => b.affectedPercentage - a.affectedPercentage);
    }

    /**
     * 清除当前会话的追踪数据
     */
    clearSessionData() {
        this.pageEnterTime = {};
        this.fieldModifications.clear();
        this.hintViews.clear();
        this.difficultPoints.clear();
        this.currentSessionId = null;
        this.currentStepId = null;
        this.currentStageId = null;
    }

    /**
     * 强制同步所有本地日志
     */
    async flushLogs() {
        await this._syncLogs();
    }

    /**
     * 获取本地日志数量
     * @returns {number} 本地日志数量
     */
    getLocalLogCount() {
        return this.localLogs.length;
    }

    /**
     * 导出会话日志
     * @param {string} sessionId - 会话ID
     * @returns {Promise<BehaviorLog[]>} 日志列表
     */
    async exportSessionLogs(sessionId) {
        return await this._getSessionLogs(sessionId);
    }

    // ================= 错误热力图与资源推荐 =================

    /**
     * 知识点与学习资源映射表
     * 根据错误类型和步骤关联推荐学习资源
     */
    static KnowledgeResourceMapping = {
        // 概念错误相关资源
        [ProcessTrackerService.ErrorTypes.CONCEPT]: {
            default: [
                { id: 'res-concept-1', name: '环境监测基础概念', type: 'document', url: '#/knowledge/concept-basics' },
                { id: 'res-concept-2', name: '国家标准术语解读', type: 'video', url: '#/knowledge/standard-terms' }
            ],
            'env-monitoring': [
                { id: 'res-env-1', name: 'HJ/T 91-2002 地表水监测技术规范', type: 'standard', url: '#/knowledge/hjt-91-2002' },
                { id: 'res-env-2', name: '水质监测基础知识', type: 'course', url: '#/knowledge/water-quality-basics' }
            ],
            'hazwaste': [
                { id: 'res-haz-1', name: 'GB 5085系列危废鉴别标准', type: 'standard', url: '#/knowledge/gb-5085' },
                { id: 'res-haz-2', name: '危险废物鉴别流程', type: 'video', url: '#/knowledge/hazwaste-identification' }
            ],
            'sampling': [
                { id: 'res-samp-1', name: 'HJ 25.1-2019 建设用地土壤调查导则', type: 'standard', url: '#/knowledge/hj-25-1-2019' },
                { id: 'res-samp-2', name: '采样布点方法详解', type: 'course', url: '#/knowledge/sampling-methods' }
            ]
        },
        // 计算错误相关资源
        [ProcessTrackerService.ErrorTypes.CALCULATION]: {
            default: [
                { id: 'res-calc-1', name: '环境监测数据计算方法', type: 'document', url: '#/knowledge/calculation-methods' },
                { id: 'res-calc-2', name: '单位换算与精度控制', type: 'video', url: '#/knowledge/unit-conversion' }
            ],
            'env-monitoring': [
                { id: 'res-env-calc-1', name: '水质指标计算公式', type: 'document', url: '#/knowledge/water-quality-formulas' },
                { id: 'res-env-calc-2', name: '监测数据有效数字处理', type: 'course', url: '#/knowledge/significant-figures' }
            ],
            'data-analysis': [
                { id: 'res-data-1', name: '监测数据统计分析方法', type: 'course', url: '#/knowledge/statistical-analysis' },
                { id: 'res-data-2', name: '质量控制数据处理', type: 'document', url: '#/knowledge/qc-data-processing' }
            ]
        },
        // 流程错误相关资源
        [ProcessTrackerService.ErrorTypes.PROCESS]: {
            default: [
                { id: 'res-proc-1', name: '环境监测标准操作流程', type: 'document', url: '#/knowledge/sop-overview' },
                { id: 'res-proc-2', name: '实验室操作规范', type: 'video', url: '#/knowledge/lab-procedures' }
            ],
            'env-monitoring': [
                { id: 'res-env-proc-1', name: '水质采样操作流程', type: 'video', url: '#/knowledge/water-sampling-sop' },
                { id: 'res-env-proc-2', name: '样品保存与运输规范', type: 'document', url: '#/knowledge/sample-preservation' }
            ],
            'instrument': [
                { id: 'res-inst-1', name: '分析仪器操作规程', type: 'video', url: '#/knowledge/instrument-operation' },
                { id: 'res-inst-2', name: '仪器校准与维护', type: 'course', url: '#/knowledge/instrument-calibration' }
            ]
        },
        // 格式错误相关资源
        [ProcessTrackerService.ErrorTypes.FORMAT]: {
            default: [
                { id: 'res-fmt-1', name: '监测报告格式规范', type: 'document', url: '#/knowledge/report-format' },
                { id: 'res-fmt-2', name: '原始记录填写要求', type: 'video', url: '#/knowledge/record-filling' }
            ],
            'env-monitoring': [
                { id: 'res-env-fmt-1', name: '采样记录表填写示例', type: 'document', url: '#/knowledge/sampling-record-example' },
                { id: 'res-env-fmt-2', name: '监测报告编写指南', type: 'course', url: '#/knowledge/report-writing-guide' }
            ]
        }
    };

    /**
     * 生成错误分布热力图数据
     * 根据工位或班级的错误日志，生成各步骤的错误热力图数据
     * @param {string} workstationId - 工位ID
     * @param {string} [classId] - 班级ID（可选）
     * @returns {Promise<Object>} 热力图数据
     */
    async generateErrorHeatmap(workstationId, classId = null) {
        let logs = [];
        
        // 从数据库获取错误日志
        if (this.supabase) {
            let query = this.supabase
                .from('vs_behavior_logs')
                .select('*')
                .eq('action_type', ActionType.ERROR_OCCUR);
            
            if (workstationId) {
                query = query.eq('details->>workstationId', workstationId);
            }
            if (classId) {
                query = query.eq('class_id', classId);
            }
            
            const { data, error } = await query;
            if (!error && data) {
                logs = data;
            }
        }

        // 如果没有数据库数据，使用本地日志
        if (logs.length === 0) {
            logs = this.localLogs.filter(l => 
                l.actionType === ActionType.ERROR_OCCUR &&
                (!workstationId || l.details?.workstationId === workstationId)
            );
        }

        // 按步骤和错误类型统计
        const stepErrorStats = {};
        const totalStudents = new Set();
        
        for (const log of logs) {
            const stepId = log.details?.stepId || 'unknown';
            const stageId = log.details?.stageId || 'unknown';
            const errorType = log.details?.errorType || 'unknown';
            const userId = log.user_id || log.userId;
            
            totalStudents.add(userId);
            
            const key = `${stageId}_${stepId}`;
            if (!stepErrorStats[key]) {
                stepErrorStats[key] = {
                    stepId,
                    stageId,
                    stepName: log.details?.stepName || stepId,
                    stageName: log.details?.stageName || stageId,
                    totalErrors: 0,
                    errorsByType: {},
                    affectedStudents: new Set(),
                    errors: []
                };
            }
            
            stepErrorStats[key].totalErrors++;
            stepErrorStats[key].affectedStudents.add(userId);
            stepErrorStats[key].errors.push({
                errorType,
                message: log.details?.message,
                field: log.details?.field,
                timestamp: log.timestamp
            });
            
            if (!stepErrorStats[key].errorsByType[errorType]) {
                stepErrorStats[key].errorsByType[errorType] = 0;
            }
            stepErrorStats[key].errorsByType[errorType]++;
        }

        // 计算热力值（0-1范围）
        const maxErrors = Math.max(...Object.values(stepErrorStats).map(s => s.totalErrors), 1);
        const heatmapData = [];
        
        for (const key of Object.keys(stepErrorStats)) {
            const stats = stepErrorStats[key];
            const heatValue = stats.totalErrors / maxErrors;
            const affectedPercentage = totalStudents.size > 0 
                ? stats.affectedStudents.size / totalStudents.size 
                : 0;
            
            // 确定主要错误类型
            let dominantErrorType = 'unknown';
            let maxTypeCount = 0;
            for (const [type, count] of Object.entries(stats.errorsByType)) {
                if (count > maxTypeCount) {
                    maxTypeCount = count;
                    dominantErrorType = type;
                }
            }
            
            heatmapData.push({
                stepId: stats.stepId,
                stageId: stats.stageId,
                stepName: stats.stepName,
                stageName: stats.stageName,
                totalErrors: stats.totalErrors,
                affectedStudents: stats.affectedStudents.size,
                affectedPercentage,
                heatValue,
                heatLevel: this._getHeatLevel(heatValue),
                dominantErrorType,
                dominantErrorTypeName: ProcessTrackerService.ErrorTypeNames[dominantErrorType] || '未知',
                errorsByType: stats.errorsByType,
                isHighFrequency: heatValue >= 0.5 || affectedPercentage >= COMMON_ERROR_THRESHOLD
            });
        }

        // 按热力值降序排序
        heatmapData.sort((a, b) => b.heatValue - a.heatValue);

        return {
            workstationId,
            classId,
            totalStudents: totalStudents.size,
            totalErrors: logs.length,
            maxErrorsPerStep: maxErrors,
            heatmapData,
            highFrequencySteps: heatmapData.filter(d => d.isHighFrequency),
            generatedAt: Date.now()
        };
    }

    /**
     * 获取热力等级
     * @param {number} heatValue - 热力值（0-1）
     * @returns {string} 热力等级
     */
    _getHeatLevel(heatValue) {
        if (heatValue >= 0.8) return 'critical';  // 严重
        if (heatValue >= 0.6) return 'high';      // 高
        if (heatValue >= 0.4) return 'medium';    // 中
        if (heatValue >= 0.2) return 'low';       // 低
        return 'minimal';                          // 极低
    }

    /**
     * 根据错误类型和上下文推荐学习资源
     * @param {string} errorType - 错误类型
     * @param {Object} context - 上下文信息
     * @param {string} [context.workstationId] - 工位ID
     * @param {string} [context.stepId] - 步骤ID
     * @param {string} [context.stageId] - 阶段ID
     * @param {string} [context.field] - 字段名
     * @returns {Array} 推荐的学习资源列表
     */
    recommendLearningResources(errorType, context = {}) {
        const resources = [];
        const mapping = ProcessTrackerService.KnowledgeResourceMapping;
        
        // 获取错误类型对应的资源映射
        const typeMapping = mapping[errorType] || mapping[ProcessTrackerService.ErrorTypes.FORMAT];
        
        // 1. 添加工位特定资源
        if (context.workstationId && typeMapping[context.workstationId]) {
            resources.push(...typeMapping[context.workstationId].map(r => ({
                ...r,
                relevance: 'high',
                reason: `针对${this._getWorkstationName(context.workstationId)}的专项资源`
            })));
        }
        
        // 2. 添加默认资源
        if (typeMapping.default) {
            resources.push(...typeMapping.default.map(r => ({
                ...r,
                relevance: 'medium',
                reason: `${ProcessTrackerService.ErrorTypeNames[errorType] || '错误'}相关基础资源`
            })));
        }
        
        // 3. 根据步骤/阶段添加特定资源
        if (context.stageId) {
            const stageResources = this._getStageSpecificResources(context.stageId, errorType);
            resources.push(...stageResources);
        }
        
        // 去重并限制数量
        const uniqueResources = this._deduplicateResources(resources);
        return uniqueResources.slice(0, 5);
    }

    /**
     * 获取工位名称
     * @param {string} workstationId - 工位ID
     * @returns {string} 工位名称
     */
    _getWorkstationName(workstationId) {
        const workstation = PRESET_WORKSTATIONS.find(w => w.id === workstationId);
        return workstation ? workstation.name : workstationId;
    }

    /**
     * 获取阶段特定资源
     * @param {string} stageId - 阶段ID
     * @param {string} errorType - 错误类型
     * @returns {Array} 资源列表
     */
    _getStageSpecificResources(stageId, errorType) {
        const resources = [];
        
        // 根据阶段类型推荐资源
        if (stageId.includes('plan') || stageId.includes('design')) {
            resources.push({
                id: 'res-stage-plan',
                name: '方案设计要点与常见问题',
                type: 'document',
                url: '#/knowledge/plan-design-tips',
                relevance: 'high',
                reason: '方案设计阶段专项指导'
            });
        }
        
        if (stageId.includes('record') || stageId.includes('filling')) {
            resources.push({
                id: 'res-stage-record',
                name: '原始记录填写规范',
                type: 'video',
                url: '#/knowledge/record-filling-guide',
                relevance: 'high',
                reason: '记录填写阶段专项指导'
            });
        }
        
        if (stageId.includes('report')) {
            resources.push({
                id: 'res-stage-report',
                name: '报告编写模板与示例',
                type: 'document',
                url: '#/knowledge/report-templates',
                relevance: 'high',
                reason: '报告生成阶段专项指导'
            });
        }
        
        if (stageId.includes('operation') || stageId.includes('simulation')) {
            resources.push({
                id: 'res-stage-operation',
                name: '操作流程视频演示',
                type: 'video',
                url: '#/knowledge/operation-demo',
                relevance: 'high',
                reason: '操作执行阶段专项指导'
            });
        }
        
        return resources;
    }

    /**
     * 资源去重
     * @param {Array} resources - 资源列表
     * @returns {Array} 去重后的资源列表
     */
    _deduplicateResources(resources) {
        const seen = new Set();
        return resources.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
        });
    }

    /**
     * 获取带资源推荐的错误分析报告
     * @param {string} workstationId - 工位ID
     * @param {string} [classId] - 班级ID
     * @returns {Promise<Object>} 错误分析报告（含热力图和资源推荐）
     */
    async getErrorAnalysisWithResources(workstationId, classId = null) {
        // 生成热力图数据
        const heatmap = await this.generateErrorHeatmap(workstationId, classId);
        
        // 为高频错误步骤添加资源推荐
        const analysisWithResources = heatmap.heatmapData.map(stepData => {
            const resources = this.recommendLearningResources(stepData.dominantErrorType, {
                workstationId,
                stepId: stepData.stepId,
                stageId: stepData.stageId
            });
            
            return {
                ...stepData,
                recommendedResources: resources,
                teachingSuggestion: this._generateTeachingSuggestion(stepData)
            };
        });

        // 识别共性问题
        const commonErrors = await this._identifyCommonErrors(classId);
        
        // 为共性问题添加资源推荐
        const commonErrorsWithResources = commonErrors.map(error => ({
            ...error,
            recommendedResources: this.recommendLearningResources(error.errorType, {
                workstationId,
                stepId: error.stepId
            })
        }));

        return {
            workstationId,
            classId,
            summary: {
                totalStudents: heatmap.totalStudents,
                totalErrors: heatmap.totalErrors,
                highFrequencyStepCount: heatmap.highFrequencySteps.length,
                commonErrorCount: commonErrors.length
            },
            heatmap: {
                ...heatmap,
                heatmapData: analysisWithResources
            },
            commonErrors: commonErrorsWithResources,
            overallRecommendations: this._generateOverallRecommendations(heatmap, commonErrors),
            generatedAt: Date.now()
        };
    }

    /**
     * 生成步骤教学建议
     * @param {Object} stepData - 步骤数据
     * @returns {string} 教学建议
     */
    _generateTeachingSuggestion(stepData) {
        const suggestions = [];
        
        if (stepData.heatLevel === 'critical') {
            suggestions.push(`步骤"${stepData.stepName}"错误率极高，建议进行专项讲解和练习`);
        } else if (stepData.heatLevel === 'high') {
            suggestions.push(`步骤"${stepData.stepName}"是主要疑难点，建议增加示例演示`);
        }
        
        const errorTypeName = ProcessTrackerService.ErrorTypeNames[stepData.dominantErrorType];
        if (errorTypeName) {
            suggestions.push(`主要错误类型为${errorTypeName}，建议针对性加强相关知识点`);
        }
        
        if (stepData.affectedPercentage >= 0.5) {
            suggestions.push('超过半数学生在此步骤出错，建议课堂重点讲解');
        }
        
        return suggestions.join('；') || '暂无特别建议';
    }

    /**
     * 生成整体教学建议
     * @param {Object} heatmap - 热力图数据
     * @param {Array} commonErrors - 共性问题列表
     * @returns {Array} 整体建议列表
     */
    _generateOverallRecommendations(heatmap, commonErrors) {
        const recommendations = [];
        
        // 基于高频错误步骤的建议
        if (heatmap.highFrequencySteps.length > 0) {
            const topStep = heatmap.highFrequencySteps[0];
            recommendations.push({
                type: 'focus',
                priority: 'high',
                message: `重点关注"${topStep.stepName}"，该步骤错误率最高`,
                relatedSteps: heatmap.highFrequencySteps.map(s => s.stepId)
            });
        }
        
        // 基于共性问题的建议
        if (commonErrors.length > 0) {
            const errorTypes = [...new Set(commonErrors.map(e => e.errorType))];
            const errorTypeNames = errorTypes.map(t => ProcessTrackerService.ErrorTypeNames[t] || t);
            recommendations.push({
                type: 'common_error',
                priority: 'high',
                message: `发现${commonErrors.length}个共性问题，主要类型：${errorTypeNames.join('、')}`,
                relatedErrors: commonErrors.map(e => e.errorType)
            });
        }
        
        // 基于错误类型分布的建议
        const errorTypeDistribution = {};
        for (const step of heatmap.heatmapData) {
            for (const [type, count] of Object.entries(step.errorsByType)) {
                errorTypeDistribution[type] = (errorTypeDistribution[type] || 0) + count;
            }
        }
        
        const dominantType = Object.entries(errorTypeDistribution)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (dominantType) {
            const typeName = ProcessTrackerService.ErrorTypeNames[dominantType[0]] || dominantType[0];
            recommendations.push({
                type: 'error_type',
                priority: 'medium',
                message: `${typeName}是最常见的错误类型，建议加强相关基础知识教学`,
                errorType: dominantType[0],
                count: dominantType[1]
            });
        }
        
        return recommendations;
    }
}


// ================= 职业成长服务 =================

/**
 * 职业档案接口定义
 * @typedef {Object} CareerProfile
 * @property {string} user_id - 用户ID
 * @property {number} level - 当前等级 (1-15)
 * @property {string} levelTitle - 等级标识 (CareerLevel枚举值)
 * @property {string} levelTitleCN - 等级中文名称
 * @property {string} levelIcon - 等级图标
 * @property {number} currentXP - 当前等级内的经验值
 * @property {number} totalXP - 累计总经验值
 * @property {number} xpToNextLevel - 距下一等级所需经验值
 * @property {number} completedWorkstations - 已完成工位数
 * @property {number} completedTasks - 已完成任务数
 * @property {number} totalStudyTime - 总学习时长（分钟）
 * @property {number} achievementCount - 成就数量
 * @property {number} certificateCount - 上岗证数量
 * @property {number} [classRank] - 班级排名
 * @property {number} [globalRank] - 全局排名
 * @property {number} [streakDays] - 连续学习天数
 * @property {string} [lastStudyDate] - 最后学习日期
 */

/**
 * 等级晋升结果接口
 * @typedef {Object} LevelUpResult
 * @property {number} newLevel - 新等级
 * @property {string} newTitle - 新等级标识
 * @property {string} newTitleCN - 新等级中文名称
 * @property {number} remainingXP - 晋升后剩余经验值
 * @property {string[]} unlockedWorkstations - 新解锁的工位ID列表
 * @property {string[]} unlockedTasks - 新解锁的任务ID列表
 */

/**
 * 等级解锁配置
 * 定义各等级解锁的工位和任务
 */
const LEVEL_UNLOCK_CONFIG = {
    1: {
        workstations: ['env-monitoring'],
        tasks: ['task-env-water-sampling'],
        features: ['基础实训功能']
    },
    2: {
        workstations: ['sampling-center'],
        tasks: ['task-sampling-soil'],
        features: ['采样规划沙盒']
    },
    3: {
        workstations: ['hazwaste-lab'],
        tasks: [],
        features: ['危废鉴别剧本杀模式']
    },
    4: {
        workstations: ['data-center'],
        tasks: [],
        features: ['数据分析工具']
    },
    5: {
        workstations: ['instrument-room'],
        tasks: [],
        features: ['虚拟仪器操作']
    },
    6: {
        workstations: [],
        tasks: [],
        features: ['高级报告模板']
    },
    7: {
        workstations: [],
        tasks: [],
        features: ['AI助教高级功能']
    },
    8: {
        workstations: ['emergency-center'],
        tasks: [],
        features: ['应急响应模拟']
    },
    9: {
        workstations: [],
        tasks: [],
        features: ['竞赛模式']
    },
    10: {
        workstations: [],
        tasks: [],
        features: ['自定义工位']
    },
    11: {
        workstations: [],
        tasks: [],
        features: ['团队协作功能']
    },
    12: {
        workstations: [],
        tasks: [],
        features: ['高级数据导出']
    },
    13: {
        workstations: [],
        tasks: [],
        features: ['专家认证']
    },
    14: {
        workstations: [],
        tasks: [],
        features: ['导师功能']
    },
    15: {
        workstations: [],
        tasks: [],
        features: ['项目经理特权', '全部功能解锁']
    }
};

/**
 * 职业成长服务类
 * 管理用户的职业等级、经验值、晋升等功能
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
class CareerService {
    constructor(supabase) {
        this.supabase = supabase;
        this.levelUpCallbacks = [];
    }

    /**
     * 注册等级晋升回调函数
     * @param {Function} callback 回调函数，接收LevelUpResult参数
     */
    onLevelUp(callback) {
        if (typeof callback === 'function') {
            this.levelUpCallbacks.push(callback);
        }
    }

    /**
     * 触发等级晋升事件
     * @param {LevelUpResult} result 晋升结果
     */
    _triggerLevelUp(result) {
        this.levelUpCallbacks.forEach(callback => {
            try {
                callback(result);
            } catch (e) {
                console.error('Level up callback error:', e);
            }
        });
    }

    /**
     * 获取用户职业档案
     * @param {string} userId 用户ID
     * @returns {Promise<CareerProfile>} 职业档案
     */
    async getCareerProfile(userId) {
        // 先尝试从数据库获取
        if (this.supabase) {
            const { data, error } = await this.supabase
                .from('vs_career_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!error && data) {
                return this._enrichProfile(data);
            }
        }

        // 从本地存储获取或创建新档案
        return this._getOrCreateLocalProfile(userId);
    }

    /**
     * 增加经验值
     * Requirements: 7.1 - 根据任务难度和完成质量奖励经验值
     * @param {string} userId 用户ID
     * @param {number} xp 经验值
     * @param {string} source 来源描述
     * @returns {Promise<{profile: CareerProfile, xpGained: number, source: string, levelUp: LevelUpResult|null}>}
     */
    async addExperience(userId, xp, source) {
        const profile = await this.getCareerProfile(userId);
        const oldLevel = profile.level;
        const newTotalXP = profile.totalXP + xp;
        
        const updatedProfile = {
            ...profile,
            totalXP: newTotalXP,
            currentXP: profile.currentXP + xp
        };

        // 检查是否升级（可能连升多级）
        let levelUpResult = null;
        let currentCheckProfile = { ...updatedProfile };
        
        while (true) {
            const singleLevelUp = this.checkLevelUp(currentCheckProfile);
            if (!singleLevelUp) break;
            
            // 更新到新等级
            currentCheckProfile.level = singleLevelUp.newLevel;
            currentCheckProfile.levelTitle = singleLevelUp.newTitle;
            
            // 获取新等级解锁的内容
            const unlockConfig = LEVEL_UNLOCK_CONFIG[singleLevelUp.newLevel] || { workstations: [], tasks: [], features: [] };
            
            // 合并或创建levelUpResult
            if (!levelUpResult) {
                levelUpResult = {
                    ...singleLevelUp,
                    unlockedWorkstations: unlockConfig.workstations,
                    unlockedTasks: unlockConfig.tasks,
                    unlockedFeatures: unlockConfig.features
                };
            } else {
                // 连升多级时合并解锁内容
                levelUpResult.newLevel = singleLevelUp.newLevel;
                levelUpResult.newTitle = singleLevelUp.newTitle;
                levelUpResult.newTitleCN = singleLevelUp.newTitleCN;
                levelUpResult.unlockedWorkstations = [...levelUpResult.unlockedWorkstations, ...unlockConfig.workstations];
                levelUpResult.unlockedTasks = [...levelUpResult.unlockedTasks, ...unlockConfig.tasks];
                levelUpResult.unlockedFeatures = [...levelUpResult.unlockedFeatures, ...unlockConfig.features];
            }
        }

        // 应用最终等级
        if (levelUpResult) {
            updatedProfile.level = levelUpResult.newLevel;
            updatedProfile.levelTitle = levelUpResult.newTitle;
            // 计算当前等级内的XP
            const currentLevelConfig = LEVEL_CONFIG.find(c => c.level === levelUpResult.newLevel);
            updatedProfile.currentXP = newTotalXP - (currentLevelConfig ? currentLevelConfig.xpRequired : 0);
        }

        // 更新XP到下一级所需
        updatedProfile.xpToNextLevel = this._calculateXPToNextLevel(updatedProfile.level, updatedProfile.totalXP);

        // 保存更新
        await this._saveProfile(userId, updatedProfile);

        // 触发等级晋升事件
        if (levelUpResult) {
            this._triggerLevelUp(levelUpResult);
        }

        return {
            profile: this._enrichProfile(updatedProfile),
            xpGained: xp,
            source: source,
            levelUp: levelUpResult
        };
    }

    /**
     * 检查是否升级
     * Requirements: 7.2 - 当经验值达到阈值时自动晋升职业等级
     * @param {Object} profile 职业档案
     * @returns {LevelUpResult|null} 晋升结果，未晋升返回null
     */
    checkLevelUp(profile) {
        const currentLevelConfig = LEVEL_CONFIG.find(c => c.level === profile.level);
        const nextLevelConfig = LEVEL_CONFIG.find(c => c.level === profile.level + 1);

        if (!nextLevelConfig) {
            return null; // 已达最高等级
        }

        if (profile.totalXP >= nextLevelConfig.xpRequired) {
            return {
                newLevel: nextLevelConfig.level,
                newTitle: nextLevelConfig.title,
                newTitleCN: nextLevelConfig.titleCN,
                remainingXP: profile.totalXP - nextLevelConfig.xpRequired,
                levelIcon: nextLevelConfig.icon
            };
        }

        return null;
    }

    /**
     * 获取等级配置
     * @returns {Array} 等级配置列表
     */
    getLevelConfig() {
        return LEVEL_CONFIG;
    }

    /**
     * 获取等级解锁配置
     * @returns {Object} 等级解锁配置
     */
    getLevelUnlockConfig() {
        return LEVEL_UNLOCK_CONFIG;
    }

    /**
     * 获取指定等级解锁的所有功能（累计）
     * Requirements: 7.4 - 职业等级提升解锁新的工位或高级任务
     * @param {number} level 等级
     * @returns {Array<{type: string, id: string, name: string}>} 解锁的功能列表
     */
    getUnlockedFeatures(level) {
        const features = [];
        const workstationNames = {
            'env-monitoring': '环境监测站',
            'sampling-center': '采样规划中心',
            'hazwaste-lab': '危废鉴别实验室',
            'data-center': '数据处理中心',
            'instrument-room': '仪器操作室',
            'emergency-center': '应急响应中心'
        };
        
        // 累计所有已解锁等级的功能
        for (let l = 1; l <= level; l++) {
            const config = LEVEL_UNLOCK_CONFIG[l];
            if (config) {
                // 添加工位
                config.workstations.forEach(wsId => {
                    features.push({ 
                        type: 'workstation', 
                        id: wsId, 
                        name: workstationNames[wsId] || wsId,
                        unlockedAtLevel: l
                    });
                });
                // 添加任务
                config.tasks.forEach(taskId => {
                    features.push({ 
                        type: 'task', 
                        id: taskId, 
                        name: taskId,
                        unlockedAtLevel: l
                    });
                });
                // 添加特性
                config.features.forEach(feature => {
                    features.push({ 
                        type: 'feature', 
                        id: feature, 
                        name: feature,
                        unlockedAtLevel: l
                    });
                });
            }
        }

        return features;
    }

    /**
     * 获取指定等级新解锁的功能（仅该等级）
     * @param {number} level 等级
     * @returns {Object} 该等级解锁的功能
     */
    getNewUnlocksAtLevel(level) {
        return LEVEL_UNLOCK_CONFIG[level] || { workstations: [], tasks: [], features: [] };
    }

    /**
     * 检查用户是否解锁了指定工位
     * @param {number} userLevel 用户等级
     * @param {number} requiredLevel 工位要求等级
     */
    isWorkstationUnlocked(userLevel, requiredLevel) {
        return userLevel >= requiredLevel;
    }

    /**
     * 根据任务难度和得分计算经验值
     * Requirements: 7.1 - 根据任务难度和完成质量奖励经验值
     * @param {string} difficulty 难度 ('beginner'|'intermediate'|'advanced')
     * @param {number} score 得分 (0-100)
     * @param {number} baseXP 基础经验值
     * @returns {number} 计算后的经验值
     */
    calculateXPReward(difficulty, score, baseXP) {
        // 难度系数：入门1.0，进阶1.5，高级2.0
        const difficultyMultiplier = {
            'beginner': 1.0,
            'intermediate': 1.5,
            'advanced': 2.0
        };

        // 得分系数：得分/100
        const scoreMultiplier = Math.max(0, Math.min(100, score)) / 100;
        const multiplier = difficultyMultiplier[difficulty] || 1.0;

        // 额外奖励：满分额外10%，90分以上额外5%
        let bonusMultiplier = 1.0;
        if (score >= 100) {
            bonusMultiplier = 1.1;
        } else if (score >= 90) {
            bonusMultiplier = 1.05;
        }

        return Math.round(baseXP * multiplier * scoreMultiplier * bonusMultiplier);
    }

    /**
     * 更新用户统计数据
     * @param {string} userId 用户ID
     * @param {Object} stats 统计数据更新
     * @param {number} [stats.completedTasks] 增加的完成任务数
     * @param {number} [stats.completedWorkstations] 增加的完成工位数
     * @param {number} [stats.studyTime] 增加的学习时长（分钟）
     * @param {number} [stats.achievementCount] 增加的成就数
     * @param {number} [stats.certificateCount] 增加的证书数
     */
    async updateStats(userId, stats) {
        const profile = await this.getCareerProfile(userId);
        
        const updatedProfile = {
            ...profile,
            completedTasks: profile.completedTasks + (stats.completedTasks || 0),
            completedWorkstations: profile.completedWorkstations + (stats.completedWorkstations || 0),
            totalStudyTime: profile.totalStudyTime + (stats.studyTime || 0),
            achievementCount: profile.achievementCount + (stats.achievementCount || 0),
            certificateCount: profile.certificateCount + (stats.certificateCount || 0)
        };

        await this._saveProfile(userId, updatedProfile);
        return this._enrichProfile(updatedProfile);
    }

    /**
     * 获取等级进度信息
     * Requirements: 7.3 - 显示当前等级、经验值进度、距下一等级所需经验
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 等级进度信息
     */
    async getLevelProgress(userId) {
        const profile = await this.getCareerProfile(userId);
        const currentLevelConfig = LEVEL_CONFIG.find(c => c.level === profile.level);
        const nextLevelConfig = LEVEL_CONFIG.find(c => c.level === profile.level + 1);
        
        const currentLevelXP = currentLevelConfig ? currentLevelConfig.xpRequired : 0;
        const nextLevelXP = nextLevelConfig ? nextLevelConfig.xpRequired : currentLevelXP;
        const xpInCurrentLevel = profile.totalXP - currentLevelXP;
        const xpNeededForLevel = nextLevelXP - currentLevelXP;
        const progressPercent = xpNeededForLevel > 0 
            ? Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100))
            : 100;

        return {
            level: profile.level,
            levelTitle: profile.levelTitle,
            levelTitleCN: profile.levelTitleCN,
            levelIcon: profile.levelIcon,
            currentXP: xpInCurrentLevel,
            totalXP: profile.totalXP,
            xpToNextLevel: nextLevelConfig ? nextLevelXP - profile.totalXP : 0,
            xpNeededForLevel: xpNeededForLevel,
            progressPercent: progressPercent,
            isMaxLevel: !nextLevelConfig
        };
    }

    /**
     * 检查是否达到最高等级
     * Requirements: 7.5 - 达到最高等级显示"项目经理"称号
     * @param {number} level 等级
     * @returns {boolean} 是否为最高等级
     */
    isMaxLevel(level) {
        const maxLevel = Math.max(...LEVEL_CONFIG.map(c => c.level));
        return level >= maxLevel;
    }

    /**
     * 获取最高等级配置
     * @returns {Object} 最高等级配置
     */
    getMaxLevelConfig() {
        return LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
    }

    /**
     * 丰富档案数据，添加计算字段
     * @param {Object} profile 原始档案数据
     * @returns {CareerProfile} 丰富后的档案数据
     */
    _enrichProfile(profile) {
        const levelConfig = LEVEL_CONFIG.find(c => c.level === profile.level) || LEVEL_CONFIG[0];
        const nextLevelConfig = LEVEL_CONFIG.find(c => c.level === profile.level + 1);
        const currentLevelXP = levelConfig ? levelConfig.xpRequired : 0;
        const nextLevelXP = nextLevelConfig ? nextLevelConfig.xpRequired : currentLevelXP;
        
        // 计算当前等级内的经验值
        const xpInCurrentLevel = profile.totalXP - currentLevelXP;
        const xpNeededForLevel = nextLevelXP - currentLevelXP;
        const progressPercent = xpNeededForLevel > 0 
            ? Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100))
            : 100;

        return {
            ...profile,
            levelTitle: levelConfig.title,
            levelTitleCN: levelConfig.titleCN,
            levelIcon: levelConfig.icon,
            xpToNextLevel: nextLevelConfig 
                ? nextLevelXP - profile.totalXP 
                : 0,
            xpInCurrentLevel: xpInCurrentLevel,
            xpNeededForLevel: xpNeededForLevel,
            progressPercent: progressPercent,
            isMaxLevel: !nextLevelConfig
        };
    }

    /**
     * 获取或创建本地档案
     */
    _getOrCreateLocalProfile(userId) {
        const key = `vs_career_${userId}`;
        const saved = localStorage.getItem(key);
        
        if (saved) {
            try {
                return this._enrichProfile(JSON.parse(saved));
            } catch (e) {
                // 继续创建新档案
            }
        }

        const newProfile = {
            user_id: userId,
            level: 1,
            currentXP: 0,
            totalXP: 0,
            completedWorkstations: 0,
            completedTasks: 0,
            totalStudyTime: 0,
            achievementCount: 0,
            certificateCount: 0
        };

        localStorage.setItem(key, JSON.stringify(newProfile));
        return this._enrichProfile(newProfile);
    }

    /**
     * 保存档案
     */
    async _saveProfile(userId, profile) {
        const key = `vs_career_${userId}`;
        localStorage.setItem(key, JSON.stringify(profile));

        if (this.supabase) {
            await this.supabase
                .from('vs_career_profiles')
                .upsert(profile, { onConflict: 'user_id' });
        }
    }

    /**
     * 计算到下一级所需XP
     * @param {number} currentLevel 当前等级
     * @param {number} totalXP 总经验值
     * @returns {number} 距下一级所需经验值
     */
    _calculateXPToNextLevel(currentLevel, totalXP) {
        const nextLevelConfig = LEVEL_CONFIG.find(c => c.level === currentLevel + 1);
        if (!nextLevelConfig) return 0;
        
        return Math.max(0, nextLevelConfig.xpRequired - totalXP);
    }

    /**
     * 获取职业档案展示数据
     * Requirements: 7.3 - 显示当前等级、XP进度、距下一等级所需XP、统计数据
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 展示数据
     */
    async getProfileDisplayData(userId) {
        const profile = await this.getCareerProfile(userId);
        const levelProgress = await this.getLevelProgress(userId);
        const unlockedFeatures = this.getUnlockedFeatures(profile.level);
        
        // 获取下一等级解锁内容预览
        const nextLevelUnlocks = this.getNewUnlocksAtLevel(profile.level + 1);
        
        return {
            // 基本信息
            userId: profile.user_id,
            level: profile.level,
            levelTitle: profile.levelTitle,
            levelTitleCN: profile.levelTitleCN,
            levelIcon: profile.levelIcon,
            
            // 经验值信息
            totalXP: profile.totalXP,
            currentLevelXP: levelProgress.currentXP,
            xpToNextLevel: levelProgress.xpToNextLevel,
            xpNeededForLevel: levelProgress.xpNeededForLevel,
            progressPercent: levelProgress.progressPercent,
            isMaxLevel: levelProgress.isMaxLevel,
            
            // 统计数据
            stats: {
                completedWorkstations: profile.completedWorkstations,
                completedTasks: profile.completedTasks,
                totalStudyTime: profile.totalStudyTime,
                achievementCount: profile.achievementCount,
                certificateCount: profile.certificateCount,
                streakDays: profile.streakDays || 0
            },
            
            // 排名信息
            ranking: {
                classRank: profile.classRank,
                globalRank: profile.globalRank
            },
            
            // 解锁内容
            unlockedFeatures: unlockedFeatures,
            nextLevelUnlocks: nextLevelUnlocks
        };
    }
}


// ================= 等级晋升UI辅助函数 =================

/**
 * 显示等级晋升通知和动画
 * Requirements: 7.2 - 触发晋升动画和通知
 * @param {LevelUpResult} levelUpResult 晋升结果
 */
function showLevelUpNotification(levelUpResult) {
    if (!levelUpResult) return;

    // 创建晋升通知模态框
    const modal = document.createElement('div');
    modal.id = 'level-up-modal';
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center';
    modal.innerHTML = `
        <div class="level-up-content text-center animate-bounce-in">
            <div class="relative">
                <!-- 光环效果 -->
                <div class="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-full blur-3xl animate-pulse"></div>
                
                <!-- 等级图标 -->
                <div class="relative w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/50 animate-level-up">
                    <i class="${levelUpResult.levelIcon || 'ri-medal-line'} text-5xl text-white"></i>
                </div>
            </div>
            
            <!-- 晋升文字 -->
            <div class="mb-4">
                <p class="text-amber-400 text-lg mb-2">🎉 恭喜晋升！</p>
                <h2 class="text-3xl font-bold text-white mb-2">${levelUpResult.newTitleCN}</h2>
                <p class="text-gray-400">Lv.${levelUpResult.newLevel}</p>
            </div>
            
            <!-- 解锁内容 -->
            ${levelUpResult.unlockedWorkstations && levelUpResult.unlockedWorkstations.length > 0 ? `
            <div class="bg-white/10 rounded-xl p-4 mb-4 max-w-sm mx-auto">
                <p class="text-sm text-gray-400 mb-2">🔓 新解锁工位</p>
                <div class="flex flex-wrap gap-2 justify-center">
                    ${levelUpResult.unlockedWorkstations.map(ws => `
                        <span class="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full text-sm">${ws}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${levelUpResult.unlockedFeatures && levelUpResult.unlockedFeatures.length > 0 ? `
            <div class="bg-white/10 rounded-xl p-4 mb-4 max-w-sm mx-auto">
                <p class="text-sm text-gray-400 mb-2">✨ 新解锁功能</p>
                <div class="flex flex-wrap gap-2 justify-center">
                    ${levelUpResult.unlockedFeatures.map(f => `
                        <span class="px-3 py-1 bg-emerald-500/30 text-emerald-300 rounded-full text-sm">${f}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- 关闭按钮 -->
            <button onclick="closeLevelUpModal()" class="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition text-white">
                太棒了！
            </button>
        </div>
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounce-in {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes level-up {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.1) rotate(-5deg); }
            75% { transform: scale(1.1) rotate(5deg); }
        }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out; }
        .animate-level-up { animation: level-up 1s ease-in-out infinite; }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);

    // 播放音效（如果有）
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAA');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) {}
}

/**
 * 关闭等级晋升模态框
 */
function closeLevelUpModal() {
    const modal = document.getElementById('level-up-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * 更新页面上的职业等级显示
 * Requirements: 7.3 - 显示当前等级、XP进度、距下一等级所需XP
 * @param {CareerProfile} profile 职业档案
 */
function updateCareerDisplay(profile) {
    if (!profile) return;

    // 更新导航栏等级显示
    const levelBadge = document.querySelector('.flex.items-center.gap-2.bg-gradient-to-r.from-amber-500\\/20');
    if (levelBadge) {
        const titleSpan = levelBadge.querySelector('.text-amber-300');
        const levelSpan = levelBadge.querySelector('.text-xs.text-gray-400');
        if (titleSpan) titleSpan.textContent = profile.levelTitleCN;
        if (levelSpan) levelSpan.textContent = `Lv.${profile.level}`;
    }

    // 更新经验值进度条
    const xpBar = document.querySelector('.w-32.h-2.bg-gray-700');
    if (xpBar) {
        const progressBar = xpBar.querySelector('div');
        if (progressBar) {
            progressBar.style.width = `${profile.progressPercent}%`;
        }
    }

    // 更新经验值文字
    const xpText = document.querySelector('.text-xs.text-gray-400');
    if (xpText && xpText.textContent.includes('XP')) {
        const currentLevelXP = profile.xpInCurrentLevel || 0;
        const neededXP = profile.xpNeededForLevel || 1000;
        xpText.textContent = `${currentLevelXP}/${neededXP} XP`;
    }

    // 更新欢迎区域的称号
    const welcomeTitle = document.querySelector('.text-purple-400');
    if (welcomeTitle && welcomeTitle.closest('h2')) {
        welcomeTitle.textContent = profile.levelTitleCN;
    }

    // 更新统计数据
    const statWorkstations = document.getElementById('stat-workstations');
    const statTasks = document.getElementById('stat-tasks');
    const statTime = document.getElementById('stat-time');

    if (statWorkstations) {
        statWorkstations.textContent = `${profile.completedWorkstations || 0}/6`;
    }
    if (statTasks) {
        statTasks.textContent = `${profile.completedTasks || 0}`;
    }
    if (statTime) {
        const hours = Math.floor((profile.totalStudyTime || 0) / 60);
        statTime.textContent = `${hours}h`;
    }
}

/**
 * 初始化职业等级系统UI
 * 注册等级晋升回调
 */
function initCareerSystemUI() {
    if (window.VirtualStation && window.VirtualStation.careerService) {
        window.VirtualStation.careerService.onLevelUp((result) => {
            showLevelUpNotification(result);
        });
    }
}

// 页面加载完成后初始化
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCareerSystemUI);
    } else {
        initCareerSystemUI();
    }
}

// ================= 成就服务 =================

/**
 * 成就服务类
 */
class AchievementService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * 获取用户所有成就
     * @param {string} userId 用户ID
     */
    async getAchievements(userId) {
        const allAchievements = this._getPresetAchievements();
        const unlockedIds = await this._getUnlockedAchievementIds(userId);

        return allAchievements.map(a => ({
            ...a,
            isUnlocked: unlockedIds.includes(a.id),
            unlockedAt: unlockedIds.includes(a.id) ? this._getUnlockTime(userId, a.id) : null
        }));
    }

    /**
     * 获取已解锁成就
     * @param {string} userId 用户ID
     */
    async getUnlockedAchievements(userId) {
        const achievements = await this.getAchievements(userId);
        return achievements.filter(a => a.isUnlocked);
    }

    /**
     * 获取未解锁成就
     * @param {string} userId 用户ID
     */
    async getLockedAchievements(userId) {
        const achievements = await this.getAchievements(userId);
        return achievements.filter(a => !a.isUnlocked);
    }

    /**
     * 检查并颁发成就
     * @param {string} userId 用户ID
     * @param {Object} event 触发事件
     */
    async checkAchievements(userId, event) {
        const allAchievements = this._getPresetAchievements();
        const unlockedIds = await this._getUnlockedAchievementIds(userId);
        const newlyUnlocked = [];

        for (const achievement of allAchievements) {
            if (unlockedIds.includes(achievement.id)) continue;

            if (this._checkCondition(achievement.condition, event)) {
                await this.grantAchievement(userId, achievement.id);
                newlyUnlocked.push(achievement);
            }
        }

        return newlyUnlocked;
    }

    /**
     * 颁发成就
     * @param {string} userId 用户ID
     * @param {string} achievementId 成就ID
     * @param {boolean} showAnimation 是否显示动画（默认true）
     */
    async grantAchievement(userId, achievementId, showAnimation = true) {
        const achievement = this._getPresetAchievements().find(a => a.id === achievementId);
        if (!achievement) return null;

        const record = {
            user_id: userId,
            achievement_id: achievementId,
            unlocked_at: Date.now()
        };

        // 保存到本地
        const key = `vs_achievements_${userId}`;
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        if (!saved.find(r => r.achievement_id === achievementId)) {
            saved.push(record);
            localStorage.setItem(key, JSON.stringify(saved));
        }

        // 保存到数据库
        if (this.supabase) {
            await this.supabase.from('vs_user_achievements').upsert(record, {
                onConflict: 'user_id,achievement_id'
            });
        }

        const grantedAchievement = { ...achievement, isUnlocked: true, unlockedAt: record.unlocked_at };

        // 显示成就获得动画
        if (showAnimation) {
            this.showAchievementAnimation(grantedAchievement);
        }

        return grantedAchievement;
    }

    /**
     * 获取用户证书
     * @param {string} userId 用户ID
     */
    async getCertificates(userId) {
        const key = `vs_certificates_${userId}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * 颁发上岗证
     * @param {string} userId 用户ID
     * @param {string} workstationId 工位ID
     * @param {boolean} showAnimation 是否显示动画（默认true）
     * @returns {Certificate} 颁发的证书
     */
    async grantCertificate(userId, workstationId, showAnimation = true) {
        // 获取工位信息
        const workstation = PRESET_WORKSTATIONS.find(w => w.id === workstationId);
        const workstationName = workstation ? workstation.name : workstationId;
        
        // 生成证书编号: VS-工位缩写-年月日-序号
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const certNumber = `VS-${workstationId.toUpperCase().slice(0, 3)}-${dateStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        
        const certificate = {
            id: `cert_${workstationId}_${Date.now()}`,
            user_id: userId,
            workstation_id: workstationId,
            workstation_name: workstationName,
            certificate_number: certNumber,
            granted_at: Date.now()
        };

        // 保存到本地
        const key = `vs_certificates_${userId}`;
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        if (!saved.find(c => c.workstation_id === workstationId)) {
            saved.push(certificate);
            localStorage.setItem(key, JSON.stringify(saved));
        }

        // 保存到数据库
        if (this.supabase) {
            await this.supabase.from('vs_certificates').upsert(certificate, {
                onConflict: 'user_id,workstation_id'
            });
        }

        // 显示上岗证颁发动画
        if (showAnimation) {
            this.showCertificateAnimation(certificate);
        }

        return certificate;
    }

    /**
     * 检查是否应颁发上岗证（工位全部任务完成时颁发）
     * @param {string} userId 用户ID
     * @param {string} workstationId 工位ID
     * @param {number} completedTasks 已完成任务数
     * @param {number} totalTasks 总任务数
     * @returns {Certificate|null} 如果颁发了证书则返回证书，否则返回null
     */
    async checkCertificateEligibility(userId, workstationId, completedTasks, totalTasks) {
        // 只有当完成所有任务且任务数大于0时才颁发上岗证
        if (completedTasks >= totalTasks && totalTasks > 0) {
            const certificates = await this.getCertificates(userId);
            // 检查是否已经颁发过该工位的上岗证
            if (!certificates.find(c => c.workstation_id === workstationId)) {
                const certificate = await this.grantCertificate(userId, workstationId);
                // 同时检查是否触发工位完成相关的成就
                await this.checkAchievements(userId, {
                    type: 'workstation_complete',
                    workstationId: workstationId
                });
                return certificate;
            }
        }
        return null;
    }

    /**
     * 检查用户是否拥有某工位的上岗证
     * @param {string} userId 用户ID
     * @param {string} workstationId 工位ID
     * @returns {boolean}
     */
    async hasCertificate(userId, workstationId) {
        const certificates = await this.getCertificates(userId);
        return certificates.some(c => c.workstation_id === workstationId);
    }

    /**
     * 获取证书详情
     * @param {string} userId 用户ID
     * @param {string} workstationId 工位ID
     * @returns {Certificate|null}
     */
    async getCertificateByWorkstation(userId, workstationId) {
        const certificates = await this.getCertificates(userId);
        return certificates.find(c => c.workstation_id === workstationId) || null;
    }

    /**
     * 显示成就获得动画
     * @param {Achievement} achievement 成就对象
     */
    showAchievementAnimation(achievement) {
        const colors = AchievementRarityColors[achievement.rarity] || AchievementRarityColors[AchievementRarity.COMMON];
        const rarityName = AchievementRarityNames[achievement.rarity] || '普通';
        
        // 创建动画容器
        const container = document.createElement('div');
        container.className = 'fixed inset-0 z-[100] flex items-center justify-center pointer-events-none';
        container.innerHTML = `
            <div class="achievement-popup glass-card rounded-2xl p-6 transform scale-0 opacity-0 transition-all duration-500 pointer-events-auto" style="background: rgba(0,0,0,0.9); border: 2px solid rgba(139, 92, 246, 0.5);">
                <div class="text-center">
                    <div class="text-amber-400 text-sm mb-2">🎉 成就解锁</div>
                    <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                        <i class="${achievement.icon} text-4xl text-white"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-1">${achievement.name}</h3>
                    <p class="text-gray-400 text-sm mb-2">${achievement.description}</p>
                    <div class="flex items-center justify-center gap-2">
                        <span class="${colors.text} text-xs px-2 py-1 rounded-full ${colors.border} border">${rarityName}</span>
                        <span class="text-amber-400 text-xs">+${achievement.xpReward} XP</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 触发动画
        requestAnimationFrame(() => {
            const popup = container.querySelector('.achievement-popup');
            popup.classList.remove('scale-0', 'opacity-0');
            popup.classList.add('scale-100', 'opacity-100');
        });
        
        // 3秒后移除
        setTimeout(() => {
            const popup = container.querySelector('.achievement-popup');
            popup.classList.add('scale-0', 'opacity-0');
            setTimeout(() => container.remove(), 500);
        }, 3000);
    }

    /**
     * 显示上岗证颁发动画
     * @param {Certificate} certificate 证书对象
     */
    showCertificateAnimation(certificate) {
        const container = document.createElement('div');
        container.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm';
        container.innerHTML = `
            <div class="certificate-popup glass-card rounded-2xl p-8 transform scale-0 opacity-0 transition-all duration-500 max-w-md" style="background: linear-gradient(145deg, rgba(30,30,60,0.95), rgba(20,20,40,0.95)); border: 2px solid rgba(234, 179, 8, 0.5);">
                <div class="text-center">
                    <div class="text-amber-400 text-lg mb-4">🏆 恭喜获得上岗证！</div>
                    <div class="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="ri-file-shield-2-line text-5xl text-white"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white mb-2">${certificate.workstation_name}</h3>
                    <p class="text-gray-400 text-sm mb-4">虚拟上岗证</p>
                    <div class="bg-white/5 rounded-xl p-4 mb-4">
                        <div class="text-xs text-gray-500 mb-1">证书编号</div>
                        <div class="text-amber-400 font-mono">${certificate.certificate_number}</div>
                    </div>
                    <div class="text-xs text-gray-500">
                        颁发时间：${new Date(certificate.granted_at).toLocaleDateString('zh-CN')}
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="mt-6 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition">
                        太棒了！
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 触发动画
        requestAnimationFrame(() => {
            const popup = container.querySelector('.certificate-popup');
            popup.classList.remove('scale-0', 'opacity-0');
            popup.classList.add('scale-100', 'opacity-100');
        });
    }

    /**
     * 生成分享卡片
     * @param {string} achievementId 成就ID
     * @returns {Object} 分享数据，包含标题、描述、图标、稀有度、分享链接和图片数据URL
     */
    async generateShareCard(achievementId) {
        const achievement = this._getPresetAchievements().find(a => a.id === achievementId);
        if (!achievement) return null;

        const colors = AchievementRarityColors[achievement.rarity] || AchievementRarityColors[AchievementRarity.COMMON];
        const rarityName = AchievementRarityNames[achievement.rarity] || '普通';

        // 生成分享卡片图片（使用Canvas）
        let imageDataUrl = null;
        try {
            imageDataUrl = await this._generateShareCardImage(achievement, colors, rarityName);
        } catch (e) {
            console.warn('生成分享卡片图片失败:', e);
        }

        return {
            title: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            rarity: achievement.rarity,
            rarityName: rarityName,
            xpReward: achievement.xpReward,
            shareUrl: `${window.location.origin}/classroom/virtual-station.html?share=${achievementId}`,
            imageDataUrl: imageDataUrl
        };
    }

    /**
     * 使用Canvas生成分享卡片图片
     * @param {Achievement} achievement 成就对象
     * @param {Object} colors 颜色配置
     * @param {string} rarityName 稀有度名称
     * @returns {string} 图片的Data URL
     */
    async _generateShareCardImage(achievement, colors, rarityName) {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');

        // 背景渐变
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(1, '#0d0d1f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);

        // 边框
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 380, 280);

        // 标题 "成就解锁"
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 成就解锁', 200, 50);

        // 成就图标背景圆
        ctx.beginPath();
        ctx.arc(200, 120, 40, 0, Math.PI * 2);
        const iconGradient = ctx.createRadialGradient(200, 120, 0, 200, 120, 40);
        iconGradient.addColorStop(0, '#8b5cf6');
        iconGradient.addColorStop(1, '#6366f1');
        ctx.fillStyle = iconGradient;
        ctx.fill();

        // 成就名称
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText(achievement.name, 200, 190);

        // 成就描述
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(achievement.description, 200, 220);

        // 稀有度和XP
        ctx.fillStyle = '#fbbf24';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`${rarityName} · +${achievement.xpReward} XP`, 200, 250);

        // 平台名称
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('虚拟工位平台 - 专业实训系统', 200, 280);

        return canvas.toDataURL('image/png');
    }

    /**
     * 生成上岗证分享卡片
     * @param {Certificate} certificate 证书对象
     * @returns {Object} 分享数据
     */
    async generateCertificateShareCard(certificate) {
        return {
            title: `${certificate.workstation_name} 虚拟上岗证`,
            description: `证书编号: ${certificate.certificate_number}`,
            certificateNumber: certificate.certificate_number,
            workstationName: certificate.workstation_name,
            grantedAt: new Date(certificate.granted_at).toLocaleDateString('zh-CN'),
            shareUrl: `${window.location.origin}/classroom/virtual-station.html?cert=${certificate.workstation_id}`
        };
    }

    /**
     * 检查成就条件是否满足
     * @param {AchievementCondition} condition 成就条件
     * @param {Object} event 触发事件
     * @returns {boolean} 是否满足条件
     */
    _checkCondition(condition, event) {
        switch (condition.type) {
            case 'task_complete':
                // 完成特定任务或完成任务数量达标
                if (typeof condition.target === 'number') {
                    return event.type === 'task_complete' && event.tasksCount >= condition.target;
                }
                return event.type === 'task_complete' && event.taskId === condition.target;
            
            case 'tasks_count':
                // 累计完成任务数量
                return event.type === 'task_complete' && event.tasksCount >= condition.target;
            
            case 'workstation_complete':
                // 完成特定工位的全部任务
                return event.type === 'workstation_complete' && event.workstationId === condition.target;
            
            case 'streak':
                // 连续学习天数
                return event.type === 'streak' && event.days >= condition.target;
            
            case 'score':
                // 达到特定分数
                return event.type === 'score' && event.score >= condition.target;
            
            case 'time':
                // 累计学习时长（分钟）
                return event.type === 'study_time' && event.minutes >= condition.target;
            
            case 'level':
                // 达到特定等级
                return event.type === 'level_up' && event.level >= condition.target;
            
            case 'first_try_pass':
                // 首次尝试通过的连续任务数
                return event.type === 'first_try_pass' && event.count >= condition.target;
            
            case 'special':
                // 特殊条件，需要单独处理
                return this._checkSpecialCondition(condition.target, event);
            
            default:
                return false;
        }
    }

    /**
     * 检查特殊成就条件
     * @param {string} target 特殊条件目标
     * @param {Object} event 触发事件
     * @returns {boolean}
     */
    _checkSpecialCondition(target, event) {
        switch (target) {
            case 'first_login':
                return event.type === 'first_login';
            
            case 'all_workstations':
                // 检查是否完成所有工位
                if (event.type !== 'workstation_complete') return false;
                const activeWorkstations = PRESET_WORKSTATIONS.filter(w => w.isActive);
                return event.completedWorkstations >= activeWorkstations.length;
            
            case 'all_perfect':
                // 检查是否所有任务都是满分
                return event.type === 'all_perfect' && event.allPerfect === true;
            
            case 'all_certificates':
                // 检查是否获得所有上岗证
                if (event.type !== 'certificate_granted') return false;
                const workstationsWithCerts = PRESET_WORKSTATIONS.filter(w => w.certificateId);
                return event.certificatesCount >= workstationsWithCerts.length;
            
            default:
                return false;
        }
    }

    /**
     * 获取已解锁成就ID列表
     */
    async _getUnlockedAchievementIds(userId) {
        const key = `vs_achievements_${userId}`;
        const saved = localStorage.getItem(key);
        const local = saved ? JSON.parse(saved).map(r => r.achievement_id) : [];

        if (this.supabase) {
            const { data } = await this.supabase
                .from('vs_user_achievements')
                .select('achievement_id')
                .eq('user_id', userId);
            
            const remote = data ? data.map(r => r.achievement_id) : [];
            return [...new Set([...local, ...remote])];
        }

        return local;
    }

    /**
     * 获取解锁时间
     */
    _getUnlockTime(userId, achievementId) {
        const key = `vs_achievements_${userId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            const record = JSON.parse(saved).find(r => r.achievement_id === achievementId);
            return record?.unlocked_at || null;
        }
        return null;
    }

    /**
     * 预设成就列表（含稀有度分级）
     * 稀有度: COMMON(普通) < RARE(稀有) < EPIC(史诗) < LEGENDARY(传说)
     */
    _getPresetAchievements() {
        return [
            // ========== 普通成就 (COMMON) ==========
            {
                id: 'first-task',
                name: '初出茅庐',
                description: '完成第一个实训任务',
                icon: 'ri-flag-line',
                rarity: AchievementRarity.COMMON,
                condition: { type: 'task_complete', target: 1 },
                xpReward: 50
            },
            {
                id: 'eco-newbie',
                name: '环保新人',
                description: '累计学习时长达到60分钟',
                icon: 'ri-leaf-line',
                rarity: AchievementRarity.COMMON,
                condition: { type: 'time', target: 60 },
                xpReward: 100
            },
            {
                id: 'first-login',
                name: '初次登录',
                description: '首次进入虚拟工位平台',
                icon: 'ri-door-open-line',
                rarity: AchievementRarity.COMMON,
                condition: { type: 'special', target: 'first_login' },
                xpReward: 20
            },
            {
                id: 'task-5',
                name: '勤学苦练',
                description: '累计完成5个实训任务',
                icon: 'ri-book-mark-line',
                rarity: AchievementRarity.COMMON,
                condition: { type: 'tasks_count', target: 5 },
                xpReward: 100
            },
            {
                id: 'study-time-120',
                name: '学习达人',
                description: '累计学习时长达到2小时',
                icon: 'ri-time-line',
                rarity: AchievementRarity.COMMON,
                condition: { type: 'time', target: 120 },
                xpReward: 150
            },
            
            // ========== 稀有成就 (RARE) ==========
            {
                id: 'water-sampler',
                name: '水质采样员',
                description: '完成水质监测工位的全部任务',
                icon: 'ri-drop-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'workstation_complete', target: 'env-monitoring' },
                xpReward: 200
            },
            {
                id: 'streak-7',
                name: '连续学习7天',
                description: '连续7天登录学习',
                icon: 'ri-fire-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'streak', target: 7 },
                xpReward: 300
            },
            {
                id: 'sampling-master',
                name: '采样规划大师',
                description: '完成采样规划中心的全部任务',
                icon: 'ri-map-pin-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'workstation_complete', target: 'sampling-center' },
                xpReward: 250
            },
            {
                id: 'task-10',
                name: '实训能手',
                description: '累计完成10个实训任务',
                icon: 'ri-medal-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'tasks_count', target: 10 },
                xpReward: 200
            },
            {
                id: 'level-5',
                name: '见习工程师',
                description: '职业等级达到Lv.5',
                icon: 'ri-user-star-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'level', target: 5 },
                xpReward: 200
            },
            {
                id: 'data-analyst',
                name: '数据分析师',
                description: '完成数据处理中心的全部任务',
                icon: 'ri-database-2-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'workstation_complete', target: 'data-center' },
                xpReward: 250
            },
            {
                id: 'study-time-300',
                name: '学习狂人',
                description: '累计学习时长达到5小时',
                icon: 'ri-timer-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'time', target: 300 },
                xpReward: 250
            },
            
            // ========== 史诗成就 (EPIC) ==========
            {
                id: 'perfect-score',
                name: '满分达人',
                description: '在任意任务中获得满分',
                icon: 'ri-star-line',
                rarity: AchievementRarity.EPIC,
                condition: { type: 'score', target: 100 },
                xpReward: 250
            },
            {
                id: 'hazwaste-expert',
                name: '危废鉴别专家',
                description: '完成危废鉴别实验室的全部案件',
                icon: 'ri-skull-line',
                rarity: AchievementRarity.EPIC,
                condition: { type: 'workstation_complete', target: 'hazwaste-lab' },
                xpReward: 400
            },
            {
                id: 'streak-30',
                name: '坚持不懈',
                description: '连续30天登录学习',
                icon: 'ri-fire-fill',
                rarity: AchievementRarity.EPIC,
                condition: { type: 'streak', target: 30 },
                xpReward: 500
            },
            {
                id: 'instrument-master',
                name: '仪器操作专家',
                description: '完成仪器操作室的全部任务',
                icon: 'ri-microscope-line',
                rarity: AchievementRarity.EPIC,
                condition: { type: 'workstation_complete', target: 'instrument-room' },
                xpReward: 400
            },
            {
                id: 'level-10',
                name: '资深工程师',
                description: '职业等级达到Lv.10',
                icon: 'ri-user-settings-line',
                rarity: AchievementRarity.EPIC,
                condition: { type: 'level', target: 10 },
                xpReward: 400
            },
            {
                id: 'task-25',
                name: '实训专家',
                description: '累计完成25个实训任务',
                icon: 'ri-award-line',
                rarity: AchievementRarity.EPIC,
                condition: { type: 'tasks_count', target: 25 },
                xpReward: 350
            },
            {
                id: 'first-try-master',
                name: '一次过关',
                description: '连续5个任务首次尝试即通过',
                icon: 'ri-checkbox-circle-line',
                rarity: AchievementRarity.EPIC,
                condition: { type: 'first_try_pass', target: 5 },
                xpReward: 300
            },
            
            // ========== 传说成就 (LEGENDARY) ==========
            {
                id: 'all-stations',
                name: '全能工程师',
                description: '完成所有工位的全部任务',
                icon: 'ri-trophy-line',
                rarity: AchievementRarity.LEGENDARY,
                condition: { type: 'special', target: 'all_workstations' },
                xpReward: 1000
            },
            {
                id: 'emergency-commander',
                name: '应急指挥官',
                description: '完成应急响应中心的全部任务',
                icon: 'ri-alarm-warning-line',
                rarity: AchievementRarity.LEGENDARY,
                condition: { type: 'workstation_complete', target: 'emergency-center' },
                xpReward: 600
            },
            {
                id: 'level-15',
                name: '项目经理',
                description: '职业等级达到Lv.15（最高等级）',
                icon: 'ri-vip-crown-line',
                rarity: AchievementRarity.LEGENDARY,
                condition: { type: 'level', target: 15 },
                xpReward: 800
            },
            {
                id: 'perfect-all',
                name: '完美主义者',
                description: '所有已完成任务均获得满分',
                icon: 'ri-star-smile-line',
                rarity: AchievementRarity.LEGENDARY,
                condition: { type: 'special', target: 'all_perfect' },
                xpReward: 1000
            },
            {
                id: 'streak-100',
                name: '百日坚持',
                description: '连续100天登录学习',
                icon: 'ri-fire-line',
                rarity: AchievementRarity.LEGENDARY,
                condition: { type: 'streak', target: 100 },
                xpReward: 1000
            },
            {
                id: 'all-certificates',
                name: '持证上岗',
                description: '获得所有工位的虚拟上岗证',
                icon: 'ri-file-shield-2-line',
                rarity: AchievementRarity.LEGENDARY,
                condition: { type: 'special', target: 'all_certificates' },
                xpReward: 800
            }
        ];
    }

    /**
     * 获取成就进度
     * @param {string} userId 用户ID
     * @param {Achievement} achievement 成就对象
     * @returns {Object} 进度信息 { current, target, percent }
     */
    async getAchievementProgress(userId, achievement) {
        const condition = achievement.condition;
        let current = 0;
        const target = typeof condition.target === 'number' ? condition.target : 1;

        switch (condition.type) {
            case 'tasks_count':
                const tasksKey = `vs_completed_tasks_${userId}`;
                const completedTasks = JSON.parse(localStorage.getItem(tasksKey) || '[]');
                current = completedTasks.length;
                break;
            case 'time':
                const profileKey = `vs_career_profile_${userId}`;
                const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');
                current = profile.totalStudyTime || 0;
                break;
            case 'streak':
                const streakKey = `vs_login_streak_${userId}`;
                const streakData = JSON.parse(localStorage.getItem(streakKey) || '{}');
                current = streakData.currentStreak || 0;
                break;
            case 'level':
                const levelKey = `vs_career_profile_${userId}`;
                const levelProfile = JSON.parse(localStorage.getItem(levelKey) || '{}');
                current = levelProfile.level || 1;
                break;
            case 'workstation_complete':
            case 'task_complete':
            case 'score':
            case 'first_try_pass':
            case 'special':
                // 这些类型的进度需要特殊处理，返回0或1
                current = achievement.isUnlocked ? 1 : 0;
                break;
        }

        const percent = Math.min(100, Math.round((current / target) * 100));
        return { current, target, percent };
    }
}


// ================= 学习进度与记录服务 =================

/**
 * 进度状态枚举
 * @typedef {'not_started'|'in_progress'|'completed'|'paused'} ProgressStatus
 */
const ProgressStatus = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    PAUSED: 'paused'
}

/**
 * 竞赛状态枚举
 * @typedef {'pending'|'active'|'ended'} CompetitionStatus
 */
const CompetitionStatus = {
    PENDING: 'pending',
    ACTIVE: 'active',
    ENDED: 'ended'
};

/**
 * 竞赛排行榜条目接口
 * @typedef {Object} LeaderboardEntry
 * @property {string} id - 条目ID
 * @property {string} competitionId - 竞赛ID
 * @property {string} userId - 用户ID
 * @property {string} userName - 用户名称
 * @property {number} score - 得分
 * @property {number} timeSpent - 用时（秒）
 * @property {number} rank - 排名
 * @property {number} completedAt - 完成时间戳
 * @property {Object} [operationPath] - 操作路径记录
 */

/**
 * 竞赛数据接口
 * @typedef {Object} Competition
 * @property {string} id - 竞赛ID
 * @property {string} name - 竞赛名称
 * @property {string} description - 竞赛描述
 * @property {string} workstationId - 工位ID
 * @property {string} taskId - 任务ID
 * @property {string} createdBy - 创建者ID
 * @property {CompetitionStatus} status - 竞赛状态
 * @property {number} startedAt - 开始时间戳
 * @property {number} endedAt - 结束时间戳
 * @property {number} createdAt - 创建时间戳
 * @property {LeaderboardEntry[]} leaderboard - 排行榜
 */

/**
 * 竞赛排行服务类
 * 提供实时排行榜功能
 * Requirements: 10.2, 10.3 - 实时排行榜，按得分和用时排序
 */
class CompetitionService {
    constructor(supabase) {
        this.supabase = supabase;
        /** @type {Map<string, Competition>} */
        this.competitions = new Map();
        /** @type {Function[]} */
        this.leaderboardUpdateCallbacks = [];
        /** @type {number|null} */
        this.refreshInterval = null;
        /** @type {number} */
        this.refreshIntervalMs = 5000; // 5秒刷新一次
    }

    /**
     * 注册排行榜更新回调
     * @param {Function} callback - 回调函数，接收 { competitionId, leaderboard } 参数
     */
    onLeaderboardUpdate(callback) {
        if (typeof callback === 'function') {
            this.leaderboardUpdateCallbacks.push(callback);
        }
    }

    /**
     * 触发排行榜更新事件
     * @param {string} competitionId - 竞赛ID
     * @param {LeaderboardEntry[]} leaderboard - 排行榜数据
     * @private
     */
    _triggerLeaderboardUpdate(competitionId, leaderboard) {
        this.leaderboardUpdateCallbacks.forEach(callback => {
            try {
                callback({ competitionId, leaderboard });
            } catch (e) {
                console.error('Leaderboard update callback error:', e);
            }
        });
    }

    /**
     * 获取竞赛信息
     * @param {string} competitionId - 竞赛ID
     * @returns {Promise<Competition|null>}
     */
    async getCompetition(competitionId) {
        // 先从缓存获取
        if (this.competitions.has(competitionId)) {
            return this.competitions.get(competitionId);
        }

        // 从数据库获取
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_competitions')
                    .select('*')
                    .eq('id', competitionId)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                if (data) {
                    const competition = this._mapCompetitionFromDB(data);
                    // 加载排行榜
                    competition.leaderboard = await this.getLeaderboard(competitionId);
                    this.competitions.set(competitionId, competition);
                    return competition;
                }
            } catch (error) {
                console.error('获取竞赛信息失败:', error);
            }
        }

        // 从本地存储获取
        const localKey = `vs_competition_${competitionId}`;
        const saved = localStorage.getItem(localKey);
        if (saved) {
            const competition = JSON.parse(saved);
            this.competitions.set(competitionId, competition);
            return competition;
        }

        return null;
    }

    /**
     * 获取活跃的竞赛列表
     * @returns {Promise<Competition[]>}
     */
    async getActiveCompetitions() {
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_competitions')
                    .select('*')
                    .eq('status', 'active')
                    .order('started_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const competitions = await Promise.all(
                        data.map(async (row) => {
                            const competition = this._mapCompetitionFromDB(row);
                            competition.leaderboard = await this.getLeaderboard(competition.id);
                            this.competitions.set(competition.id, competition);
                            return competition;
                        })
                    );
                    return competitions;
                }
            } catch (error) {
                console.error('获取活跃竞赛列表失败:', error);
            }
        }

        // 从本地存储获取
        const activeCompetitions = [];
        for (const [id, competition] of this.competitions) {
            if (competition.status === CompetitionStatus.ACTIVE) {
                activeCompetitions.push(competition);
            }
        }
        return activeCompetitions;
    }

    /**
     * 获取排行榜数据
     * Requirements: 10.2, 10.3 - 实时排行榜，按得分降序、用时升序排列
     * @param {string} competitionId - 竞赛ID
     * @returns {Promise<LeaderboardEntry[]>}
     */
    async getLeaderboard(competitionId) {
        let entries = [];

        // 从数据库获取
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_competition_participants')
                    .select('*')
                    .eq('competition_id', competitionId)
                    .not('completed_at', 'is', null);

                if (error) throw error;

                if (data) {
                    entries = data.map(row => this._mapLeaderboardEntryFromDB(row));
                }
            } catch (error) {
                console.error('获取排行榜数据失败:', error);
            }
        }

        // 如果数据库没有数据，从本地缓存获取
        if (entries.length === 0) {
            const competition = this.competitions.get(competitionId);
            if (competition && competition.leaderboard) {
                entries = [...competition.leaderboard];
            }
        }

        // 排序排行榜
        const sortedEntries = this.sortLeaderboard(entries);

        // 更新排名
        sortedEntries.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return sortedEntries;
    }

    /**
     * 排序排行榜
     * Requirements: 10.2, 10.3 - 按得分降序排列，得分相同时按用时升序排列
     * 
     * **Feature: virtual-station, Property 19: 竞赛排行榜排序正确性**
     * *For any* 竞赛排行榜，条目必须按得分降序排列，得分相同时按用时升序排列
     * **Validates: Requirements 10.2, 10.3**
     * 
     * @param {LeaderboardEntry[]} entries - 排行榜条目列表
     * @returns {LeaderboardEntry[]} 排序后的排行榜
     */
    sortLeaderboard(entries) {
        if (!entries || !Array.isArray(entries)) {
            return [];
        }

        return [...entries].sort((a, b) => {
            // 首先按得分降序排列
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // 得分相同时按用时升序排列（用时少的排前面）
            return a.timeSpent - b.timeSpent;
        });
    }

    /**
     * 提交竞赛成绩
     * Requirements: 10.3 - 学生完成竞赛任务后计算综合得分并更新排名
     * @param {string} competitionId - 竞赛ID
     * @param {string} userId - 用户ID
     * @param {string} userName - 用户名称
     * @param {number} score - 得分
     * @param {number} timeSpent - 用时（秒）
     * @param {Object} [operationPath] - 操作路径记录
     * @returns {Promise<LeaderboardEntry|null>}
     */
    async submitScore(competitionId, userId, userName, score, timeSpent, operationPath = null) {
        const competition = await this.getCompetition(competitionId);
        if (!competition) {
            console.warn('竞赛不存在:', competitionId);
            return null;
        }

        if (competition.status !== CompetitionStatus.ACTIVE) {
            console.warn('竞赛未进行中，无法提交成绩');
            return null;
        }

        // 检查是否已提交过
        const existingEntry = competition.leaderboard.find(e => e.userId === userId);
        if (existingEntry) {
            console.warn('该用户已提交过成绩');
            return existingEntry;
        }

        const now = Date.now();
        const entryId = `entry_${now}_${Math.random().toString(36).substr(2, 9)}`;

        /** @type {LeaderboardEntry} */
        const entry = {
            id: entryId,
            competitionId,
            userId,
            userName,
            score,
            timeSpent,
            rank: 0, // 将在排序后更新
            completedAt: now,
            operationPath
        };

        // 添加到排行榜
        competition.leaderboard.push(entry);

        // 重新排序并更新排名
        competition.leaderboard = this.sortLeaderboard(competition.leaderboard);
        competition.leaderboard.forEach((e, index) => {
            e.rank = index + 1;
        });

        // 保存到数据库
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('vs_competition_participants')
                    .upsert({
                        id: entryId,
                        competition_id: competitionId,
                        user_id: userId,
                        score,
                        time_spent: timeSpent,
                        rank: entry.rank,
                        completed_at: new Date(now).toISOString(),
                        operation_path: operationPath
                    });

                if (error) throw error;
            } catch (error) {
                console.error('保存竞赛成绩失败:', error);
            }
        }

        // 保存到本地存储
        this._saveCompetitionToLocal(competition);

        // 触发排行榜更新事件
        this._triggerLeaderboardUpdate(competitionId, competition.leaderboard);

        console.log('📊 竞赛成绩已提交:', entry);
        return entry;
    }

    /**
     * 刷新排行榜数据
     * @param {string} competitionId - 竞赛ID
     * @returns {Promise<LeaderboardEntry[]>}
     */
    async refreshLeaderboard(competitionId) {
        const leaderboard = await this.getLeaderboard(competitionId);
        
        // 更新缓存
        const competition = this.competitions.get(competitionId);
        if (competition) {
            competition.leaderboard = leaderboard;
        }

        // 触发更新事件
        this._triggerLeaderboardUpdate(competitionId, leaderboard);

        return leaderboard;
    }

    /**
     * 开始自动刷新排行榜
     * @param {string} competitionId - 竞赛ID
     * @param {number} [intervalMs] - 刷新间隔（毫秒）
     */
    startAutoRefresh(competitionId, intervalMs = 5000) {
        this.stopAutoRefresh();
        
        this.refreshIntervalMs = intervalMs;
        this.refreshInterval = setInterval(async () => {
            await this.refreshLeaderboard(competitionId);
        }, intervalMs);

        console.log(`🔄 排行榜自动刷新已启动，间隔: ${intervalMs}ms`);
    }

    /**
     * 停止自动刷新排行榜
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('🔄 排行榜自动刷新已停止');
        }
    }

    /**
     * 获取用户在排行榜中的排名
     * @param {string} competitionId - 竞赛ID
     * @param {string} userId - 用户ID
     * @returns {Promise<{rank: number, entry: LeaderboardEntry}|null>}
     */
    async getUserRank(competitionId, userId) {
        const leaderboard = await this.getLeaderboard(competitionId);
        const entry = leaderboard.find(e => e.userId === userId);
        
        if (entry) {
            return {
                rank: entry.rank,
                entry
            };
        }
        
        return null;
    }

    /**
     * 获取排行榜前N名
     * @param {string} competitionId - 竞赛ID
     * @param {number} topN - 前N名
     * @returns {Promise<LeaderboardEntry[]>}
     */
    async getTopN(competitionId, topN = 10) {
        const leaderboard = await this.getLeaderboard(competitionId);
        return leaderboard.slice(0, topN);
    }

    /**
     * 从数据库记录映射到Competition对象
     * @param {Object} row - 数据库记录
     * @returns {Competition}
     * @private
     */
    _mapCompetitionFromDB(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            workstationId: row.workstation_id,
            taskId: row.task_id,
            createdBy: row.created_by,
            status: row.status,
            startedAt: row.started_at ? new Date(row.started_at).getTime() : null,
            endedAt: row.ended_at ? new Date(row.ended_at).getTime() : null,
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
            leaderboard: []
        };
    }

    /**
     * 从数据库记录映射到LeaderboardEntry对象
     * @param {Object} row - 数据库记录
     * @returns {LeaderboardEntry}
     * @private
     */
    _mapLeaderboardEntryFromDB(row) {
        return {
            id: row.id,
            competitionId: row.competition_id,
            userId: row.user_id,
            userName: row.user_name || row.user_id, // 如果没有用户名，使用用户ID
            score: row.score || 0,
            timeSpent: row.time_spent || 0,
            rank: row.rank || 0,
            completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
            operationPath: row.operation_path
        };
    }

    /**
     * 保存竞赛到本地存储
     * @param {Competition} competition - 竞赛对象
     * @private
     */
    _saveCompetitionToLocal(competition) {
        try {
            const localKey = `vs_competition_${competition.id}`;
            localStorage.setItem(localKey, JSON.stringify(competition));
        } catch (e) {
            console.error('保存竞赛到本地存储失败:', e);
        }
    }

    /**
     * 渲染排行榜HTML
     * @param {LeaderboardEntry[]} leaderboard - 排行榜数据
     * @param {string} [currentUserId] - 当前用户ID（用于高亮显示）
     * @returns {string} HTML字符串
     */
    renderLeaderboardHTML(leaderboard, currentUserId = null) {
        if (!leaderboard || leaderboard.length === 0) {
            return `
                <div class="text-center text-gray-400 py-8">
                    <i class="ri-trophy-line text-4xl mb-2"></i>
                    <p>暂无排名数据</p>
                </div>
            `;
        }

        const rows = leaderboard.map((entry, index) => {
            const isCurrentUser = entry.userId === currentUserId;
            const rankClass = index === 0 ? 'text-amber-400' : 
                             index === 1 ? 'text-gray-300' : 
                             index === 2 ? 'text-amber-600' : 'text-gray-400';
            const rankIcon = index === 0 ? '🥇' : 
                            index === 1 ? '🥈' : 
                            index === 2 ? '🥉' : `${entry.rank}`;
            const rowClass = isCurrentUser ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5';
            
            const minutes = Math.floor(entry.timeSpent / 60);
            const seconds = entry.timeSpent % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            return `
                <div class="${rowClass} rounded-lg p-3 flex items-center justify-between border border-transparent hover:border-white/10 transition">
                    <div class="flex items-center gap-3">
                        <span class="w-8 text-center font-bold ${rankClass}">${rankIcon}</span>
                        <span class="font-medium ${isCurrentUser ? 'text-purple-300' : 'text-white'}">${entry.userName}</span>
                        ${isCurrentUser ? '<span class="text-xs bg-purple-500/30 px-2 py-0.5 rounded text-purple-300">你</span>' : ''}
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="text-right">
                            <div class="font-bold text-cyan-400">${entry.score}</div>
                            <div class="text-xs text-gray-500">得分</div>
                        </div>
                        <div class="text-right">
                            <div class="font-medium text-gray-300">${timeStr}</div>
                            <div class="text-xs text-gray-500">用时</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="space-y-2">
                ${rows}
            </div>
        `;
    }

    /**
     * 格式化时间显示
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符串
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // ================= 竞赛结果展示和导出 =================
    // Requirements: 10.4, 10.5 - 显示最终排名和路径对比，导出Excel报告

    /**
     * 获取竞赛最终结果
     * Requirements: 10.4 - 竞赛结束后显示最终排名和各学生的完成路径对比
     * @param {string} competitionId - 竞赛ID
     * @returns {Promise<Object>} 竞赛结果数据
     */
    async getCompetitionResults(competitionId) {
        const competition = await this.getCompetition(competitionId);
        if (!competition) {
            return null;
        }

        // 获取排序后的排行榜
        const leaderboard = await this.getLeaderboard(competitionId);

        // 计算统计数据
        const stats = this._calculateCompetitionStats(leaderboard);

        return {
            competition: {
                id: competition.id,
                name: competition.name,
                description: competition.description,
                workstationId: competition.workstationId,
                taskId: competition.taskId,
                status: competition.status,
                startedAt: competition.startedAt,
                endedAt: competition.endedAt
            },
            leaderboard: leaderboard,
            stats: stats,
            generatedAt: Date.now()
        };
    }

    /**
     * 计算竞赛统计数据
     * @param {LeaderboardEntry[]} leaderboard - 排行榜数据
     * @returns {Object} 统计数据
     * @private
     */
    _calculateCompetitionStats(leaderboard) {
        if (!leaderboard || leaderboard.length === 0) {
            return {
                totalParticipants: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                averageTime: 0,
                fastestTime: 0,
                slowestTime: 0,
                scoreDistribution: []
            };
        }

        const scores = leaderboard.map(e => e.score);
        const times = leaderboard.map(e => e.timeSpent);

        const totalParticipants = leaderboard.length;
        const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalParticipants);
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const averageTime = Math.round(times.reduce((a, b) => a + b, 0) / totalParticipants);
        const fastestTime = Math.min(...times);
        const slowestTime = Math.max(...times);

        // 计算分数分布（按10分区间）
        const scoreDistribution = this._calculateScoreDistribution(scores);

        return {
            totalParticipants,
            averageScore,
            highestScore,
            lowestScore,
            averageTime,
            fastestTime,
            slowestTime,
            scoreDistribution
        };
    }

    /**
     * 计算分数分布
     * @param {number[]} scores - 分数数组
     * @returns {Array<{range: string, count: number, percentage: number}>} 分布数据
     * @private
     */
    _calculateScoreDistribution(scores) {
        const distribution = [];
        const ranges = [
            { min: 0, max: 59, label: '0-59' },
            { min: 60, max: 69, label: '60-69' },
            { min: 70, max: 79, label: '70-79' },
            { min: 80, max: 89, label: '80-89' },
            { min: 90, max: 100, label: '90-100' }
        ];

        const total = scores.length;
        for (const range of ranges) {
            const count = scores.filter(s => s >= range.min && s <= range.max).length;
            distribution.push({
                range: range.label,
                count: count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            });
        }

        return distribution;
    }

    /**
     * 获取操作路径对比数据
     * Requirements: 10.4 - 显示各学生的完成路径对比
     * @param {string} competitionId - 竞赛ID
     * @param {string[]} [userIds] - 要对比的用户ID列表（可选，默认前5名）
     * @returns {Promise<Object>} 路径对比数据
     */
    async getOperationPathComparison(competitionId, userIds = null) {
        const leaderboard = await this.getLeaderboard(competitionId);
        
        // 如果没有指定用户，默认取前5名
        let targetEntries = leaderboard;
        if (userIds && userIds.length > 0) {
            targetEntries = leaderboard.filter(e => userIds.includes(e.userId));
        } else {
            targetEntries = leaderboard.slice(0, 5);
        }

        const comparisons = targetEntries.map(entry => ({
            userId: entry.userId,
            userName: entry.userName,
            rank: entry.rank,
            score: entry.score,
            timeSpent: entry.timeSpent,
            timeFormatted: this.formatTime(entry.timeSpent),
            operationPath: entry.operationPath || [],
            completedAt: entry.completedAt
        }));

        return {
            competitionId,
            comparisons,
            generatedAt: Date.now()
        };
    }

    /**
     * 渲染竞赛结果HTML
     * Requirements: 10.4 - 显示最终排名和路径对比
     * @param {Object} results - 竞赛结果数据（来自getCompetitionResults）
     * @param {string} [currentUserId] - 当前用户ID（用于高亮显示）
     * @returns {string} HTML字符串
     */
    renderCompetitionResultsHTML(results, currentUserId = null) {
        if (!results || !results.competition) {
            return `
                <div class="text-center text-gray-400 py-8">
                    <i class="ri-error-warning-line text-4xl mb-2"></i>
                    <p>竞赛结果数据不可用</p>
                </div>
            `;
        }

        const { competition, leaderboard, stats } = results;
        const statusText = competition.status === 'ended' ? '已结束' : 
                          competition.status === 'active' ? '进行中' : '待开始';
        const statusClass = competition.status === 'ended' ? 'bg-gray-500' : 
                           competition.status === 'active' ? 'bg-green-500' : 'bg-yellow-500';

        // 渲染统计卡片
        const statsHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white/5 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-cyan-400">${stats.totalParticipants}</div>
                    <div class="text-sm text-gray-400">参赛人数</div>
                </div>
                <div class="bg-white/5 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-green-400">${stats.averageScore}</div>
                    <div class="text-sm text-gray-400">平均分</div>
                </div>
                <div class="bg-white/5 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-amber-400">${stats.highestScore}</div>
                    <div class="text-sm text-gray-400">最高分</div>
                </div>
                <div class="bg-white/5 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-purple-400">${this.formatTime(stats.fastestTime)}</div>
                    <div class="text-sm text-gray-400">最快用时</div>
                </div>
            </div>
        `;

        // 渲染排行榜
        const leaderboardHTML = this.renderLeaderboardHTML(leaderboard, currentUserId);

        // 渲染分数分布
        const distributionHTML = this._renderScoreDistributionHTML(stats.scoreDistribution);

        return `
            <div class="competition-results">
                <!-- 竞赛信息头部 -->
                <div class="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-xl p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-bold text-white">${competition.name}</h2>
                        <span class="${statusClass} px-3 py-1 rounded-full text-sm text-white">${statusText}</span>
                    </div>
                    <p class="text-gray-300 text-sm mb-4">${competition.description || ''}</p>
                    <div class="flex items-center gap-4 text-sm text-gray-400">
                        ${competition.startedAt ? `<span><i class="ri-time-line mr-1"></i>开始: ${new Date(competition.startedAt).toLocaleString()}</span>` : ''}
                        ${competition.endedAt ? `<span><i class="ri-flag-line mr-1"></i>结束: ${new Date(competition.endedAt).toLocaleString()}</span>` : ''}
                    </div>
                </div>

                <!-- 统计数据 -->
                ${statsHTML}

                <!-- 分数分布 -->
                <div class="bg-white/5 rounded-xl p-4 mb-6">
                    <h3 class="text-lg font-semibold text-white mb-4">分数分布</h3>
                    ${distributionHTML}
                </div>

                <!-- 排行榜 -->
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-white">最终排名</h3>
                        <button onclick="window.CompetitionService && window.CompetitionService.exportCompetitionResults && window.CompetitionService.exportCompetitionResults('${competition.id}')" 
                                class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm text-white transition flex items-center gap-2">
                            <i class="ri-file-excel-2-line"></i>
                            导出Excel
                        </button>
                    </div>
                    ${leaderboardHTML}
                </div>
            </div>
        `;
    }

    /**
     * 渲染分数分布HTML
     * @param {Array} distribution - 分数分布数据
     * @returns {string} HTML字符串
     * @private
     */
    _renderScoreDistributionHTML(distribution) {
        if (!distribution || distribution.length === 0) {
            return '<p class="text-gray-400 text-center">暂无分布数据</p>';
        }

        const bars = distribution.map(d => {
            const barColor = d.range.startsWith('90') ? 'bg-green-500' :
                            d.range.startsWith('80') ? 'bg-cyan-500' :
                            d.range.startsWith('70') ? 'bg-blue-500' :
                            d.range.startsWith('60') ? 'bg-yellow-500' : 'bg-red-500';
            
            return `
                <div class="flex items-center gap-3">
                    <span class="w-16 text-sm text-gray-400">${d.range}</span>
                    <div class="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                        <div class="${barColor} h-full rounded-full transition-all duration-500" 
                             style="width: ${d.percentage}%"></div>
                    </div>
                    <span class="w-20 text-sm text-gray-300 text-right">${d.count}人 (${d.percentage}%)</span>
                </div>
            `;
        }).join('');

        return `<div class="space-y-2">${bars}</div>`;
    }

    /**
     * 渲染操作路径对比HTML
     * Requirements: 10.4 - 显示各学生的完成路径对比
     * @param {Object} comparisonData - 路径对比数据（来自getOperationPathComparison）
     * @returns {string} HTML字符串
     */
    renderOperationPathComparisonHTML(comparisonData) {
        if (!comparisonData || !comparisonData.comparisons || comparisonData.comparisons.length === 0) {
            return `
                <div class="text-center text-gray-400 py-8">
                    <i class="ri-route-line text-4xl mb-2"></i>
                    <p>暂无路径对比数据</p>
                </div>
            `;
        }

        const comparisons = comparisonData.comparisons;

        const rows = comparisons.map((c, index) => {
            const rankClass = index === 0 ? 'text-amber-400' : 
                             index === 1 ? 'text-gray-300' : 
                             index === 2 ? 'text-amber-600' : 'text-gray-400';
            const rankIcon = index === 0 ? '🥇' : 
                            index === 1 ? '🥈' : 
                            index === 2 ? '🥉' : `${c.rank}`;

            // 渲染操作路径
            const pathSteps = c.operationPath && c.operationPath.length > 0 
                ? c.operationPath.map((step, i) => `
                    <span class="inline-flex items-center px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                        ${i + 1}. ${step.action || step.name || step}
                    </span>
                `).join('<i class="ri-arrow-right-s-line text-gray-500 mx-1"></i>')
                : '<span class="text-gray-500 text-sm">无路径记录</span>';

            return `
                <div class="bg-white/5 rounded-lg p-4 mb-3">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <span class="w-8 text-center font-bold ${rankClass}">${rankIcon}</span>
                            <span class="font-medium text-white">${c.userName}</span>
                        </div>
                        <div class="flex items-center gap-4 text-sm">
                            <span class="text-cyan-400 font-bold">${c.score}分</span>
                            <span class="text-gray-400">${c.timeFormatted}</span>
                        </div>
                    </div>
                    <div class="pl-11">
                        <div class="text-xs text-gray-500 mb-2">操作路径:</div>
                        <div class="flex flex-wrap items-center gap-1">
                            ${pathSteps}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="operation-path-comparison">
                <h3 class="text-lg font-semibold text-white mb-4">操作路径对比</h3>
                ${rows}
            </div>
        `;
    }

    /**
     * 导出竞赛结果为Excel
     * Requirements: 10.5 - 教师导出竞赛结果，生成包含详细数据的Excel报告
     * @param {string} competitionId - 竞赛ID
     * @returns {Promise<void>}
     */
    async exportCompetitionResults(competitionId) {
        const results = await this.getCompetitionResults(competitionId);
        if (!results) {
            console.error('无法获取竞赛结果');
            alert('导出失败：无法获取竞赛结果');
            return;
        }

        // 检查XLSX库是否可用
        if (typeof XLSX === 'undefined') {
            console.error('SheetJS库未加载');
            alert('导出失败：Excel导出库未加载，请确保已引入xlsx.js');
            return;
        }

        try {
            const workbook = this._generateCompetitionExcelWorkbook(results);
            
            // 生成文件名
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `竞赛结果_${results.competition.name}_${timestamp}.xlsx`;

            // 导出文件
            XLSX.writeFile(workbook, filename);
            
            console.log('📊 竞赛结果已导出:', filename);
        } catch (error) {
            console.error('导出竞赛结果失败:', error);
            alert('导出失败：' + error.message);
        }
    }

    /**
     * 生成竞赛Excel工作簿
     * Requirements: 10.5 - 生成包含详细数据的Excel报告
     * @param {Object} results - 竞赛结果数据
     * @returns {Object} XLSX工作簿对象
     * @private
     */
    _generateCompetitionExcelWorkbook(results) {
        const { competition, leaderboard, stats } = results;
        const workbook = XLSX.utils.book_new();

        // 工作表1: 竞赛概况
        const summaryData = [
            ['竞赛结果报告'],
            [],
            ['竞赛名称', competition.name],
            ['竞赛描述', competition.description || ''],
            ['竞赛状态', competition.status === 'ended' ? '已结束' : competition.status === 'active' ? '进行中' : '待开始'],
            ['开始时间', competition.startedAt ? new Date(competition.startedAt).toLocaleString() : ''],
            ['结束时间', competition.endedAt ? new Date(competition.endedAt).toLocaleString() : ''],
            [],
            ['统计数据'],
            ['参赛人数', stats.totalParticipants],
            ['平均分', stats.averageScore],
            ['最高分', stats.highestScore],
            ['最低分', stats.lowestScore],
            ['平均用时', this.formatTime(stats.averageTime)],
            ['最快用时', this.formatTime(stats.fastestTime)],
            ['最慢用时', this.formatTime(stats.slowestTime)],
            [],
            ['分数分布'],
            ['分数区间', '人数', '占比']
        ];

        // 添加分数分布数据
        for (const d of stats.scoreDistribution) {
            summaryData.push([d.range, d.count, `${d.percentage}%`]);
        }

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        
        // 设置列宽
        summarySheet['!cols'] = [
            { wch: 15 },
            { wch: 40 },
            { wch: 15 }
        ];

        XLSX.utils.book_append_sheet(workbook, summarySheet, '竞赛概况');

        // 工作表2: 排行榜详情
        const rankingData = [
            ['排名', '用户ID', '用户名', '得分', '用时(秒)', '用时(格式化)', '完成时间']
        ];

        for (const entry of leaderboard) {
            rankingData.push([
                entry.rank,
                entry.userId,
                entry.userName,
                entry.score,
                entry.timeSpent,
                this.formatTime(entry.timeSpent),
                entry.completedAt ? new Date(entry.completedAt).toLocaleString() : ''
            ]);
        }

        const rankingSheet = XLSX.utils.aoa_to_sheet(rankingData);
        
        // 设置列宽
        rankingSheet['!cols'] = [
            { wch: 8 },
            { wch: 20 },
            { wch: 15 },
            { wch: 10 },
            { wch: 12 },
            { wch: 15 },
            { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(workbook, rankingSheet, '排行榜详情');

        // 工作表3: 操作路径（如果有数据）
        const pathData = [
            ['排名', '用户名', '得分', '用时', '操作路径']
        ];

        for (const entry of leaderboard) {
            const pathStr = entry.operationPath && entry.operationPath.length > 0
                ? entry.operationPath.map((step, i) => `${i + 1}.${step.action || step.name || step}`).join(' → ')
                : '无记录';
            
            pathData.push([
                entry.rank,
                entry.userName,
                entry.score,
                this.formatTime(entry.timeSpent),
                pathStr
            ]);
        }

        const pathSheet = XLSX.utils.aoa_to_sheet(pathData);
        
        // 设置列宽
        pathSheet['!cols'] = [
            { wch: 8 },
            { wch: 15 },
            { wch: 10 },
            { wch: 12 },
            { wch: 80 }
        ];

        XLSX.utils.book_append_sheet(workbook, pathSheet, '操作路径');

        return workbook;
    }

    /**
     * 导出竞赛结果为JSON（用于数据备份或API）
     * @param {string} competitionId - 竞赛ID
     * @returns {Promise<string>} JSON字符串
     */
    async exportCompetitionResultsJSON(competitionId) {
        const results = await this.getCompetitionResults(competitionId);
        if (!results) {
            throw new Error('无法获取竞赛结果');
        }

        return JSON.stringify(results, null, 2);
    }

    /**
     * 下载竞赛结果JSON文件
     * @param {string} competitionId - 竞赛ID
     * @returns {Promise<void>}
     */
    async downloadCompetitionResultsJSON(competitionId) {
        try {
            const jsonStr = await this.exportCompetitionResultsJSON(competitionId);
            const results = JSON.parse(jsonStr);
            
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `竞赛结果_${results.competition.name}_${timestamp}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('📊 竞赛结果JSON已导出:', filename);
        } catch (error) {
            console.error('导出竞赛结果JSON失败:', error);
            alert('导出失败：' + error.message);
        }
    }
}


// ================= AI助教服务 =================

/**
 * 国家标准数据库
 * 包含环境监测相关的国家标准和行业标准
 */
const NATIONAL_STANDARDS_DATABASE = {
    // 危险废物鉴别标准
    'GB 5085.1-2007': {
        id: 'GB 5085.1-2007',
        name: '危险废物鉴别标准 腐蚀性鉴别',
        category: 'hazwaste',
        publishDate: '2007-04-01',
        clauses: {
            '4.1': '腐蚀性鉴别值：pH≤2或pH≥12.5',
            '4.2': '对钢材的腐蚀速率超过6.35mm/年',
            '5': '腐蚀性鉴别方法按照GB/T 15555.12执行'
        }
    },
    'GB 5085.2-2007': {
        id: 'GB 5085.2-2007',
        name: '危险废物鉴别标准 急性毒性初筛',
        category: 'hazwaste',
        publishDate: '2007-04-01',
        clauses: {
            '4.1': '经口摄入LD50≤200mg/kg',
            '4.2': '经皮肤接触LD50≤1000mg/kg',
            '4.3': '蒸气、烟雾或粉尘吸入LC50≤10mg/L'
        }
    },
    'GB 5085.3-2007': {
        id: 'GB 5085.3-2007',
        name: '危险废物鉴别标准 浸出毒性鉴别',
        category: 'hazwaste',
        publishDate: '2007-04-01',
        clauses: {
            '4': '浸出毒性鉴别标准值见附录A',
            '5': '浸出方法按照HJ/T 299或HJ/T 300执行',
            'A.1': '无机元素及化合物浸出毒性鉴别标准值',
            'A.2': '有机物浸出毒性鉴别标准值'
        }
    },
    'GB 5085.4-2007': {
        id: 'GB 5085.4-2007',
        name: '危险废物鉴别标准 易燃性鉴别',
        category: 'hazwaste',
        publishDate: '2007-04-01',
        clauses: {
            '4.1': '液态易燃性：闪点<60℃',
            '4.2': '固态易燃性：能被点燃并持续燃烧',
            '4.3': '氧化性：能引起或促进其他物质燃烧'
        }
    },
    'GB 5085.5-2007': {
        id: 'GB 5085.5-2007',
        name: '危险废物鉴别标准 反应性鉴别',
        category: 'hazwaste',
        publishDate: '2007-04-01',
        clauses: {
            '4.1': '与水反应产生可燃气体',
            '4.2': '与酸接触产生有毒气体',
            '4.3': '在常温常压下易发生爆炸或爆轰'
        }
    },
    'GB 5085.6-2007': {
        id: 'GB 5085.6-2007',
        name: '危险废物鉴别标准 毒性物质含量鉴别',
        category: 'hazwaste',
        publishDate: '2007-04-01',
        clauses: {
            '4': '毒性物质含量鉴别标准值见附录A',
            'A.1': '剧毒物质名录',
            'A.2': '有毒物质名录'
        }
    },
    'GB 5085.7-2019': {
        id: 'GB 5085.7-2019',
        name: '危险废物鉴别标准 通则',
        category: 'hazwaste',
        publishDate: '2019-11-01',
        clauses: {
            '4.1': '危险废物鉴别程序',
            '4.2': '危险废物混合后的判定规则',
            '4.3': '危险废物处理后的判定规则',
            '5': '危险废物鉴别报告编制要求'
        }
    },
    // 地表水监测标准
    'HJ/T 91-2002': {
        id: 'HJ/T 91-2002',
        name: '地表水和污水监测技术规范',
        category: 'water',
        publishDate: '2002-12-01',
        clauses: {
            '4.1': '监测断面的布设原则',
            '4.2': '采样点位的确定方法',
            '5.1': '采样时间和频次要求',
            '5.2': '采样方法和采样器具',
            '6': '样品的保存和运输',
            '7': '质量保证和质量控制'
        }
    },
    'HJ 493-2009': {
        id: 'HJ 493-2009',
        name: '水质 样品的保存和管理技术规定',
        category: 'water',
        publishDate: '2009-09-01',
        clauses: {
            '4': '样品容器的选择',
            '5': '样品的保存方法',
            '6': '样品的运输要求',
            '7': '样品的保存期限'
        }
    },
    // 土壤监测标准
    'HJ 25.1-2019': {
        id: 'HJ 25.1-2019',
        name: '建设用地土壤污染状况调查技术导则',
        category: 'soil',
        publishDate: '2019-12-01',
        clauses: {
            '4': '工作程序',
            '5.1': '第一阶段土壤污染状况调查',
            '5.2': '第二阶段土壤污染状况调查',
            '6': '采样布点原则',
            '7': '样品采集和保存',
            '8': '调查报告编制'
        }
    },
    'HJ 25.2-2019': {
        id: 'HJ 25.2-2019',
        name: '建设用地土壤污染风险管控和修复监测技术导则',
        category: 'soil',
        publishDate: '2019-12-01',
        clauses: {
            '4': '监测工作程序',
            '5': '监测点位布设',
            '6': '样品采集和分析',
            '7': '监测报告编制'
        }
    },
    'HJ 613-2011': {
        id: 'HJ 613-2011',
        name: '土壤 干物质和水分的测定 重量法',
        category: 'soil',
        publishDate: '2011-02-01',
        clauses: {
            '4': '方法原理',
            '5': '试剂和材料',
            '6': '仪器和设备',
            '7': '样品采集和保存',
            '8': '分析步骤',
            '9': '结果计算'
        }
    },
    // 大气监测标准
    'HJ 664-2013': {
        id: 'HJ 664-2013',
        name: '环境空气质量监测点位布设技术规范',
        category: 'air',
        publishDate: '2013-01-01',
        clauses: {
            '4': '监测点位布设原则',
            '5': '城市环境空气质量监测点位布设',
            '6': '区域环境空气质量监测点位布设',
            '7': '监测点位的调整'
        }
    },
    'HJ 194-2017': {
        id: 'HJ 194-2017',
        name: '环境空气质量手工监测技术规范',
        category: 'air',
        publishDate: '2017-12-01',
        clauses: {
            '4': '监测项目和分析方法',
            '5': '采样方法',
            '6': '样品运输和保存',
            '7': '质量保证和质量控制'
        }
    }
};

/**
 * 标准引用正则表达式模式
 * 用于识别文本中的国家标准引用
 */
const STANDARD_REFERENCE_PATTERNS = [
    // GB xxxx.x-xxxx 格式
    /GB\s*\/?\s*T?\s*(\d{4,5})(?:\.(\d+))?-(\d{4})/gi,
    // HJ xxxx-xxxx 格式
    /HJ\s*\/?\s*T?\s*(\d{2,4})(?:\.(\d+))?-(\d{4})/gi,
    // GB/T xxxx-xxxx 格式
    /GB\/T\s*(\d{4,5})(?:\.(\d+))?-(\d{4})/gi,
    // HJ/T xxxx-xxxx 格式
    /HJ\/T\s*(\d{2,4})(?:\.(\d+))?-(\d{4})/gi
];

/**
 * AI助教服务类
 * 提供基于RAG知识库的垂直领域智能问答系统
 */
class AITutorService {
    constructor() {
        this.supabase = null;
        this.conversations = new Map();
        this.knowledgeBase = NATIONAL_STANDARDS_DATABASE;
    }

    /**
     * 初始化服务
     * @param {Object} supabase - Supabase客户端实例
     */
    initialize(supabase) {
        this.supabase = supabase;
    }

    // ================= 标准引用格式化 =================

    /**
     * 解析文本中的国家标准引用
     * @param {string} text - 待解析的文本
     * @returns {Array<{match: string, standardId: string, normalized: string}>} 解析结果
     */
    parseStandardReferences(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const references = [];
        const seen = new Set();

        for (const pattern of STANDARD_REFERENCE_PATTERNS) {
            // 重置正则表达式的lastIndex
            pattern.lastIndex = 0;
            let match;
            
            while ((match = pattern.exec(text)) !== null) {
                const fullMatch = match[0];
                const normalized = this._normalizeStandardId(fullMatch);
                
                // 避免重复
                if (!seen.has(normalized)) {
                    seen.add(normalized);
                    references.push({
                        match: fullMatch,
                        standardId: normalized,
                        normalized: normalized,
                        position: match.index
                    });
                }
            }
        }

        return references.sort((a, b) => a.position - b.position);
    }

    /**
     * 标准化标准编号格式
     * @param {string} rawId - 原始标准编号
     * @returns {string} 标准化后的编号
     */
    _normalizeStandardId(rawId) {
        if (!rawId) return '';
        
        // 移除多余空格
        let normalized = rawId.replace(/\s+/g, ' ').trim();
        
        // 统一格式：GB 5085.1-2007 或 HJ/T 91-2002
        normalized = normalized
            .replace(/GB\s*\/?\s*T\s*/gi, 'GB/T ')
            .replace(/HJ\s*\/?\s*T\s*/gi, 'HJ/T ')
            .replace(/GB\s+/gi, 'GB ')
            .replace(/HJ\s+/gi, 'HJ ');
        
        // 确保编号和年份之间有连字符
        normalized = normalized.replace(/(\d)\s*-\s*(\d)/g, '$1-$2');
        
        return normalized.trim();
    }

    /**
     * 从知识库获取标准详细信息
     * @param {string} standardId - 标准编号
     * @returns {Object|null} 标准信息
     */
    getStandardInfo(standardId) {
        const normalized = this._normalizeStandardId(standardId);
        
        // 直接查找
        if (this.knowledgeBase[normalized]) {
            return this.knowledgeBase[normalized];
        }
        
        // 模糊匹配（处理格式差异）
        for (const [key, value] of Object.entries(this.knowledgeBase)) {
            if (this._normalizeStandardId(key) === normalized) {
                return value;
            }
            // 尝试不带斜杠的匹配
            const keyWithoutSlash = key.replace(/\//g, '');
            const normalizedWithoutSlash = normalized.replace(/\//g, '');
            if (keyWithoutSlash === normalizedWithoutSlash) {
                return value;
            }
        }
        
        return null;
    }

    /**
     * 获取标准的特定条款内容
     * @param {string} standardId - 标准编号
     * @param {string} clauseId - 条款编号
     * @returns {Object|null} 条款信息
     */
    getStandardClause(standardId, clauseId) {
        const standard = this.getStandardInfo(standardId);
        if (!standard || !standard.clauses) {
            return null;
        }

        const clauseContent = standard.clauses[clauseId];
        if (!clauseContent) {
            return null;
        }

        return {
            standardId: standard.id,
            standardName: standard.name,
            clause: clauseId,
            content: clauseContent,
            link: `#/knowledge/standard/${standard.id}#${clauseId}`
        };
    }

    /**
     * 为AI回答添加标准引用格式化
     * 解析回答中的标准引用并添加详细信息
     * @param {string} content - AI回答内容
     * @returns {Object} 格式化结果
     */
    formatStandardReferences(content) {
        if (!content || typeof content !== 'string') {
            return {
                formattedContent: content || '',
                references: [],
                hasReferences: false
            };
        }

        // 解析标准引用
        const parsedRefs = this.parseStandardReferences(content);
        
        if (parsedRefs.length === 0) {
            return {
                formattedContent: content,
                references: [],
                hasReferences: false
            };
        }

        // 收集标准引用详细信息
        const references = [];
        let formattedContent = content;

        for (const ref of parsedRefs) {
            const standardInfo = this.getStandardInfo(ref.standardId);
            
            if (standardInfo) {
                references.push({
                    standardId: standardInfo.id,
                    standardName: standardInfo.name,
                    clause: '',
                    content: `${standardInfo.name}（${standardInfo.id}）`,
                    link: `#/knowledge/standard/${standardInfo.id}`,
                    category: standardInfo.category,
                    publishDate: standardInfo.publishDate
                });

                // 在内容中添加标准名称（如果原文只有编号）
                if (!content.includes(standardInfo.name)) {
                    formattedContent = formattedContent.replace(
                        new RegExp(this._escapeRegExp(ref.match), 'g'),
                        `${standardInfo.name}（${standardInfo.id}）`
                    );
                }
            } else {
                // 未找到标准信息，仍然记录引用
                references.push({
                    standardId: ref.standardId,
                    standardName: ref.standardId,
                    clause: '',
                    content: ref.standardId,
                    link: null,
                    category: 'unknown',
                    publishDate: null
                });
            }
        }

        return {
            formattedContent,
            references,
            hasReferences: references.length > 0
        };
    }

    /**
     * 转义正则表达式特殊字符
     * @param {string} string - 待转义的字符串
     * @returns {string} 转义后的字符串
     */
    _escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 验证AI回答是否包含正确的标准引用格式
     * 根据Requirements 5.2：回答涉及国家标准时必须引用具体标准编号和条款内容
     * @param {string} content - AI回答内容
     * @param {boolean} expectsStandardRef - 是否期望包含标准引用
     * @returns {Object} 验证结果
     */
    validateStandardReferenceFormat(content, expectsStandardRef = false) {
        const result = {
            valid: true,
            hasStandardReferences: false,
            references: [],
            issues: [],
            suggestions: []
        };

        if (!content || typeof content !== 'string') {
            result.valid = false;
            result.issues.push('回答内容为空');
            return result;
        }

        // 解析标准引用
        const parsedRefs = this.parseStandardReferences(content);
        result.hasStandardReferences = parsedRefs.length > 0;
        result.references = parsedRefs;

        // 如果期望有标准引用但没有找到
        if (expectsStandardRef && !result.hasStandardReferences) {
            result.valid = false;
            result.issues.push('回答涉及专业内容但未引用相关国家标准');
            result.suggestions.push('建议添加相关国家标准引用，如GB 5085系列、HJ/T 91-2002等');
        }

        // 验证每个引用的格式
        for (const ref of parsedRefs) {
            const standardInfo = this.getStandardInfo(ref.standardId);
            
            if (!standardInfo) {
                result.issues.push(`未找到标准 ${ref.standardId} 的详细信息`);
                result.suggestions.push(`请确认标准编号 ${ref.standardId} 是否正确`);
            } else {
                // 检查是否包含标准名称
                if (!content.includes(standardInfo.name)) {
                    result.suggestions.push(`建议在引用 ${ref.standardId} 时同时注明标准名称：${standardInfo.name}`);
                }
            }
        }

        return result;
    }

    /**
     * 生成带标准引用的AI回答
     * @param {string} question - 用户问题
     * @param {Object} context - 上下文信息
     * @returns {Promise<Object>} AI回答结果
     */
    async generateAnswerWithReferences(question, context = {}) {
        // 检查问题是否涉及标准相关内容
        const standardKeywords = ['标准', '规范', 'GB', 'HJ', '鉴别', '监测', '采样', '检测', '方法'];
        const expectsStandardRef = standardKeywords.some(keyword => 
            question.toLowerCase().includes(keyword.toLowerCase())
        );

        // 搜索相关知识
        const relevantKnowledge = this._searchRelevantKnowledge(question, context);

        // 构建增强的提示词
        const enhancedPrompt = this._buildEnhancedPrompt(question, relevantKnowledge, context);

        // 调用AI API（如果配置了）
        let aiResponse = null;
        if (typeof window !== 'undefined' && window.AIAssistant && window.AIAssistant.isConfigured()) {
            const result = await window.AIAssistant.callAPI(enhancedPrompt);
            if (result.success) {
                aiResponse = result.content;
            }
        }

        // 如果没有AI响应，使用知识库生成回答
        if (!aiResponse) {
            aiResponse = this._generateKnowledgeBasedAnswer(question, relevantKnowledge);
        }

        // 格式化标准引用
        const formatted = this.formatStandardReferences(aiResponse);

        // 验证标准引用格式
        const validation = this.validateStandardReferenceFormat(formatted.formattedContent, expectsStandardRef);

        return {
            content: formatted.formattedContent,
            references: formatted.references,
            hasReferences: formatted.hasReferences,
            validation: validation,
            relevantKnowledge: relevantKnowledge,
            timestamp: Date.now()
        };
    }

    /**
     * 搜索相关知识
     * @param {string} query - 查询内容
     * @param {Object} context - 上下文
     * @returns {Array} 相关知识列表
     */
    _searchRelevantKnowledge(query, context = {}) {
        const results = [];
        const queryLower = query.toLowerCase();

        // 关键词映射到标准类别
        const categoryKeywords = {
            hazwaste: ['危废', '危险废物', '鉴别', '腐蚀', '毒性', '易燃', '反应性'],
            water: ['水质', '地表水', '污水', '采样', '监测'],
            soil: ['土壤', '建设用地', '污染调查', '布点'],
            air: ['大气', '空气', '环境空气']
        };

        // 确定相关类别
        const relevantCategories = new Set();
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(kw => queryLower.includes(kw))) {
                relevantCategories.add(category);
            }
        }

        // 如果有上下文中的工位信息，添加相关类别
        if (context.workstationId) {
            const workstationCategoryMap = {
                'env-monitoring': 'water',
                'hazwaste-lab': 'hazwaste',
                'sampling-center': 'soil'
            };
            const category = workstationCategoryMap[context.workstationId];
            if (category) {
                relevantCategories.add(category);
            }
        }

        // 搜索知识库
        for (const [standardId, standard] of Object.entries(this.knowledgeBase)) {
            // 按类别过滤
            if (relevantCategories.size > 0 && !relevantCategories.has(standard.category)) {
                continue;
            }

            // 计算相关性得分
            let score = 0;
            
            // 标准名称匹配
            if (queryLower.includes(standard.name.toLowerCase())) {
                score += 10;
            }
            
            // 标准编号匹配
            if (queryLower.includes(standardId.toLowerCase())) {
                score += 15;
            }

            // 条款内容匹配
            for (const [clauseId, clauseContent] of Object.entries(standard.clauses || {})) {
                if (queryLower.includes(clauseContent.toLowerCase())) {
                    score += 5;
                }
            }

            if (score > 0) {
                results.push({
                    standardId,
                    standard,
                    score,
                    relevantClauses: this._findRelevantClauses(standard, query)
                });
            }
        }

        // 按相关性排序
        return results.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    /**
     * 查找相关条款
     * @param {Object} standard - 标准信息
     * @param {string} query - 查询内容
     * @returns {Array} 相关条款列表
     */
    _findRelevantClauses(standard, query) {
        const clauses = [];
        const queryLower = query.toLowerCase();

        for (const [clauseId, content] of Object.entries(standard.clauses || {})) {
            if (content.toLowerCase().includes(queryLower) || 
                queryLower.includes(content.toLowerCase())) {
                clauses.push({
                    clauseId,
                    content
                });
            }
        }

        return clauses;
    }

    /**
     * 构建增强的提示词
     * @param {string} question - 用户问题
     * @param {Array} relevantKnowledge - 相关知识
     * @param {Object} context - 上下文
     * @returns {string} 增强的提示词
     */
    _buildEnhancedPrompt(question, relevantKnowledge, context) {
        let prompt = `你是一位专业的环境监测领域助教，请回答以下问题。

问题：${question}

`;

        if (relevantKnowledge.length > 0) {
            prompt += `相关国家标准参考：
`;
            for (const item of relevantKnowledge) {
                prompt += `- ${item.standard.name}（${item.standardId}）
`;
                for (const clause of item.relevantClauses) {
                    prompt += `  第${clause.clauseId}条：${clause.content}
`;
                }
            }
            prompt += `
`;
        }

        prompt += `要求：
1. 回答必须准确、专业
2. 如果涉及国家标准，必须引用具体标准编号（如GB 5085.1-2007）和相关条款内容
3. 使用通俗易懂的语言解释专业术语
4. 如果问题涉及操作流程，请按步骤说明`;

        return prompt;
    }

    /**
     * 基于知识库生成回答
     * @param {string} question - 用户问题
     * @param {Array} relevantKnowledge - 相关知识
     * @returns {string} 生成的回答
     */
    _generateKnowledgeBasedAnswer(question, relevantKnowledge) {
        if (relevantKnowledge.length === 0) {
            return '抱歉，我暂时无法找到与您问题相关的专业资料。请尝试更具体地描述您的问题，或者查阅相关国家标准文档。';
        }

        let answer = '根据相关国家标准，';
        
        for (const item of relevantKnowledge) {
            answer += `\n\n根据${item.standard.name}（${item.standardId}）：`;
            
            for (const clause of item.relevantClauses) {
                answer += `\n- 第${clause.clauseId}条规定：${clause.content}`;
            }
        }

        answer += '\n\n如需了解更多详细内容，建议查阅上述标准的完整文本。';

        return answer;
    }

    /**
     * 获取所有可用的国家标准列表
     * @param {string} [category] - 可选的类别过滤
     * @returns {Array} 标准列表
     */
    getAvailableStandards(category = null) {
        const standards = [];
        
        for (const [id, standard] of Object.entries(this.knowledgeBase)) {
            if (!category || standard.category === category) {
                standards.push({
                    id: standard.id,
                    name: standard.name,
                    category: standard.category,
                    publishDate: standard.publishDate,
                    clauseCount: Object.keys(standard.clauses || {}).length
                });
            }
        }

        return standards.sort((a, b) => a.id.localeCompare(b.id));
    }

    /**
     * 添加自定义标准到知识库
     * @param {Object} standard - 标准信息
     * @returns {boolean} 是否添加成功
     */
    addStandard(standard) {
        if (!standard || !standard.id || !standard.name) {
            return false;
        }

        this.knowledgeBase[standard.id] = {
            id: standard.id,
            name: standard.name,
            category: standard.category || 'custom',
            publishDate: standard.publishDate || null,
            clauses: standard.clauses || {}
        };

        return true;
    }
}


// ================= 知识库管理服务 =================

/**
 * 国标分类枚举
 * Requirements: 6.2 - 按标准编号、发布日期、适用范围分类存储
 */
const StandardCategory = {
    HAZWASTE: 'hazwaste',       // 危险废物
    WATER: 'water',             // 水质监测
    SOIL: 'soil',               // 土壤监测
    AIR: 'air',                 // 大气监测
    GENERAL: 'general',         // 通用标准
    CUSTOM: 'custom'            // 自定义
};

/**
 * 国标分类中文名称映射
 */
const StandardCategoryNames = {
    [StandardCategory.HAZWASTE]: '危险废物',
    [StandardCategory.WATER]: '水质监测',
    [StandardCategory.SOIL]: '土壤监测',
    [StandardCategory.AIR]: '大气监测',
    [StandardCategory.GENERAL]: '通用标准',
    [StandardCategory.CUSTOM]: '自定义'
};

/**
 * 国标状态枚举
 */
const StandardStatus = {
    ACTIVE: 'active',           // 现行有效
    SUPERSEDED: 'superseded',   // 已被替代
    ABOLISHED: 'abolished'      // 已废止
};

/**
 * 国标状态中文名称映射
 */
const StandardStatusNames = {
    [StandardStatus.ACTIVE]: '现行有效',
    [StandardStatus.SUPERSEDED]: '已被替代',
    [StandardStatus.ABOLISHED]: '已废止'
};

/**
 * 知识库管理服务类
 * 提供国标分类存储、浏览和搜索功能
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */
class KnowledgeBaseService {
    constructor() {
        this.supabase = null;
        this.standards = new Map();
        this.documents = new Map();
        this._initializeFromDatabase();
    }

    /**
     * 初始化服务
     * @param {Object} supabase - Supabase客户端实例
     */
    initialize(supabase) {
        this.supabase = supabase;
    }

    /**
     * 从预设数据库初始化标准数据
     * @private
     */
    _initializeFromDatabase() {
        // 将NATIONAL_STANDARDS_DATABASE转换为结构化格式
        for (const [id, standard] of Object.entries(NATIONAL_STANDARDS_DATABASE)) {
            this.standards.set(id, {
                id: id,
                name: standard.name,
                englishName: standard.englishName || null,
                category: standard.category,
                status: StandardStatus.ACTIVE,
                publishDate: standard.publishDate ? new Date(standard.publishDate) : null,
                implementationDate: standard.implementationDate ? new Date(standard.implementationDate) : null,
                scope: standard.scope || this._inferScope(standard.category),
                abstract: standard.abstract || null,
                supersedes: standard.supersedes || null,
                supersededBy: standard.supersededBy || null,
                relatedStandards: standard.relatedStandards || [],
                clauses: standard.clauses || {},
                tables: standard.tables || [],
                appendices: standard.appendices || [],
                documentId: standard.documentId || null,
                sourceUrl: standard.sourceUrl || null,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }
    }

    /**
     * 根据分类推断适用范围
     * @param {string} category - 标准分类
     * @returns {string} 适用范围描述
     * @private
     */
    _inferScope(category) {
        const scopeMap = {
            [StandardCategory.HAZWASTE]: '危险废物鉴别、处理和管理',
            [StandardCategory.WATER]: '地表水、地下水和污水监测',
            [StandardCategory.SOIL]: '土壤污染调查和监测',
            [StandardCategory.AIR]: '环境空气质量监测',
            [StandardCategory.GENERAL]: '环境监测通用技术要求'
        };
        return scopeMap[category] || '环境监测相关领域';
    }

    // ================= 国标分类存储 (Requirements: 6.2) =================

    /**
     * 按标准编号获取标准
     * @param {string} standardId - 标准编号
     * @returns {Object|null} 标准信息
     */
    getStandardById(standardId) {
        const normalized = this._normalizeStandardId(standardId);
        return this.standards.get(normalized) || null;
    }

    /**
     * 按分类获取标准列表
     * @param {string} category - 标准分类
     * @returns {Array} 标准列表
     */
    getStandardsByCategory(category) {
        const results = [];
        for (const standard of this.standards.values()) {
            if (standard.category === category) {
                results.push(standard);
            }
        }
        return results.sort((a, b) => a.id.localeCompare(b.id));
    }

    /**
     * 按发布日期范围获取标准列表
     * @param {Date|string} startDate - 开始日期
     * @param {Date|string} endDate - 结束日期
     * @returns {Array} 标准列表
     */
    getStandardsByDateRange(startDate, endDate) {
        const start = startDate instanceof Date ? startDate : new Date(startDate);
        const end = endDate instanceof Date ? endDate : new Date(endDate);
        
        const results = [];
        for (const standard of this.standards.values()) {
            if (standard.publishDate) {
                const pubDate = standard.publishDate instanceof Date 
                    ? standard.publishDate 
                    : new Date(standard.publishDate);
                if (pubDate >= start && pubDate <= end) {
                    results.push(standard);
                }
            }
        }
        return results.sort((a, b) => {
            const dateA = a.publishDate instanceof Date ? a.publishDate : new Date(a.publishDate);
            const dateB = b.publishDate instanceof Date ? b.publishDate : new Date(b.publishDate);
            return dateB - dateA; // 按日期降序
        });
    }

    /**
     * 按适用范围搜索标准
     * @param {string} scopeKeyword - 适用范围关键词
     * @returns {Array} 标准列表
     */
    getStandardsByScope(scopeKeyword) {
        const keyword = scopeKeyword.toLowerCase();
        const results = [];
        for (const standard of this.standards.values()) {
            if (standard.scope && standard.scope.toLowerCase().includes(keyword)) {
                results.push(standard);
            }
            // 也搜索标准名称
            if (standard.name && standard.name.toLowerCase().includes(keyword)) {
                if (!results.includes(standard)) {
                    results.push(standard);
                }
            }
        }
        return results;
    }

    /**
     * 获取所有标准列表（支持多种排序方式）
     * @param {Object} options - 选项
     * @param {string} options.sortBy - 排序字段 ('id'|'name'|'publishDate'|'category')
     * @param {string} options.sortOrder - 排序方向 ('asc'|'desc')
     * @param {string} options.category - 过滤分类
     * @param {string} options.status - 过滤状态
     * @returns {Array} 标准列表
     */
    getAllStandards(options = {}) {
        const { sortBy = 'id', sortOrder = 'asc', category = null, status = null } = options;
        
        let results = Array.from(this.standards.values());
        
        // 过滤
        if (category) {
            results = results.filter(s => s.category === category);
        }
        if (status) {
            results = results.filter(s => s.status === status);
        }
        
        // 排序
        results.sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'publishDate':
                    valueA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
                    valueB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
                    break;
                case 'name':
                    valueA = a.name || '';
                    valueB = b.name || '';
                    break;
                case 'category':
                    valueA = a.category || '';
                    valueB = b.category || '';
                    break;
                default:
                    valueA = a.id || '';
                    valueB = b.id || '';
            }
            
            if (typeof valueA === 'string') {
                return sortOrder === 'asc' 
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }
            return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        });
        
        return results;
    }

    /**
     * 获取标准分类统计
     * @returns {Object} 各分类的标准数量
     */
    getCategoryStats() {
        const stats = {};
        for (const category of Object.values(StandardCategory)) {
            stats[category] = {
                count: 0,
                name: StandardCategoryNames[category]
            };
        }
        
        for (const standard of this.standards.values()) {
            if (stats[standard.category]) {
                stats[standard.category].count++;
            }
        }
        
        return stats;
    }

    /**
     * 获取标准的特定条款
     * @param {string} standardId - 标准编号
     * @param {string} clauseId - 条款编号
     * @returns {Object|null} 条款信息
     */
    getStandardClause(standardId, clauseId) {
        const standard = this.getStandardById(standardId);
        if (!standard || !standard.clauses) {
            return null;
        }
        
        const content = standard.clauses[clauseId];
        if (!content) {
            return null;
        }
        
        return {
            standardId: standard.id,
            standardName: standard.name,
            clauseId: clauseId,
            content: content,
            category: standard.category
        };
    }

    /**
     * 添加或更新标准
     * @param {Object} standardData - 标准数据
     * @returns {Object} 添加/更新后的标准
     */
    addOrUpdateStandard(standardData) {
        if (!standardData || !standardData.id) {
            throw new Error('标准编号不能为空');
        }
        
        const normalized = this._normalizeStandardId(standardData.id);
        const existing = this.standards.get(normalized);
        
        const standard = {
            id: normalized,
            name: standardData.name || existing?.name || normalized,
            englishName: standardData.englishName || existing?.englishName || null,
            category: standardData.category || existing?.category || StandardCategory.GENERAL,
            status: standardData.status || existing?.status || StandardStatus.ACTIVE,
            publishDate: standardData.publishDate ? new Date(standardData.publishDate) : existing?.publishDate || null,
            implementationDate: standardData.implementationDate ? new Date(standardData.implementationDate) : existing?.implementationDate || null,
            scope: standardData.scope || existing?.scope || null,
            abstract: standardData.abstract || existing?.abstract || null,
            supersedes: standardData.supersedes || existing?.supersedes || null,
            supersededBy: standardData.supersededBy || existing?.supersededBy || null,
            relatedStandards: standardData.relatedStandards || existing?.relatedStandards || [],
            clauses: standardData.clauses || existing?.clauses || {},
            tables: standardData.tables || existing?.tables || [],
            appendices: standardData.appendices || existing?.appendices || [],
            documentId: standardData.documentId || existing?.documentId || null,
            sourceUrl: standardData.sourceUrl || existing?.sourceUrl || null,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        
        this.standards.set(normalized, standard);
        
        // 同步到NATIONAL_STANDARDS_DATABASE
        NATIONAL_STANDARDS_DATABASE[normalized] = {
            id: standard.id,
            name: standard.name,
            category: standard.category,
            publishDate: standard.publishDate ? this._formatDate(standard.publishDate) : null,
            clauses: standard.clauses
        };
        
        return standard;
    }

    /**
     * 删除标准
     * @param {string} standardId - 标准编号
     * @returns {boolean} 是否删除成功
     */
    deleteStandard(standardId) {
        const normalized = this._normalizeStandardId(standardId);
        const deleted = this.standards.delete(normalized);
        if (deleted) {
            delete NATIONAL_STANDARDS_DATABASE[normalized];
        }
        return deleted;
    }

    // ================= 标准浏览界面数据 =================

    /**
     * 获取标准浏览数据（用于UI渲染）
     * @param {Object} filters - 过滤条件
     * @returns {Object} 浏览数据
     */
    getStandardsBrowseData(filters = {}) {
        const { category, searchKeyword, sortBy = 'category', sortOrder = 'asc' } = filters;
        
        let standards = this.getAllStandards({ sortBy, sortOrder, category });
        
        // 关键词搜索
        if (searchKeyword) {
            const keyword = searchKeyword.toLowerCase();
            standards = standards.filter(s => 
                s.id.toLowerCase().includes(keyword) ||
                s.name.toLowerCase().includes(keyword) ||
                (s.scope && s.scope.toLowerCase().includes(keyword))
            );
        }
        
        // 按分类分组
        const groupedByCategory = {};
        for (const standard of standards) {
            const cat = standard.category || StandardCategory.GENERAL;
            if (!groupedByCategory[cat]) {
                groupedByCategory[cat] = {
                    category: cat,
                    categoryName: StandardCategoryNames[cat] || cat,
                    standards: []
                };
            }
            groupedByCategory[cat].standards.push({
                id: standard.id,
                name: standard.name,
                publishDate: standard.publishDate ? this._formatDate(standard.publishDate) : '未知',
                scope: standard.scope || '未指定',
                status: standard.status,
                statusName: StandardStatusNames[standard.status] || standard.status,
                clauseCount: Object.keys(standard.clauses || {}).length
            });
        }
        
        return {
            categories: Object.values(groupedByCategory),
            totalCount: standards.length,
            categoryStats: this.getCategoryStats()
        };
    }

    /**
     * 获取标准详情（用于UI渲染）
     * @param {string} standardId - 标准编号
     * @returns {Object|null} 标准详情
     */
    getStandardDetail(standardId) {
        const standard = this.getStandardById(standardId);
        if (!standard) {
            return null;
        }
        
        // 格式化条款列表
        const clauseList = [];
        for (const [clauseId, content] of Object.entries(standard.clauses || {})) {
            clauseList.push({
                id: clauseId,
                content: content
            });
        }
        // 按条款编号排序
        clauseList.sort((a, b) => {
            const numA = parseFloat(a.id) || 0;
            const numB = parseFloat(b.id) || 0;
            return numA - numB;
        });
        
        return {
            id: standard.id,
            name: standard.name,
            englishName: standard.englishName,
            category: standard.category,
            categoryName: StandardCategoryNames[standard.category] || standard.category,
            status: standard.status,
            statusName: StandardStatusNames[standard.status] || standard.status,
            publishDate: standard.publishDate ? this._formatDate(standard.publishDate) : '未知',
            implementationDate: standard.implementationDate ? this._formatDate(standard.implementationDate) : '未知',
            scope: standard.scope || '未指定',
            abstract: standard.abstract,
            supersedes: standard.supersedes,
            supersededBy: standard.supersededBy,
            relatedStandards: standard.relatedStandards,
            clauses: clauseList,
            tables: standard.tables,
            appendices: standard.appendices,
            sourceUrl: standard.sourceUrl
        };
    }

    // ================= 辅助方法 =================

    /**
     * 标准化标准编号
     * @param {string} rawId - 原始编号
     * @returns {string} 标准化后的编号
     * @private
     */
    _normalizeStandardId(rawId) {
        if (!rawId) return '';
        
        let normalized = rawId.replace(/\s+/g, ' ').trim();
        normalized = normalized
            .replace(/GB\s*\/?\s*T\s*/gi, 'GB/T ')
            .replace(/HJ\s*\/?\s*T\s*/gi, 'HJ/T ')
            .replace(/GB\s+/gi, 'GB ')
            .replace(/HJ\s+/gi, 'HJ ');
        normalized = normalized.replace(/(\d)\s*-\s*(\d)/g, '$1-$2');
        
        return normalized.trim();
    }

    /**
     * 格式化日期
     * @param {Date|string} date - 日期
     * @returns {string} 格式化后的日期字符串
     * @private
     */
    _formatDate(date) {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    }

    // ================= 数据库同步方法 =================

    /**
     * 从Supabase加载标准数据
     * @returns {Promise<void>}
     */
    async loadFromDatabase() {
        if (!this.supabase) {
            console.warn('Supabase未初始化，使用本地数据');
            return;
        }
        
        try {
            const { data, error } = await this.supabase
                .from('vs_national_standards')
                .select('*')
                .order('id');
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                for (const row of data) {
                    this.standards.set(row.id, {
                        id: row.id,
                        name: row.name,
                        englishName: row.english_name,
                        category: row.category,
                        status: row.status,
                        publishDate: row.publish_date ? new Date(row.publish_date) : null,
                        implementationDate: row.implementation_date ? new Date(row.implementation_date) : null,
                        scope: row.scope,
                        abstract: row.abstract,
                        supersedes: row.supersedes,
                        supersededBy: row.superseded_by,
                        relatedStandards: row.related_standards || [],
                        clauses: row.clauses || {},
                        tables: row.tables || [],
                        appendices: row.appendices || [],
                        documentId: row.document_id,
                        sourceUrl: row.source_url,
                        createdAt: new Date(row.created_at).getTime(),
                        updatedAt: new Date(row.updated_at).getTime()
                    });
                }
            }
        } catch (error) {
            console.error('加载标准数据失败:', error);
        }
    }

    /**
     * 保存标准到Supabase
     * @param {Object} standard - 标准数据
     * @returns {Promise<Object>} 保存结果
     */
    async saveToDatabase(standard) {
        if (!this.supabase) {
            console.warn('Supabase未初始化，仅保存到本地');
            return { success: true, local: true };
        }
        
        try {
            const { data, error } = await this.supabase
                .from('vs_national_standards')
                .upsert({
                    id: standard.id,
                    name: standard.name,
                    english_name: standard.englishName,
                    category: standard.category,
                    status: standard.status,
                    publish_date: standard.publishDate ? this._formatDate(standard.publishDate) : null,
                    implementation_date: standard.implementationDate ? this._formatDate(standard.implementationDate) : null,
                    scope: standard.scope,
                    abstract: standard.abstract,
                    supersedes: standard.supersedes,
                    superseded_by: standard.supersededBy,
                    related_standards: standard.relatedStandards,
                    clauses: standard.clauses,
                    tables: standard.tables,
                    appendices: standard.appendices,
                    document_id: standard.documentId,
                    source_url: standard.sourceUrl
                }, { onConflict: 'id' });
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('保存标准数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    // ================= 知识库搜索 (Requirements: 6.5) =================

    /**
     * 关键词搜索
     * 搜索知识库中包含指定关键词的内容
     * @param {string} query - 搜索关键词
     * @param {Object} filters - 过滤条件
     * @param {string} [filters.category] - 标准分类过滤
     * @param {string} [filters.type] - 内容类型过滤 ('standard'|'document'|'all')
     * @param {number} [filters.limit] - 返回结果数量限制
     * @returns {Promise<Array>} 搜索结果列表，每个结果包含关键词
     */
    async search(query, filters = {}) {
        if (!query || typeof query !== 'string') {
            return [];
        }

        const keyword = query.trim().toLowerCase();
        if (keyword.length === 0) {
            return [];
        }

        const { category = null, type = 'all', limit = 50 } = filters;
        const results = [];

        // 搜索国家标准
        if (type === 'all' || type === 'standard') {
            for (const standard of this.standards.values()) {
                // 分类过滤
                if (category && standard.category !== category) {
                    continue;
                }

                const matchInfo = this._matchStandardWithKeyword(standard, keyword);
                if (matchInfo.matched) {
                    results.push({
                        type: 'standard',
                        id: standard.id,
                        title: standard.name,
                        category: standard.category,
                        categoryName: StandardCategoryNames[standard.category] || standard.category,
                        matchedFields: matchInfo.fields,
                        matchedContent: matchInfo.content,
                        relevanceScore: matchInfo.score,
                        source: {
                            standardId: standard.id,
                            standardName: standard.name,
                            publishDate: standard.publishDate ? this._formatDate(standard.publishDate) : null
                        }
                    });
                }
            }
        }

        // 搜索知识文档
        if (type === 'all' || type === 'document') {
            for (const doc of this.documents.values()) {
                const matchInfo = this._matchDocumentWithKeyword(doc, keyword);
                if (matchInfo.matched) {
                    results.push({
                        type: 'document',
                        id: doc.id,
                        title: doc.title || doc.name,
                        category: doc.category || 'general',
                        categoryName: doc.categoryName || '通用文档',
                        matchedFields: matchInfo.fields,
                        matchedContent: matchInfo.content,
                        relevanceScore: matchInfo.score,
                        source: {
                            documentId: doc.id,
                            documentTitle: doc.title || doc.name
                        }
                    });
                }
            }
        }

        // 按相关性得分排序
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // 限制返回数量
        return results.slice(0, limit);
    }

    /**
     * 检查标准是否匹配关键词
     * @param {Object} standard - 标准对象
     * @param {string} keyword - 关键词（已转小写）
     * @returns {Object} 匹配信息 { matched, fields, content, score }
     * @private
     */
    _matchStandardWithKeyword(standard, keyword) {
        const matchedFields = [];
        const matchedContent = [];
        let score = 0;

        // 搜索标准编号（权重最高）
        if (standard.id && standard.id.toLowerCase().includes(keyword)) {
            matchedFields.push('id');
            matchedContent.push(standard.id);
            score += 10;
        }

        // 搜索标准名称（权重高）
        if (standard.name && standard.name.toLowerCase().includes(keyword)) {
            matchedFields.push('name');
            matchedContent.push(standard.name);
            score += 8;
        }

        // 搜索适用范围
        if (standard.scope && standard.scope.toLowerCase().includes(keyword)) {
            matchedFields.push('scope');
            matchedContent.push(standard.scope);
            score += 5;
        }

        // 搜索摘要
        if (standard.abstract && standard.abstract.toLowerCase().includes(keyword)) {
            matchedFields.push('abstract');
            matchedContent.push(this._truncateText(standard.abstract, 200));
            score += 4;
        }

        // 搜索条款内容
        if (standard.clauses) {
            for (const [clauseId, clauseContent] of Object.entries(standard.clauses)) {
                if (clauseContent && clauseContent.toLowerCase().includes(keyword)) {
                    matchedFields.push(`clause:${clauseId}`);
                    matchedContent.push(`[${clauseId}] ${this._truncateText(clauseContent, 150)}`);
                    score += 3;
                    // 只记录前3个匹配的条款
                    if (matchedContent.filter(c => c.startsWith('[')).length >= 3) {
                        break;
                    }
                }
            }
        }

        return {
            matched: matchedFields.length > 0,
            fields: matchedFields,
            content: matchedContent,
            score: score
        };
    }

    /**
     * 检查文档是否匹配关键词
     * @param {Object} doc - 文档对象
     * @param {string} keyword - 关键词（已转小写）
     * @returns {Object} 匹配信息 { matched, fields, content, score }
     * @private
     */
    _matchDocumentWithKeyword(doc, keyword) {
        const matchedFields = [];
        const matchedContent = [];
        let score = 0;

        // 搜索文档标题（权重高）
        const title = doc.title || doc.name || '';
        if (title.toLowerCase().includes(keyword)) {
            matchedFields.push('title');
            matchedContent.push(title);
            score += 8;
        }

        // 搜索文档描述
        if (doc.description && doc.description.toLowerCase().includes(keyword)) {
            matchedFields.push('description');
            matchedContent.push(this._truncateText(doc.description, 200));
            score += 5;
        }

        // 搜索文档内容
        if (doc.content && doc.content.toLowerCase().includes(keyword)) {
            matchedFields.push('content');
            // 提取包含关键词的上下文
            const context = this._extractKeywordContext(doc.content, keyword, 100);
            matchedContent.push(context);
            score += 4;
        }

        // 搜索标签
        if (doc.tags && Array.isArray(doc.tags)) {
            for (const tag of doc.tags) {
                if (tag.toLowerCase().includes(keyword)) {
                    matchedFields.push('tags');
                    matchedContent.push(`标签: ${tag}`);
                    score += 3;
                    break;
                }
            }
        }

        return {
            matched: matchedFields.length > 0,
            fields: matchedFields,
            content: matchedContent,
            score: score
        };
    }

    /**
     * 语义搜索（基于简单的TF-IDF相似度）
     * 返回与查询语义最相关的结果
     * @param {string} query - 搜索查询
     * @param {number} topK - 返回结果数量
     * @returns {Promise<Array>} 搜索结果列表
     */
    async semanticSearch(query, topK = 10) {
        if (!query || typeof query !== 'string') {
            return [];
        }

        const queryTerms = this._tokenize(query);
        if (queryTerms.length === 0) {
            return [];
        }

        const results = [];

        // 计算每个标准的相似度得分
        for (const standard of this.standards.values()) {
            const score = this._calculateSemanticScore(standard, queryTerms);
            if (score > 0) {
                results.push({
                    type: 'standard',
                    id: standard.id,
                    title: standard.name,
                    category: standard.category,
                    categoryName: StandardCategoryNames[standard.category] || standard.category,
                    semanticScore: score,
                    source: {
                        standardId: standard.id,
                        standardName: standard.name,
                        publishDate: standard.publishDate ? this._formatDate(standard.publishDate) : null
                    }
                });
            }
        }

        // 计算每个文档的相似度得分
        for (const doc of this.documents.values()) {
            const score = this._calculateDocumentSemanticScore(doc, queryTerms);
            if (score > 0) {
                results.push({
                    type: 'document',
                    id: doc.id,
                    title: doc.title || doc.name,
                    category: doc.category || 'general',
                    categoryName: doc.categoryName || '通用文档',
                    semanticScore: score,
                    source: {
                        documentId: doc.id,
                        documentTitle: doc.title || doc.name
                    }
                });
            }
        }

        // 按语义得分排序
        results.sort((a, b) => b.semanticScore - a.semanticScore);

        return results.slice(0, topK);
    }

    /**
     * 分词处理
     * @param {string} text - 输入文本
     * @returns {Array<string>} 分词结果
     * @private
     */
    _tokenize(text) {
        if (!text) return [];
        
        // 简单分词：按空格、标点分割，过滤停用词
        const stopWords = new Set(['的', '是', '在', '和', '与', '或', '等', '及', '了', '对', '为', '中', '有', '将', '被', 'the', 'a', 'an', 'is', 'are', 'of', 'in', 'to', 'for', 'and', 'or']);
        
        const tokens = text
            .toLowerCase()
            .replace(/[，。、；：""''（）【】《》？！\s]+/g, ' ')
            .split(' ')
            .filter(token => token.length > 0 && !stopWords.has(token));
        
        return [...new Set(tokens)]; // 去重
    }

    /**
     * 计算标准的语义相似度得分
     * @param {Object} standard - 标准对象
     * @param {Array<string>} queryTerms - 查询词列表
     * @returns {number} 相似度得分
     * @private
     */
    _calculateSemanticScore(standard, queryTerms) {
        let score = 0;
        
        // 构建标准的文本内容
        const textParts = [
            standard.id || '',
            standard.name || '',
            standard.scope || '',
            standard.abstract || ''
        ];
        
        // 添加条款内容
        if (standard.clauses) {
            for (const content of Object.values(standard.clauses)) {
                textParts.push(content || '');
            }
        }
        
        const fullText = textParts.join(' ').toLowerCase();
        const docTerms = this._tokenize(fullText);
        
        // 计算词项匹配得分
        for (const queryTerm of queryTerms) {
            // 完全匹配
            if (docTerms.includes(queryTerm)) {
                score += 2;
            }
            // 部分匹配
            else if (docTerms.some(term => term.includes(queryTerm) || queryTerm.includes(term))) {
                score += 1;
            }
        }
        
        // 标准编号精确匹配加分
        if (standard.id && queryTerms.some(term => standard.id.toLowerCase().includes(term))) {
            score += 5;
        }
        
        // 标准名称匹配加分
        if (standard.name) {
            const nameTerms = this._tokenize(standard.name);
            const nameMatchCount = queryTerms.filter(qt => nameTerms.some(nt => nt.includes(qt) || qt.includes(nt))).length;
            score += nameMatchCount * 2;
        }
        
        return score;
    }

    /**
     * 计算文档的语义相似度得分
     * @param {Object} doc - 文档对象
     * @param {Array<string>} queryTerms - 查询词列表
     * @returns {number} 相似度得分
     * @private
     */
    _calculateDocumentSemanticScore(doc, queryTerms) {
        let score = 0;
        
        // 构建文档的文本内容
        const textParts = [
            doc.title || doc.name || '',
            doc.description || '',
            doc.content || ''
        ];
        
        if (doc.tags && Array.isArray(doc.tags)) {
            textParts.push(doc.tags.join(' '));
        }
        
        const fullText = textParts.join(' ').toLowerCase();
        const docTerms = this._tokenize(fullText);
        
        // 计算词项匹配得分
        for (const queryTerm of queryTerms) {
            if (docTerms.includes(queryTerm)) {
                score += 2;
            }
            else if (docTerms.some(term => term.includes(queryTerm) || queryTerm.includes(term))) {
                score += 1;
            }
        }
        
        // 标题匹配加分
        const title = doc.title || doc.name || '';
        if (title) {
            const titleTerms = this._tokenize(title);
            const titleMatchCount = queryTerms.filter(qt => titleTerms.some(tt => tt.includes(qt) || qt.includes(tt))).length;
            score += titleMatchCount * 3;
        }
        
        return score;
    }

    /**
     * 截断文本
     * @param {string} text - 原始文本
     * @param {number} maxLength - 最大长度
     * @returns {string} 截断后的文本
     * @private
     */
    _truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) {
            return text || '';
        }
        return text.substring(0, maxLength) + '...';
    }

    /**
     * 提取关键词上下文
     * @param {string} text - 原始文本
     * @param {string} keyword - 关键词
     * @param {number} contextLength - 上下文长度
     * @returns {string} 包含关键词的上下文
     * @private
     */
    _extractKeywordContext(text, keyword, contextLength) {
        if (!text || !keyword) {
            return '';
        }
        
        const lowerText = text.toLowerCase();
        const index = lowerText.indexOf(keyword);
        
        if (index === -1) {
            return this._truncateText(text, contextLength * 2);
        }
        
        const start = Math.max(0, index - contextLength);
        const end = Math.min(text.length, index + keyword.length + contextLength);
        
        let context = text.substring(start, end);
        if (start > 0) context = '...' + context;
        if (end < text.length) context = context + '...';
        
        return context;
    }

    // ================= 版本历史管理 (Requirements: 6.3) =================

    /**
     * 创建文档版本记录
     * 在更新文档前调用，保存当前版本到历史记录
     * @param {string} documentId - 文档ID
     * @param {Object} currentDocument - 当前文档数据
     * @param {string} changeSummary - 更新内容摘要
     * @param {string} changedBy - 更新者ID
     * @returns {Promise<Object>} 创建的版本记录
     */
    async createDocumentVersion(documentId, currentDocument, changeSummary, changedBy) {
        if (!documentId || !currentDocument) {
            throw new Error('文档ID和文档数据不能为空');
        }

        // 获取当前最大版本号
        const currentVersionNumber = await this._getLatestVersionNumber(documentId);
        const newVersionNumber = currentVersionNumber + 1;

        const versionRecord = {
            id: this._generateVersionId(),
            documentId: documentId,
            versionNumber: newVersionNumber,
            title: currentDocument.title || '',
            content: currentDocument.content || '',
            fileUrl: currentDocument.fileUrl || currentDocument.file_url || null,
            changeSummary: changeSummary || '文档更新',
            changedBy: changedBy || 'system',
            createdAt: Date.now()
        };

        // 保存到本地缓存
        if (!this._documentVersions) {
            this._documentVersions = new Map();
        }
        if (!this._documentVersions.has(documentId)) {
            this._documentVersions.set(documentId, []);
        }
        this._documentVersions.get(documentId).push(versionRecord);

        // 保存到数据库
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_document_versions')
                    .insert({
                        id: versionRecord.id,
                        document_id: documentId,
                        version_number: newVersionNumber,
                        title: versionRecord.title,
                        content: versionRecord.content,
                        file_url: versionRecord.fileUrl,
                        change_summary: versionRecord.changeSummary,
                        changed_by: versionRecord.changedBy
                    });

                if (error) {
                    console.error('保存版本记录到数据库失败:', error);
                }
            } catch (error) {
                console.error('保存版本记录失败:', error);
            }
        }

        return versionRecord;
    }

    /**
     * 获取文档的版本历史列表
     * @param {string} documentId - 文档ID
     * @returns {Promise<Array>} 版本历史列表（按版本号降序）
     */
    async getDocumentVersionHistory(documentId) {
        if (!documentId) {
            return [];
        }

        // 优先从数据库获取
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_document_versions')
                    .select('*')
                    .eq('document_id', documentId)
                    .order('version_number', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    return data.map(row => ({
                        id: row.id,
                        documentId: row.document_id,
                        versionNumber: row.version_number,
                        title: row.title,
                        content: row.content,
                        fileUrl: row.file_url,
                        changeSummary: row.change_summary,
                        changedBy: row.changed_by,
                        createdAt: new Date(row.created_at).getTime()
                    }));
                }
            } catch (error) {
                console.error('从数据库获取版本历史失败:', error);
            }
        }

        // 从本地缓存获取
        if (this._documentVersions && this._documentVersions.has(documentId)) {
            const versions = this._documentVersions.get(documentId);
            return [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
        }

        return [];
    }

    /**
     * 获取文档的特定版本
     * @param {string} documentId - 文档ID
     * @param {number} versionNumber - 版本号
     * @returns {Promise<Object|null>} 版本数据
     */
    async getDocumentVersion(documentId, versionNumber) {
        if (!documentId || versionNumber === undefined) {
            return null;
        }

        // 优先从数据库获取
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_document_versions')
                    .select('*')
                    .eq('document_id', documentId)
                    .eq('version_number', versionNumber)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                if (data) {
                    return {
                        id: data.id,
                        documentId: data.document_id,
                        versionNumber: data.version_number,
                        title: data.title,
                        content: data.content,
                        fileUrl: data.file_url,
                        changeSummary: data.change_summary,
                        changedBy: data.changed_by,
                        createdAt: new Date(data.created_at).getTime()
                    };
                }
            } catch (error) {
                console.error('从数据库获取版本失败:', error);
            }
        }

        // 从本地缓存获取
        if (this._documentVersions && this._documentVersions.has(documentId)) {
            const versions = this._documentVersions.get(documentId);
            return versions.find(v => v.versionNumber === versionNumber) || null;
        }

        return null;
    }

    /**
     * 回滚文档到指定版本
     * @param {string} documentId - 文档ID
     * @param {number} targetVersionNumber - 目标版本号
     * @param {string} rolledBackBy - 执行回滚的用户ID
     * @returns {Promise<Object>} 回滚结果
     */
    async rollbackDocumentToVersion(documentId, targetVersionNumber, rolledBackBy) {
        if (!documentId || targetVersionNumber === undefined) {
            throw new Error('文档ID和目标版本号不能为空');
        }

        // 获取目标版本数据
        const targetVersion = await this.getDocumentVersion(documentId, targetVersionNumber);
        if (!targetVersion) {
            throw new Error(`版本 ${targetVersionNumber} 不存在`);
        }

        // 获取当前文档数据
        let currentDocument = null;
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_knowledge_documents')
                    .select('*')
                    .eq('id', documentId)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                if (data) {
                    currentDocument = {
                        id: data.id,
                        title: data.title,
                        content: data.content,
                        fileUrl: data.file_url
                    };
                }
            } catch (error) {
                console.error('获取当前文档失败:', error);
            }
        }

        // 如果有当前文档，先保存当前版本到历史
        if (currentDocument) {
            await this.createDocumentVersion(
                documentId,
                currentDocument,
                `回滚前备份（回滚到版本 ${targetVersionNumber}）`,
                rolledBackBy || 'system'
            );
        }

        // 更新文档为目标版本的内容
        const updatedDocument = {
            title: targetVersion.title,
            content: targetVersion.content,
            fileUrl: targetVersion.fileUrl
        };

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('vs_knowledge_documents')
                    .update({
                        title: updatedDocument.title,
                        content: updatedDocument.content,
                        file_url: updatedDocument.fileUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', documentId);

                if (error) throw error;
            } catch (error) {
                console.error('更新文档失败:', error);
                throw new Error('回滚失败：无法更新文档');
            }
        }

        // 更新本地缓存
        if (this.documents.has(documentId)) {
            const doc = this.documents.get(documentId);
            doc.title = updatedDocument.title;
            doc.content = updatedDocument.content;
            doc.fileUrl = updatedDocument.fileUrl;
            doc.updatedAt = Date.now();
        }

        return {
            success: true,
            documentId: documentId,
            rolledBackToVersion: targetVersionNumber,
            previousTitle: currentDocument?.title,
            newTitle: updatedDocument.title,
            rolledBackBy: rolledBackBy || 'system',
            rolledBackAt: Date.now()
        };
    }

    /**
     * 更新文档并自动创建版本记录
     * @param {string} documentId - 文档ID
     * @param {Object} updates - 更新内容
     * @param {string} changeSummary - 更新摘要
     * @param {string} changedBy - 更新者ID
     * @returns {Promise<Object>} 更新结果
     */
    async updateDocumentWithVersion(documentId, updates, changeSummary, changedBy) {
        if (!documentId || !updates) {
            throw new Error('文档ID和更新内容不能为空');
        }

        // 获取当前文档
        let currentDocument = null;
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_knowledge_documents')
                    .select('*')
                    .eq('id', documentId)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                if (data) {
                    currentDocument = {
                        id: data.id,
                        title: data.title,
                        content: data.content,
                        fileUrl: data.file_url
                    };
                }
            } catch (error) {
                console.error('获取当前文档失败:', error);
            }
        }

        // 如果文档存在，先保存当前版本
        if (currentDocument) {
            await this.createDocumentVersion(
                documentId,
                currentDocument,
                changeSummary || '文档更新',
                changedBy || 'system'
            );
        }

        // 更新文档
        if (this.supabase) {
            try {
                const updateData = {
                    updated_at: new Date().toISOString()
                };
                if (updates.title !== undefined) updateData.title = updates.title;
                if (updates.content !== undefined) updateData.content = updates.content;
                if (updates.fileUrl !== undefined) updateData.file_url = updates.fileUrl;
                if (updates.description !== undefined) updateData.description = updates.description;

                const { error } = await this.supabase
                    .from('vs_knowledge_documents')
                    .update(updateData)
                    .eq('id', documentId);

                if (error) throw error;
            } catch (error) {
                console.error('更新文档失败:', error);
                throw new Error('更新文档失败');
            }
        }

        // 更新本地缓存
        if (this.documents.has(documentId)) {
            const doc = this.documents.get(documentId);
            Object.assign(doc, updates);
            doc.updatedAt = Date.now();
        }

        return {
            success: true,
            documentId: documentId,
            updatedFields: Object.keys(updates),
            changedBy: changedBy || 'system',
            updatedAt: Date.now()
        };
    }

    /**
     * 获取文档的最新版本号
     * @param {string} documentId - 文档ID
     * @returns {Promise<number>} 最新版本号（如果没有版本记录则返回0）
     * @private
     */
    async _getLatestVersionNumber(documentId) {
        // 优先从数据库获取
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_document_versions')
                    .select('version_number')
                    .eq('document_id', documentId)
                    .order('version_number', { ascending: false })
                    .limit(1);

                if (error) throw error;

                if (data && data.length > 0) {
                    return data[0].version_number;
                }
            } catch (error) {
                console.error('获取最新版本号失败:', error);
            }
        }

        // 从本地缓存获取
        if (this._documentVersions && this._documentVersions.has(documentId)) {
            const versions = this._documentVersions.get(documentId);
            if (versions.length > 0) {
                return Math.max(...versions.map(v => v.versionNumber));
            }
        }

        return 0;
    }

    /**
     * 生成版本记录ID
     * @returns {string} 唯一ID
     * @private
     */
    _generateVersionId() {
        return 'ver_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 比较两个版本的差异
     * @param {string} documentId - 文档ID
     * @param {number} versionA - 版本A编号
     * @param {number} versionB - 版本B编号
     * @returns {Promise<Object>} 差异信息
     */
    async compareVersions(documentId, versionA, versionB) {
        const verA = await this.getDocumentVersion(documentId, versionA);
        const verB = await this.getDocumentVersion(documentId, versionB);

        if (!verA || !verB) {
            throw new Error('指定的版本不存在');
        }

        return {
            documentId: documentId,
            versionA: {
                number: versionA,
                title: verA.title,
                contentLength: verA.content?.length || 0,
                createdAt: verA.createdAt
            },
            versionB: {
                number: versionB,
                title: verB.title,
                contentLength: verB.content?.length || 0,
                createdAt: verB.createdAt
            },
            differences: {
                titleChanged: verA.title !== verB.title,
                contentChanged: verA.content !== verB.content,
                contentLengthDiff: (verB.content?.length || 0) - (verA.content?.length || 0)
            }
        };
    }

    /**
     * 删除文档的所有版本历史
     * @param {string} documentId - 文档ID
     * @returns {Promise<Object>} 删除结果
     */
    async deleteVersionHistory(documentId) {
        if (!documentId) {
            throw new Error('文档ID不能为空');
        }

        let deletedCount = 0;

        // 从数据库删除
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('vs_document_versions')
                    .delete()
                    .eq('document_id', documentId);

                if (error) throw error;
                deletedCount = data?.length || 0;
            } catch (error) {
                console.error('删除版本历史失败:', error);
            }
        }

        // 从本地缓存删除
        if (this._documentVersions && this._documentVersions.has(documentId)) {
            const versions = this._documentVersions.get(documentId);
            deletedCount = Math.max(deletedCount, versions.length);
            this._documentVersions.delete(documentId);
        }

        return {
            success: true,
            documentId: documentId,
            deletedVersions: deletedCount
        };
    }
}

// ================= 进度自动保存服务 =================

/**
 * 进度自动保存服务
 * 实现定时保存进度到云端和本地缓存备份
 * Requirements: 11.1 - 自动保存当前进度到云端
 */
class ProgressAutoSaveService {
    /**
     * 本地存储键名前缀
     */
    static STORAGE_KEYS = {
        PROGRESS_PREFIX: 'vs_progress_',
        EXECUTION_KEY: 'vs_current_execution',
        SESSION_KEY: 'vs_current_session',
        BACKUP_PREFIX: 'vs_backup_',
        LAST_SYNC: 'vs_last_sync_time'
    };

    /**
     * 默认配置
     */
    static DEFAULT_CONFIG = {
        autoSaveInterval: 30000,      // 自动保存间隔（毫秒），默认30秒
        syncInterval: 60000,          // 云端同步间隔（毫秒），默认60秒
        maxBackupCount: 5,            // 最大备份数量
        enableAutoSave: true,         // 是否启用自动保存
        enableCloudSync: true         // 是否启用云端同步
    };

    constructor(supabase, config = {}) {
        this.supabase = supabase;
        this.config = { ...ProgressAutoSaveService.DEFAULT_CONFIG, ...config };
        
        // 定时器ID
        this._autoSaveTimer = null;
        this._syncTimer = null;
        
        // 状态标记
        this._isRunning = false;
        this._pendingChanges = false;
        this._lastSaveTime = null;
        
        // 当前用户信息
        this._userId = null;
        this._currentWorkstationId = null;
        
        // 进度数据缓存
        this._progressCache = new Map();
    }

    /**
     * 启动自动保存服务
     * @param {string} userId - 用户ID
     * @param {string} [workstationId] - 当前工位ID（可选）
     */
    start(userId, workstationId = null) {
        if (this._isRunning) {
            console.log('⚠️ 自动保存服务已在运行');
            return;
        }

        this._userId = userId;
        this._currentWorkstationId = workstationId;
        this._isRunning = true;

        // 启动自动保存定时器
        if (this.config.enableAutoSave) {
            this._autoSaveTimer = setInterval(() => {
                this._performAutoSave();
            }, this.config.autoSaveInterval);
        }

        // 启动云端同步定时器
        if (this.config.enableCloudSync && this.supabase) {
            this._syncTimer = setInterval(() => {
                this._performCloudSync();
            }, this.config.syncInterval);
        }

        // 监听页面关闭事件，确保保存
        this._setupBeforeUnloadHandler();

        console.log('✅ 进度自动保存服务已启动', {
            userId: this._userId,
            workstationId: this._currentWorkstationId,
            autoSaveInterval: this.config.autoSaveInterval,
            syncInterval: this.config.syncInterval
        });
    }

    /**
     * 停止自动保存服务
     */
    stop() {
        if (!this._isRunning) return;

        // 停止前执行最后一次保存
        this._performAutoSave();
        this._performCloudSync();

        // 清除定时器
        if (this._autoSaveTimer) {
            clearInterval(this._autoSaveTimer);
            this._autoSaveTimer = null;
        }
        if (this._syncTimer) {
            clearInterval(this._syncTimer);
            this._syncTimer = null;
        }

        this._isRunning = false;
        console.log('🛑 进度自动保存服务已停止');
    }

    /**
     * 设置当前工位
     * @param {string} workstationId - 工位ID
     */
    setCurrentWorkstation(workstationId) {
        this._currentWorkstationId = workstationId;
    }

    /**
     * 标记有待保存的更改
     */
    markPendingChanges() {
        this._pendingChanges = true;
    }

    /**
     * 立即保存当前进度
     * @returns {Promise<Object>} 保存结果
     */
    async saveNow() {
        return this._performAutoSave();
    }

    /**
     * 立即同步到云端
     * @returns {Promise<Object>} 同步结果
     */
    async syncNow() {
        return this._performCloudSync();
    }

    /**
     * 获取当前进度数据
     * @returns {Object} 进度数据
     */
    getCurrentProgress() {
        const execution = this._getLocalExecution();
        const session = this._getLocalSession();
        
        return {
            userId: this._userId,
            workstationId: this._currentWorkstationId,
            execution: execution,
            session: session,
            timestamp: Date.now(),
            lastSaveTime: this._lastSaveTime
        };
    }

    /**
     * 恢复进度
     * @param {string} userId - 用户ID
     * @param {string} [workstationId] - 工位ID（可选）
     * @returns {Promise<Object|null>} 恢复的进度数据
     */
    async restoreProgress(userId, workstationId = null) {
        // 1. 先尝试从本地缓存恢复
        const localProgress = this._getLocalProgress(userId, workstationId);
        
        // 2. 如果有云端连接，尝试从云端获取最新进度
        if (this.supabase && workstationId) {
            try {
                const cloudProgress = await this._getCloudProgress(userId, workstationId);
                
                // 比较本地和云端进度，使用更新的那个
                if (cloudProgress && cloudProgress.updated_at) {
                    const cloudTime = new Date(cloudProgress.updated_at).getTime();
                    const localTime = localProgress?.lastAccessedAt || 0;
                    
                    if (cloudTime > localTime) {
                        console.log('📥 使用云端进度（更新）');
                        // 同步云端数据到本地
                        this._saveLocalProgress(userId, workstationId, cloudProgress);
                        return this._normalizeProgress(cloudProgress);
                    }
                }
            } catch (error) {
                console.warn('获取云端进度失败，使用本地缓存:', error);
            }
        }

        if (localProgress) {
            console.log('📂 使用本地缓存进度');
            return localProgress;
        }

        return null;
    }

    /**
     * 创建进度备份
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @returns {Object} 备份信息
     */
    createBackup(userId, workstationId) {
        const progress = this.getCurrentProgress();
        const backupKey = `${ProgressAutoSaveService.STORAGE_KEYS.BACKUP_PREFIX}${userId}_${workstationId}`;
        
        // 获取现有备份列表
        const backupsJson = localStorage.getItem(backupKey);
        let backups = [];
        try {
            backups = backupsJson ? JSON.parse(backupsJson) : [];
        } catch (e) {
            backups = [];
        }

        // 添加新备份
        const backup = {
            id: `backup_${Date.now()}`,
            timestamp: Date.now(),
            data: progress
        };
        backups.unshift(backup);

        // 限制备份数量
        if (backups.length > this.config.maxBackupCount) {
            backups = backups.slice(0, this.config.maxBackupCount);
        }

        localStorage.setItem(backupKey, JSON.stringify(backups));

        return {
            success: true,
            backupId: backup.id,
            timestamp: backup.timestamp,
            totalBackups: backups.length
        };
    }

    /**
     * 获取备份列表
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @returns {Array} 备份列表
     */
    getBackups(userId, workstationId) {
        const backupKey = `${ProgressAutoSaveService.STORAGE_KEYS.BACKUP_PREFIX}${userId}_${workstationId}`;
        const backupsJson = localStorage.getItem(backupKey);
        
        try {
            return backupsJson ? JSON.parse(backupsJson) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * 从备份恢复
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @param {string} backupId - 备份ID
     * @returns {Object|null} 恢复的进度数据
     */
    restoreFromBackup(userId, workstationId, backupId) {
        const backups = this.getBackups(userId, workstationId);
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            return null;
        }

        // 恢复进度数据
        const progressData = backup.data;
        
        if (progressData.execution) {
            localStorage.setItem(
                ProgressAutoSaveService.STORAGE_KEYS.EXECUTION_KEY,
                JSON.stringify(progressData.execution)
            );
        }
        
        if (progressData.session) {
            localStorage.setItem(
                ProgressAutoSaveService.STORAGE_KEYS.SESSION_KEY,
                JSON.stringify(progressData.session)
            );
        }

        return progressData;
    }

    /**
     * 获取上次同步时间
     * @returns {number|null} 时间戳
     */
    getLastSyncTime() {
        const timeStr = localStorage.getItem(ProgressAutoSaveService.STORAGE_KEYS.LAST_SYNC);
        return timeStr ? parseInt(timeStr, 10) : null;
    }

    // ================= 私有方法 =================

    /**
     * 执行自动保存
     * @private
     */
    _performAutoSave() {
        if (!this._userId) return { success: false, reason: 'no_user' };

        try {
            const progress = this.getCurrentProgress();
            
            // 保存到本地存储
            if (this._currentWorkstationId) {
                this._saveLocalProgress(this._userId, this._currentWorkstationId, {
                    workstationId: this._currentWorkstationId,
                    userId: this._userId,
                    execution: progress.execution,
                    session: progress.session,
                    lastAccessedAt: Date.now()
                });
            }

            // 保存执行记录
            if (progress.execution) {
                localStorage.setItem(
                    ProgressAutoSaveService.STORAGE_KEYS.EXECUTION_KEY,
                    JSON.stringify(progress.execution)
                );
            }

            this._lastSaveTime = Date.now();
            this._pendingChanges = false;

            return { success: true, timestamp: this._lastSaveTime };
        } catch (error) {
            console.error('自动保存失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 执行云端同步
     * @private
     */
    async _performCloudSync() {
        if (!this.supabase || !this._userId || !this._currentWorkstationId) {
            return { success: false, reason: 'not_ready' };
        }

        try {
            const progress = this.getCurrentProgress();
            
            // 准备同步数据
            const syncData = {
                user_id: this._userId,
                workstation_id: this._currentWorkstationId,
                progress: this._calculateProgressPercentage(progress.execution),
                completed_tasks: this._countCompletedTasks(progress.execution),
                total_tasks: this._getTotalTasks(this._currentWorkstationId),
                last_task_id: progress.execution?.taskId || null,
                last_stage_id: this._getCurrentStageId(progress.execution),
                saved_data: {
                    execution: progress.execution,
                    session: progress.session,
                    timestamp: Date.now()
                },
                updated_at: new Date().toISOString()
            };

            // 使用upsert保存到云端
            const { error } = await this.supabase
                .from('vs_progress')
                .upsert(syncData, { 
                    onConflict: 'user_id,workstation_id'
                });

            if (error) throw error;

            // 更新最后同步时间
            localStorage.setItem(
                ProgressAutoSaveService.STORAGE_KEYS.LAST_SYNC,
                Date.now().toString()
            );

            console.log('☁️ 进度已同步到云端');
            return { success: true, timestamp: Date.now() };
        } catch (error) {
            console.error('云端同步失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 设置页面关闭前保存处理
     * @private
     */
    _setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            // 同步保存（不使用async）
            this._performAutoSave();
            
            // 创建备份
            if (this._userId && this._currentWorkstationId) {
                this.createBackup(this._userId, this._currentWorkstationId);
            }
        });

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this._performAutoSave();
            }
        });
    }

    /**
     * 获取本地执行记录
     * @private
     */
    _getLocalExecution() {
        const saved = localStorage.getItem(ProgressAutoSaveService.STORAGE_KEYS.EXECUTION_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * 获取本地会话
     * @private
     */
    _getLocalSession() {
        const saved = localStorage.getItem(ProgressAutoSaveService.STORAGE_KEYS.SESSION_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * 获取本地进度
     * @private
     */
    _getLocalProgress(userId, workstationId) {
        if (!workstationId) {
            // 返回通用进度
            const saved = localStorage.getItem('vs_progress');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    return null;
                }
            }
            return null;
        }

        const key = `${ProgressAutoSaveService.STORAGE_KEYS.PROGRESS_PREFIX}${userId}_${workstationId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * 保存本地进度
     * @private
     */
    _saveLocalProgress(userId, workstationId, data) {
        const key = `${ProgressAutoSaveService.STORAGE_KEYS.PROGRESS_PREFIX}${userId}_${workstationId}`;
        localStorage.setItem(key, JSON.stringify(data));
    }

    /**
     * 获取云端进度
     * @private
     */
    async _getCloudProgress(userId, workstationId) {
        if (!this.supabase) return null;

        const { data, error } = await this.supabase
            .from('vs_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('workstation_id', workstationId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data;
    }

    /**
     * 标准化进度数据格式
     * @private
     */
    _normalizeProgress(cloudData) {
        return {
            workstationId: cloudData.workstation_id,
            userId: cloudData.user_id,
            progress: cloudData.progress,
            completedTasks: cloudData.completed_tasks,
            totalTasks: cloudData.total_tasks,
            lastTaskId: cloudData.last_task_id,
            lastStageId: cloudData.last_stage_id,
            execution: cloudData.saved_data?.execution || null,
            session: cloudData.saved_data?.session || null,
            lastAccessedAt: new Date(cloudData.updated_at).getTime()
        };
    }

    /**
     * 计算进度百分比
     * @private
     */
    _calculateProgressPercentage(execution) {
        if (!execution) return 0;
        
        const task = PRESET_TASKS.find(t => t.id === execution.taskId);
        if (!task || !task.stages || task.stages.length === 0) return 0;

        const completedStages = execution.currentStageIndex || 0;
        return Math.round((completedStages / task.stages.length) * 100);
    }

    /**
     * 统计已完成任务数
     * @private
     */
    _countCompletedTasks(execution) {
        if (!execution) return 0;
        
        // 从历史记录中统计
        const historyKey = `vs_task_history_${this._userId}`;
        const historyJson = localStorage.getItem(historyKey);
        
        if (historyJson) {
            try {
                const history = JSON.parse(historyJson);
                return history.filter(h => 
                    h.status === 'completed' && 
                    h.workstationId === this._currentWorkstationId
                ).length;
            } catch (e) {
                return 0;
            }
        }
        
        return 0;
    }

    /**
     * 获取工位总任务数
     * @private
     */
    _getTotalTasks(workstationId) {
        const workstation = PRESET_WORKSTATIONS.find(w => w.id === workstationId);
        return workstation ? workstation.totalTasks : 0;
    }

    /**
     * 获取当前阶段ID
     * @private
     */
    _getCurrentStageId(execution) {
        if (!execution) return null;
        
        const task = PRESET_TASKS.find(t => t.id === execution.taskId);
        if (!task || !task.stages) return null;

        const currentStage = task.stages[execution.currentStageIndex];
        return currentStage ? currentStage.id : null;
    }
}

// ================= 进度恢复服务 =================

/**
 * 进度恢复服务
 * Requirements: 11.2 - 检测未完成进度，提供继续/重新开始选项
 */
class ProgressRecoveryService {
    /**
     * 本地存储键名
     */
    static STORAGE_KEYS = {
        PROGRESS_PREFIX: 'vs_progress_',
        EXECUTION_KEY: 'vs_current_execution',
        SESSION_KEY: 'vs_current_session'
    };

    constructor(supabase = null) {
        this.supabase = supabase;
        this._pendingProgress = null;
        this._pendingWorkstation = null;
        this._onContinueCallback = null;
        this._onRestartCallback = null;
    }

    /**
     * 检测指定工位是否有未完成的进度
     * Requirements: 11.2 - 检测未完成进度
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     * @returns {Promise<Object|null>} 未完成的进度数据，如果没有则返回null
     */
    async detectUnfinishedProgress(userId, workstationId) {
        if (!userId || !workstationId) return null;

        // 1. 检查本地存储
        const localProgress = this._getLocalProgress(userId, workstationId);
        
        // 2. 检查云端存储（如果有Supabase连接）
        let cloudProgress = null;
        if (this.supabase) {
            try {
                cloudProgress = await this._getCloudProgress(userId, workstationId);
            } catch (error) {
                console.warn('获取云端进度失败:', error);
            }
        }

        // 3. 选择最新的进度
        let progress = null;
        if (localProgress && cloudProgress) {
            const localTime = localProgress.lastAccessedAt || 0;
            const cloudTime = cloudProgress.updated_at ? new Date(cloudProgress.updated_at).getTime() : 0;
            progress = localTime > cloudTime ? localProgress : this._normalizeCloudProgress(cloudProgress);
        } else {
            progress = localProgress || (cloudProgress ? this._normalizeCloudProgress(cloudProgress) : null);
        }

        // 4. 检查进度是否为未完成状态
        if (progress && this._isProgressUnfinished(progress)) {
            return progress;
        }

        return null;
    }

    /**
     * 检查进度是否为未完成状态
     * @private
     */
    _isProgressUnfinished(progress) {
        // 检查是否有执行记录
        if (!progress.execution) return false;
        
        // 检查执行状态是否为进行中
        const execution = progress.execution;
        if (execution.status === TaskExecutionStatus.COMPLETED || 
            execution.status === TaskExecutionStatus.FAILED) {
            return false;
        }

        // 检查是否有实际进度（至少完成了第一个阶段）
        if (execution.currentStageIndex > 0 || 
            (execution.stageData && Object.keys(execution.stageData).length > 0)) {
            return true;
        }

        return false;
    }

    /**
     * 显示进度恢复对话框
     * Requirements: 11.2 - 提供继续/重新开始选项
     * @param {Object} progress - 未完成的进度数据
     * @param {Object} workstation - 工位数据
     * @param {Function} onContinue - 继续回调
     * @param {Function} onRestart - 重新开始回调
     */
    showRecoveryDialog(progress, workstation, onContinue, onRestart) {
        this._pendingProgress = progress;
        this._pendingWorkstation = workstation;
        this._onContinueCallback = onContinue;
        this._onRestartCallback = onRestart;

        // 获取任务信息
        const task = PRESET_TASKS.find(t => t.id === progress.execution?.taskId);
        const taskName = task ? task.name : '未知任务';
        const totalStages = task ? task.stages.length : 0;
        const currentStage = progress.execution?.currentStageIndex || 0;
        
        // 计算进度百分比
        const progressPercent = totalStages > 0 ? Math.round((currentStage / totalStages) * 100) : 0;
        
        // 格式化最后访问时间
        const lastAccessTime = progress.lastAccessedAt 
            ? this._formatTimeAgo(progress.lastAccessedAt)
            : '未知';

        // 创建模态框HTML
        const modalHtml = `
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] flex items-center justify-center" id="progress-recovery-modal">
                <div class="glass-card rounded-2xl w-full max-w-md mx-4 overflow-hidden" style="background: rgba(30, 30, 60, 0.95); border: 1px solid rgba(139, 92, 246, 0.3);">
                    <!-- 头部 -->
                    <div class="p-6 border-b border-gray-700/50">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <i class="ri-folder-open-line text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white">发现未完成的进度</h3>
                                <p class="text-sm text-gray-400">是否继续上次的学习？</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 内容 -->
                    <div class="p-6">
                        <!-- 工位信息 -->
                        <div class="bg-white/5 rounded-xl p-4 mb-4">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <i class="${workstation.icon || 'ri-building-4-line'} text-lg"></i>
                                </div>
                                <div>
                                    <h4 class="font-medium text-white">${workstation.name}</h4>
                                    <p class="text-xs text-gray-400">${taskName}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 进度统计 -->
                        <div class="grid grid-cols-3 gap-3 mb-6">
                            <div class="bg-white/5 rounded-xl p-3 text-center">
                                <div class="text-xl font-bold text-purple-400">${progressPercent}%</div>
                                <div class="text-xs text-gray-400">任务进度</div>
                            </div>
                            <div class="bg-white/5 rounded-xl p-3 text-center">
                                <div class="text-xl font-bold text-cyan-400">${currentStage}/${totalStages}</div>
                                <div class="text-xs text-gray-400">已完成阶段</div>
                            </div>
                            <div class="bg-white/5 rounded-xl p-3 text-center">
                                <div class="text-sm font-bold text-amber-400">${lastAccessTime}</div>
                                <div class="text-xs text-gray-400">上次学习</div>
                            </div>
                        </div>
                        
                        <!-- 进度条 -->
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-gray-400">任务进度</span>
                                <span class="text-sm text-purple-400">${progressPercent}%</span>
                            </div>
                            <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>
                        
                        <!-- 操作按钮 -->
                        <div class="flex gap-3">
                            <button onclick="ProgressRecovery.handleRestart()" class="flex-1 px-4 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition flex items-center justify-center gap-2 text-gray-300">
                                <i class="ri-refresh-line"></i>
                                重新开始
                            </button>
                            <button onclick="ProgressRecovery.handleContinue()" class="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition flex items-center justify-center gap-2 text-white">
                                <i class="ri-play-circle-line"></i>
                                继续学习
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除已存在的模态框
        const existingModal = document.getElementById('progress-recovery-modal');
        if (existingModal) existingModal.remove();

        // 添加模态框到页面
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * 处理继续学习
     * Requirements: 11.2 - 继续上次进度
     */
    handleContinue() {
        const progress = this._pendingProgress;
        const workstation = this._pendingWorkstation;
        const callback = this._onContinueCallback;

        // 关闭模态框
        this.closeRecoveryDialog();

        // 执行回调
        if (callback && typeof callback === 'function') {
            callback(progress, workstation);
        }

        console.log('📂 继续上次进度:', progress);
    }

    /**
     * 处理重新开始
     * Requirements: 11.2 - 重新开始选项
     */
    handleRestart() {
        const workstation = this._pendingWorkstation;
        const callback = this._onRestartCallback;

        // 清除保存的进度
        if (this._pendingProgress && this._pendingProgress.userId && workstation) {
            this.clearProgress(this._pendingProgress.userId, workstation.id);
        }

        // 关闭模态框
        this.closeRecoveryDialog();

        // 执行回调
        if (callback && typeof callback === 'function') {
            callback(workstation);
        }

        console.log('🔄 重新开始任务');
    }

    /**
     * 关闭进度恢复对话框
     */
    closeRecoveryDialog() {
        const modal = document.getElementById('progress-recovery-modal');
        if (modal) {
            modal.remove();
        }

        // 清理临时状态
        this._pendingProgress = null;
        this._pendingWorkstation = null;
        this._onContinueCallback = null;
        this._onRestartCallback = null;
    }

    /**
     * 清除指定工位的进度
     * @param {string} userId - 用户ID
     * @param {string} workstationId - 工位ID
     */
    clearProgress(userId, workstationId) {
        // 清除本地存储
        const progressKey = `${ProgressRecoveryService.STORAGE_KEYS.PROGRESS_PREFIX}${userId}_${workstationId}`;
        localStorage.removeItem(progressKey);

        // 清除当前执行记录（如果是同一工位）
        const executionJson = localStorage.getItem(ProgressRecoveryService.STORAGE_KEYS.EXECUTION_KEY);
        if (executionJson) {
            try {
                const execution = JSON.parse(executionJson);
                const task = PRESET_TASKS.find(t => t.id === execution.taskId);
                if (task && task.workstationId === workstationId) {
                    localStorage.removeItem(ProgressRecoveryService.STORAGE_KEYS.EXECUTION_KEY);
                }
            } catch (e) {
                // 忽略解析错误
            }
        }

        console.log('🗑️ 已清除工位进度:', workstationId);
    }

    /**
     * 获取本地进度
     * @private
     */
    _getLocalProgress(userId, workstationId) {
        const key = `${ProgressRecoveryService.STORAGE_KEYS.PROGRESS_PREFIX}${userId}_${workstationId}`;
        const saved = localStorage.getItem(key);
        
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * 获取云端进度
     * @private
     */
    async _getCloudProgress(userId, workstationId) {
        if (!this.supabase) return null;

        const { data, error } = await this.supabase
            .from('vs_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('workstation_id', workstationId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data;
    }

    /**
     * 标准化云端进度数据格式
     * @private
     */
    _normalizeCloudProgress(cloudData) {
        return {
            workstationId: cloudData.workstation_id,
            userId: cloudData.user_id,
            progress: cloudData.progress,
            completedTasks: cloudData.completed_tasks,
            totalTasks: cloudData.total_tasks,
            lastTaskId: cloudData.last_task_id,
            lastStageId: cloudData.last_stage_id,
            execution: cloudData.saved_data?.execution || null,
            session: cloudData.saved_data?.session || null,
            lastAccessedAt: new Date(cloudData.updated_at).getTime()
        };
    }

    /**
     * 格式化时间为相对时间
     * @private
     */
    _formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        return new Date(timestamp).toLocaleDateString('zh-CN');
    }
}

// ================= 导出到全局 =================

// 创建全局实例
const VirtualStation = new VirtualStationPlatform();
const ProgressRecovery = new ProgressRecoveryService();
const AITutor = new AITutorService();
const KnowledgeBase = new KnowledgeBaseService();
// 创建全局竞赛服务实例（用于竞赛结果导出等功能）
const CompetitionServiceInstance = new CompetitionService(null);
// 创建全局进度自动保存服务实例
const ProgressAutoSave = new ProgressAutoSaveService(null);

// 导出所有模块
if (typeof window !== 'undefined') {
    window.VirtualStation = VirtualStation;
    window.VirtualStationPlatform = VirtualStationPlatform;
    window.WorkstationService = WorkstationService;
    window.TaskFlowService = TaskFlowService;
    window.ProcessTrackerService = ProcessTrackerService;
    window.CareerService = CareerService;
    window.AchievementService = AchievementService;
    window.CompetitionService = CompetitionServiceInstance; // 导出实例而非类
    window.CompetitionServiceClass = CompetitionService; // 同时导出类以便创建新实例
    window.CompetitionStatus = CompetitionStatus;
    window.AITutorService = AITutorService;
    window.AITutor = AITutor;
    window.KnowledgeBaseService = KnowledgeBaseService;
    window.KnowledgeBase = KnowledgeBase;
    window.ProgressAutoSaveService = ProgressAutoSaveService;
    window.ProgressAutoSave = ProgressAutoSave;
    window.ProgressRecoveryService = ProgressRecoveryService;
    window.ProgressRecovery = ProgressRecovery;
    
    // 导出标准引用相关
    window.NATIONAL_STANDARDS_DATABASE = NATIONAL_STANDARDS_DATABASE;
    window.STANDARD_REFERENCE_PATTERNS = STANDARD_REFERENCE_PATTERNS;
    
    // 导出枚举和配置
    window.WorkstationCategory = WorkstationCategory;
    window.WorkstationCategoryNames = WorkstationCategoryNames;
    window.WorkstationDifficulty = WorkstationDifficulty;
    window.WorkstationDifficultyNames = WorkstationDifficultyNames;
    window.StageType = StageType;
    window.StageTypeNames = StageTypeNames;
    window.STANDARD_STAGE_ORDER = STANDARD_STAGE_ORDER;
    window.CareerLevel = CareerLevel;
    window.ActionType = ActionType;
    window.AchievementRarity = AchievementRarity;
    window.TaskExecutionStatus = TaskExecutionStatus;
    window.LEVEL_CONFIG = LEVEL_CONFIG;
    window.LEVEL_UNLOCK_CONFIG = LEVEL_UNLOCK_CONFIG;
    
    // 导出职业等级UI辅助函数
    window.showLevelUpNotification = showLevelUpNotification;
    window.closeLevelUpModal = closeLevelUpModal;
    window.updateCareerDisplay = updateCareerDisplay;
    window.initCareerSystemUI = initCareerSystemUI;
    window.PAUSE_THRESHOLD = PAUSE_THRESHOLD;
    window.COMMON_ERROR_THRESHOLD = COMMON_ERROR_THRESHOLD;
    window.PRESET_WORKSTATIONS = PRESET_WORKSTATIONS;
    window.PRESET_TASKS = PRESET_TASKS;
    
    // 导出国标分类相关
    window.StandardCategory = StandardCategory;
    window.StandardCategoryNames = StandardCategoryNames;
    window.StandardStatus = StandardStatus;
    window.StandardStatusNames = StandardStatusNames;
    
    // 导出错误分类相关
    window.ErrorTypes = ProcessTrackerService.ErrorTypes;
    window.ErrorTypeNames = ProcessTrackerService.ErrorTypeNames;
    window.ErrorClassificationKeywords = ProcessTrackerService.ErrorClassificationKeywords;
}

// ================= 教师管理后台服务 =================

/**
 * 虚拟工位管理后台服务
 * 提供教师端管理功能
 */
const VirtualStationAdmin = {
    /**
     * 获取所有工位
     */
    async getWorkstations() {
        // 优先从数据库获取，否则使用预设数据
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { data, error } = await supabaseClient
                    .from('virtual_workstations')
                    .select('*')
                    .order('created_at', { ascending: true });
                if (!error && data && data.length > 0) {
                    return data.map(ws => ({
                        id: ws.id,
                        name: ws.name,
                        description: ws.description,
                        icon: ws.icon || 'ri-building-4-line',
                        color: ws.color || 'purple',
                        category: ws.category,
                        difficulty: ws.difficulty,
                        estimatedTime: ws.estimated_time,
                        requiredLevel: ws.required_level,
                        totalTasks: ws.total_tasks || 0,
                        xpReward: ws.xp_reward,
                        certificateId: ws.certificate_id,
                        isActive: ws.is_active,
                        mode: ws.mode,
                        linkUrl: ws.link_url,
                        createdAt: new Date(ws.created_at).getTime(),
                        updatedAt: new Date(ws.updated_at).getTime()
                    }));
                }
            }
        } catch (e) {
            console.warn('从数据库加载工位失败，使用预设数据:', e);
        }
        return PRESET_WORKSTATIONS;
    },

    /**
     * 创建工位
     */
    async createWorkstation(data) {
        const id = `ws-${Date.now()}`;
        const workstation = {
            id,
            name: data.name,
            description: data.description,
            icon: data.icon || 'ri-building-4-line',
            color: data.color || 'purple',
            category: data.category,
            difficulty: data.difficulty,
            estimated_time: data.estimatedTime || 60,
            required_level: data.requiredLevel || 1,
            total_tasks: 0,
            xp_reward: data.xpReward || 100,
            is_active: data.isActive !== false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        if (typeof supabaseClient !== 'undefined') {
            const { error } = await supabaseClient
                .from('virtual_workstations')
                .insert(workstation);
            if (error) throw error;
        }
        
        return workstation;
    },

    /**
     * 更新工位
     */
    async updateWorkstation(id, data) {
        const updates = {
            name: data.name,
            description: data.description,
            icon: data.icon,
            category: data.category,
            difficulty: data.difficulty,
            estimated_time: data.estimatedTime,
            required_level: data.requiredLevel,
            xp_reward: data.xpReward,
            is_active: data.isActive,
            updated_at: new Date().toISOString()
        };
        
        if (typeof supabaseClient !== 'undefined') {
            const { error } = await supabaseClient
                .from('virtual_workstations')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        }
        
        return { id, ...updates };
    },

    /**
     * 删除工位
     */
    async deleteWorkstation(id) {
        if (typeof supabaseClient !== 'undefined') {
            // 先删除关联的任务
            await supabaseClient
                .from('virtual_tasks')
                .delete()
                .eq('workstation_id', id);
            
            const { error } = await supabaseClient
                .from('virtual_workstations')
                .delete()
                .eq('id', id);
            if (error) throw error;
        }
        return true;
    },

    /**
     * 获取所有任务
     */
    async getTasks() {
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { data, error } = await supabaseClient
                    .from('virtual_tasks')
                    .select('*')
                    .order('order_num', { ascending: true });
                if (!error && data && data.length > 0) {
                    return data.map(task => ({
                        id: task.id,
                        workstationId: task.workstation_id,
                        name: task.name,
                        description: task.description,
                        order: task.order_num,
                        taskBrief: task.task_brief || {},
                        stages: task.stages || [],
                        scoringRules: task.scoring_rules || [],
                        maxScore: task.max_score || 100,
                        passingScore: task.passing_score || 60,
                        xpReward: task.xp_reward || 50
                    }));
                }
            }
        } catch (e) {
            console.warn('从数据库加载任务失败，使用预设数据:', e);
        }
        return PRESET_TASKS;
    },

    /**
     * 创建任务
     */
    async createTask(data) {
        const id = `task-${Date.now()}`;
        const task = {
            id,
            workstation_id: data.workstationId,
            name: data.name,
            description: data.description,
            order_num: data.order || 1,
            task_brief: data.taskBrief || {},
            stages: data.stages || [],
            scoring_rules: data.scoringRules || [],
            max_score: data.maxScore || 100,
            passing_score: data.passingScore || 60,
            xp_reward: data.xpReward || 50,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        if (typeof supabaseClient !== 'undefined') {
            const { error } = await supabaseClient
                .from('virtual_tasks')
                .insert(task);
            if (error) throw error;
            
            // 更新工位的任务数
            await supabaseClient.rpc('increment_workstation_tasks', { ws_id: data.workstationId });
        }
        
        return task;
    },

    /**
     * 更新任务
     */
    async updateTask(id, data) {
        const updates = {
            name: data.name,
            workstation_id: data.workstationId,
            description: data.description,
            task_brief: data.taskBrief,
            xp_reward: data.xpReward,
            max_score: data.maxScore,
            passing_score: data.passingScore,
            updated_at: new Date().toISOString()
        };
        
        if (typeof supabaseClient !== 'undefined') {
            const { error } = await supabaseClient
                .from('virtual_tasks')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        }
        
        return { id, ...updates };
    },

    /**
     * 删除任务
     */
    async deleteTask(id) {
        if (typeof supabaseClient !== 'undefined') {
            const { data: task } = await supabaseClient
                .from('virtual_tasks')
                .select('workstation_id')
                .eq('id', id)
                .single();
            
            const { error } = await supabaseClient
                .from('virtual_tasks')
                .delete()
                .eq('id', id);
            if (error) throw error;
            
            // 更新工位的任务数
            if (task) {
                await supabaseClient.rpc('decrement_workstation_tasks', { ws_id: task.workstation_id });
            }
        }
        return true;
    },

    /**
     * 获取学生列表
     */
    async getStudents() {
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { data, error } = await supabaseClient
                    .from('virtual_career_profiles')
                    .select('*')
                    .order('total_xp', { ascending: false });
                if (!error && data) {
                    return data.map(profile => ({
                        userId: profile.user_id,
                        studentId: profile.student_id,
                        name: profile.name,
                        level: profile.level,
                        levelTitle: profile.level_title,
                        currentXP: profile.current_xp,
                        totalXP: profile.total_xp,
                        completedTasks: profile.completed_tasks,
                        completedWorkstations: profile.completed_workstations,
                        totalStudyTime: profile.total_study_time,
                        avgScore: profile.avg_score,
                        progress: profile.progress || 0
                    }));
                }
            }
        } catch (e) {
            console.warn('加载学生列表失败:', e);
        }
        return [];
    },

    /**
     * 获取学生详情
     */
    async getStudentDetail(userId) {
        const students = await this.getStudents();
        const student = students.find(s => s.userId === userId) || {};
        
        let taskHistory = [];
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { data } = await supabaseClient
                    .from('virtual_task_history')
                    .select('*')
                    .eq('user_id', userId)
                    .order('completed_at', { ascending: false });
                if (data) {
                    taskHistory = data.map(h => ({
                        taskId: h.task_id,
                        taskName: h.task_name,
                        score: h.score,
                        duration: h.duration,
                        completedAt: new Date(h.completed_at).getTime()
                    }));
                }
            }
        } catch (e) {
            console.warn('加载任务历史失败:', e);
        }
        
        return { ...student, taskHistory };
    },

    /**
     * 获取完成任务数
     */
    async getCompletedTasksCount() {
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { count } = await supabaseClient
                    .from('virtual_task_history')
                    .select('*', { count: 'exact', head: true });
                return count || 0;
            }
        } catch (e) {
            console.warn('获取完成任务数失败:', e);
        }
        return 0;
    },

    /**
     * 获取总学习时长
     */
    async getTotalStudyHours() {
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { data } = await supabaseClient
                    .from('virtual_career_profiles')
                    .select('total_study_time');
                if (data) {
                    const totalMinutes = data.reduce((sum, p) => sum + (p.total_study_time || 0), 0);
                    return totalMinutes / 60;
                }
            }
        } catch (e) {
            console.warn('获取总学习时长失败:', e);
        }
        return 0;
    },

    /**
     * 获取分析数据
     */
    async getAnalytics() {
        const analytics = {
            difficultSteps: [],
            errorPatterns: [],
            avgPauseTime: 0,
            hintViewRate: 0,
            errorRate: 0,
            retryRate: 0
        };
        
        try {
            if (typeof supabaseClient !== 'undefined') {
                // 获取难点步骤
                const { data: difficultData } = await supabaseClient
                    .from('virtual_difficult_steps')
                    .select('*')
                    .order('error_rate', { ascending: false })
                    .limit(10);
                if (difficultData) {
                    analytics.difficultSteps = difficultData.map(d => ({
                        stepId: d.step_id,
                        stepName: d.step_name,
                        workstationId: d.workstation_id,
                        averageDuration: d.average_duration,
                        hintViewRate: d.hint_view_rate,
                        errorRate: d.error_rate,
                        retryRate: d.retry_rate
                    }));
                }
                
                // 获取错误模式
                const { data: errorData } = await supabaseClient
                    .from('virtual_error_patterns')
                    .select('*')
                    .order('affected_percentage', { ascending: false })
                    .limit(10);
                if (errorData) {
                    analytics.errorPatterns = errorData.map(e => ({
                        patternId: e.pattern_id,
                        errorType: e.error_type,
                        description: e.description,
                        occurrenceCount: e.occurrence_count,
                        affectedStudents: e.affected_students,
                        affectedPercentage: e.affected_percentage
                    }));
                }
                
                // 获取行为统计
                const { data: behaviorData } = await supabaseClient
                    .from('virtual_behavior_stats')
                    .select('*')
                    .single();
                if (behaviorData) {
                    analytics.avgPauseTime = behaviorData.avg_pause_time || 0;
                    analytics.hintViewRate = behaviorData.hint_view_rate || 0;
                    analytics.errorRate = behaviorData.error_rate || 0;
                    analytics.retryRate = behaviorData.retry_rate || 0;
                }
            }
        } catch (e) {
            console.warn('加载分析数据失败:', e);
        }
        
        return analytics;
    },

    /**
     * 获取提醒列表
     */
    async getReminders() {
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { data, error } = await supabaseClient
                    .from('virtual_task_reminders')
                    .select('*')
                    .order('deadline', { ascending: true });
                if (!error && data) {
                    return data.map(r => ({
                        id: r.id,
                        taskId: r.task_id,
                        taskName: r.task_name,
                        deadline: r.deadline,
                        reminderTime: r.reminder_time,
                        incompleteCount: r.incomplete_count || 0,
                        isSent: r.is_sent
                    }));
                }
            }
        } catch (e) {
            console.warn('加载提醒列表失败:', e);
        }
        return [];
    },

    /**
     * 创建提醒
     */
    async createReminder(data) {
        const reminder = {
            id: `reminder-${Date.now()}`,
            task_id: data.taskId,
            task_name: data.taskName,
            deadline: new Date(data.deadline).toISOString(),
            reminder_time: new Date(data.reminderTime).toISOString(),
            incomplete_count: 0,
            is_sent: false,
            created_at: new Date().toISOString()
        };
        
        if (typeof supabaseClient !== 'undefined') {
            const { error } = await supabaseClient
                .from('virtual_task_reminders')
                .insert(reminder);
            if (error) throw error;
        }
        
        return reminder;
    },

    /**
     * 发送提醒
     */
    async sendReminder(reminderId) {
        // 这里可以集成消息推送服务
        console.log('发送提醒:', reminderId);
        
        if (typeof supabaseClient !== 'undefined') {
            await supabaseClient
                .from('virtual_task_reminders')
                .update({ is_sent: true })
                .eq('id', reminderId);
        }
        
        return true;
    },

    /**
     * 删除提醒
     */
    async deleteReminder(reminderId) {
        if (typeof supabaseClient !== 'undefined') {
            const { error } = await supabaseClient
                .from('virtual_task_reminders')
                .delete()
                .eq('id', reminderId);
            if (error) throw error;
        }
        return true;
    },

    /**
     * 导出学生成绩
     */
    async exportStudentScores() {
        const students = await this.getStudents();
        return students.map(s => ({
            '学号': s.studentId || '-',
            '姓名': s.name || '未知',
            '职业等级': s.levelTitle || '实习生',
            '等级': s.level || 1,
            '总经验值': s.totalXP || 0,
            '完成任务数': s.completedTasks || 0,
            '学习时长(分钟)': s.totalStudyTime || 0,
            '平均分': s.avgScore?.toFixed(1) || '-'
        }));
    },

    /**
     * 导出行为日志
     */
    async exportBehaviorLogs() {
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { data } = await supabaseClient
                    .from('virtual_behavior_logs')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(1000);
                if (data) {
                    return data.map(log => ({
                        '用户ID': log.user_id,
                        '会话ID': log.session_id,
                        '操作类型': log.action_type,
                        '页面ID': log.details?.pageId || '-',
                        '字段ID': log.details?.fieldId || '-',
                        '停留时长(秒)': log.details?.duration || '-',
                        '时间': new Date(log.timestamp).toLocaleString('zh-CN')
                    }));
                }
            }
        } catch (e) {
            console.warn('导出行为日志失败:', e);
        }
        return [];
    },

    /**
     * 导出错误分析
     */
    async exportErrorAnalysis() {
        const analytics = await this.getAnalytics();
        return analytics.errorPatterns.map(p => ({
            '错误类型': p.errorType,
            '描述': p.description,
            '出现次数': p.occurrenceCount,
            '影响学生数': p.affectedStudents,
            '影响比例(%)': p.affectedPercentage
        }));
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.VirtualStationAdmin = VirtualStationAdmin;
}

// 支持ES模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        VirtualStation,
        VirtualStationPlatform,
        WorkstationService,
        TaskFlowService,
        ProcessTrackerService,
        CareerService,
        AchievementService,
        CompetitionService,
        CompetitionStatus,
        AITutorService,
        AITutor,
        KnowledgeBaseService,
        KnowledgeBase,
        ProgressAutoSaveService,
        ProgressAutoSave,
        VirtualStationAdmin,
        WorkstationCategory,
        WorkstationCategoryNames,
        StageType,
        StageTypeNames,
        STANDARD_STAGE_ORDER,
        CareerLevel,
        ActionType,
        AchievementRarity,
        TaskExecutionStatus,
        LEVEL_CONFIG,
        PAUSE_THRESHOLD,
        COMMON_ERROR_THRESHOLD,
        PRESET_WORKSTATIONS,
        PRESET_TASKS,
        StandardCategory,
        StandardCategoryNames,
        StandardStatus,
        StandardStatusNames,
        ErrorTypes: ProcessTrackerService.ErrorTypes,
        ErrorTypeNames: ProcessTrackerService.ErrorTypeNames,
        ErrorClassificationKeywords: ProcessTrackerService.ErrorClassificationKeywords,
        FieldTypeErrorMapping: ProcessTrackerService.FieldTypeErrorMapping,
        ValidationRuleErrorMapping: ProcessTrackerService.ValidationRuleErrorMapping
    };
}
