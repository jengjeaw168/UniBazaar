<template>
  <div class="page-wrap">
    <h2>ตะกร้าสินค้า 🛒</h2>

    <div v-if="cart.items.length === 0" class="empty-msg card">
      <p>ตะกร้าสินค้าของคุณว่างเปล่า</p>
      <RouterLink to="/" class="btn btn-outline" style="margin-top: 1rem;">เลือกซื้อสินค้าต่อ</RouterLink>
    </div>

    <div v-else class="cart-layout">
      <!-- Cart Items -->
      <div class="cart-items card">
        <div class="cart-header" style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
          <input type="checkbox" id="selectAll" class="circle-checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
          <label for="selectAll" style="font-weight: bold; cursor: pointer;">เลือกทั้งหมด</label>
        </div>

        <div v-for="item in cart.items" :key="item.id" class="cart-item">
          <input type="checkbox" :value="item.id" v-model="selectedItems" class="circle-checkbox" />
          <img :src="getFirstImage(item.image)" alt="item" class="item-img" />
          <div class="item-info">
            <RouterLink :to="`/products/${item.id}`" class="item-title">{{ item.title }}</RouterLink>
            <p class="item-price">฿{{ Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
          </div>
          <div class="item-actions">
            <div class="qty-control">
              <button class="btn btn-outline btn-sm" @click="cart.updateQuantity(item.id, item.quantity - 1)">-</button>
              <span class="qty-display">{{ item.quantity }}</span>
              <button class="btn btn-outline btn-sm" @click="cart.updateQuantity(item.id, item.quantity + 1)">+</button>
            </div>
            <button class="btn btn-danger btn-sm" @click="cart.removeItem(item.id)">ลบ</button>
          </div>
        </div>
      </div>

      <!-- Summary & Checkout -->
      <div class="cart-summary card">
        <div class="address-card">
          <div class="address-header">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <strong>ที่อยู่จัดส่ง</strong>
            </span>
            <a href="#" @click.prevent="showAddressModal = true" class="edit-link">เปลี่ยน</a>
          </div>
          
          <div v-if="parsedAddress" class="address-content">
            <div style="font-weight: 600; color: var(--gray-800); margin-bottom: 2px;">
              {{ parsedAddress.fullName }} <span style="font-weight: 400; color: var(--gray-600); margin-left: 8px;">{{ parsedAddress.phone }}</span>
            </div>
            <div style="color: var(--gray-600); font-size: 0.9rem; line-height: 1.4;">
              {{ parsedAddress.details }}<br />
              ต.{{ parsedAddress.subdistrict }} อ.{{ parsedAddress.district }}<br />
              จ.{{ parsedAddress.province }} {{ parsedAddress.zipcode }}
            </div>
          </div>
          <div v-else class="address-empty">
            <span style="color: var(--danger); font-size: 0.9rem;">คุณยังไม่ได้ตั้งค่าที่อยู่จัดส่ง</span>
            <RouterLink to="/address" class="btn btn-outline btn-sm" style="margin-top: 8px; width: 100%;">เพิ่มที่อยู่</RouterLink>
          </div>
        </div>

        <h3>สรุปคำสั่งซื้อ</h3>
        <div class="summary-row">
          <span>จำนวนสินค้า ({{ selectedTotalItems }}):</span>
          <span>฿{{ selectedTotalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
        </div>
        <hr />
        <div class="summary-row total">
          <span>ยอดรวม:</span>
          <span>฿{{ selectedTotalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
        </div>

        <button class="btn btn-primary checkout-btn" @click="openPaymentModal" :disabled="checkingOut || selectedItems.length === 0">
          {{ checkingOut ? 'กำลังดำเนินการ...' : 'ชำระเงิน (Checkout)' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Address Selection Modal -->
  <div v-if="showAddressModal" class="modal-backdrop" @click.self="showAddressModal = false">
    <div class="modal-content address-modal">
      <h3 style="margin-bottom: 1rem;">เลือกที่อยู่จัดส่ง</h3>
      <div class="address-list">
        <div 
          v-for="(addr, idx) in allAddresses" 
          :key="idx" 
          class="address-item"
          :class="{ active: selectedAddressIndex === idx }"
          @click="selectedAddressIndex = idx; showAddressModal = false"
        >
          <div class="addr-header">
            <strong>{{ addr.fullName }}</strong> <span style="color: var(--gray-600); margin-left: 10px;">{{ addr.phone }}</span>
            <span v-if="addr.isDefault" class="badge-default">ค่าเริ่มต้น</span>
          </div>
          <div class="addr-body">
            {{ addr.details }}<br />
            ต.{{ addr.subdistrict }} อ.{{ addr.district }} จ.{{ addr.province }} {{ addr.zipcode }}
          </div>
          <div v-if="selectedAddressIndex === idx" class="check-icon">✓</div>
        </div>
      </div>
      <div style="margin-top: 1rem; text-align: center;">
        <RouterLink to="/address" class="btn btn-outline" style="width: 100%; display: block;">+ เพิ่มที่อยู่ใหม่</RouterLink>
      </div>
    </div>
  </div>

  <!-- Payment Modal -->
  <div v-if="showPaymentModal" class="modal-backdrop" @click.self="showPaymentModal = false">
    <div class="modal-content payment-modal">
      <h3 style="margin-bottom: 1rem; text-align: center;">ชำระเงินผ่าน PromptPay</h3>
      
      <div class="payment-info" style="text-align: center; margin-bottom: 1.5rem;">
        <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">ยอดชำระ: <strong style="color: var(--primary);">฿{{ selectedTotalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</strong></p>
        
        <div class="qr-container" style="display: flex; justify-content: center; margin: 1.5rem 0;">
            <img v-if="currentSellerQr" :src="currentSellerQr" style="width: 250px; height: auto; object-fit: contain; border-radius: 8px; border: 1px solid #ddd; padding: 0.5rem;" />
            <div v-else style="padding: 2rem; background: #fff3cd; color: #856404; border-radius: 8px; border: 1px solid #ffeeba;">
              <strong>⚠️ ผู้ขายยังไม่ได้ตั้งค่าคิวอาร์โค้ดรับเงิน</strong><br>กรุณาติดต่อผู้ขายโดยตรง
            </div>
          </div>
          
          <p v-if="currentSellerQr" style="color: var(--gray-600); margin-bottom: 1rem;">โปรดสแกน QR Code เพื่อชำระเงินเข้าบัญชีผู้ขาย</p>
      </div>
      
      <div class="upload-section">
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">อัปโหลดสลิปหลักฐานการโอนเงิน</label>
        <input type="file" accept="image/*" @change="onSlipChange" class="form-control" style="margin-bottom: 1.5rem;" />
      </div>
      
      <div style="display: flex; gap: 1rem;">
        <button class="btn btn-outline" style="flex: 1;" @click="showPaymentModal = false">ยกเลิก</button>
        <button class="btn btn-primary" style="flex: 1;" @click="confirmPayment" :disabled="checkingOut || !slipFile">
          {{ checkingOut ? 'กำลังยืนยัน...' : 'ยืนยันการชำระเงิน' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore, useAuthStore } from '@/store'
import { productAPI } from '@/services/api'


const cart = useCartStore()
const auth = useAuthStore()
const router = useRouter()
const checkingOut = ref(false)
const showPaymentModal = ref(false)
const slipFile = ref(null)
const currentSellerQr = ref(null)

function onSlipChange(e) {
  slipFile.value = e.target.files[0]
}

function getFirstImage(imgStr) {
  if (!imgStr) return '/placeholder.png'
  try {
    const arr = JSON.parse(imgStr)
    return arr.length ? `/uploads/${arr[0]}` : '/placeholder.png'
  } catch {
    return `/uploads/${imgStr}`
  }
}

const allAddresses = computed(() => {
  if (!auth.user?.address) return []
  try {
    const parsed = JSON.parse(auth.user.address)
    return Array.isArray(parsed) ? parsed : [ { ...parsed, isDefault: true } ]
  } catch {
    return [ { details: auth.user.address, isDefault: true } ]
  }
})

const showAddressModal = ref(false)
const selectedAddressIndex = ref(-1)

// Automatically set the index to the default address on load
watch(() => allAddresses.value, (addrs) => {
  if (selectedAddressIndex.value === -1 && addrs.length > 0) {
    const defaultIdx = addrs.findIndex(a => a.isDefault)
    selectedAddressIndex.value = defaultIdx !== -1 ? defaultIdx : 0
  }
}, { immediate: true, deep: true })

const parsedAddress = computed(() => {
  if (allAddresses.value.length === 0) return null
  return allAddresses.value[selectedAddressIndex.value] || null
})

const shippingAddress = computed(() => {
  const p = parsedAddress.value
  if (!p) return ''
  return `${p.fullName || ''} (โทร: ${p.phone || ''})\n${p.details || ''}\nต.${p.subdistrict || ''} อ.${p.district || ''}\nจ.${p.province || ''} ${p.zipcode || ''}`.trim()
})

const selectedItems = ref([])

// Computed properties for selected items

const isAllSelected = computed(() => {
  return cart.items.length > 0 && selectedItems.value.length === cart.items.length
})

const selectedTotalItems = computed(() => {
  return cart.items
    .filter(item => selectedItems.value.includes(item.id))
    .reduce((sum, item) => sum + item.quantity, 0)
})

const selectedTotalPrice = computed(() => {
  return cart.items
    .filter(item => selectedItems.value.includes(item.id))
    .reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

function toggleSelectAll(e) {
  if (e.target.checked) {
    selectedItems.value = cart.items.map(item => item.id)
  } else {
    selectedItems.value = []
  }
}

// Automatically remove items from selected array if they are deleted from cart
watch(() => cart.items, (newItems) => {
  const itemIds = newItems.map(i => i.id)
  selectedItems.value = selectedItems.value.filter(id => itemIds.includes(id))
}, { deep: true })

function openPaymentModal() {
  if (selectedItems.value.length === 0) return
  if (!shippingAddress.value) {
    if (allAddresses.value.length === 0) {
      Swal.fire({ icon: 'info', text: 'กรุณาเพิ่มที่อยู่จัดส่งก่อนชำระเงิน', confirmButtonColor: '#f36523' })
      router.push('/profile')
      return
    }
    const def = allAddresses.value.find(a => a.isDefault)
    if (!def) {
      showAddressModal.value = true
      return
    }
  }
  
  const itemsToCheckout = cart.items.filter(item => selectedItems.value.includes(item.id))
  const sellerIds = new Set(itemsToCheckout.map(i => i.seller_id))
  
  if (sellerIds.size > 1) {
    Swal.fire({ icon: 'warning', title: 'ไม่สามารถรวมร้านค้าได้', text: 'เนื่องจากเป็นการโอนเงินเข้าบัญชีผู้ขายโดยตรง กรุณาเลือกชำระเงินสินค้าจากร้านค้าเดียวกันทีละร้านครับ' })
    return
  }
  
  currentSellerQr.value = itemsToCheckout[0].seller_qr ? `/uploads/${itemsToCheckout[0].seller_qr}` : null
  
  showPaymentModal.value = true
}

async function confirmPayment() {
  if (!slipFile.value) {
    Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาอัปโหลดสลิปหลักฐานการโอนเงิน' })
    return
  }
  
  checkingOut.value = true
  try {
    const itemsToCheckout = cart.items.filter(item => selectedItems.value.includes(item.id))
    const finalAddress = shippingAddress.value
    
    const fd = new FormData()
    fd.append('items', JSON.stringify(itemsToCheckout))
    fd.append('shippingAddress', finalAddress)
    fd.append('slip_image', slipFile.value)
    
    await productAPI.checkout(fd)
    
    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'ชำระเงินสำเร็จ! คำสั่งซื้อกำลังรอการตรวจสอบ', timer: 2000, showConfirmButton: false })
    
    selectedItems.value.forEach(id => cart.removeItem(id))
    selectedItems.value = []
    showPaymentModal.value = false
    slipFile.value = null
    
    router.push('/orders')
  } catch (err) {
    Swal.fire({ icon: 'info', text: String(err.response?.data?.message || 'ชำระเงินไม่สำเร็จ'), confirmButtonColor: '#f36523' })
  } finally {
    checkingOut.value = false
  }
}

onMounted(() => {
  cart.refreshCart()
})
</script>

<style scoped>
.page-wrap { max-width: 1000px; margin: 0 auto; padding-top: 2rem; }
h2 { margin-bottom: 1.5rem; }
.empty-msg { padding: 3rem; text-align: center; color: var(--gray-600); }

.cart-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; align-items: start; }
.cart-items { padding: 1rem; }
.cart-item { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--gray-200); align-items: center; }
.cart-item:last-child { border-bottom: none; }

.item-img { width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius); }
.item-info { flex: 1; }
.item-title { font-weight: 600; font-size: 1.1rem; color: var(--gray-800); }
.item-price { color: var(--primary); font-weight: 700; margin-top: .25rem; }

.item-actions { display: flex; flex-direction: column; gap: .5rem; align-items: flex-end; }
.qty-control { display: flex; align-items: center; gap: .5rem; }
.qty-display { min-width: 1.5rem; text-align: center; }

.cart-summary { padding: 1.5rem; }
.cart-summary h3 { margin-bottom: 1rem; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: .75rem; }
.summary-row.total { font-weight: 800; font-size: 1.2rem; color: var(--primary); margin-top: 1rem; }
hr { border: none; border-top: 1px solid var(--gray-200); margin: 1rem 0; }
.checkout-btn { width: 100%; font-size: 1.1rem; padding: .8rem; margin-top: 1rem; }
.checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.address-card {
  background: white; border: 1px solid var(--gray-200); border-radius: 8px;
  padding: 1rem; margin-bottom: 1.5rem; text-align: left;
}
.address-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; color: var(--gray-800);
}
.address-header span { display: flex; align-items: center; }
.edit-link { font-size: 0.85rem; color: var(--primary); text-decoration: none; font-weight: 500; }
.edit-link:hover { text-decoration: underline; }
.address-content { margin-left: 20px; }
.address-empty { margin-left: 20px; }

@media (max-width: 768px) {
  .cart-layout { grid-template-columns: 1fr; }
}

.circle-checkbox {
  -webkit-appearance: none;
  appearance: none;
  background-color: #fff;
  width: 22px;
  height: 22px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
  outline: none;
}
.circle-checkbox:hover {
  border-color: var(--primary);
}
.circle-checkbox:checked {
  background-color: var(--primary);
  border-color: var(--primary);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
  background-size: 14px;
  background-position: center;
  background-repeat: no-repeat;
}

/* Modal Styles */
.modal-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white; padding: 1.5rem; border-radius: 8px;
  width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;
}
.address-item {
  border: 1px solid var(--gray-200); border-radius: 6px;
  padding: 1rem; margin-bottom: 0.75rem; cursor: pointer;
  position: relative; transition: all 0.2s;
}
.address-item:hover { border-color: var(--primary); background: #faf5ff; }
.address-item.active { border-color: var(--primary); background: #faf5ff; border-width: 2px; padding: calc(1rem - 1px); }
.addr-header { margin-bottom: 0.25rem; font-size: 1rem; }
.addr-body { color: var(--gray-600); font-size: 0.9rem; line-height: 1.4; }
.check-icon {
  position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
  color: var(--primary); font-size: 1.5rem; font-weight: bold;
}
.badge-default { background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 10px; }
</style>
