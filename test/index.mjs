import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { inspect } from 'util'

import decimal from '../src/index.mjs'

function equal (dec, [d, p], desc) {
  assert.is(dec.tuple[0] === d && dec.tuple[1] === p, true, desc)
}

test('construction', () => {
  equal(decimal(12.34), [1234n, 2], 'implied precision from number')

  equal(decimal('12.340'), [12340n, 3], 'explicit precision from string')

  equal(decimal('12.34'), [1234n, 2], 'min precision from string')

  const x = decimal(12.34)
  assert.is(decimal(x), x, 'pre-converted passed thru')

  equal(decimal([12340n, 3]), [12340n, 3])
})

test('isDecimal', () => {
  assert.is(decimal.isDecimal(decimal(1)), true)
  assert.is(decimal.isDecimal({}), false)
})

test('errors in construction', () => {
  assert.throws(() => decimal({}))
  assert.throws(() => decimal(null))
  assert.throws(() => decimal(undefined))
  assert.throws(() => decimal(new Date()))
  assert.throws(() => decimal({ foo: 'bar' }))
  assert.throws(() => decimal('foo'))
  assert.throws(() => decimal('789foo'))
  assert.throws(() => decimal(1e21))
  assert.throws(() => decimal(1e-10))
})

test('representation', () => {
  const x = decimal(12.34).precision(3)

  assert.is(x.toNumber(), 12.34)
  assert.is(x.toString(), '12.340')
  assert.is(x.neg().toString(), '-12.340')
  assert.is(x.toJSON(), x.toString())

  assert.is(inspect(x), 'Decimal { 12.340 }')

  assert.is(x.tuple[1], 3)
})

test('change precision', () => {
  equal(decimal(12.34).precision(3), [12340n, 3], 'increase precision')

  equal(
    decimal(12.345).precision(2),
    [1235n, 2],
    'decrease precision and round up'
  )

  equal(
    decimal(12.345).precision(1),
    [123n, 1],
    'decrease precision and no rounding'
  )

  equal(
    decimal(12.345)
      .precision(2)
      .precision(1),
    [124n, 1],
    'decrease and round up twice'
  )

  equal(
    decimal('-1.2345').precision(3),
    [-1235n, 3],
    'negative round away from zero'
  )

  equal(decimal('-1.2345').precision(2), [-123n, 2], 'negative no rounding')
})

test('add', () => {
  equal(decimal(12.34).add('34.567'), [46907n, 3], 'add with larger precision')

  equal(decimal(12.345).add('34.5'), [46845n, 3], 'add with smaller precision')
})

test('sub', () => {
  equal(decimal(67.89).sub('12.345'), [55545n, 3], 'sub with larger precision')

  equal(decimal(56.789).sub('23.4'), [33389n, 3], 'sub with smaller precision')
})

test('mul', () => {
  equal(decimal('12.34').mul('3.7'), [4566n, 2])
})

test('div', () => {
  equal(decimal(87.65).div(2.7), [3246n, 2])

  equal(decimal('-87.65').div(2.7), [-3246n, 2])

  equal(decimal('87.65').div('-2.7'), [-3246n, 2])

  equal(decimal('-87.65').div('-2.7'), [3246n, 2])

  assert.throws(() => decimal(2).div('0'))
})

test('abs  & neg', () => {
  assert.is(
    decimal(-12.34)
      .abs()
      .toNumber(),
    12.34
  )
  assert.is(
    decimal(12.34)
      .abs()
      .toNumber(),
    12.34
  )

  assert.is(
    decimal(12.34)
      .neg()
      .toNumber(),
    -12.34
  )
  assert.is(
    decimal(-12.34)
      .neg()
      .toNumber(),
    12.34
  )
})

test.run()
