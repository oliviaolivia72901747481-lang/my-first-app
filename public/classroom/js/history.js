/**
 * 课堂历史数据管理模块
 * 用于存档、查询和分析历史课堂数据
 */

const ClassHistory = {
    /**
     * 创建课堂会话存档
     * @param {object} supabase - Supabase客户端
     * @param {object} sessionInfo - 课堂信息 {class_name, course_name, teacher_name}
     * @returns {object} 存档结果
     */
    async archiveSession(supabase, sessionInfo = {}) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        
        try {
            console.log('📦 开始存档课堂数据...');
            
            // 1. 获取今日所有数据
            const { data: attendance } = await supabase
                .from('attendance')
                .select('*')
                .gte('created_at', today);
            
            const { data: voteLogs } = await supabase
                .from('vote_logs')
                .select('*')
                .gte('created_at', today);
            
            const { data: pointsLogs } = await supabase
                .from('points_log')
                .select('*')
                .gte('created_at', today);
            
            const { data: studentPoints } = await supabase
                .from('student_points')
                .select('*');
            
            // 如果没有数据，不创建存档
            if ((!attendance || attendance.length === 0) && 
                (!voteLogs || voteLogs.length === 0)) {
                console.log('⚠️ 没有数据需要存档');
                return { success: false, message: '没有数据需要存档' };
            }
            
            // 2. 计算统计数据
            const attendanceCount = attendance?.length || 0;
            const answerCount = voteLogs?.length || 0;
            const correctCount = voteLogs?.filter(v => v.is_correct).length || 0;
            const correctRate = answerCount > 0 ? Math.round(correctCount / answerCount * 100) : 0;
            const pointsDistributed = pointsLogs?.reduce((sum, p) => sum + p.points, 0) || 0;
            
            // 计算题目数量（按轮次去重）
            const questionRounds = [...new Set(voteLogs?.map(v => v.round) || [])];
            const questionCount = questionRounds.length;
            
            // 计算课程时长
            const firstRecord = attendance?.[0]?.created_at || voteLogs?.[0]?.created_at;
            const startTime = firstRecord ? new Date(firstRecord) : now;
            const durationMinutes = Math.round((now - startTime) / 60000);
            
            // 3. 创建课堂会话记录
            const { data: session, error: sessionError } = await supabase
                .from('class_sessions')
                .insert([{
                    class_name: sessionInfo.class_name || '默认班级',
                    course_name: sessionInfo.course_name || '课堂互动',
                    teacher_name: sessionInfo.teacher_name || '',
                    start_time: startTime.toISOString(),
                    end_time: now.toISOString(),
                    duration_minutes: durationMinutes,
                    attendance_count: attendanceCount,
                    answer_count: answerCount,
                    correct_count: correctCount,
                    correct_rate: correctRate,
                    points_distributed: pointsDistributed,
                    question_count: questionCount,
                    metadata: {
                        archived_at: now.toISOString(),
                        version: '1.0'
                    }
                }])
                .select()
                .single();
            
            if (sessionError) {
                console.error('❌ 创建会话记录失败:', sessionError);
                return { success: false, error: sessionError };
            }
            
            const sessionId = session.session_id;
            console.log('✅ 会话记录已创建:', sessionId);
            
            // 4. 存档学生数据
            const studentMap = {};
            
            // 从签到记录构建学生数据
            (attendance || []).forEach(a => {
                studentMap[a.student_id] = {
                    session_id: sessionId,
                    student_id: a.student_id,
                    student_name: a.student_name,
                    signed: true,
                    sign_time: a.created_at,
                    is_late: a.is_late || false,
                    answer_count: 0,
                    correct_count: 0,
                    session_points: 0,
                    total_points_before: 0,
                    total_points_after: 0,
                    answer_details: [],
                    points_details: []
                };
            });
            
            // 添加答题统计
            (voteLogs || []).forEach(v => {
                if (!studentMap[v.student_id]) {
                    studentMap[v.student_id] = {
                        session_id: sessionId,
                        student_id: v.student_id,
                        student_name: v.student_name,
                        signed: false,
                        answer_count: 0,
                        correct_count: 0,
                        session_points: 0,
                        answer_details: [],
                        points_details: []
                    };
                }
                studentMap[v.student_id].answer_count++;
                if (v.is_correct) studentMap[v.student_id].correct_count++;
                studentMap[v.student_id].answer_details.push({
                    round: v.round,
                    answer: v.answer,
                    is_correct: v.is_correct,
                    time: v.created_at
                });
            });
            
            // 添加积分统计
            (pointsLogs || []).forEach(p => {
                if (studentMap[p.student_id]) {
                    studentMap[p.student_id].session_points += p.points;
                    studentMap[p.student_id].points_details.push({
                        points: p.points,
                        type: p.type,
                        reason: p.reason,
                        time: p.created_at
                    });
                }
            });
            
            // 添加总积分信息
            (studentPoints || []).forEach(s => {
                if (studentMap[s.student_id]) {
                    studentMap[s.student_id].total_points_after = s.total_points;
                    studentMap[s.student_id].total_points_before = 
                        s.total_points - (studentMap[s.student_id].session_points || 0);
                }
            });
            
            // 计算正确率
            Object.values(studentMap).forEach(s => {
                s.correct_rate = s.answer_count > 0 
                    ? Math.round(s.correct_count / s.answer_count * 100) 
                    : 0;
            });
            
            // 批量插入学生快照
            const studentSnapshots = Object.values(studentMap);
            if (studentSnapshots.length > 0) {
                const { error: snapshotError } = await supabase
                    .from('class_student_snapshots')
                    .insert(studentSnapshots);
                
                if (snapshotError) {
                    console.error('❌ 学生快照存档失败:', snapshotError);
                } else {
                    console.log(`✅ 已存档 ${studentSnapshots.length} 名学生数据`);
                }
            }
            
            // 5. 存档题目数据（按轮次汇总）
            const questionMap = {};
            (voteLogs || []).forEach(v => {
                const round = v.round || 1;
                if (!questionMap[round]) {
                    questionMap[round] = {
                        session_id: sessionId,
                        question_round: round,
                        question_title: v.question_title || `第${round}题`,
                        correct_answer: v.correct_answer || '',
                        answer_mode: v.answer_mode || 'vote',
                        total_answers: 0,
                        option_a_count: 0,
                        option_b_count: 0,
                        option_c_count: 0,
                        option_d_count: 0,
                        correct_count: 0
                    };
                }
                questionMap[round].total_answers++;
                const answer = (v.answer || '').toUpperCase();
                if (answer === 'A') questionMap[round].option_a_count++;
                if (answer === 'B') questionMap[round].option_b_count++;
                if (answer === 'C') questionMap[round].option_c_count++;
                if (answer === 'D') questionMap[round].option_d_count++;
                if (v.is_correct) questionMap[round].correct_count++;
            });
            
            // 计算题目正确率
            Object.values(questionMap).forEach(q => {
                q.correct_rate = q.total_answers > 0 
                    ? Math.round(q.correct_count / q.total_answers * 100) 
                    : 0;
            });
            
            const questionSnapshots = Object.values(questionMap);
            if (questionSnapshots.length > 0) {
                const { error: questionError } = await supabase
                    .from('class_question_snapshots')
                    .insert(questionSnapshots);
                
                if (questionError) {
                    console.error('❌ 题目快照存档失败:', questionError);
                } else {
                    console.log(`✅ 已存档 ${questionSnapshots.length} 道题目数据`);
                }
            }
            
            console.log('🎉 课堂数据存档完成!');
            return { 
                success: true, 
                sessionId: sessionId,
                stats: {
                    attendanceCount,
                    answerCount,
                    correctRate,
                    pointsDistributed,
                    questionCount,
                    studentCount: studentSnapshots.length
                }
            };
            
        } catch (e) {
            console.error('❌ 存档异常:', e);
            return { success: false, error: e };
        }
    },
    
    /**
     * 获取历史课堂列表
     */
    async getSessionList(supabase, limit = 20, offset = 0) {
        const { data, error } = await supabase
            .from('class_sessions')
            .select('*')
            .order('start_time', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) {
            console.error('获取历史列表失败:', error);
            return [];
        }
        return data || [];
    },
    
    /**
     * 获取课堂详情
     */
    async getSessionDetail(supabase, sessionId) {
        // 获取会话基本信息
        const { data: session } = await supabase
            .from('class_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();
        
        // 获取学生快照
        const { data: students } = await supabase
            .from('class_student_snapshots')
            .select('*')
            .eq('session_id', sessionId)
            .order('session_points', { ascending: false });
        
        // 获取题目快照
        const { data: questions } = await supabase
            .from('class_question_snapshots')
            .select('*')
            .eq('session_id', sessionId)
            .order('question_round', { ascending: true });
        
        return {
            session: session || null,
            students: students || [],
            questions: questions || []
        };
    },
    
    /**
     * 获取学生历史表现
     */
    async getStudentHistory(supabase, studentId, limit = 20) {
        const { data, error } = await supabase
            .from('class_student_snapshots')
            .select(`
                *,
                class_sessions (
                    session_id,
                    class_name,
                    course_name,
                    start_time
                )
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('获取学生历史失败:', error);
            return [];
        }
        return data || [];
    },
    
    /**
     * 删除历史记录
     */
    async deleteSession(supabase, sessionId) {
        const { error } = await supabase
            .from('class_sessions')
            .delete()
            .eq('session_id', sessionId);
        
        if (error) {
            console.error('删除失败:', error);
            return false;
        }
        return true;
    },
    
    /**
     * 获取统计概览
     */
    async getOverviewStats(supabase, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const { data: sessions } = await supabase
            .from('class_sessions')
            .select('*')
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
        
        return {
            totalSessions: sessions.length,
            totalStudents: sessions.reduce((sum, s) => sum + s.attendance_count, 0),
            avgAttendance: Math.round(sessions.reduce((sum, s) => sum + s.attendance_count, 0) / sessions.length),
            avgCorrectRate: Math.round(sessions.reduce((sum, s) => sum + (s.correct_rate || 0), 0) / sessions.length),
            totalPoints: sessions.reduce((sum, s) => sum + s.points_distributed, 0)
        };
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.ClassHistory = ClassHistory;
}
