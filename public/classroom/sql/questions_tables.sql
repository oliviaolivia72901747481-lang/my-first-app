-- =====================================================
-- 智慧课堂题库系统 - 数据库表结构
-- 请在 Supabase SQL Editor 中执行这些语句
-- =====================================================

-- 1. 题库表 - 存储所有题目
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    round INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    answer VARCHAR(10) NOT NULL,
    mode VARCHAR(20) DEFAULT 'vote',
    knowledge_tag VARCHAR(100),
    difficulty INTEGER DEFAULT 1,
    slide_page INTEGER,
    explanation TEXT,
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 课件-题目绑定表
CREATE TABLE IF NOT EXISTS slide_questions (
    id SERIAL PRIMARY KEY,
    slide_index INTEGER NOT NULL,
    question_round INTEGER NOT NULL,
    trigger_type VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slide_index, question_round)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_questions_round ON questions(round);
CREATE INDEX IF NOT EXISTS idx_questions_knowledge ON questions(knowledge_tag);
CREATE INDEX IF NOT EXISTS idx_questions_slide ON questions(slide_page);
CREATE INDEX IF NOT EXISTS idx_slide_questions_slide ON slide_questions(slide_index);

-- 4. 启用 RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE slide_questions ENABLE ROW LEVEL SECURITY;

-- 5. 添加 RLS 策略（使用 DROP IF EXISTS 避免重复创建错误）
DROP POLICY IF EXISTS "Allow public read questions" ON questions;
DROP POLICY IF EXISTS "Allow public insert questions" ON questions;
DROP POLICY IF EXISTS "Allow public update questions" ON questions;
DROP POLICY IF EXISTS "Allow public delete questions" ON questions;

CREATE POLICY "Allow public read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert questions" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update questions" ON questions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete questions" ON questions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read slide_questions" ON slide_questions;
DROP POLICY IF EXISTS "Allow public insert slide_questions" ON slide_questions;
DROP POLICY IF EXISTS "Allow public update slide_questions" ON slide_questions;
DROP POLICY IF EXISTS "Allow public delete slide_questions" ON slide_questions;

CREATE POLICY "Allow public read slide_questions" ON slide_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert slide_questions" ON slide_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update slide_questions" ON slide_questions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete slide_questions" ON slide_questions FOR DELETE USING (true);
