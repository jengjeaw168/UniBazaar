<template>
  <div v-if="loading" class="center-msg">กำลังโหลด…</div>
  <div v-else-if="error" class="alert alert-error">{{ error }}</div>

  <div v-else-if="product" class="detail-layout">
    <!-- Image Gallery -->
    <div class="detail-image-gallery">
      <div class="main-image">
        <img :src="productImages.length ? `/uploads/${productImages[currentImageIndex]}` : '/placeholder.png'" :alt="product.title" />
      </div>
      <div v-if="productImages.length > 1" class="thumbnail-list">
        <img
          v-for="(img, idx) in productImages"
          :key="img"
          :src="`/uploads/${img}`"
          :class="['thumbnail', { active: currentImageIndex === idx }]"
          @click="currentImageIndex = idx"
        />
      </div>
    </div>

    <!-- Info -->
    <div class="detail-info">
      <div class="detail-top">
        <span class="category-chip">{{ product.category_name }}</span>
        <span v-if="product.item_condition" class="condition-chip">{{ product.item_condition }}</span>
        <span :class="['badge', product.status === 'sold' ? 'badge-sold' : 'badge-available']">{{ product.status === 'sold' ? 'ขายแล้ว' : 'มีสินค้า' }}</span>
      </div>
      <h1>{{ product.title }}</h1>
      <p class="price">฿{{ Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
      <p v-if="product.size" class="size"><strong>ขนาด:</strong> {{ product.size }}</p>
      <p class="description">{{ product.description }}</p>

      <div class="stock-info">
        <p><strong>จำนวน:</strong> {{ product.stock }} ชิ้น</p>
      </div>

      <!-- Buyer actions -->
      <div v-if="!isOwner && product.status === 'available'" class="buyer-actions">
        <div class="qty-control">
          <button class="btn btn-outline btn-sm" @click="qty > 1 && qty--">-</button>
          <span class="qty-display">{{ qty }}</span>
          <button class="btn btn-outline btn-sm" @click="qty < product.stock && qty++">+</button>
        </div>
        <button class="btn btn-outline" @click="addToCart" style="flex: 1; white-space: nowrap;">เพิ่มไปยังรถเข็น</button>
        <button class="btn btn-primary" @click="buyNow" style="flex: 1; white-space: nowrap;">ซื้อสินค้า</button>
      </div>

      <!-- Owner actions -->
      <div v-if="isOwner || auth.isAdmin" class="owner-actions">
        <RouterLink :to="`/products/${product.id}/edit`" class="btn btn-outline">แก้ไข</RouterLink>
        <button class="btn btn-danger" @click="handleDelete">ลบ</button>
      </div>
    </div>

    <!-- Seller Profile -->
    <div v-if="product" class="seller-profile card">
      <div class="seller-info-left">
        <div class="seller-avatar-large" style="overflow: hidden;">
          <img v-if="product.seller_avatar" :src="`/uploads/${product.seller_avatar}`" style="width: 100%; height: 100%; object-fit: cover;" />
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="seller-details">
          <h3>{{ product.seller_name }}</h3>
          <p class="seller-stats">
            <span>⭐ {{ product.avg_rating ? parseFloat(product.avg_rating).toFixed(1) : '0.0' }} ({{ product.review_count || 0 }} รีวิว)</span>
            <span class="divider">|</span>
            <span>📦 สินค้าทั้งหมด {{ sellerProductsCount }} รายการ</span>
          </p>
        </div>
      </div>
      <button class="btn btn-outline" @click="router.push(`/seller/${product.seller_id}`)">ดูร้านค้า</button>
    </div>

    <!-- Reviews section -->
    <div class="reviews-section card">
      <h2>รีวิวสำหรับ {{ product.seller_name }}</h2>

      <!-- Submit review -->
      <div v-if="auth.isLoggedIn && !isOwner" class="review-form">
        <div class="form-group">
          <label>ให้คะแนน</label>
          <select v-model="reviewForm.rating" class="form-control" style="width:auto">
            <option v-for="n in 5" :key="n" :value="n">{{ '★'.repeat(n) }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>ความคิดเห็น (ไม่บังคับ)</label>
          <textarea v-model="reviewForm.comment" class="form-control" rows="3" />
        </div>
        <button class="btn btn-primary" @click="submitReview" :disabled="submitting">
          {{ submitting ? 'กำลังส่ง…' : 'ส่งรีวิว' }}
        </button>
      </div>

      <!-- Review list -->
      <div v-if="reviews.length" style="margin-top:1rem">
        <ReviewCard v-for="r in reviews" :key="r.id" :review="r" />
      </div>
      <p v-else class="center-msg">ยังไม่มีรีวิว</p>
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { productAPI, reviewAPI }    from '@/services/api'
import { useAuthStore, useCartStore } from '@/store'
import ReviewCard                   from '@/components/ReviewCard.vue'

const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()
const cart    = useCartStore()

const product       = ref(null)
const reviews       = ref([])
const loading       = ref(true)
const error         = ref('')
const currentImageIndex = ref(0)
const reviewForm    = ref({ rating: 5, comment: '' })
const submitting    = ref(false)
const qty           = ref(1)

const productImages = computed(() => {
  if (!product.value?.image) return []
  try {
    return JSON.parse(product.value.image)
  } catch {
    return [product.value.image]
  }
})
const sellerProductsCount = ref(0)

const isOwner = computed(() => auth.user?.id === product.value?.seller_id)

function addToCart() {
  if (!product.value) return
  if (!auth.isLoggedIn) {
    Swal.fire({ icon: 'info', text: 'กรุณาเข้าสู่ระบบก่อนทำรายการ', confirmButtonColor: '#f36523' })
    router.push('/login')
    return
  }
  cart.addItem(product.value, qty.value)
  Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'เพิ่มสินค้าลงรถเข็นแล้ว', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
}

function buyNow() {
  if (!product.value) return
  if (!auth.isLoggedIn) {
    Swal.fire({ icon: 'info', text: 'กรุณาเข้าสู่ระบบก่อนทำรายการ', confirmButtonColor: '#f36523' })
    router.push('/login')
    return
  }
  cart.addItem(product.value, qty.value)
  Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'เพิ่มสินค้าลงรถเข็นแล้ว', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
  router.push('/cart')
}

function starStr(avg) {
  const n = Math.round(avg || 0)
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

async function fetchProduct() {
  try {
    const { data } = await productAPI.getById(route.params.id)
    product.value = data

    // Fetch seller product count
    const { data: sellerProds } = await productAPI.getBySeller(data.seller_id)
    sellerProductsCount.value = sellerProds.length
  } catch (err) {
    error.value = 'โหลดข้อมูลสินค้าไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

async function fetchReviews() {
  if (!product.value) return
  try {
    const { data } = await reviewAPI.getBySeller(product.value.seller_id)
    reviews.value = data.reviews
  } catch (err) {
    console.error('Failed to load reviews')
  }
}

async function submitReview() {
  if (!reviewForm.value.comment.trim()) {
    Swal.fire({ icon: 'warning', text: 'กรุณากรอกความคิดเห็น', confirmButtonColor: '#f36523' })
    return
  }
  submitting.value = true
  try {
    const { data } = await reviewAPI.create(product.value.seller_id, reviewForm.value)
    product.value.avg_rating = data.avg_rating
    product.value.review_count = data.review_count
    await fetchReviews()
    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'ส่งรีวิวสำเร็จ!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
    reviewForm.value.comment = ''
    reviewForm.value.rating = 5
  } catch (err) {
    let msg = err.response?.data?.message || 'ส่งรีวิวไม่สำเร็จ'
    if (msg === 'You have already reviewed this seller') {
      msg = 'คุณได้รีวิวผู้ขายรายนี้ไปแล้ว'
    }
    Swal.fire({ icon: 'error', text: msg, confirmButtonColor: '#f36523' })
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!confirm('ยืนยันการลบสินค้านี้?')) return
  try {
    await productAPI.delete(product.value.id)
    router.push('/')
  } catch (err) {
    Swal.fire({ icon: 'info', text: 'ลบสินค้าไม่สำเร็จ', confirmButtonColor: '#f36523' })
  }
}

onMounted(async () => {
  await fetchProduct()
  await fetchReviews()
})
</script>

<style scoped>
.detail-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.detail-image-gallery { grid-row: 1; display: flex; flex-direction: column; gap: 1rem; }
.main-image img { width: 100%; border-radius: var(--radius); max-height: 420px; object-fit: cover; }
.thumbnail-list { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; }
.thumbnail { width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius); cursor: pointer; border: 2px solid transparent; opacity: 0.6; transition: 0.2s; }
.thumbnail:hover { opacity: 0.8; }
.thumbnail.active { opacity: 1; border-color: var(--primary); }
.detail-info { display: flex; flex-direction: column; gap: .75rem; }
.detail-top { display: flex; gap: .75rem; margin-bottom: 1rem; align-items: center; }
.category-chip { background: var(--primary); color: white; padding: .2rem .75rem; border-radius: 99px; font-size: .8rem; font-weight: 600; }
.condition-chip { background: #3b82f6; color: white; padding: .2rem .75rem; border-radius: 99px; font-size: .8rem; font-weight: 600; }
h1 { font-size: 1.7rem; }
.price { font-size: 1.8rem; font-weight: 800; color: var(--primary); }
.size { color: var(--gray-800); }
.description { color: var(--gray-600); line-height: 1.7; }
.seller-box { background: var(--gray-50); padding: .8rem 1rem; border-radius: var(--radius); }
.owner-actions { display: flex; gap: .75rem; }
.reviews-section { grid-column: 1 / -1; padding: 1.5rem; }
.review-form { border-bottom: 1px solid var(--gray-200); padding-bottom: 1.25rem; margin-bottom: 1rem; }
.center-msg { text-align: center; color: var(--gray-600); padding: 1.5rem; }
.buyer-actions { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: .5rem; }
.qty-control { display: flex; align-items: center; gap: .5rem; }
.qty-display { min-width: 2rem; text-align: center; font-weight: bold; }
.stock-info { color: var(--gray-600); font-size: .9rem; }

.seller-profile {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  margin-top: 1rem;
}
.seller-info-left { display: flex; align-items: center; gap: 1rem; }
.seller-avatar-large {
  width: 48px; height: 48px; border-radius: 50%; background: var(--gray-100); 
  display: flex; align-items: center; justify-content: center; color: var(--gray-500);
}
.seller-details h3 { margin: 0 0 0.25rem 0; font-size: 1.1rem; color: var(--gray-800); }
.seller-stats { margin: 0; font-size: 0.9rem; color: var(--gray-600); }
.divider { margin: 0 0.5rem; color: var(--gray-300); }

@media (max-width: 700px) {
  .detail-layout { grid-template-columns: 1fr; }
  .seller-profile { flex-direction: column; align-items: flex-start; gap: 1rem; }
}
</style>
