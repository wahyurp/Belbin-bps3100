<template>
  <div class="app-root">
    <!-- <div v-if="toastVisible" class="app-toast">
      {{ toastMessage }}
    </div> -->

  <Teleport to="body">
    <div v-if="toastVisible" class="app-toast">
      {{ toastMessage }}
    </div>
  </Teleport>
    <!-- audio background, disembunyikan -->
  <!-- <audio
    ref="bgAudio"
    src="/audio/bg-music.mp3"
    loop
    style="display: none"
  ></audio> -->

    <!-- HALAMAN AWAL -->
    <!-- 1) LOGIN DULU -->
  <LoginScreen
    v-if="!isAuthenticated"
    @login-success="handleLoginSuccess"
  />


    <!-- 2) PILIH MUSIK SETELAH LOGIN -->
    <WelcomeScreen
      v-else-if="!hasStarted"
      @start-with-music="startWithMusic"
      @start-without-music="startWithoutMusic"
    />


    <!-- KUESIONER + HASIL -->
    <div v-else>


<header v-if="!showResult" class="app-header">
  <div class="hero-row">
    <div class="hero-caption" v-if="currentStage">
      <p class="stage-title">{{ currentStage.title }}</p>
      <p class="stage-caption">
        {{ currentStage.caption }}
      </p>
    </div>

    <div class="hero-lottie">
      <LottieAnimation
        v-if="currentStage"
        :src="currentStage.animationSrc"
        :loop="true"
        :autoplay="true"
      />
    </div>
  </div>

  <div class="hero-progress">
    <div class="progress">
      <div class="progress-label">
        Segmen {{ currentIndex + 1 }} dari {{ totalSteps }}
      </div>
      <div class="progress-bar">
        <div
          class="progress-bar-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>
  </div>
</header>





    <main class="app-main">
      <Transition name="fade" mode="out-in">
        <!-- Segmen I–VII -->
        <SegmentStep
          v-if="!showResult && currentIndex < segments.length"
          :key="currentSegment.id"
          :title="currentSegment.title"
          :description="currentSegment.description"
          :total-points="currentSegment.totalPoints"
          :items="currentSegment.items"
          v-model="answers[currentSegment.id]"
          :show-back="currentIndex > 0"
          :is-last="false"
          @back="goBack"
          @next="handleNextBelbin"
        />
        <SegmentTeamPreference
          v-else-if="!showResult && currentIndex === segments.length"
          v-model="teamPreference"
          :show-back="!isSubmittingResult"
          :is-last="true"
          :loading="isSubmittingResult"
          @back="goBack"
          @next="handleNextTeamPref"
        />
        <BelbinResultView
          v-else
          key="result"
          :primary-role="primaryRole"
          :all-roles="sortedRoles"
          @logout="logout"
        />


        </Transition>
      </main>
    </div>
    <button
      v-if="hasStarted && musicEnabled"
      class="music-toggle"
      type="button"
      @click="toggleMusic"
    >
      <span v-if="isPlaying"><span class="material-symbols-outlined">
        pause
        </span>
</span>
      <span v-else><span class="material-symbols-outlined">
play_arrow
</span></span>
    </button>
  </div>
</template>

<script setup>
import {
  computed,
  reactive,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
} from "vue";

import SegmentStep from "./components/SegmentStep.vue";
import LottieAnimation from "./components/LottieAnimation.vue";
import WelcomeScreen from "./components/WelcomeScreen.vue";
import LoginScreen from "./components/LoginScreen.vue";
import SegmentTeamPreference from "./components/SegmentTeamPreference.vue";
import BelbinResultView from "./components/BelbinResultView.vue";


import { toastVisible, toastMessage } from "./toastBus";
import { segments as segmentData } from "./belbinData";
import { computeBelbinScores } from "./belbinScoring";
import confetti from "canvas-confetti";

// ================== KONSTAN KUNCI LOCALSTORAGE ==================
const AUTH_KEY = "belbin_auth_user";
const ANSWERS_KEY = "belbin_answers_v1";
const CURRENT_INDEX_KEY = "belbin_current_index_v1";
const RESULT_SHOWN_KEY = "belbin_result_shown_v1";   // NEW
const TEAM_PREF_KEY = "belbin_team_pref_v1";         // optional tapi enak

