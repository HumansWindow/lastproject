// Keep existing translations object
// Basic language translations
const translations = {
    "en": "Choose your language",
    "fa": "زبان خود را انتخاب کنید",
    "es": "Elige tu idioma",
    "fr": "Choisissez votre langue",
    "de": "Wählen Sie Ihre Sprache",
    "it": "Scegli la tua lingua",
    "pt": "Escolha seu idioma",
    "af": "Kies jou taal",
    "sq": "Zgjidhni gjuhën tuaj",
    "am": "የቋንቋ ምርጫዎን ይምረጡ",
    "ar": "اختر لغتك",
    "hy": "Ընտրեք ձեր լեզուն",
    "az": "Dil seçin",
    "eu": "Hautatu zure hizkuntza",
    "be": "Выберыце сваю мову",
    "bn": "আপনার ভাষা নির্বাচন করুন",
    "bs": "Odaberite svoj jezik",
    "bg": "Изберете вашия език",
    "ca": "Trieu la vostra llengua",
    "ceb": "Piliin ang iyong wika",
    "ny": "Sankhani chilankhulo chanu",
    "zh-CN": "选择你的语言",
    "zh-TW": "選擇你的語言",
    "co": "Sceglite a vostra lingua",
    "hr": "Odaberite svoj jezik",
    "cs": "Vyberte svůj jazyk",
    "da": "Vælg dit sprog",
    "nl": "Kies uw taal",
    "eo": "Elektu vian lingvon",
    "et": "Valige oma keel",
    "tl": "Piliin ang iyong wika",
    "fi": "Valitse kielesi",
    "fy": "Kies jo taal",
    "gl": "Escolle a túa lingua",
    "ka": "აირჩიეთ თქვენი ენა",
    "el": "Επιλέξτε τη γλώσσα σας",
    "gu": "તમારી ભાષા પસંદ કરો",
    "ht": "Chwazi lang ou",
    "ha": "Zaɓi yaren ku",
    "haw": "E koho i kāu ʻōlelo",
    "iw": "בחר את השפה שלך",
    "hi": "अपनी भाषा चुनें",
    "hmn": "Xaiv koj hom lus",
    "hu": "Válassza ki a nyelvet",
    "is": "Veldu tungumál þitt",
    "ig": "Họrọ asụsụ gị",
    "id": "Pilih bahasa Anda",
    "ga": "Roghnaigh do theanga",
    "ja": "言語を選択してください",
    "jw": "Pilih basa sampeyan",
    "kn": "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "kk": "Тілді таңдаңыз",
    "km": "ជ្រើសរើសភាសារបស់អ្នក",
    "rw": "Hitamo ururimi rwawe",
    "ko": "언어를 선택하세요",
    "ku": "Zimanê xwe hilbijêre",
    "ky": "Тилди тандаңыз",
    "lo": "ເລືອກພາສາຂອງທ່ານ",
    "la": "Elige linguam tuam",
    "lv": "Izvēlieties savu valodu",
    "lt": "Pasirinkite savo kalbą",
    "lb": "Wielt Är Sprooch",
    "mk": "Изберете го вашиот јазик",
    "mg": "Safidio ny fiteninao",
    "ms": "Pilih bahasa anda",
    "ml": "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    "mt": "Agħżel il-lingwa tiegħek",
    "mi": "Kōwhiria tō reo",
    "mr": "आपली भाषा निवडा",
    "mn": "Хэлээ сонгоно уу",
    "my": "သင်၏ဘာသာစကားကိုရွေးပါ",
    "ne": "आफ्नो भाषा चयन गर्नुहोस्",
    "no": "Velg språket ditt",
    "or": "ଆପଣଙ୍କର ଭାଷା ବାଛନ୍ତୁ",
    "ps": "خپله ژبه وټاکئ",
    "pl": "Wybierz swój język",
    "pa": "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
    "ro": "Alegeți limba dvs.",
    "ru": "Выберите свой язык",
    "sm": "Filifili lau gagana",
    "gd": "Tagh do chànan",
    "sr": "Izaberite svoj jezik",
    "st": "Khetha puo ea hau",
    "sn": "Sarudza mutauro wako",
    "sd": "پنهنجي ٻولي چونڊيو",
    "si": "ඔබේ භාෂාව තෝරන්න",
    "sk": "Vyberte si svoj jazyk",
    "sl": "Izberite svoj jezik",
    "so": "Dooro luqaddaada",
    "su": "Pilih basa anjeun",
    "sw": "Chagua lugha yako",
    "sv": "Välj ditt språk",
    "tg": "Забони худро интихоб кунед",
    "ta": "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    "tt": "Телегезне сайлагыз",
    "te": "మీ భాషను ఎంచుకోండి",
    "th": "เลือกภาษาของคุณ",
    "tr": "Dilinizi seçin",
    "tk": "Dili saýlaň",
    "uk": "Виберіть свою мову",
    "ur": "اپنی زبان منتخب کریں",
    "ug": "ئۆزىڭىزنىڭ تىلىنى تاللاڭ",
    "uz": "Tilni tanlang",
    "vi": "Chọn ngôn ngữ của bạn",
    "cy": "Dewiswch eich iaith",
    "xh": "Khetha ulwimi lwakho",
    "yi": "קלייַבן דיין שפּראַך",
    "yo": "Yan ede rẹ",
    "zu": "Khetha ulimi lwakho",
    "as": "আপোনাৰ ভাষা বাছক",
    "bo": "ཁོང་གི་ཁ་སྐད་འདེམས།",
    "dv": "ތިބާގެން ހުރިހާ އިންޑިއަންވައިން",
    "ee": "Tia wò le èdò",
    "kl": "Qinnutigisat oqaatsit toqqakkit",
    "ks": "اپنی زبان چنیں",
    "ln": "Pona na monɔkɔ na yo",
    "mh": "Kain met ejon̄ in",
    "om": "Afaan kee filadhu",
    "qu": "Sutiykita akllay",
    "sh": "Izaberite svoj jezik",
    "ti": "ቋንቋኹም ይምረጡ",
    "ve": "Khetha luambo lwau",
    "vo": "Lödön valem",
    "wa": "Tchoezi vosse lingaedje",
    "wa": "Tchoezi vosse lingaedje",
    "wo": "Tànn say weer gi"
};

