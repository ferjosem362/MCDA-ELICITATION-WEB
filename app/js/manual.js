'use strict';
define([
  'bowser',
  'jquery',
  'vanilla-back-to-top',
  'css/mcda-drugis.css',
  'font-awesome/css/font-awesome.min.css'
], function(bowser, $, scrollToTop) {
  window.bowser = bowser;
  window.sharedHtml = require('../manual/shared.html');
  document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('mcda-shared-content').innerHTML = window.sharedHtml;

    var tocbot = require('tocbot');
    tocbot.init({
      // Where to render the table of contents.
      tocSelector: '#mcda-shared-toc',
      // Where to grab the headings to build the table of contents.
      contentSelector: '.js-toc-content',
      // Which headings to grab inside of the contentSelector element.
      headingSelector: 'h2, h3, h4',
      collapseDepth: 4
    });
    scrollToTop.addBackToTop();
    if (window.location.hash) {
      setTimeout(function() { // wait for reflows to finish
        $('html, body').animate({
          scrollTop: $(window.location.hash).offset().top
        }, 1000);
      }, 1);
    }
  });
});