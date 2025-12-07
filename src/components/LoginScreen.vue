<template>
  <div class="login-root">
    <div class="login-card">
      <h1 class="login-title">Login dulu yuk! Biar kita kenal</h1>
      <p class="login-subtitle">
        Masuk menggunakan <strong>username atau email</strong> sesuai Community BPS,
        lalu masukkan <strong>tanggal lahir (DDMMYYYY)</strong> sebagai password.
      </p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="identifier">Username / Email</label>
          <input
            id="identifier"
            v-model="identifier"
            type="text"
            required
            placeholder="Isikan username atau email community BPS"
          />
        </div>

<div class="form-group">
  <label for="password">Password (Tanggal Lahir)</label>

  <div class="password-wrapper">
    <input
      id="password"
      v-model="password"
      :type="showPassword ? 'text' : 'password'"
      required
      inputmode="numeric"
      maxlength="8"
      placeholder="Masukkan 8 digit tanggal lahir kamu (DDMMYYYY)"
      @input="handlePasswordInput"
    />

    <button
      type="button"
      class="toggle-password-btn"
      @click="togglePassword"
      :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
    >
      <span
        v-if="!showPassword"
        class="material-symbols-outlined"
      >
        visibility
      </span>
        <span
        v-else
        class="material-symbols-outlined"
      >
        visibility_off
      </span>
    </button>

  </div>
</div>



        <p v-if="errorMessage" class="error-text">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="login-btn"
          :disabled="loading || !identifier.trim() || !password.trim()"
        >
          <span v-if="loading">Memeriksa...</span>
          <span v-else>Masuk</span>
        </button>

        <p class="hint-text">
          Contoh: Jika Anda lahir 3 Juni 1970 maka password Anda adalah <strong>03061970</strong>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["login-success"]);

const identifier = ref("");
const password = ref("");      // diisi ddmmyyyy
const loading = ref(false);
const errorMessage = ref("");
const showPassword = ref(false);

function togglePassword() {
  showPassword.value = !showPassword.value;
}

function handlePasswordInput(e) {
  let v = e.target.value || "";
  v = v.replace(/\D/g, "");   // hanya angka
  v = v.slice(0, 8);          // max 8 digit
  password.value = v;
}

function onPasswordInput(event) {
  // Hanya izinkan angka & batasi 8 digit
  const digitsOnly = (event.target.value || "").replace(/\D/g, "").slice(0, 8);
  password.value = digitsOnly;
  event.target.value = digitsOnly; // sinkronkan tampilan input
}

async function handleSubmit() {
  errorMessage.value = "";

  const idVal = identifier.value.trim();
  const passVal = password.value.trim();

  if (!idVal) {
    errorMessage.value = "Username / email wajib diisi.";
    return;
  }
  if (!passVal) {
    errorMessage.value = "Tanggal lahir wajib diisi.";
    return;
  }
  if (passVal.length !== 8) {
    errorMessage.value = "Tanggal lahir harus 8 digit (DDMMYYYY).";
    return;
  }

  loading.value = true;

  const API_URL = import.meta.env.DEV
    ? "https://belbin3100.netlify.app/.netlify/functions/belbin-proxy" // saat npm run dev
    : "/.netlify/functions/belbin-proxy";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "login",
        identifier: idVal, // username/email
        password: passVal, // tanggal lahir ddmmyyyy
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data.ok) {
      if (data.reason === "NOT_FOUND") {
        errorMessage.value = "Username / email tidak sesuai dengan community BPS.";
      } else if (data.reason === "WRONG_PASSWORD") {
        errorMessage.value =
          "Tanggal lahir tidak sesuai dengan data NIP 18 digit di community BPS.";
      } else if (data.reason === "EMPTY_IDENTIFIER") {
        errorMessage.value = "Username / email kosong.";
      } else if (data.reason === "EMPTY_PASSWORD") {
        errorMessage.value = "Tanggal lahir kosong.";
      } else {
        errorMessage.value = "Login gagal. (" + (data.reason || "Unknown") + ")";
      }
      return;
    }

    // sukses: kirim data user ke App.vue
    emit("login-success", {
      rowIndex: data.user.rowIndex,
      email: data.user.email,
      name: data.user.nama,
      username: data.user.username,
      nip: data.user.nip,
      nipLama: data.user.nipLama,
      isFinished: data.user.isFinished,
      result: data.result || null,
    });
  } catch (err) {
    console.error(err);
    errorMessage.value =
      "Gagal terhubung ke server. Coba lagi beberapa saat lagi.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-root {
  min-height: 100vh;
  background: #020617;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.login-card {
  max-width: 420px;
  width: 100%;
  background: #0b1220;
  border-radius: 1.25rem;
  padding: 1.75rem 1.75rem 2rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.7);
  color: #e5e7eb;
}

.login-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.login-subtitle {
  font-size: 0.95rem;
  color: #9ca3af;
  margin-bottom: 1.4rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-size: 0.85rem;
  color: #e5e7eb;
}

input {
  border-radius: 0.75rem;
  border: 1px solid #1f2937;
  padding: 0.6rem 0.8rem;
  background: #020617;
  color: #f9fafb;
  font-size: 0.9rem;
}

input::placeholder {
  color: #6b7280;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.5);
}

/* wrapper untuk input + tombol mata */
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  width: 100%;
  padding-right: 2.3rem; /* ruang untuk ikon mata */
}

.toggle-password {
  position: absolute;
  right: 0.55rem;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #9ca3af;
}

.toggle-password:hover {
  color: #e5e7eb;
}

.error-text {
  font-size: 0.8rem;
  color: #f97373;
}

.login-btn {
  margin-top: 0.4rem;
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1rem;
  background: #2563eb;
  color: #f9fafb;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.6);
  transition: transform 0.1s ease, box-shadow 0.1s ease, filter 0.1s ease;
}

.login-btn:hover:enabled {
  filter: brightness(1.05);
}

.login-btn:active:enabled {
  transform: translateY(2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint-text {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: #9ca3af;
}
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  width: 100%;
  padding-right: 2.5rem; /* ruang untuk icon */
}

.toggle-password-btn {
  position: absolute;
  right: 0.6rem;
  background: transparent;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
}

.toggle-password-btn:hover {
  color: #e5e7eb;
}

:global(.material-symbols-outlined) {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 20px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
</style>
