// ═══════ PARTICLE ANIMATION ═══════
(function () {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const COUNT = 50;

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class P {
        constructor() { this.init(); }
        init() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.35;
            this.r = Math.random() * 1.8 + 0.8;
            this.a = Math.random() * 0.4 + 0.1;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(129,140,248,${this.a})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < COUNT; i++) particles.push(new P());

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 140) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - d / 140)})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(loop);
    }
    loop();
})();

// ═══════ TYPING ANIMATION ═══════
(function () {
    const el = document.getElementById('typedText');
    if (!el) return;
    const strings = [
        'MEB Eğitim Uzmanı',
        'Doktora Öğrencisi',
        'Eğitim Teknolojileri Araştırmacısı',
        'Yapay Zekâ & Eğitim'
    ];
    let strIdx = 0, charIdx = 0, deleting = false;
    const SPEED_TYPE = 80, SPEED_DEL = 40, PAUSE = 2000;

    function tick() {
        const current = strings[strIdx];
        if (!deleting) {
            el.textContent = current.substring(0, charIdx + 1);
            charIdx++;
            if (charIdx === current.length) {
                deleting = true;
                setTimeout(tick, PAUSE);
                return;
            }
        } else {
            el.textContent = current.substring(0, charIdx - 1);
            charIdx--;
            if (charIdx === 0) {
                deleting = false;
                strIdx = (strIdx + 1) % strings.length;
            }
        }
        setTimeout(tick, deleting ? SPEED_DEL : SPEED_TYPE);
    }
    setTimeout(tick, 600);
})();

// ═══════ STAT COUNTER ═══════
(function () {
    const nums = document.querySelectorAll('.stat-number');
    if (!nums.length) return;

    const animate = (el) => {
        const target = +el.dataset.target;
        const dur = 1400;
        const t0 = performance.now();
        const step = (now) => {
            const p = Math.min((now - t0) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * ease);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
        });
    }, { threshold: 0.5 });

    nums.forEach(n => obs.observe(n));
})();

// ═══════ NAVBAR SCROLL & ACTIVE LINK ═══════
(function () {
    const nav = document.getElementById('navbar');
    const links = document.querySelectorAll('.nav-links a[href^="#"]');
    const sections = [...links].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

    window.addEventListener('scroll', () => {
        // shrink navbar
        nav.classList.toggle('scrolled', window.scrollY > 50);

        // active section
        let current = '';
        sections.forEach(sec => {
            if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
        });
        links.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
    });

    // smooth scroll
    links.forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                // close mobile nav
                document.getElementById('navLinks').classList.remove('open');
            }
        });
    });
})();

// ═══════ MOBILE NAV TOGGLE ═══════
(function () {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navLinks');
    if (toggle && menu) {
        toggle.addEventListener('click', () => menu.classList.toggle('open'));
    }
})();

// ═══════ SCROLL REVEAL ═══════
(function () {
    const items = document.querySelectorAll(
        '.highlight-card, .timeline-item, .edu-card, .research-card, .contact-card, .pub-stat, .pub-note'
    );
    if (!items.length) return;
    items.forEach(el => el.classList.add('reveal'));

    const obs = new IntersectionObserver((entries) => {
        entries.forEach((e, i) => {
            if (e.isIntersecting) {
                setTimeout(() => e.target.classList.add('visible'), i * 80);
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });

    items.forEach(el => obs.observe(el));
})();