# Product Requirements Document: ChronoGoal! Online

**Version:** 1.0
**Author:** [Kullanıcı Adınız/Takma Adınız]
**Date:** 19.05.2025
**Goal:** Mevcut tek kişilik "ChronoGoal!" oyununu (sağlanan `game.html` temel alınarak), Firebase Realtime Database kullanarak online, iki kişilik (PvP) bir futbol oyununa dönüştürmek. Oyuncuların ayrıca bir yapay zeka botuna karşı (PvB) oynayabilmesi ve oyunun GitHub Pages üzerinden yayınlanabilmesi hedeflenmektedir.

**Target Audience:** Basit, retro temalı, sıra tabanlı online futbol oyunu arayan gündelik oyuncular.

**Core Technologies:**
*   **Frontend:** HTML, CSS, JavaScript (Mevcut `game.html` dosyası temel alınacaktır)
*   **Backend & Realtime:** Google Firebase Realtime Database (Ücretsiz Spark Planı)
*   **Version Control & Hosting:** Git, GitHub, GitHub Pages

---

## Key Features:

### F1: Online PvP Kurulumu & Oda Yönetimi
*   **Description:** Oyuncuların online olarak birbirleriyle oynamak üzere oyun odaları oluşturmasını veya mevcut odalara katılmasını sağlar.
*   **User Stories:**
    *   "Bir oyuncu olarak, arkadaşlarımı davet etmek için benzersiz bir kodla yeni bir oyun odası oluşturabilmek istiyorum."
    *   "Bir oyuncu olarak, arkadaşımın verdiği bir oda kodunu kullanarak mevcut bir oyuna katılabilmek istiyorum."
    *   "Sistem olarak, bir odaya iki oyuncu katıldığında, kimin başlayacağını rastgele belirleyip oyunu başlatmak istiyorum."
*   **Acceptance Criteria:**
    *   Oyuncular "Oda Oluştur" seçeneği ile benzersiz bir oda kodu alabilmelidir.
    *   Oda kodu Firebase'de yeni bir oyun oturumu olarak kaydedilmelidir (`player1` atanmış, `gameState: 'waiting_for_player2'`).
    *   Oyuncular "Odaya Katıl" seçeneği ve geçerli bir oda kodu ile mevcut bir odaya `player2` olarak katılabilmelidir.
    *   Oda dolduğunda (`player2` katıldığında), oyun durumu `choosing_starter` veya doğrudan ilk oyuncunun sırasına (`player1_turn`) geçmeli ve bu Firebase üzerinden senkronize edilmelidir.
    *   Geçersiz oda kodu girildiğinde kullanıcıya hata mesajı gösterilmelidir.
*   **Technical Implementation Notes:**
    *   Firebase path: `/games/{roomId}`
    *   `roomId` için 5-6 karakterlik, okunması kolay (örn: harf+rakam) bir kod üretme fonksiyonu.
    *   Başlangıç oyuncusu Firebase'de `currentPlayer` alanı ile belirlenmeli ve senkronize edilmelidir.
*   **UI/UX Notes:**
    *   Ana ekranda "Online Oyna" butonu.
    *   Online menüde "Oda Oluştur" ve "Odaya Katıl" (giriş alanı ile) seçenekleri.
    *   Oda kodu oluşturulduğunda ekranda net bir şekilde gösterilmeli ve kopyalama butonu olmalı.

### F2: Temel Sıra Tabanlı Oyun Mekanikleri
*   **Description:** Oyuncuların sıra ile kronometreyi durdurarak hamle yapmasını ve sonuçların belirlenmesini yönetir.
*   **User Stories:**
    *   "Bir oyuncu olarak, sıram geldiğinde kronometreyi başlatıp durdurabilmek istiyorum."
    *   "Bir oyuncu olarak, sıramın kimde olduğunu net bir şekilde görebilmek istiyorum."
    *   "Sistem olarak, bir oyuncu sırası geldiğinde 5 saniye içinde hamle yapmazsa (kronometreyi başlatmazsa/durdurmazsa), sırayı otomatik olarak diğer oyuncuya geçirmek istiyorum."
