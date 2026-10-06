import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Car,
  Shield,
  Globe,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Phone,
  Users,
  CreditCard,
  Sparkles,
  Navigation,
  Clock,
  Star,
  Zap,
  Check,
  ChevronRight,
  ExternalLink,
  Activity,
  Layers,
  ShieldCheck,
  Building,
  DollarSign,
  Compass,
  ArrowRightLeft,
  Fuel,
  Radio,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { WadaageLogo } from '../Common/WadaageLogo';
import {
  WebsiteCmsConfig,
  DEFAULT_WEBSITE_CMS_CONFIG,
} from '../../types/websiteCms';
import { HARGEISA_PLACES } from '../../data/hargeisaPlaces';
import { useRide } from '../../context/RideContext';
import { resolveHargeisaPlaceCoordinates } from '../../utils/hargeisaPlaceMatcher';

interface WadaageWelcomeWebsiteProps {
  onNavigate: (target: 'rider' | 'driver' | 'admin' | 'website') => void;
  language: 'so' | 'en';
  setLanguage: (lang: 'so' | 'en') => void;
}

export const WadaageWelcomeWebsite: React.FC<WadaageWelcomeWebsiteProps> = ({
  onNavigate,
  language,
  setLanguage,
}) => {
  const { setPickupLocation, setDropoffLocation } = useRide();

  const [cmsConfig, setCmsConfig] = useState<WebsiteCmsConfig>(() => {
    try {
      const saved = localStorage.getItem('wadaage_website_cms_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WEBSITE_CMS_CONFIG;
  });

  // Live Fare Estimator State
  const [selectedPickup, setSelectedPickup] = useState('Egal International Airport');
  const [selectedDropoff, setSelectedDropoff] = useState('Dahabshiil Bank HQ, 26 June');
  const [estimateDistanceKm, setEstimateDistanceKm] = useState(6.5);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Sync CMS config dynamically & listen for real-time admin edits
  useEffect(() => {
    const handleCmsUpdate = (e: any) => {
      if (e.data && e.data.type === 'CMS_CONFIG_UPDATED' && e.data.payload) {
        setCmsConfig(e.data.payload);
      }
    };

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const ch = new BroadcastChannel('wadaage_events_channel');
        ch.onmessage = handleCmsUpdate;
        return () => ch.close();
      } catch {}
    }
  }, []);

  // Real Hargeisa Fare Calculation (9,000 SLSH 1st km + 4,000 SLSH/km for Share; 12,000 SLSH 1st km + 7,000 SLSH/km for Taxi)
  const shareFareUsd = (0.90 + Math.max(0, estimateDistanceKm - 1) * 0.40).toFixed(2);
  const shareFareSlsh = Math.round(9000 + Math.max(0, estimateDistanceKm - 1) * 4000);
  const taxiFareUsd = (1.20 + Math.max(0, estimateDistanceKm - 1) * 0.70).toFixed(2);
  const taxiFareSlsh = Math.round(12000 + Math.max(0, estimateDistanceKm - 1) * 7000);

  // Quick book route from calculator into Rider App
  const handleQuickBookRoute = (pickupName: string, dropoffName: string) => {
    const pickupNode = resolveHargeisaPlaceCoordinates(pickupName);
    const dropoffNode = resolveHargeisaPlaceCoordinates(dropoffName);
    setPickupLocation(pickupNode);
    setDropoffLocation(dropoffNode);
    onNavigate('rider');
  };

  const activeFaqs = (cmsConfig.faqs && cmsConfig.faqs.length > 0) ? cmsConfig.faqs.filter(f => f.enabled !== false) : [
    {
      id: 'faq_1',
      questionSo: 'Waa maxay Wadaage Share (Gaadhi Wadaag)?',
      questionEn: 'What is Wadaage Share (Carpooling)?',
      answerSo: 'Wadaage Share waa adeeg casri ah oo kuu sahlaya inaad gaadhiga la wadaagto qof kale oo jidkaaga ku socda. Waxaad badbaadinaysaa 30% qiimaha caadiga ah adigoo helaya safar degdeg ah oo aamin ah.',
      answerEn: 'Wadaage Share is a smart carpooling service that lets you share a ride with co-passengers heading along the same corridor in Hargeisa. You save up to 30% compared to private taxis while enjoying fast, verified transport.',
      category: 'riders' as const,
      enabled: true,
    },
    {
      id: 'faq_2',
      questionSo: 'Sidee lacagta loogu bixiyaa ZAAD ama eDahab?',
      questionEn: 'How do I pay with ZAAD or eDahab?',
      answerSo: 'Wadaage wuxuu toos ugu xidhan yahay adeegyada lacagaha mobilka (ZAAD, eDahab, Sahal). Waxaad toos ugu bixin kartaa lacagta app-ka dhexdiisa 1-taabasho ama lacag caddaan ah (Cash) marka safarku dhamaado.',
      answerEn: 'Wadaage supports seamless 1-tap in-app payments via ZAAD, eDahab, and Sahal, as well as direct cash payment to the driver upon drop-off.',
      category: 'payments' as const,
      enabled: true,
    },
    {
      id: 'faq_3',
      questionSo: 'Sideen noqon karaa darawal Wadaage?',
      questionEn: 'How do I register as a Wadaage Driver Partner?',
      answerSo: 'Guji badhanka "Driver App" ama "Noqo Dareewal", geli lambarkaaga WhatsApp, soo geli sawirka shatiga iyo baabuurka. Ansixintu waxay qaadataa wax ka yar 24 saacadood, waxaanad ku shaqaynaysaa komishanka ugu jaban Somaliland (1,000 SLSH oo go’an safarkiiba).',
      answerEn: 'Click "Driver App" or "Register as Driver", enter your WhatsApp phone number, and upload your driver license & vehicle details. Approval takes under 24 hours, and you keep 100% of your fares minus a fixed 1,000 SLSH ($0.10) flat fee.',
      category: 'drivers' as const,
      enabled: true,
    },
    {
      id: 'faq_4',
      questionSo: 'Sidee amniga safarka loo ilaaliyaa?',
      questionEn: 'How does Wadaage ensure passenger safety?',
      answerSo: 'Dhammaan darawallada waxaa lagu xaqiijiyaa Somaliland ID iyo baadhitaan dhab ah. Waxa kale oo aad haysataa badhanka SOS, la wadaagista jidkaaga tooska ah ehelkaaga (WhatsApp Live Share), iyo calaamada midabka (Safety Beacon).',
      answerEn: 'All drivers undergo strict identity and document verification. Trips feature real-time GPS tracking, WhatsApp live trip sharing with family, in-app emergency SOS, and safety color beacon matching.',
      category: 'general' as const,
      enabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. TOP NOTICE & ANNOUNCEMENT STRIP */}
      {cmsConfig.announcement.enabled && (
        <div
          className={`bg-gradient-to-r ${cmsConfig.announcement.bgGradient || 'from-emerald-700 via-teal-800 to-slate-900'} text-white py-2 px-4 text-xs font-semibold border-b border-emerald-500/30`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <SomalilandFlag className="w-4 h-2.5 rounded-2xs shrink-0" />
              <span className="font-bold truncate">
                {language === 'so'
                  ? cmsConfig.announcement.messageSo
                  : cmsConfig.announcement.messageEn}
              </span>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
              <a
                href={`https://wa.me/${cmsConfig.contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center space-x-1.5 text-emerald-300 hover:text-white font-bold transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: {cmsConfig.contact.whatsappNumber}</span>
              </a>

              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'so' : 'en')}
                className="bg-slate-900/80 hover:bg-slate-900 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center space-x-1.5 transition border border-emerald-500/40 cursor-pointer"
              >
                <Globe className="w-3 h-3 text-emerald-300" />
                <span>{language === 'en' ? 'SOMALI' : 'ENGLISH'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN NAVBAR */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo & Slogan */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('website')}>
            <WadaageLogo variant="badge" size="sm" />
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Wadaage
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">.com</span>
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider hidden xs:block">
                Somaliland Smart Mobility
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold text-slate-300">
            <a href="#services" className="hover:text-emerald-400 transition">
              {language === 'so' ? 'Adeegyada' : 'Services'}
            </a>
            <a href="#calculator" className="hover:text-emerald-400 transition">
              {language === 'so' ? 'Qiyaas Qiimaha' : 'Fare Estimator'}
            </a>
            <a href="#radar" className="hover:text-emerald-400 transition flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{language === 'so' ? 'Raadaarka Tooska ah' : 'Live Radar'}</span>
            </a>
            <a href="#drivers" className="hover:text-emerald-400 transition">
              {language === 'so' ? 'Darawallada' : 'Drive With Us'}
            </a>
            <a href="#fuel" className="hover:text-emerald-400 transition">
              {language === 'so' ? 'Shidaalka & Masaafada' : 'Fuel Tracker'}
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition">
              FAQ
            </a>
          </nav>

          {/* Direct Ride Booking & Portal Launchers */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={() => onNavigate('driver')}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black border border-slate-700 transition cursor-pointer"
              title="wadaage.com/driver"
            >
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{language === 'so' ? 'Dareewal' : 'Driver App'}</span>
              <span className="sm:hidden">Driver</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('rider')}
              className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 active:scale-95 text-slate-950 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition flex items-center space-x-2 cursor-pointer"
              title="wadaage.com/rider"
            >
              <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
              <span>{language === 'so' ? 'Dalbo Wadaage' : 'Book a Ride'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
              title="wadaage.com/admin"
            >
              <Shield className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-12 sm:py-20 border-b border-slate-800/80">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {language === 'so'
                    ? 'Adeegga Gaadiidka ee #1 ee Somaliland • Hargeisa'
                    : 'Somaliland’s #1 Smart Mobility Platform • Hargeisa'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                {language === 'so' ? (
                  <>
                    Safarkaaga Hargeysa, Si Fudud &{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                      Qiimo Jaban
                    </span>
                  </>
                ) : (
                  <>
                    Your Ride Across Hargeisa, Fast &{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                      Affordable
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                {language === 'so'
                  ? 'Kusoo dhowow Wadaage.com — Gaadhi wadaag casri ah (Wadaage Share 30% dhimis), Taaksi kuu gaar ah, baadhitaanka shidaalka & masaafada, iyo bixinta tooska ah ee ZAAD & eDahab.'
                  : 'Welcome to Wadaage.com — Somaliland’s premier bilingual ride-hailing ecosystem featuring Wadaage Share carpooling (save 30%), private taxis, live driver fuel & distance management, and instant ZAAD & eDahab payments.'}
              </p>

              {/* Quick Route Search Widget */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-xl max-w-xl mx-auto lg:mx-0 text-left">
                <div className="text-[11px] font-black uppercase text-emerald-400 tracking-wider mb-2 flex items-center justify-between">
                  <span>{language === 'so' ? 'Xageed u socotaa Hargeysa?' : 'Where are you going in Hargeisa?'}</span>
                  <span className="text-slate-400 font-mono text-[10px]">10,650+ Landmarks</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{language === 'so' ? 'Ka bixid (Pickup)' : 'Pickup'}</span>
                    </label>
                    <select
                      value={selectedPickup}
                      onChange={(e) => setSelectedPickup(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Egal International Airport">Egal International Airport (HGA)</option>
                      <option value="Dahabshiil Bank HQ, 26 June">Dahabshiil Bank HQ (26 June)</option>
                      <option value="Maan-soor Hotel">Maan-soor Hotel (Jigjiga-Yar)</option>
                      <option value="University of Hargeisa">University of Hargeisa</option>
                      <option value="Suuqa Hoose">Suuqa Hoose (Central Market)</option>
                      <option value="Total Gas Station, Berbera Rd">Kaalinta Total (Berbera Rd)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span>{language === 'so' ? 'Tagid (Dropoff)' : 'Dropoff'}</span>
                    </label>
                    <select
                      value={selectedDropoff}
                      onChange={(e) => setSelectedDropoff(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Dahabshiil Bank HQ, 26 June">Dahabshiil Bank HQ (26 June)</option>
                      <option value="Egal International Airport">Egal International Airport (HGA)</option>
                      <option value="Maan-soor Hotel">Maan-soor Hotel (Jigjiga-Yar)</option>
                      <option value="University of Hargeisa">University of Hargeisa</option>
                      <option value="Suuqa Hoose">Suuqa Hoose (Central Market)</option>
                      <option value="Total Gas Station, Berbera Rd">Kaalinta Total (Berbera Rd)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="text-xs">
                    <span className="text-slate-400 font-medium">Share: </span>
                    <span className="font-mono font-black text-emerald-400">{shareFareSlsh.toLocaleString()} SLSH</span>
                    <span className="text-[10px] text-slate-400 ml-1">(${shareFareUsd})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickBookRoute(selectedPickup, selectedDropoff)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition active:scale-95 shadow-md cursor-pointer"
                  >
                    <span>{language === 'so' ? 'Dalbo Hadda' : 'Book Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('rider')}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-slate-950" />
                  <span>{language === 'so' ? 'Fur Rider App' : 'Launch Rider App'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('driver')}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 hover:border-amber-400/50 px-7 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition active:scale-95 shadow-md cursor-pointer"
                >
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>{language === 'so' ? 'Dareewal Partner' : 'Driver Partner'}</span>
                </button>
              </div>

              {/* Trust Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-800 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                    {cmsConfig.stats?.activeDriversCount || '150+'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold">
                    {language === 'so' ? (cmsConfig.stats?.activeDriversLabelSo || 'Darawallo Firfircoon') : (cmsConfig.stats?.activeDriversLabelEn || 'Active Drivers')}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                    {cmsConfig.stats?.tripsCompletedCount || '45,000+'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold">
                    {language === 'so' ? (cmsConfig.stats?.tripsCompletedLabelSo || 'Safarro Guuleystay') : (cmsConfig.stats?.tripsCompletedLabelEn || 'Completed Rides')}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                    {cmsConfig.stats?.customerRating || '4.9 ★'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold">
                    {language === 'so' ? (cmsConfig.stats?.customerRatingLabelSo || 'Qanacsanaanta') : (cmsConfig.stats?.customerRatingLabelEn || 'Customer Rating')}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual: Mobile Showcase Mockup with Live Radar Simulation */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[320px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-2 ring-emerald-500/20">
                {/* Speaker Ear Notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" />
                  <div className="w-6 h-1 bg-slate-700 rounded-full" />
                </div>

                {/* Smartphone Screen Inside */}
                <div className="w-full bg-slate-950 rounded-[34px] overflow-hidden pt-7 pb-3 text-white text-xs space-y-2.5">
                  {/* Top Status */}
                  <div className="px-3.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-extrabold text-[11px] text-white">Wadaage Live Radar</span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                      Hargeisa Online
                    </span>
                  </div>

                  {/* Simulated Map with Moving Vehicles */}
                  <div className="h-44 bg-slate-900 relative rounded-2xl mx-2.5 overflow-hidden flex items-center justify-center border border-slate-800">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px]" />
                    
                    {/* Simulated Vehicle Pins */}
                    <div className="absolute top-4 left-6 flex items-center space-x-1 bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40 text-[9px]">
                      <Car className="w-3 h-3 text-emerald-400" />
                      <span className="font-bold text-slate-300">Vitz • SL-4921</span>
                    </div>

                    <div className="absolute bottom-5 right-6 flex items-center space-x-1 bg-slate-950/80 px-2 py-0.5 rounded-full border border-blue-500/40 text-[9px]">
                      <Car className="w-3 h-3 text-blue-400" />
                      <span className="font-bold text-slate-300">Corolla • SL-7814</span>
                    </div>

                    <div className="relative flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse border border-emerald-500/40">
                        <Navigation className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 mt-1 bg-slate-950/90 px-2 py-0.5 rounded-full border border-emerald-800">
                        Mansoor ➔ Egal Airport
                      </span>
                    </div>
                  </div>

                  {/* Bottom Card Mockup */}
                  <div className="bg-slate-900 p-3 rounded-2xl mx-2.5 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-xs">Wadaage Share (Carpool)</div>
                        <div className="text-[10px] text-emerald-400">Save 30% • 1–2 Seats</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400 font-mono">9,000 SLSH</div>
                        <div className="text-[9px] text-slate-400">$0.90 1st KM</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('rider')}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>Dalbo Hadda (wadaage.com/rider)</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE FARE & DISTANCE CALCULATOR */}
      <section id="calculator" className="py-14 bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center space-x-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{language === 'so' ? 'Xisaabiye Toos ah' : 'Live Fare Estimator'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === 'so'
                ? 'Qiyaas Qiimaha Safarkaaga Hargeysa'
                : 'Estimate Your Trip Fare Across Hargeisa'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {language === 'so'
                ? 'Dooro meesha aad ka baxayso iyo meesha aad u socoto si aad u ogaato qiimaha rasmiga ah ee Wadaage Share iyo Taaksiga.'
                : 'Select your pickup and dropoff points to calculate transparent fares in USD & Somaliland Shillings.'}
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Selectors */}
            <div className="md:col-span-7 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'so' ? 'Meesha aad joogto (Pickup Point):' : 'Pickup Location:'}</span>
                </label>
                <select
                  value={selectedPickup}
                  onChange={(e) => setSelectedPickup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  {HARGEISA_PLACES.slice(0, 30).map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} {loc.district ? `(${loc.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{language === 'so' ? 'Halka aad u socoto (Dropoff Destination):' : 'Dropoff Destination:'}</span>
                </label>
                <select
                  value={selectedDropoff}
                  onChange={(e) => setSelectedDropoff(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  {HARGEISA_PLACES.slice(0, 30).map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} {loc.district ? `(${loc.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>{language === 'so' ? 'Masaafada (Distance Slider):' : 'Adjust Distance (KM):'}</span>
                  <span className="font-mono text-emerald-400 font-black">{estimateDistanceKm} KM</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={estimateDistanceKm}
                  onChange={(e) => setEstimateDistanceKm(parseFloat(e.target.value) || 1)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Right Rate Cards */}
            <div className="md:col-span-5 space-y-3">
              {/* Wadaage Share */}
              <div className="bg-slate-900 p-4 rounded-2xl border-2 border-emerald-500/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Wadaage Share (30% Off)</span>
                  </span>
                  <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    9,000 SLSH 1st KM
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {shareFareSlsh.toLocaleString()} SLSH
                  </span>
                  <span className="text-xs text-slate-400 font-bold">(${shareFareUsd} USD)</span>
                </div>
              </div>

              {/* Normal Taxi */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-blue-400" />
                    <span>Taxi Gaar Ah (Private Sedan)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">12,000 SLSH 1st KM</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-blue-400 font-mono">
                    {taxiFareSlsh.toLocaleString()} SLSH
                  </span>
                  <span className="text-xs text-slate-400 font-bold">(${taxiFareUsd} USD)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickBookRoute(selectedPickup, selectedDropoff)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{language === 'so' ? 'Dalbo Jidkan (Rider App)' : 'Book This Route (Rider App)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LIVE RADAR & SPATIAL NETWORK SHOWCASE */}
      <section id="radar" className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{language === 'so' ? 'Shabakadda Raadaarka Tooska ah' : 'Live Spatial Radar'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {language === 'so' ? 'Raadaarka Tooska ah ee Hargeysa' : 'Real-time Radar & Fleet Telematics'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {language === 'so'
                ? 'Arag gaadiidka u dhow goobtaada iyo jidadka ugu mashquulka badan Somaliland si toos ah.'
                : 'Track nearest available drivers in real-time with sub-second telematics across Hargeisa.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {language === 'so' ? 'Imaanshaha Degdegga ah' : 'Sub-Minute Proximity'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'so'
                  ? 'Nidaamka dispatch-ka ee Wadaage wuxuu si toos ah u xidhaa darawalka kuugu dhow 1.0 km gudaheed.'
                  : 'Automatic corridor matching matches you with captains within a 1.0 km radius.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {language === 'so' ? 'Wadaage Share Carpool' : 'Corridor Stacking'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'so'
                  ? 'Farsamada corridor matching waxay ku xidhaa rakaabka kale ee jidkaaga ku socda bilaa leexasho dheeraad ah.'
                  : 'Real-time vector angle verification ensures co-riders travel along the same road corridor with ≤10 min detour.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black">
                <Fuel className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {language === 'so' ? 'Maamulka Shidaalka' : 'Driver Fuel Tracker'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'so'
                  ? 'Darawalladu waxay toos ula socdaan shidaalka ay isticmaalaan iyo faa’iidada dhabta ah ee safar kasta.'
                  : 'Captains track fuel consumption per kilometer and optimize profits per liter directly in-app.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DRIVER PARTNER VALUE PROPOSITION */}
      <section id="drivers" className="py-16 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-black border border-amber-500/30">
                  <Car className="w-3.5 h-3.5" />
                  <span>{language === 'so' ? 'Wadaage Driver Partner' : 'Drive & Earn with Wadaage'}</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {language === 'so'
                    ? 'Gaadhigaaga Ku Samee Dakhli Sare Maalin Kasta!'
                    : 'Turn Your Car Into Daily Income in Hargeisa!'}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {language === 'so'
                    ? 'Wadaage waxa uu bixiyaa komishanka ugu jaban Somaliland (kaliya 1,000 SLSH / $0.10 oo go’an safarkiiba). Dakhligaagu toos ayuu kuugu soo dhacayaa ZAAD/eDahab maalin kasta.'
                    : 'Wadaage charges the lowest flat commission in Somaliland (fixed 1,000 SLSH / $0.10 per completed trip). Direct instant mobile payouts to ZAAD and eDahab.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1,000 SLSH Flat Fee</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant ZAAD & eDahab</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>In-App Fuel Monitor</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-3">
                <button
                  type="button"
                  onClick={() => onNavigate('driver')}
                  className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-400/20 transition active:scale-95 cursor-pointer"
                >
                  {language === 'so' ? 'Isku Diiwaangeli Darawal' : 'Register as Driver (Driver Portal)'}
                </button>
                <span className="text-[11px] text-slate-400 text-center">
                  Ansixin degdeg ah wax ka yar 24 saacadood
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DRIVER FUEL & DISTANCE SPOTLIGHT */}
      <section id="fuel" className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                <Fuel className="w-3.5 h-3.5" />
                <span>{language === 'so' ? 'Farsamada Shidaalka ee Wadaage' : 'Fuel & Mileage Intelligence'}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {language === 'so' ? 'Ogow Shidaalka & Faa’iidada Safar Kasta' : 'Track Fuel Consumption & Real Profits'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {language === 'so'
                  ? 'Wadaage wuxuu wataa nidaam u gaar ah oo darawalka u xisaabiya litirka shidaalka ee uu isticmaalay masaafada uu jaray (KM/L) iyo dakhliga dhabta ah ee usoo hadhay.'
                  : 'Wadaage includes a dedicated fuel efficiency monitor that computes real liters consumed, kilometers driven, and net profit per trip for every vehicle model.'}
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{language === 'so' ? 'Qiyaasta litirka shidaalka halkii KM' : 'Liters per kilometer auto-calculation'}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{language === 'so' ? 'Digniinta shidaalka hooseeya' : 'Low fuel efficiency alerts'}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{language === 'so' ? 'Xisaabinta qiimaha shidaalka Hargeysa' : 'Live Hargeisa fuel price benchmarks ($0.85/L)'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Fuel className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-sm text-white">Fuel Efficiency HUD</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  12.5 KM/L
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-base font-black text-white font-mono">48.2 KM</div>
                  <div className="text-[10px] text-slate-400">Total Distance</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-base font-black text-amber-400 font-mono">3.85 L</div>
                  <div className="text-[10px] text-slate-400">Fuel Used</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-base font-black text-emerald-400 font-mono">+$32.50</div>
                  <div className="text-[10px] text-slate-400">Net Profit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="py-16 bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {language === 'so' ? 'Su’aalaha Inta Badan La Isweydiiyo' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {language === 'so'
                ? 'Wax kasta oo aad uga baahan tahay inaad ka ogaato adeegga Wadaage ee Hargeysa.'
                : 'Everything you need to know about riding and driving with Wadaage.'}
            </p>
          </div>

          <div className="space-y-3">
            {activeFaqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              const qText = (faq as any).questionSo || (faq as any).qSo;
              const qTextEn = (faq as any).questionEn || (faq as any).qEn;
              const aText = (faq as any).answerSo || (faq as any).aSo;
              const aTextEn = (faq as any).answerEn || (faq as any).aEn;
              return (
                <div
                  key={faq.id || idx}
                  className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition cursor-pointer"
                  >
                    <span>{language === 'so' ? qText : qTextEn}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-900 pt-3">
                      {language === 'so' ? aText : aTextEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. DOWNLOAD APP / PORTALS SECTION */}
      <section id="download" className="py-16 bg-slate-950 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-black border border-emerald-500/30">
            <Smartphone className="w-7 h-7" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {language === 'so'
              ? 'Ku Isticmaal Wadaage Mobilkaaga & Kumbuyuutarka'
              : 'Experience Wadaage on Any Device'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {language === 'so'
              ? 'Wadaage waxaad toos ugu furan kartaa browser-kaaga ama waxaad soo degsan kartaa App-ka rasmiga ah ee Android (APK).'
              : 'Access Wadaage instantly via modern web browsers or download the native Android APKs for offline resilience.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-3xl mx-auto">
            {/* Rider App Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
              <Navigation className="w-6 h-6 text-emerald-400 mx-auto" />
              <h3 className="font-extrabold text-sm text-white">wadaage.com/rider</h3>
              <p className="text-[11px] text-slate-400">Dalbo Wadaage Share ama Taaksi kuu gaar ah</p>
              <button
                type="button"
                onClick={() => onNavigate('rider')}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Launch Rider App
              </button>
            </div>

            {/* Driver App Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
              <Car className="w-6 h-6 text-amber-400 mx-auto" />
              <h3 className="font-extrabold text-sm text-white">wadaage.com/driver</h3>
              <p className="text-[11px] text-slate-400">Dakhli maalinle ah & Komishan 1,000 SLSH</p>
              <button
                type="button"
                onClick={() => onNavigate('driver')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition border border-slate-700 cursor-pointer"
              >
                Launch Driver App
              </button>
            </div>

            {/* Admin Portal Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
              <Shield className="w-6 h-6 text-blue-400 mx-auto" />
              <h3 className="font-extrabold text-sm text-white">wadaage.com/admin</h3>
              <p className="text-[11px] text-slate-400">Xarunta Maamulka & Baaritaanka Fleet-ka</p>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-black rounded-xl text-xs uppercase tracking-wider transition border border-slate-700 cursor-pointer"
              >
                Launch Admin Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 10. COMPREHENSIVE ENTERPRISE FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-white">Wadaage</span>
              <span className="text-xl font-black text-emerald-400">.com</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Adeegga gaadiidka casriga ah ee Somaliland. Wadaage Share carpooling, Taaksi gaar ah, iyo maamulka shidaalka & masaafada.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <SomalilandFlag className="w-5 h-3 rounded-xs" />
              <span className="text-[11px] font-bold text-slate-300">26 June District, Hargeisa, Somaliland</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Adeegyada & URL-yada</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => onNavigate('rider')} className="hover:text-emerald-400 transition cursor-pointer">wadaage.com/rider (Rider App)</button></li>
              <li><button onClick={() => onNavigate('driver')} className="hover:text-emerald-400 transition cursor-pointer">wadaage.com/driver (Driver Partner)</button></li>
              <li><button onClick={() => onNavigate('admin')} className="hover:text-emerald-400 transition cursor-pointer">wadaage.com/admin (Admin Portal)</button></li>
              <li><button onClick={() => onNavigate('website')} className="hover:text-emerald-400 transition cursor-pointer">wadaage.com/ (Home Website)</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Xiriirka & Taageerada</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>Tel: <b className="text-slate-300">+252 63 6807814</b></li>
              <li>WhatsApp: <b className="text-emerald-400">+252 63 6807814</b></li>
              <li>Email: <b className="text-slate-300">support@wadaage.com</b></li>
              <li>Hargeisa HQ: 26 June District, Somaliland</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Amniga & Lacagaha</h4>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ZAAD & eDahab 1-Tap Pay</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Somaliland Police Verified Drivers</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AES-256 Encrypted Telematics</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <span>&copy; {new Date().getFullYear()} Wadaage.com — Dhammaan xuquuqda way dhowran tahay.</span>
          <span>Designed for Somaliland Smart Mobility (Hargeisa).</span>
        </div>
      </footer>
    </div>
  );
};
