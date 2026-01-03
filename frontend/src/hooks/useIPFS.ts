import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:42069';

// Use dedicated Pinata gateway to avoid rate limits and CORS issues
// Format: https://your-gateway.mypinata.cloud/ipfs
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'rose-xerothermic-shrimp-767.mypinata.cloud';
const IPFS_GATEWAY = `https://${PINATA_GATEWAY}/ipfs`;

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

// Convert IPFS URI to HTTP gateway URL
export function ipfsToHttp(ipfsUri: string | null | undefined): string | null {
  if (!ipfsUri) return null;

  // Handle ipfs:// protocol
  if (ipfsUri.startsWith('ipfs://')) {
    const hash = ipfsUri.replace('ipfs://', '');
    return `${IPFS_GATEWAY}/${hash}`;
  }

  // Handle direct hash
  if (ipfsUri.startsWith('Qm') || ipfsUri.startsWith('bafy')) {
    return `${IPFS_GATEWAY}/${ipfsUri}`;
  }

  // Already an HTTP URL
  if (ipfsUri.startsWith('http')) {
    return ipfsUri;
  }

  return null;
}

// Fetch metadata from IPFS
async function fetchIPFSMetadata(metadataURI: string): Promise<RoundMetadata | null> {
  const url = ipfsToHttp(metadataURI);
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching IPFS metadata:', error);
    return null;
  }
}

// Hook to fetch and cache round metadata from IPFS
export function useRoundMetadata(metadataURI: string | null | undefined) {
  return useQuery({
    queryKey: ['ipfs', 'metadata', metadataURI],
    queryFn: async () => {
      if (!metadataURI) return null;
      return fetchIPFSMetadata(metadataURI);
    },
    enabled: !!metadataURI,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (IPFS content is immutable)
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });
}

// Get the logo URL from metadata
export function useRoundLogo(metadataURI: string | null | undefined) {
  const { data: metadata } = useRoundMetadata(metadataURI);

  if (!metadata?.logo) return null;
  return ipfsToHttp(metadata.logo);
}

// ============================================
// Founder Profile IPFS Types and Hooks
// ============================================

export interface FounderProfile {
  name: string;
  title: string;
  bio: string;
  profileImage?: string;
  linkedin?: string;
  twitter?: string;
}

// Fetch founder profile from IPFS
async function fetchFounderProfile(metadataURI: string): Promise<FounderProfile | null> {
  const url = ipfsToHttp(metadataURI);
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch founder profile: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching founder profile from IPFS:', error);
    return null;
  }
}

// Hook to fetch and cache founder profile from IPFS
export function useFounderProfileMetadata(metadataURI: string | null | undefined) {
  return useQuery({
    queryKey: ['ipfs', 'founderProfile', metadataURI],
    queryFn: async () => {
      if (!metadataURI) return null;
      return fetchFounderProfile(metadataURI);
    },
    enabled: !!metadataURI,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });
}

// Hook to upload founder profile to IPFS
export function useFounderProfileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFounderProfile = useCallback(async (
    profile: FounderProfile,
    profileImageFile?: File | null
  ): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      let profileImageHash: string | undefined;

      // Upload profile image if provided
      if (profileImageFile) {
        const formData = new FormData();
        formData.append('file', profileImageFile);
        formData.append('type', 'image');

        const imageResponse = await fetch(`${BACKEND_API_URL}/api/ipfs/upload-file`, {
          method: 'POST',
          body: formData,
        });

        const imageData: UploadFileResponse = await imageResponse.json();

        if (!imageResponse.ok || !imageData.success) {
          throw new Error(imageData.error || 'Failed to upload profile image');
        }

        profileImageHash = imageData.ipfsHash;
      }

      // Create full profile with image hash
      const fullProfile: FounderProfile = {
        ...profile,
        profileImage: profileImageHash || profile.profileImage,
      };

      // Upload profile JSON
      const response = await fetch(`${BACKEND_API_URL}/api/ipfs/upload-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: fullProfile,
          name: `founder-profile-${profile.name.toLowerCase().replace(/\s+/g, '-')}`,
        }),
      });

      const data: UploadJSONResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload founder profile to IPFS');
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

  return {
    uploadFounderProfile,
    isUploading,
    error,
  };
}

// Hook to get founder profile image URL
export function useFounderProfileImage(metadataURI: string | null | undefined) {
  const { data: profile } = useFounderProfileMetadata(metadataURI);

  if (!profile?.profileImage) return null;
  return ipfsToHttp(profile.profileImage);
}
