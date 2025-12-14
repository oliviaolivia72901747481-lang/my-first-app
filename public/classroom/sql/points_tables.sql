-- 积分系统数据库表
-- 请在 Supabase SQL Editor 中执行这些语句

-- 1. 学生积分汇总表
CREATE TABLE IF NOT EXISTS student_points (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 积分记录明细表
CREATE TABLE IF NOT EXISTS points_log (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    points INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,  -- sign_in, answer, buzzer, lucky, bonus, penalty
    reason VARCHAR(200),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_student_points_student_id ON student_points(student_id);
CREATE INDEX IF NOT EXISTS idx_student_points_total ON student_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_points_log_student_id ON points_log(student_id);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON points_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_log_type ON points_log(type);

-- 4. 启用实时订阅（可选）
ALTER PUBLICATION supabase_realtime ADD TABLE student_points;
ALTER PUBLICATION supabase_realtime ADD TABLE points_log;

-- 5. 添加 RLS 策略（根据需要调整）
ALTER TABLE student_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "Allow public read student_points" ON student_points FOR SELECT USING (true);
CREATE POLICY "Allow public read points_log" ON points_log FOR SELECT USING (true);

-- 允许所有人插入和更新（生产环境应该更严格）
CREATE POLICY "Allow public insert student_points" ON student_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update student_points" ON student_points FOR UPDATE USING (true);
CREATE POLICY "Allow public insert points_log" ON points_log FOR INSERT WITH CHECK (true);
