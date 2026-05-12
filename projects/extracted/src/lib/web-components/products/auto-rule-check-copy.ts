export const AUTO_RULE_CALLOUTS = {
  eligible: {
    title: 'Passed the automated check',
    body: 'The rule engine automatically will approve this application for the below products.',
  },
  potentiallyEligible: {
    title: 'Automated check incomplete',
    body: 'The rule engine needs more information to evaluate these products. Manual underwriting can still approve them.',
  },
  notEligible: {
    title: 'Did not pass the automated check',
    body: 'These products failed one or more rules. They can still be approved manually by underwriting.',
  },
  simulator: {
    title: 'Simulator uses the automated rule engine',
    body: 'Products shown as Not Qualifying or Missing data can still be approved manually by underwriting.',
  },
  simulatorProgram: {
    title: 'Simulator uses the automated rule engine',
    body: 'Programs shown as Not Qualifying or Missing data can still be approved manually by underwriting.',
  },
  offerProgram: {
    title: 'Automated rule check',
    body: 'Programs below are evaluated automatically against program rules. Potentially Eligible, Not Eligible, or incomplete results do not prevent manual underwriting approval.',
  },
  offerProduct: {
    title: 'Automated rule check',
    body: 'Products below are evaluated automatically against program and product rules. Potentially Eligible, Not Eligible, or incomplete results do not prevent manual underwriting approval.',
  },
} as const;
