import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';
import Toast from '../../../components/Toast';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiX } from 'react-icons/fi';

interface Webhook {
  id: string;
  url: string;
  enabled: boolean;
  eventType?: string;
  secret?: string;
  createdAt: string;
}

export default function Webhooks() {
  const router = useRouter();
  const { id } = router.query;
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editWebhook, setEditWebhook] = useState<Webhook | null>(null);
  const [form, setForm] = useState({ url: '', enabled: true, eventType: '', secret: '' });
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}|null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:3000/api/projects/${id}/webhooks`)
      .then(res => res.json())
      .then(data => setWebhooks(data))
      .catch(() => setToast({msg: 'Gagal mengambil webhook', type: 'error'}))
      .finally(() => setLoading(false));
  }, [id]);

  const openAdd = () => {
    setEditWebhook(null);
    setForm({ url: '', enabled: true, eventType: '', secret: '' });
    setShowModal(true);
  };
  const openEdit = (wh: Webhook) => {
    setEditWebhook(wh);
    setForm({ url: wh.url, enabled: wh.enabled, eventType: wh.eventType || '', secret: wh.secret || '' });
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.url) return setToast({msg: 'URL wajib diisi', type: 'error'});
    try {
      const res = await fetch(editWebhook ? `http://localhost:3000/api/webhooks/${editWebhook.id}` : `http://localhost:3000/api/projects/${id}/webhooks`, {
        method: editWebhook ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      setToast({msg: editWebhook ? 'Webhook diupdate' : 'Webhook ditambah', type: 'success'});
      setShowModal(false);
      // Refresh list
      fetch(`http://localhost:3000/api/projects/${id}/webhooks`).then(res => res.json()).then(data => setWebhooks(data));
    } catch {
      setToast({msg: 'Gagal simpan webhook', type: 'error'});
    }
  };
  const handleDelete = async (wh: Webhook) => {
    if (!confirm('Hapus webhook ini?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/webhooks/${wh.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setToast({msg: 'Webhook dihapus', type: 'success'});
      setWebhooks(webhooks.filter(w => w.id !== wh.id));
    } catch {
      setToast({msg: 'Gagal hapus webhook', type: 'error'});
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <Navbar />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <button onClick={() => router.push(`/projects/${id}`)} className="mb-8 flex items-center space-x-2 bg-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 text-blue-700 transition-colors duration-150">
        <FiArrowLeft className="text-lg" />
        <span>Kembali ke Project</span>
      </button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">Webhook Project</h1>
        <button onClick={openAdd} className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors duration-150">
          <FiPlus className="text-lg" />
          <span>Tambah Webhook</span>
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : webhooks.length === 0 ? (
        <div className="text-gray-500 text-center">Tidak ada webhook.</div>
      ) : (
        <div className="space-y-4">
          {webhooks.map(wh => (
            <div key={wh.id} className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between border border-gray-100 hover:shadow-xl transition-all duration-200">
              <div>
                <div className="font-semibold text-blue-700 text-lg break-all">{wh.url}</div>
                <div className="text-xs text-gray-500">{wh.enabled ? 'Aktif' : 'Nonaktif'} | Event: {wh.eventType || 'all'} | Dibuat: {new Date(wh.createdAt).toLocaleString()}</div>
                {wh.secret && <div className="text-xs text-gray-400">Secret: {wh.secret}</div>}
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openEdit(wh)} className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-yellow-400 text-white font-semibold hover:bg-yellow-500 transition-colors duration-150" title="Edit">
                  <FiEdit2 />
                  <span>Edit</span>
                </button>
                <button onClick={() => handleDelete(wh)} className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors duration-150" title="Hapus">
                  <FiTrash2 />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-gray-100 animate-fade-in-up flex flex-col space-y-4">
            <button type="button" onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"><FiX /></button>
            <h2 className="text-2xl font-bold mb-2 text-blue-700">{editWebhook ? 'Edit' : 'Tambah'} Webhook</h2>
            <input type="url" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition" placeholder="Webhook URL" value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))} required />
            <input type="text" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition" placeholder="Event Type (opsional)" value={form.eventType} onChange={e => setForm(f => ({...f, eventType: e.target.value}))} />
            <input type="text" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition" placeholder="Secret (opsional)" value={form.secret} onChange={e => setForm(f => ({...f, secret: e.target.value}))} />
            <label className="flex items-center mb-2">
              <input type="checkbox" className="mr-2" checked={form.enabled} onChange={e => setForm(f => ({...f, enabled: e.target.checked}))} /> Aktif
            </label>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">Batal</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-150">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 