'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Package, BarChart3, Settings, Database, Plus, Shuffle, Home } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'

interface Category {
  id: string
  name: string
  color: string
}

interface ProductForm {
  name: string
  description: string
  price: string
  cost: string
  sku: string
  barcode: string
  stock: string
  minStock: string
  isActive: boolean
  imageUrl: string
  categoryId: string
}

export default function AdminPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    cost: '',
    sku: '',
    barcode: '',
    stock: '',
    minStock: '5',
    isActive: true,
    imageUrl: '',
    categoryId: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

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

  const generateSKU = (): void => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const sku = `PRD-${timestamp}-${random}`
    setProductForm(prev => ({ ...prev, sku }))
  }

  const generateBarcode = (): void => {
    const barcode = Math.floor(Math.random() * 9000000000000) + 1000000000000
    setProductForm(prev => ({ ...prev, barcode: barcode.toString() }))
  }

  const handleInputChange = (field: keyof ProductForm, value: string | boolean): void => {
    setProductForm(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = (): void => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      cost: '',
      sku: '',
      barcode: '',
      stock: '',
      minStock: '5',
      isActive: true,
      imageUrl: '',
      categoryId: ''
    })
  }

  const handleAddProduct = async (): Promise<void> => {
    if (!productForm.name.trim() || !productForm.categoryId) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Nama produk dan kategori harus diisi",
        variant: "destructive",
      })
      return
    }

    if (!productForm.price || Number(productForm.price) <= 0) {
      toast({
        title: "Harga Tidak Valid",
        description: "Harga harus diisi dan lebih dari 0",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
        price: Number(productForm.price),
        cost: productForm.cost ? Number(productForm.cost) : null,
        sku: productForm.sku || `PRD-${Date.now()}`,
        barcode: productForm.barcode || null,
        stock: Number(productForm.stock) || 0,
        minStock: Number(productForm.minStock) || 5,
        isActive: productForm.isActive,
        imageUrl: productForm.imageUrl.trim() || null,
        categoryId: productForm.categoryId
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
      }

      const result = await response.json()

      toast({
        title: "Produk Berhasil Ditambahkan!",
        description: `${result.name} telah ditambahkan ke katalog`,
      })

      resetForm()
    } catch (error: any) {
      console.error('Add product error:', error)
      toast({
        title: "Gagal Menambah Produk",
        description: error.message || "Terjadi kesalahan saat menambah produk",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedDatabase = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/seed', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to seed database')
      
      toast({
        title: "Database Berhasil Diisi!",
        description: "Data sampel telah ditambahkan ke database",
      })
    } catch (error) {
      console.error('Seed error:', error)
      toast({
        title: "Gagal Mengisi Database",
        description: "Terjadi kesalahan saat mengisi data sampel",
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg mirai-gradient flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold mirai-gradient-text">Admin Panel</h1>
                  <p className="text-xs text-gray-600">Mirai Project POS Management</p>
                </div>
              </div>
            </div>
            
            <Link href="/">
              <Button className="mirai-gradient">
                <Home className="w-4 h-4 mr-2" />
                Ke Kasir
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: 'Produk', icon: Package },
              { id: 'categories', label: 'Kategori', icon: Settings },
              { id: 'reports', label: 'Laporan', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <Card className="mirai-gradient text-white">
              <CardHeader>
                <CardTitle className="text-xl">Selamat Datang di Admin Panel</CardTitle>
                <CardDescription className="text-purple-100">
                  Kelola sistem POS "Mirai Project" dengan mudah dan efisien
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/20 rounded-lg p-4">
                    <Package className="w-8 h-8 mb-2" />
                    <h3 className="font-semibold">Manajemen Produk</h3>
                    <p className="text-sm text-purple-100">Tambah dan kelola produk</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <Database className="w-8 h-8 mb-2" />
                    <h3 className="font-semibold">Database</h3>
                    <p className="text-sm text-purple-100">Setup dan konfigurasi</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <BarChart3 className="w-8 h-8 mb-2" />
                    <h3 className="font-semibold">Analytics</h3>
                    <p className="text-sm text-purple-100">Laporan dan statistik</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Setup Database</CardTitle>
                  <CardDescription>
                    Isi database dengan data sampel untuk testing aplikasi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleSeedDatabase}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="loading-spinner w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Isi Data Sampel
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-600 mt-2">
                    Akan menambahkan 18 produk sampel dan 5 kategori
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Panduan Cepat</CardTitle>
                  <CardDescription>
                    Langkah-langkah menggunakan sistem POS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <p className="font-medium">1. Setup Database</p>
                    <p className="text-gray-600 ml-4">Isi data sampel terlebih dahulu</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">2. Tambah Produk</p>
                    <p className="text-gray-600 ml-4">Gunakan tab "Produk" untuk menambah barang</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">3. Mulai Kasir</p>
                    <p className="text-gray-600 ml-4">Kembali ke halaman utama untuk transaksi</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tambah Produk Baru</CardTitle>
                <CardDescription>
                  Masukkan detail produk yang akan ditambahkan ke katalog
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nama Produk *
                      </label>
                      <Input
                        placeholder="Contoh: Nasi Goreng Spesial"
                        value={productForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Deskripsi
                      </label>
                      <Input
                        placeholder="Deskripsi produk (opsional)"
                        value={productForm.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Harga Jual *
                        </label>
                        <Input
                          type="number"
                          placeholder="25000"
                          value={productForm.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Harga Modal
                        </label>
                        <Input
                          type="number"
                          placeholder="20000"
                          value={productForm.cost}
                          onChange={(e) => handleInputChange('cost', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Codes */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        SKU
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="PRD-123456-789"
                          value={productForm.sku}
                          onChange={(e) => handleInputChange('sku', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSKU}
                        >
                          <Shuffle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Barcode
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="1234567890123"
                          value={productForm.barcode}
                          onChange={(e) => handleInputChange('barcode', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateBarcode}
                        >
                          <Shuffle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Kategori *
                      </label>
                      <Select value={productForm.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
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
                  </div>
                </div>

                {/* Stock and Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Stok Awal
                    </label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={productForm.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Stok Minimum
                    </label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={productForm.minStock}
                      onChange={(e) => handleInputChange('minStock', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Status Aktif
                    </label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={productForm.isActive}
                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      />
                      <span className="text-sm">{productForm.isActive ? 'Aktif' : 'Non-aktif'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    URL Gambar
                  </label>
                  <Input
                    placeholder="https://example.com/image.jpg (opsional)"
                    value={productForm.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleAddProduct}
                    disabled={isLoading}
                    className="mirai-gradient"
                  >
                    {isLoading ? (
                      <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Produk
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Reset Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manajemen Kategori</CardTitle>
                <CardDescription>
                  Fitur ini akan segera hadir untuk mengelola kategori produk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Coming Soon - Manajemen Kategori</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Laporan Penjualan</CardTitle>
                <CardDescription>
                  Fitur ini akan segera hadir untuk melihat analytics dan laporan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Coming Soon - Analytics & Reports</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
