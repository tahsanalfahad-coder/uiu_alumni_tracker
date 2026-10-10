import React, { useState } from 'react';
import { GraduationCap, LogIn, User, LogOut, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@uiu/ui';
import './Navbar.css';

export default function Navbar({
  currentRole = 'guest', // guest | alumni | student
  onRoleChange,
  activeTab = 'home',
  onNavClick,
  onOpenAuthModal,
  mobileSidebarToggle,
  currentUser
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getRoleDotColor = (role) => {
    switch (role) {
      case 'alumni': return 'var(--color-gold-500)';
      case 'student': return 'var(--role-student-color)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'alumni': return 'Verified Alumni';
      case 'student': return 'Current Student';
      default: return 'Guest';
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Left: 3-line hamburger menu button + Brand logo */}
        <div className="navbar-brand-group">
          {currentRole !== 'guest' && mobileSidebarToggle && (
            <button
              className="menu-toggle-btn"
              onClick={mobileSidebarToggle}
              aria-label="Toggle navigation menu"
              title="Toggle Navigation Menu"
            >
              <Menu size={22} />
            </button>
          )}

          <div className="navbar-logo" onClick={() => onNavClick && onNavClick('home')}>
            <div className="logo-icon-box">
              <GraduationCap size={22} className="logo-cap" />
            </div>
            <div className="logo-text-box">
              <span className="brand-wordmark">UIU Alumni</span>
              <span className="brand-subtext">Tracker Portal</span>
            </div>
          </div>
        </div>

        {/* Center: Guest navigation links */}
        {currentRole === 'guest' && (
          <nav className="navbar-center-nav">
            <button
              className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => onNavClick('home')}
            >
              Home
            </button>
            <button
              className={`nav-link ${activeTab === 'success-stories' ? 'active' : ''}`}
              onClick={() => onNavClick('success-stories')}
            >
              Success Stories
            </button>
            <button
              className={`nav-link ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => onNavClick('achievements')}
            >
              University Achievements
            </button>
            <button
              className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => onNavClick('events')}
            >
              Events
            </button>
          </nav>
        )}

        {/* Right: Auth button or Logged-in User Profile dropdown */}
        <div className="navbar-right">
          {currentRole === 'guest' ? (
            <Button
              variant="accent"
              size="sm"
              icon={LogIn}
              onClick={() => onOpenAuthModal('alumni', 'signin')}
            >
              Sign In
            </Button>
          ) : (
            <div className="user-profile-menu-wrap">
              <button
                className="user-profile-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div
                  className="user-role-dot"
                  style={{ backgroundColor: getRoleDotColor(currentRole) }}
                />
                <span className="user-profile-label">{getRoleLabel(currentRole)}</span>
                <ChevronDown size={14} />
              </button>

              {userMenuOpen && (
                <div className="user-menu-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-user-name">
                      {currentUser?.name || (currentRole === 'alumni' ? 'Tanvir Ahmed' : 'Shakil Ahmed')}
                    </span>
                    <span className="dropdown-user-role">{getRoleLabel(currentRole)}</span>
                  </div>
                  {currentRole === 'alumni' && (
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavClick('profile');
                      }}
                    >
                      <User size={16} /> My Profile
                    </button>
                  )}
                  <button
                    className="dropdown-item dropdown-item-danger"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onRoleChange('guest');
                    }}
                  >
                    <LogOut size={16} /> Logout to Guest Mode
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
