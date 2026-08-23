<template>
  <div class="page-wrap">
    <h2 style="margin-bottom: 1.5rem;">ตั้งค่าที่อยู่</h2>

    <div class="card form-card" style="margin-top: 1rem;">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <!-- Address Tab -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <p class="sub" style="margin: 0;">จัดการที่อยู่จัดส่งของคุณ</p>
          <button v-if="!showForm" class="btn btn-outline btn-sm" @click="openForm(-1)">+ เพิ่มที่อยู่ใหม่</button>
        </div>

        <div v-if="!showForm">
          <div v-for="(addr, idx) in addresses" :key="idx" class="address-item" :class="{ 'is-default': addr.isDefault }">
            <div class="addr-header">
              <strong>{{ addr.fullName }}</strong> <span class="phone">{{ addr.phone }}</span>
              <span v-if="addr.isDefault" class="badge badge-default">ค่าเริ่มต้น</span>
            </div>
            <div class="addr-body">
              {{ addr.details }}<br />
              ต.{{ addr.subdistrict }} อ.{{ addr.district }}<br />
              จ.{{ addr.province }} {{ addr.zipcode }}
            </div>
            <div class="addr-actions">
              <a href="#" @click.prevent="openForm(idx)">แก้ไข</a>
              <a href="#" @click.prevent="deleteAddress(idx)" class="text-danger" style="margin-left: 15px;">ลบ</a>
              <a href="#" v-if="!addr.isDefault" @click.prevent="setDefault(idx)" style="margin-left: 15px;">ตั้งเป็นค่าเริ่มต้น</a>
            </div>
          </div>
          
          <div v-if="addresses.length === 0" class="empty-state">
            ยังไม่มีที่อยู่จัดส่ง
          </div>
        </div>

        <form v-else @submit.prevent="saveForm">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label>ชื่อ-นามสกุล</label>
              <input v-model="form.fullName" class="form-control" placeholder="ชื่อ-นามสกุล" required />
            </div>
            <div class="form-group">
              <label>เบอร์โทร</label>
              <input v-model="form.phone" class="form-control" placeholder="08xxxxxxxx" required />
            </div>
          </div>

          <div class="form-group">
            <label>บ้านเลขที่, ซอย, หมู่, ถนน</label>
            <input v-model="form.details" class="form-control" placeholder="บ้านเลขที่, ซอย, หมู่, ถนน" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group autocomplete">
              <label>จังหวัด</label>
              <input v-model="form.province" class="form-control" placeholder="ระบุจังหวัด..." required @focus="showProvince = true" @blur="hideProvince" />
              <ul class="autocomplete-list" v-show="showProvince && provinceSuggestions.length">
                <li v-for="p in provinceSuggestions" :key="p" @mousedown="selectProvince(p)">{{ p }}</li>
              </ul>
            </div>
            <div class="form-group autocomplete">
              <label>เขต/อำเภอ</label>
              <input v-model="form.district" class="form-control" placeholder="ระบุเขต/อำเภอ..." required @focus="showDistrict = true" @blur="hideDistrict" />
              <ul class="autocomplete-list" v-show="showDistrict && districtSuggestions.length">
                <li v-for="a in districtSuggestions" :key="a" @mousedown="selectDistrict(a)">{{ a }}</li>
              </ul>
            </div>
            <div class="form-group autocomplete">
              <label>แขวง/ตำบล</label>
              <input v-model="form.subdistrict" class="form-control" placeholder="ระบุแขวง/ตำบล..." required @focus="showSubdistrict = true" @blur="hideSubdistrict" />
              <ul class="autocomplete-list" v-show="showSubdistrict && subdistrictSuggestions.length">
                <li v-for="d in subdistrictSuggestions" :key="d" @mousedown="selectSubdistrict(d)">{{ d }}</li>
              </ul>
            </div>
            <div class="form-group">
              <label>รหัสไปรษณีย์</label>
              <input v-model="form.zipcode" class="form-control" placeholder="ระบุรหัสไปรษณีย์..." required />
            </div>
          </div>
          
          <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; cursor: pointer;">
            <input type="checkbox" v-model="form.isDefault" style="width: 18px; height: 18px;" />
            <span>ตั้งเป็นที่อยู่จัดส่งเริ่มต้น</span>
          </label>

          <div style="display: flex; gap: 1rem;">
            <button type="submit" class="btn btn-primary" style="flex: 1;" :disabled="loading">
              {{ loading ? 'กำลังบันทึก…' : 'บันทึกที่อยู่' }}
            </button>
            <button type="button" class="btn btn-outline" style="flex: 1;" @click="showForm = false" :disabled="loading">ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/store'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const auth = useAuthStore()
