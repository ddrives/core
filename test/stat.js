var tape = require('tape')
var create = require('./helpers/create')

var mask = 511 // 0b111111111

tape('dDrive Core Tests: Stat file', function (t) {
  var vault = create()

  vault.writeFile('/foo', 'bar', {mode: 438}, function (err) {
    t.error(err, 'no error')
    vault.stat('/foo', function (err, st) {
      t.error(err, 'no error')
      t.same(st.isDirectory(), false)
      t.same(st.isFile(), true)
      t.same(st.mode & mask, 438)
      t.same(st.size, 3)
      t.same(st.offset, 0)
      t.end()
    })
  })
})

tape('dDrive Core Tests: Stat dir', function (t) {
  var vault = create()

  vault.mkdir('/foo', function (err) {
    t.error(err, 'no error')
    vault.stat('/foo', function (err, st) {
      t.error(err, 'no error')
      t.same(st.isDirectory(), true)
      t.same(st.isFile(), false)
      t.same(st.mode & mask, 493)
      t.same(st.offset, 0)
      t.end()
    })
  })
})
