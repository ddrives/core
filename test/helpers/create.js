var dwrem = require('@dwcore/rem')
var ddrive = require('../../')

module.exports = function (key, opts) {
  return ddrive(dwrem, key, opts)
}
