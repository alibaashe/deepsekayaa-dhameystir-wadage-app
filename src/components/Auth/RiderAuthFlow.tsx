import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  User,
  MapPin,
  Shield,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles,
  Users,
  Coins,
  ChevronDown,
  Navigation,
  Key,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Check,
  Car,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import {
  WadaageShareEmblem,
  WadaageShareHeaderLogo,
  HargeisaSkylineSilhouette,
  HargeisaLandmarksLineArt,
  WhatsAppOtpIconGraphic,
  SuccessCelebrationBadge,
  BottomWaveGradient,
  HeroHargeisaCarScene,
} from './RiderAuthGraphics';
import { sendWhatsAppOtp, verifyWhatsAppOtp, displayFormattedPhone } from '../../services/whatsappOtpService';
import { HARGEISA_VERIFIED_LANDMARKS } from '../../data/hargeisaKeyLandmarks';
import {
  normalizeSomalilandPhone,
  isValidSomalilandRiderPhone,
  formatSomalilandPhone,
  getPhoneOperator,
  findRegisteredRider,
} from '../../utils/security';

// Popular Hargeisa districts and neighborhoods for quick pickup selection
const POPULAR_HARGEISA_LOCATIONS = [
  'Jigjiga Yar (Central)',
  '26 June District',
  'Ibrahim Koodbuur',
  'Maxamuud Haybe',
  'Axmed Dhagax',
  'Gaacama District',
  'Bada Cas (Sha\'abka)',
  'Cigaal International Airport (Egal)',
  'Star Hotel Area (Main Rd)',
  'Mansoor Hotel Area',
  'University of Hargeisa Campus',
  'Dowladda Hoose (City Hall)',
];

export type RiderAuthScreenStep =
  | 'welcome'   // Screen 1: Splash / Welcome ("Safar wadaag, nolol wadaag.")
  | 'phone'     // Screen 2: Enter Phone ("Ku samee akoon")
  | 'details'   // Screen 3: Name & Location ("Magacaga")
  | 'otp'       // Screen 4: OTP Verification ("Xaqiiji Lambarkaaga")
  | 'success'   // Screen 5: Success ("Aad baad u wanaagsantahay!")
  | 'signin';   // Screen 6: Existing account login ("Gal Akoonka")

interface RiderAuthFlowProps {
  onSwitchToDriver?: () => void;
  onSwitchToAdmin?: () => void;
}

