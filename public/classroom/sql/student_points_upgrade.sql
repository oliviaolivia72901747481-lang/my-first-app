-- =====================================================
-- 学生积分表升级脚本 - 添加今日积分字段
-- 用于支持学生端体验优化功能
-- Requirements: 6.1, 6.2, 6.3
-- =====================================================

-- 添加今日积分字段
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS today_points INTEGER DEFAULT 0;

-- 添加最后更新日期字段（用于重置今日积分）
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS last_updated DATE DEFAULT CURRENT_DATE;

-- 创建索引以支持排行榜查询
CREATE INDEX IF NOT EXISTS idx_student_points_today ON student_points(today_points DESC);

-- 创建函数：重置今日积分（每日凌晨调用或在查询时检查）
CREATE OR REPLACE FUNCTION reset_today_points_if_needed()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果最后更新日期不是今天，重置今日积分
    IF NEW.last_updated < CURRENT_DATE THEN
        NEW.today_points := 0;
        NEW.last_updated := CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：在更新时自动检查并重置今日积分
DROP TRIGGER IF EXISTS trigger_reset_today_points ON student_points;
CREATE TRIGGER trigger_reset_today_points
    BEFORE UPDATE ON student_points
    FOR EACH ROW
    EXECUTE FUNCTION reset_today_points_if_needed();

-- 更新现有记录的 last_updated 字段
UPDATE student_points 
SET last_updated = CURRENT_DATE 
WHERE last_updated IS NULL;
