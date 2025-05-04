// Fix viewport height for mobile devices
function updateViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

updateViewportHeight();
window.addEventListener('resize', updateViewportHeight);

document.addEventListener("DOMContentLoaded", function() {
    // Navigation system
    const sections = document.querySelectorAll('section');
    const navButtons = document.querySelectorAll('.navigate-btn');
    const carouselNavButtons = document.querySelectorAll('.carousel-nav-buttons'); // renamed from navButtons

    // Enhanced scroll management
    function initScrollManagement() {
        const sections = document.querySelectorAll('.ah-section');
        const scrollPositions = new Map();

        sections.forEach(section => {
            const content = section.querySelector('.ah-section-content');
            if (!content) return;

            // Store scroll position before section change
            content.addEventListener('scroll', () => {
                if (section.classList.contains('active-section')) {
                    scrollPositions.set(section.id, content.scrollTop);
                }
            });

            // Handle section activation
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.classList.contains('active-section')) {
                        // Restore scroll position when section becomes active
                        const savedPosition = scrollPositions.get(section.id) || 0;
                        setTimeout(() => {
                            content.scrollTop = savedPosition;
                        }, 100);
                    }
                });
            });

            observer.observe(section, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
    }

    // Debounce helper function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function switchSection(targetId) {
        const currentSection = document.querySelector('section.active-section');
        const targetSection = document.querySelector(targetId);
        
        if (!targetSection || !currentSection) return;

        // Store current section's scroll position
        const currentContent = currentSection.querySelector('.ah-section-content');
        if (currentContent) {
            const scrollPos = currentContent.scrollTop;
            currentSection.dataset.scrollPos = scrollPos;
        }

        // Handle section transition
        currentSection.classList.add('section-exit');
        
        setTimeout(() => {
            currentSection.classList.remove('active-section', 'section-exit');
            currentSection.style.display = 'none';
            
            targetSection.style.display = 'flex';
            targetSection.classList.add('active-section', 'section-enter');
            
            // Restore target section's scroll position
            const targetContent = targetSection.querySelector('.ah-section-content');
            if (targetContent && targetSection.dataset.scrollPos) {
                targetContent.scrollTop = parseInt(targetSection.dataset.scrollPos);
            }
            
            setTimeout(() => {
                targetSection.classList.remove('section-enter');
            }, 1000);
        }, 1000);
    }

    // Initialize sections
    sections.forEach((section, index) => {
        if (index === 0) {
            section.style.display = 'flex';
            section.classList.add('active-section');
        } else {
            section.style.display = 'none';
        }
    });

    // Remove navigation button handling code
    
    // Enhanced typing animation system
    window.startTypeAnimation = function(element, forcedText = null) {
        if (!element || !gsap) return;
        
        // Kill any existing animations on this element
        gsap.killTweensOf(element);
        
        const text = forcedText || element.textContent || '';
        if (!text) return;
        
        // Save original text
        element.setAttribute('data-original-text', text);
        element.textContent = '';
        
        // Check if element is in active card or section
        const isInActiveCard = element.closest('.card-item.active') !== null;
        const isInActiveSection = element.closest('.active-section') !== null;
        
        if (isInActiveCard || isInActiveSection) {
            gsap.to(element, {
                duration: 0.15 * text.length,
                text: {
                    value: text,
                    delimiter: ""
                },
                ease: "none",
                repeat: 1,
                repeatDelay: 1.5,
                onComplete: () => {
                    element.textContent = text;
                }
            });
        } else {
            element.textContent = text;
        }
    };

    // Initialize type animations for visible elements
    function initTypeAnimations() {
        if (!gsap || !gsap.registerPlugin) {
            console.warn('GSAP or TextPlugin not loaded');
            return;
        }
        
        // First pass: Animate elements in active section and active card
        const elements = document.querySelectorAll('.TypeStyle');
        elements.forEach(element => {
            const isInActiveCard = element.closest('.card-item.active') !== null;
            const isInActiveSection = element.closest('.active-section') !== null;
            
            if (isInActiveCard || isInActiveSection) {
                startTypeAnimation(element);
            }
        });

        // Observe section changes
        const sectionObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active-section')) {
                    const typeElements = mutation.target.querySelectorAll('.TypeStyle');
                    typeElements.forEach(element => {
                        const originalText = element.getAttribute('data-original-text');
                        startTypeAnimation(element, originalText);
                    });
                }
            });
        });

        // Observe card changes
        const cardObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    const typeElements = mutation.target.querySelectorAll('.TypeStyle');
                    typeElements.forEach(element => {
                        const originalText = element.getAttribute('data-original-text');
                        startTypeAnimation(element, originalText);
                    });
                }
            });
        });

        // Observe all sections
        document.querySelectorAll('.ah-section').forEach(section => {
            sectionObserver.observe(section, {
                attributes: true,
                attributeFilter: ['class']
            });
        });

        // Observe all cards
        document.querySelectorAll('.card-item').forEach(card => {
            cardObserver.observe(card, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
    }

    // Initialize animations if GSAP is loaded
    if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
        gsap.registerPlugin(TextPlugin);
        initTypeAnimations();
    }

    // Initialize animations if GSAP is loaded
    if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
        gsap.registerPlugin(TextPlugin);
        initTypeAnimations();

        // Darwish animation
        gsap.to(".Darwish", {
            rotation: 360,
            scale: 1,
            duration: 10,
            repeat: -1,
            ease: "none",
            transformOrigin: "center center"
        });
    }
    
    // Initialize 3D characters with proper timing
    const chars = document.querySelectorAll('.three-char');
    const threeChars = [];
    
    chars.forEach((container, index) => {
        const char = container.dataset.char;
        if (char && char !== ' ') {  // Only create 3D for non-space characters
            const threeChar = new ThreeChar(container, char);
            threeChars.push(threeChar);
            
            // Add staggered animation start
            setTimeout(() => {
                threeChar.animate();
            }, index * 100);
        } else {
            // For space characters, just add spacing
            container.style.width = '8px';
            container.style.display = 'inline-block';
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (typeof threeChars !== 'undefined' && Array.isArray(threeChars)) {
            threeChars.forEach(char => {
                if (char && typeof char.handleResize === 'function') {
                    char.handleResize();
                }
            });
        }
    });

    // Card Carousel System
    let currentCardIndex = 0;
    const cards = document.querySelectorAll('.card-item');

    function updateCards(direction) {
        const totalCards = cards.length;
        const roleAccepted = document.querySelector('#roleAcceptance')?.checked;
        
        // Prevent navigation if rules not accepted
        if (!roleAccepted && currentCardIndex === 0) {
            alert('Please accept the rules to continue');
            return;
        }
        
        // Remove all classes first
        cards.forEach(card => {
            card.classList.remove('active', 'prev');
        });
        
        // Update currentCardIndex based on direction
        if (direction === 'next') {
            currentCardIndex = (currentCardIndex + 1) % totalCards;
        } else if (direction === 'prev') {
            currentCardIndex = (currentCardIndex - 1 + totalCards) % totalCards;
        }
        
        // Add appropriate classes
        cards[currentCardIndex].classList.add('active');
        if (currentCardIndex > 0) {
            cards[currentCardIndex - 1].classList.add('prev');
        }
        
        // Show/hide navigation buttons on last card
        if (currentCardIndex === totalCards - 1) {
            carouselNavButtons.forEach(btn => btn.classList.add('visible'));
        } else {
            carouselNavButtons.forEach(btn => btn.classList.remove('visible'));
        }

        // After updating active card status, trigger typing animations
        const activeCard = document.querySelector('.card-item.active');
        if (activeCard) {
            const typeElements = activeCard.querySelectorAll('.TypeStyle');
            typeElements.forEach(element => {
                const originalText = element.getAttribute('data-original-text') || element.textContent;
                startTypeAnimation(element, originalText);
            });
        }
    }

    // Initialize first card
    cards[0].classList.add('active');
    
    // Add click handlers for carousel buttons
    document.querySelector('.carousel-btn-next')?.addEventListener('click', () => {
        updateCards('next');
    });
    
    document.querySelector('.carousel-btn-prev')?.addEventListener('click', () => {
        updateCards('prev');
    });

    // Role acceptance handling
    const roleCheckbox = document.querySelector('#roleAcceptance');
    const carouselButtons = document.querySelectorAll('.carousel-btn');
    
    if (roleCheckbox) {
        roleCheckbox.addEventListener('change', function() {
            // Toggle carousel buttons visibility based on checkbox state
            carouselButtons.forEach(btn => {
                if (this.checked) {
                    btn.style.visibility = 'visible';
                    btn.style.opacity = '1';
                } else {
                    btn.style.visibility = 'hidden';
                    btn.style.opacity = '0';
                }
            });
        });

        // Always start unchecked
        roleCheckbox.checked = false;
        carouselButtons.forEach(btn => {
            btn.style.visibility = 'hidden';
            btn.style.opacity = '0';
        });
    }

    initScrollManagement();
});