class LingvaTranslationManager {
    constructor() {
        this.initialized = false;
        this.currentLanguageIndex = 0;
        this.languageKeys = Object.keys(translations);
        this.defaultLanguage = 'en';
        this.animationInterval = null;
        this.lingvaBaseUrl = 'https://api.lingva.ml/api/v1'; // Updated API endpoint
        this.cachedTranslations = new Map();
        this.isTranslating = false;
        this.fallbackAPI = 'https://translate.googleapis.com/translate_a/single';
        this.retryCount = 0;
        this.maxRetries = 3;

        // Update API endpoints with working alternatives
        this.endpoints = {
            primary: 'https://translate.googleapis.com/translate_a/single',
            backup: 'https://api.mymemory.translated.net/get'
        };
        
        this.apiKeys = {
            google: '', // Add your Google Translate API key if you have one
            mymemory: '' // Add MyMemory API key if you have one
        };

        // Clear any previously saved language preference on initialization
        if (typeof window !== 'undefined') {
            localStorage.removeItem('preferred_language');
        }
    }

    async translateText(text, targetLang, sourceLang = 'en') {
        if (!text?.trim() || targetLang === sourceLang) return text;

        const cacheKey = `${sourceLang}-${targetLang}-${text}`;
        if (this.cachedTranslations.has(cacheKey)) {
            return this.cachedTranslations.get(cacheKey);
        }

        try {
            // Try Google Translate API first
            const googleTranslation = await this.googleTranslate(text, targetLang, sourceLang);
            if (googleTranslation) {
                this.cachedTranslations.set(cacheKey, googleTranslation);
                return googleTranslation;
            }

            // Fallback to MyMemory API
            const myMemoryTranslation = await this.myMemoryTranslate(text, targetLang, sourceLang);
            if (myMemoryTranslation) {
                this.cachedTranslations.set(cacheKey, myMemoryTranslation);
                return myMemoryTranslation;
            }

            throw new Error('All translation attempts failed');
        } catch (error) {
            console.warn('Translation error:', error);
            return text; // Return original text if translation fails
        }
    }

    async googleTranslate(text, targetLang, sourceLang) {
        try {
            const url = `${this.endpoints.primary}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Google Translate request failed');
            
            const data = await response.json();
            if (!data || !data[0] || !data[0][0] || !data[0][0][0]) {
                throw new Error('Invalid response format');
            }
            
            return data[0][0][0];
        } catch (error) {
            console.warn('Google Translate error:', error);
            return null;
        }
    }

    async myMemoryTranslate(text, targetLang, sourceLang) {
        try {
            const url = `${this.endpoints.backup}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('MyMemory request failed');
            
            const data = await response.json();
            if (!data || !data.responseData || !data.responseData.translatedText) {
                throw new Error('Invalid response format');
            }
            
            return data.responseData.translatedText;
        } catch (error) {
            console.warn('MyMemory error:', error);
            return null;
        }
    }

    async animateLanguageChoice(element) {
        if (!element || !window.gsap) return;

        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }

        const animateNext = () => {
            gsap.to(element, {
                duration: 0.5,
                opacity: 0,
                onComplete: () => {
                    element.textContent = translations[this.languageKeys[this.currentLanguageIndex]];
                    gsap.to(element, {
                        duration: 0.5,
                        opacity: 1,
                        onComplete: () => {
                            setTimeout(() => {
                                this.currentLanguageIndex = (this.currentLanguageIndex + 1) % this.languageKeys.length;
                            }, 2000);
                        }
                    });
                }
            });
        };

