import React, { useState, useEffect } from 'react';
import { Card, Spinner, Table, Badge } from 'react-bootstrap';
import { Users, ShoppingBag, Trophy, TrendingUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';

interface WalletHolderStats {
  totalHolders: number;
  totalNFTs: number;
  onSaleCount: number;
  topWallets: Array<{
    wallet: string;
    walletShort: string;
    nftCount: number;
    percentage: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<WalletHolderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3002/api/wallets/stats/holders');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching wallet holder stats:', err);
        setError('Failed to load dashboard statistics. Please try again later.');
        
        // Set mock data for development
        setStats({
          totalHolders: 1500,
          totalNFTs: 10000,
          onSaleCount: 320,
          topWallets: [
            { wallet: '0x2aECbe7d4b32dBC2Ca27D6361655195c430F548b', walletShort: '0x2aEC...548b', nftCount: 45, percentage: 0.45 },
            { wallet: '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C', walletShort: '0xD6B6...B16C', nftCount: 32, percentage: 0.32 },
            { wallet: '0x742d35Cc6634C0532925a3b844Bc9e8a3C469A46', walletShort: '0x742d...9A46', nftCount: 28, percentage: 0.28 },
            { wallet: '0x8a9C67fee641579dEbA04928c4BC45F66e26343A', walletShort: '0x8a9C...43A', nftCount: 22, percentage: 0.22 },
            { wallet: '0x1FdB5C5E1dC7e783b0D0b9c4d1B2b3C4D5E6F7A8', walletShort: '0x1FdB...F7A8', nftCount: 18, percentage: 0.18 },
            { wallet: '0x9aC6D4b5E7f8a9B0C1D2E3F4A5B6C7D8E9F0A1B2', walletShort: '0x9aC6...A1B2', nftCount: 15, percentage: 0.15 },
            { wallet: '0x3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3', walletShort: '0x3B4C...B2C3', nftCount: 12, percentage: 0.12 },
            { wallet: '0x4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4', walletShort: '0x4C5D...C3D4', nftCount: 10, percentage: 0.10 },
            { wallet: '0x5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5', walletShort: '0x5D6E...D4E5', nftCount: 8, percentage: 0.08 },
            { wallet: '0x6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6', walletShort: '0x6E7F...E5F6', nftCount: 6, percentage: 0.06 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Dashboard" 
          subtitle="Welcome to Lomen Club - Your membership dashboard"
        />
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spinner animation="border" variant="primary" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
            Loading dashboard statistics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Lomen Club Statistics & Analytics"
      />

      {error && (
        <div style={{ marginBottom: '24px' }}>
          <Card style={{
            background: 'var(--bg-warning)',
            border: '1px solid var(--border-warning)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <p style={{ color: 'var(--text-warning)', margin: 0, fontSize: '14px' }}>
              ⚠️ {error} Using sample data for demonstration.
            </p>
          </Card>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Total Holders Card */}
        <Card style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <Card.Body style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                borderRadius: '12px',
                padding: '16px',
                marginRight: '16px'
              }}>
                <Users size={24} color="white" />
              </div>
              <div>
                <Card.Subtitle style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '4px'
                }}>
                  Total Holders
                </Card.Subtitle>
                <Card.Title style={{ 
                  fontSize: '32px', 
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)'
                }}>
                  {stats?.totalHolders?.toLocaleString() || '0'}
                </Card.Title>
              </div>
            </div>
            <div style={{
              height: '4px',
              background: 'var(--bg-secondary)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)',
                width: '100%'
              }} />
            </div>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '14px',
              margin: 0
            }}>
              Unique wallets owning Lomen NFTs
            </p>
          </Card.Body>
        </Card>

        {/* Total NFTs Card */}
        <Card style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <Card.Body style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                borderRadius: '12px',
                padding: '16px',
                marginRight: '16px'
              }}>
                <TrendingUp size={24} color="white" />
              </div>
              <div>
                <Card.Subtitle style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '4px'
                }}>
                  Total NFTs
                </Card.Subtitle>
                <Card.Title style={{ 
                  fontSize: '32px', 
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)'
                }}>
                  {stats?.totalNFTs?.toLocaleString() || '0'}
                </Card.Title>
              </div>
            </div>
            <div style={{
              height: '4px',
              background: 'var(--bg-secondary)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                width: '100%'
              }} />
            </div>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '14px',
              margin: 0
            }}>
              Total Lomen NFTs in circulation
            </p>
          </Card.Body>
        </Card>

        {/* On Sale Card */}
        <Card style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <Card.Body style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                borderRadius: '12px',
                padding: '16px',
                marginRight: '16px'
              }}>
                <ShoppingBag size={24} color="white" />
              </div>
              <div>
                <Card.Subtitle style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '4px'
                }}>
                  On Sale
                </Card.Subtitle>
                <Card.Title style={{ 
                  fontSize: '32px', 
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)'
                }}>
                  {stats?.onSaleCount?.toLocaleString() || '0'}
                </Card.Title>
              </div>
            </div>
            <div style={{
              height: '4px',
              background: 'var(--bg-secondary)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)',
                width: `${(stats?.onSaleCount || 0) / (stats?.totalNFTs || 1) * 100}%`
              }} />
            </div>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '14px',
              margin: 0
            }}>
              NFTs currently listed for sale ({((stats?.onSaleCount || 0) / (stats?.totalNFTs || 1) * 100).toFixed(1)}%)
            </p>
          </Card.Body>
        </Card>
      </div>

      {/* Top Wallets Table */}
      <Card style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        marginBottom: '32px'
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
        <Card.Body style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
              borderRadius: '12px',
              padding: '16px',
              marginRight: '16px'
            }}>
              <Trophy size={24} color="white" />
            </div>
            <div>
              <Card.Title style={{ 
                fontSize: '24px', 
                fontWeight: 700,
                margin: 0,
                color: 'var(--text-primary)'
              }}>
                Top Wallet Holders
              </Card.Title>
              <Card.Subtitle style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '14px',
                fontWeight: 400,
                marginTop: '4px'
              }}>
                Wallets ranked by number of Lomen NFTs owned
              </Card.Subtitle>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <Table hover borderless style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ 
                    borderBottom: '1px solid var(--border-primary)',
                    padding: '16px',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>Rank</th>
                  <th style={{ 
                    borderBottom: '1px solid var(--border-primary)',
                    padding: '16px',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>Wallet Address</th>
                  <th style={{ 
                    borderBottom: '1px solid var(--border-primary)',
                    padding: '16px',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>NFT Count</th>
                  <th style={{ 
                    borderBottom: '1px solid var(--border-primary)',
                    padding: '16px',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>Percentage</th>
                  <th style={{ 
                    borderBottom: '1px solid var(--border-primary)',
                    padding: '16px',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topWallets?.map((wallet, index) => (
                  <tr key={wallet.wallet} style={{ 
                    borderBottom: index < stats.topWallets.length - 1 ? '1px solid var(--border-primary)' : 'none'
                  }}>
                    <td style={{ 
                      padding: '16px',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '16px'
                    }}>
                      <Badge bg={index < 3 ? 'primary' : 'secondary'} style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}>
                        #{index + 1}
                      </Badge>
                    </td>
                    <td style={{ 
                      padding: '16px',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                      fontSize: '14px'
                    }}>
                      <code style={{
                        background: 'var(--bg-secondary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '13px'
                      }}>
                        {wallet.walletShort}
                      </code>
                    </td>
                    <td style={{ 
                      padding: '16px',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '16px'
                    }}>
                      {wallet.nftCount.toLocaleString()}
                    </td>
                    <td style={{ 
                      padding: '16px',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      fontSize: '14px'
                    }}>
                      {(wallet.percentage * 100).toFixed(2)}%
                    </td>
                    <td style={{ 
                      padding: '16px',
                      width: '200px'
                    }}>
                      <div style={{
                        height: '8px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)',
                          width: `${wallet.percentage * 100}%`,
                          borderRadius: '4px'
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Additional Info Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        <Card style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h4 style={{ 
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            📊 Distribution Insights
          </h4>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: '1.6',
            marginBottom: '16px'
          }}>
            The top 10 wallets hold approximately <strong>{((stats?.topWallets || []).reduce((sum, wallet) => sum + wallet.percentage, 0) * 100).toFixed(1)}%</strong> of all Lomen NFTs.
          </p>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            This shows a healthy distribution with significant community ownership while maintaining some concentration among early adopters.
          </p>
        </Card>

        <Card style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h4 style={{ 
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            🔄 Market Activity
          </h4>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: '1.6',
            marginBottom: '16px'
          }}>
            Currently, <strong>{stats?.onSaleCount?.toLocaleString() || '0'}</strong> NFTs ({((stats?.onSaleCount || 0) / (stats?.totalNFTs || 1) * 100).toFixed(1)}%) are listed for sale on KuSwap.
          </p>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            This represents active market participation and liquidity in the Lomen NFT ecosystem.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
