-- ===============================================
-- 虚拟工位平台数据库表结构
-- Virtual Station Platform Database Schema
-- ===============================================

-- 1. 工位表 (Workstations)
-- 存储虚拟工位的基本信息
CREATE TABLE IF NOT EXISTS vs_workstations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    category TEXT NOT NULL CHECK (category IN ('env_monitoring', 'hazwaste', 'sampling', 'data_analysis', 'instrument', 'emergency')),
    difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_time INTEGER DEFAULT 60,  -- 预计完成时间（分钟）
    required_level INTEGER DEFAULT 1,   -- 解锁所需等级
    total_tasks INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 100,
    certificate_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 任务表 (Tasks)
-- 存储工位中的任务信息
CREATE TABLE IF NOT EXISTS vs_tasks (
    id TEXT PRIMARY KEY,
    workstation_id TEXT NOT NULL REFERENCES vs_workstations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    task_order INTEGER NOT NULL DEFAULT 0,
    -- 任务单信息
    brief_background TEXT,
    brief_objectives JSONB DEFAULT '[]',
    brief_requirements JSONB DEFAULT '[]',
    deadline_minutes INTEGER,
    -- 评分配置
    max_score INTEGER DEFAULT 100,
    passing_score INTEGER DEFAULT 60,
    xp_reward INTEGER DEFAULT 50,
    achievements JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 任务阶段表 (Task Stages)
-- 存储任务的各个阶段
CREATE TABLE IF NOT EXISTS vs_task_stages (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES vs_tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stage_type TEXT NOT NULL CHECK (stage_type IN ('task_receipt', 'plan_design', 'operation', 'record_filling', 'report_generation', 'simulation')),
    stage_order INTEGER NOT NULL DEFAULT 0,
    instructions TEXT,
    template JSONB,
    simulation_config JSONB,
    validation_rules JSONB DEFAULT '[]',
    required_fields JSONB DEFAULT '[]',
    hints JSONB DEFAULT '[]',
    hint_cost INTEGER DEFAULT 5,  -- 查看提示扣除的分数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 4. 会话表 (Sessions)
-- 记录用户进入工位的会话
CREATE TABLE IF NOT EXISTS vs_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workstation_id TEXT NOT NULL REFERENCES vs_workstations(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 任务执行表 (Task Executions)
-- 记录用户执行任务的状态
CREATE TABLE IF NOT EXISTS vs_task_executions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES vs_sessions(id),
    task_id TEXT NOT NULL REFERENCES vs_tasks(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    current_stage INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    score INTEGER,
    time_spent INTEGER,  -- 用时（秒）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 阶段提交表 (Stage Submissions)
-- 记录用户在各阶段的提交内容
CREATE TABLE IF NOT EXISTS vs_stage_submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    execution_id TEXT NOT NULL REFERENCES vs_task_executions(id),
    stage_id TEXT NOT NULL REFERENCES vs_task_stages(id),
    data JSONB NOT NULL,
    validation_result JSONB,
    score INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 进度表 (Progress)
-- 记录用户在各工位的整体进度
CREATE TABLE IF NOT EXISTS vs_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    workstation_id TEXT NOT NULL REFERENCES vs_workstations(id),
    progress DECIMAL(5,2) DEFAULT 0,  -- 进度百分比
    completed_tasks INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    last_task_id TEXT,
    last_stage_id TEXT,
    saved_data JSONB,  -- 保存的进度数据
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, workstation_id)
);

-- 8. 行为日志表 (Behavior Logs)
-- 无感采集学习行为数据
CREATE TABLE IF NOT EXISTS vs_behavior_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES vs_sessions(id),
    user_id TEXT NOT NULL,
    workstation_id TEXT,
    class_id TEXT,
    timestamp BIGINT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('page_view', 'field_focus', 'field_blur', 'field_modify', 'hint_view', 'submission', 'error_occur', 'simulation_action')),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 错误记录表 (Error Records)
-- 记录学生的错误模式
CREATE TABLE IF NOT EXISTS vs_error_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    session_id TEXT REFERENCES vs_sessions(id),
    task_id TEXT REFERENCES vs_tasks(id),
    stage_id TEXT REFERENCES vs_task_stages(id),
    error_type TEXT NOT NULL CHECK (error_type IN ('concept', 'calculation', 'process', 'format')),
    error_description TEXT,
    field_id TEXT,
    submitted_value TEXT,
    correct_value TEXT,
    is_common_error BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 10. 职业档案表 (Career Profiles)
-- 存储用户的职业成长数据
CREATE TABLE IF NOT EXISTS vs_career_profiles (
    user_id TEXT PRIMARY KEY,
    level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    completed_workstations INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0,  -- 总学习时长（分钟）
    achievement_count INTEGER DEFAULT 0,
    certificate_count INTEGER DEFAULT 0,
    class_rank INTEGER,
    global_rank INTEGER,
    streak_days INTEGER DEFAULT 0,  -- 连续学习天数
    last_study_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 成就定义表 (Achievement Definitions)
-- 存储成就的定义
CREATE TABLE IF NOT EXISTS vs_achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    condition_type TEXT NOT NULL,
    condition_target TEXT,
    xp_reward INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 用户成就表 (User Achievements)
-- 记录用户获得的成就
CREATE TABLE IF NOT EXISTS vs_user_achievements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL REFERENCES vs_achievements(id),
    unlocked_at BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 13. 上岗证表 (Certificates)
-- 记录用户获得的虚拟上岗证
CREATE TABLE IF NOT EXISTS vs_certificates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workstation_id TEXT NOT NULL REFERENCES vs_workstations(id),
    granted_at BIGINT NOT NULL,
    certificate_number TEXT,  -- 证书编号
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, workstation_id)
);

