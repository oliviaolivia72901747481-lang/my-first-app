/**
 * 危废鉴别剧本杀 - 主控制器
 * HazwasteDetective Game Controller
 * 
 * 核心功能：
 * - 案件卷宗管理
 * - 虚拟预算与检测购买
 * - 线索收集与展示
 * - 鉴别判定与评分
 * - 游戏进度保存/加载
 */

// ==================== 数据模型定义 ====================

/**
 * 检测项目类别枚举
 * @typedef {'corrosivity'|'acute_toxicity'|'leaching_toxicity'|'flammability'|'reactivity'|'toxic_content'} DetectionCategory
 */

/**
 * 危险特性枚举
 * @typedef {'corrosivity'|'toxicity'|'flammability'|'reactivity'|'infectivity'} HazardCharacteristic
 */

/**
 * 评级枚举
 * @typedef {'gold_detective'|'silver_detective'|'bronze_detective'|'trainee'} Grade
 */

/**
 * 案件难度枚举
 * @typedef {'beginner'|'intermediate'|'advanced'} Difficulty
 */

/**
 * 案件卷宗信息
 * @typedef {Object} CaseFile
 * @property {string} wasteSource - 废物来源/产生工艺
 * @property {string} appearance - 外观描述
 * @property {string} odor - 气味描述
 * @property {Object} preliminaryData - 初步检测数据
 * @property {number} [preliminaryData.ph] - pH值
 * @property {number} [preliminaryData.temperature] - 温度
 * @property {number} [preliminaryData.moisture] - 含水率
 * @property {string[]} [photos] - 废物照片URL
 * @property {string} [additionalInfo] - 其他信息
 */

/**
 * 正确答案
 * @typedef {Object} CorrectAnswer
 * @property {'hazardous'|'non_hazardous'} result - 判定结果
 * @property {HazardCharacteristic[]} hazardCharacteristics - 危险特性
 * @property {string[]} requiredEvidence - 必须获取的检测项目ID
 * @property {string[]} standardBasis - 正确的国标条款
 */

/**
 * 案件数据结构
 * @typedef {Object} Case
 * @property {string} id - 案件ID
 * @property {string} name - 案件名称
 * @property {string} description - 案件描述
 * @property {Difficulty} difficulty - 难度等级
 * @property {CaseFile} caseFile - 卷宗信息
 * @property {number} budget - 初始预算
 * @property {number} [timeLimit] - 时间限制（秒）
 * @property {CorrectAnswer} correctAnswer - 正确答案
 * @property {string[]} optimalPath - 最优检测路径
 * @property {number} optimalCost - 最优路径花费
 * @property {Object.<string, DetectionResultData>} detectionResults - 检测结果映射
 * @property {boolean} isPreset - 是否为预设案件
 * @property {number} createdAt - 创建时间戳
 * @property {number} updatedAt - 更新时间戳
 */

/**
 * 检测项目
 * @typedef {Object} DetectionItem
 * @property {string} id - 项目ID
 * @property {string} name - 项目名称
 * @property {DetectionCategory} category - 类别
 * @property {number} price - 价格
 * @property {string} description - 描述
 * @property {string[]} applicableWasteTypes - 适用废物类型
 * @property {string[]} relatedStandards - 相关国标条款ID
 * @property {string} icon - 图标
 * @property {string} color - 颜色
 */

/**
 * 检测结果/线索卡片
 * @typedef {Object} DetectionResult
 * @property {string} id - 结果ID
 * @property {string} itemId - 检测项目ID
 * @property {string} itemName - 项目名称
 * @property {DetectionCategory} category - 类别
 * @property {number|string} value - 检测值
 * @property {string} unit - 单位
 * @property {number|string} standardLimit - 标准限值
 * @property {boolean} isExceeded - 是否超标
 * @property {number} cost - 花费
 * @property {number} purchaseOrder - 购买顺序
 * @property {number} purchaseTime - 购买时间戳
 */

/**
 * 鉴别判定
 * @typedef {Object} Judgment
 * @property {'hazardous'|'non_hazardous'|'need_further'} result - 判定结果
 * @property {HazardCharacteristic[]} [hazardCharacteristics] - 危险特性
 * @property {string[]} [standardBasis] - 判定依据
 * @property {string} [reasoning] - 判定理由
 */

/**
 * 游戏状态
 * @typedef {Object} GameState
 * @property {string} caseId - 当前案件ID
 * @property {number} budget - 初始预算
 * @property {number} remainingBudget - 剩余预算
 * @property {DetectionResult[]} purchasedItems - 已购检测结果
 * @property {number} startTime - 开始时间戳
 * @property {number} elapsedTime - 已用时间（秒）
 * @property {boolean} isCompleted - 是否完成
 * @property {Judgment} [judgment] - 提交的判定
 * @property {ScoreResult} [score] - 评分结果
 */

/**
 * 评分结果
 * @typedef {Object} ScoreResult
 * @property {number} totalScore - 总分 0-100
 * @property {Object} breakdown - 分项得分
 * @property {number} breakdown.accuracy - 判定准确性 (40%)
 * @property {number} breakdown.budgetEfficiency - 预算使用效率 (30%)
 * @property {number} breakdown.pathRationality - 检测路径合理性 (20%)
 * @property {number} breakdown.timeScore - 用时得分 (10%)
 * @property {Grade} grade - 评级
 * @property {Achievement[]} achievements - 成就
 * @property {Feedback} feedback - 反馈
 * @property {PathComparison} optimalPathComparison - 路径对比
 */

/**
 * 成就
 * @typedef {Object} Achievement
 * @property {string} id - 成就ID
 * @property {string} name - 成就名称
 * @property {string} description - 描述
 * @property {string} icon - 图标
 */

/**
 * 游戏记录
 * @typedef {Object} GameRecord
 * @property {string} id - 记录ID
 * @property {string} caseId - 案件ID
 * @property {string} caseName - 案件名称
 * @property {number} score - 得分
 * @property {Grade} grade - 评级
 * @property {number} elapsedTime - 用时
 * @property {string[]} purchasePath - 检测路径
 * @property {Judgment} judgment - 判定
 * @property {number} timestamp - 时间戳
 */

// ==================== 本地存储键名常量 ====================
const STORAGE_KEYS = {
    GAME_STATE: 'hazwaste_detective_game_state',
    GAME_HISTORY: 'hazwaste_detective_history',
    CUSTOM_CASES: 'hazwaste_detective_custom_cases',
    FIRST_VISIT: 'hazwaste_detective_first_visit'
};

// ==================== 检测类别配置 ====================
const DETECTION_CATEGORIES = {
    corrosivity: { name: '腐蚀性检测', icon: '🧪', color: '#e94560', standard: 'GB 5085.1' },
    acute_toxicity: { name: '急性毒性检测', icon: '☠️', color: '#9b59b6', standard: 'GB 5085.2' },
    leaching_toxicity: { name: '浸出毒性检测', icon: '💧', color: '#3498db', standard: 'GB 5085.3' },
    flammability: { name: '易燃性检测', icon: '🔥', color: '#e67e22', standard: 'GB 5085.4' },
    reactivity: { name: '反应性检测', icon: '⚡', color: '#f1c40f', standard: 'GB 5085.5' },
    toxic_content: { name: '毒性物质含量检测', icon: '🔬', color: '#1abc9c', standard: 'GB 5085.6' }
};

// ==================== 危险特性配置 ====================
const HAZARD_CHARACTERISTICS = {
    corrosivity: { name: '腐蚀性', code: 'C', icon: '🧪' },
    toxicity: { name: '毒性', code: 'T', icon: '☠️' },
    flammability: { name: '易燃性', code: 'I', icon: '🔥' },
    reactivity: { name: '反应性', code: 'R', icon: '⚡' },
    infectivity: { name: '感染性', code: 'In', icon: '🦠' }
};

// ==================== 评级配置 ====================
const GRADE_CONFIG = {
    gold_detective: { name: '金牌侦探', icon: '🥇', minScore: 90, color: '#f4a261' },
    silver_detective: { name: '银牌侦探', icon: '🥈', minScore: 70, color: '#94a3b8' },
    bronze_detective: { name: '铜牌侦探', icon: '🥉', minScore: 60, color: '#cd7f32' },
    trainee: { name: '实习侦探', icon: '🎓', minScore: 0, color: '#64748b' }
};

// ==================== 难度配置 ====================
const DIFFICULTY_CONFIG = {
    beginner: { name: '初级', stars: 1, color: '#2a9d8f' },
    intermediate: { name: '中级', stars: 2, color: '#f4a261' },
    advanced: { name: '高级', stars: 3, color: '#e94560' }
};

// ==================== GB 5085 知识库数据 ====================
// Requirements: 9.1, 9.2 - GB 5085系列标准的结构化内容，按危险特性分类
const GB5085_KNOWLEDGE_BASE = {
    // GB 5085.1 腐蚀性鉴别
    corrosivity: {
        standard: 'GB 5085.1',
        name: '腐蚀性鉴别',
        fullName: '危险废物鉴别标准 腐蚀性鉴别',
        description: '规定了腐蚀性危险废物的鉴别标准，适用于任何生产、生活和其他活动中产生的固体废物的腐蚀性鉴别。',
        icon: '🧪',
        color: '#e94560',
        clauses: [
            {
                id: 'GB5085.1-4.1',
                title: 'pH值鉴别',
                content: '按照规定方法测得的pH值≤2或≥12.5的固体废物，属于腐蚀性危险废物。',
                method: '按照HJ/T 299规定的方法制备浸出液，用pH计测定浸出液的pH值。',
                limits: [
                    { parameter: 'pH值', condition: '≤2 或 ≥12.5', result: '腐蚀性危险废物' }
                ],
                applicableWaste: ['废酸', '废碱', '酸洗废液', '碱洗废液', '电镀废液']
            },
            {
                id: 'GB5085.1-4.2',
                title: '腐蚀速率鉴别',
                content: '在55°C条件下，对钢材（20号钢）的腐蚀速率大于6.35mm/年的固体废物，属于腐蚀性危险废物。',
                method: '将20号钢试片浸入待测废物中，在55°C条件下保持一定时间，测定腐蚀速率。',
                limits: [
                    { parameter: '腐蚀速率', condition: '>6.35mm/年', result: '腐蚀性危险废物' }
                ],
                applicableWaste: ['强酸废物', '强碱废物', '腐蚀性化学品废物']
            }
        ],
        keyPoints: [
            'pH值是最常用的腐蚀性鉴别指标',
            '强酸（pH≤2）和强碱（pH≥12.5）均属于腐蚀性危险废物',
            '腐蚀速率测定主要用于pH值在2-12.5之间但仍具有腐蚀性的废物'
        ]
    },
    
    // GB 5085.2 急性毒性鉴别
    acute_toxicity: {
        standard: 'GB 5085.2',
        name: '急性毒性鉴别',
        fullName: '危险废物鉴别标准 急性毒性初筛',
        description: '规定了急性毒性危险废物的鉴别标准，通过经口、经皮和吸入三种途径评估废物的急性毒性。',
        icon: '☠️',
        color: '#9b59b6',
        clauses: [
            {
                id: 'GB5085.2-4.1',
                title: '经口急性毒性',
                content: '按照规定方法进行试验，经口摄入LD50≤200mg/kg体重的固体废物属于剧毒性危险废物；LD50>200mg/kg体重且≤2000mg/kg体重的固体废物属于有毒性危险废物。',
                method: '采用大鼠或小鼠进行经口急性毒性试验，计算LD50值。',
                limits: [
                    { parameter: '经口LD50', condition: '≤200mg/kg', result: '剧毒性危险废物' },
                    { parameter: '经口LD50', condition: '>200且≤2000mg/kg', result: '有毒性危险废物' }
                ],
                applicableWaste: ['农药废物', '医药废物', '化学品废物']
            },
            {
                id: 'GB5085.2-4.2',
                title: '经皮急性毒性',
                content: '按照规定方法进行试验，经皮肤接触LD50≤1000mg/kg体重的固体废物，属于急性毒性危险废物。',
                method: '采用大鼠或兔进行经皮急性毒性试验，计算LD50值。',
                limits: [
                    { parameter: '经皮LD50', condition: '≤1000mg/kg', result: '急性毒性危险废物' }
                ],
                applicableWaste: ['农药废物', '化学品废物', '有机溶剂废物']
            },
            {
                id: 'GB5085.2-4.3',
                title: '吸入急性毒性',
                content: '按照规定方法进行试验，吸入LC50≤10mg/L的固体废物，属于急性毒性危险废物。',
                method: '采用大鼠进行吸入急性毒性试验，计算LC50值。',
                limits: [
                    { parameter: '吸入LC50', condition: '≤10mg/L', result: '急性毒性危险废物' }
                ],
                applicableWaste: ['挥发性废物', '气态废物', '粉尘废物']
            }
        ],
        keyPoints: [
            'LD50是半数致死量，数值越小毒性越强',
            'LC50是半数致死浓度，用于评估吸入毒性',
            '急性毒性试验需要使用实验动物，成本较高',
            '医疗废物和农药废物通常需要进行急性毒性鉴别'
        ]
    },
    
    // GB 5085.3 浸出毒性鉴别
    leaching_toxicity: {
        standard: 'GB 5085.3',
        name: '浸出毒性鉴别',
        fullName: '危险废物鉴别标准 浸出毒性鉴别',
        description: '规定了浸出毒性危险废物的鉴别标准，通过测定废物浸出液中有害物质的浓度来评估其对地下水的潜在危害。',
        icon: '💧',
        color: '#3498db',
        clauses: [
            {
                id: 'GB5085.3-4.1',
                title: '浸出毒性鉴别',
                content: '按照HJ/T 299和HJ/T 300规定的方法制备的固体废物浸出液中，任何一种有害成分浓度超过规定限值的，属于浸出毒性危险废物。',
                method: '采用硫酸硝酸法或醋酸缓冲溶液法制备浸出液，测定有害物质浓度。',
                limits: [
                    { parameter: '铅(Pb)', condition: '≤5mg/L', result: '超标则为危险废物' },
                    { parameter: '镉(Cd)', condition: '≤1mg/L', result: '超标则为危险废物' },
                    { parameter: '六价铬(Cr6+)', condition: '≤5mg/L', result: '超标则为危险废物' },
                    { parameter: '汞(Hg)', condition: '≤0.1mg/L', result: '超标则为危险废物' },
                    { parameter: '砷(As)', condition: '≤5mg/L', result: '超标则为危险废物' },
                    { parameter: '铜(Cu)', condition: '≤100mg/L', result: '超标则为危险废物' },
                    { parameter: '锌(Zn)', condition: '≤100mg/L', result: '超标则为危险废物' },
                    { parameter: '镍(Ni)', condition: '≤5mg/L', result: '超标则为危险废物' },
                    { parameter: '铍(Be)', condition: '≤0.02mg/L', result: '超标则为危险废物' },
                    { parameter: '钡(Ba)', condition: '≤100mg/L', result: '超标则为危险废物' },
                    { parameter: '硒(Se)', condition: '≤1mg/L', result: '超标则为危险废物' },
                    { parameter: '银(Ag)', condition: '≤5mg/L', result: '超标则为危险废物' }
                ],
                applicableWaste: ['电镀污泥', '冶炼废渣', '电池废物', '电子废物']
            }
        ],
        keyPoints: [
            '浸出毒性是最常用的危废鉴别指标之一',
            '重金属是浸出毒性的主要检测对象',
            '电镀污泥、冶炼废渣等通常需要进行浸出毒性鉴别',
            '浸出液制备方法会影响检测结果'
        ]
    },
    
    // GB 5085.4 易燃性鉴别
    flammability: {
        standard: 'GB 5085.4',
        name: '易燃性鉴别',
        fullName: '危险废物鉴别标准 易燃性鉴别',
        description: '规定了易燃性危险废物的鉴别标准，包括液态易燃性、固态易燃性和氧化性的鉴别。',
        icon: '🔥',
        color: '#e67e22',
        clauses: [
            {
                id: 'GB5085.4-4.1',
                title: '液态易燃性',
                content: '闪点低于60°C（闭杯试验）的液态废物，属于易燃性危险废物。',
                method: '采用闭杯闪点测定仪测定液态废物的闪点。',
                limits: [
                    { parameter: '闪点', condition: '<60°C', result: '易燃性危险废物' }
                ],
                applicableWaste: ['废矿物油', '废有机溶剂', '涂料废物', '油墨废物']
            },
            {
                id: 'GB5085.4-4.2',
                title: '固态易燃性',
                content: '在标准温度和压力（25°C，101.3kPa）下，因摩擦、吸湿或自发的化学变化而具有着火倾向的固态废物，属于易燃性危险废物。',
                method: '进行燃烧试验，观察废物的燃烧特性。',
                limits: [
                    { parameter: '燃烧特性', condition: '易燃', result: '易燃性危险废物' }
                ],
                applicableWaste: ['有机固废', '橡胶废物', '塑料废物']
            },
            {
                id: 'GB5085.4-4.3',
                title: '氧化性',
                content: '具有强氧化性，能引起燃烧或爆炸的固体废物，属于易燃性危险废物。',
                method: '进行氧化性试验，评估废物的氧化能力。',
                limits: [
                    { parameter: '氧化性', condition: '强氧化剂', result: '易燃性危险废物' }
                ],
                applicableWaste: ['过氧化物废物', '高锰酸盐废物', '硝酸盐废物']
            }
        ],
        keyPoints: [
            '闪点是液态废物易燃性的主要判定指标',
            '闪点<60°C的液态废物属于易燃性危险废物',
            '废矿物油、废有机溶剂通常需要进行易燃性鉴别',
            '氧化性废物也属于易燃性危险废物范畴'
        ]
    },
    
    // GB 5085.5 反应性鉴别
    reactivity: {
        standard: 'GB 5085.5',
        name: '反应性鉴别',
        fullName: '危险废物鉴别标准 反应性鉴别',
        description: '规定了反应性危险废物的鉴别标准，包括与水反应、与酸反应产生有毒气体以及爆炸性的鉴别。',
        icon: '⚡',
        color: '#f1c40f',
        clauses: [
            {
                id: 'GB5085.5-4.1',
                title: '氰化物反应性',
                content: '固体废物与酸接触后产生氰化氢气体，且产生量≥250mg/kg的，属于反应性危险废物。',
                method: '将废物与酸混合，测定产生的氰化氢气体量。',
                limits: [
                    { parameter: 'HCN产生量', condition: '≥250mg/kg', result: '反应性危险废物' }
                ],
                applicableWaste: ['电镀废物', '热处理废物', '化工废物']
            },
            {
                id: 'GB5085.5-4.2',
                title: '硫化物反应性',
                content: '固体废物与酸接触后产生硫化氢气体，且产生量≥500mg/kg的，属于反应性危险废物。',
                method: '将废物与酸混合，测定产生的硫化氢气体量。',
                limits: [
                    { parameter: 'H2S产生量', condition: '≥500mg/kg', result: '反应性危险废物' }
                ],
                applicableWaste: ['皮革废物', '石油废物', '化工废物']
            },
            {
                id: 'GB5085.5-4.3',
                title: '爆炸性',
                content: '在常温常压下不稳定，在无引爆条件下即可发生剧烈变化的固体废物，属于反应性危险废物。',
                method: '进行爆炸性试验，评估废物的爆炸风险。',
                limits: [
                    { parameter: '爆炸性', condition: '具有爆炸性', result: '反应性危险废物' }
                ],
                applicableWaste: ['烟火废物', '炸药废物', '过氧化物废物']
            },
            {
                id: 'GB5085.5-4.4',
                title: '遇水反应性',
                content: '与水接触后能产生易燃气体或有毒气体的固体废物，属于反应性危险废物。',
                method: '将废物与水混合，观察反应现象并测定产生的气体。',
                limits: [
                    { parameter: '遇水反应', condition: '产生易燃/有毒气体', result: '反应性危险废物' }
                ],
                applicableWaste: ['金属废物', '碳化物废物', '氢化物废物']
            }
        ],
        keyPoints: [
            '反应性废物可能与水或酸发生剧烈反应',
            '氰化物和硫化物反应性是常见的检测项目',
            '爆炸性废物需要特别小心处理',
            '电镀废物可能含有氰化物，需要进行反应性鉴别'
        ]
    },
    
    // GB 5085.6 毒性物质含量鉴别
    toxic_content: {
        standard: 'GB 5085.6',
        name: '毒性物质含量鉴别',
        fullName: '危险废物鉴别标准 毒性物质含量鉴别',
        description: '规定了毒性物质含量危险废物的鉴别标准，通过测定废物中特定有毒物质的含量来判定其危险性。',
        icon: '🔬',
        color: '#1abc9c',
        clauses: [
            {
                id: 'GB5085.6-4.1',
                title: '有机毒性物质',
                content: '固体废物中苯、甲苯、二甲苯等有机毒性物质含量超过规定限值的，属于毒性物质含量危险废物。',
                method: '采用气相色谱法或气相色谱-质谱法测定有机物含量。',
                limits: [
                    { parameter: '苯', condition: '≥0.5%', result: '毒性物质含量危险废物' },
                    { parameter: '甲苯', condition: '超标', result: '毒性物质含量危险废物' },
                    { parameter: '二甲苯', condition: '超标', result: '毒性物质含量危险废物' }
                ],
                applicableWaste: ['废有机溶剂', '涂料废物', '油墨废物', '化工废物']
            },
            {
                id: 'GB5085.6-4.2',
                title: '多氯联苯(PCBs)',
                content: '固体废物中多氯联苯含量≥50mg/kg的，属于毒性物质含量危险废物。',
                method: '采用气相色谱法测定多氯联苯含量。',
                limits: [
                    { parameter: 'PCBs', condition: '≥50mg/kg', result: '毒性物质含量危险废物' }
                ],
                applicableWaste: ['变压器油', '电容器废物', '电气设备废物']
            },
            {
                id: 'GB5085.6-4.3',
                title: '矿物油含量',
                content: '固体废物中矿物油含量≥5%的，属于毒性物质含量危险废物。',
                method: '采用红外分光光度法或重量法测定矿物油含量。',
                limits: [
                    { parameter: '矿物油', condition: '≥5%', result: '毒性物质含量危险废物' }
                ],
                applicableWaste: ['废矿物油', '含油污泥', '油泥']
            },
            {
                id: 'GB5085.6-4.4',
                title: '酚类化合物',
                content: '固体废物中酚类化合物含量超过规定限值的，属于毒性物质含量危险废物。',
                method: '采用分光光度法或气相色谱法测定酚类化合物含量。',
                limits: [
                    { parameter: '酚类', condition: '超标', result: '毒性物质含量危险废物' }
                ],
                applicableWaste: ['焦化废物', '制药废物', '化工废物']
            },
            {
                id: 'GB5085.6-4.5',
                title: '多环芳烃(PAHs)',
                content: '固体废物中多环芳烃含量超过规定限值的，属于毒性物质含量危险废物。',
                method: '采用高效液相色谱法或气相色谱-质谱法测定多环芳烃含量。',
                limits: [
                    { parameter: 'PAHs', condition: '超标', result: '毒性物质含量危险废物' }
                ],
                applicableWaste: ['焦化废物', '石油废物', '沥青废物']
            },
            {
                id: 'GB5085.6-4.6',
                title: '农药残留',
                content: '固体废物中农药残留含量超过规定限值的，属于毒性物质含量危险废物。',
                method: '采用气相色谱法或液相色谱法测定农药残留含量。',
                limits: [
                    { parameter: '农药残留', condition: '超标', result: '毒性物质含量危险废物' }
                ],
                applicableWaste: ['农药废物', '农业废物', '包装废物']
            }
        ],
        keyPoints: [
            '毒性物质含量鉴别针对特定有毒物质',
            '有机溶剂废物通常需要检测苯系物含量',
            '废矿物油需要检测矿物油含量',
            '变压器油等电气设备废物需要检测PCBs'
        ]
    }
};

