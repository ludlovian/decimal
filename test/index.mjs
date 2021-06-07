import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { inspect } from 'util'

import decimal from '../src/index.mjs'

test('construction', () => {
  assert.equal(decimal(12.34).tuple, [1234, 2], 'implied precision from number')

  assert.equal(
    decimal(12.34, { minPrecision: 3 }).tuple,
    [12340, 3],
    'min precision from number'
  )

  assert.equal(
    decimal('12.340').tuple,
    [12340, 3],
    'implied precision from string'
  )

  assert.equal(
    decimal('12.34', { minPrecision: 3 }).tuple,
    [12340, 3],
    'min precision from string'
  )

  const x = decimal(12.34)
  assert.is(decimal(x), x, 'pre-converted passed thru')

  assert.equal(decimal([12340, 3]).tuple, [12340, 3])
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

  assert.throws(() => decimal('0.123456789123456', { maxPrecision: 15 }))
  assert.throws(() => decimal(12.34).precision(15))
})

test('representation', () => {
  const x = decimal(12.34).precision(3)

  assert.is(x.number, 12.34)
  assert.is(x.toString(), '12.340')
  assert.is(x.neg().toString(), '-12.340')
  assert.is(x.toJSON(), x.toString())

  assert.is(inspect(x), 'Decimal { 12.340 }')

  assert.is(x.tuple[1], 3)
})

test('change precision', () => {
  assert.equal(
    decimal(12.34).precision(3).tuple,
    [12340, 3],
    'increase precision'
  )

  assert.equal(
    decimal(12.345).precision(2).tuple,
    [1235, 2],
    'decrease precision'
  )
})

test('add', () => {
  assert.equal(
    decimal(12.34).add('34.567').tuple,
    [46907, 3],
    'add with larger precision'
  )

  assert.equal(
    decimal(12.345).add('34.5').tuple,
    [46845, 3],
    'add with smaller precision'
  )
})

test('sub', () => {
  assert.equal(
    decimal(67.89).sub('12.345').tuple,
    [55545, 3],
    'sub with larger precision'
  )

  assert.equal(
    decimal(56.789).sub('23.4').tuple,
    [33389, 3],
    'sub with smaller precision'
  )
})

test('mul', () => {
  assert.equal(decimal(12.34).mul(3.7).tuple, [4566, 2])
})

test('div', () => {
  assert.equal(decimal(87.65).div(2.7).tuple, [3246, 2])

  assert.throws(() => decimal(2).div('0'))
})

test('abs  & neg', () => {
  assert.is(decimal(-12.34).abs().number, 12.34)
  assert.is(decimal(12.34).abs().number, 12.34)

  assert.is(decimal(12.34).neg().number, -12.34)
  assert.is(decimal(-12.34).neg().number, 12.34)
})

test.run()