        element.textContent = translations[this.languageKeys[0]];
        this.animationInterval = setInterval(animateNext, 3000);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(this.animationInterval);
            } else {
                this.animationInterval = setInterval(animateNext, 3000);
            }
        });
    }

    async translatePage(language) {
        const elements = document.querySelectorAll('[data-translate]');
        for (const element of elements) {
            const originalText = element.getAttribute('data-original-text') || element.textContent;
            if (!element.getAttribute('data-original-text')) {
                element.setAttribute('data-original-text', originalText);
            }
            
            const translatedText = await this.translateText(originalText, language);
            element.textContent = translatedText;

            // Handle typing animations if needed
            if (element.classList.contains('TypeStyle') && window.startTypeAnimation) {
                window.startTypeAnimation(element, translatedText);
            }
        }
    }

    async init() {
        try {
            const languageSelect = document.getElementById('language-select');
            const languageChoice = document.getElementById('language-choice');

            if (!languageSelect) {
                console.error('Language select element not found');
                return false;
            }

            // Force English as default
            languageSelect.value = this.defaultLanguage;
            document.documentElement.lang = this.defaultLanguage;
            document.documentElement.dir = 'ltr';

            // Remove any RTL classes
            document.body.classList.remove('rtl-lang');

            // Reset language choice text
            if (languageChoice) {
                languageChoice.textContent = translations[this.defaultLanguage];
            }

            // Clean up event listeners
            const newSelect = languageSelect.cloneNode(true);
            languageSelect.parentNode.replaceChild(newSelect, languageSelect);

            // Add event listeners
            newSelect.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleLanguageChange(e);
            });

            newSelect.addEventListener('click', (e) => {
                e.stopPropagation();
                newSelect.focus();
            });

            // Make sure the select element is enabled and visible
            newSelect.style.cssText = `
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
                z-index: 1002 !important;
            `;

            // Initialize without loading saved language
            this.addTranslationAttributes();
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Translation initialization error:', error);
            return false;
        }
    }

    addTranslationAttributes() {
        const elementsToTranslate = document.querySelectorAll(
            '.TypeStyle, p:not(.notranslate), h1:not(.notranslate), h2:not(.notranslate), ' +
            'h3:not(.notranslate), h4:not(.notranslate), h5:not(.notranslate), h6:not(.notranslate), ' +
            'button:not(.notranslate), a:not(.notranslate), label:not(.notranslate), span:not(.notranslate)'
        );

        elementsToTranslate.forEach(element => {
            if (!element.hasAttribute('data-translate') && 
                element.textContent.trim() && 
                !element.closest('.notranslate')) {
                element.setAttribute('data-translate', '');
                // Store original text
                element.setAttribute('data-original-text', element.textContent.trim());
            }
        });
    }

    async handleLanguageChange(event) {
        if (this.isTranslating || !event.target.value) return;
        
        this.isTranslating = true;
        const language = event.target.value;

        try {
            // Update UI immediately
            const languageChoice = document.getElementById('language-choice');
            if (languageChoice) {
                languageChoice.textContent = translations[language] || translations['en'];
            }

            // Handle RTL languages
            const rtlLanguages = ['ar', 'fa', 'he', 'ur'];
            const isRTL = rtlLanguages.includes(language);
            
            document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
            document.documentElement.lang = language;

            if (isRTL) {
                document.body.classList.add('rtl-lang');
            } else {
                document.body.classList.remove('rtl-lang');
            }

            // Show loading indicator
            this.showTranslationProgress();

            // Translate content
            await this.translatePage(language);

            // Save preference only after successful translation
            localStorage.setItem('preferred_language', language);

        } catch (error) {
            console.error('Language change error:', error);
            // Revert to English on error
            event.target.value = 'en';
            document.documentElement.dir = 'ltr';
            document.documentElement.lang = 'en';
        } finally {
            this.hideTranslationProgress();
            this.isTranslating = false;
        }
    }

    showTranslationProgress() {
        let indicator = document.getElementById('translation-progress');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'translation-progress';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                transition: opacity 0.3s ease;
                opacity: 0;
                transform: translateY(20px);
                animation: slideUp 0.3s ease forwards;
            `;
            
            indicator.innerHTML = `
                <div class="spinner"></div>
                <span>Translating...</span>
            `;
            
            // Add keyframes for slide up animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(indicator);
        }
    }

    hideTranslationProgress() {
        const indicator = document.getElementById('translation-progress');
        if (indicator) {
            indicator.remove();
        }
    }

    setupObserver() {
        if (!document.body) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    this.addTranslationAttributes();
                }
            });
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }
}

// Initialize translation manager
const translator = new LingvaTranslationManager();

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
    translator.init().then(() => {
        // Force English after initialization
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = 'en';
            languageSelect.dispatchEvent(new Event('change'));
        }
    }).catch(error => {
        console.error('Translation initialization failed:', error);
    });
});

// Add this to handle dynamic content
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            translator.addTranslationAttributes();
        }
    });
});

// Start observing the document with the configured parameters
observer.observe(document.body, { childList: true, subtree: true });

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LingvaTranslationManager;
}
