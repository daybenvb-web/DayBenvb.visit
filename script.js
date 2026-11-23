document.addEventListener('DOMContentLoaded', () => {
    // Animación de entrada de la página
    const html = document.documentElement;
    const intro = document.querySelector('.intro');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const reveal = () => {
        html.classList.add('is-ready');

        if (intro) {
            intro.classList.add('is-hidden');
            setTimeout(() => intro.remove(), 1200);
        }
    };

    if (reduceMotion) {
        reveal();
    } else {
        setTimeout(reveal, 500);
    }
});

// Fondo animado con estrellas fugaces
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'starfield';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
        position: 'fixed',
        inset: '0',
        width: '100%',
        height: '100%',
        zIndex: '-1',
        pointerEvents: 'none'
    });
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let staticStars = [];
    let shootingStars = [];
    let lastSpawn = performance.now();
    let nextDelay = 300 + Math.random() * 600;

    const STAR_TINTS = [
        [255, 255, 255],
        [219, 234, 254],
        [196, 181, 253],
        [254, 249, 210]
    ];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.round((width * height) / 2200);
        staticStars = Array.from({ length: count }, () => {
            const tint = STAR_TINTS[Math.floor(Math.random() * STAR_TINTS.length)];
            let x;
            let y;

            // Parte de las estrellas forman una franja diagonal tipo Vía Láctea
            if (Math.random() < 0.35) {
                const t = Math.random();
                const offset = (Math.random() - 0.5) * Math.min(width, height) * 0.3;
                x = t * width + offset;
                y = t * height + offset * 0.5 - height * 0.1;
            } else {
                x = Math.random() * width;
                y = Math.random() * height;
            }

            return {
                x,
                y,
                r: Math.random() * 1.3 + 0.3,
                alpha: Math.random() * 0.5 + 0.4,
                tint,
                glow: Math.random() < 0.1,
                twinkle: Math.random() * 0.0018 + 0.0004,
                phase: Math.random() * Math.PI * 2
            };
        });
    }

    function spawnShootingStar() {
        const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 7 + 6;
        shootingStars.push({
            x: Math.random() * width * 1.2 - width * 0.15,
            y: -Math.random() * height * 0.5 - 20,
            ux: Math.cos(angle),
            uy: Math.sin(angle),
            speed,
            length: Math.random() * 140 + 90,
            life: 1,
            decay: Math.random() * 0.008 + 0.006
        });
    }

    function draw(time) {
        ctx.clearRect(0, 0, width, height);

        for (const star of staticStars) {
            const twinkle = 0.65 + Math.sin(time * star.twinkle + star.phase) * 0.35;
            const alpha = Math.max(0, Math.min(1, star.alpha * twinkle));
            const red = star.tint[0];
            const green = star.tint[1];
            const blue = star.tint[2];

            if (star.glow) {
                const haloRadius = star.r * 5;
                const halo = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, haloRadius);
                halo.addColorStop(0, 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha * 0.5 + ')');
                halo.addColorStop(1, 'rgba(' + red + ', ' + green + ', ' + blue + ', 0)');
                ctx.fillStyle = halo;
                ctx.beginPath();
                ctx.arc(star.x, star.y, haloRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
            ctx.fill();
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i];
            s.x += s.ux * s.speed;
            s.y += s.uy * s.speed;
            s.life -= s.decay;

            const tailX = s.x - s.ux * s.length;
            const tailY = s.y - s.uy * s.length;

            const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
            gradient.addColorStop(0, 'rgba(255, 255, 255, ' + s.life + ')');
            gradient.addColorStop(0.4, 'rgba(196, 181, 253, ' + s.life * 0.5 + ')');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            const headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
            headGlow.addColorStop(0, 'rgba(255, 255, 255, ' + s.life + ')');
            headGlow.addColorStop(1, 'rgba(196, 181, 253, 0)');
            ctx.fillStyle = headGlow;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
            ctx.fill();

            const offscreen = s.x - s.length > width || s.y - s.length > height;
            if (s.life <= 0 || offscreen) {
                shootingStars.splice(i, 1);
            }
        }
    }

    function loop(time) {
        if (time - lastSpawn > nextDelay) {
            const burst = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < burst; i++) {
                spawnShootingStar();
            }
            lastSpawn = time;
            nextDelay = 120 + Math.random() * 280;
        }
        draw(time);
        requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
        draw(0);
    } else {
        requestAnimationFrame(loop);
    }
});

// Musica de fondo
document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('musicBtn');
    if (!audio || !btn) return;

    const icon = btn.querySelector('i');
    const unlockEvents = ['pointerdown', 'keydown', 'touchstart'];
    let unlocked = false;

    audio.loop = true;
    audio.volume = 0.25;

    const updateUI = (playing) => {
        btn.classList.toggle('is-playing', playing);
        btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
        btn.setAttribute('aria-label', playing ? 'Pausar m\u00FAsica' : 'Reproducir m\u00FAsica');
        btn.title = playing ? 'Pausar m\u00FAsica' : 'Reproducir m\u00FAsica';
        if (icon) {
            icon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-music';
        }
    };

    const removeUnlockListeners = () => {
        unlockEvents.forEach((evt) => window.removeEventListener(evt, onFirstInteraction));
    };

    const play = () => {
        const result = audio.play();
        if (result && typeof result.then === 'function') {
            result.then(() => {
                unlocked = true;
                removeUnlockListeners();
                updateUI(true);
            }).catch(() => updateUI(false));
        }
    };

    const toggle = () => {
        if (audio.paused) {
            play();
        } else {
            audio.pause();
            updateUI(false);
        }
    };

    const onFirstInteraction = (event) => {
        if (btn.contains(event.target)) return;
        unlocked = true;
        removeUnlockListeners();
        play();
    };

    const addUnlockListeners = () => {
        unlockEvents.forEach((evt) => window.addEventListener(evt, onFirstInteraction, { passive: true }));
    };

    btn.addEventListener('click', toggle);
    updateUI(false);

    const attempt = audio.play();
    if (attempt && typeof attempt.then === 'function') {
        attempt.then(() => {
            unlocked = true;
            removeUnlockListeners();
            updateUI(true);
        }).catch(() => {
            updateUI(false);
            if (!unlocked) {
                addUnlockListeners();
            }
        });
    } else {
        updateUI(!audio.paused);
    }
});
