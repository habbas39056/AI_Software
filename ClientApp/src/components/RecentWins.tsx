import React from 'react';
import './RecentWins.css';

interface RecentWinsProps {
  leads: any[];
}

const RecentWins: React.FC<RecentWinsProps> = ({ leads }) => {
  // Filter for 'Won' leads and get the 5 most recent
  const wins = leads
    .filter(l => l.status === 'Won' || l.status === 'Closed')
    .sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="white-box recent-wins-widget">
      <h2 className="box-title mb-2">
        <span className="recent-wins-icon">🎉</span> Recent Wins
      </h2>
      <div className="recent-wins-list">
        {wins.length === 0 ? (
          <div className="recent-wins-empty">No recent wins yet. Keep pushing!</div>
        ) : (
          wins.map((win, idx) => (
            <div key={win.id || idx} className="recent-win-item">
              <div className="recent-win-indicator"></div>
              <div className="recent-win-content">
                <div className="recent-win-name">{win.name || 'Unnamed Lead'}</div>
                <div className="recent-win-meta">
                  {win.service || 'No Service'} · {win.assignedTo || 'Unassigned'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentWins;
