-- =====================================================
-- 题目表迁移 - 添加 task_id 关联
-- 将题目从 category_id 迁移到 task_id
-- =====================================================

-- 1. 添加 task_id 列到 questions 表
ALTER TABLE questions ADD COLUMN IF NOT EXISTS task_id UUID;

-- 2. 创建外键约束（可选，因为可能有历史数据）
-- 注意：如果有历史数据没有 task_id，需要先迁移数据再添加约束
-- ALTER TABLE questions 
--     ADD CONSTRAINT fk_questions_task 
--     FOREIGN KEY (task_id) 
--     REFERENCES tasks(task_id) 
--     ON DELETE CASCADE;

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_questions_task ON questions(task_id);

-- 4. 数据迁移说明（手动执行）
-- 如果需要从旧的 category_id 迁移到新的 task_id 结构：
-- 1) 首先为每个 category 创建对应的 project 和 task
-- 2) 然后更新 questions 表的 task_id
-- 
-- 示例迁移脚本（根据实际情况调整）：
-- UPDATE questions q
-- SET task_id = t.task_id
-- FROM tasks t
-- JOIN projects p ON t.project_id = p.project_id
-- JOIN question_categories c ON c.course_id = p.course_id
-- WHERE q.category_id = c.category_id;

-- 5. 添加外键约束（在数据迁移完成后执行）
-- 确保所有 questions 都有有效的 task_id 后再执行
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_questions_task' 
        AND table_name = 'questions'
    ) THEN
        -- 只有当所有 task_id 都有效时才添加约束
        -- 如果有 NULL 值，先处理这些记录
        ALTER TABLE questions 
            ADD CONSTRAINT fk_questions_task 
            FOREIGN KEY (task_id) 
            REFERENCES tasks(task_id) 
            ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Foreign key constraint not added: %', SQLERRM;
END $$;
