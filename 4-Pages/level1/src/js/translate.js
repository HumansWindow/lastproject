// Add this at the beginning of the file
const hideTranslateElements = () => {
    // Remove Google Translate elements that cause the top bar
    const elements = document.querySelectorAll('.goog-te-banner-frame, .skiptranslate');
    elements.forEach(el => el.remove());
    
    // Reset body positioning
    document.body.style.top = '0px';
    document.body.classList.remove('translated-ltr', 'translated-rtl');
};

// Basic language translations
const translations = {
    en: "Choose your language",
    fa: "زبان خود را انتخاب کنید",
    es: "Elige tu idioma",
    fr: "Choisissez votre langue",
    de: "Wählen Sie Ihre Sprache",
    it: "Scegli la tua lingua",
    pt: "Escolha seu idioma",
    af: "Kies jou taal",
    sq: "Zgjidhni gjuhën tuaj",
    am: "የቋንቋ ምርጫዎን ይምረጡ",
    ar: "اختر لغتك",
    hy: "Ընտրեք ձեր լեզուն",
    az: "Dil seçin",
    eu: "Hautatu zure hizkuntza",
    be: "Выберыце сваю мову",
    bn: "আপনার ভাষা নির্বাচন করুন",
    bs: "Odaberite svoj jezik",
    bg: "Изберете вашия език",
    ca: "Trieu la vostra llengua",
    ceb: "Piliin ang iyong wika",
    ny: "Sankhani chilankhulo chanu",
    "zh-CN": "选择你的语言",
    "zh-TW": "選擇你的語言",
    co: "Sceglite a vostra lingua",
    hr: "Odaberite svoj jezik",
    cs: "Vyberte svůj jazyk",
    da: "Vælg dit sprog",
    nl: "Kies uw taal",
    eo: "Elektu vian lingvon",
    et: "Valige oma keel",
    tl: "Piliin ang iyong wika",
    fi: "Valitse kielesi",
    fy: "Kies jo taal",
    gl: "Escolle a túa lingua",
    ka: "აირჩიეთ თქვენი ენა",
    el: "Επιλέξτε τη γλώσσα σας",
    gu: "તમારી ભાષા પસંદ કરો",
    ht: "Chwazi lang ou",
    ha: "Zaɓi yaren ku",
    haw: "E koho i kāu ʻōlelo",
    iw: "בחר את השפה שלך",
    hi: "अपनी भाषा चुनें",
    hmn: "Xaiv koj hom lus",
    hu: "Válassza ki a nyelvet",
    is: "Veldu tungumál þitt",
    ig: "Họrọ asụsụ gị",
    id: "Pilih bahasa Anda",
    ga: "Roghnaigh do theanga",
    ja: "言語を選択してください",
    jw: "Pilih basa sampeyan",
    kn: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    kk: "Тілді таңдаңыз",
    km: "ជ្រើសរើសភាសារបស់អ្នក",
    rw: "Hitamo ururimi rwawe",
    ko: "언어를 선택하세요",
    ku: "Zimanê xwe hilbijêre",
    ky: "Тилди тандаңыз",
    lo: "ເລືອກພາສາຂອງທ່ານ",
    la: "Elige linguam tuam",
    lv: "Izvēlieties savu valodu",
    lt: "Pasirinkite savo kalbą",
    lb: "Wielt Är Sprooch",
    mk: "Изберете го вашиот јазик",
    mg: "Safidio ny fitenинао",
    ms: "Pilih bahasa anda",
    ml: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    mt: "Agħżel il-lingwa tiegħek",
    mi: "Kōwhiria tō reo",
    mr: "आपली भाषा निवडा",
    mn: "Хэлээ сонгоно уу",
    my: "သင်၏ဘာသာစကားကိုရွေးပါ",
    ne: "आफ्नो भाषा चयन गर्नुहोस्",
    no: "Velg språket ditt",
    or: "ଆପଣଙ୍କର ଭାଷା ବାଛନ୍ତୁ",
    ps: "خپله ژبه وټاکئ",
    pl: "Wybierz swój język",
    pa: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
    ro: "Alegeți limba dvs.",
    ru: "Выберите свой язык",
    sm: "Filifili lau gagana",
    gd: "Tagh do chànan",
    sr: "Izaberite svoj jezik",
    st: "Khetha puo ea hau",
    sn: "Sarudza mutauro wako",
    sd: "پنهنجي ٻولي چونڊيو",
    si: "ඔබේ භාෂාව තෝරන්න",
    sk: "Vyberte si svoj jazyk",
    sl: "Izberite svoj jezik",
    so: "Dooro luqaddaada",
    su: "Pilih basa anjeun",
    sw: "Chagua lugha yako",
    sv: "Välj ditt språk",
    tg: "Забони худро интихоб кунед",
    ta: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    tt: "Телегезне сайлагыз",
    te: "మీ భాషను ఎంచుకోండి",
    th: "เลือกภาษาของคุณ",
    tr: "Dilinizi seçin",
    tk: "Dili saýlaň",
    uk: "Виберіть свою мову",
    ur: "اپنی زبان منتخب کریں",
    ug: "ئۆزىڭىزنىڭ تىلىنى تاللاڭ",
    uz: "Tilni tanlang",
    vi: "Chọn ngôn ngữ của bạn",
    cy: "Dewiswch eich iaith",
    xh: "Khetha ulwimi lwakho",
    yi: "קלייַבן דיין שפּראַך",
    yo: "Yan ede rẹ",
    zu: "Khetha ulimi lwakho",
    as: "আপোনাৰ ভাষা বাছক",
    bo: "ཁོང་གི་ཁ་སྐད་འདེམས།",
    dv: "ތިބާގެން ހުރިހާ އިންޑިއަންވައިން",
    ee: "Tia wò le èdò",
    kl: "Qinnutigisat oqaatsit toqqakkit",
    ks: "اپنی زبان چنیں",
    ln: "Pona na monɔkɔ na yo",
    mh: "Kain met ejon̄ in",
    om: "Afaan kee filadhu",
    qu: "Sutiykita akllay",
    sh: "Izaberite svoj jezik",
    ti: "ቋንቋኹም ይምረጡ",
    ve: "Khetha luambo lwau",
    vo: "Lödön valem",
    wa: "Tchoezi vosse lingaedje",
    wo: "Tànn say weer gi"
    // ...existing translations...
};

