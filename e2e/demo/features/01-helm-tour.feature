# Narrated walkthrough of Helm's two shipped trials. Produces an mp4
# under e2e/demo/output/ that the README's <details> blocks embed.
# Each step has dwellForDemo()-style pacing baked into the slowMo
# config; long pauses are explicit Given/When steps for the recorder.

Feature: Helm — a one-minute tour

  Scenario: Trial 01 then trial 02 with the headline measurements
    Given I am on the Helm dashboard
    Then I see the "Helm" wordmark
    Then I see trial 1 titled "AP Invoice"
    Then trial 1 reports "parse rate" as "99.0%"
    Then trial 1 reports "field accuracy" as "91.9%"
    When I scroll to trial 2
    Then I see trial 2 titled "Creator Payout"
    Then trial 2 reports "exact match" as "6.0%"
    Then I see 47 discrepancies listed for review
