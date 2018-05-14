'use strict';
define(['lodash', 'angular'], function(_) {
  var dependencies = [];
  var ConstraintService = function() {
    var INTEGER = function(value, label) {
      if (value % 1 !== 0) {
        return label + ' must be integer';
      }
    };
    var DEFINED = function(value, label) {
      if (value === undefined || isNaN(value) || value === null) {
        return 'Invalid ' + label;
      }
    };
    var POSITIVE = function(value, label) {
      if (value < 0) {
        return label + ' must be positive';
      }
    };
    var NOT_NAN_OR_NULL = function(value, label) {
      if (isNaN(value) || value === null) {
        return 'Invalid ' + label;
      }
    };
    function defined() {
      return DEFINED;
    }
    function integer() {
      return INTEGER;
    }
    function positive() {
      return POSITIVE;
    }
    function notNaNOrNull() {
      return NOT_NAN_OR_NULL;
    }
    function belowOrEqualTo(belowWhat) {
      return function(value, label, parameters) {
        if (isFinite(belowWhat) && value > belowWhat) {
          return label + ' must be below or equal to ' + belowWhat;
        }
        if (!isFinite(belowWhat) && value > parameters[belowWhat]) {
          return label + ' must be below or equal to ' + parameters[belowWhat];
        }
      };
    }
    function above(aboveWhat) {
      return function(value, label) {
        if (value <= aboveWhat) {
          return label + ' must be above ' + aboveWhat;
        }
      };
    }
    function aboveOrEqualTo(aboveWhat) {
      return function(value, label, parameters) {
        if (isFinite(aboveWhat) && value < aboveWhat) {
          return label + ' must be above or equal to ' + aboveWhat;
        }
        if (!isFinite(aboveWhat) && value < parameters[aboveWhat]) {
          return label + ' must be above or equal to ' + parameters[aboveWhat];
        }
      };
    }

    return {
      defined: defined,
      integer: integer,
      positive: positive,
      belowOrEqualTo: belowOrEqualTo,
      above: above,
      aboveOrEqualTo: aboveOrEqualTo,
      notNaNOrNull: notNaNOrNull
    };
  };
  return dependencies.concat(ConstraintService);
});