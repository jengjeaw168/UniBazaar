<template>
  <div class="page-wrap">
    <h2>รายการสั่งซื้อ / ขาย</h2>

    <div class="tabs">
      <button :class="{ active: activeTab === 'buyer' }" @click="activeTab = 'buyer'">ที่ฉันซื้อ</button>
      <button :class="{ active: activeTab === 'seller' }" @click="activeTab = 'seller'">ที่ฉันขาย</button>
    </div>

    <!-- Buyer Orders -->
    <div v-if="activeTab === 'buyer'">
      <div v-if="loading" class="loading">กำลังโหลด...</div>
      <div v-else-if="buyerOrders.length === 0" class="empty-msg">คุณยังไม่มีรายการสั่งซื้อ</div>
      <div v-else class="order-list">
        <div v-for="order in buyerOrders" :key="order.id" class="order-card">
          <div class="order-header">
            <span class="order-id">ออเดอร์ #{{ order.id }}</span>
            <span class="order-status" :class="order.status">{{ formatStatus(order.status) }}</span>
          </div>
          <div class="order-body">
            <img :src="getFirstImage(order.product_image)" alt="Product" class="product-img">
            <div class="order-info">
              <h3>{{ order.product_title }}</h3>
              <p class="seller-name">ร้านค้า: {{ order.seller_name }}</p>
              <p class="quantity">จำนวน: {{ order.quantity }} ชิ้น</p>
              <p class="price">ยอดรวม: ฿{{ parseFloat(order.total_price).toLocaleString() }}</p>
                <div class="address-box" style="margin-top: 0.75rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 0.9rem;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
                    <strong style="color: #374151;">ที่อยู่สำหรับจัดส่ง:</strong>
                    <button v-if="order.status === 'paid'" @click="editAddress(order)" class="btn btn-outline btn-sm" style="padding: 0.15rem 0.5rem; font-size: 0.75rem;">แก้ไข</button>
                  </div>
                  <div style="white-space: pre-wrap; color: #4b5563; line-height: 1.4;">{{ order.shipping_address }}</div>
                </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Seller Orders -->
    <div v-if="activeTab === 'seller'">
      <div v-if="loading" class="loading">กำลังโหลด...</div>
      <div v-else-if="sellerOrders.length === 0" class="empty-msg">ยังไม่มีออเดอร์เข้ามาเลย</div>
      <div v-else class="order-list">
        <div v-for="order in sellerOrders" :key="order.id" class="order-card">
          <div class="order-header">
            <span class="order-id">ออเดอร์ #{{ order.id }}</span>
            <span class="order-status" :class="order.status">{{ formatStatus(order.status) }}</span>
          </div>
          <div class="order-body">
            <img :src="getFirstImage(order.product_image)" alt="Product" class="product-img">
            <div class="order-info">
              <h3>{{ order.product_title }}</h3>
              <p class="quantity">จำนวน: {{ order.quantity }} ชิ้น (ยอดรวม: ฿{{ parseFloat(order.total_price).toLocaleString() }})</p>
              <p v-if="order.slip_image" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
                <a :href="`/uploads/${order.slip_image}`" target="_blank" class="btn btn-outline btn-sm" style="display: inline-block; padding: 0.25rem 0.5rem; font-size: 0.8rem; border-color: var(--primary); color: var(--primary);">ตรวจสอบสลิปโอนเงิน</a>
              </p>
              <div class="buyer-info">
                <p><strong>ผู้ซื้อ:</strong> {{ order.buyer_full_name || order.buyer_name }} (โทร: {{ order.buyer_phone || '-' }})</p>
                <p><strong>ที่อยู่จัดส่ง:</strong></p>
                  <p style="white-space: pre-wrap; margin-top: 0.25rem;">{{ order.shipping_address }}</p>
              </div>
            </div>
          </div>
          <div class="order-actions">
            <select v-model="order.status" @change="updateStatus(order.id, order.status)">
                <option value="paid">ชำระเงินแล้ว</option>
                <option value="pending">รอจัดส่ง</option>
                <option value="shipped">จัดส่งแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { orderAPI } from '@/services/api'

