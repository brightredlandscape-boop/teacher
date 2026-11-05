/**
 * Helper to get a teacher's display avatar.
 * Uses their actual uploaded image if submitted, or cleanly falls back to
 * a high-quality educator portrait.
 */

const REJECTED_PATTERNS = [
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

export const EDUCATOR_PORTRAITS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=600&auto=format&fit=crop'
];

export function isRealTeacherAvatar(avatar) {
  if (!avatar || typeof avatar !== 'string') return false;
  const clean = avatar.trim();
  if (!clean) return false;
  if (clean.includes('ui-avatars.com')) return false;
  for (const pattern of REJECTED_PATTERNS) {
    if (clean.includes(pattern)) return false;
  }
  return true;
}

export function getTeacherAvatar(avatar, name = 'Tutor') {
  if (isRealTeacherAvatar(avatar)) {
    return avatar.trim();
  }
  const nameClean = (name || '').trim();
  const nameLower = nameClean.toLowerCase();
  if (nameLower.includes('adenike')) {
    return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop';
  }
  let hash = 0;
  for (let i = 0; i < nameClean.length; i++) {
    hash = (hash + nameClean.charCodeAt(i)) % EDUCATOR_PORTRAITS.length;
  }
  return EDUCATOR_PORTRAITS[hash] || EDUCATOR_PORTRAITS[0];
}

/**
 * Image onError handler to ensure smooth fallback if an image URL fails to load.
 */
export const handleAvatarError = (name = 'Tutor') => (e) => {
  if (e && e.currentTarget) {
    e.currentTarget.onerror = null;
    const nameClean = (name || '').trim();
    const nameLower = nameClean.toLowerCase();
    if (nameLower.includes('adenike')) {
      e.currentTarget.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop';
    } else {
      let hash = 0;
      for (let i = 0; i < nameClean.length; i++) {
        hash = (hash + nameClean.charCodeAt(i)) % EDUCATOR_PORTRAITS.length;
      }
      e.currentTarget.src = EDUCATOR_PORTRAITS[hash] || EDUCATOR_PORTRAITS[0];
    }
  }
};
