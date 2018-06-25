var tape = require('tape')
var sodium = require('sodium-universal')
var create = require('./helpers/create')

tape('dDrive Core Tests: write and read', function (t) {
  var vault = create()

  vault.writeFile('/hello.txt', 'world', function (err) {
    t.error(err, 'no error')
    vault.readFile('/hello.txt', function (err, buf) {
      t.error(err, 'no error')
      t.same(buf, new Buffer('world'))
      t.end()
    })
  })
})

tape('dDrive Core Tests: write and read (2 parallel)', function (t) {
  t.plan(6)

  var vault = create()

  vault.writeFile('/hello.txt', 'world', function (err) {
    t.error(err, 'no error')
    vault.readFile('/hello.txt', function (err, buf) {
      t.error(err, 'no error')
      t.same(buf, new Buffer('world'))
    })
  })

  vault.writeFile('/world.txt', 'hello', function (err) {
    t.error(err, 'no error')
    vault.readFile('/world.txt', function (err, buf) {
      t.error(err, 'no error')
      t.same(buf, new Buffer('hello'))
    })
  })
})

tape('dDrive Core Tests: write and read (thin)', function (t) {
  t.plan(2)

  var vault = create()
  vault.on('ready', function () {
    var fork = create(vault.key, {thin: true})

    vault.writeFile('/hello.txt', 'world', function (err) {
      t.error(err, 'no error')
      var stream = fork.replicate()
      stream.pipe(vault.replicate()).pipe(stream)

      var readStream = fork.createReadStream('/hello.txt')
      readStream.on('data', function (data) {
        t.same(data.toString(), 'world')
      })
    })
  })
})

tape('dDrive Core Tests: write and unlink', function (t) {
  var vault = create()

  vault.writeFile('/hello.txt', 'world', function (err) {
    t.error(err, 'no error')
    vault.unlink('/hello.txt', function (err) {
      t.error(err, 'no error')
      vault.readFile('/hello.txt', function (err) {
        t.ok(err, 'had error')
        t.end()
      })
    })
  })
})

tape('dDrive Core Tests: root is always there', function (t) {
  var vault = create()

  vault.access('/', function (err) {
    t.error(err, 'no error')
    vault.readdir('/', function (err, list) {
      t.error(err, 'no error')
      t.same(list, [])
      t.end()
    })
  })
})

tape('dDrive Core Tests: owner is writable', function (t) {
  var vault = create()

  vault.on('ready', function () {
    t.ok(vault.writable)
    t.ok(vault.metadata.writable)
    t.ok(vault.content.writable)
    t.end()
  })
})

tape('dDrive Core Tests: provide keypair', function (t) {
  var publicKey = new Buffer(sodium.crypto_sign_PUBLICKEYBYTES)
  var secretKey = new Buffer(sodium.crypto_sign_SECRETKEYBYTES)

  sodium.crypto_sign_keypair(publicKey, secretKey)

  var vault = create(publicKey, {secretKey: secretKey})

  vault.on('ready', function () {
    t.ok(vault.writable)
    t.ok(vault.metadata.writable)
    t.ok(vault.content.writable)
    t.ok(publicKey.equals(vault.key))

    vault.writeFile('/hello.txt', 'world', function (err) {
      t.error(err, 'no error')
      vault.readFile('/hello.txt', function (err, buf) {
        t.error(err, 'no error')
        t.same(buf, new Buffer('world'))
        t.end()
      })
    })
  })
})

tape('dDrive Core Tests: download a version', function (t) {
  var src = create()
  src.on('ready', function () {
    t.ok(src.writable)
    t.ok(src.metadata.writable)
    t.ok(src.content.writable)
    src.writeFile('/first.txt', 'number 1', function (err) {
      t.error(err, 'no error')
      src.writeFile('/second.txt', 'number 2', function (err) {
        t.error(err, 'no error')
        src.writeFile('/third.txt', 'number 3', function (err) {
          t.error(err, 'no error')
          t.same(src.version, 3)
          testDownloadVersion()
        })
      })
    })
  })

  function testDownloadVersion () {
    var fork = create(src.key, { thin: true })
    fork.on('content', function () {
      t.same(fork.version, 3)
      fork.checkout(2).download(function (err) {
        t.error(err)
        fork.readFile('/second.txt', { cached: true }, function (err, content) {
          t.error(err, 'block not downloaded')
          t.same(content && content.toString(), 'number 2', 'content does not match')
          fork.readFile('/third.txt', { cached: true }, function (err, content) {
            t.same(err && err.message, 'Block not downloaded')
            t.end()
          })
        })
      })
    })
    var stream = fork.replicate()
    stream.pipe(src.replicate()).pipe(stream)
  }
})

tape('dDrive Core Tests: write and read, no cache', function (t) {
  var vault = create({
    metadataStorageCacheSize: 0,
    contentStorageCacheSize: 0,
    treeCacheSize: 0
  })

  vault.writeFile('/hello.txt', 'world', function (err) {
    t.error(err, 'no error')
    vault.readFile('/hello.txt', function (err, buf) {
      t.error(err, 'no error')
      t.same(buf, new Buffer('world'))
      t.end()
    })
  })
})
