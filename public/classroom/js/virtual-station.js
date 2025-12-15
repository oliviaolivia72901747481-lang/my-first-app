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

        // 从本地存储恢复进度
        await this._restoreProgress();

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
    }

    /**
     * 获取当前用户的职业档案
     */
    async getCareerProfile() {
        if (!this.currentUser) return null;
        return this.careerService.getCareerProfile(this.currentUser.id);
    }
}


// ================= 工位服务 =================

/**
 * 工位服务类
 */
class WorkstationService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * 获取工位列表
     * @returns {Promise<Array>} 工位信息列表
     */
    async getWorkstationList() {
        if (!this.supabase) {
            return this._getPresetWorkstations();
        }

        const { data, error } = await this.supabase
            .from('vs_workstations')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) {
            console.warn('获取工位列表失败，使用预设数据:', error);
            return this._getPresetWorkstations();
        }

        return data || this._getPresetWorkstations();
    }

    /**
     * 获取单个工位详情
     * @param {string} workstationId 工位ID
     */
    async getWorkstation(workstationId) {
        if (!this.supabase) {
            return this._getPresetWorkstations().find(w => w.id === workstationId);
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

        return data;
    }

    /**
     * 获取用户在工位的进度
     * @param {string} userId 用户ID
     * @param {string} workstationId 工位ID
     */
    async getWorkstationProgress(userId, workstationId) {
        if (!this.supabase) {
            return this._getLocalProgress(userId, workstationId);
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

        return data || { progress: 0, completed_tasks: 0, total_tasks: 0 };
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
     */
    _getPresetWorkstations() {
        return [
            {
                id: 'env-monitoring',
                name: '环境监测站',
                description: '水质监测、大气监测、土壤监测全流程实训',
                icon: 'ri-flask-line',
                color: 'cyan',
                category: WorkstationCategory.ENV_MONITORING,
                difficulty: 'intermediate',
                estimated_time: 120,
                required_level: 1,
                total_tasks: 7,
                xp_reward: 500,
                is_active: true
            },
            {
                id: 'hazwaste-lab',
                name: '危废鉴别实验室',
                description: 'GB 5085系列标准学习，沉浸式推理鉴别',
                icon: 'ri-skull-line',
                color: 'orange',
                category: WorkstationCategory.HAZWASTE,
                difficulty: 'advanced',
                estimated_time: 90,
                required_level: 3,
                total_tasks: 5,
                xp_reward: 600,
                is_active: true
            },
            {
                id: 'sampling-center',
                name: '采样规划中心',
                description: '布点方案设计、采样计划制定、现场模拟',
                icon: 'ri-map-pin-line',
                color: 'emerald',
                category: WorkstationCategory.SAMPLING,
                difficulty: 'intermediate',
                estimated_time: 60,
                required_level: 2,
                total_tasks: 4,
                xp_reward: 400,
                is_active: true
            },
            {
                id: 'data-center',
                name: '数据处理中心',
                description: '监测数据分析、报告生成、质量控制',
                icon: 'ri-database-2-line',
                color: 'purple',
                category: WorkstationCategory.DATA_ANALYSIS,
                difficulty: 'intermediate',
                estimated_time: 90,
                required_level: 4,
                total_tasks: 6,
                xp_reward: 450,
                is_active: false
            },
            {
                id: 'instrument-room',
                name: '仪器操作室',
                description: '分析仪器虚拟操作、参数调节、故障排除',
                icon: 'ri-microscope-line',
                color: 'pink',
                category: WorkstationCategory.INSTRUMENT,
                difficulty: 'advanced',
                estimated_time: 120,
                required_level: 5,
                total_tasks: 8,
                xp_reward: 700,
                is_active: false
            },
            {
                id: 'emergency-center',
                name: '应急响应中心',
                description: '环境应急预案、事故处置、现场指挥模拟',
                icon: 'ri-alarm-warning-line',
                color: 'red',
                category: WorkstationCategory.EMERGENCY,
                difficulty: 'advanced',
                estimated_time: 150,
                required_level: 8,
                total_tasks: 10,
                xp_reward: 1000,
                is_active: false
            }
        ];
    }

    /**
     * 获取本地存储的进度
     */
    _getLocalProgress(userId, workstationId) {
        const key = `vs_progress_${userId}_${workstationId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return { progress: 0, completed_tasks: 0, total_tasks: 0 };
            }
        }
        return { progress: 0, completed_tasks: 0, total_tasks: 0 };
    }
}


// ================= 任务流服务 =================

/**
 * 任务流服务类
 */
class TaskFlowService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * 获取工位的任务列表
     * @param {string} workstationId 工位ID
     */
    async getTaskList(workstationId) {
        if (!this.supabase) {
            return [];
        }

        const { data, error } = await this.supabase
            .from('vs_tasks')
            .select('*')
            .eq('workstation_id', workstationId)
            .order('order', { ascending: true });

        if (error) {
            console.error('获取任务列表失败:', error);
            return [];
        }

        return data || [];
    }

    /**
     * 获取任务详情
     * @param {string} taskId 任务ID
     */
    async getTask(taskId) {
        if (!this.supabase) return null;

        const { data, error } = await this.supabase
            .from('vs_tasks')
            .select('*, vs_task_stages(*)')
            .eq('id', taskId)
            .single();

        if (error) {
            console.error('获取任务详情失败:', error);
            return null;
        }

        return data;
    }

    /**
     * 开始任务
     * @param {string} sessionId 会话ID
     * @param {string} taskId 任务ID
     */
    async startTask(sessionId, taskId) {
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const execution = {
            id: executionId,
            session_id: sessionId,
            task_id: taskId,
            started_at: Date.now(),
            current_stage: 0,
            status: 'in_progress'
        };

        if (this.supabase) {
            await this.supabase.from('vs_task_executions').insert(execution);
        }

        localStorage.setItem('vs_current_execution', JSON.stringify(execution));
        return execution;
    }

    /**
     * 提交阶段内容
     * @param {string} executionId 执行ID
     * @param {string} stageId 阶段ID
     * @param {Object} data 提交数据
     */
    async submitStage(executionId, stageId, data) {
        const result = await this.validateSubmission(stageId, data);
        
        if (this.supabase) {
            await this.supabase.from('vs_stage_submissions').insert({
                execution_id: executionId,
                stage_id: stageId,
                data: data,
                validation_result: result,
                submitted_at: Date.now()
            });
        }

        return result;
    }

    /**
     * 验证提交内容
     * @param {string} stageId 阶段ID
     * @param {Object} data 提交数据
     */
    async validateSubmission(stageId, data) {
        // 获取阶段的验证规则
        const stage = await this._getStage(stageId);
        if (!stage) {
            return { valid: false, errors: ['阶段不存在'] };
        }

        const errors = [];
        const requiredFields = stage.required_fields || [];

        // 检查必填字段
        for (const field of requiredFields) {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors.push(`缺少必填项: ${field}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            score: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 20)
        };
    }

    /**
     * 完成任务
     * @param {string} executionId 执行ID
     */
    async completeTask(executionId) {
        const endTime = Date.now();
        
        if (this.supabase) {
            await this.supabase
                .from('vs_task_executions')
                .update({ status: 'completed', completed_at: endTime })
                .eq('id', executionId);
        }

        localStorage.removeItem('vs_current_execution');

        return { completed: true, completed_at: endTime };
    }

    /**
     * 获取阶段模板
     * @param {string} stageId 阶段ID
     */
    async getStageTemplate(stageId) {
        const stage = await this._getStage(stageId);
        return stage?.template || null;
    }

    /**
     * 获取阶段详情
     */
    async _getStage(stageId) {
        if (!this.supabase) return null;

        const { data, error } = await this.supabase
            .from('vs_task_stages')
            .select('*')
            .eq('id', stageId)
            .single();

        return error ? null : data;
    }

    /**
     * 验证任务阶段顺序
     * @param {Array} stages 阶段列表
     * @returns {boolean} 是否按正确顺序
     */
    validateStageOrder(stages) {
        const expectedOrder = [
            StageType.TASK_RECEIPT,
            StageType.PLAN_DESIGN,
            StageType.OPERATION,
            StageType.RECORD_FILLING,
            StageType.REPORT_GENERATION
        ];

        // 过滤出标准阶段（排除simulation等特殊阶段）
        const standardStages = stages.filter(s => expectedOrder.includes(s.type));
        
        for (let i = 0; i < standardStages.length - 1; i++) {
            const currentIndex = expectedOrder.indexOf(standardStages[i].type);
            const nextIndex = expectedOrder.indexOf(standardStages[i + 1].type);
            if (currentIndex >= nextIndex) {
                return false;
            }
        }
        
        return true;
    }
}


