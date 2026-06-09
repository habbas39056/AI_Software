import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import Clients from './pages/Clients';
import AddCustomer from './pages/AddCustomer';
import KnowledgeBase from './pages/KnowledgeBase';
import ClientDetails from './pages/ClientDetails';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Billing from './pages/Billing';
import ClientBilling from './pages/ClientBilling';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import SuspendedScreen from './pages/SuspendedScreen';
import SupportDocs from './pages/SupportDocs';
import TeamMembers from './pages/TeamMembers';
import Commissions from './pages/Commissions';
import ExternalComplaints from './pages/ExternalComplaints';
import ExternalInstructions from './pages/ExternalInstructions';
import { authService } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // Only log real errors, not just 401s
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div className="loading">Initializing...</div>;

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    );
  }

  // Robust check for suspension
  console.log('App.tsx - User Status Check:', user);
  const status = user.subscriptionStatus ? user.subscriptionStatus.toString().trim() : '';
  const isSuspended = user.role === 'Client' && (
    status === 'Suspended' || 
    status.toLowerCase() === 'suspended' || 
    (user.daysLeft !== undefined && user.daysLeft <= 0)
  );
  console.log('App.tsx - Is Suspended?', isSuspended);

  if (isSuspended) {
    return <SuspendedScreen />;
  }

  return (
    <Router>
      {isSuspended ? (
        <SuspendedScreen />
      ) : (
        <Layout 
          role={user.role} 
          userName={user.name} 
          userProfileImage={user.profileImage} 
          moduleComplains={user.moduleComplains} 
          moduleInstruction={user.moduleInstruction}
        >
          <Routes>
            <Route path="/" element={user.role === 'Super Admin' ? <Dashboard /> : <ClientDashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/clients/add" element={<AddCustomer />} />
            <Route path="/clients/edit/:id" element={<AddCustomer />} />
            <Route path="/onboarding" element={<AddCustomer />} />
            <Route path="/clients/:id" element={<ClientDetails />} />
            <Route path="/clients/:id/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/clients/:id/leads" element={<Leads />} />
            
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/leads" element={<Leads />} />
            
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/team" element={<TeamMembers />} />
            <Route path="/billing" element={user.role === 'Super Admin' ? <Billing /> : <ClientBilling />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/security" element={<Profile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<SupportDocs />} />
            <Route path="/complaints" element={<ExternalComplaints />} />
            <Route path="/instructions" element={<ExternalInstructions />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;
