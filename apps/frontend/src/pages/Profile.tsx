import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';
import { useWallet } from '../hooks/useWallet';
import { useProfile } from '../contexts/ProfileContext';

// Inline validation rules to avoid shared package import issues
const ProfileValidation = {
  display_name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
  },
  kucoin_uid: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  telegram_handle: {
    minLength: 1,
    maxLength: 32,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  x_handle: {
    minLength: 1,
    maxLength: 15,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};

interface ProfileUpdateRequest {
  display_name?: string;
  kucoin_uid?: string;
  telegram_handle?: string;
  x_handle?: string;
  email?: string;
  profile_picture_nft_id?: number;
}

const Profile: React.FC = () => {
  const { isConnected, account, chainId, kcsBalance, connectWallet, isConnecting } = useWallet();
  const { 
    isAuthenticated, 
    profile, 
    profileLoading, 
    profileError, 
    updateProfile, 
    syncNFTs, 
    setProfilePicture,
    authenticate,
    authLoading,
    authError
  } = useProfile();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateRequest>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile?.profile) {
      setFormData({
        display_name: profile.profile.display_name || '',
        kucoin_uid: profile.profile.kucoin_uid || '',
        telegram_handle: profile.profile.telegram_handle || '',
        x_handle: profile.profile.x_handle || '',
        email: profile.profile.email || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileUpdateRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!isAuthenticated) return;

    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      // Validate form data
      const validationErrors: string[] = [];

      if (formData.display_name && formData.display_name.length < ProfileValidation.display_name.minLength) {
        validationErrors.push(`Display name must be at least ${ProfileValidation.display_name.minLength} characters`);
      }

      if (formData.display_name && formData.display_name.length > ProfileValidation.display_name.maxLength) {
        validationErrors.push(`Display name must be at most ${ProfileValidation.display_name.maxLength} characters`);
      }

      if (formData.display_name && !ProfileValidation.display_name.pattern.test(formData.display_name)) {
        validationErrors.push('Display name can only contain letters, numbers, spaces, hyphens, and underscores');
      }

      if (formData.kucoin_uid && !ProfileValidation.kucoin_uid.pattern.test(formData.kucoin_uid)) {
        validationErrors.push('KuCoin UID can only contain letters, numbers, and underscores');
      }

      if (formData.telegram_handle && !ProfileValidation.telegram_handle.pattern.test(formData.telegram_handle)) {
        validationErrors.push('Telegram handle can only contain letters, numbers, and underscores');
      }

      if (formData.x_handle && !ProfileValidation.x_handle.pattern.test(formData.x_handle)) {
        validationErrors.push('X handle can only contain letters, numbers, and underscores');
      }

      if (formData.email && !ProfileValidation.email.pattern.test(formData.email)) {
        validationErrors.push('Please enter a valid email address');
      }

      if (validationErrors.length > 0) {
        setUpdateError(validationErrors.join(', '));
        setUpdateLoading(false);
        return;
      }

      await updateProfile(formData);
      setEditMode(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSyncNFTs = async () => {
    if (!isAuthenticated) return;

    setSyncLoading(true);
    try {
      await syncNFTs();
    } catch (error) {
      console.error('Error syncing NFTs:', error);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSetProfilePicture = async (nftTokenId: number) => {
    if (!isAuthenticated) return;

    try {
      await setProfilePicture(nftTokenId);
    } catch (error) {
      console.error('Error setting profile picture:', error);
    }
  };

  const getProfileImage = () => {
    if (profile?.profile?.profile_picture_nft_id) {
      const nft = profile.owned_nfts.find(nft => nft.nft_token_id === profile.profile.profile_picture_nft_id);
      return nft?.metadata.image || '/images/nfts/1200.webp';
    }
    return '/images/nfts/1200.webp';
  };

  // Check if user is a member (owns at least one NFT)
  const isMember = profile?.stats?.membership_status === 'member';

  return (
    <div>
      <PageHeader 
        title="Profile" 
        subtitle="Manage your account settings and preferences"
      />

      {/* Membership Status Banner */}
      {!isMember && isAuthenticated && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>You are not a member</Alert.Heading>
          <p className="mb-0">
            To become a member, you must own at least one Lomen NFT. Connect your wallet and sync your NFTs to check your membership status.
          </p>
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={8}>
          {/* Personal Information Card */}
          <Card style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
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
            <Card.Header style={{
              background: 'transparent',
              borderBottom: '1px solid var(--border-primary)',
              padding: '20px 24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  Personal Information
                </h5>
                {isAuthenticated && !editMode && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setEditMode(true)}
                    disabled={!isMember}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              {!isAuthenticated ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  {authError && (
                    <Alert variant="danger" className="mb-3">
                      Authentication failed: {authError}
                    </Alert>
                  )}
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    marginBottom: '16px'
                  }}>
                    {isConnected ? 'Wallet connected! Click Authenticate to continue.' : 'Connect your wallet and authenticate to view and manage your profile'}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                    {!isConnected && (
                      <Button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        variant="primary"
                      >
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                      </Button>
                    )}
                    {isConnected && (
                      <>
                        <Button
                          onClick={authenticate}
                          disabled={authLoading}
                          variant="success"
                        >
                          {authLoading ? 'Authenticating...' : 'Authenticate'}
                        </Button>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Wallet: {account?.slice(0, 6)}...{account?.slice(-4)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : profileLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spinner animation="border" variant="primary" />
                  <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
                    Loading profile...
                  </p>
                </div>
              ) : profileError ? (
                <Alert variant="danger">
                  {profileError}
                </Alert>
              ) : (
                <>
                  {updateError && (
                    <Alert variant="danger" className="mb-3">
                      {updateError}
                    </Alert>
                  )}
                  {updateSuccess && (
                    <Alert variant="success" className="mb-3">
                      Profile updated successfully!
                    </Alert>
                  )}

                  <Form>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Display Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.display_name || ''}
                            onChange={(e) => handleInputChange('display_name', e.target.value)}
                            disabled={!editMode || !isMember}
                            placeholder="Enter your display name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>KuCoin UID</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.kucoin_uid || ''}
                            onChange={(e) => handleInputChange('kucoin_uid', e.target.value)}
                            disabled={!editMode || !isMember}
                            placeholder="Enter your KuCoin UID"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Telegram Handle</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.telegram_handle || ''}
                            onChange={(e) => handleInputChange('telegram_handle', e.target.value)}
                            disabled={!editMode || !isMember}
                            placeholder="@username"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>X (Twitter) Handle</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.x_handle || ''}
                            onChange={(e) => handleInputChange('x_handle', e.target.value)}
                            disabled={!editMode || !isMember}
                            placeholder="@username"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            disabled={!editMode || !isMember}
                            placeholder="Enter your email address"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {editMode && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <Button
                          variant="primary"
                          onClick={handleSaveProfile}
                          disabled={updateLoading || !isMember}
                        >
                          {updateLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            setEditMode(false);
                            setUpdateError(null);
                            // Reset form data to original profile data
                            if (profile?.profile) {
                              setFormData({
                                display_name: profile.profile.display_name || '',
                                kucoin_uid: profile.profile.kucoin_uid || '',
                                telegram_handle: profile.profile.telegram_handle || '',
                                x_handle: profile.profile.x_handle || '',
                                email: profile.profile.email || '',
                              });
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Profile Picture Section */}
          {isAuthenticated && isMember && (
            <Card style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px',
              marginTop: '24px',
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
              <Card.Header style={{
                background: 'transparent',
                borderBottom: '1px solid var(--border-primary)',
                padding: '20px 24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                  }}>
                    Profile Picture
                  </h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleSyncNFTs}
                    disabled={syncLoading}
                  >
                    {syncLoading ? 'Syncing...' : 'Sync NFTs'}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '60px',
                    overflow: 'hidden',
                    border: '3px solid var(--border-primary)',
                    flexShrink: 0
                  }}>
                    <img 
                      src={getProfileImage()} 
                      alt="Current Profile Picture" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  <div>
                    <h6 style={{
                      margin: '0 0 8px 0',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      Current Profile Picture
                    </h6>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      margin: '0 0 16px 0'
                    }}>
                      {profile?.profile?.profile_picture_nft_id 
                        ? `Your profile picture is set to Lomen NFT #${profile.profile.profile_picture_nft_id}.`
                        : 'Select any of your owned NFTs to set as your profile picture.'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h6 style={{
                    margin: '0 0 16px 0',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    Your NFT Collection ({profile?.owned_nfts?.length || 0})
                  </h6>
                  
                  {profile?.owned_nfts && profile.owned_nfts.length > 0 ? (
                    <Row className="g-3">
                      {profile.owned_nfts.map((nft) => (
                        <Col xs={6} sm={4} md={3} key={nft.nft_token_id}>
                          <div 
                            style={{
                              borderRadius: '12px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: profile?.profile?.profile_picture_nft_id === nft.nft_token_id 
                                ? '2px solid #23AF91' 
                                : '1px solid var(--border-primary)',
                              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            onClick={() => handleSetProfilePicture(nft.nft_token_id)}
                          >
                            <img 
                              src={nft.metadata.image} 
                              alt={nft.metadata.name} 
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '10px'
                              }}
                            />
                          </div>
                          <div style={{
                            textAlign: 'center',
                            marginTop: '8px',
                            fontSize: '0.75rem',
                            color: profile?.profile?.profile_picture_nft_id === nft.nft_token_id 
                              ? '#23AF91' 
                              : 'var(--text-secondary)',
                            fontWeight: profile?.profile?.profile_picture_nft_id === nft.nft_token_id ? 600 : 400
                          }}>
                            {profile?.profile?.profile_picture_nft_id === nft.nft_token_id ? 'Current' : `#${nft.nft_token_id}`}
                          </div>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        marginBottom: '16px'
                      }}>
                        No NFTs found in your wallet
                      </p>
                      <Button
                        variant="outline-primary"
                        onClick={handleSyncNFTs}
                        disabled={syncLoading}
                      >
                        {syncLoading ? 'Syncing...' : 'Sync NFTs from Blockchain'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
        
        <Col lg={4}>
          {/* Profile Stats Card */}
          {isAuthenticated && (
            <Card style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px',
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
              <Card.Header style={{
                background: 'transparent',
                borderBottom: '1px solid var(--border-primary)',
                padding: '20px 24px'
              }}>
                <h5 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  Profile Stats
                </h5>
              </Card.Header>
              <Card.Body style={{ padding: '24px' }}>
                {profileLoading ? (
                  <div style={{ textAlign: 'center' }}>
                    <Spinner animation="border" variant="primary" size="sm" />
                    <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Loading stats...
                    </p>
                  </div>
                ) : profile?.stats ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}>
                        Membership Status
                      </div>
                      <Badge 
                        bg={profile.stats.membership_status === 'member' ? 'success' : 'warning'}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {profile.stats.membership_status === 'member' ? 'Member' : 'Non-Member'}
                      </Badge>
                    </div>
                    
                    <div>
                      <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}>
                        Total NFTs Owned
                      </div>
                      <div style={{
                        color: 'var(--text-primary)',
                        fontSize: '1.25rem',
                        fontWeight: 700
                      }}>
                        {profile.stats.total_nfts_owned}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}>
                        Reward Eligibility
                      </div>
                      <Badge 
                        bg={profile.stats.reward_eligibility_status === 'eligible' ? 'success' : 'secondary'}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {profile.stats.reward_eligibility_status === 'eligible' ? 'Eligible' : 'Not Eligible'}
                      </Badge>
                    </div>
                    
                    <div>
                      <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}>
                        Total Staked KCS
                      </div>
                      <div style={{
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        fontWeight: 600
                      }}>
                        {profile.stats.total_staked_kcs} KCS
                      </div>
                    </div>
                    
                    <div>
                      <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}>
                        Governance Participation
                      </div>
                      <Badge 
                        bg={profile.stats.governance_participation ? 'success' : 'secondary'}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {profile.stats.governance_participation ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No stats available
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Wallet Information Card */}
          <Card style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
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
            <Card.Header style={{
              background: 'transparent',
              borderBottom: '1px solid var(--border-primary)',
              padding: '20px 24px'
            }}>
              <h5 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                Wallet Information
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              {isConnected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '4px'
                    }}>
                      Wallet Address
                    </div>
                    <div style={{
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontWeight: 500,
                      fontFamily: 'monospace',
                      backgroundColor: 'var(--bg-primary)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-primary)',
                      wordBreak: 'break-all'
                    }}>
                      {account}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '4px'
                    }}>
                      Network
                    </div>
                    <div style={{
                      color: chainId === '0x141' ? '#16A34A' : '#EF4444',
                      fontSize: '1rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--bg-primary)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: chainId === '0x141' ? '#16A34A' : '#EF4444'
                      }} />
                      {chainId === '0x141' ? 'KCC Mainnet' : `Chain ID: ${chainId}`}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '4px'
                    }}>
                      KCS Balance
                    </div>
                    <div style={{
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--bg-primary)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-primary)'
                    }}>
                      {chainId === '0x141' ? (kcsBalance ? `${kcsBalance} KCS` : 'Loading...') : 'Switch to KCC to view balance'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    marginBottom: '16px'
                  }}>
                    Connect your wallet to view wallet information
                  </p>
                  <Button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    variant="primary"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
