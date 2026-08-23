<template>
  <div class="page-wrap modern-page">
    <div class="header-section">
      <h2 class="page-title">{{ isEdit ? 'แก้ไขข้อมูลสินค้า ✏️' : 'ลงขายสินค้าใหม่ 📦' }}</h2>
      <p class="page-subtitle">กรอกรายละเอียดให้ครบถ้วนเพื่อเพิ่มโอกาสในการขาย</p>
    </div>

    <div v-if="error" class="alert alert-error mb-4">{{ error }}</div>
    <div v-if="success" class="alert alert-success mb-4">{{ success }}</div>

    <form @submit.prevent="handleSubmit" enctype="multipart/form-data" class="modern-form">
      <div class="layout-grid">
        <!-- Left Column: Media -->
        <div class="col-media">
          <div class="section-card shadow-sm">
            <h3 class="section-title">รูปภาพสินค้า <span class="required">*</span></h3>
            <p class="section-desc">อัปโหลดภาพเพื่อให้ลูกค้าเห็นสินค้าชัดเจน (สูงสุด 5 รูป)</p>
            
            <!-- Custom Dropzone -->
            <div 
              class="dropzone-area" 
              :class="{ 'is-dragover': dragover }"
              @click="triggerFileInput"
              @dragover.prevent="dragover = true"
              @dragleave.prevent="dragover = false"
              @drop.prevent="handleDrop"
            >
              <input 
                ref="fileInputRef" 
                type="file" 
                multiple 
                accept="image/*" 
                @change="onFileChange" 
                class="hidden-input" 
                :required="!isEdit && previews.length === 0" 
              />
              <div class="dropzone-content">
                <div class="upload-icon">📸</div>
                <div class="upload-text"><strong>คลิกเพื่อเลือกไฟล์</strong> หรือลากรูปภาพมาวางที่นี่</div>
                <div class="upload-hint">รองรับ JPG, PNG (ขนาดไม่เกิน 5MB)</div>
              </div>
            </div>

            <!-- Previews -->
            <div v-if="previews.length > 0" class="preview-grid mt-4">
              <div v-for="(p, i) in previews" :key="p" class="preview-item">
                <img :src="p" alt="Preview" />
                <button type="button" class="btn-remove" @click.stop="removePreview(i)">✕</button>
              </div>
            </div>
            <div v-else-if="currentImages.length > 0" class="preview-grid mt-4">
              <div v-for="img in currentImages" :key="img" class="preview-item">
                <img :src="`/uploads/${img}`" alt="Current" />
              </div>
              <p class="note-text text-sm mt-2 text-gray-500">* หากอัปโหลดรูปภาพใหม่ รูปภาพเดิมทั้งหมดจะถูกแทนที่</p>
            </div>
          </div>
        </div>

        <!-- Right Column: Details -->
        <div class="col-details">
          <div class="section-card shadow-sm">
            <h3 class="section-title">ข้อมูลพื้นฐาน</h3>
            
            <div class="form-group">
              <label>ชื่อสินค้า <span class="required">*</span></label>
              <input v-model="form.title" class="form-control" required placeholder="เช่น หนังสือแคลคูลัส ปี 1 สภาพดีมาก" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>หมวดหมู่ <span class="required">*</span></label>
                <select v-model="form.category_id" class="form-control" required>
                  <option value="" disabled>เลือกหมวดหมู่...</option>
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>สภาพสินค้า <span class="required">*</span></label>
                <select v-model="form.item_condition" class="form-control" required>
                  <option value="" disabled>เลือกสภาพสินค้า...</option>
                  <option value="มือ 1">มือ 1 (ของใหม่ไม่เคยใช้งาน)</option>
                  <option value="มือ 2">มือ 2 (ของมือสองมีตำหนิบ้าง)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>รายละเอียดสินค้า <span class="required">*</span></label>
              <textarea v-model="form.description" class="form-control" rows="5" required placeholder="อธิบายสภาพสินค้า, ตำหนิ, ปีที่ซื้อ, หรือรายละเอียดอื่นๆ..." />
            </div>
          </div>

          <div class="section-card shadow-sm mt-4">
            <h3 class="section-title">การขายและสินค้าคงคลัง</h3>
            
            <div class="form-row">
              <div class="form-group flex-1">
                <label>ราคา (บาท) <span class="required">*</span></label>
                <div class="price-input-wrapper">
                  <span class="currency-prefix">฿</span>
                  <input :value="displayPrice" @input="handlePriceInput" class="form-control pl-8" type="text" required placeholder="0" />
                </div>
              </div>
              <div class="form-group flex-1">
                <label>จำนวนสต็อก <span class="required">*</span></label>
                <input v-model.number="form.stock" class="form-control" type="number" min="1" required placeholder="1" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>ขนาด / ไซส์ (ไม่บังคับ)</label>
                <input v-model="form.size" class="form-control" placeholder="เช่น S, M, L หรือ ฟรีไซส์" />
              </div>
              <div v-if="isEdit" class="form-group flex-1">
                <label>สถานะการขาย</label>
                <select v-model="form.status" class="form-control">
                  <option value="available">มีสินค้า (Available)</option>
                  <option value="sold">ขายแล้ว (Sold Out)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="action-buttons mt-6">
            <RouterLink to="/" class="btn btn-outline cancel-btn">ยกเลิก</RouterLink>
            <button class="btn btn-primary submit-btn" type="submit" :disabled="loading">
              {{ loading ? 'กำลังบันทึกข้อมูล...' : (isEdit ? 'บันทึกการแก้ไข' : 'ลงขายสินค้า') }}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { productAPI }               from '@/services/api'