export const RiderAuthFlow: React.FC<RiderAuthFlowProps> = ({
  onSwitchToDriver,
  onSwitchToAdmin,
}) => {
  const {
    login,
    registerRider,
    setPickupLocation,
    language,
    setLanguage,
  } = useRide();

  // Current screen state
  const [step, setStep] = useState<RiderAuthScreenStep>('welcome');

  // Form Fields
  const [phoneInput, setPhoneInput] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Jigjiga Yar (Central)');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [signInPassword, setSignInPassword] = useState('');
  const [signInMode, setSignInMode] = useState<'password' | 'otp'>('password');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // 6-digit OTP boxes state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(272); // 04:32 countdown
  const [resendCooldown, setResendCooldown] = useState(60); // 01:00 resend cooldown
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [pendingLoginUser, setPendingLoginUser] = useState<any | null>(null);

  // Timers ticker
  useEffect(() => {
    let timer: any = null;
    if (step === 'otp') {
      timer = setInterval(() => {
        setOtpExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step]);

  // Strict Somaliland phone sanitization: only digits, strip 00252/252/0, cap at exactly 9 numbers
  const handlePhoneInputChange = (raw: string) => {
    let clean = raw.replace(/\D/g, '');
    if (clean.startsWith('00252')) clean = clean.substring(5);
    else if (clean.startsWith('252')) clean = clean.substring(3);
    if (clean.startsWith('0')) clean = clean.substring(1);
    const capped = clean.substring(0, 9);
    setPhoneInput(capped);
    if (errorMessage) setErrorMessage(null);
  };

  const getCleanPhoneDigits = (raw: string) => {
    let clean = raw.replace(/\D/g, '');
    if (clean.startsWith('00252')) clean = clean.substring(5);
    else if (clean.startsWith('252')) clean = clean.substring(3);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return clean.substring(0, 9);
  };

  const getFormattedPhone = (overrideRaw?: string) => {
    const clean = getCleanPhoneDigits(overrideRaw || phoneInput);
    if (clean.length === 9) {
      return `+252 ${clean.substring(0, 2)} ${clean.substring(2)}`;
    }
    return clean ? `+252 ${clean}` : '';
  };

  // Handlers for OTP Inputs
  const handleOtpDigitChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (!numeric) {
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // Single digit input
    newDigits[index] = numeric.slice(-1);
    setOtpDigits(newDigits);

    // Auto advance to next box
    if (index < 5 && numeric) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // 1. Submit Phone Number (Step 1 -> Step 2)
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = getCleanPhoneDigits(phoneInput);
    // Strict requirement: MUST be exactly 9 numbers starting with 63 or 65
    if (clean.length !== 9 || (!clean.startsWith('63') && !clean.startsWith('65'))) {
      if (!clean.startsWith('63') && !clean.startsWith('65')) {
        setErrorMessage(
          language === 'so'
            ? 'Lambarka taleefanku waa inuu ku bilaabmaa 63 (Telesom ZAAD) ama 65 (Somtel EDAHAB)'
            : 'Phone number must start with 63 (Telesom) or 65 (Somtel)'
        );
      } else {
        setErrorMessage(
          language === 'so'
            ? `Lambarka taleefanku waa inuu noqdaa 9 lambar oo keliya (hadda waa ${clean.length} lambar). Tusaale: 63 4918201 ama 65 4918201`
            : `Rider phone number must be exactly 9 digits (currently ${clean.length} digits). Example: 63 4918201 or 65 4918201`
        );
      }
      return;
    }

    // Advance to Step 2: Details only if phone number is NOT already registered
    const existing = findRegisteredRider(clean);
    if (existing) {
      setErrorMessage(
        language === 'so'
          ? 'Lambarkani hore ayuu u diiwaangashanaa. Fadlan gal akoonkaaga (Log In).'
          : 'This phone number is already registered. Please go and log in.'
      );
      return;
    }

    setStep('details');
  };

  // 2. Submit Name & Location (Step 2 -> Step 3: Trigger OTP)
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(
        language === 'so'
          ? 'Fadlan geli magacaaga oo buuxa'
          : 'Please enter your full name'
      );
      return;
    }

    setIsLoading(true);
    const cleanPhone = getCleanPhoneDigits(phoneInput);

    try {
      // Send real WhatsApp OTP
      const res = await sendWhatsAppOtp(cleanPhone, 'rider', fullName.trim());
      setIsLoading(false);

      if (res.success) {
        setOtpExpirySeconds(272); // 04:32
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setStep('otp');
      } else {
        setErrorMessage(res.message || 'OTP delivery failed. Please try again.');
      }
    } catch (_err) {
      setIsLoading(false);
      setErrorMessage('Network connection error. Please try again.');
    }
  };

  // 3. Verify OTP (Step 3 -> Step 4: Success)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredOtp = otpDigits.join('').trim();
    if (enteredOtp.length < 4) {
      setErrorMessage(
        language === 'so'
          ? 'Fadlan geli koodhka 6-da god ah ee OTP'
          : 'Please enter the complete 6-digit OTP code'
      );
      return;
    }

    setIsLoading(true);
    const cleanPhone = getCleanPhoneDigits(phoneInput);

    try {
      const res = await verifyWhatsAppOtp(cleanPhone, enteredOtp, {
        name: fullName.trim(),
        phone: getFormattedPhone(),
        location: selectedLocation,
      }, 'rider');

      setIsLoading(false);

      if (res.success) {
        if (pendingLoginUser) {
          // Existing registered rider logged in via verified OTP!
          login(pendingLoginUser);
          return;
        }

        // Register real new rider in system
        const newRider = registerRider({
          name: fullName.trim() || 'Wadaage Passenger',
          phone: getFormattedPhone(),
          password: 'WadaageUser@2026',
        });

        // Set pickup location preference in context
        try {
          if (selectedLocation) {
            setPickupLocation({
              id: `loc_${Date.now()}`,
              name: selectedLocation,
              address: `${selectedLocation}, Hargeisa, Somaliland`,
              lat: 9.5600,
              lng: 44.0650,
            });
          }
        } catch {}

        setCreatedUser(newRider);
        setStep('success');
      } else {
        setErrorMessage(
          res.message ||
            (language === 'so'
              ? 'Koodhka OTP ma saxna. Fadlan dib u hubi.'
              : 'Invalid OTP code. Please check and try again.')
        );
      }
    } catch (_err) {
      setIsLoading(false);
      setErrorMessage('Verification failed. Please try again.');
    }
  };

  // Quick demo login helper
  const handleQuickDemoLogin = (demoPhone: string, demoName: string) => {
    setPhoneInput(demoPhone);
    setSignInPassword('123456');
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const existing = findRegisteredRider(demoPhone);
      const userToLogin = {
        id: existing?.id || `usr_${demoPhone}`,
        name: existing?.name || demoName,
        email: existing?.email || `${demoPhone}@wadaage.app`,
        phone: `+252 ${demoPhone.substring(0, 2)} ${demoPhone.substring(2)}`,
        role: 'passenger' as const,
        avatar: existing?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
      login(userToLogin);
    }, 250);
  };

  // 4. Existing User Sign In (Supports Password & WhatsApp OTP)
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = getCleanPhoneDigits(phoneInput);
    if (clean.length !== 9 || (!clean.startsWith('63') && !clean.startsWith('65'))) {
      if (!clean.startsWith('63') && !clean.startsWith('65')) {
        setErrorMessage(
          language === 'so'
            ? 'Lambarka taleefanku waa inuu ku bilaabmaa 63 (Telesom ZAAD) ama 65 (Somtel EDAHAB)'
            : 'Phone number must start with 63 (Telesom) or 65 (Somtel)'
        );
      } else {
        setErrorMessage(
          language === 'so'
            ? `Lambarka taleefanku waa inuu noqdaa 9 lambar oo keliya (hadda waa ${clean.length} lambar). Tusaale: 63 4918201 ama 65 4918201`
            : `Rider phone number must be exactly 9 digits (currently ${clean.length} digits). Example: 63 4918201 or 65 4918201`
        );
      }
      return;
    }

    // Strict Rule: Unregistered phone numbers cannot access system via login; they must register first!
    const existing = findRegisteredRider(clean);
    if (!existing) {
      setErrorMessage(
        language === 'so'
          ? 'Lambarkan lama helin nidaamka. Ma lihid akoon diiwaangashan. Fadlan sameyso akoon cusub (Is-diiwaangeli).'
          : 'This phone number is not registered in the system. Please register first.'
      );
      return;
    }

    // Send WhatsApp OTP to registered rider
    setIsLoading(true);
    try {
      const res = await sendWhatsAppOtp(clean, 'rider', existing.name || 'Wadaage Rider');
      setIsLoading(false);
      if (res.success) {
        setOtpDigits(['', '', '', '', '', '']);
        setOtpExpirySeconds(272);
        setResendCooldown(60);
        setPendingLoginUser(existing);
        setStep('otp');
      } else {
        setErrorMessage(res.message || 'OTP delivery failed. Please try again.');
      }
    } catch (_err) {
      setIsLoading(false);
      setErrorMessage('Network connection error. Please try again.');
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    const cleanPhone = getCleanPhoneDigits(phoneInput);
    const res = await sendWhatsAppOtp(cleanPhone, 'rider', fullName.trim());
    setIsLoading(false);
    if (res.success) {
      setResendCooldown(60);
      setOtpExpirySeconds(272);
    } else {
      setErrorMessage(res.message || 'Resend failed.');
    }
  };

  // Formatted countdown timer string: mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // RENDER SCREENS
  // =========================================================================

  return (
    <div className="w-full h-full min-h-[620px] max-w-sm sm:max-w-md mx-auto bg-white text-slate-900 flex flex-col justify-between relative overflow-hidden select-none font-sans shadow-2xl rounded-[36px] border border-slate-200">

      {/* TOP STATUS BAR (9:41, Cellular, WiFi, Battery) */}
      <div className={`w-full px-6 pt-3 pb-1 flex items-center justify-between text-xs font-semibold z-30 transition-colors ${
        step === 'welcome' || step === 'signin' ? 'text-white' : 'text-slate-800'
      }`}>
        <span className="font-bold tracking-tight">9:41</span>
        <div className="flex items-center space-x-1.5">
          {/* Signal Bars */}
          <div className="flex items-end space-x-0.5 h-2.5">
            <div className="w-0.5 h-1 bg-current rounded-full" />
            <div className="w-0.5 h-1.5 bg-current rounded-full" />
            <div className="w-0.5 h-2 bg-current rounded-full" />
            <div className="w-0.5 h-2.5 bg-current rounded-full" />
          </div>
          {/* WiFi */}
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21L24 8.98C20.93 5.9 16.69 4 12 4Z" />
          </svg>
          {/* Battery */}
          <div className="w-5 h-2.5 border border-current rounded-xs p-0.5 flex items-center">
            <div className="w-full h-full bg-current rounded-xs" />
          </div>
        </div>
      </div>

      {/* ERROR ALERT NOTIFICATION */}
      {errorMessage && (
        <div className="mx-4 mt-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold z-40 animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>

          {/* Quick Action when phone is already registered: Direct CTA to Login */}
          {(errorMessage.includes('hore ayuu u diiwaangashanaa') || errorMessage.includes('already registered')) && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep('signin');
              }}
              className="mt-2.5 w-full py-2 px-3 bg-[#0066FF] hover:bg-[#0052CC] active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
            >
              <span>Gal Akoonkaaga Hadda (Go to Login) ➔</span>
            </button>
          )}

          {/* Quick Action when phone is NOT registered: Direct CTA to Register */}
          {(errorMessage.includes('lama helin nidaamka') || errorMessage.includes('not registered')) && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep('phone');
              }}
              className="mt-2.5 w-full py-2 px-3 bg-[#008751] hover:bg-[#007445] active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
            >
              <span>Is-diiwaangeli Hadda (Register Now) ➔</span>
            </button>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREEN 1: WELCOME / ONBOARDING SPLASH ("Safar wadaag, nolol wadaag.") */}
      {/* =================================================================== */}
      {step === 'welcome' && (
        <div className="w-full flex-1 flex flex-col justify-between relative text-white overflow-hidden">
          {/* Background image matching user's uploaded design (Hargeisa night skyline & Somaliland flag building) */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/wadaage_hero_hargeisa.jpg"
              alt="Hargeisa Somaliland Night Skyline"
              className="w-full h-full object-cover object-center scale-105"
            />
            {/* Rich cinematic gradient overlays for pristine readability and gorgeous evening glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#021812]/95 via-[#021812]/70 to-black/50 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#021812]/95" />
          </div>

          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00E575]/15 rounded-full blur-3xl pointer-events-none z-10" />
          <div className="absolute bottom-16 -right-10 w-72 h-72 bg-[#00A3FF]/20 rounded-full blur-3xl pointer-events-none z-10" />

          {/* Top Bar with Location, Language & Role Switcher */}
          <div className="px-5 pt-3 pb-1 flex items-center justify-between z-20">
            {/* Location Pill */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00E575] animate-ping" />
              <span>Hargeysa • Somaliland</span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Language Switch */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'so' ? 'en' : 'so')}
                className="text-[11px] font-black px-2.5 py-1 bg-black/30 hover:bg-black/50 rounded-full border border-white/20 transition cursor-pointer"
                title="Bedel Luqadda"
              >
                {language === 'so' ? '🇸🇴 SO' : '🇬🇧 EN'}
              </button>

              {/* Role Switcher Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center space-x-1 text-[11px] font-black px-2.5 py-1 bg-[#00E575]/20 text-[#00E575] hover:bg-[#00E575]/30 rounded-full border border-[#00E575]/40 transition cursor-pointer"
                >
                  <User className="w-3 h-3" />
                  <span>Rider</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        if (onSwitchToDriver) onSwitchToDriver();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 font-bold flex items-center space-x-2 transition"
                    >
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                      <span>Darawal (Driver)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        if (onSwitchToAdmin) onSwitchToAdmin();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 font-bold flex items-center space-x-2 transition"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>Maamul (Admin)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Brand Emblem Badge */}
          <div className="pt-1 pb-1 flex flex-col items-center z-10">
            <WadaageShareEmblem size="lg" />
          </div>

          {/* Catchy Headline */}
          <div className="text-center px-5 space-y-1 z-10">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              <span>Safar wadaag,</span>
              <br />
              <span className="text-[#00E575] drop-shadow-[0_2px_12px_rgba(0,229,117,0.5)]">
                nolol wadaag.
              </span>
            </h1>
            <p className="text-xs sm:text-[13px] text-cyan-100/90 font-medium max-w-xs mx-auto leading-relaxed pt-0.5">
              {language === 'so'
                ? 'App-ka #1aad ee gaadiidka & safar-wadaagga Hargeysa. Badbaado sare & kharash jaban.'
                : '#1 Ride-sharing and taxi mobility app in Hargeisa. Safe, comfortable, affordable.'}
            </p>
          </div>

          {/* Hero Scene: Hargeisa Skyline, Somaliland Flag, and Branded Wadaage Car */}
          <div className="px-3.5 my-2 z-10">
            <HeroHargeisaCarScene className="w-full h-36 sm:h-40 shadow-2xl" />
          </div>

          {/* 4 Feature Badges Card */}
          <div className="px-4 z-10">
            <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 grid grid-cols-4 gap-1 text-center shadow-lg">
              {/* Feature 1 */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-[#00E575] flex items-center justify-center border border-[#00E575]/30">
                  <Users className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] font-black text-white">Rider</div>
                  <div className="text-[9px] text-cyan-200">Wadaag</div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] font-black text-white">Badbaado</div>
                  <div className="text-[9px] text-cyan-200">100% Huban</div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] font-black text-white">Kharash</div>
                  <div className="text-[9px] text-cyan-200">40% Kayd</div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] font-black text-white">Hargeysa</div>
                  <div className="text-[9px] text-cyan-200">12+ Degmo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Register & Sign In */}
          <div className="px-4 pt-2 pb-4 space-y-2.5 z-10">
            {/* Primary Action Button: "Bilow ➔" */}
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep('phone');
              }}
              className="w-full bg-[#00E575] hover:bg-[#00D766] active:scale-[0.98] text-slate-950 font-black py-3.5 rounded-full text-base tracking-wide shadow-[0_8px_24px_rgba(0,229,117,0.45)] transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              <span>Bilow • Sameyso Akoon</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Existing User Login Button */}
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep('signin');
              }}
              className="w-full bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-extrabold py-3 rounded-full text-sm tracking-wide border border-white/25 transition flex items-center justify-center space-x-2 cursor-pointer backdrop-blur-md"
            >
              <Key className="w-4 h-4 text-[#00E575]" />
              <span>Ma leedahay akoon? Gal (Sign In)</span>
            </button>
          </div>

          {/* Bottom Wave Graphic */}
          <BottomWaveGradient height={50} />
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREEN 2: ENTER PHONE NUMBER ("Ku samee akoon") */}
      {/* =================================================================== */}
      {step === 'phone' && (
        <div className="w-full flex-1 flex flex-col justify-between bg-white overflow-y-auto no-scrollbar">
          {/* Top Bar with Back Arrow and Wadaage Share Logo */}
          <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep('welcome');
              }}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <WadaageShareHeaderLogo />
            <div className="w-6" />
          </div>

          {/* Form Content */}
          <div className="px-6 py-4 flex-1 flex flex-col justify-start space-y-5">
            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ku samee akoon
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Gali lambarkaaga taleefanka
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              {/* Phone Input Box with Somaliland Flag, +252 code, and Phone Icon */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Lambarka Taleefanka Rakaabka (9 Digits)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {phoneInput.length}/9 lambar
                  </span>
                </label>

                <div className="relative flex items-center bg-white border-2 border-slate-200 focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 rounded-2xl px-3 py-2.5 shadow-sm transition">
                  {/* Somaliland Flag + +252 Badge */}
                  <div className="flex items-center space-x-1.5 pr-2.5 border-r border-slate-200 shrink-0">
                    <SomalilandFlag className="w-6 h-4 rounded-xs shadow-xs" />
                    <span className="font-mono font-black text-xs text-slate-800 tracking-wider">+252</span>
                  </div>

                  <input
                    type="tel"
                    autoFocus
                    maxLength={9}
                    value={phoneInput}
                    onChange={(e) => handlePhoneInputChange(e.target.value)}
                    placeholder="63 4918201 ama 65..."
                    className="w-full pl-3 pr-8 py-1 text-sm sm:text-base font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent tracking-wider"
                  />

                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>

                {/* Real-time Operator & 9-digit validation hint badges */}
                <div className="flex items-center justify-between text-[11px] mt-1.5 px-1 font-semibold">
                  <div className="flex items-center gap-1.5">
                    {phoneInput.startsWith('63') && (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Telesom (ZAAD)</span>
                      </span>
                    )}
                    {phoneInput.startsWith('65') && (
                      <span className="text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                        <span>Somtel (EDAHAB)</span>
                      </span>
                    )}
                    {!phoneInput.startsWith('63') && !phoneInput.startsWith('65') && (
                      <span className="text-amber-600 text-[10px]">
                        Ku bilow 63 ama 65
                      </span>
                    )}
                  </div>

                  {phoneInput.length === 9 && (phoneInput.startsWith('63') || phoneInput.startsWith('65')) && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                      <CheckCircle className="w-3 h-3" />
                      <span>9 Lambar Sax ah</span>
                    </span>
                  )}
                </div>

                {/* Quick preset chips */}
                <div className="flex items-center gap-2 mt-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">Tusaale:</span>
                  <button
                    type="button"
                    onClick={() => handlePhoneInputChange('634918201')}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition"
                  >
                    63 4918201
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePhoneInputChange('654918201')}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200 transition"
                  >
                    65 4918201
                  </button>
                </div>
              </div>

              {/* Blue Security Notice Box */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center space-x-2.5 text-xs text-blue-700 font-semibold">
                <Shield className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>Lambarkaaga waa la xaqiijin doonaa via SMS/OTP.</span>
              </div>

              {/* Blue Pill CTA Button: "Sii wad ➔" */}
              <button
                type="submit"
                className="w-full bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.98] text-white font-black py-3.5 rounded-full text-sm sm:text-base tracking-wide shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Sii wad</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Divider "Ama" */}
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative px-4 bg-white text-xs text-slate-400 font-bold">
                Ama
              </span>
            </div>

            {/* Bottom Graphic: Stylized Hargeisa Skyline Silhouette with 3 Dots */}
            <div className="pt-2 text-center space-y-1.5 flex flex-col items-center">
              <HargeisaSkylineSilhouette className="w-full h-16" />
              <div className="font-extrabold text-xs text-slate-800">Wadaage Share</div>
              <div className="text-[11px] text-slate-500">Dadka isku xidhi, safarka fudude.</div>

              {/* 3 Pagination Carousel Dots: [ ● ○ ○ ] */}
              <div className="flex items-center space-x-1.5 pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0066FF]" />
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <div className="w-2 h-2 rounded-full bg-slate-300" />
              </div>
            </div>
          </div>

          {/* Bottom Wave Graphic */}
          <BottomWaveGradient height={65} />
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREEN 3: NAME & LOCATION ("Magacaga") */}
      {/* =================================================================== */}
      {step === 'details' && (
        <div className="w-full flex-1 flex flex-col justify-between bg-white overflow-y-auto no-scrollbar">
          {/* Top Bar with Back Arrow and Logo */}
          <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep('phone');
              }}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <WadaageShareHeaderLogo />
            <div className="w-6" />
          </div>

          {/* Form Content */}
          <div className="px-6 py-4 flex-1 flex flex-col justify-start space-y-4">
            {/* Section 1: Name */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Magacaga
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Gali magacaga oo buuxa
              </p>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              {/* Name Input with User Icon */}
              <div className="relative flex items-center bg-white border-2 border-slate-200 focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 rounded-2xl px-3.5 py-3 shadow-sm transition">
                <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Magacaaga oo buuxa"
                  className="w-full text-sm sm:text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                />
              </div>

              {/* Section 2: Choose Pickup Location */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                  Dooro goobta aad ka qaadato
                </label>

                {/* Location Picker Box */}
                <div className="relative">
                  <div
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className="flex items-center justify-between bg-white border-2 border-slate-200 hover:border-[#0066FF] rounded-2xl px-3.5 py-3 shadow-sm cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <MapPin className="w-4 h-4 text-[#0066FF] shrink-0" />
                      <span className="text-sm font-bold text-slate-800 truncate">
                        {selectedLocation || 'Dooro goobta'}
                      </span>
                    </div>
                    <Navigation className="w-4 h-4 text-[#0066FF] shrink-0 rotate-45" />
                  </div>

                  {/* Dropdown Options */}
                  {showLocationDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 space-y-1">
                      {POPULAR_HARGEISA_LOCATIONS.map((loc) => (
                        <div
                          key={loc}
                          onClick={() => {
                            setSelectedLocation(loc);
                            setShowLocationDropdown(false);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-between ${
                            selectedLocation === loc
                              ? 'bg-blue-50 text-[#0066FF]'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{loc}</span>
                          {selectedLocation === loc && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Blue Pill CTA Button: "Sii wad ➔" */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.98] text-white font-black py-3.5 rounded-full text-sm sm:text-base tracking-wide shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sii wad</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Blue Security Notice Box */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center space-x-2.5 text-xs text-blue-700 font-semibold">
                <Shield className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>Lambarkaaga waa la xaqiijin doonaa Koodhka OTP.</span>
              </div>
            </form>

            {/* Bottom Graphic: Hargeisa Somaliland Landmark Line Art */}
            <div className="pt-1">
              <HargeisaLandmarksLineArt className="w-full h-20" />
            </div>
          </div>

          {/* Bottom Wave Graphic */}
          <BottomWaveGradient height={65} />
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREEN 4: OTP VERIFICATION ("Xaqiiji Lambarkaaga") */}
      {/* =================================================================== */}
      {step === 'otp' && (
        <div className="w-full flex-1 flex flex-col justify-between bg-white overflow-y-auto no-scrollbar">
          {/* Top Bar with Back Arrow */}
          <div className="px-5 pt-2 pb-2 flex items-center justify-between border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep('details');
              }}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <WadaageShareHeaderLogo />
            <div className="w-6" />
          </div>

          {/* Form Content */}
          <div className="px-6 py-3 flex-1 flex flex-col justify-start space-y-4">
            {/* Header Icon Graphic: WhatsApp + SMS Bubbles */}
            <div className="flex justify-center -my-1">
              <WhatsAppOtpIconGraphic className="w-24 h-20" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Xaqiiji Lambarkaaga
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-500 font-medium leading-relaxed">
                Fadlan geli koodhka OTP ee aan kuugu soo dirnay lambarka taleefanka{' '}
                <span className="font-bold text-slate-800">{getFormattedPhone()}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* 6 OTP Input Boxes */}
              <div className="flex items-center justify-between space-x-2 py-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className="w-11 h-13 sm:w-12 sm:h-14 bg-white border-2 border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 rounded-2xl text-center text-xl sm:text-2xl font-black font-mono text-slate-900 focus:outline-none shadow-sm transition"
                  />
                ))}
              </div>

              {/* Expiry Countdown Timer */}
              <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Koodhku wuu dhacayaa </span>
                <span className="font-mono font-black text-[#0066FF]">
                  {formatTimer(otpExpirySeconds)}
                </span>
              </div>

              {/* Blue Pill CTA Button: "Xaqiiji ➔" */}
              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length < 4}
                className="w-full bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.98] text-white font-black py-3.5 rounded-full text-sm sm:text-base tracking-wide shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Xaqiiji</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Resend OTP Link with Cooldown */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleResendOtp}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-60 transition"
                >
                  <span>Ma helin koodh? </span>
                  <span className="text-[#0066FF] font-black underline underline-offset-2">
                    {resendCooldown > 0 ? `Dib u dir (${formatTimer(resendCooldown)})` : 'Dib u dir'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Wave Graphic */}
          <BottomWaveGradient height={65} />
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREEN 5: ACCOUNT SUCCESS ("Aad baad u wanaagsantahay!") */}
      {/* =================================================================== */}
      {step === 'success' && (
        <div className="w-full flex-1 flex flex-col justify-between bg-white overflow-y-auto no-scrollbar">
          {/* Top Bar with Status Spacing */}
          <div className="pt-4 flex justify-center">
            <WadaageShareHeaderLogo />
          </div>

          {/* Success Content */}
          <div className="px-6 py-4 flex-1 flex flex-col justify-center items-center text-center space-y-5">
            {/* Celebration Green Checkmark Badge */}
            <div className="my-1 animate-scale-up">
              <SuccessCelebrationBadge className="w-32 h-32" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Aad baad u wanaagsantahay!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs">
                Akaontiaaaga si guul leh ayaa loo abuuay.
              </p>
            </div>

            {/* Account Ready Card */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#0066FF] text-white flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-black text-slate-900">
                    {fullName || 'Akaontigaaga'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold">
                    Akaontigaaga waa diyaar
                  </div>
                </div>
              </div>

              {/* Green Verified Circle */}
              <div className="w-6 h-6 rounded-full bg-[#00E575] text-slate-950 flex items-center justify-center shadow-xs">
                <CheckCircle className="w-4 h-4 fill-slate-950 text-white" />
              </div>
            </div>

            {/* Blue Pill CTA Button: "Gala Appka ➔" */}
            <button
              type="button"
              onClick={() => {
                if (createdUser) {
                  login(createdUser);
                } else {
                  const rider = registerRider({
                    name: fullName || 'Wadaage Passenger',
                    phone: getFormattedPhone(),
                  });
                  login(rider);
                }
              }}
              className="w-full bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.98] text-white font-black py-4 rounded-full text-base tracking-wide shadow-xl shadow-blue-500/30 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Gala Appka</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* City Skyline Silhouette & Tagline */}
            <div className="pt-2 w-full flex flex-col items-center">
              <HargeisaSkylineSilhouette className="w-full h-14" />
              <div className="text-[11px] font-extrabold text-slate-800">Wadaage Share</div>
              <div className="text-[10px] text-slate-500">Safar wadaag, nolol wadaag.</div>
            </div>
          </div>

          {/* Bottom Wave Graphic */}
          <BottomWaveGradient height={65} />
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREEN 6: SIGN IN / DIRECT LOGIN FOR EXISTING ACCOUNTS ("Gal") */}
      {/* =================================================================== */}
      {step === 'signin' && (
        <div className="w-full flex-1 flex flex-col justify-between relative text-white overflow-y-auto no-scrollbar">
          {/* Background image matching user's uploaded design */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/wadaage_hero_hargeisa.jpg"
              alt="Hargeisa Somaliland Night Skyline"
              className="w-full h-full object-cover object-center scale-105"
            />
            {/* Rich cinematic gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#021812]/95 via-[#021812]/75 to-black/55 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#021812]/95" />
          </div>
          {/* Top Bar with Back Arrow, Logo & Language */}
          <div className="px-5 pt-3 pb-2 flex items-center justify-between z-10 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep('welcome');
              }}
              className="p-1.5 -ml-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <WadaageShareHeaderLogo />

            <button
              type="button"
              onClick={() => setLanguage(language === 'so' ? 'en' : 'so')}
              className="text-[11px] font-black px-2.5 py-1 bg-black/30 hover:bg-black/50 rounded-full border border-white/20 transition cursor-pointer"
            >
              {language === 'so' ? '🇸🇴 SO' : '🇬🇧 EN'}
            </button>
          </div>

          {/* Form Container */}
          <div className="px-5 py-3 space-y-3.5 z-10">
            {/* Header Title */}
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Gal Akoonkaaga
              </h2>
              <p className="text-xs text-cyan-200/90 font-medium">
                {language === 'so'
                  ? 'Geli lambarkaaga taleefanka si aad u gasho app-ka rakaabka'
                  : 'Enter your phone number to sign in to Wadaage Rider'}
              </p>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              {/* Phone Input Box */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-white/90 mb-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#00E575]" />
                    <span>Lambarka Taleefanka (9 Digits)</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#00E575] bg-black/40 px-2 py-0.5 rounded-full border border-[#00E575]/30">
                    {phoneInput.length}/9
                  </span>
                </div>

                <div className="flex items-center bg-white rounded-2xl px-3 py-2.5 shadow-lg border-2 border-transparent focus-within:border-[#00E575]">
                  <div className="flex items-center space-x-1.5 pr-2.5 border-r border-slate-200 shrink-0">
                    <SomalilandFlag className="w-6 h-4 rounded-xs shadow-xs" />
                    <span className="font-mono font-black text-xs text-slate-800 tracking-wider">+252</span>
                  </div>
                  <input
                    type="tel"
                    autoFocus
                    maxLength={9}
                    value={phoneInput}
                    onChange={(e) => handlePhoneInputChange(e.target.value)}
                    placeholder="63 4918201 ama 65..."
                    className="w-full pl-3 pr-2 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none tracking-wider"
                  />
                </div>

                {/* Operator Badge */}
                <div className="flex items-center justify-between text-[10px] mt-1.5 px-1 font-semibold">
                  <div className="flex items-center gap-1.5">
                    {phoneInput.startsWith('63') && (
                      <span className="text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                        ✓ 63 (Telesom ZAAD)
                      </span>
                    )}
                    {phoneInput.startsWith('65') && (
                      <span className="text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                        ✓ 65 (Somtel EDAHAB)
                      </span>
                    )}
                    {!phoneInput.startsWith('63') && !phoneInput.startsWith('65') && (
                      <span className="text-amber-300">
                        Ku bilow 63 (Telesom) ama 65 (Somtel)
                      </span>
                    )}
                  </div>
                  {phoneInput.length === 9 && (phoneInput.startsWith('63') || phoneInput.startsWith('65')) && (
                    <span className="text-[#00E575] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>9 Lambar Sax ah</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00E575] hover:bg-[#00D766] active:scale-[0.98] text-slate-950 font-black py-3.5 rounded-full text-base tracking-wide shadow-xl shadow-[#00E575]/35 transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    <span>U Dir Koodhka WhatsApp</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Register */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep('welcome');
                }}
                className="text-xs font-semibold text-white/90 hover:text-white transition"
              >
                <span>Ma lihid akoon? </span>
                <span className="text-[#00E575] font-black underline underline-offset-2">
                  Sameyso akoon cusub (Bilow)
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Wave Graphic */}
          <BottomWaveGradient height={40} />
        </div>
      )}
    </div>
  );
};
