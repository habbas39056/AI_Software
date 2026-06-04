import React, { useEffect, useState, useCallback } from 'react';
import { leadsService } from '../services/api';
import LeadFormModal from '../components/LeadFormModal';
import './Pipeline.css';

const COLUMNS = [
  { id: 'New', label: 'NEW', matchStatuses: ['New'] },
  { id: 'Talking', label: 'TALKING', matchStatuses: ['Contacted'] },
  { id: 'Objection', label: 'OBJECTION', matchStatuses: ['Qualified', 'Proposal'] },
  { id: 'Negotiation', label: 'NEGOTIATION', matchStatuses: ['Negotiation'] },
  { id: 'Closed', label: 'CLOSED', matchStatuses: ['Won'] },
  { id: 'Lost', label: 'LOST', matchStatuses: ['Lost'] },
];

const Pipeline: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const data = await leadsService.getAllLeads();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads for pipeline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const formatCurrency = (v: number | null) => 
    (!v || v === 0) ? 'Rs0' : `Rs${new Intl.NumberFormat('en-PK').format(v)}`;

  if (loading) return <div className="loading">Loading Pipeline...</div>;

  return (
    <div className="pipeline-page">
      <div className="pipeline-header">
        <h1 className="pipeline-title">Pipeline</h1>
      </div>

      <div className="pipeline-board">
        {COLUMNS.map(column => {
          const columnLeads = leads.filter(lead => column.matchStatuses.includes(lead.status));
          const totalValue = columnLeads.reduce((sum, lead) => sum + (Number(lead.dealValue) || 0), 0);

          return (
            <div key={column.id} className="pipeline-column">
              <div className="pipeline-column-header">
                <div className="pipeline-column-title-row">
                  <span className="pipeline-column-title">{column.label}</span>
                  <span className="pipeline-column-count">{columnLeads.length}</span>
                </div>
                <div className="pipeline-column-value">{formatCurrency(totalValue)}</div>
              </div>
              <div className="pipeline-cards">
                {columnLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    className="pipeline-card" 
                    onClick={() => {
                      setSelectedLead(lead);
                      setIsModalOpen(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="pipeline-card-title">{lead.name || 'Unnamed'}</div>
                    <div className="pipeline-card-service">{lead.service || '—'}</div>
                    <div className="pipeline-card-value">{formatCurrency(lead.dealValue)}</div>
                    <div className="pipeline-card-assigned">{lead.assignedTo || 'AI Agent'}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedLead(null); }}
        lead={selectedLead}
        onSave={fetchLeads}
      />
    </div>
  );
};

export default Pipeline;
