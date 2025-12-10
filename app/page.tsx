export default function Home() {
  return (
    // 下面这些 className 就是 Tailwind 的魔法
    // flex min-h-screen items-center justify-center = 让内容在屏幕正中间
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <h1 className="text-6xl font-bold text-blue-500 mb-4">
        你好，世界！
      </h1>
      <p className="text-xl text-gray-300">
        这是我的第一个全栈网页，现已部署到全球！
      </p>
      
      <button className="mt-8 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition">
        点我没反应（因为还没写后端逻辑）
      </button>
    </main>
  );
}