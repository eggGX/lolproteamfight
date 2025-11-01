import { createApp, h, Fragment } from './lib/vue-lite.js';
import { champions as defaultChampions } from './champions.js';
import { loadMatches, saveMatches } from './storage.js';

const LANES = [
  { key: 'top', label: 'トップ' },
  { key: 'jungle', label: 'ジャングル' },
  { key: 'mid', label: 'ミッド' },
  { key: 'adc', label: 'ボット(ADC)' },
  { key: 'support', label: 'サポート' }
];

const TEAMS = [
  { key: 'blue', label: 'ブルーチーム' },
  { key: 'red', label: 'レッドチーム' }
];

const TOTAL_SLOTS = LANES.length * TEAMS.length;

function createEmptyDraft() {
  return TEAMS.reduce((teamAcc, team) => {
    const lanes = LANES.reduce((laneAcc, lane) => {
      laneAcc[lane.key] = null;
      return laneAcc;
    }, {});
    teamAcc[team.key] = lanes;
    return teamAcc;
  }, {});
}

function listChampionIdsFromDraft(draft) {
  if (!draft) {
    return [];
  }
  const result = [];
  TEAMS.forEach(({ key: teamKey }) => {
    const teamDraft = draft[teamKey] || {};
    LANES.forEach(({ key: laneKey }) => {
      const value = teamDraft[laneKey];
      if (value) {
        result.push(value);
      }
    });
  });
  return result;
}

function normalizeMatch(match) {
  if (!match) {
    return null;
  }
  const normalized = { ...match };
  if (!match.champions || Array.isArray(match.champions)) {
    const draft = createEmptyDraft();
    const source = Array.isArray(match.champions)
      ? match.champions
      : Array.isArray(match.selectedChampions)
        ? match.selectedChampions
        : [];
    source.slice(0, LANES.length).forEach((championId, index) => {
      draft.blue[LANES[index].key] = championId;
    });
    normalized.champions = draft;
  } else {
    const draft = createEmptyDraft();
    TEAMS.forEach(({ key: teamKey }) => {
      LANES.forEach(({ key: laneKey }) => {
        draft[teamKey][laneKey] = match.champions?.[teamKey]?.[laneKey] || null;
      });
    });
    normalized.champions = draft;
  }
  delete normalized.selectedChampions;
  return normalized;
}

function formatDateLabel(value) {
  if (!value) return '未設定';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function createSortButton(ctx, key, label) {
  const isActive = ctx.statsSort.key === key;
  const indicator = ctx.statsSort.direction === 'desc' ? '↓' : '↑';
  return h(
    'button',
    {
      type: 'button',
      class: `soft-btn${isActive ? ' active' : ''}`,
      onClick: () => ctx.setStatsSort(key)
    },
    `${label}${isActive ? indicator : ''}`
  );
}

function renderChampionPicker(ctx) {
  const filteredChampions = ctx.filteredChampionList();
  const context = ctx.pickerContext;
  const laneLabel = context ? LANES.find((lane) => lane.key === context.lane)?.label : '';
  const teamLabel = context ? TEAMS.find((team) => team.key === context.team)?.label : '';

  return h('div', { class: 'modal-backdrop' }, [
    h('div', { class: 'modal-panel' }, [
      h('div', { class: 'section-title modal-header' }, [
        h('h2', {}, 'チャンピオンを選択'),
        h('div', { class: 'modal-header-actions' }, [
          context ? h('span', { class: 'tag' }, `${teamLabel} - ${laneLabel}`) : null,
          h(
            'button',
            {
              type: 'button',
              class: 'secondary-btn',
              onClick: ctx.closeChampionPicker
            },
            '閉じる'
          )
        ])
      ]),
      h('div', {}, [
        h('label', { for: 'champion-search' }, 'チャンピオン検索'),
        h('input', {
          id: 'champion-search',
          type: 'text',
          value: ctx.championSearch,
          placeholder: 'チャンピオン名やロールを検索',
          onInput: (event) => (ctx.championSearch = event.target.value)
        })
      ]),
      ctx.pickerError ? h('div', { class: 'error-message' }, ctx.pickerError) : null,
      filteredChampions.length === 0
        ? h('div', { class: 'empty-state' }, '該当するチャンピオンが見つかりません。')
        : h(
            'div',
            { class: 'champion-grid' },
            filteredChampions.map((champion) =>
              h('div', { class: 'champion-card' }, [
                h('img', { src: champion.image, alt: champion.name }),
                h('div', { class: 'info' }, [
                  h('div', { class: 'name' }, champion.name),
                  h('div', { class: 'role' }, champion.role)
                ]),
                ctx.isChampionSelected(champion.id)
                  ? h(
                      'button',
                      {
                        type: 'button',
                        class: 'secondary-btn',
                        disabled: true
                      },
                      '選択済み'
                    )
                  : h(
                      'button',
                      {
                        type: 'button',
                        class: 'primary-btn',
                        onClick: () => ctx.assignChampionToContext(champion.id)
                      },
                      '追加'
                    )
              ])
            )
          )
    ])
  ]);
}

function renderTeamLaneSection(ctx, team) {
  const teamDraft = ctx.matchForm.champions[team.key];
  return h('div', { class: `team-column ${team.key}` }, [
    h('h3', {}, team.label),
    ...LANES.map((lane) => {
      const championId = teamDraft[lane.key];
      const champion = championId ? ctx.findChampion(championId) : null;
      return h('div', { class: 'lane-slot' }, [
        h('div', { class: 'slot-header' }, [
          h('span', { class: 'lane-name' }, lane.label),
          champion
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'secondary-btn compact',
                  onClick: () => ctx.clearChampionSlot(team.key, lane.key)
                },
                'クリア'
              )
            : null
        ]),
        champion
          ? h('div', { class: 'selected-champion' }, [
              h('img', { src: champion.image, alt: champion.name }),
              h('div', { class: 'details' }, [
                h('span', { class: 'name' }, champion.name),
                champion.role ? h('span', { class: 'role' }, champion.role) : null
              ])
            ])
          : h('div', { class: 'selected-champion empty' }, '未選択'),
        h(
          'button',
          {
            type: 'button',
            class: 'primary-btn lane-action',
            onClick: () => ctx.openChampionPicker(team.key, lane.key)
          },
          champion ? '変更する' : '選択する'
        )
      ]);
    })
  ]);
}

