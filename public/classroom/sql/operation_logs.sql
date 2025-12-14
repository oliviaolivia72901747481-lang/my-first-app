-- 操作日志表
-- 用于记录批量操作和AI生成操作的日志
-- Requirements: 1.5

CREATE TABLE IF NOT EXISTS operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(50) NOT NULL,      -- 操作类型: batch_delete, batch_move, batch_update, batch_copy, ai_generate, ai_optimize
    operation_data JSONB,                     -- 操作详情（输入参数）
    result_data JSONB,                        -- 操作结果
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT                           -- 操作者（可选）
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_operation_logs_type ON operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created ON operation_logs(created_at DESC);

-- 添加注释
COMMENT ON TABLE operation_logs IS '操作日志表，记录批量操作和AI生成操作';
COMMENT ON COLUMN operation_logs.operation_type IS '操作类型';
COMMENT ON COLUMN operation_logs.operation_data IS '操作详情JSON';
COMMENT ON COLUMN operation_logs.result_data IS '操作结果JSON';
COMMENT ON COLUMN operation_logs.created_at IS '创建时间';
COMMENT ON COLUMN operation_logs.created_by IS '操作者';

-- RLS策略（可选，根据需要启用）
-- ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations on operation_logs" ON operation_logs FOR ALL USING (true);
