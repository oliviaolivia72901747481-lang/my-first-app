/**
 * 题目模板模块
 * 预设和自定义题目模板管理
 * 
 * @module QuestionTemplates
 */

const QuestionTemplates = {
    /**
     * 内置模板定义
     * @type {Object}
     */
    builtInTemplates: {
        single: {
            name: '单选题模板',
            description: '标准四选一单选题',
            question_type: 'single',
            template_data: {
                title: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                answer: 'A',
                difficulty: 3,
                explanation: ''
            }
        },
        multiple: {
            name: '多选题模板',
            description: '标准多选题，可选2-4个正确答案',
            question_type: 'multiple',
            template_data: {
                title: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                answer: 'AB',
                difficulty: 3,
                explanation: ''
            }
        },
        truefalse: {
            name: '判断题模板',
            description: '对错判断题',
            question_type: 'truefalse',
            template_data: {
                title: '',
                option_a: '正确',
                option_b: '错误',
                option_c: null,
                option_d: null,
                answer: 'A',
                difficulty: 2,
                explanation: ''
            }
        },
        fillblank: {
            name: '填空题模板',
            description: '填空题，答案用___标记',
            question_type: 'fillblank',
            template_data: {
                title: '请填写___的内容',
                option_a: null,
                option_b: null,
                option_c: null,
                option_d: null,
                answer: '',
                difficulty: 3,
                explanation: ''
            }
        }
    },

    /**
     * 应用模板，返回预填充的题目对象
     * @param {string} templateId - 模板ID（内置模板使用类型名如'single'，自定义模板使用UUID）
     * @param {object} [customTemplate] - 可选的自定义模板对象（从数据库加载）
     * @returns {object|null} 预填充的题目对象，如果模板不存在返回null
     */
    applyTemplate(templateId, customTemplate = null) {
        // 如果提供了自定义模板对象，直接使用
        if (customTemplate && customTemplate.template_data) {
            const templateData = typeof customTemplate.template_data === 'string'
                ? JSON.parse(customTemplate.template_data)
                : customTemplate.template_data;
            
            return {
                ...templateData,
                question_type: customTemplate.question_type || templateData.question_type
            };
        }

        // 检查是否为内置模板
        if (templateId && this.builtInTemplates[templateId]) {
            const template = this.builtInTemplates[templateId];
            return {
                ...template.template_data,
                question_type: template.question_type
            };
        }

        return null;
    },

    /**
     * 获取所有内置模板列表
     * @returns {Array<{id: string, name: string, description: string, question_type: string}>}
     */
    getBuiltInTemplates() {
        return Object.entries(this.builtInTemplates).map(([id, template]) => ({
            id,
            name: template.name,
            description: template.description,
            question_type: template.question_type,
            is_builtin: true
        }));
    },

    /**
     * 保存自定义模板到数据库
     * @param {object} supabase - Supabase客户端实例
     * @param {string} name - 模板名称
     * @param {object} template - 模板内容 { question_type, template_data, description? }
     * @returns {Promise<{success: boolean, templateId?: string, error?: string}>}
     */
    async saveTemplate(supabase, name, template) {
        if (!supabase) {
            return { success: false, error: '无效的数据库连接' };
        }

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return { success: false, error: '模板名称不能为空' };
        }

        if (!template || !template.question_type || !template.template_data) {
            return { success: false, error: '模板内容不完整' };
        }

        try {
            const { data, error } = await supabase
                .from('question_templates')
                .insert({
                    name: name.trim(),
                    description: template.description || '',
                    question_type: template.question_type,
                    template_data: template.template_data,
                    is_builtin: false
                })
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, templateId: data.id };
        } catch (e) {
            return { success: false, error: e.message || '保存模板失败' };
        }
    },

    /**
     * 获取所有模板（包括内置和自定义）
     * @param {object} supabase - Supabase客户端实例
     * @returns {Promise<{success: boolean, templates?: Array, error?: string}>}
     */
    async getTemplates(supabase) {
        if (!supabase) {
            // 如果没有数据库连接，只返回内置模板
            return {
                success: true,
                templates: this.getBuiltInTemplates()
            };
        }

        try {
            const { data, error } = await supabase
                .from('question_templates')
                .select('*')
                .order('is_builtin', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                // 如果数据库查询失败，返回内置模板
                return {
                    success: true,
                    templates: this.getBuiltInTemplates(),
                    warning: error.message
                };
            }

            // 合并数据库模板和内置模板（以数据库为准，如果数据库为空则使用内置）
            if (data && data.length > 0) {
                return {
                    success: true,
                    templates: data.map(t => ({
                        id: t.id,
                        name: t.name,
                        description: t.description,
                        question_type: t.question_type,
                        template_data: t.template_data,
                        is_builtin: t.is_builtin,
                        created_at: t.created_at,
                        updated_at: t.updated_at
                    }))
                };
            }

            // 数据库为空，返回内置模板
            return {
                success: true,
                templates: this.getBuiltInTemplates()
            };
        } catch (e) {
            return {
                success: true,
                templates: this.getBuiltInTemplates(),
                warning: e.message || '获取模板失败'
            };
        }
    },

    /**
     * 删除自定义模板
     * @param {object} supabase - Supabase客户端实例
     * @param {string} templateId - 模板ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async deleteTemplate(supabase, templateId) {
        if (!supabase) {
            return { success: false, error: '无效的数据库连接' };
        }

        if (!templateId) {
            return { success: false, error: '模板ID不能为空' };
        }

        try {
            // 首先检查是否为内置模板
            const { data: template, error: fetchError } = await supabase
                .from('question_templates')
                .select('is_builtin')
                .eq('id', templateId)
                .single();

            if (fetchError) {
                return { success: false, error: '模板不存在' };
            }

            if (template && template.is_builtin) {
                return { success: false, error: '内置模板不能删除' };
            }

            // 删除模板
            const { error } = await supabase
                .from('question_templates')
                .delete()
                .eq('id', templateId);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message || '删除模板失败' };
        }
    },

    /**
     * 更新自定义模板
     * @param {object} supabase - Supabase客户端实例
     * @param {string} templateId - 模板ID
     * @param {object} updates - 要更新的字段 { name?, description?, template_data? }
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateTemplate(supabase, templateId, updates) {
        if (!supabase) {
            return { success: false, error: '无效的数据库连接' };
        }

        if (!templateId) {
            return { success: false, error: '模板ID不能为空' };
        }

        if (!updates || Object.keys(updates).length === 0) {
            return { success: false, error: '更新内容不能为空' };
        }

        try {
            // 首先检查是否为内置模板
            const { data: template, error: fetchError } = await supabase
                .from('question_templates')
                .select('is_builtin')
                .eq('id', templateId)
                .single();

            if (fetchError) {
                return { success: false, error: '模板不存在' };
            }

            if (template && template.is_builtin) {
                return { success: false, error: '内置模板不能修改' };
            }

            // 只允许更新特定字段
            const allowedFields = ['name', 'description', 'template_data'];
            const filteredUpdates = { updated_at: new Date().toISOString() };
            
            for (const key of Object.keys(updates)) {
                if (allowedFields.includes(key) && updates[key] !== undefined) {
                    filteredUpdates[key] = updates[key];
                }
            }

            const { error } = await supabase
                .from('question_templates')
                .update(filteredUpdates)
                .eq('id', templateId);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message || '更新模板失败' };
        }
    },

    /**
     * 根据题型获取默认模板
     * @param {string} questionType - 题型 (single, multiple, truefalse, fillblank)
     * @returns {object|null} 模板对象
     */
    getDefaultTemplateByType(questionType) {
        if (questionType && this.builtInTemplates[questionType]) {
            return this.applyTemplate(questionType);
        }
        return null;
    },

    /**
     * 验证模板数据是否完整
     * @param {object} templateData - 模板数据
     * @param {string} questionType - 题型
     * @returns {{valid: boolean, errors: string[]}}
     */
    validateTemplateData(templateData, questionType) {
        const errors = [];

        if (!templateData) {
            errors.push('模板数据不能为空');
            return { valid: false, errors };
        }

        // 检查必需字段
        const requiredFields = ['title', 'answer', 'difficulty'];
        for (const field of requiredFields) {
            if (templateData[field] === undefined) {
                errors.push(`缺少必需字段: ${field}`);
            }
        }

        // 根据题型检查选项
        if (questionType === 'single' || questionType === 'multiple') {
            const optionFields = ['option_a', 'option_b', 'option_c', 'option_d'];
            for (const field of optionFields) {
                if (templateData[field] === undefined) {
                    errors.push(`缺少选项字段: ${field}`);
                }
            }
        } else if (questionType === 'truefalse') {
            if (templateData.option_a === undefined || templateData.option_b === undefined) {
                errors.push('判断题需要option_a和option_b字段');
            }
        }

        // 检查难度范围
        if (templateData.difficulty !== undefined) {
            const difficulty = Number(templateData.difficulty);
            if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
                errors.push('难度必须在1-5之间');
            }
        }

        return { valid: errors.length === 0, errors };
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.QuestionTemplates = QuestionTemplates;
}

// 支持模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestionTemplates };
}
