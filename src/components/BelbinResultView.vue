<template>
  <div class="result-wrapper">
    <!-- ROW 1: KAMU ADALAH ... -->
    <section class="result-row hero-title">
      <p class="hero-kamu">Kamu adalah</p>
      <h2 class="hero-role">
        {{ primaryLabel }}
      </h2>
      <p class="hero-alias" v-if="meta.tagline">
        (<strong>{{ meta.tagline }}</strong>)
      </p>
    </section>

    <!-- ROW 2: ANIMASI LOTTIE -->
    <section class="result-row hero-anim">
      <LottieAnimation
        v-if="primaryAnimation"
        :src="primaryAnimation"
        :loop="true"
        :autoplay="true"
      />
      <div v-else class="anim-placeholder">
        Animasi peran akan tampil di sini
      </div>
    </section>

    <!-- ROW 3: PENJELASAN / KONTRIBUSI -->
    <section class="result-row role-desc">
      <h3>Peran dalam Tim</h3>
      <p class="role-main-desc">
        {{ meta.desc }}
      </p>
    </section>

    <!-- ROW 4: SPIDER CHART -->
    <section class="result-row chart-section">
      <h3>Profil kamu</h3>
      <p class="chart-caption">
        Grafik ini menggambarkan seberapa kuat kecenderunganmu pada tiap peran. Semakin menonjol, semakin kuat peran tersebut.
      </p>

      <div v-if="hasRoles" class="chart-wrapper">
        <canvas ref="radarCanvas"></canvas>
      </div>
      <p v-else class="chart-empty">
        Belum ada data skor peran untuk ditampilkan.
      </p>
    </section>

    <!-- ROW 5: PERAN DALAM TIM (STRENGTHS) -->
    <section class="result-row strengths-section" v-if="meta.strengths?.length">
      <h3>Kontribusi Kamu dalam Tim</h3>
      <ul class="strengths-list">
        <li v-for="(item, idx) in meta.strengths" :key="idx">
          {{ item }}
        </li>
      </ul>
    </section>

    <!-- ROW 6: KEKURANGAN / POTENSI RISIKO -->
    <section class="result-row weaknesses-section" v-if="meta.weaknesses?.length">
      <h3>Hal yang Perlu Diwaspadai</h3>
      <ul class="weaknesses-list">
        <li v-for="(item, idx) in meta.weaknesses" :key="idx">
          {{ item }}
        </li>
      </ul>
      <!-- <p class="weak-note">
        Catatan: "Kelemahan" ini bukan untuk menghakimi, tapi sebagai bahan refleksi
        supaya kamu bisa mengelola peranmu lebih seimbang dalam tim.
      </p> -->
    </section>

        <!-- ROW 7: LOGOUT BUTTON -->
    <section class="result-row logout-section">
      <button type="button" class="logout-btn" @click="emit('logout')">
        Logout
      </button>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import LottieAnimation from "./LottieAnimation.vue";
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

// Registrasi komponen Chart.js
Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

/**
 * META PERAN – pastikan KEY-nya sama persis dengan nama role
 * yang keluar dari computeBelbinScores/belbinRoles/roleMap.
 * (di roleMap kamu ada "Implementor" dan "Team worker", jadi aku samakan di sini)
 */

const ROLE_ORDER  = [
  "Plant",
  "Monitor Evaluator",
  "Specialist",
  "Implementor",
  "Completer Finisher",
  "Shaper",
  "Co-ordinator", 
  "Team Worker",        
  "Resource Investigator",
];

const roleScoreMap = computed(() => {
  const map = {};
  (props.allRoles || []).forEach((r) => {
    map[r.name] = r.score;
  });
  return map;
});

