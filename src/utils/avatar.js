/**
 * Helper to get a teacher's display avatar.
 * Uses their actual uploaded image if present, or cleanly falls back to
 * a branded initials placeholder if they haven't uploaded an image.
 */
export function getTeacherAvatar(avatar, name = 'Tutor') {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Tutor')}&background=1B3B2B&color=fff&size=200&bold=true`;
  if (!avatar || typeof avatar !== 'string') {
    return fallback;
  }
  const clean = avatar.trim();
  // Filter out empty strings, unsplash placeholders, or corrupted URLs
  if (
    !clean ||
    clean.includes('unsplash.com') ||
    clean.includes('photo-1573496359142') ||
    clean.includes('photo-1500648767791') ||
    clean.includes('photo-1472099645785')
  ) {
    return fallback;
  }
  return clean;
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
