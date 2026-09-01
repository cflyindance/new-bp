import Big from 'big.js';

export default function safeBig(value, fallback = 0) {
  try {
    return Big(value ?? fallback);
  } catch (error) {
    return Big(fallback);
  }
}
