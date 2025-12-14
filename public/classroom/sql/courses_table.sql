-- =====================================================
-- 课程管理表 - 支持多课程题库建设
-- =====================================================

-- 1. 课程表
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_id UUID DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(100) NOT NULL,            -- 课程名称
    code VARCHAR(50),                      -- 课程代码
    description TEXT,                      -- 课程描述
    teacher VARCHAR(100),                  -- 授课教师
    semester VARCHAR(50),                  -- 学期（如：2024-2025-1）
    color VARCHAR(20) DEFAULT '#3b82f6',   -- 显示颜色
    icon VARCHAR(10) DEFAULT '📚',         -- 图标
    question_count INTEGER DEFAULT 0,      -- 题目总数
    category_count INTEGER DEFAULT 0,      -- 分类数量
    is_active BOOLEAN DEFAULT true,        -- 是否启用
    sort_order INTEGER DEFAULT 0,          -- 排序
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 为分类表添加课程关联字段
ALTER TABLE question_categories ADD COLUMN IF NOT EXISTS course_id UUID;

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);
CREATE INDEX IF NOT EXISTS idx_question_categories_course ON question_categories(course_id);

-- 4. RLS 策略
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read courses" ON courses;
DROP POLICY IF EXISTS "Allow public insert courses" ON courses;
DROP POLICY IF EXISTS "Allow public update courses" ON courses;
DROP POLICY IF EXISTS "Allow public delete courses" ON courses;

CREATE POLICY "Allow public read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow public insert courses" ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update courses" ON courses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete courses" ON courses FOR DELETE USING (true);

-- 5. 授权
GRANT ALL ON courses TO anon;
