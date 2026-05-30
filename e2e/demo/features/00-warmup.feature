# Warmup scenarios — Playwright's video recorder has a known 0-byte
# bug on the first 1-2 test slots in single-worker runs with slowMo.
# The custom reporter detects these by slug prefix `00-warmup-` and
# discards their videos. Two warmups is the floor; one is sometimes
# not enough.

Feature: Warmup
  Scenario: Warmup A
    Given I am on the Helm dashboard

  Scenario: Warmup B
    Given I am on the Helm dashboard
