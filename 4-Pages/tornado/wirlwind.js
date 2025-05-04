function initTornadoAnimation() {
    // Replace purple shade generator with full color spectrum generator
    const generateRichColor = () => {
        // Create color variations using HSL for better control
        const hue = Math.random(); // Full spectrum of hues (0-1)
        const saturation = THREE.MathUtils.lerp(0.7, 1, Math.random()); // High saturation
        const lightness = THREE.MathUtils.lerp(0.4, 0.8, Math.random()); // Moderate to high lightness
        return new THREE.Color().setHSL(hue, saturation, lightness);
    };

    // Replace the color palettes with new implementation
    const colorPalettes = {
        purpleGradient: () => {
            // Generate rich purple variations
            const hue = THREE.MathUtils.lerp(0.70, 0.85, Math.random()); // Purple hue range
            const saturation = THREE.MathUtils.lerp(0.6, 1, Math.random());
            const lightness = THREE.MathUtils.lerp(0.2, 0.8, Math.random());
            return new THREE.Color().setHSL(hue, saturation, lightness);
        },
        white: () => {
            // Slightly varied white for more natural look
            const lightness = THREE.MathUtils.lerp(0.95, 1, Math.random());
            return new THREE.Color().setHSL(0, 0, lightness);
        }
    };

    // Replace getCharacterColor function
    const getCharacterColor = () => {
        // 35% chance of white, 65% chance of purple gradient
        return Math.random() < 0.35 ? 
            colorPalettes.white() : 
            colorPalettes.purpleGradient();
    };

    // Maintain separate character sets
    const characterSets = {
        latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    };

    // Helper function for balanced character selection
    function getRandomBalancedChar() {
        const availableSets = Object.keys(characterSets);
        const selectedSet = availableSets[Math.floor(Math.random() * availableSets.length)];
        const set = characterSets[selectedSet];
        return set[Math.floor(Math.random() * set.length)];
    }

    // Create combined character set
    const allCharacters = Object.values(characterSets)
        .flatMap(set => typeof set === 'string' ? set : Object.values(set))
        .join('');

    // Update character constants
    const characters = allCharacters;
    const EngAlphabet = characterSets.latin.split('');

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.03);
    
    // Constants and arrays defined at the start
    const baseRadii = [
        2.2, 1.9,     // Upper middle rings
        1.7, 1.5,     // Lower middle rings
        1.3, 1.1,     // Lower rings
        0.9, 0.8,     // Bottom rings
        0.7, 0.65,     // Smaller bottom rings
        0.6, 0.5      // Smallest bottom rings
    ];
    
    // Arrays for storing objects
    const rings = [];
    const alphabetGroups = [];
    const initialRingY = [];
    const initialRingX = [];
    
    // Animation variables
    let tornadoTime = 0;
    let currentActiveRing = 0;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = false; // Disable shadow rendering
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Adjust camera position to be lower and closer to bottom
    camera.position.set(0, 0.5, 8); // Lowered Y from 2 to 0.5, reduced Z from 10 to 8
    camera.lookAt(new THREE.Vector3(0, 1.5, 0)); // Look up at the tornado

    // Add font URLs for each character set
    const fontUrls = {
        default: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json'
    };

    // Font cache object
    let loadedFonts = {};

    // Simplified font loading with verification
    async function loadFonts() {
        return new Promise((resolve, reject) => {
            const loader = new window.FontLoader();
            loader.load(
                'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', 
                function(font) {
                    if (!font) {
                        reject(new Error('Font loaded but invalid'));
                        return;
                    }
                    console.log('Font loaded successfully, creating font object');
                    resolve({ default: font });
                },
                undefined,
                function(err) {
                    console.error('Font loading error:', err);
                    reject(err);
                }
            );
        });
    }

    // Update getFontForChar to return the appropriate font
    function getFontForChar(char) {
        return loadedFonts.default;
    }

    // Modified getScript to handle all character types
    function getScript(char) {
        return 'default';
    }

    // Add the missing helper function
    function createRandomCharacter(font, radius, ringIndex, group) {
        if (!font) {
            console.error('No font provided');
            return;
        }
        const char = getRandomBalancedChar();
        const charFont = font || loadedFonts.default;
        const angle = Math.random() * Math.PI * 2;
        
        // Modified distribution for 35% edge concentration
        let innerRadius;
        const distribution = Math.random();
        if (distribution < 0.35) {  // 35% on edges
            // Characters near the outer ring
            innerRadius = radius * (0.9 + Math.random() * 0.1);
        } else if (distribution < 0.7) {  // 35% in middle region
            // Characters in the middle
            innerRadius = radius * (0.6 + Math.random() * 0.3);
        } else {  // 30% in inner region
            // Characters in the inner area
            innerRadius = radius * (0.2 + Math.random() * 0.4);
        }

        // Adjusted base size to be between old (0.08 + 0.04) and current (0.12 + 0.08) values
        let baseSize = Math.random() * 0.10 + 0.06; // Medium size between previous versions
        
        // Balanced size variation based on radius position
        const radiusRatio = innerRadius / radius;
        baseSize *= (0.75 + radiusRatio * 0.25); // Balanced between old 0.7 and new 0.8
        
        // Adjusted character type size factors to intermediate values
        if (/[\u4E00-\u9FFF]/.test(char)) {  // Chinese
            baseSize *= 0.875;  // Between 0.85 and 0.9
        } else if (/[\u0600-\u06FF]/.test(char)) {  // Persian/Arabic
            baseSize *= 0.975;  // Between 0.95 and 1.0
        } else if (/[\u0900-\u097F]/.test(char)) {  // Devanagari
            baseSize *= 0.925; // Between 0.9 and 0.95
        } else if (/[\u0E00-\u0E7F]/.test(char)) {  // Thai
            baseSize *= 0.875;  // Between 0.85 and 0.9
        }

        const textGeo = new window.TextGeometry(char, {
            font: charFont,
            size: baseSize,
            height: baseSize * 0.125, // Between 0.1 and 0.15
            curveSegments: 2,  // Reduced for better performance
            bevelEnabled: false
        });
        const textMat = new THREE.MeshBasicMaterial({ 
            color: getCharacterColor(), // Use getCharacterColor function
            transparent: true,
            opacity: Math.random() * 0.2 + 0.8 // Increased minimum opacity from 0.7 to 0.8
        });
        const textMesh = new THREE.Mesh(textGeo, textMat);
        
        // Constrain height variation
        const heightVariation = Math.random() * 0.15 - 0.075; // Increased height variation
        textMesh.position.set(
            innerRadius * Math.cos(angle),
            rings[ringIndex].position.y + heightVariation,
            innerRadius * Math.sin(angle)
        );
        textMesh.rotation.y = Math.random() * Math.PI * 2; // Random rotation
        
        // Vary rotation speed based on radius
        const speedFactor = innerRadius / radius; // Slower near the edge, faster near center

        // Center the geometry for proper self-rotation
        textGeo.computeBoundingBox();
        textGeo.center();
        
        // Slow down rotation speeds
        textMesh.userData = {
            orbitRadius: innerRadius,
            orbitAngle: angle,
            rotationSpeed: (Math.random() * 0.005 + 0.002) * (1 + (1 - speedFactor)), // Reduced from 0.01
            selfRotationX: (Math.random() - 0.5) * 0.05 + 0.01, // Reduced from 0.1
            selfRotationY: (Math.random() - 0.5) * 0.05 + 0.01,
            selfRotationZ: (Math.random() - 0.5) * 0.05 + 0.01,
            ringRotationSpeed: Math.random() * 0.01 + 0.005, // Reduced from 0.02
            initialRotation: {
                x: Math.random() * Math.PI * 2,
                y: Math.random() * Math.PI * 2,
                z: Math.random() * Math.PI * 2
            }
        };
        
        // Set initial random rotation
        textMesh.rotation.x = textMesh.userData.initialRotation.x;
        textMesh.rotation.y = textMesh.userData.initialRotation.y;
        textMesh.rotation.z = textMesh.userData.initialRotation.z;
        
        group.add(textMesh);
    }

    // Add initializeCharacters function
    function initializeCharacters() {
        rings.forEach((ringGroup, ringIndex) => {
            // Reduce base count significantly
            const baseCount = 300; // Reduced from 400 to 150
            const reductionFactor = 1 - (ringIndex * 0.07); // Increased reduction per ring (from 0.1 to 0.15)
            const characterCount = Math.max(50, Math.floor(baseCount * reductionFactor)); // Reduced minimum from 200 to 50
            
            if (loadedFonts && loadedFonts.default) {
                for(let i = 0; i < characterCount; i++) {
                    createRandomCharacter(loadedFonts.default, baseRadii[ringIndex], ringIndex, ringGroup);
                }
                alphabetGroups.push(ringGroup);
            } else {
                console.error('Font not available for character creation');
            }
        });
    }

    // Modified initialization sequence with better checks
    async function init() {
        createRings3D();
        try {
            console.log('Loading font...');
            loadedFonts = await loadFonts();
            
            if (!loadedFonts || !loadedFonts.default) {
                throw new Error('Font not loaded correctly');
            }

            console.log('Font verified, creating characters...');
            initializeCharacters();
            console.log('Initialization complete');
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }

    // Start the animation
    init();

    // Enhanced animate function for better performance
    function animate() {
        requestAnimationFrame(animate);
        tornadoTime += 0.015; // Reduced from 0.02 to 0.015

        // Add global rotation angle
        const globalRotationSpeed = 0.003; // Reduced from 0.004
        const globalRotation = tornadoTime * globalRotationSpeed;

        // Update ring characters with global rotation
        alphabetGroups.forEach((group) => {
            group.children.forEach((char) => {
                // Ensure all characters rotate
                const userData = char.userData;
                
                // Ring rotation
                userData.orbitAngle = (userData.orbitAngle || 0) + (userData.ringRotationSpeed || 0.01);
                const radius = userData.orbitRadius * (1 + Math.sin(tornadoTime) * 0.1);
                const combinedAngle = userData.orbitAngle + globalRotation;
                
                // Update position
                char.position.x = radius * Math.cos(combinedAngle);
                char.position.z = radius * Math.sin(combinedAngle);
                
                // Self rotation
                char.rotation.x += userData.selfRotationX;
                char.rotation.y += userData.selfRotationY;
                char.rotation.z += userData.selfRotationZ;
            });
        });

        // Only apply rotation and tilt
        rings.forEach((ring) => {
            ring.rotation.z = Math.sin(tornadoTime) * THREE.MathUtils.degToRad(10);
        });

        // Remove scene rotation since we now have global character rotation
        // scene.rotation.y += 0.001; // Comment out or remove this line

        // Modified camera movement for lower perspective
        camera.position.x = Math.sin(tornadoTime * 0.15) * 0.5;
        camera.position.y = 0.5 + Math.sin(tornadoTime * 0.3) * 0.15; // Lower base height and smaller oscillation
        camera.lookAt(new THREE.Vector3(
            0,
            1.5 + Math.sin(tornadoTime * 0.2) * 0.1, // Slightly dynamic look-at point
            0
        ));

        // Left-right arc movement and tilt rings toward camera
        rings.forEach((ringGroup, index) => {
            ringGroup.position.x = Math.sin(tornadoTime * 3 + ringGroup.userData.arcPhase) * 0.3; // Reduced from 0.6 to 0.3
            ringGroup.rotation.x = Math.sin(tornadoTime * 3 + index) * THREE.MathUtils.degToRad(7); // Reduced from 10 to 7
            ringGroup.rotation.y = Math.cos(tornadoTime * 3 + index) * THREE.MathUtils.degToRad(10); // Reduced from 15 to 10
        });

        renderer.render(scene, camera);
    }
    animate();

    // Add window resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function createRings3D() {
        rings.length = 0;
        let currentY = 2;
        const spacing = 0.14; // Decreased ring gap for tighter spacing
        for (let i = 0; i < baseRadii.length; i++) {
            // Create a group for each ring
            const ringGroup = new THREE.Group();
            const topRadius = baseRadii[i];
            const bottomRadius = (i < baseRadii.length - 1) ? baseRadii[i + 1] : baseRadii[i]; // Ensure last ring has a valid radius
            const height = 0.5; // Adjusted height for more compact rings
            
            // Create a cylinder that connects this ring to the next
            const ringGeo = new THREE.CylinderGeometry(
                topRadius,    // Top radius (current ring)
                bottomRadius, // Bottom radius (next ring)
                height,      // Height of cylinder segment
                32,         // Radial segments
                1,          // Height segments
                true        // Open-ended cylinder
            );
            
            const ringMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.0 // Set opacity to 0 to make rings invisible
            });
            
            const ring3D = new THREE.Mesh(ringGeo, ringMat);
            ring3D.visible = false; // Hide the cylinder mesh but keep it for collision detection
            
            ringGroup.add(ring3D);
            ringGroup.position.y = currentY - (height / 3);
            ringGroup.position.x = 0;
            ringGroup.userData.arcPhase = i * 0.3;
            rings.push(ringGroup);
            scene.add(ringGroup);
            currentY -= spacing;
        }
    }

    // Function to calculate tornado radius based on y-coordinate
    function calculateTornadoRadius(y) {
        // Clamp y within the tornado height
        const clampedY = THREE.MathUtils.clamp(y, rings[rings.length - 1].position.y, rings[0].position.y);
        
        // Determine the index of the ring below the current y
        for (let i = 0; i < rings.length; i++) {
            if (clampedY >= rings[i].position.y) {
                if (i === 0) return baseRadii[0];
                const y1 = rings[i - 1].position.y;
                const y2 = rings[i].position.y;
                const r1 = baseRadii[i - 1];
                const r2 = baseRadii[i];
                const t = (clampedY - y2) / (y1 - y2);
                return THREE.MathUtils.lerp(r2, r1, t);
            }
        }
        return baseRadii[baseRadii.length - 1];
    }

}

// Remove the separate start function since we're handling it in init
export { initTornadoAnimation };
window.initTornadoAnimation = initTornadoAnimation;
