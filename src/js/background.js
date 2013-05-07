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

var bookmarkManager,
    sessionManager,
    projectManager;

chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'update') {
    chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#history')});
  } else if (details.reason === 'install') {
    chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#help')});
  }
});

var config = new Config(function() {
  bookmarkManager = new BookmarkManager(config, function() {
    sessionManager = new SessionManager(config, function() {
      projectManager = new ProjectManager(config);
      projectManager.update(true);
    });
  });
});
