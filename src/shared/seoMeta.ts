export interface RouteSeoEntry {
  path: string;
  canonicalPath?: string;
  excludeFromSitemap?: boolean;
  noindex?: boolean;
  title: string;
  description: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, unknown>;
}

const BASE_ORG = {
  '@type': 'EducationalOrganization',
  name: 'Atlas AI Education',
  parentOrganization: {
    '@type': 'Organization',
    name: 'Atlas AI Institute',
  },
  description:
    'Atlas AI Education (Atlas AI Institute) — AI Literacy & Foundation, Applied AI, Professional Development এবং Specialised Programmes।',
};

export const ROUTE_SEO_ENTRIES: RouteSeoEntry[] = [
  {
    path: '/',
    title: 'Atlas AI Education – Atlas AI Institute',
    description:
      'AI বুঝুন। কাজে লাগান। দায়িত্ব নিয়ে এগোন। Atlas AI Institute-এর education initiative — ১৮টি programme ও প্রতি মাসের Free Masterclass।',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      ...BASE_ORG,
    },
  },
  {
    path: '/about',
    title: 'About – Atlas AI Education',
    description:
      'Atlas AI Education কী ও কেন — Atlas AI Institute-এর education initiative-এর লক্ষ্য, শেখার পদ্ধতি ও নীতিগত অঙ্গীকার।',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Atlas AI Education',
      mainEntity: BASE_ORG,
    },
  },
  {
    path: '/programmes',
    title: 'Explore Our Programmes – Atlas AI Education',
    description:
      'Build AI knowledge, practical skills and professional capabilities through 18 structured learning programmes across AI Literacy & Foundation, Applied AI, Professional Development, and Specialised Programmes.',
    ogType: 'website',
  },
  {
    path: '/free-masterclass',
    title: 'Free Masterclass Registration – Atlas AI Education',
    description:
      'AI Fundamentals & Digital Literacy: প্রতি মাসে ১টা session (২–২.৫ ঘণ্টা, ফি FREE / BDT 0)। পরবর্তী session-এর জন্য Register করুন।',
    ogType: 'website',
  },
  {
    path: '/programmes/ai-literacy',
    canonicalPath: '/programmes',
    excludeFromSitemap: true,
    title: 'AI Literacy & Foundation – Atlas AI Education',
    description:
      'Entry level: AI Fundamentals, Governance, Generative AI & Prompt Engineering, Productivity ও Responsible Use (FREE · ৳999–৳1,499)।',
    ogType: 'website',
  },
  {
    path: '/programmes/applied-ai',
    canonicalPath: '/programmes',
    excludeFromSitemap: true,
    title: 'Applied AI – Atlas AI Education',
    description:
      'Practical level: Content Creation, Business & Entrepreneurship, Automation ও Website Development (৳1,200)।',
    ogType: 'website',
  },
  {
    path: '/programmes/professional-development',
    canonicalPath: '/programmes',
    excludeFromSitemap: true,
    title: 'Professional Development – Atlas AI Education',
    description:
      'Professional track: Workplace Productivity, Business Development, Leadership, Project, Marketing, HR ও Financial Management (৳2,500)।',
    ogType: 'website',
  },
  {
    path: '/programmes/specialised-programmes',
    canonicalPath: '/programmes',
    excludeFromSitemap: true,
    title: 'Specialised Programmes – Atlas AI Education',
    description:
      "Women's Safety in the AI Era (FREE) এবং কোম্পানি, অফিস, বিশ্ববিদ্যালয় ও এনজিও-গুলোর জন্য ৮টি Institutional Training & Advisory Services।",
    ogType: 'website',
  },
  {
    path: '/programmes/womens-safety-in-the-ai-era',
    title: "Women's Safety in the AI Era – Atlas AI Education",
    description:
      'AI যুগে নারী ও মেয়েদের ডিজিটাল নিরাপত্তা: deepfake, synthetic media, privacy ও cyber abuse সুরক্ষায় ৪ সপ্তাহের সম্পূর্ণ বিনামূল্যের সচেতনতামূলক কর্মসূচি (FREE)।',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: "Women's Safety in the AI Era",
      alternateName: 'AI যুগে নারী ও মেয়েদের ডিজিটাল নিরাপত্তা',
      description:
        'A Free Four-Week Digital Safety and AI Awareness Programme focusing on deepfakes, synthetic media, privacy protection, and online safety for women, girls, and educators.',
      provider: BASE_ORG,
      isAccessibleForFree: true,
      timeRequired: 'P4W',
      educationalLevel: 'Beginner / Awareness',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BDT',
        category: 'Free Educational Programme',
      },
    },
  },
  {
    path: '/programmes/SP-WSAI',
    canonicalPath: '/programmes/womens-safety-in-the-ai-era',
    excludeFromSitemap: true,
    title: "Women's Safety in the AI Era (SP-WSAI) – Atlas AI Education",
    description:
      'AI যুগে নারী ও মেয়েদের ডিজিটাল নিরাপত্তা: ৪ সপ্তাহের সম্পূর্ণ বিনামূল্যের সচেতনতামূলক কর্মসূচি (FREE)।',
    ogType: 'article',
  },

  // Primary Code-Based Course Detail Routes (/programmes/:code) — All 18 Programmes
  // Category 1: AI Literacy & Foundation
  {
    path: '/programmes/FREE',
    title: 'AI Fundamentals & Digital Literacy (FREE) – Atlas AI Education',
    description: 'AI কী আর কীভাবে নিরাপদে ব্যবহার করবেন, শুরু হোক এই open session দিয়ে (FREE)।',
    ogType: 'article',
  },
  {
    path: '/programmes/AL-100',
    title: 'AI Governance Fundamentals (AL-100) – Atlas AI Education',
    description: 'AI নীতিমালা, জবাবদিহিতা, ঝুঁকি মূল্যায়ন ও প্রাতিষ্ঠানিক দায়িত্বশীলতার প্রাথমিক কাঠামো (FREE)।',
    ogType: 'article',
  },
  {
    path: '/programmes/AL-101',
    title: 'Generative AI & Prompt Engineering (AL-101) – Atlas AI Education',
    description: 'Generative AI কীভাবে কাজ করে এবং কার্যকর Prompt কাঠামো লিখে নির্ভুল আউটপুট পাওয়ার কৌশল (৳999)।',
    ogType: 'article',
  },
  {
    path: '/programmes/AL-102',
    title: 'AI for Everyday & Professional Productivity (AL-102) – Atlas AI Education',
    description: 'পড়াশোনা, লেখালেখি, ইমেইল, নোট ও দৈনন্দিন কাজের গতি বাড়াতে AI-র গোছানো ব্যবহার (৳999)।',
    ogType: 'article',
  },
  {
    path: '/programmes/AL-103',
    title: 'AI Safety, Ethics & Responsible Use (AL-103) – Atlas AI Education',
    description: 'Privacy, algorithmic bias, misinformation ও deepfake বুঝে নিরাপদ ও নৈতিকভাবে AI ব্যবহার (৳999)।',
    ogType: 'article',
  },
  {
    path: '/programmes/AL-104',
    title: 'AI Tools Literacy & Prompt Engineering (AL-104) – Atlas AI Education',
    description: 'প্রয়োজনীয় আধুনিক AI tool-গুলোর সমন্বিত ব্যবহার ও অ্যাডভান্সড Prompt Engineering দক্ষতা (৳1,499)।',
    ogType: 'article',
  },

  // Category 2: Applied AI
  {
    path: '/programmes/AP-201',
    title: 'AI-Powered Content Creation (AP-201) – Atlas AI Education',
    description: 'AI-র সহায়তায় ব্লগ, সোশ্যাল মিডিয়া, স্ক্রিপ্ট, স্লাইড ও ভিজ্যুয়াল ডিজাইন কন্টেন্ট তৈরি (৳1,200)।',
    ogType: 'article',
  },
  {
    path: '/programmes/AP-202',
    title: 'AI for Business & Entrepreneurship (AP-202) – Atlas AI Education',
    description: 'উদ্যোক্তা ও ক্ষুদ্র ব্যবসার অপারেশন, কাস্টমার সার্ভিস, মার্কেট রিসার্চ ও খরচ কমাতে AI (৳1,200)।',
    ogType: 'article',
  },
  {
    path: '/programmes/AP-203',
    title: 'AI Automation & Workflow Design (AP-203) – Atlas AI Education',
    description: 'পুনরাবৃত্তিমূলক দাপ্তরিক কাজগুলোকে No-code tool, webhook ও AI workflow-তে রূপান্তর করা (৳1,200)।',
    ogType: 'article',
  },
  {
    path: '/programmes/AP-204',
    title: 'AI-Powered Website Development (AP-204) – Atlas AI Education',
    description: 'AI-assisted coding ও আধুনিক ওয়েব টেকনোলজি ব্যবহার করে নিজস্ব responsive website তৈরি ও deploy করা (৳1,200)।',
    ogType: 'article',
  },

  // Category 3: Professional Development
  {
    path: '/programmes/PD-301',
    title: 'AI for Professionals & Workplace Productivity (PD-301) – Atlas AI Education',
    description: 'কর্পোরেট ও প্রাতিষ্ঠানিক কর্মক্ষেত্রে রিপোর্টিং, সমন্বয়, বিশ্লেষণ ও দৈনন্দিন কর্মদক্ষতা বৃদ্ধি (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/PD-302',
    title: 'AI for Business Development (PD-302) – Atlas AI Education',
    description: 'মার্কেট ইন্টেলিজেন্স, ক্লায়েন্ট প্রোপোজাল, পার্টনারশিপ ও বিজনেস গ্রোথ পাইপলাইনে AI ব্যবহার (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/PD-303',
    title: 'AI Leadership & Strategic Management (PD-303) – Atlas AI Education',
    description: 'প্রতিষ্ঠানের কৌশলগত পরিকল্পনা, AI adoption রোডম্যাপ, টিম রূপান্তর ও ঝুঁকি ব্যবস্থাপনা (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/PD-304',
    title: 'AI for Project Management (PD-304) – Atlas AI Education',
    description: 'প্রজেক্ট প্ল্যানিং, রিস্ক ট্র্যাকিং, WBS, রিসোর্স সমন্বয় ও স্টেকহোল্ডার রিপোর্টিংয়ে AI (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/PD-305',
    title: 'AI for Marketing & Growth Strategy (PD-305) – Atlas AI Education',
    description: 'অডিয়েন্স গবেষণা, ক্যাম্পেইন পরিকল্পনা, মেসেজিং ও গ্রোথ অ্যানালিটিক্সে AI-র কৌশলগত ব্যবহার (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/PD-306',
    title: 'AI for Human Resource Management (PD-306) – Atlas AI Education',
    description: 'রিক্রুটমেন্ট, অনবোর্ডিং, লার্নিং ও টিম এনগেজমেন্টে পক্ষপাতমুক্ত ও নৈতিক AI প্রয়োগ (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/PD-307',
    title: 'AI for Financial Management (PD-307) – Atlas AI Education',
    description: 'বাজেটিং, ক্যাশ-ফ্লো বিশ্লেষণ, ফিন্যান্সিয়াল রিপোর্টিং ও ঝুঁকি মূল্যায়নে নির্ভুল AI সহায়তা (৳2,500)।',
    ogType: 'article',
  },

  // Supporting Slug Aliases (excluded from sitemap, canonicalized to code route)
  {
    path: '/programmes/ai-fundamentals-digital-literacy-masterclass',
    canonicalPath: '/programmes/FREE',
    excludeFromSitemap: true,
    title: 'AI Fundamentals & Digital Literacy (FREE) – Atlas AI Education',
    description: 'AI কী আর কীভাবে নিরাপদে ব্যবহার করবেন, শুরু হোক এই open session দিয়ে (FREE)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-governance-fundamentals',
    canonicalPath: '/programmes/AL-100',
    excludeFromSitemap: true,
    title: 'AI Governance Fundamentals (AL-100) – Atlas AI Education',
    description: 'AI নীতিমালা, জবাবদিহিতা, ঝুঁকি মূল্যায়ন ও প্রাতিষ্ঠানিক দায়িত্বশীলতার প্রাথমিক কাঠামো (FREE)।',
    ogType: 'article',
  },
  {
    path: '/programmes/generative-ai-prompt-engineering',
    canonicalPath: '/programmes/AL-101',
    excludeFromSitemap: true,
    title: 'Generative AI & Prompt Engineering (AL-101) – Atlas AI Education',
    description: 'Generative AI কীভাবে কাজ করে এবং কার্যকর Prompt কাঠামো লিখে নির্ভুল আউটপুট পাওয়ার কৌশল (৳999)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-everyday-professional-productivity',
    canonicalPath: '/programmes/AL-102',
    excludeFromSitemap: true,
    title: 'AI for Everyday & Professional Productivity (AL-102) – Atlas AI Education',
    description: 'পড়াশোনা, লেখালেখি, ইমেইল, নোট ও দৈনন্দিন কাজের গতি বাড়াতে AI-র গোছানো ব্যবহার (৳999)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-safety-ethics-responsible-use',
    canonicalPath: '/programmes/AL-103',
    excludeFromSitemap: true,
    title: 'AI Safety, Ethics & Responsible Use (AL-103) – Atlas AI Education',
    description: 'Privacy, bias আর misinformation বুঝে দায়িত্বশীলভাবে AI ব্যবহার (৳999)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-tools-literacy-prompt-engineering',
    canonicalPath: '/programmes/AL-104',
    excludeFromSitemap: true,
    title: 'AI Tools Literacy & Prompt Engineering (AL-104) – Atlas AI Education',
    description: 'প্রয়োজনীয় আধুনিক AI tool-গুলোর সমন্বিত ব্যবহার ও অ্যাডভান্সড Prompt Engineering দক্ষতা (৳1,499)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-powered-content-creation',
    canonicalPath: '/programmes/AP-201',
    excludeFromSitemap: true,
    title: 'AI-Powered Content Creation (AP-201) – Atlas AI Education',
    description: 'AI-র সহায়তায় ব্লগ, সোশ্যাল মিডিয়া, স্ক্রিপ্ট, স্লাইড ও ভিজ্যুয়াল ডিজাইন কন্টেন্ট তৈরি (৳1,200)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-for-business-entrepreneurship',
    canonicalPath: '/programmes/AP-202',
    excludeFromSitemap: true,
    title: 'AI for Business & Entrepreneurship (AP-202) – Atlas AI Education',
    description: 'উদ্যোক্তা ও ক্ষুদ্র ব্যবসার অপারেশন ও মার্কেট রিসার্চে AI (৳1,200)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-automation-workflow-design',
    canonicalPath: '/programmes/AP-203',
    excludeFromSitemap: true,
    title: 'AI Automation & Workflow Design (AP-203) – Atlas AI Education',
    description: 'পুনরাবৃত্তিমূলক দাপ্তরিক কাজগুলোকে No-code tool ও AI workflow-তে রূপান্তর করা (৳1,200)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-powered-website-development',
    canonicalPath: '/programmes/AP-204',
    excludeFromSitemap: true,
    title: 'AI-Powered Website Development (AP-204) – Atlas AI Education',
    description: 'AI দিয়ে নিজের responsive website বানান আর live deploy করুন (৳1,200)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-for-professionals-workplace-productivity',
    canonicalPath: '/programmes/PD-301',
    excludeFromSitemap: true,
    title: 'AI for Professionals & Workplace Productivity (PD-301) – Atlas AI Education',
    description: 'কর্পোরেট ও প্রাতিষ্ঠানিক কর্মক্ষেত্রে রিপোর্টিং, সমন্বয় ও কর্মদক্ষতা বৃদ্ধি (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-for-business-development',
    canonicalPath: '/programmes/PD-302',
    excludeFromSitemap: true,
    title: 'AI for Business Development (PD-302) – Atlas AI Education',
    description: 'মার্কেট ইন্টেলিজেন্স, ক্লায়েন্ট প্রোপোজাল ও বিজনেস গ্রোথ পাইপলাইনে AI ব্যবহার (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-leadership-strategic-management',
    canonicalPath: '/programmes/PD-303',
    excludeFromSitemap: true,
    title: 'AI Leadership & Strategic Management (PD-303) – Atlas AI Education',
    description: 'প্রতিষ্ঠানের কৌশলগত পরিকল্পনা, AI adoption রোডম্যাপ ও ঝুঁকি ব্যবস্থাপনা (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-for-project-management',
    canonicalPath: '/programmes/PD-304',
    excludeFromSitemap: true,
    title: 'AI for Project Management (PD-304) – Atlas AI Education',
    description: 'প্রজেক্ট প্ল্যানিং, রিস্ক ট্র্যাকিং, WBS ও স্টেকহোল্ডার রিপোর্টিংয়ে AI (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-for-marketing-growth-strategy',
    canonicalPath: '/programmes/PD-305',
    excludeFromSitemap: true,
    title: 'AI for Marketing & Growth Strategy (PD-305) – Atlas AI Education',
    description: 'অডিয়েন্স গবেষণা, ক্যাম্পেইন পরিকল্পনা ও গ্রোথ অ্যানালিটিক্সে AI-র কৌশলগত ব্যবহার (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-for-human-resource-management',
    canonicalPath: '/programmes/PD-306',
    excludeFromSitemap: true,
    title: 'AI for Human Resource Management (PD-306) – Atlas AI Education',
    description: 'রিক্রুটমেন্ট, অনবোর্ডিং, লার্নিং ও টিম এনগেজমেন্টে নৈতিক AI প্রয়োগ (৳2,500)।',
    ogType: 'article',
  },
  {
    path: '/programmes/ai-for-financial-management',
    canonicalPath: '/programmes/PD-307',
    excludeFromSitemap: true,
    title: 'AI for Financial Management (PD-307) – Atlas AI Education',
    description: 'বাজেটিং, ক্যাশ-ফ্লো বিশ্লেষণ, ফিন্যান্সিয়াল রিপোর্টিং ও ঝুঁকি মূল্যায়নে AI সহায়তা (৳2,500)।',
    ogType: 'article',
  },

  // Institutional Training & Advisory Services (Specialised Programmes — Section B)
  {
    path: '/institutional-services/employees-ai-training',
    title: 'Employees AI Training – Institutional Services – Atlas AI Education',
    description:
      'Role-specific workplace AI training workshops helping teams use AI responsibly and productively.',
    ogType: 'article',
  },
  {
    path: '/institutional-services/ai-leadership-executive-training',
    title: 'AI Leadership & Executive Training – Institutional Services – Atlas AI Education',
    description:
      'Executive briefings and strategic workshops on AI adoption decisions, governance, and organisational change.',
    ogType: 'article',
  },
  {
    path: '/institutional-services/university-academic-ai-training',
    title: 'University & Academic AI Training – Institutional Services – Atlas AI Education',
    description:
      'AI literacy, academic integrity, research ethics, and assessment workshops for universities and colleges.',
    ogType: 'article',
  },
  {
    path: '/institutional-services/ai-readiness-assessment',
    title: 'AI Readiness Assessment – Institutional Services – Atlas AI Education',
    description:
      'Structured AI readiness diagnostics with dedicated pathways for Companies, Offices, and Universities.',
    ogType: 'article',
  },
  {
    path: '/institutional-services/ai-implementation-roadmap',
    title: 'AI Implementation Roadmap – Institutional Services – Atlas AI Education',
    description:
      'Phased AI implementation roadmaps tailored for Companies & Businesses, Government Offices, Universities, and NGOs.',
    ogType: 'article',
  },
  {
    path: '/institutional-services/ai-workflow-automation-training',
    title: 'AI Workflow & Automation Training – Institutional Services – Atlas AI Education',
    description:
      'Practical workflow auditing and no-code/human-reviewed automation training for operational teams.',
    ogType: 'article',
  },
  {
    path: '/institutional-services/train-the-trainer-programme',
    title: 'Train-the-Trainer Programme – Institutional Services – Atlas AI Education',
    description:
      'Preparing internal L&D facilitators, corporate champions, and university faculty to deliver AI training.',
    ogType: 'article',
  },
  {
    path: '/institutional-services/ai-governance-policy-training',
    title: 'AI Governance & Policy Training – Institutional Services – Atlas AI Education',
    description:
      'Acceptable Use Policy, data privacy, algorithmic risk, and institutional AI governance workshops.',
    ogType: 'article',
  },

  // Supporting Institutional & Utility Pages
  {
    path: '/resources',
    title: 'Resources – Atlas AI Education',
    description:
      'AI শিক্ষা ও দায়িত্বশীল ব্যবহারের সহায়ক Guide, PDF ও নির্ভরযোগ্য Reference।',
    ogType: 'website',
  },
  {
    path: '/verify-certificate',
    title: 'Verify Certificate – Atlas AI Education',
    description:
      'Verify the authenticity of non-accredited completion and participation certificates issued by Atlas AI Education.',
    ogType: 'website',
  },
  {
    path: '/login',
    excludeFromSitemap: true,
    noindex: true,
    title: 'Login – Atlas AI Education',
    description: 'Sign in to your Atlas AI Education Learner Dashboard.',
    ogType: 'website',
  },
  {
    path: '/signup',
    excludeFromSitemap: true,
    noindex: true,
    title: 'Create Account – Atlas AI Education',
    description: 'Create your Atlas AI Education learner account to access courses, assignments, and certificates.',
    ogType: 'website',
  },
  {
    path: '/forgot-password',
    excludeFromSitemap: true,
    noindex: true,
    title: 'Forgot Password – Atlas AI Education',
    description: 'Request a password reset link for your Atlas AI Education account.',
    ogType: 'website',
  },
  {
    path: '/reset-password',
    excludeFromSitemap: true,
    noindex: true,
    title: 'Reset Password – Atlas AI Education',
    description: 'Reset your Atlas AI Education account password.',
    ogType: 'website',
  },
  {
    path: '/verify-email',
    excludeFromSitemap: true,
    noindex: true,
    title: 'Verify Email – Atlas AI Education',
    description: 'Verify your Atlas AI Education learner email address.',
    ogType: 'website',
  },
  {
    path: '/profile',
    excludeFromSitemap: true,
    noindex: true,
    title: 'My Profile – Atlas AI Education',
    description: 'Manage your Atlas AI Education learner profile and saved items.',
    ogType: 'website',
  },
  {
    path: '/dashboard',
    excludeFromSitemap: true,
    noindex: true,
    title: 'Learner Dashboard – Atlas AI Education',
    description: 'Atlas AI Education Learner Dashboard & Learning Management System.',
    ogType: 'website',
  },
  {
    path: '/admin',
    excludeFromSitemap: true,
    noindex: true,
    title: 'Admin & Instructor Console – Atlas AI Education',
    description: 'Operational management console for Atlas AI Education.',
    ogType: 'website',
  },
  {
    path: '/menu',
    excludeFromSitemap: true,
    noindex: true,
    title: 'Menu – Atlas AI Education',
    description: 'Atlas AI Education মোবাইল মেন্যু ও সব পেজের তালিকা।',
    ogType: 'website',
  },
  {
    path: '/scholarships',
    title: 'Scholarships & Financial Assistance – Atlas AI Education',
    description:
      'যোগ্যতা ও আর্থিক সীমাবদ্ধতা যেন AI শেখার পথে বাধা না হয়। Atlas AI Education নির্বাচিত কোর্সে সর্বোচ্চ ৫০% Fee Waiver-সহ Course-Based Scholarship প্রদান করে (সর্বোচ্চ ৫ জন প্রতি কোর্সে)।',
    ogType: 'website',
  },
  {
    path: '/faq',
    title: 'FAQ – Atlas AI Education',
    description:
      'Free Masterclass, কোর্স ফি, bKash/Nagad Send Money, non-accredited certificate ও Scholarship নিয়ে সাধারণ প্রশ্নোত্তর।',
    ogType: 'website',
  },
  {
    path: '/contact',
    title: 'Contact – Atlas AI Education',
    description: 'Atlas AI Education সম্পর্কে যেকোনো জিজ্ঞাসা পাঠাতে যোগাযোগ করুন।',
    ogType: 'website',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy – Atlas AI Education',
    description: 'Atlas AI Education-এর ব্যক্তিগত তথ্য সুরক্ষা ও গোপনীয়তা নীতিমালা (খসড়া)।',
    ogType: 'article',
  },
  {
    path: '/privacy-policy',
    canonicalPath: '/privacy',
    excludeFromSitemap: true,
    title: 'Privacy Policy – Atlas AI Education',
    description: 'Atlas AI Education-এর ব্যক্তিগত তথ্য সুরক্ষা ও গোপনীয়তা নীতিমালা (খসড়া)।',
    ogType: 'article',
  },
  {
    path: '/terms',
    title: 'Terms & Conditions – Atlas AI Education',
    description: 'Non-accredited programme, শর্তাবলি ও ফলাফলের স্বচ্ছতা নীতিমালা (খসড়া)।',
    ogType: 'article',
  },
  {
    path: '/sitemap',
    title: 'Sitemap – Atlas AI Education',
    description: 'Atlas AI Education ওয়েবসাইটের সকল page, category ও programme তালিকা।',
    ogType: 'website',
  },
];

