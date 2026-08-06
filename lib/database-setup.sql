-- Database Schema Extensions for Blockchain Management
-- Execute these in the blockchain service database

-- 1. System Configuration Table
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Transaction Retry Tracking
CREATE TABLE IF NOT EXISTS transaction_retry_log (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) NOT NULL,
  retry_attempt INTEGER NOT NULL,
  requested_by VARCHAR(100) NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  result VARCHAR(50), -- 'success', 'failed', 'pending'
  completed_at TIMESTAMP,
  error_message TEXT,
  retry_reason VARCHAR(200)
);

-- 3. Admin Action Audit Log
CREATE TABLE IF NOT EXISTS admin_action_log (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(100) NOT NULL, -- 'pause_queue', 'resume_queue', 'update_config', etc.
  action_details JSONB,
  performed_by VARCHAR(100) NOT NULL,
  performed_at TIMESTAMP DEFAULT NOW(),
  target_resource VARCHAR(200), -- 'queue', 'batch_config', 'system_config'
  result VARCHAR(50), -- 'success', 'failed'
  error_message TEXT
);

-- 4. System Metrics History (for real-time monitoring)
CREATE TABLE IF NOT EXISTS system_metrics_history (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(12,4) NOT NULL,
  unit VARCHAR(20),
  recorded_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(100) -- 'database', 'blockchain_service', 'system'
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_retry_log_transaction ON transaction_retry_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_retry_log_requested_at ON transaction_retry_log(requested_at);
CREATE INDEX IF NOT EXISTS idx_admin_action_performed_at ON admin_action_log(performed_at);
CREATE INDEX IF NOT EXISTS idx_admin_action_type ON admin_action_log(action_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics_history(metric_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_system_config_updated_at ON system_config(updated_at);

-- 6. Insert Default Configuration Values
INSERT INTO system_config (key, value, description, updated_by) VALUES 
(
  'queue_processing', 
  '{"enabled": true, "paused_by": null, "paused_at": null, "auto_resume": false}', 
  'Queue processing control settings',
  'system'
),
(
  'batch_config', 
  '{
    "batch_size": 25,
    "processing_interval": 300,
    "auto_batch": true,
    "max_batch_age": 1800,
    "retry_attempts": 3,
    "max_concurrent_batches": 5,
    "timeout_settings": {
      "s3_upload": 30000,
      "acl_logging": 10000,
      "blockchain_submission": 60000
    }
  }', 
  'Batch processing configuration',
  'system'
),
(
  'system_config', 
  '{
    "maintenance_mode": false,
    "processing_enabled": true,
    "alerts_enabled": true,
    "max_concurrent_transactions": 10,
    "rate_limits": {
      "requests_per_minute": 100,
      "burst_limit": 200
    },
    "thresholds": {
      "queue_warning": 50,
      "queue_critical": 100,
      "response_time_warning": 5000,
      "response_time_critical": 10000
    }
  }', 
  'System-wide configuration settings',
  'system'
),
(
  'alert_config',
  '{
    "enabled": true,
    "channels": ["email", "webhook"],
    "severity_thresholds": {
      "queue_length": {"warning": 50, "critical": 100},
      "error_rate": {"warning": 5, "critical": 10},
      "response_time": {"warning": 5000, "critical": 10000}
    }
  }',
  'Alert and notification configuration',
  'system'
)
ON CONFLICT (key) DO NOTHING;

