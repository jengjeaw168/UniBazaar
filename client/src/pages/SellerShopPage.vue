<template>
  <div class="page-wrap">
    <div v-if="loading" class="loading">กำลังโหลด...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="shop-header card">
        <div class="seller-avatar-large" style="overflow: hidden;">
          <img v-if="seller?.avatar" :src="'/uploads/' + seller.avatar" style="width:100%;height:100%;object-fit:cover;" />
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="seller-details" style="flex: 1;">
          <h2>ร้านค้าของ {{ sellerName }}</h2>
          <p class="seller-stats">
            <span>⭐ {{ avgRating }} ({{ reviewCount }} รีวิว)</span>
            <span class="divider">|</span>
            <span>📦 สินค้าทั้งหมด {{ products.length }} รายการ</span>
          </p>
          </div>
          <button @click="contactSeller" class="btn btn-outline" style="border-radius: 99px; padding: 0.5rem 1.25rem; font-size: 0.95rem; border-color: #f36523; color: #f36523; margin-left: auto; white-space: nowrap;">💬 ติดต่อผู้ขาย</button>
      </div>

      <div class="products-grid">
        <ProductCard v-for="p in products" :key="p.id" :product="p" />
      </div>
      <div v-if="products.length === 0" class="empty-msg card">
        ยังไม่มีสินค้าวางขาย
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { useRoute } from 'vue-router'
import { productAPI } from '@/services/api'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const products = ref([])
const sellerName = ref('')
const seller = ref(null)
const avgRating = ref('0.0')
const reviewCount = ref(0)
const loading = ref(true)
const error = ref('')

function contactSeller() {
    const phone = seller.value?.phone || '-'
    const email = seller.value?.email || '-'
    
    Swal.fire({
      title: '<strong>ช่องทางติดต่อผู้ขาย</strong>',
      html: `
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; padding: 0 0.5rem;">
          ${email !== '-' ? `
          <a href="mailto:${email}" style="display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; background: #fff5f0; border: 1px solid #fed7aa; border-radius: 16px; text-decoration: none; color: #374151; transition: all 0.2s ease; cursor: pointer; box-shadow: 0 2px 4px rgba(243,101,35,0.05);" onmouseover="this.style.background='#ffedd5'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#fff5f0'; this.style.transform='translateY(0)';">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #f36523; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(243,101,35,0.2);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </div>
            <div style="text-align: left;">
              <div style="font-size: 0.9rem; color: #6b7280; margin-bottom: 0.2rem; font-weight: 500;">ส่งอีเมลหาผู้ขาย</div>
              <div style="font-size: 1.15rem; font-weight: 700; color: #ea580c;">${email}</div>
            </div>
          </a>` : ''}
        
          ${phone !== '-' ? `
          <a href="tel:${phone}" style="display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; background: #fff5f0; border: 1px solid #fed7aa; border-radius: 16px; text-decoration: none; color: #374151; transition: all 0.2s ease; cursor: pointer; box-shadow: 0 2px 4px rgba(243,101,35,0.05);" onmouseover="this.style.background='#ffedd5'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#fff5f0'; this.style.transform='translateY(0)';">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #f36523; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(243,101,35,0.2);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <div style="text-align: left;">
              <div style="font-size: 0.9rem; color: #6b7280; margin-bottom: 0.2rem; font-weight: 500;">โทรติดต่อผู้ขาย</div>
              <div style="font-size: 1.15rem; font-weight: 700; color: #ea580c;">${phone}</div>
            </div>
          </a>` : ''}
        
          ${email === '-' && phone === '-' ? `
            <div style="padding: 2.5rem 1rem; text-align: center; color: #9ca3af; background: #f9fafb; border-radius: 16px; border: 1px dashed #d1d5db;">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 1rem auto; opacity: 0.5;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <div>ผู้ขายยังไม่ได้เพิ่มข้อมูลการติดต่อ</div>
            </div>
          ` : ''}
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'ปิดหน้าต่าง',
      confirmButtonColor: '#4b5563',
      width: '450px',
      padding: '2rem 1.5rem',
      customClass: {
        popup: 'modern-contact-modal'
      }
    })
  }

  onMounted(async () => {
  try {
    const { data } = await productAPI.getBySeller(route.params.id)
    products.value = data
    if (data.length > 0) {
      sellerName.value = data[0].seller_name
      avgRating.value = data[0].avg_rating ? parseFloat(data[0].avg_rating).toFixed(1) : '0.0'
      reviewCount.value = data[0].review_count || 0
      seller.value = { 
          avatar: data[0].seller_avatar,
          phone: data[0].seller_phone,
          email: data[0].seller_email
        }
    }
  } catch (err) {
    error.value = 'ไม่สามารถโหลดข้อมูลร้านค้าได้'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrap { padding-top: 1rem; }
.shop-header { 
  display: flex; align-items: center; gap: 1.5rem; 
  padding: 2rem; margin-bottom: 2rem; 
}
.seller-avatar-large {
  width: 80px; height: 80px; border-radius: 50%; background: var(--gray-100); 
  display: flex; align-items: center; justify-content: center; color: var(--gray-500);
}
.seller-details h2 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
.seller-stats { margin: 0; font-size: 1rem; color: var(--gray-600); }
.divider { margin: 0 0.75rem; color: var(--gray-300); }

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}
.empty-msg { text-align: center; color: var(--gray-500); padding: 3rem; }
.loading, .error { text-align: center; padding: 2rem; }
</style>