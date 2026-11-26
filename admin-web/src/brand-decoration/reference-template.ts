import type { Channel, Theme } from './domain';

export type HomeLayout = {
    imageFirst: boolean;
    align: 'start' | 'center';
    imageShare: number;
    radius: number;
};
export type HomeTemplate = { id: string; name: string; version: 1; layout: HomeLayout; target?: { channel: Channel; page: string } };

// Existing templates without an explicit target belong to the Kiosk home page.
export function templateTarget(template: HomeTemplate): NonNullable<HomeTemplate['target']> {
    return template.target ?? { channel: 'kiosk', page: 'home' };
}

export function templateMatches(template: HomeTemplate, channel: Channel, page: string) {
    const target = templateTarget(template);
    return target.channel === channel && target.page === page;
}

export function referenceTheme(layout: HomeLayout): Theme {
    if (layout.imageFirst) return 'terra';
    return layout.radius <= 18 ? 'noir' : 'jade';
}

export function validHomeLayout(layout: HomeLayout) {
    return !!layout && typeof layout.imageFirst === 'boolean' && ['start', 'center'].includes(layout.align) &&
        Number.isInteger(layout.imageShare) && layout.imageShare >= 42 && layout.imageShare <= 62 &&
        Number.isInteger(layout.radius) && layout.radius >= 4 && layout.radius <= 36;
}

export function validHomeTemplate(value: HomeTemplate) {
    return value?.version === 1 && typeof value.id === 'string' && /^[a-f0-9-]{36}$/.test(value.id) &&
        typeof value.name === 'string' && !!value.name.trim() && value.name.length <= 32 && validHomeLayout(value.layout) &&
        (value.target === undefined || (!!value.target && ['kiosk', 'emenu'].includes(value.target.channel) &&
            typeof value.target.page === 'string' && !!value.target.page));
}

export function isReferenceImage(file: File) {
    return ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) && file.size > 0 && file.size <= 10 * 1024 * 1024;
}

export async function analyzeReferenceImage(file: File): Promise<HomeLayout> {
    if (!isReferenceImage(file)) throw Error('请选择 10 MB 以内的 PNG、JPEG 或 WebP 图片');
    const image = await createImageBitmap(file, { resizeWidth: 48, resizeHeight: 48 });
    try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 48;
        const context = canvas.getContext('2d')!;
        context.fillStyle = '#fff';
        context.fillRect(0, 0, 48, 48);
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, 48, 48).data;
        const luminance = (x: number, y: number) => {
            const offset = (y * 48 + x) * 4;
            return pixels[offset] * .21 + pixels[offset + 1] * .72 + pixels[offset + 2] * .07;
        };
        const score = (left: number, top: number, right: number, bottom: number) => {
            let sum = 0;
            for (let y = top; y < bottom; y++) {
                for (let x = left; x < right; x++)
                    sum += Math.abs(luminance(x, y) - luminance(x - 1, y)) + Math.abs(luminance(x, y) - luminance(x, y - 1));
            }
            return sum / ((right - left) * (bottom - top));
        };
        const top = score(1, 1, 47, 24), bottom = score(1, 24, 47, 47);
        const left = score(1, 1, 24, 47), right = score(24, 1, 47, 47);
        const texture = (top + bottom) / 2;
        return {
            imageFirst: top > bottom * 1.12,
            align: Math.abs(left - right) < (left + right) * .13 + .2 ? 'center' : 'start',
            imageShare: Math.max(42, Math.min(62, Math.round(48 + Math.abs(top - bottom) * .6))),
            radius: Math.max(4, Math.min(36, Math.round(32 - texture * .6))),
        };
    } finally {
        image.close();
    }
}
