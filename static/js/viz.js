// Interactive figures for the CCPO project page. Plain DOM and SVG, no build step.
(() => {
  'use strict';

  const D = window.CCPO_DATA;
  const F = window.CCPO_FIGURES;
  if (!D || !F) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const INK = '#11141b';
  const HIST = '#7c4ddb';
  const FUT = '#1f9d6b';
  const ANCHOR = '#e8782a';
  const MUTED = '#8d93a0';

  // ------------------------------------------------------------------ helpers
  function el(tag, attrs = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'html') node.innerHTML = v;
      else if (k === 'style') node.style.cssText = v;
      else node.setAttribute(k, v);
    }
    node.append(...kids);
    return node;
  }

  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, parent) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.append(node);
    return node;
  }

  const one = (v) => v.toFixed(1);
  const signed = (v, d = 3) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const pm = (v, sd) => one(v) + (sd == null ? '' : ` <small>±${one(sd)}</small>`);

  // History / current / future markers, as used throughout the paper.
  function markers(H, F) {
    return '<span class="mks" aria-hidden="true">' +
      '<i class="mk mk-h"></i>'.repeat(H) + '<i class="mk mk-a"></i>' + '<i class="mk mk-f"></i>'.repeat(F) +
      '</span>';
  }

  const tip = $('#tip');
  function placeTip(x, y) {
    const r = tip.getBoundingClientRect();
    let left = x + 14;
    let top = y + 16;
    if (left + r.width > innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > innerHeight - 8) top = y - r.height - 12;
    tip.style.left = Math.max(8, left) + 'px';
    tip.style.top = Math.max(8, top) + 'px';
  }
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.classList.add('is-on');
    placeTip(x, y);
  }
  function hideTip() { tip.classList.remove('is-on'); }
  function bindTip(node, html) {
    node.addEventListener('pointerenter', (e) => showTip(html(), e.clientX, e.clientY));
    node.addEventListener('pointermove', (e) => placeTip(e.clientX, e.clientY));
    node.addEventListener('pointerleave', hideTip);
    node.addEventListener('focus', () => {
      const r = node.getBoundingClientRect();
      showTip(html(), r.left + r.width / 2, r.bottom - 8);
    });
    node.addEventListener('blur', hideTip);
  }
  addEventListener('scroll', hideTip, { passive: true });

  // A segmented control: one pressed button at a time.
  function seg(host, options, value, onChange) {
    host.setAttribute('role', 'group');
    const buttons = options.map((o) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(o.value === value), html: o.label });
      b.addEventListener('click', () => {
        buttons.forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        onChange(o.value);
      });
      host.append(b);
      return b;
    });
  }

  function whenVisible(node, fn, threshold = 0.25) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold });
    io.observe(node);
  }

  // Redraw width-dependent SVG charts when their container resizes.
  function responsive(host, draw) {
    let last = 0;
    const run = () => {
      const w = host.clientWidth;
      if (w && w !== last) { last = w; draw(w); }
    };
    if ('ResizeObserver' in window) new ResizeObserver(run).observe(host);
    else addEventListener('resize', run);
    run();
  }

  // ------------------------------------------------------------- hero schematic
  function initStage() {
    const root = $('#stage');
    if (!root) return;
    const board = $('.board', root);
    // Five of N rollouts of one task. Each step pairs an observation (lettered
    // by identity) with the action taken there; `null` is the elided middle.
    const rollouts = [
      { id: '1', obs: 'ACBDAB' },
      { id: '2', obs: 'ACBDCB' },
      { id: '3', obs: 'ACDABC' },
      { id: '4', obs: 'ADBCAD' },
      null,
      { id: 'N', obs: 'ADCBAD' },
    ];
    const K = 2; // K_H = K_F = 2, as in the paper
    const query = { r: 0, t: 2 };
    const queryObs = rollouts[query.r].obs[query.t];
    const weight = { '1-2': 32, '3-2': 22, '5-3': 18, '2-4': 15, '1-5': 13 };
    const tiles = [];

    rollouts.forEach((ro, r) => {
      if (!ro) {
        board.append(el('div', { class: 'board-row is-gap', html: '<span class="tau">⋮</span><span class="vdots">⋮</span><span></span><span class="vdots">⋮</span>' }));
        return;
      }
      const track = el('div', { class: 'track' });
      tiles[r] = [...ro.obs].map((o, t) => {
        const obs = el('span', { class: 'cell o', html: `<span>o<sub>${o}</sub></span>` });
        const act = el('span', { class: 'cell a', html: `<span>a<sub>${t + 1}</sub></span>` });
        const pair = el('span', { class: 'pair', 'data-o': o }, obs, act);
        if (r === query.r && t === query.t) {
          pair.classList.add('q');
          act.append(el('span', { class: 'adv', html: 'A<sup>CC</sup>' }));
        } else if (r === query.r && o === queryObs) {
          pair.classList.add('excl');
          obs.append(el('span', { class: 'x' }, '×'));
        } else if (o === queryObs) {
          pair.classList.add('peer');
          pair.style.setProperty('--wt', weight[`${r}-${t}`]);
          obs.append(el('span', { class: 'w' }, weight[`${r}-${t}`] + '%'));
        }
        track.append(pair);
        return { o, obs, act, pair };
      });
      board.append(el('div', { class: 'board-row' + (r === query.r ? ' is-query' : '') },
        el('span', { class: 'tau', html: `τ<sup>${ro.id}</sup>` }), track,
        el('span', { class: 'more' }, '⋯'),
        el('span', { class: 'outcome', html: `R<sub>${ro.id}</sub>` })));
    });

    // Windows are counted in steps, and one step is one observation-action
    // pair: K_H steps before a matched step and K_F steps after it, for the
    // query and for every peer.
    const mark = (r, from, to, cls) => {
      for (let t = Math.max(0, from); t <= Math.min(to, tiles[r].length - 1); t++) tiles[r][t].pair.classList.add(cls);
    };
    tiles.forEach((row, r) => row.forEach((tile, t) => {
      if (!tile.pair.classList.contains('peer')) return;
      mark(r, t - K, t - 1, 'pw');
      mark(r, t + 1, t + K, 'pf');
    }));
    mark(query.r, query.t - K, query.t - 1, 'hw');
    mark(query.r, query.t + 1, query.t + K, 'fw');
    tiles[query.r][query.t - K].pair.append(el('span', { class: 'tag h', html: `K<sub>H</sub> = ${K}` }));
    tiles[query.r][query.t + 1].pair.append(el('span', { class: 'tag f', html: `K<sub>F</sub> = ${K}` }));
    // One context marker per step of the query's window, as in the paper's tables.
    for (let d = -K; d <= K; d++) {
      tiles[query.r][query.t + d].pair.append(el('span', { class: 'step-mk', html: `<i class="mk ${d < 0 ? 'mk-h' : d > 0 ? 'mk-f' : 'mk-a'}"></i>` }));
    }

    // Step 03 on the board. Historical credit sets this trajectory's return Y
    // against the peers' weighted returns B[Y]; future credit is the change in
    // value from the query step to the end of its K_F-step window.
    const qPair = tiles[query.r][query.t].pair;
    qPair.append(
      el('span', { class: 'credit-tag', html: 'C<sup>H</sup>' }),
      el('span', { class: 'cf-arrow', html: '<b>C<sup>F</sup></b>' }),
      el('span', { class: 'vlab', html: 'V<sub>t</sub>' }));
    tiles[query.r][query.t + K].pair.append(el('span', { class: 'vlab', html: 'V<sub>t+</sub>' }));
    const peerRows = [];
    [...board.querySelectorAll('.board-row:not(.is-gap)')].forEach((row) => {
      const outcome = row.querySelector('.outcome');
      if (row.classList.contains('is-query')) {
        outcome.classList.add('is-y');
        row.append(el('span', { class: 'ret-tag y' }, 'Y'));
      } else if (row.querySelector('.pair.peer')) {
        outcome.classList.add('is-b');
        row.classList.add('has-b');
        peerRows.push(row);
      }
    });
    if (peerRows.length) {
      peerRows[0].classList.add('b-first');
      peerRows[peerRows.length - 1].classList.add('b-last');
      peerRows[Math.min(1, peerRows.length - 1)].append(el('span', { class: 'ret-tag b', html: '&#8492;[Y]' }));
    }

    // Step 04 on the board. The query step's response, as in the paper's overview
    // figure, with every token weighted by A_CC and passed to the policy update.
    // It takes the place of the other rollouts, so the rows get fixed grid lines.
    const rows = [...board.children];
    rows.forEach((row, n) => { row.style.gridRow = String(n + 1); });
    const tok = (words) => words.map((w) => `<b>${w}</b>`).join('');
    const update = el('div', { class: 'update-view', html: `
      <div class="uv-resp">
        <span class="mini a adv"><span>a<sub>${query.t + 1}</sub></span></span>
        <code><i>&lt;think&gt;</i>${tok(['take', 'the', 'apple'])}<i>&lt;/think&gt;</i><br><i>&lt;action&gt;</i>${tok(['take', 'apple', '1'])}<i>&lt;/action&gt;</i></code>
      </div>
      <div class="uv-weight"><span>all response tokens</span><span class="op">&times;</span><span class="tk a">A<sup>CC</sup></span></div>
      <span class="uv-arrow">&darr;</span>
      <div class="uv-update"><span class="tk box">dual-clip PPO + &beta;&thinsp;KL(&pi;<sub>&theta;</sub> &#8214; &pi;<sub>ref</sub>)</span><span class="op">&rarr;</span><span class="tk pi">&pi;<sub>&theta;</sub></span></div>` });
    update.style.gridRow = `2 / span ${rows.length - 1}`;
    board.append(update);
    tiles[query.r][query.t].act.append(el('span', { class: 'adv-stem' }));

    // The context windows shown beside step 02, drawn from the same query row.
    const mini = (t, kind) => {
      const o = rollouts[query.r].obs[t];
      const ring = kind === 'o' && t === query.t ? ' q' : '';
      return `<span class="mini ${kind}${ring}" data-o="${o}"><span>${kind}<sub>${kind === 'o' ? o : t + 1}</sub></span></span>`;
    };
    const windowTiles = (from, to) => {
      let html = '';
      for (let t = from; t <= to; t++) html += `<span class="mini-step">${mini(t, 'o')}${t < to ? mini(t, 'a') : ''}</span>`;
      return html;
    };
    $('[data-window="history"]', root).innerHTML = windowTiles(query.t - K, query.t);
    $('[data-window="future"]', root).innerHTML = windowTiles(query.t, query.t + K);

    // The matched group shown beside step 01: the query, its exact peers, the excluded step.
    const groupTile = (cls) => `<span class="mini o ${cls}" data-o="${queryObs}"><span>o<sub>${queryObs}</sub></span></span>`;
    $('[data-match="query"]', root).innerHTML = groupTile('q');
    $('[data-match="peers"]', root).innerHTML = groupTile('p').repeat(Object.keys(weight).length);
    $('[data-match="excluded"]', root).innerHTML = groupTile('x');

    const tabs = [...root.querySelectorAll('.stage-tab')];
    const panels = [...root.querySelectorAll('.stage-panel')];
    const MS = 7000;
    let phase = 1;
    let timer = null;
    let visible = false;
    let hovered = false;
    root.style.setProperty('--stage-ms', MS + 'ms');

    function set(p) {
      phase = p;
      root.dataset.phase = p;
      tabs.forEach((t) => {
        const on = Number(t.dataset.phase) === p;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
      });
      panels.forEach((panel) => { panel.hidden = Number(panel.dataset.phase) !== p; });
    }
    // Steps advance on their own until the reader points at the walkthrough.
    function schedule() {
      clearTimeout(timer);
      root.classList.remove('is-auto');
      if (reduceMotion || !visible || hovered) return;
      void root.offsetWidth;
      root.classList.add('is-auto');
      timer = setTimeout(() => { set(phase % 4 + 1); schedule(); }, MS);
    }
    tabs.forEach((t) => t.addEventListener('click', () => { set(Number(t.dataset.phase)); schedule(); }));
    root.addEventListener('pointerenter', () => { hovered = true; schedule(); });
    root.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    root.addEventListener('focusin', () => { hovered = true; schedule(); });
    root.addEventListener('focusout', () => { hovered = false; schedule(); });
    set(1);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.3 }).observe(root);
    }

    // The card is drawn for a 1160px-wide frame and scaled with it, so it keeps
    // the proportions of the paper figure it shares the frame with.
    const wide = window.matchMedia('(min-width: 1021px)');
    const fit = () => {
      const w = root.clientWidth;
      root.style.setProperty('--k', wide.matches && w ? Math.min(1, w / 1158).toFixed(4) : '1');
    };
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(root);
    fit();

    // The same section can show the paper's own pipeline figure instead.
    const figure = $('#method-figure');
    const viewSwitch = $('[data-control="method-view"]');
    if (figure && viewSwitch) {
      seg(viewSwitch, [
        { value: 'demo', label: 'Animated walkthrough' },
        { value: 'figure', label: 'Figure from the paper' },
      ], 'demo', (v) => {
        root.hidden = v !== 'demo';
        figure.hidden = v !== 'figure';
      });
    }
  }

  // -------------------------------------------------------------- main results
  const GROUP_TITLE = {
    shelf: () => 'Off-the-shelf LLMs · prompting, no task-specific training',
    prompt: (b) => `Prompt-based agents · Qwen2.5-${b}-Instruct`,
    rl: (b) => `RL training · Qwen2.5-${b}-Instruct`,
    ours: () => 'CCPO (ours)',
  };
  const VARIANT = { cc: 'A<sub>CC</sub> only', ccep: 'A<sub>CC</sub> + A<sub>EP</sub>' };

  function initResults() {
    const root = $('#results-viz');
    if (!root) return;
    const host = $('.bars', root);
    const deltaBox = $('.delta', root);
    const title = $('#results-title');
    const state = { backbone: '7B', col: 0 };
    const rowsFor = (b) => [...D.offTheShelf, ...D.results[b].filter((r) => !r.reported)];

    const nodes = [];
    const groupNodes = {};
    let last = null;
    rowsFor(state.backbone).forEach((r, i) => {
      if (r.group !== last) {
        last = r.group;
        groupNodes[r.group] = el('span');
        const head = el('div', { class: 'bar-group' }, groupNodes[r.group]);
        if (r.group === 'ours') head.append(el('span', { class: 'bar-key', html: '<i></i>Δ GRPO' }));
        host.append(head);
      }
      const cls = r.group === 'shelf' ? ' is-shelf' : r.group === 'ours' ? ' is-ours' : r.method === 'GRPO' ? ' is-ref' : '';
      const row = el('div', { class: 'bar-row' + cls, tabindex: '0' });
      const label = el('div', { class: 'bar-label', html: r.method + (r.starred ? '<sup>*</sup>' : '') + (r.variant ? `<small>${VARIANT[r.variant]}</small>` : '') });
      const fill = el('div', { class: 'bar-fill' });
      const err = el('div', { class: 'bar-err' });
      // On our rows the part of the bar beyond GRPO is drawn as the gain.
      const gain = r.group === 'ours' ? el('div', { class: 'bar-gain' }) : null;
      const gainLabel = r.group === 'ours' ? el('span', { class: 'bar-gain-label' }) : null;
      const track = el('div', { class: 'bar-track' }, fill, ...(gain ? [gain, gainLabel] : []), err);
      const val = el('div', { class: 'bar-val' });
      row.append(label, track, val);
      host.append(row);
      nodes.push({ row, fill, err, val, gain, gainLabel });
      bindTip(row, () => {
        const cur = rowsFor(state.backbone)[i];
        const v = cur.v[state.col];
        const sd = cur.sd && cur.sd[state.col];
        const source = cur.group === 'ours' ? 'This work' : cur.starred ? (cur.group === 'shelf' ? 'Evaluated by the authors' : 'Reproduced by the authors') : 'As reported in prior work';
        return `<span class="t-head">${D.columns[state.col].long}</span><b>${cur.method}${cur.variant ? ' · ' + VARIANT[cur.variant] : ''}</b>` +
          `<div class="t-row"><span>${source}</span><span>${v == null ? 'n/a' : one(v) + (sd == null ? '' : ' ± ' + one(sd))}</span></div>`;
      });
    });
    host.append(el('div', { class: 'bar-axis', html: '<div><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>' }));

    function update() {
      const rows = rowsFor(state.backbone);
      const col = state.col;
      const trained = rows.filter((r) => r.group !== 'shelf');
      const best = Math.max(...trained.map((r) => r.v[col]));
      const grpo = rows.find((r) => r.method === 'GRPO').v[col];
      Object.entries(groupNodes).forEach(([k, node]) => { node.textContent = GROUP_TITLE[k](state.backbone); });
      rows.forEach((r, i) => {
        const n = nodes[i];
        const v = r.v[col];
        const sd = r.sd ? r.sd[col] : null;
        n.fill.style.width = v + '%';
        if (sd) {
          const lo = Math.max(0, v - sd);
          const hi = Math.min(100, v + sd);
          n.err.style.cssText = `left:${lo}%;width:${hi - lo}%;display:block`;
        } else {
          n.err.style.display = 'none';
        }
        if (n.gain) {
          const base = Math.min(grpo, v);
          n.gain.style.left = base + '%';
          n.gain.style.width = Math.max(0, v - grpo) + '%';
          n.gainLabel.style.right = 100 - base + '%';
          n.gainLabel.textContent = `Δ GRPO ${signed(v - grpo, 1)}`;
        }
        n.val.innerHTML = pm(v, sd) + (r.group !== 'shelf' && v === best ? '<span class="bar-best">best</span>' : '');
      });
      const c = D.columns[col];
      title.textContent = `${c.long} · Qwen2.5-${state.backbone}-Instruct`;
      deltaBox.innerHTML = `<b class="sym">Δ GRPO</b><b>+${D.deltaGRPO[state.backbone][col]}</b><span>pts · ${c.bench} ${c.label} · Qwen2.5-${state.backbone} · min–max over CCPO variants</span>`;
    }

    seg($('[data-control="backbone"]', root), [
      { value: '1.5B', label: 'Qwen2.5-1.5B' },
      { value: '7B', label: 'Qwen2.5-7B' },
    ], state.backbone, (v) => { state.backbone = v; update(); });
    seg($('[data-control="metric"]', root), D.columns.map((c, i) => ({
      value: i,
      label: i === 0 ? 'ALFWorld' : c.key === 'succ' ? 'WebShop' : c.key === 'score' ? 'WebShop score' : c.label,
    })), state.col, (v) => { state.col = v; update(); });

    whenVisible(root, update, 0.15);
  }

  // Tables 1 and 2 as real HTML tables (the accessible twin of the charts).
  function ranks(rows, col) {
    const vals = [...new Set(rows.filter((r) => !r.reported && r.v[col] != null).map((r) => r.v[col]))].sort((a, b) => b - a);
    return { best: vals[0], second: vals[1] };
  }
  const HEAD = '<thead><tr><th></th><th></th><th colspan="7">ALFWorld</th><th colspan="2" class="split">WebShop</th></tr>' +
    '<tr><th>Type</th><th class="m">Method</th><th class="primary">All</th><th>Pick</th><th>Look</th><th>Clean</th><th>Heat</th><th>Cool</th><th>Pick2</th><th class="primary split">Succ.</th><th class="primary">Score</th></tr></thead>';
  const colClass = (i) => (i === 0 || i >= 7 ? ' primary' : '') + (i === 7 ? ' split' : '');

  function tableCells(r, rk) {
    let html = '';
    for (let i = 0; i < 9; i++) {
      const v = r.v[i];
      if (v == null) {
        if (r.reported && i === 1) { html += '<td colspan="6">Unreported</td>'; i = 6; continue; }
        html += `<td class="${colClass(i)}">—</td>`;
        continue;
      }
      const k = rk && !r.reported ? (v === rk[i].best ? ' best' : v === rk[i].second ? ' second' : '') : '';
      html += `<td class="${(k + colClass(i)).trim()}"><span>${one(v)}</span>${r.sd && r.sd[i] != null ? `<small>±${one(r.sd[i])}</small>` : ''}</td>`;
    }
    return html;
  }

  function initResultsTable() {
    const host = $('#results-table');
    if (!host) return;
    const type = (r) => (r.group === 'rl' || r.group === 'ours' ? 'RL Training' : 'Prompting');
    const name = (r) => (r.group === 'ours' ? `CCPO (ours), ${VARIANT[r.variant]}` : r.method + (r.starred ? '<sup>*</sup>' : ''));
    const section = (titleText, rows, delta) => {
      const rk = D.columns.map((_, i) => ranks(rows, i));
      let html = `<tr class="sec"><td colspan="11">${titleText}</td></tr>`;
      rows.forEach((r) => {
        html += `<tr class="${r.reported ? 'reported' : r.group === 'ours' ? 'ours' : ''}"><td>${type(r)}</td><td class="m">${name(r)}</td>${tableCells(r, rk)}</tr>`;
      });
      if (delta) html += `<tr class="delta-row"><td></td><td class="m">Δ GRPO</td>${delta.map((d, i) => `<td class="${colClass(i).trim()}">${d}</td>`).join('')}</tr>`;
      return html;
    };
    host.innerHTML = `<table class="data">${HEAD}<tbody>` +
      section('Off-the-Shelf Model', D.offTheShelf) +
      section('Qwen2.5-1.5B-Instruct', D.results['1.5B'], D.deltaGRPO['1.5B']) +
      section('Qwen2.5-7B-Instruct', D.results['7B'], D.deltaGRPO['7B']) +
      '</tbody></table>';
  }

  // ----------------------------------------------------------------- ablations
  const ABL_GROUP = {
    peers: 'Peer selection and weighting',
    channel: 'Credit channels',
    symmetric: 'Symmetric context variation',
    asymmetric: 'Asymmetric context variation',
    ours: 'CCPO (ours)',
  };

  function initAblations() {
    const host = $('#ablation-viz .abl-grid');
    if (!host) return;
    const full = D.ablations.find((a) => a.id === 'full');
    const MAX = 25;
    const fills = [];
    host.append(el('div', {
      class: 'abl-row head',
      html: `<div></div><div><b>ALFWorld success</b>full CCPO ${one(full.v[0])} ± ${one(full.sd[0])} · A<sub>CC</sub></div>` +
        `<div><b>WebShop success</b>full CCPO ${one(full.v[7])} ± ${one(full.sd[7])} · A<sub>CC</sub> + A<sub>EP</sub></div>`,
    }));
    const bar = (a, col) => {
      const drop = full.v[col] - a.v[col];
      const fill = el('div', { class: 'abl-fill' });
      const label = el('span', { class: 'abl-drop', style: 'left:0' }, '−' + one(drop));
      fills.push({ fill, label, pct: (drop / MAX) * 100 });
      const cell = el('div', { class: 'abl-bar', tabindex: '0' },
        el('div', { class: 'abl-track' }, fill, label),
        el('div', { class: 'abl-abs', html: one(a.v[col]) }));
      bindTip(cell, () => `<span class="t-head">${col === 0 ? 'ALFWorld' : 'WebShop'} success</span><b>${a.label}</b>` +
        `<div class="t-row"><span>This ablation</span><span>${one(a.v[col])} ± ${one(a.sd[col])}</span></div>` +
        `<div class="t-row"><span>Full CCPO</span><span>${one(full.v[col])} ± ${one(full.sd[col])}</span></div>`);
      return cell;
    };
    let last = null;
    D.ablations.filter((a) => a.group === 'peers' || a.group === 'channel').forEach((a) => {
      if (a.group !== last) {
        last = a.group;
        host.append(el('div', { class: 'abl-row sep', html: `<div>${ABL_GROUP[a.group]}${a.group === 'channel' ? ' · one channel switched off, windows unchanged' : ''}</div>` }));
      }
      const nameHtml = a.group === 'channel' ? `${a.label} &nbsp;${markers(a.H, a.F)}` : a.label;
      host.append(el('div', { class: 'abl-row' }, el('div', { class: 'abl-name', html: nameHtml }), bar(a, 0), bar(a, 7)));
    });
    const axis = '<div class="abl-axis"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25 pts</span></div>';
    host.append(el('div', { class: 'abl-row axis', html: `<div></div><div>${axis}</div><div>${axis}</div>` }));
    whenVisible(host, () => fills.forEach(({ fill, label, pct }) => { fill.style.width = pct + '%'; label.style.left = pct + '%'; }));
  }

  function initAblationTable() {
    const host = $('#ablation-table');
    if (!host) return;
    const rk = D.columns.map((_, i) => ranks(D.ablations, i));
    let html = '<tr class="sec"><td colspan="11">Qwen2.5-1.5B-Instruct · ALFWorld: A<sub>CC</sub> only · WebShop: A<sub>CC</sub> + A<sub>EP</sub></td></tr>';
    let last = 'peers';
    D.ablations.forEach((a) => {
      if (a.group !== last) {
        last = a.group;
        html += `<tr class="sec"><td colspan="11">${ABL_GROUP[a.group]}</td></tr>`;
      }
      html += `<tr class="${a.id === 'full' ? 'ours' : ''}"><td colspan="2" class="m">${a.group === 'peers' ? a.label : `${a.group === 'channel' ? a.label + ' · ' : ''}H: ${a.H}, F: ${a.F}, W: ${a.H + a.F + 1} &nbsp;${markers(a.H, a.F)}`}</td>${tableCells(a, rk)}</tr>`;
    });
    host.innerHTML = `<table class="data">${HEAD.replace('<th>Type</th><th class="m">Method</th>', '<th colspan="2" class="m">Method</th>').replace('<th></th><th></th>', '<th colspan="2"></th>')}<tbody>${html}</tbody></table>`;
  }

  // Dot-and-line chart over an ordered sweep of temporal windows.
  function windowChart(host, ids) {
    const pts = ids.map((id) => D.ablations.find((a) => a.id === id));
    responsive(host, (W) => {
      host.innerHTML = '';
      const m = { l: 34, r: 16, t: 26, b: 66 };
      const PH = 170;
      const H = m.t + PH + m.b;
      const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'ALFWorld success by temporal window' });
      const lo = 55;
      const hi = 100;
      const y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * PH;
      const inner = W - m.l - m.r;
      const x = (i) => m.l + inner * (i + 0.5) / pts.length;
      [60, 70, 80, 90, 100].forEach((t) => {
        svg('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), stroke: '#e9e7e1', 'stroke-width': 1 }, root);
        svg('text', { x: m.l - 8, y: y(t) + 4, 'text-anchor': 'end', class: 'axis-text' }, root).textContent = t;
      });
      svg('text', { x: m.l - 26, y: 12, class: 'axis-title' }, root).textContent = 'ALFWorld success (%)';
      svg('path', { d: pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.v[0])}`).join(''), fill: 'none', stroke: '#b3b8c2', 'stroke-width': 1.5 }, root);
      pts.forEach((p, i) => {
        const cx = x(i);
        const cy = y(p.v[0]);
        const ours = p.id === 'full';
        const sd = p.sd[0];
        if (sd > 0) {
          svg('line', { x1: cx, x2: cx, y1: y(p.v[0] + sd), y2: y(p.v[0] - sd), stroke: INK, 'stroke-width': 1.5 }, root);
          [1, -1].forEach((s) => svg('line', { x1: cx - 4, x2: cx + 4, y1: y(p.v[0] + s * sd), y2: y(p.v[0] + s * sd), stroke: INK, 'stroke-width': 1.5 }, root));
        }
        if (ours) svg('circle', { cx, cy, r: 10.5, fill: 'none', stroke: ANCHOR, 'stroke-width': 2 }, root);
        svg('circle', { cx, cy, r: 6, fill: ours ? INK : '#fff', stroke: INK, 'stroke-width': 2 }, root);
        const labelY = Math.min(cy - (ours ? 17 : 12), y(p.v[0] + sd) - 7);
        svg('text', { x: cx, y: labelY, 'text-anchor': 'middle', class: 'pt-label' }, root).textContent = one(p.v[0]);
        // marker glyphs under the axis
        const n = p.H + p.F + 1;
        const tight = inner / pts.length < 78;
        const step = tight ? 7 : 10;
        const gx = cx - ((n - 1) * step) / 2;
        const gy = m.t + PH + 22;
        for (let k = 0; k < n; k++) {
          const px = gx + k * step;
          const r = tight ? 2.6 : 3.3;
          if (k < p.H) svg('circle', { cx: px, cy: gy, r, fill: HIST }, root);
          else if (k === p.H) {
            svg('circle', { cx: px, cy: gy, r: r - 0.2, fill: 'none', stroke: ANCHOR, 'stroke-width': 1.3 }, root);
            svg('circle', { cx: px, cy: gy, r: r - 2, fill: ANCHOR }, root);
          } else svg('circle', { cx: px, cy: gy, r: r - 0.5, fill: '#fff', stroke: FUT, 'stroke-width': 1.3 }, root);
        }
        svg('text', { x: cx, y: gy + 20, 'text-anchor': 'middle', class: 'pt-sub' }, root).textContent = `H${p.H} · F${p.F}`;
        if (ours) svg('text', { x: cx, y: gy + 34, 'text-anchor': 'middle', class: 'pt-sub', 'font-weight': 600, fill: INK }, root).textContent = 'CCPO';
        const hit = svg('rect', { x: cx - inner / pts.length / 2, y: 0, width: inner / pts.length, height: H, fill: 'transparent', tabindex: 0 }, root);
        bindTip(hit, () => `<span class="t-head">H: ${p.H}, F: ${p.F}, W: ${p.H + p.F + 1}</span><b>ALFWorld ${one(p.v[0])} ± ${one(sd)}</b>` +
          ['Pick', 'Look', 'Clean', 'Heat', 'Cool', 'Pick2'].map((c, k) => `<div class="t-row"><span>${c}</span><span>${one(p.v[k + 1])} ± ${one(p.sd[k + 1])}</span></div>`).join(''));
      });
      host.append(root);
    });
  }

  // ------------------------------------------------------ finding 1: the replay
  const METHODS = ['GiGPO', 'HGPO', 'G2PO', 'CCPO'];
  const placeName = (label) => {
    const m = label.match(/^([a-z]+)(\d+)$/);
    return m && D.place[m[1]] ? `${D.place[m[1]]} ${m[2]}` : label;
  };

  function initReplay() {
    const root = $('#replay');
    if (!root) return;
    const board = $('.replay', root);
    const range = $('input[type="range"]', root);
    const out = $('output', root);
    const playBtn = $('.play', root);
    const playText = $('span', playBtn);
    const state = { game: 'game42', t: 50, timer: null };
    let rows = [];

    function build() {
      const traj = F.trajectories[state.game];
      const meta = D.games[state.game];
      $('.task-text', root).textContent = meta.task;
      board.innerHTML = '';
      rows = [];
      const ticks = el('div', { class: 'ticks' });
      [1, 10, 20, 30, 40, 50].forEach((t) => ticks.append(el('span', { style: `left:${((t - 0.5) / 50) * 100}%` }, t)));
      board.append(el('div', { class: 'replay-row head' }, el('div'), ticks,
        el('div', { class: 'tally', html: '<div><small>revisits</small></div><div><small>places</small></div>' })));

      METHODS.forEach((method) => {
        const steps = traj[method];
        const seen = new Set();
        let revisits = 0;
        const info = steps.map(([kind, label]) => {
          let revisit = false;
          if (label) { if (seen.has(label)) { revisit = true; revisits += 1; } else seen.add(label); }
          return { kind, label, revisit, revisits, places: seen.size };
        });
        const strip = el('div', { class: 'strip' });
        const cells = info.map((s, i) => {
          const cell = el('span', { class: 'rc', 'data-k': s.kind });
          if (meta.twins[method] === i + 1) cell.classList.add('is-twin');
          bindTip(cell, () => {
            const note = meta.notes[method] && meta.notes[method][i + 1];
            let body;
            if (note) body = `<b>${note[0]}</b><span class="t-obs">${note[1]}</span>`;
            else if (s.kind === 'action') body = '<b>open, take or put</b>';
            else if (s.kind === 'invalid') body = '<b>invalid action</b>';
            else body = `<b>go to ${placeName(s.label)}</b>`;
            const nav = s.label ? `<div class="t-mute">${s.revisit ? 'revisit' : 'first visit'} · ${s.revisits} revisits so far</div>` : '';
            return `<span class="t-head">${method} · step ${i + 1}</span>${body}${nav}`;
          });
          strip.append(cell);
          return cell;
        });
        const solved = steps.length < 50;
        const flag = el('span', { class: 'end-flag ok', style: `left:${(steps.length / 50) * 100}%` }, solved ? `✓ solved in ${steps.length} steps` : '');
        strip.append(flag);
        const rv = el('div', { class: 'num' });
        const pl = el('div', { class: 'num' });
        const row = el('div', { class: 'replay-row' + (method === 'CCPO' ? ' is-ours' : '') },
          el('div', { class: 'who' }, method), strip, el('div', { class: 'tally' }, rv, pl));
        board.append(row);
        rows.push({ method, info, cells, flag, rv, pl, solved });
      });

      $('.replay-legend', root).innerHTML =
        `<span><i class="sq" style="--c:#f2c14e"></i>${meta.targetLegend}</span>` +
        `<span><i class="sq" style="--c:#7faedb"></i>${meta.goalLegend}</span>` +
        '<span><i class="sq" style="--c:#dcdde0"></i>other places</span>' +
        '<span><i class="sq" style="--c:#3b4150"></i>action (open, take or put)</span>' +
        '<span><i class="ring" style="--c:#a9acb1"></i>invalid action</span>' +
        (meta.twinText ? `<span><i class="ring" style="--c:${ANCHOR};border-width:2px"></i>identical observation</span>` : '');
      const note = $('.twin-note', root);
      note.classList.toggle('plain', !meta.twinText);
      note.innerHTML = meta.twinText
        ? `<span class="ring" aria-hidden="true"></span><div><q>${meta.twinText}</q>${meta.twinNote}</div>`
        : `<div>${meta.twinNote}</div>`;
      const zoom = $('[data-zoom-current]', root);
      zoom.dataset.zoom = meta.figure;
      zoom.dataset.caption = `ALFWorld evaluation trajectories, ${meta.title}: ${meta.task}.`;
      render();
    }

    function render() {
      const t = state.t;
      range.value = t;
      out.textContent = 'step ' + t;
      rows.forEach((r) => {
        const n = Math.min(t, r.info.length);
        r.cells.forEach((c, i) => {
          c.classList.toggle('is-off', i >= t);
          c.classList.toggle('is-now', t < 50 && i === t - 1);
        });
        const cur = n ? r.info[n - 1] : { revisits: 0, places: 0 };
        r.rv.innerHTML = `${cur.revisits}<span class="of">/${n}</span>`;
        r.pl.textContent = cur.places;
        r.flag.classList.toggle('is-on', r.solved && t >= r.info.length);
      });
    }

    function stop() {
      clearInterval(state.timer);
      state.timer = null;
      playText.textContent = 'Replay';
    }
    function play() {
      stop();
      state.t = 0;
      render();
      playText.textContent = 'Pause';
      state.timer = setInterval(() => {
        state.t += 1;
        render();
        if (state.t >= 50) stop();
      }, 105);
    }
    playBtn.addEventListener('click', () => (state.timer ? stop() : play()));
    range.addEventListener('input', () => { stop(); state.t = Number(range.value); render(); });
    seg($('[data-control="game"]', root), Object.values(D.games).map((g) => ({ value: g.id, label: g.title })), state.game, (v) => {
      stop();
      state.game = v;
      state.t = 50;
      build();
    });
    build();
    if (!reduceMotion) whenVisible($('.replay-scroll', root), play, 0.6);
  }

  function initRevisitBars() {
    const host = $('#revisit-bars');
    if (!host) return;
    D.revisitRate.forEach((r) => {
      host.append(el('div', {
        class: 'mini-row' + (r.ours ? ' is-ours' : ''),
        html: `<span>${r.method}</span><div class="mini-track"><div class="mini-fill" style="width:${(r.v / 50) * 100}%"></div></div><span class="v">${one(r.v)}% <small>±${one(r.sd)}</small></span>`,
      }));
    });
    host.append(el('div', { class: 'mini-row', html: '<span></span><div class="abl-axis" style="padding-right:0"><span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50%</span></div><span></span>' }));
  }

  // ------------------------------------------- findings 2 and 3: credit dynamics
  const SERIES = {
    acc: { base: 'A', sub: 'CC', color: INK, name: 'A<sub>CC</sub>', band: true },
    aep: { base: 'A', sub: 'EP', color: MUTED, name: 'A<sub>EP</sub> (not backpropagated)', dash: '5 4' },
    ah: { base: 'A', sup: 'H', color: HIST, name: 'A<sup>H</sup> historical', band: true },
    af: { base: 'A', sup: 'F', color: FUT, name: 'A<sup>F</sup> future', band: true },
  };

  function mathText(parent, attrs, s) {
    const t = svg('text', attrs, parent);
    t.append(s.base);
    const small = svg('tspan', { 'font-size': '0.72em', dy: s.sub ? 3 : -5 }, t);
    small.textContent = s.sub || s.sup;
    return t;
  }

  function dynamicsPanel(host, model, keys, opts) {
    const data = F.dynamics[model];
    const state = opts.state;
    function draw(W) {
      host.innerHTML = '';
      const m = { l: 32, r: 44, t: 8 };
      const H1 = 196;
      const GAP = 18;
      const H2 = 44;
      const H = m.t + H1 + GAP + H2 + 36;
      const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Mean absolute credit over training, ALFWorld ${model}` });
      const x = (s) => m.l + ((s - 1) / 149) * (W - m.l - m.r);
      const y = (v) => m.t + (1 - Math.min(v, 1.05)) * H1;
      const y2 = (p) => m.t + H1 + GAP + (1 - p / 100) * H2;
      const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join('');

      (opts.shade || []).forEach(([a, b, label]) => {
        svg('rect', { x: x(a), y: m.t, width: x(b) - x(a), height: H1, fill: INK, opacity: 0.045 }, root);
        svg('text', { x: (x(a) + x(b)) / 2, y: m.t + 13, 'text-anchor': 'middle', class: 'band-label' }, root).textContent = label;
      });
      [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((t) => {
        svg('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), stroke: t ? '#e9e7e1' : '#c9c7c0', 'stroke-width': 1 }, root);
        svg('text', { x: m.l - 7, y: y(t) + 4, 'text-anchor': 'end', class: 'axis-text' }, root).textContent = t === 0 ? '0' : t === 1 ? '1' : t.toFixed(1);
      });

      keys.forEach((k) => {
        const s = SERIES[k];
        if (s.band && data[k + 'Lo']) {
          const top = data[k + 'Hi'].map((v, i) => `${i ? 'L' : 'M'}${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join('');
          const bottom = data[k + 'Lo'].map((v, i) => `L${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).reverse().join('');
          svg('path', { d: top + bottom + 'Z', fill: s.color, opacity: 0.14 }, root);
        }
      });
      if (state.raw) keys.forEach((k) => svg('path', { d: path(data[k + 'Raw']), fill: 'none', stroke: SERIES[k].color, 'stroke-width': 0.9, opacity: 0.4 }, root));
      keys.forEach((k) => {
        const s = SERIES[k];
        svg('path', { d: path(data[k]), fill: 'none', stroke: s.color, 'stroke-width': k === 'acc' && keys.length > 2 ? 1.6 : 2, 'stroke-dasharray': s.dash || 'none', 'stroke-linejoin': 'round' }, root);
      });

      // direct labels at the right edge, nudged apart when lines end close together
      const ends = keys.map((k) => ({ k, y: y(data[k][149]) })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
      ends.forEach((e) => {
        svg('circle', { cx: x(150), cy: y(data[e.k][149]), r: 3.5, fill: SERIES[e.k].color, stroke: '#fff', 'stroke-width': 1.5 }, root);
        mathText(root, { x: x(150) + 9, y: e.y + 4, class: 'end-label', fill: INK }, SERIES[e.k]);
      });

      // Validation success as an unlabelled trend on its own strip; the numbers
      // that matter are the final results in the tables.
      const val = data.val;
      const vLine = val.map(([s, p], i) => `${i ? 'L' : 'M'}${x(s).toFixed(1)},${y2(p).toFixed(1)}`).join('');
      svg('path', { d: `${vLine}L${x(150)},${y2(0)}L${x(val[0][0])},${y2(0)}Z`, fill: INK, opacity: 0.07 }, root);
      svg('path', { d: vLine, fill: 'none', stroke: '#676d7b', 'stroke-width': 1.5 }, root);
      svg('line', { x1: m.l, x2: W - m.r, y1: y2(0), y2: y2(0), stroke: '#c9c7c0', 'stroke-width': 1 }, root);
      svg('text', { x: m.l + 4, y: y2(100) + 9, class: 'band-label' }, root).textContent = 'VALIDATION SUCCESS';
      [1, 50, 100, 150].forEach((s) => {
        svg('text', { x: x(s), y: y2(0) + 17, 'text-anchor': 'middle', class: 'axis-text' }, root).textContent = s;
      });
      svg('text', { x: (m.l + W - m.r) / 2, y: y2(0) + 32, 'text-anchor': 'middle', class: 'axis-title' }, root).textContent = 'Training iteration';

      // hover: crosshair, one dot per series, tooltip
      const hair = svg('line', { y1: m.t, y2: y2(0), stroke: INK, 'stroke-width': 1, opacity: 0, 'pointer-events': 'none' }, root);
      const dots = keys.map((k) => svg('circle', { r: 4.5, fill: SERIES[k].color, stroke: '#fff', 'stroke-width': 2, opacity: 0, 'pointer-events': 'none' }, root));
      const hit = svg('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: y2(0) - m.t, fill: 'transparent' }, root);
      const move = (e) => {
        const box = root.getBoundingClientRect();
        const step = Math.max(1, Math.min(150, Math.round(((e.clientX - box.left - m.l) / (W - m.l - m.r)) * 149) + 1));
        hair.setAttribute('x1', x(step));
        hair.setAttribute('x2', x(step));
        hair.setAttribute('opacity', 0.35);
        keys.forEach((k, i) => {
          dots[i].setAttribute('cx', x(step));
          dots[i].setAttribute('cy', y(data[k][step - 1]));
          dots[i].setAttribute('opacity', 1);
        });
        showTip(`<span class="t-head">ALFWorld ${model} · iteration ${step}</span>` +
          keys.map((k) => `<div class="t-row"><span><i style="--c:${SERIES[k].color}"></i>|${SERIES[k].name.replace(/ \(.*| historical| future/g, '')}|</span><span>${data[k][step - 1].toFixed(2)}</span></div>`).join(''), e.clientX, e.clientY);
      };
      hit.addEventListener('pointermove', move);
      hit.addEventListener('pointerdown', move);
      hit.addEventListener('pointerleave', () => {
        hideTip();
        [hair, ...dots].forEach((n) => n.setAttribute('opacity', 0));
      });
      host.append(root);
    }
    let width = 0;
    responsive(host, (W) => { width = W; draw(W); });
    return () => width && draw(width);
  }

  function initDynamics(id, keys, opts = {}) {
    const root = $(id);
    if (!root) return;
    const state = { raw: false };
    const panels = $('.panels', root);
    const redraw = [];
    ['1.5B', '7B'].forEach((model) => {
      const chart = el('div', { class: 'chart-host' });
      const ratio = F.dynamics[model].ratio;
      const side = opts.ratio ? `<span>|A<sup>F</sup>| / |A<sup>H</sup>| &nbsp;<b>${ratio[0].toFixed(2)} → ${ratio[1].toFixed(2)}</b></span>` : '<span>mean |A|</span>';
      panels.append(el('div', {}, el('div', { class: 'panel-title', html: `ALFWorld · Qwen2.5-${model}${side}` }), chart));
      redraw.push(dynamicsPanel(chart, model, keys, { state, shade: opts.shade }));
    });
    $('.legend', root).innerHTML = keys.map((k) => `<span><i class="${SERIES[k].dash ? 'dash' : ''}" style="--c:${SERIES[k].color}"></i>${SERIES[k].name}</span>`).join('') +
      '<span><i class="band" style="--c:#11141b"></i>95% bootstrap CI</span>';
    $('[data-raw]', root).addEventListener('change', (e) => { state.raw = e.target.checked; redraw.forEach((fn) => fn()); });
  }

  function initCorrelation() {
    const host = $('#corr-grid');
    if (!host) return;
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const NEUTRAL = [240, 239, 236];
    const POS = [63, 74, 99];
    const NEG = [217, 102, 43];
    ['1.5B', '7B'].forEach((model) => {
      host.append(el('div', { class: 'rl' }, model));
      F.dynamics[model].corr.forEach((r, i) => {
        const c = mix(NEUTRAL, r >= 0 ? POS : NEG, Math.abs(r));
        const cell = el('div', { class: 'corr-cell', tabindex: '0', style: `--bg:rgb(${c});--fg:${Math.abs(r) > 0.55 ? '#fff' : INK}` }, signed(r, 2));
        bindTip(cell, () => `<span class="t-head">Qwen2.5-${model} · iterations ${i * 10 + 1}–${i * 10 + 10}</span>Pearson r between |A<sup>H</sup>| and |A<sup>F</sup>|: <b>${signed(r, 2)}</b>`);
        host.append(cell);
      });
    });
    host.append(el('div'));
    for (let i = 0; i < 15; i++) host.append(el('div', { class: 'tk' }, `${i * 10 + 1}–${i * 10 + 10}`));
  }

  // ------------------------------------------------ finding 4: credit preferences
  // All four runs side by side under each credit signal, as in the paper's Figure 5.
  function initCreditPreferences() {
    const root = $('#prefs');
    if (!root) return;
    const data = F.creditPreference;
    const SIGNALS = [['AH', 'A<sup>H</sup>'], ['AF', 'A<sup>F</sup>'], ['ACC', 'A<sub>CC</sub>']];
    const RUNS = [
      ['full', '<b>CCPO (full)</b>', markers(2, 2)],
      ['noSummary', 'w/o context summary', markers(2, 2)],
      ['historyOnly', 'History only', markers(4, 0)],
      ['futureOnly', 'Future only', markers(0, 4)],
    ];
    // Interval bounds as the paper prints them: no leading zero.
    const bound = (v) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(3).slice(1);
    const tint = (v) => {
      const a = (0.1 + 0.58 * Math.min(1, Math.abs(v) / 0.8)).toFixed(3);
      return v >= 0 ? `rgba(46, 158, 107, ${a})` : `rgba(209, 75, 61, ${a})`;
    };
    const host = $('.cp', root);
    SIGNALS.forEach(([key, name]) => {
      let html = `<thead><tr><th class="cp-label"></th><th colspan="4" class="cp-signal">${name}</th></tr>` +
        `<tr><th class="cp-label"></th>${RUNS.map((r) => `<th>${r[1]}${r[2]}</th>`).join('')}</tr></thead><tbody>`;
      data.categories.forEach((cat, i) => {
        html += `<tr class="${cat === 'New location' ? 'is-key' : ''}"><th class="cp-label" scope="row">${cat}</th>`;
        RUNS.forEach(([run]) => {
          const g = data.runs[run][key][i];
          if (g === 'off') html += '<td class="is-off">off</td>';
          else if (g === 'na') html += '<td class="is-na">—</td>';
          else html += `<td style="--bg:${tint(g.v)}" data-run="${run}" data-i="${i}"><b>${signed(g.v)}${g.sig ? '<sup>*</sup>' : ''}</b><small>[${bound(g.lo)},${bound(g.hi)}]</small></td>`;
        });
        html += '</tr>';
      });
      const table = el('table', { class: 'cp-table', html: html + '</tbody>' });
      table.querySelectorAll('td[data-run]').forEach((td) => {
        const g = data.runs[td.dataset.run][key][Number(td.dataset.i)];
        const run = RUNS.find((r) => r[0] === td.dataset.run)[1].replace(/<[^>]+>/g, '');
        td.tabIndex = 0;
        bindTip(td, () => `<span class="t-head">${data.categories[td.dataset.i]} · ${run}</span>` +
          `<div class="t-row"><span>${name}</span><span>${signed(g.v)}</span></div>` +
          `<div class="t-row t-mute"><span>adjusted interval</span><span>[${signed(g.lo)}, ${signed(g.hi)}]</span></div>` +
          `<div class="t-mute">${g.sig ? 'interval excludes zero' : 'interval includes zero'}</div>`);
      });
      host.append(table);
    });

    // The paired channel comparison reported in Appendix E, on its own narrow axis.
    const p = (v) => ((v + 0.02) / 0.1) * 100;
    $('.paired', root).innerHTML =
      '<div class="paired-num"><small>New location · A<sup>F</sup> − A<sup>H</sup></small>+0.037</div>' +
      '<div><p>Paired within groups in full CCPO, the future channel credits new-location transitions more than the historical channel. Each channel’s own interval includes zero; the interval of their paired difference does not.</p>' +
      `<div class="paired-axis"><i class="z"></i><i class="ci" style="left:${p(0.0011)}%;width:${p(0.0727) - p(0.0011)}%"></i><i class="pt" style="left:${p(0.0372)}%"></i>` +
      `<span style="left:${p(0)}%">0</span><span style="left:${p(0.04)}%">+0.04</span><span style="left:${p(0.08)}%">+0.08</span></div></div>`;
  }

  // ---------------------------------------------------- finding 5: action timing
  function initTiming() {
    const root = $('#timing');
    if (!root) return;
    const host = $('.timing', root);
    const arms = [
      ['noSummary', 'w/o context summary', markers(2, 2)],
      ['historyOnly', 'History-only window', markers(4, 0)],
      ['futureOnly', 'Future-only window', markers(0, 4)],
    ];
    host.append(el('div', { class: 'timing-row head', html: '<div></div>' + arms.map((a) => `<div>${a[1]}<small>${a[2]} &nbsp;vs full CCPO</small></div>`).join('') }));
    Object.entries(F.timing).forEach(([cat, byArm]) => {
      const row = el('div', { class: 'timing-row' + (cat === 'Open' ? ' is-key' : '') }, el('div', { class: 'cat' }, cat));
      arms.forEach(([key, name]) => {
        const [e, s, l] = byArm[key];
        const stack = el('div', { class: 'stack', tabindex: '0' });
        [['e', e], ['s', s], ['l', l]].forEach(([c, v]) => stack.append(el('div', { class: 'seg3 ' + c, style: `flex:${v} 1 0` }, v >= 13 ? one(v) : '')));
        bindTip(stack, () => `<span class="t-head">${cat} · ${name}</span>` +
          `<div class="t-row"><span><i style="--c:#d9662b"></i>Earlier than full CCPO</span><span>${one(e)}%</span></div>` +
          `<div class="t-row"><span><i style="--c:#c9c9c5"></i>Same step</span><span>${one(s)}%</span></div>` +
          `<div class="t-row"><span><i style="--c:#2b74d1"></i>Later</span><span>${one(l)}%</span></div>`);
        row.append(el('div', { class: 'timing-cell' }, el('small', {}, name), stack));
      });
      host.append(row);
    });
    $('.legend', root).innerHTML =
      '<span><i class="sq" style="--c:#d9662b"></i>Earlier</span><span><i class="sq" style="--c:#e6e6e3"></i>Same step</span><span><i class="sq" style="--c:#2b74d1"></i>Later</span>';
  }

  // ------------------------------------------------------------------- startup
  const boot = () => {
    [initStage, initResults, initResultsTable, initAblations, initAblationTable,
      () => windowChart($('#window-shift'), ['h4f0', 'h3f1', 'full', 'h1f3', 'h0f4']),
      () => windowChart($('#window-width'), ['h1f1', 'full', 'h3f3']),
      initReplay, initRevisitBars,
      () => initDynamics('#dyn-compare', ['acc', 'aep']),
      () => initDynamics('#dyn-decomp', ['ah', 'af', 'acc'], { ratio: true, shade: [[1, 30, '1–30'], [121, 150, '121–150']] }),
      initCorrelation, initCreditPreferences, initTiming,
    ].forEach((fn) => {
      try { fn(); } catch (err) { console.error('[ccpo]', err); }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
