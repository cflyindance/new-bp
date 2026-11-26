export const DEFAULT_PALETTE_ID = 'system' as const;

export const PALETTES = {
    system: { name: '系统默认', primary: '#ffb702', background: '#f5f5f5', surface: '#ffffff', ink: '#000000' },
    pine: { name: '松石绿', primary: '#254e40', background: '#f5f3ec', surface: '#fffdf8', ink: '#203d34' },
    amber: { name: '琥珀金', primary: '#dbc18d', background: '#191c1b', surface: '#272c29', ink: '#f5ebd7' },
    clay: { name: '陶土红', primary: '#ad432e', background: '#fbf1e4', surface: '#fffaf3', ink: '#492c26' },
    indigo: { name: '靛蓝', primary: '#3552a2', background: '#f1f4fb', surface: '#ffffff', ink: '#222b47' },
    graphite: { name: '石墨灰', primary: '#41464f', background: '#f0f1f3', surface: '#ffffff', ink: '#252930' },
} as const;

export type PaletteId = keyof typeof PALETTES | 'custom';

const rgb = (hex: string) => [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));

function luminance(hex: string): number {
    const linear = rgb(hex).map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrast(first: string, second: string): number {
    const a = luminance(first);
    const b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const mix = (color: string, base: string, amount: number) => {
    const target = rgb(base);
    return '#' + rgb(color).map((value, index) => Math.round(value * amount + target[index] * (1 - amount)).toString(16).padStart(2, '0')).join('');
};

export function resolvePalette(id: PaletteId | undefined, primary: string) {
    if (!id) return undefined;
    const preset = id === 'custom'
        ? { primary, background: mix(primary, '#ffffff', 0.06), surface: '#ffffff', ink: '#17212b' }
        : PALETTES[id];
    const { background, surface, ink } = preset;
    const color = preset.primary;
    const dark = luminance(background) < 0.2;
    const tone = (seed: string, amount: number) => {
        const fill = mix(seed, surface, amount);
        const hue = dark ? mix(seed, '#ffffff', 0.52) : mix(seed, '#000000', 0.68);
        return { fill, text: contrast(hue, fill) >= 4.5 ? hue : ink };
    };
    const strongestText = (fill: string) =>
        contrast(fill, '#ffffff') >= contrast(fill, '#000000') ? '#ffffff' : '#000000';
    const readable = (fill: string, preferred: string) =>
        contrast(fill, preferred) >= 4.5 ? preferred : strongestText(fill);
    const secondary = tone(color, 0.06);
    const label = tone(color, 0.10);
    const selected = tone(color, 0.20);
    const selectedMuted = readable(selected.fill, mix(ink, selected.fill, 0.72));
    const controlLine = [color, mix(ink, background, 0.55), ink]
        .find(candidate => contrast(candidate, background) >= 3 && contrast(candidate, surface) >= 3) ?? ink;
    const success = tone('#15803d', 0.16);
    const warning = tone('#b45309', 0.16);
    const error = tone('#c02626', 0.16);
    return {
        primary: color, background, surface, ink,
        onPrimary: strongestText(color),
        nativeAccent: contrast('#ffffff', color) >= 4.5 ? color : '#17212b',
        secondaryFill: secondary.fill, secondaryText: readable(secondary.fill, secondary.text), controlLine,
        muted: [mix(ink, background, 0.72), ink].find(candidate =>
            contrast(candidate, background) >= 4.5 && contrast(candidate, surface) >= 4.5) ?? ink,
        labelFill: label.fill, labelText: label.text,
        selectedFill: selected.fill, selectedText: readable(selected.fill, selected.text), selectedMuted,
        successFill: success.fill, successText: success.text,
        warningFill: warning.fill, warningText: warning.text,
        errorFill: error.fill, errorText: error.text,
        line: mix(ink, background, 0.20),
        accent: contrast(color, background) >= 4.5 && contrast(color, surface) >= 4.5 ? color : ink,
    };
}

export function describePalette(id: PaletteId | undefined, primary: string): string {
    return id && id !== 'custom' ? PALETTES[id].name : id === 'custom' ? '自定义 · ' + primary : '原方案主色 · ' + primary;
}
