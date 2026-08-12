import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../utils/db';
import { z } from 'zod';

const router = Router();
router.use(auth);

const productSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    category: z.string().optional().nullable(),
    unitPrice: z.number().positive(),
    currentStock: z.number().int().min(0).optional(),
    minStockAlert: z.number().int().min(0).optional(),
    location: z.string().optional().nullable(),
    active: z.boolean().optional(),
  }),
});

const stockAdjustSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive(),
    movementType: z.enum(['IN', 'OUT']),
    reason: z.string().optional().nullable(),
  }),
});

router.get('/', async (req, res, next) => {
  try {
    const { search, category, lowStock, page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;
    
    let products = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
    if (lowStock === 'true') {
      products = products.filter(p => p.currentStock <= p.minStockAlert);
    }
    
    const total = products.length;
    products = products.slice(skip, skip + take);
    
    res.json({ data: products, total, page: Number(page), limit: take });
  } catch (err) { next(err); }
});

router.post('/', requireRole('ADMIN', 'WAREHOUSE'), validate(productSchema), async (req, res, next) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.json(product);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('ADMIN', 'WAREHOUSE'), validate(productSchema), async (req, res, next) => {
  try {
    const product = await prisma.product.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });
    res.json(product);
  } catch (err) { next(err); }
});

router.post('/:id/stock', requireRole('ADMIN', 'WAREHOUSE'), validate(stockAdjustSchema), async (req, res, next) => {
  try {
    const { quantity, movementType, reason } = req.body;
    const productId = String(req.params.id);
    
    // One transaction: update stock + insert movement
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw { statusCode: 404, message: 'Product not found' };
      
      const delta = movementType === 'IN' ? quantity : -quantity;
      if (product.currentStock + delta < 0) {
        throw { statusCode: 400, message: 'Insufficient stock' };
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: delta } },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: updated.id,
          quantity,
          movementType,
          reason,
          createdBy: req.user!.name,
        }
      });

      return { product: updated, movement };
    });

    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id/movements', async (req, res, next) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { productId: String(req.params.id) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(movements);
  } catch (err) { next(err); }
});

export default router;
