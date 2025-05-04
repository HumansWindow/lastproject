let activeCamera;
let camera;
let starField;
let galaxyRenderers = new Map(); // Store renderers for each galaxy section

function initGalaxyAnimation() {
    const scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    activeCamera = camera;

    // Initialize galaxy for each section
    const galaxySections = document.querySelectorAll('section.Galaxy');
    galaxySections.forEach(section => {
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        galaxyRenderers.set(section.id, renderer);
        
        // Update renderer settings
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '0';
        renderer.domElement.style.overflow = 'hidden';
        
        // Add to section
        section.insertBefore(renderer.domElement, section.firstChild);
    });

    function calculateDimensions() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const smallestDimension = Math.min(viewportWidth, viewportHeight);
        const galaxySize = smallestDimension * 0.8;
        const scale = galaxySize / 100;
        const baseSize = (viewportWidth < 768 ? 0.01 : 0.02) * scale;
        return { galaxySize, scale, viewportWidth, viewportHeight, baseSize };
    }

    let dims = calculateDimensions();
    const baseSize = dims.baseSize;

    function updateRendererSize() {
        dims = calculateDimensions();
        const width = window.innerWidth;
        const height = window.innerHeight;
        galaxyRenderers.forEach(renderer => {
            renderer.setSize(width, height, false);
            renderer.domElement.style.width = '100%';
            renderer.domElement.style.height = '100%';
        });
        camera.aspect = dims.viewportWidth / dims.viewportHeight;
        camera.updateProjectionMatrix();
        if (starField) {
            starField.scale.set(dims.scale, dims.scale, dims.scale);
            starField.position.y = 0; // Reset position
        }
    }

    window.addEventListener('resize', updateRendererSize);
    updateRendererSize();

    const normalPositions = [];
    const normalColors = [];
    const normalSizes = [];
    const starAngles = [];
    const rotationSpeeds = [];

    const colorSystem = {
        gradient: Array.from({ length: 1000 }, (_, i) => {
            const t = i / 1000;
            const color = new THREE.Color();

            // Create realistic galaxy color gradient with enhanced brightness
            if (t < 0.3) {
                // Core region: Ultra bright center
                color.setHex(0x1A0536).lerp(new THREE.Color(0x2E0B57), t * 3.33);
                color.multiplyScalar(1.4); // Brightest core
            } else if (t < 0.5) {
                // Inner arms: High luminosity
                color.setHex(0x2E0B57).lerp(new THREE.Color(0x4B0082), (t - 0.3) * 5);
                color.multiplyScalar(1.2); // Very bright inner region
            } else if (t < 0.7) {
                // Mid arms: Medium-high brightness
                color.setHex(0x4B0082).lerp(new THREE.Color(0x800080), (t - 0.5) * 5);
                color.multiplyScalar(1.1); // Bright mid region
            } else if (t < 0.9) {
                // Outer arms: Moderate brightness
                color.setHex(0x800080).lerp(new THREE.Color(0x9B3B85), (t - 0.7) * 5);
                // Base brightness for outer region
            } else {
                // Edge regions: Dynamic fade
                color.setHex(0x9B3B85).lerp(new THREE.Color(0x2E0B57), (t - 0.9) * 5);
            }

            // Enhanced cosmic glow effect with dynamic brightness
            const baseBrightness = 0.8; // Increased base brightness
            const pulseEffect = Math.pow(Math.sin(t * Math.PI), 2) * 0.6;
            const distanceBoost = Math.pow(1 - t, 0.5) * 0.4; // Boost closer stars
            const finalBrightness = baseBrightness + pulseEffect + distanceBoost;
            
            color.multiplyScalar(finalBrightness);

            // Add 1% white to the color
            color.lerp(new THREE.Color(0xFFFFFF), 0.01);

            return color;
        }),

        getColor(distanceRatio) {
            const index = Math.min(Math.floor(distanceRatio * 1000), 999);
            const color = this.gradient[index] || this.gradient[0];
            
            // Additional brightness boost for closer stars
            if (distanceRatio < 0.3) {
                color.multiplyScalar(1.2 - distanceRatio); // Extra boost for core
            }
            
            return color;
        }
    };

    const starConfig = {
        numArms: 3,
        numStarsPerArm: 3000,              // Increased stars for more depth
        armWidth: 0.25,                    // Wider arms for more volume
        spiralFactor: 1.618033988749895,
        maxRadius: dims.galaxySize * 0.7,
        centerDepth: 1.2,                  // Increased depth
        rotationOffset: (2 * Math.PI) / 3,
        spiralTightness: 0.25,             // Adjusted for better 3D spiral
        armLengthFactor: 0.85,
        armWindingFactor: 1.4,
        randRadiusFactor: 0.3,             // More random spread
        verticalScatter: 0.25,             // Increased vertical scatter
        zScatter: 0.4                      // New parameter for z-axis scatter
    };

    function generateStars() {
        for (let arm = 0; arm < starConfig.numArms; arm++) {
            const armRotation = arm * starConfig.rotationOffset;
            
            for (let i = 0; i < starConfig.numStarsPerArm; i++) {
                const t = i / starConfig.numStarsPerArm;
                const angle = t * starConfig.armWindingFactor * Math.PI * 2 + armRotation;
                
                // Calculate base radius with height variation
                const radius = Math.max(0.1, starConfig.maxRadius * 
                    Math.exp(starConfig.spiralTightness * angle) * 
                    t * starConfig.armLengthFactor);
                
                // Enhanced 3D positioning
                const heightFactor = Math.exp(-t * 2) * starConfig.verticalScatter;
                const zOffset = (Math.random() - 0.5) * radius * starConfig.zScatter;
                const heightOffset = (Math.random() - 0.5) * radius * heightFactor;
                
                const spread = starConfig.armWidth * radius * 
                    (starConfig.randRadiusFactor + t * 0.3);
                const randomAngle = (Math.random() - 0.5) * 0.5;
                const randomR = Math.random() * spread;
                
                // Calculate positions with enhanced z-depth
                const x = radius * Math.cos(angle + randomAngle) + randomR * Math.cos(angle);
                const z = radius * Math.sin(angle + randomAngle) + randomR * Math.sin(angle) + zOffset;
                const y = heightOffset * (1 - t * 0.5);

                // Calculate distanceFromCenter before using it
                const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);

                // Validate values before adding
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                    console.warn('Invalid star position calculated, skipping...');
                    continue;
                }

                const initialAngle = Math.atan2(z, x);
                const rotationSpeed = (Math.random() - 0.5) * 0.02 * (1 - t * 0.5);

                const color = colorSystem.getColor(distanceFromCenter / starConfig.maxRadius, normalPositions.length / 3);
                const size = baseSize * 
                    (1.5 - distanceFromCenter / starConfig.maxRadius) * 
                    Math.sqrt(1 - t) * 
                    (1 + Math.random() * 0.5);

                // Add positions only once
                normalPositions.push(x, y, z);
                normalColors.push(color.r, color.g, color.b);
                normalSizes.push(size);
                starAngles.push(initialAngle);
                rotationSpeeds.push(rotationSpeed);
            }
        }
    }

    function createStarField() {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(normalPositions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(normalColors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(normalSizes, 1));

        const material = new THREE.PointsMaterial({
            size: 3.0,
            transparent: true,
            opacity: 1.0,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false
        });

        return new THREE.Points(geometry, material);
    }

    generateStars();
    starField = createStarField(); // Initialize starField here
    scene.add(starField);

    function animate() {
        requestAnimationFrame(animate);

        const positions = starField.geometry.attributes.position.array;
        for (let i = 0; i < starAngles.length; i++) {
            starAngles[i] += rotationSpeeds[i];
            const radius = Math.sqrt(positions[i * 3] ** 2 + positions[i * 3 + 2] ** 2);
            positions[i * 3] = radius * Math.cos(starAngles[i]);
            positions[i * 3 + 2] = radius * Math.sin(starAngles[i]);
        }
        starField.geometry.attributes.position.needsUpdate = true;

        // Render galaxy for all visible galaxy sections
        galaxyRenderers.forEach((renderer, sectionId) => {
            const section = document.getElementById(sectionId);
            if (section && section.classList.contains('active-section')) {
                renderer.render(scene, activeCamera);
            }
        });
    }

    animate();
}

