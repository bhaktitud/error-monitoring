import { useRouter } from 'next/router';

export default function Navbar() {
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center mb-8">
      <span className="font-bold text-lg">Sentry Clone</span>
      <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600">Logout</button>
    </nav>
  );
} 