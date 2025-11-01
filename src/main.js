import { createApp, h, Fragment } from './lib/vue-lite.js';
import { champions as defaultChampions } from './champions.js';
import { loadMatches, saveMatches } from './storage.js';

const MAX_CHAMPION_SELECTION = 5;

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

function renderChampionTag(ctx, championId) {
  const champion = ctx.findChampion(championId);
  if (!champion) return null;
  return h('div', { class: 'champion-tag' }, [
    h('img', { src: champion.image, alt: champion.name }),
    h('span', {}, champion.name),
    h(
      'button',
      {
        type: 'button',
        onClick: () => ctx.removeChampionFromForm(championId)
      },
      '×'
    )
  ]);
}

function renderChampionPicker(ctx) {
  const filteredChampions = ctx.filteredChampionList();
  return h('div', { class: 'modal-backdrop' }, [
    h('div', { class: 'modal-panel' }, [
      h('div', { class: 'section-title' }, [
        h('h2', {}, 'チャンピオンを選択'),
        h(
          'button',
          {
            type: 'button',
            class: 'secondary-btn',
            onClick: ctx.closeChampionPicker
          },
          '閉じる'
        )
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
                        onClick: () => ctx.addChampionToForm(champion.id)
                      },
                      '追加'
                    )
              ])
            )
          )
    ])
  ]);
}

function renderStatsTable(ctx) {
  const usage = ctx.sortedChampionUsage();
  if (usage.length === 0) {
    return h('div', { class: 'empty-state' }, '試合が登録されると、ここにチャンピオン使用状況が表示されます。');
  }

  const headerCell = (label, key) =>
    h(
      'th',
      key
        ? {
            onClick: () => ctx.setStatsSort(key)
          }
        : {},
      label
    );

  return h('table', { class: 'stats-table' }, [
    h('thead', {}, [
      h('tr', {}, [
        headerCell('チャンピオン'),
        headerCell('合計', 'total'),
        headerCell('勝利', 'wins'),
        headerCell('敗北', 'losses'),
        headerCell('勝率')
      ])
    ]),
    h(
      'tbody',
      {},
      usage.map((item) => {
        const winRate = item.total === 0 ? '-' : `${Math.round((item.wins / item.total) * 100)}%`;
        return h('tr', {}, [
          h('td', { class: 'champion-cell' }, [
            h('img', { src: item.champion.image, alt: item.champion.name }),
            h('span', {}, item.champion.name)
          ]),
          h('td', {}, String(item.total)),
          h('td', {}, String(item.wins)),
          h('td', {}, String(item.losses)),
          h('td', {}, winRate)
        ]);
      })
    )
  ]);
}

function renderMatchCard(ctx, match) {
  const championBadges = match.champions
    .map((id) => ctx.findChampion(id))
    .filter(Boolean);

  return h('article', { class: 'match-card' }, [
    h('div', { class: 'match-header' }, [
      h('div', {}, [
        h('div', { class: 'match-title' }, [
          h('strong', {}, match.teamName || '未設定'),
          match.opponent
            ? h('span', {}, ` vs ${match.opponent}`)
            : null
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
    match.notes
      ? h('div', { class: 'helper-text' }, `メモ: ${match.notes}`)
      : null
  ]);
}

const App = {
  setup() {
    const today = new Date().toISOString().slice(0, 10);
    const state = {
      champions: defaultChampions,
      matches: loadMatches(),
      matchForm: {
        teamName: '',
        opponent: '',
        side: 'blue',
        result: 'win',
        selectedChampions: [],
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
      statsSort: {
        key: 'total',
        direction: 'desc'
      },
      formError: '',
      maxChampions: MAX_CHAMPION_SELECTION
    };

    state.resetForm = function () {
      this.matchForm.teamName = '';
      this.matchForm.opponent = '';
      this.matchForm.side = 'blue';
      this.matchForm.result = 'win';
      this.matchForm.selectedChampions = [];
      this.matchForm.notes = '';
      this.matchForm.matchDate = new Date().toISOString().slice(0, 10);
      this.formError = '';
    };

    state.findChampion = function (id) {
      return this.champions.find((champion) => champion.id === id) || null;
    };

    state.isChampionSelected = function (id) {
      return this.matchForm.selectedChampions.includes(id);
    };

    state.addChampionToForm = function (id) {
      if (this.matchForm.selectedChampions.includes(id)) {
        return;
      }
      if (this.matchForm.selectedChampions.length >= this.maxChampions) {
        this.formError = `チャンピオンは最大${this.maxChampions}体まで選択できます。`;
        return;
      }
      this.matchForm.selectedChampions = [...this.matchForm.selectedChampions, id];
      this.formError = '';
    };

    state.removeChampionFromForm = function (id) {
      this.matchForm.selectedChampions = this.matchForm.selectedChampions.filter((championId) => championId !== id);
    };

    state.openChampionPicker = function () {
      this.championSearch = '';
      this.showChampionPicker = true;
    };

    state.closeChampionPicker = function () {
      this.showChampionPicker = false;
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
          champion.role.toLowerCase().includes(query)
        );
      });
    };

    state.submitMatch = function (event) {
      event.preventDefault();
      if (!this.matchForm.teamName.trim()) {
        this.formError = '使用チームを入力してください。';
        return;
      }
      if (this.matchForm.selectedChampions.length === 0) {
        this.formError = '少なくとも1体のチャンピオンを選択してください。';
        return;
      }

      const newMatch = {
        id: Date.now(),
        teamName: this.matchForm.teamName.trim(),
        opponent: this.matchForm.opponent.trim(),
        side: this.matchForm.side,
        result: this.matchForm.result,
        champions: [...this.matchForm.selectedChampions],
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
        match.champions.forEach((championId) => {
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
    const selectedChampionTags = ctx.matchForm.selectedChampions.map((id) => renderChampionTag(ctx, id)).filter(Boolean);
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
              h('span', { class: 'tag' }, `登録試合数: ${ctx.matches.length}`)
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
              h('div', {}, [
                h('label', {}, 'チャンピオン (最大5体)'),
                h('div', { class: 'selected-champions' }, selectedChampionTags.length ? selectedChampionTags : [h('span', { class: 'helper-text' }, 'チャンピオンを選択してください。')]),
                h('div', { class: 'form-actions' }, [
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'secondary-btn',
                      onClick: ctx.openChampionPicker
                    },
                    'チャンピオンを選ぶ'
                  ),
                  h('span', { class: 'helper-text' }, `${ctx.matchForm.selectedChampions.length}/${ctx.maxChampions} 選択中`)
                ])
              ]),
              h('div', {}, [
                h('label', { for: 'match-notes' }, 'メモ'),
                h('textarea', {
                  id: 'match-notes',
                  value: ctx.matchForm.notes,
                  placeholder: '試合のポイントや構成の意図など',
                  onInput: (event) => (ctx.matchForm.notes = event.target.value)
                })
              ]),
              ctx.formError
                ? h('div', { class: 'error-message' }, ctx.formError)
                : null,
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
