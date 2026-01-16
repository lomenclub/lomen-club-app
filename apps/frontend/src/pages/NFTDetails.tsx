import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Table, Alert } from 'react-bootstrap';
import { ArrowLeft, ExternalLink, Copy, Check, User, Clock, Share2 } from 'lucide-react';
import { nftService, type NFTMetadata } from '../services/nftApi';
import { blockchainService, type NFTOwner, type NFTTransaction } from '../services/blockchainApi';

const NFTDetails: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const [nft, setNft] = useState<NFTMetadata | null>(null);
  const [owner, setOwner] = useState<NFTOwner | null>(null);
  const [transactions, setTransactions] = useState<NFTTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockchainLoading, setBlockchainLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadNFTData = async () => {
      if (!tokenId) return;
      
      try {
        setLoading(true);
        setBlockchainLoading(true);
        
        // Load NFT metadata from MongoDB
        const nftData = await nftService.getNFT(parseInt(tokenId));
        setNft(nftData);
        
        // Load blockchain data
        try {
          const ownerData = await blockchainService.getNFTOwner(parseInt(tokenId));
          setOwner(ownerData);
          
          const transactionsData = await blockchainService.getNFTTransactions(parseInt(tokenId));
          setTransactions(transactionsData.transactions);
        } catch (blockchainError) {
          console.warn('Blockchain service not available:', blockchainError);
          // Continue without blockchain data
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading NFT:', err);
        setError('Failed to load NFT details');
      } finally {
        setLoading(false);
        setBlockchainLoading(false);
      }
    };

    loadNFTData();
  }, [tokenId]);

  const handleBack = () => {
    navigate('/app/explorer');
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewOnMarketplace = () => {
    // This would open the NFT on a marketplace like OpenSea or KCC marketplace
    window.open(`https://explorer.kcc.io/token/${tokenId}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: nft?.name || 'Lomen NFT',
        text: `Check out this Lomen NFT: ${nft?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading NFT...</span>
          </div>
          <p className="mt-4 text-muted">Loading NFT details...</p>
        </div>
      </Container>
    );
  }

  if (error || !nft) {
    return (
      <Container className="py-4">
        <div className="text-center py-5">
          <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>❌</div>
          <h4 className="text-muted mb-2">NFT Not Found</h4>
          <p className="text-muted mb-4">
            {error || 'The requested NFT could not be found.'}
          </p>
          <Button variant="primary" onClick={handleBack}>
            Back to Explorer
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={handleBack}
          className="mb-3 d-flex align-items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Explorer
        </Button>
        
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1 className="h2 mb-2">{nft.name}</h1>
            <p className="text-muted mb-0">
              Lomen NFT #{nft.tokenId} • Explore detailed attributes and blockchain information
            </p>
          </div>
          <div className="d-flex gap-2">
            <Badge bg="primary" className="fs-6">
              Rank #{nft.rarity.rank}
            </Badge>
            <Badge bg="secondary" className="fs-6">
              Score: {nft.rarity.score}
            </Badge>
          </div>
        </div>
      </div>

      <Row className="g-4">
        {/* NFT Image */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="position-relative">
                <img 
                  src={nft.image} 
                  alt={nft.name}
                  className="img-fluid w-100 rounded-top"
                  style={{ maxHeight: '500px', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/nfts/1.webp'; // Fallback image
                  }}
                />
              </div>
              <div className="p-4">
                <h5 className="mb-3">Description</h5>
                <p className="text-muted mb-0" style={{ lineHeight: '1.6' }}>
                  {nft.description}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* NFT Details */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <h5 className="mb-4">NFT Information</h5>
              
              {/* Ownership Section */}
              <div className="mb-4 p-3 bg-surface rounded">
                <h6 className="mb-3 text-primary d-flex align-items-center">
                  <User size={18} className="me-2" />
                  Ownership Information
                </h6>
                {blockchainLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading ownership...</span>
                    </div>
                    <p className="text-muted mt-2 mb-0">Loading blockchain data...</p>
                  </div>
                ) : owner || nft.blockchainData ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Current Owner</span>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`fw-semibold ${(owner?.isOwned || nft.blockchainData?.isOwned) ? 'text-primary' : 'text-muted'}`}>
                          {owner?.ownerShort || nft.blockchainData?.ownerShort || 'Unknown'}
                        </span>
                        {(owner?.isOwned || nft.blockchainData?.isOwned) && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="p-1"
                            onClick={() => handleCopyAddress(owner?.owner || nft.blockchainData?.owner || '')}
                          >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                          </Button>
                        )}
                      </div>
                    </div>
                    {(owner?.note || nft.blockchainData?.note) && (
                      <Alert variant="info" className="small mt-2 mb-0">
                        {owner?.note || nft.blockchainData?.note}
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-muted mb-0">Blockchain data not available</p>
                  </div>
                )}
              </div>

              {/* Rarity Stats */}
              <div className="mb-4 p-3 bg-surface rounded">
                <h6 className="mb-3 text-primary">Rarity Information</h6>
                <Row className="g-3">
                  <Col sm={6}>
                    <div className="text-center p-3 bg-elevated rounded">
                      <div className="small text-muted mb-1">Rarity Rank</div>
                      <div className="h4 fw-bold text-primary">#{nft.rarity.rank}</div>
                      <div className="small text-muted">out of 10,000</div>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="text-center p-3 bg-elevated rounded">
                      <div className="small text-muted mb-1">Rarity Score</div>
                      <div className="h4 fw-bold text-primary">{nft.rarity.score}</div>
                      <div className="small text-muted">total points</div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Attributes Table */}
              <div className="mb-4">
                <h6 className="mb-3 text-primary">Traits & Attributes</h6>
                <div className="table-responsive">
                  <Table borderless className="mb-0">
                    <thead>
                      <tr>
                        <th className="small text-muted fw-semibold text-uppercase">Trait Type</th>
                        <th className="small text-muted fw-semibold text-uppercase">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nft.attributes.map((attr, index) => (
                        <tr key={index} className="border-bottom border-color">
                          <td className="py-3">
                            <span className="fw-semibold text-primary">{attr.trait_type}</span>
                          </td>
                          <td className="py-3">
                            <Badge bg="elevated" className="text-secondary fw-normal">
                              {attr.value}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Transaction History */}
              {transactions.length > 0 && (
                <div className="mb-4">
                  <h6 className="mb-3 text-primary d-flex align-items-center">
                    <Clock size={18} className="me-2" />
                    Transaction History
                  </h6>
                  <div className="table-responsive">
                    <Table borderless className="mb-0">
                      <thead>
                        <tr>
                          <th className="small text-muted fw-semibold text-uppercase">Type</th>
                          <th className="small text-muted fw-semibold text-uppercase">From</th>
                          <th className="small text-muted fw-semibold text-uppercase">To</th>
                          <th className="small text-muted fw-semibold text-uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, index) => (
                          <tr key={index} className="border-bottom border-color">
                            <td className="py-2">
                              <Badge 
                                bg={tx.type === 'Mint' ? 'success' : 'primary'} 
                                className="fw-normal"
                              >
                                {tx.type}
                              </Badge>
                            </td>
                            <td className="py-2 small">
                              {blockchainService.formatWalletAddress(tx.from)}
                            </td>
                            <td className="py-2 small">
                              {blockchainService.formatWalletAddress(tx.to)}
                            </td>
                            <td className="py-2 small text-muted">
                              {formatDate(tx.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-top border-color">
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    className="flex-fill"
                    onClick={handleViewOnMarketplace}
                  >
                    <ExternalLink size={16} className="me-2" />
                    View on KCC Explorer
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    onClick={handleShare}
                  >
                    {copied ? <Check size={16} /> : <Share2 size={16} />}
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NFTDetails;
