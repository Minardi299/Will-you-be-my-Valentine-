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
    // Multi-line sprites are taken from `example.html` (Framer export) and rendered as swimmers.
    const fishPatterns = [
        // Small fish
        { sprite: ['><(((º>'], color: colors.fish1, weight: 14 },
        { sprite: ['><(((º>'], color: colors.fish2, weight: 10 },
        { sprite: ['><(((º>'], color: colors.fish3, weight: 10 },
        { sprite: ['><>'], color: colors.fish2, weight: 16 },
        { sprite: ['><>'], color: colors.fish1, weight: 10 },
        { sprite: ['><>'], color: colors.fish3, weight: 10 },

        // Multi-line creatures from example.html
        {
            // ". \_____)\_____ /--v____ __`< )/"
            sprite: [
                '      .',
                '\\_____)\\_____ ',
                '/--v____ __`< ',
                '        )/'
            ],
            color: colors.fish2,
            weight: 2,
            forceDirection: 1
        },
        {
            // "_\_  \\/ o\ .  //\___=  ''"
            sprite: [
                '   _\\_  ',
                '\\\\/ o \\ .',
                '//\\___= ',
                "   ''   "
            ],
            color: colors.fish3,
            weight: 3
        },
        {
            // "`` ('_)< ,-," (orange duck variant)
            sprite: [
                ',,',
                ">(')",
                "''"
            ],
            color: colors.fish1,
            weight: 3
        },
        {
            // "`` ('_)< ,-," (blue duck variant)
            sprite: [
                ',-,',
                "('_)< ",
                '`-`'
            ],
            color: colors.fish2,
            weight: 3,
            // Keep exact look from example.html (no auto-mirroring)
            noMirror: true,
            forceDirection: 1
        },
        {
            // "` (')< ,,"
            // From example.html:
            //   ", "
            //   "<>< "
            //   "` "
            sprite: [
                ', ',
                '<>< ',
                '` '
            ],
            color: colors.fish3,
            weight: 3
        },
        {
            // "/ ,'`./ `.,'\\ \\" (orange multi-line)
            sprite: [
                '/',
                ",'`./ ",
                "`.,'\\ ",
                '\\'
            ],
            color: colors.fish1,
            weight: 2,
            // Keep exact look from example.html (no auto-mirroring)
            noMirror: true,
            forceDirection: 1
        },
        {
            // "_\_\/ -( / )-" (2-line)
            sprite: [
                '_\\_\\/',
                '-( / )-'
            ],
            color: colors.coral,
            weight: 2,
            // Keep exact look from example.html (no auto-mirroring)
            noMirror: true,
            forceDirection: 1
        },
        {
            // "@ . .@. . .:@ ..: .:. :. @:: .:. ':::.:' ':':" (multi-line)
            sprite: [
                '@ . .@. ',
                '. .:@ ..: .:. ',
                ':. @:: .:. ',
                "':::.:' ",
                "':': "
            ],
            color: colors.seaweed,
            weight: 1
        }
    ];

    function pickFishPattern() {
        const total = fishPatterns.reduce((sum, p) => sum + (p.weight ?? 1), 0);
        let r = Math.random() * total;
        for (const p of fishPatterns) {
            r -= (p.weight ?? 1);
            if (r <= 0) return p;
        }
        return fishPatterns[0];
    }

    function mirrorChar(ch) {
        switch (ch) {
            case '<': return '>';
            case '>': return '<';
            case '(': return ')';
            case ')': return '(';
            case '/': return '\\';
            case '\\': return '/';
            case '[': return ']';
            case ']': return '[';
            case '{': return '}';
            case '}': return '{';
            default: return ch;
        }
    }

    // Convert an ASCII sprite (array of strings) into a compact list of "ink" cells.
    // This makes flipping easy and avoids padding-space weirdness.
    function spriteToCells(spriteLines) {
        const cells = [];
        let minX = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (let y = 0; y < spriteLines.length; y++) {
            const line = String(spriteLines[y] ?? '');
            const chars = Array.from(line);
            for (let x = 0; x < chars.length; x++) {
                const ch = chars[x];
                if (ch === ' ') continue;
                cells.push({ x, y, ch });
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }

        if (cells.length === 0) {
            return { cells: [], width: 0, height: 0 };
        }

        // Normalize to remove left padding.
        for (const c of cells) c.x -= minX;

        return {
            cells,
            width: maxX - minX + 1,
            height: maxY + 1
        };
    }

    // Flip "ink" cells horizontally within a bounding width, mirroring characters too.
    function flipCellsHoriz(cells, width) {
        return cells.map(c => ({ x: (width - 1) - c.x, y: c.y, ch: mirrorChar(c.ch) }));
    }

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
        // Cap to keep big multi-line sprites from overcrowding
        const numFish = Math.max(6, Math.min(14, Math.floor((cols * rows) / 650)));
        for (let i = 0; i < numFish; i++) {
            const pattern = pickFishPattern();
            const spriteRight = Array.isArray(pattern.sprite) ? pattern.sprite : [String(pattern.sprite)];
            const right = spriteToCells(spriteRight);
            const leftCells = pattern.noMirror ? right.cells : flipCellsHoriz(right.cells, right.width);
            const width = right.width;
            const height = right.height;

            const speed = (Math.random() * 0.25) + 0.08;
            const direction = (typeof pattern.forceDirection === 'number')
                ? pattern.forceDirection
                : (Math.random() > 0.5 ? 1 : -1);

            fish.push({
                x: Math.random() * Math.max(1, (cols - Math.max(1, width))),
                y: 1 + Math.random() * Math.max(1, (rows - height - 2)),
                cellsRight: right.cells,
                cellsLeft: leftCells,
                width,
                height,
                color: pattern.color,
                speed,
                direction,
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
            if (f.x < 0 || f.x > cols - f.width) {
                // If forced to move one direction (e.g. shark), wrap around instead of bouncing.
                if (f.direction === 1 && f.x > cols) {
                    f.x = -f.width;
                } else if (f.direction === -1 && f.x < -f.width) {
                    f.x = cols;
                } else {
                    f.direction *= -1;
                    f.x = Math.max(0, Math.min(cols - f.width, f.x));
                }
            }

            // Slight vertical movement (wave motion)
            f.y += Math.sin(time / 1000 + f.waveOffset) * 0.1;
            f.y = Math.max(1, Math.min(rows - f.height - 1, f.y));

            // Draw fish
            const y = Math.floor(f.y);
            const x = Math.floor(f.x);
            const cells = f.direction === 1 ? f.cellsRight : f.cellsLeft;
            if (cells && cells.length) {
                for (const c of cells) {
                    const yy = y + c.y;
                    const xx = x + c.x;
                    if (yy < 0 || yy >= rows || xx < 0 || xx >= cols) continue;
                    grid[yy][xx] = { char: c.ch, color: f.color };
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
