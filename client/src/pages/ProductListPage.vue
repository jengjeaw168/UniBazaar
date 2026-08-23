<template>
  <div>
    <!-- Hero -->
    <div class="hero">
      <h1>ค้นหาสินค้าดีๆ รอบรั้วมหาวิทยาลัย</h1>
      <p>ซื้อขายกับเพื่อนนักศึกษา — ปลอดภัย และ รวดเร็ว</p>
    </div>

    <!-- Search & Filter -->
    <div class="search-bar card">
      <input
        v-model="search"
        class="form-control"
        placeholder="ค้นหาหนังสือ, อุปกรณ์อิเล็กทรอนิกส์, เฟอร์นิเจอร์…"
        @keyup.enter="doSearch"
      />
      <select v-model="category" class="form-control" @change="doSearch">
        <option value="">ทุกหมวดหมู่</option>
        <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
      </select>
      <button class="btn btn-primary" @click="doSearch">ค้นหา</button>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="center-msg">กำลังโหลดสินค้า…</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Grid -->
    <div v-else class="products-grid">
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>

    <p v-if="!loading && !products.length" class="center-msg">ไม่พบสินค้าที่คุณค้นหา</p>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="page === 1" @click="changePage(page - 1)">‹ ย้อนกลับ</button>
      <button
        v-for="n in totalPages" :key="n"
        :class="{ active: n === page }"
        @click="changePage(n)"
      >{{ n }}</button>
      <button :disabled="page === totalPages" @click="changePage(page + 1)">ถัดไป ›</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { productAPI } from '@/services/api'
import ProductCard from '@/components/ProductCard.vue'

const products   = ref([])
const categories = ref([])
const search     = ref('')
const category   = ref('')
const page       = ref(1)
const total      = ref(0)
const limit      = 12
const loading    = ref(false)
const error      = ref('')

const totalPages = computed(() => Math.ceil(total.value / limit))

async function fetchCategories() {
  const { data } = await productAPI.getCategories()
  const clothes = data.find(c => c.name === 'เสื้อผ้า')
  const stationery = data.find(c => c.name === 'เครื่องเขียน')
  const furniture = data.find(c => c.name === 'เฟอร์นิเจอร์')
  const books = data.find(c => c.name === 'หนังสือเรียน')
  const electrical = data.find(c => c.name === 'เครื่องใช้ไฟฟ้า')
  const others = data.find(c => c.name === 'อื่นๆ')
  const rest = data.filter(c => 
    c.name !== 'เสื้อผ้า' && 
    c.name !== 'เครื่องเขียน' && 
    c.name !== 'เฟอร์นิเจอร์' &&
    c.name !== 'หนังสือเรียน' && 
    c.name !== 'เครื่องใช้ไฟฟ้า' && 
    c.name !== 'อื่นๆ'
  )
  
  const sorted = []
  if (clothes) sorted.push(clothes)
  if (stationery) sorted.push(stationery)
  if (furniture) sorted.push(furniture)
  if (books) sorted.push(books)
  if (electrical) sorted.push(electrical)
  sorted.push(...rest)
  if (others) sorted.push(others)
  
  categories.value = sorted
}

async function fetchProducts() {
  loading.value = true
  error.value   = ''
  try {
    const { data } = await productAPI.getAll({
      search: search.value,
      category: category.value,
      page: page.value,
      limit,
    })
    products.value = data.rows
    total.value    = data.total
  } catch {
    error.value = 'Failed to load products'
  } finally {
    loading.value = false
  }
}

function doSearch() { page.value = 1; fetchProducts() }
function changePage(n) { page.value = n; fetchProducts() }

onMounted(() => { fetchCategories(); fetchProducts() })
</script>

<style scoped>
.hero { text-align: center; padding: 2.5rem 1rem 2rem; }
.hero h1 { font-size: 2rem; margin-bottom: .5rem; }
.hero p  { color: var(--gray-600); }

.search-bar {
  display: flex; gap: .75rem; padding: 1rem; margin-bottom: 1.75rem; flex-wrap: wrap;
}
.search-bar .form-control:first-child { flex: 1 1 280px; }
.search-bar select { flex: 0 1 180px; }

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1rem;
}

.center-msg { text-align: center; padding: 3rem; color: var(--gray-600); }
</style>
