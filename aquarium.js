// ASCII Aquarium Animation
(function() {
    const aquarium = document.getElementById('aquarium');
    if (!aquarium) return;
    const colors = {
        fish1: '#ff7373',      // Orange-red
        fish2: '#ade6f7',       // Light blue
        fish3: '#ff799f',       // Pink
        bubble: '#ade6f7',      // Light blue
        seaweed: '#c8d665',     // Green-yellow
        coral: '#d6d1b3',       // Beige
        wave: '#ade6f7'        // Light blue
    };

    // Fish patterns
    const fishPatterns = [
        ['><(((º>', colors.fish1],
        ['><>', colors.fish2],
        ['><>', colors.fish3],
        ['><(((º>', colors.fish2],
        ['><>', colors.fish1],
        ['><(((º>', colors.fish3]
    ];

    // Seaweed patterns
    const seaweedPatterns = [
        ['|/', colors.seaweed],
        ['\\|/', colors.seaweed],
        ['|', colors.seaweed]
    ];

    // Create aquarium grid
    // IMPORTANT: don't guess character size; measure it (fixes "blank right side" on some fonts/zoom).
    let cellW = 14;
    let cellH = 16;
    let cols = 0;
    let rows = 0;
    let grid = [];
    let fish = [];
    let bubbles = [];
    let seaweed = [];

    function measureCellSize() {
        const probe = document.createElement('span');
        probe.textContent = 'M';
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.whiteSpace = 'pre';
        aquarium.appendChild(probe);
        const rect = probe.getBoundingClientRect();
        aquarium.removeChild(probe);

        cellW = rect.width || 14;
        cellH = rect.height || 16;

        // Safety clamps (avoid crazy values if something is off)
        cellW = Math.max(6, Math.min(40, cellW));
        cellH = Math.max(8, Math.min(60, cellH));
    }

    function escHtmlChar(ch) {
        // Needed because we're using innerHTML and fish contain < and >.
        if (ch === '&') return '&amp;';
        if (ch === '<') return '&lt;';
        if (ch === '>') return '&gt;';
        if (ch === '"') return '&quot;';
        return ch;
    }

    // Initialize grid
    function initGrid() {
        grid = [];
        for (let y = 0; y < rows; y++) {
            grid[y] = [];
            for (let x = 0; x < cols; x++) {
                grid[y][x] = { char: ' ', color: colors.wave };
            }
        }
    }

    // Create static seaweed
    function createSeaweed() {
        seaweed = [];
        const numSeaweed = Math.floor(cols / 8);
        for (let i = 0; i < numSeaweed; i++) {
            const x = Math.floor(Math.random() * cols);
            const height = Math.floor(Math.random() * 5) + 3;
            const pattern = seaweedPatterns[Math.floor(Math.random() * seaweedPatterns.length)];
            seaweed.push({
                x: x,
                height: height,
                pattern: pattern[0],
                color: pattern[1],
                offset: Math.floor(Math.random() * 3)
            });
        }
    }

    // Create fish
    function createFish() {
        fish = [];
        const numFish = Math.floor((cols * rows) / 400);
        for (let i = 0; i < numFish; i++) {
            const pattern = fishPatterns[Math.floor(Math.random() * fishPatterns.length)];
            fish.push({
                x: Math.random() * cols,
                y: Math.random() * rows,
                pattern: pattern[0],
                color: pattern[1],
                speed: (Math.random() * 0.3) + 0.1,
                direction: Math.random() > 0.5 ? 1 : -1,
                size: pattern[0].length,
                waveOffset: Math.random() * Math.PI * 2
            });
        }
    }

    // Create bubbles
    function createBubbles() {
        bubbles = [];
        const numBubbles = Math.floor((cols * rows) / 800);
        for (let i = 0; i < numBubbles; i++) {
            bubbles.push({
                x: Math.random() * cols,
                y: rows + Math.random() * 10,
                speed: (Math.random() * 0.5) + 0.2,
                char: Math.random() > 0.5 ? 'o' : 'O',
                color: colors.bubble
            });
        }
    }

    // Draw seaweed
    function drawSeaweed() {
        seaweed.forEach(sw => {
            for (let i = 0; i < sw.height; i++) {
                const y = rows - 1 - i;
                const x = sw.x + Math.sin(Date.now() / 2000 + sw.offset) * 0.5;
                if (y >= 0 && y < rows && Math.floor(x) >= 0 && Math.floor(x) < cols) {
                    const char = i === sw.height - 1 ? sw.pattern : '|';
                    grid[Math.floor(y)][Math.floor(x)] = {
                        char: char,
                        color: sw.color
                    };
                }
            }
        });
    }

    // Draw fish
    function drawFish() {
        const time = Date.now();
        fish.forEach(f => {
            f.x += f.speed * f.direction;
            
            // Bounce off edges
            if (f.x < 0 || f.x > cols - f.size) {
                f.direction *= -1;
                f.x = Math.max(0, Math.min(cols - f.size, f.x));
            }

            // Slight vertical movement (wave motion)
            f.y += Math.sin(time / 1000 + f.waveOffset) * 0.1;
            f.y = Math.max(2, Math.min(rows - 2, f.y));

            // Draw fish
            const y = Math.floor(f.y);
            const x = Math.floor(f.x);
            if (y >= 0 && y < rows && x >= 0 && x < cols - f.size) {
                for (let i = 0; i < f.pattern.length; i++) {
                    if (x + i < cols) {
                        grid[y][x + i] = {
                            char: f.pattern[i],
                            color: f.color
                        };
                    }
                }
            }
        });
    }

    // Draw bubbles
    function drawBubbles() {
        bubbles.forEach((b) => {
            b.y -= b.speed;
            
            if (b.y < -2) {
                b.y = rows + Math.random() * 5;
                b.x = Math.random() * cols;
            }

            const y = Math.floor(b.y);
            const x = Math.floor(b.x);
            if (y >= 0 && y < rows && x >= 0 && x < cols) {
                grid[y][x] = {
                    char: b.char,
                    color: b.color
                };
            }
        });
    }

    // Draw coral/decorations
    function drawCoral() {
        for (let x = 0; x < cols; x += 15) {
            const y = rows - 1;
            if (x < cols) {
                const coralChars = [',', '.', '`', "'"];
                const char = coralChars[Math.floor(Math.random() * coralChars.length)];
                grid[y][x] = {
                    char: char,
                    color: colors.coral
                };
            }
        }
    }

    // Render grid to DOM
    // NOTE: We must use innerHTML (not textContent) or the <span> tags will print as text.
    function render() {
        let html = '';
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = grid[y][x];
                html += `<span style="color: ${cell.color}">${escHtmlChar(cell.char)}</span>`;
            }
            html += '\n';
        }
        aquarium.innerHTML = html;
    }

    // Animation loop
    function animate() {
        initGrid();
        drawSeaweed();
        drawCoral();
        drawFish();
        drawBubbles();
        render();
        requestAnimationFrame(animate);
    }

    // Initialize
    function init() {
        measureCellSize();
        const rect = aquarium.getBoundingClientRect();
        cols = Math.max(10, Math.floor(rect.width / cellW));
        rows = Math.max(6, Math.floor(rect.height / cellH));
        initGrid();
        createSeaweed();
        createFish();
        createBubbles();
        animate();
    }

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            init();
        }, 250);
    });

    // Start animation when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
