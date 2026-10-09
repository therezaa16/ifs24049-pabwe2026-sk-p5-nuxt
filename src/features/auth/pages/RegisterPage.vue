<template>
  <form @submit.prevent="onSubmitHandler" class="space-y-4">
    <div>
      <label for="register-name-input" class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        Nama Lengkap
      </label>
      <div class="relative">
        <User
          :size="18"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          id="register-name-input"
          type="text"
          data-testid="register-name-input"
          v-model="name"
          placeholder="Nama Lengkap Anda"
          class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-all"
          required
        />
      </div>
    </div>

    <div>
      <label for="register-email-input" class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        Alamat Email
      </label>
      <div class="relative">
        <Mail
          :size="18"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          id="register-email-input"
          type="email"
          data-testid="register-email-input"
          v-model="email"
          placeholder="nama@email.com"
          class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-all"
          required
        />
      </div>
    </div>

    <div>
      <label for="register-password-input" class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        Kata Sandi
      </label>
      <div class="relative">
        <Lock
          :size="18"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          id="register-password-input"
          type="password"
          data-testid="register-password-input"
          v-model="password"
          placeholder="Minimal 6 karakter"
          class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-all"
          required
        />
      </div>
    </div>

    <div class="pt-2">
      <button
        type="submit"
        data-testid="register-submit-button"
        :disabled="loading"
        class="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-xl shadow-md shadow-teal-700/25 transition-all disabled:opacity-60"
      >
        <template v-if="loading">
          <Loader2 :size="18" class="animate-spin" />
          <span>Mendaftarkan Akun...</span>
        </template>
        <template v-else>
          <UserPlus :size="18" :stroke-width="2.5" />
          <span>Daftar Akun</span>
        </template>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { User, Mail, Lock, Loader2, UserPlus } from "lucide-vue-next";
import { useAuthStore } from "../states/authStore";

const router = useRouter();
const authStore = useAuthStore();

const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);

watch(
  () => authStore.isAuthRegister,
  (isAuthRegister) => {
    if (isAuthRegister === true) {
      loading.value = false;
      authStore.setIsAuthRegister(false);
      name.value = "";
      email.value = "";
      password.value = "";
      router.push("/auth/login");
    } else {
      loading.value = false;
    }
  }
);

async function onSubmitHandler() {
  loading.value = true;
  try {
    await authStore.asyncSetIsAuthRegister(name.value, email.value, password.value);
  } finally {
    loading.value = false;
  }
}
</script>