// ==================== 专业术语定义 ====================
// Requirements: 3.3 - 专业术语悬停tooltip
const TERMINOLOGY = {
    // 检测相关术语
    'pH值': '酸碱度指标，pH<7为酸性，pH>7为碱性。危废鉴别中，pH≤2或pH≥12.5判定为腐蚀性危险废物。',
    'LD50': '半数致死量，指能杀死50%实验动物的剂量。LD50越小，毒性越强。',
    'LC50': '半数致死浓度，指能杀死50%实验动物的空气中毒物浓度。',
    '浸出毒性': '固体废物在特定条件下浸出液中有害物质的浓度，用于评估废物对地下水的潜在危害。',
    '闪点': '液体挥发出的蒸气与空气混合后，遇火源能够闪燃的最低温度。闪点<60°C判定为易燃性危险废物。',
    
    // 危险特性术语
    '腐蚀性': '废物对生物组织或金属材料具有强烈的化学破坏作用，如强酸、强碱。',
    '急性毒性': '废物通过一次或短期接触对生物体产生的有害效应，可能导致死亡或严重损伤。',
    '易燃性': '废物在常温常压下容易燃烧或助燃的特性。',
    '反应性': '废物在常温常压下不稳定，易发生剧烈变化的特性，如爆炸、产生有毒气体等。',
    '感染性': '废物含有病原微生物，可能引起疾病传播的特性，常见于医疗废物。',
    
    // 检测方法术语
    '浸出试验': '模拟废物在填埋场中与雨水接触的过程，测定有害物质的释放量。',
    '重金属': '密度大于5g/cm³的金属元素，如铅、镉、汞、铬等，具有生物累积性和毒性。',
    '有机溶剂': '能溶解其他物质的有机化合物，如苯、甲苯、丙酮等，多具有挥发性和毒性。',
    
    // 标准相关术语
    'GB 5085': '《危险废物鉴别标准》系列国家标准，包括腐蚀性、急性毒性、浸出毒性、易燃性、反应性、毒性物质含量等6个分标准。',
    '危险废物': '列入国家危险废物名录或根据国家规定的危险废物鉴别标准和鉴别方法认定的具有危险特性的固体废物。',
    '一般工业固废': '不具有危险特性的工业固体废物，可按一般固废进行处置。'
};

// ==================== 评分计算器类 ====================
// Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7

/**
 * 评分计算器
 * 实现多维度评分计算：判定准确性(40%)、预算使用效率(30%)、检测路径合理性(20%)、用时(10%)
 */
class ScoreCalculator {
    /**
     * @param {Case} caseData - 案件数据
     * @param {GameState} gameState - 游戏状态
     */
    constructor(caseData, gameState) {
        this.caseData = caseData;
        this.gameState = gameState;
    }
    
    /**
     * 计算判定准确性得分 (40%)
     * Requirements: 5.1, 5.2 - 判定准确性得分
     * @param {Judgment} judgment - 学生判定
     * @param {CorrectAnswer} correctAnswer - 正确答案
     * @returns {number} 0-100分
     */
    scoreAccuracy(judgment, correctAnswer) {
        // 判定结果完全正确得满分
        if (judgment.result === correctAnswer.result) {
            // 如果是危险废物，还需要检查危险特性是否正确
            if (correctAnswer.result === 'hazardous') {
                const judgedChars = new Set(judgment.hazardCharacteristics || []);
                const correctChars = new Set(correctAnswer.hazardCharacteristics);
                
                // 完全匹配得满分
                if (judgedChars.size === correctChars.size &&
                    [...judgedChars].every(c => correctChars.has(c))) {
                    return 100;
                }
                
                // 部分匹配得部分分数
                const matchedCount = [...judgedChars].filter(c => correctChars.has(c)).length;
                const totalRequired = correctChars.size;
                const extraCount = [...judgedChars].filter(c => !correctChars.has(c)).length;
                
                // 基础分50分（判定结果正确），特性匹配额外50分
                const matchRatio = totalRequired > 0 ? matchedCount / totalRequired : 0;
                const penalty = extraCount * 10; // 每个多选的特性扣10分
                
                return Math.max(0, Math.min(100, 50 + matchRatio * 50 - penalty));
            }
            return 100;
        }
        
        // 判定结果错误得0分
        return 0;
    }
    
    /**
     * 计算预算使用效率得分 (30%)
     * Requirements: 5.1, 5.2, 5.4 - 预算使用效率得分
     * @param {number} spent - 已花费预算
     * @param {number} total - 总预算
     * @param {number} optimalSpent - 最优路径花费
     * @returns {number} 0-100分
     */
    scoreBudgetEfficiency(spent, total, optimalSpent) {
        // 如果没有花费任何预算，给予基础分
        if (spent === 0) {
            return 50;
        }
        
        // 花费等于或少于最优花费，得满分
        if (spent <= optimalSpent) {
            return 100;
        }
        
        // 超出最优花费，按比例扣分
        const overSpent = spent - optimalSpent;
        const maxOverSpend = total - optimalSpent;
        
        // 避免除以零
        if (maxOverSpend <= 0) {
            return spent <= optimalSpent ? 100 : 0;
        }
        
        // 线性递减：超出越多，分数越低
        const score = 100 - (overSpent / maxOverSpend) * 100;
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * 计算检测路径合理性得分 (20%)
     * Requirements: 5.1, 5.2 - 检测路径合理性得分
     * @param {string[]} userPath - 用户检测路径
     * @param {string[]} optimalPath - 最优检测路径
     * @returns {number} 0-100分
     */
    scorePathRationality(userPath, optimalPath) {
        if (!optimalPath || optimalPath.length === 0) {
            return 100; // 没有最优路径要求，给满分
        }
        
        if (!userPath || userPath.length === 0) {
            return 0; // 没有进行任何检测
        }
        
        // 计算覆盖了多少必要检测项目
        const relevantCount = userPath.filter(id => optimalPath.includes(id)).length;
        const coverageRatio = relevantCount / optimalPath.length;
        
        // 计算冗余检测的惩罚
        const unnecessaryCount = userPath.filter(id => !optimalPath.includes(id)).length;
        const redundancyPenalty = Math.min(30, unnecessaryCount * 5); // 每个不必要检测扣5分，最多扣30分
        
        // 基础分 = 覆盖率 * 100，然后减去冗余惩罚
        const score = coverageRatio * 100 - redundancyPenalty;
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * 计算用时得分 (10%)
     * Requirements: 5.1, 5.2 - 用时得分
     * @param {number} elapsed - 已用时间（秒）
     * @param {number} timeLimit - 时间限制（秒）
     * @returns {number} 0-100分
     */
    scoreTime(elapsed, timeLimit) {
        if (timeLimit <= 0) {
            return 100; // 没有时间限制，给满分
        }
        
        // 在时间限制内完成
        if (elapsed <= timeLimit) {
            // 越快完成分数越高
            const ratio = elapsed / timeLimit;
            // 在50%时间内完成得满分，之后线性递减到80分
            if (ratio <= 0.5) {
                return 100;
            }
            return Math.round(100 - (ratio - 0.5) * 40);
        }
        
        // 超时，按超时比例扣分
        const overTime = elapsed - timeLimit;
        const score = 80 - (overTime / timeLimit) * 80;
        return Math.max(0, Math.min(80, score));
    }
    
    /**
     * 计算总分
     * Requirements: 5.1, 5.2 - 权重：准确性40% + 预算效率30% + 路径合理性20% + 用时10%
     * @param {number} accuracy - 准确性得分
     * @param {number} budget - 预算效率得分
     * @param {number} path - 路径合理性得分
     * @param {number} time - 用时得分
     * @returns {number} 0-100分
     */
    calculateTotalScore(accuracy, budget, path, time) {
        const total = accuracy * 0.4 + budget * 0.3 + path * 0.2 + time * 0.1;
        // 确保总分在0-100范围内
        return Math.max(0, Math.min(100, Math.round(total)));
    }
    
    /**
     * 根据总分确定评级
     * Requirements: 5.6, 5.7 - 评级阈值
     * @param {number} totalScore - 总分
     * @returns {Grade} 评级
     */
    getGrade(totalScore) {
        if (totalScore >= 90) return 'gold_detective';
        if (totalScore >= 70) return 'silver_detective';
        if (totalScore >= 60) return 'bronze_detective';
        return 'trainee';
    }
    
    /**
     * 获取成就列表
     * Requirements: 5.3 - 精准侦探成就
     * @param {GameState} state - 游戏状态
     * @param {boolean} isCorrect - 判定是否正确
     * @param {string[]} userPath - 用户检测路径
     * @param {string[]} optimalPath - 最优检测路径
     * @returns {Achievement[]} 成就列表
     */
    getAchievements(state, isCorrect, userPath, optimalPath) {
        const achievements = [];
        
        // 精准侦探：使用最优路径（最少必要检测项目）且判定正确
        // Requirements: 5.3 - 使用最少检测项目正确判定给予"精准侦探"称号和额外加分
        if (isCorrect && this.isOptimalPath(userPath, optimalPath)) {
            achievements.push({
                id: 'precise_detective',
                name: '精准侦探',
                description: '使用最少检测项目正确判定，展现了卓越的专业判断力！',
                icon: '🎯'
            });
        }
        
        // 速度之星：在时间限制一半内完成
        const timeLimit = this.caseData.timeLimit || 600;
        if (isCorrect && state.elapsedTime <= timeLimit * 0.5) {
            achievements.push({
                id: 'speed_star',
                name: '速度之星',
                description: '在规定时间一半内完成鉴别',
                icon: '⚡'
            });
        }
        
        // 节俭侦探：花费不超过最优花费的110%
        const spent = state.budget - state.remainingBudget;
        if (isCorrect && spent <= this.caseData.optimalCost * 1.1) {
            achievements.push({
                id: 'frugal_detective',
                name: '节俭侦探',
                description: '高效利用预算完成鉴别',
                icon: '💰'
            });
        }
        
        return achievements;
    }
    
    /**
     * 检查是否使用了最优路径
     * Requirements: 5.3 - 判断是否使用最少检测项目
     * @param {string[]} userPath - 用户检测路径
     * @param {string[]} optimalPath - 最优检测路径
     * @returns {boolean}
     */
    isOptimalPath(userPath, optimalPath) {
        if (!optimalPath || optimalPath.length === 0) return true;
        if (!userPath) return false;
        
        // 用户路径长度等于最优路径长度，且包含所有最优路径项目
        return userPath.length === optimalPath.length &&
            optimalPath.every(id => userPath.includes(id));
    }
    
    /**
     * 生成路径对比分析
     * Requirements: 3.5, 5.5 - 显示与最优路径的对比分析
     * @param {string[]} userPath - 用户检测路径
     * @param {string[]} optimalPath - 最优检测路径
     * @param {number} spent - 已花费预算
     * @param {number} optimalCost - 最优花费
     * @param {DetectionItem[]} detectionItems - 检测项目列表
     * @returns {PathComparison} 路径对比结果
     */
    generatePathComparison(userPath, optimalPath, spent, optimalCost, detectionItems) {
        // 找出不必要的检测项目
        const unnecessaryItems = userPath.filter(id => !optimalPath.includes(id));
        
        // 找出遗漏的必要检测项目
        const missingItems = optimalPath.filter(id => !userPath.includes(id));
        
        // 计算不必要检测的花费
        let unnecessaryCost = 0;
        const unnecessaryDetails = unnecessaryItems.map(id => {
            const item = detectionItems.find(i => i.id === id);
            if (item) {
                unnecessaryCost += item.price;
                return {
                    id: id,
                    name: item.name,
                    price: item.price
                };
            }
            return { id, name: '未知项目', price: 0 };
        });
        
        return {
            userPath: userPath,
            optimalPath: optimalPath,
            extraCost: Math.max(0, spent - optimalCost),
            unnecessaryItems: unnecessaryDetails,
            unnecessaryCost: unnecessaryCost,
            missingItems: missingItems,
            isOptimal: this.isOptimalPath(userPath, optimalPath)
        };
    }
}

// ==================== 主控制器类 ====================
class HazwasteDetective {
    constructor() {
        /** @type {GameState|null} */
        this.gameState = null;
        
        /** @type {Case|null} */
        this.currentCase = null;
        
        /** @type {Case[]} */
        this.caseLibrary = [];
        
        /** @type {DetectionItem[]} */
        this.detectionItems = [];
        
        /** @type {number|null} */
        this.timerInterval = null;
        
        /** @type {boolean} */
        this.isInitialized = false;
    }
    
    // ==================== 初始化 ====================
    
    /**
     * 初始化游戏
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('🔍 危废鉴别剧本杀 - 初始化中...');
        
        // 加载检测项目数据
        this.loadDetectionItems();
        
        // 加载案件库
        this.loadCaseLibrary();
        
        // 检查是否有保存的进度
        const savedState = this.loadProgress();
        
        if (savedState) {
            // 有保存的进度，询问是否继续
            this.showContinuePrompt(savedState);
        } else {
            // 检查是否首次访问
            if (this.isFirstVisit()) {
                this.showRulesModal();
                this.markVisited();
            }
            // 加载默认案件
            this.loadCase(this.caseLibrary[0]?.id || 'case_001');
        }
        
        this.isInitialized = true;
        console.log('✅ 游戏初始化完成');
    }

    // ==================== 本地存储操作 ====================
    
    /**
     * 保存游戏进度
     */
    saveProgress() {
        if (!this.gameState) return;
        
        // 更新已用时间
        if (this.gameState.startTime && !this.gameState.isCompleted) {
            this.gameState.elapsedTime = Math.floor((Date.now() - this.gameState.startTime) / 1000);
        }
        
        try {
            localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(this.gameState));
            console.log('💾 游戏进度已保存');
        } catch (e) {
            console.error('保存进度失败:', e);
        }
    }
    
    /**
     * 加载游戏进度
     * @returns {GameState|null}
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
            if (saved) {
                const state = JSON.parse(saved);
                // 验证进度有效性
                if (state && state.caseId && !state.isCompleted) {
                    return state;
                }
            }
        } catch (e) {
            console.error('加载进度失败:', e);
        }
        return null;
    }
    
    /**
     * 清除游戏进度
     */
    clearProgress() {
        localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    }
    
    /**
     * 保存游戏记录到历史
     * @param {GameRecord} record
     */
    saveToHistory(record) {
        try {
            const history = this.getHistory();
            history.unshift(record);
            // 最多保存50条记录
            if (history.length > 50) {
                history.pop();
            }
            localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(history));
        } catch (e) {
            console.error('保存历史记录失败:', e);
        }
    }
    
    /**
     * 获取历史记录
     * @returns {GameRecord[]}
     */
    getHistory() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    /**
     * 检查是否首次访问
     * @returns {boolean}
     */
    isFirstVisit() {
        return !localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
    }
    