const SERVER_RESULT_KEY = "belbin_server_result_v1";
// ================== DATA DASAR ==================
const segments = segmentData;
const dummy = {
  I: { a: 0, b: 0, c: 5, d:3, e: 0, f: 0, g: 3, h: 0, i:0 },
  II: { a: 4, b: 0, c: 0, d:3, e: 0, f: 0, g: 4, h: 0, i:0  },
  III: { a: 0, b: 3, c: 4, d:3, e: 0, f: 0, g: 0, h: 0, i:1  },
  IV: { a: 4, b: 0, c: 0, d:0, e: 3, f: 0, g: 0, h: 4, i:0  },
  V: { a: 6, b: 5, c: 0, d:0, e: 0, f: 0, g: 0, h: 0, i:0  },
  VI: { a: 3, b: 0, c: 4, d:2, e: 2, f: 0, g: 0, h: 0, i:0  },
  VII: { a: 4, b: 0, c: 0, d:0, e: 5, f: 2, g: 0, h: 0, i:0  },
};
// function showToast(msg) {
//   toastMessage.value = msg;
//   toastVisible.value = true;

//   setTimeout(() => {
//     toastVisible.value = false;
//   }, 2200);
// }
console.log(computeBelbinScores(dummy));
const metamorphStages = [
  {
    id: 1,
    title: "Fase 1: Menanam Benih",
    caption:
      "Ayo gali potensi yang masih tersembunyi, layaknya saat kamu mulai menanam benih pertama kali.",
    animationSrc:
      "https://lottie.host/7a0876a2-3f65-4b62-b6c6-4c97907eac5f/DyYsA3kOt4.json",
  },
  {
    id: 2,
    title: "Fase 2: Mengenal Benih",
    caption:
      "Mari kenali pola dirimu dalam tim, seperti kamu mulai memahami benih yang baru saja kamu tanam.",
    animationSrc:
      "https://lottie.host/7a0876a2-3f65-4b62-b6c6-4c97907eac5f/DyYsA3kOt4.json",
  },
  {
    id: 3,
    title: "Fase 3: Menyiram Benih",
    caption:
      "Tambahkan wawasanmu tentang kontribusi dalam tim, layaknya kamu menyiram benih ini dengan air.",
    animationSrc:
      "https://lottie.host/ee908485-728f-4cae-9328-f2644b9a2e0c/d4lsXEDIgQ.json",
  },
  {
    id: 4,
    title: "Fase 4: Nutrisi Mulai Bekerja",
    caption:
      "Nutrisi dari air yang kamu berikan mulai bekerja, seperti saat kamu mulai melihat kekuatan dan kelemahanmu sendiri.",
    animationSrc:
      "https://lottie.host/ee908485-728f-4cae-9328-f2644b9a2e0c/d4lsXEDIgQ.json",
  },
  {
    id: 5,
    title: "Fase 5: Proses yang Tak Terlihat",
    caption:
      "Meskipun belum tampak perubahan besar, percayalah benih ini sedang berkembang—persis seperti prosesmu memahami diri sendiri.",
    animationSrc:
      "https://lottie.host/ee908485-728f-4cae-9328-f2644b9a2e0c/d4lsXEDIgQ.json",
  },
  {
    id: 6,
    title: "Fase 6: Tunas Pertama",
    caption:
      "Lihat! Benih yang kamu rawat akhirnya mulai tumbuh, seperti pemahamanmu tentang peranmu dalam tim.",
    animationSrc:
      "https://lottie.host/db8ded27-3eac-43c2-b7b3-f03a9eaa0f27/m8g3r20gQ2.json",
  },
  {
    id: 7,
    title: "Fase 7: Tumbuh Lebih Kuat",
    caption:
      "Pertumbuhannya makin jelas, layaknya kamu yang semakin berkembang dalam mengenali diri sendiri.",
    animationSrc:
      "https://lottie.host/db8ded27-3eac-43c2-b7b3-f03a9eaa0f27/m8g3r20gQ2.json",
  },
  {
    id: 8,
    title: "Fase 8: Mekar dan siap Berkontribusi",
    caption:
      "Sekarang, pilih lingkungan tim di mana kamu merasa bisa berkontribusi paling optimal.",
    animationSrc:
      "https://lottie.host/a02ab37c-d8ca-4c64-836d-28c5b463f59c/KwXW9UqcN4.json",
  },
];