function renderMatchTeamDraft(ctx, match, team) {
  const draft = match.champions?.[team.key] || {};
  return h('div', { class: `team-draft ${team.key}` }, [
    h('h3', {}, team.label),
    ...LANES.map((lane) => {
      const championId = draft[lane.key];
      const champion = championId ? ctx.findChampion(championId) : null;
      return h('div', { class: 'lane-row' }, [
        h('span', { class: 'lane-label' }, lane.label),
        champion
          ? h('div', { class: 'lane-champion' }, [
              h('img', { src: champion.image, alt: champion.name, title: champion.name }),
              h('span', {}, champion.name)
            ])
          : h('span', { class: 'lane-champion empty' }, '未登録')
      ]);
    })
  ]);
}

function renderMatchCard(ctx, match) {
  const championBadges = listChampionIdsFromDraft(match.champions)
    .map((id) => ctx.findChampion(id))
    .filter(Boolean);

  return h('article', { class: 'match-card' }, [
    h('div', { class: 'match-header' }, [
      h('div', {}, [
        h('div', { class: 'match-title' }, [
          h('strong', {}, match.teamName || '未設定'),
          match.opponent ? h('span', {}, ` vs ${match.opponent}`) : null
        ])
      ]),
      h(
        'button',
        {
          type: 'button',
          class: 'danger-btn',
          onClick: () => ctx.removeMatch(match.id)
        },
        '削除'
      )
    ]),
    h('div', { class: 'match-meta' }, [
      h('span', { class: `badge ${match.result === 'win' ? 'win' : 'loss'}` }, match.result === 'win' ? 'WIN' : 'LOSS'),
      h('span', { class: `badge ${match.side === 'blue' ? 'blue' : 'red'}` }, match.side.toUpperCase()),
      h('span', {}, formatDateLabel(match.matchDate)),
      match.opponent ? h('span', {}, `vs ${match.opponent}`) : null
    ]),
    championBadges.length
      ? h(
          'div',
          { class: 'champion-avatars' },
          championBadges.map((champion) =>
            h('img', { src: champion.image, alt: champion.name, title: champion.name })
          )
        )
      : h('div', { class: 'helper-text' }, 'チャンピオンは登録されていません。'),
    h('div', { class: 'match-draft' }, TEAMS.map((team) => renderMatchTeamDraft(ctx, match, team))),
    match.notes ? h('div', { class: 'helper-text' }, `メモ: ${match.notes}`) : null
  ]);
}

