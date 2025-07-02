import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateStockSchema = z.object({
  quantity: z.number().int(),
  operation: z.enum(['add', 'subtract', 'set']),
  reason: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        transactionItems: {
          include: {
            transaction: {
              select: {
                id: true,
                transactionNumber: true,
                createdAt: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params
    const body = await request.json()
    const { quantity, operation, reason } = UpdateStockSchema.parse(body)

    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    let newStock: number

    switch (operation) {
      case 'add':
        newStock = product.stock + quantity
        break
      case 'subtract':
        newStock = Math.max(0, product.stock - quantity)
        break
      case 'set':
        newStock = Math.max(0, quantity)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        )
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      }
    })

    return NextResponse.json({
      product: updatedProduct,
      previousStock: product.stock,
      newStock,
      operation,
      reason: reason || null
    })
  } catch (error) {
    console.error('Error updating product stock:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update product stock' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product is used in any transactions
    const transactionItems = await prisma.transactionItem.count({
      where: { productId: id }
    })

    if (transactionItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that has been sold' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      deletedProduct: existingProduct
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
       }
