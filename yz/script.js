// Güvenlik notu: Bu uygulama güvenlik en iyi uygulamaları göz önünde bulundurularak yazılmıştır.
// - XSS saldırıları önlenmesi: innerHTML yerine textContent, DocumentFragment, createElement kullanılmıştır
// - Yetkilendirme: İstemci tarafı ve Firestore Rules ile tutarlı yetkilendirme kontrolleri eklenmiştir
// - Rate limiting: Form gönderimleri için basit bir rate limiter eklenmiştir
// - Firestore güvenlik kuralları: firestore.rules dosyasını Firebase Konsolu'na yüklemeyi unutmayın

// Firebase yapılandırması - Minimum gerekli alanlar
// Güvenlik: Diğer hassas yapılandırma değerleri için .env veya environment değişkenleri kullanılmalıdır
const firebaseConfig = {
    apiKey: "AIzaSyCuruHWInugnstLGq-LwybAuGdzKc1gM50",
    authDomain: "yztools-cfa96.firebaseapp.com",
    projectId: "yztools-cfa96"
    // Diğer yapılandırma ayarları sunucu tarafında saklanmalıdır
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const toolsCollection = db.collection("tools");

// DOM elementleri
const toolForm = document.getElementById("add-tool-form");
const toolInput = document.getElementById("tool-input");
const toolList = document.getElementById("tool-list");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");
const submitBtn = document.getElementById("submit-btn");

// Güvenlik: Rate limiting için değişkenler
let lastSubmitTime = 0;
const MIN_SUBMIT_INTERVAL = 2000; // 2 saniye

// Hata ve bilgi mesajlarını göstermek için yardımcı fonksiyon
function showMessage(message, type = 'error') {
    // DOM'dan varsa mevcut mesajı kaldır
    const existingMessage = document.querySelector(`.${type}-message`);
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Yeni mesaj elementi oluştur
    const messageElement = document.createElement('div');
    messageElement.className = `${type}-message`;
    
    // XSS Koruması: innerHTML yerine textContent kullan
    messageElement.textContent = message;
    
    // Mesajı form öncesine ekle
    toolForm.parentNode.insertBefore(messageElement, toolForm);
    
    // 5 saniye sonra mesajı otomatik kaldır
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 5000);
}

