import React from 'react';
import { Badge, Button } from '@uiu/ui';
import { ShieldCheck, LogOut, Menu, Bell } from 'lucide-react';
import './AdminNavbar.css';

export default function AdminNavbar({
  currentUser,
  onLogout,
  mobileSidebarToggle,
  pendingRegistrationsCount = 0,
  pendingEventRequestsCount = 0,
  onNavClick
}) {
  const totalPending = pendingRegistrationsCount + pendingEventRequestsCount;

  return (
    <header className="admin-navbar">
      <div className="admin-nav-left">
        <button className="mobile-menu-btn" onClick={mobileSidebarToggle}>
          <Menu size={20} />
        </button>
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <ShieldCheck size={22} color="#D97706" />
          </div>
          <div>
            <span className="brand-title">UIU Admin Portal</span>
            <span className="brand-subtitle">Alumni Management Office</span>
          </div>
        </div>
      </div>

      <div className="admin-nav-right">
        {totalPending > 0 && (
          <button
            onClick={() => onNavClick && onNavClick(pendingRegistrationsCount > 0 ? 'registrations' : 'event-mgmt')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={`${pendingRegistrationsCount} pending alumni, ${pendingEventRequestsCount} pending events`}
          >
            <Bell size={15} className="animate-pulse" />
            <span>{totalPending} Action{totalPending > 1 ? 's' : ''} Needed</span>
          </button>
        )}

        <Badge variant="danger" size="md">
          <ShieldCheck size={14} /> Super Admin
        </Badge>
        <span className="admin-user-email">{currentUser?.email || 'admin@uiu.ac.bd'}</span>
        <Button variant="outline" size="sm" icon={LogOut} onClick={onLogout}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
