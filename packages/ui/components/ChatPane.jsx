import React, { useState, useEffect, useRef } from 'react';
import AvatarChip from './AvatarChip';
import Button from './Button';
import { Send, Search } from 'lucide-react';
import { getAuthUser } from '../lib/apiClient';
import './ChatPane.css';

export default function ChatPane({ initialThreads = [], currentUserId, onSendMessage, onSelectThread }) {
  const [threads, setThreads] = useState(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState(initialThreads[0]?.id || initialThreads[0]?._id || null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const activeUser = currentUserId || getAuthUser()?.id;

  useEffect(() => {
    setThreads(initialThreads);
    if (!activeThreadId && initialThreads.length > 0) {
      setActiveThreadId(initialThreads[0].id || initialThreads[0]._id);
    }
  }, [initialThreads]);

  const activeThread = threads.find((t) => (t.id || t._id) === activeThreadId) || threads[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages?.length, activeThreadId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const threadId = activeThread.id || activeThread._id;
    const text = inputText.trim();

    if (onSendMessage) {
      await onSendMessage(threadId, text);
    } else {
      const newMessage = {
        id: 'msg-' + Date.now(),
        sender: activeUser || 'me',
        text,
        timestamp: 'Just now'
      };

      setThreads((prevThreads) =>
        prevThreads.map((t) => {
          if ((t.id || t._id) === threadId) {
            return {
              ...t,
              lastMessage: text,
              timestamp: 'Just now',
              messages: [...(t.messages || []), newMessage]
            };
          }
          return t;
        })
      );
    }

    setInputText('');
  };

  const filteredThreads = threads.filter((t) =>
    (t.displayName || t.participantName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-pane-container">
      {/* Sidebar thread list */}
      <div className="chat-sidebar">
        <div className="chat-search-wrap">
          <Search size={16} className="chat-search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input"
          />
        </div>

        <div className="chat-thread-list">
          {filteredThreads.map((thread) => {
            const id = thread.id || thread._id;
            const isActive = id === activeThreadId;
            const name = thread.displayName || thread.participantName;
            const avatar = thread.displayAvatar || thread.participantAvatar;
            return (
              <div
                key={id}
                className={`chat-thread-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveThreadId(id);
                  if (onSelectThread) onSelectThread(id);
                  setThreads((prev) =>
                    prev.map((t) => ((t.id || t._id) === id ? { ...t, unreadCount: 0 } : t))
                  );
                }}
              >
                <AvatarChip name={name} src={avatar} size="md" />
                <div className="chat-thread-info">
                  <div className="chat-thread-top">
                    <span className="chat-thread-name">{name}</span>
                    <span className="chat-thread-time">{thread.timestamp || thread.lastMessageAt}</span>
                  </div>
                  <div className="chat-thread-bottom">
                    <p className="chat-thread-preview">{thread.lastMessage}</p>
                    {thread.unreadCount > 0 && (
                      <span className="chat-unread-badge">{thread.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main chat window */}
      <div className="chat-main">
        {activeThread ? (
          <>
            <div className="chat-header">
              <AvatarChip
                name={activeThread.displayName || activeThread.participantName}
                src={activeThread.displayAvatar || activeThread.participantAvatar}
                subtext={activeThread.displayRole || activeThread.participantRole}
                size="md"
              />
            </div>

            <div className="chat-messages-area">
              {(activeThread.messages || []).map((msg, idx) => {
                const isMe =
                  msg.sender === 'me' ||
                  msg.isMe ||
                  (activeUser && (String(msg.sender) === String(activeUser) || msg.sender?._id === activeUser));

                return (
                  <div key={msg.id || msg._id || idx} className={`chat-bubble-row ${isMe ? 'row-me' : 'row-them'}`}>
                    <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                      <p className="chat-bubble-text">{msg.text}</p>
                      <span className="chat-bubble-time">{msg.timestamp || 'Now'}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-bar" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-text-field"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button type="submit" variant="primary" icon={Send}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="chat-empty">Select a conversation to start chatting</div>
        )}
      </div>
    </div>
  );
}
