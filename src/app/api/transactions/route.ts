import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const TransactionItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
})

const TransactionSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  items: z.array(TransactionItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
  discount: z.number().min(0, 'Discount cannot be negative'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.enum(['cash', 'card', 'ewallet', 'transfer']),
  amountPaid: z.number().positive('Amount paid must be positive'),
  change: z.number().min(0, 'Change cannot be negative'),
})

function generateTransactionNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `TRX-${date}-${time}-${random}`
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethod = searchParams.get('paymentMethod')

    const skip = (page - 1) * limit
    const where: any = {}

    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  category: {
                    select: {
                      name: true,
                      color: true,
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = TransactionSchema.parse(body)

    // Validate products and stock availability
    const productIds = validatedData.items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    // Check if all products exist and are active
    for (const item of validatedData.items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 400 }
        )
      }
      if (!product.isActive) {
        return NextResponse.json(
          { error: `Product ${product.name} is not active` },
          { status: 400 }
        )
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` },
          { status: 400 }
        )
      }
    }

    // Generate transaction number
    const transactionNumber = generateTransactionNumber()

    // Create transaction with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone || null,
          subtotal: validatedData.subtotal,
          discount: validatedData.discount,
          tax: validatedData.tax,
          total: validatedData.total,
          paymentMethod: validatedData.paymentMethod,
          amountPaid: validatedData.amountPaid,
          change: validatedData.change,
          status: 'completed',
        }
      })

      // Create transaction items and update stock
      for (const item of validatedData.items) {
        // Create transaction item
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
          }
        })

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      // Return transaction with items
      return await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  category: {
                    select: {
                      name: true,
                      color: true,
                    }
                  }
                }
              }
            }
          }
        }
      })
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { id, status } = z.object({
      id: z.string(),
      status: z.enum(['pending', 'completed', 'cancelled']),
    }).parse(body)

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // If cancelling a completed transaction, restore stock
    if (transaction.status === 'completed' && status === 'cancelled') {
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id },
          data: { status }
        })

        // Restore stock for each item
        for (const item of transaction.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          })
        }
      })
    } else {
      // Just update status
      await prisma.transaction.update({
        where: { id },
        data: { status }
      })
    }

    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: {
                  select: {
                    name: true,
                    color: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}
