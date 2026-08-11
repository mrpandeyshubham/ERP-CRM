import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signAccessToken } from '../middleware/auth';
import { prisma } from '../utils/db';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
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
