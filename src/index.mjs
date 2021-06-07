import { inspect } from 'util'

const sgn = d => d >= 0n
const abs = d => (sgn(d) ? d : -d)
const div = (x, y) => {
  const s = sgn(x) ? sgn(y) : !sgn(y)
  x = abs(x)
  y = abs(y)
  const r = x % y
  const n = x / y + (r * 2n >= y ? 1n : 0n)
  return s ? n : -n
}

export default function decimal (number, opts = {}) {
  if (number instanceof Decimal) return number
  const [d, p] = parseNumber(number)
  return new Decimal(d, p)
}

decimal.isDecimal = function isDecimal (d) {
  return d instanceof Decimal
}

class Decimal {
  constructor (digs, prec) {
    this._d = digs
    this._p = prec
    Object.freeze(this)
  }

  [inspect.custom] (depth, opts) {
    /* c8 ignore next */
    if (depth < 0) return opts.stylize('[Decimal]', 'number')
    return `Decimal { ${opts.stylize(this.toString(), 'number')} }`
  }

  toNumber () {
    const factor = getFactor(this._p)
    return Number(this._d) / Number(factor)
  }

  toString () {
    const s = sgn(this._d)
    const p = this._p
    const d = abs(this._d)
    let t = d.toString().padStart(p + 1, '0')
    if (p) t = t.slice(0, -p) + '.' + t.slice(-p)
    return s ? t : '-' + t
  }

  toJSON () {
    return this.toString()
  }

  precision (p) {
    const prec = this._p
    if (prec === p) return this
    if (p > prec) {
      const f = getFactor(p - prec)
      return new Decimal(this._d * f, p)
    } else {
      const f = getFactor(prec - p)
      return new Decimal(div(this._d, f), p)
    }
  }

  neg () {
    return new Decimal(-this._d, this._p)
  }

  add (other) {
    other = decimal(other)
    if (other._p > this._p) return other.add(this)
    other = other.precision(this._p)
    return new Decimal(this._d + other._d, this._p)
  }

  sub (other) {
    other = decimal(other)
    return this.add(other.neg())
  }

  mul (other) {
    other = decimal(other)
    // x*10^-a * y*10^-b = xy*10^-(a+b)
    const p = this._p + other._p
    const d = this._d * other._d
    return new Decimal(d, p).precision(this._p)
  }

  div (other) {
    other = decimal(other)
    // x*10^-a / y*10^-b = (x/y)*10^-(a-b)
    const d = div(this._d * getFactor(other._p), other._d)
    return new Decimal(d, this._p)
  }

  abs () {
    if (sgn(this._d)) return this
    return new Decimal(-this._d, this._p)
  }

  cmp (other) {
    other = decimal(other)
    if (this._p < other._p) return -other.cmp(this) || 0
    other = other.precision(this._p)
    return this._d < other._d ? -1 : this._d > other._d ? 1 : 0
  }

  eq (other) {
    return this.cmp(other) === 0
  }

  normalise () {
    if (this._d === 0n) return this.precision(0)
    for (let i = 0; i < this._p; i++) {
      if (this._d % getFactor(i + 1) !== 0n) {
        return this.precision(this._p - i)
      }
    }
    return this.precision(0)
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
