/**
 * 高级搜索与筛选模块
 * 支持多条件组合搜索和筛选题目
 * 
 * @module QuestionSearch
 */

const QuestionSearch = {
    /**
     * 全文搜索题目
     * 在题目标题、选项内容、解析中进行搜索
     * 
     * @param {Array<object>} questions - 题目数组
     * @param {string} keyword - 搜索关键词
     * @returns {Array<object>} 匹配的题目数组
     */
    search(questions, keyword) {
        if (!Array.isArray(questions)) {
            return [];
        }
        
        if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
            return questions;
        }
        
        const searchTerm = keyword.toLowerCase().trim();
        
        return questions.filter(question => {
            if (!question || typeof question !== 'object') {
                return false;
            }
            
            // 搜索字段：标题、选项A-D、解析
            const searchFields = [
                question.title,
                question.option_a,
                question.option_b,
                question.option_c,
                question.option_d,
                question.explanation
            ];
            
            return searchFields.some(field => {
                if (field && typeof field === 'string') {
                    return field.toLowerCase().includes(searchTerm);
                }
                return false;
            });
        });
    },

    /**
     * 多条件筛选题目
     * 使用AND逻辑组合所有条件
     * 
     * @param {Array<object>} questions - 题目数组
     * @param {object} filters - 筛选条件对象
     * @param {string} [filters.type] - 题型筛选
     * @param {number} [filters.difficulty] - 难度筛选
     * @param {string} [filters.knowledge_tag] - 知识点标签筛选
     * @param {object} [filters.dateRange] - 创建时间范围 { start: Date, end: Date }
     * @param {string} [filters.task_id] - 任务ID筛选
     * @returns {Array<object>} 筛选后的题目数组
     */
    filter(questions, filters) {
        if (!Array.isArray(questions)) {
            return [];
        }
        
        if (!filters || typeof filters !== 'object' || Object.keys(filters).length === 0) {
            return questions;
        }
        
        return questions.filter(question => {
            if (!question || typeof question !== 'object') {
                return false;
            }
            
            // 题型筛选
            if (filters.type !== undefined && filters.type !== null && filters.type !== '') {
                if (question.question_type !== filters.type) {
                    return false;
                }
            }
            
            // 难度筛选
            if (filters.difficulty !== undefined && filters.difficulty !== null) {
                const difficultyValue = typeof filters.difficulty === 'string' 
                    ? parseInt(filters.difficulty, 10) 
                    : filters.difficulty;
                if (!isNaN(difficultyValue) && question.difficulty !== difficultyValue) {
                    return false;
                }
            }
            
            // 知识点标签筛选
            if (filters.knowledge_tag !== undefined && filters.knowledge_tag !== null && filters.knowledge_tag !== '') {
                if (question.knowledge_tag !== filters.knowledge_tag) {
                    return false;
                }
            }
            
            // 任务ID筛选
            if (filters.task_id !== undefined && filters.task_id !== null && filters.task_id !== '') {
                if (question.task_id !== filters.task_id) {
                    return false;
                }
            }
            
            // 创建时间范围筛选
            if (filters.dateRange && typeof filters.dateRange === 'object') {
                const questionDate = question.created_at ? new Date(question.created_at) : null;
                
                if (questionDate) {
                    if (filters.dateRange.start) {
                        const startDate = new Date(filters.dateRange.start);
                        if (questionDate < startDate) {
                            return false;
                        }
                    }
                    
                    if (filters.dateRange.end) {
                        const endDate = new Date(filters.dateRange.end);
                        if (questionDate > endDate) {
                            return false;
                        }
                    }
                } else if (filters.dateRange.start || filters.dateRange.end) {
                    // 如果有日期筛选条件但题目没有创建时间，则不匹配
                    return false;
                }
            }
            
            return true;
        });
    },

    /**
     * 组合搜索和筛选
     * 返回同时满足搜索关键词和筛选条件的题目
     * 
     * @param {Array<object>} questions - 题目数组
     * @param {string} keyword - 搜索关键词
     * @param {object} filters - 筛选条件对象
     * @returns {Array<object>} 匹配的题目数组
     */
    searchAndFilter(questions, keyword, filters) {
        if (!Array.isArray(questions)) {
            return [];
        }
        
        // 先进行搜索
        let result = this.search(questions, keyword);
        
        // 再进行筛选
        result = this.filter(result, filters);
        
        return result;
    },

    /**
     * 高亮显示匹配的关键词
     * 
     * @param {string} text - 原始文本
     * @param {string} keyword - 要高亮的关键词
     * @param {string} [highlightClass='highlight'] - 高亮CSS类名
     * @returns {string} 带高亮标记的HTML文本
     */
    highlightKeyword(text, keyword, highlightClass = 'highlight') {
        if (!text || typeof text !== 'string') {
            return text || '';
        }
        
        if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
            return text;
        }
        
        const searchTerm = keyword.trim();
        
        // 转义正则表达式特殊字符
        const escapedKeyword = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // 使用正则表达式进行不区分大小写的替换
        const regex = new RegExp(`(${escapedKeyword})`, 'gi');
        
        return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
    },

    /**
     * 保存筛选条件到数据库
     * 
     * @param {object} supabase - Supabase客户端实例
     * @param {string} name - 筛选条件名称
     * @param {object} filters - 筛选条件对象
     * @returns {Promise<{success: boolean, id?: string, error?: string}>}
     */
    async saveFilter(supabase, name, filters) {
        if (!supabase) {
            return { success: false, error: '无效的数据库连接' };
        }
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return { success: false, error: '筛选条件名称不能为空' };
        }
        
        if (!filters || typeof filters !== 'object') {
            return { success: false, error: '筛选条件不能为空' };
        }
        
        try {
            const { data, error } = await supabase
                .from('saved_filters')
                .insert({
                    name: name.trim(),
                    filter_data: filters
                })
                .select()
                .single();
            
            if (error) {
                return { success: false, error: error.message };
            }
            
            return { success: true, id: data.id };
        } catch (e) {
            return { success: false, error: e.message || '保存筛选条件失败' };
        }
    },

    /**
     * 加载所有保存的筛选条件
     * 
     * @param {object} supabase - Supabase客户端实例
     * @returns {Promise<Array<{id: string, name: string, filter_data: object, created_at: string}>>}
     */
    async loadSavedFilters(supabase) {
        if (!supabase) {
            return [];
        }
        
        try {
            const { data, error } = await supabase
                .from('saved_filters')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('加载筛选条件失败:', error);
                return [];
            }
            
            return data || [];
        } catch (e) {
            console.error('加载筛选条件异常:', e);
            return [];
        }
    },

    /**
     * 删除保存的筛选条件
     * 
     * @param {object} supabase - Supabase客户端实例
     * @param {string} filterId - 筛选条件ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async deleteSavedFilter(supabase, filterId) {
        if (!supabase) {
            return { success: false, error: '无效的数据库连接' };
        }
        
        if (!filterId) {
            return { success: false, error: '筛选条件ID不能为空' };
        }
        
        try {
            const { error } = await supabase
                .from('saved_filters')
                .delete()
                .eq('id', filterId);
            
            if (error) {
                return { success: false, error: error.message };
            }
            
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message || '删除筛选条件失败' };
        }
    },

    /**
     * 获取单个保存的筛选条件
     * 
     * @param {object} supabase - Supabase客户端实例
     * @param {string} filterId - 筛选条件ID
     * @returns {Promise<{id: string, name: string, filter_data: object, created_at: string} | null>}
     */
    async getSavedFilter(supabase, filterId) {
        if (!supabase || !filterId) {
            return null;
        }
        
        try {
            const { data, error } = await supabase
                .from('saved_filters')
                .select('*')
                .eq('id', filterId)
                .single();
            
            if (error) {
                console.error('获取筛选条件失败:', error);
                return null;
            }
            
            return data;
        } catch (e) {
            console.error('获取筛选条件异常:', e);
            return null;
        }
    },

    /**
     * 更新保存的筛选条件
     * 
     * @param {object} supabase - Supabase客户端实例
     * @param {string} filterId - 筛选条件ID
     * @param {string} name - 新名称
     * @param {object} filters - 新筛选条件
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateSavedFilter(supabase, filterId, name, filters) {
        if (!supabase) {
            return { success: false, error: '无效的数据库连接' };
        }
        
        if (!filterId) {
            return { success: false, error: '筛选条件ID不能为空' };
        }
        
        const updateData = {};
        if (name && typeof name === 'string' && name.trim() !== '') {
            updateData.name = name.trim();
        }
        if (filters && typeof filters === 'object') {
            updateData.filter_data = filters;
        }
        
        if (Object.keys(updateData).length === 0) {
            return { success: false, error: '没有要更新的内容' };
        }
        
        try {
            const { error } = await supabase
                .from('saved_filters')
                .update(updateData)
                .eq('id', filterId);
            
            if (error) {
                return { success: false, error: error.message };
            }
            
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message || '更新筛选条件失败' };
        }
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.QuestionSearch = QuestionSearch;
}

// 支持模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestionSearch };
}
