import { useEffect, useMemo, useState } from 'react';
import initialShots from '../data/shots.json';
import type { Shot, Status } from '../types';

const STORAGE_KEY = 'comic-factory.shots.v1';

function loadShots(): Shot[] {
  if (typeof window === 'undefined') {
    return initialShots as Shot[];
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return initialShots as Shot[];
  }

  try {
    return JSON.parse(saved) as Shot[];
  } catch {
    return initialShots as Shot[];
  }
}

export function useShotStore() {
  const [shots, setShots] = useState<Shot[]>(loadShots);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shots));
  }, [shots]);

  const actions = useMemo(() => {
    function setShotStatus(shotId: string, status: Status) {
      setShots((current) => current.map((shot) => (
        shot.id === shotId ? { ...shot, status } : shot
      )));
    }

    function setVariantStatus(shotId: string, variantId: string, status: Status) {
      setShots((current) => current.map((shot) => {
        if (shot.id !== shotId) return shot;

        const variants = shot.variants.map((variant) => ({
          ...variant,
          status: variant.variant_id === variantId ? status : variant.status
        }));

        return { ...shot, variants };
      }));
    }

    function approveShot(shotId: string) {
      setShotStatus(shotId, 'approved');
    }

    function rejectShot(shotId: string) {
      setShotStatus(shotId, 'rejected');
    }

    function markNeedsFix(shotId: string) {
      setShotStatus(shotId, 'needs_fix');
    }

    function resetShots() {
      setShots(initialShots as Shot[]);
      window.localStorage.removeItem(STORAGE_KEY);
    }

    return {
      setShotStatus,
      setVariantStatus,
      approveShot,
      rejectShot,
      markNeedsFix,
      resetShots
    };
  }, []);

  return { shots, ...actions };
}
