import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Toast from '../../components/Toast';

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
    <div className="min-h-screen bg-gray-100 p-8">
      <Navbar />
      {copyMsg && <Toast message={copyMsg} type="success" onClose={() => setCopyMsg('')} />}
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Project Saya</h1>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Buat Project</button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            {projects.map(p => (
              <div key={p.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                <div>
                  <div className="font-semibold text-lg">{p.name}</div>
                  <div className="text-xs text-gray-500">DSN: {p.dsn}</div>
                  <button onClick={() => handleCopy(p.dsn)} className="text-blue-600 text-xs mt-1 hover:underline">Copy DSN</button>
                </div>
                <button onClick={() => router.push(`/projects/${p.id}`)} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Lihat Error</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
          <form onSubmit={handleCreate} className="bg-white p-6 rounded shadow w-80">
            <h2 className="text-lg font-bold mb-4">Buat Project Baru</h2>
            <input
              type="text"
              placeholder="Nama project"
              className="w-full mb-4 p-2 border rounded"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Batal</button>
              <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Buat</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 