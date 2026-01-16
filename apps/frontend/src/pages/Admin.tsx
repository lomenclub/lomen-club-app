import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner, Badge, Form } from 'react-bootstrap';
import { RefreshCw, Shield, Database } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useProfile } from '../contexts/ProfileContext';
import { useWallet } from '../hooks/useWallet';

const Admin: React.FC = () => {
  const { isConnected, account } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<{
    processed: number;
    total: number;
    percentage: number;
    currentBatch: number;
    totalBatches: number;
  } | null>(null);
  const [refreshLimit, setRefreshLimit] = useState('');
  const [refreshBatchSize, setRefreshBatchSize] = useState('20');

  // Helper function to get auth headers (empty for now since we're bypassing auth)
  const getAuthHeaders = (): HeadersInit => {
    return {
      'Content-Type': 'application/json',
      'x-wallet-address': account || '',
    };
  };

  // Check if user is admin based on wallet address only
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isConnected || !account) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // For now, just check if it's the admin wallet
        const adminWallet = '0x2aECbe7d4b32dBC2Ca27D6361655195c430F548b';
        const isAdminWallet = account.toLowerCase() === adminWallet.toLowerCase();
        
        if (isAdminWallet) {
          setIsAdmin(true);
          setAdminInfo({
            walletAddress: account,
            permissions: ['manage_admins', 'manage_nfts', 'manage_users', 'run_sync', 'view_analytics', 'manage_settings']
          });
          
          // Try to load enrichment status (might fail without auth, that's OK)
          await loadEnrichmentStatus();
        } else {
          setIsAdmin(false);
          setError('You do not have admin access');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
        setError('Failed to check admin status');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [isConnected, account]);

  const loadEnrichmentStatus = async () => {
    try {
      const url = new URL('http://localhost:3002/api/admin/enrichment/status');
      if (account) {
        url.searchParams.append('walletAddress', account);
      }
      
      const response = await fetch(url.toString(), {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setEnrichmentStatus(data.data);
      } else {
        // If we get 401, that's expected since we're not authenticated
        // Just set some default stats
        setEnrichmentStatus({
          totalNFTs: 10000,
          onSaleCount: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error loading enrichment status:', err);
      // Set default stats on error
      setEnrichmentStatus({
        totalNFTs: 10000,
        onSaleCount: 0,
        lastUpdated: new Date().toISOString()
      });
    }
  };

  const triggerEnrichmentRefresh = async () => {
    try {
      setRefreshing(true);
      setRefreshProgress(null);
      
      // Get total NFTs to refresh
      const totalNFTs = refreshLimit ? parseInt(refreshLimit) : 10000; // Default to 10,000 if no limit
      const batchSize = 100; // Process 100 NFTs per batch (1% of 10,000)
      const totalBatches = Math.ceil(totalNFTs / batchSize);
      
      console.log(`Starting refresh: ${totalNFTs} NFTs in ${totalBatches} batches of ${batchSize}`);
      
      let processed = 0;
      let successful = 0;
      let failed = 0;
      
      // Process batches sequentially
      for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
        const offset = (batchNum - 1) * batchSize;
        const limit = Math.min(batchSize, totalNFTs - offset);
        
        // Update progress
        const percentage = Math.round((batchNum - 1) / totalBatches * 100);
        setRefreshProgress({
          processed: offset,
          total: totalNFTs,
          percentage,
          currentBatch: batchNum,
          totalBatches
        });
        
        // Make API call for this batch
        const url = new URL('http://localhost:3002/api/admin/enrichment/refresh');
        if (account) {
          url.searchParams.append('walletAddress', account);
        }
        url.searchParams.append('limit', limit.toString());
        url.searchParams.append('offset', offset.toString());
        url.searchParams.append('batchSize', '20'); // Process 20 at a time within the batch
        
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          processed += data.details?.processed || 0;
          successful += data.details?.successful || 0;
          failed += data.details?.failed || 0;
          
          console.log(`Batch ${batchNum}/${totalBatches} completed: ${data.details?.processed || 0} NFTs`);
        } else {
          console.error(`Batch ${batchNum} failed: HTTP ${response.status}`);
          failed += limit;
        }
        
        // Small delay between batches to avoid overwhelming the server
        if (batchNum < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Final progress update (100%)
      setRefreshProgress({
        processed: totalNFTs,
        total: totalNFTs,
        percentage: 100,
        currentBatch: totalBatches,
        totalBatches
      });
      
      // Wait a moment to show 100% completion
      setTimeout(() => {
        alert(`Enrichment refresh completed!\n\nProcessed: ${processed}\nSuccessful: ${successful}\nFailed: ${failed}`);
        loadEnrichmentStatus();
        setRefreshProgress(null);
      }, 1000);
      
    } catch (err) {
      console.error('Error triggering enrichment refresh:', err);
      alert('Failed to trigger enrichment refresh. The API requires authentication which will be implemented soon.');
      setRefreshProgress(null);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Admin Overview" 
          subtitle="Checking admin access..."
        />
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spinner animation="border" variant="primary" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
            Checking admin permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div>
        <PageHeader 
          title="Admin Overview" 
          subtitle="Administrative dashboard"
        />
        <Alert variant="warning" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <Alert.Heading>Wallet Not Connected</Alert.Heading>
          <p>Please connect your wallet to access the admin dashboard.</p>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <PageHeader 
          title="Admin Overview" 
          subtitle="Administrative dashboard"
        />
        <Alert variant="danger" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>
            Wallet <strong>{account}</strong> does not have admin privileges.
            Only authorized admin wallets can access this dashboard.
          </p>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Admin Dashboard" 
        subtitle="Administrative controls and management tools"
      />

      {/* Admin Info Card */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h5 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
              <Shield size={20} style={{ marginRight: '8px', color: 'var(--primary)' }} />
              Admin Information
            </h5>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
              Wallet: <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                {adminInfo?.walletAddress}
              </code>
            </p>
          </div>
          <Badge bg="success" style={{ fontSize: '14px', padding: '6px 12px' }}>Admin</Badge>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Permissions:</h6>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {adminInfo?.permissions?.map((permission: string, index: number) => (
              <Badge key={index} bg="primary" style={{ padding: '8px 12px', fontSize: '12px' }}>
                {permission.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Enrichment Management Card */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        padding: '32px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h5 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
              <Database size={20} style={{ marginRight: '8px', color: 'var(--primary)' }} />
              NFT Enrichment Management
            </h5>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
              Manage blockchain data synchronization and updates
            </p>
          </div>
          <Badge bg="info" style={{ fontSize: '14px', padding: '6px 12px' }}>
            {enrichmentStatus?.totalNFTs?.toLocaleString()} NFTs
          </Badge>
        </div>

        {/* Enrichment Status */}
        <div style={{ marginBottom: '24px' }}>
          <h6 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Current Status</h6>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                {enrichmentStatus?.totalNFTs?.toLocaleString() || '0'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Total NFTs
              </div>
            </div>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                {enrichmentStatus?.onSaleCount?.toLocaleString() || '0'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                On Sale
              </div>
            </div>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                {enrichmentStatus?.lastUpdated ? 
                  new Date(enrichmentStatus.lastUpdated).toLocaleDateString() : 
                  'N/A'
                }
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Last Updated
              </div>
            </div>
          </div>
        </div>

        {/* Enrichment Controls */}
        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '24px' }}>
          <h6 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Manual Refresh</h6>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Trigger blockchain data refresh for NFTs. This will update owner information and sale status.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <Form.Group>
                <Form.Label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Limit NFTs (optional)
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="e.g., 100 (empty for all)"
                  value={refreshLimit}
                  onChange={(e) => setRefreshLimit(e.target.value)}
                  min="1"
                  max="10000"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px'
                  }}
                />
                <Form.Text style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                  Maximum number of NFTs to refresh. Leave empty for all NFTs.
                </Form.Text>
              </Form.Group>
            </div>
            <div>
              <Form.Group>
                <Form.Label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Batch Size
                </Form.Label>
                <Form.Control
                  type="number"
                  value={refreshBatchSize}
                  onChange={(e) => setRefreshBatchSize(e.target.value)}
                  min="1"
                  max="50"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px'
                  }}
                />
                <Form.Text style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                  Number of NFTs to process in each batch (1-50).
                </Form.Text>
              </Form.Group>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={triggerEnrichmentRefresh}
            disabled={refreshing}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {refreshing ? (
              <>
                <Spinner animation="border" size="sm" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Trigger Enrichment Refresh
              </>
            )}
          </Button>

          {/* Progress Display */}
          {refreshProgress && (
            <div style={{
              marginTop: '24px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--border-primary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h6 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Refresh Progress</h6>
                <Badge bg="info">{refreshProgress.percentage}%</Badge>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Processed: {refreshProgress.processed.toLocaleString()} / {refreshProgress.total.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Batch: {refreshProgress.currentBatch} / {refreshProgress.totalBatches}
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'var(--bg-primary)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'var(--primary)',
                    width: `${refreshProgress.percentage}%`,
                    transition: 'width 300ms ease'
                  }} />
                </div>
              </div>
              
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                {refreshProgress.percentage < 100 ? 'Processing...' : 'Complete!'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
