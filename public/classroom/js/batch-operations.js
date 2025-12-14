/**
 * 批量操作模块
 * 支持多选题目并进行批量增删改操作
 * 
 * @module BatchOperations
 */

const BatchOperations = {
    /**
     * 当前选中的题目ID集合
     * @type {Set<string>}
     */
    selectedIds: new Set(),

    /**
     * 全选当前页面所有题目
     * @param {string[]} questionIds - 当前页面所有题目的ID数组
     * @returns {number} 选中的题目数量
     */
    selectAll(questionIds) {
        if (!Array.isArray(questionIds)) {
            return 0;
        }
        questionIds.forEach(id => {
            if (id !== null && id !== undefined) {
                this.selectedIds.add(String(id));
            }
        });
        return this.selectedIds.size;
    },

    /**
     * 取消全选，清空所有选中状态
     * @returns {void}
     */
    deselectAll() {
        this.selectedIds.clear();
    },

    /**
     * 切换单个题目的选中状态
     * @param {string} questionId - 题目ID
     * @returns {boolean} 切换后的选中状态（true=选中，false=未选中）
     */
    toggleSelect(questionId) {
        if (questionId === null || questionId === undefined) {
            return false;
        }
        const id = String(questionId);
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
            return false;
        } else {
            this.selectedIds.add(id);
            return true;
        }
    },

    /**
     * 获取当前选中的题目数量
     * @returns {number} 选中的题目数量
     */
    getSelectedCount() {
        return this.selectedIds.size;
    },

    /**
     * 获取所有选中的题目ID数组
     * @returns {string[]} 选中的题目ID数组
     */
    getSelectedIds() {
        return Array.from(this.selectedIds);
    },

    /**
     * 检查指定题目是否被选中
     * @param {string} questionId - 题目ID
     * @returns {boolean} 是否选中
     */
    isSelected(questionId) {
        return this.selectedIds.has(String(questionId));
    },

    /**
     * 批量删除题目
     * @param {object} supabase - Supabase客户端实例
     * @param {string[]} questionIds - 要删除的题目ID数组
     * @returns {Promise<{success: boolean, deleted: number, failed: number, errors: Array}>}
     */
    async batchDelete(supabase, questionIds) {
        const result = {
            success: false,
            deleted: 0,
            failed: 0,
            errors: []
        };

        if (!supabase || !Array.isArray(questionIds) || questionIds.length === 0) {
            result.errors.push('无效的参数');
            return result;
        }

        try {
            // 执行批量删除
            const { data, error } = await supabase
                .from('questions')
                .delete()
                .in('id', questionIds)
                .select();

            if (error) {
                result.errors.push(error.message);
                result.failed = questionIds.length;
                return result;
            }

            // 计算成功删除的数量
            result.deleted = data ? data.length : 0;
            result.failed = questionIds.length - result.deleted;
            result.success = result.deleted > 0;

            // 从选中集合中移除已删除的ID
            questionIds.forEach(id => this.selectedIds.delete(String(id)));

            return result;
        } catch (e) {
            result.errors.push(e.message || '删除操作异常');
            result.failed = questionIds.length;
            return result;
        }
    },

    /**
     * 批量移动题目到指定任务
     * @param {object} supabase - Supabase客户端实例
     * @param {string[]} questionIds - 要移动的题目ID数组
     * @param {string} targetTaskId - 目标任务ID
     * @returns {Promise<{success: boolean, moved: number, failed: number, errors: Array}>}
     */
    async batchMove(supabase, questionIds, targetTaskId) {
        const result = {
            success: false,
            moved: 0,
            failed: 0,
            errors: []
        };

        if (!supabase || !Array.isArray(questionIds) || questionIds.length === 0) {
            result.errors.push('无效的参数');
            return result;
        }

        if (!targetTaskId) {
            result.errors.push('目标任务ID不能为空');
            return result;
        }

        try {
            const { data, error } = await supabase
                .from('questions')
                .update({ task_id: targetTaskId })
                .in('id', questionIds)
                .select();

            if (error) {
                result.errors.push(error.message);
                result.failed = questionIds.length;
                return result;
            }

            result.moved = data ? data.length : 0;
            result.failed = questionIds.length - result.moved;
            result.success = result.moved > 0;

            return result;
        } catch (e) {
            result.errors.push(e.message || '移动操作异常');
            result.failed = questionIds.length;
            return result;
        }
    },

    /**
     * 批量更新题目属性（支持部分字段更新）
     * @param {object} supabase - Supabase客户端实例
     * @param {string[]} questionIds - 要更新的题目ID数组
     * @param {object} updates - 要更新的字段对象 { difficulty?, knowledge_tag?, task_id? }
     * @returns {Promise<{success: boolean, updated: number, failed: number, errors: Array}>}
     */
    async batchUpdate(supabase, questionIds, updates) {
        const result = {
            success: false,
            updated: 0,
            failed: 0,
            errors: []
        };

        if (!supabase || !Array.isArray(questionIds) || questionIds.length === 0) {
            result.errors.push('无效的参数');
            return result;
        }

        if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
            result.errors.push('更新内容不能为空');
            return result;
        }

        // 只允许更新特定字段，过滤掉不允许的字段
        const allowedFields = ['difficulty', 'knowledge_tag', 'task_id', 'question_type'];
        const filteredUpdates = {};
        
        for (const key of Object.keys(updates)) {
            if (allowedFields.includes(key) && updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            result.errors.push('没有有效的更新字段');
            return result;
        }

        try {
            const { data, error } = await supabase
                .from('questions')
                .update(filteredUpdates)
                .in('id', questionIds)
                .select();

            if (error) {
                result.errors.push(error.message);
                result.failed = questionIds.length;
                return result;
            }

            result.updated = data ? data.length : 0;
            result.failed = questionIds.length - result.updated;
            result.success = result.updated > 0;

            return result;
        } catch (e) {
            result.errors.push(e.message || '更新操作异常');
            result.failed = questionIds.length;
            return result;
        }
    },

    /**
     * 批量复制题目到指定任务
     * @param {object} supabase - Supabase客户端实例
     * @param {string[]} questionIds - 要复制的题目ID数组
     * @param {string} targetTaskId - 目标任务ID
     * @returns {Promise<{success: boolean, copied: number, newIds: string[], errors: Array}>}
     */
    async batchCopy(supabase, questionIds, targetTaskId) {
        const result = {
            success: false,
            copied: 0,
            newIds: [],
            errors: []
        };

        if (!supabase || !Array.isArray(questionIds) || questionIds.length === 0) {
            result.errors.push('无效的参数');
            return result;
        }

        if (!targetTaskId) {
            result.errors.push('目标任务ID不能为空');
            return result;
        }

        try {
            // 首先获取要复制的题目数据
            const { data: sourceQuestions, error: fetchError } = await supabase
                .from('questions')
                .select('*')
                .in('id', questionIds);

            if (fetchError) {
                result.errors.push(fetchError.message);
                return result;
            }

            if (!sourceQuestions || sourceQuestions.length === 0) {
                result.errors.push('未找到要复制的题目');
                return result;
            }

            // 获取目标任务中的最大round值
            const { data: maxRoundData } = await supabase
                .from('questions')
                .select('round')
                .eq('task_id', targetTaskId)
                .order('round', { ascending: false })
                .limit(1);

            let nextRound = maxRoundData && maxRoundData.length > 0 ? maxRoundData[0].round + 1 : 1;

            // 准备复制的题目数据（移除id，设置新的task_id和round）
            const newQuestions = sourceQuestions.map((q, index) => {
                const { id, created_at, updated_at, ...questionData } = q;
                return {
                    ...questionData,
                    task_id: targetTaskId,
                    round: nextRound + index
                };
            });

            // 插入新题目
            const { data: insertedData, error: insertError } = await supabase
                .from('questions')
                .insert(newQuestions)
                .select();

            if (insertError) {
                result.errors.push(insertError.message);
                return result;
            }

            result.copied = insertedData ? insertedData.length : 0;
            result.newIds = insertedData ? insertedData.map(q => q.id) : [];
            result.success = result.copied > 0;

            return result;
        } catch (e) {
            result.errors.push(e.message || '复制操作异常');
            return result;
        }
    },

    /**
     * 显示确认对话框
     * @param {string} message - 确认消息
     * @returns {Promise<boolean>} 用户是否确认
     */
    async showConfirmDialog(message) {
        return new Promise((resolve) => {
            const confirmed = window.confirm(message);
            resolve(confirmed);
        });
    },

    /**
     * 带确认的批量删除
     * @param {object} supabase - Supabase客户端实例
     * @param {string[]} questionIds - 要删除的题目ID数组
     * @returns {Promise<{success: boolean, deleted: number, failed: number, errors: Array, cancelled: boolean}>}
     */
    async batchDeleteWithConfirm(supabase, questionIds) {
        const count = questionIds.length;
        const confirmed = await this.showConfirmDialog(
            `确定要删除选中的 ${count} 道题目吗？此操作不可撤销。`
        );

        if (!confirmed) {
            return {
                success: false,
                deleted: 0,
                failed: 0,
                errors: [],
                cancelled: true
            };
        }

        const result = await this.batchDelete(supabase, questionIds);
        return { ...result, cancelled: false };
    },

    /**
     * 记录批量操作日志
     * @param {object} supabase - Supabase客户端实例
     * @param {string} action - 操作类型 (delete, move, update, copy)
     * @param {object} details - 操作详情
     * @returns {Promise<{success: boolean, error?: string}>}
     * Requirements: 1.5
     */
    async logOperation(supabase, action, details) {
        if (!supabase) {
            return { success: false, error: '无数据库连接' };
        }

        try {
            const { error } = await supabase
                .from('operation_logs')
                .insert({
                    operation_type: 'batch_' + action,
                    operation_data: details,
                    created_at: new Date().toISOString()
                });

            if (error) {
                // 如果表不存在，静默失败（日志是可选功能）
                if (error.code === '42P01') {
                    console.warn('[BatchOperations] operation_logs 表不存在，跳过日志记录');
                    return { success: true };
                }
                console.warn('[BatchOperations] 日志记录失败:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (e) {
            console.warn('[BatchOperations] 日志记录异常:', e.message);
            return { success: false, error: e.message };
        }
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.BatchOperations = BatchOperations;
}

// 支持模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BatchOperations };
}
