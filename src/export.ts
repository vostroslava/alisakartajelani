/**
 * PNG Export for Dual-Universe Vision Board
 * High-resolution poster export with print-ready quality option
 */

/**
 * Export poster as PNG
 * @param quality 'normal' (1x) or 'print' (3x resolution)
 */
export async function exportPNG(quality: 'normal' | 'print' = 'normal'): Promise<void> {
    const poster = document.getElementById('poster');
    if (!poster) return;

    // Calculate export dimensions
    const scale = quality === 'print' ? 3 : 1;
    const rect = poster.getBoundingClientRect();
    const width = rect.width * scale;
    const height = rect.height * scale;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale context
    ctx.scale(scale, scale);

    // Draw background
    ctx.fillStyle = getComputedStyle(poster).backgroundColor || '#f5f0e8';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Get poster styles for paper texture effect
    const posterStyle = getComputedStyle(poster);
    const borderRadius = parseFloat(posterStyle.borderRadius) || 0;

    // Apply rounded corners mask
    ctx.beginPath();
    roundRect(ctx, 0, 0, rect.width, rect.height, borderRadius);
    ctx.clip();

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, 'rgba(232, 168, 124, 0.08)');
    gradient.addColorStop(0.5, 'rgba(245, 240, 232, 0.05)');
    gradient.addColorStop(1, 'rgba(245, 200, 66, 0.08)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw cells with images
    const grid = document.getElementById('grid');
    if (!grid) return;

    const cells = grid.querySelectorAll('.cell');
    const gridRect = grid.getBoundingClientRect();
    const gridOffsetX = gridRect.left - rect.left;
    const gridOffsetY = gridRect.top - rect.top;

    for (const cell of cells) {
        const cellRect = cell.getBoundingClientRect();
        const cellX = cellRect.left - rect.left;
        const cellY = cellRect.top - rect.top;
        const cellW = cellRect.width;
        const cellH = cellRect.height;

        // Draw cell background
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, cellX, cellY, cellW, cellH, 8);
        ctx.clip();

        // Cell background
        ctx.fillStyle = '#fffef9';
        ctx.fillRect(cellX, cellY, cellW, cellH);

        // Draw image if present
        const img = cell.querySelector('.cell-image') as HTMLImageElement;
        if (img) {
            await drawImage(ctx, img, cellX, cellY, cellW, cellH);
        }

        ctx.restore();

        // Cell border
        ctx.strokeStyle = 'rgba(200, 190, 170, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        roundRect(ctx, cellX, cellY, cellW, cellH, 8);
        ctx.stroke();
    }

    // Convert to blob and download
    canvas.toBlob(
        (blob) => {
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vision-board-${quality}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        'image/png',
        1.0
    );
}

/**
 * Draw image with transform
 */
async function drawImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
): Promise<void> {
    return new Promise((resolve) => {
        // Get transform from style
        const transform = img.style.transform || '';
        const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        const scaleMatch = transform.match(/scale\(([-\d.]+)\)/);
        const rotateMatch = transform.match(/rotate\(([-\d.]+)deg\)/);

        const offsetX = translateMatch ? parseFloat(translateMatch[1]) : 0;
        const offsetY = translateMatch ? parseFloat(translateMatch[2]) : 0;
        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        const rotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;

        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(offsetX, offsetY);

        // Draw image to cover cell
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const cellAspect = w / h;

        let drawW, drawH;
        if (imgAspect > cellAspect) {
            drawH = h;
            drawW = h * imgAspect;
        } else {
            drawW = w;
            drawH = w / imgAspect;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        resolve();
    });
}

/**
 * Helper: Draw rounded rectangle path
 */
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
}
