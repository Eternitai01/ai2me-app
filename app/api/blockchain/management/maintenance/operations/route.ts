import { NextResponse } from 'next/server';

const OPERATIONS = [
  {
    id: 'restart-service',
    type: 'restart_service',
    description: 'Restart blockchain processing service',
    estimatedDuration: 2,
    requiresDowntime: true,
    status: 'pending',
    progress: 0,
  },
  {
    id: 'clear-cache',
    type: 'clear_cache',
    description: 'Clear application cache and temporary files',
    estimatedDuration: 1,
    requiresDowntime: false,
    status: 'pending',
    progress: 0,
  },
  {
    id: 'cleanup-logs',
    type: 'cleanup_logs',
    description: 'Archive and cleanup old log files',
    estimatedDuration: 5,
    requiresDowntime: false,
    status: 'pending',
    progress: 0,
  },
  {
    id: 'backup-data',
    type: 'backup_data',
    description: 'Create system backup',
    estimatedDuration: 15,
    requiresDowntime: false,
    status: 'pending',
    progress: 0,
  },
];

export async function GET() {
  return NextResponse.json(OPERATIONS, {
    status: 200,
    headers: { 'Cache-Control': 'no-cache' },
  });
}
