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

app.controller('ProjectListCtrl', function($scope, ProjectManager, Background) {
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
});

// app.controller('DebugCtrl', function($scope, Background) {
//   $scope.debug = true;
//   $scope.expand = false;
//   $scope.tracker = [];
//   $scope.windows = {};

//   $scope.flip = function() {
//     $scope.expand = !$scope.expand;
//   };

//   // Background.timesummary(function(tracker) {
//   //   $scope.tracker = tracker;
//   // });
//   // Background.windows(function(windows) {
//   //   $scope.windows = windows;
//   // });
// });

