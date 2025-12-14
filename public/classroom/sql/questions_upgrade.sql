-- =====================================================
-- 题库表升级脚本 - 为现有 questions 表添加新字段
-- =====================================================

-- 添加知识点标签字段
ALTER TABLE questions ADD COLUMN IF NOT EXISTS knowledge_tag VARCHAR(100);

-- 添加难度字段
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;

-- 添加关联课件页码字段
ALTER TABLE questions ADD COLUMN IF NOT EXISTS slide_page INTEGER;

-- 添加答案解析字段
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;

-- 添加题目来源字段
ALTER TABLE questions ADD COLUMN IF NOT EXISTS source VARCHAR(100);

-- 添加更新时间字段
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_questions_knowledge ON questions(knowledge_tag);
CREATE INDEX IF NOT EXISTS idx_questions_slide ON questions(slide_page);

-- =====================================================
-- 创建课件-题目绑定表（如果不存在）
-- =====================================================
CREATE TABLE IF NOT EXISTS slide_questions (
    id SERIAL PRIMARY KEY,
    slide_index INTEGER NOT NULL,
    question_round INTEGER NOT NULL,
    trigger_type VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slide_index, question_round)
);

CREATE INDEX IF NOT EXISTS idx_slide_questions_slide ON slide_questions(slide_index);

-- 启用 RLS（如果已启用会忽略）
ALTER TABLE slide_questions ENABLE ROW LEVEL SECURITY;

-- 注意：如果策略已存在，请忽略以下错误，或单独执行需要的语句
-- CREATE POLICY "Allow public read slide_questions" ON slide_questions FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert slide_questions" ON slide_questions FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update slide_questions" ON slide_questions FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete slide_questions" ON slide_questions FOR DELETE USING (true);
