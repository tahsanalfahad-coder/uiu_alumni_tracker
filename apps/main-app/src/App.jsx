import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, ChatPane, apiClient } from '@uiu/ui';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import AuthModal from './components/common/AuthModal';
import { initSocket, disconnectSocket, getSocket } from './socket';

// Guest Pages
import GuestHome from './pages/guest/GuestHome';
import GuestSuccessStories from './pages/guest/GuestSuccessStories';
import GuestAchievements from './pages/guest/GuestAchievements';
import GuestEventsView from './pages/guest/GuestEventsView';

// Student Pages
import AlumniDirectory from './pages/student/AlumniDirectory';
import JobOpportunities from './pages/student/JobOpportunities';
import StudentMentorship from './pages/student/StudentMentorship';
import StudentProfile from './pages/student/StudentProfile';

// Alumni Pages
import AlumniProfile from './pages/alumni/AlumniProfile';
import AlumniCareerTimeline from './pages/alumni/AlumniCareerTimeline';
import AlumniMentorship from './pages/alumni/AlumniMentorship';
import AlumniPostJobs from './pages/alumni/AlumniPostJobs';
import AlumniDonate from './pages/alumni/AlumniDonate';
import AlumniPersonalEventWizard from './pages/alumni/AlumniPersonalEventWizard';