// Firebase UI yapılandırması
try {
    let ui = new firebaseui.auth.AuthUI(auth);

    // Güvenlik: Tarayıcı dilini kullan (kimlik doğrulama arayüzü için)
    auth.useDeviceLanguage();

    // Giriş yap - Firebase UI kullanarak
    loginBtn.addEventListener("click", () => {
        console.log("Giriş düğmesine tıklandı");
        
        // Varsa eski bir UI containerı kaldır
        const oldContainer = document.getElementById('firebaseui-auth-container');
        if (oldContainer) {
            oldContainer.remove();
        }
        
        // Login modunu göster
        const uiContainer = document.createElement('div');
        uiContainer.id = 'firebaseui-auth-container';
        document.body.appendChild(uiContainer);
        
        // Gelişmiş UI yapılandırması
        ui.reset();
        ui.start('#firebaseui-auth-container', {
            signInOptions: [
                // Google ile giriş devre dışı bırakıldı
                // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                {
                    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                    requireDisplayName: false, // Kullanıcı adı sorma
                    disableSignUp: true // Yeni kayıt seçeneğini kapat
                }
            ],
            credentialHelper: firebaseui.auth.CredentialHelper.NONE, // Tarayıcıda kayıtlı şifreleri sorma
            signInFlow: 'popup',
            tosUrl: 'https://firatkiziltepe.github.io/yz/terms.html',
            privacyPolicyUrl: 'https://firatkiziltepe.github.io/yz/privacy.html',
            callbacks: {
                signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                    // Güvenlik: Kimlik doğrulama sonuçlarını kontrol et
                    if (authResult.user) {
                        console.log("Kullanıcı başarıyla giriş yaptı:", authResult.user.email);
                        
                        // Başarılı giriş sonrası UI'ı kaldır
                        const container = document.getElementById('firebaseui-auth-container');
                        if (container) {
                            container.remove();
                        }
                        
                        // Kullanıcı girişi başarılı olduğunda bildirim göster
                        showMessage(`Hoş geldiniz, ${authResult.user.email}`, "info");
                    }
                    return false; // Otomatik yönlendirme yapma
                },
                uiShown: function() {
                    // UI gösterildiğinde özel bir başlık ekle
                    setTimeout(() => {
                        // Başlık güncelleme
                        const title = document.querySelector('.firebaseui-title');
                        if (title) {
                            title.textContent = 'Giriş Yap'; // Başlığı "Giriş Yap" olarak değiştir
                        }
                        
                        // Altyazı ekle
                        const subtitle = document.createElement('div');
                        subtitle.className = 'firebaseui-subtitle';
                        subtitle.textContent = 'Hesabınıza erişmek için e-postanızı girin';
                        
                        const header = document.querySelector('.firebaseui-card-header');
                        if (header && !header.querySelector('.firebaseui-subtitle')) { // Altyazı zaten yoksa ekle
                           header.appendChild(subtitle);
                        }
                        
                        // Email input'una focus yap
                        const emailInput = document.querySelector('.firebaseui-id-email');
                        if (emailInput) {
                            emailInput.focus();
                        }
                        
                        // Kapatma butonu ekle (eğer yoksa)
                        if (!document.querySelector('.firebaseui-container .close-button')) {
                            const closeBtn = document.createElement('button');
                            closeBtn.textContent = '✕';
                            closeBtn.className = 'close-button'; // Stil için class ekle
                            closeBtn.style.position = 'absolute';
                            closeBtn.style.right = '15px';
                            closeBtn.style.top = '15px';
                            closeBtn.style.background = 'none';
                            closeBtn.style.border = 'none';
                            closeBtn.style.fontSize = '20px';
                            closeBtn.style.color = '#999';
                            closeBtn.style.cursor = 'pointer';
                            closeBtn.onclick = function() {
                                const container = document.getElementById('firebaseui-auth-container');
                                if (container) {
                                    container.remove();
                                }
                            };
                            
                            const container = document.querySelector('.firebaseui-container');
                            if (container) {
                                container.style.position = 'relative';
                                container.appendChild(closeBtn);
                            }
                        }
                    }, 100);
                }
            }
        });
    });
} catch (error) {
    console.error("Firebase UI başlatma hatası:", error);
    // Alternatif basit giriş mekanizması
    loginBtn.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .catch(error => {
                console.error("Giriş hatası:", error);
                showMessage("Giriş yapılırken bir hata oluştu: " + error.message);
            });
    });
}

// Auth durumunu izle
auth.onAuthStateChanged(user => {
    if (user) {
        // Kullanıcı giriş yapmış
        console.log("Kullanıcı giriş yaptı:", user.email);
        
        // XSS Koruması: innerHTML yerine textContent kullan
        userInfo.textContent = user.email;
        userInfo.style.display = "inline";
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        toolForm.style.display = "flex";
        
        // Araçları yeniden listele (giriş/çıkış yaptıktan sonra butonları göstermek/gizlemek için)
        listTools();
    } else {
        // Kullanıcı çıkış yapmış
        console.log("Kullanıcı çıkış yaptı");
        userInfo.style.display = "none";
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        toolForm.style.display = "none";
        
        // Araçları yeniden listele (giriş/çıkış yaptıktan sonra butonları göstermek/gizlemek için)
        listTools();
    }
});

// Çıkış yap
logoutBtn.addEventListener("click", () => {
    console.log("Çıkış düğmesine tıklandı");
    auth.signOut()
        .then(() => {
            console.log("Çıkış başarılı");
        })
        .catch(error => {
            console.error("Çıkış hatası:", error);
            showMessage("Çıkış yapılırken bir hata oluştu: " + error.message);
        });
});

