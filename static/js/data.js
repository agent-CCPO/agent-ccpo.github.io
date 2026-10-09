// Numbers transcribed from the paper's tables (Tables 1, 2 and 4, and the appendix text).
// Figure-derived series live in figure-data.js, which is generated.
window.CCPO_DATA = (() => {
  // Column order shared by Table 1 and Table 2.
  const columns = [
    { key: 'all', label: 'All', bench: 'ALFWorld', long: 'ALFWorld success, all tasks (%)' },
    { key: 'pick', label: 'Pick', bench: 'ALFWorld', long: 'ALFWorld success, Pick (%)' },
    { key: 'look', label: 'Look', bench: 'ALFWorld', long: 'ALFWorld success, Look (%)' },
    { key: 'clean', label: 'Clean', bench: 'ALFWorld', long: 'ALFWorld success, Clean (%)' },
    { key: 'heat', label: 'Heat', bench: 'ALFWorld', long: 'ALFWorld success, Heat (%)' },
    { key: 'cool', label: 'Cool', bench: 'ALFWorld', long: 'ALFWorld success, Cool (%)' },
    { key: 'pick2', label: 'Pick2', bench: 'ALFWorld', long: 'ALFWorld success, Pick2 (%)' },
    { key: 'succ', label: 'Success', bench: 'WebShop', long: 'WebShop success (%)' },
    { key: 'score', label: 'Score', bench: 'WebShop', long: 'WebShop score (0–100)' },
  ];

  // row(method, group, values[, sds], flags). `starred` = reproduced or evaluated
  // by the authors; `reported` = taken from the original paper (gray in Table 1).
  const row = (method, group, v, sd, flags = {}) => ({ method, group, v, sd: sd || null, ...flags });
  const U = null; // unreported

  const offTheShelf = [
    row('Gemini 3.8 Flash', 'shelf', [96.4, 100.0, 84.6, 100.0, 100.0, 92.0, 95.8, 49.2, 54.0], null, { starred: true }),
    row('DeepSeek-V4.1-Flash', 'shelf', [75.0, 88.6, 84.6, 66.7, 62.5, 76.0, 66.7, 22.0, 27.9], null, { starred: true }),
    row('Qwen3.8-27B', 'shelf', [70.7, 85.7, 61.5, 66.7, 56.3, 72.0, 66.7, 29.0, 39.5], null, { starred: true }),
  ];

  const results = {
    '1.5B': [
      row('Qwen2.5', 'prompt', [6.4, 11.4, 7.7, 3.7, 6.3, 4.0, 4.2, 5.0, 21.9], null, { starred: true }),
      row('ReAct', 'prompt', [12.8, 17.4, 20.5, 15.7, 6.2, 7.7, 2.0, 11.3, 40.1]),
      row('Reflexion', 'prompt', [21.8, 35.3, 22.2, 21.7, 13.6, 19.4, 3.7, 21.9, 55.8]),
      row('PPO (with critic)', 'rl', [54.4, 64.8, 40.5, 57.1, 60.6, 46.4, 47.4, 51.5, 73.8], [3.1, 3.5, 6.9, 4.9, 6.6, 4.0, 1.9, 2.9, 3.0]),
      row('RLOO', 'rl', [69.7, 88.3, 52.8, 71.0, 62.8, 66.4, 56.9, 52.1, 73.9], [2.5, 3.0, 8.6, 5.9, 8.7, 5.5, 4.7, 6.7, 5.6]),
      row('GRPO', 'rl', [75.3, 81.8, 66.5, 77.2, 73.8, 78.0, 65.7, 56.5, 70.5], [1.0, 0.8, 8.7, 0.4, 3.4, 3.0, 1.9, 2.9, 2.2], { starred: true }),
      row('GiGPO', 'rl', [83.9, 84.8, 77.0, 92.4, 100.0, 75.0, 74.6, 67.4, 80.1], [0.7, 0.7, 10.0, 0.1, 0.0, 0.9, 1.9, 2.2, 1.8], { starred: true }),
      row('GiGPO', 'rl', [86.7, 94.4, 67.5, 94.8, 94.4, 79.8, 76.4, 65.0, 83.1], [1.7, 5.9, 4.6, 3.8, 7.8, 4.7, 5.4, 3.2, 1.6], { reported: true }),
      row('HGPO', 'rl', [89.1, 93.9, 80.1, 92.4, 100.0, 88.3, 76.2, 65.4, 82.1], [0.6, 0.3, 6.0, 0.1, 0.0, 1.6, 1.6, 1.5, 0.8], { starred: true }),
      row('HGPO', 'rl', [92.8, U, U, U, U, U, U, 71.5, 85.6], [1.1, U, U, U, U, U, U, 4.0, 2.9], { reported: true }),
      row('G2PO', 'rl', [94.0, 93.9, 90.6, 100.0, 100.0, 92.7, 86.6, 71.6, 83.5], [0.7, 0.3, 7.4, 0.0, 0.0, 1.8, 0.3, 0.7, 0.8], { starred: true }),
      row('G2PO', 'rl', [95.0, 97.2, 96.3, 95.1, 94.9, 97.1, 91.4, 71.2, 85.1], [0.8, 3.9, 5.2, 1.8, 3.6, 2.0, 4.1, 2.6, 1.4], { reported: true }),
      row('CCPO', 'ours', [96.9, 100.0, 75.2, 100.0, 93.1, 100.0, 97.0, 68.8, 83.6], [0.8, 0.0, 4.5, 0.0, 0.7, 0.0, 2.6, 3.4, 2.6], { variant: 'cc' }),
      row('CCPO', 'ours', [91.9, 93.9, 100.0, 97.5, 93.1, 86.9, 83.9, 75.0, 85.4], [0.5, 0.2, 0.0, 2.2, 0.7, 0.6, 2.2, 0.8, 1.6], { variant: 'ccep' }),
    ],
    '7B': [
      row('Qwen2.5', 'prompt', [19.3, 37.1, 38.5, 14.8, 12.5, 8.0, 4.2, 3.0, 26.6], null, { starred: true }),
      row('ReAct', 'prompt', [31.2, 48.5, 35.4, 34.3, 13.2, 18.2, 17.6, 19.5, 46.2]),
      row('Reflexion', 'prompt', [42.7, 62.0, 41.6, 44.9, 30.9, 36.3, 23.8, 28.8, 58.1]),
      row('PPO (with critic)', 'rl', [80.4, 92.3, 64.0, 92.5, 89.5, 80.3, 68.8, 68.7, 81.4], [2.7, 4.0, 8.4, 2.4, 7.0, 2.0, 8.3, 5.1, 3.1]),
      row('RLOO', 'rl', [75.5, 87.6, 78.2, 87.3, 81.3, 71.9, 48.9, 65.7, 80.3], [4.6, 4.3, 8.3, 5.8, 7.6, 5.2, 8.4, 4.0, 3.2]),
      row('GRPO', 'rl', [82.0, 85.8, 71.9, 92.1, 84.2, 81.2, 69.1, 72.9, 82.9], [0.8, 2.1, 10.3, 0.7, 2.7, 1.8, 0.8, 3.2, 0.6], { starred: true }),
      row('GiGPO', 'rl', [92.2, 100.0, 93.3, 96.0, 95.7, 89.9, 76.5, 74.7, 84.3], [0.8, 0.0, 11.5, 0.3, 3.7, 2.1, 2.3, 4.0, 3.5], { starred: true }),
      row('GiGPO', 'rl', [90.8, 97.7, 82.7, 98.8, 83.7, 89.3, 79.2, 72.8, 84.4], [1.3, 1.6, 7.9, 1.6, 7.2, 8.2, 6.6, 3.2, 2.9], { reported: true }),
      row('HGPO', 'rl', [95.8, 100.0, 96.7, 100.0, 100.0, 85.6, 92.6, 77.6, 86.1], [0.5, 0.0, 5.8, 0.0, 0.0, 1.9, 2.6, 4.3, 3.0], { starred: true }),
      row('HGPO', 'rl', [95.4, U, U, U, U, U, U, 78.5, 89.0], [0.6, U, U, U, U, U, U, 1.4, 1.0], { reported: true }),
      row('G2PO', 'rl', [94.0, 100.0, 100.0, 96.0, 95.7, 85.6, 88.2, 72.4, 83.8], [0.5, 0.0, 0.0, 0.3, 3.7, 1.9, 2.7, 3.5, 2.6], { starred: true }),
      row('G2PO', 'rl', [96.9, 98.7, 90.6, 97.6, 100.0, 98.8, 93.7, 78.3, 89.8], [1.3, 2.3, 11.5, 2.1, 0.0, 2.1, 8.4, 0.6, 1.7], { reported: true }),
      row('CCPO', 'ours', [97.4, 100.0, 100.0, 100.0, 95.7, 94.3, 94.1, 79.4, 89.4], [0.5, 0.0, 0.0, 0.0, 3.7, 2.2, 2.5, 1.6, 1.0], { variant: 'cc' }),
      row('CCPO', 'ours', [94.3, 100.0, 85.9, 96.0, 100.0, 89.9, 88.2, 78.4, 84.6], [0.5, 0.0, 5.1, 0.3, 0.0, 2.1, 2.7, 3.9, 3.9], { variant: 'ccep' }),
    ],
  };

  // Min-max gain over reproduced GRPO across the two CCPO variants (Table 1).
  const deltaGRPO = {
    '1.5B': ['16.6–21.6', '12.1–18.2', '8.7–33.5', '20.3–22.8', '19.3', '8.9–22.0', '18.2–31.3', '12.3–18.5', '13.1–14.8'],
    '7B': ['12.3–15.4', '14.2', '14.0–28.1', '3.9–7.9', '11.5–15.8', '8.7–13.1', '19.1–25.0', '5.5–6.5', '1.7–6.5'],
  };

  // Table 2. Qwen2.5-1.5B; ALFWorld rows use A_CC, WebShop rows use A_CC + A_EP.
  const abl = (id, label, group, H, F, v, sd, extra = {}) => ({ id, label, group, H, F, v, sd, ...extra });
  const D = null; // not run on WebShop
  const ablations = [
    abl('noExclusion', 'w/o self-trajectory peer exclusion', 'peers', 2, 2, [90.6, 97.0, 85.9, 88.1, 100.0, 86.9, 83.8, 56.0, 75.1], [0.8, 0.1, 5.1, 1.0, 0.0, 0.6, 2.8, 5.5, 2.6]),
    abl('noSummary', 'w/o context summary', 'peers', 2, 2, [94.3, 97.0, 81.9, 92.1, 95.7, 98.6, 92.6, 73.7, 84.5], [0.5, 0.1, 7.1, 0.7, 3.7, 2.4, 2.6, 3.5, 3.0]),
    abl('uniform', 'Uniform weighting', 'peers', 2, 2, [93.2, 94.9, 92.6, 96.1, 95.7, 87.0, 92.6, 72.4, 83.1], [0.5, 1.9, 6.4, 0.3, 3.7, 0.6, 2.7, 3.9, 3.4]),
    abl('cosine', 'Cosine-based context similarity', 'peers', 2, 2, [92.7, 97.9, 89.3, 92.1, 95.7, 89.9, 88.2, 70.3, 86.6], [0.5, 1.8, 0.6, 0.7, 3.7, 2.1, 2.7, 2.7, 1.4]),
    abl('histOnly', 'Historical credit only', 'channel', 2, 0, [91.4, 93.9, 85.9, 100.0, 93.1, 86.9, 83.8, 72.7, 85.1], [0.8, 0.2, 5.1, 0.0, 0.7, 0.6, 2.8, 2.8, 0.4]),
    abl('futOnly', 'Future credit only', 'channel', 0, 2, [84.6, 91.9, 71.9, 88.1, 82.0, 91.3, 70.6, 74.0, 85.1], [1.6, 1.9, 10.3, 1.0, 2.4, 0.4, 3.0, 2.4, 2.4]),
    abl('h1f1', 'Symmetric window', 'symmetric', 1, 1, [86.7, 91.9, 78.5, 92.1, 91.0, 85.6, 75.0, D, D], [0.0, 1.9, 1.3, 0.7, 3.1, 1.9, 2.9, D, D]),
    abl('h3f3', 'Symmetric window', 'symmetric', 3, 3, [91.4, 97.0, 85.9, 96.0, 93.1, 91.3, 79.4, D, D], [0.8, 0.1, 5.1, 0.3, 0.7, 0.4, 2.8, D, D]),
    abl('h4f0', 'Asymmetric window', 'asymmetric', 4, 0, [94.3, 97.0, 89.3, 100.0, 95.7, 91.3, 88.2, D, D], [0.9, 0.1, 0.6, 0.0, 3.7, 0.4, 2.7, D, D]),
    abl('h3f1', 'Asymmetric window', 'asymmetric', 3, 1, [92.7, 100.0, 89.3, 96.0, 91.0, 100.0, 73.6, D, D], [0.9, 0.0, 0.6, 0.3, 3.1, 0.0, 3.9, D, D]),
    abl('h1f3', 'Asymmetric window', 'asymmetric', 1, 3, [89.3, 93.9, 82.6, 89.6, 82.0, 91.3, 88.2, D, D], [1.6, 0.2, 10.9, 1.5, 2.4, 0.4, 2.7, D, D]),
    abl('h0f4', 'Asymmetric window', 'asymmetric', 0, 4, [62.0, 71.7, 82.6, 58.2, 66.1, 59.4, 44.1, D, D], [1.8, 2.6, 10.9, 6.1, 3.4, 1.3, 1.1, D, D]),
    abl('full', 'CCPO (ours)', 'ours', 2, 2, [96.9, 100.0, 75.2, 100.0, 93.1, 100.0, 97.0, 75.0, 85.4], [0.8, 0.0, 4.5, 0.0, 0.7, 0.0, 2.6, 0.8, 1.6]),
  ];

  // Table 4. Repeated-observation rate on ALFWorld evaluation rollouts (%).
  const revisitRate = [
    { method: 'GiGPO', v: 41.0, sd: 0.9 },
    { method: 'HGPO', v: 36.4, sd: 0.7 },
    { method: 'G2PO', v: 26.8, sd: 0.7 },
    { method: 'CCPO', v: 22.5, sd: 1.8, ours: true },
  ];

  // Appendix F tables: the steps the paper quotes verbatim, keyed by 1-based step.
  const place = { ct: 'countertop', to: 'toilet', th: 'towelholder', bb: 'bathtubbasin', sb: 'sinkbasin', ca: 'cabinet', tph: 'toiletpaperhanger', gc: 'garbagecan', sh: 'shelf' };
  const games = {
    game42: {
      id: 'game42',
      title: 'Game 42',
      task: 'put a toiletpaper in toiletpaperhanger',
      targetLegend: 'where the toilet paper is (cabinet 1)',
      goalLegend: 'where it goes (toiletpaperhanger 1)',
      figure: 'static/figures/trajectories-game42.svg',
      twins: { GiGPO: 3, HGPO: 4, CCPO: 6 },
      twinText: 'On the toiletpaperhanger 1, you see nothing.',
      twinNote: 'Three policies read this exact observation. GiGPO and HGPO arrive empty-handed and keep circling; CCPO arrives one step after picking the toilet paper up, and finishes on the next step.',
      notes: {
        GiGPO: { 3: ['go to toiletpaperhanger 1', 'On the toiletpaperhanger 1, you see nothing.'] },
        HGPO: { 4: ['go to toiletpaperhanger 1', 'On the toiletpaperhanger 1, you see nothing.'] },
        G2PO: { 5: ['open cabinet 2', 'In it, you see a soapbottle 1.'] },
        CCPO: {
          3: ['go to cabinet 1', 'The cabinet 1 is closed.'],
          4: ['open cabinet 1', 'In it, you see […] a toiletpaper 1.'],
          5: ['take toiletpaper 1 from cabinet 1', 'You pick up the toiletpaper 1 from the cabinet 1.'],
          6: ['go to toiletpaperhanger 1', 'On the toiletpaperhanger 1, you see nothing.'],
          7: ['move toiletpaper 1 to toiletpaperhanger 1', 'You move the toiletpaper 1 to the toiletpaperhanger 1.'],
        },
      },
    },
    game133: {
      id: 'game133',
      title: 'Game 133',
      task: 'find two spraybottle and put them in toilet',
      targetLegend: 'where the spray bottles are (garbagecan 1, cabinet 3)',
      goalLegend: 'where they go (toilet 1)',
      figure: 'static/figures/trajectories-game133.svg',
      twins: {},
      twinText: '',
      twinNote: 'A different failure: G2PO places spraybottle 2, then removes and replaces that same bottle in three further cycles. CCPO places two distinct bottles and finishes at step 15.',
      notes: {
        GiGPO: {
          11: ['take soapbottle 2 from countertop 1', 'You pick up the soapbottle 2 from the countertop 1.'],
          13: ['move soapbottle 2 to toilet 1', 'You move the soapbottle 2 to the toilet 1.'],
        },
        G2PO: {
          10: ['move spraybottle 2 to toilet 1', 'You move the spraybottle 2 to the toilet 1.'],
          14: ['go to toilet 1', 'On the toilet 1, you see a cloth 3, and a spraybottle 2.'],
          15: ['take spraybottle 2 from toilet 1', 'You pick up the spraybottle 2 from the toilet 1.'],
          16: ['move spraybottle 2 to toilet 1', 'You move the spraybottle 2 to the toilet 1.'],
        },
        CCPO: {
          4: ['“1, and you have already taken ”', 'Nothing happens.'],
          5: ['take spraybottle 1 from garbagecan 1', 'You pick up the spraybottle 1 from the garbagecan 1.'],
          8: ['move spraybottle 1 to toilet 1', 'You move the spraybottle 1 to the toilet 1.'],
          11: ['open cabinet 3', 'In it, you see a spraybottle 2.'],
          12: ['take spraybottle 2 from cabinet 3', 'You pick up the spraybottle 2 from the cabinet 3.'],
          13: ['“. now, you are at step 13, and”', 'Nothing happens.'],
          15: ['move spraybottle 2 to toilet 1', 'You move the spraybottle 2 to the toilet 1.'],
        },
      },
    },
  };

  return { columns, offTheShelf, results, deltaGRPO, ablations, revisitRate, place, games };
})();
