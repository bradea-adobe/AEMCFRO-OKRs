// FR-012: Storage Management & Warnings

export interface StorageInfo {
  usedBytes: number;
  quotaBytes: number;
  usagePercentage: number;
  usedMB: string;
  quotaMB: string;
}

/**
 * Get current storage usage information
 */
export const getStorageInfo = async (): Promise<StorageInfo> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 0;
      const usagePercentage = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;

      return {
        usedBytes,
        quotaBytes,
        usagePercentage,
        usedMB: (usedBytes / (1024 * 1024)).toFixed(2),
        quotaMB: (quotaBytes / (1024 * 1024)).toFixed(0),
      };
    } catch (error) {
      console.error('Error getting storage estimate:', error);
    }
  }

  // Fallback for browsers that don't support storage API
  return {
    usedBytes: 0,
    quotaBytes: 0,
    usagePercentage: 0,
    usedMB: '0.00',
    quotaMB: 'Unknown',
  };
};

/**
 * Get storage warning level based on usage percentage
 * FR-012: 80% = warning, 90% = high, 95% = critical
 */
export const getStorageWarningLevel = (
  usagePercentage: number
): 'none' | 'warning' | 'high' | 'critical' => {
  if (usagePercentage >= 95) return 'critical';
  if (usagePercentage >= 90) return 'high';
  if (usagePercentage >= 80) return 'warning';
  return 'none';
};

/**
 * Get storage warning message
 */
export const getStorageWarningMessage = (
  level: 'warning' | 'high' | 'critical'
): string => {
  const messages = {
    warning: 'Storage usage high. Consider exporting old data.',
    high: 'Storage nearly full. Export and archive recommended.',
    critical: 'Storage critical. Data loss risk. Export immediately.',
  };
  return messages[level];
};

