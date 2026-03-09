# Linear Algebra - Key Formulas (JEE Level)

## Matrices
- Addition: [A + B]ᵢⱼ = aᵢⱼ + bᵢⱼ (same dimensions)
- Scalar multiplication: [kA]ᵢⱼ = k·aᵢⱼ
- Matrix multiplication: [AB]ᵢⱼ = Σ aᵢₖ·bₖⱼ
- AB ≠ BA in general (not commutative)
- (AB)C = A(BC) (associative)

## Determinants (2x2)
- det([[a,b],[c,d]]) = ad - bc

## Determinants (3x3)
- Expand along any row or column using cofactors
- det(A) = a₁₁·C₁₁ + a₁₂·C₁₂ + a₁₃·C₁₃

## Properties of Determinants
- det(Aᵀ) = det(A)
- Swapping two rows/columns changes sign
- Row of zeros → det = 0
- Two identical rows → det = 0
- det(kA) = kⁿ·det(A) for n×n matrix
- det(AB) = det(A)·det(B)

## Inverse of Matrix
- A⁻¹ exists iff det(A) ≠ 0
- For 2×2: A⁻¹ = (1/det(A)) · [[d,-b],[-c,a]]
- AA⁻¹ = A⁻¹A = I (identity)

## Systems of Linear Equations (Cramer's Rule)
- For Ax = b:
  - x₁ = det(A₁)/det(A), where A₁ has column 1 replaced by b
  - Unique solution when det(A) ≠ 0
  - No solution or infinite solutions when det(A) = 0

## Eigenvalues & Eigenvectors (basics)
- det(A - λI) = 0 gives eigenvalues
- (A - λI)v = 0 gives eigenvectors
- Sum of eigenvalues = trace(A)
- Product of eigenvalues = det(A)
