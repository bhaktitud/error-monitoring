import { useRouter } from 'next/router';
import { FiLogOut } from 'react-icons/fi';

export default function Navbar() {
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };
  return (
    <nav className="bg-white shadow-lg px-8 py-4 flex justify-between items-center mb-10 rounded-xl border border-gray-100">
      <div className="flex items-center space-x-3">
        <span className="inline-block bg-blue-600 text-white rounded-full p-2 text-xl font-bold shadow-sm">S</span>
        <span className="font-extrabold text-2xl text-gray-800 tracking-tight">Sentry Clone</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors duration-150"
        title="Logout"
      >
        <FiLogOut className="text-lg" />
        <span>Logout</span>
      </button>
    </nav>
  );
} 