// Sayfa yüklendiğinde araçları listele
document.addEventListener("DOMContentLoaded", () => {
    listTools();
});

// Güvenlik: Rate limiting için form gönderim kontrolü
// Form gönderildiğinde yeni araç ekle
toolForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Rate limiting kontrolü
    const now = Date.now();
    if (now - lastSubmitTime < MIN_SUBMIT_INTERVAL) {
        showMessage("Lütfen tekrar denemeden önce biraz bekleyin.");
        return;
    }
    
    // Kullanıcı giriş yapmış mı kontrol et
    if (!auth.currentUser) {
        showMessage("Araç eklemek için giriş yapmalısınız!");
        return;
    }
    
    const toolName = toolInput.value.trim();
    
    if (toolName) {
        // Buton spam'i önle
        submitBtn.disabled = true;
        
        // Son gönderim zamanını güncelle
        lastSubmitTime = now;
        
        addTool(toolName);
        toolInput.value = "";
        
        // 2 saniye sonra butonu etkinleştir
        setTimeout(() => {
            submitBtn.disabled = false;
        }, MIN_SUBMIT_INTERVAL);
    }
});

// Araçları listele
function listTools() {
    // Güvenlik: İçeriği temizlemeden önce referansı sakla
    const listElement = toolList;
    
    // Liste içeriğini güvenli bir şekilde temizle
    while (listElement.firstChild) {
        listElement.removeChild(listElement.firstChild);
    }
    
    toolsCollection.orderBy("name")
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                // Güvenlik: DocumentFragment kullan
                const fragment = document.createDocumentFragment();
                const emptyItem = document.createElement("li");
                emptyItem.textContent = "Henüz araç eklenmemiş";
                fragment.appendChild(emptyItem);
                listElement.appendChild(fragment);
                return;
            }
            
            // Bir kerede tüm DOM manipülasyonlarını yapmak için DocumentFragment kullan
            const fragment = document.createDocumentFragment();
            
            snapshot.forEach((doc) => {
                const tool = doc.data();
                const toolId = doc.id;
                
                // Güvenlik: innerHTML yerine DOM API'lerini kullan
                const li = document.createElement("li");
                
                // Araç adı
                const nameSpan = document.createElement("span");
                nameSpan.className = "tool-name";
                nameSpan.textContent = tool.name;
                li.appendChild(nameSpan);
                
                // Aksiyonlar
                const actionsDiv = document.createElement("div");
                actionsDiv.className = "actions";
                
                // Güvenlik: İstemci tarafı yetkilendirme kontrolleri
                const currentUser = auth.currentUser;
                if (currentUser && tool.userId === currentUser.uid) {
                    // Düzenle butonu
                    const editBtn = document.createElement("button");
                    editBtn.className = "edit-btn";
                    editBtn.textContent = "Düzenle";
                    editBtn.addEventListener("click", () => updateTool(toolId));
                    actionsDiv.appendChild(editBtn);
                    
                    // Sil butonu
                    const deleteBtn = document.createElement("button");
                    deleteBtn.className = "delete-btn";
                    deleteBtn.textContent = "Sil";
                    deleteBtn.addEventListener("click", () => deleteTool(toolId));
                    actionsDiv.appendChild(deleteBtn);
                }
                
                li.appendChild(actionsDiv);
                fragment.appendChild(li);
            });
            
            listElement.appendChild(fragment);
        })
        .catch((error) => {
            console.error("Araçlar listelenirken hata oluştu:", error);
            
            // Güvenlik: innerHTML yerine textContent kullan
            const errorItem = document.createElement("li");
            errorItem.textContent = "Araçlar yüklenirken bir hata oluştu";
            listElement.appendChild(errorItem);
            
            showMessage("Araçlar yüklenirken bir hata oluştu: " + error.message);
        });
}

