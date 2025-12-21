import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import {
  useCreateRound,
  useRoundCreationFee,
  useUSDCBalance,
  useUSDCApprove,
  useUSDCAllowance,
  formatUSDCDisplay,
  USDC_DECIMALS,
} from '@/hooks/useContracts';
import { useIPFSUpload, type RoundMetadata } from '@/hooks/useIPFS';
import { CONTRACTS } from '@/lib/contracts';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Percent,
  Calendar,
  Building2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Image,
  Link,
  Twitter,
} from 'lucide-react';

interface CreateRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormStep = 'details' | 'metadata';
type TxStep = 'form' | 'uploading' | 'approve' | 'create' | 'success';

export default function CreateRoundModal({ isOpen, onClose }: CreateRoundModalProps) {
  const { address } = useAccount();

  // Form step state
  const [formStep, setFormStep] = useState<FormStep>('details');
  const [txStep, setTxStep] = useState<TxStep>('form');

  // Round details state
  const [companySymbol, setCompanySymbol] = useState('');
  const [targetRaise, setTargetRaise] = useState('');
  const [equityPercentage, setEquityPercentage] = useState('');
  const [sharePrice, setSharePrice] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('30');

  // Metadata state
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const pitchDeckInputRef = useRef<HTMLInputElement>(null);

  // IPFS upload hook
  const { uploadFile, uploadJSON, isUploading, error: ipfsError } = useIPFSUpload();

  // Contract hooks
  const { data: creationFee } = useRoundCreationFee();
  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: allowance } = useUSDCAllowance(address, CONTRACTS.RoundFactory as `0x${string}`);

  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveError,
  } = useUSDCApprove();

  const {
    createRound,
    isPending: isCreatePending,
    isConfirming: isCreateConfirming,
    isSuccess: isCreateSuccess,
    error: createError,
  } = useCreateRound();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormStep('details');
      setTxStep('form');
      setCompanySymbol('');
      setTargetRaise('');
      setEquityPercentage('');
      setSharePrice('');
      setDeadlineDays('30');
      setCompanyName('');
      setDescription('');
      setWebsite('');
      setTwitter('');
      setLogoFile(null);
      setLogoPreview(null);
      setPitchDeckFile(null);
    }
  }, [isOpen]);

  // Move to create step after approval
  useEffect(() => {
    if (isApproveSuccess && txStep === 'approve') {
      setTxStep('create');
    }
  }, [isApproveSuccess, txStep]);

  // Move to success step after creation
  useEffect(() => {
    if (isCreateSuccess && txStep === 'create') {
      setTxStep('success');
    }
  }, [isCreateSuccess, txStep]);

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle pitch deck file selection
  const handlePitchDeckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPitchDeckFile(file);
    }
  };

  const hasEnoughAllowance = creationFee && allowance && allowance >= creationFee;
  const hasEnoughBalance = creationFee && usdcBalance && usdcBalance >= creationFee;

  const isDetailsValid = companySymbol && targetRaise && equityPercentage && sharePrice;
  const isMetadataValid = companyName && description;

  const handleNextStep = () => {
    if (formStep === 'details' && isDetailsValid) {
      setFormStep('metadata');
    }
  };

  const handlePrevStep = () => {
    if (formStep === 'metadata') {
      setFormStep('details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDetailsValid || !isMetadataValid) return;

    setTxStep('uploading');

    try {
      // Upload logo if provided
      let logoHash: string | undefined;
      if (logoFile) {
        const hash = await uploadFile(logoFile, 'image');
        if (hash) logoHash = hash;
      }

      // Upload pitch deck if provided
      let pitchDeckHash: string | undefined;
      if (pitchDeckFile) {
        const hash = await uploadFile(pitchDeckFile, 'document');
        if (hash) pitchDeckHash = hash;
      }

      // Create metadata object
      const metadata: RoundMetadata = {
        name: companyName,
        symbol: companySymbol.toUpperCase(),
        description,
        logo: logoHash,
        pitchDeck: pitchDeckHash,
        website: website || undefined,
        twitter: twitter || undefined,
        createdAt: Date.now(),
      };

      // Upload metadata JSON
      const metadataHash = await uploadJSON(metadata);

      if (!metadataHash) {
        throw new Error('Failed to upload metadata');
      }

      const metadataURI = `ipfs://${metadataHash}`;

      // Proceed with contract interaction
      if (hasEnoughAllowance) {
        setTxStep('create');
        handleCreateRound(metadataURI);
      } else {
        setTxStep('approve');
        handleApprove();
        // Store metadataURI for later use
        sessionStorage.setItem('pendingMetadataURI', metadataURI);
      }
    } catch (err) {
      console.error('Error uploading metadata:', err);
      setTxStep('form');
    }
  };

  const handleApprove = () => {
    if (!creationFee) return;
    approve(CONTRACTS.RoundFactory as `0x${string}`, creationFee);
  };

  const handleCreateRound = (metadataURI?: string) => {
    const uri = metadataURI || sessionStorage.getItem('pendingMetadataURI') || '';

    const targetRaiseWei = parseUnits(targetRaise, USDC_DECIMALS);
    const equityBps = BigInt(Math.round(parseFloat(equityPercentage) * 100));
    const sharePriceWei = parseUnits(sharePrice, USDC_DECIMALS);
    const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + parseInt(deadlineDays) * 24 * 60 * 60);

    createRound(targetRaiseWei, equityBps, sharePriceWei, deadlineTimestamp, companySymbol.toUpperCase(), uri);

    sessionStorage.removeItem('pendingMetadataURI');
  };

  // Auto-trigger create after approve success
  useEffect(() => {
    if (isApproveSuccess && txStep === 'create' && !isCreatePending && !isCreateConfirming) {
      const pendingURI = sessionStorage.getItem('pendingMetadataURI');
      if (pendingURI) {
        handleCreateRound(pendingURI);
      }
    }
  }, [isApproveSuccess, txStep, isCreatePending, isCreateConfirming]);

  if (!isOpen) return null;

  const isProcessing = isUploading || isApprovePending || isApproveConfirming || isCreatePending || isCreateConfirming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1A1A] rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#A2D5C6]/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#A2D5C6]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Round</h2>
              <p className="text-sm text-white/60">
                {formStep === 'details' ? 'Step 1: Round Details' : 'Step 2: Company Info'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* Progress Indicator */}
        {txStep === 'form' && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-1 rounded-full ${formStep === 'details' ? 'bg-[#A2D5C6]' : 'bg-[#A2D5C6]'}`} />
              <div className={`flex-1 h-1 rounded-full ${formStep === 'metadata' ? 'bg-[#A2D5C6]' : 'bg-white/20'}`} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {txStep === 'form' && formStep === 'details' && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-5">
              {/* Company Symbol */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Company Symbol
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="text"
                    value={companySymbol}
                    onChange={(e) => setCompanySymbol(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g., ACME"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
                    required
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-white/40 mt-1">3-6 characters, will be used for equity tokens</p>
              </div>

              {/* Target Raise */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Target Raise (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="number"
                    value={targetRaise}
                    onChange={(e) => setTargetRaise(e.target.value)}
                    placeholder="100000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
                    required
                    min="1000"
                    step="1"
                  />
                </div>
              </div>

              {/* Equity Percentage */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Equity Offered (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="number"
                    value={equityPercentage}
                    onChange={(e) => setEquityPercentage(e.target.value)}
                    placeholder="10"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
                    required
                    min="0.01"
                    max="100"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-white/40 mt-1">Percentage of company equity to offer investors</p>
              </div>

              {/* Share Price */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Price per Share (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="number"
                    value={sharePrice}
                    onChange={(e) => setSharePrice(e.target.value)}
                    placeholder="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Round Duration (Days)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <select
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50 appearance-none cursor-pointer"
                  >
                    <option value="7" className="bg-[#1A1A1A]">7 days</option>
                    <option value="14" className="bg-[#1A1A1A]">14 days</option>
                    <option value="30" className="bg-[#1A1A1A]">30 days</option>
                    <option value="60" className="bg-[#1A1A1A]">60 days</option>
                    <option value="90" className="bg-[#1A1A1A]">90 days</option>
                  </select>
                </div>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                disabled={!isDetailsValid}
                className="w-full bg-[#A2D5C6] text-black py-4 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next: Company Info
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          )}

          {txStep === 'form' && formStep === 'metadata' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corporation"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your company and what you're building..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50 resize-none"
                  required
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Company Logo
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-[#A2D5C6]/50 transition-colors"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                      <Image className="h-6 w-6 text-white/40" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-white">{logoFile ? logoFile.name : 'Click to upload logo'}</p>
                    <p className="text-xs text-white/40">PNG, JPG up to 5MB</p>
                  </div>
                  <Upload className="h-5 w-5 text-white/40 ml-auto" />
                </div>
              </div>

              {/* Pitch Deck Upload */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Pitch Deck
                </label>
                <input
                  ref={pitchDeckInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePitchDeckChange}
                  className="hidden"
                />
                <div
                  onClick={() => pitchDeckInputRef.current?.click()}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-[#A2D5C6]/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm text-white">{pitchDeckFile ? pitchDeckFile.name : 'Click to upload pitch deck'}</p>
                    <p className="text-xs text-white/40">PDF up to 10MB</p>
                  </div>
                  <Upload className="h-5 w-5 text-white/40 ml-auto" />
                </div>
              </div>

              {/* Website & Twitter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Twitter
                  </label>
                  <div className="relative">
                    <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="@handle"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Creation Fee Notice */}
              {creationFee && (
                <div className="bg-[#A2D5C6]/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Round Creation Fee</span>
                    <span className="text-sm font-semibold text-white">
                      {formatUSDCDisplay(creationFee)}
                    </span>
                  </div>
                  {!hasEnoughBalance && (
                    <p className="text-xs text-red-400 mt-2">
                      Insufficient USDC balance. You need {formatUSDCDisplay(creationFee)} to create a round.
                    </p>
                  )}
                </div>
              )}

              {/* IPFS Error */}
              {ipfsError && (
                <div className="flex items-center gap-3 bg-red-500/20 text-red-400 rounded-xl p-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{ipfsError}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 bg-white/10 text-white py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!hasEnoughBalance || !isMetadataValid}
                  className="flex-[2] bg-[#A2D5C6] text-black py-4 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {hasEnoughAllowance ? 'Create Round' : 'Approve & Create'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </form>
          )}

          {txStep === 'uploading' && (
            <div className="text-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-[#A2D5C6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Uploading to IPFS...</h3>
              <p className="text-white/60">
                Storing your company metadata on IPFS for permanent, decentralized storage.
              </p>
            </div>
          )}

          {txStep === 'approve' && (
            <div className="text-center py-8">
              {isApprovePending || isApproveConfirming ? (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-[#A2D5C6] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isApprovePending ? 'Confirm in Wallet' : 'Approving USDC...'}
                  </h3>
                  <p className="text-white/60">
                    {isApprovePending
                      ? 'Please confirm the approval transaction in your wallet'
                      : 'Waiting for transaction confirmation...'}
                  </p>
                </>
              ) : approveError ? (
                <>
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Approval Failed</h3>
                  <p className="text-red-400 text-sm mb-4">
                    {approveError.message?.slice(0, 100) || 'Transaction failed'}
                  </p>
                  <button
                    onClick={handleApprove}
                    className="bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
                  >
                    Try Again
                  </button>
                </>
              ) : null}
            </div>
          )}

          {txStep === 'create' && (
            <div className="text-center py-8">
              {isCreatePending || isCreateConfirming ? (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-[#A2D5C6] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isCreatePending ? 'Confirm in Wallet' : 'Creating Round...'}
                  </h3>
                  <p className="text-white/60">
                    {isCreatePending
                      ? 'Please confirm the transaction in your wallet'
                      : 'Deploying your fundraising round contract...'}
                  </p>
                </>
              ) : createError ? (
                <>
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Creation Failed</h3>
                  <p className="text-red-400 text-sm mb-4">
                    {createError.message?.slice(0, 100) || 'Transaction failed'}
                  </p>
                  <button
                    onClick={() => handleCreateRound()}
                    className="bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
                  >
                    Try Again
                  </button>
                </>
              ) : !isCreatePending && !isCreateConfirming && !createError && hasEnoughAllowance ? (
                <div>
                  <Loader2 className="h-16 w-16 animate-spin text-[#A2D5C6] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Preparing...</h3>
                </div>
              ) : null}
            </div>
          )}

          {txStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-[#A2D5C6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Round Created!</h3>
              <p className="text-white/60 mb-6">
                Your fundraising round has been successfully created. Investors can now participate.
              </p>
              <button
                onClick={onClose}
                className="bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
              >
                View Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
