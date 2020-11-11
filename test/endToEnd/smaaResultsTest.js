'use strict';
module.exports = {
  'SMAA results': smaaResults
};

const loginService = require('./util/loginService');
const workspaceService = require('./util/workspaceService');

function smaaResults(browser) {
  const title =
    'Antidepressants - single study B/R analysis (Tervonen et al, Stat Med, 2011)';

  loginService.login(browser);
  workspaceService.cleanList(browser);
  workspaceService
    .addExample(browser, title)
    .click('#workspace-0')
    .waitForElementVisible('#workspace-title')
    .click('#smaa-tab')
    .waitForElementVisible('#smaa-measurements-header')
    .waitForElementVisible('#smaa-table')
    .waitForElementVisible('#rank-plot')
    .waitForElementVisible('#rank-table')
    .waitForElementVisible('#central-weights-plot')
    .waitForElementVisible('#central-weights-table');

  const measurementElementId = '#criterion-0-alternative-0-measurement';
  const centralWightElementId = '#alternative-0-criterion-0-central-weight';
  browser.assert.containsText(measurementElementId, '36.8');
  browser.assert.containsText(centralWightElementId, '0.187');

  browser.assert.containsText('#alternative-0-rank-1', '0.743');
  browser.assert.containsText('#alternative-1-rank-1', '0.175');
  browser.assert.containsText('#alternative-2-rank-1', '0.082');

  browser.click('#logo');
  workspaceService.deleteFromList(browser, 0).end();
}
