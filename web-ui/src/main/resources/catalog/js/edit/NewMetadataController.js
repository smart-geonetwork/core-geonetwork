(function() {
  goog.provide('gn_new_metadata_controller');

  goog.require('gn_catalog_service');

  var module = angular.module('gn_new_metadata_controller',
      ['gn_catalog_service']);

  /**
   * Controller to create new metadata record.
   */
  module.controller('GnNewMetadataController', [
    '$scope', '$routeParams', '$http', '$rootScope', '$translate', '$compile',
    'gnSearchManagerService',
    'gnUtilityService',
    'gnMetadataManager',
    function($scope, $routeParams, $http, $rootScope, $translate, $compile,
            gnSearchManagerService, 
            gnUtilityService,
            gnMetadataManager) {

      $scope.isTemplate = false;
      $scope.hasTemplates = true;
      $scope.mdList = null;

      // A map of icon to use for each types
      var icons = {
        featureCatalog: 'fa-table',
        service: 'fa-cog',
        map: 'fa-globe',
        staticMap: 'fa-globe',
        dataset: 'fa-file',
        project: 'fa-clipboard',
				dataAccessAgreement: 'fa-check-square-o',
				datasetAgreement: 'fa-check-square-o',
				provenanceDocument: 'fa-file'
      };

      $scope.$watchCollection('groups', function() {
        if (!angular.isUndefined($scope.groups)) {
          if ($scope.groups.length == 1) {
            $scope.ownerGroup = $scope.groups[0]['@id'];
          }
        }
      });

      // List of record type to not take into account
      // Could be avoided if a new index field is created FIXME ?
      var dataTypesToExclude = ['staticMap'];
      var defaultType = 'dataset';
      var unknownType = 'unknownType';
      var fullPrivileges = true;

      $scope.getTypeIcon = function(type) {
        return icons[type] || 'fa-square-o';
      };

      var init = function() {
        $http.get('info@json?type=groups&profile=Editor', {cache: true}).
          success(function(data) {
         		$scope.groups = data !== 'null' ? data.groups : null;
          });

        if ($routeParams.id) {
          gnMetadataManager.create(
              $routeParams.id,
              $routeParams.group,
              fullPrivileges,
              $routeParams.template);
        } else {

          // Metadata creation could be on a template
          // or by duplicating an existing record
          var query = '';
          if ($routeParams.childOf || $routeParams.from) {
            query = '_id=' + ($routeParams.childOf || $routeParams.from);
          } else {
            query = 'template=y';
          }


          // TODO: Better handling of lots of templates
          gnSearchManagerService.search('qi@json?' +
              query + '&fast=index&from=1&to=200&_isTemplate=y or n').
              then(function(data) {

                $scope.mdList = data;
                $scope.hasTemplates = data.count != '0';
								// set error message according to the type of operation
								if (!$scope.hasTemplates && ($routeParams.childOf || $routeParams.from)) {
									$scope.templateError = 'createMetadataNotAvailable';
								} else {
									$scope.templateError = 'noTemplatesAvailable';
								}

                var types = [];
                // TODO: A faster option, could be to rely on facet type
                // But it may not be available
                for (var i = 0; i < data.metadata.length; i++) {
                  var type = data.metadata[i].type || unknownType;
                  if (type instanceof Array) {
                    for (var j = 0; j < type.length; j++) {
                      if ($.inArray(type[j], dataTypesToExclude) === -1 &&
                          $.inArray(type[j], types) === -1) {
                        types.push(type[j]);
                      }
                    }
                  } else if ($.inArray(type, dataTypesToExclude) === -1 &&
                      $.inArray(type, types) === -1) {
                    types.push(type);
                  }
                }
                types.sort();
                $scope.mdTypes = types;

                // Select the default one or the first one
                if (defaultType && $.inArray(defaultType, $scope.mdTypes) > -1) {
                  $scope.getTemplateNamesByType(defaultType);
                } else if ($scope.mdTypes[0]) {
                  $scope.getTemplateNamesByType($scope.mdTypes[0]);
                } else {
                  // No templates available ?
                }
              });
        }
      };

      /**
       * Get all the templates for a given type.
       * Will put this list into $scope.tpls variable.
       */
      $scope.getTemplateNamesByType = function(type) {
        var tpls = [];
        for (var i = 0; i < $scope.mdList.metadata.length; i++) {
          var mdType = $scope.mdList.metadata[i].type || unknownType;
          if (mdType instanceof Array) {
            if (mdType.indexOf(type) >= 0) {
              tpls.push($scope.mdList.metadata[i]);
            }
          } else if (mdType == type) {
            tpls.push($scope.mdList.metadata[i]);
          }
        }

        // Sort template list
        function compare(a, b) {
          if (a.title < b.title)
            return -1;
          if (a.title > b.title)
            return 1;
          return 0;
        }
        tpls.sort(compare);

        $scope.tpls = tpls;
        $scope.activeType = type;
        $scope.setActiveTpl($scope.tpls[0]);
        return false;
      };

      $scope.setActiveTpl = function(tpl) {
        $scope.activeTpl = tpl;
      };


      if ($routeParams.childOf) {
        $scope.title = $translate('createChildOf');
      } else if ($routeParams.from) {
        $scope.title = $translate('createCopyOf');
      } else {
        $scope.title = $translate('createA');
      }

      $scope.createNewMetadata = function(isPublic) {
        gnMetadataManager.create(
            $scope.activeTpl['geonet:info'].id,
            $scope.ownerGroup,
            isPublic || false,
            $scope.isTemplate,
            $routeParams.childOf ? true : false
        );
      };

      init();
    }
  ]);
})();