const router = useRouter()
const activeTab = ref('buyer')
const buyerOrders = ref([])
const sellerOrders = ref([])
const loading = ref(false)

function getFirstImage(imgStr) {
  if (!imgStr) return 'https://placehold.co/100x100?text=No+Image'
  try {
    const arr = JSON.parse(imgStr)
    return arr.length ? `/uploads/${arr[0]}` : 'https://placehold.co/100x100?text=No+Image'
  } catch {
    return `/uploads/${imgStr}`
  }
}

async function fetchOrders() {
  loading.value = true
  try {
    if (activeTab.value === 'buyer') {
      const { data } = await orderAPI.getBuyerOrders()
      buyerOrders.value = data
    } else {
      const { data } = await orderAPI.getSellerOrders()
      sellerOrders.value = data
    }
  } catch (err) {
    console.error('Failed to load orders', err)
  } finally {
    loading.value = false
  }
}

function editAddress(order) {
    router.push('/address')
  }

  async function updateStatus(id, newStatus) {
  try {
    await orderAPI.updateStatus(id, newStatus)
    Swal.fire({ 
  icon: 'success', 
  title: 'สำเร็จ!', 
  text: 'อัปเดตสถานะเรียบร้อยแล้ว', 
  timer: 2000, 
  showConfirmButton: false,
  position: 'top-end',
  toast: true
})
  } catch (err) {
    Swal.fire({ 
  icon: 'error', 
  title: 'เกิดข้อผิดพลาด', 
  text: 'ไม่สามารถอัปเดตสถานะได้', 
  confirmButtonColor: '#f36523' 
})
  }
}

function formatStatus(status) {
  const map = { pending: 'รอจัดส่ง', paid: 'ชำระเงินแล้ว', shipped: 'จัดส่งแล้ว', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' }
  return map[status] || status
}

watch(activeTab, fetchOrders)
onMounted(fetchOrders)
</script>

<style scoped>
.page-wrap { max-width: 800px; margin: 0 auto; padding-top: 2rem; padding-bottom: 3rem; }
.tabs { display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--gray-200); padding-bottom: 0.5rem; }
.tabs button { background: none; border: none; font-size: 1.1rem; font-family: inherit; font-weight: 600; color: var(--gray-500); cursor: pointer; padding: 0.5rem 1rem; position: relative; }
.tabs button.active { color: var(--primary); }
.tabs button.active::after { content: ''; position: absolute; bottom: -9px; left: 0; width: 100%; height: 2px; background: var(--primary); }

.empty-msg { text-align: center; color: var(--gray-500); padding: 3rem; background: white; border-radius: 12px; border: 1px dashed var(--gray-300); }
.loading { text-align: center; color: var(--gray-500); padding: 2rem; }

.order-list { display: flex; flex-direction: column; gap: 1rem; }
.order-card { background: white; border-radius: 12px; border: 1px solid var(--gray-200); padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.order-header { display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--gray-100); }
.order-id { font-weight: 600; color: var(--gray-700); }
.order-status { font-weight: 600; font-size: 0.9rem; }
.order-status.pending { color: #f59e0b; }
.order-status.paid { color: #3b82f6; }
.order-status.shipped { color: #8b5cf6; }
.order-status.completed { color: #10b981; }
.order-status.cancelled { color: #ef4444; }

.order-body { display: flex; gap: 1rem; }
.order-info { flex: 1; min-width: 0; }
.product-img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--gray-200); }
.order-info h3 { margin: 0 0 0.25rem 0; font-size: 1.1rem; }
.seller-name { font-size: 0.9rem; color: var(--gray-500); margin-bottom: 0.25rem; }
.quantity { font-size: 0.9rem; color: var(--gray-600); margin-bottom: 0.25rem; }
.price { font-weight: 600; color: var(--primary); }

.buyer-info { margin-top: 0.75rem; background: var(--gray-50); padding: 0.75rem; border-radius: 8px; font-size: 0.9rem; color: var(--gray-700); line-height: 1.5; }
.buyer-info p { margin: 0; }

.order-actions { margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--gray-200); text-align: right; }
.order-actions select { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid var(--gray-300); font-family: inherit; font-size: 0.9rem; cursor: pointer; background: white; }
</style>
