export const formatBRL = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatPercent = (val, includeSign = true) => {
  if (val === undefined || val === null || isNaN(val)) return '0,00%';
  const prefix = includeSign && val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2).replace('.', ',')}%`;
};

export const formatDeltaBRL = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${formatBRL(val)}`;
};

export const CLASSE_LABELS = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
  D: 'Classe D'
};

export const CLASSE_SHORT_LABELS = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
  D: 'Classe D'
};
