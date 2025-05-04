function initTornadoAnimation() {
    // Replace purple shade generator with full color spectrum generator
    const generateRichColor = () => {
        // Create color variations using HSL for better control
        const hue = Math.random(); // Full spectrum of hues (0-1)
        const saturation = THREE.MathUtils.lerp(0.7, 1, Math.random()); // High saturation
        const lightness = THREE.MathUtils.lerp(0.4, 0.8, Math.random()); // Moderate to high lightness
        return new THREE.Color().setHSL(hue, saturation, lightness);
    };

    // Color palettes for purple and white
    const colorPalettes = {
        purpleShades: () => {
            const hue = 0.75; // Hue for purple
            const saturation = THREE.MathUtils.lerp(0.5, 1, Math.random()); // Varying saturation for different shades
            const lightness = THREE.MathUtils.lerp(0.3, 0.7, Math.random()); // Varying lightness
            return new THREE.Color().setHSL(hue, saturation, lightness);
        },
        white: () => {
            return new THREE.Color(0xffffff);
        }
    };

    // Replace getCharacterColor function
    const getCharacterColor = () => {
        // Select random palette type
        const paletteTypes = Object.keys(colorPalettes);
        const randomPalette = paletteTypes[Math.floor(Math.random() * paletteTypes.length)];
        
        // 70% chance of purple shade, 30% white
        const rand = Math.random();
        if (rand < 0.7) { // 70% chance of purple shade
            return colorPalettes.purpleShades();
        } else {
            return colorPalettes.white(); // 30% chance of white
        }
    };

    // Maintain separate character sets
    const characterSets = {
        latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', // Removed all special characters and punctuation
        persian: 'آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیءأؤإئ۰۱۲۳۴۵۶۷۸۹', // Removed symbols and punctuation
        hebrew: 'אבגדהוזחטיכךלמםנןסעפףצץקרשתּבּגּדּכּפּתּוֹבֿכֿפֿשׁשׂ0123456789', // Removed symbols and punctuation
        chinese: '的一是不了人我在有他这为之大来以个中上们时你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学着样年见开些还情没日都知道种手多问很0123456789', // No symbols
        japanese: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789', // No symbols
        korean: '가나다라마바사아자차카타파하갸냐댜랴먀뱌샤야쟈챠캬탸퍄햐거너더러머버서어저처커터퍼허교뇨료묘뵤쇼요죠쵸쿄튜표효0123456789', // No symbols
        arabic: 'ابتثجحخدذرزسشصضطظعغفقکلمنهوي0123456789', // Removed punctuation
        thai: 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮฤฦะัาำิีึืุูเแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛0123456789' // Removed symbols and punctuation
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
        // Original ring sizes
        // 4.5, 4.0,     // Top rings (widest)
        // 3.3, 2.7,     // Upper middle rings
        // 2.1, 1.5,     // Lower middle rings
        // 1.0, 0.6      // Bottom rings (smallest)

        // Updated ring sizes (more rings for greater depth)
        1.9, 1.6,     // Top rings (further reduced by 0.3 each)
        1.4, 1.2,     // Upper middle rings (reduced)
        1.0, 0.9,     // Middle rings
        0.8, 0.7,     // Lower middle rings
        0.6, 0.4      // Bottom rings (smallest, unchanged)
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

    // Adjust camera position to be lower and change the viewing angle to hide gaps
    camera.position.set(0, 2, 8); // Reduced Z from 10 to 8 to move closer
    camera.lookAt(new THREE.Vector3(0, 0.5, 0)); // Look slightly above the center

    // Simplify to use only default font URL
    const fontUrl = 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json';
    let defaultFont = null;

    // Simplified font loading
    async function loadFonts() {
        const loader = new THREE.FontLoader();
        return new Promise((resolve, reject) => {
            loader.load(fontUrl, 
                (font) => {
                    defaultFont = font;
                    resolve();
                },
                undefined,
                reject
            );
        });
    }

    // Simplify getFontForChar to always return default font
    function getFontForChar(char) {
        return defaultFont;
    }

    // Modified getScript to handle all character types
    function getScript(char) {
        return 'default';
    }

    // Add the missing helper function
    function createRandomCharacter(_, radius, ringIndex, group) {
        const char = getRandomBalancedChar();
        const angle = Math.random() * Math.PI * 2;
        
        // Improved radius distribution to fill gaps
        let innerRadius;
        const distribution = Math.random();
        if (distribution < 0.4) {
            // Characters near the outer ring
            innerRadius = radius * (0.85 + Math.random() * 0.15);
        } else if (distribution < 0.7) {
            // Characters in the middle
            innerRadius = radius * (0.6 + Math.random() * 0.25);
        } else {
            // Characters in the inner area
            innerRadius = radius * (Math.random() * 0.6);
        }

        // Adjust size based on character script
        let baseSize = (Math.random() * 0.05 + 0.06) * 1.9; // Increase size multiplier to 1.2
        if (/[\u4E00-\u9FFF]/.test(char)) {  // Chinese
            baseSize *= 0.8;  // Reduced from 0.9
        } else if (/[\u0600-\u06FF]/.test(char)) {  // Persian/Arabic
            baseSize *= 0.9;  // Reduced from 1.1
        } else if (/[\u0900-\u097F]/.test(char)) {  // Devanagari
            baseSize *= 0.85;  // Reduced from 1.0
        } else if (/[\u0E00-\u0E7F]/.test(char)) {  // Thai
            baseSize *= 0.8;  // Reduced from 0.95
        }

        const textGeo = new THREE.TextGeometry(char, {
            font: defaultFont,
            size: baseSize,
            height: 0.01, // Reduced from 0.02
            curveSegments: 2,  // Reduced from 3
            bevelEnabled: false
        });
        const textMat = new THREE.MeshBasicMaterial({ 
            color: getCharacterColor(), // Use getCharacterColor function
            transparent: true,
            opacity: Math.random() * 0.4 + 0.6 // Increase opacity range for better visibility
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
        
        textMesh.userData = {
            orbitRadius: innerRadius,
            orbitAngle: angle,
            rotationSpeed: (Math.random() * 0.01 + 0.005) * (1 + (1 - speedFactor)),
            // Increased rotation speeds and guaranteed minimum
            selfRotationX: (Math.random() - 0.5) * 0.1 + 0.02,
            selfRotationY: (Math.random() - 0.5) * 0.1 + 0.02,
            selfRotationZ: (Math.random() - 0.5) * 0.1 + 0.02,
            ringRotationSpeed: Math.random() * 0.02 + 0.01,
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

    // Load font first, then create characters
    function initializeCharacters() {
        // Use already-created ring groups
        rings.forEach((ringGroup, ringIndex) => {
            // Add characters directly to ringGroup
            const baseCount = 200; // Reduced from 540 by 30%
            const reductionFactor = 1 - (ringIndex * 0.08); // 8% reduction per ring
            const characterCount = Math.max(100, Math.floor(baseCount * reductionFactor)); // Reduced minimum from 300 to 210
            
            for(let i = 0; i < characterCount; i++) {
                createRandomCharacter(null, baseRadii[ringIndex], ringIndex, ringGroup);
            }
            alphabetGroups.push(ringGroup);
        });
    }

    // Modified initialization sequence
    async function init() {
        createRings3D();
        try {
            await loadFonts();
            if (!defaultFont) {
                throw new Error('Font failed to load');
            }
            initializeCharacters();
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
                char.rotation.x += userData.selfRotationX * 0.5; // Slow down rotation speed
                char.rotation.y += userData.selfRotationY * 0.5;
                char.rotation.z += userData.selfRotationZ * 0.5;
            });
        });

        // Only apply rotation and tilt
        rings.forEach((ring) => {
            ring.rotation.z = Math.sin(tornadoTime) * THREE.MathUtils.degToRad(10);
        });

        // Remove scene rotation since we now have global character rotation
        // scene.rotation.y += 0.001; // Comment out or remove this line

        // Add slight camera movement with higher position
        camera.position.x = Math.sin(tornadoTime * 0.08) * 0.3; // Reduced frequency and amplitude
        camera.position.y = 4 + Math.sin(tornadoTime * 0.15) * 0.1; // Reduced frequency and amplitude
        camera.lookAt(new THREE.Vector3(0, 1, 0)); // Look at slightly higher point

        // Left-right arc movement and tilt rings toward camera
        rings.forEach((ringGroup, index) => {
            ringGroup.position.x = Math.sin(tornadoTime * 2 + ringGroup.userData.arcPhase) * 0.4; // Reduced frequency and amplitude
            ringGroup.rotation.x = Math.sin(tornadoTime * 2 + index) * THREE.MathUtils.degToRad(6); // Reduced rotation angle
            ringGroup.rotation.y = Math.cos(tornadoTime * 2 + index) * THREE.MathUtils.degToRad(10); // Reduced rotation angle
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
        const spacing = 0.12; // Decreased ring gap for tighter spacing
        for (let i = 0; i < baseRadii.length; i++) {
            // Create a group for each ring
            const ringGroup = new THREE.Group();
            const topRadius = baseRadii[i];
            const bottomRadius = (i < baseRadii.length - 1) ? baseRadii[i + 1] : baseRadii[i]; // Ensure last ring has a valid radius
            const height = 0.5; // Adjusted height for more compact rings
            const ringGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 32, 1, true);
            const ringMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.0 // Set opacity to 0 to make rings invisible
            });
            const ring3D = new THREE.Mesh(ringGeo, ringMat);
            // Alternatively, you can hide the ring entirely
            ring3D.visible = false; // Hide the ring to remove gray object from viewport
            ringGroup.add(ring3D);
            ringGroup.position.y = currentY - (height / 2);
            ringGroup.position.x = 0; // Remove horizontal offset, keep center at 0
            ringGroup.userData.arcPhase = i * 0.5; // Store a unique phase for left-right arc
            rings.push(ringGroup);
            scene.add(ringGroup);
            currentY -= spacing; // Overlapping achieved by height > spacing
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

// Make sure function is globally available
window.initTornadoAnimation = initTornadoAnimation;
