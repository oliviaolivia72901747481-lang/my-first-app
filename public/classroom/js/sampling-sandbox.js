/**
 * 采样布点沙盘 - 主控制器
 * Sampling Sandbox Main Controller
 * 
 * 提供固体废物采样布点的交互式练习功能
 */

// ==================== 数据模型定义 ====================

/**
 * 采样点数据模型
 * @typedef {Object} SamplingPoint
 * @property {string} id - 唯一标识 (UUID)
 * @property {string} label - 显示标签 (S1, S2, ...)
 * @property {number} x - Canvas X坐标
 * @property {number} y - Canvas Y坐标
 * @property {number} gridRow - 网格行号
 * @property {number} gridCol - 网格列号
 * @property {number} createdAt - 创建时间戳
 * @property {Object} [properties] - 可选属性
 * @property {number} [properties.depth] - 采样深度
 * @property {string} [properties.note] - 备注
 */

/**
 * 区域数据模型
 * @typedef {Object} Area
 * @property {'rectangle'|'polygon'|'circle'} type - 区域类型
 * @property {Array<{x: number, y: number}>} [points] - 多边形顶点
 * @property {{x: number, y: number}} [center] - 圆心
 * @property {number} [radius] - 半径
 * @property {string} [color] - 显示颜色
 * @property {string} [label] - 区域标签
 */

/**
 * 场景数据模型
 * @typedef {Object} Scenario
 * @property {string} id - 场景ID
 * @property {string} name - 场景名称
 * @property {string} description - 场景描述
 * @property {'storage'|'vehicle'|'container'|'landfill'} type - 场景类型
 * @property {{width: number, height: number}} bounds - 区域边界
 * @property {Area[]} validAreas - 有效采样区域
 * @property {Area[]} invalidAreas - 无效区域
 * @property {Object} requirements - 采样要求
 * @property {number} requirements.wasteVolume - 废物堆存量(吨)
 * @property {number} requirements.minPoints - 最少采样点数
 * @property {SamplingMethod} requirements.recommendedMethod - 推荐采样方法
 * @property {SamplingPoint[]} [standardAnswer] - 标准答案
 * @property {string} [backgroundImage] - 背景图片
 * @property {number} gridSize - 网格大小
 */

/**
 * 采样方法类型
 * @typedef {'random'|'systematic'|'stratified'|'diagonal'} SamplingMethod
 */

/**
 * 验证结果
 * @typedef {Object} ValidationResult
 * @property {boolean} passed - 是否通过
 * @property {ValidationItem[]} items - 验证项列表
 * @property {string[]} suggestions - 改进建议
 */

/**
 * 验证项
 * @typedef {Object} ValidationItem
 * @property {string} name - 验证项名称
 * @property {boolean} passed - 是否通过
 * @property {string} message - 验证消息
 */

/**
 * 评分结果
 * @typedef {Object} ScoreResult
 * @property {number} totalScore - 总分 0-100
 * @property {Object} breakdown - 分项得分
 * @property {number} breakdown.pointCount - 采样点数量得分 (30%)
 * @property {number} breakdown.distribution - 分布均匀性得分 (30%)
 * @property {number} breakdown.methodCorrectness - 方法正确性得分 (20%)
 * @property {number} breakdown.operationStandard - 操作规范性得分 (20%)
 * @property {'excellent'|'good'|'pass'|'fail'} grade - 评级
 * @property {string} feedback - 反馈文字
 */

/**
 * 练习记录
 * @typedef {Object} PracticeRecord
 * @property {string} id - 记录ID
 * @property {string} scenarioId - 场景ID
 * @property {string} scenarioName - 场景名称
 * @property {SamplingMethod} method - 采样方法
 * @property {SamplingPoint[]} points - 采样点列表
 * @property {number} score - 得分
 * @property {'excellent'|'good'|'pass'|'fail'} grade - 评级
 * @property {number} timestamp - 时间戳
 */

// ==================== 预设场景数据 ====================

const SCENARIOS = {
    storage: {
        id: 'storage',
        name: '堆存场采样',
        description: '模拟固体废物堆存场的采样布点场景。根据废物堆存量确定采样点数量，采用适当的布点方法进行采样。',
        type: 'storage',
        bounds: { width: 800, height: 600 },
        validAreas: [
            {
                type: 'rectangle',
                points: [
                    { x: 50, y: 50 },
                    { x: 750, y: 50 },
                    { x: 750, y: 550 },
                    { x: 50, y: 550 }
                ],
                color: 'rgba(59, 130, 246, 0.1)',
                label: '采样区域'
            }
        ],
        invalidAreas: [
            {
                type: 'rectangle',
                points: [
                    { x: 300, y: 200 },
                    { x: 400, y: 200 },
                    { x: 400, y: 300 },
                    { x: 300, y: 300 }
                ],
                color: 'rgba(239, 68, 68, 0.3)',
                label: '危险区域'
            }
        ],
        requirements: {
            wasteVolume: 100,
            minPoints: 5,
            recommendedMethod: 'systematic'
        },
        gridSize: 50,
        // 标准答案 - 系统布点法推荐布点位置
        standardAnswer: [
            { x: 150, y: 150, label: 'S1' },
            { x: 550, y: 150, label: 'S2' },
            { x: 150, y: 400, label: 'S3' },
            { x: 550, y: 400, label: 'S4' },
            { x: 600, y: 300, label: 'S5' }
        ]
    },
    vehicle: {
        id: 'vehicle',
        name: '运输车辆采样',
        description: '模拟运输车辆装载固体废物的采样场景。需要在车厢不同位置进行多点采样。',
        type: 'vehicle',
        bounds: { width: 800, height: 400 },
        validAreas: [
            {
                type: 'rectangle',
                points: [
                    { x: 100, y: 80 },
                    { x: 700, y: 80 },
                    { x: 700, y: 320 },
                    { x: 100, y: 320 }
                ],
                color: 'rgba(59, 130, 246, 0.1)',
                label: '车厢区域'
            }
        ],
        invalidAreas: [],
        requirements: {
            wasteVolume: 20,
            minPoints: 5,
            recommendedMethod: 'diagonal'
        },
        gridSize: 40,
        // 标准答案 - 对角线布点法推荐布点位置
        standardAnswer: [
            { x: 200, y: 120, label: 'S1' },
            { x: 400, y: 200, label: 'S2' },
            { x: 600, y: 280, label: 'S3' },
            { x: 600, y: 120, label: 'S4' },
            { x: 200, y: 280, label: 'S5' }
        ]
    },
    container: {
        id: 'container',
        name: '包装容器采样',
        description: '模拟包装容器（如桶装废物）的采样场景。需要对多个容器进行采样。',
        type: 'container',
        bounds: { width: 600, height: 600 },
        validAreas: [
            {
                type: 'rectangle',
                points: [
                    { x: 50, y: 50 },
                    { x: 550, y: 50 },
                    { x: 550, y: 550 },
                    { x: 50, y: 550 }
                ],
                color: 'rgba(59, 130, 246, 0.1)',
                label: '容器存放区'
            }
        ],
        invalidAreas: [],
        requirements: {
            wasteVolume: 50,
            minPoints: 5,
            recommendedMethod: 'random'
        },
        gridSize: 50,
        // 标准答案 - 随机布点法示例布点位置
        standardAnswer: [
            { x: 120, y: 150, label: 'S1' },
            { x: 450, y: 120, label: 'S2' },
            { x: 280, y: 300, label: 'S3' },
            { x: 150, y: 480, label: 'S4' },
            { x: 480, y: 420, label: 'S5' }
        ]
    },
    landfill: {
        id: 'landfill',
        name: '填埋场采样',
        description: '模拟固体废物填埋场的采样场景。需要考虑不同填埋区域和深度的采样。',
        type: 'landfill',
        bounds: { width: 900, height: 700 },
        validAreas: [
            {
                type: 'rectangle',
                points: [
                    { x: 50, y: 50 },
                    { x: 850, y: 50 },
                    { x: 850, y: 650 },
                    { x: 50, y: 650 }
                ],
                color: 'rgba(59, 130, 246, 0.1)',
                label: '填埋区域'
            }
        ],
        invalidAreas: [
            {
                type: 'rectangle',
                points: [
                    { x: 50, y: 50 },
                    { x: 150, y: 50 },
                    { x: 150, y: 150 },
                    { x: 50, y: 150 }
                ],
                color: 'rgba(239, 68, 68, 0.3)',
                label: '设备区'
            },
            {
                type: 'rectangle',
                points: [
                    { x: 700, y: 500 },
                    { x: 850, y: 500 },
                    { x: 850, y: 650 },
                    { x: 700, y: 650 }
                ],
                color: 'rgba(239, 68, 68, 0.3)',
                label: '渗滤液池'
            }
        ],
        requirements: {
            wasteVolume: 500,
            minPoints: 8,
            recommendedMethod: 'stratified'
        },
        gridSize: 50,
        // 标准答案 - 分层布点法推荐布点位置（四个象限各2个点）
        standardAnswer: [
            { x: 250, y: 200, label: 'S1' },
            { x: 350, y: 300, label: 'S2' },
            { x: 550, y: 200, label: 'S3' },
            { x: 650, y: 300, label: 'S4' },
            { x: 250, y: 450, label: 'S5' },
            { x: 350, y: 550, label: 'S6' },
            { x: 550, y: 450, label: 'S7' },
            { x: 500, y: 550, label: 'S8' }
        ]
    }
};

// ==================== 场景管理器 ====================
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

/**
 * 场景管理器 - 管理场景数据和操作
 * Requirements: 4.1 - 显示预设场景列表
 * Requirements: 4.2 - 包含至少4种场景
 * Requirements: 4.3 - 加载对应的底图、区域边界和采样要求
 */
const ScenarioManager = {
    /**
     * 获取场景列表
     * Requirements: 4.1 - 显示预设场景列表
     * @returns {Array} 场景信息列表
     */
    getScenarioList: function() {
        return Object.keys(SCENARIOS).map(key => ({
            id: key,
            name: SCENARIOS[key].name,
            description: SCENARIOS[key].description,
            type: SCENARIOS[key].type,
            icon: this.getScenarioIcon(SCENARIOS[key].type)
        }));
    },
    
    /**
     * 获取场景图标
     * @param {string} type - 场景类型
     * @returns {string} 图标
     */
    getScenarioIcon: function(type) {
        const icons = {
            storage: '📦',
            vehicle: '🚛',
            container: '📦',
            landfill: '🏭'
        };
        return icons[type] || '📦';
    },
    
    /**
     * 加载场景
     * Requirements: 4.3 - 加载对应的底图、区域边界和采样要求
     * @param {string} id - 场景ID
     * @returns {Object|null} 场景数据
     */
    loadScenario: function(id) {
        return SCENARIOS[id] || null;
    },
    
    /**
     * 获取场景的标准答案
     * @param {string} scenarioId - 场景ID
     * @returns {Array} 标准答案采样点列表
     */
    getStandardAnswer: function(scenarioId) {
        const scenario = SCENARIOS[scenarioId];
        return scenario && scenario.standardAnswer ? scenario.standardAnswer : [];
    },
    
    /**
     * 获取场景的采样要求
     * Requirements: 4.4 - 显示该场景的采样规范说明
     * @param {string} id - 场景ID
     * @returns {Object|null} 采样要求
     */
    getScenarioRequirements: function(id) {
        const scenario = SCENARIOS[id];
        return scenario ? scenario.requirements : null;
    },
    
    /**
     * 获取场景描述
     * @param {string} id - 场景ID
     * @returns {string} 场景描述
     */
    getScenarioDescription: function(id) {
        const scenario = SCENARIOS[id];
        return scenario ? scenario.description : '';
    },
    
    /**
     * 检查场景是否存在
     * @param {string} id - 场景ID
     * @returns {boolean} 是否存在
     */
    hasScenario: function(id) {
        return SCENARIOS.hasOwnProperty(id);
    },
    
    /**
     * 获取所有场景ID
     * @returns {Array} 场景ID列表
     */
    getAllScenarioIds: function() {
        return Object.keys(SCENARIOS);
    }
};

// 导出场景管理器到全局
window.ScenarioManager = ScenarioManager;

// ==================== 采样方法配置 ====================

const METHOD_CONFIG = {
    random: {
        name: '随机布点法',
        description: '在采样区域内随机选择采样点位置，适用于废物分布均匀的场景。',
        applicableScenarios: ['storage', 'container'],
        helpers: {
            showGrid: false,
            showDiagonal: false,
            enableSnap: false
        }
    },
    systematic: {
        name: '系统布点法（网格法）',
        description: '将采样区域划分为网格，在网格交点或中心布点，适用于大面积堆存场。',
        applicableScenarios: ['storage', 'landfill'],
        helpers: {
            showGrid: true,
            showDiagonal: false,
            enableSnap: true
        }
    },
    stratified: {
        name: '分层布点法',
        description: '先将区域划分为若干层或区块，再在各层内布点，适用于废物分布不均的场景。',
        applicableScenarios: ['landfill', 'storage'],
        helpers: {
            showGrid: true,
            showDiagonal: false,
            enableSnap: false
        }
    },
    diagonal: {
        name: '对角线布点法',
        description: '沿对角线方向布置采样点，适用于车辆、容器等规则形状的采样。',
        applicableScenarios: ['vehicle', 'container'],
        helpers: {
            showGrid: false,
            showDiagonal: true,
            enableSnap: false
        }
    }
};

// ==================== 知识点提示系统 ====================
// Requirements: 8.1, 8.2, 8.3, 8.5, 8.6 - 知识点提示系统

/**
 * 知识点提示数据
 * Requirements: 8.2 - 选择采样方法时显示说明
 * Requirements: 8.3 - 添加采样点时显示相关国标
 */
const KNOWLEDGE_TIPS = {
    random: '随机布点法要求采样点位置完全随机，可使用随机数表或计算机生成随机坐标。每个位置被选中的概率应相等。',
    systematic: '系统布点法（网格法）将采样区域划分为等面积的网格单元，在每个单元的固定位置（如中心或交点）采样。网格间距应根据废物堆存量确定。',
    stratified: '分层布点法先根据废物特性（如颜色、粒度、来源）将区域划分为若干层，再在各层内按比例布点。适用于废物分布不均匀的情况。',
    diagonal: '对角线布点法沿采样区域的对角线方向等距布置采样点。适用于车辆、容器等规则形状，通常在两条对角线上各布置若干点。',
    pointCount: '根据《固体废物采样制样技术规范》(HJ/T 20)，采样点数量应根据废物堆存量确定：≤50吨时最少5个点，每增加50吨增加1个点。',
    distribution: '采样点应均匀分布在整个采样区域内，避免集中在某一区域。可通过计算覆盖率来评估分布均匀性。'
};

/**
 * 采样方法详细说明
 * Requirements: 8.2 - 显示适用场景和操作要点
 */
const METHOD_DETAILS = {
    random: {
        name: '随机布点法',
        description: '在采样区域内随机选择采样点位置，适用于废物分布均匀的场景。',
        applicableScenarios: '适用于废物成分均匀、堆存形状规则的场景，如均质化处理后的废物堆。',
        operationPoints: [
            '使用随机数表或计算机生成随机坐标',
            '确保每个位置被选中的概率相等',
            '避免人为选择"看起来有代表性"的位置',
            '采样点数量应满足国标最低要求'
        ],
        nationalStandard: 'HJ/T 20-1998 第5.2.1条'
    },
    systematic: {
        name: '系统布点法（网格法）',
        description: '将采样区域划分为网格，在网格交点或中心布点，适用于大面积堆存场。',
        applicableScenarios: '适用于大面积堆存场、填埋场等需要系统覆盖的场景。',
        operationPoints: [
            '将采样区域划分为等面积的网格单元',
            '在每个网格单元的固定位置（中心或交点）采样',
            '网格间距根据废物堆存量和采样点数确定',
            '确保网格覆盖整个采样区域'
        ],
        nationalStandard: 'HJ/T 20-1998 第5.2.2条'
    },
    stratified: {
        name: '分层布点法',
        description: '先将区域划分为若干层或区块，再在各层内布点，适用于废物分布不均的场景。',
        applicableScenarios: '适用于废物成分不均匀、存在明显分层或分区的场景。',
        operationPoints: [
            '根据废物特性（颜色、粒度、来源等）划分层次',
            '各层内采样点数量与该层面积或体积成比例',
            '每层内可采用随机或系统布点',
            '确保各层都有足够的采样点'
        ],
        nationalStandard: 'HJ/T 20-1998 第5.2.3条'
    },
    diagonal: {
        name: '对角线布点法',
        description: '沿对角线方向布置采样点，适用于车辆、容器等规则形状的采样。',
        applicableScenarios: '适用于运输车辆、包装容器等规则形状的采样场景。',
        operationPoints: [
            '沿采样区域的两条对角线布置采样点',
            '采样点在对角线上等距分布',
            '对角线交点（中心）应设置采样点',
            '适合矩形或正方形采样区域'
        ],
        nationalStandard: 'HJ/T 20-1998 第5.2.4条'
    }
};

/**
 * 国标条款数据
 * Requirements: 8.3 - 添加采样点时显示相关国标条款
 */
const NATIONAL_STANDARDS = {
    // 采样点数量相关
    pointCount: {
        title: '采样点数量要求',
        standard: 'HJ/T 20-1998',
        clause: '第5.1条',
        content: '采样点数量应根据废物堆存量确定。堆存量≤50吨时，最少采样5个点；堆存量>50吨时，每增加50吨增加1个采样点。',
        formula: 'n = √(废物量/采样单元面积)，最少5个'
    },
    // 采样深度相关
    samplingDepth: {
        title: '采样深度要求',
        standard: 'HJ/T 20-1998',
        clause: '第5.3条',
        content: '对于堆存废物，应在不同深度采样。表层采样深度为0-30cm，中层为废物堆高度的1/2处，底层为距底部30cm处。'
    },
    // 采样位置相关
    samplingPosition: {
        title: '采样位置要求',
        standard: 'HJ/T 20-1998',
        clause: '第5.4条',
        content: '采样点应避开废物堆边缘、雨水冲刷区域、明显异常区域。采样点之间应保持适当距离，确保代表性。'
    },
    // 样品量相关
    sampleAmount: {
        title: '样品量要求',
        standard: 'HJ/T 20-1998',
        clause: '第6.1条',
        content: '每个采样点的样品量应不少于1kg。混合样品总量应满足分析测试需要，一般不少于2kg。'
    },
    // 采样工具相关
    samplingTools: {
        title: '采样工具要求',
        standard: 'HJ/T 20-1998',
        clause: '第4.1条',
        content: '采样工具应使用不锈钢或塑料材质，避免对样品造成污染。采样前应清洗干净，必要时进行消毒处理。'
    }
};

