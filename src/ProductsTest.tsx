import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

type Product = {
  id: string
  name: string
  price: number
  unit: string
  active: boolean
}

export default function ProductsTest() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setErrorMsg('')

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)

      if (error) {
        console.error(error)
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      setProducts(data || [])
      setLoading(false)
    }

    loadProducts()
  }, [])

  if (loading) return <div>Yükleniyor...</div>
  if (errorMsg) return <div>Hata: {errorMsg}</div>

  return (
    <div style={{ padding: '24px' }}>
      <h2>Ürün Test Listesi</h2>
      {products.length === 0 ? (
        <p>Ürün bulunamadı.</p>
      ) : (
        products.map((p) => (
          <div key={p.id} style={{ marginBottom: '12px' }}>
            {p.name} - {p.price} TL / {p.unit}
          </div>
        ))
      )}
    </div>
  )
}