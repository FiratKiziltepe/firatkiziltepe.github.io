// Arama fonksiyonu
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const contentItems = document.querySelectorAll('.content-grid .content-card');
        const results = document.getElementById('searchResults');
        if (results) {
            results.innerHTML = '';
            contentItems.forEach(item => {
                if (item.textContent.toLowerCase().includes(query)) {
                    results.appendChild(item.cloneNode(true));
                }
            });
        }
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 70,
                behavior: 'smooth'
            });
        }
    });
});

// Add active class to nav links on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// Chat bot elementleri
const chatBot = document.querySelector('.chat-bot');
const chatHeader = document.querySelector('.chat-header');
const minimizeBtn = document.querySelector('.minimize-btn');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.querySelector('.chat-messages');

// Chat bot'u sayfa yüklendiğinde göster
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (chatBot) {
            chatBot.classList.add('active');
        }
    }, 1000);
});

// Header'a tıklama ile minimize etme
if (chatHeader) {
    chatHeader.addEventListener('click', (e) => {
        // Minimize butonuna tıklandığında event'in yayılmasını engelle
        if (e.target.closest('.minimize-btn')) {
            return;
        }
        chatBot.classList.toggle('active');
    });
}

// Minimize butonu işlevi
if (minimizeBtn) {
    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Event'in header'a yayılmasını engelle
        chatBot.classList.toggle('active');
    });
}

// Mesaj gönderme işlevi
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Kullanıcı mesajını ekle
    addMessage(message, 'user');
    chatInput.value = '';

    // Bot yanıtını al ve ekle
    const response = await getBotResponse(message);
    addMessage(response, 'bot');
}

// Mesaj ekleme fonksiyonu
function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <i class="fas fa-robot"></i>
            <div class="message-content">${content}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <i class="fas fa-user"></i>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Bot yanıtı alma fonksiyonu
async function getBotResponse(message) {
    try {
        // Config dosyasından API anahtarını al
        const API_KEY = CONFIG?.GEMINI_API_KEY;
        
        if (!API_KEY) {
            throw new Error('API anahtarı bulunamadı');
        }

        const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error('API yanıt vermedi');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error:', error);
        return 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.';
    }
}

// Enter tuşu ile mesaj gönderme
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Gönder butonu ile mesaj gönderme
if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
}