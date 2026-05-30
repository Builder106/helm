Feature: Helm dashboard renders both shipped trials

  As a hiring manager landing on helm-bridge.vercel.app cold,
  I should see the brand, the measurement, and the work
  in the first viewport.

  Scenario: Hero and brand are visible immediately
    Given I am on the Helm dashboard
    Then I see the "Helm" wordmark
    Then the extractor badge reads "measured"

  Scenario: Trial 01 — AP Invoice OCR — renders its measurement
    Given I am on the Helm dashboard
    Then I see trial 1 titled "AP Invoice"
    Then trial 1 reports "parse rate" as "99.0%"
    Then trial 1 reports "field accuracy" as "91.9%"

  Scenario: Trial 02 — Payout Reconciler — renders its measurement
    Given I am on the Helm dashboard
    When I scroll to trial 2
    Then I see trial 2 titled "Creator Payout"
    Then trial 2 reports "exact match" as "6.0%"

  Scenario: Sidebar shows two measured trials and the discrepancy log loads
    Given I am on the Helm dashboard
    Then the sidebar shows 2 measured trials
    When I scroll to trial 2
    Then I see 47 discrepancies listed for review
