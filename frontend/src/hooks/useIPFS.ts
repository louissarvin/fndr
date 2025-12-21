import { useState, useCallback } from 'react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:42069';

export interface RoundMetadata {
  name: string;
  symbol: string;
  description: string;
  logo?: string; // IPFS hash of logo
  pitchDeck?: string; // IPFS hash of pitch deck
  website?: string;
  twitter?: string;
  createdAt: number;
}

interface UploadFileResponse {
  success: boolean;
  ipfsHash: string;
  ipfsUrl: string;
  error?: string;
}

interface UploadJSONResponse {
  success: boolean;
  ipfsHash: string;
  ipfsUrl: string;
  metadataURI: string;
  error?: string;
}

interface GatewayResponse {
  gateway: string;
  configured: boolean;
}

export function useIPFSUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateway, setGateway] = useState<string>('gateway.pinata.cloud');

  // Fetch gateway info on first use
  const fetchGateway = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/ipfs/gateway`);
      if (response.ok) {
        const data: GatewayResponse = await response.json();
        setGateway(data.gateway);
        return data.configured;
      }
    } catch (err) {
      console.error('Failed to fetch IPFS gateway:', err);
    }
    return false;
  }, []);

  const uploadFile = useCallback(async (file: File, type: 'image' | 'document' = 'image'): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`${BACKEND_API_URL}/api/ipfs/upload-file`, {
        method: 'POST',
        body: formData,
      });

      const data: UploadFileResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload file to IPFS');
      }

      return data.ipfsHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadJSON = useCallback(async (metadata: RoundMetadata): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/ipfs/upload-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata,
          name: `${metadata.symbol}-metadata`,
        }),
      });

      const data: UploadJSONResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload metadata to IPFS');
      }

      return data.ipfsHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const getIPFSUrl = useCallback((hash: string) => {
    return `https://${gateway}/ipfs/${hash}`;
  }, [gateway]);

  return {
    uploadFile,
    uploadJSON,
    getIPFSUrl,
    fetchGateway,
    isUploading,
    error,
  };
}
