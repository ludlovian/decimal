const factors = Array(13)
  .fill()
  .map((_, n) => Math.pow(10, n))

const inspect = Symbol.for('nodejs.util.inspect.custom')
const DIG = Symbol('digits')
const EXP = Symbol('exponent')
const FAC = Symbol('factor')

export default function decimal (number, opts = {}) {
  if (number instanceof Decimal) return number
  if (Array.isArray(number)) return new Decimal(...number)
  const { minPrecision = 0, maxPrecision = 12 } = opts
  const [d, x] = parseNumber(number, minPrecision, maxPrecision)
  return new Decimal(d, x)
}

class Decimal {
  constructor (dig, exp) {
    Object.freeze(
      Object.defineProperties(this, {
        [DIG]: { value: Math.round(dig) },
        [EXP]: { value: exp },
        [FAC]: { value: factors[exp] }
      })
    )
  }

  [inspect] (depth, opts) {
    /* c8 ignore next */
    if (depth < 0) return opts.stylize('[Decimal]', 'number')
    return `Decimal { ${opts.stylize(this.toString(), 'number')} }`
  }

  get tuple () {
    return [this[DIG], this[EXP]]
  }

  get number () {
    return this[DIG] / this[FAC]
  }

  toString () {
    return this.number.toFixed(this[EXP])
  }

  toJSON () {
    return this.toString()
  }

  precision (p) {
    if (this[EXP] === p) return this
    if (!(p in factors)) throw new TypeError('Unsupported precision')
    if (p > this[EXP]) {
      const f = factors[p - this[EXP]]
      return new Decimal(this[DIG] * f, p)
    } else {
      const f = factors[this[EXP] - p]
      return new Decimal(this[DIG] / f, p)
    }
  }

  add (other) {
    const x = this
    const y = decimal(other)
    const exp = Math.max(x[EXP], y[EXP])
    return new Decimal(x.precision(exp)[DIG] + y.precision(exp)[DIG], exp)
  }

  sub (other) {
    other = decimal(other)
    return this.add(decimal(other).neg())
  }

  mul (x) {
    x = decimal(x).number
    return new Decimal(this[DIG] * x, this[EXP])
  }

  div (x) {
    x = decimal(x).number
    if (!x) throw new Error('Cannot divide by zero')
    return new Decimal(this[DIG] / x, this[EXP])
  }

  abs () {
    return new Decimal(Math.abs(this[DIG]), this[EXP])
  }

  neg () {
    return new Decimal(-this[DIG], this[EXP])
  }
}

const rgx = /^-?\d+(?:\.\d+)?$/
function parseNumber (n, minp, maxp) {
  let s
  if (typeof n === 'string') {
    s = n
    if (!rgx.test(s)) throw new TypeError('Invalid number: ' + s)
    n = parseFloat(s)
  } else if (typeof n === 'number') {
    s = n.toString()
  } else {
    throw new TypeError('Invalid number: ' + n)
  }
  const p = Math.min(Math.max((s.split('.')[1] || '').length, minp), maxp)
  if (!(p in factors)) throw new TypeError('Unsupported precision')
  const d = Math.round(n * factors[p])
  return [d, p]
}
