<template>
  <div class="login-root">
    <div class="login-card">
      <h1 class="login-title">Login dulu yuk! Biar kita kenal</h1>
      <p class="login-subtitle">
        Masuk menggunakan <strong>username atau email</strong> yang sudah terdaftar di daftar peserta,
        lalu masukkan <strong>NIP</strong> sebagai password.
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
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Masukkan NIP 9 digit kamu"
          />
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
          Username/email &amp; NIP harus sama persis dengan yang tercantum di Community BPS.
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["login-success"]);

const identifier = ref("");
const password = ref("");       // NIP
const loading = ref(false);
const errorMessage = ref("");

async function handleSubmit() {
  errorMessage.value = "";

  const idVal = identifier.value.trim();
  const passVal = password.value.trim();

  if (!idVal) {
    errorMessage.value = "Username / email wajib diisi.";
    return;
  }
  if (!passVal) {
    errorMessage.value = "NIP wajib diisi.";
    return;
  }

  loading.value = true;
  const GSCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKJr003Ws5vzFTHjCXZaU5j0DNpcRCpmiYN-4nTlr7T8e9LatBhrxfTVpIN93DWPCC/exec";
  try {
    const res = await fetch(GSCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "login",
        identifier: idVal, // username/email
        password: passVal, // NIP
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data.ok) {
      if (data.reason === "NOT_FOUND") {
        errorMessage.value = "Username / email tidak terdaftar.";
      } else if (data.reason === "WRONG_PASSWORD") {
        errorMessage.value = "NIP tidak sesuai dengan data di sheet.";
      } else if (data.reason === "ALREADY_FINISHED") {
        errorMessage.value =
          "Kamu sudah pernah mengisi dan menyelesaikan kuis ini. Terima kasih 🙌";
      } else if (data.reason === "EMPTY_IDENTIFIER") {
        errorMessage.value = "Username / email kosong.";
      } else if (data.reason === "EMPTY_PASSWORD") {
        errorMessage.value = "NIP kosong.";
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
      isFinished: data.user.isFinished, // <== penting
      result: data.result || null,      // <== hasil dari sheet "hasil" kalau ada
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
/* CSS kamu tadi sudah oke, aku biarkan sama persis */
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
</style>
