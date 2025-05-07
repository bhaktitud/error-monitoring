import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Toast from '../../components/Toast';
import { FiPlus, FiCopy, FiEye } from 'react-icons/fi';

interface Project {
  id: string;
  name: string;
  dsn: string;
  createdAt: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [router]);

  useEffect(() => {
    axios.get('http://localhost:3000/api/projects', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setProjects(res.data))
      .catch(() => setError('Gagal mengambil project'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.post('http://localhost:3000/api/projects', { name: newName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects([...projects, res.data]);
      setShowModal(false);
      setNewName('');
    } catch {
      setError('Gagal membuat project');
    }
  };

  const handleCopy = (dsn: string) => {
    navigator.clipboard.writeText(dsn);
    setCopyMsg('DSN berhasil dicopy!');
    setTimeout(() => setCopyMsg(''), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <Navbar />
      {copyMsg && <Toast message={copyMsg} type="success" onClose={() => setCopyMsg('')} />}
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800">Project Saya</h1>
          <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors duration-150">
            <FiPlus className="text-lg" />
            <span>Buat Project</span>
          </button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-6">
            {projects.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-2xl shadow-lg flex justify-between items-center border border-gray-100 hover:shadow-xl transition-all duration-200">
                <div>
                  <div className="font-bold text-xl text-gray-800 mb-1">{p.name}</div>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <span>DSN:</span>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{p.dsn}</span>
                    <button onClick={() => handleCopy(p.dsn)} className="text-blue-600 hover:text-blue-800 ml-1" title="Copy DSN"><FiCopy /></button>
                  </div>
                </div>
                <button onClick={() => router.push(`/projects/${p.id}`)} className="flex items-center space-x-2 bg-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 text-blue-700 transition-colors duration-150">
                  <FiEye className="text-lg" />
                  <span>Lihat Error</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20 animate-fade-in-up">
          <form onSubmit={handleCreate} className="bg-white p-8 rounded-2xl shadow-2xl w-96 border border-gray-100 flex flex-col space-y-6">
            <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">Buat Project Baru</h2>
            <input
              type="text"
              placeholder="Nama project"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">Batal</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-150">Buat</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 