const ROLE_META = {
  Implementor: {
    label: "Implementer (IMP)",
    tagline: "Pelaksana",
    desc: "Mengubah konsep dan rencana menjadi prosedur kerja praktis dan melaksanakan rencana yang disepakati secara sistematis dan efisien.",
    animation:
      "https://lottie.host/28de4fe7-e237-4bbb-8c85-6b645af63e0f/kHrPEQGeap.json",
    strengths: [
      "Disiplin, dapat diandalkan, konservatif, efisien, kemampuan mengorganisir, akal sehat praktis, pekerja keras.",
      "Mengubah ide menjadi tindakan praktis.",
    ],
    weaknesses: [
      "Agak kaku.",
      "Lambat merespons kemungkinan baru.",
    ],
  },
  "Co-ordinator": {
    label: "Co-ordinator (CO)",
    tagline: "Koordinator",
    desc: "Mengontrol bagaimana tim bergerak menuju tujuan dengan memanfaatkan sumber daya tim sebaik mungkin, mengenali kekuatan dan kelemahan anggota tim, dan memastikan potensi tiap anggota digunakan secara optimal.",
    animation:
      "https://lottie.host/b8cde86d-0162-4c1d-91e8-33d93a7c871a/XuHn7tLIio.json",
    strengths: [
      "Dewasa, tenang, percaya diri, pemimpin rapat yang baik.",
      "Menjelaskan tujuan, mendorong pengambilan keputusan, mendelegasikan dengan baik, mampu memperlakukan semua kontributor secara adil.",
    ],
    weaknesses: [
      "Sering terlihat manipulatif.",
      "Melepaskan pekerjaan personal.",
      "Biasa saja dalam kreativitas atau intelektualitas.",
    ],
  },
  Shaper: {
    label: "Shaper (SH)",
    tagline: "Penggerak",
    desc: "Mendorong tim untuk bergerak maju, menantang kemacetan, dan menjaga tim tetap fokus pada target.",
    animation:
      "https://lottie.host/033a8da5-2f75-487c-b8ce-ce2568069372/FbWzknDwgs.json",
    strengths: [
      "Menantang, dinamis, tumbuh dalam tekanan, ekstrovert.",
      "Memiliki daya dorong dan keberanian untuk mengatasi hambatan.",
    ],
    weaknesses: [
      "Rentan memprovokasi, mudah marah.",
      "Menyakiti perasaan orang.",
    ],
  },
  Plant: {
    label: "Plant (PL)",
    tagline: "Pemikir/Inovator",
    desc: "Mengajukan ide dan strategi baru dengan perhatian khusus pada isu-isu utama dan mencari terobosan dalam pendekatan terhadap masalah yang dihadapi tim.",
    animation:
      "https://lottie.host/9341bfd4-8243-464c-b917-7cc275a341a9/W14DnThaqT.json",
    strengths: [
      "Imajintif, tidak konvensional, kreatif.",
      "Memecahkan masalah sulit dengan sudut pandang baru.",
    ],
    weaknesses: [
      "Mengabaikan hal-hal kecil.",
      "Terlalu tenggelam dalam pikiran hingga kurang efektif berkomunikasi.",
    ],
  },
  "Resource Investigator": {
    label: "Resource Investigator (RI)",
    tagline: "Penjelajah Sumber Daya",
    desc: "Mengeksplorasi dan melaporkan ide, perkembangan, dan sumber daya di luar kelompok. Menciptakan kontak eksternal yang berguna bagi tim.",
    animation:
      "https://lottie.host/7a38af72-125a-45bf-8d64-9fff33ae1a46/8xicPjFxDT.json",
    strengths: [
      "Ekstrovert, antusias, komunikatif.",
      "Mengeksplorasi peluang dan membangun jaringan.",
    ],
    weaknesses: [
      "Terlalu optimis.",
      "Kehilangan minat setelah antusiasme awal berkurang.",
    ],
  },
  "Monitor Evaluator": {
    label: "Monitor Evaluator (ME)",
    tagline: "Penilai Monitor",
    desc: "Menganalisis masalah dan mengevaluasi ide serta saran sehingga tim lebih siap membuat keputusan yang seimbang.",
    animation:
      "https://lottie.host/cbe5f28d-f1a1-4dc2-94fa-2a9dafeb5e26/ggvwcGLXIe.json",
    strengths: [
      "Tenang, strategis, bijaksana.",
      "Melihat semua opsi dan menilai dengan hati-hati.",
    ],
    weaknesses: [
      "Kurang dorongan dan kemampuan untuk menginspirasi orang lain.",
    ],
  },
  "Team Worker": {
    label: "Team Worker (TW)",
    tagline: "Pekerja Tim",
    desc: "Mendukung anggota dengan kekuatan mereka, mengisi kekurangan, meningkatkan komunikasi antar anggota, dan memupuk semangat tim.",
    animation:
      "https://lottie.host/aaa296d4-a366-4b66-ad09-a65876a5c693/o2R9oQMkNI.json",
    strengths: [
      "Kooperatif, lembut, peka, diplomatis.",
      "Mendengarkan, membangun, mencegah gesekan, memupuk semangat tim.",
    ],
    weaknesses: [
      "Kurang tegas pada situasi krusial.",
    ],
  },
  "Completer Finisher": {
    label: "Completer Finisher (CF)",
    tagline: "Penyelesai/Penyempurna",
    desc: "Melindungi tim dari kesalahan, mencari aspek pekerjaan yang memerlukan perhatian lebih, dan menjaga standar kualitas tinggi.",
    animation:
      "https://lottie.host/8bccc6ad-0058-4249-9d71-a241ca032aa8/EURO8xIQtK.json",
    strengths: [
      "Teliti, cermat, perfeksionis, kemampuan follow-through.",
      "Baik dalam mencari kesalahan dan memastikan selesai tepat waktu.",
    ],
    weaknesses: [
      "Cenderung khawatir berlebihan.",
      "Enggan mendelegasikan.",
    ],
  },
  Specialist: {
    label: "Specialist (SP)",
    tagline: "Sang Ahli",
    desc: "Membawa pengetahuan dan keahlian mendalam pada bidang tertentu dan menjadi rujukan bagi tim.",
    animation:
      "https://lottie.host/87cdd9d5-6125-47a2-911f-6367f6d38f80/NqxCt64Vzn.json",
    strengths: [
      "Keahlian teknis mendalam.",
      "Fokus pada area spesifik yang penting bagi tim.",
    ],
    weaknesses: [
      "Cenderung fokus sempit.",
      "Kurang tertarik pada isu di luar spesialisasinya.",
    ],
  },
};