// ================== STATE UTAMA (LOGIN, FLOW, AUDIO) ==================
const isAuthenticated = ref(false);
const currentUser = ref(null);
const serverScores = ref(null);        // { Plant: 20, ... } kalau dari sheet
const serverPrimaryRole = ref(null);   // "Plant", dll

const hasStarted = ref(false);    // sudah lewat welcome?
const musicEnabled = ref(false);  // user pilih pakai musik?
const isPlaying = ref(false);     // status audio sekarang
const teamPreference = ref({
  teams: [],
  comfortTeams: [],
  suggestion: "",
});
const isSubmittingResult = ref(false);
// audio object (bukan <audio> di template)
const bgAudio = ref(null);

// ================== STATE KUESIONER ==================
const currentIndex = ref(0);   // sudah ada di kode kamu

const totalSteps = computed(() => segments.length + 1); // 7 Belbin + 1 preferensi tim


const showResult = ref(false);

// answers = { [segId]: { a: 3, b: 2, ... } }
const answers = reactive({});
segments.forEach((seg) => {
  answers[seg.id] = {};
});

// ================== STATE GAMIFIKASI ==================
const xp = ref(0);
const xpPerSegment = 20;
const completedSegments = ref([]);
const lastRewardMessage = ref("");

// ================== COMPUTED ==================
const level = computed(() => 1 + Math.floor(xp.value / 60));
const segmentsCompletedCount = computed(
  () => completedSegments.value.length
);
const currentStage = computed(() => {
  if (showResult.value) return null;
  return metamorphStages[currentIndex.value] || null;
});


const roleTitles = {
  Plant: {
    label: "The Innovator",
    desc: "Kamu suka melahirkan ide baru dan melihat pola yang orang lain lewatkan.",
  },
  "Resource Investigator": {
    label: "The Explorer",
    desc: "Kamu jago networking dan menemukan peluang dari luar tim.",
  },
  "Co-ordinator": {
    label: "The Captain",
    desc: "Kamu pandai mengatur arah dan memastikan semua berjalan rapi.",
  },
  Shaper: {
    label: "The Challenger",
    desc: "Kamu mendorong tim untuk bergerak cepat dan mencapai target.",
  },
  "Monitor Evaluator": {
    label: "The Strategist",
    desc: "Kamu kuat di analisis, menimbang pilihan sebelum tim mengambil keputusan.",
  },
  "Team Worker": {
    label: "The Supporter",
    desc: "Kamu menjaga harmoni dan membuat orang merasa didengar.",
  },
  Implementer: {
    label: "The Builder",
    desc: "Kamu membuat rencana jadi aksi nyata dan menjaga konsistensi.",
  },
  "Completer Finisher": {
    label: "The Finisher",
    desc: "Kamu teliti dan memastikan hasil akhir benar-benar rapi.",
  },
  Specialist: {
    label: "The Expert",
    desc: "Kamu punya keahlian mendalam dan siap jadi rujukan di bidangmu.",
  },
};

const currentSegment = computed(() => segments[currentIndex.value]);

const progressPercent = computed(
  () => ((currentIndex.value + 1) / totalSteps.value) * 100
);

const resultScores = computed(() => {
  if (!showResult.value) return {};

  // 1) Prioritas: kalau ada dari server (sudah pernah isi)
  if (serverScores.value) {
    return serverScores.value;
  }

  // 2) Kalau tidak ada, hitung dari jawaban lokal (sesi ini)
  return computeBelbinScores(answers);
});


const sortedRoles = computed(() => {
  const src = resultScores.value || {};
  const entries = Object.entries(src);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.map(([name, score]) => ({ name, score }));
});

