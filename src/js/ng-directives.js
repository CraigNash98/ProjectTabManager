/*
Copyright 2012 Eiji Kitamura

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eiji Kitamura (agektmr@gmail.com)
*/
'use strict';

app.directive('projectList', function(ProjectManager, Background) {
  return {
    restrict: 'C',
    controller: function($scope) {
      $scope.setActiveProjectId = function(id) {
        $scope.activeProjectId = id;
      },

      $scope.reload = function() {
        $scope.$emit('start-loading');
        Background.update(true, function() {
          $scope.projects = ProjectManager.projects;
          $scope.$apply();
          $scope.$emit('end-loading');
        });
      };

      $scope.set_dialog_title = function(title) {
        $scope.dialog_title = title;
      };

      $scope.openBookmarks = function() {
        var projectId = $scope.activeProjectId === '0' ? null : $scope.activeProjectId;
        ProjectManager.openBookmarkEditWindow(projectId);
      };

      $scope.openSummary = function() {
        chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#summary')});
      };

      $scope.openOptions = function() {
        chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#options')});
      };

      // TODO: merge active window and active project id into active project?
      $scope.activeWindowId   = ProjectManager.getActiveWindowId();
      var activeProject       = ProjectManager.getActiveProject();

      $scope.setActiveProjectId(activeProject && activeProject.id || '0');

      var start = window.performance.now();
      Background.update(false, function() {
        $scope.projects = ProjectManager.projects;
        if (!$scope.$$phase) $scope.$apply();
        console.log('loading time:', window.performance.now() - start);
      });
    },
    link: function(scope, elem, attr) {
    }
  }
});

app.directive('dialog', function() {
  return {
    restrict: 'E',
    link: function(scope, elem, attr) {
    }
  }
});

app.directive('project', function(ProjectManager, Background, $window) {
  return {
    restrict: 'E',
    templateUrl: 'project.html',
    controller: function($scope) {
      $scope.title = $scope.project.title;
      $scope.active = $scope.project.id === $scope.activeProjectId ? true: false;
      $scope.expand = $scope.project.winId === $scope.activeWindowId ? true : false;
      $scope.hover = false;
      $scope.editing = false;

      // TODO: deprecate this method
      $scope.save = function() {
        // $scope.$emit('start-loading');
        Background.createProject($scope.project.title, function(project) {
          // $scope.project = ProjectManager.project;
          $scope.setActiveProjectId(project.id);
          // $scope.$emit('end-loading');
          $scope.reload(true);
        });
      };

      $scope.associate = function() {
        var winId = ProjectManager.getActiveWindowId();
        $scope.project.associateWindow(winId);
        $scope.setActiveProjectId($scope.project.id);
        $scope.reload(true);
      };

      $scope.flip = function() {
        $scope.expand = !$scope.expand;
      };

      $scope.open = function() {
        $scope.project.open();
      };

      $scope.toggle_editing = function() {
        if ($scope.editing && $scope.project.title !== $scope.title) {
          $scope.$emit('start-loading');
          Background.renameProject($scope.project.id, $scope.title, function() {
            $scope.$emit('end-loading');
            $scope.reload(true);
          });
        }
        $scope.editing = !$scope.editing;
      };

      $scope.remove = function() {
        // $scope.$emit('start-loading');
        Background.removeProject($scope.project.id, function() {
          // $scope.$emit('end-loading');
          $scope.reload(true);
        });
      };
    },
    link: function(scope, elem, attr) {
      if (scope.active) {
        scope.expand = true;
      }

      elem.bind('keydown', function(e) {
        // Avoid shotcut on input element
        if (e.target.nodeName == 'INPUT' && e.keyCode === 13) {
          e.target.disabled = true;
          scope.save();
        } else {
          switch (e.keyCode) {
            case 13:
              scope.open();
              break;
            case 39:
              scope.expand = true;
              scope.$apply();
              break;
            case 37:
              scope.expand = false;
              scope.$apply();
              break;
            default:
              return;
          }
          e.preventDefault();
        }
      });

      elem.bind('mouseover', function(e) {
        scope.hover = true;
        scope.$apply();
      });

      elem.bind('mouseleave', function(e) {
        scope.hover = false;
        scope.$apply();
      });
    }
  }
});

app.directive('bookmark', function() {
  return {
    restrict: 'E',
    templateUrl: 'bookmark.html',
    controller: function($scope) {
      $scope.open = function() {
        var tabId = $scope.field.tabId;
        // If tab id is not assigned
        if (!tabId) {
          // Open new project field
          chrome.tabs.create({url: $scope.field.url, active: true});
        } else {
          chrome.tabs.get(tabId, function(tab) {
            // If the project filed is not open yet
            if (!tab) {
              // Open new project field
              chrome.tabs.create({url: $scope.field.url, active: true});
            // If the project filed is already open
            } else {
              chrome.windows.get(tab.windowId, function(win) {
                if (!win.focused) {
                  // Move focus to the window
                  chrome.windows.update(tab.windowId, {focused:true});
                }
                // Activate open project field
                chrome.tabs.update(tabId, {active: true});
              });
            }
          });
        }
      };
    },
    link: function(scope, elem, attr) {
    }
  }
});

app.directive('reload', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      scope.$on('start-loading', function() {
        elem.addClass('loading');
      });
      scope.$on('end-loading', function() {
        elem.removeClass('loading');
      });
    }
  }
});

app.directive('star', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      attr.$set('bookmarked', !!scope.field.id);
      attr.$set('chrome-i18n', 'add:title');
      if (scope.project.id == 0) {
        elem.css('display', 'none');
      }
      elem.bind('click', function() {
        if (scope.field.id !== undefined) {
          scope.project.removeBookmark(scope.field.id, function() {
            scope.field.id = undefined;
            attr.$set('bookmarked', false);
            scope.$apply();
          });
        } else {
          scope.$emit('start-loading');
          scope.project.addBookmark(scope.field.tabId, function(bookmark) {
            scope.field.id = bookmark.id;
            attr.$set('bookmarked', true);
            scope.$emit('end-loading');
            scope.$apply();
          });
        }
      });
    }
  }
});

app.directive('projectName', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      scope.compositing = false;
      elem.bind('compositionstart', function(e) {
        scope.compositing = true;
      });
      elem.bind('compositionend', function(e) {
        scope.compositing = false;
      });
      elem.bind('keydown', function(e) {
        if (e.keyCode === 13 && !scope.compositing) {
          scope.toggle_editing();
        }
        e.stopPropagation();
      });
      elem.bind('blur', function(e) {
        scope.compositing = false;
        scope.toggle_editing();
      });
    }
  }
})

app.directive('edit', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      elem.bind('click', scope.toggle_editing);
      // elem.bind('click', function() {
      //   scope.set_dialog_title(scope.project.title);
      //   scope.dialog.showModal();
      // });
    }
  }
})

app.directive('pin', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      if (scope.active) {
        elem.remove();
      }
      elem.bind('click', scope.associate);
    }
  }
});

app.directive('chromeI18n', function() {
  var cache = {};
  return function(scope, element, attrs) {
    var params = attrs.chromeI18n.split(':'),
        key, name;
    if (params.length !== 2) return;
    key = params[0];
    name = params[1];
    cache[key] = cache[key] || chrome.i18n.getMessage(key);
    if (name == 'inner') {
      element.append(cache[key]);
    } else {
      attrs.$set(name, cache[key]);
    };
  };
});