/**
 * 术语解释数据
 * Requirements: 8.6 - 术语tooltip解释
 */
const TERMINOLOGY = {
    '采样点': '在采样区域内选定的用于采集样品的具体位置。',
    '采样单元': '将采样区域划分后的最小采样区块，通常为网格单元。',
    '代表性样品': '能够反映整批废物特性的样品，通过科学的采样方法获得。',
    '混合样品': '将多个采样点的样品按比例混合后得到的样品。',
    '堆存量': '固体废物在堆存场所的总存放量，通常以吨为单位。',
    '覆盖率': '采样点覆盖的网格单元数与总网格单元数的比值。',
    '网格吸附': '将采样点自动对齐到最近的网格交点的功能。',
    '有效区域': '允许进行采样的区域，通常为废物堆存的主体区域。',
    '禁止区域': '不允许进行采样的区域，如危险区域、设备区等。',
    '分布均匀性': '采样点在采样区域内分布的均匀程度。'
};

/**
 * 完整操作手册内容
 * Requirements: 8.5 - 显示完整的操作手册和知识点汇总
 */
const OPERATION_MANUAL = {
    title: '采样布点沙盘操作手册',
    sections: [
        {
            title: '基本操作',
            items: [
                '点击画布空白区域添加采样点',
                '拖拽采样点可移动位置',
                '右键点击采样点可删除或编辑属性',
                '使用鼠标滚轮缩放画布',
                '按住Shift键拖拽可平移画布'
            ]
        },
        {
            title: '采样方法选择',
            items: [
                '随机布点法：适用于均匀分布的废物',
                '系统布点法：适用于大面积堆存场',
                '分层布点法：适用于分布不均的废物',
                '对角线布点法：适用于车辆、容器采样'
            ]
        },
        {
            title: '辅助工具',
            items: [
                '网格吸附：自动对齐到网格交点',
                '距离测量：显示采样点间距离',
                '自动布点：根据方法自动生成布点',
                '撤销/重做：支持操作历史回退'
            ]
        },
        {
            title: '验证与评分',
            items: [
                '验证方案：检查布点是否符合国标',
                '提交评分：获取综合评分和反馈',
                '评分维度：数量、分布、方法、规范'
            ]
        }
    ]
};


// ==================== 主控制器 ====================

