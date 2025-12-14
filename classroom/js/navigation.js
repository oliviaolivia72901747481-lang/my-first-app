// ================= 统一底部导航组件 =================
// 学生端底部导航栏，包含首页、答题、历史、排行、我的五个入口

// 导航项配置
const NAV_ITEMS = [
    { id: 'home', href: 'index.html', icon: '🏠', label: '首页' },
    { id: 'vote', href: 'vote.html', icon: '📊', label: '答题' },
    { id: 'history', href: 'history.html', icon: '📚', label: '历史' },
    { id: 'rank', href: 'rank.html', icon: '🏆', label: '排行' },
    { id: 'profile', href: 'profile.html', icon: '👤', label: '我的' }
];

// 创建底部导航栏
function createBottomNavigation() {
    const nav = document.createElement('div');
    nav.className = 'bottom-nav';
    
    // 根据配置生成导航项
    nav.innerHTML = NAV_ITEMS.map(item => `
        <a href="${item.href}" class="nav-item" id="nav-${item.id}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
        </a>
    `).join('');
    
    // 添加样式
    if (!document.getElementById('nav-styles')) {
        const style = document.createElement('style');
        style.id = 'nav-styles';
        style.textContent = `
            body { padding-bottom: 70px; }
            .bottom-nav {
                position: fixed; bottom: 0; left: 0; width: 100%;
                height: 60px; background: white;
                border-top: 1px solid #eee;
                display: flex; justify-content: space-around; align-items: center;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 999;
            }
            .nav-item {
                text-decoration: none; color: #94a3b8; font-size: 12px;
                display: flex; flex-direction: column; align-items: center;
                padding: 5px; border-radius: 8px; transition: all 0.2s;
            }
            .nav-item:hover { background: #f1f5f9; }
            .nav-item.active { color: #2563eb; font-weight: bold; }
            .nav-icon { font-size: 20px; margin-bottom: 2px; }
        `;
        document.head.appendChild(style);
    }
    
    return nav;
}

// 高亮当前页面的导航项
function highlightCurrentNav() {
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.nav-item');
    
    // 移除所有active类
    navItems.forEach(item => item.classList.remove('active'));
    
    // 根据当前页面路径匹配导航项
    for (const item of NAV_ITEMS) {
        if (currentPage === item.href || path.includes(item.id)) {
            const navElement = document.getElementById(`nav-${item.id}`);
            if (navElement) {
                navElement.classList.add('active');
                break;
            }
        }
    }
}

// 初始化导航栏
function initBottomNavigation() {
    // 学生端页面列表（包含新增的页面）
    const studentPages = NAV_ITEMS.map(item => item.href);
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (studentPages.includes(currentPage)) {
        const nav = createBottomNavigation();
        document.body.appendChild(nav);
        highlightCurrentNav();
    }
}

// 导出到全局
window.NavigationComponent = {
    init: initBottomNavigation,
    highlight: highlightCurrentNav,
    items: NAV_ITEMS
};
