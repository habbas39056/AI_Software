import React, { useEffect, useState, useRef } from 'react';
import { facebookService } from '../services/api';
import { 
  Search, 
  MessageSquare, 
  Camera, 
  MessageCircle, 
  Smile, 
  DollarSign, 
  ThumbsUp, 
  Paperclip, 
  Send, 
  MoreHorizontal, 
  Loader2, 
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import './Inbox.css';

interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'me';
  timestamp: string;
}

interface Conversation {
  id: string;
  name: string;
  username: string;
  platform: 'messenger' | 'instagram' | 'comments';
  avatar: string;
  unreadCount: number;
  updated_time: string;
  lastMessage: {
    text: string;
    sender: 'customer' | 'me';
    timestamp: string;
  } | null;
}

const Inbox: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'messenger' | 'instagram' | 'comments'>('all');
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [connected, setConnected] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Poll conversations every 4 seconds to sync messages/read states
  const fetchConversations = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const resp = await facebookService.getInboxConversations();
      if (!resp.connected) {
        setConnected(false);
      } else {
        setConnected(true);
        setConversations(resp.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const resp = await facebookService.getConversationMessages(threadId);
      setActiveThread(resp);
      setMessages(resp.messages || []);
    } catch (err) {
      console.error('Failed to load messages for thread:', threadId, err);
    }
  };

  useEffect(() => {
    fetchConversations(true);

    const interval = setInterval(() => {
      fetchConversations(false);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Poll messages for active thread every 2 seconds
  useEffect(() => {
    if (!activeThreadId) return;

    fetchMessages(activeThreadId);

    const msgInterval = setInterval(() => {
      fetchMessages(activeThreadId);
    }, 2000);

    return () => clearInterval(msgInterval);
  }, [activeThreadId]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    // Instantly set unread count to 0 in local state for Snappy UI response
    setConversations(prev => 
      prev.map(c => c.id === threadId ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if (!text.trim() || !activeThreadId) return;

    const newLocalMsg: Message = {
      id: `temp_${Date.now()}`,
      text: text,
      sender: 'me',
      timestamp: new Date().toISOString()
    };

    // Optimistically update UI
    setMessages(prev => [...prev, newLocalMsg]);
    if (textToSend === undefined) setInputText('');

    try {
      await facebookService.sendMessage(activeThreadId, text);
      // Immediately refresh thread to sync database state
      fetchMessages(activeThreadId);
      fetchConversations(false);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations based on tab and search query
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeTab === 'all') return true;
    return c.platform === activeTab;
  });

  const getPlatformIcon = (platform: 'messenger' | 'instagram' | 'comments', size = 12) => {
    switch (platform) {
      case 'messenger':
        return <MessageCircle size={size} className="platform-icon-msg" />;
      case 'instagram':
        return <Camera size={size} className="platform-icon-insta" />;
      case 'comments':
        return <MessageSquare size={size} className="platform-icon-comment" />;
      default:
        return null;
    }
  };

  // Render quick replies suggestions (based on active thread context)
  const quickReplies = [
    { text: "Our business hours are 8am-5pm" },
    { text: "Create appointment" },
    { text: "Rate experience" }
  ];

  if (loading) {
    return (
      <div className="inbox-loading-container">
        <Loader2 className="animate-spin text-fb-blue" size={48} />
        <p className="mt-2 text-muted">Opening CRM Chat Inbox...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="inbox-not-connected">
        <AlertCircle size={48} className="text-muted mb-2" />
        <h2>Meta Profile Not Synced</h2>
        <p>Please connect your Facebook Page or Instagram Business Account in the CRM Settings to open the live chat inbox.</p>
      </div>
    );
  }

  return (
    <div className="crm-inbox-page">
      {/* ── Top Tabs Navigation ── */}
      <div className="inbox-top-tabs-bar">
        <div className="tab-buttons-group">
          <button 
            className={`inbox-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Messages
          </button>
          <button 
            className={`inbox-tab-btn ${activeTab === 'messenger' ? 'active' : ''}`}
            onClick={() => setActiveTab('messenger')}
          >
            Messenger
          </button>
          <button 
            className={`inbox-tab-btn ${activeTab === 'instagram' ? 'active' : ''}`}
            onClick={() => setActiveTab('instagram')}
          >
            Instagram Direct
          </button>
          <button 
            className={`inbox-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Facebook comments <span className="tab-badge-num">12</span>
          </button>
          <div className="more-dropdown-wrapper">
            <button 
              className="inbox-tab-btn more-btn"
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
            >
              More <ChevronDown size={14} />
            </button>
            {moreDropdownOpen && (
              <div className="more-dropdown-menu">
                <button onClick={() => { setActiveTab('all'); setMoreDropdownOpen(false); }}>All Chats</button>
                <button onClick={() => { setMoreDropdownOpen(false); }}>Spam</button>
                <button onClick={() => { setMoreDropdownOpen(false); }}>Archived</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="inbox-split-workspace">
        {/* ── Left Sidebar (Thread directory) ── */}
        <div className="inbox-left-directory">
          <div className="directory-search-wrapper">
            <div className="search-input-container">
              <Search className="search-icon" size={16} />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <div className="filter-slider-btn">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
              </div>
            </div>
            <button className="manage-link-btn">Manage</button>
          </div>

          <div className="directory-threads-scroll">
            {filteredConversations.length === 0 ? (
              <div className="empty-directory-text">No conversations found</div>
            ) : (
              filteredConversations.map(thread => (
                <div 
                  key={thread.id}
                  className={`thread-item-card ${activeThreadId === thread.id ? 'selected' : ''}`}
                  onClick={() => handleSelectThread(thread.id)}
                >
                  <div className="thread-avatar-container">
                    <img src={thread.avatar} alt="User Avatar" className="thread-avatar-img" />
                    <div className="platform-badge-overlay">
                      {getPlatformIcon(thread.platform)}
                    </div>
                  </div>
                  
                  <div className="thread-meta-section">
                    <div className="meta-top-row">
                      <span className="meta-name-text">{thread.name}</span>
                      <span className="meta-date-text">
                        {new Date(thread.updated_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="meta-bottom-row">
                      <span className="meta-snippet-text">
                        {thread.lastMessage?.sender === 'me' ? 'You: ' : ''}
                        {thread.lastMessage?.text || 'No messages'}
                      </span>
                      {thread.unreadCount > 0 && (
                        <span className="unread-dot-badge">{thread.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Panel (Chat active workspace) ── */}
        <div className="inbox-right-workspace">
          {activeThreadId && activeThread ? (
            <div className="active-chat-container">
              {/* Header */}
              <div className="chat-window-header">
                <div className="header-user-profile">
                  <img src={activeThread.avatar} alt="Profile" className="header-avatar-img" />
                  <div className="header-meta-details">
                    <h3>{activeThread.name}</h3>
                    <p className="status-online-dot">Active now</p>
                  </div>
                </div>
                <button className="header-options-btn">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Message History Feed */}
              <div className="chat-window-feed">
                <div className="date-stamp-divider">
                  <span>
                    {new Date(activeThread.messages[0]?.timestamp || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="messages-scroll-area">
                  {messages.map((msg, index) => {
                    const isMe = msg.sender === 'me';
                    return (
                      <div key={msg.id || index} className={`message-bubble-row ${isMe ? 'my-bubble' : 'customer-bubble'}`}>
                        {!isMe && (
                          <img src={activeThread.avatar} alt="Avatar" className="bubble-avatar-img" />
                        )}
                        <div className="bubble-message-wrap">
                          <p className="bubble-text">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Chat Composer Footer */}
              <div className="chat-window-composer-footer">
                
                {/* Custom Quick Replies suggestions as in reference screenshot */}
                <div className="quick-replies-list-container">
                  {quickReplies.map((reply, idx) => (
                    <button 
                      key={idx}
                      className="quick-reply-chip"
                      onClick={() => handleSendMessage(reply.text)}
                    >
                      {reply.text}
                    </button>
                  ))}
                </div>

                <div className="composer-input-row">
                  <img 
                    src="/logo.png" 
                    alt="Agent" 
                    className="composer-agent-avatar"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="input-textarea-wrapper">
                    <textarea 
                      placeholder={`Reply in ${activeThread.platform === 'instagram' ? 'Instagram' : 'Messenger'}...`}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                    />
                    
                    <div className="composer-actions-bar">
                      <button className="composer-icon-btn" title="Add File"><Paperclip size={16} /></button>
                      <button className="composer-icon-btn" title="Insert Template"><MessageSquare size={16} /></button>
                      <button className="composer-icon-btn" title="Emoji"><Smile size={16} /></button>
                      <button className="composer-icon-btn" title="Send Currency"><DollarSign size={16} /></button>
                      <button className="composer-icon-btn" title="Thumbs Up" onClick={() => handleSendMessage('👍')}><ThumbsUp size={16} /></button>
                    </div>
                  </div>

                  <button 
                    className="btn-composer-send" 
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="inbox-empty-workspace-state">
              <div className="empty-state-card">
                <div className="empty-icon-wrap">
                  <MessageSquare size={36} />
                </div>
                <h2>Live Inbox Chat Workspace</h2>
                <p>Select an active Facebook Page or Instagram conversation from the left sidebar to view messages, reply to inquiries, or supervise your AI agent.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