-- 14. 竞赛表 (Competitions)
-- 存储竞赛信息
CREATE TABLE IF NOT EXISTS vs_competitions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    workstation_id TEXT REFERENCES vs_workstations(id),
    task_id TEXT REFERENCES vs_tasks(id),
    created_by TEXT NOT NULL,  -- 创建者（教师）
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. 竞赛参与表 (Competition Participants)
-- 记录竞赛参与者和成绩
CREATE TABLE IF NOT EXISTS vs_competition_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    competition_id TEXT NOT NULL REFERENCES vs_competitions(id),
    user_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    time_spent INTEGER,  -- 用时（秒）
    rank INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    operation_path JSONB,  -- 操作路径记录
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(competition_id, user_id)
);

-- 16. 历史记录表 (History Records)
-- 保存完成任务的完整记录
CREATE TABLE IF NOT EXISTS vs_history_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    workstation_id TEXT NOT NULL REFERENCES vs_workstations(id),
    task_id TEXT NOT NULL REFERENCES vs_tasks(id),
    execution_id TEXT REFERENCES vs_task_executions(id),
    score INTEGER NOT NULL,
    time_spent INTEGER NOT NULL,  -- 用时（秒）
    completed_at BIGINT NOT NULL,
    is_best_score BOOLEAN DEFAULT false,
    operation_path JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ===============================================
-- 索引创建
-- ===============================================

-- 工位相关索引
CREATE INDEX IF NOT EXISTS idx_vs_workstations_category ON vs_workstations(category);
CREATE INDEX IF NOT EXISTS idx_vs_workstations_active ON vs_workstations(is_active);

-- 任务相关索引
CREATE INDEX IF NOT EXISTS idx_vs_tasks_workstation ON vs_tasks(workstation_id);
CREATE INDEX IF NOT EXISTS idx_vs_task_stages_task ON vs_task_stages(task_id);

-- 会话和执行索引
CREATE INDEX IF NOT EXISTS idx_vs_sessions_user ON vs_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_sessions_workstation ON vs_sessions(workstation_id);
CREATE INDEX IF NOT EXISTS idx_vs_task_executions_session ON vs_task_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_vs_task_executions_task ON vs_task_executions(task_id);

