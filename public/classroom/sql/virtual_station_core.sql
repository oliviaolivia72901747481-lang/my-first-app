-- ===============================================
-- 虚拟工位平台核心表（精简版）
-- 在 Supabase SQL Editor 中执行此脚本
-- ===============================================

-- 1. 工位表
CREATE TABLE IF NOT EXISTS vs_workstations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    category TEXT NOT NULL,
    difficulty TEXT DEFAULT 'intermediate',
    estimated_time INTEGER DEFAULT 60,
    required_level INTEGER DEFAULT 1,
    total_tasks INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 100,
    certificate_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 进度表（最重要）
CREATE TABLE IF NOT EXISTS vs_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    workstation_id TEXT NOT NULL,
    progress DECIMAL(5,2) DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    last_task_id TEXT,
    last_stage_id TEXT,
    saved_data JSONB,
    status TEXT DEFAULT 'not_started',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workstation_id)
);

-- 3. 职业档案表（最重要）
CREATE TABLE IF NOT EXISTS vs_career_profiles (
    user_id TEXT PRIMARY KEY,
    level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    completed_workstations INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0,
    achievement_count INTEGER DEFAULT 0,
    certificate_count INTEGER DEFAULT 0,
    class_rank INTEGER,
    global_rank INTEGER,
    streak_days INTEGER DEFAULT 0,
    last_study_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 任务表
CREATE TABLE IF NOT EXISTS vs_tasks (
    id TEXT PRIMARY KEY,
    workstation_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    task_order INTEGER DEFAULT 0,
    brief_background TEXT,
    brief_objectives JSONB DEFAULT '[]',
    brief_requirements JSONB DEFAULT '[]',
    deadline_minutes INTEGER,
    max_score INTEGER DEFAULT 100,
    passing_score INTEGER DEFAULT 60,
    xp_reward INTEGER DEFAULT 50,
    achievements JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 会话表
CREATE TABLE IF NOT EXISTS vs_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workstation_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 任务执行表
CREATE TABLE IF NOT EXISTS vs_task_executions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    current_stage INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress',
    score INTEGER,
    time_spent INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 成就定义表
CREATE TABLE IF NOT EXISTS vs_achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    rarity TEXT DEFAULT 'common',
    condition_type TEXT NOT NULL,
    condition_target TEXT,
    xp_reward INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 用户成就表
CREATE TABLE IF NOT EXISTS vs_user_achievements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 9. 上岗证表
CREATE TABLE IF NOT EXISTS vs_certificates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workstation_id TEXT NOT NULL,
    granted_at BIGINT NOT NULL,
    certificate_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workstation_id)
);

-- 10. 行为日志表
CREATE TABLE IF NOT EXISTS vs_behavior_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    user_id TEXT NOT NULL,
    workstation_id TEXT,
    class_id TEXT,
    timestamp BIGINT NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 历史记录表
CREATE TABLE IF NOT EXISTS vs_history_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    workstation_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    execution_id TEXT,
    score INTEGER NOT NULL,
    time_spent INTEGER NOT NULL,
    completed_at BIGINT NOT NULL,
    is_best_score BOOLEAN DEFAULT false,
    operation_path JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 竞赛表
CREATE TABLE IF NOT EXISTS vs_competitions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    workstation_id TEXT,
    task_id TEXT,
    created_by TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. 竞赛参与表
CREATE TABLE IF NOT EXISTS vs_competition_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    competition_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    time_spent INTEGER,
    rank INTEGER,
    completed_at TIMESTAMPTZ,
    operation_path JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(competition_id, user_id)
);

-- ===============================================
-- 索引
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_vs_progress_user ON vs_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_progress_workstation ON vs_progress(workstation_id);
CREATE INDEX IF NOT EXISTS idx_vs_career_profiles_level ON vs_career_profiles(level);
CREATE INDEX IF NOT EXISTS idx_vs_sessions_user ON vs_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_behavior_logs_user ON vs_behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vs_history_records_user ON vs_history_records(user_id);

-- ===============================================
-- RLS 策略（允许所有操作）
-- ===============================================
ALTER TABLE vs_workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_history_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vs_competition_participants ENABLE ROW LEVEL SECURITY;

-- 公开访问策略
CREATE POLICY "Allow all on vs_workstations" ON vs_workstations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_progress" ON vs_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_career_profiles" ON vs_career_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_tasks" ON vs_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_sessions" ON vs_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_task_executions" ON vs_task_executions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_achievements" ON vs_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_user_achievements" ON vs_user_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_certificates" ON vs_certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_behavior_logs" ON vs_behavior_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_history_records" ON vs_history_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_competitions" ON vs_competitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vs_competition_participants" ON vs_competition_participants FOR ALL USING (true) WITH CHECK (true);

-- ===============================================
-- 预设数据：工位
-- ===============================================
INSERT INTO vs_workstations (id, name, description, icon, color, category, difficulty, estimated_time, required_level, total_tasks, xp_reward, is_active)
VALUES 
    ('env-monitoring', '环境监测站', '水质监测、大气监测、土壤监测全流程实训', 'ri-flask-line', 'cyan', 'env_monitoring', 'intermediate', 120, 1, 7, 500, true),
    ('hazwaste-lab', '危废鉴别实验室', 'GB 5085系列标准学习，沉浸式推理鉴别', 'ri-skull-line', 'orange', 'hazwaste', 'advanced', 90, 3, 5, 600, true),
    ('sampling-center', '采样规划中心', '布点方案设计、采样计划制定、现场模拟', 'ri-map-pin-line', 'emerald', 'sampling', 'intermediate', 60, 2, 4, 400, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- ===============================================
-- 预设数据：成就
-- ===============================================
INSERT INTO vs_achievements (id, name, description, icon, rarity, condition_type, condition_target, xp_reward)
VALUES 
    ('first-task', '初出茅庐', '完成第一个实训任务', 'ri-flag-line', 'common', 'task_complete', '1', 50),
    ('water-sampler', '水质采样员', '完成水质监测工位的全部任务', 'ri-drop-line', 'rare', 'workstation_complete', 'env-monitoring', 200),
    ('eco-newbie', '环保新人', '累计学习时长达到60分钟', 'ri-leaf-line', 'common', 'time', '60', 100),
    ('streak-7', '连续学习7天', '连续7天登录学习', 'ri-fire-line', 'rare', 'streak', '7', 300),
    ('perfect-score', '满分达人', '在任意任务中获得满分', 'ri-star-line', 'epic', 'score', '100', 250)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

SELECT '✅ 虚拟工位平台核心表创建完成！' as result;