const primaryRole = computed(() => {
  const roles = sortedRoles.value;
  if (!roles.length) return null;

  // default: pakai skor tertinggi
  let chosen = roles[0];

  // kalau serverPrimaryRole ada & match salah satu role, pakai itu
  if (serverPrimaryRole.value) {
    const fromServer = roles.find((r) => r.name === serverPrimaryRole.value);
    if (fromServer) {
      chosen = fromServer;
    }
  }

  return {
    name: chosen.name,
    score: chosen.score,
    meta: roleTitles[chosen.name] || null,
  };
});

// ================== LIFECYCLE: RESTORE STATE & AUDIO ==================
onMounted(() => {
  // --- restore login ---
  const savedUser = localStorage.getItem(AUTH_KEY);
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      isAuthenticated.value = true;
      currentUser.value = user;
    } catch (e) {
      localStorage.removeItem(AUTH_KEY);
    }
  }



  const savedResult = localStorage.getItem(SERVER_RESULT_KEY);
  if (savedResult) {
    try {
      const parsed = JSON.parse(savedResult);
      serverScores.value = parsed.scores || null;
      serverPrimaryRole.value = parsed.primaryRole || null;
    } catch (e) {
      console.error("Gagal parse server result:", e);
      localStorage.removeItem(SERVER_RESULT_KEY);
    }
  }
  // --- init audio ---
  const audio = new Audio("/audio/bg-music.mp3");
  audio.loop = true;
  audio.volume = 0.6;
  bgAudio.value = audio;

  // --- restore jawaban Belbin ---
  const savedAnswers = localStorage.getItem(ANSWERS_KEY);
  if (savedAnswers) {
    try {
      const parsed = JSON.parse(savedAnswers);
      segments.forEach((seg) => {
        if (parsed[seg.id]) {
          answers[seg.id] = parsed[seg.id];
        }
      });
    } catch (e) {
      console.error("Gagal parse answers:", e);
      localStorage.removeItem(ANSWERS_KEY);
    }
  }

  // --- restore index segmen (kalau belum result lock) ---
  const savedIndex = localStorage.getItem(CURRENT_INDEX_KEY);
  if (savedIndex !== null) {
    const idx = Number(savedIndex);
    if (!Number.isNaN(idx) && idx >= 0 && idx < segments.length) {
      currentIndex.value = idx;
    }
  }

  // --- restore preferensi tim (optional) ---
  const savedTeamPref = localStorage.getItem(TEAM_PREF_KEY);
  if (savedTeamPref) {
    try {
      teamPreference.value = JSON.parse(savedTeamPref);
    } catch (e) {
      console.error("Gagal parse teamPreference:", e);
    }
  }

  // --- CEK: apakah hasil sudah pernah ditampilkan? ---
  const resultFlag = localStorage.getItem(RESULT_SHOWN_KEY);
  if (resultFlag === "1" && isAuthenticated.value) {
    // Artinya user ini sudah klik "Konfirmasi & Lanjut"
    hasStarted.value = true;           // lewati welcome
    showResult.value = true;           // langsung ke hasil
    currentIndex.value = segments.length; // jaga-jaga
  }
});


onBeforeUnmount(() => {
  if (bgAudio.value) {
    bgAudio.value.pause();
    bgAudio.value = null;
  }
});

// ================== WATCHERS: AUTO-SAVE ==================
watch(
  answers,
  (val) => {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(val));
  },
  { deep: true }
);

watch(
  teamPreference,
  (val) => {
    localStorage.setItem(TEAM_PREF_KEY, JSON.stringify(val));
  },
  { deep: true }
);

watch(showResult, (val) => {
  if (val) {
    scrollToTop();
  }
});



watch(currentIndex, (val) => {
  localStorage.setItem(CURRENT_INDEX_KEY, String(val));
  scrollToTop();
});

// ================== AUDIO CONTROL ==================
function playMusic() {
  if (!bgAudio.value) {
    console.log("bgAudio belum siap");
    return;
  }
  bgAudio.value
    .play()
    .then(() => {
      console.log("Audio mulai jalan");
      isPlaying.value = true;
    })
    .catch((err) => {
      console.log("Gagal play audio:", err);
      isPlaying.value = false;
    });
}

function pauseMusic() {
  if (!bgAudio.value) return;
  bgAudio.value.pause();
  isPlaying.value = false;
}

function toggleMusic() {
  if (isPlaying.value) {
    pauseMusic();
  } else {
    playMusic();
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth", // kalau mau tanpa animasi: hapus baris ini
  });
}


