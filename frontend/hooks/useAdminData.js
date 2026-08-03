'use client';

import { useEffect, useState } from 'react';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { adminDataRepository } from '@/lib/admin/adminDataRepository';

export function useAdminData() {
  const { profile } = useBusinessProfile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!profile?.businessSlug) return;

      setLoading(true);
      setError(null);

      try {
        const snapshot = await adminDataRepository.getSnapshot({ businessSlug: profile.businessSlug });
        if (!cancelled) {
          setData(snapshot);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (profile?.businessSlug) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [profile?.businessSlug, reloadToken]);

  return {
    data,
    loading,
    error,
    businessSlug: profile?.businessSlug,
    reload: () => setReloadToken((value) => value + 1),
  };
}
