import { defineStore } from 'pinia'
import { authAPI, productAPI } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user:  JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin:    (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(credentials) {
      const { data } = await authAPI.login(credentials)
      this.token = data.token
      this.user  = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user',  JSON.stringify(data.user))
    },

    async register(payload) {
      const { data } = await authAPI.register(payload)
      this.token = data.token
      this.user  = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user',  JSON.stringify(data.user))
    },

    logout() {
      this.token = null
      this.user  = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    async fetchMe() {
      try {
        const { data } = await authAPI.me()
        this.user = data
        localStorage.setItem('user', JSON.stringify(data))
      } catch {
        this.logout()
      }
    },
  },
})

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(localStorage.getItem('cart') || '[]'),
  }),
  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  },
  actions: {
    addItem(product, quantity = 1) {
      const existing = this.items.find(i => i.id === product.id)
      if (existing) {
        existing.quantity += quantity
        if (existing.quantity > product.stock) existing.quantity = product.stock
      } else {
        this.items.push({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          stock: product.stock,
          seller_id: product.seller_id,
          seller_qr: product.seller_qr,
          quantity
        })
      }
      this.save()
    },
    removeItem(id) {
      this.items = this.items.filter(i => i.id !== id)
      this.save()
    },
    updateQuantity(id, quantity) {
      const item = this.items.find(i => i.id === id)
      if (item) {
        item.quantity = quantity
        if (item.quantity > item.stock) item.quantity = item.stock
        if (item.quantity <= 0) this.removeItem(id)
        else this.save()
      }
    },
    clearCart() {
      this.items = []
      this.save()
    },
    async refreshCart() {
      if (this.items.length === 0) return
      try {
        const promises = this.items.map(item => productAPI.getById(item.id).catch(() => null))
        const results = await Promise.all(promises)
        
        let changed = false
        for (let i = 0; i < this.items.length; i++) {
          const res = results[i]
          if (res && res.data) {
            const latest = res.data
            if (this.items[i].price !== latest.price || this.items[i].stock !== latest.stock || this.items[i].status !== latest.status) {
              this.items[i].price = latest.price
              this.items[i].stock = latest.stock
              this.items[i].seller_qr = latest.seller_qr
              if (this.items[i].quantity > latest.stock) this.items[i].quantity = latest.stock
              changed = true
            }
            if (latest.status === 'sold') {
              this.items[i].stock = 0
              this.items[i].quantity = 0
              changed = true
            }
          }
        }
        
        this.items = this.items.filter(i => i.quantity > 0 && i.stock > 0)
        
        if (changed) {
          this.save()
        }
      } catch (err) {
        console.error('Failed to refresh cart', err)
      }
    },
    save() {
      localStorage.setItem('cart', JSON.stringify(this.items))
    }
  }
})
