import React, { useState, useEffect } from 'react';
import { apiClient } from '@uiu/ui';
import AdminLogin from './components/AdminLogin';
import AdminNavbar from './components/AdminNavbar';
import AdminSidebar from './components/AdminSidebar';

import AdminDashboard from './pages/AdminDashboard';
import AdminRegistrations from './pages/AdminRegistrations';
import AdminAlumniRecords from './pages/AdminAlumniRecords';
import AdminEventMgmt from './pages/AdminEventMgmt';
import AdminReports from './pages/AdminReports';

import '@uiu/ui/styles/theme.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const user = apiClient.getUser();
    return user && user.role === 'admin' ? user : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dynamic state
  const [alumniList, setAlumniList] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [eventList, setEventList] = useState([]);
  const [pendingEventRequests, setPendingEventRequests] = useState([]);
  const [toastNotification, setToastNotification] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Auto dismiss toast after 6 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const fetchAllData = async () => {
    try {
      const [alumni, pending, events, eventRequests] = await Promise.all([
        apiClient.get('/api/alumni'),
        apiClient.get('/api/admin/registrations'),
        apiClient.get('/api/events'),
        apiClient.get('/api/events/personal-requests')
      ]);

      const newPending = pending || [];
      const newEventRequests = eventRequests || [];

      // Check if new pending items arrived compared to current state
      setPendingRegistrations((prev) => {
        const prevPendingCount = prev.filter((r) => (r.status || 'Pending') === 'Pending').length;
        const newPendingCount = newPending.filter((r) => (r.status || 'Pending') === 'Pending').length;
        if (prev.length > 0 && newPendingCount > prevPendingCount) {
          setToastNotification({
            title: '🎓 New Alumni Registration Pending!',
            message: 'A new alumni has registered and is waiting for your verification.',
            tab: 'registrations'
          });
        }
        return newPending;
      });

      setPendingEventRequests((prev) => {
        const prevEventCount = prev.filter((r) => (r.status || 'Pending') === 'Pending').length;
        const newEventCount = newEventRequests.filter((r) => (r.status || 'Pending') === 'Pending').length;
        if (prev.length > 0 && newEventCount > prevEventCount) {
          setToastNotification({
            title: '📅 New Event Proposal Pending!',
            message: 'An alumnus has submitted a new campus event proposal for approval.',
            tab: 'event-mgmt'
          });
        }
        return newEventRequests;
      });

      setAlumniList(alumni || []);
      setEventList(events || []);
    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
    }
  };

  const pendingRegistrationsCount = pendingRegistrations.filter(
    (r) => (r.status || 'Pending') === 'Pending'
  ).length;

  const pendingEventRequestsCount = pendingEventRequests.filter(
    (r) => (r.status || 'Pending') === 'Pending'
  ).length;

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    apiClient.clearSession();
    setCurrentUser(null);
  };

  // Registrations Actions
  const handleApproveRegistration = async (id) => {
    try {
      await apiClient.patch(`/api/admin/registrations/${id}/approve`);
      alert('Alumni registration approved successfully!');
      fetchAllData();
    } catch (err) {
      alert(err.message || 'Failed to approve registration');
    }
  };

  const handleDeclineRegistration = async (id) => {
    try {
      await apiClient.patch(`/api/admin/registrations/${id}/decline`);
      alert('Alumni registration declined');
      fetchAllData();
    } catch (err) {
      alert(err.message || 'Failed to decline registration');
    }
  };

  // Event Actions
  const handleAddEvent = async (newEvent) => {
    try {
      const created = await apiClient.post('/api/events', newEvent);
      setEventList([created, ...eventList]);
      alert('Campus event published!');
    } catch (err) {
      alert(err.message || 'Failed to create event');
    }
  };

  const handleRemoveEvent = async (id) => {
    try {
      await apiClient.delete(`/api/events/${id}`);
      setEventList(eventList.filter((e) => (e._id || e.id) !== id));
      alert('Event deleted');
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleApproveEventRequest = async (id) => {
    try {
      await apiClient.patch(`/api/events/personal-requests/${id}/approve`);
      alert('Alumni event proposal approved and published to calendar!');
      fetchAllData();
    } catch (err) {
      alert(err.message || 'Failed to approve event request');
    }
  };

  const handleDeclineEventRequest = async (id) => {
    try {
      await apiClient.patch(`/api/events/personal-requests/${id}/decline`);
      alert('Alumni event proposal declined');
      fetchAllData();
    } catch (err) {
      alert(err.message || 'Failed to decline event request');
    }
  };

  const handleSendSuggestion = async (id, suggestionText) => {
    try {
      await apiClient.patch(`/api/events/personal-requests/${id}/decline`, { suggestion: suggestionText });
      alert('Feedback suggestion sent to alumnus');
      fetchAllData();
    } catch (err) {
      alert(err.message || 'Failed to send suggestion');
    }
  };

  if (!currentUser) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <AdminNavbar
        currentUser={currentUser}
        onLogout={handleLogout}
        mobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        pendingRegistrationsCount={pendingRegistrationsCount}
        pendingEventRequestsCount={pendingEventRequestsCount}
        onNavClick={setActiveTab}
      />

      <div className="app-body">
        <AdminSidebar
          activeTab={activeTab}
          onTabSelect={setActiveTab}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          pendingRegistrationsCount={pendingRegistrationsCount}
          pendingEventRequestsCount={pendingEventRequestsCount}
        />

        <main className={`main-content ${sidebarOpen ? 'main-content-with-sidebar' : ''}`}>
          {activeTab === 'dashboard' && (
            <AdminDashboard
              alumniList={alumniList}
              pendingRegistrations={pendingRegistrations}
              eventList={eventList}
              onNavSelect={setActiveTab}
            />
          )}

          {activeTab === 'registrations' && (
            <AdminRegistrations
              pendingList={pendingRegistrations}
              onApprove={handleApproveRegistration}
              onDecline={handleDeclineRegistration}
            />
          )}

          {activeTab === 'alumni-records' && <AdminAlumniRecords alumniList={alumniList} />}

          {activeTab === 'event-mgmt' && (
            <AdminEventMgmt
              eventList={eventList}
              pendingEventRequests={pendingEventRequests}
              onAddEvent={handleAddEvent}
              onRemoveEvent={handleRemoveEvent}
              onApproveEventRequest={handleApproveEventRequest}
              onDeclineEventRequest={handleDeclineEventRequest}
              onSendSuggestion={handleSendSuggestion}
            />
          )}

          {activeTab === 'reports' && <AdminReports />}
        </main>
      </div>

      {/* Admin Real-time Toast Alert */}
      {toastNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '16px 20px',
            borderRadius: '14px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            border: '1px solid #ef4444',
            cursor: 'pointer',
            maxWidth: '380px'
          }}
          onClick={() => {
            if (toastNotification.tab) setActiveTab(toastNotification.tab);
            setToastNotification(null);
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#f87171' }}>
              {toastNotification.title}
            </div>
            <div style={{ fontSize: '13px', marginTop: '3px', color: '#e2e8f0', lineHeight: '1.4' }}>
              {toastNotification.message}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToastNotification(null);
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              lineHeight: '1'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
