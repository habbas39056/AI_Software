import React from 'react';
import { HelpCircle, PlayCircle, BookOpen, MessageCircle, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import './SupportDocs.css';

const SupportDocs: React.FC = () => {
  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/923346565253', '_blank');
  };

  const helpCards = [
    {
      icon: <Zap className="text-yellow-500" />,
      title: "Quick Start Guide",
      description: "Learn how to connect your WhatsApp instance and deploy your first AI agent in under 5 minutes.",
      link: "#"
    },
    {
      icon: <BookOpen className="text-blue-500" />,
      title: "Bot Training 101",
      description: "Master the Knowledge Base. Learn how to map topics and content to give your bot 'human-like' knowledge.",
      link: "#"
    },
    {
      icon: <ShieldCheck className="text-green-500" />,
      title: "Billing & Security",
      description: "Information about subscription cycles, account security, and how to manage your PRO plan.",
      link: "#"
    }
  ];

  return (
    <div className="support-page">
      <div className="support-hero">
        <h1 className="support-title">How can we help you today?</h1>
        <p className="support-subtitle">Search our documentation or contact our dedicated support team.</p>
        
        <div className="search-bar-wrapper">
          <input type="text" className="support-search" placeholder="Search for tutorials, guides, and FAQs..." />
        </div>
      </div>

      <div className="support-grid">
        {helpCards.map((card, index) => (
          <div className="support-card" key={index}>
            <div className="card-icon">{card.icon}</div>
            <h3 className="card-title">{card.title}</h3>
            <p className="card-desc">{card.description}</p>
            <a href={card.link} className="card-link">
              Read More <ArrowRight size={16} />
            </a>
          </div>
        ))}
      </div>

      <div className="support-video-section">
        <div className="section-header">
          <h2 className="section-title">Video Tutorials</h2>
          <p className="section-subtitle">Visual guides to help you master the WhatsApp AI Platform.</p>
        </div>
        
        <div className="video-grid">
          <div className="video-card">
            <div className="video-thumb">
              <PlayCircle size={48} className="play-icon" />
            </div>
            <div className="video-info">
              <h4>Connecting Evolution API</h4>
              <p>Step-by-step QR scanning guide.</p>
            </div>
          </div>
          <div className="video-card">
            <div className="video-thumb">
              <PlayCircle size={48} className="play-icon" />
            </div>
            <div className="video-info">
              <h4>Advanced AI Prompting</h4>
              <p>How to optimize bot responses.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-support-banner">
        <div className="banner-content">
          <HelpCircle size={40} className="banner-icon" />
          <div>
            <h3>Still need assistance?</h3>
            <p>Our expert support team is available 24/7 via WhatsApp to help you with your AI deployment.</p>
          </div>
        </div>
        <button className="btn-whatsapp-support" onClick={handleWhatsAppSupport}>
          <MessageCircle size={20} />
          Chat on WhatsApp
        </button>
      </div>

      <footer className="support-footer">
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">System Status</a>
        </div>
        <p>© 2026 Adwise AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default SupportDocs;