-- 进度索引
CREATE INDEX IF NOT EXISTS idx_vs_progress_user ON vs_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_progress_workstation ON vs_progress(workstation_id);

-- 行为日志索引
CREATE INDEX IF NOT EXISTS idx_vs_behavior_logs_session ON vs_behavior_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_vs_behavior_logs_user ON vs_behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_behavior_logs_timestamp ON vs_behavior_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_vs_behavior_logs_action ON vs_behavior_logs(action_type);

-- 错误记录索引
CREATE INDEX IF NOT EXISTS idx_vs_error_records_user ON vs_error_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_error_records_type ON vs_error_records(error_type);
CREATE INDEX IF NOT EXISTS idx_vs_error_records_common ON vs_error_records(is_common_error);

-- 职业档案索引
CREATE INDEX IF NOT EXISTS idx_vs_career_profiles_level ON vs_career_profiles(level);
CREATE INDEX IF NOT EXISTS idx_vs_career_profiles_xp ON vs_career_profiles(total_xp);

-- 成就索引
CREATE INDEX IF NOT EXISTS idx_vs_user_achievements_user ON vs_user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_certificates_user ON vs_certificates(user_id);

-- 竞赛索引
CREATE INDEX IF NOT EXISTS idx_vs_competitions_status ON vs_competitions(status);
CREATE INDEX IF NOT EXISTS idx_vs_competition_participants_competition ON vs_competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_vs_competition_participants_user ON vs_competition_participants(user_id);

-- 历史记录索引
CREATE INDEX IF NOT EXISTS idx_vs_history_records_user ON vs_history_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_history_records_task ON vs_history_records(task_id);
CREATE INDEX IF NOT EXISTS idx_vs_history_records_completed ON vs_history_records(completed_at);

-- ===============================================
-- 触发器：自动更新 updated_at
-- ===============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加触发器
DROP TRIGGER IF EXISTS update_vs_workstations_updated_at ON vs_workstations;
CREATE TRIGGER update_vs_workstations_updated_at
    BEFORE UPDATE ON vs_workstations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vs_tasks_updated_at ON vs_tasks;
CREATE TRIGGER update_vs_tasks_updated_at
    BEFORE UPDATE ON vs_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vs_progress_updated_at ON vs_progress;
CREATE TRIGGER update_vs_progress_updated_at
    BEFORE UPDATE ON vs_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vs_career_profiles_updated_at ON vs_career_profiles;
CREATE TRIGGER update_vs_career_profiles_updated_at
    BEFORE UPDATE ON vs_career_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 初始数据：预设工位
-- ===============================================