const SamplingSandbox = (function() {
    // 私有状态
    let canvas = null;
    let ctx = null;
    let containerEl = null;
    
    // 当前状态
    let currentScenario = null;
    let currentMethod = 'random';
    let samplingPoints = [];
    let pointCounter = 0;
    
    // 视图状态
    let zoom = 1.0;
    let panX = 0;
    let panY = 0;
    
    // 交互状态
    let isDragging = false;
    let isPanning = false;
    let draggedPoint = null;
    let selectedPoint = null;
    let lastMousePos = { x: 0, y: 0 };
    let hoveredCell = null; // 当前悬停的网格单元 {row, col}
    
    // 工具状态
    let snapEnabled = false;
    let distanceEnabled = false;
    
    // 操作历史（用于撤销/重做）
    let history = [];
    let historyIndex = -1;
    const MAX_HISTORY = 50;
    
    // 首次访问标记
    const FIRST_VISIT_KEY = 'sampling_sandbox_first_visit';
    
    // ==================== 初始化 ====================
    
    function init() {
        // 获取Canvas元素
        canvas = document.getElementById('sandbox-canvas');
        ctx = canvas.getContext('2d');
        containerEl = document.getElementById('canvas-container');
        
        // 设置Canvas尺寸
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // 绑定事件
        bindEvents();
        
        // 加载默认场景
        loadScenario('storage');
        
        // 检查URL参数是否启用演示模式 (Requirements: 10.1)
        const isDemoMode = checkDemonstrationModeFromURL();
        
        // 检查是否首次访问
        if (!localStorage.getItem(FIRST_VISIT_KEY)) {
            if (isDemoMode) {
                // 演示模式下显示模式选择对话框
                hideGuide();
                showDemonstrationModeDialog();
            } else {
                showGuide();
            }
            localStorage.setItem(FIRST_VISIT_KEY, 'true');
        } else {
            hideGuide();
            // 如果URL指定了演示模式，直接启用
            if (isDemoMode) {
                enableDemonstrationMode();
            }
        }
        
        // 初始渲染
        render();
        
        console.log('🎯 采样布点沙盘初始化完成' + (isDemoMode ? ' (演示模式)' : ''));
    }
    
    function resizeCanvas() {
        if (!containerEl || !canvas) return;
        
        const rect = containerEl.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        render();
    }
    
    // ==================== 事件绑定 ====================
    
    function bindEvents() {
        // 鼠标事件
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('contextmenu', handleContextMenu);
        
        // 点击隐藏右键菜单
        document.addEventListener('click', hideContextMenu);
        
        // 键盘快捷键
        document.addEventListener('keydown', handleKeyDown);
    }
    
    function handleMouseDown(e) {
        const pos = getMousePos(e);
        const canvasPos = screenToCanvas(pos.x, pos.y);
        
        // 右键不处理（由contextmenu处理）
        if (e.button === 2) return;
        
        // 检查是否点击了采样点
        const clickedPoint = findPointAt(canvasPos.x, canvasPos.y);
        
        if (clickedPoint) {
            // 开始拖拽采样点
            isDragging = true;
            draggedPoint = clickedPoint;
            selectedPoint = clickedPoint;
        } else if (e.button === 1 || e.shiftKey) {
            // 中键或Shift+左键开始平移
            isPanning = true;
            lastMousePos = pos;
        } else {
            // 左键点击空白区域，添加采样点
            addPoint(canvasPos.x, canvasPos.y);
        }
    }
    
    function handleMouseMove(e) {
        const pos = getMousePos(e);
        const canvasPos = screenToCanvas(pos.x, pos.y);
        
        // 更新坐标显示
        updateCoordDisplay(canvasPos.x, canvasPos.y);
        
        // 更新悬停的网格单元
        updateHoveredCell(canvasPos.x, canvasPos.y);
        
        if (isDragging && draggedPoint) {
            // 拖拽采样点
            movePoint(draggedPoint.id, canvasPos.x, canvasPos.y);
        } else if (isPanning) {
            // 平移画布
            const dx = pos.x - lastMousePos.x;
            const dy = pos.y - lastMousePos.y;
            pan(dx, dy);
            lastMousePos = pos;
        }
        
        render();
    }
    
    /**
     * 更新当前悬停的网格单元
     * @param {number} x - Canvas X坐标
     * @param {number} y - Canvas Y坐标
     */
    function updateHoveredCell(x, y) {
        if (!currentScenario) {
            hoveredCell = null;
            return;
        }
        
        const gridSize = currentScenario.gridSize;
        const bounds = currentScenario.bounds;
        
        // 检查是否在场景边界内
        if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
            hoveredCell = null;
            return;
        }
        
        const col = Math.floor(x / gridSize);
        const row = Math.floor(y / gridSize);
        
        hoveredCell = { row, col };
    }
    
    function handleMouseUp(e) {
        if (isDragging && draggedPoint) {
            // 保存拖拽操作到历史
            saveHistory();
        }
        
        isDragging = false;
        draggedPoint = null;
        isPanning = false;
    }
    
    function handleMouseLeave(e) {
        isDragging = false;
        draggedPoint = null;
        isPanning = false;
        hoveredCell = null;
        render();
    }
    
    function handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.5, Math.min(2.0, zoom + delta));
        
        setZoom(newZoom);
    }
    
    function handleContextMenu(e) {
        e.preventDefault();
        
        const pos = getMousePos(e);
        const canvasPos = screenToCanvas(pos.x, pos.y);
        const clickedPoint = findPointAt(canvasPos.x, canvasPos.y);
        
        if (clickedPoint) {
            selectedPoint = clickedPoint;
            showContextMenu(e.clientX, e.clientY);
        }
    }
    
    function handleKeyDown(e) {
        // Ctrl+Z 撤销
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        // Ctrl+Y 重做
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
        }
        // Delete 删除选中的采样点
        if (e.key === 'Delete' && selectedPoint) {
            deletePoint(selectedPoint.id);
            selectedPoint = null;
        }
    }
    
    // ==================== 坐标转换 ====================
    // Requirements: 1.2, 1.5 - 实现坐标转换函数（屏幕坐标↔Canvas坐标↔网格坐标）
    
    /**
     * 获取鼠标在Canvas元素上的位置（屏幕坐标）
     * @param {MouseEvent} e - 鼠标事件
     * @returns {{x: number, y: number}} 屏幕坐标
     */
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    /**
     * 屏幕坐标转换为Canvas坐标
     * 考虑当前的缩放和平移变换
     * @param {number} screenX - 屏幕X坐标
     * @param {number} screenY - 屏幕Y坐标
     * @returns {{x: number, y: number}} Canvas坐标
     */
    function screenToCanvas(screenX, screenY) {
        return {
            x: (screenX - panX) / zoom,
            y: (screenY - panY) / zoom
        };
    }
    
    /**
     * Canvas坐标转换为屏幕坐标
     * 考虑当前的缩放和平移变换
     * @param {number} canvasX - Canvas X坐标
     * @param {number} canvasY - Canvas Y坐标
     * @returns {{x: number, y: number}} 屏幕坐标
     */
    function canvasToScreen(canvasX, canvasY) {
        return {
            x: canvasX * zoom + panX,
            y: canvasY * zoom + panY
        };
    }
    
    /**
     * Canvas坐标转换为网格坐标
     * @param {number} canvasX - Canvas X坐标
     * @param {number} canvasY - Canvas Y坐标
     * @returns {{row: number, col: number}} 网格坐标（行、列）
     */
    function canvasToGrid(canvasX, canvasY) {
        if (!currentScenario) return { row: 0, col: 0 };
        const gridSize = currentScenario.gridSize;
        return {
            row: Math.floor(canvasY / gridSize),
            col: Math.floor(canvasX / gridSize)
        };
    }
    
    /**
     * 网格坐标转换为Canvas坐标（网格中心点）
     * @param {number} row - 网格行号
     * @param {number} col - 网格列号
     * @returns {{x: number, y: number}} Canvas坐标（网格中心）
     */
    function gridToCanvas(row, col) {
        if (!currentScenario) return { x: 0, y: 0 };
        const gridSize = currentScenario.gridSize;
        return {
            x: col * gridSize + gridSize / 2,
            y: row * gridSize + gridSize / 2
        };
    }
    
    /**
     * 将坐标吸附到最近的网格交点
     * Requirements: 3.3, 7.2 - 网格吸附功能
     * 
     * 网格吸附计算正确性 (Property 5):
     * 对于任意启用网格吸附时的点击位置，创建的采样点坐标应位于最近的网格交点上
     * 
     * @param {number} x - Canvas X坐标
     * @param {number} y - Canvas Y坐标
     * @returns {{x: number, y: number}} 吸附后的坐标
     */
    function snapToGrid(x, y) {
        if (!currentScenario || !snapEnabled) return { x, y };
        
        const gridSize = currentScenario.gridSize;
        
        // 计算最近的网格交点
        const snappedX = Math.round(x / gridSize) * gridSize;
        const snappedY = Math.round(y / gridSize) * gridSize;
        
        return {
            x: snappedX,
            y: snappedY
        };
    }
    
    /**
     * 计算到最近网格交点的距离
     * @param {number} x - Canvas X坐标
     * @param {number} y - Canvas Y坐标
     * @returns {number} 到最近网格交点的距离
     */
    function distanceToNearestGridPoint(x, y) {
        if (!currentScenario) return 0;
        
        const gridSize = currentScenario.gridSize;
        const nearestX = Math.round(x / gridSize) * gridSize;
        const nearestY = Math.round(y / gridSize) * gridSize;
        
        return Math.sqrt(Math.pow(x - nearestX, 2) + Math.pow(y - nearestY, 2));
    }
    
    /**
     * 获取最近的网格交点坐标
     * Requirements: 3.3 - 计算最近网格交点
     * @param {number} x - Canvas X坐标
     * @param {number} y - Canvas Y坐标
     * @returns {{x: number, y: number}} 最近的网格交点坐标
     */
    function getNearestGridPoint(x, y) {
        if (!currentScenario) return { x, y };
        
        const gridSize = currentScenario.gridSize;
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }
    
    /**
     * 检查坐标是否在网格交点上
     * @param {number} x - Canvas X坐标
     * @param {number} y - Canvas Y坐标
     * @param {number} tolerance - 容差（默认1像素）
     * @returns {boolean} 是否在网格交点上
     */
    function isOnGridPoint(x, y, tolerance = 1) {
        if (!currentScenario) return false;
        
        const gridSize = currentScenario.gridSize;
        const nearestX = Math.round(x / gridSize) * gridSize;
        const nearestY = Math.round(y / gridSize) * gridSize;
        
        return Math.abs(x - nearestX) <= tolerance && Math.abs(y - nearestY) <= tolerance;
    }
    
    // ==================== 视图控制 ====================
    
    function setZoom(scale) {
        // 限制缩放范围 50%-200%
        zoom = Math.max(0.5, Math.min(2.0, scale));
        updateZoomDisplay();
        render();
    }
    
    function zoomIn() {
        setZoom(zoom + 0.1);
    }
    
    function zoomOut() {
        setZoom(zoom - 0.1);
    }
    
    function pan(dx, dy) {
        panX += dx;
        panY += dy;
        render();
    }
    
    function resetView() {
        zoom = 1.0;
        panX = 0;
        panY = 0;
        updateZoomDisplay();
        render();
    }
    
    function updateZoomDisplay() {
        const zoomEl = document.getElementById('zoom-level');
        if (zoomEl) {
            zoomEl.textContent = Math.round(zoom * 100) + '%';
        }
    }
    
    function updateCoordDisplay(x, y) {
        const coordEl = document.getElementById('coord-display');
        if (coordEl) {
            const grid = canvasToGrid(x, y);
            coordEl.textContent = `坐标: (${Math.round(x)}, ${Math.round(y)}) | 网格: (${grid.row}, ${grid.col})`;
        }
    }
    
    // ==================== 采样点管理 ====================
    
    function generatePointId() {
        return 'point_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function generatePointLabel() {
        pointCounter++;
        return 'S' + pointCounter;
    }
    
    function addPoint(x, y) {
        if (!currentScenario) return null;
        
        // 应用网格吸附
        const snappedPos = snapToGrid(x, y);
        x = snappedPos.x;
        y = snappedPos.y;
        
        // 检查是否在有效区域内
        if (!isPointInValidArea(x, y)) {
            showMessage('该位置不可采样，请选择有效区域');
            return null;
        }
        
        // 检查是否在无效区域内
        if (isPointInInvalidArea(x, y)) {
            showMessage('该位置位于禁止区域，无法添加采样点');
            return null;
        }
        
        const grid = canvasToGrid(x, y);
        
        const point = {
            id: generatePointId(),
            label: generatePointLabel(),
            x: x,
            y: y,
            gridRow: grid.row,
            gridCol: grid.col,
            createdAt: Date.now(),
            properties: {}
        };
        
        samplingPoints.push(point);
        saveHistory();
        updateStats();
        render();
        
        // 更新知识点提示 - 显示相关国标条款
        // Requirements: 8.3 - 添加采样点时在侧边栏显示相关国标条款
        showPointAddedTip(samplingPoints.length);
        
        return point;
    }
    
    function movePoint(pointId, x, y) {
        const point = samplingPoints.find(p => p.id === pointId);
        if (!point) return false;
        
        // 应用网格吸附
        const snappedPos = snapToGrid(x, y);
        x = snappedPos.x;
        y = snappedPos.y;
        
        // 检查新位置是否有效
        if (!isPointInValidArea(x, y) || isPointInInvalidArea(x, y)) {
            return false;
        }
        
        const grid = canvasToGrid(x, y);
        
        point.x = x;
        point.y = y;
        point.gridRow = grid.row;
        point.gridCol = grid.col;
        
        updateStats();
        render();
        
        return true;
    }
    
    function deletePoint(pointId) {
        const index = samplingPoints.findIndex(p => p.id === pointId);
        if (index === -1) return false;
        
        samplingPoints.splice(index, 1);
        saveHistory();
        updateStats();
        render();
        
        return true;
    }
    
    /**
     * 清空所有采样点
     * Requirements: 7.6 - 清空所有采样点并重置状态
     * 
     * @param {boolean} skipConfirm - 是否跳过确认对话框（用于程序调用）
     * @returns {boolean} 是否成功清空
     */
    function clearAllPoints(skipConfirm = false) {
        if (samplingPoints.length === 0) return false;
        
        if (!skipConfirm && !confirm('确定要清空所有采样点吗？')) return false;
        
        // 清空采样点数组
        samplingPoints = [];
        // 重置计数器
        pointCounter = 0;
        // 清除选中状态
        selectedPoint = null;
        draggedPoint = null;
        
        // 保存到历史记录（支持撤销）
        saveHistory();
        // 更新统计信息
        updateStats();
        // 重新渲染
        render();
        
        return true;
    }
    
    function findPointAt(x, y, radius = 15) {
        // 从后往前查找（后添加的在上层）
        for (let i = samplingPoints.length - 1; i >= 0; i--) {
            const point = samplingPoints[i];
            const dx = point.x - x;
            const dy = point.y - y;
            if (Math.sqrt(dx * dx + dy * dy) <= radius / zoom) {
                return point;
            }
        }
        return null;
    }
    
    // ==================== 区域验证 ====================
    
    function isPointInValidArea(x, y) {
        if (!currentScenario || currentScenario.validAreas.length === 0) {
            return true; // 没有定义有效区域时，默认全部有效
        }
        
        return currentScenario.validAreas.some(area => isPointInArea(x, y, area));
    }
    
    function isPointInInvalidArea(x, y) {
        if (!currentScenario || currentScenario.invalidAreas.length === 0) {
            return false;
        }
        
        return currentScenario.invalidAreas.some(area => isPointInArea(x, y, area));
    }
    
    function isPointInArea(x, y, area) {
        if (area.type === 'rectangle' && area.points && area.points.length >= 4) {
            const minX = Math.min(...area.points.map(p => p.x));
            const maxX = Math.max(...area.points.map(p => p.x));
            const minY = Math.min(...area.points.map(p => p.y));
            const maxY = Math.max(...area.points.map(p => p.y));
            
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        }
        
        if (area.type === 'circle' && area.center && area.radius) {
            const dx = x - area.center.x;
            const dy = y - area.center.y;
            return Math.sqrt(dx * dx + dy * dy) <= area.radius;
        }
        
        // 多边形使用射线法
        if (area.type === 'polygon' && area.points) {
            return isPointInPolygon(x, y, area.points);
        }
        
        return false;
    }
    
    function isPointInPolygon(x, y, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    
    // ==================== 场景管理 ====================
    // Requirements: 4.1, 4.3, 4.4, 4.5 - 场景选择和切换功能
    
    /**
     * 加载场景
     * Requirements: 4.3 - 加载对应的底图、区域边界和采样要求
     * Requirements: 4.5 - 切换场景时清空当前采样点并重置画布
     * 
     * 场景切换状态重置 (Property 6):
     * 对于任意场景切换操作，切换后采样点数组应为空
     * 
     * @param {string} scenarioId - 场景ID
     */
    function loadScenario(scenarioId) {
        const scenario = SCENARIOS[scenarioId];
        if (!scenario) {
            console.error('场景不存在:', scenarioId);
            return;
        }
        
        currentScenario = scenario;
        
        // Requirements: 4.5 - 清空采样点（Property 6: 场景切换状态重置）
        samplingPoints = [];
        pointCounter = 0;
        history = [];
        historyIndex = -1;
        selectedPoint = null;
        
        // 重置视图
        resetView();
        
        // 更新场景选择器UI同步
        updateScenarioSelector(scenarioId);
        
        // 更新UI
        updateScenarioInfo();
        updateStats();
        
        // 根据场景推荐方法
        setSamplingMethod(scenario.requirements.recommendedMethod);
        
        // 重置验证UI
        resetValidationUI();
        
        render();
        
        console.log('📦 加载场景:', scenario.name);
    }
    
    /**
     * 获取当前场景
     * @returns {Object|null} 当前场景
     */
    function getCurrentScenario() {
        return currentScenario;
    }
    
    /**
     * 获取场景列表
     * Requirements: 4.1 - 显示预设场景列表
     * @returns {Array} 场景列表
     */
    function getScenarioList() {
        return ScenarioManager.getScenarioList();
    }
    
    /**
     * 获取场景的标准答案
     * @param {string} scenarioId - 场景ID（可选，默认当前场景）
     * @returns {Array} 标准答案采样点列表
     */
    function getStandardAnswer(scenarioId) {
        const id = scenarioId || (currentScenario ? currentScenario.id : null);
        return id ? ScenarioManager.getStandardAnswer(id) : [];
    }
    
    /**
     * 更新场景选择器UI
     * Requirements: 4.1 - 场景选择器同步
     * @param {string} scenarioId - 场景ID
     */
    function updateScenarioSelector(scenarioId) {
        const selectEl = document.getElementById('scenario-select');
        if (selectEl && selectEl.value !== scenarioId) {
            selectEl.value = scenarioId;
        }
    }
    
    /**
     * 更新场景信息显示
     * Requirements: 4.4 - 显示该场景的采样规范说明
     */
    function updateScenarioInfo() {
        if (!currentScenario) return;
        
        const titleEl = document.getElementById('scenario-title');
        const descEl = document.getElementById('scenario-desc');
        const volumeEl = document.getElementById('waste-volume');
        const methodEl = document.getElementById('recommended-method');
        const minPointsEl = document.getElementById('min-points');
        
        if (titleEl) {
            const icon = ScenarioManager.getScenarioIcon(currentScenario.type);
            titleEl.textContent = icon + ' ' + currentScenario.name;
        }
        if (descEl) descEl.textContent = currentScenario.description;
        if (volumeEl) volumeEl.textContent = currentScenario.requirements.wasteVolume + ' 吨';
        if (methodEl) methodEl.textContent = METHOD_CONFIG[currentScenario.requirements.recommendedMethod]?.name || '-';
        if (minPointsEl) minPointsEl.textContent = currentScenario.requirements.minPoints;
    }
    
    /**
     * 重置验证UI
     */
    function resetValidationUI() {
        const listEl = document.getElementById('validation-list');
        if (listEl) {
            listEl.innerHTML = `
                <div class="validation-item">
                    <span class="status pending">○</span>
                    <span>采样点数量</span>
                </div>
                <div class="validation-item">
                    <span class="status pending">○</span>
                    <span>分布均匀性</span>
                </div>
                <div class="validation-item">
                    <span class="status pending">○</span>
                    <span>位置有效性</span>
                </div>
            `;
        }
    }
    
    // ==================== 采样方法 ====================
    // Requirements: 3.1, 3.2, 3.6 - 采样方法选择器实现
    
    /**
     * 设置当前采样方法
     * Requirements: 3.1 - 显示可用的采样方法列表
     * Requirements: 3.2 - 切换到随机布点模式并显示相关说明
     * Requirements: 3.6 - 保留已有采样点但更新辅助显示
     * @param {SamplingMethod} method - 采样方法
     */
    function setSamplingMethod(method) {
        if (!METHOD_CONFIG[method]) return;
        
        const previousMethod = currentMethod;
        currentMethod = method;
        
        // 更新UI - 高亮选中的方法
        document.querySelectorAll('.method-item').forEach(el => {
            el.classList.toggle('active', el.dataset.method === method);
        });
        
        // 更新工具状态 - 根据方法配置启用/禁用网格吸附
        const config = METHOD_CONFIG[method].helpers;
        snapEnabled = config.enableSnap;
        updateToolButtonState('btn-snap', snapEnabled);
        
        // 更新知识点提示 - 显示该方法的适用场景和操作要点
        // Requirements: 8.2 - 选择采样方法时显示说明
        showMethodDetails(method);
        
        // 更新方法说明显示
        updateMethodDescription(method);
        
        // 注意：保留已有采样点（Requirements: 3.6）
        // 不清空 samplingPoints 数组
        
        // 重新渲染以更新辅助显示（网格线、对角线等）
        render();
        
        console.log(`📐 切换采样方法: ${METHOD_CONFIG[previousMethod]?.name || previousMethod} → ${METHOD_CONFIG[method].name}`);
    }
    
    /**
     * 获取当前采样方法
     * @returns {SamplingMethod} 当前采样方法
     */
    function getSamplingMethod() {
        return currentMethod;
    }
    
    /**
     * 获取采样方法配置
     * @param {SamplingMethod} method - 采样方法
     * @returns {Object} 方法配置
     */
    function getMethodConfig(method) {
        return METHOD_CONFIG[method] || null;
    }
    
    /**
     * 获取所有可用的采样方法列表
     * Requirements: 3.1 - 显示可用的采样方法列表
     * @returns {Array} 方法列表
     */
    function getAvailableMethods() {
        return Object.keys(METHOD_CONFIG).map(key => ({
            id: key,
            ...METHOD_CONFIG[key]
        }));
    }
    
    /**
     * 更新方法说明显示
     * Requirements: 3.2 - 显示相关说明
     * @param {SamplingMethod} method - 采样方法
     */
    function updateMethodDescription(method) {
        const config = METHOD_CONFIG[method];
        if (!config) return;
        
        // 更新方法说明区域（如果存在）
        const descEl = document.getElementById('method-description');
        if (descEl) {
            descEl.textContent = config.description;
        }
        
        // 更新适用场景提示
        const scenariosEl = document.getElementById('method-scenarios');
        if (scenariosEl && config.applicableScenarios) {
            const scenarioNames = config.applicableScenarios.map(s => {
                const scenario = SCENARIOS[s];
                return scenario ? scenario.name : s;
            });
            scenariosEl.textContent = '适用场景: ' + scenarioNames.join('、');
        }
        
        // 显示辅助功能状态
        const helpersEl = document.getElementById('method-helpers');
        if (helpersEl) {
            const helpers = [];
            if (config.helpers.showGrid) helpers.push('显示网格');
            if (config.helpers.showDiagonal) helpers.push('显示对角线');
            if (config.helpers.enableSnap) helpers.push('网格吸附');
            helpersEl.textContent = helpers.length > 0 ? '辅助功能: ' + helpers.join('、') : '';
        }
    }
    
    /**
     * 检查当前方法是否适用于指定场景
     * @param {SamplingMethod} method - 采样方法
     * @param {string} scenarioId - 场景ID
     * @returns {boolean} 是否适用
     */
    function isMethodApplicable(method, scenarioId) {
        const config = METHOD_CONFIG[method];
        if (!config) return false;
        return config.applicableScenarios.includes(scenarioId);
    }
    
    // ==================== 辅助工具 ====================
    
    function toggleSnap() {
        snapEnabled = !snapEnabled;
        updateToolButtonState('btn-snap', snapEnabled);
    }
    
    function toggleDistance() {
        distanceEnabled = !distanceEnabled;
        updateToolButtonState('btn-distance', distanceEnabled);
        render();
    }
    
    function updateToolButtonState(btnId, active) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.classList.toggle('active', active);
        }
    }
    
    function autoPlace() {
        if (!currentScenario) return;
        
        if (samplingPoints.length > 0) {
            if (!confirm('自动布点将清空现有采样点，是否继续？')) return;
        }
        
        samplingPoints = [];
        pointCounter = 0;
        
        const bounds = currentScenario.bounds;
        const minPoints = currentScenario.requirements.minPoints;
        const gridSize = currentScenario.gridSize;
        
        // 根据采样方法生成推荐布点
        switch (currentMethod) {
            case 'systematic':
                autoPlaceSystematic(bounds, minPoints, gridSize);
                break;
            case 'diagonal':
                autoPlaceDiagonal(bounds, minPoints);
                break;
            case 'stratified':
                autoPlaceStratified(bounds, minPoints);
                break;
            default:
                autoPlaceRandom(bounds, minPoints);
        }
        
        saveHistory();
        updateStats();
        render();
    }
    
    function autoPlaceRandom(bounds, count) {
        const validArea = currentScenario.validAreas[0];
        if (!validArea) return;
        
        const minX = Math.min(...validArea.points.map(p => p.x));
        const maxX = Math.max(...validArea.points.map(p => p.x));
        const minY = Math.min(...validArea.points.map(p => p.y));
        const maxY = Math.max(...validArea.points.map(p => p.y));
        
        let attempts = 0;
        while (samplingPoints.length < count && attempts < count * 10) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);
            
            if (isPointInValidArea(x, y) && !isPointInInvalidArea(x, y)) {
                const grid = canvasToGrid(x, y);
                samplingPoints.push({
                    id: generatePointId(),
                    label: generatePointLabel(),
                    x: x,
                    y: y,
                    gridRow: grid.row,
                    gridCol: grid.col,
                    createdAt: Date.now(),
                    properties: {}
                });
            }
            attempts++;
        }
    }
    
    function autoPlaceSystematic(bounds, count, gridSize) {
        const validArea = currentScenario.validAreas[0];
        if (!validArea) return;
        
        const minX = Math.min(...validArea.points.map(p => p.x));
        const maxX = Math.max(...validArea.points.map(p => p.x));
        const minY = Math.min(...validArea.points.map(p => p.y));
        const maxY = Math.max(...validArea.points.map(p => p.y));
        
        // 计算网格间距
        const cols = Math.ceil(Math.sqrt(count * (maxX - minX) / (maxY - minY)));
        const rows = Math.ceil(count / cols);
        const stepX = (maxX - minX) / (cols + 1);
        const stepY = (maxY - minY) / (rows + 1);
        
        for (let r = 1; r <= rows && samplingPoints.length < count; r++) {
            for (let c = 1; c <= cols && samplingPoints.length < count; c++) {
                const x = minX + c * stepX;
                const y = minY + r * stepY;
                
                if (isPointInValidArea(x, y) && !isPointInInvalidArea(x, y)) {
                    const grid = canvasToGrid(x, y);
                    samplingPoints.push({
                        id: generatePointId(),
                        label: generatePointLabel(),
                        x: x,
                        y: y,
                        gridRow: grid.row,
                        gridCol: grid.col,
                        createdAt: Date.now(),
                        properties: {}
                    });
                }
            }
        }
    }
    
    function autoPlaceDiagonal(bounds, count) {
        const validArea = currentScenario.validAreas[0];
        if (!validArea) return;
        
        const minX = Math.min(...validArea.points.map(p => p.x));
        const maxX = Math.max(...validArea.points.map(p => p.x));
        const minY = Math.min(...validArea.points.map(p => p.y));
        const maxY = Math.max(...validArea.points.map(p => p.y));
        
        // 在两条对角线上布点
        const pointsPerDiagonal = Math.ceil(count / 2);
        
        // 主对角线
        for (let i = 0; i < pointsPerDiagonal; i++) {
            const t = (i + 1) / (pointsPerDiagonal + 1);
            const x = minX + t * (maxX - minX);
            const y = minY + t * (maxY - minY);
            
            if (isPointInValidArea(x, y) && !isPointInInvalidArea(x, y)) {
                const grid = canvasToGrid(x, y);
                samplingPoints.push({
                    id: generatePointId(),
                    label: generatePointLabel(),
                    x: x,
                    y: y,
                    gridRow: grid.row,
                    gridCol: grid.col,
                    createdAt: Date.now(),
                    properties: {}
                });
            }
        }
        
        // 副对角线
        for (let i = 0; i < pointsPerDiagonal && samplingPoints.length < count; i++) {
            const t = (i + 1) / (pointsPerDiagonal + 1);
            const x = maxX - t * (maxX - minX);
            const y = minY + t * (maxY - minY);
            
            if (isPointInValidArea(x, y) && !isPointInInvalidArea(x, y)) {
                const grid = canvasToGrid(x, y);
                samplingPoints.push({
                    id: generatePointId(),
                    label: generatePointLabel(),
                    x: x,
                    y: y,
                    gridRow: grid.row,
                    gridCol: grid.col,
                    createdAt: Date.now(),
                    properties: {}
                });
            }
        }
    }
    
    function autoPlaceStratified(bounds, count) {
        // 简化实现：将区域分为4个象限，每个象限布点
        const validArea = currentScenario.validAreas[0];
        if (!validArea) return;
        
        const minX = Math.min(...validArea.points.map(p => p.x));
        const maxX = Math.max(...validArea.points.map(p => p.x));
        const minY = Math.min(...validArea.points.map(p => p.y));
        const maxY = Math.max(...validArea.points.map(p => p.y));
        
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        
        const quadrants = [
            { minX, maxX: midX, minY, maxY: midY },
            { minX: midX, maxX, minY, maxY: midY },
            { minX, maxX: midX, minY: midY, maxY },
            { minX: midX, maxX, minY: midY, maxY }
        ];
        
        const pointsPerQuadrant = Math.ceil(count / 4);
        
        quadrants.forEach(q => {
            for (let i = 0; i < pointsPerQuadrant && samplingPoints.length < count; i++) {
                const x = q.minX + Math.random() * (q.maxX - q.minX);
                const y = q.minY + Math.random() * (q.maxY - q.minY);
                
                if (isPointInValidArea(x, y) && !isPointInInvalidArea(x, y)) {
                    const grid = canvasToGrid(x, y);
                    samplingPoints.push({
                        id: generatePointId(),
                        label: generatePointLabel(),
                        x: x,
                        y: y,
                        gridRow: grid.row,
                        gridCol: grid.col,
                        createdAt: Date.now(),
                        properties: {}
                    });
                }
            }
        });
    }
    
    // ==================== 撤销/重做 ====================
    // Requirements: 7.7 - 撤销/重做功能
    
    /**
     * 保存当前状态到历史记录
     * Requirements: 7.7 - 记录操作历史
     * 
     * Property 13: 撤销操作正确性
     * 对于任意操作序列，执行撤销后状态应与该操作执行前的状态一致
     */
    function saveHistory() {
        // 删除当前位置之后的历史（分支操作时清除后续历史）
        history = history.slice(0, historyIndex + 1);
        
        // 保存当前状态（深拷贝采样点数组）
        history.push({
            points: JSON.parse(JSON.stringify(samplingPoints)),
            counter: pointCounter,
            timestamp: Date.now()
        });
        
        // 限制历史长度
        if (history.length > MAX_HISTORY) {
            history.shift();
        }
        
        historyIndex = history.length - 1;
    }
    
    /**
     * 撤销最近一次操作
     * Requirements: 7.7 - 实现撤销
     * 
     * Property 13: 撤销操作正确性
     * 执行撤销后状态应与该操作执行前的状态一致
     * 
     * @returns {boolean} 是否成功撤销
     */
    function undo() {
        if (historyIndex <= 0) return false;
        
        historyIndex--;
        restoreFromHistory();
        return true;
    }
    
    /**
     * 重做最近一次撤销的操作
     * Requirements: 7.7 - 实现重做
     * @returns {boolean} 是否成功重做
     */
    function redo() {
        if (historyIndex >= history.length - 1) return false;
        
        historyIndex++;
        restoreFromHistory();
        return true;
    }
    
    /**
     * 从历史记录恢复状态
     */
    function restoreFromHistory() {
        const state = history[historyIndex];
        if (!state) return;
        
        // 深拷贝恢复采样点数组
        samplingPoints = JSON.parse(JSON.stringify(state.points));
        pointCounter = state.counter;
        
        updateStats();
        render();
    }
    
    /**
     * 获取当前历史状态信息（用于测试和调试）
     * @returns {Object} 历史状态信息
     */
    function getHistoryState() {
        return {
            historyLength: history.length,
            currentIndex: historyIndex,
            canUndo: historyIndex > 0,
            canRedo: historyIndex < history.length - 1
        };
    }
    
    /**
     * 清空历史记录
     */
    function clearHistory() {
        history = [];
        historyIndex = -1;
        // 保存初始状态
        saveHistory();
    }
    
    // ==================== 统计更新 ====================
    
    function updateStats() {
        const countEl = document.getElementById('point-count');
        const coverageEl = document.getElementById('coverage');
        const areaEl = document.getElementById('area-size');
        
        if (countEl) countEl.textContent = samplingPoints.length;
        
        if (coverageEl && currentScenario) {
            const coverage = calculateCoverage();
            coverageEl.textContent = Math.round(coverage * 100) + '%';
        }
        
        if (areaEl && currentScenario) {
            const area = calculateArea();
            areaEl.textContent = area > 0 ? area + ' m²' : '-';
        }
    }
    
    function calculateCoverage() {
        if (!currentScenario || samplingPoints.length === 0) return 0;
        
        const gridSize = currentScenario.gridSize;
        const validArea = currentScenario.validAreas[0];
        if (!validArea) return 0;
        
        const minX = Math.min(...validArea.points.map(p => p.x));
        const maxX = Math.max(...validArea.points.map(p => p.x));
        const minY = Math.min(...validArea.points.map(p => p.y));
        const maxY = Math.max(...validArea.points.map(p => p.y));
        
        const totalCols = Math.ceil((maxX - minX) / gridSize);
        const totalRows = Math.ceil((maxY - minY) / gridSize);
        const totalCells = totalCols * totalRows;
        
        // 计算采样点覆盖的网格单元
        const coveredCells = new Set();
        samplingPoints.forEach(p => {
            const col = Math.floor((p.x - minX) / gridSize);
            const row = Math.floor((p.y - minY) / gridSize);
            coveredCells.add(`${row},${col}`);
        });
        
        return coveredCells.size / totalCells;
    }
    
    function calculateArea() {
        if (!currentScenario) return 0;
        
        const validArea = currentScenario.validAreas[0];
        if (!validArea || !validArea.points) return 0;
        
        const minX = Math.min(...validArea.points.map(p => p.x));
        const maxX = Math.max(...validArea.points.map(p => p.x));
        const minY = Math.min(...validArea.points.map(p => p.y));
        const maxY = Math.max(...validArea.points.map(p => p.y));
        
        // 假设1像素 = 0.1米
        const width = (maxX - minX) * 0.1;
        const height = (maxY - minY) * 0.1;
        
        return Math.round(width * height);
    }

    
    // ==================== 渲染 ====================
    
    function render() {
        if (!ctx || !canvas) return;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 保存状态
        ctx.save();
        
        // 应用变换
        ctx.translate(panX, panY);
        ctx.scale(zoom, zoom);
        
        // 绘制背景
        renderBackground();
        
        // 绘制网格
        if (currentScenario) {
            renderGrid();
        }
        
        // 绘制场景区域
        if (currentScenario) {
            renderScenarioAreas();
        }
        
        // 绘制辅助线（对角线等）
        renderHelpers();
        
        // 绘制采样点
        renderPoints();
        
        // 绘制距离线
        if (distanceEnabled) {
            renderDistances();
        }
        
        // 恢复状态
        ctx.restore();
    }
    
    function renderBackground() {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width / zoom, canvas.height / zoom);
    }
    
    /**
     * 渲染网格线
     * Requirements: 3.3 - 系统布点法显示网格辅助线
     * Requirements: 7.2 - 网格吸附功能
     */
    function renderGrid() {
        if (!currentScenario) return;
        
        const gridSize = currentScenario.gridSize;
        const bounds = currentScenario.bounds;
        const config = METHOD_CONFIG[currentMethod];
        
        // 根据当前方法决定网格显示强度
        const isSystematic = config && config.helpers.showGrid;
        const gridOpacity = isSystematic ? 0.25 : 0.1;
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`;
        ctx.lineWidth = 1 / zoom;
        
        // 垂直线
        for (let x = 0; x <= bounds.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, bounds.height);
            ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= bounds.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(bounds.width, y);
            ctx.stroke();
        }
        
        // 系统布点法时显示网格交点
        if (isSystematic) {
            renderGridIntersections(gridSize, bounds);
        }
        
        // 绘制悬停高亮的网格单元
        renderHoveredCell(gridSize);
        
        // 如果启用网格吸附，显示最近的吸附点
        if (snapEnabled && hoveredCell) {
            renderSnapIndicator(gridSize);
        }
    }
    
    /**
     * 渲染网格交点（系统布点法辅助）
     * Requirements: 3.3 - 显示网格辅助线并启用网格吸附
     * @param {number} gridSize - 网格大小
     * @param {Object} bounds - 边界
     */
    function renderGridIntersections(gridSize, bounds) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        
        for (let x = 0; x <= bounds.width; x += gridSize) {
            for (let y = 0; y <= bounds.height; y += gridSize) {
                // 只在有效区域内显示交点
                if (isPointInValidArea(x, y) && !isPointInInvalidArea(x, y)) {
                    ctx.beginPath();
                    ctx.arc(x, y, 3 / zoom, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    
    /**
     * 渲染吸附指示器
     * Requirements: 7.2 - 网格吸附功能
     * @param {number} gridSize - 网格大小
     */
    function renderSnapIndicator(gridSize) {
        if (!hoveredCell) return;
        
        // 计算鼠标位置对应的最近网格交点
        const { row, col } = hoveredCell;
        const cellCenterX = col * gridSize + gridSize / 2;
        const cellCenterY = row * gridSize + gridSize / 2;
        
        // 计算四个角的网格交点
        const corners = [
            { x: col * gridSize, y: row * gridSize },
            { x: (col + 1) * gridSize, y: row * gridSize },
            { x: col * gridSize, y: (row + 1) * gridSize },
            { x: (col + 1) * gridSize, y: (row + 1) * gridSize }
        ];
        
        // 高亮所有角点
        ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
        corners.forEach(corner => {
            if (isPointInValidArea(corner.x, corner.y) && !isPointInInvalidArea(corner.x, corner.y)) {
                ctx.beginPath();
                ctx.arc(corner.x, corner.y, 5 / zoom, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    /**
     * 绘制悬停高亮的网格单元
     * Requirements: 1.5 - 鼠标悬停时高亮显示当前网格并显示坐标信息
     * @param {number} gridSize - 网格大小
     */
    function renderHoveredCell(gridSize) {
        if (!hoveredCell || !currentScenario) return;
        
        const { row, col } = hoveredCell;
        const x = col * gridSize;
        const y = row * gridSize;
        
        // 高亮填充
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.fillRect(x, y, gridSize, gridSize);
        
        // 高亮边框
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 2 / zoom;
        ctx.strokeRect(x, y, gridSize, gridSize);
    }
    
    function renderScenarioAreas() {
        if (!currentScenario) return;
        
        // 绘制有效区域
        currentScenario.validAreas.forEach(area => {
            renderArea(area, 'valid');
        });
        
        // 绘制无效区域
        currentScenario.invalidAreas.forEach(area => {
            renderArea(area, 'invalid');
        });
    }
    
    function renderArea(area, type) {
        if (!area.points || area.points.length < 3) return;
        
        ctx.beginPath();
        ctx.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
            ctx.lineTo(area.points[i].x, area.points[i].y);
        }
        ctx.closePath();
        
        // 填充
        ctx.fillStyle = area.color || (type === 'invalid' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.1)');
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = type === 'invalid' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
        
        // 标签
        if (area.label) {
            const centerX = area.points.reduce((sum, p) => sum + p.x, 0) / area.points.length;
            const centerY = area.points.reduce((sum, p) => sum + p.y, 0) / area.points.length;
            
            ctx.fillStyle = type === 'invalid' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)';
            ctx.font = `${12 / zoom}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(area.label, centerX, centerY);
        }
    }
    
    /**
     * 渲染辅助线（对角线等）
     * Requirements: 3.5 - 对角线布点法显示对角线辅助线
     */
    function renderHelpers() {
        if (!currentScenario) return;
        
        const config = METHOD_CONFIG[currentMethod];
        if (!config) return;
        
        // 绘制对角线辅助线
        if (config.helpers.showDiagonal) {
            renderDiagonalHelpers();
        }
    }
    
    /**
     * 渲染对角线辅助显示
     * Requirements: 3.5 - 对角线布点法显示对角线
     */
    function renderDiagonalHelpers() {
        const validArea = currentScenario.validAreas[0];
        if (!validArea || !validArea.points) return;
        
        const diagonals = calculateDiagonalCoordinates();
        if (!diagonals) return;
        
        const { minX, maxX, minY, maxY, centerX, centerY } = diagonals;
        
        // 绘制对角线
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([8 / zoom, 4 / zoom]);
        
        // 主对角线（左上到右下）
        ctx.beginPath();
        ctx.moveTo(minX, minY);
        ctx.lineTo(maxX, maxY);
        ctx.stroke();
        
        // 副对角线（右上到左下）
        ctx.beginPath();
        ctx.moveTo(maxX, minY);
        ctx.lineTo(minX, maxY);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // 绘制对角线交点（中心点）
        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6 / zoom, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制中心点标签
        ctx.fillStyle = 'rgba(251, 191, 36, 1)';
        ctx.font = `bold ${10 / zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('中心', centerX, centerY - 12 / zoom);
        
        // 绘制对角线上的推荐采样点位置
        renderDiagonalSamplingPoints(diagonals);
        
        // 绘制四个角点
        renderCornerPoints(diagonals);
    }
    
    /**
     * 计算对角线坐标
     * Requirements: 3.5 - 计算对角线坐标
     * @returns {Object|null} 对角线坐标信息
     */
    function calculateDiagonalCoordinates() {
        if (!currentScenario) return null;
        
        const validArea = currentScenario.validAreas[0];
        if (!validArea || !validArea.points) return null;
        
        const minX = Math.min(...validArea.points.map(p => p.x));
        const maxX = Math.max(...validArea.points.map(p => p.x));
        const minY = Math.min(...validArea.points.map(p => p.y));
        const maxY = Math.max(...validArea.points.map(p => p.y));
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // 计算对角线长度
        const diagonalLength = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2));
        
        return {
            minX,
            maxX,
            minY,
            maxY,
            centerX,
            centerY,
            diagonalLength,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    /**
     * 渲染对角线上的推荐采样点位置
     * @param {Object} diagonals - 对角线坐标信息
     */
    function renderDiagonalSamplingPoints(diagonals) {
        const { minX, maxX, minY, maxY } = diagonals;
        const minPoints = currentScenario.requirements.minPoints;
        const pointsPerDiagonal = Math.ceil(minPoints / 2);
        
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1 / zoom;
        
        // 主对角线上的推荐点
        for (let i = 1; i <= pointsPerDiagonal; i++) {
            const t = i / (pointsPerDiagonal + 1);
            const x = minX + t * (maxX - minX);
            const y = minY + t * (maxY - minY);
            
            if (isPointInValidArea(x, y) && !isPointInInvalidArea(x, y)) {
                ctx.beginPath();
                ctx.arc(x, y, 8 / zoom, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
        
        // 副对角线上的推荐点
        for (let i = 1; i <= pointsPerDiagonal; i++) {
            const t = i / (pointsPerDiagonal + 1);
            const x = maxX - t * (maxX - minX);
            const y = minY + t * (maxY - minY);
            
            if (isPointInValidArea(x, y) && !isPointInInvalidArea(x, y)) {
                ctx.beginPath();
                ctx.arc(x, y, 8 / zoom, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }
    
    /**
     * 渲染四个角点
     * @param {Object} diagonals - 对角线坐标信息
     */
    function renderCornerPoints(diagonals) {
        const { minX, maxX, minY, maxY } = diagonals;
        
        const corners = [
            { x: minX, y: minY, label: '左上' },
            { x: maxX, y: minY, label: '右上' },
            { x: minX, y: maxY, label: '左下' },
            { x: maxX, y: maxY, label: '右下' }
        ];
        
        ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
        
        corners.forEach(corner => {
            ctx.beginPath();
            ctx.arc(corner.x, corner.y, 4 / zoom, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    /**
     * 获取对角线上的采样点位置
     * @param {number} count - 采样点数量
     * @returns {Array} 采样点坐标数组
     */
    function getDiagonalSamplingPositions(count) {
        const diagonals = calculateDiagonalCoordinates();
        if (!diagonals) return [];
        
        const { minX, maxX, minY, maxY, centerX, centerY } = diagonals;
        const positions = [];
        const pointsPerDiagonal = Math.ceil(count / 2);
        
        // 主对角线上的点
        for (let i = 1; i <= pointsPerDiagonal && positions.length < count; i++) {
            const t = i / (pointsPerDiagonal + 1);
            positions.push({
                x: minX + t * (maxX - minX),
                y: minY + t * (maxY - minY)
            });
        }
        
        // 副对角线上的点
        for (let i = 1; i <= pointsPerDiagonal && positions.length < count; i++) {
            const t = i / (pointsPerDiagonal + 1);
            positions.push({
                x: maxX - t * (maxX - minX),
                y: minY + t * (maxY - minY)
            });
        }
        
        return positions;
    }
    
    /**
     * 渲染采样点
     * 支持高亮显示无效位置的采样点（Requirements: 5.6）
     */
    function renderPoints() {
        samplingPoints.forEach((point, index) => {
            const isSelected = selectedPoint && selectedPoint.id === point.id;
            const isDragged = draggedPoint && draggedPoint.id === point.id;
            const isInvalid = point._invalid === true; // 标记为无效位置的采样点
            
            // 采样点圆圈
            ctx.beginPath();
            ctx.arc(point.x, point.y, 12 / zoom, 0, Math.PI * 2);
            
            // 填充颜色（无效位置用红色高亮）
            if (isInvalid) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // 红色 - 无效位置
            } else if (isDragged) {
                ctx.fillStyle = 'rgba(251, 191, 36, 0.9)'; // 黄色 - 拖拽中
            } else if (isSelected) {
                ctx.fillStyle = 'rgba(59, 130, 246, 0.9)'; // 蓝色 - 选中
            } else {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.9)'; // 绿色 - 正常
            }
            ctx.fill();
            
            // 边框（无效位置用红色边框）
            ctx.strokeStyle = isInvalid ? 'rgba(239, 68, 68, 1)' : 'white';
            ctx.lineWidth = isInvalid ? 3 / zoom : 2 / zoom;
            ctx.stroke();
            
            // 无效位置添加警告图标
            if (isInvalid) {
                ctx.fillStyle = 'white';
                ctx.font = `bold ${8 / zoom}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('!', point.x, point.y - 18 / zoom);
                
                // 警告背景
                ctx.beginPath();
                ctx.arc(point.x, point.y - 18 / zoom, 6 / zoom, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.fillText('!', point.x, point.y - 18 / zoom);
            }
            
            // 标签
            ctx.fillStyle = 'white';
            ctx.font = `bold ${10 / zoom}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(point.label, point.x, point.y);
        });
    }
    
    /**
     * 计算两点之间的欧几里得距离
     * Requirements: 7.3 - 显示采样点之间的距离
     * 
     * Property 11: 距离计算正确性
     * 对于任意两个采样点，显示的距离应等于欧几里得距离公式计算结果
     * 
     * @param {SamplingPoint|{x: number, y: number}} p1 - 第一个点
     * @param {SamplingPoint|{x: number, y: number}} p2 - 第二个点
     * @returns {number} 两点之间的距离（像素）
     */
    function calculateDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 将像素距离转换为实际距离（米）
     * 假设1像素 = 0.1米
     * @param {number} pixelDistance - 像素距离
     * @returns {number} 实际距离（米）
     */
    function pixelToMeter(pixelDistance) {
        return pixelDistance * 0.1;
    }
    
    /**
     * 计算采样区域的总面积
     * Requirements: 7.4 - 显示采样区域总面积
     * 
     * Property 12: 面积计算正确性
     * 对于任意矩形采样区域，显示的面积应等于宽度×高度
     * 
     * @returns {number} 面积（平方米）
     */
    function calculateTotalArea() {
        if (!currentScenario) return 0;
        
        const validArea = currentScenario.validAreas[0];
        if (!validArea || !validArea.points) return 0;
        
        const minX = Math.min(...validArea.points.map(p => p.x));
        const maxX = Math.max(...validArea.points.map(p => p.x));
        const minY = Math.min(...validArea.points.map(p => p.y));
        const maxY = Math.max(...validArea.points.map(p => p.y));
        
        // 像素转换为米（1像素 = 0.1米）
        const widthMeters = (maxX - minX) * 0.1;
        const heightMeters = (maxY - minY) * 0.1;
        
        return Math.round(widthMeters * heightMeters);
    }
    
    /**
     * 获取所有采样点之间的距离信息
     * Requirements: 7.3 - 显示采样点之间的距离
     * @returns {Array} 距离信息数组 [{p1, p2, distance, distanceMeters}]
     */
    function getAllPointDistances() {
        const distances = [];
        
        for (let i = 0; i < samplingPoints.length; i++) {
            for (let j = i + 1; j < samplingPoints.length; j++) {
                const p1 = samplingPoints[i];
                const p2 = samplingPoints[j];
                const distance = calculateDistance(p1, p2);
                
                distances.push({
                    p1: p1,
                    p2: p2,
                    distance: distance,
                    distanceMeters: pixelToMeter(distance)
                });
            }
        }
        
        return distances;
    }
    
    /**
     * 获取最近和最远的采样点对
     * @returns {{nearest: Object|null, farthest: Object|null}} 最近和最远的点对信息
     */
    function getDistanceExtremes() {
        const distances = getAllPointDistances();
        if (distances.length === 0) return { nearest: null, farthest: null };
        
        distances.sort((a, b) => a.distance - b.distance);
        
        return {
            nearest: distances[0],
            farthest: distances[distances.length - 1]
        };
    }
    
    function renderDistances() {
        if (samplingPoints.length < 2) return;
        
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([3 / zoom, 3 / zoom]);
        
        // 获取距离极值用于高亮显示
        const extremes = getDistanceExtremes();
        
        // 绘制所有点之间的距离线（仅显示相邻点和极值点）
        for (let i = 0; i < samplingPoints.length - 1; i++) {
            const p1 = samplingPoints[i];
            const p2 = samplingPoints[i + 1];
            
            // 检查是否是最近或最远的点对
            const isNearest = extremes.nearest && 
                ((extremes.nearest.p1.id === p1.id && extremes.nearest.p2.id === p2.id) ||
                 (extremes.nearest.p1.id === p2.id && extremes.nearest.p2.id === p1.id));
            const isFarthest = extremes.farthest && 
                ((extremes.farthest.p1.id === p1.id && extremes.farthest.p2.id === p2.id) ||
                 (extremes.farthest.p1.id === p2.id && extremes.farthest.p2.id === p1.id));
            
            // 设置线条颜色
            if (isNearest) {
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // 红色 - 最近
            } else if (isFarthest) {
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)'; // 绿色 - 最远
            } else {
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'; // 默认灰色
            }
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            
            // 显示距离（使用欧几里得距离公式）
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const distance = calculateDistance(p1, p2);
            const distanceMeters = pixelToMeter(distance);
            
            ctx.fillStyle = isNearest ? 'rgba(239, 68, 68, 0.9)' : 
                           isFarthest ? 'rgba(16, 185, 129, 0.9)' : 
                           'rgba(148, 163, 184, 0.8)';
            ctx.font = `${10 / zoom}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(distanceMeters) + 'm', midX, midY - 5 / zoom);
        }
        
        // 如果最近/最远的点对不是相邻的，额外绘制它们
        if (extremes.nearest) {
            const p1 = extremes.nearest.p1;
            const p2 = extremes.nearest.p2;
            const idx1 = samplingPoints.findIndex(p => p.id === p1.id);
            const idx2 = samplingPoints.findIndex(p => p.id === p2.id);
            
            // 如果不是相邻点，绘制连线
            if (Math.abs(idx1 - idx2) !== 1) {
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
                ctx.fillText(Math.round(extremes.nearest.distanceMeters) + 'm (最近)', midX, midY - 5 / zoom);
            }
        }
        
        ctx.setLineDash([]);
        
        // 显示距离统计信息
        renderDistanceStats(extremes);
    }
    
    /**
     * 渲染距离统计信息
     * @param {Object} extremes - 距离极值信息
     */
    function renderDistanceStats(extremes) {
        if (!extremes.nearest || !extremes.farthest) return;
        
        // 在画布右上角显示统计信息
        const statsX = 10 / zoom;
        const statsY = 30 / zoom;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(statsX - 5 / zoom, statsY - 15 / zoom, 150 / zoom, 50 / zoom);
        
        ctx.fillStyle = 'white';
        ctx.font = `${10 / zoom}px sans-serif`;
        ctx.textAlign = 'left';
        
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillText(`最近: ${extremes.nearest.p1.label}-${extremes.nearest.p2.label} ${Math.round(extremes.nearest.distanceMeters)}m`, statsX, statsY);
        
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.fillText(`最远: ${extremes.farthest.p1.label}-${extremes.farthest.p2.label} ${Math.round(extremes.farthest.distanceMeters)}m`, statsX, statsY + 15 / zoom);
    }
    
    // ==================== UI交互 ====================
    
    function showContextMenu(x, y) {
        const menu = document.getElementById('context-menu');
        if (!menu) return;
        
        menu.style.display = 'block';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
    }
    
    function hideContextMenu() {
        const menu = document.getElementById('context-menu');
        if (menu) {
            menu.style.display = 'none';
        }
    }
    
    function deleteSelectedPoint() {
        if (selectedPoint) {
            deletePoint(selectedPoint.id);
            selectedPoint = null;
        }
        hideContextMenu();
    }
    
    function editPointProperties() {
        if (!selectedPoint) return;
        
        const note = prompt('输入采样点备注:', selectedPoint.properties?.note || '');
        if (note !== null) {
            selectedPoint.properties = selectedPoint.properties || {};
            selectedPoint.properties.note = note;
        }
        
        hideContextMenu();
    }
    
    function showGuide() {
        const modal = document.getElementById('guide-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    function hideGuide() {
        const modal = document.getElementById('guide-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    function showMessage(msg) {
        // 简单的消息提示
        alert(msg);
    }
    
    /**
     * 更新知识点提示
     * Requirements: 8.2 - 选择采样方法时显示说明
     * Requirements: 8.3 - 添加采样点时显示相关国标
     * 
     * @param {string} key - 知识点键名
     */
    function updateKnowledgeTip(key) {
        const tipEl = document.getElementById('knowledge-text');
        if (tipEl && KNOWLEDGE_TIPS[key]) {
            tipEl.textContent = KNOWLEDGE_TIPS[key];
        }
    }
    
    /**
     * 显示采样方法详细说明
     * Requirements: 8.2 - 显示适用场景和操作要点
     * Requirements: 8.6 - 术语tooltip解释
     * 
     * @param {string} method - 采样方法ID
     */
    function showMethodDetails(method) {
        const details = METHOD_DETAILS[method];
        if (!details) return;
        
        // 更新知识面板显示方法详情
        const knowledgePanel = document.getElementById('knowledge-text');
        if (knowledgePanel) {
            let html = `<strong>${details.name}</strong><br>`;
            // 包装术语为tooltip (Requirements: 8.6)
            html += `${wrapTermsWithTooltip(details.description)}<br><br>`;
            html += `<strong>适用场景：</strong>${wrapTermsWithTooltip(details.applicableScenarios)}<br><br>`;
            html += `<strong>操作要点：</strong><br>`;
            details.operationPoints.forEach((point, index) => {
                html += `${index + 1}. ${wrapTermsWithTooltip(point)}<br>`;
            });
            html += `<br><em>参考标准：${details.nationalStandard}</em>`;
            knowledgePanel.innerHTML = html;
        }
    }
    
    /**
     * 显示国标条款
     * Requirements: 8.3 - 添加采样点时显示相关国标条款
     * Requirements: 8.6 - 术语tooltip解释
     * 
     * @param {string} clauseKey - 条款键名
     */
    function showNationalStandard(clauseKey) {
        const standard = NATIONAL_STANDARDS[clauseKey];
        if (!standard) return;
        
        const knowledgePanel = document.getElementById('knowledge-text');
        if (knowledgePanel) {
            let html = `<strong>📜 ${standard.title}</strong><br>`;
            html += `<em>${standard.standard} ${standard.clause}</em><br><br>`;
            // 包装术语为tooltip (Requirements: 8.6)
            html += wrapTermsWithTooltip(standard.content);
            if (standard.formula) {
                html += `<br><br><strong>计算公式：</strong>${standard.formula}`;
            }
            knowledgePanel.innerHTML = html;
        }
    }
    
    /**
     * 获取术语解释
     * Requirements: 8.6 - 术语tooltip解释
     * 
     * @param {string} term - 术语
     * @returns {string|null} 术语解释
     */
    function getTerminologyExplanation(term) {
        return TERMINOLOGY[term] || null;
    }
    
    /**
     * 显示完整操作手册
     * Requirements: 8.5 - 显示完整的操作手册和知识点汇总
     */
    function showFullManual() {
        // 创建手册弹窗
        let manualModal = document.getElementById('manual-modal');
        if (!manualModal) {
            manualModal = document.createElement('div');
            manualModal.id = 'manual-modal';
            manualModal.className = 'guide-modal';
            document.body.appendChild(manualModal);
        }
        
        let html = `
            <div class="guide-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <h2>📖 ${OPERATION_MANUAL.title}</h2>
        `;
        
        OPERATION_MANUAL.sections.forEach(section => {
            html += `
                <div style="text-align: left; margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 10px;">
                    <h3 style="color: #3b82f6; margin-bottom: 10px; font-size: 1.1rem;">${section.title}</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #64748b;">
            `;
            section.items.forEach(item => {
                html += `<li style="margin-bottom: 8px; line-height: 1.5;">${item}</li>`;
            });
            html += `</ul></div>`;
        });
        
        // 添加国标条款汇总
        html += `
            <div style="text-align: left; margin: 20px 0; padding: 15px; background: #fef3c7; border-radius: 10px;">
                <h3 style="color: #d97706; margin-bottom: 10px; font-size: 1.1rem;">📜 相关国标条款</h3>
        `;
        Object.values(NATIONAL_STANDARDS).forEach(standard => {
            html += `
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(217, 119, 6, 0.2);">
                    <strong style="color: #92400e;">${standard.title}</strong>
                    <span style="color: #b45309; font-size: 0.85rem;"> (${standard.standard} ${standard.clause})</span>
                    <p style="margin: 5px 0 0 0; color: #78716c; font-size: 0.9rem;">${standard.content}</p>
                </div>
            `;
        });
        html += `</div>`;
        
        // 添加术语表
        html += `
            <div style="text-align: left; margin: 20px 0; padding: 15px; background: #ecfdf5; border-radius: 10px;">
                <h3 style="color: #059669; margin-bottom: 10px; font-size: 1.1rem;">📚 术语解释</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        `;
        Object.entries(TERMINOLOGY).forEach(([term, explanation]) => {
            html += `
                <div style="padding: 8px; background: white; border-radius: 6px;">
                    <strong style="color: #047857;">${term}</strong>
                    <p style="margin: 3px 0 0 0; color: #6b7280; font-size: 0.85rem;">${explanation}</p>
                </div>
            `;
        });
        html += `</div></div>`;
        
        html += `
                <button class="guide-btn" onclick="SamplingSandbox.hideFullManual()">关闭手册</button>
            </div>
        `;
        
        manualModal.innerHTML = html;
        manualModal.classList.remove('hidden');
    }
    
    /**
     * 隐藏完整操作手册
     */
    function hideFullManual() {
        const manualModal = document.getElementById('manual-modal');
        if (manualModal) {
            manualModal.classList.add('hidden');
        }
    }
    
    /**
     * 添加采样点时显示相关国标提示
     * Requirements: 8.3 - 添加采样点时在侧边栏显示相关国标条款
     * 
     * @param {number} pointCount - 当前采样点数量
     */
    function showPointAddedTip(pointCount) {
        // 根据采样点数量显示不同的提示
        if (pointCount === 1) {
            showNationalStandard('pointCount');
        } else if (pointCount === 3) {
            showNationalStandard('samplingPosition');
        } else if (pointCount === 5) {
            showNationalStandard('samplingDepth');
        } else if (pointCount % 5 === 0) {
            // 每5个点提示一次样品量要求
            showNationalStandard('sampleAmount');
        }
    }
    
    /**
     * 将文本中的术语包装为带tooltip的span
     * Requirements: 8.6 - 术语tooltip解释
     * 
     * @param {string} text - 原始文本
     * @returns {string} 包含tooltip的HTML文本
     */
    function wrapTermsWithTooltip(text) {
        let result = text;
        Object.entries(TERMINOLOGY).forEach(([term, explanation]) => {
            // 使用正则表达式匹配术语（避免重复包装）
            const regex = new RegExp(`(?<!data-tooltip=")${term}(?![^<]*>)`, 'g');
            result = result.replace(regex, `<span class="term-tooltip" data-tooltip="${explanation}">${term}</span>`);
        });
        return result;
    }
    
    /**
     * 初始化术语tooltip
     * Requirements: 8.6 - 悬停在专业术语上显示术语解释tooltip
     * 
     * 扫描知识面板中的文本，为匹配的术语添加tooltip
     */
    function initTerminologyTooltips() {
        const knowledgePanel = document.getElementById('knowledge-text');
        if (knowledgePanel) {
            const originalText = knowledgePanel.innerHTML;
            knowledgePanel.innerHTML = wrapTermsWithTooltip(originalText);
        }
    }
    
    // ==================== 布点验证器 ====================
    // Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7 - 布点方案验证
    
    /**
     * 布点验证器 - PointValidator
     * 实现采样点数量、分布均匀性、位置有效性的验证
     */
    const PointValidator = {
        /**
         * 根据废物堆存量计算最少采样点数
         * Requirements: 5.2 - 根据废物堆存量计算最少采样点数
         * 
         * 国标公式：n = √(废物量/采样单元面积)，最少5个
         * 根据《固体废物采样制样技术规范》(HJ/T 20)
         * 
         * Property 7: 最少采样点数计算
         * 对于任意废物堆存量，计算出的最少采样点数应符合国标公式，且不少于5个
         * 
         * @param {number} wasteVolume - 废物堆存量（吨）
         * @param {number} unitArea - 采样单元面积（平方米），默认50
         * @returns {number} 最少采样点数
         */
        calculateMinPoints: function(wasteVolume, unitArea = 50) {
            if (wasteVolume <= 0) return 5;
            
            // 国标公式：n = √(废物量/采样单元面积)
            const calculated = Math.ceil(Math.sqrt(wasteVolume / unitArea));
            
            // 最少5个采样点
            return Math.max(5, calculated);
        },
        
        /**
         * 验证采样点数量
         * Requirements: 5.2 - 根据废物堆存量计算最少采样点数并比对
         * 
         * @param {SamplingPoint[]} points - 采样点列表
         * @param {Scenario} scenario - 场景数据
         * @returns {ValidationItem} 验证结果项
         */
        validatePointCount: function(points, scenario) {
            const wasteVolume = scenario.requirements.wasteVolume;
            const minPoints = this.calculateMinPoints(wasteVolume);
            const actualCount = points.length;
            const passed = actualCount >= minPoints;
            
            return {
                name: '采样点数量',
                passed: passed,
                message: passed 
                    ? `采样点数量充足 (${actualCount}/${minPoints})` 
                    : `采样点数量不足 (${actualCount}/${minPoints})`,
                details: {
                    actual: actualCount,
                    required: minPoints,
                    wasteVolume: wasteVolume,
                    formula: `n = √(${wasteVolume}/50) = ${Math.ceil(Math.sqrt(wasteVolume / 50))}，最少5个`
                }
            };
        },
        
        /**
         * 计算采样点覆盖的网格单元数
         * Requirements: 5.3 - 计算采样点覆盖的网格单元
         * 
         * @param {SamplingPoint[]} points - 采样点列表
         * @param {Scenario} scenario - 场景数据
         * @returns {Object} 覆盖信息 {coveredCells, totalCells, coverage}
         */
        calculateGridCoverage: function(points, scenario) {
            if (!scenario || points.length === 0) {
                return { coveredCells: 0, totalCells: 0, coverage: 0 };
            }
            
            const gridSize = scenario.gridSize;
            const validArea = scenario.validAreas[0];
            if (!validArea || !validArea.points) {
                return { coveredCells: 0, totalCells: 0, coverage: 0 };
            }
            
            const minX = Math.min(...validArea.points.map(p => p.x));
            const maxX = Math.max(...validArea.points.map(p => p.x));
            const minY = Math.min(...validArea.points.map(p => p.y));
            const maxY = Math.max(...validArea.points.map(p => p.y));
            
            const totalCols = Math.ceil((maxX - minX) / gridSize);
            const totalRows = Math.ceil((maxY - minY) / gridSize);
            const totalCells = totalCols * totalRows;
            
            // 计算采样点覆盖的网格单元（使用Set去重）
            const coveredCellsSet = new Set();
            points.forEach(p => {
                const col = Math.floor((p.x - minX) / gridSize);
                const row = Math.floor((p.y - minY) / gridSize);
                if (col >= 0 && col < totalCols && row >= 0 && row < totalRows) {
                    coveredCellsSet.add(`${row},${col}`);
                }
            });
            
            const coveredCells = coveredCellsSet.size;
            const coverage = totalCells > 0 ? coveredCells / totalCells : 0;
            
            return {
                coveredCells: coveredCells,
                totalCells: totalCells,
                coverage: coverage,
                gridSize: gridSize,
                rows: totalRows,
                cols: totalCols
            };
        },
        
        /**
         * 验证分布均匀性
         * Requirements: 5.3 - 检查采样点是否均匀覆盖采样区域
         * 
         * Property 8: 分布均匀性计算
         * 对于任意采样点集合和采样区域，分布均匀性得分应基于采样点覆盖的网格单元数与总网格单元数的比值
         * 
         * @param {SamplingPoint[]} points - 采样点列表
         * @param {Scenario} scenario - 场景数据
         * @returns {ValidationItem} 验证结果项
         */
        validateDistribution: function(points, scenario) {
            const coverageInfo = this.calculateGridCoverage(points, scenario);
            const coverage = coverageInfo.coverage;
            
            // 覆盖率阈值：至少30%的网格单元应有采样点
            const threshold = 0.3;
            const passed = coverage >= threshold;
            
            return {
                name: '分布均匀性',
                passed: passed,
                message: passed 
                    ? `分布较为均匀 (覆盖率 ${Math.round(coverage * 100)}%)` 
                    : `分布不够均匀 (覆盖率 ${Math.round(coverage * 100)}%，建议≥${Math.round(threshold * 100)}%)`,
                details: {
                    coverage: coverage,
                    coveredCells: coverageInfo.coveredCells,
                    totalCells: coverageInfo.totalCells,
                    threshold: threshold
                }
            };
        },
        
        /**
         * 检查单个采样点是否在有效区域内
         * Requirements: 5.4 - 检查采样点是否在有效区域内
         * 
         * @param {SamplingPoint} point - 采样点
         * @param {Scenario} scenario - 场景数据
         * @returns {boolean} 是否在有效区域内
         */
        isPointInValidArea: function(point, scenario) {
            if (!scenario || scenario.validAreas.length === 0) {
                return true; // 没有定义有效区域时，默认全部有效
            }
            
            return scenario.validAreas.some(area => this._isPointInArea(point.x, point.y, area));
        },
        
        /**
         * 检查单个采样点是否在无效区域内
         * @param {SamplingPoint} point - 采样点
         * @param {Scenario} scenario - 场景数据
         * @returns {boolean} 是否在无效区域内
         */
        isPointInInvalidArea: function(point, scenario) {
            if (!scenario || scenario.invalidAreas.length === 0) {
                return false;
            }
            
            return scenario.invalidAreas.some(area => this._isPointInArea(point.x, point.y, area));
        },
        
        /**
         * 检查点是否在区域内（内部方法）
         * @private
         */
        _isPointInArea: function(x, y, area) {
            if (area.type === 'rectangle' && area.points && area.points.length >= 4) {
                const minX = Math.min(...area.points.map(p => p.x));
                const maxX = Math.max(...area.points.map(p => p.x));
                const minY = Math.min(...area.points.map(p => p.y));
                const maxY = Math.max(...area.points.map(p => p.y));
                
                return x >= minX && x <= maxX && y >= minY && y <= maxY;
            }
            
            if (area.type === 'circle' && area.center && area.radius) {
                const dx = x - area.center.x;
                const dy = y - area.center.y;
                return Math.sqrt(dx * dx + dy * dy) <= area.radius;
            }
            
            // 多边形使用射线法
            if (area.type === 'polygon' && area.points) {
                return this._isPointInPolygon(x, y, area.points);
            }
            
            return false;
        },
        
        /**
         * 射线法判断点是否在多边形内
         * @private
         */
        _isPointInPolygon: function(x, y, polygon) {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i].x, yi = polygon[i].y;
                const xj = polygon[j].x, yj = polygon[j].y;
                
                if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                    inside = !inside;
                }
            }
            return inside;
        },
        
        /**
         * 验证位置有效性
         * Requirements: 5.4 - 检查是否有采样点位于无效区域
         * 
         * @param {SamplingPoint[]} points - 采样点列表
         * @param {Scenario} scenario - 场景数据
         * @returns {ValidationItem} 验证结果项
         */
        validatePositions: function(points, scenario) {
            const invalidPoints = [];
            const outsidePoints = [];
            
            points.forEach(point => {
                // 检查是否在无效区域内
                if (this.isPointInInvalidArea(point, scenario)) {
                    invalidPoints.push(point);
                }
                // 检查是否在有效区域外
                else if (!this.isPointInValidArea(point, scenario)) {
                    outsidePoints.push(point);
                }
            });
            
            const totalInvalid = invalidPoints.length + outsidePoints.length;
            const passed = totalInvalid === 0;
            
            let message = '';
            if (passed) {
                message = '所有采样点位置有效';
            } else {
                const parts = [];
                if (invalidPoints.length > 0) {
                    parts.push(`${invalidPoints.length} 个位于禁止区域`);
                }
                if (outsidePoints.length > 0) {
                    parts.push(`${outsidePoints.length} 个位于有效区域外`);
                }
                message = parts.join('，');
            }
            
            return {
                name: '位置有效性',
                passed: passed,
                message: message,
                details: {
                    invalidPoints: invalidPoints.map(p => p.label),
                    outsidePoints: outsidePoints.map(p => p.label),
                    totalInvalid: totalInvalid
                }
            };
        },
        
        /**
         * 执行完整验证
         * Requirements: 5.5 - 显示验证结果（通过/不通过）及详细说明
         * 
         * @param {SamplingPoint[]} points - 采样点列表
         * @param {Scenario} scenario - 场景数据
         * @returns {ValidationResult} 完整验证结果
         */
        validate: function(points, scenario) {
            const result = {
                passed: true,
                items: [],
                suggestions: []
            };
            
            // 1. 验证采样点数量
            const countResult = this.validatePointCount(points, scenario);
            result.items.push(countResult);
            if (!countResult.passed) {
                result.passed = false;
                const shortage = countResult.details.required - countResult.details.actual;
                result.suggestions.push(`建议增加至少 ${shortage} 个采样点（国标要求最少 ${countResult.details.required} 个）`);
            }
            
            // 2. 验证分布均匀性
            const distributionResult = this.validateDistribution(points, scenario);
            result.items.push(distributionResult);
            if (!distributionResult.passed) {
                result.passed = false;
                result.suggestions.push('建议将采样点分散到更多区域，提高覆盖率');
            }
            
            // 3. 验证位置有效性
            const positionResult = this.validatePositions(points, scenario);
            result.items.push(positionResult);
            if (!positionResult.passed) {
                result.passed = false;
                if (positionResult.details.invalidPoints.length > 0) {
                    result.suggestions.push(`请移除或移动位于禁止区域的采样点: ${positionResult.details.invalidPoints.join(', ')}`);
                }
                if (positionResult.details.outsidePoints.length > 0) {
                    result.suggestions.push(`请移动位于有效区域外的采样点: ${positionResult.details.outsidePoints.join(', ')}`);
                }
            }
            
            return result;
        }
    };
    
    // 导出验证器到全局（用于测试）
    window.PointValidator = PointValidator;
    
    // ==================== 验证与评分 ====================
    
    /**
     * 验证当前布点方案
     * Requirements: 5.5, 5.6, 5.7 - 验证结果显示和改进建议
     * 
     * @returns {ValidationResult|null} 验证结果
     */
    function validatePlan() {
        if (!currentScenario) return null;
        
        // 使用PointValidator进行验证
        const result = PointValidator.validate(samplingPoints, currentScenario);
        
        // 更新UI显示
        updateValidationUI(result);
        
        // 高亮问题区域（Requirements: 5.6）
        highlightProblemAreas(result);
        
        return result;
    }
    
    /**
     * 高亮显示问题区域
     * Requirements: 5.6 - 高亮显示问题区域
     * 
     * @param {ValidationResult} result - 验证结果
     */
    function highlightProblemAreas(result) {
        // 找出位置无效的采样点
        const positionItem = result.items.find(item => item.name === '位置有效性');
        if (positionItem && !positionItem.passed) {
            const invalidLabels = [
                ...(positionItem.details.invalidPoints || []),
                ...(positionItem.details.outsidePoints || [])
            ];
            
            // 标记无效采样点（在渲染时会特殊显示）
            samplingPoints.forEach(point => {
                point._invalid = invalidLabels.includes(point.label);
            });
            
            render();
        }
    }
    
    /**
     * 更新验证结果UI显示
     * Requirements: 5.5 - 显示验证通过/不通过状态
     * Requirements: 5.6 - 高亮问题区域并给出改进建议
     * Requirements: 5.7 - 显示绿色通过标识和鼓励信息
     * 
     * @param {ValidationResult} result - 验证结果
     */
    function updateValidationUI(result) {
        const listEl = document.getElementById('validation-list');
        if (!listEl) return;
        
        // 显示验证项列表
        listEl.innerHTML = result.items.map(item => `
            <div class="validation-item ${item.passed ? 'passed' : 'failed'}">
                <span class="status ${item.passed ? 'pass' : 'fail'}">${item.passed ? '✓' : '✗'}</span>
                <span class="validation-text">${item.name}: ${item.message}</span>
            </div>
        `).join('');
        
        // 显示总体结果（Requirements: 5.5, 5.7）
        if (result.passed) {
            listEl.innerHTML = `
                <div class="validation-success" style="background:rgba(16,185,129,0.2); padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid rgba(16,185,129,0.4);">
                    <div style="color:#10b981; font-weight:bold; margin-bottom:5px;">✓ 验证通过</div>
                    <div style="font-size:0.85rem; color:#94a3b8;">布点方案符合国标要求，可以提交评分</div>
                </div>
            ` + listEl.innerHTML;
        } else {
            listEl.innerHTML = `
                <div class="validation-failed" style="background:rgba(239,68,68,0.2); padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid rgba(239,68,68,0.4);">
                    <div style="color:#ef4444; font-weight:bold; margin-bottom:5px;">✗ 验证未通过</div>
                    <div style="font-size:0.85rem; color:#94a3b8;">请根据以下建议改进布点方案</div>
                </div>
            ` + listEl.innerHTML;
        }
        
        // 显示改进建议（Requirements: 5.6）
        if (result.suggestions.length > 0) {
            listEl.innerHTML += `
                <div class="validation-suggestions" style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);">
                    <div style="font-size:0.85rem; color:#fbbf24; margin-bottom:8px; font-weight:500;">💡 改进建议:</div>
                    ${result.suggestions.map(s => `
                        <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:4px; padding-left:12px;">• ${s}</div>
                    `).join('')}
                </div>
            `;
        }
        
        // 显示详细信息（可展开）
        const detailsHtml = result.items.map(item => {
            if (!item.details) return '';
            return `
                <div class="validation-details" style="font-size:0.75rem; color:#64748b; margin-top:4px; padding-left:20px;">
                    ${item.name === '采样点数量' && item.details.formula ? `<div>计算公式: ${item.details.formula}</div>` : ''}
                    ${item.name === '分布均匀性' ? `<div>覆盖网格: ${item.details.coveredCells}/${item.details.totalCells}</div>` : ''}
                </div>
            `;
        }).join('');
        
        if (detailsHtml.trim()) {
            listEl.innerHTML += `
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
                    <details style="font-size:0.8rem;">
                        <summary style="color:#64748b; cursor:pointer;">查看详细信息</summary>
                        ${detailsHtml}
                    </details>
                </div>
            `;
        }
    }
    
    /**
     * 计算布点方案综合评分
     * Requirements: 6.1, 6.2 - 计算综合得分（0-100分），考虑多个维度
     * 
     * 评分维度权重:
     * - 采样点数量得分 (30%)
     * - 分布均匀性得分 (30%)
     * - 方法正确性得分 (20%)
     * - 操作规范性得分 (20%)
     * 
     * Property 9: 评分范围约束
     * 对于任意布点方案，计算出的总分应在0-100范围内，且各分项得分权重之和等于100%
     * 
     * @returns {ScoreResult|null} 评分结果
     */
    function calculateScore() {
        if (!currentScenario) return null;
        
        const result = {
            totalScore: 0,
            breakdown: {
                pointCount: 0,
                distribution: 0,
                methodCorrectness: 0,
                operationStandard: 0
            },
            rawScores: {
                pointCount: 0,
                distribution: 0,
                methodCorrectness: 0,
                operationStandard: 0
            },
            grade: 'fail',
            feedback: '',
            details: {
                pointCountInfo: '',
                distributionInfo: '',
                methodInfo: '',
                operationInfo: ''
            }
        };
        
        // ==================== 采样点数量得分 (30%) ====================
        const minPoints = currentScenario.requirements.minPoints;
        const actualPoints = samplingPoints.length;
        
        // 计算数量得分：达到最少要求得满分，不足按比例扣分，超过适量加分（最多1.2倍）
        let pointCountRawScore = 0;
        if (actualPoints >= minPoints) {
            // 达到或超过最少要求
            const bonusRatio = Math.min(actualPoints / minPoints, 1.2);
            pointCountRawScore = Math.min(bonusRatio * 100, 100);
        } else {
            // 未达到最少要求，按比例计算
            pointCountRawScore = (actualPoints / minPoints) * 100;
        }
        result.rawScores.pointCount = Math.round(pointCountRawScore);
        result.breakdown.pointCount = Math.round(pointCountRawScore * 0.3);
        result.details.pointCountInfo = `实际${actualPoints}个，要求至少${minPoints}个`;
        
        // ==================== 分布均匀性得分 (30%) ====================
        const coverage = calculateCoverage();
        // 覆盖率达到50%以上得满分，低于50%按比例计算
        let distributionRawScore = 0;
        if (coverage >= 0.5) {
            distributionRawScore = 100;
        } else if (coverage >= 0.3) {
            // 30%-50%之间，线性插值到60-100分
            distributionRawScore = 60 + (coverage - 0.3) / 0.2 * 40;
        } else if (coverage >= 0.1) {
            // 10%-30%之间，线性插值到20-60分
            distributionRawScore = 20 + (coverage - 0.1) / 0.2 * 40;
        } else {
            // 低于10%
            distributionRawScore = coverage / 0.1 * 20;
        }
        result.rawScores.distribution = Math.round(distributionRawScore);
        result.breakdown.distribution = Math.round(distributionRawScore * 0.3);
        result.details.distributionInfo = `覆盖率${Math.round(coverage * 100)}%`;
        
        // ==================== 方法正确性得分 (20%) ====================
        const recommendedMethod = currentScenario.requirements.recommendedMethod;
        const methodConfig = METHOD_CONFIG[currentMethod];
        const recommendedConfig = METHOD_CONFIG[recommendedMethod];
        
        let methodRawScore = 0;
        if (currentMethod === recommendedMethod) {
            // 使用推荐方法，满分
            methodRawScore = 100;
            result.details.methodInfo = `使用推荐方法：${methodConfig.name}`;
        } else {
            // 检查当前方法是否适用于当前场景
            const isApplicable = methodConfig.applicableScenarios.includes(currentScenario.type);
            if (isApplicable) {
                // 方法适用但非最佳，得70分
                methodRawScore = 70;
                result.details.methodInfo = `${methodConfig.name}可用，推荐使用${recommendedConfig.name}`;
            } else {
                // 方法不适用，得40分
                methodRawScore = 40;
                result.details.methodInfo = `${methodConfig.name}不太适合此场景，建议使用${recommendedConfig.name}`;
            }
        }
        result.rawScores.methodCorrectness = Math.round(methodRawScore);
        result.breakdown.methodCorrectness = Math.round(methodRawScore * 0.2);
        
        // ==================== 操作规范性得分 (20%) ====================
        // 评估因素：无效区域点数、点间距合理性、边界距离
        let operationRawScore = 100;
        const operationIssues = [];
        
        // 检查是否有点在无效区域
        const invalidPoints = samplingPoints.filter(p => isPointInInvalidArea(p.x, p.y));
        if (invalidPoints.length > 0) {
            operationRawScore -= 40;
            operationIssues.push(`${invalidPoints.length}个点在禁止区域`);
        }
        
        // 检查点间距是否过近（小于网格大小的一半）
        const minDistance = currentScenario.gridSize / 2;
        let tooCloseCount = 0;
        for (let i = 0; i < samplingPoints.length; i++) {
            for (let j = i + 1; j < samplingPoints.length; j++) {
                const dx = samplingPoints[i].x - samplingPoints[j].x;
                const dy = samplingPoints[i].y - samplingPoints[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance) {
                    tooCloseCount++;
                }
            }
        }
        if (tooCloseCount > 0) {
            operationRawScore -= Math.min(tooCloseCount * 10, 30);
            operationIssues.push(`${tooCloseCount}对点间距过近`);
        }
        
        // 检查是否有点过于靠近边界
        const validArea = currentScenario.validAreas[0];
        if (validArea && validArea.points) {
            const margin = currentScenario.gridSize / 4;
            const minX = Math.min(...validArea.points.map(p => p.x)) + margin;
            const maxX = Math.max(...validArea.points.map(p => p.x)) - margin;
            const minY = Math.min(...validArea.points.map(p => p.y)) + margin;
            const maxY = Math.max(...validArea.points.map(p => p.y)) - margin;
            
            const edgePoints = samplingPoints.filter(p => 
                p.x < minX || p.x > maxX || p.y < minY || p.y > maxY
            );
            if (edgePoints.length > 0) {
                operationRawScore -= Math.min(edgePoints.length * 5, 15);
                operationIssues.push(`${edgePoints.length}个点过于靠近边界`);
            }
        }
        
        operationRawScore = Math.max(0, operationRawScore);
        result.rawScores.operationStandard = Math.round(operationRawScore);
        result.breakdown.operationStandard = Math.round(operationRawScore * 0.2);
        result.details.operationInfo = operationIssues.length > 0 ? operationIssues.join('，') : '操作规范';
        
        // ==================== 计算总分 ====================
        result.totalScore = result.breakdown.pointCount + 
                           result.breakdown.distribution + 
                           result.breakdown.methodCorrectness + 
                           result.breakdown.operationStandard;
        
        // 确保总分在0-100范围内
        result.totalScore = Math.max(0, Math.min(100, result.totalScore));
        
        // ==================== 确定评级和反馈 ====================
        // Property 10: 评级阈值正确性
        // ≥80分为"优秀"，60-79分为"良好"或"及格"，<60分为"需要改进"
        const gradeAndFeedback = getGradeAndFeedback(result);
        result.grade = gradeAndFeedback.grade;
        result.feedback = gradeAndFeedback.feedback;
        
        return result;
    }
    
    /**
     * 根据评分结果确定评级和生成反馈
     * Requirements: 6.3, 6.4, 6.5, 6.6 - 显示评级和反馈
     * 
     * Property 10: 评级阈值正确性
     * ≥80分为"优秀"，60-79分为"良好"或"及格"，<60分为"需要改进"
     * 
     * @param {ScoreResult} result - 评分结果
     * @returns {{grade: string, feedback: string}} 评级和反馈
     */
    function getGradeAndFeedback(result) {
        const totalScore = result.totalScore;
        let grade = 'fail';
        let feedback = '';
        
        // 找出最弱的维度
        const weakestDimension = findWeakestDimension(result.rawScores);
        
        if (totalScore >= 80) {
            grade = 'excellent';
            feedback = '🎉 优秀！你的布点方案完全符合国标要求！\n\n';
            feedback += '✅ 采样点数量充足\n';
            feedback += '✅ 分布均匀合理\n';
            feedback += '✅ 采样方法选择正确\n';
            feedback += '✅ 操作规范标准\n\n';
            feedback += '继续保持，你已经掌握了采样布点的核心要领！';
        } else if (totalScore >= 70) {
            grade = 'good';
            feedback = '👍 良好！布点方案基本合理。\n\n';
            feedback += generateImprovementSuggestion(weakestDimension, result);
        } else if (totalScore >= 60) {
            grade = 'pass';
            feedback = '✅ 及格。布点方案达到基本要求。\n\n';
            feedback += generateImprovementSuggestion(weakestDimension, result);
            feedback += '\n\n💡 建议参考知识点提示，进一步优化布点方案。';
        } else {
            grade = 'fail';
            feedback = '📚 需要改进。布点方案存在较多问题。\n\n';
            feedback += generateImprovementSuggestion(weakestDimension, result);
            feedback += '\n\n📖 建议仔细阅读采样规范，重新设计布点方案。';
            feedback += '\n可以点击"帮助"按钮查看操作指南和知识点汇总。';
        }
        
        return { grade, feedback };
    }
    
    /**
     * 找出最弱的评分维度
     * @param {Object} rawScores - 各维度原始得分
     * @returns {string} 最弱维度名称
     */
    function findWeakestDimension(rawScores) {
        const dimensions = [
            { name: 'pointCount', score: rawScores.pointCount, label: '采样点数量' },
            { name: 'distribution', score: rawScores.distribution, label: '分布均匀性' },
            { name: 'methodCorrectness', score: rawScores.methodCorrectness, label: '方法正确性' },
            { name: 'operationStandard', score: rawScores.operationStandard, label: '操作规范性' }
        ];
        
        dimensions.sort((a, b) => a.score - b.score);
        return dimensions[0].name;
    }
    
    /**
     * 生成改进建议
     * @param {string} weakestDimension - 最弱维度
     * @param {ScoreResult} result - 评分结果
     * @returns {string} 改进建议
     */
    function generateImprovementSuggestion(weakestDimension, result) {
        const suggestions = {
            pointCount: `📍 采样点数量不足\n${result.details.pointCountInfo}\n建议：增加采样点数量，确保达到国标要求的最少采样点数。`,
            distribution: `📊 分布均匀性需改进\n${result.details.distributionInfo}\n建议：调整采样点位置，使其更均匀地覆盖整个采样区域。`,
            methodCorrectness: `🔧 采样方法选择\n${result.details.methodInfo}\n建议：根据场景特点选择最适合的采样方法。`,
            operationStandard: `⚠️ 操作规范性问题\n${result.details.operationInfo}\n建议：避免在禁止区域布点，保持采样点间距合理。`
        };
        
        return suggestions[weakestDimension] || '';
    }
    
    /**
     * 提交布点方案并显示评分结果
     * Requirements: 6.3, 6.4, 6.5, 6.6 - 显示评分结果和反馈
     */
    function submitPlan() {
        const validation = validatePlan();
        if (!validation) return;
        
        const score = calculateScore();
        if (!score) return;
        
        // 显示评分结果模态框
        showScoreModal(score);
        
        // 保存练习记录
        savePracticeRecord(score);
        
        // 优秀时显示庆祝效果
        if (score.grade === 'excellent') {
            celebrateSuccess();
        }
    }
    
    /**
     * 显示评分结果模态框
     * Requirements: 6.3, 6.4 - 显示总分、各维度得分和文字反馈
     * @param {ScoreResult} score - 评分结果
     */
    function showScoreModal(score) {
        // 评级标签和颜色
        const gradeConfig = {
            excellent: { label: '🏆 优秀', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.2)' },
            good: { label: '👍 良好', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.2)' },
            pass: { label: '✅ 及格', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.2)' },
            fail: { label: '📚 需改进', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.2)' }
        };
        
        const config = gradeConfig[score.grade];
        
        // 移除已存在的模态框
        const existingModal = document.getElementById('score-modal');
        if (existingModal) existingModal.remove();
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.id = 'score-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;animation:fadeIn 0.3s ease;';
        
        modal.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes scoreCount { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            </style>
            <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:20px;padding:30px;max-width:500px;width:90%;box-shadow:0 25px 50px rgba(0,0,0,0.5);animation:slideUp 0.4s ease;border:1px solid rgba(255,255,255,0.1);">
                <div style="text-align:center;margin-bottom:25px;">
                    <div style="font-size:1.5rem;font-weight:bold;color:${config.color};background:${config.bgColor};padding:8px 20px;border-radius:30px;display:inline-block;margin-bottom:15px;">${config.label}</div>
                    <div style="font-size:4rem;font-weight:bold;color:white;animation:scoreCount 0.6s ease;">${score.totalScore}<span style="font-size:1.5rem;color:#94a3b8;">分</span></div>
                </div>
                
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:20px;">
                    <h4 style="color:#94a3b8;font-size:0.9rem;margin:0 0 15px 0;">📊 分项得分</h4>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <span style="color:#e2e8f0;font-size:0.95rem;">采样点数量</span>
                        <div style="flex:1;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;margin:0 15px;overflow:hidden;">
                            <div style="height:100%;width:${score.rawScores.pointCount}%;background:linear-gradient(90deg,#3b82f6,#60a5fa);border-radius:4px;"></div>
                        </div>
                        <span style="color:white;font-weight:bold;min-width:45px;text-align:right;">${score.rawScores.pointCount}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <span style="color:#e2e8f0;font-size:0.95rem;">分布均匀性</span>
                        <div style="flex:1;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;margin:0 15px;overflow:hidden;">
                            <div style="height:100%;width:${score.rawScores.distribution}%;background:linear-gradient(90deg,#10b981,#34d399);border-radius:4px;"></div>
                        </div>
                        <span style="color:white;font-weight:bold;min-width:45px;text-align:right;">${score.rawScores.distribution}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <span style="color:#e2e8f0;font-size:0.95rem;">方法正确性</span>
                        <div style="flex:1;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;margin:0 15px;overflow:hidden;">
                            <div style="height:100%;width:${score.rawScores.methodCorrectness}%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:4px;"></div>
                        </div>
                        <span style="color:white;font-weight:bold;min-width:45px;text-align:right;">${score.rawScores.methodCorrectness}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="color:#e2e8f0;font-size:0.95rem;">操作规范性</span>
                        <div style="flex:1;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;margin:0 15px;overflow:hidden;">
                            <div style="height:100%;width:${score.rawScores.operationStandard}%;background:linear-gradient(90deg,#8b5cf6,#a78bfa);border-radius:4px;"></div>
                        </div>
                        <span style="color:white;font-weight:bold;min-width:45px;text-align:right;">${score.rawScores.operationStandard}</span>
                    </div>
                </div>
                
                <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:15px;margin-bottom:20px;border-left:3px solid ${config.color};">
                    <p style="color:#cbd5e1;font-size:0.9rem;line-height:1.6;margin:0;white-space:pre-line;">${score.feedback}</p>
                </div>
                
                <div style="display:flex;gap:10px;justify-content:center;">
                    <button onclick="document.getElementById('score-modal').remove()" style="padding:12px 25px;border-radius:10px;border:none;font-size:1rem;cursor:pointer;background:rgba(255,255,255,0.1);color:#94a3b8;">关闭</button>
                    <button onclick="document.getElementById('score-modal').remove();SamplingSandbox.resetAll();" style="padding:12px 25px;border-radius:10px;border:none;font-size:1rem;cursor:pointer;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:white;">重新练习</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * 显示庆祝动画（优秀评级时）
     * Requirements: 6.5 - 显示"优秀"评级和庆祝动画
     */
    function celebrateSuccess() {
        console.log('🎉 恭喜完成优秀的布点方案！');
        
        // 创建彩带/烟花效果
        createConfetti();
    }
    
    /**
     * 创建彩带庆祝效果
     */
    function createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];
        const confettiCount = 100;
        
        // 移除已存在的容器
        const existingContainer = document.getElementById('confetti-container');
        if (existingContainer) existingContainer.remove();
        
        // 创建容器
        const container = document.createElement('div');
        container.id = 'confetti-container';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10001;overflow:hidden;';
        document.body.appendChild(container);
        
        // 添加动画样式
        const styleId = 'confetti-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = '@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }';
            document.head.appendChild(style);
        }
        
        // 创建彩带
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5;
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 3 + 2;
            const animationDelay = Math.random() * 2;
            const borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            
            confetti.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:${color};left:${left}%;top:-20px;border-radius:${borderRadius};animation:confettiFall ${animationDuration}s ease-in ${animationDelay}s forwards;transform:rotate(${Math.random() * 360}deg);`;
            
            container.appendChild(confetti);
        }
        
        // 5秒后移除
        setTimeout(() => {
            container.remove();
        }, 5000);
    }
    
    // ==================== 练习记录 ====================
    
    const RECORDS_KEY = 'sampling_sandbox_records';
    const MAX_RECORDS = 20;
    
    function savePracticeRecord(score) {
        const records = getPracticeRecords();
        
        const record = {
            id: 'record_' + Date.now(),
            scenarioId: currentScenario.id,
            scenarioName: currentScenario.name,
            method: currentMethod,
            points: JSON.parse(JSON.stringify(samplingPoints)),
            score: score.totalScore,
            grade: score.grade,
            timestamp: Date.now()
        };
        
        records.unshift(record);
        
        // 限制记录数量
        while (records.length > MAX_RECORDS) {
            records.pop();
        }
        
        localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    }
    
    function getPracticeRecords() {
        try {
            return JSON.parse(localStorage.getItem(RECORDS_KEY)) || [];
        } catch (e) {
            return [];
        }
    }
    
    function loadPracticeRecord(recordId) {
        const records = getPracticeRecords();
        const record = records.find(r => r.id === recordId);
        
        if (!record) return false;
        
        // 加载场景
        loadScenario(record.scenarioId);
        
        // 恢复采样点
        samplingPoints = JSON.parse(JSON.stringify(record.points));
        pointCounter = samplingPoints.length;
        
        // 恢复采样方法
        setSamplingMethod(record.method);
        
        updateStats();
        render();
        
        // 关闭历史记录面板
        hideHistoryPanel();
        
        return true;
    }
    
    /**
     * 删除练习记录
     * Requirements: 9.4 - 删除历史记录
     * 
     * @param {string} recordId - 记录ID
     * @returns {boolean} 是否成功删除
     */
    function deletePracticeRecord(recordId) {
        const records = getPracticeRecords();
        const index = records.findIndex(r => r.id === recordId);
        
        if (index === -1) return false;
        
        records.splice(index, 1);
        localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
        
        // 刷新历史记录面板
        refreshHistoryPanel();
        
        return true;
    }
    
    /**
     * 显示历史记录面板
     * Requirements: 9.2 - 显示历史记录列表
     */
    function showHistoryPanel() {
        // 移除已存在的面板
        let panel = document.getElementById('history-panel');
        if (panel) panel.remove();
        
        const records = getPracticeRecords();
        
        // 创建面板
        panel = document.createElement('div');
        panel.id = 'history-panel';
        panel.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;animation:fadeIn 0.3s ease;';
        
        // 评级配置
        const gradeConfig = {
            excellent: { label: '🏆 优秀', color: '#10b981' },
            good: { label: '👍 良好', color: '#3b82f6' },
            pass: { label: '✅ 及格', color: '#f59e0b' },
            fail: { label: '📚 需改进', color: '#ef4444' }
        };
        
        // 生成记录列表HTML
        let recordsHtml = '';
        if (records.length === 0) {
            recordsHtml = `
                <div style="text-align:center;padding:40px;color:#64748b;">
                    <div style="font-size:3rem;margin-bottom:15px;">📭</div>
                    <div>暂无练习记录</div>
                    <div style="font-size:0.85rem;margin-top:5px;">完成练习并提交评分后，记录将自动保存</div>
                </div>
            `;
        } else {
            recordsHtml = records.map((record, index) => {
                const date = new Date(record.timestamp);
                const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
                const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                const config = gradeConfig[record.grade] || gradeConfig.fail;
                
                return `
                    <div class="history-item" style="display:flex;align-items:center;padding:15px;background:rgba(255,255,255,0.05);border-radius:10px;margin-bottom:10px;transition:all 0.2s;cursor:pointer;" 
                         onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                         onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;">
                                <span style="font-weight:bold;color:white;">${record.scenarioName}</span>
                                <span style="font-size:0.8rem;color:${config.color};background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:10px;">${config.label}</span>
                            </div>
                            <div style="font-size:0.8rem;color:#64748b;">
                                ${dateStr} ${timeStr} · ${record.points.length}个采样点 · ${METHOD_CONFIG[record.method]?.name || record.method}
                            </div>
                        </div>
                        <div style="text-align:right;margin-right:15px;">
                            <div style="font-size:1.5rem;font-weight:bold;color:${config.color};">${record.score}</div>
                            <div style="font-size:0.75rem;color:#64748b;">分</div>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button onclick="event.stopPropagation();SamplingSandbox.loadPracticeRecord('${record.id}')" 
                                    style="padding:8px 15px;border:none;border-radius:6px;background:rgba(59,130,246,0.3);color:#60a5fa;cursor:pointer;font-size:0.85rem;transition:all 0.2s;"
                                    onmouseover="this.style.background='rgba(59,130,246,0.5)'" 
                                    onmouseout="this.style.background='rgba(59,130,246,0.3)'">
                                📂 加载
                            </button>
                            <button onclick="event.stopPropagation();if(confirm('确定删除此记录？')){SamplingSandbox.deletePracticeRecord('${record.id}')}" 
                                    style="padding:8px 12px;border:none;border-radius:6px;background:rgba(239,68,68,0.2);color:#f87171;cursor:pointer;font-size:0.85rem;transition:all 0.2s;"
                                    onmouseover="this.style.background='rgba(239,68,68,0.4)'" 
                                    onmouseout="this.style.background='rgba(239,68,68,0.2)'">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        panel.innerHTML = `
            <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:20px;padding:25px;max-width:600px;width:90%;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 25px 50px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h2 style="color:white;font-size:1.3rem;display:flex;align-items:center;gap:10px;">
                        <span>📋</span>
                        <span>练习记录</span>
                        <span style="font-size:0.85rem;color:#64748b;font-weight:normal;">(${records.length}/${MAX_RECORDS})</span>
                    </h2>
                    <button onclick="SamplingSandbox.hideHistoryPanel()" 
                            style="width:32px;height:32px;border:none;border-radius:8px;background:rgba(255,255,255,0.1);color:#94a3b8;cursor:pointer;font-size:1.2rem;transition:all 0.2s;"
                            onmouseover="this.style.background='rgba(255,255,255,0.2)'" 
                            onmouseout="this.style.background='rgba(255,255,255,0.1)'">×</button>
                </div>
                <div style="overflow-y:auto;flex:1;padding-right:5px;">
                    ${recordsHtml}
                </div>
                ${records.length > 0 ? `
                    <div style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
                        <button onclick="if(confirm('确定清空所有练习记录？此操作不可恢复。')){SamplingSandbox.clearAllRecords()}" 
                                style="padding:10px 20px;border:none;border-radius:8px;background:rgba(239,68,68,0.2);color:#f87171;cursor:pointer;font-size:0.85rem;transition:all 0.2s;"
                                onmouseover="this.style.background='rgba(239,68,68,0.4)'" 
                                onmouseout="this.style.background='rgba(239,68,68,0.2)'">
                            🗑️ 清空所有记录
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 点击背景关闭
        panel.addEventListener('click', function(e) {
            if (e.target === panel) {
                hideHistoryPanel();
            }
        });
    }
    
    /**
     * 隐藏历史记录面板
     */
    function hideHistoryPanel() {
        const panel = document.getElementById('history-panel');
        if (panel) {
            panel.remove();
        }
    }
    
    /**
     * 刷新历史记录面板
     */
    function refreshHistoryPanel() {
        const panel = document.getElementById('history-panel');
        if (panel) {
            hideHistoryPanel();
            showHistoryPanel();
        }
    }
    
    /**
     * 清空所有练习记录
     */
    function clearAllRecords() {
        localStorage.removeItem(RECORDS_KEY);
        refreshHistoryPanel();
    }
    
    // ==================== 重置 ====================
    
    function resetAll() {
        if (!confirm('确定要重新开始吗？所有采样点将被清空。')) return;
        
        samplingPoints = [];
        pointCounter = 0;
        history = [];
        historyIndex = -1;
        selectedPoint = null;
        
        updateStats();
        render();
        
        // 重置验证UI
        const listEl = document.getElementById('validation-list');
        if (listEl) {
            listEl.innerHTML = `
                <div class="validation-item">
                    <span class="status pending">○</span>
                    <span>采样点数量</span>
                </div>
                <div class="validation-item">
                    <span class="status pending">○</span>
                    <span>分布均匀性</span>
                </div>
                <div class="validation-item">
                    <span class="status pending">○</span>
                    <span>位置有效性</span>
                </div>
            `;
        }
    }
    
    // ==================== 教师演示模式 ====================
    // Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6 - 教师演示模式
    
    // 演示模式状态
    let demonstrationMode = false;
    let demonstrationAnimationId = null;
    let demonstrationStep = 0;
    
    /**
     * 检查URL参数是否启用演示模式
     * Requirements: 10.1 - 从管理后台进入时提供演示模式选项
     */
    function checkDemonstrationModeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('mode') === 'demo' || urlParams.get('demo') === 'true';
    }
    
    /**
     * 启用演示模式
     * Requirements: 10.1 - 从管理后台进入时提供演示模式选项
     * Requirements: 10.2 - 隐藏评分功能并放大显示界面
     */
    function enableDemonstrationMode() {
        demonstrationMode = true;
        demonstrationStep = 0;
        
        // 隐藏评分相关按钮 (Requirements: 10.2)
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) submitBtn.style.display = 'none';
        
        // 添加演示模式标识
        addDemonstrationModeIndicator();
        
        // 添加演示控制面板
        addDemonstrationControls();
        
        // 放大显示 (Requirements: 10.2)
        setZoom(1.2);
        
        // 更新知识面板显示演示模式说明
        updateKnowledgeTip('demonstration');
        const knowledgePanel = document.getElementById('knowledge-text');
        if (knowledgePanel) {
            knowledgePanel.innerHTML = `
                <strong>🎓 演示模式已启用</strong><br><br>
                在此模式下，您可以：<br>
                • 展示标准布点方案<br>
                • 逐步演示布点过程<br>
                • 切换到学生练习模式<br><br>
                <em>点击下方"显示标准答案"开始演示</em>
            `;
        }
        
        console.log('🎓 演示模式已启用');
    }
    
    /**
     * 禁用演示模式
     * Requirements: 10.6 - 切换到练习模式
     */
    function disableDemonstrationMode() {
        demonstrationMode = false;
        demonstrationStep = 0;
        
        // 停止动画
        if (demonstrationAnimationId) {
            cancelAnimationFrame(demonstrationAnimationId);
            demonstrationAnimationId = null;
        }
        
        // 显示评分按钮
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) submitBtn.style.display = '';
        
        // 移除演示模式标识
        const indicator = document.getElementById('demo-mode-indicator');
        if (indicator) indicator.remove();
        
        // 移除演示控制面板
        const controls = document.getElementById('demo-controls');
        if (controls) controls.remove();
        
        // 恢复正常缩放
        setZoom(1.0);
        
        // 恢复知识面板
        showMethodDetails(currentMethod);
        
        console.log('📚 已切换到练习模式');
    }
    
    /**
     * 切换演示模式
     */
    function toggleDemonstrationMode() {
        if (demonstrationMode) {
            disableDemonstrationMode();
        } else {
            enableDemonstrationMode();
        }
    }
    
    /**
     * 检查是否处于演示模式
     * @returns {boolean} 是否处于演示模式
     */
    function isDemonstrationMode() {
        return demonstrationMode;
    }
    
    /**
     * 添加演示模式标识
     * Requirements: 10.2 - 演示模式界面标识
     */
    function addDemonstrationModeIndicator() {
        // 移除已存在的标识
        const existing = document.getElementById('demo-mode-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'demo-mode-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: bold;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            animation: pulse 2s infinite;
        `;
        indicator.innerHTML = `
            <span>🎓</span>
            <span>演示模式</span>
        `;
        
        // 添加脉冲动画样式
        if (!document.getElementById('demo-mode-styles')) {
            const style = document.createElement('style');
            style.id = 'demo-mode-styles';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                @keyframes pointAppear {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
    }
    
    /**
     * 添加演示控制面板
     * Requirements: 10.3 - 显示操作步骤说明
     * Requirements: 10.4 - 显示标准答案按钮
     * Requirements: 10.5 - 逐步演示按钮
     */
    function addDemonstrationControls() {
        // 移除已存在的控制面板
        const existing = document.getElementById('demo-controls');
        if (existing) existing.remove();
        
        const controls = document.createElement('div');
        controls.id = 'demo-controls';
        controls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 15px;
            padding: 15px 25px;
            display: flex;
            gap: 15px;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        `;
        
        controls.innerHTML = `
            <div style="color: #94a3b8; font-size: 0.85rem; margin-right: 10px;">
                <span style="color: #8b5cf6;">🎓</span> 演示控制
            </div>
            <button id="btn-show-answer" onclick="SamplingSandbox.showStandardAnswer()" 
                    style="padding: 10px 20px; border: none; border-radius: 8px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: all 0.2s;"
                    onmouseover="this.style.transform='translateY(-2px)'" 
                    onmouseout="this.style.transform='translateY(0)'">
                📍 显示标准答案
            </button>
            <button id="btn-step-demo" onclick="SamplingSandbox.stepDemonstration()" 
                    style="padding: 10px 20px; border: none; border-radius: 8px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: all 0.2s;"
                    onmouseover="this.style.transform='translateY(-2px)'" 
                    onmouseout="this.style.transform='translateY(0)'">
                ▶️ 逐步演示
            </button>
            <button id="btn-clear-demo" onclick="SamplingSandbox.clearAllPoints(true)" 
                    style="padding: 10px 20px; border: none; border-radius: 8px; background: rgba(239, 68, 68, 0.2); color: #f87171; cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: all 0.2s;"
                    onmouseover="this.style.background='rgba(239, 68, 68, 0.4)'" 
                    onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">
                🗑️ 清空
            </button>
            <div style="width: 1px; height: 30px; background: rgba(255,255,255,0.2);"></div>
            <button id="btn-switch-practice" onclick="SamplingSandbox.switchToPracticeMode()" 
                    style="padding: 10px 20px; border: none; border-radius: 8px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: all 0.2s;"
                    onmouseover="this.style.transform='translateY(-2px)'" 
                    onmouseout="this.style.transform='translateY(0)'">
                👨‍🎓 让学生尝试
            </button>
        `;
        
        document.body.appendChild(controls);
    }
    
    /**
     * 显示标准答案
     * Requirements: 10.4 - 展示该场景的推荐布点方案
     */
    function showStandardAnswer() {
        if (!currentScenario) return;
        
        const standardAnswer = getStandardAnswer();
        if (!standardAnswer || standardAnswer.length === 0) {
            showMessage('当前场景暂无标准答案');
            return;
        }
        
        // 清空现有采样点
        samplingPoints = [];
        pointCounter = 0;
        
        // 添加标准答案的所有采样点
        standardAnswer.forEach((point, index) => {
            const grid = canvasToGrid(point.x, point.y);
            samplingPoints.push({
                id: generatePointId(),
                label: point.label || `S${index + 1}`,
                x: point.x,
                y: point.y,
                gridRow: grid.row,
                gridCol: grid.col,
                createdAt: Date.now(),
                properties: {},
                _isStandardAnswer: true // 标记为标准答案点
            });
            pointCounter++;
        });
        
        saveHistory();
        updateStats();
        render();
        
        // 更新知识面板
        const knowledgePanel = document.getElementById('knowledge-text');
        if (knowledgePanel) {
            const methodName = METHOD_CONFIG[currentScenario.requirements.recommendedMethod]?.name || '推荐方法';
            knowledgePanel.innerHTML = `
                <strong>📍 标准答案已显示</strong><br><br>
                当前场景：${currentScenario.name}<br>
                推荐方法：${methodName}<br>
                采样点数：${standardAnswer.length}个<br><br>
                <em>这是符合国标要求的推荐布点方案</em>
            `;
        }
        
        console.log('📍 显示标准答案:', standardAnswer.length, '个采样点');
    }
    
    /**
     * 逐步演示布点过程
     * Requirements: 10.5 - 动画展示布点过程
     */
    function stepDemonstration() {
        if (!currentScenario) return;
        
        const standardAnswer = getStandardAnswer();
        if (!standardAnswer || standardAnswer.length === 0) {
            showMessage('当前场景暂无标准答案');
            return;
        }
        
        // 如果是第一步或已完成，重新开始
        if (demonstrationStep === 0 || demonstrationStep >= standardAnswer.length) {
            // 清空现有采样点
            samplingPoints = [];
            pointCounter = 0;
            demonstrationStep = 0;
            
            // 更新按钮文字
            const btn = document.getElementById('btn-step-demo');
            if (btn) btn.innerHTML = '▶️ 逐步演示';
        }
        
        // 添加下一个采样点
        if (demonstrationStep < standardAnswer.length) {
            const point = standardAnswer[demonstrationStep];
            const grid = canvasToGrid(point.x, point.y);
            
            const newPoint = {
                id: generatePointId(),
                label: point.label || `S${demonstrationStep + 1}`,
                x: point.x,
                y: point.y,
                gridRow: grid.row,
                gridCol: grid.col,
                createdAt: Date.now(),
                properties: {},
                _isStandardAnswer: true,
                _animating: true // 标记为正在动画
            };
            
            samplingPoints.push(newPoint);
            pointCounter++;
            demonstrationStep++;
            
            // 更新统计
            updateStats();
            
            // 渲染并播放动画
            render();
            animateNewPoint(newPoint);
            
            // 更新知识面板显示当前步骤
            showDemonstrationStepInfo(demonstrationStep, standardAnswer.length, point);
            
            // 更新按钮文字
            const btn = document.getElementById('btn-step-demo');
            if (btn) {
                if (demonstrationStep >= standardAnswer.length) {
                    btn.innerHTML = '🔄 重新演示';
                } else {
                    btn.innerHTML = `▶️ 下一步 (${demonstrationStep}/${standardAnswer.length})`;
                }
            }
        }
        
        saveHistory();
    }
    
    /**
     * 自动演示（连续播放）
     * Requirements: 10.5 - 动画展示布点过程
     */
    function autoPlayDemonstration() {
        if (!currentScenario) return;
        
        const standardAnswer = getStandardAnswer();
        if (!standardAnswer || standardAnswer.length === 0) {
            showMessage('当前场景暂无标准答案');
            return;
        }
        
        // 清空并重置
        samplingPoints = [];
        pointCounter = 0;
        demonstrationStep = 0;
        
        // 逐个添加采样点，带延迟
        let stepIndex = 0;
        const addNextPoint = () => {
            if (stepIndex >= standardAnswer.length) {
                // 演示完成
                const knowledgePanel = document.getElementById('knowledge-text');
                if (knowledgePanel) {
                    knowledgePanel.innerHTML = `
                        <strong>✅ 演示完成</strong><br><br>
                        已展示完整的标准布点方案。<br><br>
                        点击"让学生尝试"切换到练习模式，<br>
                        让学生自己动手练习。
                    `;
                }
                return;
            }
            
            const point = standardAnswer[stepIndex];
            const grid = canvasToGrid(point.x, point.y);
            
            const newPoint = {
                id: generatePointId(),
                label: point.label || `S${stepIndex + 1}`,
                x: point.x,
                y: point.y,
                gridRow: grid.row,
                gridCol: grid.col,
                createdAt: Date.now(),
                properties: {},
                _isStandardAnswer: true
            };
            
            samplingPoints.push(newPoint);
            pointCounter++;
            demonstrationStep++;
            stepIndex++;
            
            updateStats();
            render();
            animateNewPoint(newPoint);
            showDemonstrationStepInfo(stepIndex, standardAnswer.length, point);
            
            // 延迟添加下一个点
            setTimeout(addNextPoint, 1000);
        };
        
        addNextPoint();
    }
    
    /**
     * 播放采样点出现动画
     * @param {SamplingPoint} point - 采样点
     */
    function animateNewPoint(point) {
        // 简单的缩放动画效果通过CSS实现
        // 这里主要是触发重绘
        setTimeout(() => {
            point._animating = false;
            render();
        }, 300);
    }
    
    /**
     * 显示演示步骤信息
     * Requirements: 10.3 - 显示操作步骤说明
     * @param {number} step - 当前步骤
     * @param {number} total - 总步骤数
     * @param {Object} point - 当前采样点
     */
    function showDemonstrationStepInfo(step, total, point) {
        const knowledgePanel = document.getElementById('knowledge-text');
        if (!knowledgePanel) return;
        
        const methodName = METHOD_CONFIG[currentScenario.requirements.recommendedMethod]?.name || '推荐方法';
        const grid = canvasToGrid(point.x, point.y);
        
        let stepDescription = '';
        if (step === 1) {
            stepDescription = '首先在区域的一角或边缘开始布点';
        } else if (step === total) {
            stepDescription = '最后一个采样点，确保覆盖完整';
        } else if (step <= total / 2) {
            stepDescription = '继续均匀分布采样点';
        } else {
            stepDescription = '补充采样点，提高覆盖率';
        }
        
        knowledgePanel.innerHTML = `
            <strong>📍 步骤 ${step}/${total}</strong><br><br>
            <div style="background:rgba(59,130,246,0.2);padding:10px;border-radius:8px;margin-bottom:10px;">
                添加采样点 <strong>${point.label || 'S' + step}</strong><br>
                位置: (${Math.round(point.x)}, ${Math.round(point.y)})<br>
                网格: (${grid.row}, ${grid.col})
            </div>
            <em>${stepDescription}</em><br><br>
            采样方法: ${methodName}
        `;
    }
    
    /**
     * 切换到练习模式
     * Requirements: 10.6 - 提供"让学生尝试"按钮切换到练习模式
     */
    function switchToPracticeMode() {
        // 清空采样点，让学生从头开始
        samplingPoints = [];
        pointCounter = 0;
        demonstrationStep = 0;
        
        // 禁用演示模式
        disableDemonstrationMode();
        
        // 更新知识面板
        const knowledgePanel = document.getElementById('knowledge-text');
        if (knowledgePanel) {
            knowledgePanel.innerHTML = `
                <strong>👨‍🎓 练习模式</strong><br><br>
                现在轮到你来尝试了！<br><br>
                根据刚才演示的方法，<br>
                在画布上添加采样点。<br><br>
                完成后点击"验证方案"检查结果。
            `;
        }
        
        updateStats();
        render();
        
        showMessage('已切换到练习模式，请开始布点练习！');
    }
    
    /**
     * 显示演示模式选择对话框
     * Requirements: 10.1 - 从管理后台进入时提供演示模式选项
     */
    function showDemonstrationModeDialog() {
        // 移除已存在的对话框
        const existing = document.getElementById('demo-mode-dialog');
        if (existing) existing.remove();
        
        const dialog = document.createElement('div');
        dialog.id = 'demo-mode-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        dialog.innerHTML = `
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 30px; max-width: 450px; width: 90%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 3rem; margin-bottom: 15px;">🎯</div>
                <h2 style="color: white; margin-bottom: 10px; font-size: 1.5rem;">选择使用模式</h2>
                <p style="color: #94a3b8; margin-bottom: 25px; font-size: 0.95rem;">请选择您要使用的模式</p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="SamplingSandbox.startPracticeMode()" 
                            style="padding: 15px 25px; border: none; border-radius: 12px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; cursor: pointer; font-weight: bold; font-size: 1rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px;"
                            onmouseover="this.style.transform='translateY(-2px)'" 
                            onmouseout="this.style.transform='translateY(0)'">
                        <span style="font-size: 1.3rem;">👨‍🎓</span>
                        <div style="text-align: left;">
                            <div>学生练习模式</div>
                            <div style="font-size: 0.8rem; font-weight: normal; opacity: 0.8;">自主练习采样布点</div>
                        </div>
                    </button>
                    
                    <button onclick="SamplingSandbox.startDemonstrationMode()" 
                            style="padding: 15px 25px; border: none; border-radius: 12px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; cursor: pointer; font-weight: bold; font-size: 1rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px;"
                            onmouseover="this.style.transform='translateY(-2px)'" 
                            onmouseout="this.style.transform='translateY(0)'">
                        <span style="font-size: 1.3rem;">🎓</span>
                        <div style="text-align: left;">
                            <div>教师演示模式</div>
                            <div style="font-size: 0.8rem; font-weight: normal; opacity: 0.8;">展示标准答案和逐步演示</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }
    
    /**
     * 开始练习模式（从对话框）
     */
    function startPracticeMode() {
        const dialog = document.getElementById('demo-mode-dialog');
        if (dialog) dialog.remove();
        
        // 隐藏操作指南
        hideGuide();
    }
    
    /**
     * 开始演示模式（从对话框）
     */
    function startDemonstrationMode() {
        const dialog = document.getElementById('demo-mode-dialog');
        if (dialog) dialog.remove();
        
        // 隐藏操作指南
        hideGuide();
        
        // 启用演示模式
        enableDemonstrationMode();
    }
    
    // ==================== 公开API ====================
    
    return {
        init,
        
        // 视图控制
        setZoom,
        zoomIn,
        zoomOut,
        pan,
        resetView,
        getZoom: () => zoom,
        getPan: () => ({ x: panX, y: panY }),
        
        // 坐标转换 (Requirements: 1.2, 1.5)
        screenToCanvas,
        canvasToScreen,
        canvasToGrid,
        gridToCanvas,
        snapToGrid: (x, y) => snapToGrid(x, y),
        distanceToNearestGridPoint,
        getNearestGridPoint,
        isOnGridPoint,
        
        // 采样点操作
        addPoint,
        movePoint,
        deletePoint: deleteSelectedPoint,
        clearAllPoints,
        getPoints: () => [...samplingPoints],
        getPointCount: () => samplingPoints.length,
        
        // 场景管理 (Requirements: 4.1, 4.3, 4.4, 4.5)
        loadScenario,
        getCurrentScenario,
        getScenarioList,
        getStandardAnswer,
        
        // 采样方法
        setSamplingMethod,
        getSamplingMethod,
        getMethodConfig,
        getAvailableMethods,
        isMethodApplicable,
        
        // 对角线辅助 (Requirements: 3.5)
        calculateDiagonalCoordinates,
        getDiagonalSamplingPositions,
        
        // 辅助工具 (Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7)
        toggleSnap,
        toggleDistance,
        autoPlace,
        undo,
        redo,
        isSnapEnabled: () => snapEnabled,
        isDistanceEnabled: () => distanceEnabled,
        
        // 距离和面积计算 (Requirements: 7.3, 7.4)
        calculateDistance,
        pixelToMeter,
        calculateTotalArea,
        getAllPointDistances,
        getDistanceExtremes,
        
        // 撤销/重做 (Requirements: 7.7)
        getHistoryState,
        clearHistory,
        
        // 验证与评分 (Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7)
        validatePlan,
        calculateScore,
        submitPlan,
        
        // PointValidator 方法（用于测试和外部调用）
        calculateMinPoints: (wasteVolume, unitArea) => PointValidator.calculateMinPoints(wasteVolume, unitArea),
        calculateGridCoverage: (points, scenario) => PointValidator.calculateGridCoverage(points, scenario),
        validatePointCount: (points, scenario) => PointValidator.validatePointCount(points, scenario),
        validateDistribution: (points, scenario) => PointValidator.validateDistribution(points, scenario),
        validatePositions: (points, scenario) => PointValidator.validatePositions(points, scenario),
        
        // UI
        showGuide,
        hideGuide,
        editPointProperties,
        deleteSelectedPoint,
        
        // 知识点提示系统 (Requirements: 8.1, 8.2, 8.3, 8.5, 8.6)
        showMethodDetails,
        showNationalStandard,
        showFullManual,
        hideFullManual,
        getTerminologyExplanation,
        updateKnowledgeTip,
        
        // 知识点数据（用于外部访问）
        getMethodDetails: (method) => METHOD_DETAILS[method] || null,
        getNationalStandards: () => ({ ...NATIONAL_STANDARDS }),
        getTerminology: () => ({ ...TERMINOLOGY }),
        getOperationManual: () => ({ ...OPERATION_MANUAL }),
        wrapTermsWithTooltip,
        initTerminologyTooltips,
        
        // 练习记录 (Requirements: 9.1, 9.2, 9.3, 9.4, 9.5)
        getPracticeRecords,
        loadPracticeRecord,
        deletePracticeRecord,
        showHistoryPanel,
        hideHistoryPanel,
        clearAllRecords,
        
        // 重置
        resetAll,
        
        // 渲染
        render,
        
        // 教师演示模式 (Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6)
        enableDemonstrationMode,
        disableDemonstrationMode,
        toggleDemonstrationMode,
        isDemonstrationMode,
        showStandardAnswer,
        stepDemonstration,
        autoPlayDemonstration,
        switchToPracticeMode,
        showDemonstrationModeDialog,
        startPracticeMode,
        startDemonstrationMode,
        checkDemonstrationModeFromURL
    };
})();

// 导出到全局
window.SamplingSandbox = SamplingSandbox;
