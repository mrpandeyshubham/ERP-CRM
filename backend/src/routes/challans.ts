import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../utils/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(auth);

const challanCreateSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })).min(1),
  }),
});

const challanEditSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })).min(1),
  }),
});

// Helper for generating number
function formatChallanNo(seq: number) {
  const fy = new Date().getFullYear();
  return `CHL/${fy}/${String(seq).padStart(4, '0')}`;
}

router.get('/', async (req, res, next) => {
  try {
    const { status, customerId, page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (status) where.status = String(status);
    if (customerId) where.customerId = String(customerId);

    const challans = await prisma.challan.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true, businessName: true } } }
    });
    const total = await prisma.challan.count({ where });

    res.json({ data: challans, total, page: Number(page), limit: take });
  } catch (err) { next(err); }
});

router.post('/', requireRole('ADMIN', 'SALES'), validate(challanCreateSchema), async (req, res, next) => {
  try {
    const { customerId, items } = req.body;

    // Create DRAFT
    const challan = await prisma.challan.create({
      data: {
        challanNumber: `DRAFT-${Date.now()}`, // Temporary, replaced on confirm
        customerId,
        status: 'DRAFT',
        createdBy: req.user!.name,
        totalQuantity: items.reduce((acc: number, item: any) => acc + item.quantity, 0),
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            // snapshots are empty for drafts since prices might change
            productNameSnapshot: '',
            skuSnapshot: '',
            unitPriceSnapshot: 0,
            lineTotal: 0,
          }))
        }
      }
    });

    res.json(challan);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: String(req.params.id) },
      include: { items: { include: { product: true } }, customer: true }
    });
    if (!challan) return res.status(404).json({ error: 'Challan not found' });
    res.json(challan);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('ADMIN', 'SALES'), validate(challanEditSchema), async (req, res, next) => {
  try {
    const challanId = String(req.params.id);
    const challan = await prisma.challan.findUnique({ where: { id: challanId } });
    if (!challan || challan.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only edit DRAFT challans' });
    }

    const { items } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.challanItem.deleteMany({ where: { challanId: challan.id } });
      await tx.challan.update({
        where: { id: challan.id },
        data: {
          totalQuantity: items.reduce((acc: number, item: any) => acc + item.quantity, 0),
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              productNameSnapshot: '',
              skuSnapshot: '',
              unitPriceSnapshot: 0,
              lineTotal: 0,
            }))
          }
        }
      });
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/confirm', requireRole('ADMIN', 'SALES'), async (req, res, next) => {
  try {
    const challanId = String(req.params.id);
    const challan = await prisma.challan.findUnique({
      where: { id: challanId },
      include: { items: true }
    });

    if (!challan || challan.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Challan is not in DRAFT state' });
    }

    // 1. Pre-flight check outside transaction
    for (const item of challan.items) {
      if (item.productId) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!prod || prod.currentStock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for product ${prod?.name || item.productId}` });
        }
      }
    }

    // 2. Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 3. Atomically increment counter
      const fy = new Date().getFullYear().toString();
      const counterKey = `CHL-${fy}`;
      const counter = await tx.counter.upsert({
        where: { key: counterKey },
        update: { seq: { increment: 1 } },
        create: { key: counterKey, seq: 1 }
      });
      const finalChallanNumber = formatChallanNo(counter.seq);

      const productIds = challan.items.map(i => i.productId).filter(Boolean) as string[];

      // 4. Lock products with SELECT ... FOR UPDATE
      if (productIds.length > 0) {
        // Safe parameterized query using Prisma.join
        await tx.$executeRaw`SELECT id FROM "Product" WHERE id IN (${Prisma.join(productIds)}) FOR UPDATE`;
      }

      // 5. Re-check stock & prepare snapshots
      for (const item of challan.items) {
        if (!item.productId) continue;
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod || prod.currentStock < item.quantity) {
          throw { statusCode: 400, message: `Concurrency error: Insufficient stock for product ${prod?.name}` };
        }

        const lineTotal = Number(prod.unitPrice) * item.quantity;

        // Write snapshot
        await tx.challanItem.update({
          where: { id: item.id },
          data: {
            productNameSnapshot: prod.name,
            skuSnapshot: prod.sku,
            unitPriceSnapshot: prod.unitPrice,
            lineTotal,
          }
        });

        // 7. Deduct stock & log movement
        await tx.product.update({
          where: { id: prod.id },
          data: { currentStock: { decrement: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            productId: prod.id,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Challan ${finalChallanNumber}`,
            createdBy: req.user!.name,
          }
        });
      }

      // Update challan state
      const confirmed = await tx.challan.update({
        where: { id: challanId },
        data: {
          challanNumber: finalChallanNumber,
          status: 'CONFIRMED'
        },
        include: { items: true }
      });

      return confirmed;
    });

    res.json(result);
  } catch (err: any) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/:id/cancel', requireRole('ADMIN', 'SALES'), async (req, res, next) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: String(req.params.id) },
      include: { items: true }
    });

    if (!challan) return res.status(404).json({ error: 'Not found' });
    if (challan.status === 'CANCELLED') return res.status(400).json({ error: 'Already cancelled' });

    if (challan.status === 'CONFIRMED') {
      // Revert stock
      await prisma.$transaction(async (tx) => {
        for (const item of challan.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { increment: item.quantity } }
            });
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                movementType: 'IN',
                reason: `Cancelled Challan ${challan.challanNumber}`,
                createdBy: req.user!.name,
              }
            });
          }
        }
        await tx.challan.update({
          where: { id: challan.id },
          data: { status: 'CANCELLED' }
        });
      });
    } else {
      // Just mark as cancelled
      await prisma.challan.update({
        where: { id: challan.id },
        data: { status: 'CANCELLED' }
      });
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
