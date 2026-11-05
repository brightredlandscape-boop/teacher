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
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop', // Adenike / female educator with glasses
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop', // Aniebietobong / male educator
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop', // Blessing / female educator
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=600&auto=format&fit=crop', // Christian / male educator
  'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=600&auto=format&fit=crop', // Ruth / female educator
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop', // Daniel / male educator
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=600&auto=format&fit=crop', // Enobong / female educator
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop', // Edidiong / male educator
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=600&auto=format&fit=crop', // Laura / female educator
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop', // Dr. Chidi / senior lecturer
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop', // Joy / female educator
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop'  // Editi / male STEM educator
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
  if (nameLower.includes('aniebietobong')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop';
  }
  if (nameLower.includes('blessing')) {
    return 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop';
  }
  if (nameLower.includes('ruth')) {
    return 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=600&auto=format&fit=crop';
  }
  if (nameLower.includes('enobong')) {
    return 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=600&auto=format&fit=crop';
  }
  if (nameLower.includes('christian')) {
    return 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=600&auto=format&fit=crop';
  }
  if (nameLower.includes('edidiong')) {
    return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop';
  }
  if (nameLower.includes('laura')) {
    return 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=600&auto=format&fit=crop';
  }
  if (nameLower.includes('chidi')) {
    return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop';
  }
  if (nameLower.includes('joy')) {
    return 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop';
  }
  if (nameLower.includes('editi')) {
    return 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop';
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
    e.currentTarget.src = getTeacherAvatar(null, name);
  }
};
