var simulator = angular.module("simulator", ["firebase", "angularLocalStorage",
                                             "simulator.lsview", "simulator.codeview"]);

var URL = "https://dpealight.firebaseio.com";

simulator.controller('SimCtrl', ['$scope', '$rootScope', '$firebase',
                                    '$firebaseSimpleLogin', 'storage', SimCtrl]);
function SimCtrl($scope, $rootScope, $firebase, $firebaseSimpleLogin, storage) {
    $scope.renderPoles = true;
    storage.bind($scope, 'designs', {defaultValue: {}});
    startWatch($scope);
    $scope.loginObj = $firebaseSimpleLogin(new Firebase(URL));
    $scope.pins = {};
    $scope.auth = {
        authenticated: false,
        user: null
    };

    $rootScope.$on("$firebaseSimpleLogin:login", function(e, user) {
        $scope.auth = {
            authenticated: true,
            user: user.id.replace(',', '.')
        };
        var userRef = new Firebase(URL + "/" + user.uid);
        $firebase(userRef.child('designs')).$bind($scope, 'designs').then(function() {
            $scope.setDesign();
        });
    });
    $rootScope.$on("$firebaseSimpleLogin:logout", function(e) {
        $scope.auth = {
            authenticated: false,
            user: null
        };
        storage.bind($scope, 'designs');
        $scope.setDesign();
    });
}

function startWatch($scope) {
    // Declaring variables and defining default variables with thousandths precision.
    poleDefaultX = -2;
    precisePoleDefaultX = poleDefaultX.toFixed(3);
    poleDefaultY = -2;
    precisePoleDefaultY = poleDefaultY.toFixed(3);
    defaultHeight = 3;
    preciseDefaultHeight = defaultHeight.toFixed(3);
    defaultRadius = 0;
    preciseDefaultRadius = defaultRadius.toFixed(3);

    $scope.removeDesign = function(design) {
        delete $scope.designs[design];
        if (len($scope.designs) == 0) {
            $scope.newDesign();
        } else {
            $scope.design = getFirstKey($scope.designs);
        }
    };
    $scope.newDesign = function() {
        $scope.designs["New Design"] = {name: "New Design", programs: {}, poles:
                                        [{rods: [{r: preciseDefaultRadius, theta: 0, height: preciseDefaultHeight, color: 'W'}], pos: [-2, -2]}]};
        $scope.design = "New Design";
    };
    $scope.setDesign = function(name) {
        if (typeof name !== 'undefined') {
            $scope.design = name;
        } else {
            if (len($scope.designs) == 0) {
                $scope.newDesign();
            } else {
                $scope.design = getFirstKey($scope.designs);
            }
        }
    };
    $scope.addPole = function() {
        var design = $scope.designs[$scope.design];

        // Limiting student to 4 poles at maximum (as per the project constraints).
        if (design.poles.length >= 4) {
            window.alert("Please design your light sculpture with 4 or fewer poles, as per the project constraints!")
            return
        }

        console.log(design.poles);
        design.poles.push({rods: [{r: preciseDefaultRadius, theta: 0, height: preciseDefaultHeight, color: 'W'}], pos: [-2, -2]});
    };
    $scope.deletePole = function(pole) {
        var poles = $scope.designs[$scope.design].poles;
        poles.splice(poles.indexOf(pole), 1);
    };
    $scope.addRod = function(pole) {
        pole.rods.push({r: preciseDefaultRadius, theta: 0, height: preciseDefaultHeight, color: 'W'});
    };
    $scope.deleteRod = function(pole, rod) {
        var poles = $scope.designs[$scope.design].poles,
            pole = poles[poles.indexOf(pole)];
        pole.rods.splice(pole.rods.indexOf(rod), 1);
    };
    $scope.setDesign();
    $scope.$watch("designs[design].name", function(n) {
        if (typeof n !== 'undefined' && $scope.design !== n) {
            $scope.designs[n] = $scope.designs[$scope.design];
            delete $scope.designs[$scope.design];
            $scope.design = n;
        }
    });
}

simulator.directive('parseFloat', function() { return { require: 'ngModel', link: parseFloatDir }; });
function parseFloatDir($scope, elem, attrs, modelCtrl) {
    var parseFloatOrZero = function(val) {
        var parsed = parseFloat(val);
        if (isNaN(parsed)) {
            return 0.0;
        } else {
            return parsed;
        }
    };
    modelCtrl.$parsers.push(parseFloatOrZero);
}

function len(o) {
    var count = 0;
    for (var k in o) {
        if (o.hasOwnProperty(k)) {
            count++;
        }
    }
    return count;
}

function getFirstKey(o) {
    for (var k in o) {
        if (o.hasOwnProperty(k) && k.charAt(0) != '$') {
            return k;
        }
    }
    return null;
}