window.addEventListener('load', () => {
    console.log('All resources finished loading!');
});

// Three.js Character Class
class ThreeChar {
    constructor(container, char) {
        this.container = container; // Store container reference
        this.sizes = {
            width: container.clientWidth,
            height: container.clientHeight
        };

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, this.sizes.width / this.sizes.height, 0.1, 100);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight, directionalLight);

        // Create text
        const loader = new THREE.FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            const geometry = new THREE.TextGeometry(char, {
                font: font,
                size: 1,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            });

            const material = new THREE.MeshStandardMaterial({
                color: 0x000000,
                metalness: 0.7,
                roughness: 0.2,
            });

            this.textMesh = new THREE.Mesh(geometry, material);
            geometry.computeBoundingBox();
            const centerOffset = -(geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
            this.textMesh.position.x = centerOffset;
            this.textMesh.geometry.center(); // Center the geometry
            this.scene.add(this.textMesh);
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.sizes.width = container.clientWidth;
            this.sizes.height = container.clientHeight;
            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        this.isAnimating = false;
        this.rotationSpeed = 0.02;
    }

    animate() {
        this.isAnimating = true;
        this.animationFrame();
    }

    animationFrame = () => {
        if (!this.isAnimating) return;
        
        requestAnimationFrame(this.animationFrame);
        
        if (this.textMesh) {
            this.textMesh.rotation.y += this.rotationSpeed;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        if (!this.container || !this.renderer) {
            console.warn('Missing required elements for resize');
            return;
        }

        try {
            // Get dimensions from the container
            this.sizes.width = this.container.clientWidth;
            this.sizes.height = this.container.clientHeight;

            // Update only if dimensions are valid
            if (this.sizes.width > 0 && this.sizes.height > 0) {
                // Update camera
                this.camera.aspect = this.sizes.width / this.sizes.height;
                this.camera.updateProjectionMatrix();

                // Update renderer
                this.renderer.setSize(this.sizes.width, this.sizes.height);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            } else {
                console.warn('Invalid container dimensions:', this.sizes);
            }
        } catch (error) {
            console.warn('Error handling resize:', error);
        }
    }

    stopAnimation = () => {
        cancelAnimationFrame(this.animationId);
        if (this.textMesh) {
            // Ensure the text is in the front view and fully visible
            this.textMesh.rotation.y = 0;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

// Brand animation setup
function setupBrandAnimation() {
    const threeChars = document.querySelectorAll('.three-char');
    const mainTimeline = gsap.timeline({
        repeat: 2, // Repeat entire animation 2 more times (total of 3)
        repeatDelay: 1 // Add 1 second delay between repeats
    });

    // Reset initial state
    gsap.set(threeChars, {
        opacity: 0,
        rotationY: 0,
        transformPerspective: 1000,
        transformOrigin: "center center"
    });

    // Function to create a single character animation
    function createCharacterAnimation(char, index) {
        const letter = char.getAttribute('data-char');
        const charTimeline = gsap.timeline({
            delay: index * 0.4 // Reduced delay between characters
        });

        // Set initial state and make visible
        charTimeline.set(char, {
            innerHTML: letter,
            opacity: 1
        });

        // Create 2 full rotations
        charTimeline
            .to(char, {
                duration: 1.2,
                rotationY: 720, // 2 full rotations (360 * 2)
                ease: "power2.inOut",
                onComplete: () => {
                    gsap.set(char, { rotationY: 0 }); // Reset to front
                }
            });

        return charTimeline;
    }

    // Create sequential animations for each character
    threeChars.forEach((char, index) => {
        if (char.dataset.char !== ' ') { // Skip space characters
            const charAnimation = createCharacterAnimation(char, index);
            mainTimeline.add(charAnimation, index * 1.2); // Adjust timing between characters
        }
    });

    // Add hover effects after all animations complete
    mainTimeline.eventCallback('onComplete', () => {
        threeChars.forEach(char => {
            if (char.dataset.char === ' ') return; // Skip space characters

            char.addEventListener('mouseenter', () => {
                gsap.to(char, {
                    scale: 1.2,
                    color: '#00ff00',
                    duration: 0.3,
                    rotationY: 360,
                    ease: "power2.out"
                });
            });

            char.addEventListener('mouseleave', () => {
                gsap.to(char, {
                    scale: 1,
                    color: 'inherit',
                    duration: 0.3,
                    rotationY: 0,
                    ease: "power2.in"
                });
            });
        });
    });

    return mainTimeline;
}

// Call the function when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupBrandAnimation();
    // ...rest of your existing initialization code...
});

// Add this function to handle carousel button states
function updateCarouselButtons() {
    const cards = document.querySelectorAll('.card-item');
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const nextBtn = document.querySelector('.carousel-btn-next');
    
    // Find the currently visible card
    let visibleCard;
    cards.forEach((card, index) => {
        if (card.style.display !== 'none') {
            visibleCard = index;
        }
    });

    // Disable/enable buttons based on visible card
    if (visibleCard === 0) {
        prevBtn.classList.add('disabled');
    } else {
        prevBtn.classList.remove('disabled');
    }

    if (visibleCard === cards.length - 1) {
        nextBtn.classList.add('disabled');
    } else {
        nextBtn.classList.remove('disabled');
    }
}

// Modify your existing carousel navigation code
document.querySelectorAll('.carousel-btn').forEach(button => {
    button.addEventListener('click', function() {
        const cards = document.querySelectorAll('.card-item');
        let currentCard;
        
        cards.forEach((card, index) => {
            if (card.style.display !== 'none') {
                currentCard = index;
            }
        });

        let nextCard;
        if (this.classList.contains('carousel-btn-next')) {
            nextCard = currentCard + 1;
        } else {
            nextCard = currentCard - 1;
        }

        if (nextCard >= 0 && nextCard < cards.length) {
            cards.forEach(card => card.style.display = 'none');
            cards[nextCard].style.display = 'block';
            updateCarouselButtons();
        }
    });
});

// Initialize button states when page loads
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card-item');
    cards.forEach((card, index) => {
        card.style.display = index === 0 ? 'block' : 'none';
    });
    updateCarouselButtons();
});

// ...existing code...
