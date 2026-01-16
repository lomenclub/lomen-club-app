import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge, Container, InputGroup } from 'react-bootstrap';
import { Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nftService, type NFTMetadata, type FilterState, type AvailableTraits } from '../services/nftApi';

const NFTExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [allNFTs, setAllNFTs] = useState<NFTMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'tokenId' | 'rarityRank'>('tokenId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [availableTraits, setAvailableTraits] = useState<AvailableTraits>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [onSale, setOnSale] = useState(false);

  const handleViewDetails = (tokenId: number) => {
    navigate(`/app/nft/${tokenId}`);
  };

  // Load NFTs from MongoDB API
  useEffect(() => {
    const loadNFTs = async () => {
      try {
        setLoading(true);
        const response = await nftService.getNFTs({
          page: currentPage,
          limit: itemsPerPage,
          sortBy,
          sortOrder,
          search: searchTerm,
          filters,
          onSale
        });
        
        setAllNFTs(response.nfts);
        setTotalNFTs(response.pagination.total);
        setLoading(false);
      } catch (error) {
        console.error('Error loading NFTs:', error);
        setLoading(false);
      }
    };

    loadNFTs();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, searchTerm, filters, onSale]);

  // Load available traits
  useEffect(() => {
    const loadAvailableTraits = async () => {
      try {
        const traits = await nftService.getAvailableTraits();
        setAvailableTraits(traits);
      } catch (error) {
        console.error('Error loading available traits:', error);
      }
    };

    loadAvailableTraits();
  }, []);

  // Load total NFT count
  useEffect(() => {
    const loadTotalNFTs = async () => {
      try {
        const stats = await nftService.getNFTStats();
        setTotalNFTs(stats.totalNFTs);
      } catch (error) {
        console.error('Error loading NFT stats:', error);
      }
    };

    loadTotalNFTs();
  }, []);

  const totalPages = Math.ceil(totalNFTs / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const loadNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const loadPrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { traitType: '', traitValue: '', logic: 'OR' }]);
  };

  const updateFilter = (index: number, field: keyof FilterState, value: string) => {
    const newFilters = [...filters];
    if (field === 'logic') {
      // When changing logic, update all filters to maintain consistency
      newFilters.forEach(filter => {
        filter.logic = value as 'AND' | 'OR';
      });
    } else {
      newFilters[index][field] = value;
    }
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setFilters([]);
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading NFTs...</span>
          </div>
          <p className="mt-4 text-muted">Loading NFT metadata...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="h2 mb-2">Lomen NFT Explorer</h1>
        <p className="text-muted mb-0">
          Explore {allNFTs.length.toLocaleString()} Lomen NFTs with advanced filtering and sorting
        </p>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            {/* Search */}
            <Col md={6} lg={4}>
              <Form.Label className="form-label small text-muted mb-2">Search NFTs</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-surface border-end-0">
                  <Search size={16} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name or attribute..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>

            {/* Sort Controls */}
            <Col md={3} lg={2}>
              <Form.Label className="form-label small text-muted mb-2">Sort by</Form.Label>
              <Form.Select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'tokenId' | 'rarityRank');
                  setCurrentPage(1);
                }}
                className="border-0 shadow-sm"
              >
                <option value="tokenId">ID</option>
                <option value="rarityRank">Rarity Rank</option>
              </Form.Select>
            </Col>

            <Col md={3} lg={2}>
              <Form.Label className="form-label small text-muted mb-2">Order</Form.Label>
              <Form.Select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'asc' | 'desc');
                  setCurrentPage(1);
                }}
                className="border-0 shadow-sm"
              >
                <option value="asc">
                  {sortBy === 'tokenId' ? 'Lowest First' : 'Lowest Rarity'}
                </option>
                <option value="desc">
                  {sortBy === 'tokenId' ? 'Highest First' : 'Highest Rarity'}
                </option>
              </Form.Select>
            </Col>

            {/* Items per page */}
            <Col md={3} lg={2}>
              <Form.Label className="form-label small text-muted mb-2">Items per page</Form.Label>
              <Form.Select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border-0 shadow-sm"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Form.Select>
            </Col>

            {/* Results count */}
            <Col md={3} lg={2}>
              <div className="text-center p-2 bg-primary-50 rounded">
                <div className="small text-muted">Results</div>
                <div className="fw-bold text-primary">{allNFTs.length.toLocaleString()}</div>
              </div>
            </Col>
          </Row>

          {/* Quick Filters */}
          <div className="mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="mb-0 d-flex align-items-center">
                  <Filter size={16} className="me-2 text-primary" />
                  Quick Filters
                </h6>
                <small className="text-muted">Quickly filter NFTs by common criteria</small>
              </div>
            </div>
            
            {/* On Sale Filter Pill */}
            <div className="mb-3">
              <Button
                variant={onSale ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => {
                  setOnSale(!onSale);
                  setCurrentPage(1);
                }}
                className="me-2 mb-2"
              >
                🏪 On Sale {onSale && "✓"}
              </Button>
              <small className="text-muted">
                {onSale ? "Showing NFTs listed on KuSwap marketplace" : "Show NFTs currently listed for sale"}
              </small>
            </div>
          </div>

          {/* Attribute Filters */}
          <div className="mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="mb-0 d-flex align-items-center">
                  <Filter size={16} className="me-2 text-primary" />
                  Attribute Filters
                </h6>
                <small className="text-muted">Filter NFTs by specific traits and attributes</small>
              </div>
              <div>
                <Button variant="outline-primary" size="sm" onClick={addFilter} className="me-2">
                  + Add Filter
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              </div>
            </div>

            {filters.map((filter, index) => (
              <Row key={index} className="g-2 mb-3 align-items-center">
                <Col md={4}>
                  <Form.Label className="form-label small text-muted mb-1">Trait Type</Form.Label>
                  <Form.Select
                    value={filter.traitType}
                    onChange={(e) => updateFilter(index, 'traitType', e.target.value)}
                    className="border-0 shadow-sm"
                  >
                    <option value="">Select trait type</option>
                    {Object.keys(availableTraits).map(traitType => (
                      <option key={traitType} value={traitType}>{traitType}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="form-label small text-muted mb-1">Trait Value</Form.Label>
                  <Form.Select
                    value={filter.traitValue}
                    onChange={(e) => updateFilter(index, 'traitValue', e.target.value)}
                    disabled={!filter.traitType}
                    className="border-0 shadow-sm"
                  >
                    <option value="">Select value</option>
                    {filter.traitType && availableTraits[filter.traitType]?.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="form-label small text-muted mb-1">Logic</Form.Label>
                  {index === 0 ? (
                    <Form.Select
                      value={filter.logic}
                      onChange={(e) => updateFilter(index, 'logic', e.target.value)}
                      className="border-0 shadow-sm"
                    >
                      <option value="AND">AND (All must match)</option>
                      <option value="OR">OR (Any can match)</option>
                    </Form.Select>
                  ) : (
                    <div className="text-muted small p-2 bg-light rounded">
                      Uses {filter.logic} logic
                    </div>
                  )}
                </Col>
                <Col md={2}>
                  <Form.Label className="form-label small text-muted mb-1">&nbsp;</Form.Label>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeFilter(index)}
                    className="w-100"
                  >
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Results Info */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <p className="text-muted mb-0">
          Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, allNFTs.length)}</strong> of <strong>{totalNFTs.toLocaleString()}</strong> NFTs
          {filters.length > 0 && (
            <span className="ms-2">
              <Badge bg="primary" className="ms-1">{filters.length} filter{filters.length > 1 ? 's' : ''}</Badge>
              <Badge bg="secondary" className="ms-1">{filters[0].logic} logic</Badge>
            </span>
          )}
        </p>
        {allNFTs.length > 0 && (
          <div className="text-muted small">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
        )}
      </div>

      {/* NFT Grid */}
      <Row className="g-3">
        {allNFTs.map((nft: NFTMetadata) => (
          <Col key={nft.tokenId} xs={6} sm={4} md={3} lg={2}>
            <Card className="h-100 nft-card border-0 shadow-sm hover-lift">
              <div className="position-relative overflow-hidden">
                <Card.Img 
                  variant="top" 
                  src={nft.image} 
                  alt={nft.name}
                  style={{ height: '180px', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/nfts/1.webp'; // Fallback image
                  }}
                />
              </div>
              <Card.Body className="d-flex flex-column p-3">
                <Card.Title className="h6 mb-2 text-truncate" title={nft.name}>
                  {nft.name}
                </Card.Title>
                
                <div className="mb-2">
                  <div className="d-flex gap-1 flex-wrap">
                    <Badge bg="primary" className="nft-rarity">
                      Rank #{nft.rarity.rank}
                    </Badge>
                    <Badge bg="secondary" className="nft-rarity">
                      Score: {nft.rarity.score}
                    </Badge>
                  </div>
                </div>

                <div className="mt-auto">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="w-100"
                    onClick={() => handleViewDetails(nft.tokenId)}
                  >
                    View Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted small">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> • Total: <strong>{totalNFTs.toLocaleString()}</strong> NFTs
          </div>
          
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={loadPrevPage}
              disabled={!hasPrevPage}
              className="px-3"
            >
              ← Previous
            </Button>
            
            <div className="d-flex align-items-center mx-3">
              <span className="text-muted small">
                {currentPage} / {totalPages}
              </span>
            </div>
            
            <Button
              variant="outline-primary"
              size="sm"
              onClick={loadNextPage}
              disabled={!hasNextPage}
              className="px-3"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {allNFTs.length === 0 && (
        <div className="text-center py-5">
          <div className="mb-4">
            <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>🔍</div>
            <h4 className="text-muted mb-2">No NFTs Found</h4>
            <p className="text-muted mb-4">
              {filters.length > 0 || searchTerm ? 
                "Try adjusting your search criteria or filters to find more results." :
                "No NFTs are currently available in the collection."
              }
            </p>
          </div>
          {(filters.length > 0 || searchTerm) && (
            <Button variant="primary" onClick={clearAllFilters} size="lg">
              Clear All Filters
            </Button>
          )}
        </div>
      )}
    </Container>
  );
};

export default NFTExplorer;
