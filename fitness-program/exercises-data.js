/**
 * Fitness Program - Egzersiz Veritabanı
 * Tüm egzersizler bölge, seviye ve detay bilgileri ile
 */

const EXERCISES_DATA = [
  // ==================== KARIN / GÖBEK / BEL ====================

  // Başlangıç Seviye
  {
    id: "abs_crunch_basic",
    name: "Klasik Mekik (Crunch)",
    region: ["Karın", "Göbek"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Omurga mobilizasyonu, hafif gövde dönme hareketleri",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bel boşluğunu kapatarak karın kaslarını aktif kullan. Boynu çekme."
  },
  {
    id: "abs_knee_tucks",
    name: "Diz Çekme (Lying Knee Tucks)",
    region: ["Karın", "Alt Karın"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Kalça fleksörü ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Kontrollü hareket, ani çekmeden kaçının."
  },
  {
    id: "abs_plank_knee",
    name: "Plank (Diz Destekli)",
    region: ["Karın", "Core"],
    level: "Başlangıç",
    type: "time",
    defaultSets: 3,
    defaultReps: null,
    defaultTimeSec: 30,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Omuz ve karın ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Vücudu düz tutun, kalçayı düşürmeyin."
  },
  {
    id: "abs_dead_bug",
    name: "Dead Bug",
    region: ["Karın", "Core"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Bel mobilizasyonu",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Beli yere bastırarak core'u aktif tut."
  },
  {
    id: "abs_side_plank_knee",
    name: "Side Plank (Diz Destekli)",
    region: ["Yan Karın", "Obliques"],
    level: "Başlangıç",
    type: "time",
    defaultSets: 3,
    defaultReps: null,
    defaultTimeSec: 20,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Yan karın ve omuz ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Her iki tarafı eşit çalıştır."
  },

  // Orta Seviye
  {
    id: "abs_plank_full",
    name: "Tam Plank",
    region: ["Karın", "Core", "Tüm Vücut"],
    level: "Orta",
    type: "time",
    defaultSets: 3,
    defaultReps: null,
    defaultTimeSec: 45,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Tam vücut ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Düz bir çizgi oluştur, nefes almayı unutma."
  },
  {
    id: "abs_bicycle_crunch",
    name: "Bicycle Crunch",
    region: ["Karın", "Yan Karın"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 20,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Gövde rotasyon ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dirsek-diz teması kontrollü olmalı."
  },
  {
    id: "abs_leg_raise",
    name: "Leg Raise (Bacak Kaldırma)",
    region: ["Alt Karın", "Kalça Fleksörleri"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Bel ve kalça ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Beli yerden kaldırma, kontrollü indir."
  },
  {
    id: "abs_russian_twist",
    name: "Russian Twist",
    region: ["Yan Karın", "Obliques"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 30,
    defaultTimeSec: null,
    defaultWeightKg: 2,
    restSec: 60,
    warmupSuggestion: "Gövde rotasyonu",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Hafif ağırlıkla başla, tam rotasyon yap."
  },
  {
    id: "abs_mountain_climber",
    name: "Mountain Climber",
    region: ["Karın", "Core", "Kardiyovasküler"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 20,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Dinamik tam vücut ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Hızlı ama kontrollü, core sabit."
  },

  // İleri Seviye
  {
    id: "abs_hanging_leg_raise",
    name: "Hanging Leg Raise",
    region: ["Alt Karın", "Grip"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Asılma ve karın ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Sallanmadan, core gücüyle kaldır."
  },
  {
    id: "abs_v_sit_up",
    name: "V-Sit Up",
    region: ["Karın", "Tüm Core"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Core ve esneklik ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Denge ve core gücü gerektirir."
  },
  {
    id: "abs_plank_leg_lift",
    name: "Plank with Leg Lift",
    region: ["Karın", "Core", "Kalça"],
    level: "İleri",
    type: "time",
    defaultSets: 3,
    defaultReps: null,
    defaultTimeSec: 40,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Core ve kalça stabilizasyonu",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bacağı kaldırırken dengeyi koru."
  },
  {
    id: "abs_ab_wheel",
    name: "Ab Wheel Rollout",
    region: ["Karın", "Core", "Omuz"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Core ve omuz ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dizlerden başla, ileri seviyede ayaktan yap."
  },
  {
    id: "abs_dragon_flag",
    name: "Dragon Flag",
    region: ["Tüm Karın", "Core"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 6,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 120,
    warmupSuggestion: "Tam core aktivasyonu",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Çok ileri seviye, önce negatif fazla çalış."
  },

  // ==================== GÖĞÜS ====================

  // Başlangıç Seviye
  {
    id: "chest_wall_pushup",
    name: "Duvara Şınav",
    region: ["Göğüs", "Omuz"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Omuz ve göğüs ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Duvara 45 derece açıyla yaklaş."
  },
  {
    id: "chest_knee_pushup",
    name: "Dizler Yerde Şınav",
    region: ["Göğüs", "Triceps", "Omuz"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Üst vücut ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Vücudu düz tut, sadece dizler yerde."
  },
  {
    id: "chest_floor_press",
    name: "Dumbbell Floor Press",
    region: ["Göğüs", "Triceps"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 3,
    restSec: 60,
    warmupSuggestion: "Göğüs ve omuz ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Hafif ağırlıkla başla, teknik önemli."
  },

  // Orta Seviye
  {
    id: "chest_pushup",
    name: "Klasik Şınav",
    region: ["Göğüs", "Triceps", "Omuz", "Core"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Tam üst vücut ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Göğüs yere yakın in, tam kalkış."
  },
  {
    id: "chest_incline_pushup",
    name: "Incline Push-Up",
    region: ["Alt Göğüs", "Triceps"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Göğüs ve kol ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Eller yüksekte, ayaklar yerde."
  },
  {
    id: "chest_db_bench_press",
    name: "Dumbbell Bench Press",
    region: ["Göğüs", "Triceps", "Omuz"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 8,
    restSec: 60,
    warmupSuggestion: "Göğüs ve omuz ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dumbbell'ları kontrollü indir ve kaldır."
  },
  {
    id: "chest_db_fly",
    name: "Dumbbell Fly",
    region: ["Göğüs"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 5,
    restSec: 60,
    warmupSuggestion: "Göğüs germe",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dirsekleri hafif büklü tut, göğsü gerdikten sonra birleştir."
  },

  // İleri Seviye
  {
    id: "chest_decline_pushup",
    name: "Decline Push-Up",
    region: ["Üst Göğüs", "Omuz"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Üst göğüs ve omuz ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Ayaklar yüksekte, eller yerde."
  },
  {
    id: "chest_explosive_pushup",
    name: "Explosive Push-Up",
    region: ["Göğüs", "Güç"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Pliometrik ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Patlayıcı kuvvetle yukarı it, opsiyonel alkış."
  },
  {
    id: "chest_weighted_pushup",
    name: "Weighted Push-Up",
    region: ["Göğüs", "Tüm Üst Vücut"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 10,
    restSec: 90,
    warmupSuggestion: "Üst vücut tam ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Sırt üzerine ağırlık koy (yelek veya disk)."
  },
  {
    id: "chest_archer_pushup",
    name: "Archer Push-Up",
    region: ["Göğüs", "Tek Kol Gücü"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 8,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Asimetrik kuvvet ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bir kola yük bindir, diğeri destek."
  },

  // ==================== SIRT ====================

  // Başlangıç Seviye
  {
    id: "back_superman",
    name: "Superman",
    region: ["Sırt", "Alt Sırt"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Omurga ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Yere yüzüstü yat, kol ve bacakları kaldır."
  },
  {
    id: "back_resistance_row",
    name: "Resistance Band Row",
    region: ["Sırt", "Biceps"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Sırt ve kol ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bantı sabit noktaya bağla, kürek çeker gibi."
  },
  {
    id: "back_prone_t_row",
    name: "Yere Yüzüstü T Row",
    region: ["Sırt", "Omuz Arkası"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Sırt ve omuz ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Yüzüstü yat, kolları T şeklinde aç."
  },

  // Orta Seviye
  {
    id: "back_bent_row",
    name: "Bent-Over Row (Dumbbell)",
    region: ["Sırt", "Lats", "Biceps"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 8,
    restSec: 60,
    warmupSuggestion: "Alt sırt ve hamstring ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Beli düz tut, dirsekleri geriye çek."
  },
  {
    id: "back_one_arm_row",
    name: "One-Arm Dumbbell Row",
    region: ["Sırt", "Lats"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 10,
    restSec: 60,
    warmupSuggestion: "Tek taraflı sırt ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bench'e bir el ve diz koy, diğer kolla çek."
  },
  {
    id: "back_reverse_fly",
    name: "Reverse Fly",
    region: ["Sırt", "Omuz Arkası"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultTimeSec: null,
    defaultWeightKg: 4,
    restSec: 60,
    warmupSuggestion: "Omuz arkası ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Eğil, kolları yanlara aç (ters fly)."
  },

  // İleri Seviye
  {
    id: "back_pullup",
    name: "Pull-Up",
    region: ["Sırt", "Lats", "Biceps"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 8,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Asılma ve sırt ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Tam hareket, çene barın üstüne."
  },
  {
    id: "back_chinup",
    name: "Chin-Up",
    region: ["Sırt", "Biceps"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 8,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Biceps ve sırt ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Avuç içi sana dönük tutuş."
  },
  {
    id: "back_weighted_pullup",
    name: "Weighted Pull-Up",
    region: ["Sırt", "Lats", "Güç"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 6,
    defaultTimeSec: null,
    defaultWeightKg: 10,
    restSec: 120,
    warmupSuggestion: "Sırt ve grip ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bele ağırlık tak (dip belt)."
  },
  {
    id: "back_inverted_row",
    name: "Inverted Row",
    region: ["Sırt", "Biceps", "Core"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Sırt ve core ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bara alttan asıl, vücudu çek."
  },

  // ==================== OMUZ ====================

  // Başlangıç Seviye
  {
    id: "shoulder_front_raise",
    name: "Front Shoulder Raise",
    region: ["Omuz", "Ön Omuz"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 2,
    restSec: 60,
    warmupSuggestion: "Omuz rotasyonu",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Hafif ağırlık, kolları öne kaldır."
  },
  {
    id: "shoulder_lateral_raise",
    name: "Lateral Raise",
    region: ["Omuz", "Yan Omuz"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 2,
    restSec: 60,
    warmupSuggestion: "Omuz mobilizasyonu",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Kolları yanlara aç, omuz hizasına kadar."
  },
  {
    id: "shoulder_circles",
    name: "Shoulder Circles",
    region: ["Omuz", "Mobilite"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 20,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 45,
    warmupSuggestion: "Hafif kol salınımı",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Vücut ağırlığı, daire çiz."
  },

  // Orta Seviye
  {
    id: "shoulder_db_press",
    name: "Dumbbell Shoulder Press",
    region: ["Omuz", "Triceps"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 6,
    restSec: 60,
    warmupSuggestion: "Omuz ve triceps ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dumbbell'ları yukarı it, kontrollü indir."
  },
  {
    id: "shoulder_arnold_press",
    name: "Arnold Press",
    region: ["Omuz", "Tüm Deltoid"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 5,
    restSec: 60,
    warmupSuggestion: "Omuz rotasyon ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Başlangıçta avuç içi sana bakacak, yukarı dönerken dışa dön."
  },
  {
    id: "shoulder_upright_row",
    name: "Upright Row",
    region: ["Omuz", "Trapezius"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 6,
    restSec: 60,
    warmupSuggestion: "Omuz ve trapez ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Ağırlığı çeneye doğru çek, dirsekler yüksek."
  },

  // İleri Seviye
  {
    id: "shoulder_handstand_hold",
    name: "Handstand Hold (Duvar Destekli)",
    region: ["Omuz", "Core", "Denge"],
    level: "İleri",
    type: "time",
    defaultSets: 3,
    defaultReps: null,
    defaultTimeSec: 30,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Bilek ve omuz ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Duvara ayak değdir, el duruşu pozisyonunda tut."
  },
  {
    id: "shoulder_handstand_pushup",
    name: "Handstand Push-Up",
    region: ["Omuz", "Triceps", "Güç"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 6,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 120,
    warmupSuggestion: "El duruşu ve omuz kuvvet ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Duvar destekli, başı yere doğru in ve it."
  },
  {
    id: "shoulder_push_press",
    name: "Push Press",
    region: ["Omuz", "Bacak", "Güç"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 12,
    restSec: 90,
    warmupSuggestion: "Tüm vücut dinamik ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bacaklardan itme gücü kullanarak omuz press."
  },

  // ==================== KOL (Biceps, Triceps, Ön Kol) ====================

  // Başlangıç Seviye
  {
    id: "arm_bicep_curl",
    name: "Biceps Curl",
    region: ["Kol", "Biceps"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 4,
    restSec: 60,
    warmupSuggestion: "Kol ve bilek ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dirsek sabit, sadece ön kol hareket eder."
  },
  {
    id: "arm_tricep_dip_assisted",
    name: "Triceps Dips (Sandalye Destekli)",
    region: ["Kol", "Triceps"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Triceps ve omuz ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Eller bench/sandalye üzerinde, dizler bükülü."
  },
  {
    id: "arm_hammer_curl",
    name: "Hammer Curl",
    region: ["Kol", "Biceps", "Ön Kol"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 4,
    restSec: 60,
    warmupSuggestion: "Kol ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Avuç içi karşılıklı tutuş (çekiç gibi)."
  },

  // Orta Seviye
  {
    id: "arm_concentration_curl",
    name: "Concentration Curl",
    region: ["Kol", "Biceps"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 6,
    restSec: 60,
    warmupSuggestion: "Biceps izolasyon ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Otur, dirsek uyluğa dayan, izole curl."
  },
  {
    id: "arm_tricep_overhead",
    name: "Triceps Overhead Extension",
    region: ["Kol", "Triceps"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 6,
    restSec: 60,
    warmupSuggestion: "Triceps ve omuz ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dumbbell kafanın arkasından aşağı in, yukarı it."
  },
  {
    id: "arm_close_grip_pushup",
    name: "Close-Grip Push-Up",
    region: ["Kol", "Triceps", "Göğüs"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Triceps ve göğüs ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Eller göğüs genişliğinde veya daha dar."
  },

  // İleri Seviye
  {
    id: "arm_weighted_dip",
    name: "Weighted Dips",
    region: ["Kol", "Triceps", "Göğüs"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 8,
    defaultTimeSec: null,
    defaultWeightKg: 10,
    restSec: 90,
    warmupSuggestion: "Triceps ve göğüs ağır ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bele ağırlık tak, paralel barlarda dip."
  },
  {
    id: "arm_21s_curl",
    name: "21s Biceps Curl",
    region: ["Kol", "Biceps"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 21,
    defaultTimeSec: null,
    defaultWeightKg: 5,
    restSec: 90,
    warmupSuggestion: "Biceps ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "7 alt yarım, 7 üst yarım, 7 tam hareket."
  },
  {
    id: "arm_diamond_pushup",
    name: "Diamond Push-Up",
    region: ["Kol", "Triceps", "Göğüs"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Triceps yoğun ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Eller baş ve işaret parmağıyla elmas şekli oluşturur."
  },

  // ==================== KALÇA / BACAK / AYAK ====================

  // Başlangıç Seviye
  {
    id: "leg_bodyweight_squat",
    name: "Squat (Vücut Ağırlığı)",
    region: ["Bacak", "Kalça", "Quadriceps"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Alt vücut dinamik ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dizler ayak uçlarını geçmemeli, kalça geriye."
  },
  {
    id: "leg_glute_bridge",
    name: "Glute Bridge",
    region: ["Kalça", "Glutes", "Hamstring"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Kalça ve hamstring ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Sırt üstü, kalçayı yukarı it, sıkıştır."
  },
  {
    id: "leg_calf_raise",
    name: "Standing Calf Raise",
    region: ["Ayak", "Baldır"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 20,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Ayak bileği mobilizasyonu",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Ayak parmaklarında yüksel, in."
  },
  {
    id: "leg_walking_lunge_basic",
    name: "Walking Lunges (Kısa Adım)",
    region: ["Bacak", "Kalça", "Denge"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 20,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Bacak ve denge ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Adım at, arka diz yere yakın."
  },

  // Orta Seviye
  {
    id: "leg_bulgarian_split",
    name: "Bulgarian Split Squat",
    region: ["Bacak", "Kalça", "Denge"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Tek bacak ve denge ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Arka ayak yüksek yüzeyde, ön bacak çalışır."
  },
  {
    id: "leg_db_squat",
    name: "Dumbbell Squat",
    region: ["Bacak", "Kalça"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 8,
    restSec: 60,
    warmupSuggestion: "Alt vücut ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dumbbell'ları yanlarda tut, squat yap."
  },
  {
    id: "leg_reverse_lunge",
    name: "Reverse Lunge",
    region: ["Bacak", "Kalça"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Bacak ve kalça ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Geriye adım at, dizler 90 derece."
  },
  {
    id: "leg_step_up",
    name: "Step-Up",
    region: ["Bacak", "Kalça"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Bacak kuvvet ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Yüksek platforma çık, kontrollü in."
  },

  // İleri Seviye
  {
    id: "leg_barbell_squat",
    name: "Barbell Back Squat",
    region: ["Bacak", "Kalça", "Core"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 20,
    restSec: 90,
    warmupSuggestion: "Tam alt vücut ve core ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Bar omuzlarda, derin squat, core aktif."
  },
  {
    id: "leg_jump_squat",
    name: "Jump Squat",
    region: ["Bacak", "Patlayıcı Güç"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Pliometrik ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Squat pozisyonundan patlayıcı zıpla."
  },
  {
    id: "leg_pistol_squat",
    name: "Pistol Squat (Yardımlı)",
    region: ["Bacak", "Denge", "Kuvvet"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 6,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 90,
    warmupSuggestion: "Tek bacak kuvvet ve denge",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Tek bacak squat, destek tutarak başla."
  },
  {
    id: "leg_walking_lunge_weighted",
    name: "Walking Lunges (Ağırlıklı)",
    region: ["Bacak", "Kalça"],
    level: "İleri",
    type: "reps",
    defaultSets: 3,
    defaultReps: 20,
    defaultTimeSec: null,
    defaultWeightKg: 8,
    restSec: 90,
    warmupSuggestion: "Alt vücut ve core ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Dumbbell tutarak uzun adımlarla lunge."
  },

  // ==================== TÜM VÜCUT / COMPOUND ====================

  {
    id: "fullbody_burpee",
    name: "Burpee",
    region: ["Tüm Vücut", "Kardiyovasküler"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Tam vücut dinamik ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Şınav pozisyonu, zıpla, sürekli tekrar."
  },
  {
    id: "fullbody_jumping_jack",
    name: "Jumping Jacks",
    region: ["Tüm Vücut", "Kardiyovasküler"],
    level: "Başlangıç",
    type: "reps",
    defaultSets: 3,
    defaultReps: 30,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 45,
    warmupSuggestion: "Hafif kardiyovasküler ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Isınma için mükemmel."
  },
  {
    id: "fullbody_high_knees",
    name: "High Knees",
    region: ["Tüm Vücut", "Kardiyovasküler"],
    level: "Orta",
    type: "time",
    defaultSets: 3,
    defaultReps: null,
    defaultTimeSec: 45,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Bacak ve kalp atışı ısınması",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Hızlı tempo, dizleri yukarı."
  },
  {
    id: "fullbody_plank_to_pushup",
    name: "Plank to Push-Up",
    region: ["Tüm Vücut", "Core", "Göğüs"],
    level: "Orta",
    type: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultTimeSec: null,
    defaultWeightKg: 0,
    restSec: 60,
    warmupSuggestion: "Core ve üst vücut ısınma",
    imageUrl: "#",
    videoUrl: "#",
    notes: "Plank'tan şınav pozisyonuna geç."
  }
];

// Bölge listesi (filtreler için)
const REGIONS = [
  "Karın",
  "Göbek",
  "Bel",
  "Alt Karın",
  "Yan Karın",
  "Core",
  "Göğüs",
  "Üst Göğüs",
  "Alt Göğüs",
  "Sırt",
  "Alt Sırt",
  "Lats",
  "Omuz",
  "Ön Omuz",
  "Yan Omuz",
  "Omuz Arkası",
  "Kol",
  "Biceps",
  "Triceps",
  "Ön Kol",
  "Kalça",
  "Glutes",
  "Bacak",
  "Quadriceps",
  "Hamstring",
  "Ayak",
  "Baldır",
  "Tüm Vücut",
  "Kardiyovasküler"
];

// Seviye listesi
const LEVELS = ["Başlangıç", "Orta", "İleri"];

// Genel ısınma önerileri
const GENERAL_WARMUP = {
  general: "5-10 dakika hafif tempo yürüyüş veya koşu. Kalp atışını yavaşça artır.",
  abs: "3 dakika gövde rotasyonları, yanlara eğilme, hafif bel çevirme egzersizleri.",
  chest: "3-5 dakika kol daireleri, omuz rotasyonları, hafif şınav pozisyonu ısınmaları.",
  back: "3 dakika cat-cow hareketi, hafif esneme, scapula retraksiyon ısınmaları.",
  legs: "5 dakika hafif tempo yürüyüş, diz çekme yürüyüşü, hafif squat ve lunge ısınmaları.",
  shoulder: "3-5 dakika omuz daireleri, kol salınımları, hafif direniş bantı çalışması.",
  arms: "2-3 dakika hafif kol salınımı, bilek rotasyonları, hafif curl hareketleri."
};

// ==================== HAZIR PROGRAMLAR ====================

/**
 * Hazır fitness programları - Haftada 3 gün, günde yaklaşık 1.5 saat
 * Her program için Gün 1, Gün 2, Gün 3 egzersiz ID'leri
 */
const PRESET_PROGRAMS = [
  {
    id: "beginner_fullbody",
    name: "Başlangıç - Tüm Vücut Programı",
    description: "Haftada 3 gün, tüm vücut çalışması. Temel hareketlerle formunuzu geliştirin.",
    level: "Başlangıç",
    goal: "Genel form",
    daysPerWeek: 3,
    estimatedDuration: 90, // dakika
    days: {
      1: {
        name: "Gün 1 - Üst Vücut & Core",
        exercises: [
          "fullbody_jumping_jack", // Isınma
          "chest_wall_pushup",
          "chest_knee_pushup",
          "back_superman",
          "back_prone_t_row",
          "shoulder_front_raise",
          "shoulder_lateral_raise",
          "arm_bicep_curl",
          "arm_tricep_dip_assisted",
          "abs_crunch_basic",
          "abs_plank_knee",
          "abs_dead_bug"
        ]
      },
      2: {
        name: "Gün 2 - Alt Vücut & Kardiyovasküler",
        exercises: [
          "fullbody_jumping_jack", // Isınma
          "leg_bodyweight_squat",
          "leg_glute_bridge",
          "leg_walking_lunge_basic",
          "leg_calf_raise",
          "abs_knee_tucks",
          "abs_side_plank_knee",
          "fullbody_high_knees",
          "back_resistance_row"
        ]
      },
      3: {
        name: "Gün 3 - Tüm Vücut Mix",
        exercises: [
          "fullbody_jumping_jack", // Isınma
          "chest_floor_press",
          "back_resistance_row",
          "shoulder_circles",
          "arm_hammer_curl",
          "leg_bodyweight_squat",
          "leg_glute_bridge",
          "abs_crunch_basic",
          "abs_plank_knee",
          "abs_knee_tucks",
          "leg_calf_raise"
        ]
      }
    }
  },
  {
    id: "weightloss_cardio",
    name: "Kilo Verme - Kardiyovasküler + Kuvvet",
    description: "Haftada 3 gün, yoğun kardiyovasküler ve kuvvet çalışması. Kalori yakımını artırın.",
    level: "Orta",
    goal: "Kilo verme",
    daysPerWeek: 3,
    estimatedDuration: 90,
    days: {
      1: {
        name: "Gün 1 - Kardiyovasküler Ağırlıklı",
        exercises: [
          "fullbody_jumping_jack",
          "fullbody_high_knees",
          "fullbody_burpee",
          "abs_mountain_climber",
          "leg_jump_squat",
          "chest_pushup",
          "abs_bicycle_crunch",
          "abs_plank_full",
          "leg_walking_lunge_basic",
          "back_inverted_row"
        ]
      },
      2: {
        name: "Gün 2 - Kuvvet + Kardiyovasküler",
        exercises: [
          "fullbody_jumping_jack",
          "chest_db_bench_press",
          "back_bent_row",
          "shoulder_db_press",
          "leg_db_squat",
          "leg_bulgarian_split",
          "fullbody_burpee",
          "abs_leg_raise",
          "abs_russian_twist",
          "arm_concentration_curl",
          "arm_tricep_overhead"
        ]
      },
      3: {
        name: "Gün 3 - HIIT Tarzı Tüm Vücut",
        exercises: [
          "fullbody_high_knees",
          "fullbody_burpee",
          "abs_mountain_climber",
          "chest_incline_pushup",
          "leg_reverse_lunge",
          "back_one_arm_row",
          "shoulder_arnold_press",
          "abs_bicycle_crunch",
          "abs_plank_full",
          "leg_step_up",
          "fullbody_plank_to_pushup"
        ]
      }
    }
  },
  {
    id: "muscle_building",
    name: "Kas Geliştirme - Ağır Kuvvet",
    description: "Haftada 3 gün, kas kütlesi artırma odaklı ağır antrenman programı.",
    level: "İleri",
    goal: "Kas kazanımı",
    daysPerWeek: 3,
    estimatedDuration: 100,
    days: {
      1: {
        name: "Gün 1 - Göğüs, Omuz, Triceps",
        exercises: [
          "fullbody_jumping_jack",
          "chest_pushup",
          "chest_db_bench_press",
          "chest_db_fly",
          "chest_decline_pushup",
          "chest_weighted_pushup",
          "shoulder_db_press",
          "shoulder_arnold_press",
          "shoulder_upright_row",
          "arm_tricep_overhead",
          "arm_close_grip_pushup",
          "arm_weighted_dip"
        ]
      },
      2: {
        name: "Gün 2 - Sırt, Biceps, Core",
        exercises: [
          "fullbody_jumping_jack",
          "back_pullup",
          "back_bent_row",
          "back_one_arm_row",
          "back_weighted_pullup",
          "back_inverted_row",
          "arm_bicep_curl",
          "arm_concentration_curl",
          "arm_21s_curl",
          "abs_hanging_leg_raise",
          "abs_v_sit_up",
          "abs_ab_wheel"
        ]
      },
      3: {
        name: "Gün 3 - Bacak, Kalça, Alt Vücut",
        exercises: [
          "fullbody_jumping_jack",
          "leg_barbell_squat",
          "leg_db_squat",
          "leg_bulgarian_split",
          "leg_walking_lunge_weighted",
          "leg_glute_bridge",
          "leg_step_up",
          "leg_calf_raise",
          "abs_plank_leg_lift",
          "abs_russian_twist",
          "abs_dragon_flag"
        ]
      }
    }
  },
  {
    id: "home_workout",
    name: "Evde Antrenman - Ekipman Gerektirmez",
    description: "Haftada 3 gün, hiçbir ekipman gerektirmeyen vücut ağırlığı antrenmanı.",
    level: "Orta",
    goal: "Genel form",
    daysPerWeek: 3,
    estimatedDuration: 85,
    days: {
      1: {
        name: "Gün 1 - Üst Vücut Yoğun",
        exercises: [
          "fullbody_jumping_jack",
          "chest_pushup",
          "chest_incline_pushup",
          "chest_decline_pushup",
          "arm_close_grip_pushup",
          "arm_diamond_pushup",
          "back_superman",
          "shoulder_circles",
          "abs_plank_full",
          "abs_plank_leg_lift",
          "fullbody_plank_to_pushup"
        ]
      },
      2: {
        name: "Gün 2 - Alt Vücut & Core",
        exercises: [
          "fullbody_jumping_jack",
          "leg_bodyweight_squat",
          "leg_jump_squat",
          "leg_walking_lunge_basic",
          "leg_reverse_lunge",
          "leg_glute_bridge",
          "leg_calf_raise",
          "abs_crunch_basic",
          "abs_bicycle_crunch",
          "abs_leg_raise",
          "abs_v_sit_up"
        ]
      },
      3: {
        name: "Gün 3 - Tüm Vücut Kardiyovasküler",
        exercises: [
          "fullbody_jumping_jack",
          "fullbody_burpee",
          "fullbody_high_knees",
          "abs_mountain_climber",
          "chest_pushup",
          "leg_bodyweight_squat",
          "abs_plank_full",
          "abs_russian_twist",
          "back_superman",
          "leg_walking_lunge_basic",
          "abs_bicycle_crunch"
        ]
      }
    }
  },
  {
    id: "abs_focused",
    name: "Karın Odaklı Program",
    description: "Haftada 3 gün, karın ve core kaslarına yoğunlaşan program.",
    level: "Orta",
    goal: "Bölgesel sıkılaşma",
    daysPerWeek: 3,
    estimatedDuration: 75,
    days: {
      1: {
        name: "Gün 1 - Ön Karın & Alt Karın",
        exercises: [
          "fullbody_jumping_jack",
          "abs_crunch_basic",
          "abs_bicycle_crunch",
          "abs_leg_raise",
          "abs_knee_tucks",
          "abs_v_sit_up",
          "abs_plank_full",
          "abs_mountain_climber",
          "chest_pushup",
          "back_superman"
        ]
      },
      2: {
        name: "Gün 2 - Yan Karın & Core Stabilizasyon",
        exercises: [
          "fullbody_jumping_jack",
          "abs_russian_twist",
          "abs_side_plank_knee",
          "abs_bicycle_crunch",
          "abs_plank_leg_lift",
          "abs_dead_bug",
          "abs_mountain_climber",
          "fullbody_plank_to_pushup",
          "leg_bodyweight_squat",
          "back_prone_t_row"
        ]
      },
      3: {
        name: "Gün 3 - İleri Seviye Core",
        exercises: [
          "fullbody_high_knees",
          "abs_plank_full",
          "abs_plank_leg_lift",
          "abs_v_sit_up",
          "abs_ab_wheel",
          "abs_leg_raise",
          "abs_bicycle_crunch",
          "abs_russian_twist",
          "fullbody_burpee",
          "abs_mountain_climber"
        ]
      }
    }
  }
];
