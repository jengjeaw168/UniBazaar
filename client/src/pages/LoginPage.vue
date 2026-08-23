<template>
  <div class="auth-wrap">
    <div class="card auth-card">
      <h2>ยินดีต้อนรับสู่ UniBazaar 👋</h2>
      <p class="sub">เข้าสู่ระบบบัญชี UniBazaar ของคุณ</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>ชื่อผู้ใช้งาน</label>
          <input v-model="form.username" class="form-control" type="text" required placeholder="username" />
        </div>
        <div class="form-group">
          <label>รหัสผ่าน</label>
          <input v-model="form.password" class="form-control" type="password" required placeholder="••••••" />
        </div>
        <button class="btn btn-primary" style="width:100%" :disabled="loading">
          {{ loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ' }}
        </button>
      </form>

      <p class="auth-footer">ยังไม่มีบัญชีใช่ไหม? <RouterLink to="/register">สมัครสมาชิก</RouterLink></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/store'
import { useRouter, useRoute } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const form    = ref({ username: '', password: '' })
const error   = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(form.value)
    router.push(route.query.redirect || '/')
  } catch (err) {
    error.value = err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrap { display: flex; justify-content: center; align-items: flex-start; padding-top: 4rem; }
.auth-card { padding: 2.5rem; width: 100%; max-width: 420px; }
h2 { font-size: 1.6rem; margin-bottom: .25rem; }
.sub { color: var(--gray-600); margin-bottom: 1.5rem; }
.auth-footer { text-align: center; margin-top: 1.25rem; font-size: .9rem; }
</style>
