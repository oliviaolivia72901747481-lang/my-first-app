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
                console.error('积分记录插入失败:', logError);
                return { success: false, error: logError };
            }

            // 2. 更新学生总积分（使用upsert）
            const { data: current } = await supabase
                .from('student_points')
                .select('total_points')
                .eq('student_id', studentId)
                .maybeSingle();

            const newTotal = (current?.total_points || 0) + points;

            const { error: updateError } = await supabase
                .from('student_points')
                .upsert({
                    student_id: studentId,
                    student_name: studentName,
                    total_points: newTotal,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'student_id' });

            if (updateError) {
                console.error('总积分更新失败:', updateError);
                return { success: false, error: updateError };
            }

            return { success: true, points: points, total: newTotal };
        } catch (e) {
            console.error('积分操作异常:', e);
            return { success: false, error: e };
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
     */
    async getLeaderboard(supabase, limit = 20) {
        const { data, error } = await supabase
            .from('student_points')
            .select('*')
            .order('total_points', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('获取排行榜失败:', error);
            return [];
        }
        return data || [];
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
