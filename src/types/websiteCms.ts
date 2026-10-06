export interface WebsiteHeroConfig {
  headlineSo: string;
  headlineEn: string;
  subtitleSo: string;
  subtitleEn: string;
  badgeTextSo: string;
  badgeTextEn: string;
  ctaButtonTextSo: string;
  ctaButtonTextEn: string;
  secondaryButtonTextSo: string;
  secondaryButtonTextEn: string;
  heroImageUrl: string;
  showLiveMockup: boolean;
}

export interface WebsiteAnnouncementConfig {
  enabled: boolean;
  messageSo: string;
  messageEn: string;
  linkTextSo: string;
  linkTextEn: string;
  linkUrl: string;
  bgGradient: string; // e.g. 'from-emerald-600 to-teal-700'
}

export interface WebsiteFeatureItem {
  id: string;
  titleSo: string;
  titleEn: string;
  descriptionSo: string;
  descriptionEn: string;
  icon: string; // e.g. 'Car', 'Shield', 'Zap', 'Users', 'Wallet', 'Clock'
  highlightTag?: string;
  enabled: boolean;
}

export interface WebsiteServiceCard {
  id: string;
  titleSo: string;
  titleEn: string;
  priceTagSo: string;
  priceTagEn: string;
  descriptionSo: string;
  descriptionEn: string;
  features: string[];
  badgeSo?: string;
  badgeEn?: string;
  icon: string;
  enabled: boolean;
}

export interface WebsiteTestimonial {
  id: string;
  authorName: string;
  roleOrLocation: string;
  avatarUrl: string;
  rating: number;
  commentSo: string;
  commentEn: string;
  verified: boolean;
}

export interface WebsiteContactInfo {
  phonePrimary: string;
  phoneSecondary: string;
  whatsappNumber: string;
  supportEmail: string;
  officeAddress: string;
  city: string;
  officeHours: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
}

export interface WebsiteFaqItem {
  id: string;
  questionSo: string;
  questionEn: string;
  answerSo: string;
  answerEn: string;
  category: 'general' | 'riders' | 'drivers' | 'payments';
  enabled: boolean;
}

export interface WebsiteStatsConfig {
  enabled: boolean;
  activeDriversCount: string;
  activeDriversLabelSo: string;
  activeDriversLabelEn: string;
  tripsCompletedCount: string;
  tripsCompletedLabelSo: string;
  tripsCompletedLabelEn: string;
  customerRating: string;
  customerRatingLabelSo: string;
  customerRatingLabelEn: string;
  citiesCount: string;
  citiesLabelSo: string;
  citiesLabelEn: string;
}

export interface WebsiteCalculatorConfig {
  enabled: boolean;
  titleSo: string;
  titleEn: string;
  subtitleSo: string;
  subtitleEn: string;
  defaultPickup: string;
  defaultDropoff: string;
  defaultDistanceKm: number;
}

export interface WebsiteNavbarConfig {
  brandName: string;
  taglineSo: string;
  taglineEn: string;
  riderButtonTextSo: string;
  riderButtonTextEn: string;
  driverButtonTextSo: string;
  driverButtonTextEn: string;
  adminButtonTextSo: string;
  adminButtonTextEn: string;
  showLanguageToggle: boolean;
  showEmergencyHotline: boolean;
}

export interface WebsiteFooterConfig {
  aboutTextSo: string;
  aboutTextEn: string;
  copyrightTextSo: string;
  copyrightTextEn: string;
  showSocialIcons: boolean;
  quickLinksTitleSo: string;
  quickLinksTitleEn: string;
  servicesTitleSo: string;
  servicesTitleEn: string;
}

export interface WebsiteSeoConfig {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImageUrl: string;
}

export interface WebsiteCmsConfig {
  hero: WebsiteHeroConfig;
  announcement: WebsiteAnnouncementConfig;
  navbar?: WebsiteNavbarConfig;
  features: WebsiteFeatureItem[];
  services: WebsiteServiceCard[];
  stats?: WebsiteStatsConfig;
  calculator?: WebsiteCalculatorConfig;
  testimonials: WebsiteTestimonial[];
  faqs?: WebsiteFaqItem[];
  contact: WebsiteContactInfo;
  footer?: WebsiteFooterConfig;
  seo: WebsiteSeoConfig;
  lastUpdated?: string;
  updatedBy?: string;
}

