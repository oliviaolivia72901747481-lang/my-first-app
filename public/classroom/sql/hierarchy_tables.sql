-- =====================================================
-- 题库三级层级结构 - 课程→项目→任务
-- Course → Project → Task → Question
-- =====================================================

-- 1. 项目表 (Projects) - 中间层级
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_id UUID DEFAULT gen_random_uuid() UNIQUE,
    course_id UUID NOT NULL,                          -- 关联课程
    name VARCHAR(100) NOT NULL,                       -- 项目名称
    description TEXT,                                 -- 项目描述
    color VARCHAR(20) DEFAULT '#10b981',              -- 显示颜色
    icon VARCHAR(10) DEFAULT '📁',                    -- 图标
    task_count INTEGER DEFAULT 0,                     -- 任务数量
    question_count INTEGER DEFAULT 0,                 -- 题目总数（聚合）
    sort_order INTEGER DEFAULT 0,                     -- 排序
    is_active BOOLEAN DEFAULT true,                   -- 是否启用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_projects_course 
        FOREIGN KEY (course_id) 
        REFERENCES courses(course_id) 
        ON DELETE CASCADE
);

-- 2. 任务表 (Tasks) - 最低层级
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    task_id UUID DEFAULT gen_random_uuid() UNIQUE,
    project_id UUID NOT NULL,                         -- 关联项目
    name VARCHAR(100) NOT NULL,                       -- 任务名称
    description TEXT,                                 -- 任务描述
    color VARCHAR(20) DEFAULT '#f59e0b',              -- 显示颜色
    icon VARCHAR(10) DEFAULT '📋',                    -- 图标
    question_count INTEGER DEFAULT 0,                 -- 题目数量
    sort_order INTEGER DEFAULT 0,                     -- 排序
    is_active BOOLEAN DEFAULT true,                   -- 是否启用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_tasks_project 
        FOREIGN KEY (project_id) 
        REFERENCES projects(project_id) 
        ON DELETE CASCADE
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_course ON projects(course_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name);

-- 4. 更新 courses 表 - 添加 project_count 字段
ALTER TABLE courses ADD COLUMN IF NOT EXISTS project_count INTEGER DEFAULT 0;

-- 5. RLS 策略 - Projects 表
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read projects" ON projects;
DROP POLICY IF EXISTS "Allow public insert projects" ON projects;
DROP POLICY IF EXISTS "Allow public update projects" ON projects;
DROP POLICY IF EXISTS "Allow public delete projects" ON projects;

CREATE POLICY "Allow public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete projects" ON projects FOR DELETE USING (true);

-- 6. RLS 策略 - Tasks 表
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public update tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public delete tasks" ON tasks;

CREATE POLICY "Allow public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tasks" ON tasks FOR DELETE USING (true);

-- 7. 授权
GRANT ALL ON projects TO anon;
GRANT ALL ON tasks TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
