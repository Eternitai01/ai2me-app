/**
 * User-friendly error messages for common API errors
 * Replaces generic 400/500 errors with actionable guidance
 */

export interface ErrorContext {
    operation: string;
    connectorType?: string;
    step?: string;
}

export function getUserFriendlyError(
    error: any,
    context: ErrorContext
): { title: string; message: string; action?: string } {
    const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error';
    const statusCode = error?.response?.status;

    // Schema Discovery Errors
    if (context.step === 'discover') {
        if (statusCode === 400) {
            if (errorMessage.includes('host')) {
                return {
                    title: 'Database Host Not Configured',
                    message: 'Your connector doesn\'t have a database host configured. Please edit the connector and add your database endpoint.',
                    action: 'Edit connector settings and add the database host (e.g., mydb.xxxxx.rds.amazonaws.com)'
                };
            }
            if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
                return {
                    title: 'Cannot Connect to Database',
                    message: 'Unable to reach your database. Check that the host, port, and credentials are correct, and that your firewall allows connections.',
                    action: 'Verify database connection settings and network access'
                };
            }
        }
        if (statusCode === 401 || statusCode === 403) {
            return {
                title: 'Authentication Failed',
                message: 'Invalid database username or password. Please check your credentials.',
                action: 'Update connector with correct database username and password'
            };
        }
        return {
            title: 'Schema Discovery Failed',
            message: `We couldn't discover the schema for your ${context.connectorType || 'connector'}. ${errorMessage}`,
            action: 'Check connector configuration and try again'
        };
    }

    // VPC Connection Errors
    if (context.step === 'connection') {
        if (errorMessage.includes('VPC') || errorMessage.includes('subnet')) {
            return {
                title: 'VPC Configuration Error',
                message: 'Invalid VPC, Subnet, or Security Group configuration. Auto-discovery failed.',
                action: 'Switch to Manual Setup and enter VPC details manually, or check connector database endpoint'
            };
        }
        if (errorMessage.includes('already exists')) {
            return {
                title: 'Connection Already Exists',
                message: 'A Glue connection with this name already exists.',
                action: 'Use a different connection name or delete the existing connection first'
            };
        }
        return {
            title: 'Connection Setup Failed',
            message: `Unable to create Glue connection. ${errorMessage}`,
            action: 'Verify VPC configuration and try again'
        };
    }

    // Field Mapping Errors
    if (context.step === 'mapping') {
        if (statusCode === 400) {
            if (errorMessage.includes('identifier')) {
                return {
                    title: 'Invalid Field Name',
                    message: 'One or more field names contain invalid characters. Field names can only contain letters, numbers, underscores, and dots.',
                    action: 'Check your field mappings and remove special characters'
                };
            }
            if (errorMessage.includes('schema not discovered')) {
                return {
                    title: 'Schema Not Discovered',
                    message: 'You need to discover the connector schema before creating field mappings.',
                    action: 'Go back and complete the "Discover Schema" step first'
                };
            }
        }
        return {
            title: 'Field Mapping Failed',
            message: `Unable to save field mappings. ${errorMessage}`,
            action: 'Check field names and data types, then try again'
        };
    }

    // ETL Job Errors
    if (context.step === 'etl') {
        if (errorMessage.includes('no mappings')) {
            return {
                title: 'No Field Mappings Found',
                message: 'You must create at least one field mapping before generating an ETL job.',
                action: 'Go to "Map Fields" and create field mappings first'
            };
        }
        if (errorMessage.includes('already exists') || errorMessage.includes('already created')) {
            return {
                title: 'Job Already Exists',
                message: 'An ETL job already exists for this connector. You can start it directly.',
                action: 'Use "View Job Status" to start or monitor the existing job'
            };
        }
        if (errorMessage.includes('IAM') || errorMessage.includes('PassRole')) {
            return {
                title: 'AWS Permissions Error',
                message: 'Insufficient AWS IAM permissions to create Glue jobs. This is a configuration issue.',
                action: 'Contact your administrator to configure Glue IAM roles'
            };
        }
        if (errorMessage.includes('S3') || errorMessage.includes('bucket')) {
            return {
                title: 'S3 Bucket Error',
                message: 'Cannot access S3 bucket for Glue scripts. This may be a configuration issue.',
                action: 'Verify S3 bucket permissions and try again'
            };
        }
        return {
            title: 'ETL Job Creation Failed',
            message: `Unable to create ETL job. ${errorMessage}`,
            action: 'Verify all previous steps are complete and try again'
        };
    }

    // Generic Errors
    if (statusCode === 401) {
        return {
            title: 'Session Expired',
            message: 'Your session has expired. Please log in again.',
            action: 'Refresh the page and log in'
        };
    }

    if (statusCode === 403) {
        return {
            title: 'Access Denied',
            message: 'You don\'t have permission to perform this action.',
            action: 'Contact your organization administrator'
        };
    }

    if (statusCode === 404) {
        return {
            title: 'Resource Not Found',
            message: `The ${context.operation} could not be found. It may have been deleted.`,
            action: 'Refresh the page and try again'
        };
    }

    if (statusCode === 429) {
        return {
            title: 'Too Many Requests',
            message: 'You\'re making requests too quickly. Please slow down.',
            action: 'Wait a few seconds and try again'
        };
    }

    if (statusCode >= 500) {
        return {
            title: 'Server Error',
            message: 'An unexpected error occurred on our servers. Our team has been notified.',
            action: 'Please try again in a few moments'
        };
    }

    // Default
    return {
        title: `${context.operation} Failed`,
        message: errorMessage,
        action: 'Please try again or contact support if the problem persists'
    };
}