const route  = useRoute()
const router = useRouter()

const isEdit     = computed(() => !!route.params.id && route.path.includes('/edit'))
const categories = ref([])
const form       = ref({ title: '', category_id: '', price: '', item_condition: '', description: '', size: '', stock: 1, status: 'available' })
const imageFiles = ref([])
const previews   = ref([])
const currentImages = ref([])
const loading    = ref(false)
const error      = ref('')
const success    = ref('')

const displayPrice = ref('')

const fileInputRef = ref(null)
const dragover = ref(false)

function triggerFileInput() {
  fileInputRef.value.click()
}

function handleDrop(e) {
  dragover.value = false
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processFiles(e.dataTransfer.files)
  }
}

function onFileChange(e) {
  if (e.target.files && e.target.files.length > 0) {
    processFiles(e.target.files)
  }
}

function processFiles(files) {
  imageFiles.value = Array.from(files).slice(0, 5) // max 5
  previews.value = imageFiles.value.map(file => URL.createObjectURL(file))
  currentImages.value = [] // Reset current images if uploading new ones
}

function removePreview(i) {
  imageFiles.value.splice(i, 1)
  previews.value.splice(i, 1)
}

function handlePriceInput(e) {
  let val = e.target.value.replace(/[^0-9]/g, '')
  if (val) {
    displayPrice.value = Number(val).toLocaleString('en-US')
    form.value.price = Number(val)
  } else {
    displayPrice.value = ''
    form.value.price = ''
  }
}

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

async function fetchProduct() {
  if (!isEdit.value) return
  try {
    const { data } = await productAPI.getById(route.params.id)
    form.value = {
      title:       data.title,
      category_id: data.category_id,
      price:       data.price,
      item_condition: data.item_condition || '',
      description: data.description,
      size:        data.size || '',
      stock:       data.stock || 1,
      status:      data.status,
    }
    displayPrice.value = data.price ? Number(data.price).toLocaleString('en-US') : ''
    
    currentImages.value = []
    if (data.image) {
      try {
        currentImages.value = JSON.parse(data.image)
      } catch {
        currentImages.value = [data.image]
      }
    }
  } catch {
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถโหลดข้อมูลสินค้าได้', confirmButtonColor: '#f36523' }); error.value = '';
  }
}

async function handleSubmit() {
  error.value = ''; success.value = ''
  loading.value = true

  const fd = new FormData()
  fd.append('title',       form.value.title)
  fd.append('category_id', form.value.category_id)
  fd.append('price',       form.value.price)
  fd.append('item_condition', form.value.item_condition)
  fd.append('description', form.value.description)
  fd.append('stock',       form.value.stock)
  if (form.value.size) fd.append('size', form.value.size)
  if (isEdit.value) fd.append('status', form.value.status)
  
  if (imageFiles.value.length > 0) {
    for (const file of imageFiles.value) {
      fd.append('images', file)
    }
  }

  try {
    if (isEdit.value) {
      await productAPI.update(route.params.id, fd)
      Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว', timer: 2000, showConfirmButton: false, position: 'top-end', toast: true }); success.value = '';
    } else {
      const { data } = await productAPI.create(fd)
      router.push(`/products/${data.id}`)
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmButtonColor: '#f36523' }); error.value = '';
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchCategories(); fetchProduct() })
</script>

<style scoped>
.modern-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.header-section {
  text-align: center;
  margin-bottom: 2.5rem;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: 0.5rem;
}
.page-subtitle {
  color: var(--gray-600);
  font-size: 1.1rem;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
  align-items: start;
}
@media (max-width: 768px) {
  .layout-grid { grid-template-columns: 1fr; }
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 1.75rem;
  border: 1px solid var(--gray-200);
}
.shadow-sm { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--gray-800);
}
.section-desc {
  font-size: 0.9rem;
  color: var(--gray-500);
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}
.flex-1 { flex: 1; }

.required { color: var(--danger); }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 2rem; }
.mb-4 { margin-bottom: 1rem; }
.text-sm { font-size: 0.85rem; }
.text-gray-500 { color: var(--gray-500); }

.dropzone-area {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  background-color: #f8fafc;
  transition: all 0.2s ease-in-out;
}
.dropzone-area:hover, .dropzone-area.is-dragover {
  border-color: var(--primary);
  background-color: #fffaf7;
}
.hidden-input { display: none; }
.upload-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.upload-text { font-size: 1.05rem; color: var(--gray-800); margin-bottom: 0.25rem; }
.upload-hint { font-size: 0.85rem; color: var(--gray-500); }

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.75rem;
}
.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.preview-item img {
  width: 100%; height: 100%; object-fit: cover;
}
.btn-remove {
  position: absolute;
  top: 4px; right: 4px;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  width: 24px; height: 24px;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.btn-remove:hover { background: var(--danger); }

.price-input-wrapper { position: relative; }
.currency-prefix {
  position: absolute;
  left: 1rem; top: 50%;
  transform: translateY(-50%);
  color: var(--gray-500);
  font-weight: 500;
}
.pl-8 { padding-left: 2rem !important; }

.action-buttons {
  display: flex; gap: 1rem; justify-content: flex-end;
}
.cancel-btn, .submit-btn {
  padding: 0.75rem 2rem;
  font-size: 1.05rem;
  border-radius: 8px;
}
</style>