import { useEffect, useRef, useState } from 'react';
import { ZKPassport, type ProofResult } from '@zkpassport/sdk';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, FndrIdentityABI } from '@/lib/contracts';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:42069';

export const useZKPassportVerification = () => {
  const [message, setMessage] = useState('');
  const [uniqueIdentifier, setUniqueIdentifier] = useState('');
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [queryUrl, setQueryUrl] = useState('');
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [backendVerifying, setBackendVerifying] = useState(false);
  const [backendResponse, setBackendResponse] = useState<{
    verified: boolean;
    uniqueIdentifier?: string;
    uniqueIdentifierBytes32?: string;
    error?: string;
  } | null>(null);
  const [isGeneratingProofs, setIsGeneratingProofs] = useState(false);
  const zkPassportRef = useRef<ZKPassport | null>(null);

  // Wagmi hooks for smart contract interaction
  const { writeContract, data: hash, error: contractError, isPending: isContractPending } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: transactionError
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !zkPassportRef.current) {
      zkPassportRef.current = new ZKPassport(window.location.hostname);
    }
  }, []);

  // Helper function to register user on smart contract
  const registerUserOnContract = async (uniqueIdentifierBytes32: string) => {
    try {
      console.log('Registering user on smart contract with uniqueIdentifier:', uniqueIdentifierBytes32);
      setMessage('Registering on blockchain...');

      await writeContract({
        address: CONTRACTS.FndrIdentity as `0x${string}`,
        abi: FndrIdentityABI,
        functionName: 'registerZKPassportUser',
        args: [`0x${uniqueIdentifierBytes32}` as `0x${string}`],
      });
    } catch (error) {
      console.error('Smart contract registration failed:', error);
      let errorMessage = 'Blockchain registration failed';
      if (error instanceof Error) {
        if (error.message.includes('Identifier already used') || error.message.includes('IdentifierAlreadyUsed')) {
          errorMessage = 'This passport has already been used for verification';
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
        } else if (error.message.includes('execution reverted')) {
          errorMessage = 'Contract execution failed - you may already be registered';
        } else {
          errorMessage = `Blockchain error: ${error.message}`;
        }
      }
      setMessage(errorMessage);
      setRequestInProgress(false);
      setBackendVerifying(false);
    }
  };

  // Track transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      console.log('Smart contract registration confirmed!');
      setMessage('Successfully verified with ZKPassport!');
      setRequestInProgress(false);
      setBackendVerifying(false);
    } else if (contractError || transactionError) {
      const error = contractError || transactionError;
      console.error('Smart contract/transaction error:', error);

      let errorMessage = 'Blockchain registration failed';
      if (error?.message) {
        if (error.message.includes('Identifier already used') || error.message.includes('IdentifierAlreadyUsed')) {
          errorMessage = 'This passport has already been used for verification';
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas fees';
        } else if (error.message.includes('execution reverted')) {
          errorMessage = 'Contract execution failed - you may already be registered';
        } else if (error.message.includes('Connector not connected')) {
          errorMessage = 'Wallet not connected properly';
        } else {
          errorMessage = `Blockchain error: ${error.message}`;
        }
      }

      setMessage(errorMessage);
      setRequestInProgress(false);
      setBackendVerifying(false);
    } else if (isConfirming) {
      setMessage('Confirming blockchain transaction...');
    } else if (isContractPending) {
      setMessage('Waiting for wallet confirmation...');
    }
  }, [isConfirmed, contractError, transactionError, isConfirming, isContractPending]);

  const createVerificationRequest = async () => {
    if (!zkPassportRef.current) {
      console.error('ZKPassport not initialized');
      setMessage('ZKPassport not initialized');
      return;
    }

    // Reset state
    setMessage('Initializing verification request...');
    setQueryUrl('');
    setUniqueIdentifier('');
    setVerified(undefined);
    setBackendResponse(null);

    console.log('Creating ZKPassport verification request...');
    console.log('Current domain:', window.location.hostname);

    const queryBuilder = await zkPassportRef.current.request({
      name: 'FNDR Identity Verification',
      logo: 'https://fndr.io/favicon.ico',
      purpose: 'Verify identity for FNDR startup investment platform',
      scope: 'identity',
      mode: 'fast',
      devMode: false,
    });

    console.log('Query builder created successfully');

    const {
      url,
      onRequestReceived,
      onGeneratingProof,
      onProofGenerated,
      onResult,
      onReject,
      onError,
    } = queryBuilder
      .disclose("firstname")
      .gte("age", 18)
      .disclose('document_type')
      .done();

    setQueryUrl(url);
    console.log('ZKPassport URL:', url);

    setRequestInProgress(true);

    onRequestReceived(() => {
      console.log('QR code scanned');
      setMessage('Request received - scanning passport...');
    });

    onGeneratingProof(() => {
      console.log('Generating proof');
      setIsGeneratingProofs(true);
      setMessage('Generating proof...');
    });

    const proofs: ProofResult[] = [];

    onProofGenerated((result: ProofResult) => {
      console.log('Proof result', result);
      proofs.push(result);
      setMessage('Proofs received');
      setIsGeneratingProofs(false);
    });

    onResult(async ({ result, uniqueIdentifier, verified, queryResultErrors }) => {
      console.log('Result of the query', result);
      console.log('Query result errors', queryResultErrors);

      setMessage('Verifying with backend...');
      setUniqueIdentifier(uniqueIdentifier || '');
      setVerified(verified);
      setRequestInProgress(false);

      setBackendVerifying(true);

      try {
        const res = await fetch(`${BACKEND_API_URL}/api/zkpass/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            queryResult: result,
            proofs,
            domain: window.location.hostname,
          }),
        });

        const data = await res.json();
        console.log('Response from the server', data);
        setBackendResponse(data);
        setBackendVerifying(false);

        // If verification successful and we have uniqueIdentifierBytes32, register on contract
        if (data.verified && data.uniqueIdentifierBytes32) {
          console.log('Verification successful, calling smart contract...');
          await registerUserOnContract(data.uniqueIdentifierBytes32);
        } else {
          setMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        console.error('Backend verification error:', error);
        setBackendVerifying(false);
        setMessage('Failed to verify with backend');
      }
    });

    onReject(() => {
      console.log('User rejected');
      setMessage('User rejected the request');
      setRequestInProgress(false);
    });

    onError((error: unknown) => {
      console.error('Error', error);
      setMessage('An error occurred during verification');
      setRequestInProgress(false);
    });
  };

  const resetVerification = () => {
    setMessage('');
    setQueryUrl('');
    setUniqueIdentifier('');
    setVerified(undefined);
    setRequestInProgress(false);
    setBackendVerifying(false);
    setBackendResponse(null);
    setIsGeneratingProofs(false);
  };

  return {
    // State
    message,
    uniqueIdentifier,
    verified,
    queryUrl,
    requestInProgress,
    backendVerifying,
    backendResponse,
    isGeneratingProofs,

    // Contract state
    isContractPending,
    isConfirming,
    isConfirmed,
    contractError,
    transactionError,
    hash,

    // Enhanced error state
    hasError: !!(contractError || transactionError),
    errorMessage: (contractError || transactionError)?.message,

    // Loading states
    isLoading: requestInProgress || backendVerifying || isGeneratingProofs || isContractPending || isConfirming,
    loadingStates: {
      generatingProofs: isGeneratingProofs,
      backendVerifying: backendVerifying,
      contractPending: isContractPending,
      contractConfirming: isConfirming,
    },

    // Actions
    createVerificationRequest,
    resetVerification,
  };
};