INSERT INTO vs_workstations (id, name, description, icon, color, category, difficulty, estimated_time, required_level, total_tasks, xp_reward, is_active)
VALUES 
    ('env-monitoring', '环境监测站', '水质监测、大气监测、土壤监测全流程实训', 'ri-flask-line', 'cyan', 'env_monitoring', 'intermediate', 120, 1, 7, 500, true),
    ('hazwaste-lab', '危废鉴别实验室', 'GB 5085系列标准学习，沉浸式推理鉴别', 'ri-skull-line', 'orange', 'hazwaste', 'advanced', 90, 3, 5, 600, true),
    ('sampling-center', '采样规划中心', '布点方案设计、采样计划制定、现场模拟', 'ri-map-pin-line', 'emerald', 'sampling', 'intermediate', 60, 2, 4, 400, true),
    ('data-center', '数据处理中心', '监测数据分析、报告生成、质量控制', 'ri-database-2-line', 'purple', 'data_analysis', 'intermediate', 90, 4, 6, 450, false),
    ('instrument-room', '仪器操作室', '分析仪器虚拟操作、参数调节、故障排除', 'ri-microscope-line', 'pink', 'instrument', 'advanced', 120, 5, 8, 700, false),
    ('emergency-center', '应急响应中心', '环境应急预案、事故处置、现场指挥模拟', 'ri-alarm-warning-line', 'red', 'emergency', 'advanced', 150, 8, 10, 1000, false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    category = EXCLUDED.category,
    difficulty = EXCLUDED.difficulty,
    estimated_time = EXCLUDED.estimated_time,
    required_level = EXCLUDED.required_level,
    total_tasks = EXCLUDED.total_tasks,
    xp_reward = EXCLUDED.xp_reward,
    is_active = EXCLUDED.is_active;

-- ===============================================
-- 初始数据：预设成就
-- ===============================================

INSERT INTO vs_achievements (id, name, description, icon, rarity, condition_type, condition_target, xp_reward)
VALUES 
    ('first-task', '初出茅庐', '完成第一个实训任务', 'ri-flag-line', 'common', 'task_complete', '1', 50),
    ('water-sampler', '水质采样员', '完成水质监测工位的全部任务', 'ri-drop-line', 'rare', 'workstation_complete', 'env-monitoring', 200),
    ('eco-newbie', '环保新人', '累计学习时长达到60分钟', 'ri-leaf-line', 'common', 'time', '60', 100),
    ('streak-7', '连续学习7天', '连续7天登录学习', 'ri-fire-line', 'rare', 'streak', '7', 300),
    ('perfect-score', '满分达人', '在任意任务中获得满分', 'ri-star-line', 'epic', 'score', '100', 250),
    ('hazwaste-expert', '危废鉴别专家', '完成危废鉴别实验室的全部案件', 'ri-skull-line', 'epic', 'workstation_complete', 'hazwaste-lab', 400),
    ('sampling-master', '采样规划大师', '完成采样规划中心的全部任务', 'ri-map-pin-line', 'rare', 'workstation_complete', 'sampling-center', 250),
    ('all-stations', '全能工程师', '完成所有工位的全部任务', 'ri-trophy-line', 'legendary', 'special', 'all_workstations', 1000)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    rarity = EXCLUDED.rarity,
    condition_type = EXCLUDED.condition_type,
    condition_target = EXCLUDED.condition_target,
    xp_reward = EXCLUDED.xp_reward;

-- ===============================================
-- RLS (Row Level Security) 策略
-- ===============================================

-- 启用RLS
ALTER TABLE vs_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_history_records ENABLE ROW LEVEL SECURITY;

-- 公开读取策略（工位、任务、成就定义）
CREATE POLICY "Allow public read on workstations" ON vs_workstations FOR SELECT USING (true);
CREATE POLICY "Allow public read on tasks" ON vs_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public read on task_stages" ON vs_task_stages FOR SELECT USING (true);
CREATE POLICY "Allow public read on achievements" ON vs_achievements FOR SELECT USING (true);

-- 用户数据策略（用户只能访问自己的数据）
CREATE POLICY "Users can manage own sessions" ON vs_sessions FOR ALL USING (true);
CREATE POLICY "Users can manage own executions" ON vs_task_executions FOR ALL USING (true);
CREATE POLICY "Users can manage own progress" ON vs_progress FOR ALL USING (true);
CREATE POLICY "Users can manage own logs" ON vs_behavior_logs FOR ALL USING (true);
CREATE POLICY "Users can manage own career" ON vs_career_profiles FOR ALL USING (true);
CREATE POLICY "Users can manage own achievements" ON vs_user_achievements FOR ALL USING (true);
CREATE POLICY "Users can manage own certificates" ON vs_certificates FOR ALL USING (true);
CREATE POLICY "Users can manage own history" ON vs_history_records FOR ALL USING (true);


-- ===============================================
-- 知识库管理系统表结构
-- Knowledge Base Management System Tables
-- Requirements: 6.1, 6.2, 6.3, 6.5
-- ===============================================

-- 17. 知识文档表 (Knowledge Documents)
-- 存储上传的知识文档信息
-- Requirements: 6.1 - 支持PDF、Word、Markdown文档上传
CREATE TABLE IF NOT EXISTS vs_knowledge_documents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'word', 'markdown', 'text')),
    file_size INTEGER,  -- 文件大小（字节）
    file_url TEXT,      -- 文件存储URL
    content TEXT,       -- 解析后的文本内容
    -- 国标分类信息 (Requirements: 6.2)
    standard_id TEXT,           -- 标准编号（如 GB 5085.1-2007）
    standard_name TEXT,         -- 标准名称
    publish_date DATE,          -- 发布日期
    implementation_date DATE,   -- 实施日期
    scope TEXT,                 -- 适用范围
    category TEXT,              -- 分类（hazwaste, water, soil, air, general）
    -- 索引状态
    is_indexed BOOLEAN DEFAULT false,
    indexed_at TIMESTAMP WITH TIME ZONE,
    index_error TEXT,
    -- 元数据
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. 知识文档版本表 (Document Versions)
-- 记录文档的版本历史
-- Requirements: 6.3 - 记录文档更新历史，支持版本回滚
CREATE TABLE IF NOT EXISTS vs_document_versions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    document_id TEXT NOT NULL REFERENCES vs_knowledge_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    file_url TEXT,
    change_summary TEXT,        -- 更新内容摘要
    changed_by TEXT NOT NULL,   -- 更新者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

