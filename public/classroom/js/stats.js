// ================= 统计计算模块 =================
// 提供统一的统计计算函数
// Requirements: 1.2, 1.3

/**
 * 计算正确率
 * @param {number} correct - 正确数量
 * @param {number} total - 总数量
 * @returns {number} 百分比数值 (0-100)
 * 
 * Property 1: Statistics Calculation Accuracy
 * accuracy = (correct / count) * 100, or 0 if count is 0
 */
function calculateAccuracy(correct, total) {
    if (total === 0 || total === null || total === undefined) {
        return 0;
    }
    return (correct / total) * 100;
}

/**
 * 计算积分
 * @param {boolean} isCorrect - 是否答对
 * @param {number} basePoints - 基础积分，默认10分
 * @returns {number} 积分数值
 * 
 * Property 8: Points Calculation
 * points = basePoints if isCorrect is true, 0 if isCorrect is false
 * Validates: Requirements 6.1, 6.2, 6.3
 */
function calculatePoints(isCorrect, basePoints = 10) {
    return isCorrect ? basePoints : 0;
}

/**
 * 计算今日统计
 * @param {Array} records - 答题记录数组，每条记录包含 { is_correct, created_at }
 * @returns {Object} { count, correct, accuracy, points }
 * 
 * Validates: Requirements 1.2
 */
function calculateTodayStats(records) {
    if (!records || !Array.isArray(records)) {
        return { count: 0, correct: 0, accuracy: 0, points: 0 };
    }
    
    // 获取今天的日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 筛选今日记录
    const todayRecords = records.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate >= today && recordDate < tomorrow;
    });
    
    return calculateStatsFromRecords(todayRecords);
}

/**
 * 计算总统计
 * @param {Array} records - 答题记录数组，每条记录包含 { is_correct }
 * @returns {Object} { count, correct, accuracy, points }
 * 
 * Validates: Requirements 1.3
 */
function calculateTotalStats(records) {
    if (!records || !Array.isArray(records)) {
        return { count: 0, correct: 0, accuracy: 0, points: 0 };
    }
    
    return calculateStatsFromRecords(records);
}

/**
 * 从记录数组计算统计数据（内部函数）
 * @param {Array} records - 答题记录数组
 * @returns {Object} { count, correct, accuracy, points }
 */
function calculateStatsFromRecords(records) {
    const count = records.length;
    const correct = records.filter(r => r.is_correct === true).length;
    const accuracy = calculateAccuracy(correct, count);
    const points = correct * 10; // 每道正确题目10分
    
    return { count, correct, accuracy, points };
}

// ================= 导出到全局 =================
window.ClassroomStats = {
    calculateAccuracy,
    calculatePoints,
    calculateTodayStats,
    calculateTotalStats,
    calculateStatsFromRecords
};

// 同时支持 ES 模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateAccuracy,
        calculatePoints,
        calculateTodayStats,
        calculateTotalStats,
        calculateStatsFromRecords
    };
}