// Direct translation implementation
class TranslationManager {
    constructor() {
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.translateElement = null;
        this.animationInterval = null;
        this.currentLanguageIndex = 0;
        this.languageKeys = Object.keys(translations);
        this.googleScriptLoaded = false;
        this.initAttempts = 0;
        this.maxInitAttempts = 5;
        this.initDelay = 1000; // 1 second between attempts
        this.defaultLanguage = 'en';
    }

    async animateLanguageChoice(element) {
        if (!element || !window.gsap) return;

        // Clear any existing animation interval
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }

        const animateNext = () => {
            gsap.to(element, {
                duration: 0.5,
                opacity: 0,
                onComplete: () => {
                    // Update text to next language
                    element.textContent = translations[this.languageKeys[this.currentLanguageIndex]];
                    // Fade in new text
                    gsap.to(element, {
                        duration: 0.5,
                        opacity: 1,
                        onComplete: () => {
                            // Wait before starting next animation
                            setTimeout(() => {
                                // Move to next language
                                this.currentLanguageIndex = (this.currentLanguageIndex + 1) % this.languageKeys.length;
                            }, 2000); // Show each language for 2 seconds
                        }
                    });
                }
            });
        };

        // Set initial text
        element.textContent = translations[this.languageKeys[0]];
        
        // Start animation cycle
        this.animationInterval = setInterval(animateNext, 3000); // Total cycle: 3 seconds