-- 19. 知识文档索引表 (Document Index)
-- 存储文档的分词索引，用于搜索
-- Requirements: 6.5 - 支持关键词搜索
CREATE TABLE IF NOT EXISTS vs_document_index (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    document_id TEXT NOT NULL REFERENCES vs_knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,   -- 文档块索引
    chunk_content TEXT NOT NULL,    -- 文档块内容
    keywords JSONB DEFAULT '[]',    -- 提取的关键词
    embedding VECTOR(1536),         -- 向量嵌入（用于语义搜索，可选）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. 国家标准表 (National Standards)
-- 专门存储国家标准的结构化信息
-- Requirements: 6.2 - 按标准编号、发布日期、适用范围分类存储
CREATE TABLE IF NOT EXISTS vs_national_standards (
    id TEXT PRIMARY KEY,            -- 标准编号作为主键（如 GB 5085.1-2007）
    name TEXT NOT NULL,             -- 标准名称
    english_name TEXT,              -- 英文名称
    category TEXT NOT NULL,         -- 分类
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'abolished')),
    publish_date DATE,              -- 发布日期
    implementation_date DATE,       -- 实施日期
    scope TEXT,                     -- 适用范围
    abstract TEXT,                  -- 摘要
    -- 关联信息
    supersedes TEXT,                -- 替代的旧标准
    superseded_by TEXT,             -- 被哪个新标准替代
    related_standards JSONB DEFAULT '[]',  -- 相关标准列表
    -- 内容
    clauses JSONB DEFAULT '{}',     -- 条款内容
    tables JSONB DEFAULT '[]',      -- 表格数据
    appendices JSONB DEFAULT '[]',  -- 附录
    -- 元数据
    document_id TEXT REFERENCES vs_knowledge_documents(id),  -- 关联的文档
    source_url TEXT,                -- 来源链接
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. 标准条款表 (Standard Clauses)
-- 存储标准的具体条款，便于精确搜索
CREATE TABLE IF NOT EXISTS vs_standard_clauses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    standard_id TEXT NOT NULL REFERENCES vs_national_standards(id) ON DELETE CASCADE,
    clause_number TEXT NOT NULL,    -- 条款编号（如 4.1, 5.2.3）
    title TEXT,                     -- 条款标题
    content TEXT NOT NULL,          -- 条款内容
    parent_clause TEXT,             -- 父条款编号
    clause_type TEXT,               -- 条款类型（definition, requirement, method, limit）
    -- 限值信息（如果是限值条款）
    limit_values JSONB,             -- 限值数据
    -- 搜索优化
    keywords JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 知识库索引
-- ===============================================