function stopMusic() {
  if (bgAudio.value) {
    bgAudio.value.pause();
    bgAudio.value.currentTime = 0;
    isPlaying.value = false;
  }
}

// ================== LOGIN & FLOW ==================
function handleLoginSuccess(payload) {
  const userData = {
    email: payload.email,
    name: payload.name,
    username: payload.username,
    nip: payload.nip,
    nipLama: payload.nipLama,
  };

  isAuthenticated.value = true;
  currentUser.value = userData;
  localStorage.setItem(AUTH_KEY, JSON.stringify(userData));

  // === kalau user SUDAH pernah mengisi, dan server sudah punya hasil ===
  if (payload.result) {
    serverScores.value = payload.result.scores || null;
    serverPrimaryRole.value = payload.result.primaryRole || null;

    // simpan juga ke localStorage supaya konsisten setelah refresh
    localStorage.setItem(
      SERVER_RESULT_KEY,
      JSON.stringify({
        primaryRole: payload.result.primaryRole,
        scores: payload.result.scores,
      })
    );

    hasStarted.value = true;
    showResult.value = true;
    currentIndex.value = segments.length;
    localStorage.setItem(RESULT_SHOWN_KEY, "1");
  }else {
    // belum pernah isi
    hasStarted.value = false;
    showResult.value = false;    
  }
}


function startWithMusic() {
  musicEnabled.value = true;
  hasStarted.value = true;
  playMusic();
}

function startWithoutMusic() {
  musicEnabled.value = false;
  hasStarted.value = true;
  pauseMusic();
}

function logout() {
  isAuthenticated.value = false;
  currentUser.value = null;
  localStorage.removeItem(AUTH_KEY);

  hasStarted.value = false;
  showResult.value = false;
  currentIndex.value = 0;

  segments.forEach((seg) => {
    answers[seg.id] = {};
  });
  xp.value = 0;
  completedSegments.value = [];
  lastRewardMessage.value = "";
  teamPreference.value = { teams: [], suggestion: "" };
  serverScores.value = null;
  serverPrimaryRole.value = null;

  stopMusic();

  // bersihkan semua jejak state
  localStorage.removeItem(ANSWERS_KEY);
  localStorage.removeItem(CURRENT_INDEX_KEY);
  localStorage.removeItem(TEAM_PREF_KEY);
  localStorage.removeItem(RESULT_SHOWN_KEY);
  localStorage.removeItem(SERVER_RESULT_KEY);

}


function resetAll() {
  segments.forEach((seg) => {
    answers[seg.id] = {};
  });
  currentIndex.value = 0;
  showResult.value = false;

  localStorage.removeItem(ANSWERS_KEY);
  localStorage.removeItem(CURRENT_INDEX_KEY);
}

// ================== NAVIGASI SEGMENT & GAMIFIKASI ==================
function goBack() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

function awardSegmentXp(segmentId) {
  if (!completedSegments.value.includes(segmentId)) {
    completedSegments.value.push(segmentId);
    xp.value += xpPerSegment;
    lastRewardMessage.value = `✨ +${xpPerSegment} XP – Segmen ${segmentId} selesai!`;
  }
}

function handleNextBelbin() {
  const finishedSegmentId = currentSegment.value.id;
  awardSegmentXp(finishedSegmentId);

  const isLastBelbinSegment = currentIndex.value === segments.length - 1;

  if (isLastBelbinSegment) {
    // dari segmen VII → pindah ke segmen VIII (preferensi tim)
    currentIndex.value += 1;
  } else {
    // pindah ke segmen berikutnya (II–VII)
    currentIndex.value += 1;
  }
}

// ================== HASIL BELBIN ==================
function roleBarWidth(score) {
  const max = 30; // asumsi kasar
  return Math.min(100, (score / max) * 100);
}


// GANTI dengan URL web app yang sama seperti di LoginScreen.vue
// const GSCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKJr003Ws5vzFTHjCXZaU5j0DNpcRCpmiYN-4nTlr7T8e9LatBhrxfTVpIN93DWPCC/exec";
// const API_URL = '/.netlify/functions/belbin-proxy';
const API_URL = import.meta.env.DEV
  ? "https://belbin3100.netlify.app/.netlify/functions/belbin-proxy"  // saat npm run dev
  : "/.netlify/functions/belbin-proxy";   

