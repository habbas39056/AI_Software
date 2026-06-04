import React, { useState, useMemo } from 'react';
import { Bell } from 'lucide-react';

interface FollowUpsWidgetProps {
  leads: any[];
}

const FollowUpsWidget: React.FC<FollowUpsWidgetProps> = ({ leads }) => {
  const [followUpFilter, setFollowUpFilter] = useState<'Today' | 'Overdue'>('Today');

  const followUpLeads = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return leads
      .filter((l: any) => l.followUpDate)
      .map((l: any) => {
        const fDate = new Date(l.followUpDate);
        const isOverdue = fDate < today;
        const isToday = fDate >= today && fDate <= todayEnd;
        return { ...l, followUpParsed: fDate, isOverdue, isToday };
      })
      .filter((l: any) => {
        if (followUpFilter === 'Overdue') return l.isOverdue;
        if (followUpFilter === 'Today') return l.isToday;
        return false;
      })
      .sort((a: any, b: any) => a.followUpParsed.getTime() - b.followUpParsed.getTime());
  }, [leads, followUpFilter]);

  return (
    <div className="white-box followups-widget">
      <div className="followups-header">
        <h2 className="box-title">
          <Bell size={20} className="followups-bell" /> Follow-ups Due
        </h2>
        <div className="followups-filter-tabs">
          {(['Today', 'Overdue'] as const).map(tab => (
            <button
              key={tab}
              className={`followup-tab ${followUpFilter === tab ? 'active' : ''}`}
              onClick={() => setFollowUpFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="followups-list">
        {followUpLeads.length === 0 ? (
          <div className="followups-empty">
            No follow-ups {followUpFilter === 'Today' ? 'due today' : 'overdue'}.
          </div>
        ) : (
          followUpLeads.map((lead: any) => (
            <div key={lead.id} className="followup-row">
              <div className="followup-indicator-wrap">
                <span className={`followup-dot ${lead.isOverdue ? 'overdue' : lead.isToday ? 'today' : 'upcoming'}`} />
              </div>
              <div className="followup-info">
                <div className="followup-name">{lead.name || 'Unnamed'}</div>
                <div className="followup-meta">
                  {lead.businessName && <span>{lead.businessName}</span>}
                  {lead.assignedTo && <>{lead.businessName && <span className="meta-sep">·</span>}<span>{lead.assignedTo}</span></>}
                  {!lead.businessName && !lead.assignedTo && <span className="followup-phone">{lead.phoneNumber}</span>}
                </div>
              </div>
              <div className="followup-date">
                {new Date(lead.followUpDate).toLocaleDateString('en-CA')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FollowUpsWidget;