-- 知识文档索引
CREATE INDEX IF NOT EXISTS idx_vs_knowledge_documents_standard ON vs_knowledge_documents(standard_id);
CREATE INDEX IF NOT EXISTS idx_vs_knowledge_documents_category ON vs_knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_vs_knowledge_documents_indexed ON vs_knowledge_documents(is_indexed);
CREATE INDEX IF NOT EXISTS idx_vs_knowledge_documents_uploaded_by ON vs_knowledge_documents(uploaded_by);

-- 文档版本索引
CREATE INDEX IF NOT EXISTS idx_vs_document_versions_document ON vs_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_vs_document_versions_number ON vs_document_versions(version_number);

-- 文档索引表索引
CREATE INDEX IF NOT EXISTS idx_vs_document_index_document ON vs_document_index(document_id);

-- 国家标准索引
CREATE INDEX IF NOT EXISTS idx_vs_national_standards_category ON vs_national_standards(category);
CREATE INDEX IF NOT EXISTS idx_vs_national_standards_status ON vs_national_standards(status);
CREATE INDEX IF NOT EXISTS idx_vs_national_standards_publish_date ON vs_national_standards(publish_date);

-- 标准条款索引
CREATE INDEX IF NOT EXISTS idx_vs_standard_clauses_standard ON vs_standard_clauses(standard_id);
CREATE INDEX IF NOT EXISTS idx_vs_standard_clauses_number ON vs_standard_clauses(clause_number);
CREATE INDEX IF NOT EXISTS idx_vs_standard_clauses_type ON vs_standard_clauses(clause_type);

-- 全文搜索索引（PostgreSQL）
CREATE INDEX IF NOT EXISTS idx_vs_knowledge_documents_content_fts ON vs_knowledge_documents USING gin(to_tsvector('simple', coalesce(content, '')));
CREATE INDEX IF NOT EXISTS idx_vs_standard_clauses_content_fts ON vs_standard_clauses USING gin(to_tsvector('simple', coalesce(content, '')));

-- ===============================================
-- 知识库触发器
-- ===============================================

-- 文档更新时间触发器
DROP TRIGGER IF EXISTS update_vs_knowledge_documents_updated_at ON vs_knowledge_documents;
CREATE TRIGGER update_vs_knowledge_documents_updated_at
    BEFORE UPDATE ON vs_knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 国家标准更新时间触发器
DROP TRIGGER IF EXISTS update_vs_national_standards_updated_at ON vs_national_standards;
CREATE TRIGGER update_vs_national_standards_updated_at
    BEFORE UPDATE ON vs_national_standards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 知识库RLS策略
-- ===============================================

ALTER TABLE vs_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_document_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_national_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_standard_clauses ENABLE ROW LEVEL SECURITY;

-- 公开读取策略
CREATE POLICY "Allow public read on knowledge_documents" ON vs_knowledge_documents FOR SELECT USING (true);
CREATE POLICY "Allow public read on document_versions" ON vs_document_versions FOR SELECT USING (true);
CREATE POLICY "Allow public read on document_index" ON vs_document_index FOR SELECT USING (true);
CREATE POLICY "Allow public read on national_standards" ON vs_national_standards FOR SELECT USING (true);
CREATE POLICY "Allow public read on standard_clauses" ON vs_standard_clauses FOR SELECT USING (true);

-- 教师可以管理知识库
CREATE POLICY "Teachers can manage knowledge_documents" ON vs_knowledge_documents FOR ALL USING (true);
CREATE POLICY "Teachers can manage document_versions" ON vs_document_versions FOR ALL USING (true);
CREATE POLICY "Teachers can manage document_index" ON vs_document_index FOR ALL USING (true);
CREATE POLICY "Teachers can manage national_standards" ON vs_national_standards FOR ALL USING (true);
CREATE POLICY "Teachers can manage standard_clauses" ON vs_standard_clauses FOR ALL USING (true);


-- ===============================================
-- 教师管理后台相关表结构
-- Teacher Admin Backend Tables
-- Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
-- ===============================================

