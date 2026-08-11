import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = bcrypt.hashSync('password123', 10);

  const users = [
    { name: 'Admin User',     email: 'admin@erp.com',     role: Role.ADMIN,     passwordHash },
    { name: 'Sales User',     email: 'sales@erp.com',     role: Role.SALES,     passwordHash },
    { name: 'Warehouse User', email: 'warehouse@erp.com', role: Role.WAREHOUSE, passwordHash },
    { name: 'Accounts User',  email: 'accounts@erp.com',  role: Role.ACCOUNTS,  passwordHash },
  ];

  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
  }

  // Sample customers
  const custData = [
    { name: 'Rahul Mehta',    mobile: '9876543210', email: 'rahul@example.com',  businessName: 'Mehta Enterprises', customerType: 'WHOLESALE',   status: 'ACTIVE' },
    { name: 'Priya Shah',     mobile: '9123456789', email: 'priya@example.com',  businessName: 'Shah Traders',       customerType: 'RETAIL',      status: 'ACTIVE' },
    { name: 'Ajay Distribs',  mobile: '9988776655', email: 'ajay@distrib.com',   businessName: 'Ajay Distributors',  customerType: 'DISTRIBUTOR', status: 'LEAD'   },
    { name: 'Nisha Retail',   mobile: '9001234567', email: 'nisha@example.com',  businessName: 'Nisha Store',        customerType: 'RETAIL',      status: 'ACTIVE' },
    { name: 'Suresh Co',      mobile: '9555888777', email: 'suresh@corp.com',    businessName: 'Suresh & Co',        customerType: 'WHOLESALE',   status: 'INACTIVE' },
  ];

  for (const c of custData) {
    const existing = await prisma.customer.findFirst({ where: { mobile: c.mobile } });
    if (!existing) {
      await prisma.customer.create({ data: c as any });
    }
  }

  // Sample products
  const prodData = [
    { name: 'Office Chair',      sku: 'FURN-001', category: 'Furniture',    unitPrice: 4500,  currentStock: 25, minStockAlert: 5  },
    { name: 'Standing Desk',     sku: 'FURN-002', category: 'Furniture',    unitPrice: 12000, currentStock: 8,  minStockAlert: 3  },
    { name: 'Wireless Mouse',    sku: 'ELEC-001', category: 'Electronics',  unitPrice: 850,   currentStock: 3,  minStockAlert: 10 },
    { name: 'Mechanical Kbd',    sku: 'ELEC-002', category: 'Electronics',  unitPrice: 2200,  currentStock: 15, minStockAlert: 5  },
    { name: 'Monitor 27"',       sku: 'ELEC-003', category: 'Electronics',  unitPrice: 18000, currentStock: 2,  minStockAlert: 3  },
    { name: 'Notebook A4 Pack',  sku: 'STAT-001', category: 'Stationery',   unitPrice: 120,   currentStock: 200, minStockAlert: 20 },
    { name: 'Ball Pen Set',      sku: 'STAT-002', category: 'Stationery',   unitPrice: 45,    currentStock: 500, minStockAlert: 50 },
  ];

  for (const p of prodData) {
    const existing = await prisma.product.findFirst({ where: { sku: p.sku } });
    if (!existing) {
      await prisma.product.create({ data: p as any });
    }
  }

  console.log('Database seeded:');
  console.log('  4 users (admin/sales/warehouse/accounts, all password123)');
  console.log(`  ${custData.length} sample customers`);
  console.log(`  ${prodData.length} sample products (2 below min-stock threshold)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