    /**
     * 标记已访问
     */
    markVisited() {
        localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, 'true');
    }
    
    /**
     * 检查是否有未保存的进度
     * @returns {boolean}
     */
    hasUnsavedProgress() {
        return this.gameState && !this.gameState.isCompleted && this.gameState.purchasedItems.length > 0;
    }

    // ==================== 案件管理 ====================
    
    /**
     * 加载案件库
     */
    loadCaseLibrary() {
        // 加载预设案件
        this.caseLibrary = this.getPresetCases();
        
        // 加载自定义案件
        try {
            const customCases = localStorage.getItem(STORAGE_KEYS.CUSTOM_CASES);
            if (customCases) {
                const parsed = JSON.parse(customCases);
                this.caseLibrary = [...this.caseLibrary, ...parsed];
            }
        } catch (e) {
            console.error('加载自定义案件失败:', e);
        }
    }
    
    /**
     * 加载指定案件
     * @param {string} caseId
     */
    loadCase(caseId) {
        const caseData = this.caseLibrary.find(c => c.id === caseId);
        if (!caseData) {
            console.error('案件不存在:', caseId);
            return;
        }
        
        this.currentCase = caseData;
        
        // 初始化游戏状态
        this.gameState = {
            caseId: caseData.id,
            budget: caseData.budget,
            remainingBudget: caseData.budget,
            purchasedItems: [],
            startTime: Date.now(),
            elapsedTime: 0,
            isCompleted: false,
            judgment: null,
            score: null
        };
        
        // 更新UI
        this.renderCaseFile();
        this.renderClues();
        this.updateBudgetDisplay();
        this.startTimer();
        
        console.log('📁 案件已加载:', caseData.name);
    }
    
    /**
     * 获取当前案件
     * @returns {Case|null}
     */
    getCurrentCase() {
        return this.currentCase;
    }
    
    /**
     * 获取案件列表信息
     * @returns {Array<{id: string, name: string, difficulty: string, completed: boolean, highScore: number}>}
     */
    getCaseList() {
        const history = this.getHistory();
        
        return this.caseLibrary.map(c => {
            const records = history.filter(h => h.caseId === c.id);
            const highScore = records.length > 0 ? Math.max(...records.map(r => r.score)) : 0;
            
            return {
                id: c.id,
                name: c.name,
                difficulty: c.difficulty,
                completed: records.length > 0,
                highScore: highScore
            };
        });
    }

    // ==================== 预算管理 ====================
    // Requirements: 2.3, 2.4, 2.6, 2.7
    
    /**
     * 获取当前预算
     * @returns {number}
     */
    getBudget() {
        return this.gameState?.remainingBudget || 0;
    }
    
    /**
     * 获取初始预算
     * @returns {number}
     */
    getInitialBudget() {
        return this.gameState?.budget || 0;
    }
    
    /**
     * 获取已花费预算
     * @returns {number}
     */
    getSpentBudget() {
        return this.getInitialBudget() - this.getBudget();
    }
    
    /**
     * 检查预算是否足够
     * Requirements: 2.4
     * @param {number} amount - 需要的金额
     * @returns {boolean}
     */
    hasSufficientBudget(amount) {
        return this.gameState && this.gameState.remainingBudget >= amount;
    }
    
    /**
     * 扣除预算
     * Requirements: 2.3
     * @param {number} amount
     * @returns {boolean} 是否成功
     */
    deductBudget(amount) {
        if (!this.gameState) return false;
        if (amount <= 0) return false;
        
        // 预算不足检查
        if (!this.hasSufficientBudget(amount)) {
            return false;
        }
        
        // 执行扣除
        this.gameState.remainingBudget -= amount;
        
        // 更新UI显示
        this.updateBudgetDisplay();
        
        // 保存进度
        this.saveProgress();
        
        return true;
    }
    
    /**
     * 更新预算显示
     */
    updateBudgetDisplay() {
        const el = document.getElementById('budget-amount');
        if (el && this.gameState) {
            el.textContent = this.gameState.remainingBudget.toLocaleString();
            
            // 根据预算剩余比例改变颜色
            const ratio = this.gameState.remainingBudget / this.gameState.budget;
            if (ratio <= 0.2) {
                el.style.color = 'var(--detective-accent)';
            } else if (ratio <= 0.5) {
                el.style.color = '#f4a261';
            } else {
                el.style.color = 'var(--detective-gold)';
            }
        }
    }
    
    // ==================== 检测购买 ====================
    // Requirements: 2.3, 2.4, 2.6, 2.7
    
    /**
     * 检查是否已购买某检测项目
     * Requirements: 2.6
     * @param {string} itemId
     * @returns {boolean}
     */
    isPurchased(itemId) {
        return this.gameState?.purchasedItems.some(p => p.itemId === itemId) || false;
    }
    
    /**
     * 检查是否可以购买
     * Requirements: 2.4, 2.6
     * @param {string} itemId
     * @returns {{allowed: boolean, reason?: string}}
     */
    canPurchase(itemId) {
        if (!this.gameState || !this.currentCase) {
            return { allowed: false, reason: '游戏未初始化' };
        }
        
        // 检查游戏是否已完成
        if (this.gameState.isCompleted) {
            return { allowed: false, reason: '游戏已结束' };
        }
        
        // 检查是否已购买（重复购买检查）
        // Requirements: 2.6
        if (this.isPurchased(itemId)) {
            return { allowed: false, reason: '该项目已检测，无需重复购买' };
        }
        
        // 检查检测项目是否存在
        const item = this.detectionItems.find(i => i.id === itemId);
        if (!item) {
            return { allowed: false, reason: '检测项目不存在' };
        }
        
        // 检查预算是否足够
        // Requirements: 2.4
        if (!this.hasSufficientBudget(item.price)) {
            return { allowed: false, reason: '预算不足，请谨慎选择检测项目' };
        }
        
        // 检查案件是否有该检测项目的结果数据
        if (!this.currentCase.detectionResults[itemId]) {
            return { allowed: false, reason: '该案件暂不支持此检测项目' };
        }
        
        return { allowed: true };
    }
    
    /**
     * 购买检测项目并生成线索卡片
     * Requirements: 2.3, 2.5, 2.7
     * @param {string} itemId
     * @returns {DetectionResult|null}
     */
    purchaseDetection(itemId) {
        const check = this.canPurchase(itemId);
        if (!check.allowed) {
            this.showToast(check.reason, 'warning');
            return null;
        }
        
        const item = this.detectionItems.find(i => i.id === itemId);
        
        // 根据案件数据返回对应检测结果
        // Requirements: 2.3, 2.5
        const resultData = this.getDetectionResultForCase(itemId);
        
        if (!resultData) {
            console.error('检测结果数据不存在:', itemId);
            this.showToast('检测数据异常，请重试', 'error');
            return null;
        }
        
        // 记录购买时间戳（在扣除预算前记录）
        // Requirements: 2.7
        const purchaseTime = Date.now();
        const purchaseOrder = this.gameState.purchasedItems.length + 1;
        
        // 扣除预算
        // Requirements: 2.3
        if (!this.deductBudget(item.price)) {
            this.showToast('预算扣除失败', 'error');
            return null;
        }
        
        // 生成检测结果（线索卡片）
        // Requirements: 2.5 - 购买检测项目后生成线索卡片
        const result = this.generateClueCard(item, resultData, purchaseOrder, purchaseTime);
        
        // 添加到已购列表
        this.gameState.purchasedItems.push(result);
        
        // 更新UI - 超标项目高亮显示
        this.renderClues();
        this.saveProgress();
        
        // 显示购买成功提示，超标项目特别提醒
        this.showPurchaseResult(result);
        
        // 检查是否需要提示（连续购买无关检测）
        this.checkPurchaseHint();
        
        return result;
    }
    
    /**
     * 根据案件数据获取检测结果
     * Requirements: 2.3, 2.5 - 根据案件数据返回对应检测结果
     * @param {string} itemId - 检测项目ID
     * @returns {Object|null} 检测结果数据
     */
    getDetectionResultForCase(itemId) {
        if (!this.currentCase || !this.currentCase.detectionResults) {
            return null;
        }
        return this.currentCase.detectionResults[itemId] || null;
    }
    
    /**
     * 生成线索卡片数据
     * Requirements: 2.5 - 以"线索卡片"形式展示
     * @param {DetectionItem} item - 检测项目
     * @param {Object} resultData - 检测结果数据
     * @param {number} purchaseOrder - 购买顺序
     * @param {number} purchaseTime - 购买时间戳
     * @returns {DetectionResult} 线索卡片数据
     */
    generateClueCard(item, resultData, purchaseOrder, purchaseTime) {
        return {
            id: `result_${purchaseTime}_${purchaseOrder}`,
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            value: resultData.value,
            unit: resultData.unit,
            standardLimit: resultData.standardLimit,
            isExceeded: resultData.isExceeded,
            cost: item.price,
            purchaseOrder: purchaseOrder,  // 购买顺序（递增整数）
            purchaseTime: purchaseTime      // 购买时间戳
        };
    }
    
    /**
     * 显示购买结果提示
     * Requirements: 2.5 - 超标项目高亮显示
     * @param {DetectionResult} result - 检测结果
     */
    showPurchaseResult(result) {
        if (result.isExceeded) {
            // 超标项目特别提醒
            this.showToast(`⚠️ 检测完成：${result.itemName} 超标！检测值 ${result.value}${result.unit} 超过限值 ${result.standardLimit}${result.unit}`, 'warning');
        } else {
            this.showToast(`✓ 检测完成：${result.itemName} 未超标`, 'success');
        }
    }
    
    /**
     * 获取已购检测项目
     * @returns {DetectionResult[]}
     */
    getPurchasedItems() {
        return this.gameState?.purchasedItems || [];
    }
    
    /**
     * 获取购买记录统计
     * @returns {{total: number, exceeded: number, cost: number}}
     */
    getPurchaseStats() {
        const items = this.getPurchasedItems();
        return {
            total: items.length,
            exceeded: items.filter(i => i.isExceeded).length,
            cost: items.reduce((sum, i) => sum + i.cost, 0)
        };
    }

    // ==================== 计时器 ====================
    
    /**
     * 启动计时器
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.gameState && !this.gameState.isCompleted) {
                this.gameState.elapsedTime = Math.floor((Date.now() - this.gameState.startTime) / 1000);
                this.updateTimerDisplay();
            }
        }, 1000);
    }
    
    /**
     * 停止计时器
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * 更新计时器显示
     */
    updateTimerDisplay() {
        const el = document.getElementById('timer-value');
        if (el && this.gameState) {
            const minutes = Math.floor(this.gameState.elapsedTime / 60);
            const seconds = this.gameState.elapsedTime % 60;
            el.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // ==================== UI渲染 ====================
    
    /**
     * 渲染案件卷宗
     */
    renderCaseFile() {
        if (!this.currentCase) return;
        
        const cf = this.currentCase.caseFile;
        
        // 更新案件标识
        document.getElementById('case-badge').textContent = `案件 #${this.currentCase.id.split('_')[1] || '001'}`;
        
        // 更新卷宗内容
        document.getElementById('waste-source').textContent = cf.wasteSource;
        document.getElementById('waste-appearance').textContent = cf.appearance;
        document.getElementById('waste-odor').textContent = cf.odor;
        
        // 初步数据
        const prelimData = [];
        if (cf.preliminaryData.ph !== undefined) prelimData.push(`pH值: ${cf.preliminaryData.ph}`);
        if (cf.preliminaryData.temperature !== undefined) prelimData.push(`温度: ${cf.preliminaryData.temperature}°C`);
        if (cf.preliminaryData.moisture !== undefined) prelimData.push(`含水率: ${cf.preliminaryData.moisture}%`);
        document.getElementById('preliminary-data').textContent = prelimData.join(' | ') || '无';
        
        // 照片
        const photoSection = document.getElementById('photo-section');
        const photoGallery = document.getElementById('photo-gallery');
        if (cf.photos && cf.photos.length > 0) {
            photoSection.style.display = 'block';
            photoGallery.innerHTML = cf.photos.map(url => 
                `<img src="${url}" class="photo-thumb" onclick="viewPhoto('${url}')" alt="废物照片" />`
            ).join('');
        } else {
            photoSection.style.display = 'none';
        }
        
        // 难度
        const diffConfig = DIFFICULTY_CONFIG[this.currentCase.difficulty];
        const diffBadge = document.getElementById('difficulty-badge');
        diffBadge.innerHTML = `<span class="diff-icon">${'⭐'.repeat(diffConfig.stars)}</span><span class="diff-text">${diffConfig.name}</span>`;
        diffBadge.style.background = diffConfig.color;
    }

    /**
     * 渲染已收集线索
     * Requirements: 2.5 - 以"线索卡片"形式展示，包含检测项目名称、检测值、标准限值、是否超标
     */
    renderClues() {
        const container = document.getElementById('clues-container');
        const countEl = document.getElementById('clue-count');
        
        if (!this.gameState || this.gameState.purchasedItems.length === 0) {
            container.innerHTML = `
                <div class="empty-clues">
                    <div class="empty-icon">🕵️</div>
                    <div class="empty-text">尚未收集任何线索</div>
                    <div class="empty-hint">前往检测商店购买检测项目</div>
                </div>
            `;
            countEl.textContent = '0';
            return;
        }
        
        countEl.textContent = this.gameState.purchasedItems.length;
        
        // 按购买顺序渲染线索卡片
        container.innerHTML = this.gameState.purchasedItems.map(item => {
            return this.renderClueCard(item);
        }).join('');
        
        // 滚动到最新的线索卡片
        setTimeout(() => this.scrollToLatestClue(), 100);
    }
    
    /**
     * 渲染单个线索卡片
     * Requirements: 2.5 - 线索卡片展示检测项目名称、检测值、标准限值、是否超标
     * @param {DetectionResult} item - 检测结果/线索卡片数据
     * @returns {string} HTML字符串
     */
    renderClueCard(item) {
        const catConfig = DETECTION_CATEGORIES[item.category];
        const isExceeded = item.isExceeded;
        
        // 格式化检测值显示
        const valueDisplay = this.formatDetectionValue(item.value);
        const limitDisplay = this.formatDetectionValue(item.standardLimit);
        
        // 获取关联的标准条款
        // Requirements: 9.4 - 游戏中提供快速跳转链接
        const detectionItem = this.detectionItems.find(d => d.id === item.itemId);
        const relatedStandard = detectionItem?.relatedStandards?.[0] || '';
        
        return `
            <div class="clue-card ${isExceeded ? 'exceeded' : ''}" data-item-id="${item.itemId}">
                <!-- 超标/正常标签 -->
                <div class="clue-badge ${isExceeded ? '' : 'normal'}">
                    ${isExceeded ? '⚠️ 超标' : '✓ 正常'}
                </div>
                
                <!-- 卡片头部：项目名称和类别 -->
                <div class="clue-header">
                    <div class="clue-name">${item.itemName}</div>
                    <div class="clue-category" style="background: ${catConfig.color}20; color: ${catConfig.color};">
                        ${catConfig.icon} ${catConfig.name.replace('检测', '')}
                    </div>
                </div>
                
                <!-- 检测值显示 -->
                <div class="clue-body">
                    <span class="clue-value ${isExceeded ? 'exceeded' : ''}">${valueDisplay}</span>
                    <span class="clue-unit">${item.unit}</span>
                </div>
                
                <!-- 标准限值对比 -->
                <div class="clue-comparison">
                    <span class="clue-limit-label">标准限值:</span>
                    <span class="clue-limit-value">${limitDisplay} ${item.unit}</span>
                    <span class="clue-status ${isExceeded ? 'exceeded' : 'normal'}">
                        ${isExceeded ? '超出限值' : '符合标准'}
                    </span>
                </div>
                
                <!-- 标准条款链接 - Requirements: 9.4 -->
                ${relatedStandard ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.1);">
                        <button onclick="event.stopPropagation(); game.openKnowledgeBaseToClause('${relatedStandard}');" style="
                            font-size: 0.7rem;
                            padding: 3px 8px;
                            background: ${catConfig.color}15;
                            color: ${catConfig.color};
                            border: 1px solid ${catConfig.color}30;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        " onmouseover="this.style.background='${catConfig.color}25'" onmouseout="this.style.background='${catConfig.color}15'" title="查看相关国标条款">
                            <span>📖</span>
                            <span>${relatedStandard}</span>
                        </button>
                    </div>
                ` : ''}
                
                <!-- 购买顺序标记 -->
                <div class="clue-order">线索 #${item.purchaseOrder}</div>
            </div>
        `;
    }
    
    /**
     * 格式化检测值显示
     * @param {number|string} value - 检测值
     * @returns {string} 格式化后的字符串
     */
    formatDetectionValue(value) {
        if (typeof value === 'number') {
            // 保留合适的小数位数
            if (value >= 100) {
                return value.toFixed(0);
            } else if (value >= 1) {
                return value.toFixed(1);
            } else {
                return value.toFixed(2);
            }
        }
        return String(value);
    }
    
    /**
     * 获取所有超标的线索卡片
     * Requirements: 2.5 - 超标项目高亮显示
     * @returns {DetectionResult[]} 超标的检测结果列表
     */
    getExceededClues() {
        if (!this.gameState || !this.gameState.purchasedItems) {
            return [];
        }
        return this.gameState.purchasedItems.filter(item => item.isExceeded);
    }
    
    /**
     * 获取所有正常的线索卡片
     * @returns {DetectionResult[]} 未超标的检测结果列表
     */
    getNormalClues() {
        if (!this.gameState || !this.gameState.purchasedItems) {
            return [];
        }
        return this.gameState.purchasedItems.filter(item => !item.isExceeded);
    }
    
    /**
     * 获取线索统计信息
     * @returns {{total: number, exceeded: number, normal: number}}
     */
    getClueStats() {
        const items = this.getPurchasedItems();
        const exceeded = items.filter(i => i.isExceeded).length;
        return {
            total: items.length,
            exceeded: exceeded,
            normal: items.length - exceeded
        };
    }
    
    /**
     * 高亮显示指定的线索卡片
     * @param {string} itemId - 检测项目ID
     */
    highlightClueCard(itemId) {
        const card = document.querySelector(`.clue-card[data-item-id="${itemId}"]`);
        if (card) {
            card.style.animation = 'none';
            card.offsetHeight; // 触发重绘
            card.style.animation = 'highlight-pulse 1s ease-out';
        }
    }
    
    /**
     * 滚动到最新的线索卡片
     */
    scrollToLatestClue() {
        const container = document.getElementById('clues-container');
        if (container && this.gameState && this.gameState.purchasedItems.length > 0) {
            const latestItem = this.gameState.purchasedItems[this.gameState.purchasedItems.length - 1];
            const card = document.querySelector(`.clue-card[data-item-id="${latestItem.itemId}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                this.highlightClueCard(latestItem.itemId);
            }
        }
    }
    
    /**
     * 显示继续游戏提示
     * @param {GameState} savedState
     */
    showContinuePrompt(savedState) {
        const caseData = this.caseLibrary.find(c => c.id === savedState.caseId);
        if (!caseData) {
            this.clearProgress();
            this.loadCase(this.caseLibrary[0]?.id || 'case_001');
            return;
        }
        
        if (confirm(`发现未完成的游戏进度：\n案件：${caseData.name}\n已收集线索：${savedState.purchasedItems.length}条\n剩余预算：${savedState.remainingBudget}\n\n是否继续？`)) {
            // 恢复进度
            this.currentCase = caseData;
            this.gameState = savedState;
            this.gameState.startTime = Date.now() - (savedState.elapsedTime * 1000);
            
            this.renderCaseFile();
            this.renderClues();
            this.updateBudgetDisplay();
            this.startTimer();
        } else {
            // 重新开始
            this.clearProgress();
            this.loadCase(this.caseLibrary[0]?.id || 'case_001');
        }
    }
    
    /**
     * 显示规则模态框
     */
    showRulesModal() {
        const modal = document.getElementById('rules-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    /**
     * 显示Toast提示
     * @param {string} message
     * @param {'info'|'warning'|'success'|'error'} type
     */
    showToast(message, type = 'info') {
        // 移除已存在的toast
        const existingToast = document.getElementById('game-toast');
        if (existingToast) existingToast.remove();
        
        // 颜色配置
        const colors = {
            info: { bg: 'var(--detective-blue)', icon: 'ℹ️' },
            warning: { bg: 'var(--detective-accent)', icon: '⚠️' },
            success: { bg: 'var(--detective-green)', icon: '✓' },
            error: { bg: '#dc2626', icon: '✕' }
        };
        
        const config = colors[type] || colors.info;
        
        // 创建toast元素
        const toast = document.createElement('div');
        toast.id = 'game-toast';
        toast.innerHTML = `
            <span style="margin-right: 8px;">${config.icon}</span>
            <span>${message}</span>
        `;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            background: ${config.bg};
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 0.95rem;
            font-weight: 500;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 3000;
            opacity: 0;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
        `;
        
        document.body.appendChild(toast);
        
        // 动画显示
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        // 自动隐藏
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    /**
     * 检查购买提示
     * Requirements: 3.1 - 连续购买3个无关检测项目时显示温和提示
     */
    checkPurchaseHint() {
        if (!this.gameState || !this.currentCase) return;
        
        const purchased = this.gameState.purchasedItems;
        const requiredEvidence = this.currentCase.correctAnswer.requiredEvidence;
        
        // Requirements: 3.1 - 检查最近3次购买是否都不在必要证据中
        if (purchased.length >= 3) {
            const lastThree = purchased.slice(-3);
            const allIrrelevant = lastThree.every(p => !requiredEvidence.includes(p.itemId));
            
            if (allIrrelevant) {
                // 显示温和提示，引导学生分析废物来源
                this.showHintModal({
                    type: 'gentle_reminder',
                    title: '💡 侦探提示',
                    message: '侦探，注意分析废物来源，可能有更精准的检测方向',
                    suggestions: [
                        '仔细阅读卷宗中的废物来源和产生工艺',
                        '根据废物特征选择最相关的检测类别',
                        '参考知识库了解不同检测项目的适用场景'
                    ]
                });
            }
        }
    }
    
    /**
     * 显示提示模态框
     * Requirements: 3.1, 3.4 - 显示各类提示信息
     * @param {Object} hintData - 提示数据
     * @param {string} hintData.type - 提示类型
     * @param {string} hintData.title - 标题
     * @param {string} hintData.message - 主要消息
     * @param {string[]} [hintData.suggestions] - 建议列表
     */
    showHintModal(hintData) {
        // 移除已存在的提示模态框
        const existing = document.getElementById('hint-modal-overlay');
        if (existing) existing.remove();
        
        const typeColors = {
            gentle_reminder: { bg: 'var(--detective-blue)', icon: '💡' },
            reasoning_hint: { bg: 'var(--detective-gold)', icon: '🔍' },
            warning: { bg: 'var(--detective-accent)', icon: '⚠️' },
            success: { bg: 'var(--detective-green)', icon: '✓' }
        };
        
        const config = typeColors[hintData.type] || typeColors.gentle_reminder;
        
        const modalHtml = `
            <div id="hint-modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2500;
                animation: fadeIn 0.2s ease-out;
            " onclick="if(event.target.id === 'hint-modal-overlay') document.getElementById('hint-modal-overlay').remove();">
                <div style="
                    background: var(--detective-darker);
                    border-radius: 20px;
                    width: 450px;
                    max-width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    border: 2px solid ${config.bg}50;
                    overflow: hidden;
                    animation: slideUp 0.3s ease-out;
                ">
                    <div style="
                        padding: 20px;
                        background: ${config.bg}20;
                        border-bottom: 1px solid ${config.bg}30;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    ">
                        <span style="font-size: 2rem;">${config.icon}</span>
                        <div style="font-size: 1.2rem; font-weight: bold; color: ${config.bg};">${hintData.title}</div>
                        <button onclick="document.getElementById('hint-modal-overlay').remove()" style="
                            margin-left: auto;
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            border: none;
                            background: rgba(255,255,255,0.1);
                            color: var(--text-muted);
                            font-size: 1.2rem;
                            cursor: pointer;
                        ">×</button>
                    </div>
                    <div style="padding: 25px;">
                        <div style="font-size: 1rem; line-height: 1.6; margin-bottom: 20px; color: var(--text-light);">
                            ${hintData.message}
                        </div>
                        ${hintData.suggestions && hintData.suggestions.length > 0 ? `
                            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px;">
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">💡 建议：</div>
                                <ul style="margin: 0; padding-left: 20px; color: var(--text-muted); font-size: 0.9rem; line-height: 1.8;">
                                    ${hintData.suggestions.map(s => `<li>${s}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        <button onclick="document.getElementById('hint-modal-overlay').remove()" style="
                            width: 100%;
                            margin-top: 20px;
                            padding: 12px;
                            border: none;
                            border-radius: 10px;
                            background: ${config.bg};
                            color: white;
                            font-size: 1rem;
                            font-weight: bold;
                            cursor: pointer;
                        ">我知道了</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // ==================== 商店与知识库 ====================
    
    /**
     * 打开检测商店
     * Requirements: 2.1, 2.2, 3.2
     */
    openShop() {
        const container = document.getElementById('shop-categories');
        if (!container) return;
        
        // 按类别分组
        const grouped = {};
        for (const cat in DETECTION_CATEGORIES) {
            grouped[cat] = this.detectionItems.filter(i => i.category === cat);
        }
        
        container.innerHTML = Object.entries(grouped).map(([cat, items]) => {
            const catConfig = DETECTION_CATEGORIES[cat];
            const purchasedCount = items.filter(item => 
                this.gameState?.purchasedItems.some(p => p.itemId === item.id)
            ).length;
            
            return `
                <div class="shop-category" style="margin-bottom: 25px;">
                    <div class="category-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid ${catConfig.color}30;">
                        <span style="font-size: 1.5rem;">${catConfig.icon}</span>
                        <span style="font-weight: bold; font-size: 1.1rem; color: ${catConfig.color};">${catConfig.name}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px;">${catConfig.standard}</span>
                        <span style="margin-left: auto; font-size: 0.8rem; color: var(--text-muted);">已检测 ${purchasedCount}/${items.length}</span>
                    </div>
                    <div class="category-items" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
                        ${items.map(item => this.renderShopItem(item)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * 渲染商店项目
     * Requirements: 2.1, 2.2, 3.2
     * @param {DetectionItem} item
     */
    renderShopItem(item) {
        const purchased = this.gameState?.purchasedItems.some(p => p.itemId === item.id);
        const canAfford = this.gameState?.remainingBudget >= item.price;
        const catConfig = DETECTION_CATEGORIES[item.category];
        
        return `
            <div class="shop-item" style="
                background: ${purchased ? 'rgba(100,100,100,0.3)' : 'rgba(255,255,255,0.05)'};
                border: 2px solid ${purchased ? 'var(--detective-green)' : 'rgba(255,255,255,0.1)'};
                border-radius: 12px;
                padding: 15px;
                cursor: ${purchased ? 'not-allowed' : 'pointer'};
                opacity: ${purchased ? '0.7' : '1'};
                transition: all 0.2s;
                position: relative;
            " 
            onmouseover="this.style.borderColor='${purchased ? 'var(--detective-green)' : catConfig.color}'; this.style.transform='translateY(-2px)';"
            onmouseout="this.style.borderColor='${purchased ? 'var(--detective-green)' : 'rgba(255,255,255,0.1)'}'; this.style.transform='translateY(0)';">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="font-weight: bold; font-size: 0.95rem; flex: 1;">${item.name}</div>
                    <div style="color: ${canAfford ? 'var(--detective-gold)' : 'var(--detective-accent)'}; font-weight: bold; font-size: 1rem;">¥${item.price}</div>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 10px; min-height: 40px;">${item.description}</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                    ${item.relatedStandards.map(std => `
                        <button onclick="event.stopPropagation(); closeModal('shop-modal'); game.openKnowledgeBaseToClause('${std}');" style="font-size: 0.7rem; padding: 2px 6px; background: ${catConfig.color}20; color: ${catConfig.color}; border-radius: 4px; border: none; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='${catConfig.color}35'" onmouseout="this.style.background='${catConfig.color}20'" title="点击查看标准详情">${std}</button>
                    `).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button onclick="event.stopPropagation(); game.showItemDetail('${item.id}')" style="
                        padding: 5px 10px;
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 5px;
                        background: transparent;
                        color: var(--text-muted);
                        font-size: 0.75rem;
                        cursor: pointer;
                    ">详情</button>
                    ${purchased ? 
                        '<span style="font-size: 0.8rem; color: var(--detective-green); font-weight: bold;">✓ 已检测</span>' : 
                        `<button onclick="event.stopPropagation(); game.purchaseDetection('${item.id}'); game.openShop();" style="
                            padding: 5px 12px;
                            border: none;
                            border-radius: 5px;
                            background: ${canAfford ? 'var(--detective-green)' : 'rgba(100,100,100,0.5)'};
                            color: white;
                            font-size: 0.8rem;
                            font-weight: bold;
                            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                        " ${canAfford ? '' : 'disabled'}>购买</button>`
                    }
                </div>
            </div>
        `;
    }
    
    /**
     * 显示检测项目详情弹窗
     * Requirements: 2.2, 3.2
     * @param {string} itemId
     */
    /**
     * 显示检测项目详情弹窗
     * Requirements: 2.2, 3.2 - 检测项目详情中显示适用场景
     * @param {string} itemId
     */
    showItemDetail(itemId) {
        const item = this.detectionItems.find(i => i.id === itemId);
        if (!item) return;
        
        const catConfig = DETECTION_CATEGORIES[item.category];
        const purchased = this.gameState?.purchasedItems.some(p => p.itemId === item.id);
        const canAfford = this.gameState?.remainingBudget >= item.price;
        
        // Requirements: 3.2 - 获取适用场景描述
        const applicableScenarios = this.getApplicableScenarios(item);
        
        // 创建详情弹窗
        const detailHtml = `
            <div id="item-detail-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            " onclick="if(event.target.id === 'item-detail-overlay') document.getElementById('item-detail-overlay').remove();">
                <div style="
                    background: var(--detective-darker);
                    border-radius: 20px;
                    width: 550px;
                    max-width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    border: 2px solid ${catConfig.color}50;
                ">
                    <div style="
                        padding: 20px;
                        background: ${catConfig.color}20;
                        border-bottom: 1px solid ${catConfig.color}30;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        position: sticky;
                        top: 0;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 2rem;">${catConfig.icon}</span>
                            <div>
                                <div style="font-size: 1.2rem; font-weight: bold;">${item.name}</div>
                                <div style="font-size: 0.85rem; color: ${catConfig.color};">${catConfig.name}</div>
                            </div>
                        </div>
                        <button onclick="document.getElementById('item-detail-overlay').remove()" style="
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            border: none;
                            background: rgba(255,255,255,0.1);
                            color: var(--text-muted);
                            font-size: 1.2rem;
                            cursor: pointer;
                        ">×</button>
                    </div>
                    <div style="padding: 25px;">
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">检测说明</div>
                            <div style="line-height: 1.6;">${item.description}</div>
                        </div>
                        
                        <!-- Requirements: 3.2 - 适用场景说明 -->
                        <div style="margin-bottom: 20px; padding: 15px; background: rgba(244, 162, 97, 0.1); border-radius: 12px; border: 1px solid rgba(244, 162, 97, 0.3);">
                            <div style="font-size: 0.85rem; color: var(--detective-gold); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                <span>💡</span>
                                <span style="font-weight: bold;">适用场景</span>
                            </div>
                            <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-light);">${applicableScenarios}</div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">适用废物类型</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${item.applicableWasteTypes.map(type => `
                                    <span style="
                                        padding: 5px 12px;
                                        background: rgba(255,255,255,0.08);
                                        border-radius: 15px;
                                        font-size: 0.85rem;
                                    ">${type}</span>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">📋 相关国标条款 <span style="font-size: 0.75rem; color: var(--detective-gold);">（点击查看详情）</span></div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${item.relatedStandards.map(std => {
                                    const clauseInfo = this.getStandardClause(std);
                                    const clauseTitle = clauseInfo ? clauseInfo.clause.title : std;
                                    return `
                                    <button onclick="event.stopPropagation(); document.getElementById('item-detail-overlay').remove(); game.openKnowledgeBaseToClause('${std}');" style="
                                        padding: 8px 14px;
                                        background: ${catConfig.color}20;
                                        color: ${catConfig.color};
                                        border: 1px solid ${catConfig.color}40;
                                        border-radius: 8px;
                                        font-size: 0.85rem;
                                        font-weight: bold;
                                        cursor: pointer;
                                        transition: all 0.2s;
                                        display: flex;
                                        align-items: center;
                                        gap: 6px;
                                    " onmouseover="this.style.background='${catConfig.color}35'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='${catConfig.color}20'; this.style.transform='translateY(0)'">
                                        <span>📖</span>
                                        <span>${std}</span>
                                    </button>`;
                                }).join('')}
                            </div>
                        </div>
                        
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding-top: 20px;
                            border-top: 1px solid rgba(255,255,255,0.1);
                        ">
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">检测费用</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: var(--detective-gold);">¥${item.price}</div>
                            </div>
                            ${purchased ? 
                                '<div style="padding: 12px 25px; background: var(--detective-green); color: white; border-radius: 10px; font-weight: bold;">✓ 已检测</div>' :
                                `<button onclick="game.purchaseDetection('${item.id}'); document.getElementById('item-detail-overlay').remove(); game.openShop();" style="
                                    padding: 12px 25px;
                                    border: none;
                                    border-radius: 10px;
                                    background: ${canAfford ? 'var(--detective-green)' : 'rgba(100,100,100,0.5)'};
                                    color: white;
                                    font-size: 1rem;
                                    font-weight: bold;
                                    cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                                " ${canAfford ? '' : 'disabled'}>${canAfford ? '立即购买' : '预算不足'}</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 移除已存在的详情弹窗
        const existing = document.getElementById('item-detail-overlay');
        if (existing) existing.remove();
        
        // 添加新弹窗
        document.body.insertAdjacentHTML('beforeend', detailHtml);
    }
    
    /**
     * 打开知识库
     * Requirements: 9.1, 9.2 - 显示GB 5085系列标准的结构化内容，按危险特性分类
     */
    openKnowledgeBase() {
        const container = document.getElementById('knowledge-content');
        if (!container) return;
        
        // 渲染知识库内容
        this.renderKnowledgeBase(container);
        
        // 绑定搜索事件
        const searchInput = document.getElementById('knowledge-search-input');
        if (searchInput) {
            searchInput.value = '';
            searchInput.oninput = (e) => this.searchKnowledgeBase(e.target.value);
        }
    }
    
    /**
     * 渲染知识库内容
     * Requirements: 9.1, 9.2 - 按危险特性分类显示GB 5085标准
     * @param {HTMLElement} container - 容器元素
     */
    renderKnowledgeBase(container) {
        const categories = Object.entries(GB5085_KNOWLEDGE_BASE);
        
        container.innerHTML = `
            <div class="knowledge-categories" style="display: flex; flex-direction: column; gap: 20px;">
                ${categories.map(([key, data]) => this.renderKnowledgeCategory(key, data)).join('')}
            </div>
        `;
    }
    
    /**
     * 渲染知识库分类
     * Requirements: 9.2 - 按危险特性分类
     * @param {string} key - 分类键名
     * @param {Object} data - 分类数据
     * @returns {string} HTML字符串
     */
    renderKnowledgeCategory(key, data) {
        return `
            <div class="knowledge-category" data-category="${key}" style="
                background: rgba(255,255,255,0.03);
                border: 2px solid ${data.color}30;
                border-radius: 15px;
                overflow: hidden;
            ">
                <!-- 分类标题 -->
                <div class="category-header" onclick="game.toggleKnowledgeCategory('${key}')" style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 18px 20px;
                    background: ${data.color}15;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='${data.color}25'" onmouseout="this.style.background='${data.color}15'">
                    <span style="font-size: 1.8rem;">${data.icon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 1.1rem; color: ${data.color};">${data.standard} ${data.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 3px;">${data.fullName}</div>
                    </div>
                    <span class="expand-icon" id="expand-${key}" style="font-size: 1.2rem; color: var(--text-muted); transition: transform 0.3s;">▼</span>
                </div>
                
                <!-- 分类内容（默认折叠） -->
                <div class="category-content" id="content-${key}" style="display: none; padding: 20px;">
                    <!-- 简介 -->
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                        <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-light);">${data.description}</div>
                    </div>
                    
                    <!-- 条款列表 -->
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 12px; color: ${data.color};">📋 鉴别条款</div>
                        ${data.clauses.map(clause => this.renderKnowledgeClause(clause, data.color)).join('')}
                    </div>
                    
                    <!-- 要点提示 -->
                    <div style="background: rgba(244, 162, 97, 0.1); border: 1px solid rgba(244, 162, 97, 0.3); border-radius: 10px; padding: 15px;">
                        <div style="font-weight: bold; margin-bottom: 10px; color: var(--detective-gold);">💡 鉴别要点</div>
                        <ul style="margin: 0; padding-left: 20px; color: var(--text-muted); font-size: 0.9rem; line-height: 1.8;">
                            ${data.keyPoints.map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 渲染知识库条款
     * Requirements: 9.5 - 显示限值表格和判定方法说明
     * @param {Object} clause - 条款数据
     * @param {string} color - 主题颜色
     * @returns {string} HTML字符串
     */
    renderKnowledgeClause(clause, color) {
        return `
            <div class="knowledge-clause" data-clause-id="${clause.id}" style="
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                margin-bottom: 12px;
                overflow: hidden;
            ">
                <!-- 条款标题 -->
                <div onclick="game.toggleKnowledgeClause('${clause.id}')" style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                    <span style="font-size: 0.85rem; padding: 3px 8px; background: ${color}20; color: ${color}; border-radius: 5px; font-weight: bold;">${clause.id}</span>
                    <span style="font-weight: 500; flex: 1;">${clause.title}</span>
                    <span class="clause-expand" id="clause-expand-${clause.id}" style="font-size: 0.9rem; color: var(--text-muted);">+</span>
                </div>
                
                <!-- 条款详情（默认折叠） -->
                <div class="clause-detail" id="clause-detail-${clause.id}" style="display: none; padding: 0 15px 15px 15px;">
                    <!-- 条款内容 -->
                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">条款内容</div>
                        <div style="font-size: 0.9rem; line-height: 1.6;">${clause.content}</div>
                    </div>
                    
                    <!-- 检测方法 -->
                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(69, 123, 157, 0.1); border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--detective-blue); margin-bottom: 5px;">🔬 检测方法</div>
                        <div style="font-size: 0.9rem; line-height: 1.6;">${clause.method}</div>
                    </div>
                    
                    <!-- 限值表格 -->
                    ${clause.limits && clause.limits.length > 0 ? `
                        <div style="margin-bottom: 15px;">
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">📊 限值标准</div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                <thead>
                                    <tr style="background: rgba(255,255,255,0.05);">
                                        <th style="padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1);">参数</th>
                                        <th style="padding: 10px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">限值条件</th>
                                        <th style="padding: 10px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1);">判定结果</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${clause.limits.map(limit => `
                                        <tr>
                                            <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">${limit.parameter}</td>
                                            <td style="padding: 10px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--detective-accent); font-weight: bold;">${limit.condition}</td>
                                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--text-muted);">${limit.result}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}
                    
                    <!-- 适用废物类型 -->
                    ${clause.applicableWaste && clause.applicableWaste.length > 0 ? `
                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">🏭 适用废物类型</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${clause.applicableWaste.map(waste => `
                                    <span style="padding: 5px 12px; background: rgba(255,255,255,0.05); border-radius: 15px; font-size: 0.8rem;">${waste}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * 切换知识库分类展开/折叠
     * @param {string} categoryKey - 分类键名
     */
    toggleKnowledgeCategory(categoryKey) {
        const content = document.getElementById(`content-${categoryKey}`);
        const icon = document.getElementById(`expand-${categoryKey}`);
        
        if (content && icon) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.style.display = 'none';
                icon.style.transform = 'rotate(0deg)';
            }
        }
    }
    
    /**
     * 切换知识库条款展开/折叠
     * @param {string} clauseId - 条款ID
     */
    toggleKnowledgeClause(clauseId) {
        const detail = document.getElementById(`clause-detail-${clauseId}`);
        const icon = document.getElementById(`clause-expand-${clauseId}`);
        
        if (detail && icon) {
            if (detail.style.display === 'none') {
                detail.style.display = 'block';
                icon.textContent = '−';
            } else {
                detail.style.display = 'none';
                icon.textContent = '+';
            }
        }
    }
    
    /**
     * 搜索知识库
     * Requirements: 9.3 - 支持按关键词搜索标准条款
     * @param {string} keyword - 搜索关键词
     */
    searchKnowledgeBase(keyword) {
        const container = document.getElementById('knowledge-content');
        if (!container) return;
        
        const trimmedKeyword = keyword.trim().toLowerCase();
        
        // 如果关键词为空，显示全部内容
        if (!trimmedKeyword) {
            this.renderKnowledgeBase(container);
            return;
        }
        
        // 搜索匹配的条款
        const results = this.searchStandards(trimmedKeyword);
        
        if (results.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                    <div style="font-size: 1.1rem; margin-bottom: 10px;">未找到匹配的标准条款</div>
                    <div style="font-size: 0.9rem;">尝试使用其他关键词，如"pH"、"重金属"、"闪点"等</div>
                </div>
            `;
            return;
        }
        
        // 渲染搜索结果
        container.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px 15px; background: rgba(42, 157, 143, 0.1); border-radius: 10px; display: flex; align-items: center; gap: 10px;">
                <span style="color: var(--detective-green);">✓</span>
                <span>找到 <strong>${results.length}</strong> 条匹配的标准条款</span>
                <button onclick="game.clearKnowledgeSearch()" style="margin-left: auto; padding: 5px 12px; border: 1px solid var(--text-muted); border-radius: 5px; background: transparent; color: var(--text-muted); font-size: 0.8rem; cursor: pointer;">清除搜索</button>
            </div>
            <div class="search-results" style="display: flex; flex-direction: column; gap: 12px;">
                ${results.map(result => this.renderSearchResult(result, trimmedKeyword)).join('')}
            </div>
        `;
    }
    
    /**
     * 搜索标准条款
     * Requirements: 9.3 - 按关键词搜索标准条款
     * @param {string} keyword - 搜索关键词
     * @returns {Array} 匹配的条款列表
     */
    searchStandards(keyword) {
        const results = [];
        
        for (const [categoryKey, categoryData] of Object.entries(GB5085_KNOWLEDGE_BASE)) {
            for (const clause of categoryData.clauses) {
                // 搜索条款ID、标题、内容、方法、适用废物类型
                const searchText = [
                    clause.id,
                    clause.title,
                    clause.content,
                    clause.method,
                    ...(clause.applicableWaste || []),
                    ...(clause.limits || []).map(l => l.parameter)
                ].join(' ').toLowerCase();
                
                if (searchText.includes(keyword)) {
                    results.push({
                        categoryKey,
                        categoryData,
                        clause
                    });
                }
            }
        }
        
        return results;
    }
    
    /**
     * 渲染搜索结果项
     * @param {Object} result - 搜索结果
     * @param {string} keyword - 搜索关键词
     * @returns {string} HTML字符串
     */
    renderSearchResult(result, keyword) {
        const { categoryData, clause } = result;
        
        // 高亮关键词
        const highlightText = (text) => {
            if (!text) return '';
            const regex = new RegExp(`(${this.escapeRegex(keyword)})`, 'gi');
            return text.replace(regex, '<mark style="background: var(--detective-gold); color: var(--detective-dark); padding: 0 2px; border-radius: 2px;">$1</mark>');
        };
        
        return `
            <div class="search-result-item" style="
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 15px;
            ">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 1.3rem;">${categoryData.icon}</span>
                    <span style="font-size: 0.8rem; padding: 3px 8px; background: ${categoryData.color}20; color: ${categoryData.color}; border-radius: 5px; font-weight: bold;">${clause.id}</span>
                    <span style="font-weight: bold;">${highlightText(clause.title)}</span>
                </div>
                <div style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 10px;">
                    ${highlightText(clause.content.substring(0, 150))}${clause.content.length > 150 ? '...' : ''}
                </div>
                ${clause.limits && clause.limits.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${clause.limits.slice(0, 3).map(limit => `
                            <span style="font-size: 0.75rem; padding: 4px 10px; background: rgba(233, 69, 96, 0.1); color: var(--detective-accent); border-radius: 5px;">
                                ${highlightText(limit.parameter)}: ${limit.condition}
                            </span>
                        `).join('')}
                        ${clause.limits.length > 3 ? `<span style="font-size: 0.75rem; color: var(--text-muted);">+${clause.limits.length - 3} 更多</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * 清除知识库搜索
     */
    clearKnowledgeSearch() {
        const searchInput = document.getElementById('knowledge-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const container = document.getElementById('knowledge-content');
        if (container) {
            this.renderKnowledgeBase(container);
        }
    }
    
    /**
     * 获取标准条款详情
     * Requirements: 9.4 - 提供快速跳转到对应标准条款的链接
     * @param {string} clauseId - 条款ID
     * @returns {Object|null} 条款详情
     */
    getStandardClause(clauseId) {
        for (const [categoryKey, categoryData] of Object.entries(GB5085_KNOWLEDGE_BASE)) {
            const clause = categoryData.clauses.find(c => c.id === clauseId);
            if (clause) {
                return {
                    categoryKey,
                    categoryData,
                    clause
                };
            }
        }
        return null;
    }
    
    /**
     * 获取检测项目关联的标准条款
     * Requirements: 9.4 - 检测项目详情中显示相关国标条款
     * @param {string} detectionItemId - 检测项目ID
     * @returns {Array} 关联的标准条款列表
     */
    getRelatedStandards(detectionItemId) {
        const item = this.detectionItems.find(i => i.id === detectionItemId);
        if (!item || !item.relatedStandards) return [];
        
        return item.relatedStandards.map(standardId => {
            const clauseInfo = this.getStandardClause(standardId);
            if (clauseInfo) {
                return {
                    id: standardId,
                    title: clauseInfo.clause.title,
                    category: clauseInfo.categoryData.name,
                    icon: clauseInfo.categoryData.icon,
                    color: clauseInfo.categoryData.color
                };
            }
            return { id: standardId, title: standardId, category: '未知', icon: '📋', color: '#666' };
        });
    }
    
    /**
     * 打开知识库并跳转到指定条款
     * Requirements: 9.4 - 游戏中提供快速跳转链接
     * @param {string} clauseId - 条款ID
     */
    openKnowledgeBaseToClause(clauseId) {
        // 打开知识库模态框
        this.openKnowledgeBase();
        openModal('knowledge-modal');
        
        // 延迟执行以确保DOM已渲染
        setTimeout(() => {
            const clauseInfo = this.getStandardClause(clauseId);
            if (clauseInfo) {
                // 展开对应分类
                this.toggleKnowledgeCategory(clauseInfo.categoryKey);
                
                // 展开对应条款
                setTimeout(() => {
                    this.toggleKnowledgeClause(clauseId);
                    
                    // 滚动到条款位置
                    const clauseEl = document.querySelector(`[data-clause-id="${clauseId}"]`);
                    if (clauseEl) {
                        clauseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        clauseEl.style.animation = 'highlight-pulse 1s ease-out';
                    }
                }, 100);
            }
        }, 100);
    }
    
    // ==================== 术语解释系统 ====================
    // Requirements: 3.2, 3.3 - 专业术语悬停tooltip和检测项目详情中显示适用场景
    
    /**
     * 获取术语定义
     * Requirements: 3.3 - 专业术语悬停tooltip
     * @param {string} term - 术语名称
     * @returns {string|null} 术语定义
     */
    getTermDefinition(term) {
        return TERMINOLOGY[term] || null;
    }
    
    /**
     * 将文本中的专业术语转换为带tooltip的HTML
     * Requirements: 3.3 - 专业术语悬停tooltip
     * @param {string} text - 原始文本
     * @returns {string} 带tooltip的HTML
     */
    addTermTooltips(text) {
        let result = text;
        for (const [term, definition] of Object.entries(TERMINOLOGY)) {
            // 使用正则表达式匹配术语，避免重复替换
            const regex = new RegExp(`(?<!data-tooltip=")${this.escapeRegex(term)}(?![^<]*>)`, 'g');
            result = result.replace(regex, `<span class="term-tooltip" data-tooltip="${this.escapeHtml(definition)}">${term}</span>`);
        }
        return result;
    }
    
    /**
     * 转义正则表达式特殊字符
     * @param {string} str - 原始字符串
     * @returns {string} 转义后的字符串
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * 转义HTML特殊字符
     * @param {string} str - 原始字符串
     * @returns {string} 转义后的字符串
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * 显示术语tooltip
     * Requirements: 3.3 - 专业术语悬停tooltip
     * @param {string} term - 术语名称
     * @param {HTMLElement} element - 触发元素
     */
    showTermTooltip(term, element) {
        const definition = this.getTermDefinition(term);
        if (!definition) return;
        
        // 移除已存在的tooltip
        const existing = document.getElementById('term-tooltip-popup');
        if (existing) existing.remove();
        
        const rect = element.getBoundingClientRect();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'term-tooltip-popup';
        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: var(--detective-gold);">${term}</div>
            <div style="line-height: 1.6;">${definition}</div>
        `;
        tooltip.style.cssText = `
            position: fixed;
            top: ${rect.top - 10}px;
            left: ${rect.left + rect.width / 2}px;
            transform: translate(-50%, -100%);
            background: var(--detective-darker);
            color: var(--text-light);
            padding: 15px 20px;
            border-radius: 12px;
            font-size: 0.9rem;
            max-width: 350px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.15);
            z-index: 3000;
            animation: fadeIn 0.2s ease-out;
        `;
        
        document.body.appendChild(tooltip);
        
        // 点击其他地方关闭
        const closeHandler = (e) => {
            if (!tooltip.contains(e.target) && e.target !== element) {
                tooltip.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 100);
    }
    
    /**
     * 获取检测项目的适用场景描述
     * Requirements: 3.2 - 检测项目详情中显示适用场景
     * @param {DetectionItem} item - 检测项目
     * @returns {string} 适用场景描述
     */
    getApplicableScenarios(item) {
        const scenarios = [];
        
        // 根据适用废物类型生成场景描述
        if (item.applicableWasteTypes && item.applicableWasteTypes.length > 0) {
            scenarios.push(`适用于检测${item.applicableWasteTypes.join('、')}等废物类型`);
        }
        
        // 根据检测类别添加场景说明
        const categoryScenarios = {
            corrosivity: '当废物呈现强酸性或强碱性特征时，应优先进行此类检测',
            acute_toxicity: '当废物可能含有剧毒或高毒物质时，需要进行急性毒性检测',
            leaching_toxicity: '当废物可能含有重金属或有机污染物时，应进行浸出毒性检测',
            flammability: '当废物为液态或含有挥发性有机物时，需要检测易燃性',
            reactivity: '当废物可能与水或空气发生剧烈反应时，应进行反应性检测',
            toxic_content: '当废物可能含有特定有毒物质时，需要检测毒性物质含量'
        };
        
        if (categoryScenarios[item.category]) {
            scenarios.push(categoryScenarios[item.category]);
        }
        
        return scenarios.join('。');
    }
    
    /**
     * 请求提示
     * Requirements: 3.4 - 帮助按钮消耗预算提供推理思路
     */
    requestHint() {
        const hintCost = 500;
        
        if (!this.gameState) {
            this.showToast('游戏未开始', 'warning');
            return;
        }
        
        if (this.gameState.remainingBudget < hintCost) {
            this.showToast('预算不足，无法获取提示', 'warning');
            return;
        }
        
        if (!confirm(`获取提示将消耗 ¥${hintCost} 预算，确定继续吗？`)) {
            return;
        }
        
        this.deductBudget(hintCost);
        
        // 生成详细的推理思路提示
        if (this.currentCase) {
            const hintData = this.generateDetailedHint();
            this.showHintModal(hintData);
        }
    }
    
    /**
     * 生成详细的推理思路提示
     * Requirements: 3.4 - 提供当前案件的推理思路提示
     * @returns {Object} 提示数据对象
     */
    generateDetailedHint() {
        if (!this.currentCase) {
            return {
                type: 'gentle_reminder',
                title: '💡 提示',
                message: '暂无提示',
                suggestions: []
            };
        }
        
        const requiredEvidence = this.currentCase.correctAnswer.requiredEvidence;
        const purchased = this.gameState?.purchasedItems.map(p => p.itemId) || [];
        const remaining = requiredEvidence.filter(e => !purchased.includes(e));
        const exceededClues = this.getExceededClues();
        
        // 情况1：已收集所有关键证据
        if (remaining.length === 0) {
            const correctAnswer = this.currentCase.correctAnswer;
            const hazardHints = correctAnswer.hazardCharacteristics.map(c => 
                HAZARD_CHARACTERISTICS[c]?.name || c
            );
            
            return {
                type: 'success',
                title: '🎯 关键证据已齐全',
                message: '你已经收集了所有关键证据，可以尝试提交判定了！',
                suggestions: [
                    '仔细分析超标的检测项目',
                    exceededClues.length > 0 ? `当前有 ${exceededClues.length} 项检测超标` : '检查是否有超标项目',
                    '根据超标项目判断危险特性类别',
                    '选择对应的国标条款作为判定依据'
                ]
            };
        }
        
        // 情况2：还需要更多证据
        const nextItem = this.detectionItems.find(i => i.id === remaining[0]);
        const caseFile = this.currentCase.caseFile;
        
        // 根据废物来源生成推理思路
        const reasoningHints = this.generateReasoningHints(caseFile, nextItem, exceededClues);
        
        return {
            type: 'reasoning_hint',
            title: '🔍 推理思路',
            message: reasoningHints.mainHint,
            suggestions: reasoningHints.suggestions
        };
    }
    
    /**
     * 根据案件信息生成推理提示
     * @param {CaseFile} caseFile - 案件卷宗
     * @param {DetectionItem} nextItem - 下一个建议检测项目
     * @param {DetectionResult[]} exceededClues - 已超标的线索
     * @returns {{mainHint: string, suggestions: string[]}}
     */
    generateReasoningHints(caseFile, nextItem, exceededClues) {
        const suggestions = [];
        let mainHint = '';
        
        // 分析废物来源关键词
        const sourceKeywords = {
            '电镀': { hint: '电镀工艺通常产生含重金属的污泥', category: 'leaching_toxicity' },
            '酸': { hint: '酸性废物需要关注腐蚀性', category: 'corrosivity' },
            '碱': { hint: '碱性废物需要关注腐蚀性', category: 'corrosivity' },
            '油': { hint: '含油废物需要关注易燃性和毒性物质含量', category: 'flammability' },
            '溶剂': { hint: '有机溶剂废物需要关注易燃性和毒性', category: 'flammability' },
            '医疗': { hint: '医疗废物需要关注感染性和毒性', category: 'acute_toxicity' },
            '农药': { hint: '农药废物需要关注急性毒性', category: 'acute_toxicity' },
            '化工': { hint: '化工废物需要综合考虑多种危险特性', category: 'toxic_content' }
        };
        
        // 根据废物来源匹配关键词
        for (const [keyword, info] of Object.entries(sourceKeywords)) {
            if (caseFile.wasteSource.includes(keyword)) {
                mainHint = info.hint;
                const catConfig = DETECTION_CATEGORIES[info.category];
                suggestions.push(`建议关注${catConfig.name}方向`);
                break;
            }
        }
        
        // 如果没有匹配到关键词，使用通用提示
        if (!mainHint) {
            mainHint = '仔细分析废物来源和产生工艺，选择最相关的检测项目';
        }
        
        // 根据已有超标线索提供进一步建议
        if (exceededClues.length > 0) {
            const exceededCategories = [...new Set(exceededClues.map(c => c.category))];
            const catNames = exceededCategories.map(c => DETECTION_CATEGORIES[c]?.name || c).join('、');
            suggestions.push(`已发现${catNames}方向有超标项目`);
            suggestions.push('可以继续深入检测该方向的其他项目');
        }
        
        // 根据下一个建议项目提供提示
        if (nextItem) {
            const catConfig = DETECTION_CATEGORIES[nextItem.category];
            suggestions.push(`${catConfig.name}可能是关键检测方向`);
        }
        
        // 添加通用建议
        if (suggestions.length < 3) {
            suggestions.push('查看知识库了解各类检测项目的适用场景');
        }
        
        return { mainHint, suggestions };
    }
    
    /**
     * 生成简单提示（用于Toast显示）
     * @returns {string}
     */
    generateHint() {
        if (!this.currentCase) return '暂无提示';
        
        const requiredEvidence = this.currentCase.correctAnswer.requiredEvidence;
        const purchased = this.gameState?.purchasedItems.map(p => p.itemId) || [];
        const remaining = requiredEvidence.filter(e => !purchased.includes(e));
        
        if (remaining.length === 0) {
            return '你已经收集了所有关键证据，可以尝试提交判定了！';
        }
        
        const nextItem = this.detectionItems.find(i => i.id === remaining[0]);
        if (nextItem) {
            const catConfig = DETECTION_CATEGORIES[nextItem.category];
            return `提示：建议关注${catConfig.name}方向的检测项目`;
        }
        
        return '仔细分析废物来源和特征，选择最相关的检测项目';
    }

    // ==================== 判定与评分 ====================
    // Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
    
    /**
     * 国标条款配置
     * Requirements: 4.3 - 实现国标条款选择器
     */
    static STANDARD_CLAUSES = {
        'GB5085.1-4.1': { name: 'GB 5085.1-4.1 腐蚀性鉴别', category: 'corrosivity', description: 'pH≤2或pH≥12.5' },
        'GB5085.1-4.2': { name: 'GB 5085.1-4.2 腐蚀速率', category: 'corrosivity', description: '对钢材腐蚀速率>6.35mm/年' },
        'GB5085.2-4.1': { name: 'GB 5085.2-4.1 经口急性毒性', category: 'acute_toxicity', description: 'LD50≤200mg/kg(剧毒)或≤2000mg/kg(有毒)' },
        'GB5085.2-4.2': { name: 'GB 5085.2-4.2 经皮急性毒性', category: 'acute_toxicity', description: 'LD50≤1000mg/kg' },
        'GB5085.2-4.3': { name: 'GB 5085.2-4.3 吸入急性毒性', category: 'acute_toxicity', description: 'LC50≤10mg/L' },
        'GB5085.3-4.1': { name: 'GB 5085.3-4.1 浸出毒性鉴别', category: 'leaching_toxicity', description: '重金属或有机物浸出超标' },
        'GB5085.4-4.1': { name: 'GB 5085.4-4.1 液态易燃性', category: 'flammability', description: '闪点<60°C' },
        'GB5085.4-4.2': { name: 'GB 5085.4-4.2 固态易燃性', category: 'flammability', description: '标准条件下易燃' },
        'GB5085.4-4.3': { name: 'GB 5085.4-4.3 氧化性', category: 'flammability', description: '强氧化剂' },
        'GB5085.5-4.1': { name: 'GB 5085.5-4.1 氰化物反应性', category: 'reactivity', description: '产生HCN≥250mg/kg' },
        'GB5085.5-4.2': { name: 'GB 5085.5-4.2 硫化物反应性', category: 'reactivity', description: '产生H2S≥500mg/kg' },
        'GB5085.5-4.3': { name: 'GB 5085.5-4.3 爆炸性', category: 'reactivity', description: '具有爆炸性' },
        'GB5085.5-4.4': { name: 'GB 5085.5-4.4 遇水反应性', category: 'reactivity', description: '与水反应产生易燃气体' },
        'GB5085.6-4.1': { name: 'GB 5085.6-4.1 有机毒性物质', category: 'toxic_content', description: '苯、甲苯、二甲苯等超标' },
        'GB5085.6-4.2': { name: 'GB 5085.6-4.2 多氯联苯', category: 'toxic_content', description: 'PCBs≥50mg/kg' },
        'GB5085.6-4.3': { name: 'GB 5085.6-4.3 矿物油', category: 'toxic_content', description: '矿物油含量≥5%' }
    };
    
    /**
     * 打开判定表单
     * Requirements: 4.1 - 显示判定选项（危险废物/一般固废/需进一步鉴别）
     * Requirements: 4.2 - 要求选择危险特性类别
     * Requirements: 4.3 - 要求填写判定依据（选择相关国标条款）
     */
    openJudgmentForm() {
        const container = document.getElementById('judgment-form');
        if (!container) return;
        
        // 获取已收集的线索统计
        const clueStats = this.getClueStats();
        const exceededClues = this.getExceededClues();
        
        container.innerHTML = `
            <!-- 线索摘要 -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px;">📋 已收集线索摘要</div>
                <div style="display: flex; gap: 20px;">
                    <div>
                        <span style="font-size: 1.5rem; font-weight: bold; color: var(--detective-blue);">${clueStats.total}</span>
                        <span style="font-size: 0.85rem; color: var(--text-muted);"> 条线索</span>
                    </div>
                    <div>
                        <span style="font-size: 1.5rem; font-weight: bold; color: var(--detective-accent);">${clueStats.exceeded}</span>
                        <span style="font-size: 0.85rem; color: var(--text-muted);"> 项超标</span>
                    </div>
                </div>
                ${exceededClues.length > 0 ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.8rem; color: var(--detective-accent); margin-bottom: 5px;">⚠️ 超标项目：</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                            ${exceededClues.map(c => `
                                <span style="font-size: 0.75rem; padding: 3px 8px; background: rgba(233, 69, 96, 0.2); color: var(--detective-accent); border-radius: 5px;">
                                    ${c.itemName}: ${c.value}${c.unit} (限值${c.standardLimit}${c.unit})
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.8rem; color: var(--detective-green);">✓ 所有检测项目均未超标</div>
                    </div>
                `}
            </div>
            
            <!-- 鉴别结论选择 - Requirements: 4.1 -->
            <div class="judgment-section" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                    <span style="color: var(--detective-accent);">*</span> 鉴别结论
                </label>
                <div style="display: flex; gap: 10px;">
                    <button class="judgment-option" data-result="hazardous" onclick="selectJudgmentResult('hazardous')" style="flex: 1; padding: 15px; border: 2px solid rgba(255,255,255,0.2); border-radius: 10px; background: transparent; color: white; cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 1.5rem; margin-bottom: 5px;">☠️</div>
                        <div style="font-weight: bold;">危险废物</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">具有危险特性</div>
                    </button>
                    <button class="judgment-option" data-result="non_hazardous" onclick="selectJudgmentResult('non_hazardous')" style="flex: 1; padding: 15px; border: 2px solid rgba(255,255,255,0.2); border-radius: 10px; background: transparent; color: white; cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 1.5rem; margin-bottom: 5px;">✅</div>
                        <div style="font-weight: bold;">一般固废</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">不具有危险特性</div>
                    </button>
                    <button class="judgment-option" data-result="need_further" onclick="selectJudgmentResult('need_further')" style="flex: 1; padding: 15px; border: 2px solid rgba(255,255,255,0.2); border-radius: 10px; background: transparent; color: white; cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 1.5rem; margin-bottom: 5px;">🔍</div>
                        <div style="font-weight: bold;">需进一步鉴别</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">证据不足</div>
                    </button>
                </div>
            </div>
            
            <!-- 危险特性选择 - Requirements: 4.2 -->
            <div id="hazard-characteristics-section" style="display: none; margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                    <span style="color: var(--detective-accent);">*</span> 危险特性（可多选）
                </label>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${Object.entries(HAZARD_CHARACTERISTICS).map(([key, val]) => `
                        <label class="hazard-checkbox" style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='rgba(255,255,255,0.3)'" onmouseout="if(!this.querySelector('input').checked) this.style.borderColor='rgba(255,255,255,0.1)'">
                            <input type="checkbox" name="hazard" value="${key}" style="width: 18px; height: 18px; accent-color: var(--detective-accent);" onchange="updateHazardCheckboxStyle(this)" />
                            <span style="font-size: 1.2rem;">${val.icon}</span>
                            <div>
                                <div style="font-weight: bold;">${val.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">代码: ${val.code}</div>
                            </div>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <!-- 国标条款选择 - Requirements: 4.3 -->
            <div id="standard-basis-section" style="display: none; margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                    <span style="color: var(--detective-accent);">*</span> 判定依据（国标条款）
                </label>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">
                    请选择支持您判定结论的国标条款（可多选）
                </div>
                <div id="standard-clauses-container" style="display: grid; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 5px;">
                    ${Object.entries(HazwasteDetective.STANDARD_CLAUSES).map(([key, clause]) => `
                        <label class="standard-clause-item" style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; transition: all 0.2s;" data-category="${clause.category}">
                            <input type="checkbox" name="standard" value="${key}" style="width: 16px; height: 16px; margin-top: 2px; accent-color: var(--detective-green);" />
                            <div style="flex: 1;">
                                <div style="font-size: 0.9rem; font-weight: 500;">${clause.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${clause.description}</div>
                            </div>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <!-- 判定理由（可选） -->
            <div id="reasoning-section" style="display: none; margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">判定理由（可选）</label>
                <textarea id="judgment-reasoning" placeholder="简要说明您的判定依据和推理过程..." style="width: 100%; height: 80px; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 0.9rem; resize: none;"></textarea>
            </div>
            
            <!-- 警告提示 -->
            <div id="judgment-warning" style="display: none; background: rgba(233, 69, 96, 0.1); border: 1px solid var(--detective-accent); border-radius: 10px; padding: 12px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 8px; color: var(--detective-accent);">
                    <span>⚠️</span>
                    <span id="judgment-warning-text">请确保您已收集足够的证据</span>
                </div>
            </div>
            
            <!-- 提交按钮 -->
            <button id="submit-judgment-btn-form" onclick="game.submitJudgment()" style="width: 100%; padding: 16px; border: none; border-radius: 12px; background: linear-gradient(135deg, var(--detective-accent) 0%, #c73e54 100%); color: white; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(233, 69, 96, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(233, 69, 96, 0.3)'">
                ⚖️ 提交鉴别判定
            </button>
        `;
    }
    
    /**
     * 提交判定
     * Requirements: 4.4 - 验证判定结果是否正确
     */
    submitJudgment() {
        const selectedResult = document.querySelector('.judgment-option.selected');
        if (!selectedResult) {
            this.showToast('请选择鉴别结论', 'warning');
            return;
        }
        
        const result = selectedResult.dataset.result;
        
        // 构建判定对象
        /** @type {Judgment} */
        const judgment = {
            result: result,
            hazardCharacteristics: [],
            standardBasis: [],
            reasoning: ''
        };
        
        if (result === 'hazardous') {
            // 获取选中的危险特性
            // Requirements: 4.2 - 要求选择危险特性类别
            const checkedHazards = document.querySelectorAll('input[name="hazard"]:checked');
            judgment.hazardCharacteristics = Array.from(checkedHazards).map(cb => cb.value);
            
            if (judgment.hazardCharacteristics.length === 0) {
                this.showToast('请选择至少一个危险特性', 'warning');
                return;
            }
            
            // 获取选中的国标条款
            // Requirements: 4.3 - 要求填写判定依据
            const checkedStandards = document.querySelectorAll('input[name="standard"]:checked');
            judgment.standardBasis = Array.from(checkedStandards).map(cb => cb.value);
            
            if (judgment.standardBasis.length === 0) {
                this.showToast('请选择至少一个判定依据（国标条款）', 'warning');
                return;
            }
        }
        
        // 获取判定理由（可选）
        const reasoningEl = document.getElementById('judgment-reasoning');
        if (reasoningEl) {
            judgment.reasoning = reasoningEl.value.trim();
        }
        
        // 验证判定
        // Requirements: 4.4 - 验证判定结果是否正确
        const validationResult = this.validateJudgment(judgment);
        
        // 停止计时
        this.stopTimer();
        
        // 计算评分
        const scoreResult = this.calculateScore(judgment, validationResult.isCorrect);
        
        // 更新游戏状态
        this.gameState.isCompleted = true;
        this.gameState.judgment = judgment;
        this.gameState.score = scoreResult;
        
        // 保存记录
        this.saveGameRecord(scoreResult);
        
        // 清除进度
        this.clearProgress();
        
        // 关闭判定模态框
        closeModal('judgment-modal');
        
        // 显示结果
        // Requirements: 4.5, 4.6 - 显示成功/失败结局
        this.showResult(validationResult.isCorrect, scoreResult, validationResult.details);
    }

    /**
     * 验证判定
     * Requirements: 4.4 - 验证判定结果是否正确
     * @param {Judgment} judgment - 学生提交的判定
     * @returns {{isCorrect: boolean, details: Object}} 验证结果
     */
    validateJudgment(judgment) {
        if (!this.currentCase) {
            return { isCorrect: false, details: { error: '案件数据不存在' } };
        }
        
        const correct = this.currentCase.correctAnswer;
        
        // 1. 检查判定结果是否正确（危险废物/一般固废）
        const resultCorrect = judgment.result === correct.result;
        
        // 2. 检查危险特性是否正确（如果正确答案是危险废物）
        let characteristicsCorrect = true;
        let characteristicsPartial = false;
        let missingCharacteristics = [];
        let extraCharacteristics = [];
        
        if (correct.result === 'hazardous') {
            const judgedChars = new Set(judgment.hazardCharacteristics || []);
            const correctChars = new Set(correct.hazardCharacteristics);
            
            // 检查是否完全匹配
            characteristicsCorrect = 
                judgedChars.size === correctChars.size &&
                [...judgedChars].every(c => correctChars.has(c));
            
            // 检查是否部分正确
            const matchedChars = [...judgedChars].filter(c => correctChars.has(c));
            characteristicsPartial = matchedChars.length > 0 && !characteristicsCorrect;
            
            // 找出缺失和多余的特性
            missingCharacteristics = [...correctChars].filter(c => !judgedChars.has(c));
            extraCharacteristics = [...judgedChars].filter(c => !correctChars.has(c));
        }
        
        // 3. 检查国标依据是否合理（如果选择了危险废物）
        let standardBasisReasonable = true;
        let matchedStandards = [];
        
        if (judgment.result === 'hazardous' && judgment.standardBasis) {
            const correctStandards = new Set(correct.standardBasis || []);
            matchedStandards = judgment.standardBasis.filter(s => correctStandards.has(s));
            // 只要选择了至少一个正确的国标条款就算合理
            standardBasisReasonable = matchedStandards.length > 0;
        }
        
        // 综合判定是否正确
        const isCorrect = resultCorrect && characteristicsCorrect;
        
        return {
            isCorrect,
            details: {
                resultCorrect,
                characteristicsCorrect,
                characteristicsPartial,
                standardBasisReasonable,
                expectedResult: correct.result,
                expectedCharacteristics: correct.hazardCharacteristics,
                expectedStandards: correct.standardBasis,
                missingCharacteristics,
                extraCharacteristics,
                matchedStandards,
                requiredEvidence: correct.requiredEvidence
            }
        };
    }
    
    /**
     * 计算评分
     * Requirements: 5.1, 5.2 - 计算综合得分（0-100分），考虑多个维度
     * @param {Judgment} judgment
     * @param {boolean} isCorrect
     * @returns {ScoreResult}
     */
    calculateScore(judgment, isCorrect) {
        const state = this.gameState;
        const caseData = this.currentCase;
        
        // 使用ScoreCalculator进行评分计算
        const calculator = new ScoreCalculator(caseData, state);
        
        // 1. 判定准确性得分 (40%) - Requirements: 5.1, 5.2
        const accuracyScore = calculator.scoreAccuracy(judgment, caseData.correctAnswer);
        
        // 2. 预算使用效率得分 (30%) - Requirements: 5.1, 5.2
        const spent = state.budget - state.remainingBudget;
        const budgetScore = calculator.scoreBudgetEfficiency(spent, state.budget, caseData.optimalCost);
        
        // 3. 检测路径合理性得分 (20%) - Requirements: 5.1, 5.2
        const purchasedIds = state.purchasedItems.map(p => p.itemId);
        const pathScore = calculator.scorePathRationality(purchasedIds, caseData.optimalPath);
        
        // 4. 用时得分 (10%) - Requirements: 5.1, 5.2
        const timeLimit = caseData.timeLimit || 600;
        const timeScore = calculator.scoreTime(state.elapsedTime, timeLimit);
        
        // 计算总分 - 权重：准确性40% + 预算效率30% + 路径合理性20% + 用时10%
        const totalScore = calculator.calculateTotalScore(accuracyScore, budgetScore, pathScore, timeScore);
        
        // 确定评级 - Requirements: 5.6, 5.7
        const grade = calculator.getGrade(totalScore);
        
        // 检查成就 - Requirements: 5.3
        const achievements = calculator.getAchievements(state, isCorrect, purchasedIds, caseData.optimalPath);
        
        // 生成反馈 - Requirements: 5.5, 5.7
        const feedback = this.generateFeedback(totalScore, isCorrect);
        
        // 生成路径对比 - Requirements: 3.5, 5.5
        const optimalPathComparison = calculator.generatePathComparison(purchasedIds, caseData.optimalPath, spent, caseData.optimalCost, this.detectionItems);
        
        return {
            totalScore,
            breakdown: {
                accuracy: Math.round(accuracyScore),
                budgetEfficiency: Math.round(budgetScore),
                pathRationality: Math.round(pathScore),
                timeScore: Math.round(timeScore)
            },
            grade,
            achievements,
            feedback,
            optimalPathComparison
        };
    }
    
    /**
     * 生成反馈
     * Requirements: 5.5, 5.7 - 生成文字反馈和改进建议
     * @param {number} score - 总分
     * @param {boolean} isCorrect - 判定是否正确
     * @returns {Feedback} 反馈对象
     */
    generateFeedback(score, isCorrect) {
        // Requirements: 5.7 - 得分低于60分显示详细的改进建议
        if (!isCorrect) {
            return {
                title: '判定失误',
                message: '你的鉴别结论与正确答案不符，请仔细分析线索证据。',
                suggestions: [
                    '复习GB 5085系列标准的判定条件',
                    '注意分析废物来源和产生工艺特征',
                    '关注超标检测项目与危险特性的对应关系',
                    '建议重新挑战本案件，加深理解'
                ]
            };
        }
        
        // Requirements: 5.6 - 得分达到90分以上显示"金牌侦探"成就
        if (score >= 90) {
            return {
                title: '完美破案！',
                message: '你展现了出色的危废鉴别能力，高效精准地完成了任务！',
                suggestions: []
            };
        } else if (score >= 70) {
            return {
                title: '案件告破',
                message: '你成功完成了鉴别任务，但还有提升空间。',
                suggestions: ['尝试减少不必要的检测', '提高检测选择的针对性']
            };
        } else {
            return {
                title: '勉强过关',
                message: '虽然判定正确，但检测效率有待提高。',
                suggestions: ['学习更多危废鉴别知识', '分析最优检测路径', '控制预算使用']
            };
        }
    }

    /**
     * 保存游戏记录
     * @param {ScoreResult} scoreResult
     */
    saveGameRecord(scoreResult) {
        const record = {
            id: `record_${Date.now()}`,
            caseId: this.currentCase.id,
            caseName: this.currentCase.name,
            score: scoreResult.totalScore,
            grade: scoreResult.grade,
            elapsedTime: this.gameState.elapsedTime,
            purchasePath: this.gameState.purchasedItems.map(p => p.itemId),
            judgment: this.gameState.judgment,
            timestamp: Date.now()
        };
        
        this.saveToHistory(record);
    }
    
    /**
     * 显示结果
     * @param {boolean} isCorrect
     * @param {ScoreResult} scoreResult
     * @param {Object} validationDetails - 验证详情
     */
    showResult(isCorrect, scoreResult, validationDetails = {}) {
        const container = document.getElementById('result-content');
        const titleEl = document.getElementById('result-title');
        
        if (!container || !titleEl) return;
        
        const gradeConfig = GRADE_CONFIG[scoreResult.grade];
        
        // Requirements: 4.5, 4.6 - 显示成功/失败结局
        if (isCorrect) {
            // 成功结局 - Requirements: 4.5
            titleEl.innerHTML = '🎉 案件告破！';
            container.innerHTML = this.renderSuccessResult(scoreResult, gradeConfig, validationDetails);
            
            // 如果是金牌，播放庆祝动画
            if (scoreResult.grade === 'gold_detective' && typeof confetti !== 'undefined') {
                setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }, 300);
            }
        } else {
            // 失败结局 - Requirements: 4.6
            titleEl.innerHTML = '❌ 判定失误';
            container.innerHTML = this.renderFailureResult(scoreResult, gradeConfig, validationDetails);
        }
        
        // 显示结果模态框
        openModal('result-modal');
    }
    
    /**
     * 渲染成功结局
     * Requirements: 4.5 - 显示成功结局动画和详细评分
     * @param {ScoreResult} scoreResult
     * @param {Object} gradeConfig
     * @param {Object} validationDetails
     * @returns {string} HTML字符串
     */
    renderSuccessResult(scoreResult, gradeConfig, validationDetails) {
        return `
            <!-- 成功动画区域 -->
            <div style="text-align: center; margin-bottom: 30px; animation: fadeInUp 0.5s ease-out;">
                <div style="font-size: 5rem; margin-bottom: 15px; animation: bounce 1s ease infinite;">${gradeConfig.icon}</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: ${gradeConfig.color};">${gradeConfig.name}</div>
                <div style="font-size: 3rem; font-weight: bold; margin: 15px 0;">
                    ${scoreResult.totalScore}<span style="font-size: 1rem; color: var(--text-muted);">分</span>
                </div>
                <div style="font-size: 0.9rem; color: var(--detective-green);">
                    ✓ 成功识别危险废物，保护了环境安全！
                </div>
            </div>
            
            <!-- 评分明细 -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <div style="font-weight: bold; margin-bottom: 15px;">📊 评分明细</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: rgba(42, 157, 143, 0.1); padding: 12px; border-radius: 10px; border: 1px solid rgba(42, 157, 143, 0.3);">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">判定准确性 (40%)</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: var(--detective-green);">${scoreResult.breakdown.accuracy}分</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">预算效率 (30%)</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: ${scoreResult.breakdown.budgetEfficiency >= 70 ? 'var(--detective-green)' : 'var(--detective-gold)'};">${scoreResult.breakdown.budgetEfficiency}分</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">路径合理性 (20%)</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: ${scoreResult.breakdown.pathRationality >= 70 ? 'var(--detective-green)' : 'var(--detective-gold)'};">${scoreResult.breakdown.pathRationality}分</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">用时得分 (10%)</div>
                        <div style="font-size: 1.3rem; font-weight: bold;">${scoreResult.breakdown.timeScore}分</div>
                    </div>
                </div>
            </div>
            
            ${scoreResult.achievements.length > 0 ? `
                <!-- 成就展示 -->
                <div style="background: linear-gradient(135deg, rgba(244, 162, 97, 0.15) 0%, rgba(244, 162, 97, 0.05) 100%); border: 2px solid var(--detective-gold); border-radius: 15px; padding: 20px; margin-bottom: 20px; animation: glow 2s ease-in-out infinite;">
                    <div style="font-weight: bold; margin-bottom: 15px; color: var(--detective-gold);">🏆 获得成就</div>
                    ${scoreResult.achievements.map(a => `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                            <span style="font-size: 2rem;">${a.icon}</span>
                            <div>
                                <div style="font-weight: bold; font-size: 1.1rem;">${a.name}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">${a.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- 反馈信息 -->
            <div style="background: rgba(42, 157, 143, 0.1); border: 1px solid var(--detective-green); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <div style="font-weight: bold; margin-bottom: 10px; color: var(--detective-green);">💬 ${scoreResult.feedback.title}</div>
                <div style="color: var(--text-light); margin-bottom: 10px;">${scoreResult.feedback.message}</div>
                ${scoreResult.feedback.suggestions.length > 0 ? `
                    <div style="font-size: 0.9rem; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="margin-bottom: 8px; color: var(--text-muted);">💡 进一步提升建议：</div>
                        <ul style="margin: 0; padding-left: 20px; color: var(--text-muted);">
                            ${scoreResult.feedback.suggestions.map(s => `<li style="margin-bottom: 5px;">${s}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            
            <!-- 操作按钮 -->
            <div style="display: flex; gap: 10px;">
                <button onclick="game.replayCurrentCase()" style="flex: 1; padding: 15px; border: 2px solid var(--detective-accent); border-radius: 10px; background: transparent; color: var(--detective-accent); font-weight: bold; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(233, 69, 96, 0.1)'" onmouseout="this.style.background='transparent'">
                    🔄 重玩本案
                </button>
                <button onclick="closeModal('result-modal'); game.renderCaseList(); openModal('caselist-modal');" style="flex: 1; padding: 15px; border: none; border-radius: 10px; background: linear-gradient(135deg, var(--detective-green) 0%, #238b7e 100%); color: white; font-weight: bold; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    📋 挑战新案件
                </button>
            </div>
        `;
    }
    
    /**
     * 渲染失败结局
     * Requirements: 4.6 - 显示失败结局和后果说明
     * @param {ScoreResult} scoreResult
     * @param {Object} gradeConfig
     * @param {Object} validationDetails
     * @returns {string} HTML字符串
     */
    renderFailureResult(scoreResult, gradeConfig, validationDetails) {
        // 根据判定错误类型生成后果说明
        const consequences = this.generateConsequences(validationDetails);
        
        // 获取正确答案信息
        const correctAnswer = this.currentCase?.correctAnswer;
        const correctCharNames = (correctAnswer?.hazardCharacteristics || [])
            .map(c => HAZARD_CHARACTERISTICS[c]?.name || c)
            .join('、');
        
        return `
            <!-- 失败提示区域 -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 5rem; margin-bottom: 15px;">😔</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--detective-accent);">判定失误</div>
                <div style="font-size: 2rem; font-weight: bold; margin: 15px 0; color: var(--text-muted);">
                    ${scoreResult.totalScore}<span style="font-size: 1rem;">分</span>
                </div>
            </div>
            
            <!-- 后果说明 - Requirements: 4.6 -->
            <div style="background: linear-gradient(135deg, rgba(233, 69, 96, 0.15) 0%, rgba(233, 69, 96, 0.05) 100%); border: 2px solid var(--detective-accent); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <div style="font-weight: bold; margin-bottom: 15px; color: var(--detective-accent); display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.3rem;">⚠️</span>
                    <span>判定失误后果</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${consequences.map(c => `
                        <div style="display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                            <span style="font-size: 1.3rem;">${c.icon}</span>
                            <div>
                                <div style="font-weight: bold; color: var(--detective-accent);">${c.title}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${c.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- 正确答案揭示 -->
            <div style="background: rgba(69, 123, 157, 0.15); border: 1px solid var(--detective-blue); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <div style="font-weight: bold; margin-bottom: 15px; color: var(--detective-blue);">📋 正确答案</div>
                <div style="display: grid; gap: 10px;">
                    <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <span style="color: var(--text-muted);">正确判定：</span>
                        <span style="font-weight: bold;">${correctAnswer?.result === 'hazardous' ? '☠️ 危险废物' : '✅ 一般固废'}</span>
                    </div>
                    ${correctAnswer?.result === 'hazardous' ? `
                        <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            <span style="color: var(--text-muted);">危险特性：</span>
                            <span style="font-weight: bold;">${correctCharNames || '无'}</span>
                        </div>
                    ` : ''}
                    ${validationDetails.missingCharacteristics?.length > 0 ? `
                        <div style="padding: 10px; background: rgba(233, 69, 96, 0.1); border-radius: 8px;">
                            <span style="color: var(--detective-accent); font-size: 0.85rem;">
                                ❌ 您遗漏的危险特性：${validationDetails.missingCharacteristics.map(c => HAZARD_CHARACTERISTICS[c]?.name || c).join('、')}
                            </span>
                        </div>
                    ` : ''}
                    ${validationDetails.extraCharacteristics?.length > 0 ? `
                        <div style="padding: 10px; background: rgba(244, 162, 97, 0.1); border-radius: 8px;">
                            <span style="color: var(--detective-gold); font-size: 0.85rem;">
                                ⚠️ 您多选的危险特性：${validationDetails.extraCharacteristics.map(c => HAZARD_CHARACTERISTICS[c]?.name || c).join('、')}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- 学习建议 -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <div style="font-weight: bold; margin-bottom: 10px;">📚 学习建议</div>
                <ul style="margin: 0; padding-left: 20px; color: var(--text-muted); line-height: 1.8;">
                    <li>仔细分析废物来源和产生工艺</li>
                    <li>关注超标的检测项目，它们是关键线索</li>
                    <li>复习GB 5085系列标准的判定条件</li>
                    <li>注意危险特性与检测项目的对应关系</li>
                </ul>
            </div>
            
            <!-- 操作按钮 -->
            <div style="display: flex; gap: 10px;">
                <button onclick="game.replayCurrentCase()" style="flex: 1; padding: 15px; border: none; border-radius: 10px; background: linear-gradient(135deg, var(--detective-accent) 0%, #c73e54 100%); color: white; font-weight: bold; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    🔄 重新挑战
                </button>
                <button onclick="closeModal('result-modal'); game.renderCaseList(); openModal('caselist-modal');" style="flex: 1; padding: 15px; border: 2px solid var(--text-muted); border-radius: 10px; background: transparent; color: var(--text-muted); font-weight: bold; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--text-light)'; this.style.color='var(--text-light)'" onmouseout="this.style.borderColor='var(--text-muted)'; this.style.color='var(--text-muted)'">
                    📋 选择其他案件
                </button>
            </div>
        `;
    }
    
    /**
     * 生成判定失误的后果说明
     * Requirements: 4.6 - 显示后果说明（环境污染/刑责/资源浪费）
     * @param {Object} validationDetails - 验证详情
     * @returns {Array<{icon: string, title: string, description: string}>}
     */
    generateConsequences(validationDetails) {
        const consequences = [];
        const correctResult = validationDetails.expectedResult;
        const judgment = this.gameState?.judgment;
        
        if (!judgment) return consequences;
        
        // 情况1：将危险废物误判为一般固废 - 最严重
        if (correctResult === 'hazardous' && judgment.result === 'non_hazardous') {
            consequences.push({
                icon: '🏭',
                title: '环境污染风险',
                description: '危险废物被当作一般固废处置，可能导致土壤、地下水污染，造成严重的生态破坏。'
            });
            consequences.push({
                icon: '⚖️',
                title: '法律责任',
                description: '根据《固体废物污染环境防治法》，非法处置危险废物可能面临行政处罚甚至刑事责任。'
            });
            consequences.push({
                icon: '💰',
                title: '经济损失',
                description: '后续的环境修复费用可能高达数百万元，远超正规处置成本。'
            });
        }
        // 情况2：将一般固废误判为危险废物 - 资源浪费
        else if (correctResult === 'non_hazardous' && judgment.result === 'hazardous') {
            consequences.push({
                icon: '💸',
                title: '资源浪费',
                description: '一般固废按危险废物处置，处置费用将增加5-10倍，造成不必要的经济负担。'
            });
            consequences.push({
                icon: '🏗️',
                title: '处置资源占用',
                description: '占用宝贵的危废处置能力，可能导致真正的危险废物无法及时处置。'
            });
        }
        // 情况3：危险特性判定错误
        else if (correctResult === 'hazardous' && judgment.result === 'hazardous') {
            if (validationDetails.missingCharacteristics?.length > 0) {
                consequences.push({
                    icon: '🔍',
                    title: '危险特性遗漏',
                    description: '未能识别全部危险特性，可能导致处置方案不完善，存在安全隐患。'
                });
            }
            if (validationDetails.extraCharacteristics?.length > 0) {
                consequences.push({
                    icon: '📋',
                    title: '过度鉴定',
                    description: '错误添加了不存在的危险特性，可能导致处置方案过于复杂，增加不必要的成本。'
                });
            }
        }
        // 情况4：选择需进一步鉴别
        else if (judgment.result === 'need_further') {
            consequences.push({
                icon: '⏰',
                title: '延误处置',
                description: '在证据充分的情况下选择进一步鉴别，会延误废物的及时处置，增加存储风险。'
            });
            consequences.push({
                icon: '💰',
                title: '额外成本',
                description: '不必要的补充检测会增加鉴别成本和时间成本。'
            });
        }
        
        // 如果没有具体后果，添加通用提示
        if (consequences.length === 0) {
            consequences.push({
                icon: '📝',
                title: '判定不准确',
                description: '您的判定与正确答案不符，请仔细分析线索证据，重新进行判定。'
            });
        }
        
        return consequences;
    }
    
    /**
     * 重玩当前案件
     */
    replayCurrentCase() {
        if (this.currentCase) {
            closeModal('result-modal');
            this.loadCase(this.currentCase.id);
        }
    }

    // ==================== 案件列表与历史记录 ====================
    
    /**
     * 渲染案件列表
     */
    renderCaseList() {
        const container = document.getElementById('case-list');
        if (!container) return;
        
        const caseList = this.getCaseList();
        
        container.innerHTML = caseList.map(c => {
            const diffConfig = DIFFICULTY_CONFIG[c.difficulty];
            return `
                <div class="case-list-item" style="
                    background: rgba(255,255,255,0.05);
                    border: 2px solid rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                " onclick="game.selectCase('${c.id}')" onmouseover="this.style.borderColor='var(--detective-accent)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 5px;">${c.name}</div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 0.85rem; color: ${diffConfig.color};">${'⭐'.repeat(diffConfig.stars)} ${diffConfig.name}</span>
                                ${c.completed ? `<span style="font-size: 0.85rem; color: var(--detective-green);">✓ 已完成</span>` : ''}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            ${c.highScore > 0 ? `
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--detective-gold);">${c.highScore}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">最高分</div>
                            ` : `
                                <div style="font-size: 0.9rem; color: var(--text-muted);">未挑战</div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * 选择案件
     * @param {string} caseId
     */
    selectCase(caseId) {
        if (this.hasUnsavedProgress()) {
            if (!confirm('当前游戏进度将丢失，确定要切换案件吗？')) {
                return;
            }
        }
        
        closeModal('caselist-modal');
        this.clearProgress();
        this.loadCase(caseId);
    }
    
    /**
     * 渲染历史记录
     */
    renderHistory() {
        const container = document.getElementById('history-list');
        if (!container) return;
        
        const history = this.getHistory();
        
        if (history.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📜</div>
                    <div>暂无游戏记录</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = history.map(record => {
            const gradeConfig = GRADE_CONFIG[record.grade];
            const date = new Date(record.timestamp);
            const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            const durationStr = `${Math.floor(record.elapsedTime / 60)}:${(record.elapsedTime % 60).toString().padStart(2, '0')}`;
            
            return `
                <div class="history-item" style="
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="font-size: 2rem;">${gradeConfig.icon}</div>
                        <div>
                            <div style="font-weight: bold;">${record.caseName}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">${timeStr} · 用时 ${durationStr}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${gradeConfig.color};">${record.score}</div>
                        <button onclick="game.selectCase('${record.caseId}')" style="
                            margin-top: 5px;
                            padding: 5px 12px;
                            border: 1px solid var(--detective-accent);
                            border-radius: 5px;
                            background: transparent;
                            color: var(--detective-accent);
                            font-size: 0.8rem;
                            cursor: pointer;
                        ">重玩</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== 数据加载 ====================
    
    /**
     * 加载检测项目数据
     * 定义6大类检测项目：腐蚀性、急性毒性、浸出毒性、易燃性、反应性、毒性物质含量
     * Requirements: 2.1, 2.2, 3.2
     */
    loadDetectionItems() {
        this.detectionItems = [
            // ==================== 腐蚀性检测 (GB 5085.1) ====================
            { 
                id: 'det_ph', 
                name: 'pH值测定', 
                category: 'corrosivity', 
                price: 200, 
                description: '测定废物浸出液或液态废物的pH值，pH≤2或pH≥12.5判定为腐蚀性危险废物', 
                applicableWasteTypes: ['废酸', '废碱', '污泥', '废水处理污泥'], 
                relatedStandards: ['GB5085.1-4.1'], 
                icon: '🧪', 
                color: '#e94560' 
            },
            
            // ==================== 急性毒性检测 (GB 5085.2) ====================
            { 
                id: 'det_ld50_oral', 
                name: '经口急性毒性(LD50)', 
                category: 'acute_toxicity', 
                price: 1500, 
                description: '测定废物经口摄入的半数致死量，LD50≤200mg/kg为剧毒，≤2000mg/kg为有毒', 
                applicableWasteTypes: ['化学品废物', '农药废物', '医药废物'], 
                relatedStandards: ['GB5085.2-4.1'], 
                icon: '☠️', 
                color: '#9b59b6' 
            },
            { 
                id: 'det_ld50_dermal', 
                name: '经皮急性毒性(LD50)', 
                category: 'acute_toxicity', 
                price: 1500, 
                description: '测定废物经皮肤接触的半数致死量，LD50≤1000mg/kg判定为急性毒性危险废物', 
                applicableWasteTypes: ['化学品废物', '农药废物'], 
                relatedStandards: ['GB5085.2-4.2'], 
                icon: '☠️', 
                color: '#9b59b6' 
            },
            { 
                id: 'det_lc50', 
                name: '吸入急性毒性(LC50)', 
                category: 'acute_toxicity', 
                price: 1800, 
                description: '测定废物吸入的半数致死浓度，LC50≤10mg/L判定为急性毒性危险废物', 
                applicableWasteTypes: ['挥发性废物', '气态废物'], 
                relatedStandards: ['GB5085.2-4.3'], 
                icon: '☠️', 
                color: '#9b59b6' 
            },
            
            // ==================== 浸出毒性检测 (GB 5085.3) ====================
            { 
                id: 'det_pb', 
                name: '铅(Pb)浸出', 
                category: 'leaching_toxicity', 
                price: 500, 
                description: '测定废物浸出液中铅含量，限值5mg/L', 
                applicableWasteTypes: ['电镀污泥', '蓄电池废物', '涂料废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_cd', 
                name: '镉(Cd)浸出', 
                category: 'leaching_toxicity', 
                price: 500, 
                description: '测定废物浸出液中镉含量，限值1mg/L', 
                applicableWasteTypes: ['电镀污泥', '电池废物', '颜料废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_cr6', 
                name: '六价铬(Cr6+)浸出', 
                category: 'leaching_toxicity', 
                price: 600, 
                description: '测定废物浸出液中六价铬含量，限值5mg/L', 
                applicableWasteTypes: ['电镀污泥', '皮革废物', '铬盐废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_hg', 
                name: '汞(Hg)浸出', 
                category: 'leaching_toxicity', 
                price: 800, 
                description: '测定废物浸出液中汞含量，限值0.1mg/L', 
                applicableWasteTypes: ['含汞废物', '电池废物', '荧光灯废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_as', 
                name: '砷(As)浸出', 
                category: 'leaching_toxicity', 
                price: 600, 
                description: '测定废物浸出液中砷含量，限值5mg/L', 
                applicableWasteTypes: ['冶炼废渣', '农药废物', '玻璃废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_cu', 
                name: '铜(Cu)浸出', 
                category: 'leaching_toxicity', 
                price: 400, 
                description: '测定废物浸出液中铜含量，限值100mg/L', 
                applicableWasteTypes: ['电镀污泥', '线路板废物', '铜加工废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_zn', 
                name: '锌(Zn)浸出', 
                category: 'leaching_toxicity', 
                price: 400, 
                description: '测定废物浸出液中锌含量，限值100mg/L', 
                applicableWasteTypes: ['电镀污泥', '冶炼废渣', '镀锌废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_ni', 
                name: '镍(Ni)浸出', 
                category: 'leaching_toxicity', 
                price: 500, 
                description: '测定废物浸出液中镍含量，限值5mg/L', 
                applicableWasteTypes: ['电镀污泥', '电池废物', '催化剂废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_be', 
                name: '铍(Be)浸出', 
                category: 'leaching_toxicity', 
                price: 700, 
                description: '测定废物浸出液中铍含量，限值0.02mg/L', 
                applicableWasteTypes: ['电子废物', '航空废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_ba', 
                name: '钡(Ba)浸出', 
                category: 'leaching_toxicity', 
                price: 450, 
                description: '测定废物浸出液中钡含量，限值100mg/L', 
                applicableWasteTypes: ['钻井废物', '颜料废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            { 
                id: 'det_se', 
                name: '硒(Se)浸出', 
                category: 'leaching_toxicity', 
                price: 600, 
                description: '测定废物浸出液中硒含量，限值1mg/L', 
                applicableWasteTypes: ['电子废物', '玻璃废物'], 
                relatedStandards: ['GB5085.3-4.1'], 
                icon: '💧', 
                color: '#3498db' 
            },
            
            // ==================== 易燃性检测 (GB 5085.4) ====================
            { 
                id: 'det_flash', 
                name: '闪点测定', 
                category: 'flammability', 
                price: 400, 
                description: '测定液态废物的闪点温度，闪点<60°C判定为易燃性危险废物', 
                applicableWasteTypes: ['废矿物油', '废有机溶剂', '涂料废物'], 
                relatedStandards: ['GB5085.4-4.1'], 
                icon: '🔥', 
                color: '#e67e22' 
            },
            { 
                id: 'det_ignition', 
                name: '点燃温度测定', 
                category: 'flammability', 
                price: 500, 
                description: '测定固态废物的点燃温度，在标准条件下易燃判定为易燃性危险废物', 
                applicableWasteTypes: ['有机固废', '橡胶废物', '塑料废物'], 
                relatedStandards: ['GB5085.4-4.2'], 
                icon: '🔥', 
                color: '#e67e22' 
            },
            { 
                id: 'det_oxidizer', 
                name: '氧化性测定', 
                category: 'flammability', 
                price: 600, 
                description: '测定废物的氧化性能，强氧化剂判定为易燃性危险废物', 
                applicableWasteTypes: ['化学品废物', '过氧化物废物'], 
                relatedStandards: ['GB5085.4-4.3'], 
                icon: '🔥', 
                color: '#e67e22' 
            },
            
            // ==================== 反应性检测 (GB 5085.5) ====================
            { 
                id: 'det_cyanide', 
                name: '氰化物反应性', 
                category: 'reactivity', 
                price: 700, 
                description: '测定废物与酸反应产生氰化氢的能力，产生HCN≥250mg/kg判定为反应性危险废物', 
                applicableWasteTypes: ['电镀废物', '化工废物', '热处理废物'], 
                relatedStandards: ['GB5085.5-4.1'], 
                icon: '⚡', 
                color: '#f1c40f' 
            },
            { 
                id: 'det_sulfide', 
                name: '硫化物反应性', 
                category: 'reactivity', 
                price: 700, 
                description: '测定废物与酸反应产生硫化氢的能力，产生H2S≥500mg/kg判定为反应性危险废物', 
                applicableWasteTypes: ['化工废物', '皮革废物', '石油废物'], 
                relatedStandards: ['GB5085.5-4.2'], 
                icon: '⚡', 
                color: '#f1c40f' 
            },
            { 
                id: 'det_explosive', 
                name: '爆炸性测定', 
                category: 'reactivity', 
                price: 1000, 
                description: '测定废物的爆炸性能，具有爆炸性判定为反应性危险废物', 
                applicableWasteTypes: ['化学品废物', '烟火废物'], 
                relatedStandards: ['GB5085.5-4.3'], 
                icon: '⚡', 
                color: '#f1c40f' 
            },
            { 
                id: 'det_water_react', 
                name: '遇水反应性', 
                category: 'reactivity', 
                price: 600, 
                description: '测定废物与水反应产生易燃气体的能力', 
                applicableWasteTypes: ['金属废物', '化学品废物'], 
                relatedStandards: ['GB5085.5-4.4'], 
                icon: '⚡', 
                color: '#f1c40f' 
            },
            
            // ==================== 毒性物质含量检测 (GB 5085.6) ====================
            { 
                id: 'det_benzene', 
                name: '苯含量', 
                category: 'toxic_content', 
                price: 600, 
                description: '测定废物中苯的含量，限值0.5%', 
                applicableWasteTypes: ['废有机溶剂', '化工废物', '涂料废物'], 
                relatedStandards: ['GB5085.6-4.1'], 
                icon: '🔬', 
                color: '#1abc9c' 
            },
            { 
                id: 'det_toluene', 
                name: '甲苯含量', 
                category: 'toxic_content', 
                price: 600, 
                description: '测定废物中甲苯的含量', 
                applicableWasteTypes: ['废有机溶剂', '涂料废物', '油墨废物'], 
                relatedStandards: ['GB5085.6-4.1'], 
                icon: '🔬', 
                color: '#1abc9c' 
            },
            { 
                id: 'det_xylene', 
                name: '二甲苯含量', 
                category: 'toxic_content', 
                price: 600, 
                description: '测定废物中二甲苯的含量', 
                applicableWasteTypes: ['废有机溶剂', '涂料废物'], 
                relatedStandards: ['GB5085.6-4.1'], 
                icon: '🔬', 
                color: '#1abc9c' 
            },
            { 
                id: 'det_pcb', 
                name: '多氯联苯(PCBs)', 
                category: 'toxic_content', 
                price: 1200, 
                description: '测定废物中多氯联苯含量，限值50mg/kg', 
                applicableWasteTypes: ['变压器油', '电容器废物', '电气设备废物'], 
                relatedStandards: ['GB5085.6-4.2'], 
                icon: '🔬', 
                color: '#1abc9c' 
            },
            { 
                id: 'det_oil', 
                name: '矿物油含量', 
                category: 'toxic_content', 
                price: 500, 
                description: '测定废物中矿物油含量，限值5%', 
                applicableWasteTypes: ['废矿物油', '含油污泥', '油泥'], 
                relatedStandards: ['GB5085.6-4.3'], 
                icon: '🔬', 
                color: '#1abc9c' 
            },
            { 
                id: 'det_phenol', 
                name: '酚类化合物', 
                category: 'toxic_content', 
                price: 700, 
                description: '测定废物中酚类化合物含量', 
                applicableWasteTypes: ['化工废物', '焦化废物', '制药废物'], 
                relatedStandards: ['GB5085.6-4.4'], 
                icon: '🔬', 
                color: '#1abc9c' 
            },
            { 
                id: 'det_pah', 
                name: '多环芳烃(PAHs)', 
                category: 'toxic_content', 
                price: 900, 
                description: '测定废物中多环芳烃含量', 
                applicableWasteTypes: ['焦化废物', '石油废物', '沥青废物'], 
                relatedStandards: ['GB5085.6-4.5'], 
                icon: '🔬', 
                color: '#1abc9c' 
            },
            { 
                id: 'det_pesticide', 
                name: '农药残留', 
                category: 'toxic_content', 
                price: 800, 
                description: '测定废物中农药残留含量', 
                applicableWasteTypes: ['农药废物', '农业废物'], 
                relatedStandards: ['GB5085.6-4.6'], 
                icon: '🔬', 
                color: '#1abc9c' 
            }
        ];
    }

    /**
     * 获取预设案件
     * @returns {Case[]}
     */
    getPresetCases() {
        return [
            // 案件1：电镀污泥
            {
                id: 'case_001',
                name: '神秘的电镀厂污泥',
                description: '某电镀厂产生的污泥需要进行危废鉴别',
                difficulty: 'beginner',
                caseFile: {
                    wasteSource: '某电镀厂电镀废水处理产生的污泥，主要来自镀锌、镀镍、镀铬工艺',
                    appearance: '灰绿色泥状物，含水率较高，有少量结块',
                    odor: '轻微刺激性气味',
                    preliminaryData: { ph: 8.5, moisture: 65 },
                    photos: [],
                    additionalInfo: '该厂主要从事金属表面处理，使用含铬、镍、锌的电镀液'
                },
                budget: 5000,
                timeLimit: 600,
                correctAnswer: {
                    result: 'hazardous',
                    hazardCharacteristics: ['toxicity'],
                    requiredEvidence: ['det_cr6', 'det_ni'],
                    standardBasis: ['GB5085.3-4.1']
                },
                optimalPath: ['det_cr6', 'det_ni'],
                optimalCost: 1100,
                detectionResults: {
                    'det_ph': { value: 8.5, unit: '', standardLimit: '2-12.5', isExceeded: false },
                    'det_pb': { value: 2.8, unit: 'mg/L', standardLimit: 5, isExceeded: false },
                    'det_cd': { value: 0.8, unit: 'mg/L', standardLimit: 1, isExceeded: false },
                    'det_cr6': { value: 8.2, unit: 'mg/L', standardLimit: 5, isExceeded: true },
                    'det_hg': { value: 0.05, unit: 'mg/L', standardLimit: 0.1, isExceeded: false },
                    'det_as': { value: 1.2, unit: 'mg/L', standardLimit: 5, isExceeded: false },
                    'det_cu': { value: 45, unit: 'mg/L', standardLimit: 100, isExceeded: false },
                    'det_zn': { value: 85, unit: 'mg/L', standardLimit: 100, isExceeded: false },
                    'det_ni': { value: 6.5, unit: 'mg/L', standardLimit: 5, isExceeded: true },
                    'det_flash': { value: '不适用', unit: '', standardLimit: '60°C', isExceeded: false },
                    'det_cyanide': { value: 0.2, unit: 'mg/kg', standardLimit: 250, isExceeded: false },
                    'det_sulfide': { value: 15, unit: 'mg/kg', standardLimit: 500, isExceeded: false }
                },
                isPreset: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            
            // 案件2：废矿物油
            {
                id: 'case_002',
                name: '汽修厂的废机油',
                description: '某汽车维修厂产生的废机油需要鉴别',
                difficulty: 'beginner',
                caseFile: {
                    wasteSource: '汽车维修厂更换发动机机油产生的废油',
                    appearance: '黑色粘稠液体，有明显油光',
                    odor: '石油类气味，略有焦糊味',
                    preliminaryData: { temperature: 25 },
                    photos: [],
                    additionalInfo: '废油中可能混有少量金属碎屑和燃烧残渣'
                },
                budget: 4000,
                timeLimit: 480,
                correctAnswer: {
                    result: 'hazardous',
                    hazardCharacteristics: ['flammability', 'toxicity'],
                    requiredEvidence: ['det_flash', 'det_oil'],
                    standardBasis: ['GB5085.4-4.1', 'GB5085.6-4.3']
                },
                optimalPath: ['det_flash', 'det_oil'],
                optimalCost: 900,
                detectionResults: {
                    'det_ph': { value: 6.8, unit: '', standardLimit: '2-12.5', isExceeded: false },
                    'det_flash': { value: 45, unit: '°C', standardLimit: 60, isExceeded: true },
                    'det_oil': { value: 92, unit: '%', standardLimit: 5, isExceeded: true },
                    'det_pb': { value: 1.2, unit: 'mg/L', standardLimit: 5, isExceeded: false },
                    'det_benzene': { value: 0.3, unit: '%', standardLimit: 0.5, isExceeded: false },
                    'det_pcb': { value: 2, unit: 'mg/kg', standardLimit: 50, isExceeded: false }
                },
                isPreset: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            
            // 案件3：废酸液
            {
                id: 'case_003',
                name: '化工厂的废酸',
                description: '某化工厂产生的废酸液需要鉴别',
                difficulty: 'intermediate',
                caseFile: {
                    wasteSource: '化工厂酸洗工艺产生的废酸液',
                    appearance: '淡黄色透明液体',
                    odor: '强烈刺激性酸味',
                    preliminaryData: { ph: 1.2, temperature: 22 },
                    photos: [],
                    additionalInfo: '废酸主要成分为盐酸和硫酸混合物'
                },
                budget: 3500,
                timeLimit: 420,
                correctAnswer: {
                    result: 'hazardous',
                    hazardCharacteristics: ['corrosivity'],
                    requiredEvidence: ['det_ph'],
                    standardBasis: ['GB5085.1-4.1']
                },
                optimalPath: ['det_ph'],
                optimalCost: 200,
                detectionResults: {
                    'det_ph': { value: 1.2, unit: '', standardLimit: 2, isExceeded: true },
                    'det_pb': { value: 0.5, unit: 'mg/L', standardLimit: 5, isExceeded: false },
                    'det_cd': { value: 0.1, unit: 'mg/L', standardLimit: 1, isExceeded: false },
                    'det_cr6': { value: 0.8, unit: 'mg/L', standardLimit: 5, isExceeded: false },
                    'det_flash': { value: '不适用', unit: '', standardLimit: '60°C', isExceeded: false }
                },
                isPreset: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            
            // 案件4：医疗废物
            {
                id: 'case_004',
                name: '医院的感染性废物',
                description: '某医院产生的医疗废物需要鉴别',
                difficulty: 'intermediate',
                caseFile: {
                    wasteSource: '某三甲医院感染科产生的医疗废物，包括使用过的注射器、输液管、敷料等',
                    appearance: '混合物，包含塑料制品、纱布、棉签等，部分带有血迹',
                    odor: '轻微异味',
                    preliminaryData: { moisture: 35 },
                    photos: [],
                    additionalInfo: '废物来自传染病区，可能接触过乙肝、丙肝等传染性病原体'
                },
                budget: 4000,
                timeLimit: 480,
                correctAnswer: {
                    result: 'hazardous',
                    hazardCharacteristics: ['infectivity', 'toxicity'],
                    requiredEvidence: ['det_ld50_oral'],
                    standardBasis: ['GB5085.2-4.1']
                },
                optimalPath: ['det_ld50_oral'],
                optimalCost: 1500,
                detectionResults: {
                    'det_ph': { value: 7.2, unit: '', standardLimit: '2-12.5', isExceeded: false },
                    'det_ld50_oral': { value: 180, unit: 'mg/kg', standardLimit: 200, isExceeded: true },
                    'det_ld50_dermal': { value: 850, unit: 'mg/kg', standardLimit: 1000, isExceeded: true },
                    'det_pb': { value: 0.3, unit: 'mg/L', standardLimit: 5, isExceeded: false },
                    'det_hg': { value: 0.02, unit: 'mg/L', standardLimit: 0.1, isExceeded: false },
                    'det_flash': { value: '不适用', unit: '', standardLimit: '60°C', isExceeded: false }
                },
                isPreset: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            
            // 案件5：废有机溶剂
            {
                id: 'case_005',
                name: '印刷厂的废溶剂',
                description: '某印刷厂产生的废有机溶剂需要鉴别',
                difficulty: 'advanced',
                caseFile: {
                    wasteSource: '印刷厂清洗印刷设备产生的废有机溶剂，主要使用甲苯、二甲苯作为清洗剂',
                    appearance: '无色至淡黄色液体，有明显分层现象',
                    odor: '强烈刺激性有机溶剂气味',
                    preliminaryData: { temperature: 20 },
                    photos: [],
                    additionalInfo: '废溶剂中混有少量油墨残渣和金属颗粒'
                },
                budget: 6000,
                timeLimit: 600,
                correctAnswer: {
                    result: 'hazardous',
                    hazardCharacteristics: ['flammability', 'toxicity'],
                    requiredEvidence: ['det_flash', 'det_toluene', 'det_xylene'],
                    standardBasis: ['GB5085.4-4.1', 'GB5085.6-4.1']
                },
                optimalPath: ['det_flash', 'det_toluene', 'det_xylene'],
                optimalCost: 1600,
                detectionResults: {
                    'det_ph': { value: 6.5, unit: '', standardLimit: '2-12.5', isExceeded: false },
                    'det_flash': { value: 28, unit: '°C', standardLimit: 60, isExceeded: true },
                    'det_benzene': { value: 0.8, unit: '%', standardLimit: 0.5, isExceeded: true },
                    'det_toluene': { value: 35, unit: '%', standardLimit: 1, isExceeded: true },
                    'det_xylene': { value: 42, unit: '%', standardLimit: 1, isExceeded: true },
                    'det_pb': { value: 1.5, unit: 'mg/L', standardLimit: 5, isExceeded: false },
                    'det_oil': { value: 8, unit: '%', standardLimit: 5, isExceeded: true }
                },
                isPreset: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];
    }
}

// ==================== 全局辅助函数 ====================

/**
 * 选择判定结果
 * Requirements: 4.1 - 显示判定选项
 * @param {string} result
 */
function selectJudgmentResult(result) {
    // 移除所有选中状态
    document.querySelectorAll('.judgment-option').forEach(btn => {
        btn.classList.remove('selected');
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
        btn.style.background = 'transparent';
    });
    
    // 添加选中状态
    const selected = document.querySelector(`.judgment-option[data-result="${result}"]`);
    if (selected) {
        selected.classList.add('selected');
        selected.style.borderColor = 'var(--detective-accent)';
        selected.style.background = 'rgba(233, 69, 96, 0.2)';
    }
    
    // 显示/隐藏危险特性和国标选择
    // Requirements: 4.2, 4.3 - 危险特性和国标条款选择
    const hazardSection = document.getElementById('hazard-characteristics-section');
    const standardSection = document.getElementById('standard-basis-section');
    const reasoningSection = document.getElementById('reasoning-section');
    
    if (result === 'hazardous') {
        hazardSection.style.display = 'block';
        standardSection.style.display = 'block';
        if (reasoningSection) reasoningSection.style.display = 'block';
    } else {
        hazardSection.style.display = 'none';
        standardSection.style.display = 'none';
        if (reasoningSection) reasoningSection.style.display = 'none';
    }
    
    // 显示警告提示（如果线索不足）
    updateJudgmentWarning(result);
}

/**
 * 更新危险特性复选框样式
 * @param {HTMLInputElement} checkbox
 */
function updateHazardCheckboxStyle(checkbox) {
    const label = checkbox.closest('.hazard-checkbox');
    if (!label) return;
    
    if (checkbox.checked) {
        label.style.borderColor = 'var(--detective-accent)';
        label.style.background = 'rgba(233, 69, 96, 0.15)';
    } else {
        label.style.borderColor = 'rgba(255,255,255,0.1)';
        label.style.background = 'rgba(255,255,255,0.05)';
    }
}

/**
 * 更新判定警告提示
 * @param {string} result - 选择的判定结果
 */
function updateJudgmentWarning(result) {
    const warningEl = document.getElementById('judgment-warning');
    const warningText = document.getElementById('judgment-warning-text');
    
    if (!warningEl || !warningText || !window.game) return;
    
    const clueStats = window.game.getClueStats();
    const exceededClues = window.game.getExceededClues();
    
    let showWarning = false;
    let warningMessage = '';
    
    // 检查是否有足够的线索
    if (clueStats.total === 0) {
        showWarning = true;
        warningMessage = '您尚未收集任何线索，建议先购买检测项目收集证据';
    } else if (result === 'hazardous' && exceededClues.length === 0) {
        showWarning = true;
        warningMessage = '您选择了"危险废物"，但目前没有超标的检测项目作为证据';
    } else if (result === 'non_hazardous' && exceededClues.length > 0) {
        showWarning = true;
        warningMessage = `您选择了"一般固废"，但有 ${exceededClues.length} 项检测超标，请确认判定`;
    }
    
    if (showWarning) {
        warningEl.style.display = 'block';
        warningText.textContent = warningMessage;
    } else {
        warningEl.style.display = 'none';
    }
}

/**
 * 查看照片
 * @param {string} url
 */
function viewPhoto(url) {
    const viewer = document.getElementById('photo-viewer');
    if (viewer) {
        viewer.src = url;
        openModal('photo-modal');
    }
}

// 导出类供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HazwasteDetective, STORAGE_KEYS, DETECTION_CATEGORIES, HAZARD_CHARACTERISTICS, GRADE_CONFIG, DIFFICULTY_CONFIG };
}
