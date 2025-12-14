-- =====================================================
-- 智慧课堂题库系统 - 题目版本历史表
-- 支持题目修改历史记录和版本恢复
-- Requirements: 9.1, 9.2
-- =====================================================

-- 1. 题目版本历史表
CREATE TABLE IF NOT EXISTS question_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,               -- 完整的题目数据快照
    changes_summary TEXT,                 -- 变更摘要
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,                      -- 操作者
    UNIQUE(question_id, version_number)
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_question_versions_question ON question_versions(question_id);
CREATE INDEX IF NOT EXISTS idx_question_versions_created ON question_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_versions_number ON question_versions(question_id, version_number DESC);

-- 3. 启用 RLS
ALTER TABLE question_versions ENABLE ROW LEVEL SECURITY;

-- 4. 添加 RLS 策略
DROP POLICY IF EXISTS "Allow public read question_versions" ON question_versions;
DROP POLICY IF EXISTS "Allow public insert question_versions" ON question_versions;
DROP POLICY IF EXISTS "Allow public update question_versions" ON question_versions;
DROP POLICY IF EXISTS "Allow public delete question_versions" ON question_versions;

CREATE POLICY "Allow public read question_versions" ON question_versions FOR SELECT USING (true);
CREATE POLICY "Allow public insert question_versions" ON question_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update question_versions" ON question_versions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete question_versions" ON question_versions FOR DELETE USING (true);

-- 5. 授权
GRANT ALL ON question_versions TO anon;

-- 6. 创建获取下一个版本号的函数
CREATE OR REPLACE FUNCTION get_next_version_number(p_question_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM question_versions
    WHERE question_id = p_question_id;
    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建自动清理旧版本的函数（保留最近10个版本）
CREATE OR REPLACE FUNCTION cleanup_old_versions(p_question_id INTEGER, p_keep_count INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH versions_to_delete AS (
        SELECT id
        FROM question_versions
        WHERE question_id = p_question_id
        ORDER BY version_number DESC
        OFFSET p_keep_count
    )
    DELETE FROM question_versions
    WHERE id IN (SELECT id FROM versions_to_delete);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
