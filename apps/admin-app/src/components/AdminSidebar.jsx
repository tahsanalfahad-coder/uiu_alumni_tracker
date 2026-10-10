import React from 'react';
import { LayoutDashboard, UserCheck, Users, Calendar, FileText, LogOut } from 'lucide-react';
import './AdminSidebar.css';

export default function AdminSidebar({
  activeTab,
  onTabSelect,
  onLogout,
  sidebarOpen,
  onCloseMobile,
  pendingRegistrationsCount = 0,
  pendingEventRequestsCount = 0
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'registrations', label: 'Registration Queue', icon: UserCheck, badge: pendingRegistrationsCount, badgeType: 'danger' },
    { id: 'alumni-records', label: 'Alumni Records', icon: Users },
    { id: 'event-mgmt', label: 'Event Management', icon: Calendar, badge: pendingEventRequestsCount, badgeType: 'warning' },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText }
  ];

  return (
    <>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-nav-group">
            <span className="sidebar-nav-header">Admin Navigation</span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const hasBadge = item.badge && item.badge > 0;
              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onTabSelect(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {hasBadge && (
                    <span className={`sidebar-badge ${item.badgeType}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={onLogout}>
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
