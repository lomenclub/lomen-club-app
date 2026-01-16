# MongoDB Query Performance Analysis

## Purpose
Document MongoDB query patterns and performance observations for NFTs and profiles.

## Audience
Backend developers and database operators.

## Prerequisites
- Access to MongoDB and relevant collections.

## Last Verified
2026-01-03 (legacy QA run).

## Test Date
2026-01-03

## Test Scope
MongoDB query performance, index usage, and query patterns for NFT collection.

## Current Index Analysis

### Existing Indexes (from code inspection)
**User Profiles Collection:**
1. `{ wallet_address: 1 }` (unique)
2. `{ created_at: -1 }`
3. `{ updated_at: -1 }`

**User NFTs Collection:**
1. `{ wallet_address: 1, nft_token_id: 1 }` (unique)
2. `{ wallet_address: 1 }`
3. `{ nft_token_id: 1 }`
4. `{ last_synced_at: -1 }`

**NFTs Collection (MAIN ISSUE):**
- **NO INDEXES CREATED** - This is a critical performance issue

## Query Patterns Analysis

### 1. Paginated Queries (`getNFTsWithOnSaleStatus`)
```javascript
// Common query patterns:
.find(mongoQuery).sort(sort).skip(skip).limit(limit)
.countDocuments(mongoQuery)

// Where mongoQuery can include:
- { tokenId: value } (equality)
- { 'blockchainData.owner': value } (equality for on-sale filtering)
- { $or: [...] } (search on name or attributes.value)
- { $and: [...] } or { $or: [...] } (attribute filters)
```

### 2. Single NFT Lookup
```javascript
.findOne({ tokenId: number })
```

### 3. Owner-based Queries
```javascript
.find({ 'blockchainData.owner': normalizedOwner })
.sort({ tokenId: 1 })
```

### 4. Aggregation Queries
```javascript
// For traits:
.aggregate([
  { $unwind: '$attributes' },
  { $group: { _id: '$attributes.trait_type', values: { $addToSet: '$attributes.value' } } },
  { $sort: { _id: 1 } }
])

// For stats:
.aggregate([
  { $group: {
    _id: null,
    totalNFTs: { $sum: 1 },
    avgRarityScore: { $avg: '$rarity.score' },
    minRarityRank: { $min: '$rarity.rank' },
    maxRarityRank: { $max: '$rarity.rank' }
  } }
])
```

### 5. Count Queries
```javascript
.countDocuments({ 'blockchainData.owner': KUSWAP_LISTING_WALLET })
```

## Missing Indexes Analysis

### Critical Missing Indexes:

1. **`{ tokenId: 1 }`** (unique)
   - Used for: Single NFT lookups (`getNFTByTokenId`)
   - Impact: Without this, single NFT lookups perform collection scans

2. **`{ 'blockchainData.owner': 1 }`**
   - Used for: On-sale filtering, owner-based queries
   - Impact: Collection scans for on-sale queries and owner lookups

3. **`{ 'rarity.rank': 1 }`**
   - Used for: Sorting by rarity rank
   - Impact: In-memory sorting for large datasets

4. **Compound index for common query patterns:**
   - `{ 'blockchainData.owner': 1, tokenId: 1 }` for paginated on-sale queries
   - `{ tokenId: 1, 'blockchainData.owner': 1 }` for reverse lookup

5. **Text index for search:**
   - `{ name: 'text', 'attributes.value': 'text' }`
   - Current: Using `$regex` with `$options: 'i'` which doesn't use indexes efficiently

## Performance Risks

### 1. Collection Scans
- **Risk:** All queries perform full collection scans
- **Impact:** O(n) complexity instead of O(log n)
- **Data Size:** 10,000+ NFTs → significant performance degradation

### 2. In-Memory Sorting
- **Risk:** Large result sets sorted in memory
- **Impact:** Memory pressure and slow response times
- **Example:** Sorting 10,000 NFTs by rarity rank without index

### 3. Regex Search Performance
- **Risk:** `$regex` with `$options: 'i'` can't use indexes efficiently
- **Impact:** Full collection scan for search queries
- **Alternative:** Use text index or case-insensitive collation