export function resolveRouteSeo(pathname: string): { entry: RouteSeoEntry; isKnown: boolean } {
  const clean = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const found =
    ROUTE_SEO_ENTRIES.find((item) => item.path === clean) ||
    ROUTE_SEO_ENTRIES.find((item) => item.path.toLowerCase() === clean.toLowerCase());
  if (found) {
    return { entry: found, isKnown: true };
  }

  if (clean.startsWith('/dashboard')) {
    return {
      entry: {
        path: clean,
        excludeFromSitemap: true,
        noindex: true,
        title: 'Learner Dashboard – Atlas AI Education',
        description: 'Atlas AI Education Learner Dashboard & Learning Management System.',
        ogType: 'website',
      },
      isKnown: true,
    };
  }

  if (clean.startsWith('/admin')) {
    return {
      entry: {
        path: clean,
        excludeFromSitemap: true,
        noindex: true,
        title: 'Admin & Instructor Console – Atlas AI Education',
        description: 'Operational management console for Atlas AI Education.',
        ogType: 'website',
      },
      isKnown: true,
    };
  }

  if (clean.startsWith('/verify-certificate/')) {
    return {
      entry: {
        path: clean,
        canonicalPath: '/verify-certificate',
        excludeFromSitemap: true,
        title: 'Verify Certificate – Atlas AI Education',
        description:
          'Verify the authenticity of non-accredited completion and participation certificates issued by Atlas AI Education.',
        ogType: 'website',
      },
      isKnown: true,
    };
  }

  return {
    entry: {
      path: clean,
      title: 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি – Atlas AI Education',
      description: 'Atlas AI Education ওয়েবসাইটে এই পৃষ্ঠাটি খুঁজে পাওয়া যায়নি।',
      ogType: 'website',
    },
    isKnown: false,
  };
}
