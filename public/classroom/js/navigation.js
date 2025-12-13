// ================= 统一底部导航组件 =================

// 创建底部导航栏
function createBottomNavigation() {
    const nav = document.createElement('div');
    nav.className = 'bottom-nav';
    nav.innerHTML = `
        <a href="/sign" class="nav-item" id="nav-sign">
            <span class="nav-icon">📅</span>
            <span>签到</span>
        </a>
        <a href="/vote" class="nav-item" id="nav-vote">
            <span class="nav-icon">📊</span>
            <span>答题</span>
        </a>
        <a href="/danmu" class="nav-item" id="nav-danmu">
            <span class="nav-icon">💬</span>
            <span>弹幕</span>
        </a>
        <a href="/buzzer" class="nav-item" id="nav-buzzer">
            <span class="nav-icon">⚡</span>
            <span>抢答</span>
        </a>
        <a href="/classroom" class="nav-item" id="nav-home">
            <span class="nav-icon">🏠</span>
            <span>首页</span>
        </a>
    `;
    
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
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => item.classList.remove('active'));
    
    if (path.includes('sign')) {
        document.getElementById('nav-sign')?.classList.add('active');
    } else if (path.includes('vote')) {
        document.getElementById('nav-vote')?.classList.add('active');
    } else if (path.includes('danmu')) {
        document.getElementById('nav-danmu')?.classList.add('active');
    } else if (path.includes('buzzer')) {
        document.getElementById('nav-buzzer')?.classList.add('active');
    } else if (path.includes('index')) {
        document.getElementById('nav-home')?.classList.add('active');
    }
}

// 初始化导航栏
function initBottomNavigation() {
    // 只在学生端页面显示导航栏
    const currentPath = window.location.pathname;
    const isStudentPage = currentPath.includes('/sign') || 
                         currentPath.includes('/vote') || 
                         currentPath.includes('/danmu') || 
                         currentPath.includes('/buzzer') || 
                         currentPath.includes('/classroom') ||
                         currentPath.includes('sign.html') || 
                         currentPath.includes('vote.html') || 
                         currentPath.includes('danmu.html') || 
                         currentPath.includes('buzzer.html') || 
                         currentPath.includes('index.html');
    
    if (isStudentPage) {
        const nav = createBottomNavigation();
        document.body.appendChild(nav);
        highlightCurrentNav();
    }
}

// 导出到全局
window.NavigationComponent = {
    init: initBottomNavigation,
    highlight: highlightCurrentNav
};