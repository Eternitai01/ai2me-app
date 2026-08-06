/**
 * Batch Configuration Management API Route
 * Manages real batch processing configuration with database persistence
 * Admin-only endpoint for batch settings management
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

// Database connection for blockchain service
const pool = new Pool({
  connectionString: process.env.BLOCKCHAIN_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Default batch configuration
const DEFAULT_BATCH_CONFIG = {
  batch_size: 25,
  processing_interval: 300, // 5 minutes
  auto_batch: true,
  max_batch_age: 1800, // 30 minutes
  retry_attempts: 3,
  max_concurrent_batches: 5,
  timeout_settings: {
    s3_upload: 30000,
    acl_logging: 10000,
    blockchain_submission: 60000,
  }
};

async function batchConfigHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    // Check admin permissions
    if (user.role !== 'admin' && !user.permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions - admin access required' },
        { status: 403 }
      );
    }

    if (request.method === 'GET') {
      return await getBatchConfiguration(user);
    } else if (request.method === 'PUT') {
      return await updateBatchConfiguration(request, user);
    } else {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }
  } catch (error) {
    console.error('Batch configuration request failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to manage batch configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function getBatchConfiguration(user: AuthenticatedUser) {

  // Get current batch configuration
  const configQuery = `
    SELECT value, updated_at, updated_by, description
    FROM system_config 
    WHERE key = 'batch_config'
  `;

  const result = await pool.query(configQuery);
  const configData = result.rows[0];

  const config = configData?.value || DEFAULT_BATCH_CONFIG;

  const response = {
    configuration: config,
    metadata: {
      lastUpdated: configData?.updated_at || null,
      lastUpdatedBy: configData?.updated_by || 'system',
      description: configData?.description || 'Batch processing configuration',
      isDefault: !configData,
      requested_by: user.email,
      request_timestamp: new Date().toISOString(),
      source: 'blockchain_database_config',
    }
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
    },
  });
}

async function updateBatchConfiguration(request: NextRequest, user: AuthenticatedUser) {

  // Parse new configuration from request body
  const newConfig = await request.json();

  // Validate configuration
  const validatedConfig = {
    batch_size: Math.max(1, Math.min(100, parseInt(newConfig.batch_size) || DEFAULT_BATCH_CONFIG.batch_size)),
    processing_interval: Math.max(60, Math.min(3600, parseInt(newConfig.processing_interval) || DEFAULT_BATCH_CONFIG.processing_interval)),
    auto_batch: newConfig.auto_batch !== undefined ? Boolean(newConfig.auto_batch) : DEFAULT_BATCH_CONFIG.auto_batch,
    max_batch_age: Math.max(300, Math.min(7200, parseInt(newConfig.max_batch_age) || DEFAULT_BATCH_CONFIG.max_batch_age)),
    retry_attempts: Math.max(0, Math.min(10, parseInt(newConfig.retry_attempts) || DEFAULT_BATCH_CONFIG.retry_attempts)),
    max_concurrent_batches: Math.max(1, Math.min(20, parseInt(newConfig.max_concurrent_batches) || DEFAULT_BATCH_CONFIG.max_concurrent_batches)),
    timeout_settings: {
      s3_upload: Math.max(5000, Math.min(120000, parseInt(newConfig.timeout_settings?.s3_upload) || DEFAULT_BATCH_CONFIG.timeout_settings.s3_upload)),
      acl_logging: Math.max(1000, Math.min(60000, parseInt(newConfig.timeout_settings?.acl_logging) || DEFAULT_BATCH_CONFIG.timeout_settings.acl_logging)),
      blockchain_submission: Math.max(30000, Math.min(300000, parseInt(newConfig.timeout_settings?.blockchain_submission) || DEFAULT_BATCH_CONFIG.timeout_settings.blockchain_submission)),
    }
  };


  // Begin transaction for atomic operation
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Update batch configuration
    const updateQuery = `
      UPDATE system_config 
      SET value = $1,
          updated_at = NOW(),
          updated_by = $2
      WHERE key = 'batch_config'
      RETURNING value, updated_at
    `;

    const updateResult = await client.query(updateQuery, [
      JSON.stringify(validatedConfig),
      user.email
    ]);

    // Log admin action
    const logActionQuery = `
      INSERT INTO admin_action_log (
        action_type, action_details, performed_by, target_resource, result
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, performed_at
    `;

    const actionDetails = {
      old_config: newConfig, // Original request
      new_config: validatedConfig, // Validated and applied
      changes_made: Object.keys(validatedConfig).filter(key => 
        JSON.stringify(validatedConfig[key as keyof typeof validatedConfig]) !== 
        JSON.stringify(newConfig[key])
      ),
    };

    const logResult = await client.query(logActionQuery, [
      'update_batch_config',
      JSON.stringify(actionDetails),
      user.email,
      'batch_config',
      'success'
    ]);

    await client.query('COMMIT');

    const response = {
      success: true,
      message: 'Batch configuration updated successfully',
      configuration: validatedConfig,
      adminAction: {
        id: logResult.rows[0].id,
        action: 'update_batch_config',
        performedBy: user.email,
        timestamp: logResult.rows[0].performed_at,
        details: actionDetails,
      },
      metadata: {
        updated_at: updateResult.rows[0].updated_at,
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_database_config_management',
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache', // Don't cache config updates
      },
    });

  } catch (dbError) {
    await client.query('ROLLBACK');
    throw dbError;
  } finally {
    client.release();
  }
}

// Export both GET and PUT with authentication wrapper
export const GET = withBlockchainAuth(batchConfigHandler);
export const PUT = withBlockchainAuth(batchConfigHandler);
