-- =====================================================
-- 智慧课堂题库系统 V2 - 支持多题型、多课程
-- =====================================================

-- 1. 课程/题库分类表
CREATE TABLE IF NOT EXISTS question_categories (
    id SERIAL PRIMARY KEY,
    category_id UUID DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(100) NOT NULL,           -- 分类名称（如：环境监测、土壤学）
    subject VARCHAR(50),                  -- 学科
    description TEXT,                     -- 描述
    question_count INTEGER DEFAULT 0,     -- 题目数量
    color VARCHAR(20) DEFAULT '#3b82f6',  -- 显示颜色
    sort_order INTEGER DEFAULT 0,         -- 排序
    is_active BOOLEAN DEFAULT true,       -- 是否启用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 扩展题库表 - 支持多题型
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'single';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_e TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_f TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;

-- question_type 类型说明:
-- single: 单选题
-- multiple: 多选题
-- truefalse: 判断题
-- fillblank: 填空题
-- shortanswer: 简答题

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_question_categories_name ON question_categories(name);

-- 4. RLS 策略
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read question_categories" ON question_categories;
DROP POLICY IF EXISTS "Allow public insert question_categories" ON question_categories;
DROP POLICY IF EXISTS "Allow public update question_categories" ON question_categories;
DROP POLICY IF EXISTS "Allow public delete question_categories" ON question_categories;

CREATE POLICY "Allow public read question_categories" ON question_categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert question_categories" ON question_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update question_categories" ON question_categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete question_categories" ON question_categories FOR DELETE USING (true);

-- 5. 授权
GRANT ALL ON question_categories TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
