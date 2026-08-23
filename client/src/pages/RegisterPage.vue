<template>
  <div class="auth-wrap">
    <div class="card auth-card">
      <h2>สร้างบัญชีใหม่ 🎓</h2>
      <p class="sub">เข้าร่วม UniBazaar ได้แล้ววันนี้</p>

      <div v-if="error"   class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>ชื่อ-นามสกุล</label>
          <input v-model="form.full_name" class="form-control" required placeholder="ชื่อ-นามสกุล" />
        </div>

        <div class="form-group">
          <label>เบอร์โทรศัพท์</label>
          <input v-model="form.phone" class="form-control" required placeholder="08xxxxxxxx" />
        </div>

        <div class="form-group">
          <label>ชื่อผู้ใช้งาน (Username)</label>
          <input v-model="form.username" class="form-control" required placeholder="username" />
        </div>

        <div class="form-group">
          <label>อีเมล</label>
          <input v-model="form.email" class="form-control" type="email" required placeholder="you@email.com" />
        </div>

        <!-- Password -->
        <div class="form-group">
          <label>รหัสผ่าน <small>(อย่างน้อย 6 ตัวอักษร)</small></label>
          <input
            v-model="form.password"
            class="form-control"
            :type="showPassword ? 'text' : 'password'"
            required
            minlength="6"
            placeholder="••••••••"
          />
          <span class="eye" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </span>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label>ยืนยันรหัสผ่าน</label>
          <input
            v-model="form.confirmPassword"
            class="form-control"
            :type="showConfirm ? 'text' : 'password'"
            required
            placeholder="••••••••"
          />
          <span class="eye" @click="showConfirm = !showConfirm">
            {{ showConfirm ? '🙈' : '👁️' }}
          </span>
        </div>

        <button class="btn btn-primary" style="width:100%; font-weight: 400;" :disabled="loading">
          {{ loading ? 'กำลังสร้างบัญชี…' : 'สมัครสมาชิก' }}
        </button>
      </form>

      <p class="auth-footer">
        มีบัญชีอยู่แล้วใช่ไหม? <RouterLink to="/login">เข้าสู่ระบบ</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2';
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '@/services/api'

const router  = useRouter()

const form = ref({
  username: '',
  email: '',
  full_name: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const error   = ref('')
const success = ref('')
const loading = ref(false)

const showPassword = ref(false)
const showConfirm  = ref(false)

async function handleRegister() {
  error.value = ''
  success.value = ''

  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'รหัสผ่านไม่ตรงกัน'
    return
  }

  loading.value = true
  try {
    await authAPI.register(form.value)
    Swal.fire({ icon: 'info', text: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบเพื่อใช้งาน', confirmButtonColor: '#f36523' })
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'ไม่สามารถสมัครสมาชิกได้'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrap {
  display: flex;
  justify-content: center;
  padding-top: 4rem;
}

.auth-card {
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: .25rem;
}

.sub {
  color: var(--gray-600);
  margin-bottom: 1.5rem;
}

.auth-footer {
  text-align: center;
  margin-top: 1.25rem;
  font-size: .9rem;
}

/* ✅ eye icon */
.form-group {
  position: relative;
}

.eye {
  position: absolute;
  right: 10px;
  top: 38px;
  cursor: pointer;
  user-select: none;
}
</style>