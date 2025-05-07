import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../models/prisma';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.passwordHash) {
        // Sudah pernah register manual
        return res.status(409).json({ error: 'Email sudah terdaftar' });
      } else {
        // User dummy (invite), update password
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({ where: { email }, data: { passwordHash } });
        return res.status(201).json({ email });
      }
    }
    // User baru
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Gagal register' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email tidak ditemukan' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Password salah' });
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi error pada server' });
  }
});

export default router; 