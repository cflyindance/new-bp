import { copy, newScheme, validateData, type DecorationData } from './domain';
export interface StoragePort {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
export const storageKey = (scope: string) => `menusifu:brand-decoration:v1:${encodeURIComponent(scope)}`;
export function readData(scope: string, brandName: string, storage: StoragePort = localStorage): DecorationData {
    const text = storage.getItem(storageKey(scope));
    if (text !== null) {
        let data: DecorationData;
        try {
            data = JSON.parse(text);
        }
        catch {
            throw Error('装修数据损坏，请保留数据并联系管理员');
        }
        ;
        validateData(data);
        return data;
    }
    return { schema: 1, revision: 0, schemes: [{ ...newScheme('kiosk', 'Kiosk 标准方案', brandName), id: 'initial-kiosk' }, { ...newScheme('emenu', 'eMenu 标准方案', brandName), id: 'initial-emenu' }], releases: [] };
}
/** Optimistic revision check prevents another tab from silently overwriting a newer draft. */
export function writeData(scope: string, data: DecorationData, expected: number, storage: StoragePort = localStorage): DecorationData {
    const raw = storage.getItem(storageKey(scope));
    if (raw !== null) {
        const existing = JSON.parse(raw) as DecorationData;
        validateData(existing);
        if (existing.revision !== expected)
            throw Error('其他窗口已更新装修数据，请刷新后重试');
    }
    else if (expected !== 0)
        throw Error('装修数据已被清除，请刷新后重试');
    const next = copy(data);
    next.revision = expected + 1;
    validateData(next);
    try {
        storage.setItem(storageKey(scope), JSON.stringify(next));
    }
    catch {
        throw Error('本机存储空间不足或不可用，修改未保存，请重试');
    }
    return next;
}
