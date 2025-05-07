import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { Pie, Bar } from 'react-chartjs-2';
import { FiArrowLeft, FiLink, FiX } from 'react-icons/fi';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface ErrorGroup {
  id: string;
  errorType: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  statusCode?: number;
  status?: string;
  assignedTo?: string | null;
  updatedAt?: string;
}

interface Event {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
  stacktrace?: string;
  userAgent?: string;
  statusCode?: number;
}

interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; email: string };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; role: string; user: { email: string } };
}

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [groups, setGroups] = useState<ErrorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ErrorGroup | null>(null);
  const [groupEvents, setGroupEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchMsg, setSearchMsg] = useState<string>('');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [groupStatus, setGroupStatus] = useState('');
  const [groupAssignee, setGroupAssignee] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}|null>(null);

  // Statistik
  const totalError = groups.reduce((acc, g) => acc + g.count, 0);
  const errorTypeCount = groups.reduce((acc: Record<string, number>, g) => {
    acc[g.errorType] = (acc[g.errorType] || 0) + g.count;
    return acc;
  }, {});
  const errorPerDay = groups.reduce((acc: Record<string, number>, g) => {
    const day = new Date(g.lastSeen).toLocaleDateString();
    acc[day] = (acc[day] || 0) + g.count;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(errorTypeCount),
    datasets: [
      {
        data: Object.values(errorTypeCount),
        backgroundColor: [
          '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#facc15', '#38bdf8', '#818cf8', '#fb7185'
        ],
      },
    ],
  };
  const barData = {
    labels: Object.keys(errorPerDay),
    datasets: [
      {
        label: 'Error per Hari',
        data: Object.values(errorPerDay),
        backgroundColor: '#60a5fa',
      },
    ],
  };

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
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:3000/api/projects/${id}/groups`)
      .then(res => res.json())
      .then(data => setGroups(data))
      .catch(() => setError('Gagal mengambil group'))
      .finally(() => setLoading(false));
  }, [id]);

  // Filtered groups
  const filteredGroups = groups.filter(g => {
    const matchType = filterType ? g.errorType === filterType : true;
    const matchMsg = searchMsg ? g.message.toLowerCase().includes(searchMsg.toLowerCase()) : true;
    const matchStatus = filterStatus ? String(g.statusCode || '') === filterStatus : true;
    return matchType && matchMsg && matchStatus;
  });

  // Ambil event dalam group
  const openGroup = async (group: ErrorGroup) => {
    setSelectedGroup(group);
    setLoadingEvents(true);
    setOpenIdx(null);
    fetch(`http://localhost:3000/api/groups/${group.id}/events`)
      .then(res => res.json())
      .then(data => setGroupEvents(data))
      .catch(() => setGroupEvents([]))
      .finally(() => setLoadingEvents(false));
  };

  // Fetch members, status, assignee, komentar saat modal group dibuka
  useEffect(() => {
    if (!selectedGroup || !id) return;
    // Fetch members
    fetch(`http://localhost:3000/api/projects/${id}/members`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(setMembers)
      .catch(() => setToast({msg: 'Gagal mengambil member', type: 'error'}));
    // Set status & assignee
    setGroupStatus(selectedGroup.status || 'open');
    setGroupAssignee(selectedGroup.assignedTo || null);
    // Fetch komentar
    fetch(`http://localhost:3000/api/groups/${selectedGroup.id}/comments`)
      .then(res => res.json())
      .then(setComments)
      .catch(() => setToast({msg: 'Gagal mengambil komentar', type: 'error'}));
  }, [selectedGroup, id]);

  // Update status
  const handleStatusChange = async (e: any) => {
    const status = e.target.value;
    setGroupStatus(status);
    try {
      await fetch(`http://localhost:3000/api/groups/${selectedGroup?.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      setToast({msg: 'Status diupdate', type: 'success'});
      setGroups(gs => gs.map(g => g.id === selectedGroup?.id ? { ...g, status } : g));
    } catch {
      setToast({msg: 'Gagal update status', type: 'error'});
    }
  };

  // Update assignment
  const handleAssignChange = async (e: any) => {
    const memberId = e.target.value || null;
    setGroupAssignee(memberId);
    try {
      await fetch(`http://localhost:3000/api/groups/${selectedGroup?.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ memberId })
      });
      setToast({msg: 'Assignment diupdate', type: 'success'});
      setGroups(gs => gs.map(g => g.id === selectedGroup?.id ? { ...g, assignedTo: memberId } : g));
    } catch {
      setToast({msg: 'Gagal update assignment', type: 'error'});
    }
  };

  // Tambah komentar
  const handleAddComment = async (e: any) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/groups/${selectedGroup?.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: commentInput })
      });
      if (!res.ok) throw new Error();
      const newComment = await res.json();
      setComments(cs => [...cs, newComment]);
      setCommentInput('');
      setToast({msg: 'Komentar ditambah', type: 'success'});
    } catch {
      setToast({msg: 'Gagal tambah komentar', type: 'error'});
    }
    setCommentLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <Navbar />
      {toast && <div className="fixed top-6 right-6 z-50"><div className={`px-4 py-2 rounded shadow text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div></div>}
      <button onClick={() => router.push('/projects')} className="mb-8 flex items-center space-x-2 bg-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 text-blue-700 transition-colors duration-150">
        <FiArrowLeft className="text-lg" />
        <span>Kembali</span>
      </button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">Statistik Error</h1>
        <a href={`/projects/${id}/webhooks`} className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors duration-150">
          <FiLink className="text-lg" />
          <span>Kelola Webhook</span>
        </a>
      </div>
      {/* Dashboard Statistik */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center border border-gray-100">
          <div className="text-4xl font-extrabold text-blue-600 mb-1">{totalError}</div>
          <div className="text-gray-500 text-lg">Total Error</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="font-semibold mb-3 text-center text-gray-700">Error per Tipe</div>
          {Object.keys(errorTypeCount).length > 0 ? (
            <Pie data={pieData} />
          ) : (
            <div className="text-gray-400 text-center">Belum ada data</div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="font-semibold mb-3 text-center text-gray-700">Error per Hari</div>
          {Object.keys(errorPerDay).length > 0 ? (
            <Bar data={barData} />
          ) : (
            <div className="text-gray-400 text-center">Belum ada data</div>
          )}
        </div>
      </div>
      {/* Dokumentasi SDK */}
      <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
        <div className="font-semibold mb-2 text-blue-700">Integrasi SDK (Node.js)</div>
        <div className="text-xs mb-1">DSN Project:</div>
        <div className="mb-2 p-2 bg-white border rounded break-all">{id}</div>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto"><code>{`
import { init, captureException } from 'sentry-clone-sdk';

init({
  dsn: '${id}',
  apiUrl: 'http://localhost:3000'
});

try {
  // kode yang bisa error
  throw new Error('Contoh error!');
} catch (err) {
  await captureException(err);
}
`}</code></pre>
      </div>
      {/* Filter/Search Group */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
        <select
          className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Semua Tipe Error</option>
          {Array.from(new Set(groups.map(g => g.errorType))).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Semua Status Code</option>
          {Array.from(new Set(groups.map(g => g.statusCode).filter(Boolean))).map(code => (
            <option key={code} value={String(code)}>{code}</option>
          ))}
        </select>
        <input
          type="text"
          className="p-3 border border-gray-200 rounded-lg flex-1 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
          placeholder="Cari pesan error..."
          value={searchMsg}
          onChange={e => setSearchMsg(e.target.value)}
        />
      </div>
      {/* List Error Group */}
      {loading ? (
        <div>Loading...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-gray-500 text-center">Tidak ada error group.</div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((g, idx) => (
            <div key={g.id} className="bg-white rounded-2xl shadow p-5 flex items-center cursor-pointer hover:bg-blue-50 border border-gray-100 transition-all duration-150" onClick={() => openGroup(g)}>
              <div className="flex-1">
                <div className="font-semibold text-blue-700 text-lg">{g.errorType} <span className="ml-2 text-xs text-gray-500">[{g.statusCode ?? '-'}]</span></div>
                <div className="text-gray-700 text-sm break-all">{g.message}</div>
                <div className="text-xs text-gray-400 mt-1">First: {new Date(g.firstSeen).toLocaleString()} | Last: {new Date(g.lastSeen).toLocaleString()}</div>
              </div>
              <div className="ml-6 text-2xl font-bold text-blue-600">{g.count}</div>
            </div>
          ))}
        </div>
      )}
      {/* Modal Detail Group */}
      {selectedGroup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative border border-gray-100 animate-fade-in-up">
            <button onClick={() => setSelectedGroup(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"><FiX /></button>
            <h2 className="text-2xl font-bold mb-2 text-blue-700">{selectedGroup.errorType} <span className="ml-2 text-xs text-gray-500">[{selectedGroup.statusCode ?? '-'}]</span></h2>
            <div className="mb-2 text-gray-700 break-all">{selectedGroup.message}</div>
            <div className="mb-4 text-xs text-gray-500">First: {new Date(selectedGroup.firstSeen).toLocaleString()} | Last: {new Date(selectedGroup.lastSeen).toLocaleString()} | Total: {selectedGroup.count}</div>
            {/* Issue Management UI */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select value={groupStatus} onChange={handleStatusChange} className="p-2 border rounded-lg">
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="ignored">Ignored</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Assign to</label>
                <select value={groupAssignee || ''} onChange={handleAssignChange} className="p-2 border rounded-lg">
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.user.email} ({m.role})</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Komentar */}
            <div className="mb-4">
              <div className="font-semibold mb-2 text-gray-700">Komentar</div>
              <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
                {comments.length === 0 ? <div className="text-gray-400 text-sm">Belum ada komentar.</div> : comments.map(c => (
                  <div key={c.id} className="bg-gray-100 rounded p-2 text-sm">
                    <div className="text-xs text-gray-500 mb-1">{c.author.user.email} ({c.author.role}) • {new Date(c.createdAt).toLocaleString()}</div>
                    <div>{c.content}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex space-x-2 mt-2">
                <input type="text" className="flex-1 p-2 border rounded" placeholder="Tambah komentar..." value={commentInput} onChange={e => setCommentInput(e.target.value)} disabled={commentLoading} />
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700" disabled={commentLoading}>Kirim</button>
              </form>
            </div>
            <div className="mb-2 font-semibold text-gray-700">Daftar Event</div>
            {loadingEvents ? (
              <div>Loading...</div>
            ) : groupEvents.length === 0 ? (
              <div className="text-gray-500">Tidak ada event.</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {groupEvents.map((ev, idx) => (
                  <div key={ev.id} className="bg-black text-white rounded p-3 font-mono text-xs">
                    <div className="flex items-center cursor-pointer" onClick={() => setOpenIdx(openIdx === idx ? null : idx)}>
                      <span className="text-green-400">{new Date(ev.timestamp).toLocaleString()}</span>
                      <span className="mx-2 text-yellow-300">{ev.errorType} <span className="text-xs text-gray-400">[{ev.statusCode ?? '-'}]</span></span>
                      <span className="text-red-400">{ev.message}</span>
                      <span className="ml-auto text-xs text-gray-400">{openIdx === idx ? '▼' : '▶'}</span>
                    </div>
                    {openIdx === idx && (
                      <div className="mt-2 bg-gray-900 rounded p-2 text-gray-200">
                        {ev.stacktrace && (
                          <pre className="mb-2 whitespace-pre-wrap break-all">{ev.stacktrace}</pre>
                        )}
                        <div className="mb-1">User Agent: <span className="text-blue-300">{ev.userAgent || '-'}</span></div>
                        <div className="mb-1">User Context: <span className="text-blue-300">{JSON.stringify((ev as any).userContext) || '-'}</span></div>
                        <div>Tags: <span className="text-blue-300">{JSON.stringify((ev as any).tags) || '-'}</span></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 