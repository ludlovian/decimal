# decimal
Simple barebones decimal library

## Why?

Just because all the others do far more than I need.

All I want is something to manage my financial data, without losing
pennies in rounding, or requiring me to multiply & divide by 100 all
the time. That's it.

Okay, that's not just it. I also wanted to play with the new `BigInt`.

## API

### decimal(input) => Decimal
```
import decimal from 'decimal'

const d = decimal(1.234)
```

The sole default export is a function to create a decimal.

A decimal is effectively an immutable integer scaled by 10^-precision.
So it is represented by two items:
a signed `BigInt` for the integer, and a number for the precision.

If `BigInt` is not available, it just uses a regular `Number`, but obviously
then the size is limited to `Number.MAX_SAFE_INTEGER`.

So `1.23` would be stored as `123n` and `2` and `1.230` (same number, different
precision) would be stored as `1230n` and `3`.

You can create a decimal by supplying:
- an existing decimal (which is just returned)
- a string representation - which is the preferred way to store & retrieve them
- a `bigint`
- an integer `number`
- a floating point `number`

If a string or floating point number is given, the precision is inferred.

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

### .withPrecision(n) => Decimal

Creates a new decimal from this, but with the new precision. If precision is reduced, then
rounding takes place. We just round the one regular way (half away from zero).

Also available with the synonyms `withPrec` and `withDP`.

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

### .eq(other) => Boolean

Is this decimal equal to another

### .cmp(other) => -1|0|+1

Compares one decimal with another and says whether this is less than (-1)
the other, equal (0) to the other, or more than (+1) the other.

### .normalise() => Decimal

Reduces the precision to the lowest level possible - in other words,
it clears out trailing zeros.
