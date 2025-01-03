let canvas;
let incidentAngle = 45;
let n1 = 1.0;
let n2 = 1.5;

function setup() {
    canvas = createCanvas(600, 400);
    canvas.parent('canvas-container');
    angleMode(DEGREES);
}

function draw() {
    background(240);
    drawInterface();
    calculateAndDrawRays();
    updateCalculations();
}

function drawInterface() {
    // Ortam çizgisi
    stroke(0);
    strokeWeight(2);
    line(0, height/2, width, height/2);
    
    // Ortamları etiketle
    noStroke();
    fill(0);
    textSize(16);
    text('Ortam 1 (n₁ = ' + n1.toFixed(2) + ')', 10, height/4);
    text('Ortam 2 (n₂ = ' + n2.toFixed(2) + ')', 10, 3*height/4);
}

function calculateAndDrawRays() {
    let originX = width/2;
    let originY = height/2;
    let rayLength = 200;
    
    // Gelen ışın
    stroke(255, 0, 0);
    strokeWeight(2);
    let x1 = originX - rayLength * sin(incidentAngle);
    let y1 = originY - rayLength * cos(incidentAngle);
    line(x1, y1, originX, originY);
    
    // Normal çizgi
    stroke(0, 0, 255);
    strokeWeight(1);
    line(originX, originY - 50, originX, originY + 50);
    
    // Kırılan ışın açısını hesapla (Snell Yasası)
    let refractedAngle = calculateRefractedAngle(incidentAngle, n1, n2);
    
    if (!isNaN(refractedAngle)) {
        // Kırılan ışın
        stroke(0, 255, 0);
        strokeWeight(2);
        let x2 = originX + rayLength * sin(refractedAngle);
        let y2 = originY + rayLength * cos(refractedAngle);
        line(originX, originY, x2, y2);
        
        // Açıları göster
        noFill();
        stroke(255, 0, 0);
        arc(originX, originY, 40, 40, -incidentAngle, 0);
        stroke(0, 255, 0);
        arc(originX, originY, 40, 40, 0, refractedAngle);
        
        // Açı değerlerini yaz
        noStroke();
        fill(0);
        text('θ₁ = ' + incidentAngle.toFixed(1) + '°', originX - 60, originY - 20);
        text('θ₂ = ' + refractedAngle.toFixed(1) + '°', originX + 20, originY + 20);
    } else {
        // Tam yansıma durumu
        stroke(0, 255, 0);
        strokeWeight(2);
        let reflectedAngle = 180 - incidentAngle;
        let x2 = originX - rayLength * sin(reflectedAngle);
        let y2 = originY - rayLength * cos(reflectedAngle);
        line(originX, originY, x2, y2);
        
        noStroke();
        fill(255, 0, 0);
        text('Tam Yansıma!', originX + 10, originY - 20);
    }
}

function calculateRefractedAngle(theta1, n1, n2) {
    let sinTheta2 = (n1 * sin(theta1)) / n2;
    if (sinTheta2 > 1) {
        return NaN; // Tam yansıma durumu
    }
    return asin(sinTheta2);
}

function updateCalculations() {
    let refractedAngle = calculateRefractedAngle(incidentAngle, n1, n2);
    let calculations = document.getElementById('calculations');
    
    if (!isNaN(refractedAngle)) {
        calculations.innerHTML = `
            <p>n₁·sinθ₁ = n₂·sinθ₂</p>
            <p>${n1.toFixed(2)} · sin(${incidentAngle.toFixed(1)}°) = ${n2.toFixed(2)} · sin(${refractedAngle.toFixed(1)}°)</p>
            <p>${(n1 * sin(incidentAngle)).toFixed(3)} = ${(n2 * sin(refractedAngle)).toFixed(3)}</p>
        `;
    } else {
        let criticalAngle = asin(n2/n1);
        calculations.innerHTML = `
            <p>Tam Yansıma Durumu!</p>
            <p>Kritik Açı: ${criticalAngle.toFixed(1)}°</p>
            <p>Gelen Işık Açısı > Kritik Açı</p>
        `;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const incidentAngleSlider = document.getElementById('incident-angle');
    const incidentAngleValue = document.getElementById('incident-angle-value');
    const n1Input = document.getElementById('n1');
    const n2Input = document.getElementById('n2');
    
    incidentAngleSlider.addEventListener('input', function() {
        incidentAngle = parseFloat(this.value);
        incidentAngleValue.textContent = incidentAngle + '°';
    });
    
    n1Input.addEventListener('input', function() {
        n1 = parseFloat(this.value);
    });
    
    n2Input.addEventListener('input', function() {
        n2 = parseFloat(this.value);
    });
    
    // Quiz sistemi
    const questions = [
        {
            question: "Işık yoğun ortamdan daha az yoğun ortama geçerken ne olur?",
            options: [
                "Işık normale yaklaşır",
                "Işık normalden uzaklaşır",
                "Işık hiç kırılmaz",
                "Işık tamamen yansır"
            ],
            correct: 1
        },
        {
            question: "Tam yansıma hangi durumda gerçekleşir?",
            options: [
                "Işık az yoğun ortamdan çok yoğun ortama geçerken",
                "Işık çok yoğun ortamdan az yoğun ortama geçerken ve geliş açısı kritik açıdan büyükken",
                "Işık her zaman tam yansır",
                "Işık hiçbir zaman tam yansımaz"
            ],
            correct: 1
        }
    ];
    
    let currentQuestion = 0;
    
    function showQuestion() {
        const questionEl = document.getElementById('question');
        const optionsEl = document.getElementById('options');
        
        questionEl.textContent = questions[currentQuestion].question;
        optionsEl.innerHTML = '';
        
        questions[currentQuestion].options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.style.display = 'block';
            button.style.margin = '5px';
            button.onclick = () => checkAnswer(index);
            optionsEl.appendChild(button);
        });
    }
    
    function checkAnswer(selectedIndex) {
        const feedback = document.getElementById('feedback');
        if (selectedIndex === questions[currentQuestion].correct) {
            feedback.textContent = 'Doğru!';
            feedback.className = 'feedback-correct';
        } else {
            feedback.textContent = 'Yanlış. Tekrar deneyin!';
            feedback.className = 'feedback-incorrect';
        }
        
        currentQuestion = (currentQuestion + 1) % questions.length;
        setTimeout(showQuestion, 2000);
    }
    
    // Rapor kaydetme
    document.getElementById('save-report').addEventListener('click', function() {
        const report = document.getElementById('report').value;
        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'isigin_kirilmasi_raporu.txt';
        a.click();
        window.URL.revokeObjectURL(url);
    });
    
    showQuestion();
}); 