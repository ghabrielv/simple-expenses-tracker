var app = angular.module('expensesApp', ['ngRoute']);

var helpers = {
    dateObjToString: function (dateObj) {
        var year, month, day;
        year = String(dateObj.getFullYear());
        month = String(dateObj.getMonth() + 1);
        if (month.length == 1) {
            month = "0" + month;
        }
        day = String(dateObj.getDate());
        if (day.length == 1) {
            day = "0" + day;
        }
        return year + "-" + month + "-" + day;
    },
    stringToDateObj: function (string) {
        return new Date(string.substring(0,4), string.substring(5,7) - 1, string.substring(8,10));
    }
};

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'views/expenses.html',
        controller: 'ExpensesViewController'
    })
    .when('/expenses', {
        templateUrl: 'views/expenses.html',
        controller: 'ExpensesViewController'
    })
    .when('/expense/new', {
        templateUrl: 'views/expenseForm.html',
        controller: 'ExpenseViewController'
    })
    .when('/expense/edit/:id', {
        templateUrl: 'views/expenseForm.html',
        controller: 'ExpenseViewController'
    })
    .otherwise({
        redirectTo: '/'
    });
}]);

app.factory('Expenses', function ($http) {
    var service = {};

    service.entries = [];

    $http.get('data/get_all.json').success(function (data) {
        service.entries = data;
        service.entries.forEach(function (element) {
            element.date = helpers.stringToDateObj(element.date);
        });
    }).error(function (data, status) {
        console.log('Status: ' + status + ' Data: ' + data);
    });

    service.getById = function (id) {
        return _.find(service.entries, function (entry) {
            return entry.id == id
        });
    };

    service.save = function (entry) {
        var toUpdate = service.getById(entry.id);
        if (toUpdate) {
            $http.post('data/update.json', entry).success(function (data) {
                if (data.success) {
                    _.extend(toUpdate, entry);
                }
            }).error(function (data, status) {
                console.log('Status: ' + status + ' Data: ' + data);
            });
        } else {
            $http.post('data/create.json', entry).success(function (data) {
                entry.id = data.newId;
                service.entries.push(entry);
            }).error(function (data, status) {
                console.log('Status: ' + status + ' Data: ' + data);
            });
        }
    };

    service.remove = function (entry) {
        $http.post('data/delete.json', {id: entry.id}).success(function (data) {
            if (data.success) {
                service.entries = _.reject(service.entries, function (element) {
                    return element.id == entry.id
                });
            }
        }).error(function(data, status){
            console.log('Status: ' + status + ' Data: ' + data);
        });
    };

    return service;
});

app.controller('ExpensesViewController', ['$scope', 'Expenses', function ($scope, Expenses) {
    $scope.expenses = Expenses.entries;

    $scope.remove = function (expense) {
        Expenses.remove(expense);
    };

    $scope.$watch(function () {
        return Expenses.entries;
    }, function (entries) {
        $scope.expenses = entries;
    });
}]);

app.controller('ExpenseViewController', ['$scope', '$routeParams', '$location', 'Expenses', function ($scope, $routeParams, $location, Expenses) {
    if (!$routeParams.id) {
        $scope.expense = {
            date: new Date()
        };
    } else {
        $scope.expense = _.clone(Expenses.getById($routeParams.id));
    }

    $scope.save = function () {
        Expenses.save($scope.expense);
        $location.path('/');
    };
}]);

app.directive('gvExpense', function () {
    return {
        restrict: 'E',
        templateUrl: 'views/expense.html'
    }
})