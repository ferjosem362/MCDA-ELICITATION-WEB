'use strict';

const loginService = require('./util/loginService');
const errorService = require('./util/errorService');
const util = require('./util/util');

const closeModalButton = '//*[@id="close-modal-button"]';
const deleteWorkspaceButton = '//*[@id="delete-workspace-0"]';

module.exports = {
  beforeEach: function(browser) {
    browser.resizeWindow(1366, 728);
    loginService.login(browser);
  },

  afterEach: function(browser) {
    browser.waitForElementVisible('//*[@id="empty-workspace-message"]');
    errorService.isErrorBarHidden(browser);
    browser.useCss().end();
  },

  'Cancel adding a workspace': function(browser) {
    var actionButtonPath = '//*[@id="create-workspace-button"]';
    var cancelButtonPath = closeModalButton;
    browser
      .useXpath()
      .click(actionButtonPath)
      .click(cancelButtonPath);
  },

  'Cancel deleting a workspace': function(browser) {
    browser
      .useXpath()
      .click('//*[@id="create-workspace-button"]')
      .click('//*[@id="add-workspace-button"]')
      .waitForElementVisible('//*[@id="workspace-title"]');

    util.delayedClick(browser, '//*[@id="logo"]', deleteWorkspaceButton, util.xpathSelectorType);

    browser.click(deleteWorkspaceButton)
      .click(closeModalButton)
      .assert.containsText('//*[@id="workspace-0"]', 'Antidepressants - single study B/R analysis (Tervonen et al, Stat Med, 2011)')
      .click(deleteWorkspaceButton)
      .click('//*[@id="delete-workspace-confirm-button"]');
  }
};
