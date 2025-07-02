import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const categories = [
  { name: 'Makanan', color: '#FF6B6B' },
  { name: 'Minuman', color: '#4ECDC4' },
  { name: 'Snack', color: '#45B7D1' },
  { name: 'Es Krim', color: '#96CEB4' },
  { name: 'Kue', color: '#FECA57' },
]

const products = [
  // Makanan
  { name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan telur, ayam, dan sayuran', price: 25000, cost: 18000, category: 'Makanan', stock: 50 },
  { name: 'Mie Ayam Bakso', description: 'Mie ayam dengan bakso dan pangsit', price: 18000, cost: 12000, category: 'Makanan', stock: 40 },
  { name: 'Gado-gado', description: 'Sayuran segar dengan bumbu kacang', price: 15000, cost: 10000, category: 'Makanan', stock: 30 },
  { name: 'Soto Ayam', description: 'Soto ayam tradisional dengan rempah pilihan', price: 20000, cost: 14000, category: 'Makanan', stock: 35 },

  // Minuman
  { name: 'Es Teh Manis', description: 'Teh manis dingin segar', price: 5000, cost: 2000, category: 'Minuman', stock: 100 },
  { name: 'Jus Jeruk Fresh', description: 'Jus jeruk segar tanpa pemanis buatan', price: 12000, cost: 7000, category: 'Minuman', stock: 60 },
  { name: 'Kopi Hitam', description: 'Kopi hitam premium', price: 8000, cost: 4000, category: 'Minuman', stock: 80 },
  { name: 'Es Campur', description: 'Es campur lengkap dengan buah-buahan', price: 15000, cost: 9000, category: 'Minuman', stock: 25 },

  // Snack
  { name: 'Keripik Singkong', description: 'Keripik singkong renyah original', price: 10000, cost: 6000, category: 'Snack', stock: 75 },
  { name: 'Pisang Goreng', description: 'Pisang goreng crispy dengan tepung pilihan', price: 12000, cost: 7000, category: 'Snack', stock: 45 },
  { name: 'Tahu Isi', description: 'Tahu isi sayuran dengan saus kacang', price: 8000, cost: 5000, category: 'Snack', stock: 55 },
  { name: 'Bakwan Jagung', description: 'Bakwan jagung manis crispy', price: 6000, cost: 3500, category: 'Snack', stock: 40 },

  // Es Krim
  { name: 'Es Krim Vanilla', description: 'Es krim vanilla premium', price: 15000, cost: 9000, category: 'Es Krim', stock: 30 },
  { name: 'Es Krim Coklat', description: 'Es krim coklat rich and creamy', price: 15000, cost: 9000, category: 'Es Krim', stock: 30 },
  { name: 'Es Krim Strawberry', description: 'Es krim strawberry dengan buah asli', price: 18000, cost: 11000, category: 'Es Krim', stock: 25 },

  // Kue
  { name: 'Brownies Coklat', description: 'Brownies coklat fudgy homemade', price: 25000, cost: 15000, category: 'Kue', stock: 20 },
  { name: 'Donat Glaze', description: 'Donat dengan glaze manis', price: 8000, cost: 4500, category: 'Kue', stock: 50 },
  { name: 'Kue Lapis', description: 'Kue lapis tradisional warna-warni', price: 20000, cost: 12000, category: 'Kue', stock: 15 },
]

function generateSKU(name: string, index: number): string {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
  const timestamp = Date.now().toString().slice(-4)
  const counter = index.toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${counter}`
}

function generateBarcode(): string {
  return Math.floor(Math.random() * 9000000000000 + 1000000000000).toString()
}

export async function POST(): Promise<NextResponse> {
  try {
    // Check if data already exists
    const existingCategories = await prisma.category.count()
    const existingProducts = await prisma.product.count()

    if (existingCategories > 0 || existingProducts > 0) {
      return NextResponse.json({
        message: 'Database already contains data. Skipping seed.',
        existingCategories,
        existingProducts
      })
    }

    // Create categories first
    const createdCategories = await Promise.all(
      categories.map(category =>
        prisma.category.create({
          data: category
        })
      )
    )

    console.log(`Created ${createdCategories.length} categories`)

    // Create category mapping
    const categoryMap = new Map<string, string>()
    createdCategories.forEach(cat => {
      categoryMap.set(cat.name, cat.id)
    })

    // Create products
    const createdProducts = await Promise.all(
      products.map((product, index) =>
        prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            price: product.price,
            cost: product.cost,
            sku: generateSKU(product.name, index),
            barcode: generateBarcode(),
            stock: product.stock,
            minStock: Math.max(5, Math.floor(product.stock * 0.1)), // 10% of stock or minimum 5
            isActive: true,
            imageUrl: null,
            categoryId: categoryMap.get(product.category)!,
          }
        })
      )
    )

    console.log(`Created ${createdProducts.length} products`)

    // Create a sample transaction for testing
    const sampleTransaction = await prisma.transaction.create({
      data: {
        transactionNumber: `TRX-${Date.now()}-SAMPLE`,
        customerName: 'Customer Demo',
        customerPhone: '08123456789',
        subtotal: 43000,
        discount: 0,
        tax: 4300,
        total: 47300,
        paymentMethod: 'cash',
        amountPaid: 50000,
        change: 2700,
        status: 'completed',
        items: {
          create: [
            {
              productId: createdProducts[0].id, // Nasi Goreng Spesial
              quantity: 1,
              price: 25000,
              total: 25000,
            },
            {
              productId: createdProducts[4].id, // Es Teh Manis
              quantity: 2,
              price: 5000,
              total: 10000,
            },
            {
              productId: createdProducts[8].id, // Keripik Singkong
              quantity: 1,
              price: 8000,
              total: 8000,
            }
          ]
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Update stock for the sample transaction
    await prisma.product.update({
      where: { id: createdProducts[0].id },
      data: { stock: { decrement: 1 } }
    })
    await prisma.product.update({
      where: { id: createdProducts[4].id },
      data: { stock: { decrement: 2 } }
    })
    await prisma.product.update({
      where: { id: createdProducts[8].id },
      data: { stock: { decrement: 1 } }
    })

    console.log('Created sample transaction:', sampleTransaction.transactionNumber)

    return NextResponse.json({
      message: 'Database seeded successfully!',
      data: {
        categories: createdCategories.length,
        products: createdProducts.length,
        sampleTransaction: sampleTransaction.transactionNumber
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    // Delete in reverse order of dependencies
    await prisma.transactionItem.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()

    return NextResponse.json({
      message: 'Database cleared successfully!'
    })

  } catch (error) {
    console.error('Error clearing database:', error)
    return NextResponse.json(
      { error: 'Failed to clear database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
