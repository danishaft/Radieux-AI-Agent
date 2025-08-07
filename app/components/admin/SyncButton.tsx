'use client'

import { useState } from 'react';
import { syncN8nData, getSyncStatus } from '@/app/actions/sync-data';

export default function SyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const handleSync = async (force = false) => {
    setIsLoading(true);
    try {
      const result = await syncN8nData(force);
      setStatus(result);
    } catch (error) {
      setStatus({ success: false, error: 'Sync failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    const result = await getSyncStatus();
    setStatus(result);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md">
      <h3 className="text-lg font-semibold mb-4">Data Sync Admin</h3>
      
      <div className="space-y-4">
        <button
          onClick={() => handleSync(false)}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Syncing...' : 'Sync Data (Skip Existing)'}
        </button>
        
        <button
          onClick={() => handleSync(true)}
          disabled={isLoading}
          className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {isLoading ? 'Syncing...' : 'Force Sync (Overwrite All)'}
        </button>
        
        <button
          onClick={checkStatus}
          className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          Check Status
        </button>
      </div>
      
      {status && (
        <div className={`mt-4 p-3 rounded-lg ${
          status.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <pre className="text-sm">{JSON.stringify(status, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 