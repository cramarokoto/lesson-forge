# echelles — round 2, merged findings (orchestrator)

Apply each item or dispute it in one sentence with evidence. Change nothing else; do not touch `scene`.

## ERROR
1. **s5/sceneDescription** (fc-3): back to 2 sentences: « Same scene, but the five notches now read « × 10 », and a vertical arrow labeled « × 10⁵ » rises beside them from « 10⁻¹⁵ m » up to « 10⁻¹⁰ m ». The arrow is the accent. »
2. **quiz q3** (fc-5): question about « le rayon d’un atome d’hydrogène »; in the explanation « l’atome d’hydrogène aurait 1 km de rayon ».
3. **s6 difference counter label** (fc-8): U+00A0 before each « m »: « Différence 10⁻¹⁰ m − 10⁻¹⁵ m ». Check every other counter label and value for the same issue.

## AMBIGUOUS
4. **s5/text** (fc-1): use ∼ instead of ≈ in the quotient, and « de l’ordre de 100 000 fois » instead of « environ 100 000 fois ».
5. **notation line 4** (fc-2): `\dfrac{r_{\mathrm{atome}}(\mathrm{H})}{r_{\mathrm{noyau}}(\mathrm{H})} \sim \dfrac{10^{-10}}{10^{-15}} = 10^{-10-(-15)} = 10^{5}`
6. **quiz q1/explanation** (fc-4, qr-1): « son noyau, presque toujours un seul proton, de l’ordre de … » (full text in quiz-reviewer-r2.json).
7. **s1/callout** (fc-6): say the lesson takes every radius from the same column of the PubChem periodic table, and add `pubchem-periodic-table` (or the matching source id) to s1 `sourceIds`. **Do not name the van der Waals radius**: the syllabus-checker ruled it out of scope (round 1, ERROR sc-1), and that overrides fc-6's suggested wording.
8. **s2/sceneDescription** (fc-7): « slightly larger » → « larger ».
9. **s5/text** (pr-1): « les cinq crans « ÷ 10 » de l’étape précédente deviennent cinq multiplications par 10 ».
