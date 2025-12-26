/**
 * Animated Dev Scene - Laptop with typing code
 */

export class DevScene {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private animationId: number = 0;
    private time: number = 0;
    private cursorVisible: boolean = true;
    private currentLine: number = 0;
    private currentChar: number = 0;
    private lastTypeTime: number = 0;

    // Code to "type"
    private codeLines: string[] = [
        'const dream = async () => {',
        '  const goals = await fetchGoals();',
        '  const plan = createPlan(goals);',
        '  ',
        '  for (const step of plan) {',
        '    await execute(step);',
        '    celebrate(step.done);',
        '  }',
        '  ',
        '  return SUCCESS;',
        '};',
        '',
        'dream().then(result => {',
        '  console.log("✨ Dreams:", result);',
        '});',
    ];

    private displayedLines: string[] = [];

    constructor(container: HTMLElement) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'scene-canvas';
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d')!;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    private resize(): void {
        const rect = this.canvas.parentElement!.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio, 2);
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
    }

    private drawLaptop(): void {
        const ctx = this.ctx;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        const laptopW = w * 0.7;
        const laptopH = h * 0.5;
        const laptopX = (w - laptopW) / 2;
        const laptopY = h * 0.3;

        // Screen bezel
        ctx.fillStyle = '#2a2a35';
        ctx.strokeStyle = '#3a3a45';
        ctx.lineWidth = 2;

        // Screen outer
        const screenPadding = 8;
        ctx.beginPath();
        ctx.roundRect(laptopX, laptopY, laptopW, laptopH, 8);
        ctx.fill();
        ctx.stroke();

        // Screen inner (code area)
        const screenX = laptopX + screenPadding;
        const screenY = laptopY + screenPadding;
        const screenW = laptopW - screenPadding * 2;
        const screenH = laptopH - screenPadding * 2;

        ctx.fillStyle = '#1a1a24';
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, screenW, screenH, 4);
        ctx.fill();

        // Screen glow
        const glowGradient = ctx.createRadialGradient(
            screenX + screenW / 2, screenY + screenH / 2, 0,
            screenX + screenW / 2, screenY + screenH / 2, screenW
        );
        glowGradient.addColorStop(0, 'rgba(245, 200, 66, 0.05)');
        glowGradient.addColorStop(1, 'rgba(245, 200, 66, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, w, h);

        // Draw code
        this.drawCode(screenX + 15, screenY + 15, screenW - 30, screenH - 30);

        // Laptop base/keyboard
        const baseY = laptopY + laptopH;
        const baseH = h * 0.08;

        ctx.fillStyle = '#3a3a45';
        ctx.beginPath();
        ctx.moveTo(laptopX - 20, baseY);
        ctx.lineTo(laptopX + laptopW + 20, baseY);
        ctx.lineTo(laptopX + laptopW + 30, baseY + baseH);
        ctx.lineTo(laptopX - 30, baseY + baseH);
        ctx.closePath();
        ctx.fill();

        // Touchpad
        ctx.fillStyle = '#4a4a55';
        ctx.beginPath();
        ctx.roundRect(
            laptopX + laptopW * 0.35,
            baseY + baseH * 0.3,
            laptopW * 0.3,
            baseH * 0.5,
            4
        );
        ctx.fill();
    }

    private drawCode(x: number, y: number, maxWidth: number, maxHeight: number): void {
        const ctx = this.ctx;
        const lineHeight = 18;
        const fontSize = 13;

        ctx.font = `${fontSize}px 'SF Mono', 'Consolas', monospace`;

        // Update displayed lines based on typing progress
        while (this.displayedLines.length < this.currentLine) {
            this.displayedLines.push('');
        }

        if (this.currentLine < this.codeLines.length) {
            const targetLine = this.codeLines[this.currentLine];
            if (this.currentChar <= targetLine.length) {
                this.displayedLines[this.currentLine] = targetLine.substring(0, this.currentChar);
            }
        }

        // Draw each line
        for (let i = 0; i < this.displayedLines.length && i * lineHeight < maxHeight; i++) {
            const line = this.displayedLines[i];
            let drawX = x;
            const drawY = y + i * lineHeight + fontSize;

            // Line number
            ctx.fillStyle = '#555565';
            ctx.fillText(`${(i + 1).toString().padStart(2, ' ')} `, drawX, drawY);
            drawX += 30;

            // Syntax highlighting (simple)
            const tokens = this.tokenizeLine(line);
            for (const token of tokens) {
                ctx.fillStyle = token.color;
                ctx.fillText(token.text, drawX, drawY);
                drawX += ctx.measureText(token.text).width;
            }
        }

        // Cursor
        if (this.cursorVisible && this.currentLine < this.codeLines.length) {
            const cursorLineY = y + this.currentLine * lineHeight + fontSize;
            const currentText = this.displayedLines[this.currentLine] || '';
            const cursorX = x + 30 + ctx.measureText(currentText).width;

            ctx.fillStyle = '#f5c842';
            ctx.fillRect(cursorX, cursorLineY - fontSize + 3, 2, fontSize);
        }
    }

    private tokenizeLine(line: string): { text: string; color: string }[] {
        const tokens: { text: string; color: string }[] = [];

        // Very simple syntax highlighting
        const keywords = ['const', 'let', 'var', 'async', 'await', 'for', 'of', 'return', 'then', 'function'];
        const functions = ['fetchGoals', 'createPlan', 'execute', 'celebrate', 'dream', 'console', 'log'];
        const strings = /"[^"]*"|'[^']*'/g;
        const comments = /\/\/.*/g;

        let remaining = line;
        let i = 0;

        while (i < remaining.length) {
            let matched = false;

            // Check for strings
            if (remaining[i] === '"' || remaining[i] === "'") {
                const quote = remaining[i];
                let end = remaining.indexOf(quote, i + 1);
                if (end === -1) end = remaining.length;
                tokens.push({ text: remaining.substring(i, end + 1), color: '#98c379' });
                i = end + 1;
                matched = true;
                continue;
            }

            // Check for keywords
            for (const kw of keywords) {
                if (remaining.substring(i).startsWith(kw) &&
                    (i === 0 || !/\w/.test(remaining[i - 1])) &&
                    (i + kw.length >= remaining.length || !/\w/.test(remaining[i + kw.length]))) {
                    tokens.push({ text: kw, color: '#c678dd' });
                    i += kw.length;
                    matched = true;
                    break;
                }
            }
            if (matched) continue;

            // Check for function names
            for (const fn of functions) {
                if (remaining.substring(i).startsWith(fn)) {
                    tokens.push({ text: fn, color: '#61afef' });
                    i += fn.length;
                    matched = true;
                    break;
                }
            }
            if (matched) continue;

            // Check for numbers
            if (/\d/.test(remaining[i])) {
                let numEnd = i;
                while (numEnd < remaining.length && /\d/.test(remaining[numEnd])) numEnd++;
                tokens.push({ text: remaining.substring(i, numEnd), color: '#d19a66' });
                i = numEnd;
                continue;
            }

            // Check for operators/punctuation
            if (/[{}()[\];,.:=><+\-*/]/.test(remaining[i])) {
                tokens.push({ text: remaining[i], color: '#f5c842' });
                i++;
                continue;
            }

            // Default - identifiers and whitespace
            let end = i;
            while (end < remaining.length && !/[{})[\];,.:=><+\-*/"'\s]/.test(remaining[end])) {
                end++;
            }
            if (end > i) {
                tokens.push({ text: remaining.substring(i, end), color: '#e5c07b' });
                i = end;
            } else if (/\s/.test(remaining[i])) {
                // Whitespace
                let wsEnd = i;
                while (wsEnd < remaining.length && /\s/.test(remaining[wsEnd])) wsEnd++;
                tokens.push({ text: remaining.substring(i, wsEnd), color: '#abb2bf' });
                i = wsEnd;
            } else {
                tokens.push({ text: remaining[i], color: '#abb2bf' });
                i++;
            }
        }

        return tokens;
    }

    private drawDecorations(): void {
        const ctx = this.ctx;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        // Coffee cup
        const cupX = w * 0.15;
        const cupY = h * 0.7;

        ctx.fillStyle = '#f5f0e8';
        ctx.beginPath();
        ctx.ellipse(cupX, cupY, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e8e0d5';
        ctx.beginPath();
        ctx.moveTo(cupX - 20, cupY);
        ctx.lineTo(cupX - 15, cupY + 35);
        ctx.lineTo(cupX + 15, cupY + 35);
        ctx.lineTo(cupX + 20, cupY);
        ctx.closePath();
        ctx.fill();

        // Handle
        ctx.strokeStyle = '#e8e0d5';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cupX + 22, cupY + 15, 10, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        // Steam
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const steamX = cupX - 8 + i * 8;
            const phase = this.time * 2 + i;
            ctx.beginPath();
            ctx.moveTo(steamX, cupY - 5);
            ctx.quadraticCurveTo(
                steamX + Math.sin(phase) * 5, cupY - 15,
                steamX + Math.sin(phase + 1) * 3, cupY - 25
            );
            ctx.stroke();
        }

        // Plant
        const plantX = w * 0.85;
        const plantY = h * 0.75;

        // Pot
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.moveTo(plantX - 20, plantY);
        ctx.lineTo(plantX - 15, plantY + 30);
        ctx.lineTo(plantX + 15, plantY + 30);
        ctx.lineTo(plantX + 20, plantY);
        ctx.closePath();
        ctx.fill();

        // Leaves
        ctx.fillStyle = '#4a8c5c';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI - Math.PI / 2 + Math.sin(this.time + i) * 0.1;
            const leafLen = 25 + Math.sin(i * 1.5) * 10;

            ctx.beginPath();
            ctx.ellipse(
                plantX + Math.cos(angle) * leafLen * 0.7,
                plantY - 10 + Math.sin(angle) * leafLen * 0.3 - leafLen * 0.5,
                leafLen * 0.4,
                leafLen * 0.15,
                angle,
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    private animate = (): void => {
        const ctx = this.ctx;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Background gradient (dark workspace)
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#16161e');
        gradient.addColorStop(0.5, '#1e1e28');
        gradient.addColorStop(1, '#252530');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Network/graph decoration in background
        ctx.strokeStyle = 'rgba(245, 200, 66, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const x1 = (Math.sin(i * 1.3) * 0.3 + 0.5) * w;
            const y1 = (Math.cos(i * 0.9) * 0.3 + 0.3) * h;
            const x2 = (Math.sin(i * 1.7 + 1) * 0.3 + 0.5) * w;
            const y2 = (Math.cos(i * 1.1 + 1) * 0.3 + 0.5) * h;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.fillStyle = `rgba(245, 200, 66, ${0.1 + Math.sin(this.time * 2 + i) * 0.05})`;
            ctx.beginPath();
            ctx.arc(x1, y1, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        this.time += 0.016;

        // Type code at intervals
        const now = performance.now();
        const typeSpeed = 50; // ms per character

        if (now - this.lastTypeTime > typeSpeed) {
            this.lastTypeTime = now;

            if (this.currentLine < this.codeLines.length) {
                const targetLine = this.codeLines[this.currentLine];
                if (this.currentChar < targetLine.length) {
                    this.currentChar++;
                } else {
                    // Move to next line
                    this.currentLine++;
                    this.currentChar = 0;
                    this.displayedLines.push('');
                }
            } else {
                // Reset after all lines typed
                this.currentLine = 0;
                this.currentChar = 0;
                this.displayedLines = [];
            }
        }

        // Cursor blink
        if (Math.floor(this.time * 2) % 2 === 0) {
            this.cursorVisible = true;
        } else {
            this.cursorVisible = false;
        }

        // Draw decorations (behind laptop)
        this.drawDecorations();

        // Draw laptop with code
        this.drawLaptop();

        this.animationId = requestAnimationFrame(this.animate);
    };

    public destroy(): void {
        cancelAnimationFrame(this.animationId);
        this.canvas.remove();
    }
}
