(function() {
  goog.provide('gn_multiselect_directive');

  var module = angular.module('gn_multiselect_directive', []);

  /**
     * Provide 2 multiple select list and allow
     * selection of element by double click or
     * move to left/right button.
     *
     *
     * choices and selected MUST be object
     * with a getLabel method. The label will be
     * the value in the list.
     *
     * TODO: Add drag&drop
     */
  module.directive('gnMultiselect', ['$http', '$translate',
    function($http, $translate) {

      return {
        restrict: 'A',
        scope: {
          'selected': '=gnMultiselect',
          'choices': '=',
          'sortFn': '&',
          'labelProp': '@'  // Function or property
        },
        templateUrl: '../../catalog/components/common/multiselect/partials/' +
            'multiselect.html',
        link: function(scope, element, attrs) {

          var sortOnSelection = true;
          scope.currentSelectionLeft = [];
          scope.currentSelectionRight = [];

          /**
           * Return the label of the element
           * It could be a property of the object
           * or a custom function which build the label
           */
          scope.getLabel = function(e) {
            if (typeof(e[scope.labelProp]) === 'string') {
              return e[scope.labelProp];
            } else {
              return e[scope.labelProp]();
            }
          };
          /**
          * Select a single element or the list of currently
          * selected element.
          */
          scope.select = function(k) {
            var elementsToAdd = [];
            if (!k) {
              angular.forEach(scope.currentSelectionLeft, function(value) {
                elementsToAdd.push($.grep(scope.choices, function(n) {
                  return n[getLabelFn]() === value;
                })[0]);
              });
            } else {
              elementsToAdd.push(k);
            }

            angular.forEach(elementsToAdd, function(k) {
              scope.selected.push(k);
              scope.choices = $.grep(scope.choices, function(n) {
                return n !== k;
              });
            });

            if (sortOnSelection) {
              scope.selected.sort(scope.sortFn);
            }
          };


          scope.unselect = function(k) {
            var elementsToRemove = k ?
                [k[getLabelFn]()] : scope.currentSelectionRight;
            scope.selected = $.grep(scope.selected, function(n) {
              var toUnselect =
                  $.inArray(n[getLabelFn](), elementsToRemove) !== -1;
              if (toUnselect) {
                scope.choices.push(n);
              }
              return !toUnselect;
            });

            if (sortOnSelection) {
              scope.choices.sort(scope.sortFn);
            }
          };

        }
      };
    }]);
})();