const App = {
  setup() {
    const today = new Date().toISOString().slice(0, 10);
    const state = {
      champions: defaultChampions,
      matches: loadMatches().map(normalizeMatch).filter(Boolean),
      matchForm: {
        teamName: '',
        opponent: '',
        side: 'blue',
        result: 'win',
        champions: createEmptyDraft(),
        notes: '',
        matchDate: today
      },
      filters: {
        team: '',
        opponent: '',
        side: 'all',
        result: 'all'
      },
      championSearch: '',
      showChampionPicker: false,
      pickerContext: null,
      pickerError: '',
      statsSort: {
        key: 'total',
        direction: 'desc'
      },
      formError: ''
    };

    state.resetForm = function () {
      this.matchForm.teamName = '';
      this.matchForm.opponent = '';
      this.matchForm.side = 'blue';
      this.matchForm.result = 'win';
      this.matchForm.champions = createEmptyDraft();
      this.matchForm.notes = '';
      this.matchForm.matchDate = new Date().toISOString().slice(0, 10);
      this.formError = '';
    };

    state.findChampion = function (id) {
      return this.champions.find((champion) => champion.id === id) || null;
    };

    state.getAllSelectedChampionIds = function () {
      return listChampionIdsFromDraft(this.matchForm.champions);
    };

    state.selectedChampionCount = function () {
      return this.getAllSelectedChampionIds().length;
    };

    state.isChampionSelected = function (id) {
      const selected = this.getAllSelectedChampionIds();
      if (this.pickerContext) {
        const current = this.matchForm.champions[this.pickerContext.team][this.pickerContext.lane];
        if (current === id) {
          return false;
        }
      }
      return selected.includes(id);
    };

    state.openChampionPicker = function (team, lane) {
      this.championSearch = '';
      this.pickerContext = { team, lane };
      this.pickerError = '';
      this.showChampionPicker = true;
    };

    state.closeChampionPicker = function () {
      this.showChampionPicker = false;
      this.pickerContext = null;
      this.pickerError = '';
    };

    state.assignChampionToContext = function (id) {
      if (!this.pickerContext) {
        return;
      }
      const { team, lane } = this.pickerContext;
      const currentId = this.matchForm.champions[team][lane];
      if (currentId === id) {
        this.closeChampionPicker();
        return;
      }
      if (this.isChampionSelected(id)) {
        this.pickerError = 'このチャンピオンは既に別のレーンで使用されています。';
        return;
      }
      this.matchForm.champions[team][lane] = id;
      this.pickerError = '';
      this.closeChampionPicker();
    };

    state.clearChampionSlot = function (team, lane) {
      this.matchForm.champions[team][lane] = null;
      this.formError = '';
    };

    state.setSide = function (side) {
      this.matchForm.side = side;
    };

    state.setResult = function (result) {
      this.matchForm.result = result;
    };

    state.filteredChampionList = function () {
      const query = this.championSearch.trim().toLowerCase();
      if (!query) {
        return this.champions;
      }
      return this.champions.filter((champion) => {
        return (
          champion.name.toLowerCase().includes(query) ||
          champion.role.toLowerCase().includes(query) ||
          champion.positions.some((pos) => pos.toLowerCase().includes(query)) ||
          champion.classes.some((cls) => cls.toLowerCase().includes(query))
        );
      });
    };

    state.submitMatch = function (event) {
      event.preventDefault();
      if (!this.matchForm.teamName.trim()) {
        this.formError = '使用チームを入力してください。';
        return;
      }

      const missingSlots = [];
      TEAMS.forEach(({ key: teamKey }) => {
        LANES.forEach(({ key: laneKey }) => {
          if (!this.matchForm.champions[teamKey][laneKey]) {
            missingSlots.push([teamKey, laneKey]);
          }
        });
      });

      if (missingSlots.length > 0) {
        this.formError = 'すべてのレーンにチャンピオンを登録してください。';
        return;
      }

      const newMatch = {
        id: Date.now(),
        teamName: this.matchForm.teamName.trim(),
        opponent: this.matchForm.opponent.trim(),
        side: this.matchForm.side,
        result: this.matchForm.result,
        champions: JSON.parse(JSON.stringify(this.matchForm.champions)),
        notes: this.matchForm.notes.trim(),
        matchDate: this.matchForm.matchDate,
        createdAt: new Date().toISOString()
      };

      this.matches.unshift(newMatch);
      saveMatches(this.matches);
      this.resetForm();
      this.closeChampionPicker();
    };

    state.removeMatch = function (matchId) {
      this.matches = this.matches.filter((match) => match.id !== matchId);
      saveMatches(this.matches);
    };

    state.clearMatches = function () {
      if (!this.matches.length) {
        return;
      }
      if (typeof confirm === 'function') {
        const confirmed = confirm('すべての試合データを削除しますか？');
        if (!confirmed) {
          return;
        }
      }
      this.matches = [];
      saveMatches(this.matches);
    };

    state.filteredMatches = function () {
      return this.matches.filter((match) => {
        const teamName = (match.teamName || '').toLowerCase();
        const opponentName = (match.opponent || '').toLowerCase();
        if (this.filters.team && !teamName.includes(this.filters.team.toLowerCase())) {
          return false;
        }
        if (this.filters.opponent && !opponentName.includes(this.filters.opponent.toLowerCase())) {
          return false;
        }
        if (this.filters.side !== 'all' && match.side !== this.filters.side) {
          return false;
        }
        if (this.filters.result !== 'all' && match.result !== this.filters.result) {
          return false;
        }
        return true;
      });
    };

    state.teamOptions = function () {
      const set = new Set();
      this.matches.forEach((match) => {
        if (match.teamName) set.add(match.teamName);
        if (match.opponent) set.add(match.opponent);
      });
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'));
    };

    state.championUsage = function () {
      const usageMap = new Map();
      this.champions.forEach((champion) => {
        usageMap.set(champion.id, {
          champion,
          total: 0,
          wins: 0,
          losses: 0
        });
      });

      this.matches.forEach((match) => {
        listChampionIdsFromDraft(match.champions).forEach((championId) => {
          if (!usageMap.has(championId)) {
            const champion = this.findChampion(championId) || {
              id: championId,
              name: championId,
              image: '',
              role: ''
            };
            usageMap.set(championId, {
              champion,
              total: 0,
              wins: 0,
              losses: 0
            });
          }

          const entry = usageMap.get(championId);
          entry.total += 1;
          if (match.result === 'win') {
            entry.wins += 1;
          } else {
            entry.losses += 1;
          }
        });
      });

      return Array.from(usageMap.values()).filter((item) => item.total > 0);
    };

    state.setStatsSort = function (key) {
      if (this.statsSort.key === key) {
        this.statsSort.direction = this.statsSort.direction === 'desc' ? 'asc' : 'desc';
      } else {
        this.statsSort.key = key;
        this.statsSort.direction = 'desc';
      }
    };

    state.sortedChampionUsage = function () {
      const usage = this.championUsage();
      const { key, direction } = this.statsSort;
      const factor = direction === 'desc' ? -1 : 1;
      return usage
        .slice()
        .sort((a, b) => {
          if (a[key] === b[key]) {
            return a.champion.name.localeCompare(b.champion.name, 'ja');
          }
          return a[key] < b[key] ? factor : -factor;
        });
    };

    return state;
  },
  render(ctx) {
    const matches = ctx.filteredMatches();

    return h(Fragment, {}, [
      h('header', {}, [
        h('h1', {}, 'LoL Teamfight Manager'),
        h('p', { class: 'subtitle' }, '試合結果とチャンピオンの使用状況をまとめて管理できます。')
      ]),
      h('main', {}, [
        h('section', { class: 'panel form-panel' }, [
          h('div', { class: 'section-title' }, [
            h('h2', {}, '試合を登録'),
            h('div', { class: 'tag-list' }, [
              h('span', { class: 'tag' }, `登録試合数: ${ctx.matches.length}`),
              h('span', { class: 'tag' }, `チャンピオン選択 ${ctx.selectedChampionCount()}/${TOTAL_SLOTS}`)
            ])
          ]),
          h(
            'form',
            {
              class: 'form-grid',
              onSubmit: ctx.submitMatch
            },
            [
              h('div', {}, [
                h('label', { for: 'match-date' }, '日付'),
                h('input', {
                  id: 'match-date',
                  type: 'date',
                  value: ctx.matchForm.matchDate,
                  onInput: (event) => (ctx.matchForm.matchDate = event.target.value)
                })
              ]),
              h('div', {}, [
                h('label', { for: 'team-name' }, '使用チーム'),
                h('input', {
                  id: 'team-name',
                  type: 'text',
                  value: ctx.matchForm.teamName,
                  placeholder: '例: T1',
                  onInput: (event) => (ctx.matchForm.teamName = event.target.value)
                })
              ]),
              h('div', {}, [
                h('label', { for: 'opponent-name' }, '対戦相手 (任意)'),
                h('input', {
                  id: 'opponent-name',
                  type: 'text',
                  value: ctx.matchForm.opponent,
                  placeholder: '例: Gen.G',
                  onInput: (event) => (ctx.matchForm.opponent = event.target.value)
                })
              ]),
              h('div', {}, [
                h('label', {}, 'サイド'),
                h('div', { class: 'radio-group' }, [
                  h(
                    'button',
                    {
                      type: 'button',
                      class: `radio-pill${ctx.matchForm.side === 'blue' ? ' active' : ''}`,
                      onClick: () => ctx.setSide('blue')
                    },
                    'ブルーサイド'
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      class: `radio-pill${ctx.matchForm.side === 'red' ? ' active' : ''}`,
                      onClick: () => ctx.setSide('red')
                    },
                    'レッドサイド'
                  )
                ])
              ]),
              h('div', {}, [
                h('label', {}, '結果'),
                h('div', { class: 'result-group' }, [
                  h(
                    'button',
                    {
                      type: 'button',
                      class: `radio-pill${ctx.matchForm.result === 'win' ? ' active' : ''}`,
                      onClick: () => ctx.setResult('win')
                    },
                    '勝利'
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      class: `radio-pill${ctx.matchForm.result === 'loss' ? ' active' : ''}`,
                      onClick: () => ctx.setResult('loss')
                    },
                    '敗北'
                  )
                ])
              ]),
              h('div', { class: 'lane-selection' }, TEAMS.map((team) => renderTeamLaneSection(ctx, team))),
              h('div', {}, [
                h('label', { for: 'match-notes' }, 'メモ'),
                h('textarea', {
                  id: 'match-notes',
                  value: ctx.matchForm.notes,
                  placeholder: '試合のポイントや構成の意図など',
                  onInput: (event) => (ctx.matchForm.notes = event.target.value)
                })
              ]),
              ctx.formError ? h('div', { class: 'error-message' }, ctx.formError) : null,
              h(
                'div',
                { class: 'form-actions' },
                [
                  h(
                    'button',
                    {
                      type: 'submit',
                      class: 'primary-btn'
                    },
                    '試合を登録'
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'secondary-btn',
                      onClick: ctx.resetForm
                    },
                    'リセット'
                  )
                ]
              )
            ]
          )
        ]),
        h('section', { class: 'panel stats-panel' }, [
          h('div', { class: 'section-title' }, [
            h('h2', {}, 'チャンピオン使用状況'),
            h('div', { class: 'actions' }, [
              createSortButton(ctx, 'total', '合計'),
              createSortButton(ctx, 'wins', '勝利'),
              createSortButton(ctx, 'losses', '敗北')
            ])
          ]),
          h('div', { class: 'champion-usage-meta' }, [
            h('span', { class: 'tag' }, `登録試合 ${ctx.matches.length}`),
            h('span', { class: 'tag' }, `勝利 ${ctx.matches.filter((m) => m.result === 'win').length}`),
            h('span', { class: 'tag' }, `敗北 ${ctx.matches.filter((m) => m.result === 'loss').length}`)
          ]),
          renderStatsTable(ctx)
        ]),
        h('section', { class: 'panel matches-panel' }, [
          h('div', { class: 'section-title' }, [
            h('h2', {}, '登録済みの試合'),
            h('div', { class: 'actions' }, [
              h(
                'button',
                {
                  type: 'button',
                  class: 'secondary-btn',
                  onClick: ctx.clearMatches
                },
                '全て削除'
              )
            ])
          ]),
          h('div', { class: 'filters' }, [
            h('input', {
              type: 'text',
              value: ctx.filters.team,
              placeholder: 'チーム名で絞り込み',
              onInput: (event) => (ctx.filters.team = event.target.value)
            }),
            h('input', {
              type: 'text',
              value: ctx.filters.opponent,
              placeholder: '対戦相手で絞り込み',
              onInput: (event) => (ctx.filters.opponent = event.target.value)
            }),
            h(
              'select',
              {
                value: ctx.filters.side,
                onChange: (event) => (ctx.filters.side = event.target.value)
              },
              [
                h('option', { value: 'all' }, 'サイド (すべて)'),
                h('option', { value: 'blue' }, 'ブルーサイド'),
                h('option', { value: 'red' }, 'レッドサイド')
              ]
            ),
            h(
              'select',
              {
                value: ctx.filters.result,
                onChange: (event) => (ctx.filters.result = event.target.value)
              },
              [
                h('option', { value: 'all' }, '結果 (すべて)'),
                h('option', { value: 'win' }, '勝利'),
                h('option', { value: 'loss' }, '敗北')
              ]
            )
          ]),
          matches.length === 0
            ? h('div', { class: 'empty-state' }, '条件に一致する試合がありません。')
            : h('div', { class: 'matches-list' }, matches.map((match) => renderMatchCard(ctx, match)))
        ])
      ]),
      ctx.showChampionPicker ? renderChampionPicker(ctx) : null
    ]);
  }
};

createApp(App).mount('#app');
