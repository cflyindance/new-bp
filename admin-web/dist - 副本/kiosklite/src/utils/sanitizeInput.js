import emojiRegex from 'emoji-regex';

export function removeEmoji(value = '') {
  return String(value).replace(emojiRegex(), '');
}
