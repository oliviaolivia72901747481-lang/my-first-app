-- =====================================================
-- 智慧课堂历史数据存档 - 数据库表结构
-- 请在 Supabase SQL Editor 中执行这些语句
-- =====================================================

-- 1. 课堂会话表 - 记录每节课的基本信息
CREATE TABLE IF NOT EXISTS class_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID DEFAULT gen_random_uuid() UNIQUE,
    class_name VARCHAR(100),           -- 班级名称
    course_name VARCHAR(100),          -- 课程名称
    teacher_name VARCHAR(100),         -- 教师姓名
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,          -- 课程时长（分钟）
    
    -- 统计汇总
    attendance_count INTEGER DEFAULT 0,    -- 签到人数
    answer_count INTEGER DEFAULT 0,        -- 答题总次数
    correct_count INTEGER DEFAULT 0,       -- 正确次数
    correct_rate DECIMAL(5,2),             -- 正确率
    points_distributed INTEGER DEFAULT 0,  -- 发放积分总数
    question_count INTEGER DEFAULT 0,      -- 题目数量
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 课堂学生快照表 - 记录每节课每个学生的详细数据
CREATE TABLE IF NOT EXISTS class_student_snapshots (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES class_sessions(session_id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    
    -- 签到信息
    signed BOOLEAN DEFAULT false,
    sign_time TIMESTAMP WITH TIME ZONE,
    is_late BOOLEAN DEFAULT false,
    
    -- 答题统计
    answer_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    correct_rate DECIMAL(5,2),
    
    -- 积分信息
    session_points INTEGER DEFAULT 0,      -- 本节课获得积分
    total_points_before INTEGER DEFAULT 0, -- 课前总积分
    total_points_after INTEGER DEFAULT 0,  -- 课后总积分
    
    -- 详细记录（JSON格式存储）
    answer_details JSONB DEFAULT '[]',     -- 答题详情
    points_details JSONB DEFAULT '[]',     -- 积分详情
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 课堂题目快照表 - 记录每节课的题目和答题情况
CREATE TABLE IF NOT EXISTS class_question_snapshots (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES class_sessions(session_id) ON DELETE CASCADE,
    question_round INTEGER NOT NULL,       -- 题目轮次
    question_title TEXT,                   -- 题目内容
    correct_answer VARCHAR(10),            -- 正确答案
    answer_mode VARCHAR(20),               -- 答题模式 vote/buzzer/lucky
    
    -- 答题统计
    total_answers INTEGER DEFAULT 0,
    option_a_count INTEGER DEFAULT 0,
    option_b_count INTEGER DEFAULT 0,
    option_c_count INTEGER DEFAULT 0,
    option_d_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    correct_rate DECIMAL(5,2),
    
    -- 特殊回答者（抢答/点名）
    special_student_id VARCHAR(50),
    special_student_name VARCHAR(100),
    special_answer VARCHAR(10),
    special_is_correct BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_class_sessions_start_time ON class_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_name ON class_sessions(class_name);
CREATE INDEX IF NOT EXISTS idx_class_student_snapshots_session ON class_student_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_class_student_snapshots_student ON class_student_snapshots(student_id);
CREATE INDEX IF NOT EXISTS idx_class_question_snapshots_session ON class_question_snapshots(session_id);

-- 5. 添加 RLS 策略
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_student_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_question_snapshots ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "Allow public read class_sessions" ON class_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert class_sessions" ON class_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update class_sessions" ON class_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete class_sessions" ON class_sessions FOR DELETE USING (true);

CREATE POLICY "Allow public read class_student_snapshots" ON class_student_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public insert class_student_snapshots" ON class_student_snapshots FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read class_question_snapshots" ON class_question_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public insert class_question_snapshots" ON class_question_snapshots FOR INSERT WITH CHECK (true);

-- =====================================================
-- 查询示例
-- =====================================================

-- 查看最近10节课
-- SELECT * FROM class_sessions ORDER BY start_time DESC LIMIT 10;

-- 查看某节课的学生数据
-- SELECT * FROM class_student_snapshots WHERE session_id = 'xxx' ORDER BY session_points DESC;

-- 查看某学生的历史表现
-- SELECT cs.start_time, cs.course_name, css.answer_count, css.correct_rate, css.session_points
-- FROM class_student_snapshots css
-- JOIN class_sessions cs ON css.session_id = cs.session_id
-- WHERE css.student_id = 'xxx'
-- ORDER BY cs.start_time DESC;
