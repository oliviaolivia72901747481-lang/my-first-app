/**
 * 积分系统模块
 * 用于管理学生积分的获取、查询和排行
 */

const PointsSystem = {
    // 积分规则配置
    RULES: {
        SIGN_IN_ONTIME: 5,      // 准时签到
        SIGN_IN_LATE: 2,        // 迟到签到
        ANSWER_CORRECT: 10,     // 答题正确
        ANSWER_PARTICIPATE: 2,  // 参与答题
        BUZZER_WIN: 5,          // 抢答成功
        BUZZER_CORRECT: 15,     // 抢答答对（包含抢答成功+答对）
        LUCKY_CALLED: 3,        // 被点名
        LUCKY_CORRECT: 12,      // 点名答对（包含被点名+答对）
    },

    // 积分类型
    TYPES: {
        SIGN_IN: 'sign_in',
        ANSWER: 'answer',
        BUZZER: 'buzzer',
        LUCKY: 'lucky',
        BONUS: 'bonus',         // 额外奖励
        PENALTY: 'penalty'      // 扣分
    },

    /**
     * 添加积分记录
     * @param {object} supabase - Supabase客户端
     * @param {string} studentId - 学号
     * @param {string} studentName - 姓名
     * @param {number} points - 积分数量（可为负数）
     * @param {string} type - 积分类型
     * @param {string} reason - 积分原因描述
     * @param {object} metadata - 额外元数据（如题目ID等）
     */
    async addPoints(supabase, studentId, studentName, points, type, reason, metadata = {}) {
        try {
            console.log(`🎯 添加积分: ${studentName}(${studentId}) +${points} [${type}] ${reason}`);
            
            // 1. 插入积分记录
            const { error: logError } = await supabase.from('points_log').insert([{
                student_id: studentId,
                student_name: studentName,
                points: points,
                type: type,
                reason: reason,
                metadata: metadata
            }]);

            if (logError) {
                console.error('❌ 积分记录插入失败:', logError);
                // 如果表不存在，尝试只更新总积分
                if (logError.code === '42P01') {
                    console.warn('⚠️ points_log 表不存在，请执行 SQL 创建表');
                }
                // 继续尝试更新总积分
            }

            // 2. 更新学生总积分（使用upsert）
            const { data: current, error: selectError } = await supabase
                .from('student_points')
                .select('total_points')
                .eq('student_id', studentId)
                .maybeSingle();

            if (selectError && selectError.code === '42P01') {
                console.error('❌ student_points 表不存在，请执行 SQL 创建表');
                return { success: false, error: selectError, points: points };
            }

            const newTotal = (current?.total_points || 0) + points;

            // 尝试更新（兼容新旧表结构）
            const updateData = {
                student_id: studentId,
                student_name: studentName,
                total_points: newTotal,
                updated_at: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('student_points')
                .upsert(updateData, { onConflict: 'student_id' });

            if (updateError) {
                console.error('❌ 总积分更新失败:', updateError);
                return { success: false, error: updateError, points: points };
            }

            console.log(`✅ 积分添加成功: ${studentName} 总计${newTotal}积分`);
            return { success: true, points: points, total: newTotal };
        } catch (e) {
            console.error('❌ 积分操作异常:', e);
            return { success: false, error: e, points: points };
        }
    },

    /**
     * 签到积分
     */
    async addSignInPoints(supabase, studentId, studentName, isLate = false) {
        const points = isLate ? this.RULES.SIGN_IN_LATE : this.RULES.SIGN_IN_ONTIME;
        const reason = isLate ? '迟到签到' : '准时签到';
        return this.addPoints(supabase, studentId, studentName, points, this.TYPES.SIGN_IN, reason);
    },

    /**
     * 答题积分
     */
    async addAnswerPoints(supabase, studentId, studentName, isCorrect, answerMode = 'vote', round = 0) {
        let points = this.RULES.ANSWER_PARTICIPATE;
        let reason = '参与答题';

        if (answerMode === 'buzzer') {
            // 抢答模式
            points = isCorrect ? this.RULES.BUZZER_CORRECT : this.RULES.BUZZER_WIN;
            reason = isCorrect ? '抢答答对' : '抢答成功';
        } else if (answerMode === 'lucky') {
            // 点名模式
            points = isCorrect ? this.RULES.LUCKY_CORRECT : this.RULES.LUCKY_CALLED;
            reason = isCorrect ? '点名答对' : '被点名回答';
        } else {
            // 普通投票模式
            points = isCorrect ? this.RULES.ANSWER_CORRECT : this.RULES.ANSWER_PARTICIPATE;
            reason = isCorrect ? '答题正确' : '参与答题';
        }

        return this.addPoints(supabase, studentId, studentName, points, this.TYPES.ANSWER, reason, { round });
    },

    /**
     * 获取学生积分
     */
    async getStudentPoints(supabase, studentId) {
        const { data, error } = await supabase
            .from('student_points')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) {
            console.error('获取积分失败:', error);
            return 0;
        }
        return data?.total_points || 0;
    },

    /**
     * 获取积分排行榜
     * @param {object} supabase - Supabase客户端
     * @param {object} options - 选项 { type: 'today' | 'total', limit: 20 }
     * @returns {Array} [{ rank, student_id, student_name, points, today_points, total_points }]
     * 
     * Property 5: Leaderboard Ordering
     * For any set of students with points, the leaderboard SHALL be sorted in 
     * descending order by points (points[i] >= points[i+1] for all i).
     * Validates: Requirements 3.1
     * 
     * Property 6: Leaderboard Limit
     * For any leaderboard query with limit N, the result SHALL contain at most N entries.
     * Validates: Requirements 3.1
     */
    async getLeaderboard(supabase, options = {}) {
        const { type = 'total', limit = 20 } = typeof options === 'number' 
            ? { limit: options } 
            : options;
        
        if (type === 'today') {
            return await this.getTodayLeaderboard(supabase, limit);
        }
        
        const { data, error } = await supabase
            .from('student_points')
            .select('*')
            .order('total_points', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('获取排行榜失败:', error);
            return [];
        }
        
        // 添加 rank 字段
        return (data || []).map((student, index) => ({
            ...student,
            rank: index + 1,
            points: student.total_points
        }));
    },
    
    /**
     * 获取今日排行榜
     * @param {object} supabase - Supabase客户端
     * @param {number} limit - 限制数量
     */
    async getTodayLeaderboard(supabase, limit = 20) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 从 points_log 表获取今日积分汇总
        const { data, error } = await supabase
            .from('points_log')
            .select('student_id, student_name, points')
            .gte('created_at', today.toISOString());
        
        if (error) {
            console.error('获取今日排行榜失败:', error);
            // 如果 points_log 表不存在，返回空数组
            return [];
        }
        
        if (!data || data.length === 0) {
            return [];
        }
        
        // 按学生汇总积分
        const studentMap = {};
        data.forEach(log => {
            if (!studentMap[log.student_id]) {
                studentMap[log.student_id] = {
                    student_id: log.student_id,
                    student_name: log.student_name,
                    today_points: 0,
                    total_points: 0
                };
            }
            studentMap[log.student_id].today_points += log.points;
        });
        
        // 转换为数组并排序
        const result = Object.values(studentMap)
            .sort((a, b) => b.today_points - a.today_points)
            .slice(0, limit)
            .map((student, index) => ({
                ...student,
                rank: index + 1,
                points: student.today_points
            }));
        
        return result;
    },
    
    /**
     * 计算学生排名
     * @param {Array} students - 学生数组，包含积分信息
     * @param {string} studentId - 要计算排名的学生ID
     * @param {string} pointsField - 积分字段名 ('today_points' 或 'total_points')
     * @returns {object} { rank, isInTop20 }
     * 
     * Property 7: Student Rank Calculation
     * For any student in a set of students with points, their rank SHALL equal 
     * 1 plus the count of students with strictly higher points.
     * Validates: Requirements 1.4, 3.2, 3.3
     */
    calculateRank(students, studentId, pointsField = 'total_points') {
        if (!students || students.length === 0 || !studentId) {
            return { rank: 0, isInTop20: false };
        }
        
        // 获取当前学生的积分
        const currentStudent = students.find(s => s.student_id === studentId);
        if (!currentStudent) {
            return { rank: 0, isInTop20: false };
        }
        
        const myPoints = currentStudent[pointsField] || 0;
        
        // 计算排名：1 + 比我积分高的学生数量
        let higherCount = 0;
        students.forEach(s => {
            const points = s[pointsField] || 0;
            if (points > myPoints) {
                higherCount++;
            }
        });
        
        const rank = higherCount + 1;
        const isInTop20 = rank <= 20;
        
        return { rank, isInTop20 };
    },

    /**
     * 获取学生积分历史
     */
    async getPointsHistory(supabase, studentId, limit = 50) {
        const { data, error } = await supabase
            .from('points_log')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('获取积分历史失败:', error);
            return [];
        }
        return data || [];
    },

    /**
     * 获取今日积分统计
     */
    async getTodayStats(supabase, studentId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('points_log')
            .select('points, type')
            .eq('student_id', studentId)
            .gte('created_at', today.toISOString());

        if (error || !data) return { total: 0, breakdown: {} };

        const breakdown = {};
        let total = 0;
        data.forEach(log => {
            total += log.points;
            breakdown[log.type] = (breakdown[log.type] || 0) + log.points;
        });

        return { total, breakdown };
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.PointsSystem = PointsSystem;
}
