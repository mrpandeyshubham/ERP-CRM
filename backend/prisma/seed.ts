import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { parse } from 'csv-parse/sync';

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

  console.log('Downloading public customer dataset...');
  const customersRes = await axios.get('https://raw.githubusercontent.com/chandanverma07/DataSets/master/Data_Uk.csv');
  const customerRecords = parse(customersRes.data, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true });

  console.log(`Parsed ${customerRecords.length} customers, importing first 50...`);
  let importedCustomers = 0;
  for (const record of customerRecords.slice(0, 50)) {
    if (!record.phone1 || !record.email) continue;
    
    // Check if exists
    const existing = await prisma.customer.findFirst({ where: { mobile: record.phone1 } });
    if (!existing) {
      await prisma.customer.create({
        data: {
          name: `${record.first_name} ${record.last_name}`,
          mobile: record.phone1,
          email: record.email,
          businessName: record.company_name,
          customerType: 'WHOLESALE',
          address: `${record.address}, ${record.city}, ${record.county}, ${record.postal}`,
          status: 'ACTIVE',
        }
      });
      importedCustomers++;
    }
  }

  console.log('Downloading public products dataset...');
  const productsRes = await axios.get('https://raw.githubusercontent.com/vendure-ecommerce/vendure/master/packages/core/mock-data/data-sources/products.csv');
  const productRecords = parse(productsRes.data, { columns: true, skip_empty_lines: true, relax_column_count: true, relax_quotes: true, trim: true });

  console.log(`Parsed ${productRecords.length} product lines, importing valid ones...`);
  
  let importedProducts = 0;
  let currentProductBase = '';
  let currentCategory = '';
  
  for (const record of productRecords.slice(0, 80)) {
    // The vendure CSV has base products on some lines, and variants on others.
    // If name is present, it's a base product line. If not, it's a variant but still has a sku.
    if (record.name && record.name.trim() !== '') {
      currentProductBase = record.name.trim();
      currentCategory = record.facets ? record.facets.split('|')[0].replace('category:', '') : 'General';
    }
    
    const sku = record.sku?.trim();
    if (!sku) continue;
    
    // Combine base product name with option value for the final product name
    const optionValue = record.optionValues ? ` - ${record.optionValues.split('|')[0]}` : '';
    const name = `${currentProductBase}${optionValue}`;
    
    const price = parseFloat(record.price) || 0;
    if (price <= 0) continue;

    const existing = await prisma.product.findFirst({ where: { sku } });
    if (!existing) {
      // Create random stock based on sku length to get varying realistic numbers
      const stock = Math.floor(Math.random() * 50) + 1;
      await prisma.product.create({
        data: {
          name: name.substring(0, 100),
          sku,
          category: currentCategory.substring(0, 50),
          unitPrice: price,
          currentStock: stock,
          minStockAlert: 5,
          location: 'Warehouse A'
        }
      });
      importedProducts++;
    }
  }

  console.log('Database seeded:');
  console.log('  4 fixed role-users (all password123)');
  console.log(`  ${importedCustomers} sample customers from public dataset`);
  console.log(`  ${importedProducts} sample products from public dataset`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
