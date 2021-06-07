import { inspect } from 'util'
const DIGS = Symbol('digits')
const PREC = Symbol('precision')

export default function decimal (number, opts = {}) {
  if (number instanceof Decimal) return number
  if (Array.isArray(number)) {
    const [digs, prec] = number
    return new Decimal(BigInt(digs), prec)
  }
  const [d, p] = parseNumber(number)
  return new Decimal(d, p)
}

decimal.isDecimal = function isDecimal (d) {
  return d instanceof Decimal
}

class Decimal {
  constructor (digs, prec) {
    Object.freeze(
      Object.defineProperties(this, {
        [DIGS]: { value: digs },
        [PREC]: { value: prec }
      })
    )
  }

  [inspect.custom] (depth, opts) {
    /* c8 ignore next */
    if (depth < 0) return opts.stylize('[Decimal]', 'number')
    return `Decimal { ${opts.stylize(this.toString(), 'number')} }`
  }

  get tuple () {
    return [this[DIGS], this[PREC]]
  }

  toNumber () {
    const factor = getFactor(this[PREC])
    return Number(this[DIGS]) / Number(factor)
  }

  toString () {
    const neg = this[DIGS] < 0n
    const p = this[PREC]
    const d = this[DIGS]
    let s = (neg ? -d : d).toString().padStart(p + 1, '0')
    if (p) s = s.slice(0, -p) + '.' + s.slice(-p)
    return neg ? '-' + s : s
  }

  toJSON () {
    return this.toString()
  }

  precision (p) {
    const prec = this[PREC]
    if (prec === p) return this
    if (p > prec) {
      const f = getFactor(p - prec)
      return new Decimal(this[DIGS] * f, p)
    } else {
      const f = getFactor(prec - p)
      return new Decimal(roundedDiv(this[DIGS], f), p)
    }
  }

  neg () {
    return new Decimal(-this[DIGS], this[PREC])
  }

  add (other) {
    let x = this
    let y = decimal(other)
    const xp = x[PREC]
    const yp = y[PREC]
    const p = xp > yp ? xp : yp
    x = x.precision(p)
    y = y.precision(p)
    return new Decimal(x[DIGS] + y[DIGS], p)
  }

  sub (other) {
    other = decimal(other)
    return this.add(decimal(other).neg())
  }

  mul (other) {
    // x*10^-a * y*10^-b = xy*10^-(a+b)
    const x = this
    const y = decimal(other)
    const p = x[PREC] + y[PREC]
    const d = x[DIGS] * y[DIGS]
    return new Decimal(d, p).precision(this[PREC])
  }

  div (other) {
    // x*10^-a / y*10^-b = (x/y)*10^-(a-b)
    const x = this
    const y = decimal(other)
    const d = roundedDiv(x[DIGS] * getFactor(y[PREC]), y[DIGS])
    return new Decimal(d, x[PREC])
  }

  abs () {
    if (this[DIGS] >= 0n) return this
    return new Decimal(-this[DIGS], this[PREC])
  }
}

const factors = []
function getFactor (n) {
  n = Math.floor(n)
  return n in factors ? factors[n] : (factors[n] = 10n ** BigInt(n))
}

const rgx = /^-?\d+(?:\.\d+)?$/
function parseNumber (x) {
  if (typeof x === 'number') {
    x = x.toString()
    if (!rgx.test(x)) throw new TypeError('Invalid number: ' + x)
  }
  if (typeof x === 'string') {
    const i = x.indexOf('.')
    if (i > -1) {
      x = x.replace('.', '')
      return [BigInt(x), x.length - i]
    } else {
      return [BigInt(x), 0]
    }
  }
  throw new TypeError('Invalid number: ' + x)
}

function roundedDiv (x, y) {
  if (y === 0n) throw new RangeError('Divide by zero')
  const xneg = x < 0n
  const yneg = y < 0n
  const neg = yneg ? !xneg : xneg
  x = xneg ? -x : x
  y = yneg ? -y : y
  const r = x % y
  const n = x / y + (r * 2n >= y ? 1n : 0n)
  return neg ? -n : n
}