// Update the resize handler
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    galaxyRenderers.forEach(renderer => {
        renderer.setSize(width, height, false);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
    });
});

function cameraFlyOver(targetId) {
    const currentSection = document.querySelector('section.active-section');
    const targetSection = document.querySelector(targetId);
    
    if (!currentSection || !targetSection || !currentSection.classList.contains('Galaxy') || !targetSection.classList.contains('Galaxy')) {
        return handleSectionTransition(targetId);
    }

    const tempCamera = camera.clone();
    tempCamera.position.copy(camera.position);
    tempCamera.rotation.copy(camera.rotation);
    activeCamera = tempCamera;

    // Get content elements
    const currentLeft = currentSection.querySelector('.left-content');
    const currentRight = currentSection.querySelector('.right-content');
    const newLeft = targetSection.querySelector('.left-content');
    const newRight = targetSection.querySelector('.right-content');

    if (!currentLeft || !currentRight || !newLeft || !newRight) {
        console.warn('Missing required elements for Galaxy transition');
        return handleSectionTransition(targetId);
    }

    // Set initial states for new content
    gsap.set([newLeft, newRight], { 
        opacity: 0,
        display: 'none'
    });

    // Create master timeline
    const masterTL = gsap.timeline({
        onComplete: () => {
            activeCamera = camera;
        }
    });

    // Phase 1: Exit Animation
    const exitTL = gsap.timeline();
    exitTL
        .to(currentLeft, {
            duration: 1,
            x: '-100%',
            opacity: 0,
            ease: "power2.inOut"
        })
        .to(currentRight, {
            duration: 1,
            x: '100%',
            opacity: 0,
            ease: "power2.inOut"
        }, "<");

    // Phase 2: Camera Movement
    const cameraTL = gsap.timeline();
    cameraTL
        .to(tempCamera.position, {
            duration: 1.5,
            y: '+=600', // Reduced height to prevent overflow
            x: '+=150',
            z: '+=150',
            ease: "power2.inOut",
            onUpdate: () => tempCamera.lookAt(0, 0, 0),
            onComplete: () => {
                // Switch sections
                currentSection.classList.remove('active-section');
                currentSection.style.display = 'none';
                targetSection.classList.add('active-section');
                targetSection.style.display = 'flex';
                
                // Prepare new content
                gsap.set([newLeft, newRight], {
                    display: 'block',
                    opacity: 0,
                    x: (i) => i === 0 ? '-100%' : '100%'
                });
            }
        })
        .to(tempCamera.position, {
            duration: 1.5,
            y: camera.position.y,
            x: camera.position.x,
            z: camera.position.z,
            ease: "power2.inOut",
            onUpdate: () => tempCamera.lookAt(0, 0, 0)
        });

    // Phase 3: Enter Animation
    const enterTL = gsap.timeline();
    enterTL
        .fromTo([newLeft, newRight], 
            {
                opacity: 0,
                x: (i) => i === 0 ? '-100%' : '100%'
            },
            {
                duration: 1,
                opacity: 1,
                x: '0%',
                ease: "power2.inOut",
                stagger: 0.2
            }
        );

    // Combine all phases
    masterTL
        .add(exitTL)
        .add(cameraTL, "-=0.5")
        .add(enterTL, "-=0.5");

    return masterTL;
}