export const DEFAULT_WEBSITE_CMS_CONFIG: WebsiteCmsConfig = {
  hero: {
    headlineSo: 'Safarkaaga Hargeysa, Si Fudud & Qiimo Jaban',
    headlineEn: 'Your Commute in Hargeisa, Fast & Affordable',
    subtitleSo: 'Ku safar Wadaage Share si aad u wadaagto kharashka (30% dhimis), ama kireyso Taxi gaar ah. Degdeg, ammaan, iyo lacag-bixinta tooska ah ee ZAAD iyo eDahab.',
    subtitleEn: 'Travel with Wadaage Share to split costs with fellow commuters (Save 30%), or book a private Normal Taxi with direct ZAAD & eDahab mobile payments.',
    badgeTextSo: 'Adeegga Gaadiidka ee #1 ee Somaliland',
    badgeTextEn: '#1 Smart Mobility Platform in Somaliland',
    ctaButtonTextSo: 'Dalbo Wadaage Hadda',
    ctaButtonTextEn: 'Book a Ride Now',
    secondaryButtonTextSo: 'Noqo Darawal Wadaage',
    secondaryButtonTextEn: 'Drive with Wadaage',
    heroImageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80',
    showLiveMockup: true,
  },
  announcement: {
    enabled: true,
    messageSo: '🎉 Soo dhawoow Wadaage.com — Adeegga rasmiga ah ee gaadiidka Somaliland!',
    messageEn: '🎉 Welcome to Wadaage.com — Official smart transport platform in Somaliland!',
    linkTextSo: 'Dalbo Hadda',
    linkTextEn: 'Book Now',
    linkUrl: '#book',
    bgGradient: 'from-emerald-700 via-teal-800 to-slate-900',
  },
  navbar: {
    brandName: 'Wadaage Mobility',
    taglineSo: 'Gaadiidka Casriga ah ee Somaliland',
    taglineEn: 'Smart Ride-Hailing Platform in Somaliland',
    riderButtonTextSo: 'Rakaabka (Rider App)',
    riderButtonTextEn: 'Rider App',
    driverButtonTextSo: 'Darawalka (Driver App)',
    driverButtonTextEn: 'Driver App',
    adminButtonTextSo: 'Maamulka (Admin)',
    adminButtonTextEn: 'Admin Portal',
    showLanguageToggle: true,
    showEmergencyHotline: true,
  },
  stats: {
    enabled: true,
    activeDriversCount: '150+',
    activeDriversLabelSo: 'Darawallo Firfircoon',
    activeDriversLabelEn: 'Active Verified Drivers',
    tripsCompletedCount: '45,000+',
    tripsCompletedLabelSo: 'Safarro Guuleystay',
    tripsCompletedLabelEn: 'Completed Rides',
    customerRating: '4.9 ★',
    customerRatingLabelSo: 'Qanacsanaanta Macaamiisha',
    customerRatingLabelEn: 'Customer Satisfaction',
    citiesCount: '4',
    citiesLabelSo: 'Magaalooyinka Somaliland',
    citiesLabelEn: 'Somaliland Cities Connected',
  },
  calculator: {
    enabled: true,
    titleSo: 'Qiyaas Qiimaha Safarkaaga Hargeysa',
    titleEn: 'Instant Fare Estimator in Hargeisa',
    subtitleSo: 'Dooro meesha aad ka baxayso iyo meesha aad u socoto si aad u ogaato qiimaha rasmiga ah ee Wadaage Share ama Taxi Gaar ah.',
    subtitleEn: 'Select your pickup and drop-off to compare live fares between Wadaage Share carpooling and Private Taxi.',
    defaultPickup: 'Egal International Airport',
    defaultDropoff: 'Dahabshiil Bank HQ, 26 June',
    defaultDistanceKm: 6.5,
  },
  features: [
    {
      id: 'f_share',
      titleSo: 'Wadaage Share (30% Dhimis)',
      titleEn: 'Wadaage Share (30% Off)',
      descriptionSo: 'Ku wadaag safarka rakaab kale oo u socda jihadaada, oo badbaadi ilaa 30-50% kharashka.',
      descriptionEn: 'Share your ride with co-commuters heading your way and save up to 30-50% on every trip.',
      icon: 'Users',
      highlightTag: '30% Off',
      enabled: true,
    },
    {
      id: 'f_taxi',
      titleSo: 'Taxi Gaar Ah (Private Taxi)',
      titleEn: 'Private Normal Taxi',
      descriptionSo: 'Gaadhi kuu gaar ah oo toos kuu geynaya meesha aad rabto adiga oo aan cidna la wadaagin.',
      descriptionEn: 'Exclusive door-to-door private cab directly to your destination with 0 stops.',
      icon: 'Car',
      highlightTag: 'Toos ah',
      enabled: true,
    },
    {
      id: 'f_payment',
      titleSo: 'ZAAD & eDahab Mobile Money',
      titleEn: 'ZAAD & eDahab Instant Pay',
      descriptionSo: 'Ku bixi lacagta si toos ah oo fudud adiga oo isticmaalaya ZAAD Service ama eDahab.',
      descriptionEn: 'Seamless instant payment integration using Somaliland standard ZAAD & eDahab mobile wallets.',
      icon: 'Wallet',
      highlightTag: 'Zero Cash',
      enabled: true,
    },
    {
      id: 'f_safety',
      titleSo: 'Iftiin Midab Leh & Ammaan 100%',
      titleEn: 'Color Beacon & 100% Verified',
      descriptionSo: 'Ku garo darawalkaaga iftiinka midabka leh habeenkii, oo hubi PIN-ka amniga ee safarka.',
      descriptionEn: 'Spot your driver with synchronized screen color beacons and verified 4-digit boarding PINs.',
      icon: 'Shield',
      highlightTag: 'Verified',
      enabled: true,
    },
    {
      id: 'f_waiting',
      titleSo: 'Sugitaanka Normal Taxi (500 SLSH/daq)',
      titleEn: 'Normal Taxi Waiting (500 SLSH/min)',
      descriptionSo: 'Xisaabinta tooska ah ee wakhtiga sugitaanka oo daah-furan labada dhinacba.',
      descriptionEn: 'Transparent live stop timer at 500 SLSH per minute calculated automatically.',
      icon: 'Clock',
      highlightTag: '500 SLSH/min',
      enabled: true,
    },
    {
      id: 'f_intercity',
      titleSo: 'Safarrada Gobollada (Intercity)',
      titleEn: 'Intercity Regional Travel',
      descriptionSo: 'U safar Borama, Berbera, Burco, iyo Gabiley gaadiid tayo sare leh iyo jadwal la isku halayn karo.',
      descriptionEn: 'Travel between Hargeisa, Berbera, Borama, and Burco with reliable scheduled departures.',
      icon: 'Navigation',
      highlightTag: 'Somaliland',
      enabled: true,
    },
  ],
  services: [
    {
      id: 's_share',
      titleSo: '👥 Wadaage Share',
      titleEn: '👥 Wadaage Share',
      priceTagSo: '$0.40 USD / 4,500 SLSH per KM',
      priceTagEn: '$0.40 USD / 4,500 SLSH per KM',
      descriptionSo: 'Ku wadaag safarka dadka u socda isla jihooyinkaaga.',
      descriptionEn: 'Carpooling with smart en-route matches along your corridor.',
      features: ['30-50% Cheaper', 'Max 1 Co-Passenger', 'Verified Captains', 'GPS Tracking'],
      badgeSo: 'UGU CAANSAN',
      badgeEn: 'MOST POPULAR',
      icon: 'Users',
      enabled: true,
    },
    {
      id: 's_taxi',
      titleSo: '🚖 Normal Taxi Gaar ah',
      titleEn: '🚖 Normal Private Taxi',
      priceTagSo: '$0.80 USD / 9,000 SLSH per KM',
      priceTagEn: '$0.80 USD / 9,000 SLSH per KM',
      descriptionSo: 'Gaadhi gaar kuu ah oo toos ah, iyada oo aan la wadaagin.',
      descriptionEn: 'Private direct trip without sharing with other passengers.',
      features: ['Private Cab', 'Door-to-Door Direct', 'Waiting 500 SLSH/min', 'AC & Music Options'],
      badgeSo: 'GAAR AH',
      badgeEn: 'PRIVATE',
      icon: 'Car',
      enabled: true,
    },
    {
      id: 's_intercity',
      titleSo: '🚐 Safarada Gobollada (Intercity)',
      titleEn: '🚐 Intercity Express',
      priceTagSo: '$5.00 - $12.00 USD / Kursi',
      priceTagEn: '$5.00 - $12.00 USD / Seat',
      descriptionSo: 'Hargeisa ➔ Berbera, Borama, Burco.',
      descriptionEn: 'Direct routes connecting Somaliland major cities.',
      features: ['Air-Conditioned Express', 'Luggage Space', 'Scheduled Times', 'Direct City Center'],
      badgeSo: 'GOBOLLADA',
      badgeEn: 'INTERCITY',
      icon: 'Navigation',
      enabled: true,
    },
  ],
  testimonials: [
    {
      id: 't_1',
      authorName: 'Guled Mohamed',
      roleOrLocation: 'Jigjiga Yar, Hargeisa',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      commentSo: 'Wadaage Share waxa uu iga badbaadiyay kharash aad u badan maalin kasta markaan jaamacadda u socdo. Aad baan ugu qancay!',
      commentEn: 'Wadaage Share saves me so much money every day going to university. Super reliable and quick dispatch in Hargeisa!',
      verified: true,
    },
    {
      id: 't_2',
      authorName: 'Fadumo Hassan',
      roleOrLocation: 'Airport Road, Hargeisa',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      commentSo: 'Amniga iyo iftiinka Color Beacon-ka aad buu ii anfacay habeenkii markaan madaarka ka soo degay. Darawalka markiiba waan arkay.',
      commentEn: 'The Color Beacon feature helped me instantly spot my driver at night outside the airport terminal. 10/10 safety!',
      verified: true,
    },
    {
      id: 't_3',
      authorName: 'Abdirashid Ali',
      roleOrLocation: 'Driver Partner, Hargeisa',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      commentSo: 'Darawal ahaan, komishanka 1,000 SLSH ee go’an wuxuu ii horseeday inaan dakhli fiican maalin kasta guriga u qaado.',
      commentEn: 'As a driver partner, the fixed 1,000 SLSH flat platform commission lets me keep maximum earnings every single day.',
      verified: true,
    },
  ],
  faqs: [
    {
      id: 'faq_1',
      questionSo: 'Waa maxay Wadaage Share (Gaadhi Wadaag)?',
      questionEn: 'What is Wadaage Share (Carpooling)?',
      answerSo: 'Wadaage Share waa adeeg casri ah oo kuu sahlaya inaad gaadhiga la wadaagto qof kale oo jidkaaga ku socda. Waxaad badbaadinaysaa 30% qiimaha caadiga ah adigoo helaya safar degdeg ah oo aamin ah.',
      answerEn: 'Wadaage Share is a smart carpooling service that lets you share a ride with co-passengers heading along the same corridor in Hargeisa. You save up to 30% compared to private taxis while enjoying fast, verified transport.',
      category: 'riders',
      enabled: true,
    },
    {
      id: 'faq_2',
      questionSo: 'Sidee lacagta loogu bixiyaa ZAAD ama eDahab?',
      questionEn: 'How do I pay with ZAAD or eDahab?',
      answerSo: 'Wadaage wuxuu toos ugu xidhan yahay adeegyada lacagaha mobilka (ZAAD, eDahab, Sahal). Waxaad toos ugu bixin kartaa lacagta app-ka dhexdiisa 1-taabasho ama lacag caddaan ah (Cash) marka safarku dhamaado.',
      answerEn: 'Wadaage supports seamless 1-tap in-app payments via ZAAD, eDahab, and Sahal, as well as direct cash payment to the driver upon drop-off.',
      category: 'payments',
      enabled: true,
    },
    {
      id: 'faq_3',
      questionSo: 'Sideen noqon karaa darawal Wadaage?',
      questionEn: 'How do I register as a Wadaage Driver Partner?',
      answerSo: 'Guji badhanka "Driver App" ama "Noqo Dareewal", geli lambarkaaga WhatsApp, soo geli sawirka shatiga iyo baabuurka. Ansixintu waxay qaadataa wax ka yar 24 saacadood, waxaanad ku shaqaynaysaa komishanka ugu jaban Somaliland (1,000 SLSH oo go’an safarkiiba).',
      answerEn: 'Click "Driver App" or "Register as Driver", enter your WhatsApp phone number, and upload your driver license & vehicle details. Approval takes under 24 hours, and you keep 100% of your fares minus a fixed 1,000 SLSH ($0.10) flat fee.',
      category: 'drivers',
      enabled: true,
    },
    {
      id: 'faq_4',
      questionSo: 'Sidee amniga safarka loo ilaaliyaa?',
      questionEn: 'How does Wadaage ensure passenger safety?',
      answerSo: 'Dhammaan darawallada waxaa lagu xaqiijiyaa Somaliland ID iyo baadhitaan dhab ah. Waxa kale oo aad haysataa badhanka SOS, la wadaagista jidkaaga tooska ah ehelkaaga (WhatsApp Live Share), iyo calaamada midabka (Safety Beacon).',
      answerEn: 'All drivers undergo strict identity and document verification. Trips feature real-time GPS tracking, WhatsApp live trip sharing with family, in-app emergency SOS, and safety color beacon matching.',
      category: 'general',
      enabled: true,
    },
  ],
  contact: {
    phonePrimary: '+252 63 6807814',
    phoneSecondary: '+252 63 4819202',
    whatsappNumber: '+252 63 6807814',
    supportEmail: 'support@wadaage.com',
    officeAddress: 'Independence Avenue, Near Dahabshiil HQ, 26 June District',
    city: 'Hargeisa, Somaliland',
    officeHours: 'Sabti - Khamiis: 7:00 AM - 10:00 PM',
    facebookUrl: 'https://facebook.com/wadaagesomaliland',
    twitterUrl: 'https://twitter.com/wadaage',
    instagramUrl: 'https://instagram.com/wadaage.somaliland',
  },
  footer: {
    aboutTextSo: 'Wadaage Mobility waa nidaamka gaadiidka casriga ah ee Somaliland oo bixiya Wadaage Share carpooling iyo Private Taxi qiimo jaban oo ammaan ah.',
    aboutTextEn: 'Wadaage Mobility is Somaliland’s premier smart ride-hailing and carpooling ecosystem engineered for reliable, affordable city transit.',
    copyrightTextSo: 'Xuquuqda oo dhan way dhowran tahay © 2026 Wadaage Mobility Somaliland. wadaage.com',
    copyrightTextEn: 'All rights reserved © 2026 Wadaage Mobility Somaliland. wadaage.com',
    showSocialIcons: true,
    quickLinksTitleSo: 'Xiriirinta Degdegga ah',
    quickLinksTitleEn: 'Quick Links',
    servicesTitleSo: 'Adeegyadeena',
    servicesTitleEn: 'Our Services',
  },
  seo: {
    metaTitle: 'Wadaage Somaliland — Gaadiidka Casriga ah & Taxi ee Hargeysa | Wadaage.com',
    metaDescription: 'Dalbo Taxi ama Wadaage Share Somaliland. Qiimo jaban, ammaan, iyo lacag-bixinta ZAAD & eDahab. Hargeisa, Borama, Berbera.',
    metaKeywords: 'Wadaage, Taxi Hargeisa, Somaliland Taxi, Wadaage Share, Gaadiid Hargeysa, ZAAD Taxi, eDahab Cab',
    ogImageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&auto=format&fit=crop&q=80',
  },
};
