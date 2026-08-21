export type PlacementRect = { x: number; y: number; width: number; height: number };

export type NewTableValidationInput = PlacementRect & {
  name: string;
  seats: number;
  shape: string;
};

export type NewTableValidationErrors = Partial<Record<"name" | "seats" | "width" | "height" | "shape" | "position", string>>;

const VALID_SHAPES = new Set(["rectangle", "circle", "oval"]);

export function normalizeTableName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export function rectanglesOverlap(a: PlacementRect, b: PlacementRect, gap = 0): boolean {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}

export function findTableVacancy(
  occupied: PlacementRect[],
  width: number,
  height: number,
  canvasWidth = 1000,
  canvasHeight = 650,
  gap = 16,
): { x: number; y: number; overlaps: boolean } {
  const safeWidth = Math.max(1, Math.min(width, canvasWidth));
  const safeHeight = Math.max(1, Math.min(height, canvasHeight));
  for (let y = gap; y + safeHeight <= canvasHeight - gap; y += gap) {
    for (let x = gap; x + safeWidth <= canvasWidth - gap; x += gap) {
      const candidate = { x, y, width: safeWidth, height: safeHeight };
      if (!occupied.some((table) => rectanglesOverlap(candidate, table, gap))) return { x, y, overlaps: false };
    }
  }
  return { x: Math.max(0, canvasWidth - safeWidth), y: Math.max(0, canvasHeight - safeHeight), overlaps: true };
}

export function validateNewTable(
  table: NewTableValidationInput,
  existingNames: string[],
  canvasWidth = 1000,
  canvasHeight = 650,
  minWidth = 60,
  minHeight = 40,
): NewTableValidationErrors {
  const errors: NewTableValidationErrors = {};
  const name = normalizeTableName(table.name);
  if (!name) errors.name = "请输入桌台名称";
  else if (existingNames.some((value) => normalizeTableName(value) === name)) errors.name = "当前区域已存在同名桌台";
  if (!Number.isInteger(table.seats) || table.seats <= 0) errors.seats = "人数必须为大于 0 的整数";
  if (!Number.isFinite(table.width) || table.width < minWidth) errors.width = `宽度不能小于 ${minWidth}`;
  if (!Number.isFinite(table.height) || table.height < minHeight) errors.height = `高度不能小于 ${minHeight}`;
  if (!VALID_SHAPES.has(table.shape)) errors.shape = "请选择有效的桌台形状";
  if (![table.x, table.y, table.width, table.height].every(Number.isFinite) || table.x < 0 || table.y < 0 || table.x + table.width > canvasWidth || table.y + table.height > canvasHeight) {
    errors.position = "桌台必须完全位于画布范围内";
  }
  return errors;
}
