// ================= 公共配置和工具函数 =================

// Supabase 配置 (统一管理)
const SUPABASE_CONFIG = {
    url: 'https://urqxrtlzaifvambytoci.supabase.co',
    key: 'sb_publishable_UWJrATWMObB576H3ODCicQ_FXX5Li8h'
};

// 创建 Supabase 客户端
function createSupabaseClient() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded');
        return null;
    }
    return supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
}

// ================= 全局课堂控制监听 =================
// 统一的课堂遥控监听功能
function initGlobalControlListener(supabaseClient) {
    if (!supabaseClient) return;
    
    const checkInterval = setInterval(() => {
        if (typeof supabaseClient !== 'undefined') {
            clearInterval(checkInterval);
            startGlobalListening(supabaseClient);
        }
    }, 100);
}

function startGlobalListening(supabaseClient) {
    console.log("📡 已启动课堂遥控监听...");
    
    supabaseClient
        .channel('global-control-sub')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'global_state' 
        }, payload => {
            handleGlobalStateChange(payload.new);
        })
        .subscribe();
}

// 页面路径映射表
const PAGE_MAP = {
    'vote.html': '/vote',
    'danmu.html': '/danmu',
    'buzzer.html': '/buzzer',
    'sign.html': '/sign',
    'lucky.html': '/lucky'
};

function handleGlobalStateChange(data) {
    const currentPath = window.location.pathname;
    
    // 1. 老师开启了某个功能
    if (data.status === 'active' && data.current_page !== 'idle') {
        // 将数据库中的文件名转换为正确的URL路径
        const targetPage = PAGE_MAP[data.current_page] || `/classroom/${data.current_page}`;
        
        // 如果当前不在老师指定的页面，就强制跳转
        if (currentPath !== targetPage) {
            console.log(`👨‍🏫 老师切换到了 ${targetPage}，正在跟进...`);
            window.location.href = targetPage;
        }
    } 
    // 2. 老师释放了控制 (下课/自由活动)
    else if (data.status === 'idle') {
        // 如果现在不是在首页，就被踢回首页
        if (currentPath !== '/classroom' && currentPath !== '/classroom/') {
            console.log("⏸️ 自由活动模式，返回首页");
            window.location.href = '/classroom';
        }
    }
}

// ================= 用户身份验证 =================
// 检查用户是否已签到
function checkUserAuth() {
    const myName = localStorage.getItem('my_name');
    const myId = localStorage.getItem('my_id');
    
    if (!myName || !myId) {
        alert("⚠️ 请先签到！");
        window.location.href = '/sign';
        return null;
    }
    
    return { name: myName, id: myId };
}

// ================= 工具函数 =================
// HTML 转义，防止 XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化时间
function formatTime(dateString) {
    return new Date(dateString).toLocaleString();
}

// 显示消息提示
function showMessage(element, message, type = 'info') {
    if (!element) return;
    
    element.textContent = message;
    element.style.color = type === 'error' ? '#ef4444' : 
                         type === 'success' ? '#10b981' : '#666';
}

// 获取今天的日期字符串
function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

// ================= 导出到全局 =================
window.ClassroomCommon = {
    SUPABASE_CONFIG,
    createSupabaseClient,
    initGlobalControlListener,
    checkUserAuth,
    escapeHtml,
    formatTime,
    showMessage,
    getTodayKey
};