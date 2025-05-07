import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { Pie, Bar } from 'react-chartjs-2';
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

interface Event {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
  stacktrace?: string;
  userAgent?: string;
}

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [searchMsg, setSearchMsg] = useState<string>('');

  // Statistik
  const totalError = events.length;
  const errorTypeCount = events.reduce((acc: Record<string, number>, ev) => {
    acc[ev.errorType] = (acc[ev.errorType] || 0) + 1;
    return acc;
  }, {});
  const errorPerDay = events.reduce((acc: Record<string, number>, ev) => {
    const day = new Date(ev.timestamp).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  // Data chart
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

  // Filtered events
  const filteredEvents = events.filter(ev => {
    const matchType = filterType ? ev.errorType === filterType : true;
    const matchMsg = searchMsg ? ev.message.toLowerCase().includes(searchMsg.toLowerCase()) : true;
    return matchType && matchMsg;
  });

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
    fetch(`http://localhost:3000/api/events/project/${id}`)
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(() => setError('Gagal mengambil event'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Navbar />
      <button onClick={() => router.push('/projects')} className="mb-6 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">&larr; Kembali</button>
      <h1 className="text-2xl font-bold mb-4">Daftar Error/Event</h1>
      {/* Dashboard Statistik */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded shadow p-4 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-blue-600">{totalError}</div>
          <div className="text-gray-500">Total Error</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="font-semibold mb-2 text-center">Error per Tipe</div>
          {Object.keys(errorTypeCount).length > 0 ? (
            <Pie data={pieData} />
          ) : (
            <div className="text-gray-400 text-center">Belum ada data</div>
          )}
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="font-semibold mb-2 text-center">Error per Hari</div>
          {Object.keys(errorPerDay).length > 0 ? (
            <Bar data={barData} />
          ) : (
            <div className="text-gray-400 text-center">Belum ada data</div>
          )}
        </div>
      </div>
      {/* Dokumentasi SDK */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <div className="font-semibold mb-2">Integrasi SDK (Node.js)</div>
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
      {/* Filter/Search */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
        <select
          className="p-2 border rounded"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Semua Tipe Error</option>
          {Array.from(new Set(events.map(ev => ev.errorType))).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <input
          type="text"
          className="p-2 border rounded flex-1"
          placeholder="Cari pesan error..."
          value={searchMsg}
          onChange={e => setSearchMsg(e.target.value)}
        />
      </div>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {/* Daftar event (console style) */}
      {loading ? (
        <div>Loading...</div>
      ) : filteredEvents.length === 0 ? (
        <div>Tidak ada error/event.</div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((ev, idx) => (
            <div key={ev.id} className="bg-black text-white rounded shadow p-4 font-mono text-sm relative">
              <div className="flex items-center cursor-pointer" onClick={() => setOpenIdx(openIdx === idx ? null : idx)}>
                <span className="text-green-400">{new Date(ev.timestamp).toLocaleString()}</span>
                <span className="mx-2 text-yellow-300">{ev.errorType}</span>
                <span className="text-red-400">{ev.message}</span>
                <span className="ml-auto text-xs text-gray-400">{openIdx === idx ? '▼' : '▶'}</span>
              </div>
              {openIdx === idx && (
                <pre className="mt-2 bg-gray-900 rounded p-2 overflow-x-auto text-xs">
                  {JSON.stringify(ev, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 