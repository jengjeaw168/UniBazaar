<template>
  <nav class="navbar">
    <div class="container nav-inner">
      <RouterLink to="/" class="nav-brand">Uni<span>Bazaar</span></RouterLink>

      <div class="nav-links">
        <RouterLink to="/">หน้าแรก</RouterLink>
        
        <template v-if="auth.isLoggedIn">
          <RouterLink to="/products/new">+ ลงขายสินค้า</RouterLink>

          <RouterLink to="/cart" class="cart-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span v-if="cart.totalItems > 0" class="cart-badge">{{ cart.totalItems }}</span>
          </RouterLink>
        </template>

        <template v-if="auth.isLoggedIn">
          <div class="profile-dropdown">
            <span class="nav-user">
              <img v-if="auth.user?.avatar" :src="`/uploads/${auth.user.avatar}`" class="nav-avatar" />
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <div class="dropdown-menu">
              <div class="dropdown-header">
                <strong>{{ auth.user?.username }}</strong>
                <span class="dropdown-email">{{ auth.user?.email }}</span>
              </div>
              
              <div class="dropdown-divider"></div>
              
              <RouterLink v-if="auth.isAdmin" to="/admin" class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                จัดการระบบ (Admin)
              </RouterLink>

              <RouterLink to="/orders" class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                รายการสั่งซื้อ / ขาย
              </RouterLink>

              <RouterLink to="/profile" class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                ตั้งค่าโปรไฟล์
              </RouterLink>
              <RouterLink to="/address" class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ตั้งค่าที่อยู่
              </RouterLink>
              
              <div class="dropdown-divider"></div>
              
              <a href="#" class="dropdown-item text-danger" @click.prevent="handleLogout">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                ออกจากระบบ
              </a>
            </div>
          </div>
        </template>

        <template v-else>
          <RouterLink to="/login">เข้าสู่ระบบ</RouterLink>
          <RouterLink to="/register" class="btn nav-btn btn-sm" style="font-weight: 500;">สมัครสมาชิก</RouterLink>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore, useCartStore } from '@/store'
import { useRouter }    from 'vue-router'

const auth   = useAuthStore()
const cart   = useCartStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap');

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 1px 15px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(243, 101, 35, 0.1);
  height: 70px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
}
.nav-inner { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.nav-brand { 
  font-family: 'Poppins', sans-serif;
  font-size: 1.6rem; 
  font-weight: 800; 
  color: #1f2937; 
  letter-spacing: -0.5px;
  text-decoration: none;
}
.nav-brand span {
  color: #f36523; /* Naresuan Orange */
}
.nav-links { display: flex; align-items: center; gap: 1.8rem; }
.nav-links > a:not(.btn) { 
  color: #4b5563; 
  font-weight: 600; 
  font-size: 0.95rem;
  transition: all 0.2s;
  position: relative;
}
.nav-links > a:not(.btn):hover { 
  color: #f36523; 
  text-decoration: none; 
}
.nav-links > a:not(.btn)::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -4px;
  left: 0;
  background-color: #f36523;
  transition: width 0.2s ease;
}
.nav-links > a:not(.btn):hover::after, .nav-links > a:not(.btn).router-link-active::after {
  width: 100%;
}
.nav-links > a:not(.btn).router-link-active { 
  color: #f36523; 
}
.nav-user { 
  display: flex; align-items: center; font-weight: 600; 
  color: #4b5563; cursor: pointer; padding: 0.5rem 0; 
  transition: color 0.2s;
}
.nav-user:hover { color: #f36523; }
.nav-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid #e5e7eb; }
.cart-link { 
  position: relative; display: inline-flex; align-items: center; 
  text-decoration: none; font-size: 1.3rem;
  color: #4b5563 !important;
  transition: transform 0.2s, color 0.2s;
}
.cart-link:hover { transform: scale(1.1); color: #f36523 !important; }
.cart-badge { 
  position: absolute; top: -6px; right: -8px; 
  background: #f36523; color: white; 
  border-radius: 99px; padding: 2px 6px; 
  font-size: 0.7rem; font-weight: bold; 
  box-shadow: 0 2px 4px rgba(243, 101, 35, 0.3);
  border: 2px solid white;
}

.profile-dropdown { position: relative; display: flex; align-items: center; height: 100%; }
.profile-dropdown::after { content: ''; position: absolute; top: 100%; right: 0; width: 100%; height: 10px; } /* safe hover area */
.dropdown-menu {
  visibility: hidden; opacity: 0; position: absolute; right: 0; top: calc(100% + 5px);
  background-color: white; min-width: 220px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 101; border-radius: 12px;
  border: 1px solid var(--gray-200); padding: 0.5rem;
  transform: translateY(10px); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.profile-dropdown:hover .dropdown-menu {
  visibility: visible; opacity: 1; transform: translateY(0);
}
.dropdown-header { padding: 0.5rem 0.75rem; display: flex; flex-direction: column; }
.dropdown-header strong { font-size: 0.95rem; color: var(--gray-800); line-height: 1.2; }
.dropdown-email { font-size: 0.8rem; color: var(--gray-600); margin-top: 4px; }
.dropdown-divider { height: 1px; background: var(--gray-200); margin: 0.5rem 0; }
.dropdown-item {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.75rem; 
  color: var(--gray-800); text-decoration: none; font-size: 0.95rem; border-radius: 8px;
  transition: background 0.15s, color 0.15s;
}
.dropdown-item svg { color: var(--gray-600); transition: color 0.15s; }
.dropdown-item:hover { background-color: var(--gray-100); color: var(--primary); }
.dropdown-item:hover svg { color: var(--primary); }
.text-danger { color: var(--danger) !important; }
.text-danger:hover { background-color: #fee2e2 !important; color: var(--danger) !important; }
.text-danger svg { color: var(--danger) !important; }
.nav-btn {
  background-color: #f36523 !important;
  color: #ffffff !important;
  border: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: all 0.2s;
}
.nav-btn:hover {
  background-color: #d9531e !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}
</style>
