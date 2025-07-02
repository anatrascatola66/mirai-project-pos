'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, Search, Users, CreditCard, Smartphone, Building, Clock, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  cost: number | null
  sku: string
  barcode: string | null
  stock: number
  minStock: number
  isActive: boolean
  imageUrl: string | null
  categoryId: string
  category: {
    id: string
    name: string
    color: string
  }
}

interface Category {
  id: string
  name: string
  color: string
}

interface CartItem {
  product: Product
  quantity: number
}

interface Customer {
  name: string
  phone: string
}

export default function POSPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [discount, setDiscount] = useState<string>('0')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const { toast } = useToast()

  // Update current time
  useEffect(() => {
    const updateTime = (): void => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('id-ID'))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Fetch products and categories
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async (): Promise<void> => {
    try {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Error",
        description: "Gagal memuat produk",
        variant: "destructive",
      })
    }
  }

  const fetchCategories = async (): Promise<void> => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
    return matchesSearch && matchesCategory && product.isActive
  })

  const addToCart = (product: Product): void => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id)
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prev.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        } else {
          toast({
            title: "Stok Tidak Cukup",
            description: `Stok ${product.name} hanya tersisa ${product.stock}`,
            variant: "destructive",
          })
          return prev
        }
      } else {
        if (product.stock > 0) {
          return [...prev, { product, quantity: 1 }]
        } else {
          toast({
            title: "Stok Habis",
            description: `${product.name} sedang habis`,
            variant: "destructive",
          })
          return prev
        }
      }
    })
  }

  const updateQuantity = (productId: string, newQuantity: number): void => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId))
    } else {
      const product = products.find(p => p.id === productId)
      if (product && newQuantity <= product.stock) {
        setCart(prev =>
          prev.map(item =>
            item.product.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        )
      } else {
        toast({
          title: "Stok Tidak Cukup",
          description: `Stok hanya tersisa ${product?.stock || 0}`,
          variant: "destructive",
        })
      }
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const discountAmount = (subtotal * Number(discount)) / 100
  const tax = (subtotal - discountAmount) * 0.1 // 10% tax
  const total = subtotal - discountAmount + tax
  const change = paymentMethod === 'cash' ? Math.max(0, Number(amountPaid) - total) : 0

  const handleCheckout = async (): Promise<void> => {
    if (cart.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Tambahkan produk ke keranjang terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === 'cash' && Number(amountPaid) < total) {
      toast({
        title: "Pembayaran Kurang",
        description: `Pembayaran kurang Rp ${(total - Number(amountPaid)).toLocaleString('id-ID')}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const transactionData = {
        customerName: customer.name || 'Guest',
        customerPhone: customer.phone || '',
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        })),
        subtotal,
        discount: discountAmount,
        tax,
        total,
        paymentMethod,
        amountPaid: paymentMethod === 'cash' ? Number(amountPaid) : total,
        change: change
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) throw new Error('Transaction failed')

      const result = await response.json()

      toast({
        title: "Transaksi Berhasil!",
        description: `Transaksi #${result.transactionNumber} telah berhasil`,
      })

      // Reset form
      setCart([])
      setCustomer({ name: '', phone: '' })
      setAmountPaid('')
      setDiscount('0')
      
      fetchProducts() // Refresh to update stock
    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: "Transaksi Gagal",
        description: "Terjadi kesalahan saat memproses transaksi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg mirai-gradient flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold mirai-gradient-text">Mirai Project POS</h1>
                <p className="text-sm text-gray-600">Modern Point of Sale System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  <Clock className="inline w-4 h-4 mr-1" />
                  {currentTime}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('id-ID')}
                </div>
              </div>
              
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Katalog Produk</CardTitle>
                <CardDescription>Pilih produk untuk ditambahkan ke keranjang</CardDescription>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari produk atau SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer mirai-card-hover"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="secondary"
                            style={{ backgroundColor: `${product.category.color}20`, color: product.category.color }}
                          >
                            {product.category.name}
                          </Badge>
                          <span className="text-sm text-gray-500">Stok: {product.stock}</span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-xs text-gray-600 mb-2">{product.sku}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            Rp {product.price.toLocaleString('id-ID')}
                          </span>
                          <Button size="sm" className="mirai-gradient">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Tidak ada produk yang ditemukan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-6">
            {/* Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Keranjang ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.product.name}</h4>
                            <p className="text-xs text-gray-600">
                              Rp {item.product.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Informasi Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Nama pelanggan (opsional)"
                  value={customer.name}
                  onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Nomor HP (opsional)"
                  value={customer.phone}
                  onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                />
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle>Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center">
                          <span className="mr-2">💵</span> Tunai
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Kartu
                        </div>
                      </SelectItem>
                      <SelectItem value="ewallet">
                        <div className="flex items-center">
                          <Smartphone className="w-4 h-4 mr-2" />
                          E-Wallet
                        </div>
                      </SelectItem>
                      <SelectItem value="transfer">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-2" />
                          Transfer Bank
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Diskon (%)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>

                {paymentMethod === 'cash' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Jumlah Dibayar</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Diskon ({discount}%):</span>
                      <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Pajak (10%):</span>
                    <span>Rp {tax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                  {paymentMethod === 'cash' && change > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Kembalian:</span>
                      <span>Rp {change.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mirai-gradient"
                  onClick={handleCheckout}
                  disabled={isLoading || cart.length === 0}
                >
                  {isLoading ? (
                    <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    'Checkout'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
