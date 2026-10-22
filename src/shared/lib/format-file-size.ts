const UNITS = ["bytes", "KB", "MB", "GB"];
const STEP = 1024;

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function formatFileSize(bytes: number) {
  let size = bytes;
  let unit = 0;

  while (size >= STEP && unit < UNITS.length - 1) {
    size /= STEP;
    unit += 1;
  }

  return `${decimal.format(unit === 0 ? size : Math.round(size * 10) / 10)} ${UNITS[unit]}`;
}
