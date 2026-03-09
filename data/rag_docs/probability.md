# Probability - Key Formulas (JEE Level)

## Basic Probability
- P(A) = Number of favorable outcomes / Total outcomes
- 0 ≤ P(A) ≤ 1
- P(A') = 1 - P(A) (complement)
- P(A ∪ B) = P(A) + P(B) - P(A ∩ B)
- P(A ∪ B) = P(A) + P(B) if A and B are mutually exclusive

## Conditional Probability
- P(A|B) = P(A ∩ B) / P(B)
- P(A ∩ B) = P(A|B) · P(B) = P(B|A) · P(A)

## Bayes' Theorem
- P(Aᵢ|B) = P(B|Aᵢ)·P(Aᵢ) / Σ P(B|Aⱼ)·P(Aⱼ)
- Used when we know P(B|A) and want P(A|B)

## Independent Events
- P(A ∩ B) = P(A) · P(B) if independent
- P(A|B) = P(A) if independent

## Permutations & Combinations
- P(n,r) = n! / (n-r)! (ordered arrangements)
- C(n,r) = n! / (r!(n-r)!) (unordered selections)
- C(n,r) = C(n, n-r)

## Random Variables
- Expected value: E(X) = Σ xᵢ·P(xᵢ)
- Variance: Var(X) = E(X²) - [E(X)]²
- Standard deviation: σ = √Var(X)

## Binomial Distribution
- P(X = k) = C(n,k) · pᵏ · (1-p)^(n-k)
- Mean = np, Variance = np(1-p)

## Common Problem Types
- Drawing balls from bags (with/without replacement)
- Dice rolling problems
- Card drawing problems
- Conditional probability word problems