// Yeni araç ekle
function addTool(name) {
    // Kullanıcı giriş yapmış mı kontrol et
    if (!auth.currentUser) {
        showMessage("Araç eklemek için giriş yapmalısınız!");
        return;
    }
    
    // Güvenlik: Data validasyonu
    if (!name || name.length < 2 || name.length > 100) {
        showMessage("Araç adı 2-100 karakter arasında olmalıdır.");
        return;
    }
    
    toolsCollection.add({
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email
    })
    .then(() => {
        listTools();
        showMessage("Araç başarıyla eklendi.", "info");
    })
    .catch((error) => {
        console.error("Araç eklenirken hata oluştu:", error);
        showMessage("Araç eklenirken bir hata oluştu: " + error.message);
        
        // Hata durumunda butonu etkinleştir
        submitBtn.disabled = false;
    });
}

// Araç güncelle
function updateTool(id) {
    // Kullanıcı giriş yapmış mı kontrol et
    if (!auth.currentUser) {
        showMessage("Araçları düzenlemek için giriş yapmalısınız!");
        return;
    }
    
    toolsCollection.doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const tool = doc.data();
                
                // Güvenlik: İstemci tarafı yetkilendirme kontrolü
                if (tool.userId !== auth.currentUser.uid) {
                    showMessage("Sadece kendi eklediğiniz araçları düzenleyebilirsiniz!");
                    return;
                }
                
                const newName = prompt("Yeni araç adını girin:", tool.name);
                
                // Güvenlik: Veri validasyonu
                if (newName && newName.trim() !== "" && newName !== tool.name) {
                    if (newName.length < 2 || newName.length > 100) {
                        showMessage("Araç adı 2-100 karakter arasında olmalıdır.");
                        return;
                    }
                    
                    toolsCollection.doc(id).update({
                        name: newName.trim(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedBy: auth.currentUser.email
                    })
                    .then(() => {
                        listTools();
                        showMessage("Araç başarıyla güncellendi.", "info");
                    })
                    .catch((error) => {
                        console.error("Araç güncellenirken hata oluştu:", error);
                        showMessage("Araç güncellenirken bir hata oluştu: " + error.message);
                    });
                }
            }
        })
        .catch((error) => {
            console.error("Araç bilgisi alınırken hata oluştu:", error);
            showMessage("Araç bilgisi alınırken bir hata oluştu: " + error.message);
        });
}

// Araç sil
function deleteTool(id) {
    // Kullanıcı giriş yapmış mı kontrol et
    if (!auth.currentUser) {
        showMessage("Araçları silmek için giriş yapmalısınız!");
        return;
    }
    
    toolsCollection.doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const tool = doc.data();
                
                // Güvenlik: İstemci tarafı yetkilendirme kontrolü
                if (tool.userId !== auth.currentUser.uid) {
                    showMessage("Sadece kendi eklediğiniz araçları silebilirsiniz!");
                    return;
                }
                
                const confirmDelete = confirm("Bu aracı silmek istediğinizden emin misiniz?");
                
                if (confirmDelete) {
                    toolsCollection.doc(id).delete()
                        .then(() => {
                            listTools();
                            showMessage("Araç başarıyla silindi.", "info");
                        })
                        .catch((error) => {
                            console.error("Araç silinirken hata oluştu:", error);
                            showMessage("Araç silinirken bir hata oluştu: " + error.message);
                        });
                }
            }
        })
        .catch((error) => {
            console.error("Araç bilgisi alınırken hata oluştu:", error);
            showMessage("Araç bilgisi alınırken bir hata oluştu: " + error.message);
        });
}

// Not: Bu kod Firestore'un Spark planında test modunda çalışacak şekilde ayarlanmıştır.
// Üretime geçmeden önce Firestore güvenlik kurallarını ayarlamayı unutmayın! 