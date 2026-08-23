<template>
  <div>
    <h1 style="margin-bottom:1.5rem">ระบบจัดการหลังบ้าน (Admin Dashboard) 🛡️</h1>

    <!-- Stats -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card card">
        <div class="stat-num">{{ stats.total_users }}</div>
        <div class="stat-label">ผู้ใช้งานทั้งหมด</div>
      </div>
      <div class="stat-card card">
        <div class="stat-num">{{ stats.total_products }}</div>
        <div class="stat-label">สินค้าทั้งหมด</div>
      </div>
      <div class="stat-card card">
        <div class="stat-num">{{ stats.total_sold }}</div>
        <div class="stat-label">สินค้าที่ขายแล้ว</div>
      </div>
      <div class="stat-card card">
        <div class="stat-num">{{ stats.total_reviews }}</div>
        <div class="stat-label">รีวิวทั้งหมด</div>
      </div>
      <div class="stat-card card danger">
        <div class="stat-num">{{ stats.banned_users }}</div>
        <div class="stat-label">ผู้ใช้ที่ถูกแบน</div>
      </div>
    </div>

    <!-- Tabs & Search -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <div class="tabs" style="margin-bottom: 0;">
        <button :class="{ active: tab === 'users' }"    @click="tab = 'users'">ผู้ใช้งาน</button>
        <button :class="{ active: tab === 'products' }" @click="tab = 'products'">สินค้า</button>
      </div>
      <div v-if="tab === 'users'" style="width: 300px;">
        <input type="text" v-model="userSearch" class="form-control" placeholder="ค้นหาชื่อผู้ใช้หรืออีเมล..." />
      </div>
      <div v-if="tab === 'products'" style="width: 300px;">
        <input type="text" v-model="productSearch" class="form-control" placeholder="ค้นหาสินค้าหรือผู้ขาย..." />
      </div>
    </div>

    <!-- Users table -->
    <div v-if="tab === 'users'" class="card table-card">
      <div v-if="usersLoading" class="center-msg">กำลังโหลดข้อมูล...</div>
      <table v-else-if="filteredUsers.length">
        <thead>
          <tr>
            <th>ไอดี</th><th>ชื่อผู้ใช้งาน</th><th>อีเมล</th><th>บทบาท</th><th>สถานะ</th><th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filteredUsers" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.username }}</td>
            <td>{{ u.email }}</td>
            <td><span class="badge" :class="u.role === 'admin' ? 'badge-admin' : 'badge-user'">{{ u.role }}</span></td>
            <td><span :class="['badge', u.is_banned ? 'badge-sold' : 'badge-available']">{{ u.is_banned ? 'โดนแบนแล้ว' : 'ปกติ' }}</span></td>
            <td>
                <div v-if="u.role !== 'admin'" style="display: flex; gap: 4px;">
                  <button
                    :class="['btn btn-sm', u.is_banned ? 'btn-success' : 'btn-danger']"
                    @click="toggleBan(u)"
                    style="flex: 1; min-width: 60px;"
                  >{{ u.is_banned ? 'ปลดแบน' : 'แบน' }}</button>
                  <button
                    class="btn btn-sm btn-outline"
                    @click="deleteUser(u)"
                    style="flex: 1; min-width: 60px; color: #dc3545; border-color: #dc3545;"
                  >ลบ</button>
                </div>
              </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="center-msg">ไม่พบผู้ใช้งานที่ค้นหา</p>
    </div>

    <!-- Products table -->
    <div v-if="tab === 'products'" class="card table-card">
      <div v-if="prodsLoading" class="center-msg">กำลังโหลดข้อมูล...</div>
      <table v-else-if="filteredProducts.length">
        <thead>
          <tr>
            <th>ไอดี</th><th>ชื่อสินค้า</th><th>ผู้ขาย</th><th>ราคา</th><th>สถานะ</th><th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredProducts" :key="p.id">
            <td>{{ p.id }}</td>
            <td>{{ p.title }}</td>
            <td>{{ p.seller_name }}</td>
            <td>฿{{ Number(p.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
            <td><span :class="['badge', p.status === 'sold' ? 'badge-sold' : 'badge-available']">{{ p.status === 'sold' ? 'ขายแล้ว' : 'มีสินค้า' }}</span></td>
            <td>
              <div style="display: flex; gap: 8px; align-items: center; width: 200px;">
                <RouterLink :to="`/products/${p.id}`" class="btn btn-sm btn-primary" style="flex: 1; height: 34px; padding: 0; margin: 0; font-size: 0.85rem; font-weight: normal; border-radius: 6px; text-align: center; display: flex; justify-content: center; align-items: center; box-sizing: border-box; text-decoration: none;">รายละเอียด</RouterLink>
                <button class="btn btn-sm btn-danger" @click="removeProduct(p)" style="flex: 1; height: 34px; padding: 0; margin: 0; font-size: 0.85rem; font-weight: normal; border-radius: 6px; text-align: center; display: flex; justify-content: center; align-items: center; box-sizing: border-box; border: none; cursor: pointer;">ลบ</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="center-msg">ไม่พบสินค้า</p>
    </div>

      </div>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref, computed, onMounted, watch } from 'vue'
import { adminAPI } from '@/services/api'

const stats         = ref(null)
const tab           = ref('users')
const users         = ref([])
const adminProducts = ref([])
const usersLoading  = ref(false)
const prodsLoading  = ref(false)


const userSearch    = ref('')
const productSearch = ref('')

const filteredUsers = computed(() => {
  if (!userSearch.value) return users.value
  const q = userSearch.value.toLowerCase()
  return users.value.filter(u => 
    u.username.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q)
  )
})

const filteredProducts = computed(() => {
  if (!productSearch.value) return adminProducts.value
  const q = productSearch.value.toLowerCase()
  return adminProducts.value.filter(p => 
    p.title.toLowerCase().includes(q) || 
    p.seller_name.toLowerCase().includes(q)
  )
})

async function fetchStats() {
  const { data } = await adminAPI.getStats()
  stats.value = data
}

async function fetchUsers() {
  usersLoading.value = true
  const { data } = await adminAPI.getUsers()
  users.value = data.rows
  usersLoading.value = false
}

async function fetchProducts() {
  prodsLoading.value = true
  const { data } = await adminAPI.getProducts()
  adminProducts.value = data.rows
  prodsLoading.value = false
}

async function toggleBan(user) {
  const action = user.is_banned ? 'unban' : 'ban'
  if (!confirm(`ยืนยันการ ${action === 'ban' ? 'แบน' : 'ปลดแบน'} ผู้ใช้ ${user.username}?`)) return
  try {
    if (user.is_banned) await adminAPI.unbanUser(user.id)
    else                await adminAPI.banUser(user.id)
    fetchUsers(); fetchStats()
  } catch (err) {
    Swal.fire({ icon: 'info', text: `ทำรายการ ${action === 'ban' ? 'แบน' : 'ปลดแบน'} ไม่สำเร็จ`, confirmButtonColor: '#f36523' })
  }
}

async function deleteUser(u) {
  const result = await Swal.fire({
    title: 'ยืนยันการลบ?',
    text: `คุณต้องการลบบัญชี "${u.username}" ใช่หรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'ใช่, ลบเลย!',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    try {
      await adminAPI.deleteUser(u.id);
      users.value = users.value.filter(user => user.id !== u.id);
      usersTotal.value--;
      Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', text: 'ลบบัญชีผู้ใช้เรียบร้อยแล้ว', timer: 2000, showConfirmButton: false, position: 'top-end', toast: true });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถลบบัญชีได้', confirmButtonColor: '#f36523' });
    }
  }
}

async function removeProduct(prod) {
  if (!confirm(`ยืนยันการลบสินค้า: ${prod.title}?`)) return
  try {
    await adminAPI.deleteProduct(prod.id)
    fetchProducts(); fetchStats()
  } catch (err) {
    Swal.fire({ icon: 'info', text: 'ลบสินค้าไม่สำเร็จ', confirmButtonColor: '#f36523' })
  }
}

watch(tab, (val) => { if (val === 'products') fetchProducts() })

onMounted(() => { fetchStats(); fetchUsers() })
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.stat-card { padding: 1.25rem 1rem; text-align: center; }
.stat-card.danger .stat-num { color: var(--danger); }
.stat-num { font-size: 2rem; font-weight: 800; color: var(--primary); }
.stat-label { font-size: .85rem; color: var(--gray-600); margin-top: .25rem; }

.tabs { display: flex; gap: .5rem; margin-bottom: 1rem; }
.tabs button { padding: .5rem 1.25rem; border: 2px solid var(--gray-200); background: #fff; border-radius: var(--radius); cursor: pointer; font-weight: 600; }
.tabs button.active { border-color: var(--primary); color: var(--primary); }

.table-card { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: .75rem 1rem; text-align: left; border-bottom: 1px solid var(--gray-100); font-size: .9rem; }
th { background: var(--gray-50); font-weight: 700; }
tr:last-child td { border-bottom: none; }

.badge-admin { background: #dbeafe; color: #1e40af; }
.badge-user  { background: var(--gray-100); color: var(--gray-600); }
.center-msg { text-align: center; padding: 2rem; color: var(--gray-600); }

</style>
