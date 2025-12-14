/**
 * 版本历史模块
 * 支持题目修改历史记录和版本恢复
 * 
 * @module VersionHistory
 */

const VersionHistory = {
    /**
     * 默认保留的版本数量
     * @type {number}
     */
    DEFAULT_KEEP_COUNT: 10,

    /**
     * 保存题目版本
     * 在题目修改前调用，保存修改前的完整状态
     * @param {object} supabase - Supabase客户端实例
     * @param {number|string} questionId - 题目ID
     * @param {object} questionData - 题目完整数据（修改前的状态）
     * @param {string} [changesSummary] - 变更摘要描述
     * @param {string} [createdBy] - 操作者标识
     * @returns {Promise<{success: boolean, versionId: string|null, versionNumber: number|null, error: string|null}>}
     */
    async saveVersion(supabase, questionId, questionData, changesSummary = null, createdBy = null) {
        const result = {
            success: false,
            versionId: null,
            versionNumber: null,
            error: null
        };

        // 参数验证
        if (!supabase) {
            result.error = 'Supabase客户端不能为空';
            return result;
        }

        if (!questionId) {
            result.error = '题目ID不能为空';
            return result;
        }

        if (!questionData || typeof questionData !== 'object') {
            result.error = '题目数据不能为空';
            return result;
        }

        try {
            // 获取下一个版本号
            const { data: versionData, error: versionError } = await supabase
                .from('question_versions')
                .select('version_number')
                .eq('question_id', questionId)
                .order('version_number', { ascending: false })
                .limit(1);

            if (versionError) {
                result.error = versionError.message;
                return result;
            }

            const nextVersionNumber = versionData && versionData.length > 0 
                ? versionData[0].version_number + 1 
                : 1;

            // 创建版本记录
            const versionRecord = {
                question_id: questionId,
                version_number: nextVersionNumber,
                content: questionData,
                changes_summary: changesSummary,
                created_by: createdBy
            };

            const { data: insertedData, error: insertError } = await supabase
                .from('question_versions')
                .insert(versionRecord)
                .select()
                .single();

            if (insertError) {
                result.error = insertError.message;
                return result;
            }

            result.success = true;
            result.versionId = insertedData.id;
            result.versionNumber = insertedData.version_number;

            return result;
        } catch (e) {
            result.error = e.message || '保存版本异常';
            return result;
        }
    },

    /**
     * 获取题目的所有历史版本列表
     * @param {object} supabase - Supabase客户端实例
     * @param {number|string} questionId - 题目ID
     * @returns {Promise<Array<{id: string, version_number: number, created_at: string, changes_summary: string|null, created_by: string|null}>>}
     */
    async getVersions(supabase, questionId) {
        if (!supabase || !questionId) {
            return [];
        }

        try {
            const { data, error } = await supabase
                .from('question_versions')
                .select('id, version_number, created_at, changes_summary, created_by')
                .eq('question_id', questionId)
                .order('version_number', { ascending: false });

            if (error) {
                console.error('获取版本列表失败:', error);
                return [];
            }

            return data || [];
        } catch (e) {
            console.error('获取版本列表异常:', e);
            return [];
        }
    },

    /**
     * 获取特定版本的完整内容
     * @param {object} supabase - Supabase客户端实例
     * @param {string} versionId - 版本ID
     * @returns {Promise<object|null>} 版本的完整题目数据，失败返回null
     */
    async getVersion(supabase, versionId) {
        if (!supabase || !versionId) {
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('question_versions')
                .select('*')
                .eq('id', versionId)
                .single();

            if (error) {
                console.error('获取版本内容失败:', error);
                return null;
            }

            return data;
        } catch (e) {
            console.error('获取版本内容异常:', e);
            return null;
        }
    },

    /**
     * 恢复题目到指定版本
     * @param {object} supabase - Supabase客户端实例
     * @param {number|string} questionId - 题目ID
     * @param {string} versionId - 要恢复到的版本ID
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async restoreVersion(supabase, questionId, versionId) {
        const result = {
            success: false,
            error: null
        };

        if (!supabase) {
            result.error = 'Supabase客户端不能为空';
            return result;
        }

        if (!questionId) {
            result.error = '题目ID不能为空';
            return result;
        }

        if (!versionId) {
            result.error = '版本ID不能为空';
            return result;
        }

        try {
            // 获取要恢复的版本内容
            const version = await this.getVersion(supabase, versionId);
            if (!version) {
                result.error = '未找到指定版本';
                return result;
            }

            // 验证版本属于该题目
            if (String(version.question_id) !== String(questionId)) {
                result.error = '版本不属于该题目';
                return result;
            }

            // 获取当前题目数据，用于保存为新版本
            const { data: currentQuestion, error: fetchError } = await supabase
                .from('questions')
                .select('*')
                .eq('id', questionId)
                .single();

            if (fetchError) {
                result.error = fetchError.message;
                return result;
            }

            // 保存当前状态为新版本（恢复前的状态）
            await this.saveVersion(
                supabase, 
                questionId, 
                currentQuestion, 
                `恢复到版本 ${version.version_number} 前的状态`
            );

            // 从版本内容中提取要更新的字段
            const versionContent = version.content;
            const { id, created_at, updated_at, ...updateData } = versionContent;

            // 更新题目为版本内容
            const { error: updateError } = await supabase
                .from('questions')
                .update(updateData)
                .eq('id', questionId);

            if (updateError) {
                result.error = updateError.message;
                return result;
            }

            result.success = true;
            return result;
        } catch (e) {
            result.error = e.message || '恢复版本异常';
            return result;
        }
    },

    /**
     * 比较两个版本的差异
     * @param {object} version1 - 第一个版本的内容对象
     * @param {object} version2 - 第二个版本的内容对象
     * @returns {{changes: Array<{field: string, old: any, new: any}>}}
     */
    compareVersions(version1, version2) {
        const changes = [];

        if (!version1 || !version2) {
            return { changes };
        }

        // 获取版本内容
        const content1 = version1.content || version1;
        const content2 = version2.content || version2;

        // 需要比较的字段
        const fieldsToCompare = [
            'title', 'option_a', 'option_b', 'option_c', 'option_d',
            'answer', 'explanation', 'difficulty', 'knowledge_tag',
            'question_type', 'task_id', 'round'
        ];

        for (const field of fieldsToCompare) {
            const val1 = content1[field];
            const val2 = content2[field];

            // 比较值是否不同
            if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                changes.push({
                    field,
                    old: val1,
                    new: val2
                });
            }
        }

        return { changes };
    },

    /**
     * 清理旧版本，保留最近N个版本
     * @param {object} supabase - Supabase客户端实例
     * @param {number|string} questionId - 题目ID
     * @param {number} [keepCount=10] - 保留的版本数量
     * @returns {Promise<{success: boolean, deleted: number, error: string|null}>}
     */
    async cleanupVersions(supabase, questionId, keepCount = 10) {
        const result = {
            success: false,
            deleted: 0,
            error: null
        };

        if (!supabase) {
            result.error = 'Supabase客户端不能为空';
            return result;
        }

        if (!questionId) {
            result.error = '题目ID不能为空';
            return result;
        }

        // 确保keepCount是有效的正整数
        keepCount = Math.max(1, Math.floor(keepCount) || this.DEFAULT_KEEP_COUNT);

        try {
            // 获取所有版本，按版本号降序排列
            const { data: allVersions, error: fetchError } = await supabase
                .from('question_versions')
                .select('id, version_number')
                .eq('question_id', questionId)
                .order('version_number', { ascending: false });

            if (fetchError) {
                result.error = fetchError.message;
                return result;
            }

            if (!allVersions || allVersions.length <= keepCount) {
                // 版本数量未超过限制，无需清理
                result.success = true;
                result.deleted = 0;
                return result;
            }

            // 获取需要删除的版本ID（保留前keepCount个）
            const versionsToDelete = allVersions.slice(keepCount);
            const idsToDelete = versionsToDelete.map(v => v.id);

            // 删除旧版本
            const { error: deleteError } = await supabase
                .from('question_versions')
                .delete()
                .in('id', idsToDelete);

            if (deleteError) {
                result.error = deleteError.message;
                return result;
            }

            result.success = true;
            result.deleted = idsToDelete.length;
            return result;
        } catch (e) {
            result.error = e.message || '清理版本异常';
            return result;
        }
    },

    /**
     * 获取题目的版本数量
     * @param {object} supabase - Supabase客户端实例
     * @param {number|string} questionId - 题目ID
     * @returns {Promise<number>} 版本数量
     */
    async getVersionCount(supabase, questionId) {
        if (!supabase || !questionId) {
            return 0;
        }

        try {
            const { count, error } = await supabase
                .from('question_versions')
                .select('*', { count: 'exact', head: true })
                .eq('question_id', questionId);

            if (error) {
                console.error('获取版本数量失败:', error);
                return 0;
            }

            return count || 0;
        } catch (e) {
            console.error('获取版本数量异常:', e);
            return 0;
        }
    },

    /**
     * 保存版本并自动清理旧版本
     * 便捷方法：保存新版本后自动清理超出限制的旧版本
     * @param {object} supabase - Supabase客户端实例
     * @param {number|string} questionId - 题目ID
     * @param {object} questionData - 题目完整数据
     * @param {string} [changesSummary] - 变更摘要
     * @param {string} [createdBy] - 操作者
     * @param {number} [keepCount=10] - 保留的版本数量
     * @returns {Promise<{success: boolean, versionId: string|null, versionNumber: number|null, cleanedUp: number, error: string|null}>}
     */
    async saveVersionWithCleanup(supabase, questionId, questionData, changesSummary = null, createdBy = null, keepCount = 10) {
        // 先保存版本
        const saveResult = await this.saveVersion(supabase, questionId, questionData, changesSummary, createdBy);
        
        if (!saveResult.success) {
            return {
                ...saveResult,
                cleanedUp: 0
            };
        }

        // 清理旧版本
        const cleanupResult = await this.cleanupVersions(supabase, questionId, keepCount);

        return {
            success: true,
            versionId: saveResult.versionId,
            versionNumber: saveResult.versionNumber,
            cleanedUp: cleanupResult.deleted,
            error: null
        };
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.VersionHistory = VersionHistory;
}

// 支持模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VersionHistory };
}