const route = useRoute()

const addresses = ref([])
const showForm = ref(false)
const editingIndex = ref(-1)

const form = ref({
  fullName: '', phone: '', details: '',
  subdistrict: '', district: '', province: '', zipcode: '',
  isDefault: false
})

const error = ref('')
const success = ref('')
const loading = ref(false)

const addressDB = ref([])

function loadAddress() {
  if (auth.user?.address) {
    try {
      const parsed = JSON.parse(auth.user.address)
      if (Array.isArray(parsed)) {
        addresses.value = parsed
      } else {
        addresses.value = [ { ...parsed, isDefault: true } ]
      }
    } catch {
      addresses.value = [ { details: auth.user.address, isDefault: true } ]
    }
  } else {
    addresses.value = []
  }
}

watch(() => auth.user, () => {
  loadAddress()
}, { deep: true })

onMounted(async () => {
  try {
    const res = await fetch('/thai_address.json')
    addressDB.value = await res.json()
  } catch (err) {
    console.error('Failed to load address db', err)
  }
  loadAddress()
})

function openForm(index) {
  if (index >= 0) {
    form.value = { ...addresses.value[index] }
    editingIndex.value = index
  } else {
    form.value = {
      fullName: '', phone: '', details: '',
      subdistrict: '', district: '', province: '', zipcode: '',
      isDefault: addresses.value.length === 0
    }
    editingIndex.value = -1
  }
  showForm.value = true
}

async function saveForm() {
  error.value = ''
  success.value = ''
  loading.value = true
  
  let newAddresses = [...addresses.value]
  
  // If set to default, unset others
  if (form.value.isDefault) {
    newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }))
  }

  if (editingIndex.value >= 0) {
    newAddresses[editingIndex.value] = { ...form.value }
  } else {
    // If it's the first address, force it to be default
    if (newAddresses.length === 0) form.value.isDefault = true
    newAddresses.push({ ...form.value })
  }
  
  await syncAddresses(newAddresses, 'บันทึกที่อยู่เรียบร้อยแล้ว')
  showForm.value = false
}

async function deleteAddress(index) {
  if (!confirm('คุณต้องการลบที่อยู่นี้ใช่หรือไม่?')) return
  let newAddresses = [...addresses.value]
  const deleted = newAddresses.splice(index, 1)[0]
  
  // If we deleted the default and there are others, make the first one default
  if (deleted.isDefault && newAddresses.length > 0) {
    newAddresses[0].isDefault = true
  }
  
  await syncAddresses(newAddresses, 'ลบที่อยู่เรียบร้อยแล้ว')
}

async function setDefault(index) {
  let newAddresses = addresses.value.map((a, i) => ({
    ...a,
    isDefault: i === index
  }))
  await syncAddresses(newAddresses, 'ตั้งเป็นที่อยู่เริ่มต้นแล้ว')
}