*   **Acceptance Criteria:**
    *   `currentPlayer` bilgisi Firebase'den okunarak ekranda gösterilir.
    *   Sadece sırası gelen oyuncu "Başlat/Durdur" butonunu aktif olarak kullanabilir.
    *   Kronometre durdurulduğunda, salise değeri (00-99) sonucu belirlemek üzere Firebase'e gönderilir.
    *   Sıra zaman aşımı (5 saniye) Firebase üzerinden yönetilmeli (örn: `turnStartTime` timestamp'i ile). Zaman aşımı durumunda `currentPlayer` Firebase'de güncellenir.
*   **Technical Implementation Notes:**
    *   `toggleBtn` (mevcut `game.html`deki) kullanılabilirliği `localPlayerNumber === currentPlayerFromFirebase` kontrolüne bağlanmalı.
    *   Kronometrenin durdurulduğu `milliseconds` (veya sadece salise) değeri Firebase'e (`/games/{roomId}/playerX/lastStopTimeMs` veya `/games/{roomId}/lastActionDetail/centiseconds`) yazılmalı.
    *   Oyunun genel durumu (`gameState`) Firebase'de tutulmalı ve güncellenmeli (örn: `player1_timing`, `player1_stopped`, `evaluating_result`).
*   **UI/UX Notes:**
    *   Sıra göstergesi (`turn-indicator`) belirgin olmalı: "SIRA: SEN" / "SIRA: RAKİP".
    *   Kronometre, mevcut `game.html`deki Casio temasına uygun olmalı (`stopwatch-container`, `stopwatch`).

### F3: Gol Sonucu (Salise 00)
*   **Description:** Kronometreyi 00 salisede durduran oyuncunun gol atmasını sağlar.
*   **User Stories:**
    *   "Bir oyuncu olarak, kronometreyi 00 salisede durdurduğumda gol atmış sayılmak ve skorumun artmasını istiyorum."
*   **Acceptance Criteria:**
    *   Kronometre 00 salisede durdurulduğunda (bu bilgi Firebase'e ulaştığında), atan oyuncunun skoru Firebase'de 1 artırılır.
    *   Gol animasyonu ve sesi istemci tarafında oynatılır.
    *   Sıra diğer oyuncuya geçer ve Firebase'de `currentPlayer` güncellenir. `gameState` `playerX_turn` olarak ayarlanır.
*   **Technical Implementation Notes:**
    *   Sunucu tarafı mantığı (veya Firebase Functions ile tetiklenen) veya güvenilir bir istemci (örn: oda sahibi) sonucu değerlendirip Firebase'e yazmalı.
    *   Skor Firebase'de (`/games/{roomId}/playerX/score`) güncellenmeli.
    *   `gameState` ve `currentPlayer` Firebase'de güncellenmeli.
*   **UI/UX Notes:**
    *   Gol olduğunda top kaleye doğru hareket etmeli (`animateBallToGoal`).
    *   Ekranda "GOOOOL!" yazısı (`goal-celebration-text`) ve gol sesi (`goal-sound`) aktif olmalı.
    *   Tribünlerde sevinç animasyonu.

### F4: Penaltı Olayı & Mini Oyunu (Salise 99)
*   **Description:** Kronometreyi 99 salisede durduran oyuncuya penaltı kullanma hakkı verir.
*   **User Stories:**
    *   "Bir oyuncu olarak, kronometreyi 99 salisede durdurduğumda penaltı kazanmak istiyorum."
    *   "Penaltıyı kullanan oyuncu olarak, vuruş yönümü (sol/orta/sağ) seçebilmek istiyorum."
    *   "Kaleci rolündeki oyuncu olarak (PvP'de), kurtarış için bir yön (sol/orta/sağ) seçebilmek istiyorum."
    *   "Penaltı sonucuna göre gol olursa skorumun artmasını veya kaçarsa oyunun devam etmesini istiyorum."
*   **Acceptance Criteria:**
    *   99 salisede oyun "Penaltı Modu"na geçer (`gameState: 'penalty_playerX_aiming'`, X penaltıyı kullanan).
    *   Penaltıyı kullanan oyuncu (shooter) ekrandaki UI elemanları ile (örn: 3 bölgeye tıklama) vuruş yönünü seçer. Seçim Firebase'e (`/games/{roomId}/penaltyDetails/aimAngle`) yazılır. `gameState` `penalty_playerY_saving`'e (Y kaleci) geçer.
    *   PvP modunda, diğer oyuncu (kaleci) benzer bir UI ile kurtarış yönünü seçer. Seçim Firebase'e (`/games/{roomId}/penaltyDetails/saveAttemptAngle`) yazılır.
    *   Her iki seçim de yapıldığında, Firebase'de (veya Functions ile) sonuç belirlenir; eşleşmezse gol, eşleşirse kurtarış. Sonuç (gol/kaçtı) ve gerekirse skor Firebase'de güncellenir.
    *   PvB modunda bot rastgele bir kurtarış yönü seçer.
    *   Penaltı sonrası oyun normal akışına döner (`gameState: 'playerX_turn'`), sıra diğer oyuncuya geçer.
*   **Technical Implementation Notes:**
    *   Penaltı için özel `gameState`'ler.
    *   Oyuncuların seçimleri (vuruş ve kurtarış) Firebase üzerinden senkronize edilmeli.
    *   `/games/{roomId}/penaltyDetails` objesi penaltı durumunu tutar.
*   **UI/UX Notes:**
    *   Ekranda kale, kaleci ve top belirginleşmeli. Penaltı atmosferi.
    *   Vuruş/kurtarış yönü seçimi için net UI elemanları (3 tıklanabilir bölge veya buton).
    *   Penaltı golünde/kaçışında ayrı ses efektleri.

### F5: Frikik Olayı & Mini Oyunu (Salise 98 veya 02)
*   **Description:** Kronometreyi 98 veya 02 salisede durduran oyuncuya frikik kullanma hakkı verir.
*   **User Stories:**
    *   "Bir oyuncu olarak, kronometreyi 98 veya 02 salisede durdurduğumda frikik kazanmak istiyorum."
    *   "Frikiği kullanan oyuncu olarak, şutumu yönlendirmek için basit bir mekanizma kullanabilmek istiyorum (örn: hareketli barı durdurma)."
    *   "Frikik sonucuna göre gol olursa skorumun artmasını veya kaçarsa oyunun devam etmesini istiyorum."
*   **Acceptance Criteria:**
    *   98 veya 02 salisede oyun "Frikik Modu"na geçer (`gameState: 'freekick_playerX_aiming'`).
    *   Frikik kullanan oyuncu, basit bir mini oyunla (örn: hareket eden barı doğru zamanda durdurma veya 2-3 şut bölgesinden birini seçme) şutunu kullanır. Mini oyunun sonucu (başarı/başarısızlık) Firebase'e (`/games/{roomId}/penaltyDetails/freekickOutcome`) yazılır.
    *   Başarı durumuna göre gol olur veya olmaz. Sonuç ve gerekirse skor Firebase'de güncellenir.
    *   Frikik sonrası oyun normal akışına döner (`gameState: 'playerX_turn'`), sıra diğer oyuncuya geçer.
*   **Technical Implementation Notes:**
    *   Frikik için özel `gameState`.
    *   Mini oyun mekaniği ve sonucu Firebase ile yönetilmeli. `penaltyDetails.type` "freekick" olabilir.
*   **UI/UX Notes:**
    *   Ekranda kale (daha uzak), baraj (basit figürler) gösterilebilir.
    *   Frikik mini oyunu için anlaşılır UI (örn: yatay/dikey hareket eden bir bar).

### F6: Aut/Kaçırılan Sonucu & Sıra Geçişi
*   **Description:** Gol, penaltı veya frikik olmayan durumlarda topun auta çıkmasını ve sıranın diğer oyuncuya geçmesini sağlar.
*   **User Stories:**
    *   "Bir oyuncu olarak, kronometreyi özel saliseler (00, 98, 99, 02) dışında durdurduğumda sıranın diğer oyuncuya geçmesini istiyorum."
*   **Acceptance Criteria:**
    *   Belirlenen özel saliseler dışında bir değerde kronometre durdurulduğunda (bilgi Firebase'e ulaştığında), "AUT!" mesajı istemcide gösterilir.
    *   Firebase'de `currentPlayer` güncellenerek sıra diğer oyuncuya geçirilir. `gameState` `playerX_turn` olarak ayarlanır.
    *   Aut sesi (`aut-sound`) çalınır.
*   **Technical Implementation Notes:**
    *   Sonucun değerlendirilmesi ve Firebase güncellemesi F3'teki gibi yönetilmeli.
*   **UI/UX Notes:**
    *   Mesaj alanında "AUT! Sıra diğer oyuncuda." mesajı.
    *   `flashScreen('miss')` efekti kullanılabilir.

### F7: Oyun Bitiş Koşulu ve Skorlama
*   **Description:** Oyunun ne zaman biteceğini ve kazananın nasıl belirleneceğini tanımlar.
*   **User Stories:**
    *   "Bir oyuncu olarak, belirlenen sayıda tur oynandıktan veya bir oyuncu belirlenen skora ulaştıktan sonra oyunun bitmesini istiyorum."
    *   "Oyun bittiğinde kazananın kim olduğunu ve son skorları görebilmek istiyorum."
    *   "Oyun bittikten sonra yeniden oynama seçeneği sunulmasını istiyorum."
*   **Acceptance Criteria:**
    *   Oyun bitiş koşulu (örn: her oyuncu için 10 toplam hamle veya 5 gole ilk ulaşan) Firebase'de tanımlanır ve takip edilir (`/games/{roomId}/gameSettings/maxTurns`, `/games/{roomId}/currentTurnTotal`, `/games/{roomId}/gameSettings/maxScore`).
    *   Koşul sağlandığında `gameState: 'game_over'` olarak ayarlanır. Firebase'de kazanan (`winnerPlayer`) da belirtilebilir.
    *   Ekranda kazanan oyuncu ve skorlar gösterilir.
    *   "Yeniden Oyna" butonu belirir (aynı rakiple yeni bir oyun başlatmak için oda sahibinin tetiklemesiyle yeni bir oyun ID'si oluşturulur veya ana menüye döner).
*   **Technical Implementation Notes:**
    *   Oyunun her tur sonunda veya skor değişikliğinde bitiş koşulu Firebase'de (veya Functions ile) kontrol edilmeli.
*   **UI/UX Notes:**
    *   Oyun sonu ekranı/modalı net ve bilgilendirici olmalı.

### F8: UI/UX - Görsel Tema & Animasyonlar
*   **Description:** Oyunun genel görsel stilini, Casio saat temasını ve animasyonlarını tanımlar.
*   **Acceptance Criteria:**
    *   Yeşil futbol sahası arka planı.
    *   Sahanın gerisinde (üst kısımda) tribün ve basit taraftar ikonları/silüetleri.
    *   Gol olduğunda taraftarların sevinç animasyonu (basit CSS animasyonu: örn. ikonların hafifçe yukarı-aşağı oynaması).
    *   Topun kaleye hızlı gitme animasyonu (`#football-ball.shooting` CSS class'ı kullanılabilir).
    *   "GOOOOL!" yazısının pixel fontla belirgin gösterimi (`goal-celebration-text`).
    *   Kronometrenin Casio saat görünümü (fontlar, kasa, ekran) mevcut `game.html`'deki gibi korunmalı ve tutarlı olmalı.
    *   Sıra göstergesi, skor tabelası ve mesaj alanı net ve okunaklı olmalı.
*   **Technical Implementation Notes:**
    *   Mevcut CSS (`:root` değişkenleri, `Press Start 2P`, `Rubik Mono One` fontları) kullanılmalı ve geliştirilmeli.
    *   Animasyonlar için CSS transitions/animations tercih edilmeli.
*   **UI/UX Notes:**
    *   Genel estetik retro, basit ve eğlenceli olmalı.

### F9: Oyuncu vs Bot (PvB) Modu (İkincil Öncelik)
*   **Description:** Oyuncunun yapay zekaya karşı oynamasını sağlar.
*   **User Stories:**
    *   "Bir oyuncu olarak, internet bağlantım olmadığında veya pratik yapmak için bir bota karşı oynayabilmek istiyorum."
*   **Acceptance Criteria:**
    *   Ana menüde "Bota Karşı Oyna" seçeneği.
    *   (Opsiyonel) Bot zorluk seviyesi seçimi (Kolay, Orta, Zor).
    *   Bot, sırası geldiğinde otomatik olarak kronometreyi durdurur (rastgele, veya zorluğa göre belirli saliseleri tutturma olasılığı artar/azalır).
    *   Bot, penaltı/frikik durumlarında otomatik olarak (rastgele veya basit bir mantıkla) şut/kurtarış yapar.
    *   Bu mod için Firebase bağlantısı gerekmez, tüm mantık istemci tarafında çalışır (ancak `game.html`'in online mod için yapılan Firebase odaklı yapısı bu modu geliştirmeyi karmaşıklaştırabilir; ayrı bir JS mantığı gerekebilir veya Firebase emülatörü kullanılabilir).
*   **Technical Implementation Notes:**
    *   Botun durdurma zamanlaması `Math.random()` ve zorluk seviyesine bağlı bir olasılık dağılımı ile belirlenir.
    *   Botun penaltı/frikik seçimleri de rastgele veya basit bir "eğer oyuncu X seçtiyse Y seçme" mantığı ile yapılır.
    *   `isBotGame: true` ve `botDifficulty` gibi alanlar Firebase'de (eğer PvB de Firebase üzerinden state yönetiyorsa) veya lokal state'de tutulabilir.
*   **UI/UX Notes:**
    *   Botun oynadığı net bir şekilde belirtilmeli (örn: Rakip Adı: "BOT Zor").

### F10: Firebase Veri Yapısı ve Başlatma
*   **Description:** Firebase Realtime Database için kullanılacak genel veri yapısını ve oyun başladığında ilk verilerin nasıl yükleneceğini tanımlar.
*   **Acceptance Criteria:**
    *   PRD'nin "Firebase Realtime Database Yapısı (Öneri)" bölümünde detaylandırılan JSON şablonu temel alınarak oluşturulmalıdır.
    *   Oyuncuların ID'leri (Firebase Auth UID veya anonim guest ID), isimleri (opsiyonel), skorları, mevcut oyuncu sırası (`currentPlayer`), oyunun genel durumu (`gameState`), oyun ayarları (tur sayısı/hedef skor, sıra zaman aşımı), özel durum detayları (penaltı, frikik için), oyunculara gösterilecek anlık mesajlar, oyunun bot oyunu olup olmadığı (`isBotGame`) ve bot zorluğu (`botDifficulty`) gibi bilgiler bu yapıda net bir şekilde tutulmalıdır.
    *   Yeni bir oyun odası oluşturulduğunda veya bota karşı oyun başlatıldığında, Firebase'e (PvP için) veya yerel state'e (PvB eğer Firebase kullanmıyorsa) başlangıç verileri doğru bir şekilde yüklenmelidir.
*   **Technical Implementation Notes:**
    *   Firebase başlatma kodu (`firebase.initializeApp(firebaseConfig)`) ve database referansı (`firebase.database()`) script'in başında doğru şekilde tanımlanmalıdır.
    *   Oyun durumlarını dinlemek için (`database.ref('games/' + currentGameId).on('value', callback)`) yapısı kullanılacaktır. Bu callback içinde alınan verilere göre UI güncellenmelidir.
    *   Veri yazma işlemleri (`.set()`, `.update()`, `.transaction()`) uygun Firebase referanslarına yapılacaktır. Özellikle skor güncellemeleri ve hamle sayısı gibi rekabetçi yazımlar için `.transaction()` kullanılabilir.
    *   Geliştirme aşamasında Firebase kuralları test için açık olabilir (`{ ".read": true, ".write": true }`). Yayınlamadan önce güvenli kurallar tanımlanmalıdır (örn: sadece authenticate olmuş kullanıcılar yazabilir, oyuncular sadece kendi hamlelerini ve kendi odalarındaki veriyi güncelleyebilir).
