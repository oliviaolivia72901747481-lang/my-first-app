// ================= 统一底部导航组件 =================
// 已禁用：学生端不再显示导航栏，由老师统一控制页面跳转

// 创建底部导航栏 - 已禁用
function createBottomNavigation() {
    // 返回空元素，不再创建导航栏
    return document.createElement('div');
}

// 高亮当前页面的导航项 - 已禁用
function highlightCurrentNav() {
    // 不执行任何操作
}

// 初始化导航栏 - 已禁用
function initBottomNavigation() {
    // 学生端不再显示导航栏
    // 页面跳转完全由老师通过课件播放器控制
    console.log('📱 学生端导航已禁用，由老师统一控制');
}

// 导出到全局
window.NavigationComponent = {
    init: initBottomNavigation,
    highlight: highlightCurrentNav
};
