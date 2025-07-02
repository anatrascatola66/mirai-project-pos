import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface StatsResponse {
  overview: {
    totalSales: number
    totalTransactions: number
    totalProducts: number
    lowStockProducts: number
  }
  salesByPaymentMethod: Array<{
    paymentMethod: string
    total: number
    count: number
    percentage: number
  }>
  topProducts: Array<{
    product: {
      id: string
      name: string
      sku: string
      category: {
        name: string
        color: string
      }
    }
    totalQuantity: number
    totalRevenue: number
    transactionCount: number
  }>
  salesTrend: Array<{
    date: string
    sales: number
    transactions: number
  }>
  lowStockAlert: Array<{
    id: string
    name: string
    sku: string
    stock: number
    minStock: number
    category: {
      name: string
      color: string
    }
  }>
  recentTransactions: Array<{
    id: string
    transactionNumber: string
    customerName: string
    total: number
    paymentMethod: string
    createdAt: Date
    itemCount: number
  }>
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Overview Stats
    const [
      totalSales,
      totalTransactions,
      totalProducts,
      lowStockCount
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          status: 'completed',
          createdAt: { gte: startDate }
        },
        _sum: { total: true }
      }),
      prisma.transaction.count({
        where: {
          status: 'completed',
          createdAt: { gte: startDate }
        }
      }),
      prisma.product.count({
        where: { isActive: true }
      }),
      prisma.product.count({
        where: {
          isActive: true,
          stock: { lte: prisma.product.fields.minStock }
        }
      })
    ])

    // Sales by Payment Method
    const paymentStats = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'completed',
        createdAt: { gte: startDate }
      },
      _sum: { total: true },
      _count: { id: true }
    })

    const totalSalesValue = totalSales._sum.total || 0
    const salesByPaymentMethod = paymentStats.map(stat => ({
      paymentMethod: stat.paymentMethod,
      total: Number(stat._sum.total) || 0,
      count: stat._count.id,
      percentage: totalSalesValue > 0 ? ((Number(stat._sum.total) || 0) / totalSalesValue) * 100 : 0
    }))

    // Top Products
    const topProductsData = await prisma.transactionItem.groupBy({
      by: ['productId'],
      where: {
        transaction: {
          status: 'completed',
          createdAt: { gte: startDate }
        }
      },
      _sum: {
        quantity: true,
        total: true
      },
      _count: {
        transactionId: true
      },
      orderBy: {
        _sum: {
          total: 'desc'
        }
      },
      take: 10
    })

    const topProducts = await Promise.all(
      topProductsData.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            sku: true,
            category: {
              select: {
                name: true,
                color: true
              }
            }
          }
        })

        return {
          product: product!,
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: Number(item._sum.total) || 0,
          transactionCount: item._count.transactionId
        }
      })
    )

    // Sales Trend (last 7 days)
    const salesTrendData = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        status: 'completed',
        createdAt: { gte: startDate }
      },
      _sum: { total: true },
      _count: { id: true }
    })

    // Group by date
    const salesByDate = new Map<string, { sales: number; transactions: number }>()
    
    // Initialize with zeros for all dates in range
    for (let i = 0; i < parseInt(period); i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      salesByDate.set(dateStr, { sales: 0, transactions: 0 })
    }

    // Fill with actual data
    salesTrendData.forEach(item => {
      const dateStr = item.createdAt.toISOString().split('T')[0]
      const existing = salesByDate.get(dateStr) || { sales: 0, transactions: 0 }
      existing.sales += Number(item._sum.total) || 0
      existing.transactions += item._count.id
      salesByDate.set(dateStr, existing)
    })

    const salesTrend = Array.from(salesByDate.entries())
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        transactions: data.transactions
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Low Stock Alert
    const lowStockAlert = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: prisma.product.fields.minStock }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
        category: {
          select: {
            name: true,
            color: true
          }
        }
      },
      orderBy: { stock: 'asc' },
      take: 10
    })

    // Recent Transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { status: 'completed' },
      select: {
        id: true,
        transactionNumber: true,
        customerName: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        items: {
          select: { quantity: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const recentTransactionsFormatted = recentTransactions.map(tx => ({
      id: tx.id,
      transactionNumber: tx.transactionNumber,
      customerName: tx.customerName,
      total: Number(tx.total),
      paymentMethod: tx.paymentMethod,
      createdAt: tx.createdAt,
      itemCount: tx.items.reduce((sum, item) => sum + item.quantity, 0)
    }))

    const response: StatsResponse = {
      overview: {
        totalSales: Number(totalSales._sum.total) || 0,
        totalTransactions,
        totalProducts,
        lowStockProducts: lowStockCount
      },
      salesByPaymentMethod,
      topProducts,
      salesTrend,
      lowStockAlert,
      recentTransactions: recentTransactionsFormatted
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