        // Handle visibility change to pause/resume animation
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(this.animationInterval);
            } else {
                this.animationInterval = setInterval(animateNext, 3000);
            }
        });
    }

    async waitForGoogle() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.translate) {
                resolve();
                return;
            }

            const checkGoogle = setInterval(() => {
                if (window.google && window.google.translate) {
                    clearInterval(checkGoogle);
                    this.googleScriptLoaded = true;
                    resolve();
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkGoogle);
                reject(new Error('Google Translate script load timeout'));
            }, 10000);
        });
    }

    async init() {
        try {
            const translateDiv = document.getElementById('google_translate_element');
            const languageSelect = document.getElementById('language-select');
            const languageChoice = document.getElementById('language-choice');

            if (!translateDiv || !languageSelect) return false;

            // Set default language
            languageSelect.value = this.defaultLanguage;
            document.documentElement.lang = this.defaultLanguage;

            // Show translate div
            translateDiv.style.display = 'block';

            // Wait for Google Translate to load
            await this.waitForGoogle();

            // Initialize Google Translate
            new window.google.translate.TranslateElement({
                pageLanguage: this.defaultLanguage,
                includedLanguages: 'af,sq,am,ar,hy,az,eu,be,bn,bs,bg,ca,ceb,ny,zh-CN,zh-TW,co,hr,cs,da,nl,en,eo,et,tl,fi,fr,fy,gl,ka,de,el,gu,ht,ha,haw,iw,hi,hmn,hu,is,ig,id,ga,it,ja,jw,kn,kk,km,rw,ko,ku,ky,lo,la,lv,lt,lb,mk,mg,ms,ml,mt,mi,mr,mn,my,ne,no,or,ps,fa,pl,pt,pa,ro,ru,sm,gd,sr,st,sn,sd,si,sk,sl,so,es,su,sw,sv,tg,ta,tt,te,th,tr,tk,uk,ur,ug,uz,vi,cy,xh,yi,yo,zu',
                autoDisplay: false
            }, 'google_translate_element');

            // Setup language selector
            languageSelect.addEventListener('change', (e) => this.handleLanguageChange(e));

            // Restore saved language
            const savedLanguage = localStorage.getItem('preferred_language') || this.defaultLanguage;
            if (savedLanguage !== this.defaultLanguage) {
                languageSelect.value = savedLanguage;
                this.handleLanguageChange({ target: languageSelect });
            }

            // Start choice text animation
            this.animateLanguageChoice(languageChoice);

            return true;
        } catch (error) {
            console.warn('Translation initialization error:', error);
            
            // Retry initialization if under max attempts
            if (this.initAttempts < this.maxInitAttempts) {
                this.initAttempts++;
                setTimeout(() => this.init(), this.initDelay);
            }
            
            return false;
        }
    }

    handleLanguageChange(event) {
        const language = event.target.value;
        
        try {
            // Save preference
            localStorage.setItem('preferred_language', language);

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

            // Update language choice text
            const languageChoice = document.getElementById('language-choice');
            if (languageChoice && translations[language]) {
                languageChoice.textContent = translations[language];
            }

            // Try to trigger Google Translate
            const googleCombo = document.querySelector('.goog-te-combo');
            if (googleCombo) {
                googleCombo.value = language;
                googleCombo.dispatchEvent(new Event('change'));
                
                // Store original texts and wait for translation
                const typeElements = document.querySelectorAll('.TypeStyle');
                const textsMap = new Map();
                
                // Store original texts
                typeElements.forEach(element => {
                    textsMap.set(element, element.textContent);
                });
                
                // Check for translation completion
                const checkTranslation = setInterval(() => {
                    let allTranslated = true;
                    
                    typeElements.forEach(element => {
                        if (element.textContent === textsMap.get(element)) {
                            allTranslated = false;
                        }
                    });
                    
                    if (allTranslated) {
                        clearInterval(checkTranslation);
                        
                        // First make sure translations are complete
                        typeElements.forEach(element => {
                            const translatedText = element.textContent;
                            element.style.opacity = '1';
                        });
                        
                        // Then start animations after a short delay
                        setTimeout(() => {
                            typeElements.forEach(element => {
                                const translatedText = element.textContent;
                                if (window.startTypeAnimation) {
                                    window.startTypeAnimation(element, translatedText);
                                }
                            });
                        }, 500);
                    }
                }, 100);
                
                // Safety timeout
                setTimeout(() => clearInterval(checkTranslation), 5000);
            }
        } catch (error) {
            console.warn('Language change error:', error);
        }
    }

    // ...rest of existing code...
}

// Update initialization code
const translator = new TranslationManager();

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize translation with retry capability
    translator.init().catch(error => {
        console.warn('Translation initialization failed:', error);
    });
});

// Expose initialization function for Google Translate callback
window.initTranslation = () => translator.init();
