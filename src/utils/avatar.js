/**
 * Helper to get a teacher's display avatar.
 * Uses their actual uploaded image if submitted, or cleanly falls back to
 * a branded initials placeholder if they haven't uploaded an image.
 * Explicitly rejects AI-generated images and stock placeholder URLs.
 */

const REJECTED_PATTERNS = [
  'unsplash.com',
  'photo-',
  'v1792159',
  'ekb2uxzepcz2cyl79d99',
  'gr8kdtbut0mm0oyr87uh',
  'ywftcvfkiypy6nwlzuyl',
  'uhh3vabvc08i1ukgefdz',
  's8x3upcakgfaksbhnv38',
  'fmyjjovymarmn7almbg5',
  'aaqlqy5vbyaaectrkwe5',
  'v33k30ec1dykr8fvstwc',
  'evn2aha8ohnhzl1yllih',
  'leuhhovqy481gj7gnq9n',
  't7osrcncmeweybsguwqz',
  'lbjqorktmrzghfwlfdpp',
  'yfk97qh8g7ekbaaif9od'
];

export function isRealTeacherAvatar(avatar) {
  if (!avatar || typeof avatar !== 'string') return false;
  const clean = avatar.trim();
  if (!clean) return false;
  for (const pattern of REJECTED_PATTERNS) {
    if (clean.includes(pattern)) return false;
  }
  return true;
}

export function getTeacherAvatar(avatar, name = 'Tutor') {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Tutor')}&background=1B3B2B&color=fff&size=200&bold=true`;
  if (!isRealTeacherAvatar(avatar)) {
    return fallback;
  }
  return avatar.trim();
}

/**
 * Image onError handler to ensure smooth fallback if an image URL fails to load.
 */
export const handleAvatarError = (name = 'Tutor') => (e) => {
  if (e && e.currentTarget) {
    e.currentTarget.onerror = null;
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Tutor')}&background=1B3B2B&color=fff&size=200&bold=true`;
  }
};
