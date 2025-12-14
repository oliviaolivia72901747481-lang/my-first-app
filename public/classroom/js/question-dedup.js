/**
 * 题目去重检测模块
 * 检测相似题目，避免重复
 * 
 * @module QuestionDedup
 */

const QuestionDedup = {
    /**
     * 相似度阈值（0-1），超过此值认为是相似题目
     */
    similarityThreshold: 0.8,

    /**
     * 计算两个字符串的相似度（Jaccard相似系数）
     * @param {string} str1 - 字符串1
     * @param {string} str2 - 字符串2
     * @returns {number} 相似度（0-1）
     */
    calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        // 预处理：转小写，移除标点和空格
        const normalize = (s) => s.toLowerCase()
            .replace(/[，。？！、；：""''（）\[\]【】\s\.,\?!;:'"()\-]/g, '');
        
        const s1 = normalize(str1);
        const s2 = normalize(str2);
        
        if (s1 === s2) return 1;
        if (s1.length === 0 || s2.length === 0) return 0;
        
        // 使用字符级别的Jaccard相似度
        const set1 = new Set(s1.split(''));
        const set2 = new Set(s2.split(''));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        const jaccardSimilarity = intersection.size / union.size;
        
        // 同时计算编辑距离相似度
        const editSimilarity = this.calculateEditSimilarity(s1, s2);
        
        // 取两种相似度的最大值
        return Math.max(jaccardSimilarity, editSimilarity);
    },

    /**
     * 计算编辑距离相似度
     * @param {string} str1 - 字符串1
     * @param {string} str2 - 字符串2
     * @returns {number} 相似度（0-1）
     */
    calculateEditSimilarity(str1, str2) {
        const maxLen = Math.max(str1.length, str2.length);
        if (maxLen === 0) return 1;
        
        const distance = this.levenshteinDistance(str1, str2);
        return 1 - distance / maxLen;
    },

    /**
     * 计算Levenshtein编辑距离
     * @param {string} str1 - 字符串1
     * @param {string} str2 - 字符串2
     * @returns {number} 编辑距离
     */
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        
        // 优化：如果长度差异太大，直接返回较大长度
        if (Math.abs(m - n) > Math.max(m, n) * 0.5) {
            return Math.max(m, n);
        }
        
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,     // 删除
                        dp[i][j - 1] + 1,     // 插入
                        dp[i - 1][j - 1] + 1  // 替换
                    );
                }
            }
        }
        
        return dp[m][n];
    },


    /**
     * 检测单个题目是否与现有题目重复
     * @param {object} newQuestion - 新题目
     * @param {Array} existingQuestions - 现有题目列表
     * @returns {{isDuplicate: boolean, similarQuestions: Array}} 检测结果
     */
    checkDuplicate(newQuestion, existingQuestions) {
        const similarQuestions = [];
        
        for (const existing of existingQuestions) {
            // 跳过同一题目（编辑时）
            if (existing.id && newQuestion.id && existing.id === newQuestion.id) {
                continue;
            }
            
            const similarity = this.calculateSimilarity(newQuestion.title, existing.title);
            
            if (similarity >= this.similarityThreshold) {
                similarQuestions.push({
                    question: existing,
                    similarity: similarity,
                    similarityPercent: Math.round(similarity * 100)
                });
            }
        }
        
        // 按相似度降序排序
        similarQuestions.sort((a, b) => b.similarity - a.similarity);
        
        return {
            isDuplicate: similarQuestions.length > 0,
            similarQuestions: similarQuestions.slice(0, 5) // 最多返回5个相似题目
        };
    },

    /**
     * 批量检测题目重复
     * @param {Array} newQuestions - 新题目列表
     * @param {Array} existingQuestions - 现有题目列表
     * @returns {Array} 每个题目的检测结果
     */
    checkDuplicateBatch(newQuestions, existingQuestions) {
        const results = [];
        
        // 合并现有题目和已检测的新题目，用于检测新题目之间的重复
        const allQuestions = [...existingQuestions];
        
        for (let i = 0; i < newQuestions.length; i++) {
            const newQ = newQuestions[i];
            const result = this.checkDuplicate(newQ, allQuestions);
            
            results.push({
                index: i,
                question: newQ,
                ...result
            });
            
            // 将当前题目加入检测池，用于检测后续题目
            allQuestions.push(newQ);
        }
        
        return results;
    },

    /**
     * 生成重复检测报告HTML
     * @param {object} result - 检测结果
     * @returns {string} HTML字符串
     */
    generateDuplicateWarningHTML(result) {
        if (!result.isDuplicate) return '';
        
        const warnings = result.similarQuestions.map(item => {
            const q = item.question;
            return `
                <div style="padding:10px; background:rgba(239,68,68,0.1); border-radius:8px; margin-bottom:8px; border-left:3px solid #ef4444;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <span style="color:#ef4444; font-weight:bold;">相似度: ${item.similarityPercent}%</span>
                        <span style="color:#94a3b8; font-size:0.8rem;">序号: ${q.round || '-'}</span>
                    </div>
                    <div style="color:#e2e8f0; font-size:0.9rem;">${q.title}</div>
                    ${q.answer ? `<div style="color:#10b981; font-size:0.8rem; margin-top:5px;">答案: ${q.answer}</div>` : ''}
                </div>
            `;
        }).join('');
        
        return `
            <div style="margin-top:15px; padding:15px; background:rgba(239,68,68,0.05); border-radius:10px; border:1px solid rgba(239,68,68,0.3);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <span style="font-size:1.2rem;">⚠️</span>
                    <span style="color:#ef4444; font-weight:bold;">发现 ${result.similarQuestions.length} 个相似题目</span>
                </div>
                ${warnings}
            </div>
        `;
    },

    /**
     * 生成批量导入重复检测报告
     * @param {Array} results - 批量检测结果
     * @returns {{html: string, duplicateCount: number, uniqueCount: number}}
     */
    generateBatchReport(results) {
        const duplicates = results.filter(r => r.isDuplicate);
        const duplicateCount = duplicates.length;
        const uniqueCount = results.length - duplicateCount;
        
        if (duplicateCount === 0) {
            return {
                html: `<div style="color:#10b981; padding:10px;">✅ 未发现重复题目</div>`,
                duplicateCount: 0,
                uniqueCount: results.length
            };
        }
        
        const reportItems = duplicates.map(r => {
            const topSimilar = r.similarQuestions[0];
            return `
                <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; margin-bottom:8px;">
                    <div style="color:#f59e0b; font-size:0.85rem; margin-bottom:5px;">
                        第 ${r.index + 1} 题 - 相似度 ${topSimilar.similarityPercent}%
                    </div>
                    <div style="color:#e2e8f0; font-size:0.9rem; margin-bottom:5px;">
                        新题: ${r.question.title.substring(0, 50)}${r.question.title.length > 50 ? '...' : ''}
                    </div>
                    <div style="color:#94a3b8; font-size:0.85rem;">
                        相似: ${topSimilar.question.title.substring(0, 50)}${topSimilar.question.title.length > 50 ? '...' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        return {
            html: `
                <div style="margin-top:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="color:#f59e0b;">⚠️ 发现 ${duplicateCount} 个可能重复的题目</span>
                        <span style="color:#94a3b8; font-size:0.85rem;">${uniqueCount} 个唯一题目</span>
                    </div>
                    <div style="max-height:200px; overflow-y:auto;">
                        ${reportItems}
                    </div>
                </div>
            `,
            duplicateCount,
            uniqueCount
        };
    },

    /**
     * 设置相似度阈值
     * @param {number} threshold - 阈值（0-1）
     */
    setThreshold(threshold) {
        if (threshold >= 0 && threshold <= 1) {
            this.similarityThreshold = threshold;
        }
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.QuestionDedup = QuestionDedup;
}

// 支持模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestionDedup };
}
