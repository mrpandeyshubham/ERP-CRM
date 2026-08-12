import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signAccessToken } from '../middleware/auth';
import { prisma } from '../utils/db';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = signAccessToken(safeUser);

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

export default router;
