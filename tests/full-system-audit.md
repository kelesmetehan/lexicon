# Lexicon League full-system audit

Generated: 2026-08-08T22:21:11.048Z

- Passed: 10
- Failed: 0
- Source files: 33 (15398 lines, 1541760 bytes)
- Career starts: 100
- Country-seasons: 1001
- League matches: 733590
- Cup pairings: 63063
- AI reroll decisions: 50000
- Runtime: 38251.48 ms

## Checks

- ✅ STATIC-01: all external JavaScript parses
- ✅ STATIC-02: all inline JavaScript parses
- ✅ STATIC-03: no hidden bidi control characters exist in runtime sources
- ✅ STATIC-04: all local script and stylesheet references exist with exact casing
- ✅ DATA-01: country, league and team registry is complete and unique
- ✅ DATA-02: same-season UEFA tables are unique and pairwise disjoint
- ✅ STATE-01: 100 career starts resolve the correct country and league
- ✅ SIM-01: 1000 country-seasons preserve tables, teams, movement and equations
- ✅ AI-01: 50000 seeded AI reroll decisions stay legal and deterministic
- ✅ SAVE-01: multi-country state survives semantic JSON round trip

## Limitations

- Browser visual checks are reported separately.
- Statement/branch coverage is not instrumented for the monolithic inline runtime; critical behavior is covered by oracle-based tests and the existing card matrix.
