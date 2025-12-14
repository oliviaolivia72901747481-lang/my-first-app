// ================= 答题历史记录模块 =================
// 提供答题历史的数据获取和筛选功能
// Requirements: 2.1, 2.3, 2.4

/**
 * 获取学生答题历史记录
 * @param {Object} supabaseClient - Supabase 客户端实例
 * @param {string} studentId - 学生ID
 * @param {Object} options - 可选参数 { startDate, endDate, wrongOnly, page, pageSize }
 * @returns {Promise<Object>} { records: [], total, page, pageSize }
 * 
 * Validates: Requirements 2.1, 2.2
 */
async function getAnswerHistory(supabaseClient, studentId, options = {}) {
    const { page = 1, pageSize = 100 } = options;
    
    try {
        // 查询答题记录，关联题目信息
        const { data: records, error, count } = await supabaseClient
            .from('vote_logs')
            .select(`
                id,
                student_id,
                student_name,
                round,
                option,
                is_correct,
                created_at,
                questions (
                    title,
                    answer,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    explanation
                )
            `, { count: 'exact' })
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) {
            console.error('获取答题历史失败:', error);
            return { records: [], total: 0, page, pageSize };
        }

        // 处理数据，展平题目信息
        const processedRecords = (records || []).map(record => ({
            ...record,
            question_title: record.questions?.title || null,
            question_answer: record.questions?.answer || null,
            correct_answer: record.questions?.answer || null,
            explanation: record.questions?.explanation || null,
            options: record.questions ? {
                A: record.questions.option_a,
                B: record.questions.option_b,
                C: record.questions.option_c,
                D: record.questions.option_d
            } : null
        }));

        return {
            records: processedRecords,
            total: count || processedRecords.length,
            page,
            pageSize
        };
    } catch (error) {
        console.error('获取答题历史异常:', error);
        return { records: [], total: 0, page, pageSize };
    }
}

/**
 * 筛选答题记录
 * @param {Array} records - 答题记录数组
 * @param {Object} options - 筛选条件 { startDate, endDate, wrongOnly }
 * @returns {Array} 筛选后的记录数组
 * 
 * Property 3: Date Range Filter Correctness
 * For any list of answer records and a date range [startDate, endDate], 
 * the filtered result SHALL contain only records where startDate <= created_at <= endDate.
 * Validates: Requirements 2.3
 * 
 * Property 4: Wrong Answer Filter Correctness
 * For any list of answer records, filtering for wrong answers only 
 * SHALL return exactly the records where is_correct === false.
 * Validates: Requirements 2.4
 */
function filterRecords(records, options = {}) {
    if (!records || !Array.isArray(records)) {
        return [];
    }

    const { startDate, endDate, wrongOnly } = options;
    
    return records.filter(record => {
        // 日期范围筛选
        if (startDate || endDate) {
            const recordDate = new Date(record.created_at);
            
            if (startDate && recordDate < startDate) {
                return false;
            }
            
            if (endDate && recordDate > endDate) {
                return false;
            }
        }
        
        // 错题筛选
        if (wrongOnly && record.is_correct !== false) {
            return false;
        }
        
        return true;
    });
}

/**
 * 按时间倒序排序答题记录
 * @param {Array} records - 答题记录数组
 * @returns {Array} 排序后的记录数组（从新到旧）
 * 
 * Property 2: Answer History Sorting
 * For any list of answer records, sorting by time descending SHALL result in 
 * records ordered from newest to oldest (created_at[i] >= created_at[i+1] for all i).
 * Validates: Requirements 2.1
 */
function sortRecordsByTime(records) {
    if (!records || !Array.isArray(records)) {
        return [];
    }
    
    // 创建副本避免修改原数组
    return [...records].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime(); // 降序（新的在前）
    });
}

// ================= 导出到全局 =================
window.HistoryModule = {
    getAnswerHistory,
    filterRecords,
    sortRecordsByTime
};

// 同时支持 ES 模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAnswerHistory,
        filterRecords,
        sortRecordsByTime
    };
}
