/* c8 ignore next 4 */
const customInspect = Symbol
  ? Symbol.for('nodejs.util.inspect.custom')
  : '_customInspect'
const hasBig = typeof BigInt === 'function'
const big = hasBig ? BigInt : x => Math.floor(Number(x))
const big0 = big(0)
const big1 = big(1)
const big2 = big(2)
const sgn = d => d >= big0
const abs = d => (sgn(d) ? d : -d)
const divBig = (x, y) => {
  const s = sgn(x) ? sgn(y) : !sgn(y)
  x = abs(x)
  y = abs(y)
  const r = x % y
  const n = x / y + (r * big2 >= y ? big1 : big0)
  return s ? n : -n
}
/* c8 ignore next */
const div = hasBig ? divBig : (x, y) => Math.round(x / y)
const rgxNumber = /^-?\d+(?:\.\d+)?$/

const synonyms = {
  precision: 'withPrecision',
  withPrec: 'withPrecision',
  withDP: 'withPrecision',
  toJSON: 'toString'
}

export default function decimal (x, opts = {}) {
  if (x instanceof Decimal) return x
  if (typeof x === 'bigint') return new Decimal(x, 0)
  if (typeof x === 'number') {
    if (Number.isInteger(x)) return new Decimal(big(x), 0)
    x = x.toString()
  }
  if (typeof x !== 'string') throw new TypeError('Invalid number: ' + x)
  if (!rgxNumber.test(x)) throw new TypeError('Invalid number: ' + x)
  const i = x.indexOf('.')
  if (i > -1) {
    x = x.replace('.', '')
    return new Decimal(big(x), x.length - i)
  } else {
    return new Decimal(big(x), 0)
  }
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

  [customInspect] (depth, opts) {
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

  withPrecision (p) {
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
    other = other.withPrecision(this._p)
    return new Decimal(this._d + other._d, this._p)
  }

  sub (other) {
    other = decimal(other)
    return this.add(other.neg())
  }

  mul (other) {
    other = decimal(other)
    // x*10^-a * y*10^-b = xy*10^-(a+b)
    return new Decimal(this._d * other._d, this._p + other._p).withPrecision(
      this._p
    )
  }

  div (other) {
    other = decimal(other)
    // x*10^-a / y*10^-b = (x/y)*10^-(a-b)
    return new Decimal(div(this._d * getFactor(other._p), other._d), this._p)
  }

  abs () {
    if (sgn(this._d)) return this
    return new Decimal(-this._d, this._p)
  }

  cmp (other) {
    other = decimal(other)
    if (this._p < other._p) return -other.cmp(this) || 0
    other = other.withPrecision(this._p)
    return this._d < other._d ? -1 : this._d > other._d ? 1 : 0
  }

  eq (other) {
    return this.cmp(other) === 0
  }

  normalise () {
    if (this._d === big0) return this.withPrecision(0)
    for (let i = 0; i < this._p; i++) {
      if (this._d % getFactor(i + 1) !== big0) {
        return this.withPrecision(this._p - i)
      }
    }
    return this.withPrecision(0)
  }
}

for (const k in synonyms) {
  Decimal.prototype[k] = Decimal.prototype[synonyms[k]]
}

const factors = []
function getFactor (n) {
  n = Math.floor(n)
  return n in factors ? factors[n] : (factors[n] = big(10) ** big(n))
}
