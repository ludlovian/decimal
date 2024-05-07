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

  assert.is(decimal(123n).toString(), '123', 'created from bigint')

  assert.is(decimal(123).toString(), '123', 'created from integer')

  const x = decimal(12.34)
  assert.is(decimal(x), x, 'pre-converted passed thru')
})

test('construction from parts', () => {
  assert.is(
    decimal.from({ digits: 123, precision: 1 }).toString(),
    '12.3',
    'created from digits and precision'
  )

  assert.is(
    decimal.from({ digits: 1234, factor: 100 }).toString(),
    '12.34',
    'created from digits and factor'
  )
})

test('extract parts', () => {
  const d = decimal('123.450')
  assert.is(d.digits, 123450n)
  assert.is(d.precision, 3)
  assert.is(d.factor, 1000n)
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
})

test('representation', () => {
  const x = decimal(12.34).withPrecision(3)

  assert.is(x.toNumber(), 12.34)
  assert.is(x.toString(), '12.340')
  assert.is(x.neg().toString(), '-12.340')
  assert.is(x.toJSON(), x.toString())

  assert.is(inspect(x), 'Decimal { 12.340 }')
})

test('change precision', () => {
  assert.is(
    decimal('12.345')
      .withPrecision(3)
      .toString(),
    '12.345',
    'no change in precision'
  )

  assert.is(
    decimal(12.34)
      .withPrecision(3)
      .toString(),
    '12.340',
    'increase precision'
  )

  assert.is(
    decimal(12.345)
      .withPrecision(2)
      .toString(),
    '12.35',
    'decrease precision and round up'
  )

  assert.is(
    decimal(12.345)
      .withPrecision(1)
      .toString(),
    '12.3',
    'decrease precision and no rounding'
  )

  assert.is(
    decimal(12.345)
      .withPrecision(2)
      .withPrecision(1)
      .toString(),
    '12.4',
    'decrease and round up twice'
  )

  assert.is(
    decimal('-1.2345')
      .withPrecision(3)
      .toString(),
    '-1.235',
    'negative round away from zero'
  )

  assert.is(
    decimal('-1.2345')
      .withPrecision(2)
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

test('normalise', () => {
  assert.is(
    decimal('1.23000')
      .normalise()
      .toString(),
    '1.23',
    'removes trailing zeros'
  )

  assert.is(
    decimal('-1.23000')
      .normalise()
      .toString(),
    '-1.23',
    'removes trailing zeros on negative number'
  )

  assert.is(
    decimal('1230.000')
      .normalise()
      .toString(),
    '1230',
    'does not remove zeros left of decimal point'
  )

  assert.is(
    decimal('0.00000')
      .normalise()
      .toString(),
    '0',
    'normlises zero'
  )
})

test('scientific', () => {
  assert.is(
    decimal(1.2345e-8).toString(),
    '0.000000012345',
    'Small scientific number'
  )

  assert.is(
    decimal(1.2345e21).toString(),
    '1234500000000000000000',
    'Big scientific number'
  )
})

test.run()
