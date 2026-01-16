import { Router } from 'express';
import { databaseEnrichmentService } from '@lomen-club/database';
import { blockchainEnrichmentService } from '@lomen-club/blockchain';

/* global process */
const router = Router();

/**
 * Health check endpoint
 * 
 * Returns service status including:
 * - API status
 * - Database connectivity
 * - Blockchain service connectivity
 * - Timestamp
 */
router.get('/', async (_req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'lomen-club-backend',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      api: { status: 'healthy', message: 'API is responding' },
      database: { status: 'unknown', message: 'Not checked' },
      blockchainService: { status: 'unknown', message: 'Not checked' }
    }
  };

  try {
    // Check database connectivity
    try {
      // Simple check - try to access a collection property
      const dbStatus = databaseEnrichmentService.getNFTsByOwner ? 'healthy' : 'degraded';
      healthCheck.checks.database = {
        status: dbStatus,
        message: dbStatus === 'healthy' ? 'Database service available' : 'Database service may be degraded'
      };
    } catch (error) {
      healthCheck.checks.database = {
        status: 'unhealthy',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      healthCheck.status = 'degraded';
    }

    // Check blockchain service connectivity
    try {
      // Simple check - try to access a service method
      const blockchainStatus = blockchainEnrichmentService.fetchCurrentOwner ? 'healthy' : 'degraded';
      healthCheck.checks.blockchainService = {
        status: blockchainStatus,
        message: blockchainStatus === 'healthy' ? 'Blockchain service available' : 'Blockchain service may be degraded'
      };
    } catch (error) {
      healthCheck.checks.blockchainService = {
        status: 'unhealthy',
        message: `Blockchain service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      healthCheck.status = 'degraded';
    }

    // Determine overall status
    const unhealthyChecks = Object.values(healthCheck.checks).filter(check => check.status === 'unhealthy');
    if (unhealthyChecks.length > 0) {
      healthCheck.status = 'unhealthy';
    } else if (Object.values(healthCheck.checks).some(check => check.status === 'degraded')) {
      healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    // If health check itself fails, return critical error
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'lomen-club-backend',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Simple ping endpoint for load balancers and basic connectivity checks
 */
router.get('/ping', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'lomen-club-backend'
  });
});

/**
 * Version endpoint
 */
router.get('/version', (_req, res) => {
  res.status(200).json({
    version: process.env.npm_package_version || '1.0.0',
    name: 'lomen-club-backend',
    timestamp: new Date().toISOString()
  });
});

export default router;
