// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyCuruHWInugnstLGq-LwybAuGdzKc1gM50",
    authDomain: "yztools-cfa96.firebaseapp.com",
    projectId: "yztools-cfa96",
    storageBucket: "yztools-cfa96.firebasestorage.app",
    messagingSenderId: "550011721075",
    appId: "1:550011721075:web:d53ad0b4de1770210be106",
    measurementId: "G-JN6911XYZ7"
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

// Hata mesajlarını kontrol etmek için
console.log("Firebase yüklendi:", !!firebase);
console.log("Auth yüklendi:", !!auth);
console.log("Firestore yüklendi:", !!db);

// Auth durumunu izle
auth.onAuthStateChanged(user => {
    if (user) {
        // Kullanıcı giriş yapmış
        console.log("Kullanıcı giriş yaptı:", user.email);
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

// Firebase UI yapılandırması
let ui = new firebaseui.auth.AuthUI(auth);

// Giriş yap - Firebase UI kullanarak
loginBtn.addEventListener("click", () => {
    console.log("Giriş düğmesine tıklandı");
    
    // Login modunu göster
    document.body.insertAdjacentHTML('beforeend', '<div id="firebaseui-auth-container"></div>');
    
    ui.start('#firebaseui-auth-container', {
        signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID
        ],
        signInFlow: 'popup',
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                // Başarılı giriş sonrası UI'ı kaldır
                document.getElementById('firebaseui-auth-container').remove();
                return false; // Otomatik yönlendirme yapma
            }
        }
    });
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
        });
});

// Sayfa yüklendiğinde araçları listele
document.addEventListener("DOMContentLoaded", () => {
    listTools();
});

// Form gönderildiğinde yeni araç ekle
toolForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Kullanıcı giriş yapmış mı kontrol et
    if (!auth.currentUser) {
        alert("Araç eklemek için giriş yapmalısınız!");
        return;
    }
    
    const toolName = toolInput.value.trim();
    
    if (toolName) {
        addTool(toolName);
        toolInput.value = "";
    }
});

// Araçları listele
function listTools() {
    toolList.innerHTML = "";
    
    toolsCollection.orderBy("name")
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                toolList.innerHTML = "<li>Henüz araç eklenmemiş</li>";
                return;
            }
            
            snapshot.forEach((doc) => {
                const tool = doc.data();
                const toolId = doc.id;
                
                const li = document.createElement("li");
                li.innerHTML = `
                    <span class="tool-name">${tool.name}</span>
                    <div class="actions">
                        ${auth.currentUser ? `
                        <button class="edit-btn" onclick="updateTool('${toolId}')">Düzenle</button>
                        <button class="delete-btn" onclick="deleteTool('${toolId}')">Sil</button>` : ''}
                    </div>
                `;
                
                toolList.appendChild(li);
            });
        })
        .catch((error) => {
            console.error("Araçlar listelenirken hata oluştu:", error);
            toolList.innerHTML = "<li>Araçlar yüklenirken bir hata oluştu</li>";
        });
}

// Yeni araç ekle
function addTool(name) {
    // Kullanıcı giriş yapmış mı kontrol et
    if (!auth.currentUser) {
        alert("Araç eklemek için giriş yapmalısınız!");
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
    })
    .catch((error) => {
        console.error("Araç eklenirken hata oluştu:", error);
    });
}

// Araç güncelle
function updateTool(id) {
    // Kullanıcı giriş yapmış mı kontrol et
    if (!auth.currentUser) {
        alert("Araçları düzenlemek için giriş yapmalısınız!");
        return;
    }
    
    toolsCollection.doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const tool = doc.data();
                const newName = prompt("Yeni araç adını girin:", tool.name);
                
                if (newName && newName.trim() !== "" && newName !== tool.name) {
                    toolsCollection.doc(id).update({
                        name: newName.trim(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedBy: auth.currentUser.email
                    })
                    .then(() => {
                        listTools();
                    })
                    .catch((error) => {
                        console.error("Araç güncellenirken hata oluştu:", error);
                    });
                }
            }
        })
        .catch((error) => {
            console.error("Araç bilgisi alınırken hata oluştu:", error);
        });
}

// Araç sil
function deleteTool(id) {
    // Kullanıcı giriş yapmış mı kontrol et
    if (!auth.currentUser) {
        alert("Araçları silmek için giriş yapmalısınız!");
        return;
    }
    
    const confirmDelete = confirm("Bu aracı silmek istediğinizden emin misiniz?");
    
    if (confirmDelete) {
        toolsCollection.doc(id).delete()
            .then(() => {
                listTools();
            })
            .catch((error) => {
                console.error("Araç silinirken hata oluştu:", error);
            });
    }
}

// Not: Bu kod Firestore'un Spark planında test modunda çalışacak şekilde ayarlanmıştır.
// Üretime geçmeden önce Firestore güvenlik kurallarını ayarlamayı unutmayın! 