// ====== PROPS ======
const props = defineProps({
  // [{ name: 'Plant', score: 23 }, ...]
  allRoles: {
    type: Array,
    default: () => [],
  },
  // { name, score, meta? } dari App.vue (primaryRole)
  primaryRole: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits(["logout"]);
// ====== STATE & COMPUTED ======
const radarCanvas = ref(null);
let radarChartInstance = null;

// kalau belum ada primaryRole dari parent, fallback ke role skor tertinggi di allRoles
const effectivePrimary = computed(() => {
  if (props.primaryRole && props.primaryRole.name) {
    return props.primaryRole;
  }
  if (props.allRoles && props.allRoles.length) {
    // ambil role dengan skor terbesar
    const sorted = [...props.allRoles].sort((a, b) => b.score - a.score);
    return { name: sorted[0].name, score: sorted[0].score };
  }
  // fallback paling akhir
  return { name: "Plant", score: 0 };
});

const primaryName = computed(() => effectivePrimary.value.name);

const meta = computed(() => {
  return (
    ROLE_META[primaryName.value] || {
      label: primaryName.value,
      tagline: "",
      desc: "Deskripsi peran belum tersedia.",
      animation: "",
      strengths: [],
      weaknesses: [],
    }
  );
});

const primaryLabel = computed(() => meta.value.label || primaryName.value);
const primaryAnimation = computed(() => meta.value.animation || "");

const hasRoles = computed(() =>
  (props.allRoles || []).some((r) => Number(r.score) > 0)
);

const radarLabels = computed(() => ROLE_ORDER);

const radarData = computed(() =>
  ROLE_ORDER.map((name) => Number(roleScoreMap.value[name] || 0))
);

// ====== CHART INIT & UPDATE ======
function createRadarChart() {
  if (!radarCanvas.value || !hasRoles.value) {
    // tidak ada data → jangan buat chart
    if (radarChartInstance) {
      radarChartInstance.destroy();
      radarChartInstance = null;
    }
    return;
  }

  const ctx = radarCanvas.value.getContext("2d");
  if (!ctx) return;

  if (radarChartInstance) {
    radarChartInstance.destroy();
  }

  const scores = radarData.value;
  const maxScore = scores.length ? Math.max(...scores) : 10;

  radarChartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels: radarLabels.value,
      datasets: [
        {
          label: "Skor Peran",
          data: scores,
          fill: true,
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          borderColor: "rgba(37, 99, 235, 1)",
          pointBackgroundColor: "rgba(37, 99, 235, 1)",
          pointBorderColor: "#fff",
          pointHoverRadius: 4,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: maxScore + 2, // dinamis sesuai skor tertinggi
          ticks: {
            display: false,
          },
          grid: {
            color: "rgba(148, 163, 184, 0.4)",
          },
          angleLines: {
            color: "rgba(148, 163, 184, 0.4)",
          },
          pointLabels: {
            font: {
              size: 10,
            },
            color: "#4b5563",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

onMounted(() => {
  createRadarChart();
});

onBeforeUnmount(() => {
  if (radarChartInstance) {
    radarChartInstance.destroy();
    radarChartInstance = null;
  }
});

// kalau skor berubah → rebuild chart
watch(
  () => props.allRoles,
  () => {
    createRadarChart();
  },
  { deep: true }
);
</script>

<style scoped>
.result-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.75rem;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ROW 1 */
.hero-title {
  text-align: center;
}

.hero-kamu {
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.hero-role {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.25rem;
}

.hero-alias {
  font-size: 0.95rem;
  color: #4b5563;
}

/* ROW 2 */
.hero-anim {
  display: flex;
  justify-content: center;
}

.anim-placeholder {
  width: 260px;
  height: 200px;
  border-radius: 1rem;
  border: 1px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.9rem;
}

/* ROW 3 */
.role-desc h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.role-main-desc {
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.6;
}

/* ROW 4 - CHART */
.chart-section h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.chart-caption {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.chart-wrapper {
  max-width: 480px;
  height: 320px;
  margin: 0 auto;
}

.chart-empty {
  font-size: 0.85rem;
  color: #6b7280;
}

/* ROW 5 & 6 - LISTS */
.strengths-section h3,
.weaknesses-section h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.strengths-list,
.weaknesses-list {
  margin-left: 1.1rem;
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.5;
}

.strengths-list li + li,
.weaknesses-list li + li {
  margin-top: 0.15rem;
}

.weak-note {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 640px) {
  .result-wrapper {
    padding: 1.25rem;
  }
  .hero-role {
    font-size: 1.6rem;
  }
}

.logout-section {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.logout-btn {
  padding: 0.6rem 1.4rem;
  border-radius: 999px;
  border: none;
  background: #ef4444; /* merah */
  color: #ffffff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(185, 28, 28, 0.35);
  transition: transform 0.1s ease, box-shadow 0.1s ease, filter 0.1s ease;
}

.logout-btn:hover {
  filter: brightness(1.05);
}

.logout-btn:active {
  transform: translateY(1px);
  box-shadow: 0 5px 14px rgba(185, 28, 28, 0.3);
}

</style>
