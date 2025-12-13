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
      
      <div className="mt-8 flex gap-4">
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
      </div>
    </main>
  );
}