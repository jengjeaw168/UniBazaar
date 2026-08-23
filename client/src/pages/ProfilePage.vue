<template>
  <div class="page-wrap">
    <h2 style="margin-bottom: 1.5rem;">บัญชีผู้ใช้ 👤</h2>

    <div class="card form-card" style="margin-top: 1rem;">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <form @submit.prevent="handleSave">
        <p class="sub">จัดการข้อมูลส่วนตัวของคุณเพื่อความสะดวกในการซื้อขาย</p>

        <div class="profile-pic-section" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
          <img :src="previewUrl || (auth.user?.avatar ? `/uploads/${auth.user.avatar}` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')" class="avatar-preview" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gray-200);" />
          <div class="form-group" style="flex: 1;">
            <label>รูปประจำตัว</label>
            <input type="file" accept="image/*" @change="onFileChange" class="form-control" />
          </div>
        </div>

        
        <div class="qr-pic-section" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee;">
          <img :src="qrPreviewUrl || (auth.user?.promptpay_qr ? `/uploads/${auth.user.promptpay_qr}` : 'https://via.placeholder.com/150?text=No+QR')" class="avatar-preview" style="width: 80px; height: 80px; object-fit: contain; border: 2px solid var(--gray-200); border-radius: 8px;" />
          <div class="form-group" style="flex: 1;">
            <label>QR Code สำหรับรับเงิน (สำหรับผู้ขาย)</label>
            <input type="file" accept="image/*" @change="onQrChange" class="form-control" />
            <small>อัปโหลด QR Code บัญชีธนาคารหรือพร้อมเพย์ของคุณ เพื่อให้ผู้ซื้อโอนเงินเข้าบัญชีคุณโดยตรง</small>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>ชื่อผู้ใช้งาน</label>
            <input :value="auth.user?.username" class="form-control" disabled />
            <small>ไม่สามารถเปลี่ยนชื่อผู้ใช้งานได้</small>
          </div>
          <div class="form-group">
            <label>อีเมล</label>
            <input :value="auth.user?.email" class="form-control" disabled />
            <small>ไม่สามารถเปลี่ยนอีเมลได้ในขณะนี้</small>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>ชื่อ-นามสกุล</label>
            <input v-model="form.full_name" class="form-control" placeholder="ระบุชื่อ-นามสกุล" />
          </div>
          <div class="form-group">
            <label>เบอร์โทรศัพท์</label>
            <input v-model="form.phone" class="form-control" placeholder="08xxxxxxxx" />
          </div>
        </div>

        <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" :disabled="loading">
          {{ loading ? 'กำลังบันทึก…' : 'บันทึกข้อมูล' }}
        </button>
      </form>
    </div>

    <!-- Change Password Section -->
    <div class="card form-card" style="margin-top: 2rem; margin-bottom: 3rem;">
      <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">เปลี่ยนรหัสผ่าน</h3>
      <div v-if="pwdError" class="alert alert-error">{{ pwdError }}</div>
      <div v-if="pwdSuccess" class="alert alert-success">{{ pwdSuccess }}</div>

      <form @submit.prevent="handlePasswordChange">
        <div v-if="!isOtpMode" class="form-group" style="position: relative;">
          <label>รหัสผ่านเดิม</label>
          <input type="password" v-model="pwdForm.oldPassword" class="form-control" required />
          <div style="text-align: left; margin-top: 0.25rem;">
            <a href="#" @click.prevent="handleForgotPassword" class="forgot-password-link">ลืมรหัสผ่าน?</a>
          </div>
        </div>
        <div v-else class="form-group">
          <label>รหัส OTP (ถูกส่งไปยังอีเมลจำลองแล้ว)</label>
          <input type="text" v-model="pwdForm.otp" class="form-control" required placeholder="กรอกรหัส 6 หลัก" />
          <div style="text-align: right; margin-top: 0.25rem;">
            <a href="#" @click.prevent="isOtpMode = false" class="forgot-password-link" style="color: var(--gray-500);">ยกเลิก, กลับไปใช้รหัสผ่านเดิม</a>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>รหัสผ่านใหม่</label>
            <input type="password" v-model="pwdForm.newPassword" class="form-control" required minlength="6" />
          </div>
          <div class="form-group">
            <label>ยืนยันรหัสผ่านใหม่</label>
            <input type="password" v-model="pwdForm.confirmPassword" class="form-control" required minlength="6" />
          </div>
        </div>
        <button class="btn btn-outline" style="width: 100%; margin-top: 1rem;" :disabled="pwdLoading">
          {{ pwdLoading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store'
import api from '@/services/api'

const auth = useAuthStore()

const form = ref({
  full_name: '',
  phone: ''
})
const avatarFile = ref(null)
const qrFile = ref(null)
const qrPreviewUrl = ref('')
const previewUrl = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const pwdForm = ref({
  oldPassword: '',
  otp: '',
  newPassword: '',
  confirmPassword: ''
})
const pwdLoading = ref(false)
const pwdError = ref('')
const pwdSuccess = ref('')
const isOtpMode = ref(false)

onMounted(() => {
  if (auth.user) {
    form.value.full_name = auth.user.full_name || ''
    form.value.phone = auth.user.phone || ''
  }
})


function onQrChange(e) {
  const file = e.target.files[0]
  if (file) {
    qrFile.value = file
    qrPreviewUrl.value = URL.createObjectURL(file)
  }
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    avatarFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

async function handleSave() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const fd = new FormData()
    fd.append('full_name', form.value.full_name)
    fd.append('phone', form.value.phone)
    if (avatarFile.value) {
      fd.append('avatar', avatarFile.value)
    }
    if (qrFile.value) {
      fd.append('promptpay_qr', qrFile.value)
    }

    const { data } = await api.put('/auth/profile', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    auth.user = data
    localStorage.setItem('user', JSON.stringify(data))
    success.value = 'บันทึกข้อมูลเรียบร้อยแล้ว'
    setTimeout(() => success.value = '', 3000)
  } catch (err) {
    error.value = err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้'
  } finally {
    loading.value = false
  }
}

async function handlePasswordChange() {
  pwdError.value = ''
  pwdSuccess.value = ''
  
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    pwdError.value = 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน'
    return
  }

  pwdLoading.value = true
  try {
    const payload = { newPassword: pwdForm.value.newPassword }
    if (isOtpMode.value) payload.otp = pwdForm.value.otp
    else payload.oldPassword = pwdForm.value.oldPassword

    const { data } = await api.put('/auth/password', payload)
    pwdSuccess.value = data.message || 'เปลี่ยนรหัสผ่านสำเร็จ'
    pwdForm.value.oldPassword = ''
    pwdForm.value.otp = ''
    pwdForm.value.newPassword = ''
    pwdForm.value.confirmPassword = ''
    isOtpMode.value = false
    setTimeout(() => pwdSuccess.value = '', 3000)
  } catch (err) {
    pwdError.value = err.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้'
  } finally {
    pwdLoading.value = false
  }
}

async function handleForgotPassword() {
  pwdLoading.value = true
  pwdError.value = ''
  pwdSuccess.value = ''
  try {
    const { data } = await api.post('/auth/forgot-password')
    isOtpMode.value = true
    Swal.fire({ icon: 'info', text: String(data.message), confirmButtonColor: '#f36523' }) // Show OTP for demo purposes
  } catch (err) {
    pwdError.value = 'ไม่สามารถขอรหัส OTP ได้'
  } finally {
    pwdLoading.value = false
  }
}
</script>

<style scoped>
.page-wrap { max-width: 600px; margin: 0 auto; padding-top: 2rem; }
.form-card { padding: 2rem; }
h2 { margin-bottom: 0.25rem; font-size: 1.5rem; }
.sub { color: var(--gray-600); margin-bottom: 1.5rem; }
small { display: block; margin-top: 0.25rem; color: var(--gray-600); font-size: 0.85rem; }

.forgot-password-link {
  font-size: 0.85rem;
  color: var(--primary);
  text-decoration: none;
}
.forgot-password-link:hover {
  text-decoration: underline;
}
</style>
