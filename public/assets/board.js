// Other models' published figures, copied by hand from the Decision Index board's own data file
// (https://multimodalart-jev-decision-index.static.hf.space/data/index.json, edition "Decision Index 0.3.2",
// generated 2026-10-13T16:59:18Z). Rule for who is listed: Jev, the board's reference, and the ten
// highest-ranked models under one billion parameters. Update the whole list together, never one row.
//   publicIndex = the board's public score (v03.pub); full = its Full score (v03.v); rank = its Full-score rank.
window.FRQ_BOARD = {
  edition: 'Decision Index 0.3.2',
  read: '2026-10-13',
  entries: 159,
  models: [
    { name: 'Jev', note: 'jev-1.13.0, the board\'s reference', params: null, kind: 'hosted API', publicIndex: 57.96, full: 60.11, rank: 8 },
    { name: 'vLLM-SR d3-lite', params: 852985920, kind: 'generative', publicIndex: 36.93, full: 32.33, rank: 101 },
    { name: 'jiwo 0.8B v2', params: 752393024, kind: 'generative', publicIndex: 29.58, full: 24.87, rank: 115 },
    { name: 'Sieve 0.8B', params: 590000000, kind: 'generative', publicIndex: 32.26, full: 23.06, rank: 118 },
    { name: 'Crivo-150M', params: 149610241, kind: 'encoder', publicIndex: 36.39, full: 22.21, rank: 120 },
    { name: 'Saina Helm 2.0', params: 852985920, kind: 'generative', publicIndex: 30.17, full: 20.78, rank: 122 },
    { name: 'vLLM-SR d3-edge', params: 594321600, kind: 'generative', publicIndex: 28.82, full: 20.24, rank: 124 },
    { name: 'JPT-0.8B', params: 873438784, kind: 'generative', publicIndex: 19.37, full: 18.73, rank: 125 },
    { name: 'Sifr 0.8B v3.1', params: 870000000, kind: 'generative', publicIndex: 25.65, full: 17.79, rank: 126 },
    { name: 'tasksource Decider nano v4', params: 149015041, kind: 'encoder', publicIndex: 30.9, full: 17.63, rank: 127 },
    { name: 'vLLM-SR Decision 2.0 Eos', params: 870000000, kind: 'generative', publicIndex: 20.57, full: 17.47, rank: 128 }
  ]
};
