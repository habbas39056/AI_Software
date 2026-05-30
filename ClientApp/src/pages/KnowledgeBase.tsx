import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { knowledgeService, adminService, clientService } from '../services/api';
import { ArrowLeft, Plus, Trash2, X, Edit2 } from 'lucide-react';
import './KnowledgeBase.css';

const KnowledgeBase: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newArticle, setNewArticle] = useState({ topic: '', content: '' });

  const fetchData = async () => {
    try {
      let targetId = id;
      
      if (!targetId) {
        // If no ID, we are in the client portal
        const dashboard = await clientService.getDashboard();
        if (dashboard.customer) {
          targetId = dashboard.customer.whatsAppNumber;
          setCustomer(dashboard.customer);
          const kbData = await knowledgeService.getKnowledge(targetId!);
          setArticles(kbData);
        }
      } else {
        // We are in admin portal
        const [kbData, customers] = await Promise.all([
          knowledgeService.getKnowledge(targetId),
          adminService.getCustomers()
        ]);
        setArticles(kbData);
        setCustomer(customers.find((c: any) => c.whatsAppNumber === targetId));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async (articleId: number) => {
    if (window.confirm('Delete this article?')) {
      try {
        await knowledgeService.deleteKnowledge(articleId);
        setArticles(articles.filter(a => a.id !== articleId));
      } catch (error) {
        console.error('Failed to delete article:', error);
      }
    }
  };

  const openEditModal = (article: any) => {
    setEditingId(article.id);
    setNewArticle({ topic: article.topic, content: article.content });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewArticle({ topic: '', content: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = id || customer?.whatsAppNumber;
    if (!targetId) return;
    try {
      if (editingId) {
        const updated = await knowledgeService.updateKnowledge(editingId, newArticle);
        setArticles(articles.map(a => a.id === editingId ? updated : a));
      } else {
        const created = await knowledgeService.createKnowledge({
          customerId: targetId,
          ...newArticle
        });
        setArticles([...articles, created]);
      }
      setIsModalOpen(false);
      setNewArticle({ topic: '', content: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save article:', error);
    }
  };

  if (loading) return <div className="loading">Loading Knowledge Base...</div>;

  return (
    <div className="kb-page">
      <div style={{ marginBottom: '1.5rem' }}>
        {id ? (
          <Link to={`/clients/${id}`} className="btn-secondary btn-sm" style={{ display: 'inline-flex', width: 'auto' }}>
            <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back to 360 View
          </Link>
        ) : (
          <Link to="/" className="btn-secondary btn-sm" style={{ display: 'inline-flex', width: 'auto' }}>
            <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back to Dashboard
          </Link>
        )}
      </div>

      <div className="white-box">
        <div className="box-header">
          <h2 className="box-title">Knowledge Base</h2>
          <button className="icon-btn-circle orange" onClick={openAddModal}>
            <Plus size={20} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Topic / Question</th>
                <th>Content Mapping</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-state">
                    No knowledge uploaded yet. Bot will use default prompt.
                  </td>
                </tr>
              ) : (
                articles.map((a) => (
                  <tr key={a.id}>
                    <td className="kb-topic">{a.topic}</td>
                    <td className="kb-content">{a.content}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEditModal(a)} className="icon-btn edit" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="icon-btn delete" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content white-box">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 className="box-title">{editingId ? 'Edit Knowledge Article' : 'Add Knowledge Article'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Topic / Question</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  required 
                  placeholder="e.g. Refund Policy"
                  value={newArticle.topic}
                  onChange={(e) => setNewArticle({ ...newArticle, topic: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Content / Mapping</label>
                <textarea 
                  className="glass-input textarea-sm" 
                  rows={4} 
                  required 
                  placeholder="e.g. We offer a 30-day money back guarantee..."
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                ></textarea>
              </div>
              <button type="submit" className="btn-primary block">{editingId ? 'Save Changes' : 'Add Article'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