-- 7. Database Change Notification Functions
CREATE OR REPLACE FUNCTION notify_transaction_change()
RETURNS trigger AS $$
BEGIN
    -- Notify on transaction status changes
    IF TG_OP = 'UPDATE' AND OLD.blockchain_status != NEW.blockchain_status THEN
        PERFORM pg_notify('transaction_update', 
            json_build_object(
                'type', 'status_change',
                'transaction_id', NEW.transaction_id,
                'old_status', OLD.blockchain_status,
                'new_status', NEW.blockchain_status,
                'provider', NEW.provider,
                'model', NEW.model,
                'credits', NEW.credits_deducted,
                'org_id', NEW.org_id,
                'timestamp', COALESCE(NEW.last_modified_at, NOW())
            )::text
        );
    END IF;
    
    -- Notify on new transactions
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify('transaction_created',
            json_build_object(
                'type', 'new_transaction',
                'transaction_id', NEW.transaction_id,
                'status', NEW.blockchain_status,
                'provider', NEW.provider,
                'model', NEW.model,
                'credits', NEW.credits_deducted,
                'org_id', NEW.org_id,
                'timestamp', NEW.created_at
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Batch change notification function
CREATE OR REPLACE FUNCTION notify_batch_change()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('batch_update',
        json_build_object(
            'type', 'batch_change',
            'batch_id', NEW.batch_id,
            'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE null END,
            'new_status', NEW.status,
            'transaction_count', NEW.transaction_count,
            'merkle_root', NEW.merkle_root,
            'blockchain_tx_hash', NEW.blockchain_tx_hash,
            'timestamp', COALESCE(NEW.submitted_at, NEW.created_at)
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Admin action notification function
CREATE OR REPLACE FUNCTION notify_admin_action()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('admin_action',
        json_build_object(
            'type', 'admin_action',
            'action_type', NEW.action_type,
            'performed_by', NEW.performed_by,
            'target_resource', NEW.target_resource,
            'result', NEW.result,
            'timestamp', NEW.performed_at
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create Triggers
DROP TRIGGER IF EXISTS transaction_change_trigger ON transaction_logs;
CREATE TRIGGER transaction_change_trigger
    AFTER INSERT OR UPDATE ON transaction_logs
    FOR EACH ROW EXECUTE FUNCTION notify_transaction_change();

DROP TRIGGER IF EXISTS batch_change_trigger ON blockchain_batches;
CREATE TRIGGER batch_change_trigger
    AFTER INSERT OR UPDATE ON blockchain_batches
    FOR EACH ROW EXECUTE FUNCTION notify_batch_change();

DROP TRIGGER IF EXISTS admin_action_trigger ON admin_action_log;
CREATE TRIGGER admin_action_trigger
    AFTER INSERT ON admin_action_log
    FOR EACH ROW EXECUTE FUNCTION notify_admin_action();

-- 11. Create Views for Common Queries
CREATE OR REPLACE VIEW queue_status_view AS
SELECT 
  COUNT(CASE WHEN blockchain_status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN blockchain_status = 'processing' THEN 1 END) as processing_count,
  COUNT(CASE WHEN blockchain_status = 'submitted' THEN 1 END) as submitted_count,
  MIN(CASE WHEN blockchain_status = 'pending' THEN created_at END) as oldest_pending,
  MAX(created_at) as latest_transaction
FROM transaction_logs
WHERE created_at >= NOW() - INTERVAL '24 hours';

CREATE OR REPLACE VIEW failed_transactions_view AS
SELECT 
  t.transaction_id,
  t.org_id,
  t.provider,
  t.model,
  t.credits_deducted,
  t.blockchain_status,
  t.created_at,
  t.latency_ms,
  t.status_code,
  COALESCE(r.retry_count, 0) as retry_count,
  r.last_retry_at,
  CASE 
    WHEN t.created_at > NOW() - INTERVAL '24 hours' AND COALESCE(r.retry_count, 0) < 3 THEN true
    ELSE false
  END as can_retry,
  CASE 
    WHEN t.s3_location IS NULL THEN 's3_upload'
    WHEN t.acl_transaction_id IS NULL THEN 'acl_logging'
    WHEN t.blockchain_submitted_at IS NULL THEN 'blockchain_submission'
    ELSE 'verification'
  END as failure_stage
FROM transaction_logs t
LEFT JOIN (
  SELECT 
    transaction_id,
    COUNT(*) as retry_count,
    MAX(requested_at) as last_retry_at
  FROM transaction_retry_log
  GROUP BY transaction_id
) r ON t.transaction_id = r.transaction_id
WHERE t.blockchain_status = 'failed';

-- 12. Grant Permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE ON system_config TO blockchain_api_user;
-- GRANT SELECT, INSERT, UPDATE ON transaction_retry_log TO blockchain_api_user;
-- GRANT SELECT, INSERT ON admin_action_log TO blockchain_api_user;
-- GRANT SELECT, INSERT ON system_metrics_history TO blockchain_api_user;
