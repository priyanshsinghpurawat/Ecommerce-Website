import { useState, useCallback } from 'react';
import { getProfile } from '../services/user.service.js';

const profileCache = {
  data: null,
  timestamp: 0,
  inflight: null,
  ttl: 5 * 60 * 1000,
};

export const useProfile = () => {
  const [profile, setProfile] = useState(profileCache.data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    const now = Date.now();
    if (profileCache.data && now - profileCache.timestamp < profileCache.ttl) {
      setProfile(profileCache.data);
      return profileCache.data;
    }

    if (profileCache.inflight) {
      try {
        const data = await profileCache.inflight;
        setProfile(data);
        return data;
      } catch {
        return null;
      }
    }

    setLoading(true);
    setError(null);

    const fetchPromise = getProfile()
      .then((response) => {
        const data = response?.data || null;
        profileCache.data = data;
        profileCache.timestamp = Date.now();
        setProfile(data);
        return data;
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to fetch profile.');
        profileCache.data = null;
        setProfile(null);
        return null;
      })
      .finally(() => {
        setLoading(false);
        profileCache.inflight = null;
      });

    profileCache.inflight = fetchPromise;
    return fetchPromise;
  }, []);

  const invalidateProfile = useCallback(() => {
    profileCache.data = null;
    profileCache.timestamp = 0;
  }, []);

  return { profile, loading, error, fetchProfile, invalidateProfile };
};
