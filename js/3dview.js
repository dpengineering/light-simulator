(function(angular, THREE) {
    var module = angular.module('simulator.lsview', []);
    module.directive('lsView', function() { return {link: lsView}; });
    function lsView($scope, elem, attrs) {
        var WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight,
            scene = new THREE.Scene(),
            // preserveDrawingBuffer lets us read pixels back for the screenshot button.
            renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true}),
            camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 20000),
            controls;
        renderer.setSize(WIDTH, HEIGHT);
        renderer.setFaceCulling(THREE.CullFaceNone);
        elem.append(renderer.domElement);

        camera.position.set(-4, 6, 0);
        scene.add(camera);

        window.addEventListener("resize", refreshCanvasSize);
        $scope.$watch("coding", refreshCanvasSize, true);

        renderer.setClearColor(0xaaaaaa, 1);

        var light = new THREE.PointLight(0xffffff);
        light.position.set(-10, 10, -10);
        light.intensity = 0.5;
        scene.add(light);

        var baseGeom = new THREE.CubeGeometry(4, 2, 4);
        var baseMat = new THREE.MeshPhongMaterial({color: 0xffffff});
        var base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(0, -1, 0);
        scene.add(base);

        function refreshCanvasSize() {
            if ($scope.coding) {
                $("#glcanvas").addClass("half");
            } else {
                $("#glcanvas").removeClass("half");
            }
            var WIDTH = window.innerWidth / ($scope.coding ? 2 : 1),
                HEIGHT = window.innerHeight;
            renderer.setSize(WIDTH, HEIGHT);
            camera.aspect = WIDTH / HEIGHT;
            camera.updateProjectionMatrix();
        }

        /*
        var tableGeom = new THREE.CubeGeometry(8, 1, 12);
        var tableMat = new THREE.MeshPhongMaterial({color: 0xD2B48C});
        var table = new THREE.Mesh(tableGeom, tableMat);
        table.position.set(0, -2.5, 0);
        scene.add(table);
        */

        controls = new THREE.OrbitControls(camera, renderer.domElement);

        var rodsThree = [], polesThree = [];
        function designChange() {
            rodsThree.forEach(function(r) { scene.remove(r); });
            rodsThree = [];
            polesThree.forEach(function(p) { scene.remove(p); });
            polesThree = [];

            var poles = $scope.designs[$scope.design].poles;
            for (var i in poles) {
                var pole = poles[i];
                // Yes, I switched the order. No, I don't know why.
                var x0 = pole.pos[1] + 2, y0 = pole.pos[0] + 2;

                if ($scope.renderPoles) {
                    var geom = new THREE.CylinderGeometry(0.05, 0.05, 1, 32, 1, false);
                    var material = new THREE.MeshLambertMaterial({color: 0x000000});
                    var mesh = new THREE.Mesh(geom, material);
                    mesh.position.set(x0, 1 / 2, y0);
                    scene.add(mesh);
                    polesThree.push(mesh);
                }

                pole.rods.forEach(function(rod) {
                    var angle = -rod.theta * Math.PI / 180 + Math.PI / 2;
                    var x = x0 + rod.r * Math.cos(angle),
                        y = y0 + rod.r * Math.sin(angle),
                        height = rod.height;
                    var geom = new THREE.CylinderGeometry(0.125, 0.125, height, 32, 1, false);
                    var b = (i in $scope.pins) ? $scope.pins[i] : 255;
                    var material = makeMaterial(rod.color, b);
                    var mesh = new THREE.Mesh(geom, material);
                    mesh.position.set(x, height / 2 + 0.01, y);
                    mesh.color = rod.color;
                    scene.add(mesh);
                    rodsThree.push(mesh);
                    if ($scope.renderPoles) {
                        var lineMat = new THREE.LineBasicMaterial({color: 0x00ff00});
                        var lineGeom = new THREE.Geometry();
                        lineGeom.vertices.push(new THREE.Vector3(x0, 0.01, y0));
                        lineGeom.vertices.push(new THREE.Vector3(x, 0.01, y));
                        var line = new THREE.Line(lineGeom, lineMat);
                        scene.add(line);
                        polesThree.push(line);
                    }
                });
            }
        }
        $scope.$watch('designs', designChange, true);
        $scope.$watch('design', designChange, true);
        $scope.$watch('renderPoles', designChange, true);
        $scope.$watch('pins', function(pins) {
            for (var i in pins) {
                var rod = rodsThree[i];
                rod.material = makeMaterial(rod.color, pins[i]);
            }
        }, true);

        // Capture just the WebGL sculpture, cropping off the toolbox column on
        // the left. The toolbox is HTML overlaid on the canvas, so it is never
        // part of the pixel buffer; we only need to trim its width away.
        var TOOLBOX_WIDTH = 400; // px, matches #edit-rods / #edit-rods-heading
        $scope.screenshot = function() {
            var canvas = renderer.domElement;
            // Convert the CSS toolbox width into drawing-buffer pixels (handles HiDPI).
            var scale = canvas.width / (canvas.clientWidth || canvas.width);
            var sx = Math.round(TOOLBOX_WIDTH * scale);
            var sw = canvas.width - sx,
                sh = canvas.height;
            if (sw <= 0) { sx = 0; sw = canvas.width; }

            var out = document.createElement('canvas');
            out.width = sw;
            out.height = sh;
            out.getContext('2d').drawImage(canvas, sx, 0, sw, sh, 0, 0, sw, sh);

            var name = $scope.designs[$scope.design].name || "sculpture";
            out.toBlob(function(blob) { saveAs(blob, name + ".png"); });
        };

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
            controls.update();
        }
        animate();
    }

    function makeMaterial(color, brightness) {
        return new THREE.MeshLambertMaterial({color: 0xffffff,
                                              transparent: true,
                                              opacity: 0.35,
                                              combine: THREE.MixOperation,
                                              reflectivity: 0.25,
                                              refractionRatio: 0.5,
                                              emissive: colorToHex(color, brightness)});
    }

    function colorToHex(c, b) {
        var b = b !== undefined ? b : 255;
        switch (c) {
        case 'R':
            return (b << 16);
        case 'G':
            return (b << 8);
        case 'B':
            return b;
        case 'Y':
            return (b << 16) | (b << 8);
        case 'O':
            return (b << 16) | ((b/2) << 8);
        case 'W':
            return (b << 16) | (b << 8) | b;
        default:
            return 0x000000;
        }
    }
})(angular, THREE);
