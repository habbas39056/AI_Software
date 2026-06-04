import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { knowledgeService, adminService, clientService } from '../services/api';
import { ArrowLeft, Plus, Trash2, X, Edit2, Upload, FileText, Image, Video, File } from 'lucide-react';
import './KnowledgeBase.css';

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  document: <FileText size={18} />,
  picture: <Image size={18} />,
  video: <Video size={18} />,
};

const FILE_TYPE_LABELS: Record<string, string> = {
  document: 'Document',
  picture: 'Picture',
  video: 'Video',
};

const ACCEPTED_EXTENSIONS = '.pdf,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.heic';

const KnowledgeBase: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newArticle, setNewArticle] = useState({ topic: '', content: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      let targetId = id;
      
      if (!targetId) {
        const dashboard = await clientService.getDashboard();
        if (dashboard.customer) {
          targetId = dashboard.customer.whatsAppNumber;
          setCustomer(dashboard.customer);
          const kbData = await knowledgeService.getKnowledge(targetId!);
          setArticles(kbData);
        }
      } else {
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
    setNewArticle({ topic: article.topic, content: article.content || '' });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewArticle({ topic: '', content: '' });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileTypeFromName = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf', 'pptx', 'xls', 'xlsx'].includes(ext)) return 'document';
    if (['png', 'jpg', 'jpeg'].includes(ext)) return 'picture';
    if (['mp4', 'heic'].includes(ext)) return 'video';
    return 'unknown';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = id || customer?.whatsAppNumber;
    if (!targetId) return;
    try {
      if (editingId) {
        const updated = await knowledgeService.updateKnowledge(editingId, newArticle, selectedFile || undefined);
        setArticles(articles.map(a => a.id === editingId ? updated : a));
      } else {
        const created = await knowledgeService.createKnowledge({
          customerId: targetId,
          ...newArticle
        }, selectedFile || undefined);
        setArticles([...articles, created]);
      }
      setIsModalOpen(false);
      setNewArticle({ topic: '', content: '' });
      setSelectedFile(null);
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save article:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
                <th>File</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No knowledge uploaded yet. Bot will use default prompt.
                  </td>
                </tr>
              ) : (
                articles.map((a) => (
                  <tr key={a.id}>
                    <td className="kb-topic">{a.topic}</td>
                    <td className="kb-content">{a.content || '—'}</td>
                    <td>
                      {a.fileUrl ? (
                        <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="file-badge-link">
                          <span className={`file-badge ${a.fileType}`}>
                            {FILE_TYPE_ICONS[a.fileType] || <File size={18} />}
                            <span>{FILE_TYPE_LABELS[a.fileType] || 'File'}</span>
                          </span>
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
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
                  placeholder="e.g. We offer a 30-day money back guarantee..."
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                ></textarea>
              </div>

              {/* File Upload Section */}
              <div className="form-group">
                <label className="form-label">Attach File <span className="text-muted">(optional)</span></label>
                <div 
                  className="file-drop-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {selectedFile ? (
                    <div className="file-preview">
                      <div className="file-preview-info">
                        <span className={`file-badge ${getFileTypeFromName(selectedFile.name)}`}>
                          {FILE_TYPE_ICONS[getFileTypeFromName(selectedFile.name)] || <File size={18} />}
                          <span>{FILE_TYPE_LABELS[getFileTypeFromName(selectedFile.name)] || 'File'}</span>
                        </span>
                        <span className="file-name">{selectedFile.name}</span>
                        <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                      </div>
                      <button type="button" className="file-remove-btn" onClick={(e) => { e.stopPropagation(); removeSelectedFile(); }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="file-drop-placeholder">
                      <Upload size={24} />
                      <span>Click to upload a file</span>
                      <span className="file-hint">PDF, PPTX, XLS, PNG, JPG, MP4, HEIC (max 50MB)</span>
                    </div>
                  )}
                </div>

                {/* Show existing file when editing */}
                {editingId && !selectedFile && articles.find(a => a.id === editingId)?.fileUrl && (
                  <div className="existing-file-notice">
                    <span className={`file-badge ${articles.find(a => a.id === editingId)?.fileType}`}>
                      {FILE_TYPE_ICONS[articles.find(a => a.id === editingId)?.fileType] || <File size={18} />}
                      <span>Current file attached</span>
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Upload a new file to replace it</span>
                  </div>
                )}
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
