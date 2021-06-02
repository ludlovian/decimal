# decimal
Simple barebones decimal library

## Why?

Just because all the others do far more than I need.

All I want is something to manage my financial data, without losing
pennies in rounding, or requiring me to multiply & divide by 100 all
the time. That's it.

## API

### decimal(input, { minPrecision, maxPrecision }) => Decimal
```
import decimal from 'decimal'

const d = decimal(1.234)
```

The sole default export is a function to create a decimal from another number.

A decimal is immutable and stored as an integer representing the digits, and an exponent
representing the precision. So `1.23` would be stored as `123` and `2`. And
is different from `1.230`, which is stored as `1230` and `3`. Geddit?

The `decimal` function can take an existing decimal (which it just returns), or
can create one from a primitive number, or a string representation,
or a tuple of `[digits, exponent]`.

This is limited to exponents between 0 and 12 inclusive, error checking
is minimal and we do not cope with very large or very small numbers.

But by the time my finances are either that large or that small,
I'll have other problems.

### .number => number

Used to convert back to a primitive number.

### .toString() => string

Provides the canonical string representation

### .tuple => [digits, exponent]

Provides the internal storage

### .precision(n) => Decimal

Creates a new decimal from this, but with the new precision. If precision is reduced, then
rounding takes place. We just round the one regular way (nearest int, half upwards).

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