async function syncAddresses(newArray, successMsg) {
  loading.value = true
  try {
    const fd = new FormData()
    fd.append('address', JSON.stringify(newArray))
    const { data } = await api.put('/auth/profile', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    auth.user = data
    localStorage.setItem('user', JSON.stringify(data))
    addresses.value = newArray
    success.value = successMsg
    setTimeout(() => success.value = '', 3000)
  } catch (err) {
    error.value = err.response?.data?.message || 'เกิดข้อผิดพลาด'
  } finally {
    loading.value = false
  }
}

const showProvince = ref(false)
const showDistrict = ref(false)
const showSubdistrict = ref(false)

function hideProvince() { setTimeout(() => showProvince.value = false, 150) }
function hideDistrict() { setTimeout(() => showDistrict.value = false, 150) }
function hideSubdistrict() { setTimeout(() => showSubdistrict.value = false, 150) }

function selectProvince(p) { form.value.province = p; showProvince.value = false; }
function selectDistrict(d) { form.value.district = d; showDistrict.value = false; }
function selectSubdistrict(s) { form.value.subdistrict = s; showSubdistrict.value = false; }

const provinceSuggestions = computed(() => {
  const query = form.value.province.trim().toLowerCase()
  const allProvinces = [...new Set(addressDB.value.map(item => item.province))].sort()
  return query ? allProvinces.filter(p => p.toLowerCase().includes(query)) : allProvinces
})

const districtSuggestions = computed(() => {
  const query = form.value.district.trim().toLowerCase()
  let filtered = addressDB.value
  if (form.value.province) {
    filtered = filtered.filter(item => item.province === form.value.province)
  }
  const allAmphoes = [...new Set(filtered.map(item => item.amphoe))].sort()
  return query ? allAmphoes.filter(a => a.toLowerCase().includes(query)) : allAmphoes
})

const subdistrictSuggestions = computed(() => {
  const query = form.value.subdistrict.trim().toLowerCase()
  let filtered = addressDB.value
  if (form.value.province) {
    filtered = filtered.filter(item => item.province === form.value.province)
  }
  if (form.value.district) {
    filtered = filtered.filter(item => item.amphoe === form.value.district)
  }
  const allDistricts = [...new Set(filtered.map(item => item.district))].sort()
  return query ? allDistricts.filter(d => d.toLowerCase().includes(query)) : allDistricts
})


</script>

<style scoped>
.page-wrap { max-width: 600px; margin: 0 auto; padding-top: 2rem; }
.form-card { padding: 2rem; }
h2 { margin-bottom: 0.25rem; font-size: 1.5rem; }
.sub { color: var(--gray-600); margin-bottom: 1.5rem; }
small { display: block; margin-top: 0.25rem; color: var(--gray-600); font-size: 0.85rem; }

.tabs { display: flex; gap: 1rem; border-bottom: 2px solid var(--gray-200); margin-bottom: 1.5rem; }
.tabs a { 
  padding: .5rem 1rem; 
  cursor: pointer; 
  font-weight: 600; 
  color: var(--gray-600); 
  border-bottom: 2px solid transparent; 
  margin-bottom: -2px; 
  text-decoration: none;
}
.tabs a.active { color: var(--primary); border-bottom-color: var(--primary); }
.tabs a:hover:not(.active) { color: var(--primary-dk); }

.autocomplete { position: relative; }
.autocomplete-list {
  position: absolute; top: 100%; left: 0; right: 0;
  background: white; border: 1px solid var(--gray-200);
  border-radius: var(--radius); box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  max-height: 350px; overflow-y: auto; z-index: 50;
  list-style: none; padding: 0; margin: 4px 0 0 0;
}
.autocomplete-list li {
  padding: 0.6rem 1rem; cursor: pointer; color: var(--gray-800);
}
.autocomplete-list li:hover { background-color: var(--gray-50); color: var(--primary); }

.address-item { border: 1px solid var(--gray-200); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; position: relative; }
.address-item.is-default { border-color: var(--primary); background-color: #faf5ff; }
.addr-header { display: flex; align-items: center; margin-bottom: 0.5rem; }
.addr-header strong { font-size: 1.05rem; color: var(--gray-800); }
.phone { color: var(--gray-600); margin-left: 10px; font-size: 0.95rem; }
.badge-default { background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 10px; }
.addr-body { color: var(--gray-600); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem; }
.addr-actions a { color: var(--primary); font-weight: 500; font-size: 0.9rem; text-decoration: none; cursor: pointer; }
.addr-actions a:hover { text-decoration: underline; }
.addr-actions .text-danger { color: var(--danger); }
.empty-state { text-align: center; padding: 3rem 1rem; color: var(--gray-600); border: 2px dashed var(--gray-200); border-radius: 8px; }
</style>