async function markUserFinished() {
  if (!currentUser.value || !currentUser.value.identifier) return;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "finish",
        identifier: currentUser.value.identifier,
        origin: window.location.origin,
      }),
    });
  } catch (e) {
    console.error("Gagal update isFinished:", e);
    // optional: tampilkan toast, tapi jangan blokir hasil
  }
}

// async function handleNextTeamPref() {
//   // 1) Hitung skor Belbin dari jawaban
//   const scores = computeBelbinScores(answers);
//   const entries = Object.entries(scores);
//   entries.sort((a, b) => b[1] - a[1]);

//   const primaryRoleName = entries.length ? entries[0][0] : null;

//   // 2) Kirim ke Google Sheet lewat Apps Script (via /gsheet-api)
//   try {
//     if (currentUser.value) {
//       const identifier =
//         currentUser.value.username || currentUser.value.email;

//       await fetch("/gsheet-api", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           action: "finish",
//           identifier,               // username / email
//           answers,                  // seluruh jawaban I–VII
//           teamPreference: teamPreference.value, // { teams, suggestion }
//           scores,                   // skor tiap peran
//           primaryRole: primaryRoleName,
//         }),
//       });
//     }
//   } catch (err) {
//     console.error("Gagal kirim hasil ke Google Sheet:", err);
//     // kalau mau: tampilkan toast, tapi jangan blokir hasil
//   }

//   // 3) LOCK hasil di sisi frontend
//   showResult.value = true;
//   currentIndex.value = segments.length; // di atas segmen tim
//   localStorage.setItem(RESULT_SHOWN_KEY, "1");

//   triggerConfetti();
// }
async function handleNextTeamPref() {
  if (isSubmittingResult.value) return; // cegah double click

  isSubmittingResult.value = true;

  // 1) Hitung skor Belbin dari jawaban
  const scores = computeBelbinScores(answers);
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primaryRoleName = entries[0]?.[0] || "";

  try {
    if (currentUser.value) {
      const identifier =
        currentUser.value.username || currentUser.value.email;

      // const GSCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKJr003Ws5vzFTHjCXZaU5j0DNpcRCpmiYN-4nTlr7T8e9LatBhrxfTVpIN93DWPCC/exec"
      const API_URL = import.meta.env.DEV
        ? "https://belbin3100.netlify.app/.netlify/functions/belbin-proxy"  // saat npm run dev
        : "/.netlify/functions/belbin-proxy";   
        

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "finish",
          identifier,                        // username / email
          answers,                           // seluruh jawaban I–VII
          teamPreference: teamPreference.value, // { teams, suggestion }
          scores,                            // skor tiap peran
          primaryRole: primaryRoleName,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.ok) {
        console.error("Finish error:", data);
        alert("Gagal menyimpan hasil ke server. Coba lagi sebentar lagi.");
        return;
      }
    }

    // kalau sukses simpan juga hasil ke state & localStorage
    serverScores.value = scores;
    serverPrimaryRole.value = primaryRoleName;

    localStorage.setItem(
      SERVER_RESULT_KEY,
      JSON.stringify({
        primaryRole: primaryRoleName,
        scores,
      })
    );

    // 3) Kalau sukses: LOCK hasil di sisi frontend
    showResult.value = true;
    currentIndex.value = segments.length;
    localStorage.setItem(RESULT_SHOWN_KEY, "1");

    triggerConfetti();


    triggerConfetti();
  } catch (err) {
    console.error("Gagal kirim hasil ke Google Sheet:", err);
    alert("Terjadi kesalahan jaringan/server. Silakan coba lagi.");
  } finally {
    isSubmittingResult.value = false;
  }
}




function triggerConfetti() {
  confetti({
    particleCount: 140,
    spread: 70,
    startVelocity: 40,
    origin: { y: 0.6 },
  });
}

</script>



