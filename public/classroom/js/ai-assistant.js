/**
 * AI助手模块
 * 利用AI生成和优化题目
 * 
 * @module AIAssistant
 */

const AIAssistant = {
    /**
     * API配置
     */
    config: {
        apiKey: '',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        provider: 'openai', // openai, deepseek, anthropic, custom
        timeout: 30000, // 30秒超时
        maxRetries: 2,
        useProxy: true, // 使用代理解决CORS问题
        proxyEndpoint: '/api/ai-proxy'
    },

    /**
     * 题型映射（中英文）
     */
    questionTypeMap: {
        single: '单选题',
        multiple: '多选题',
        truefalse: '判断题',
        fillblank: '填空题'
    },

    /**
     * 难度映射
     */
    difficultyMap: {
        1: '非常简单',
        2: '简单',
        3: '中等',
        4: '较难',
        5: '困难'
    },

    /**
     * 配置API连接
     * @param {object} options - 配置选项
     * @param {string} options.apiKey - API密钥
     * @param {string} [options.apiEndpoint] - API端点
     * @param {string} [options.model] - 模型名称
     * @param {string} [options.provider] - 提供商 (openai, deepseek, anthropic, custom)
     * @param {number} [options.timeout] - 超时时间（毫秒）
     * @param {boolean} [options.useProxy] - 是否使用代理
     */
    configure(options) {
        if (options.apiKey) {
            this.config.apiKey = options.apiKey;
        }
        if (options.apiEndpoint) {
            this.config.apiEndpoint = options.apiEndpoint;
        }
        if (options.model) {
            this.config.model = options.model;
        }
        if (options.provider) {
            this.config.provider = options.provider;
        }
        if (options.timeout && typeof options.timeout === 'number') {
            this.config.timeout = options.timeout;
        }
        if (typeof options.useProxy === 'boolean') {
            this.config.useProxy = options.useProxy;
        }
    },

    /**
     * 检查API是否已配置
     * @returns {boolean}
     */
    isConfigured() {
        return Boolean(this.config.apiKey && this.config.apiEndpoint);
    },


    /**
     * 构建生成题目的提示词
     * @param {object} options - 生成选项
     * @param {string} options.topic - 知识点或主题
     * @param {string} options.type - 题型 (single, multiple, truefalse, fillblank)
     * @param {number} options.difficulty - 难度级别 (1-5)
     * @param {number} options.count - 生成数量 (1-10)
     * @param {string} [options.context] - 额外上下文
     * @returns {string} 提示词
     */
    buildGeneratePrompt(options) {
        const { topic, type, difficulty, count, context } = options;
        
        const questionType = this.questionTypeMap[type] || '单选题';
        const difficultyText = this.difficultyMap[difficulty] || '中等';
        const validCount = Math.min(Math.max(1, count || 1), 10);

        let prompt = `你是一位专业的教育工作者，请根据以下要求生成${validCount}道${questionType}：

主题/知识点：${topic}
难度级别：${difficultyText}（${difficulty}/5）
题目数量：${validCount}道

`;

        if (context) {
            prompt += `额外背景信息：${context}\n\n`;
        }

        prompt += `请按照以下JSON格式返回题目数组，不要包含任何其他文字说明：
[
  {
    "title": "题目内容",
    "option_a": "选项A",
    "option_b": "选项B",
    "option_c": "选项C",
    "option_d": "选项D",
    "answer": "正确答案（如A、AB、对、错等）",
    "explanation": "答案解析",
    "difficulty": ${difficulty},
    "knowledge_tag": "${topic}"
  }
]

`;

        // 根据题型添加特定说明
        if (type === 'single') {
            prompt += `注意：单选题只有一个正确答案，answer字段填写A、B、C或D。`;
        } else if (type === 'multiple') {
            prompt += `注意：多选题有2-4个正确答案，answer字段填写正确选项的组合，如"AB"、"ACD"等。`;
        } else if (type === 'truefalse') {
            prompt += `注意：判断题option_a固定为"正确"，option_b固定为"错误"，option_c和option_d设为null，answer填写"A"表示正确或"B"表示错误。`;
        } else if (type === 'fillblank') {
            prompt += `注意：填空题在题目中用"___"标记填空位置，option_a到option_d都设为null，answer填写正确答案。`;
        }

        return prompt;
    },

    /**
     * 构建优化题目的提示词
     * @param {object} question - 题目对象
     * @returns {string} 提示词
     */
    buildOptimizePrompt(question) {
        const questionType = this.questionTypeMap[question.question_type] || '单选题';
        
        return `你是一位专业的教育工作者，请优化以下${questionType}，提升题目质量和表述清晰度：

原题目：
标题：${question.title}
选项A：${question.option_a || '无'}
选项B：${question.option_b || '无'}
选项C：${question.option_c || '无'}
选项D：${question.option_d || '无'}
正确答案：${question.answer}
解析：${question.explanation || '无'}
难度：${question.difficulty || 3}

请从以下方面进行优化：
1. 题目表述是否清晰、准确、无歧义
2. 选项设置是否合理，干扰项是否有效
3. 答案是否正确
4. 解析是否完整、易懂

请按照以下JSON格式返回优化结果，不要包含任何其他文字说明：
{
  "optimized": {
    "title": "优化后的题目",
    "option_a": "优化后的选项A",
    "option_b": "优化后的选项B",
    "option_c": "优化后的选项C",
    "option_d": "优化后的选项D",
    "answer": "正确答案",
    "explanation": "完善的解析",
    "difficulty": ${question.difficulty || 3}
  },
  "suggestions": [
    "优化建议1",
    "优化建议2"
  ],
  "changes": [
    "修改说明1",
    "修改说明2"
  ]
}`;
    },


    /**
     * 构建生成解析的提示词
     * @param {object} question - 题目对象
     * @returns {string} 提示词
     */
    buildExplanationPrompt(question) {
        const questionType = this.questionTypeMap[question.question_type] || '单选题';
        
        return `你是一位专业的教育工作者，请为以下${questionType}生成详细的答案解析：

题目：${question.title}
选项A：${question.option_a || '无'}
选项B：${question.option_b || '无'}
选项C：${question.option_c || '无'}
选项D：${question.option_d || '无'}
正确答案：${question.answer}

请生成一段清晰、易懂的答案解析，解释为什么正确答案是${question.answer}，以及其他选项为什么不正确。

请直接返回解析文本，不要包含JSON格式或其他标记。`;
    },

    /**
     * 构建质量检查的提示词
     * @param {object} question - 题目对象
     * @returns {string} 提示词
     */
    buildQualityCheckPrompt(question) {
        const questionType = this.questionTypeMap[question.question_type] || '单选题';
        
        return `你是一位专业的教育质量评估专家，请评估以下${questionType}的质量：

题目：${question.title}
选项A：${question.option_a || '无'}
选项B：${question.option_b || '无'}
选项C：${question.option_c || '无'}
选项D：${question.option_d || '无'}
正确答案：${question.answer}
解析：${question.explanation || '无'}
难度：${question.difficulty || 3}

请从以下维度评估（每项1-10分）：
1. 题目清晰度：表述是否清晰、无歧义
2. 选项质量：选项设置是否合理、干扰项是否有效
3. 答案正确性：答案是否正确
4. 解析完整性：解析是否完整、易懂
5. 难度适当性：难度标注是否准确

请按照以下JSON格式返回评估结果，不要包含任何其他文字说明：
{
  "score": 85,
  "dimensions": {
    "clarity": 8,
    "options": 9,
    "correctness": 10,
    "explanation": 7,
    "difficulty": 8
  },
  "issues": [
    "发现的问题1",
    "发现的问题2"
  ],
  "suggestions": [
    "改进建议1",
    "改进建议2"
  ]
}`;
    },

    /**
     * 调用AI API
     * @param {string} prompt - 提示词
     * @param {object} [options] - 额外选项
     * @returns {Promise<{success: boolean, content?: string, error?: string, errorType?: string}>}
     */
    async callAPI(prompt, options = {}) {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: '请先配置API密钥',
                errorType: 'config_error'
            };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const messages = [
            {
                role: 'system',
                content: '你是一位专业的教育工作者和题目设计专家。请严格按照要求的JSON格式返回结果。'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        try {
            let response;
            
            // 使用代理解决CORS问题
            if (this.config.useProxy) {
                response = await fetch(this.config.proxyEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        provider: this.config.provider,
                        apiKey: this.config.apiKey,
                        model: this.config.model,
                        messages: messages,
                        temperature: options.temperature || 0.7,
                        max_tokens: options.maxTokens || 2000,
                        endpoint: this.config.apiEndpoint // 用于自定义端点
                    }),
                    signal: controller.signal
                });
            } else {
                // 直接调用API（可能会有CORS问题）
                response = await fetch(this.config.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.config.model,
                        messages: messages,
                        temperature: options.temperature || 0.7,
                        max_tokens: options.maxTokens || 2000
                    }),
                    signal: controller.signal
                });
            }

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // 处理特定错误类型
                if (response.status === 401) {
                    return {
                        success: false,
                        error: 'API密钥无效，请检查配置',
                        errorType: 'auth_error'
                    };
                }
                if (response.status === 429) {
                    return {
                        success: false,
                        error: '请求过于频繁，请稍后重试',
                        errorType: 'rate_limit'
                    };
                }
                if (response.status >= 500) {
                    return {
                        success: false,
                        error: 'AI服务暂时不可用，请稍后重试',
                        errorType: 'server_error'
                    };
                }

                return {
                    success: false,
                    error: errorData.error?.message || `请求失败 (${response.status})`,
                    errorType: 'api_error'
                };
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                return {
                    success: false,
                    error: 'AI返回内容为空',
                    errorType: 'empty_response'
                };
            }

            return {
                success: true,
                content: content.trim(),
                usage: data.usage
            };

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: '请求超时，请稍后重试',
                    errorType: 'timeout'
                };
            }

            return {
                success: false,
                error: error.message || '网络请求失败',
                errorType: 'network_error'
            };
        }
    },


    /**
     * 解析JSON响应
     * @param {string} content - AI返回的内容
     * @returns {{success: boolean, data?: any, error?: string}}
     */
    parseJSONResponse(content) {
        try {
            // 尝试直接解析
            const data = JSON.parse(content);
            return { success: true, data };
        } catch (e) {
            // 尝试提取JSON部分
            const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[0]);
                    return { success: true, data };
                } catch (e2) {
                    return { success: false, error: '无法解析AI返回的JSON格式' };
                }
            }
            return { success: false, error: '无法解析AI返回的内容' };
        }
    },

    /**
     * 验证生成数量约束
     * @param {number} count - 请求的数量
     * @returns {{valid: boolean, count: number, error?: string}}
     */
    validateGenerateCount(count) {
        const num = Number(count);
        if (isNaN(num) || !Number.isInteger(num)) {
            return { valid: false, count: 1, error: '数量必须是整数' };
        }
        if (num < 1) {
            return { valid: false, count: 1, error: '数量不能小于1' };
        }
        if (num > 10) {
            return { valid: false, count: 10, error: '数量不能超过10' };
        }
        return { valid: true, count: num };
    },

    /**
     * 生成题目
     * @param {object} options - 生成选项
     * @param {string} options.topic - 知识点或主题
     * @param {string} options.type - 题型 (single, multiple, truefalse, fillblank)
     * @param {number} options.difficulty - 难度级别 (1-5)
     * @param {number} options.count - 生成数量 (1-10)
     * @param {string} [options.context] - 额外上下文
     * @returns {Promise<{success: boolean, questions?: Array, error?: string}>}
     */
    async generateQuestions(options) {
        // 验证必需参数
        if (!options || !options.topic) {
            return { success: false, error: '请输入知识点或主题', questions: [] };
        }

        // 验证题型
        const validTypes = ['single', 'multiple', 'truefalse', 'fillblank'];
        const type = options.type || 'single';
        if (!validTypes.includes(type)) {
            return { success: false, error: '无效的题型', questions: [] };
        }

        // 验证难度
        const difficulty = Number(options.difficulty) || 3;
        if (difficulty < 1 || difficulty > 5) {
            return { success: false, error: '难度必须在1-5之间', questions: [] };
        }

        // 验证数量约束
        const countValidation = this.validateGenerateCount(options.count);
        const count = countValidation.count;

        // 构建提示词
        const prompt = this.buildGeneratePrompt({
            topic: options.topic,
            type,
            difficulty,
            count,
            context: options.context
        });

        // 调用API
        const apiResult = await this.callAPI(prompt);
        if (!apiResult.success) {
            return { success: false, error: apiResult.error, questions: [] };
        }

        // 解析响应
        const parseResult = this.parseJSONResponse(apiResult.content);
        if (!parseResult.success) {
            return { success: false, error: parseResult.error, questions: [] };
        }

        // 验证返回的题目数组
        let questions = parseResult.data;
        if (!Array.isArray(questions)) {
            questions = [questions];
        }

        // 确保不超过请求的数量
        questions = questions.slice(0, count);

        // 为每个题目添加题型
        questions = questions.map(q => ({
            ...q,
            question_type: type,
            difficulty: q.difficulty || difficulty,
            knowledge_tag: q.knowledge_tag || options.topic
        }));

        return {
            success: true,
            questions,
            requestedCount: count,
            actualCount: questions.length
        };
    },

    /**
     * 优化题目
     * @param {object} question - 题目对象
     * @returns {Promise<{success: boolean, original?: object, optimized?: object, suggestions?: Array, error?: string}>}
     */
    async optimizeQuestion(question) {
        if (!question || !question.title) {
            return { success: false, error: '题目内容不能为空' };
        }

        const prompt = this.buildOptimizePrompt(question);
        const apiResult = await this.callAPI(prompt);
        
        if (!apiResult.success) {
            return { success: false, error: apiResult.error };
        }

        const parseResult = this.parseJSONResponse(apiResult.content);
        if (!parseResult.success) {
            return { success: false, error: parseResult.error };
        }

        const result = parseResult.data;
        
        return {
            success: true,
            original: question,
            optimized: result.optimized || result,
            suggestions: result.suggestions || [],
            changes: result.changes || []
        };
    },

    /**
     * 生成题目解析
     * @param {object} question - 题目对象
     * @returns {Promise<{success: boolean, explanation?: string, error?: string}>}
     */
    async generateExplanation(question) {
        if (!question || !question.title) {
            return { success: false, error: '题目内容不能为空' };
        }

        const prompt = this.buildExplanationPrompt(question);
        const apiResult = await this.callAPI(prompt, { temperature: 0.5 });
        
        if (!apiResult.success) {
            return { success: false, error: apiResult.error };
        }

        return {
            success: true,
            explanation: apiResult.content
        };
    },

    /**
     * 检查题目质量
     * @param {object} question - 题目对象
     * @returns {Promise<{success: boolean, score?: number, issues?: Array, suggestions?: Array, error?: string}>}
     */
    async checkQuality(question) {
        if (!question || !question.title) {
            return { success: false, error: '题目内容不能为空' };
        }

        const prompt = this.buildQualityCheckPrompt(question);
        const apiResult = await this.callAPI(prompt, { temperature: 0.3 });
        
        if (!apiResult.success) {
            return { success: false, error: apiResult.error };
        }

        const parseResult = this.parseJSONResponse(apiResult.content);
        if (!parseResult.success) {
            return { success: false, error: parseResult.error };
        }

        const result = parseResult.data;
        
        return {
            success: true,
            score: result.score || 0,
            dimensions: result.dimensions || {},
            issues: result.issues || [],
            suggestions: result.suggestions || []
        };
    },


    /**
     * 获取友好的错误提示
     * @param {string} errorType - 错误类型
     * @param {string} [originalError] - 原始错误信息
     * @returns {string} 友好的错误提示
     */
    getFriendlyErrorMessage(errorType, originalError) {
        const errorMessages = {
            config_error: '请先在设置中配置AI API密钥',
            auth_error: 'API密钥无效，请检查配置是否正确',
            rate_limit: '请求过于频繁，请等待几秒后重试',
            timeout: '请求超时，可能是网络问题或AI服务繁忙，请稍后重试',
            network_error: '网络连接失败，请检查网络后重试',
            server_error: 'AI服务暂时不可用，请稍后重试',
            empty_response: 'AI返回内容为空，请重试',
            parse_error: 'AI返回格式异常，请重试',
            api_error: originalError || 'API请求失败，请稍后重试'
        };

        return errorMessages[errorType] || originalError || '发生未知错误，请稍后重试';
    },

    /**
     * 带重试的API调用
     * @param {string} prompt - 提示词
     * @param {object} [options] - 额外选项
     * @returns {Promise<{success: boolean, content?: string, error?: string, errorType?: string}>}
     */
    async callAPIWithRetry(prompt, options = {}) {
        let lastError = null;
        const maxRetries = this.config.maxRetries || 2;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const result = await this.callAPI(prompt, options);
            
            if (result.success) {
                return result;
            }

            lastError = result;

            // 不重试的错误类型
            const noRetryErrors = ['config_error', 'auth_error', 'rate_limit'];
            if (noRetryErrors.includes(result.errorType)) {
                return result;
            }

            // 等待后重试
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }

        return lastError;
    },

    /**
     * 显示错误提示（UI辅助函数）
     * @param {string} error - 错误信息
     * @param {string} [errorType] - 错误类型
     */
    showError(error, errorType) {
        const message = this.getFriendlyErrorMessage(errorType, error);
        
        // 如果有全局的toast函数，使用它
        if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
            window.showToast(message, 'error');
        } else if (typeof alert === 'function') {
            alert(message);
        }
        
        console.error('[AIAssistant]', error, errorType);
    },

    /**
     * 显示成功提示（UI辅助函数）
     * @param {string} message - 成功信息
     */
    showSuccess(message) {
        if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
            window.showToast(message, 'success');
        }
        console.log('[AIAssistant]', message);
    },

    /**
     * 记录AI操作日志
     * @param {object} supabase - Supabase客户端实例
     * @param {string} action - 操作类型 (generate, optimize, explain, quality)
     * @param {object} inputData - 输入数据
     * @param {object} outputData - 输出数据
     * @param {number} [tokensUsed] - 使用的token数量
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async logOperation(supabase, action, inputData, outputData, tokensUsed) {
        if (!supabase) {
            return { success: false, error: '无数据库连接' };
        }

        try {
            const { error } = await supabase
                .from('ai_generation_log')
                .insert({
                    action,
                    input_data: inputData,
                    output_data: outputData,
                    tokens_used: tokensUsed || null
                });

            if (error) {
                console.warn('[AIAssistant] 日志记录失败:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (e) {
            console.warn('[AIAssistant] 日志记录异常:', e.message);
            return { success: false, error: e.message };
        }
    },

    /**
     * 获取支持的模型列表
     * @returns {Array<{id: string, name: string, provider: string}>}
     */
    getSupportedModels() {
        return [
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
            { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic' },
            { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
            { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek' },
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', provider: 'DeepSeek' }
        ];
    },

    /**
     * 获取API端点建议
     * @param {string} provider - 提供商 (openai, anthropic, deepseek, custom)
     * @returns {string} API端点
     */
    getDefaultEndpoint(provider) {
        const endpoints = {
            openai: 'https://api.openai.com/v1/chat/completions',
            anthropic: 'https://api.anthropic.com/v1/messages',
            deepseek: 'https://api.deepseek.com/chat/completions',
            custom: ''
        };
        return endpoints[provider] || endpoints.openai;
    },

    /**
     * 获取提供商列表
     * @returns {Array<{id: string, name: string, endpoint: string}>}
     */
    getProviders() {
        return [
            { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions' },
            { id: 'anthropic', name: 'Anthropic', endpoint: 'https://api.anthropic.com/v1/messages' },
            { id: 'deepseek', name: 'DeepSeek', endpoint: 'https://api.deepseek.com/chat/completions' },
            { id: 'custom', name: '自定义', endpoint: '' }
        ];
    },

    /**
     * 快速配置DeepSeek
     * @param {string} apiKey - DeepSeek API密钥
     * @param {string} [model='deepseek-chat'] - 模型名称
     */
    configureDeepSeek(apiKey, model = 'deepseek-chat') {
        this.configure({
            apiKey: apiKey,
            apiEndpoint: 'https://api.deepseek.com/chat/completions',
            model: model
        });
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.AIAssistant = AIAssistant;
}

// 支持模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIAssistant };
}