-- 22. 虚拟工位表（管理后台用）
-- 用于管理后台的工位管理
CREATE TABLE IF NOT EXISTS virtual_workstations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'ri-building-4-line',
    color TEXT DEFAULT 'purple',
    category TEXT NOT NULL CHECK (category IN ('env_monitoring', 'hazwaste', 'sampling', 'data_analysis', 'instrument', 'emergency')),
    difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_time INTEGER DEFAULT 60,
    required_level INTEGER DEFAULT 1,
    total_tasks INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 100,
    certificate_id TEXT,
    is_active BOOLEAN DEFAULT true,
    mode TEXT,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. 虚拟任务表（管理后台用）
CREATE TABLE IF NOT EXISTS virtual_tasks (
    id TEXT PRIMARY KEY,
    workstation_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    order_num INTEGER DEFAULT 0,
    task_brief JSONB DEFAULT '{}',
    stages JSONB DEFAULT '[]',
    scoring_rules JSONB DEFAULT '[]',
    max_score INTEGER DEFAULT 100,
    passing_score INTEGER DEFAULT 60,
    xp_reward INTEGER DEFAULT 50,
    achievements JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. 职业档案表（管理后台用）
CREATE TABLE IF NOT EXISTS virtual_career_profiles (
    user_id TEXT PRIMARY KEY,
    student_id TEXT,
    name TEXT,
    level INTEGER DEFAULT 1,
    level_title TEXT DEFAULT 'intern',
    current_xp INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    completed_workstations INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2),
    progress DECIMAL(5,2) DEFAULT 0,
    achievement_count INTEGER DEFAULT 0,
    certificate_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. 任务历史表（管理后台用）
CREATE TABLE IF NOT EXISTS virtual_task_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    task_name TEXT,
    workstation_id TEXT,
    score INTEGER,
    duration INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operation_path JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 26. 行为日志表（管理后台用）
CREATE TABLE IF NOT EXISTS virtual_behavior_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    session_id TEXT,
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27. 难点步骤分析表
-- Requirements: 3.4, 3.5 - 难点识别和统计分析
CREATE TABLE IF NOT EXISTS virtual_difficult_steps (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    step_id TEXT NOT NULL,
    step_name TEXT NOT NULL,
    workstation_id TEXT,
    task_id TEXT,
    average_duration INTEGER DEFAULT 0,
    hint_view_rate DECIMAL(5,2) DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0,
    retry_rate DECIMAL(5,2) DEFAULT 0,
    sample_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 28. 错误模式分析表
-- Requirements: 4.1, 4.2 - 错误分类和共性问题识别
CREATE TABLE IF NOT EXISTS virtual_error_patterns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    pattern_id TEXT NOT NULL,
    error_type TEXT NOT NULL CHECK (error_type IN ('concept', 'calculation', 'process', 'format')),
    description TEXT,
    occurrence_count INTEGER DEFAULT 0,
    affected_students INTEGER DEFAULT 0,
    affected_percentage DECIMAL(5,2) DEFAULT 0,
    related_steps JSONB DEFAULT '[]',
    related_knowledge JSONB DEFAULT '[]',
    is_common_error BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 29. 行为统计汇总表
CREATE TABLE IF NOT EXISTS virtual_behavior_stats (
    id TEXT PRIMARY KEY DEFAULT 'global',
    avg_pause_time INTEGER DEFAULT 0,
    hint_view_rate DECIMAL(5,2) DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0,
    retry_rate DECIMAL(5,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 30. 任务截止提醒表
-- Requirements: 12.5 - 任务截止提醒
CREATE TABLE IF NOT EXISTS virtual_task_reminders (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    advance INTEGER,
    incomplete_count INTEGER DEFAULT 0,
    is_sent BOOLEAN DEFAULT false,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 管理后台索引
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_virtual_workstations_category ON virtual_workstations(category);
CREATE INDEX IF NOT EXISTS idx_virtual_workstations_active ON virtual_workstations(is_active);
CREATE INDEX IF NOT EXISTS idx_virtual_tasks_workstation ON virtual_tasks(workstation_id);
CREATE INDEX IF NOT EXISTS idx_virtual_career_profiles_level ON virtual_career_profiles(level);
CREATE INDEX IF NOT EXISTS idx_virtual_career_profiles_xp ON virtual_career_profiles(total_xp);
CREATE INDEX IF NOT EXISTS idx_virtual_task_history_user ON virtual_task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_task_history_task ON virtual_task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_virtual_behavior_logs_user ON virtual_behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_behavior_logs_timestamp ON virtual_behavior_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_virtual_difficult_steps_workstation ON virtual_difficult_steps(workstation_id);
CREATE INDEX IF NOT EXISTS idx_virtual_error_patterns_type ON virtual_error_patterns(error_type);
CREATE INDEX IF NOT EXISTS idx_virtual_task_reminders_deadline ON virtual_task_reminders(deadline);

-- ===============================================
-- 管理后台触发器
-- ===============================================

DROP TRIGGER IF EXISTS update_virtual_workstations_updated_at ON virtual_workstations;
CREATE TRIGGER update_virtual_workstations_updated_at
    BEFORE UPDATE ON virtual_workstations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_virtual_tasks_updated_at ON virtual_tasks;
CREATE TRIGGER update_virtual_tasks_updated_at
    BEFORE UPDATE ON virtual_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_virtual_career_profiles_updated_at ON virtual_career_profiles;
CREATE TRIGGER update_virtual_career_profiles_updated_at
    BEFORE UPDATE ON virtual_career_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 管理后台RLS策略
-- ===============================================

ALTER TABLE virtual_workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_difficult_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_error_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_behavior_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_task_reminders ENABLE ROW LEVEL SECURITY;

-- 公开读取策略
CREATE POLICY "Allow public read on virtual_workstations" ON virtual_workstations FOR SELECT USING (true);
CREATE POLICY "Allow public read on virtual_tasks" ON virtual_tasks FOR SELECT USING (true);

-- 管理策略
CREATE POLICY "Allow all on virtual_workstations" ON virtual_workstations FOR ALL USING (true);
CREATE POLICY "Allow all on virtual_tasks" ON virtual_tasks FOR ALL USING (true);
CREATE POLICY "Allow all on virtual_career_profiles" ON virtual_career_profiles FOR ALL USING (true);
CREATE POLICY "Allow all on virtual_task_history" ON virtual_task_history FOR ALL USING (true);
CREATE POLICY "Allow all on virtual_behavior_logs" ON virtual_behavior_logs FOR ALL USING (true);
CREATE POLICY "Allow all on virtual_difficult_steps" ON virtual_difficult_steps FOR ALL USING (true);
CREATE POLICY "Allow all on virtual_error_patterns" ON virtual_error_patterns FOR ALL USING (true);
CREATE POLICY "Allow all on virtual_behavior_stats" ON virtual_behavior_stats FOR ALL USING (true);
CREATE POLICY "Allow all on virtual_task_reminders" ON virtual_task_reminders FOR ALL USING (true);

-- ===============================================
-- 辅助函数
-- ===============================================

-- 增加工位任务数
CREATE OR REPLACE FUNCTION increment_workstation_tasks(ws_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE virtual_workstations 
    SET total_tasks = total_tasks + 1, updated_at = NOW()
    WHERE id = ws_id;
END;
$$ LANGUAGE plpgsql;

-- 减少工位任务数
CREATE OR REPLACE FUNCTION decrement_workstation_tasks(ws_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE virtual_workstations 
    SET total_tasks = GREATEST(total_tasks - 1, 0), updated_at = NOW()
    WHERE id = ws_id;
END;
$$ LANGUAGE plpgsql;

-- 初始化行为统计
INSERT INTO virtual_behavior_stats (id, avg_pause_time, hint_view_rate, error_rate, retry_rate, total_sessions)
VALUES ('global', 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;
