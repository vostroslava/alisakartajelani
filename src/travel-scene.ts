/**
 * Animated Travel Scene - Airplane flying across the sky
 */

export class TravelScene {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private animationId: number = 0;
    private time: number = 0;

    // Flight path control points (bezier curve) - airplane flies from bottom-left to top-right
    private startPoint = { x: -0.1, y: 0.85 };
    private controlPoint1 = { x: 0.25, y: 0.6 };
    private controlPoint2 = { x: 0.6, y: 0.4 };
    private endPoint = { x: 1.1, y: 0.15 };

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

    private bezierPoint(t: number): { x: number; y: number } {
        const t1 = 1 - t;
        const x = t1 * t1 * t1 * this.startPoint.x +
            3 * t1 * t1 * t * this.controlPoint1.x +
            3 * t1 * t * t * this.controlPoint2.x +
            t * t * t * this.endPoint.x;
        const y = t1 * t1 * t1 * this.startPoint.y +
            3 * t1 * t1 * t * this.controlPoint1.y +
            3 * t1 * t * t * this.controlPoint2.y +
            t * t * t * this.endPoint.y;
        return { x, y };
    }

    private bezierTangent(t: number): number {
        const p0 = this.bezierPoint(Math.max(0, t - 0.01));
        const p1 = this.bezierPoint(Math.min(1, t + 0.01));
        return Math.atan2(p1.y - p0.y, p1.x - p0.x);
    }

    private drawCloud(x: number, y: number, size: number, alpha: number): void {
        const ctx = this.ctx;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 240, 230, ${alpha})`;

        // Cloud made of circles
        const cx = x * w;
        const cy = y * h;
        const s = size * Math.min(w, h);

        ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.3, cy - s * 0.1, s * 0.35, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.6, cy, s * 0.3, 0, Math.PI * 2);
        ctx.arc(cx - s * 0.25, cy + s * 0.05, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawPlane(x: number, y: number, angle: number, scale: number): void {
        const ctx = this.ctx;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        ctx.save();
        ctx.translate(x * w, y * h);
        ctx.rotate(angle);
        ctx.scale(scale, scale);

        // Simple airplane shape
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e8a87c';
        ctx.lineWidth = 2;

        // Fuselage
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Wings
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-15, -20);
        ctx.lineTo(10, -20);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-15, 20);
        ctx.lineTo(10, 20);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tail
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(-30, -12);
        ctx.lineTo(-25, 0);
        ctx.lineTo(-30, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Nose
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(35, 0);
        ctx.lineTo(25, -3);
        ctx.closePath();
        ctx.fillStyle = '#e8a87c';
        ctx.fill();

        // Trail
        ctx.restore();
    }

    private drawTrail(currentT: number): void {
        const ctx = this.ctx;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(232, 168, 124, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);

        const startT = Math.max(0, currentT - 0.3);
        for (let t = startT; t <= currentT; t += 0.01) {
            const p = this.bezierPoint(t);
            if (t === startT) {
                ctx.moveTo(p.x * w, p.y * h);
            } else {
                ctx.lineTo(p.x * w, p.y * h);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    private animate = (): void => {
        const ctx = this.ctx;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Background gradient (sunset sky)
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#2d1f3d');
        gradient.addColorStop(0.3, '#4a2c5a');
        gradient.addColorStop(0.6, '#e88a6a');
        gradient.addColorStop(0.85, '#f5c89a');
        gradient.addColorStop(1, '#f8e0c0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Animated clouds
        this.time += 0.002;
        const cloudOffset = (this.time * 0.1) % 1;

        this.drawCloud(0.15 + cloudOffset * 0.1, 0.25, 0.08, 0.6);
        this.drawCloud(0.4 - cloudOffset * 0.05, 0.35, 0.1, 0.5);
        this.drawCloud(0.7 + cloudOffset * 0.08, 0.2, 0.12, 0.4);
        this.drawCloud(0.85 - cloudOffset * 0.1, 0.4, 0.07, 0.5);

        // Flight progress (loops every 8 seconds)
        const flightT = (this.time * 0.125) % 1;

        // Draw trail
        this.drawTrail(flightT);

        // Get plane position and angle
        const planePos = this.bezierPoint(flightT);
        const planeAngle = this.bezierTangent(flightT);

        // Draw plane
        this.drawPlane(planePos.x, planePos.y, planeAngle, 1.2);

        this.animationId = requestAnimationFrame(this.animate);
    };

    public destroy(): void {
        cancelAnimationFrame(this.animationId);
        this.canvas.remove();
    }
}