import { Calendar, Clock, MapPin, Plus, Ticket, CheckCircle } from 'lucide-react';
import '@uiu/ui/styles/theme.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => apiClient.getUser());
  const [currentRole, setCurrentRole] = useState(() => {
    const u = apiClient.getUser();
    return u?.role ? u.role : 'guest';
  });
  const [activeTab, setActiveTab] = useState(() => (currentRole === 'guest' ? 'home' : 'profile'));
  const [myProfile, setMyProfile] = useState(null);

  // Auth modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState('alumni');
  const [authInitialMode, setAuthInitialMode] = useState('signin');

  // Sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dynamic Data States (fetched from server)
  const [alumniList, setAlumniList] = useState([]);
  const [jobList, setJobList] = useState([]);
  const [eventList, setEventList] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [chatThreads, setChatThreads] = useState([]);
  const [donations, setDonations] = useState({ totalDonated: 0, history: [] });
  const [pendingEventRequests, setPendingEventRequests] = useState([]);
  const [toastNotification, setToastNotification] = useState(null);

  // Auto-dismiss toast notification after 6 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Fetch public data on mount & role change
  useEffect(() => {
    fetchAlumni();
    fetchJobs();
    fetchEvents();

    if (currentRole !== 'guest') {
      fetchMyProfile();
      fetchChatThreads();
      const token = apiClient.getToken();
      if (token) {
        const socket = initSocket(token);

        socket.on('new_thread', ({ thread }) => {
          if (!thread) return;
          const threadId = thread._id || thread.id;
          socket.emit('join_thread', threadId);

          setChatThreads((prev) => {
            const exists = prev.some((t) => (t._id || t.id) === threadId);
            if (exists) return prev;
            return [thread, ...prev];
          });

          const myId = currentUser?.id || currentUser?._id;
          if (thread.creatorId && String(thread.creatorId) !== String(myId)) {
            const senderName = thread.displayName || thread.creatorName || 'Someone';
            setToastNotification({
              title: `💬 New Conversation`,
              message: `${senderName}: "${thread.lastMessage || 'Sent you a message'}"`,
              threadId
            });
          }
        });

        socket.on('new_message', ({ threadId, message, thread: incomingThread }) => {
          if (!threadId || !message) return;
          const myId = currentUser?.id || currentUser?._id;
          const isFromMe = String(message.sender) === String(myId);

          setChatThreads((prev) => {
            let targetThread = null;
            const updated = prev.map((t) => {
              const id = t._id || t.id;
              if (id === threadId) {
                const existingMsgs = t.messages || [];
                const isDup = existingMsgs.some(
                  (m) =>
                    (m._id && message._id && String(m._id) === String(message._id)) ||
                    (m.text === message.text && m.timestamp === message.timestamp && String(m.sender) === String(message.sender))
                );
                const newMsgs = isDup ? existingMsgs : [...existingMsgs, message];
                targetThread = {
                  ...t,
                  lastMessage: message.text,
                  lastMessageAt: message.timestamp || 'Just now',
                  messages: newMsgs,
                  updatedAt: new Date().toISOString()
                };
                return targetThread;
              }
              return t;
            });

            if (targetThread) {
              const others = updated.filter((t) => (t._id || t.id) !== threadId);
              return [targetThread, ...others];
            } else if (incomingThread) {
              socket.emit('join_thread', threadId);
              return [incomingThread, ...prev];
            } else {
              fetchChatThreads();
              return prev;
            }
          });

          if (!isFromMe) {
            const senderName = incomingThread?.displayName || 'Someone';
            setToastNotification({
              title: `💬 New Message`,
              message: `${senderName}: "${message.text}"`,
              threadId
            });
          }
        });

        socket.on('event_request_approved', (data) => {
          setToastNotification({
            title: '🎉 Event Proposal Approved!',
            message: data.message || `Your event proposal "${data.title}" was approved by UIU Admin!`
          });
          fetchPersonalEventRequests();
          fetchEvents();
        });

        socket.on('event_request_declined', (data) => {
          setToastNotification({
            title: 'ℹ️ Event Proposal Updated',
            message: data.message || `Your event proposal "${data.title}" was updated by UIU Admin.`
          });
          fetchPersonalEventRequests();
        });
      }
    } else {
      disconnectSocket();
    }

    if (currentRole === 'alumni') {
      fetchPersonalEventRequests();
      fetchMentorshipRequests();
      fetchDonations();
    } else if (currentRole === 'student') {
      fetchMentorshipRequests();
    }
  }, [currentRole]);

  const fetchAlumni = async () => {
    try {
      const data = await apiClient.get('/api/alumni');
      setAlumniList(data || []);
    } catch (err) {
      console.error('Failed to fetch alumni:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await apiClient.get('/api/jobs');
      setJobList(data || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await apiClient.get('/api/events');
      setEventList(data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  const fetchChatThreads = async () => {
    try {
      const data = await apiClient.get('/api/chat/threads');
      setChatThreads(data || []);
      const socket = getSocket();
      if (socket && Array.isArray(data)) {
        data.forEach((t) => socket.emit('join_thread', t._id || t.id));
      }
    } catch (err) {
      console.error('Failed to fetch chat threads:', err);
    }
  };

  const fetchPersonalEventRequests = async () => {
    try {
      const data = await apiClient.get('/api/events/personal-requests');
      setPendingEventRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch event requests:', err);
    }
  };

  const fetchMentorshipRequests = async () => {
    try {
      const data = await apiClient.get('/api/mentorship/requests');
      setMentorshipRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch mentorship requests:', err);
    }
  };

  const fetchDonations = async () => {
    try {
      const data = await apiClient.get('/api/donations/me');
      setDonations(data || { totalDonated: 0, history: [] });
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    }
  };

  const fetchMyProfile = async () => {
    try {
      if (currentRole === 'student') {
        const data = await apiClient.get('/api/student/me');
        setMyProfile(data);
      } else if (currentRole === 'alumni') {
        const data = await apiClient.get('/api/alumni/me');
        setMyProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch my profile:', err);
    }
  };

  // Role Switch / Logout Handler
  const handleRoleChange = (newRole) => {
    if (newRole === 'guest') {
      apiClient.clearSession();
      disconnectSocket();
      setCurrentUser(null);
      setCurrentRole('guest');
      setActiveTab('home');
    } else {
      setCurrentRole(newRole);
      setSidebarOpen(true);
      setActiveTab('profile');
    }
  };

  // Auth Modal Trigger
  const handleOpenAuthModal = (role = 'alumni', mode = 'signin') => {
    setAuthInitialRole(role);
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthenticatedUser = (user) => {
    setCurrentUser(user);
    handleRoleChange(user.role);
  };

  // Jobs
  const handleAddJob = async (newJob) => {
    try {
      const created = await apiClient.post('/api/jobs', newJob);
      setJobList([created, ...jobList]);
    } catch (err) {
      alert(err.message || 'Failed to post job');
    }
  };

  const handleRemoveJob = async (id) => {
    try {
      await apiClient.delete(`/api/jobs/${id}`);
      setJobList(jobList.filter((j) => (j._id || j.id) !== id));
    } catch (err) {
      alert(err.message || 'Failed to remove job');
    }
  };

  // Alumni Event Proposals
  const handleCreateEventRequest = async (newReq) => {
    try {
      const created = await apiClient.post('/api/events/personal-requests', newReq);
      setPendingEventRequests([created, ...pendingEventRequests]);
    } catch (err) {
      alert(err.message || 'Failed to submit event request');
    }
  };

  // Mentorship & Donations
  const handleRequestMentorship = async (reqData) => {
    try {
      const created = await apiClient.post('/api/mentorship/requests', reqData);
      setMentorshipRequests([created, ...mentorshipRequests]);
      alert('Mentorship request sent successfully!');
    } catch (err) {
      alert(err.message || 'Failed to request mentorship');
    }
  };

  const handleAcceptMentorship = async (id) => {
    try {
      const updated = await apiClient.patch(`/api/mentorship/requests/${id}/accept`);
      setMentorshipRequests(
        mentorshipRequests.map((r) => ((r._id || r.id) === id ? updated : r))
      );
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleDeclineMentorship = async (id) => {
    try {
      const updated = await apiClient.patch(`/api/mentorship/requests/${id}/decline`);
      setMentorshipRequests(
        mentorshipRequests.map((r) => ((r._id || r.id) === id ? updated : r))
      );
    } catch (err) {
      alert(err.message || 'Failed to decline request');
    }
  };

  const handleMakeDonation = async (tx) => {
    try {
      const numericAmount = parseInt(tx.amount.toString().replace(/[^0-9]/g, '')) || 0;
      await apiClient.post('/api/donations', {
        fundId: tx.fundId || 'general',
        amount: numericAmount,
        paymentMethod: tx.paymentMethod || 'bKash'
      });
      fetchDonations();
    } catch (err) {
      alert(err.message || 'Failed to process donation');
    }
  };

  // Real-time Chat Handlers
  const handleSendMessage = async (threadId, text) => {
    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('send_message', { threadId, text });
      } else {
        await apiClient.post(`/api/chat/threads/${threadId}/messages`, { text });
        fetchChatThreads();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleOpenChatWithAlumni = async (alumni) => {
    try {
      const res = await apiClient.post('/api/chat/threads', {
        targetUserId: alumni.userId || alumni._id,
        targetName: alumni.name,
        targetAvatar: alumni.avatar,
        targetRole: `${alumni.batch || ''} • ${alumni.company || ''}`,
        initialMessage: 'Hello! I would love to connect with you.'
      });
      await fetchChatThreads();
      const socket = getSocket();
      if (socket && res && (res._id || res.id)) {
        socket.emit('join_thread', res._id || res.id);
      }
      setActiveTab('chat');
    } catch (err) {
      console.error('Failed to open chat thread:', err);
      setActiveTab('chat');
    }
  };

  const handleOpenChatWithStudent = async (reqOrStudent) => {
    try {
      const studentName = reqOrStudent.studentName || reqOrStudent.name || 'Student';
      const studentAvatar = reqOrStudent.studentAvatar || reqOrStudent.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
      const targetUserId = reqOrStudent.studentId || reqOrStudent.studentUserId || reqOrStudent.userId || reqOrStudent._id || reqOrStudent.id;

      const res = await apiClient.post('/api/chat/threads', {
        targetUserId,
        targetName: studentName,
        targetAvatar: studentAvatar,
        targetRole: reqOrStudent.topic ? `Mentorship: ${reqOrStudent.topic}` : 'UIU Student',
        initialMessage: `Hello ${studentName}! I received your mentorship request.`
      });
      await fetchChatThreads();
      const socket = getSocket();
      if (socket && res && (res._id || res.id)) {
        socket.emit('join_thread', res._id || res.id);
      }
      setActiveTab('chat');
    } catch (err) {
      console.error('Failed to open chat thread with student:', err);
      setActiveTab('chat');
    }
  };

  // If in Personal Event Wizard mode, render wizard flow
  if (currentRole === 'alumni' && activeTab === 'create-event-wizard') {
    return (
      <AlumniPersonalEventWizard
        onCancel={() => setActiveTab('events')}
        onPublishEvent={async (newReq) => {
          await handleCreateEventRequest(newReq);
          setActiveTab('events');
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Top Fixed Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        onNavClick={setActiveTab}
        onOpenAuthModal={handleOpenAuthModal}
        mobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        currentUser={currentUser}
      />

      {/* Main Body */}
      <div className="app-body">
        {/* Sidebar (Only when logged in as student or alumni) */}
        {currentRole !== 'guest' && (
          <Sidebar
            currentRole={currentRole}
            activeTab={activeTab}
            onTabSelect={setActiveTab}
            onLogout={() => handleRoleChange('guest')}
            sidebarOpen={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
            pendingMentorshipCount={
              currentRole === 'alumni'
                ? mentorshipRequests.filter((r) => (r.status || 'Pending') === 'Pending').length
                : mentorshipRequests.filter((r) => r.status === 'Accepted').length
            }
            unreadChatCount={chatThreads.filter((t) => (t.unreadCount || 0) > 0).length}
            pendingEventsCount={pendingEventRequests.filter((r) => (r.status || 'Pending') === 'Pending').length}
          />
        )}

        {/* Content View Router */}
        <main
          className={
            currentRole === 'guest'
              ? 'guest-content'
              : `main-content ${sidebarOpen ? 'main-content-with-sidebar' : ''}`
          }
        >
          {/* GUEST VIEWS */}
          {currentRole === 'guest' && (
            <>
              {activeTab === 'home' && (
                <GuestHome
                  alumniList={alumniList}
                  eventList={eventList}
                  onOpenAuthModal={handleOpenAuthModal}
                  onNavSelect={setActiveTab}
                  onSelectAlumniDetail={(alumni) => handleOpenChatWithAlumni(alumni)}
                />
              )}
              {activeTab === 'success-stories' && (
                <GuestSuccessStories
                  alumniList={alumniList}
                  onSelectAlumniDetail={(alumni) => handleOpenChatWithAlumni(alumni)}
                />
              )}
              {activeTab === 'achievements' && <GuestAchievements />}
              {activeTab === 'events' && <GuestEventsView eventList={eventList} />}
            </>
          )}

          {/* STUDENT PORTAL VIEWS */}
          {currentRole === 'student' && (
            <>
              {activeTab === 'profile' && (
                <StudentProfile
                  profile={myProfile || { name: currentUser?.name, email: currentUser?.email }}
                  onUpdateProfile={(updated) => setMyProfile(updated)}
                />
              )}
              {activeTab === 'directory' && (
                <AlumniDirectory
                  alumniList={alumniList}
                  mentorshipRequests={mentorshipRequests}
                  currentUser={currentUser}
                  currentRole={currentRole}
                  myProfile={myProfile}
                  onRequestMentorship={handleRequestMentorship}
                  onOpenChat={handleOpenChatWithAlumni}
                />
              )}
              {activeTab === 'jobs' && <JobOpportunities jobList={jobList} />}
              {activeTab === 'mentorship' && (
                <StudentMentorship
                  requests={mentorshipRequests}
                  alumniList={alumniList}
                  onRequestMentorship={handleRequestMentorship}
                  onOpenChat={handleOpenChatWithAlumni}
                />
              )}
              {activeTab === 'events' && <GuestEventsView eventList={eventList} />}
              {activeTab === 'chat' && (
                <ChatPane
                  initialThreads={chatThreads}
                  currentUserId={currentUser?.id || currentUser?._id}
                  onSendMessage={handleSendMessage}
                />
              )}
            </>
          )}

          {/* ALUMNI PORTAL VIEWS */}
          {currentRole === 'alumni' && (
            <>
              {activeTab === 'profile' && (
                <AlumniProfile
                  alumni={myProfile || alumniList[0] || {}}
                  onUpdateProfile={async (updated) => {
                    try {
                      setMyProfile(updated);
                      fetchAlumni();
                    } catch (err) {
                      alert(err.message || 'Failed to update profile');
                    }
                  }}
                />
              )}
              {activeTab === 'directory' && (
                <AlumniDirectory
                  alumniList={alumniList}
                  mentorshipRequests={mentorshipRequests}
                  currentUser={currentUser}
                  currentRole={currentRole}
                  myProfile={myProfile}
                  onRequestMentorship={handleRequestMentorship}
                  onOpenChat={handleOpenChatWithAlumni}
                />
              )}
              {activeTab === 'timeline' && <AlumniCareerTimeline />}
              {activeTab === 'mentorship' && (
                <AlumniMentorship
                  requests={mentorshipRequests}
                  onAcceptRequest={handleAcceptMentorship}
                  onDeclineRequest={handleDeclineMentorship}
                  onOpenChatWithStudent={handleOpenChatWithStudent}
                />
              )}
              {activeTab === 'post-jobs' && (
                <AlumniPostJobs
                  jobList={jobList}
                  onAddJob={handleAddJob}
                  onRemoveJob={handleRemoveJob}
                />
              )}
              {activeTab === 'donate' && (
                <AlumniDonate
                  donationData={donations}
                  onMakeDonation={handleMakeDonation}
                />
              )}
              {activeTab === 'events' && (
                <div className="alumni-events-container">
                  <div className="page-header-row" style={{ marginBottom: '24px' }}>
                    <div>
                      <h1 className="heading-h1">Alumni Events & Proposals</h1>
                      <p className="text-muted">Propose new campus events for Admin approval or view upcoming gatherings.</p>
                    </div>
                    <Button variant="accent" icon={Plus} onClick={() => setActiveTab('create-event-wizard')}>
                      Create Event Proposal
                    </Button>
                  </div>

                  {/* My Requested Events & Approval Status */}
                  <Card style={{ marginBottom: '32px' }}>
                    <h2 className="heading-h2" style={{ marginBottom: '16px' }}>My Event Proposals & Approval Status</h2>
                    {pendingEventRequests.length === 0 ? (
                      <p className="text-muted italic">No event proposals submitted yet. Click 'Create Event Proposal' above to submit your event!</p>
                    ) : (
                      <div className="pending-events-grid">
                        {pendingEventRequests.map((req) => (
                          <div key={req._id || req.id} className="pending-event-item">
                            <div className="pending-event-top">
                              <h3 className="pending-event-title">{req.title}</h3>
                              <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Declined' ? 'danger' : 'warning'}>
                                Status: {req.status}
                              </Badge>
                            </div>

                            <div className="pending-event-details" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', margin: '8px 0' }}>
                              <span><Calendar size={13} /> Date: <strong>{req.date}</strong></span>
                              <span><Clock size={13} /> Schedule: <strong>{req.time}</strong></span>
                              <span><MapPin size={13} /> Place: <strong>{req.location}</strong></span>
                              <span><Ticket size={13} /> Attend Cost: <strong>{req.cost || 'Free'}</strong></span>
                            </div>

                            <p className="pending-event-desc">{req.description}</p>

                            {req.status === 'Approved' && (
                              <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={16} style={{ color: '#16a34a' }} />
                                <span><strong>Accepted by Admin!</strong> Your event proposal has been approved and published to the university calendar.</span>
                              </div>
                            )}

                            {req.suggestion && (
                              <div className="suggestion-box" style={{ marginTop: '8px' }}>
                                💡 <strong>Admin Feedback / Suggestion:</strong> "{req.suggestion}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <h2 className="heading-h2" style={{ marginBottom: '16px' }}>Published Campus Events</h2>
                  <GuestEventsView eventList={eventList} />
                </div>
              )}
              {activeTab === 'chat' && (
                <ChatPane
                  initialThreads={chatThreads}
                  currentUserId={currentUser?.id || currentUser?._id}
                  onSendMessage={handleSendMessage}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authInitialRole}
        initialMode={authInitialMode}
        onAuthenticate={(role, user) => {
          if (user) handleAuthenticatedUser(user);
          else handleRoleChange(role);
        }}
      />

      {/* Real-time Message Toast Notification */}
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
            border: '1px solid #3b82f6',
            cursor: 'pointer',
            maxWidth: '380px'
          }}
          onClick={() => {
            setActiveTab('chat');
            setToastNotification(null);
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#60a5fa' }}>{toastNotification.title}</div>
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
