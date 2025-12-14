-- =====================================================
-- 智慧课堂积分系统 - 数据库表结构
-- 请在 Supabase SQL Editor 中执行这些语句
-- =====================================================

-- 1. 学生积分汇总表（基础版本，兼容旧表）
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

-- 4. 启用实时订阅（如果已添加会报错，可忽略）
-- 注意：如果报错 "already member of publication"，说明已经添加过了，可以跳过
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE student_points;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'student_points already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE points_log;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'points_log already in publication';
END $$;

-- 5. 添加 RLS 策略
ALTER TABLE student_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "Allow public read student_points" ON student_points FOR SELECT USING (true);
CREATE POLICY "Allow public read points_log" ON points_log FOR SELECT USING (true);

-- 允许所有人插入和更新
CREATE POLICY "Allow public insert student_points" ON student_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update student_points" ON student_points FOR UPDATE USING (true);
CREATE POLICY "Allow public insert points_log" ON points_log FOR INSERT WITH CHECK (true);

-- =====================================================
-- 如果表已存在，可以使用以下语句添加缺失的字段
-- =====================================================

-- 确保 vote_logs 表有 is_correct 字段
-- ALTER TABLE vote_logs ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT false;

-- 确保 vote_config 表有积分相关字段
-- ALTER TABLE vote_config ADD COLUMN IF NOT EXISTS allowed_student TEXT;
-- ALTER TABLE vote_config ADD COLUMN IF NOT EXISTS answer_mode TEXT DEFAULT 'vote';
