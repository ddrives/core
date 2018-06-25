var tape = require('tape')
var tmp = require('temporary-directory')
var create = require('./helpers/create')
var ddrive = require('..')

tape('dDrive Core Tests: dwRem storage', function (t) {
  var vault = create()

  vault.ready(function () {
    t.ok(vault.metadata.writable, 'vault metadata is writable')
    t.ok(vault.content.writable, 'vault content is writable')
    t.end()
  })
})

tape('dDrive Core Tests: dir storage with resume', function (t) {
  tmp(function (err, dir, cleanup) {
    t.ifError(err)
    var vault = ddrive(dir)
    vault.ready(function () {
      t.ok(vault.metadata.writable, 'vault metadata is writable')
      t.ok(vault.content.writable, 'vault content is writable')
      t.same(vault.version, 0, 'vault has version 0')
      vault.close(function (err) {
        t.ifError(err)

        var vault2 = ddrive(dir)
        vault2.ready(function () {
          t.ok(vault2.metadata.writable, 'vault2 metadata is writable')
          t.ok(vault2.content.writable, 'vault2 content is writable')
          t.same(vault2.version, 0, 'vault has version 0')

          cleanup(function (err) {
            t.ifError(err)
            t.end()
          })
        })
      })
    })
  })
})

tape('dDrive Core Tests: dir storage for non-writable vault', function (t) {
  var src = create()
  src.ready(function () {
    tmp(function (err, dir, cleanup) {
      t.ifError(err)

      var fork = ddrive(dir, src.key)
      fork.on('content', function () {
        t.ok(!fork.metadata.writable, 'fork metadata not writable')
        t.ok(!fork.content.writable, 'fork content not writable')
        t.same(fork.key, src.key, 'keys match')
        cleanup(function (err) {
          t.ifError(err)
          t.end()
        })
      })

      var stream = fork.replicate()
      stream.pipe(src.replicate()).pipe(stream)
    })
  })
})

tape('dDrive Core Tests: dir storage without permissions emits error', function (t) {
  t.plan(1)
  var vault = ddrive('/')
  vault.on('error', function (err) {
    t.ok(err, 'got error')
  })
})

tape('dDrive Core Tests: write and read (thin)', function (t) {
  t.plan(3)

  tmp(function (err, dir, cleanup) {
    t.ifError(err)
    var vault = ddrive(dir)
    vault.on('ready', function () {
      var fork = create(vault.key, {thin: true})
      fork.on('ready', function () {
        vault.writeFile('/hello.txt', 'world', function (err) {
          t.error(err, 'no error')
          var stream = fork.replicate()
          stream.pipe(vault.replicate()).pipe(stream)
          var readStream = fork.createReadStream('/hello.txt')
          readStream.on('error', function (err) {
            t.error(err, 'no error')
          })
          readStream.on('data', function (data) {
            t.same(data.toString(), 'world')
          })
        })
      })
    })
  })
})

tape('dDrive Core Tests: thin read/write two files', function (t) {
  var vault = create()
  vault.on('ready', function () {
    var fork = create(vault.key, {thin: true})
    vault.writeFile('/hello.txt', 'world', function (err) {
      t.error(err, 'no error')
      vault.writeFile('/hello2.txt', 'world', function (err) {
        t.error(err, 'no error')
        var stream = fork.replicate()
        stream.pipe(vault.replicate()).pipe(stream)
        fork.metadata.update(start)
      })
    })

    function start () {
      fork.stat('/hello.txt', function (err, stat) {
        t.error(err, 'no error')
        t.ok(stat, 'has stat')
        fork.readFile('/hello.txt', function (err, data) {
          t.error(err, 'no error')
          t.same(data.toString(), 'world', 'data ok')
          fork.stat('/hello2.txt', function (err, stat) {
            t.error(err, 'no error')
            t.ok(stat, 'has stat')
            fork.readFile('/hello2.txt', function (err, data) {
              t.error(err, 'no error')
              t.same(data.toString(), 'world', 'data ok')
              t.end()
            })
          })
        })
      })
    }
  })
})
