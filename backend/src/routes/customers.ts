import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../utils/db';
import { z } from 'zod';

const router = Router();
router.use(auth);

const customerSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    mobile: z.string().min(1),
    email: z.string().email().optional().nullable(),
    businessName: z.string().optional().nullable(),
    gstNumber: z.string().optional().nullable(),
    customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
    address: z.string().optional().nullable(),
    status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
    followUpDate: z.string().datetime().optional().nullable(),
  }),
});

const noteSchema = z.object({
  body: z.object({
    note: z.string().min(1),
  }),
});

router.get('/', requireRole('ADMIN', 'SALES', 'ACCOUNTS'), async (req, res, next) => {
  try {
    const { search, status, customerType, page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { businessName: { contains: String(search), mode: 'insensitive' } },
        { mobile: { contains: String(search) } }
      ];
    }
    if (status) where.status = status;
    if (customerType) where.customerType = customerType;

    const customers = await prisma.customer.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' }
    });
    const total = await prisma.customer.count({ where });

    res.json({ data: customers, total, page: Number(page), limit: take });
  } catch (err) { next(err); }
});

router.post('/', requireRole('ADMIN', 'SALES'), validate(customerSchema), async (req, res, next) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    res.json(customer);
  } catch (err) { next(err); }
});

router.get('/:id', requireRole('ADMIN', 'SALES', 'ACCOUNTS'), async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: String(req.params.id) },
      include: { notes: { orderBy: { createdAt: 'desc' } }, challans: { orderBy: { createdAt: 'desc' } } }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('ADMIN', 'SALES'), validate(customerSchema), async (req, res, next) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });
    res.json(customer);
  } catch (err) { next(err); }
});

router.post('/:id/notes', validate(noteSchema), async (req, res, next) => {
  try {
    const note = await prisma.customerNote.create({
      data: {
        note: req.body.note,
        customerId: String(req.params.id),
        createdBy: req.user!.name,
      }
    });
    res.json(note);
  } catch (err) { next(err); }
});

export default router;
