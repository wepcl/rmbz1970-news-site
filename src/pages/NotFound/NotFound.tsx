import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8faff] p-6 text-center">
      <h1 className="text-6xl font-black text-[#1e50b8]" style={{ textShadow: '2px 2px 0 rgba(30,80,184,0.15)' }}>
        404
      </h1>
      <p className="text-lg font-semibold text-[#1a2540]">页面走丢了</p>
      <p className="text-sm text-[#5a6b85]">您访问的页面不存在或已被移除</p>
      <Link to="/" className="retro-btn mt-2">
        <Home className="h-4 w-4" />
        返回首页
      </Link>
    </div>
  );
};

export default NotFound;
