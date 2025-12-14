/**
 * 导入导出增强模块
 * 支持多格式导入导出、错误标记、验证功能
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.2, 7.3, 7.5
 */

const ImportExport = {
    /**
     * 验证题目数据
     * @param {Object} question - 题目对象
     * @param {string} type - 题目类型 (single, multiple, truefalse, fillblank)
     * @returns {{ valid: boolean, errors: string[] }}
     * Requirements: 6.3
     */
    validateQuestion(question, type) {
        const errors = [];
        
        // 验证题目标题
        if (!question.title || typeof question.title !== 'string' || question.title.trim() === '') {
            errors.push('题目标题不能为空');
        }
        
        // 根据题型验证
        switch (type) {
            case 'single':
            case 'multiple':
                // 验证选项
                if (!question.option_a || question.option_a.trim() === '') {
                    errors.push('选项A不能为空');
                }
                if (!question.option_b || question.option_b.trim() === '') {
                    errors.push('选项B不能为空');
                }
                // C和D选项可选，但如果有答案引用则必须存在
                if (question.answer) {
                    const answerStr = String(question.answer).toUpperCase();
                    if (answerStr.includes('C') && (!question.option_c || question.option_c.trim() === '')) {
                        errors.push('答案包含C但选项C为空');
                    }
                    if (answerStr.includes('D') && (!question.option_d || question.option_d.trim() === '')) {
                        errors.push('答案包含D但选项D为空');
                    }
                }
                // 验证答案格式
                if (!question.answer || question.answer.trim() === '') {
                    errors.push('答案不能为空');
                } else {
                    const answerStr = String(question.answer).toUpperCase();
                    if (type === 'single') {
                        if (!/^[A-D]$/.test(answerStr)) {
                            errors.push('单选题答案必须是A、B、C或D中的一个');
                        }
                    } else {
                        if (!/^[A-D]+$/.test(answerStr)) {
                            errors.push('多选题答案必须是A、B、C、D的组合');
                        }
                        if (answerStr.length < 2) {
                            errors.push('多选题答案至少需要两个选项');
                        }
                    }
                }
                break;
                
            case 'truefalse':
                // 验证判断题答案
                if (!question.answer && question.answer !== false) {
                    errors.push('答案不能为空');
                } else {
                    const answerStr = String(question.answer).toLowerCase();
                    const validAnswers = ['对', '错', 't', 'f', 'true', 'false', '1', '0', 'yes', 'no'];
                    if (!validAnswers.includes(answerStr)) {
                        errors.push('判断题答案必须是：对/错、T/F、true/false');
                    }
                }
                break;
                
            case 'fillblank':
                // 验证填空题
                if (!question.answer || question.answer.trim() === '') {
                    errors.push('答案不能为空');
                }
                // 检查题目是否包含填空标记
                if (question.title && !question.title.includes('____') && !question.title.includes('___')) {
                    // 这是警告，不是错误
                }
                break;
                
            default:
                errors.push(`未知的题目类型: ${type}`);
        }
        
        // 验证难度（可选字段）
        if (question.difficulty !== undefined && question.difficulty !== null && question.difficulty !== '') {
            const diff = parseInt(question.difficulty);
            if (isNaN(diff) || diff < 1 || diff > 5) {
                errors.push('难度必须是1-5之间的整数');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * 解析CSV行（处理引号内的逗号）
     * @param {string} line - CSV行
     * @returns {string[]}
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                // 处理转义的引号
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        
        return result;
    },

    /**
     * 增强版CSV解析（支持错误标记）
     * @param {string} csvText - CSV文本内容
     * @param {string} questionType - 题目类型
     * @returns {{ valid: Object[], invalid: Object[], errors: Object[] }}
     * Requirements: 6.1, 6.3
     */
    parseCSV(csvText, questionType) {
        const lines = csvText.trim().split('\n');
        const valid = [];
        const invalid = [];
        const errors = [];
        
        if (lines.length < 2) {
            errors.push({ row: 0, message: 'CSV文件为空或只有标题行' });
            return { valid, invalid, errors };
        }
        
        // 跳过标题行
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cells = this.parseCSVLine(line);
            const rowNum = i + 1; // 人类可读的行号
            
            let question;
            let parseError = null;
            
            try {
                question = this.cellsToQuestion(cells, questionType, i);
            } catch (e) {
                parseError = e.message;
            }
            
            if (parseError) {
                errors.push({ row: rowNum, message: parseError });
                invalid.push({ row: rowNum, data: cells, error: parseError });
                continue;
            }
            
            // 验证题目
            const validation = this.validateQuestion(question, questionType);
            
            if (validation.valid) {
                valid.push(question);
            } else {
                errors.push({ row: rowNum, message: validation.errors.join('; ') });
                invalid.push({ row: rowNum, data: question, error: validation.errors.join('; ') });
            }
        }
        
        return { valid, invalid, errors };
    },

    /**
     * 将CSV单元格转换为题目对象
     * @param {string[]} cells - CSV单元格数组
     * @param {string} questionType - 题目类型
     * @param {number} index - 行索引
     * @returns {Object}
     */
    cellsToQuestion(cells, questionType, index) {
        switch (questionType) {
            case 'single':
            case 'multiple':
                if (cells.length < 6) {
                    throw new Error(`列数不足，需要至少6列（题目、选项A-D、答案），实际${cells.length}列`);
                }
                return {
                    round: index,
                    title: cells[0],
                    option_a: cells[1],
                    option_b: cells[2],
                    option_c: cells[3] || '',
                    option_d: cells[4] || '',
                    answer: cells[5] ? cells[5].toUpperCase() : '',
                    knowledge_tag: cells[6] || null,
                    difficulty: parseInt(cells[7]) || 1,
                    question_type: questionType
                };
                
            case 'truefalse':
                if (cells.length < 2) {
                    throw new Error(`列数不足，需要至少2列（题目、答案），实际${cells.length}列`);
                }
                return {
                    round: index,
                    title: cells[0],
                    option_a: '对',
                    option_b: '错',
                    option_c: '',
                    option_d: '',
                    answer: this.normalizeTrueFalseAnswer(cells[1]),
                    knowledge_tag: cells[2] || null,
                    difficulty: parseInt(cells[3]) || 1,
                    question_type: questionType
                };
                
            case 'fillblank':
                if (cells.length < 2) {
                    throw new Error(`列数不足，需要至少2列（题目、答案），实际${cells.length}列`);
                }
                return {
                    round: index,
                    title: cells[0],
                    option_a: '',
                    option_b: '',
                    option_c: '',
                    option_d: '',
                    answer: cells[1],
                    knowledge_tag: cells[2] || null,
                    difficulty: parseInt(cells[3]) || 1,
                    question_type: questionType
                };
                
            default:
                throw new Error(`未知的题目类型: ${questionType}`);
        }
    },

    /**
     * 标准化判断题答案
     * @param {string} answer - 原始答案
     * @returns {string} - 标准化后的答案 (A=对, B=错)
     */
    normalizeTrueFalseAnswer(answer) {
        if (!answer) return '';
        const answerStr = String(answer).toLowerCase().trim();
        const trueValues = ['对', 't', 'true', '1', 'yes', '正确'];
        return trueValues.includes(answerStr) ? 'A' : 'B';
    },


    /**
     * 解析Excel文件
     * @param {File} file - Excel文件
     * @param {string} questionType - 题目类型
     * @returns {Promise<{ valid: Object[], invalid: Object[], errors: Object[] }>}
     * Requirements: 6.2
     */
    async parseExcel(file, questionType) {
        return new Promise((resolve, reject) => {
            // 检查XLSX库是否可用
            if (typeof XLSX === 'undefined') {
                reject(new Error('SheetJS库未加载，请确保已引入xlsx.js'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 获取第一个工作表
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // 转换为CSV格式
                    const csvText = XLSX.utils.sheet_to_csv(worksheet);
                    
                    // 使用CSV解析器处理
                    const result = this.parseCSV(csvText, questionType);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Excel解析失败: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * 增强版导入题目到数据库
     * @param {Object} supabase - Supabase客户端
     * @param {Object[]} questions - 题目数组
     * @param {Object} options - 导入选项
     * @returns {Promise<{ success: number, skipped: number, errors: Object[] }>}
     * Requirements: 6.4, 6.5, 6.6
     */
    async importQuestions(supabase, questions, options = {}) {
        const { 
            taskId = null, 
            overwrite = false, 
            startRound = 1,
            clearExisting = false
        } = options;
        
        const result = {
            success: 0,
            skipped: 0,
            errors: []
        };
        
        if (!questions || questions.length === 0) {
            return result;
        }
        
        try {
            // 如果需要清空现有题目
            if (clearExisting && taskId) {
                const { error: deleteError } = await supabase
                    .from('questions')
                    .delete()
                    .eq('task_id', taskId);
                    
                if (deleteError) {
                    result.errors.push({ message: `清空现有题目失败: ${deleteError.message}` });
                }
            }
            
            // 获取现有题目（用于检查重复）
            let existingQuestions = [];
            if (!overwrite && taskId) {
                const { data } = await supabase
                    .from('questions')
                    .select('round, title')
                    .eq('task_id', taskId);
                existingQuestions = data || [];
            }
            
            // 处理每个题目
            for (let i = 0; i < questions.length; i++) {
                const question = { ...questions[i] };
                question.round = startRound + i;
                
                if (taskId) {
                    question.task_id = taskId;
                }
                
                // 检查是否重复
                const isDuplicate = existingQuestions.some(
                    eq => eq.round === question.round || eq.title === question.title
                );
                
                if (isDuplicate && !overwrite) {
                    result.skipped++;
                    continue;
                }
                
                // 插入或更新题目
                const { error } = await supabase
                    .from('questions')
                    .upsert(question, { 
                        onConflict: taskId ? 'task_id,round' : 'round'
                    });
                
                if (error) {
                    result.errors.push({ 
                        row: i + 1, 
                        message: error.message,
                        question: question.title 
                    });
                } else {
                    result.success++;
                }
            }
        } catch (e) {
            result.errors.push({ message: `导入异常: ${e.message}` });
        }
        
        return result;
    },

    /**
     * 导出为CSV格式
     * @param {Object[]} questions - 题目数组
     * @returns {string}
     * Requirements: 7.2
     */
    exportToCSV(questions) {
        if (!questions || questions.length === 0) {
            return '';
        }
        
        // CSV标题行
        const headers = [
            '序号', '题目', '选项A', '选项B', '选项C', '选项D', 
            '答案', '题型', '知识点', '难度', '解析'
        ];
        
        const rows = [headers.join(',')];
        
        questions.forEach((q, index) => {
            const row = [
                q.round || index + 1,
                this.escapeCSV(q.title || ''),
                this.escapeCSV(q.option_a || ''),
                this.escapeCSV(q.option_b || ''),
                this.escapeCSV(q.option_c || ''),
                this.escapeCSV(q.option_d || ''),
                this.escapeCSV(q.answer || ''),
                this.escapeCSV(q.question_type || 'single'),
                this.escapeCSV(q.knowledge_tag || ''),
                q.difficulty || 1,
                this.escapeCSV(q.explanation || '')
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    },

    /**
     * CSV字段转义
     * @param {string} field - 字段值
     * @returns {string}
     */
    escapeCSV(field) {
        if (field === null || field === undefined) {
            return '';
        }
        const str = String(field);
        // 如果包含逗号、引号或换行，需要用引号包裹
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    },

    /**
     * 导出为Excel格式
     * @param {Object[]} questions - 题目数组
     * @returns {Blob}
     * Requirements: 7.3
     */
    exportToExcel(questions) {
        if (typeof XLSX === 'undefined') {
            throw new Error('SheetJS库未加载，请确保已引入xlsx.js');
        }
        
        if (!questions || questions.length === 0) {
            throw new Error('没有可导出的题目');
        }
        
        // 准备数据
        const data = questions.map((q, index) => ({
            '序号': q.round || index + 1,
            '题目': q.title || '',
            '选项A': q.option_a || '',
            '选项B': q.option_b || '',
            '选项C': q.option_c || '',
            '选项D': q.option_d || '',
            '答案': q.answer || '',
            '题型': this.getQuestionTypeName(q.question_type),
            '知识点': q.knowledge_tag || '',
            '难度': q.difficulty || 1,
            '解析': q.explanation || ''
        }));
        
        // 创建工作表
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // 设置列宽
        worksheet['!cols'] = [
            { wch: 6 },   // 序号
            { wch: 50 },  // 题目
            { wch: 20 },  // 选项A
            { wch: 20 },  // 选项B
            { wch: 20 },  // 选项C
            { wch: 20 },  // 选项D
            { wch: 10 },  // 答案
            { wch: 10 },  // 题型
            { wch: 15 },  // 知识点
            { wch: 6 },   // 难度
            { wch: 40 }   // 解析
        ];
        
        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '题目');
        
        // 生成Blob
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    },

    /**
     * 导出为JSON格式
     * @param {Object[]} questions - 题目数组
     * @returns {string}
     * Requirements: 7.5
     */
    exportToJSON(questions) {
        if (!questions || questions.length === 0) {
            return '[]';
        }
        
        // 导出完整字段
        const exportData = questions.map(q => ({
            id: q.id,
            round: q.round,
            title: q.title,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            answer: q.answer,
            question_type: q.question_type,
            knowledge_tag: q.knowledge_tag,
            difficulty: q.difficulty,
            explanation: q.explanation,
            task_id: q.task_id,
            created_at: q.created_at,
            updated_at: q.updated_at
        }));
        
        return JSON.stringify(exportData, null, 2);
    },

    /**
     * 获取题型名称
     * @param {string} type - 题型代码
     * @returns {string}
     */
    getQuestionTypeName(type) {
        const typeNames = {
            'single': '单选题',
            'multiple': '多选题',
            'truefalse': '判断题',
            'fillblank': '填空题'
        };
        return typeNames[type] || type || '单选题';
    },

    /**
     * 触发文件下载
     * @param {string|Blob} content - 文件内容
     * @param {string} filename - 文件名
     * @param {string} mimeType - MIME类型
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        let blob;
        if (content instanceof Blob) {
            blob = content;
        } else {
            blob = new Blob([content], { type: mimeType });
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * 导出题目（统一入口）
     * @param {Object[]} questions - 题目数组
     * @param {string} format - 导出格式 (csv, excel, json)
     * @param {string} filename - 文件名（不含扩展名）
     */
    exportQuestions(questions, format, filename = 'questions') {
        switch (format) {
            case 'csv':
                const csvContent = this.exportToCSV(questions);
                this.downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
                break;
                
            case 'excel':
                const excelBlob = this.exportToExcel(questions);
                this.downloadFile(excelBlob, `${filename}.xlsx`);
                break;
                
            case 'json':
                const jsonContent = this.exportToJSON(questions);
                this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
                break;
                
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.ImportExport = ImportExport;
}

// 支持模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImportExport;
}
