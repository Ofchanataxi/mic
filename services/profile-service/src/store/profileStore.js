const profiles = new Map();

export function saveProfile(profile) {
  profiles.set(profile.id, profile);
  return profile;
}

export function getProfile(profileId) {
  return profiles.get(profileId) ?? null;
}
