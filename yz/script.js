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
const toolsCollection = db.collection("tools");

// DOM elementleri
const toolForm = document.getElementById("add-tool-form");
const toolInput = document.getElementById("tool-input");
const toolList = document.getElementById("tool-list");

// Sayfa yüklendiğinde araçları listele
document.addEventListener("DOMContentLoaded", () => {
    listTools();
});

// Form gönderildiğinde yeni araç ekle
toolForm.addEventListener("submit", (e) => {
    e.preventDefault();
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
                        <button class="edit-btn" onclick="updateTool('${toolId}')">Düzenle</button>
                        <button class="delete-btn" onclick="deleteTool('${toolId}')">Sil</button>
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
    toolsCollection.add({
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
    toolsCollection.doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const tool = doc.data();
                const newName = prompt("Yeni araç adını girin:", tool.name);
                
                if (newName && newName.trim() !== "" && newName !== tool.name) {
                    toolsCollection.doc(id).update({
                        name: newName.trim(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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