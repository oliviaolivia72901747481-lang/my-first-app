export default function Home() {
  return (
    // 下面这些 className 就是 Tailwind 的魔法
    // flex min-h-screen items-center justify-center = 让内容在屏幕正中间
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <h1 className="text-6xl font-bold text-blue-500 mb-4">
        你好，世界！
      </h1>
      <p className="text-xl text-gray-300">
        这是我的第一个全栈网页，现已部署到全球！!!
      </p>
      
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <a 
          href="/classroom" 
          className="px-6 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition"
        >
          🎓 进入智慧课堂
        </a>
        <a 
          href="/classroom/admin.html" 
          className="px-6 py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition"
        >
          👨‍🏫 教师控制台
        </a>
        <a 
          href="/classroom/virtual-station.html" 
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full font-bold hover:from-purple-600 hover:to-indigo-700 transition shadow-lg hover:shadow-purple-500/50"
        >
          🏭 虚拟工位平台
        </a>
      </div>
      
      {/* 虚拟工位平台特色介绍 */}
      <div className="mt-12 max-w-4xl text-center">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">🚀 虚拟工位平台 - 专业实训新体验</h2>
        <p className="text-gray-400 mb-6">不只是学习管理，更是技能习得与深度理解的专业实训平台</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-gray-900 p-4 rounded-lg border border-purple-500/30">
            <h3 className="text-purple-300 font-bold mb-2">🔬 深度场景化</h3>
            <p className="text-gray-400 text-sm">工作手册式数字化交互，软件即工作流。进入虚拟工位，体验真实工作场景。</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-indigo-500/30">
            <h3 className="text-indigo-300 font-bold mb-2">📊 过程性数据采集</h3>
            <p className="text-gray-400 text-sm">无感记录学习行为，分析错误模式，精准定位教学难点。</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-blue-500/30">
            <h3 className="text-blue-300 font-bold mb-2">🤖 AI垂直领域助教</h3>
            <p className="text-gray-400 text-sm">RAG知识库支持，引用国标规范回答，AI预批改方案设计。</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-cyan-500/30">
            <h3 className="text-cyan-300 font-bold mb-2">🎮 职业RPG成就系统</h3>
            <p className="text-gray-400 text-sm">见习工程师→助理工程师→项目经理，获取虚拟上岗证与技能勋章。</p>
          </div>
        </div>
      </div>
    </main>
  );
}