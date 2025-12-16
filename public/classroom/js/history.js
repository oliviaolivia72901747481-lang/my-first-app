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

// ================= 课堂历史记录模块 =================
// 提供课堂会话的存档、查询和管理功能

const ClassHistory = {
    /**
     * 存档当前课堂会话数据
     * @param {Object} supabaseClient - Supabase 客户端实例
     * @param {Object} sessionData - 会话数据 { class_name, course_name }
     * @returns {Promise<Object>} 存档结果
     */
    async archiveSession(supabaseClient, sessionData) {
        try {
            const sessionId = 'session_' + Date.now();
            const today = new Date().toISOString().split('T')[0];
            
            // 获取今日签到数据
            const { count: attendanceCount } = await supabaseClient
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today);
            
            // 获取今日答题数据
            const { data: voteLogs } = await supabaseClient
                .from('vote_logs')
                .select('is_correct')
                .gte('created_at', today);
            
            const answerCount = voteLogs?.length || 0;
            const correctCount = voteLogs?.filter(v => v.is_correct).length || 0;
            const correctRate = answerCount > 0 ? Math.round((correctCount / answerCount) * 100) : 0;
            
            // 获取今日积分数据
            const { data: pointsData } = await supabaseClient
                .from('student_points')
                .select('today_points')
                .gte('updated_at', today);
            
            const totalPoints = pointsData?.reduce((sum, p) => sum + (p.today_points || 0), 0) || 0;
            
            // 保存会话记录
            const { error } = await supabaseClient
                .from('class_sessions')
                .insert({
                    session_id: sessionId,
                    class_name: sessionData.class_name || '',
                    course_name: sessionData.course_name || '',
                    start_time: new Date().toISOString(),
                    attendance_count: attendanceCount || 0,
                    answer_count: answerCount,
                    correct_rate: correctRate,
                    points_distributed: totalPoints
                });
            
            if (error) {
                // 如果表不存在，静默失败
                console.warn('保存会话记录失败（表可能不存在）:', error.message);
                return { success: false, sessionId: null };
            }
            
            return { success: true, sessionId };
        } catch (e) {
            console.error('存档会话失败:', e);
            return { success: false, sessionId: null };
        }
    },
    
    /**
     * 获取历史统计概览
     * @param {Object} supabaseClient - Supabase 客户端实例
     * @param {number} days - 统计天数
     * @returns {Promise<Object>} 统计数据
     */
    async getOverviewStats(supabaseClient, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const { data: sessions, count } = await supabaseClient
                .from('class_sessions')
                .select('*', { count: 'exact' })
                .gte('start_time', startDate.toISOString());
            
            if (!sessions || sessions.length === 0) {
                return {
                    totalSessions: 0,
                    totalStudents: 0,
                    avgAttendance: 0,
                    avgCorrectRate: 0,
                    totalPoints: 0
                };
            }
            
            const totalAttendance = sessions.reduce((sum, s) => sum + (s.attendance_count || 0), 0);
            const totalCorrectRate = sessions.reduce((sum, s) => sum + (s.correct_rate || 0), 0);
            const totalPoints = sessions.reduce((sum, s) => sum + (s.points_distributed || 0), 0);
            
            // 获取不重复学生数
            const { count: studentCount } = await supabaseClient
                .from('attendance')
                .select('student_id', { count: 'exact', head: true })
                .gte('created_at', startDate.toISOString());
            
            return {
                totalSessions: count || sessions.length,
                totalStudents: studentCount || 0,
                avgAttendance: Math.round(totalAttendance / sessions.length),
                avgCorrectRate: Math.round(totalCorrectRate / sessions.length),
                totalPoints: totalPoints
            };
        } catch (e) {
            console.error('获取统计概览失败:', e);
            return {
                totalSessions: 0,
                totalStudents: 0,
                avgAttendance: 0,
                avgCorrectRate: 0,
                totalPoints: 0
            };
        }
    },
    
    /**
     * 获取会话列表
     * @param {Object} supabaseClient - Supabase 客户端实例
     * @param {number} limit - 返回数量限制
     * @returns {Promise<Array>} 会话列表
     */
    async getSessionList(supabaseClient, limit = 50) {
        try {
            const { data, error } = await supabaseClient
                .from('class_sessions')
                .select('*')
                .order('start_time', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.warn('获取会话列表失败:', error.message);
                return [];
            }
            
            return data || [];
        } catch (e) {
            console.error('获取会话列表异常:', e);
            return [];
        }
    },
    
    /**
     * 获取会话详情
     * @param {Object} supabaseClient - Supabase 客户端实例
     * @param {string} sessionId - 会话ID
     * @returns {Promise<Object>} 会话详情
     */
    async getSessionDetail(supabaseClient, sessionId) {
        try {
            const { data: session, error } = await supabaseClient
                .from('class_sessions')
                .select('*')
                .eq('session_id', sessionId)
                .single();
            
            if (error || !session) {
                return { session: null, attendance: [], answers: [] };
            }
            
            // 获取该会话时间段的签到记录
            const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
            const { data: attendance } = await supabaseClient
                .from('attendance')
                .select('*')
                .gte('created_at', sessionDate)
                .lt('created_at', sessionDate + 'T23:59:59');
            
            // 获取该会话时间段的答题记录
            const { data: answers } = await supabaseClient
                .from('vote_logs')
                .select('*')
                .gte('created_at', sessionDate)
                .lt('created_at', sessionDate + 'T23:59:59');
            
            return {
                session,
                attendance: attendance || [],
                answers: answers || []
            };
        } catch (e) {
            console.error('获取会话详情失败:', e);
            return { session: null, attendance: [], answers: [] };
        }
    },
    
    /**
     * 删除会话记录
     * @param {Object} supabaseClient - Supabase 客户端实例
     * @param {string} sessionId - 会话ID
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteSession(supabaseClient, sessionId) {
        try {
            const { error } = await supabaseClient
                .from('class_sessions')
                .delete()
                .eq('session_id', sessionId);
            
            if (error) {
                console.error('删除会话失败:', error);
                return false;
            }
            
            return true;
        } catch (e) {
            console.error('删除会话异常:', e);
            return false;
        }
    }
};

// ================= 导出到全局 =================
window.HistoryModule = {
    getAnswerHistory,
    filterRecords,
    sortRecordsByTime
};

window.ClassHistory = ClassHistory;

// 同时支持 ES 模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAnswerHistory,
        filterRecords,
        sortRecordsByTime,
        ClassHistory
    };
}
