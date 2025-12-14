-- =====================================================
-- 智慧课堂题库系统 - 模板、筛选条件和AI日志表
-- Requirements: 8.3, 3.5
-- =====================================================

-- 1. 题目模板表
CREATE TABLE IF NOT EXISTS question_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    question_type VARCHAR(20) NOT NULL,   -- single, multiple, truefalse, fillblank
    template_data JSONB NOT NULL,         -- 模板内容
    is_builtin BOOLEAN DEFAULT false,     -- 是否为内置模板
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 保存的筛选条件表
CREATE TABLE IF NOT EXISTS saved_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    filter_data JSONB NOT NULL,           -- 筛选条件
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AI生成日志表
CREATE TABLE IF NOT EXISTS ai_generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(20) NOT NULL,          -- generate, optimize, explain
    input_data JSONB,                     -- 输入参数
    output_data JSONB,                    -- 输出结果
    tokens_used INTEGER,                  -- 使用的token数
    model VARCHAR(50),                    -- 使用的模型
    success BOOLEAN DEFAULT true,         -- 是否成功
    error_message TEXT,                   -- 错误信息
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_question_templates_type ON question_templates(question_type);
CREATE INDEX IF NOT EXISTS idx_question_templates_builtin ON question_templates(is_builtin);
CREATE INDEX IF NOT EXISTS idx_saved_filters_name ON saved_filters(name);
CREATE INDEX IF NOT EXISTS idx_ai_generation_log_action ON ai_generation_log(action);
CREATE INDEX IF NOT EXISTS idx_ai_generation_log_created ON ai_generation_log(created_at DESC);

-- 5. 启用 RLS
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_log ENABLE ROW LEVEL SECURITY;

-- 6. question_templates RLS 策略
DROP POLICY IF EXISTS "Allow public read question_templates" ON question_templates;
DROP POLICY IF EXISTS "Allow public insert question_templates" ON question_templates;
DROP POLICY IF EXISTS "Allow public update question_templates" ON question_templates;
DROP POLICY IF EXISTS "Allow public delete question_templates" ON question_templates;

CREATE POLICY "Allow public read question_templates" ON question_templates FOR SELECT USING (true);
CREATE POLICY "Allow public insert question_templates" ON question_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update question_templates" ON question_templates FOR UPDATE USING (true);
CREATE POLICY "Allow public delete question_templates" ON question_templates FOR DELETE USING (true);

-- 7. saved_filters RLS 策略
DROP POLICY IF EXISTS "Allow public read saved_filters" ON saved_filters;
DROP POLICY IF EXISTS "Allow public insert saved_filters" ON saved_filters;
DROP POLICY IF EXISTS "Allow public update saved_filters" ON saved_filters;
DROP POLICY IF EXISTS "Allow public delete saved_filters" ON saved_filters;

CREATE POLICY "Allow public read saved_filters" ON saved_filters FOR SELECT USING (true);
CREATE POLICY "Allow public insert saved_filters" ON saved_filters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update saved_filters" ON saved_filters FOR UPDATE USING (true);
CREATE POLICY "Allow public delete saved_filters" ON saved_filters FOR DELETE USING (true);

-- 8. ai_generation_log RLS 策略
DROP POLICY IF EXISTS "Allow public read ai_generation_log" ON ai_generation_log;
DROP POLICY IF EXISTS "Allow public insert ai_generation_log" ON ai_generation_log;
DROP POLICY IF EXISTS "Allow public update ai_generation_log" ON ai_generation_log;
DROP POLICY IF EXISTS "Allow public delete ai_generation_log" ON ai_generation_log;

CREATE POLICY "Allow public read ai_generation_log" ON ai_generation_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert ai_generation_log" ON ai_generation_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update ai_generation_log" ON ai_generation_log FOR UPDATE USING (true);
CREATE POLICY "Allow public delete ai_generation_log" ON ai_generation_log FOR DELETE USING (true);

-- 9. 授权
GRANT ALL ON question_templates TO anon;
GRANT ALL ON saved_filters TO anon;
GRANT ALL ON ai_generation_log TO anon;

-- 10. 插入内置模板
INSERT INTO question_templates (name, description, question_type, template_data, is_builtin)
VALUES 
    ('单选题模板', '标准四选一单选题', 'single', '{
        "title": "",
        "option_a": "",
        "option_b": "",
        "option_c": "",
        "option_d": "",
        "answer": "A",
        "difficulty": 3,
        "explanation": ""
    }', true),
    ('多选题模板', '标准多选题，可选2-4个正确答案', 'multiple', '{
        "title": "",
        "option_a": "",
        "option_b": "",
        "option_c": "",
        "option_d": "",
        "answer": "AB",
        "difficulty": 3,
        "explanation": ""
    }', true),
    ('判断题模板', '对错判断题', 'truefalse', '{
        "title": "",
        "option_a": "正确",
        "option_b": "错误",
        "option_c": null,
        "option_d": null,
        "answer": "A",
        "difficulty": 2,
        "explanation": ""
    }', true),
    ('填空题模板', '填空题，答案用___标记', 'fillblank', '{
        "title": "请填写___的内容",
        "option_a": null,
        "option_b": null,
        "option_c": null,
        "option_d": null,
        "answer": "",
        "difficulty": 3,
        "explanation": ""
    }', true)
ON CONFLICT DO NOTHING;
