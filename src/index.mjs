const customInspect = Symbol.for('nodejs.util.inspect.custom')
const div = (x, y) => {
  const pos = x >= 0n ? y > 0n : y < 0n
  x = x < 0n ? -x : x
  y = y < 0n ? -y : y
  const r = x % y
  const n = x / y + (r * 2n >= y ? 1n : 0n)
  return pos ? n : -n
}
/* c8 ignore next */
const rgxNumber = /^(-?\d+(?:\.\d+)?)(?:e([+-]\d+))?$/

const synonyms = {
  withPrec: 'withPrecision',
  withDP: 'withPrecision',
  toJSON: 'toString'
}

export default function decimal (x, opts = {}) {
  if (x instanceof Decimal) return x
  if (typeof x === 'bigint') return new Decimal(x, 0)
  if (typeof x === 'number') {
    if (Number.isInteger(x) && x < Number.MAX_SAFE_INTEGER) {
      return new Decimal(BigInt(x), 0)
    }
    x = x.toString()
  }
  if (typeof x !== 'string') throw new TypeError('Invalid number: ' + x)
  const match = rgxNumber.exec(x)
  if (!match) throw new TypeError('Invalid number: ' + x)
  if (match[2] != null) {
    const d = decimal(Number(match[1]))
    const e = Number(match[2])
    return e < 0
      ? new Decimal(d.digits, d.precision - e)
      : d.mul(getFactor(e)).normalise()
  }
  x = match[1]
  const i = x.indexOf('.')
  if (i > -1) {
    x = x.replace('.', '')
    return new Decimal(BigInt(x), x.length - i)
  } else {
    return new Decimal(BigInt(x), 0)
  }
}
decimal.from = function from ({ digits, precision, factor }) {
  if (precision == null) {
    precision = 0
    while (getFactor(precision) < factor) precision++
  }
  return new Decimal(BigInt(digits), precision)
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

  get digits () {
    return this._d
  }

  get precision () {
    return this._p
  }

  get factor () {
    return getFactor(this._p)
  }

  toNumber () {
    const factor = getFactor(this._p)
    return Number(this._d) / Number(factor)
  }

  toString () {
    const neg = this._d < 0n
    const p = this._p
    const d = neg ? -this._d : this._d
    let t = d.toString().padStart(p + 1, '0')
    if (p) t = t.slice(0, -p) + '.' + t.slice(-p)
    return neg ? '-' + t : t
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
    if (this._d >= 0n) return this
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
    if (this._d === 0n) return this.withPrecision(0)
    for (let i = 0; i < this._p; i++) {
      if (this._d % getFactor(i + 1) !== 0n) {
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
  return n in factors ? factors[n] : (factors[n] = 10n ** BigInt(n))
}
