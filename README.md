# decimal
Simple barebones decimal library

## Why?

Just because all the others do far more than I need.

All I want is something to manage my financial data, without losing
pennies in rounding, or requiring me to multiply & divide by 100 all
the time. That's it.

Okay, that's not just it. I also wanted to play with the new `BigInt`.

## API

### decimal(input, { minPrecision, maxPrecision }) => Decimal
```
import decimal from 'decimal'

const d = decimal(1.234)
```

The sole default export is a function to create a decimal.

A decimal is effectively an immutable integer scaled by 10^-precision.
So it is represented by two items:
a`BigInt` for the integer, and a number for the precision.

So `1.23` would be stored as `[123n, 2]` and `1.230` (same number, different
precision) would be stored as `[1230n, 3]`.

You can create a decimal by supplying:
- an existing decimal (which is just returned)
- a string representation - which is the preferred way to store & retrieve them.
- an existing primitive number
- tuple of `[digits, precision]` if you want to fiddle.

And don't forget: once a decimal, always a decimal!

Best to keep decimals as decimals forever. You'll only lose precision
converting to numbers.

There really isn't much error checking. It assumes you know what you are doing.

### decimal.isDecimal(d)

Tells you if something is already a decimal.

### .toNumber() => number

Converts back to a primitive number, but possibly loss of precision.
Try not to use this much. If you are going to keep coercing back and
forth, there's not much point in using this

### .toString() => string

Provides the canonical string representation

### .tuple => [digits, precision]

Provides the internal storage

### .precision(n) => Decimal

Creates a new decimal from this, but with the new precision. If precision is reduced, then
rounding takes place. We just round the one regular way (half away from zero).

### .add(other) => Decimal

Adds `other` to this creating a new decimal with the result. First converts `other` into
a decimal, and then increases the precision to cover both.

### .sub(other) => Decimal

Subtracts `other` from this, creating a new decimal. As with `add`, the precision is increased
to cope.

### .mul(other) => Decimal

Multiplies this decimal by `other`, creating a new decimal *of the same precision as this one*.

### .div(other) => Decimal

Divides this decimal by `other`, creating a new decimal *of the same precision as this one*.

### .abs() => Decimal

Creates a new decimal which is the absolute value of this one.

### .neg() => Decimal

Creates a new decimal which is the negation of this one.
