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
  #digits
  #precision

  constructor (digs, prec) {
    this.#digits = digs
    this.#precision = prec
    Object.freeze(this)
  }

  [customInspect] (depth, opts) {
    /* c8 ignore next */
    if (depth < 0) return opts.stylize('[Decimal]', 'number')
    return `Decimal { ${opts.stylize(this.toString(), 'number')} }`
  }

  get digits () {
    return this.#digits
  }

  get precision () {
    return this.#precision
  }

  get factor () {
    return getFactor(this.precision)
  }

  toNumber () {
    const factor = getFactor(this.precision)
    return Number(this.digits) / Number(factor)
  }

  toString () {
    const isNeg = this.#digits < 0n
    const p = this.#precision
    const d = isNeg ? -this.#digits : this.#digits
    let t = d.toString().padStart(p + 1, '0')
    if (p) t = t.slice(0, -p) + '.' + t.slice(-p)
    return isNeg ? '-' + t : t
  }

  [Symbol.toPrimitive] (hint) {
    return hint === 'number' ? this.toNumber() : this.toString()
  }

  withPrecision (p) {
    const prec = this.precision
    if (prec === p) return this
    if (p > prec) {
      const f = getFactor(p - prec)
      return new Decimal(this.digits * f, p)
    } else {
      const f = getFactor(prec - p)
      return new Decimal(div(this.digits, f), p)
    }
  }

  neg () {
    return new Decimal(-this.digits, this.precision)
  }

  add (other) {
    other = decimal(other)
    if (other.precision > this.precision) return other.add(this)
    other = other.withPrecision(this.precision)
    return new Decimal(this.digits + other.digits, this.precision)
  }

  sub (other) {
    other = decimal(other)
    return this.add(other.neg())
  }

  mul (other) {
    const x = this
    const y = decimal(other)
    return new Decimal(
      x.digits * y.digits,
      x.precision + y.precision
    ).withPrecision(Math.max(x.precision, y.precision))
  }

  div (other) {
    let x = this
    let y = decimal(other)
    const p = Math.max(x.precision, y.precision)
    x = x.withPrecision(p)
    y = y.withPrecision(p)
    return new Decimal(div(x.digits * getFactor(p), y.digits), p)
  }

  abs () {
    if (this.digits >= 0n) return this
    return new Decimal(-this.digits, this.precision)
  }

  cmp (other) {
    other = decimal(other)
    if (this.precision < other.precision) return -other.cmp(this) || 0
    other = other.withPrecision(this.precision)
    return this.digits < other.digits ? -1 : this.digits > other.digits ? 1 : 0
  }

  eq (other) {
    return this.cmp(other) === 0
  }

  normalise () {
    if (this.digits === 0n) return this.withPrecision(0)
    for (let i = 0; i < this.precision; i++) {
      if (this.digits % getFactor(i + 1) !== 0n) {
        return this.withPrecision(this.precision - i)
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
