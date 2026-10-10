import React from 'react';
import {
  Users, Briefcase, GraduationCap, Calendar, MessageSquare,
  User, Clock, Heart, LogOut, PlusCircle
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({
  currentRole = 'alumni',
  activeTab = 'profile',
  onTabSelect,
  onLogout,
  sidebarOpen = true,
  onCloseMobile,
  pendingMentorshipCount = 0,
  unreadChatCount = 0,
  pendingEventsCount = 0
}) {
  const getNavItems = () => {
    if (currentRole === 'student') {
      return [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'directory', label: 'Alumni Directory', icon: Users },
        { id: 'jobs', label: 'Job Opportunities', icon: Briefcase },
        { id: 'mentorship', label: 'Mentorship', icon: GraduationCap, badge: pendingMentorshipCount, badgeType: 'info' },
        { id: 'events', label: 'Events', icon: Calendar },
        { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unreadChatCount, badgeType: 'danger' }
      ];
    }
    if (currentRole === 'alumni') {
      return [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'directory', label: 'Alumni Directory', icon: Users },
        { id: 'timeline', label: 'Career Timeline', icon: Clock },
        { id: 'mentorship', label: 'Mentorship', icon: GraduationCap, badge: pendingMentorshipCount, badgeType: 'warning' },
        { id: 'post-jobs', label: 'Post Jobs', icon: Briefcase },
        { id: 'donate', label: 'Donate', icon: Heart },
        { id: 'events', label: 'Events', icon: Calendar, badge: pendingEventsCount, badgeType: 'info' },
        { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unreadChatCount, badgeType: 'danger' }
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="sidebar-header">
          <span className="eyebrow-label">
            {currentRole.toUpperCase()} NAVIGATION
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const hasBadge = item.badge && item.badge > 0;
            return (
              <button
                key={item.id}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onTabSelect(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
              >
                <div className="sidebar-active-bar" />
                <Icon size={18} className="sidebar-icon" />
                <span className="sidebar-label">{item.label}</span>
                {hasBadge && (
                  <span className={`sidebar-nav-badge ${item.badgeType}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {currentRole === 'alumni' && activeTab === 'events' && (
            <div className="sidebar-shortcut-box">
              <button
                className="sidebar-shortcut-btn"
                onClick={() => {
                  onTabSelect('create-event-wizard');
                  if (onCloseMobile) onCloseMobile();
                }}
              >
                <PlusCircle size={16} />
                <span>Create Personal Event</span>
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout to Guest</span>
          </button>
        </div>
      </aside>
    </>
  );
}