// ================= 过程追踪服务 =================

/**
 * 过程追踪服务类 - 无感采集学习行为数据
 */
class ProcessTrackerService {
    constructor(supabase) {
        this.supabase = supabase;
        this.localLogs = [];
        this.syncInterval = null;
    }

    /**
     * 记录用户行为
     * @param {string} sessionId 会话ID
     * @param {Object} action 行为对象
     */
    async logAction(sessionId, action) {
        const log = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            session_id: sessionId,
            user_id: localStorage.getItem('my_id'),
            timestamp: Date.now(),
            action_type: action.type,
            details: action.details || {}
        };

        this.localLogs.push(log);

        // 批量同步到服务器
        if (this.localLogs.length >= 10) {
            await this._syncLogs();
        }
    }

    /**
     * 记录页面浏览
     * @param {string} sessionId 会话ID
     * @param {string} pageId 页面ID
     * @param {number} duration 停留时长（毫秒）
     */
    async logPageView(sessionId, pageId, duration) {
        await this.logAction(sessionId, {
            type: ActionType.PAGE_VIEW,
            details: { pageId, duration }
        });
    }

    /**
     * 记录字段修改
     * @param {string} sessionId 会话ID
     * @param {string} fieldId 字段ID
     * @param {any} oldValue 旧值
     * @param {any} newValue 新值
     */
    async logModification(sessionId, fieldId, oldValue, newValue) {
        await this.logAction(sessionId, {
            type: ActionType.FIELD_MODIFY,
            details: { fieldId, oldValue, newValue }
        });
    }

    /**
     * 记录提示查看
     * @param {string} sessionId 会话ID
     * @param {string} hintId 提示ID
     */
    async logHintView(sessionId, hintId) {
        await this.logAction(sessionId, {
            type: ActionType.HINT_VIEW,
            details: { hintId }
        });
    }

    /**
     * 记录错误发生
     * @param {string} sessionId 会话ID
     * @param {string} errorType 错误类型
     * @param {Object} errorDetails 错误详情
     */
    async logError(sessionId, errorType, errorDetails) {
        await this.logAction(sessionId, {
            type: ActionType.ERROR_OCCUR,
            details: { errorType, ...errorDetails }
        });
    }

    /**
     * 获取会话分析数据
     * @param {string} sessionId 会话ID
     */
    async getSessionAnalytics(sessionId) {
        const logs = await this._getSessionLogs(sessionId);
        
        return {
            totalActions: logs.length,
            pageViews: logs.filter(l => l.action_type === ActionType.PAGE_VIEW).length,
            modifications: logs.filter(l => l.action_type === ActionType.FIELD_MODIFY).length,
            hintsViewed: logs.filter(l => l.action_type === ActionType.HINT_VIEW).length,
            errors: logs.filter(l => l.action_type === ActionType.ERROR_OCCUR).length,
            averageDuration: this._calculateAverageDuration(logs)
        };
    }

    /**
     * 获取班级分析数据
     * @param {string} classId 班级ID
     */
    async getClassAnalytics(classId) {
        if (!this.supabase) return null;

        // 获取班级所有学生的行为日志
        const { data: logs, error } = await this.supabase
            .from('vs_behavior_logs')
            .select('*')
            .eq('class_id', classId);

        if (error) {
            console.error('获取班级分析失败:', error);
            return null;
        }

        return this._analyzeClassData(logs || []);
    }

    /**
     * 识别疑难步骤
     * @param {string} workstationId 工位ID
     */
    async identifyDifficultSteps(workstationId) {
        if (!this.supabase) return [];

        const { data: logs, error } = await this.supabase
            .from('vs_behavior_logs')
            .select('*')
            .eq('workstation_id', workstationId);

        if (error) return [];

        // 分析停顿时间超过阈值的步骤
        const stepDurations = {};
        const stepHints = {};
        const stepErrors = {};

        for (const log of logs || []) {
            const stepId = log.details?.stepId;
            if (!stepId) continue;

            if (log.action_type === ActionType.PAGE_VIEW) {
                if (!stepDurations[stepId]) stepDurations[stepId] = [];
                stepDurations[stepId].push(log.details.duration || 0);
            }
            if (log.action_type === ActionType.HINT_VIEW) {
                stepHints[stepId] = (stepHints[stepId] || 0) + 1;
            }
            if (log.action_type === ActionType.ERROR_OCCUR) {
                stepErrors[stepId] = (stepErrors[stepId] || 0) + 1;
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
                    hintViewCount: stepHints[stepId] || 0,
                    errorCount: stepErrors[stepId] || 0,
                    isDifficult: true
                });
            }
        }

        return difficultSteps;
    }

    /**
     * 检查是否为疑难点（停顿超过阈值）
     * @param {number} duration 停顿时长（毫秒）
     * @param {number} threshold 阈值（秒），默认使用DEFAULT
     */
    isDifficultPoint(duration, threshold = PAUSE_THRESHOLD.DEFAULT) {
        return duration > threshold * 1000;
    }

    /**
     * 同步日志到服务器
     */
    async _syncLogs() {
        if (!this.supabase || this.localLogs.length === 0) return;

        const logsToSync = [...this.localLogs];
        this.localLogs = [];

        const { error } = await this.supabase
            .from('vs_behavior_logs')
            .insert(logsToSync);

        if (error) {
            console.error('同步日志失败:', error);
            // 失败时放回本地队列
            this.localLogs = [...logsToSync, ...this.localLogs];
        }
    }

    /**
     * 获取会话日志
     */
    async _getSessionLogs(sessionId) {
        if (!this.supabase) {
            return this.localLogs.filter(l => l.session_id === sessionId);
        }

        const { data, error } = await this.supabase
            .from('vs_behavior_logs')
            .select('*')
            .eq('session_id', sessionId);

        return error ? [] : (data || []);
    }

    /**
     * 计算平均停留时长
     */
    _calculateAverageDuration(logs) {
        const pageViews = logs.filter(l => l.action_type === ActionType.PAGE_VIEW);
        if (pageViews.length === 0) return 0;
        
        const totalDuration = pageViews.reduce((sum, l) => sum + (l.details?.duration || 0), 0);
        return totalDuration / pageViews.length;
    }

    /**
     * 分析班级数据
     */
    _analyzeClassData(logs) {
        const students = new Set(logs.map(l => l.user_id));
        const pageViews = logs.filter(l => l.action_type === ActionType.PAGE_VIEW);
        const hints = logs.filter(l => l.action_type === ActionType.HINT_VIEW);
        const errors = logs.filter(l => l.action_type === ActionType.ERROR_OCCUR);

        return {
            totalStudents: students.size,
            averagePauseDuration: this._calculateAverageDuration(pageViews),
            hintViewRate: students.size > 0 ? hints.length / students.size : 0,
            errorRate: students.size > 0 ? errors.length / students.size : 0
        };
    }
}