// Remove scroll-related code and keep only galaxy animation logic
function handleSectionTransition(targetId) {
    const currentSection = document.querySelector('section.active-section');
    const targetSection = document.querySelector(targetId);
    
    if (!currentSection || !targetSection) return;

    // Check if we're transitioning from/to Galaxy sections
    const isFromGalaxy = currentSection.classList.contains('Galaxy');
    const isToGalaxy = targetSection.classList.contains('Galaxy');

    if (isFromGalaxy && isToGalaxy) {
        return cameraFlyOver(targetId);
    }

    // Simple fade transition
    const tl = gsap.timeline({
        onComplete: () => {
            currentSection.style.display = 'none';
            currentSection.classList.remove('active-section');
            targetSection.classList.add('active-section');
            targetSection.style.display = 'flex';
        }
    });

    // ... rest of transition code ...
}

// Update event listener
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('navigate-btn')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('data-target');
        const targetSection = document.querySelector(targetId);
        
        if (!targetSection) return;

        if (targetSection.classList.contains('Galaxy')) {
            // Only use cameraFlyOver for Galaxy sections
            cameraFlyOver(targetId);
        } else {
            // Use regular transition for non-Galaxy sections
            handleSectionTransition(targetId);
        }
    }
});

window.addEventListener('load', initGalaxyAnimation);

// Update the section transition function
function switchSection(targetId) {
    const currentSection = document.querySelector('section.active-section');
    const targetSection = document.querySelector(targetId);
    if (!targetSection || !currentSection) return;

    // Check if we're in a galaxy section with flyover
    if (currentSection.classList.contains('Galaxy') && currentSection.dataset.waitForFlyover) {
        return;
    }

    // Add exit animations
    currentSection.classList.add('section-exit');
    
    setTimeout(() => {
        currentSection.style.display = 'none';
        currentSection.classList.remove('active-section', 'section-exit');
        
        // Show new section
        targetSection.style.display = 'flex';
        targetSection.classList.add('active-section', 'section-enter');
        
        setTimeout(() => {
            targetSection.classList.remove('section-enter');
        }, 1000);
    }, 1000);
}

// Update the existing document ready function
document.addEventListener("DOMContentLoaded", function() {
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        if (index === 0) {
            section.style.display = 'flex';
            section.classList.add('active-section');
        } else {
            section.style.display = 'none';
        }
    });

    // Add click handlers to navigation buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('navigate-btn')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('data-target');
            
            if (e.target.hasAttribute('onclick')) {
                // Call cameraFlyOver with targetId
                cameraFlyOver(targetId);
            } else {
                // Normal section transition without galaxy animation
                switchSection(targetId);
            }
        }
    });
});
