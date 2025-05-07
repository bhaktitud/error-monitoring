import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { FiMail, FiLock } from 'react-icons/fi';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:3000/api/auth/register', { email, password });
      setSuccess('Registrasi berhasil! Silakan login.');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registrasi gagal');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-2xl w-96 flex flex-col space-y-6 border border-gray-100 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-700 tracking-tight">Register</h2>
        {error && <div className="mb-2 text-red-500 text-sm font-semibold flex items-center"><span className="mr-2">❌</span>{error}</div>}
        {success && <div className="mb-2 text-green-600 text-sm font-semibold flex items-center"><span className="mr-2">✅</span>{success}</div>}
        <div className="relative">
          <FiMail className="absolute left-3 top-3 text-gray-400 text-lg" />
          <input
            type="email"
            placeholder="Email"
            className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <FiLock className="absolute left-3 top-3 text-gray-400 text-lg" />
          <input
            type="password"
            placeholder="Password"
            className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition-colors duration-150">Register</button>
        <p className="mt-2 text-sm text-center text-gray-500">
          Sudah punya akun? <a href="/login" className="text-blue-600 hover:underline font-semibold">Login</a>
        </p>
      </form>
    </div>
  );
} 