// ================= 职业成长服务 =================

/**
 * 职业成长服务类
 */
class CareerService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * 获取用户职业档案
     * @param {string} userId 用户ID
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
     * @param {string} userId 用户ID
     * @param {number} xp 经验值
     * @param {string} source 来源
     */
    async addExperience(userId, xp, source) {
        const profile = await this.getCareerProfile(userId);
        const newTotalXP = profile.totalXP + xp;
        
        const updatedProfile = {
            ...profile,
            totalXP: newTotalXP,
            currentXP: profile.currentXP + xp
        };

        // 检查是否升级
        const levelUpResult = this.checkLevelUp(updatedProfile);
        if (levelUpResult) {
            updatedProfile.level = levelUpResult.newLevel;
            updatedProfile.levelTitle = levelUpResult.newTitle;
            updatedProfile.currentXP = levelUpResult.remainingXP;
        }

        // 更新XP到下一级所需
        updatedProfile.xpToNextLevel = this._calculateXPToNextLevel(updatedProfile.level, updatedProfile.currentXP);

        // 保存更新
        await this._saveProfile(userId, updatedProfile);

        return {
            profile: updatedProfile,
            xpGained: xp,
            source: source,
            levelUp: levelUpResult
        };
    }

    /**
     * 检查是否升级
     * @param {Object} profile 职业档案
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
                remainingXP: profile.totalXP - nextLevelConfig.xpRequired
            };
        }

        return null;
    }

    /**
     * 获取等级配置
     */
    getLevelConfig() {
        return LEVEL_CONFIG;
    }

    /**
     * 获取指定等级解锁的功能
     * @param {number} level 等级
     */
    getUnlockedFeatures(level) {
        const features = [];
        
        // 根据等级解锁工位
        if (level >= 1) features.push({ type: 'workstation', id: 'env-monitoring', name: '环境监测站' });
        if (level >= 2) features.push({ type: 'workstation', id: 'sampling-center', name: '采样规划中心' });
        if (level >= 3) features.push({ type: 'workstation', id: 'hazwaste-lab', name: '危废鉴别实验室' });
        if (level >= 4) features.push({ type: 'workstation', id: 'data-center', name: '数据处理中心' });
        if (level >= 5) features.push({ type: 'workstation', id: 'instrument-room', name: '仪器操作室' });
        if (level >= 8) features.push({ type: 'workstation', id: 'emergency-center', name: '应急响应中心' });

        return features;
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
     * @param {string} difficulty 难度 ('beginner'|'intermediate'|'advanced')
     * @param {number} score 得分 (0-100)
     * @param {number} baseXP 基础经验值
     */
    calculateXPReward(difficulty, score, baseXP) {
        const difficultyMultiplier = {
            'beginner': 1.0,
            'intermediate': 1.5,
            'advanced': 2.0
        };

        const scoreMultiplier = score / 100;
        const multiplier = difficultyMultiplier[difficulty] || 1.0;

        return Math.round(baseXP * multiplier * scoreMultiplier);
    }

    /**
     * 丰富档案数据
     */
    _enrichProfile(profile) {
        const levelConfig = LEVEL_CONFIG.find(c => c.level === profile.level) || LEVEL_CONFIG[0];
        const nextLevelConfig = LEVEL_CONFIG.find(c => c.level === profile.level + 1);

        return {
            ...profile,
            levelTitle: levelConfig.title,
            levelTitleCN: levelConfig.titleCN,
            levelIcon: levelConfig.icon,
            xpToNextLevel: nextLevelConfig 
                ? nextLevelConfig.xpRequired - profile.totalXP 
                : 0
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
     */
    _calculateXPToNextLevel(currentLevel, currentXP) {
        const nextLevelConfig = LEVEL_CONFIG.find(c => c.level === currentLevel + 1);
        if (!nextLevelConfig) return 0;
        
        const currentLevelConfig = LEVEL_CONFIG.find(c => c.level === currentLevel);
        const xpInCurrentLevel = currentLevelConfig ? currentLevelConfig.xpRequired : 0;
        
        return nextLevelConfig.xpRequired - xpInCurrentLevel - currentXP;
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
     */
    async grantAchievement(userId, achievementId) {
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

        return { ...achievement, isUnlocked: true, unlockedAt: record.unlocked_at };
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
     */
    async grantCertificate(userId, workstationId) {
        const certificate = {
            id: `cert_${workstationId}_${Date.now()}`,
            user_id: userId,
            workstation_id: workstationId,
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

        return certificate;
    }

    /**
     * 检查是否应颁发上岗证
     * @param {string} userId 用户ID
     * @param {string} workstationId 工位ID
     * @param {number} completedTasks 已完成任务数
     * @param {number} totalTasks 总任务数
     */
    async checkCertificateEligibility(userId, workstationId, completedTasks, totalTasks) {
        if (completedTasks >= totalTasks && totalTasks > 0) {
            const certificates = await this.getCertificates(userId);
            if (!certificates.find(c => c.workstation_id === workstationId)) {
                return await this.grantCertificate(userId, workstationId);
            }
        }
        return null;
    }

    /**
     * 生成分享卡片
     * @param {string} achievementId 成就ID
     */
    async generateShareCard(achievementId) {
        const achievement = this._getPresetAchievements().find(a => a.id === achievementId);
        if (!achievement) return null;

        // 返回分享数据（实际实现可生成图片）
        return {
            title: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            rarity: achievement.rarity,
            shareUrl: `${window.location.origin}/classroom/virtual-station.html?share=${achievementId}`
        };
    }

    /**
     * 检查成就条件
     */
    _checkCondition(condition, event) {
        switch (condition.type) {
            case 'task_complete':
                return event.type === 'task_complete' && event.taskId === condition.target;
            case 'workstation_complete':
                return event.type === 'workstation_complete' && event.workstationId === condition.target;
            case 'streak':
                return event.type === 'streak' && event.days >= condition.target;
            case 'score':
                return event.type === 'score' && event.score >= condition.target;
            case 'time':
                return event.type === 'study_time' && event.minutes >= condition.target;
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
     * 预设成就列表
     */
    _getPresetAchievements() {
        return [
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
                id: 'water-sampler',
                name: '水质采样员',
                description: '完成水质监测工位的全部任务',
                icon: 'ri-drop-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'workstation_complete', target: 'env-monitoring' },
                xpReward: 200
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
                id: 'streak-7',
                name: '连续学习7天',
                description: '连续7天登录学习',
                icon: 'ri-fire-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'streak', target: 7 },
                xpReward: 300
            },
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
                id: 'sampling-master',
                name: '采样规划大师',
                description: '完成采样规划中心的全部任务',
                icon: 'ri-map-pin-line',
                rarity: AchievementRarity.RARE,
                condition: { type: 'workstation_complete', target: 'sampling-center' },
                xpReward: 250
            },
            {
                id: 'all-stations',
                name: '全能工程师',
                description: '完成所有工位的全部任务',
                icon: 'ri-trophy-line',
                rarity: AchievementRarity.LEGENDARY,
                condition: { type: 'special', target: 'all_workstations' },
                xpReward: 1000
            }
        ];
    }
}


// ================= 导出到全局 =================

// 创建全局实例
const VirtualStation = new VirtualStationPlatform();

// 导出所有模块
if (typeof window !== 'undefined') {
    window.VirtualStation = VirtualStation;
    window.VirtualStationPlatform = VirtualStationPlatform;
    window.WorkstationService = WorkstationService;
    window.TaskFlowService = TaskFlowService;
    window.ProcessTrackerService = ProcessTrackerService;
    window.CareerService = CareerService;
    window.AchievementService = AchievementService;
    
    // 导出枚举和配置
    window.WorkstationCategory = WorkstationCategory;
    window.StageType = StageType;
    window.CareerLevel = CareerLevel;
    window.ActionType = ActionType;
    window.AchievementRarity = AchievementRarity;
    window.LEVEL_CONFIG = LEVEL_CONFIG;
    window.PAUSE_THRESHOLD = PAUSE_THRESHOLD;
    window.COMMON_ERROR_THRESHOLD = COMMON_ERROR_THRESHOLD;
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
        WorkstationCategory,
        StageType,
        CareerLevel,
        ActionType,
        AchievementRarity,
        LEVEL_CONFIG,
        PAUSE_THRESHOLD,
        COMMON_ERROR_THRESHOLD
    };
}
