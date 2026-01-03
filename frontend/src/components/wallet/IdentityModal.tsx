import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  UserCheck,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BadgeCheck,
  Shield,
  QrCode,
  ArrowRight,
  Upload,
  User,
  Linkedin,
} from 'lucide-react';
import {
  useIsUserRegistered,
  useUserRole,
  useIsVerifiedUser,
  useIsZKPassportVerified,
  useRegisterUserRole,
  useSetFounderProfile,
  useHasFounderProfile,
  useRegisterFounderWithProfile,
} from '@/hooks/useContracts';
import { useZKPassportVerification } from '@/hooks/useZKPassportVerification';
import { useFounderProfileUpload } from '@/hooks/useIPFS';
import { UserRole } from '@/lib/contracts';

interface IdentityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<number, string> = {
  [UserRole.None]: 'Not Registered',
  [UserRole.Investor]: 'Investor',
  [UserRole.Founder]: 'Founder',
};

type Step = 'zkpass' | 'role' | 'profile';

export default function IdentityModal({ open, onOpenChange }: IdentityModalProps) {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('zkpass');

  // Founder profile form state
  const [profileName, setProfileName] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileLinkedin, setProfileLinkedin] = useState('');
  const [profileTwitter, setProfileTwitter] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  // Contract reads
  const { data: isRegistered, refetch: refetchRegistered } = useIsUserRegistered(address);
  const { data: userRole, refetch: refetchRole } = useUserRole(address);
  const { data: isVerified } = useIsVerifiedUser(address);
  const { data: isZKVerified, refetch: refetchZKVerified } = useIsZKPassportVerified(address);

  // ZKPassport verification hook
  const {
    message: zkMessage,
    queryUrl,
    isLoading: isZKLoading,
    isConfirmed: isZKConfirmed,
    createVerificationRequest,
    resetVerification,
    loadingStates,
  } = useZKPassportVerification();

  // Contract write for role registration
  const {
    registerRole,
    isPending: isRolePending,
    isConfirming: isRoleConfirming,
    isSuccess: isRoleSuccess,
    error: roleError,
  } = useRegisterUserRole();

  // Founder profile hooks
  const { data: hasProfile, refetch: refetchHasProfile } = useHasFounderProfile(address);
  const {
    setFounderProfile,
    isPending: isProfilePending,
    isConfirming: isProfileConfirming,
    isSuccess: isProfileSuccess,
    error: profileError,
  } = useSetFounderProfile();
  const {
    registerFounderWithProfile,
    isPending: isFounderRegPending,
    isConfirming: isFounderRegConfirming,
    isSuccess: isFounderRegSuccess,
    error: founderRegError,
  } = useRegisterFounderWithProfile();
  const {
    uploadFounderProfile,
    isUploading: isProfileUploading,
    error: profileUploadError,
  } = useFounderProfileUpload();

  // Determine current step based on ZK verification status
  useEffect(() => {
    if (isZKVerified) {
      setCurrentStep('role');
    } else {
      setCurrentStep('zkpass');
    }
  }, [isZKVerified]);

  // Handle ZK verification success
  useEffect(() => {
    if (isZKConfirmed) {
      refetchZKVerified();
      // Auto-advance to role selection after a short delay
      setTimeout(() => {
        setCurrentStep('role');
      }, 1500);
    }
  }, [isZKConfirmed, refetchZKVerified]);

  // Handle successful role registration (Investor or Founder who skipped profile)
  useEffect(() => {
    if (isRoleSuccess) {
      refetchRegistered();
      refetchRole();
      setShowSuccess(true);
      // Determine redirect path based on selected role before resetting
      const redirectPath = selectedRole === UserRole.Founder ? '/founder' : '/browse';
      setSelectedRole(null);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        navigate(redirectPath);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isRoleSuccess, refetchRegistered, refetchRole, onOpenChange, navigate, selectedRole]);

  // Handle successful founder registration with profile (combined function)
  useEffect(() => {
    if (isFounderRegSuccess) {
      refetchRegistered();
      refetchRole();
      refetchHasProfile();
      setShowSuccess(true);
      setSelectedRole(null);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        navigate('/founder');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isFounderRegSuccess, refetchRegistered, refetchRole, refetchHasProfile, onOpenChange, navigate]);

  // Handle successful profile update
  useEffect(() => {
    if (isProfileSuccess) {
      setShowSuccess(true);
      refetchHasProfile();
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        navigate('/founder');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isProfileSuccess, refetchHasProfile, onOpenChange, navigate]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      resetVerification();
      setSelectedRole(null);
      setShowSuccess(false);
      // Reset profile form
      setProfileName('');
      setProfileTitle('');
      setProfileBio('');
      setProfileLinkedin('');
      setProfileTwitter('');
      setProfileImageFile(null);
      setProfileImagePreview(null);
    }
  }, [open, resetVerification]);

  const handleRegister = () => {
    if (selectedRole === null || isRolePending || isRoleConfirming) return;

    if (selectedRole === UserRole.Founder) {
      // For founders, advance to profile step without calling contract yet
      // The combined registerFounderWithProfile will be called after profile form
      setCurrentStep('profile');
    } else {
      // For investors, register immediately
      registerRole(selectedRole);
    }
  };

  const handleStartZKVerification = () => {
    createVerificationRequest();
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProfile = async () => {
    if (!profileName || !profileTitle || !profileBio) return;

    const ipfsHash = await uploadFounderProfile(
      {
        name: profileName,
        title: profileTitle,
        bio: profileBio,
        linkedin: profileLinkedin || undefined,
        twitter: profileTwitter || undefined,
      },
      profileImageFile
    );

    if (ipfsHash) {
      // Use combined function: registers as Founder + sets profile in ONE transaction
      registerFounderWithProfile(`ipfs://${ipfsHash}`);
    }
  };

  const handleSkipProfile = () => {
    // If skipping, register as Founder without profile (separate transaction)
    registerRole(UserRole.Founder);
  };

  const isRoleLoading = isRolePending || isRoleConfirming;
  const isProfileLoading = isProfilePending || isProfileConfirming || isProfileUploading || isFounderRegPending || isFounderRegConfirming;
  const currentRole = userRole !== undefined ? Number(userRole) : UserRole.None;

  // Get loading message for ZK process
  const getZKLoadingMessage = () => {
    if (loadingStates.generatingProofs) return 'Generating proof...';
    if (loadingStates.backendVerifying) return 'Verifying proof...';
    if (loadingStates.contractPending) return 'Confirm in wallet...';
    if (loadingStates.contractConfirming) return 'Confirming on blockchain...';
    return zkMessage || 'Processing...';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#1F1F1F] rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            Identity Verification
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Step Indicator */}
          {((!isRegistered && currentRole === UserRole.None) || currentStep === 'profile') && isConnected && (
            <div className="flex items-center justify-center gap-1">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                currentStep === 'zkpass' ? 'bg-[#A2D5C6]/20' : 'bg-[#1A1A1A]'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isZKVerified || currentStep !== 'zkpass' ? 'bg-[#A2D5C6] text-black' : 'bg-[#2A2A2A] text-white/50'
                }`}>
                  {isZKVerified || currentStep !== 'zkpass' ? <CheckCircle2 className="h-3 w-3" /> : '1'}
                </div>
                <span className={`text-xs ${currentStep === 'zkpass' || isZKVerified ? 'text-white' : 'text-white/50'}`}>
                  ZKPassport
                </span>
              </div>
              <ArrowRight className="h-3 w-3 text-white/30" />
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                currentStep === 'role' ? 'bg-[#A2D5C6]/20' : 'bg-[#1A1A1A]'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 'role' ? 'bg-[#A2D5C6] text-black' : currentStep === 'profile' ? 'bg-[#A2D5C6] text-black' : 'bg-[#2A2A2A] text-white/50'
                }`}>
                  {currentStep === 'profile' ? <CheckCircle2 className="h-3 w-3" /> : '2'}
                </div>
                <span className={`text-xs ${currentStep === 'role' || currentStep === 'profile' ? 'text-white' : 'text-white/50'}`}>
                  Role
                </span>
              </div>
              {(selectedRole === UserRole.Founder || currentStep === 'profile') && (
                <>
                  <ArrowRight className="h-3 w-3 text-white/30" />
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                    currentStep === 'profile' ? 'bg-[#A2D5C6]/20' : 'bg-[#1A1A1A]'
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 'profile' ? 'bg-[#A2D5C6] text-black' : 'bg-[#2A2A2A] text-white/50'
                    }`}>
                      3
                    </div>
                    <span className={`text-xs ${currentStep === 'profile' ? 'text-white' : 'text-white/50'}`}>
                      Profile
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Already Registered Status */}
          {isRegistered && currentRole !== UserRole.None && (
            <div>
                <div className="text-center">
                  <p className="text-white/50 text-sm mb-1">Registered As</p>
                  <p className="text-4xl font-bold text-white">{roleLabels[currentRole]}</p>
                </div>
            </div>
          )}

          {/* Success Messages */}
          {showSuccess && (
            <div className="flex items-center gap-3 bg-[#A2D5C6]/20 text-[#A2D5C6] rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">Successfully registered!</p>
            </div>
          )}

          {isZKConfirmed && currentStep === 'zkpass' && (
            <div className="flex items-center gap-3 bg-[#A2D5C6]/20 text-[#A2D5C6] rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">ZKPassport verified! Proceeding to role selection...</p>
            </div>
          )}

          {/* Error Messages */}
          {roleError && (
            <div className="flex items-center gap-3 bg-red-500/20 text-red-400 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {roleError.message?.includes('already registered')
                  ? 'You are already registered.'
                  : roleError.message?.includes('UserNotVerified')
                  ? 'You need to verify with ZKPassport first.'
                  : 'Registration failed. Please try again.'}
              </p>
            </div>
          )}

          {(profileError || profileUploadError || founderRegError) && (
            <div className="flex items-center gap-3 bg-red-500/20 text-red-400 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {profileError?.message?.includes('NotFounder')
                  ? 'Only founders can set a profile.'
                  : founderRegError?.message?.includes('UserAlreadyRegistered')
                  ? 'You are already registered.'
                  : profileUploadError || 'Failed to save profile. Please try again.'}
              </p>
            </div>
          )}

          {/* Registration Flow */}
          {!isConnected ? (
            <div className="text-center py-4">
              <p className="text-white/50 text-sm">Connect your wallet to register.</p>
            </div>
          ) : (!isRegistered || currentRole === UserRole.None || currentStep === 'profile') ? (
            <>
              {/* Step 1: ZKPassport Verification */}
              {currentStep === 'zkpass' && !isZKVerified && (
                <div className="space-y-4">
                  <div className="bg-[#1A1A1A]/60 rounded-xl p-4 border border-[#2A2A2A]">
                    <div className="flex items-center gap-3 mb-3">
                      <QrCode className="h-5 w-5 text-[#A2D5C6]" />
                      <h3 className="font-semibold text-white">ZKPassport Verification</h3>
                    </div>
                    <p className="text-sm text-white/60 mb-4">
                      Scan the QR code with the ZKPassport app to verify your identity anonymously.
                    </p>

                    {queryUrl ? (
                      <div className="space-y-4">
                        {/* QR Code Display */}
                        <div className="bg-white p-4 rounded-xl mx-auto w-fit">
                          <QRCode value={queryUrl} size={180} />
                        </div>

                        {/* Status Message */}
                        {isZKLoading && (
                          <div className="flex items-center justify-center gap-2 text-[#A2D5C6]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{getZKLoadingMessage()}</span>
                          </div>
                        )}

                        {zkMessage && !isZKLoading && (
                          <p className="text-center text-sm text-white/60">{zkMessage}</p>
                        )}

                        {/* Reset Button */}
                        <button
                          onClick={resetVerification}
                          className="w-full py-2 text-sm text-white/50 hover:text-white transition-colors"
                        >
                          Cancel and try again
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartZKVerification}
                        disabled={isZKLoading}
                        className="w-full py-4 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isZKLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Initializing...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-5 w-5" />
                            Start ZKPassport Verification
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Role Selection */}
              {currentStep === 'role' && isZKVerified && (
                <div className="space-y-4">
                  {/* ZK Verified Badge */}
                  <div className="flex items-center gap-2 bg-[#A2D5C6]/10 rounded-lg px-3 py-2">
                    <span className="text-sm text-[#A2D5C6]">ZKPassport Verified</span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-white/70 text-sm font-medium">Choose your role:</p>

                    {/* Investor Option */}
                    <button
                      onClick={() => setSelectedRole(UserRole.Investor)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedRole === UserRole.Investor
                          ? 'border-[#A2D5C6] bg-[#A2D5C6]/15'
                          : 'border-[#2A2A2A] bg-[#1A1A1A]/60 hover:border-[#A2D5C6]/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          selectedRole === UserRole.Investor
                        }`}>
                          <TrendingUp className={`h-6 w-6 ${
                            selectedRole === UserRole.Investor ? 'text-[#A2D5C6]' : 'text-white/60'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Investor</p>
                          <p className="text-sm text-white/50">
                            Invest in startups and earn yield on your capital
                          </p>
                        </div>
                        {selectedRole === UserRole.Investor && (
                          <CheckCircle2 className="h-5 w-5 text-[#A2D5C6] ml-auto" />
                        )}
                      </div>
                    </button>

                    {/* Founder Option */}
                    <button
                      onClick={() => setSelectedRole(UserRole.Founder)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedRole === UserRole.Founder
                          ? 'border-[#A2D5C6] bg-[#A2D5C6]/15'
                          : 'border-[#2A2A2A] bg-[#1A1A1A]/60 hover:border-[#A2D5C6]/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          selectedRole === UserRole.Founder
                        }`}>
                          <Briefcase className={`h-6 w-6 ${
                            selectedRole === UserRole.Founder ? 'text-[#A2D5C6]' : 'text-white/60'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Founder</p>
                          <p className="text-sm text-white/50">
                            Raise funds for your startup with yield-enhanced rounds
                          </p>
                        </div>
                        {selectedRole === UserRole.Founder && (
                          <CheckCircle2 className="h-5 w-5 text-[#A2D5C6] ml-auto" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Register Button */}
                  <button
                    onClick={handleRegister}
                    disabled={selectedRole === null || isRoleLoading}
                    className="w-full py-4 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRoleLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isRolePending ? 'Confirm in Wallet...' : 'Registering...'}
                      </>
                    ) : (
                      <>
                        Register as {selectedRole !== null ? roleLabels[selectedRole] : '...'}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 3: Founder Profile */}
              {currentStep === 'profile' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-[#A2D5C6]/10 rounded-lg px-3 py-2">
                    <span className="text-sm text-[#A2D5C6]">Registering as Founder</span>
                  </div>

                  <p className="text-white/70 text-sm font-medium">Complete your founder profile (one transaction):</p>

                  {/* Profile Image Upload */}
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => profileImageInputRef.current?.click()}
                    className="flex items-center gap-4 p-4 bg-[#1A1A1A]/60 border border-[#2A2A2A] rounded-xl cursor-pointer hover:border-[#A2D5C6]/30 transition-colors"
                  >
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                        <User className="h-6 w-6 text-white/40" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-white">{profileImageFile ? profileImageFile.name : 'Upload profile photo'}</p>
                      <p className="text-xs text-white/40">PNG, JPG up to 5MB</p>
                    </div>
                    <Upload className="h-5 w-5 text-white/40" />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-[#1A1A1A]/60 border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#A2D5C6]/50"
                      required
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Title / Role *</label>
                    <input
                      type="text"
                      value={profileTitle}
                      onChange={(e) => setProfileTitle(e.target.value)}
                      placeholder="CEO & Co-founder"
                      className="w-full bg-[#1A1A1A]/60 border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#A2D5C6]/50"
                      required
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Bio *</label>
                    <textarea
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Tell investors about your background and experience..."
                      rows={3}
                      className="w-full bg-[#1A1A1A]/60 border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#A2D5C6]/50 resize-none"
                      required
                    />
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">LinkedIn</label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <input
                          type="url"
                          value={profileLinkedin}
                          onChange={(e) => setProfileLinkedin(e.target.value)}
                          placeholder="linkedin.com/in/..."
                          className="w-full bg-[#1A1A1A]/60 border border-[#2A2A2A] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#A2D5C6]/50 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">X</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <input
                          type="text"
                          value={profileTwitter}
                          onChange={(e) => setProfileTwitter(e.target.value)}
                          placeholder="@handle"
                          className="w-full bg-[#1A1A1A]/60 border border-[#2A2A2A] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#A2D5C6]/50 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSkipProfile}
                      disabled={isProfileLoading || isRoleLoading}
                      className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isRoleLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isRolePending ? 'Confirm...' : 'Registering...'}
                        </>
                      ) : (
                        'Skip for now'
                      )}
                    </button>
                    <button
                      onClick={handleSubmitProfile}
                      disabled={!profileName || !profileTitle || !profileBio || isProfileLoading}
                      className="flex-[2] py-3 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProfileLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {isProfileUploading ? 'Uploading...' : (isFounderRegPending || isProfilePending) ? 'Confirm in Wallet...' : 'Registering...'}
                        </>
                      ) : (
                        'Register & Save Profile'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-white/50 text-sm">
                You are already registered as {roleLabels[currentRole]}.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="text-center">
            <p className="text-white/40 text-xs">
              {currentStep === 'zkpass' && !isZKVerified
                ? 'ZKPassport verification ensures you are a real person without revealing personal data.'
                : currentStep === 'profile'
                ? 'Your profile helps investors learn about your background and experience.'
                : 'Your role determines what actions you can perform on the platform.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
