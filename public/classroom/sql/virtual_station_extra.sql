-- ===============================================
-- 虚拟工位平台补充表（core.sql 缺失的表）
-- 在已执行 core.sql 后执行此脚本
-- ===============================================

-- 1. 任务阶段表
CREATE TABLE IF NOT EXISTS vs_task_stages (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    name TEXT NOT NULL,
    stage_type TEXT NOT NULL,
    stage_order INTEGER DEFAULT 0,
    instructions TEXT,
    template JSONB,
    simulation_config JSONB,
    validation_rules JSONB DEFAULT '[]',
    required_fields JSONB DEFAULT '[]',
    hints JSONB DEFAULT '[]',
    hint_cost INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 阶段提交表
CREATE TABLE IF NOT EXISTS vs_stage_submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    execution_id TEXT NOT NULL,
    stage_id TEXT NOT NULL,
    data JSONB NOT NULL,
    validation_result JSONB,
    score INTEGER,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 错误记录表
CREATE TABLE IF NOT EXISTS vs_error_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    session_id TEXT,
    task_id TEXT,
    stage_id TEXT,
    error_type TEXT NOT NULL,
    error_description TEXT,
    field_id TEXT,
    submitted_value TEXT,
    correct_value TEXT,
    is_common_error BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 知识文档表
CREATE TABLE IF NOT EXISTS vs_knowledge_documents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    file_url TEXT,
    content TEXT,
    standard_id TEXT,
    standard_name TEXT,
    publish_date DATE,
    implementation_date DATE,
    scope TEXT,
    category TEXT,
    is_indexed BOOLEAN DEFAULT false,
    indexed_at TIMESTAMPTZ,
    index_error TEXT,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 文档版本表
CREATE TABLE IF NOT EXISTS vs_document_versions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    document_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    file_url TEXT,
    change_summary TEXT,
    changed_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

-- 6. 文档索引表
CREATE TABLE IF NOT EXISTS vs_document_index (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    document_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_content TEXT NOT NULL,
    keywords JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 国家标准表
CREATE TABLE IF NOT EXISTS vs_national_standards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    english_name TEXT,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    publish_date DATE,
    implementation_date DATE,
    scope TEXT,
    abstract TEXT,
    supersedes TEXT,
    superseded_by TEXT,
    related_standards JSONB DEFAULT '[]',
    clauses JSONB DEFAULT '{}',
    tables JSONB DEFAULT '[]',
    appendices JSONB DEFAULT '[]',
    document_id TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 标准条款表
CREATE TABLE IF NOT EXISTS vs_standard_clauses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    standard_id TEXT NOT NULL,
    clause_number TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    parent_clause TEXT,
    clause_type TEXT,
    limit_values JSONB,
    keywords JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 索引
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_vs_task_stages_task ON vs_task_stages(task_id);
CREATE INDEX IF NOT EXISTS idx_vs_stage_submissions_execution ON vs_stage_submissions(execution_id);
CREATE INDEX IF NOT EXISTS idx_vs_error_records_user ON vs_error_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_error_records_type ON vs_error_records(error_type);
CREATE INDEX IF NOT EXISTS idx_vs_knowledge_documents_category ON vs_knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_vs_document_versions_document ON vs_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_vs_national_standards_category ON vs_national_standards(category);
CREATE INDEX IF NOT EXISTS idx_vs_standard_clauses_standard ON vs_standard_clauses(standard_id);

-- ===============================================
-- RLS 策略
-- ===============================================
ALTER TABLE vs_task_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_stage_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_error_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_document_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_national_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_standard_clauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on vs_task_stages" ON vs_task_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_stage_submissions" ON vs_stage_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_error_records" ON vs_error_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_knowledge_documents" ON vs_knowledge_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_document_versions" ON vs_document_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_document_index" ON vs_document_index FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_national_standards" ON vs_national_standards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_standard_clauses" ON vs_standard_clauses FOR ALL USING (true) WITH CHECK (true);

SELECT '✅ 补充表创建完成！' as result;
