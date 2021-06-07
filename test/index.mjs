import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { inspect } from 'util'

import decimal from '../src/index.mjs'

test('construction', () => {
  assert.is(decimal(12.34).toString(), '12.34', 'implied precision from number')

  assert.is(
    decimal('12.340').toString(),
    '12.340',
    'explicit precision from string'
  )

  assert.is(decimal('12.34').toString(), '12.34', 'min precision from string')

  const x = decimal(12.34)
  assert.is(decimal(x), x, 'pre-converted passed thru')

  assert.is(decimal([12340n, 3]).toString(), '12.340', 'constructed from tuple')
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
  assert.is(
    decimal('12.345')
      .precision(3)
      .toString(),
    '12.345',
    'no change in precision'
  )

  assert.is(
    decimal(12.34)
      .precision(3)
      .toString(),
    '12.340',
    'increase precision'
  )

  assert.is(
    decimal(12.345)
      .precision(2)
      .toString(),
    '12.35',
    'decrease precision and round up'
  )

  assert.is(
    decimal(12.345)
      .precision(1)
      .toString(),
    '12.3',
    'decrease precision and no rounding'
  )

  assert.is(
    decimal(12.345)
      .precision(2)
      .precision(1)
      .toString(),
    '12.4',
    'decrease and round up twice'
  )

  assert.is(
    decimal('-1.2345')
      .precision(3)
      .toString(),
    '-1.235',
    'negative round away from zero'
  )

  assert.is(
    decimal('-1.2345')
      .precision(2)
      .toString(),
    '-1.23',
    'negative no rounding'
  )
})

test('add', () => {
  assert.is(
    decimal(12.34)
      .add('34.567')
      .toString(),
    '46.907',
    'add with larger precision'
  )

  assert.is(
    decimal(12.345)
      .add('34.5')
      .toString(),
    '46.845',
    'add with smaller precision'
  )
})

test('sub', () => {
  assert.is(
    decimal(67.89)
      .sub('12.345')
      .toString(),
    '55.545',
    'sub with larger precision'
  )

  assert.is(
    decimal(56.789)
      .sub('23.4')
      .toString(),
    '33.389',
    'sub with smaller precision'
  )
})

test('mul', () => {
  assert.is(
    decimal('12.34')
      .mul('3.7')
      .toString(),
    '45.66'
  )
})

test('div', () => {
  assert.is(
    decimal(87.65)
      .div(2.7)
      .toString(),
    '32.46'
  )

  assert.is(
    decimal('-87.65')
      .div(2.7)
      .toString(),
    '-32.46'
  )

  assert.is(
    decimal('87.65')
      .div('-2.7')
      .toString(),
    '-32.46'
  )

  assert.is(
    decimal('-87.65')
      .div('-2.7')
      .toString(),
    '32.46'
  )

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

test('cmp', () => {
  assert.is(
    decimal('1.23').cmp('1.231'),
    -1,
    'compare with larger decimal of greater precision'
  )
  assert.is(
    decimal('1.23').cmp('1.229'),
    1,
    'compare with smaller decimal of greater precision'
  )
  assert.is(
    decimal('1.23').cmp('1.230'),
    0,
    'compare with same decimal of greater precision'
  )
  assert.is(
    decimal('1.23').cmp('1.3'),
    -1,
    'compare with larger decimal of smaller precision'
  )
  assert.is(
    decimal('1.23').cmp('1.2'),
    1,
    'compare with smaller decimal of smaller precision'
  )
  assert.is(
    decimal('1.230').cmp('1.23'),
    0,
    'compare with same decimal of smaller precision'
  )
})

test('eq', () => {
  assert.is(
    decimal('1.23').eq('1.230'),
    true,
    'compare with same decimal of larger precision'
  )
  assert.is(
    decimal('1.23').eq('1.220'),
    false,
    'compare with different decimal of larger precision'
  )
  assert.is(
    decimal('1.230').eq('1.23'),
    true,
    'compare with same decimal of smaller precision'
  )
  assert.is(
    decimal('1.230').eq('1.22'),
    false,
    'compare with different decimal of smaller precision'
  )
})

test.run()