### 4. Pagination Performance
- **Risk:** `skip()` with large offsets becomes slow
- **Impact:** Deep pagination (page 100+) becomes increasingly slow
- **Alternative:** Use range-based pagination with indexed fields

### 5. Aggregation Performance
- **Risk:** `$unwind` on large arrays without indexes
- **Impact:** Memory-intensive operations
- **Mitigation:** Ensure adequate memory and consider pre-aggregation

## Test Queries for Reproduction

### 1. Test Collection Scan:
```javascript
// Without index on tokenId
db.nfts.find({ tokenId: 1234 }).explain('executionStats')
// Should show COLLSCAN
```

### 2. Test On-Sale Query:
```javascript
// Without index on blockchainData.owner
db.nfts.find({ 'blockchainData.owner': '0x123...' }).explain('executionStats')
// Should show COLLSCAN
```

### 3. Test Sort Performance:
```javascript
// Without index on rarity.rank
db.nfts.find({}).sort({ 'rarity.rank': 1 }).limit(20).explain('executionStats')
// Should show SORT stage in memory
```

### 4. Test Search Performance:
```javascript
// Current regex search
db.nfts.find({ name: { $regex: 'lomen', $options: 'i' } }).explain('executionStats')
// Should show COLLSCAN
```

## Recommended Indexes

### High Priority (Immediate):
1. **`{ tokenId: 1 }`** - Unique index for primary key lookups
2. **`{ 'blockchainData.owner': 1 }`** - For on-sale and owner queries
3. **`{ 'rarity.rank': 1 }`** - For sorting by rarity

### Medium Priority:
4. **`{ tokenId: 1, 'blockchainData.owner': 1 }`** - Compound index for common patterns
5. **`{ 'attributes.trait_type': 1, 'attributes.value': 1 }`** - For attribute filtering
6. **Text index on `{ name: 'text', 'attributes.value': 'text' }`** - For search

### Low Priority:
7. **`{ createdAt: -1 }`** - For chronological queries
8. **`{ 'metadata.name': 1 }`** - For name-based lookups

## Implementation Steps

### 1. Create Index Creation Script:
```javascript
// Add to DatabaseService.createIndexes()
await this.nftsCollection!.createIndex({ tokenId: 1 }, { unique: true });
await this.nftsCollection!.createIndex({ 'blockchainData.owner': 1 });
await this.nftsCollection!.createIndex({ 'rarity.rank': 1 });
await this.nftsCollection!.createIndex({ 
  'attributes.trait_type': 1, 
  'attributes.value': 1 
});
```

### 2. Update Search Implementation:
```javascript
// Consider replacing regex with text search
await this.nftsCollection!.createIndex(
  { name: 'text', 'attributes.value': 'text' },
  { weights: { name: 10, 'attributes.value': 5 } }
);

// Then use text search instead of regex
.find({ $text: { $search: searchTerm } })
```

### 3. Add Pagination Optimization:
```javascript
// For deep pagination, consider range-based approach
// Instead of: .skip((page - 1) * limit)
// Use: .find({ tokenId: { $gt: lastTokenId } }).limit(limit)
```

## Expected Performance Improvements

### With Indexes:
- Single NFT lookup: 1-10ms (vs 100-1000ms)
- On-sale queries: 10-50ms (vs 500-5000ms)
- Sorted queries: 10-100ms (vs 1000-10000ms with in-memory sort)
- Search queries: 50-200ms (vs 1000-5000ms with regex scan)

### Without Indexes (Current State):
- All queries perform collection scans
- Performance degrades linearly with data size
- 10,000 NFTs → ~100ms per query (estimated)
- 100,000 NFTs → ~1000ms per query (estimated)

## Conclusion

**Critical Issue:** The NFTs collection has no indexes, causing all queries to perform full collection scans.

**Immediate Action Required:** Create at minimum the three high-priority indexes:
1. `{ tokenId: 1 }` (unique)
2. `{ 'blockchainData.owner': 1 }`
3. `{ 'rarity.rank': 1 }`

**Long-term:** Implement text search index and optimize pagination for large datasets.

**Risk Level:** HIGH - Production performance will be unacceptable as dataset grows.