<style scoped>
.app-root {
  min-height: 100vh;
  background: #1abc9c;
  color: #111827;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

.app-header {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 1rem;
}


/* ========== HEADER ========== */
/* ROW 1: Caption + Lottie berdekatan di tengah */
/* ROW 1: Caption + Lottie */
.hero-row {
  display: flex;
  justify-content: center;   /* cluster di tengah */
  align-items: stretch;      /* tingginya ikut item tertinggi (Lottie) */
  gap: 2rem;
}

/* Caption: vertikal di tengah terhadap tinggi Lottie */
.hero-caption {
  flex: 0 0 auto;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  padding-top: 0rem;   /* <-- geser isi sedikit ke bawah */
}


.stage-title {
  font-weight: 700;
  font-size: 2.5rem;   /* <-- lebih besar dari sebelumnya */
  margin-bottom: 0.4rem;
}

.stage-caption {
  font-size: 1rem;      /* sedikit lebih besar dari 0.9 */
  color: #fff;
  line-height: 1.6;
}


/* Lottie di kanan, ikut tengah juga */
.hero-lottie {
  flex: 0 0 auto;
  display: flex;
  align-items: center;   /* tengah vertikal */
  justify-content: center;
}


/* ROW 2: Progress di tengah */
.hero-progress {
  margin-top: 1.25rem;
  display: flex;
  justify-content: center;
}

/* Samakan lebar dengan form (misal 800px) */
.hero-progress .progress {
  width: 100%;
  max-width: 800px;   /* sesuaikan kalau form-mu beda, misal 840 */
  margin: 0 auto;
}


/* Progress bar */
.progress-label {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.progress-bar {
  height: 8px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #2563eb;
  transition: width 0.3s ease;
}

/* Responsif: di HP jadi vertikal */
@media (max-width: 767px) {
  .hero-row {
    flex-direction: column-reverse;
    align-items: center;
    text-align: center;
  }

  .hero-caption {
    max-width: 100%;
    text-align: center;
  }

  .hero-lottie {
    justify-content: center;
  }

  .hero-progress .progress {
    max-width: 100%;
  }
}

/* ========== MAIN CONTENT ========== */

.app-main {
  padding: 1rem 1.5rem 2rem;
}

/* kartu hasil */
.result-card {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.75rem;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}

.result-intro {
  color: #4b5563;
  margin-bottom: 1.25rem;
}

.result-hero {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-anim {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.result-row {
  display: grid;
  grid-template-columns: 1.6fr 0.5fr 3fr;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.result-role {
  font-weight: 600;
}

.result-score {
  text-align: right;
}

.result-bar {
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.result-bar-fill {
  height: 100%;
  background: #34d399;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  background: #e5e7eb;
  color: #111827;
}

/* animasi transisi antar segmen / hasil */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

/* result layout di desktop */
@media (min-width: 768px) {
  .result-hero {
    flex-direction: row;
    align-items: flex-start;
  }
  .result-anim {
    flex: 1;
    justify-content: flex-start;
  }
  .result-list {
    flex: 1.2;
  }
}

/* ========== HUD GAMIFIKASI (kalau masih dipakai di tempat lain) ========== */

.hud {
  margin-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hud-item {
  min-width: 130px;
  padding: 0.55rem 0.75rem;
  border-radius: 0.9rem;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.25);
}

.hud-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.15rem;
}

.hud-value {
  font-weight: 700;
  font-size: 1.05rem;
}

.hud-sub {
  font-size: 0.75rem;
  color: #6b7280;
}

.reward-msg {
  margin-top: 0.6rem;
  font-size: 0.9rem;
  color: #22c55e;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* badge di hasil */
.badge-card {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  background: rgba(52, 211, 153, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.4);
  margin-bottom: 1.25rem;
}

.badge-icon {
  font-size: 2rem;
}

.badge-title {
  font-weight: 700;
  margin-bottom: 0.15rem;
}

.badge-role {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.badge-desc {
  font-size: 0.85rem;
  color: #4b5563;
}

.music-toggle {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #2563eb;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.3);
  color: #ffffff;
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

:global(.app-toast) {
  position: fixed;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  max-width: 90%;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(185, 28, 28, 0.4);
  z-index: 9999;
}

:global(.app-toast) {
  top: calc(0.75rem + env(safe-area-inset-top));
}


</style>
