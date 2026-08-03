'use client';

import { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { useBusinessProfileQuery } from '@/hooks/server-state/useBusinessProfileQuery';
import { getDemoTestDataModeStatus } from '@/lib/config/demoTestDataMode';
import { DEFAULT_PUBLIC_BUSINESS_SLUG } from '@/lib/config/businessSlug';

const BusinessProfileContext = createContext(null);

function BusinessProfileError({ error }) {
  return (
    <main className="min-h-screen bg-surface-app p-6 text-text-primary">
      <div className="mx-auto max-w-2xl rounded border border-border-danger bg-surface-danger p-4">
        <h1 className="text-lg font-semibold text-text-danger">Integration configuration error</h1>
        <p className="mt-2 text-sm text-text-danger">{error.message}</p>
        <pre className="mt-3 whitespace-pre-wrap rounded bg-surface-sidebar p-3 text-xs text-text-primary">
          {JSON.stringify({ code: error.code, kind: error.kind, details: error.details }, null, 2)}
        </pre>
      </div>
    </main>
  );
}

function BusinessProfileLoading() {
  return (
    <main className="min-h-screen bg-surface-app p-6 text-text-primary">
      <div className="mx-auto max-w-2xl rounded border border-border-subtle bg-surface-panel p-4 text-sm text-text-secondary">
        Loading BusinessProfile...
      </div>
    </main>
  );
}

export function BusinessProfileProvider({ profile: fallbackProfile, children }) {
  const modeStatus = getDemoTestDataModeStatus();
  const pathname = usePathname();
  const routeBusinessSlug = pathname?.startsWith('/admin') || pathname === '/' || pathname?.startsWith('/agendar')
    ? (process.env.NEXT_PUBLIC_ADMIN_BUSINESS_SLUG || 'turagua')
    : '';
  const businessSlug = routeBusinessSlug || DEFAULT_PUBLIC_BUSINESS_SLUG || fallbackProfile?.businessSlug;
  const profileQuery = useBusinessProfileQuery({ businessSlug });

  if (!modeStatus.valid) {
    return <BusinessProfileError error={modeStatus.error} />;
  }

  if (profileQuery.isPending) {
    return <BusinessProfileLoading />;
  }

  if (profileQuery.error) {
    return <BusinessProfileError error={profileQuery.error} />;
  }

  const profile = profileQuery.data?.businessProfile;

  return (
    <BusinessProfileContext.Provider value={{ profile, executionContext: profileQuery.data?.executionContext || null, refetchProfile: profileQuery.refetch }}>
      {children}
    </BusinessProfileContext.Provider>
  );
}

export function useBusinessProfile() {
  const context = useContext(BusinessProfileContext);
  
  if (!context) {
    throw new Error('useBusinessProfile must be used within BusinessProfileProvider');
  }
  
  return context;
}
