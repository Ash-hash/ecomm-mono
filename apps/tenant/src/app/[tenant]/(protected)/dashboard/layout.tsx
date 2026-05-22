'use client';

import { use, useEffect } from 'react';
import { useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { authApi } from '@repo/api-client';
import { tenantPath } from '@/src/app/utils/tenant';

type NavItemType = {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
};

function NavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItemType;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: collapsed ? '10px' : '9px 12px',
        borderRadius: 9,
        border: 'none',
        cursor: 'pointer',
        background: active ? 'rgba(167,139,250,0.12)' : 'transparent',
        color: active ? '#a78bfa' : '#4b4b6b',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative',
        transition: 'all 0.15s ease',
        textAlign: 'left',
      }}
    >
      {active && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: 2,
            borderRadius: 2,
            background: '#a78bfa',
          }}
        />
      )}

      <span
        style={{
          fontSize: 15,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {item.icon}
      </span>

      {!collapsed && (
        <>
          <span style={{ flex: 1 }}>{item.label}</span>

          {item.badge && (
            <span
              style={{
                background: '#a78bfa',
                color: '#0a0a10',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 7px',
                lineHeight: '16px',
              }}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;

  params: Promise<{
    tenant: string;
  }>;
}) {
  // ✅ Next.js 15 async params fix
  const resolvedParams = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const tenant = resolvedParams?.tenant ?? '';
  const tenantName = useMemo(() => tenant.toUpperCase(), [tenant]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ tenant-safe navigation
  const NAV_ITEMS: NavItemType[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: tenantPath('/dashboard'),
        icon: '◈',
      },

      {
        id: 'orders',
        label: 'Orders',
        href: tenantPath('/dashboard/orders'),
        icon: '⊡',
        badge: 3,
      },

      {
        id: 'products',
        label: 'Products',
        href: tenantPath('/dashboard/products'),
        icon: '⊞',
      },

      {
        id: 'categories',
        label: 'Categories',
        href: tenantPath('/dashboard/categories'),
        icon: '⊟',
      },

      {
        id: 'users',
        label: 'Users',
        href: tenantPath('/dashboard/users'),
        icon: '⊕',
      },

      {
        id: 'subscriptions',
        label: 'Subscriptions',
        href: tenantPath('/dashboard/subscriptions'),
        icon: '⊗',
      },

      {
        id: 'payments',
        label: 'Payments',
        href: tenantPath('/dashboard/payments'),
        icon: '⊘',
      },

      {
        id: 'store',
        label: 'Store Config',
        href: tenantPath('/dashboard/store'),
        icon: '⊙',
      },

      {
        id: 'offers',
        label: 'Offers',
        href: tenantPath('/dashboard/offers'),
        icon: '@',
      },
    ],
    [tenant],
  );

  // ✅ active route detection
  const activeId = !mounted
    ? ''
    : ([...NAV_ITEMS]
        .sort((a, b) => b.href.length - a.href.length)
        .find((n) => {
          if (n.href === tenantPath('/dashboard')) {
            return pathname === n.href;
          }

          return pathname === n.href || pathname.startsWith(`${n.href}/`);
        })?.id ?? 'dashboard');

  const activeItem = NAV_ITEMS.find((n) => n.id === activeId);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#07070e',
        fontFamily: "'DM Mono', 'Fira Code', monospace",
        color: '#f0f0f8',
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: collapsed ? 60 : 220,
          background: '#09090f',
          borderRight: '1px solid #12121e',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
          zIndex: 40,
        }}
      >
        {/* LOGO */}
        <div
          style={{
            padding: collapsed ? '20px 0' : '20px 16px',
            borderBottom: '1px solid #12121e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            minHeight: 65,
          }}
        >
          {!collapsed && (
            <span
              style={{
                color: '#c0c0d8',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {tenantName}
            </span>
          )}

          <button
            onClick={() => setCollapsed((p) => !p)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b6b8b',
              cursor: 'pointer',
            }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* NAV */}
        <nav
          style={{
            flex: 1,
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflowY: 'auto',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={activeId === item.id}
              collapsed={collapsed}
              onClick={() => router.push(item.href)}
            />
          ))}
        </nav>

        {/* FOOTER */}
        <div
          style={{
            padding: collapsed ? '12px 0' : '12px 14px',
            borderTop: '1px solid #12121e',
          }}
        >
          <button
            onClick={() => authApi.logout()}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid #1a1a28',
              borderRadius: 9,
              padding: '8px 12px',
              color: '#4b4b6b',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* TOPBAR */}
        <header
          style={{
            background: '#09090f',
            borderBottom: '1px solid #12121e',
            padding: '0 28px',
            height: 65,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div>
            <div
              style={{
                color: '#f0f0f8',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {activeItem?.label ?? 'Dashboard'}
            </div>

            <div
              style={{
                color: '#2a2a3e',
                fontSize: 11,
                marginTop: 1,
              }}
            >
              Tenant: {tenantName}
            </div>
          </div>
        </header>

        {/* PAGE */}
        <main
          style={{
            flex: 1,
            padding: '28px 32px',
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
