/**
 * 题库管理模块
 * 支持题目导入、管理、与课件绑定
 */

const QuestionBank = {
    /**
     * 从CSV文本解析题目
     * 支持格式: 轮次,题目,选项A,选项B,选项C,选项D,答案[,知识点,难度]
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const questions = [];
        
        // 跳过标题行
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // 处理CSV中的引号和逗号
            const cells = this.parseCSVLine(line);
            if (cells.length < 7) continue;
            
            questions.push({
                round: parseInt(cells[0]) || i,
                title: cells[1],
                option_a: cells[2],
                option_b: cells[3],
                option_c: cells[4],
                option_d: cells[5],
                answer: cells[6].toUpperCase(),
                knowledge_tag: cells[7] || null,
                difficulty: parseInt(cells[8]) || 1
            });
        }
        
        return questions;
    },
    
    /**
     * 解析CSV行（处理引号内的逗号）
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
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
     * 批量导入题目到数据库
     */
    async importQuestions(supabase, questions, options = {}) {
        const { clearExisting = false, bankName = null } = options;
        
        try {
            // 如果需要清空现有题目
            if (clearExisting) {
                await supabase.from('questions').delete().neq('id', 0);
            }
            
            // 批量插入题目
            const { data, error } = await supabase
                .from('questions')
                .upsert(questions, { onConflict: 'round' })
                .select();
            
            if (error) {
                console.error('导入题目失败:', error);
                return { success: false, error, count: 0 };
            }
            
            console.log(`✅ 成功导入 ${data.length} 道题目`);
            return { success: true, count: data.length, data };
        } catch (e) {
            console.error('导入异常:', e);
            return { success: false, error: e, count: 0 };
        }
    },
    
    /**
     * 获取所有题目
     */
    async getAllQuestions(supabase) {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('round', { ascending: true });
        
        if (error) {
            console.error('获取题目失败:', error);
            return [];
        }
        return data || [];
    },
    
    /**
     * 获取单个题目
     */
    async getQuestion(supabase, round) {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('round', round)
            .maybeSingle();
        
        if (error) {
            console.error('获取题目失败:', error);
            return null;
        }
        return data;
    },
    
    /**
     * 添加或更新题目
     */
    async saveQuestion(supabase, question) {
        const { data, error } = await supabase
            .from('questions')
            .upsert(question, { onConflict: 'round' })
            .select()
            .single();
        
        if (error) {
            console.error('保存题目失败:', error);
            return null;
        }
        return data;
    },
    
    /**
     * 删除题目
     */
    async deleteQuestion(supabase, round) {
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('round', round);
        
        return !error;
    },
    
    /**
     * 绑定题目到课件页面
     */
    async bindToSlide(supabase, slideIndex, questionRound, triggerType = 'manual') {
        const { data, error } = await supabase
            .from('slide_questions')
            .upsert({
                slide_index: slideIndex,
                question_round: questionRound,
                trigger_type: triggerType
            }, { onConflict: 'slide_index,question_round' })
            .select();
        
        if (error) {
            console.error('绑定失败:', error);
            return false;
        }
        return true;
    },
    
    /**
     * 解除题目与课件的绑定
     */
    async unbindFromSlide(supabase, slideIndex, questionRound) {
        const { error } = await supabase
            .from('slide_questions')
            .delete()
            .eq('slide_index', slideIndex)
            .eq('question_round', questionRound);
        
        return !error;
    },
    
    /**
     * 获取课件页面绑定的题目
     */
    async getSlideQuestions(supabase, slideIndex) {
        const { data, error } = await supabase
            .from('slide_questions')
            .select(`
                *,
                questions (*)
            `)
            .eq('slide_index', slideIndex)
            .order('question_round', { ascending: true });
        
        if (error) {
            console.error('获取绑定题目失败:', error);
            return [];
        }
        return data || [];
    },
    
    /**
     * 获取所有课件-题目绑定关系
     */
    async getAllSlideBindings(supabase) {
        const { data, error } = await supabase
            .from('slide_questions')
            .select('*')
            .order('slide_index', { ascending: true });
        
        if (error) {
            console.error('获取绑定关系失败:', error);
            return [];
        }
        return data || [];
    },
    
    /**
     * 按知识点获取题目
     */
    async getQuestionsByTag(supabase, tag) {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('knowledge_tag', tag)
            .order('round', { ascending: true });
        
        if (error) {
            console.error('获取题目失败:', error);
            return [];
        }
        return data || [];
    },
    
    /**
     * 获取所有知识点标签
     */
    async getAllTags(supabase) {
        const { data, error } = await supabase
            .from('questions')
            .select('knowledge_tag')
            .not('knowledge_tag', 'is', null);
        
        if (error) return [];
        
        const tags = [...new Set(data.map(d => d.knowledge_tag).filter(Boolean))];
        return tags;
    },
    
    /**
     * 获取题目统计
     */
    async getStats(supabase) {
        const questions = await this.getAllQuestions(supabase);
        const tags = await this.getAllTags(supabase);
        
        const difficultyCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        questions.forEach(q => {
            const d = q.difficulty || 1;
            if (difficultyCount[d] !== undefined) difficultyCount[d]++;
        });
        
        return {
            totalCount: questions.length,
            tagCount: tags.length,
            tags: tags,
            difficultyDistribution: difficultyCount
        };
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.QuestionBank = QuestionBank;
}
