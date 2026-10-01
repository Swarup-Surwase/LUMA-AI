import { Language } from '../types/luma';

export interface TranslationStrings {
  brandTagline: string;
  taglineSecondary: string;
  nav: {
    home: string;
    dashboard: string;
    visualNarrator: string;
    signLanguage: string;
    handsFree: string;
    voiceForms: string;
    documents: string;
    schemes: string;
    showcase: string;
    accessibility: string;
    profile: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    ctaGetStarted: string;
    ctaExploreShowcase: string;
    modesActive: string;
  };
  features: {
    visualTitle: string;
    visualDesc: string;
    signTitle: string;
    signDesc: string;
    gazeTitle: string;
    gazeDesc: string;
    voiceFormsTitle: string;
    voiceFormsDesc: string;
    docSimplifierTitle: string;
    docSimplifierDesc: string;
    schemeTitle: string;
    schemeDesc: string;
  };
  accessibility: {
    title: string;
    highContrast: string;
    textScale: string;
    motionIntensity: string;
    motionReduced: string;
    motionCalm: string;
    motionNormal: string;
    motionExpressive: string;
    motionShowcase: string;
    speechAudio: string;
    autoSpeakDesc: string;
    dwellTimer: string;
    dwellTimerDesc: string;
    keyboardShortcuts: string;
    close: string;
  };
  onboarding: {
    step1Title: string;
    step1Subtitle: string;
    namePlaceholder: string;
    step2Title: string;
    step2Subtitle: string;
    step3Title: string;
    step3Subtitle: string;
    step4Title: string;
    step5Title: string;
    step5Subtitle: string;
    next: string;
    back: string;
    finish: string;
    skip: string;
  };
  common: {
    allow: string;
    deny: string;
    cancel: string;
    save: string;
    loading: string;
    processing: string;
    error: string;
    emergency: string;
    speak: string;
    stopSpeech: string;
    statusReady: string;
  };
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    brandTagline: 'AI that makes the world easier to experience.',
    taglineSecondary: 'Many ways to interact. One intelligent system designed for every ability.',
    nav: {
      home: 'Home',
      dashboard: 'My LUMA',
      visualNarrator: 'Visual Narrator',
      signLanguage: 'Indian Sign Language',
      handsFree: 'Hands-Free Access',
      voiceForms: 'Voice Forms',
      documents: 'Document Simplifier',
      schemes: 'Scheme Assistant',
      showcase: 'Interactive Showcase',
      accessibility: 'Accessibility Settings',
      profile: 'Preferences'
    },
    hero: {
      badge: 'Multimodal Accessibility Intelligence',
      title: 'AI that makes the world easier to experience.',
      subtitle: 'Effortless interaction tailored to your senses. Control technology through voice, vision, Indian sign language, face-gaze, or simple touch.',
      ctaGetStarted: 'Personalize Your Experience',
      ctaExploreShowcase: 'Launch Interactive Tour',
      modesActive: 'Universal Accessibility Engaged'
    },
    features: {
      visualTitle: 'Visual Narrator & OCR',
      visualDesc: 'Describe surroundings, read medicine labels with expiry warnings, and scan documents aloud in real-time.',
      signTitle: 'Indian Sign Language (ISL)',
      signDesc: 'Recognize 25+ essential ISL gestures, numbers, and emergency signs with instant speech output.',
      gazeTitle: 'Hands-Free Gaze & Face Cursor',
      gazeDesc: 'Control your screen without hands using gentle head motion, dwell clicks, and an on-screen predictive keyboard.',
      voiceFormsTitle: 'Voice-First Guided Forms',
      voiceFormsDesc: 'Fill complex paperwork through a warm guided conversation with visual focus threads and live confirmation.',
      docSimplifierTitle: 'Document Simplifier',
      docSimplifierDesc: 'Transform intimidating legal or government letters into plain, easy-to-understand actionable summaries.',
      schemeTitle: 'Scheme Eligibility Assistant',
      schemeDesc: 'Discover accessible welfare schemes, assistive device grants (ADIP), and UDID benefits with clear transparency.'
    },
    accessibility: {
      title: 'Accessibility Controls',
      highContrast: 'High Contrast Mode',
      textScale: 'Text Size Scaling',
      motionIntensity: 'Motion Intensity',
      motionReduced: '0: Reduced Motion (Instant/Calm)',
      motionCalm: '1: Calm (Minimal Effects)',
      motionNormal: '2: Normal (Balanced)',
      motionExpressive: '3: Expressive (Rich)',
      motionShowcase: '4: Showcase (Full Dynamic)',
      speechAudio: 'Automatic Speech Readout',
      autoSpeakDesc: 'Read all results and guidance aloud automatically',
      dwellTimer: 'Gaze Dwell Click Delay',
      dwellTimerDesc: 'Time in seconds looking at an element before activating',
      keyboardShortcuts: 'Keyboard Shortcuts Reference',
      close: 'Close Settings'
    },
    onboarding: {
      step1Title: 'Welcome to LUMA',
      step1Subtitle: 'Tell LUMA a little about yourself so we can adapt to you.',
      namePlaceholder: 'Your preferred name...',
      step2Title: 'What would you like help with?',
      step2Subtitle: 'Select any areas where you would like assistive support:',
      step3Title: 'What would you like to achieve independently?',
      step3Subtitle: 'Select your personal goals:',
      step4Title: 'Choose your preferred language',
      step5Title: 'Choose your primary way to interact',
      step5Subtitle: 'You can switch between any input method at any time.',
      next: 'Continue',
      back: 'Previous',
      finish: 'Enter LUMA',
      skip: 'Explore with Default Settings'
    },
    common: {
      allow: 'Allow Access',
      deny: 'Not Now',
      cancel: 'Cancel',
      save: 'Save Changes',
      loading: 'LUMA is preparing...',
      processing: 'LUMA is understanding...',
      error: 'Something went wrong. Let us try again.',
      emergency: 'EMERGENCY QUICK-SIGN',
      speak: 'Read Aloud',
      stopSpeech: 'Stop Speaking',
      statusReady: 'LUMA is ready and listening'
    }
  },
  hi: {
    brandTagline: 'ऐसी तकनीक जो दुनिया को अनुभव करना आसान बनाती है।',
    taglineSecondary: 'बातचीत के अनेक माध्यम, एक संवेदनशील प्रणाली। सभी क्षमताओं के लिए सुलभ।',
    nav: {
      home: 'होम',
      dashboard: 'मेरा ल्यूमा',
      visualNarrator: 'दृष्टि सहायक (वॉयस/कैमरा)',
      signLanguage: 'भारतीय सांकेतिक भाषा (ISL)',
      handsFree: 'हैड्स-फ्री गेज नियंत्रण',
      voiceForms: 'ध्वनि आधारित फॉर्म',
      documents: 'दस्तावेज सरलीकरण',
      schemes: 'योजना पात्रता सहायक',
      showcase: 'इंटरएक्टिव शोकेस',
      accessibility: 'सुलभता सेटिंग्स',
      profile: 'प्राथमिकताएं'
    },
    hero: {
      badge: 'सर्वसमावेशी सुलभ एआई मंच',
      title: 'ऐसी तकनीक जो दुनिया को अनुभव करना आसान बनाती है।',
      subtitle: 'आपकी आवश्यकताओं के अनुसार ढलने वाला इंटरफेस। आवाज, कैमरा, भारतीय सांकेतिक भाषा, सिर के इशारे या स्पर्श से नियंत्रण करें।',
      ctaGetStarted: 'अपना अनुभव अनुकूलित करें',
      ctaExploreShowcase: 'इंटरएक्टिव डेमो देखें',
      modesActive: 'सुलभता मोड सक्रिय'
    },
    features: {
      visualTitle: 'दृष्टि सहायक एवं ओसीआर',
      visualDesc: 'आसपास के परिवेश का वर्णन, दवा की बोतल और एक्सपायरी की पहचान, और दस्तावेजों का स्पष्ट वाचन।',
      signTitle: 'भारतीय सांकेतिक भाषा (ISL)',
      signDesc: '२५+ महत्वपूर्ण संकेत, अक्षर और आपातकालीन संकेतों की पहचान एवं ध्वनि अनुवाद।',
      gazeTitle: 'हैड्स-फ्री हेड व आई कर्सर',
      gazeDesc: 'बिना हाथ लगाए सिर की गति और ड्वेल-क्लिक से स्क्रीन नियंत्रित करें।',
      voiceFormsTitle: 'आवाज द्वारा फॉर्म भरना',
      voiceFormsDesc: 'सहज बातचीत के माध्यम से सरकारी और आवश्यक फॉर्म आसानी से भरें।',
      docSimplifierTitle: 'दस्तावेज सरलीकरण',
      docSimplifierDesc: 'कठिन सरकारी पत्रों और नोटिसों को सरल और स्पष्ट भाषा में समझें।',
      schemeTitle: 'सरकारी योजना सहायक',
      schemeDesc: 'दिव्यांगजन योजनाओं, सहायक उपकरण अनुदान और UDID लाभों की पारदर्शी जानकारी।'
    },
    accessibility: {
      title: 'सुलभता नियंत्रण (Accessibility)',
      highContrast: 'उच्च कंट्रास्ट मोड',
      textScale: 'अक्षर का आकार (Font Scaling)',
      motionIntensity: 'एनीमेशन तीव्रता',
      motionReduced: '०: गति रहित (शांत/सरल)',
      motionCalm: '१: शांत (न्यूनतम प्रभाव)',
      motionNormal: '२: सामान्य (संतुलित)',
      motionExpressive: '३: प्रभावी (आकर्षक)',
      motionShowcase: '४: शोकेस (पूर्ण गति)',
      speechAudio: 'स्वचालित ध्वनि वाचन (Audio Readout)',
      autoSpeakDesc: 'सभी परिणामों और निर्देशों को स्वतः बोलकर सुनाएं',
      dwellTimer: 'ड्वेल क्लिक समय',
      dwellTimerDesc: 'कर्सर रोकने पर स्वतः क्लिक होने का समय (सेकंड में)',
      keyboardShortcuts: 'कीबोर्ड शॉर्टकट संदर्भ',
      close: 'सेटिंग्स बंद करें'
    },
    onboarding: {
      step1Title: 'ल्यूमा (LUMA) में आपका स्वागत है',
      step1Subtitle: 'अपने बारे में थोड़ी जानकारी दें ताकि हम इंटरफेस को आपके अनुकूल बना सकें।',
      namePlaceholder: 'आपका शुभ नाम...',
      step2Title: 'आपको किस सहायता की आवश्यकता है?',
      step2Subtitle: 'सहायता के क्षेत्र चुनें:',
      step3Title: 'आप स्वतंत्र रूप से क्या करना चाहते हैं?',
      step3Subtitle: 'अपने लक्ष्य चुनें:',
      step4Title: 'अपनी पसंदीदा भाषा चुनें',
      step5Title: 'अपनी मुख्य बातचीत विधि चुनें',
      step5Subtitle: 'आप किसी भी समय इनपुट विधि बदल सकते हैं।',
      next: 'आगे बढ़ें',
      back: 'पीछे जाएं',
      finish: 'ल्यूमा शुरू करें',
      skip: 'डिफ़ॉल्ट सेटिंग्स के साथ प्रवेश करें'
    },
    common: {
      allow: 'अनुमति दें',
      deny: 'अभी नहीं',
      cancel: 'रद्द करें',
      save: 'परिवर्तन सहेजें',
      loading: 'ल्यूमा तैयारी कर रहा है...',
      processing: 'ल्यूमा समझ रहा है...',
      error: 'कुछ त्रुटि हुई, कृपया पुनः प्रयास करें।',
      emergency: 'आपातकालीन त्वरित संकेत',
      speak: 'बोलकर सुनाएं',
      stopSpeech: 'आवाज रोकें',
      statusReady: 'ल्यूमा तैयार और सक्रिय है'
    }
  },
  mr: {
    brandTagline: 'तंत्रज्ञान जे जग अनुभवणे अधिक सोपे बनवते.',
    taglineSecondary: 'संवादाचे विविध मार्ग, एकच संवेदनशील प्रणाली. प्रत्येकासाठी समान सुलभता.',
    nav: {
      home: 'मुख्यपृष्ठ',
      dashboard: 'माझे ल्यूमा',
      visualNarrator: 'दृष्टी मार्गदर्शक',
      signLanguage: 'भारतीय सांकेतिक भाषा (ISL)',
      handsFree: 'हॅन्ड्स-फ्री गेझ नियंत्रण',
      voiceForms: 'आवाज आधारित अर्ज',
      documents: 'दस्तऐवज सोपे करा',
      schemes: 'शासकीय योजना सहाय्यक',
      showcase: 'इंटरअॅक्टिव्ह टूर',
      accessibility: 'सुलभता सेटिंग्ज',
      profile: 'माझी पसंती'
    },
    hero: {
      badge: 'सर्वसमावेशक सुलभ एआय प्रणाली',
      title: 'तंत्रज्ञान जे जग अनुभवणे अधिक सोपे बनवते.',
      subtitle: 'तुमच्या गरजेनुसार बदलणारा इंटरफेस. आवाज, कॅमेरा, भारतीय सांकेतिक भाषा, डोळे/चेहऱ्याची हालचाल किंवा सोप्या स्पर्शाने वापरा.',
      ctaGetStarted: 'माझा अनुभव सानुकूल करा',
      ctaExploreShowcase: 'डेमो प्रत्यक्ष पहा',
      modesActive: 'सुलभता मोड सक्रिय'
    },
    features: {
      visualTitle: 'दृष्टी मार्गदर्शक आणि ओसीआर',
      visualDesc: 'सभोवतालचे वर्णन, औषधांची नावे व मुदतवाढ सूचना, आणि दस्तऐवजांचे वाचन.',
      signTitle: 'भारतीय सांकेतिक भाषा (ISL)',
      signDesc: '२५+ दैनंदिन संकेत, मुळाक्षरे आणि तातडीच्या चिन्हांची त्वरित ओळख आणि आवाज अनुवाद.',
      gazeTitle: 'हॅन्ड्स-फ्री गेझ व फेस कर्सर',
      gazeDesc: 'हात न लावता डोके किंवा डोळ्यांच्या हालचालीने संगणक स्क्रीन सहज चालवा.',
      voiceFormsTitle: 'संभाषणातून फॉर्म भरणे',
      voiceFormsDesc: 'सोप्या संवादातून शासकीय व इतर फॉर्म अचूकपणे भरून पूर्ण करा.',
      docSimplifierTitle: 'दस्तऐवज सोपे करा',
      docSimplifierDesc: 'अवघड शासकीय कागदपत्रे व नोटिसा साध्या आणि स्पष्ट भाषेत समजून घ्या.',
      schemeTitle: 'शासकीय योजना सहाय्यक',
      schemeDesc: 'दिव्यांग बांधवांसाठीच्या योजना, सहाय्यक उपकरणे (ADIP) व UDID कार्डाचे लाभ.'
    },
    accessibility: {
      title: 'सुलभता सेटिंग्ज (Accessibility)',
      highContrast: 'हाय कॉन्ट्रास्ट मोड',
      textScale: 'अक्षरांचा आकार (Text Size)',
      motionIntensity: 'ॲनिमेशन तीव्रता',
      motionReduced: '०: गती कमी (शांत/थेट)',
      motionCalm: '१: शांत (किमान प्रभाव)',
      motionNormal: '२: सामान्य (संतुलित)',
      motionExpressive: '३: प्रभावी (आकर्षक)',
      motionShowcase: '४: शोकेस (संपूर्ण गती)',
      speechAudio: 'स्वयंचलित आवाज वाचन (Auto Speak)',
      autoSpeakDesc: 'सर्व परिणाम व सूचना आपोआप बोलून दाखवा',
      dwellTimer: 'ड्वेल क्लिक वेळ',
      dwellTimerDesc: 'कर्सर स्थिर ठेवल्यावर क्लिक होण्यासाठी लागणारा वेळ (सेकंदात)',
      keyboardShortcuts: 'कीबोर्ड शॉर्टकट सूची',
      close: 'सेटिंग्ज बंद करा'
    },
    onboarding: {
      step1Title: 'ल्यूमा (LUMA) मध्ये आपले स्वागत आहे',
      step1Subtitle: 'आपल्याबद्दल थोडी माहिती सांगा जेणेकरून ल्यूमा आपल्या गरजेनुसार तयार होईल.',
      namePlaceholder: 'आपले नाव...',
      step2Title: 'आपल्याला कोणत्या मदतीची आवश्यकता आहे?',
      step2Subtitle: 'मदतीचे क्षेत्र निवडा:',
      step3Title: 'आपल्याला स्वावलंबीपणे काय करायचे आहे?',
      step3Subtitle: 'आपली ध्येये निवडा:',
      step4Title: 'आपली पसंतीची भाषा निवडा',
      step5Title: 'वापराची मुख्य पद्धत निवडा',
      step5Subtitle: 'तुम्ही ही पद्धत कधीही बदलू शकता.',
      next: 'पुढे जा',
      back: 'मागे या',
      finish: 'ल्यूमा सुरू करा',
      skip: 'थेट सुरू करा'
    },
    common: {
      allow: 'परवानगी द्या',
      deny: 'आता नको',
      cancel: 'रद्द करा',
      save: 'जतन करा',
      loading: 'ल्यूमा तयारी करत आहे...',
      processing: 'ल्यूमा समजावून घेत आहे...',
      error: 'काहीतरी त्रुटी आली, कृपया पुन्हा प्रयत्न करा.',
      emergency: 'तातडीची मदत (Emergency Sign)',
      speak: 'वाचून दाखवा',
      stopSpeech: 'आवाज थांबवा',
      statusReady: 'ल्यूमा तयार आणि सक्रिय आहे'
    }
  }
};
