(function() {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.innerWidth < 768;
    var isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 1;

    function hasWebGL() {
        try {
            var c = document.createElement('canvas');
            return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
        } catch(e) { return false; }
    }

    if (prefersReducedMotion) {
        document.body.classList.add('reduce-motion');
        initScrollReveal();
        initTechTree();
        initListReveal();
        return;
    }

    if (!isMobile && hasWebGL() && !isLowEnd) {
        initHero3D();
        initCardTilt();
    }
    initScrollReveal();
    initTechTree();
    initCTAParticles();
    initStatsGrid();
    initListReveal();

    /* ================================================================
       THREE.JS HERO — Wireframe globe + diplomatic arcs + star field
       ================================================================ */
    function initHero3D() {
        if (isMobile || typeof THREE === 'undefined') return;

        var hero = document.querySelector('.hero');
        var canvas = document.getElementById('hero-3d-canvas');
        if (!hero || !canvas) return;

        var w = hero.offsetWidth;
        var h = hero.offsetHeight;

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
        camera.position.z = 4.5;

        var renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        var globeGroup = new THREE.Group();
        scene.add(globeGroup);

        /* Globe wireframe sphere */
        var globeGeo = new THREE.IcosahedronGeometry(1.6, 4);
        var globeMat = new THREE.MeshBasicMaterial({
            color: 0xD5B654,
            wireframe: true,
            transparent: true,
            opacity: 0.06
        });
        var globe = new THREE.Mesh(globeGeo, globeMat);
        globeGroup.add(globe);

        /* Second inner sphere for depth */
        var innerGeo = new THREE.IcosahedronGeometry(1.55, 2);
        var innerMat = new THREE.MeshBasicMaterial({
            color: 0xD5B654,
            wireframe: true,
            transparent: true,
            opacity: 0.03
        });
        globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

        /* Nation nodes on globe surface */
        var nationCount = isMobile ? 20 : 40;
        var nodePositions = [];
        var nodeGeo = new THREE.SphereGeometry(0.025, 6, 6);
        var nodeMat = new THREE.MeshBasicMaterial({ color: 0xD5B654 });

        for (var i = 0; i < nationCount; i++) {
            var phi = Math.acos(1 - 2 * (i + 0.5) / nationCount);
            var theta = Math.PI * (1 + Math.sqrt(5)) * i;
            var r = 1.62;
            var x = r * Math.sin(phi) * Math.cos(theta);
            var y = r * Math.sin(phi) * Math.sin(theta);
            var z = r * Math.cos(phi);

            var node = new THREE.Mesh(nodeGeo, nodeMat);
            node.position.set(x, y, z);
            globeGroup.add(node);
            nodePositions.push(new THREE.Vector3(x, y, z));
        }

        /* Diplomatic arcs between random pairs */
        var arcCount = isMobile ? 6 : 14;
        var arcs = [];
        var usedPairs = {};

        for (var a = 0; a < arcCount; a++) {
            var from, to, key;
            do {
                from = Math.floor(Math.random() * nationCount);
                to = Math.floor(Math.random() * nationCount);
                key = Math.min(from, to) + '-' + Math.max(from, to);
            } while (from === to || usedPairs[key]);
            usedPairs[key] = true;

            var start = nodePositions[from];
            var end = nodePositions[to];
            var mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            mid.normalize().multiplyScalar(1.6 + start.distanceTo(end) * 0.35);

            var curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            var points = curve.getPoints(24);
            var arcGeo = new THREE.BufferGeometry().setFromPoints(points);
            var arcMat = new THREE.LineBasicMaterial({
                color: 0xD5B654,
                transparent: true,
                opacity: 0.12 + Math.random() * 0.1
            });
            var arc = new THREE.Line(arcGeo, arcMat);
            globeGroup.add(arc);
            arcs.push({ mesh: arc, mat: arcMat, baseOpacity: arcMat.opacity });
        }

        /* Background star field */
        var starCount = isMobile ? 200 : 500;
        var starPositions = new Float32Array(starCount * 3);
        for (var s = 0; s < starCount; s++) {
            starPositions[s * 3] = (Math.random() - 0.5) * 20;
            starPositions[s * 3 + 1] = (Math.random() - 0.5) * 20;
            starPositions[s * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        var starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        var starMat = new THREE.PointsMaterial({
            color: 0xD5B654,
            size: 0.02,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });
        scene.add(new THREE.Points(starGeo, starMat));

        /* Floating dust particles closer to globe */
        var dustCount = isMobile ? 50 : 150;
        var dustPos = new Float32Array(dustCount * 3);
        for (var d = 0; d < dustCount; d++) {
            var dr = 2 + Math.random() * 2;
            var dphi = Math.random() * Math.PI * 2;
            var dtheta = Math.random() * Math.PI;
            dustPos[d * 3] = dr * Math.sin(dtheta) * Math.cos(dphi);
            dustPos[d * 3 + 1] = dr * Math.sin(dtheta) * Math.sin(dphi);
            dustPos[d * 3 + 2] = dr * Math.cos(dtheta);
        }
        var dustGeo = new THREE.BufferGeometry();
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
        var dustMat = new THREE.PointsMaterial({
            color: 0xD5B654,
            size: 0.015,
            transparent: true,
            opacity: 0.25,
            sizeAttenuation: true
        });
        var dust = new THREE.Points(dustGeo, dustMat);
        scene.add(dust);

        /* Mouse parallax */
        var mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', function(e) {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
        });

        /* Animation loop */
        var running = true;
        var clock = new THREE.Clock();

        function animate() {
            if (!running) return;
            requestAnimationFrame(animate);

            var elapsed = clock.getElapsedTime();

            globeGroup.rotation.y = elapsed * 0.04;
            globeGroup.rotation.x = 0.15 + mouseY * 0.3;
            globeGroup.position.x += (mouseX * 0.5 - globeGroup.position.x) * 0.02;

            dust.rotation.y = elapsed * 0.02;
            dust.rotation.x = elapsed * 0.01;

            for (var i = 0; i < arcs.length; i++) {
                arcs[i].mat.opacity = arcs[i].baseOpacity + Math.sin(elapsed * 0.8 + i * 1.7) * 0.06;
            }

            renderer.render(scene, camera);
        }
        animate();

        /* Visibility: pause when hero not visible */
        var heroObserver = new IntersectionObserver(function(entries) {
            running = entries[0].isIntersecting;
            if (running) animate();
        }, { threshold: 0.05 });
        heroObserver.observe(hero);

        /* Resize */
        var resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                var nw = hero.offsetWidth;
                var nh = hero.offsetHeight;
                camera.aspect = nw / nh;
                camera.updateProjectionMatrix();
                renderer.setSize(nw, nh);
            }, 200);
        });
    }

    /* ================================================================
       SCROLL REVEAL — IntersectionObserver-based
       ================================================================ */
    function initScrollReveal() {
        var elements = document.querySelectorAll('[data-reveal]');
        if (!elements.length) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.01,
            rootMargin: '0px 0px -20px 0px'
        });

        elements.forEach(function(el) { observer.observe(el); });

        /* Section title underline animation */
        var titles = document.querySelectorAll('.section-title');
        var titleObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    titleObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        titles.forEach(function(t) { titleObserver.observe(t); });
    }

    /* ================================================================
       CARD TILT — Mouse-tracking 3D tilt on feature cards
       ================================================================ */
    function initCardTilt() {
        if (isMobile) return;

        var cards = document.querySelectorAll('.feature-card');
        cards.forEach(function(card) {
            var shine = card.querySelector('.card-shine');
            if (!shine) {
                shine = document.createElement('div');
                shine.className = 'card-shine';
                card.appendChild(shine);
            }

            card.addEventListener('mousemove', function(e) {
                var rect = card.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                var centerX = rect.width / 2;
                var centerY = rect.height / 2;
                var rotateX = ((y - centerY) / centerY) * -4;
                var rotateY = ((x - centerX) / centerX) * 4;

                card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-5px)';
                card.classList.add('tilt-active');

                shine.style.setProperty('--mouse-x', x + 'px');
                shine.style.setProperty('--mouse-y', y + 'px');
            });

            card.addEventListener('mouseleave', function() {
                card.style.transform = '';
                card.classList.remove('tilt-active');
            });
        });
    }

    /* ================================================================
       TECH TREE — Animated horizontal timeline with live API data
       ================================================================ */
    function initTechTree() {
        var section = document.querySelector('.tech-tree-section');
        if (!section) return;

        var fill = section.querySelector('.tech-tree-line-fill');
        var nodes = section.querySelectorAll('.tech-tree-node');
        if (!fill || !nodes.length) return;

        var totalNodes = nodes.length;
        var maxLevel = 7;

        console.log('[TechTree] Initializing with', totalNodes, 'nodes, default maxLevel:', maxLevel);

        fetch('https://api.projet-resurgence.fr/statistics/public-overview', { 
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
        })
            .then(function(res) { 
                console.log('[TechTree] Fetch response:', res.status, res.ok);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json(); 
            })
            .then(function(json) {
                console.log('[TechTree] API data:', json);
                if (json && json.success && json.data && typeof json.data.max_tech_level === 'number') {
                    maxLevel = Math.min(json.data.max_tech_level, totalNodes);
                    console.log('[TechTree] Using API maxLevel:', maxLevel);
                }
            })
            .catch(function(err) {
                console.warn('[TechTree] Fetch failed, using default:', err.message);
            })
            .finally(function() {
                console.log('[TechTree] Final maxLevel:', maxLevel, 'Fill width will be:', ((maxLevel - 1) / (totalNodes - 1) * 100) + '%');
                
                var observer = new IntersectionObserver(function(entries) {
                    if (!entries[0].isIntersecting) return;

                    nodes.forEach(function(node, i) {
                        setTimeout(function() {
                            node.classList.add('node-visible');
                            if (i < maxLevel) {
                                node.classList.add('node-active');
                            }
                            if (i === nodes.length - 1) {
                                var fillWidth = ((maxLevel - 1) / (totalNodes - 1) * 100);
                                fill.style.width = fillWidth + '%';
                                console.log('[TechTree] Applied fill width:', fillWidth + '%', 'for maxLevel:', maxLevel);
                            }
                        }, i * 120);
                    });

                    observer.unobserve(section);
                }, { threshold: 0.25 });

                observer.observe(section);
            });
    }

    /* ================================================================
       CTA PARTICLES — Auto-inject floating particles into any .cta
       ================================================================ */
    function initCTAParticles() {
        var ctas = document.querySelectorAll('.cta');
        ctas.forEach(function(cta) {
            if (cta.querySelector('.cta-particles')) return;
            var container = document.createElement('div');
            container.className = 'cta-particles';
            cta.insertBefore(container, cta.firstChild);

            for (var i = 0; i < 15; i++) {
                var p = document.createElement('div');
                p.className = 'cta-particle';
                p.style.left = Math.random() * 100 + '%';
                p.style.animationDuration = (4 + Math.random() * 6) + 's';
                p.style.animationDelay = Math.random() * 5 + 's';
                p.style.width = (2 + Math.random() * 2) + 'px';
                p.style.height = p.style.width;
                container.appendChild(p);
            }
        });
    }

    /* ================================================================
       STATS GRID — Background already handled by CSS
       ================================================================ */
    function initStatsGrid() {
        var stats = document.querySelector('.stats');
        if (!stats || stats.querySelector('.stats-grid-bg')) return;
        var bg = document.createElement('div');
        bg.className = 'stats-grid-bg';
        stats.insertBefore(bg, stats.firstChild);
    }

    /* ================================================================
       LIST REVEAL — Staggered reveal for list items
       ================================================================ */
    function initListReveal() {
        var lists = document.querySelectorAll('.comparison-list, .step-category ul');
        lists.forEach(function(list) {
            var items = list.querySelectorAll('li');
            var observer = new IntersectionObserver(function(entries) {
                if (!entries[0].isIntersecting) return;
                items.forEach(function(li, i) {
                    setTimeout(function() {
                        li.classList.add('revealed');
                    }, i * 80);
                });
                observer.unobserve(list);
            }, { threshold: 0.2 });
            observer.observe(list);
        });
    }

})();
