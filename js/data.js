const MAPS = [
  {
    id: 'erangel',
    name: '艾伦格 Erangel',
    shortName: 'Erangel',
    size: '8×8',
    accent: '#8fd46a',
    vibe: '蓝博角',
    majorFeature: '远古遗迹是也',
    exclusiveWeapons: ['PP-19 Bizon'],
  },
  {
    id: 'miramar',
    name: '米拉玛 Miramar',
    shortName: 'Miramar',
    size: '8×8',
    accent: '#f2a65a',
    vibe: '沙漠灰',
    majorFeature: '沙二是也',
    exclusiveWeapons: [],
  },
  {
    id: 'sanhok',
    name: '萨诺 Sanhok',
    shortName: 'Sanhok',
    size: '4×4',
    accent: '#54c17a',
    vibe: '雨林嗯嘟',
    majorFeature: 'Roll点之图',
    exclusiveWeapons: ['QBZ95', 'QBU'],
  },
  {
    id: 'vikendi',
    name: '维寒迪 Vikendi',
    shortName: 'Vikendi',
    size: '8×8',
    accent: '#8bc7ff',
    vibe: '雪地',
    majorFeature: '核子危机',
    exclusiveWeapons: ['G36C'],
  },
  {
    id: 'taego',
    name: '泰戈 Taego',
    shortName: 'Taego',
    size: '8×8',
    accent: '#ffd166',
    vibe: '工位',
    majorFeature: '卓神之图',
    exclusiveWeapons: ['K2'],
  },
  {
    id: 'deston',
    name: '迪斯顿 Deston',
    shortName: 'Deston',
    size: '8×8',
    accent: '#66d9d1',
    vibe: '石',
    majorFeature: '殒命大厦是也',
    exclusiveWeapons: ['O12', 'MP9', 'Mosin Nagant'],
  },
  {
    id: 'rondo',
    name: '荣都 Rondo',
    shortName: 'Rondo',
    size: '8×8',
    accent: '#ff8c5a',
    vibe: '喵了个喵',
    majorFeature: '比亚迪之家',
    exclusiveWeapons: ['JS9'],
  },
];

const ALL_MAP_IDS = MAPS.map(map => map.id);

const WEAPONS = [
  // 突击步枪 (AR)
  { id: 'beryl',   name: 'Beryl M762(卓神de最爱)',  type: 'AR',  tier: 'S', weight: 1,   maps: ALL_MAP_IDS },
  { id: 'm416',    name: 'M416',        type: 'AR',  tier: 'S', weight: 1,   maps: ALL_MAP_IDS },
  { id: 'groza',   name: 'Groza',       type: 'AR',  tier: 'S', weight: 0.3, maps: ALL_MAP_IDS },
  { id: 'famas',   name: 'FAMAS',       type: 'AR',  tier: 'S', weight: 0.3, maps: ALL_MAP_IDS },
  { id: 'akm',     name: 'AKM',         type: 'AR',  tier: 'A', weight: 3,   maps: ALL_MAP_IDS },
  { id: 'aug',     name: 'AUG',         type: 'AR',  tier: 'A', weight: 3,   maps: ALL_MAP_IDS },
  { id: 'scarl',   name: 'SCAR-L',      type: 'AR',  tier: 'A', weight: 3,   maps: ALL_MAP_IDS },
  { id: 'qbz95',   name: 'QBZ95',       type: 'AR',  tier: 'A', weight: 3,   maps: ['sanhok'] },
  { id: 'g36c',    name: 'G36C',        type: 'AR',  tier: 'A', weight: 3,   maps: ['vikendi'] },
  { id: 'ace32',   name: 'ACE32',       type: 'AR',  tier: 'B', weight: 7,   maps: ALL_MAP_IDS },
  { id: 'm16a4',   name: 'M16A4',       type: 'AR',  tier: 'B', weight: 7,   maps: ALL_MAP_IDS },
  { id: 'mk47',    name: 'Mk47 Mutant', type: 'AR',  tier: 'B', weight: 7,   maps: ALL_MAP_IDS },
  { id: 'k2',      name: 'K2',          type: 'AR',  tier: 'B', weight: 7,   maps: ['taego'] },

  // 精确射手步枪 (DMR)
  { id: 'mini14',   name: 'Mini14',      type: 'DMR', tier: 'A', weight: 3,   maps: ALL_MAP_IDS },
  { id: 'qbu',      name: 'QBU',         type: 'DMR', tier: 'A', weight: 3,   maps: ['sanhok'] },
  { id: 'slr',      name: 'SLR',         type: 'DMR', tier: 'A', weight: 3,   maps: ALL_MAP_IDS },
  { id: 'mk12',     name: 'MK12',        type: 'DMR', tier: 'B', weight: 7,   maps: ALL_MAP_IDS },
  { id: 'sks',      name: 'SKS',         type: 'DMR', tier: 'B', weight: 7,   maps: ALL_MAP_IDS },
  { id: 'dragunov', name: 'Dragunov',    type: 'DMR', tier: 'B', weight: 7,   maps: ALL_MAP_IDS },
  { id: 'mk14',     name: 'MK14',        type: 'DMR', tier: 'S', weight: 0.3, maps: ALL_MAP_IDS },
  { id: 'vss',      name: 'VSS',         type: 'DMR', tier: 'C', weight: 9,   maps: ALL_MAP_IDS },

  // 冲锋枪 (SMG)
  { id: 'ump',    name: 'UMP',            type: 'SMG', tier: 'A', weight: 3,   maps: ALL_MAP_IDS },
  { id: 'vector', name: 'Vector',         type: 'SMG', tier: 'A', weight: 3,   maps: ALL_MAP_IDS },
  { id: 'js9',    name: 'JS9',            type: 'SMG', tier: 'A', weight: 3,   maps: ['rondo'] },
  { id: 'p90',    name: 'P90',            type: 'SMG', tier: 'S', weight: 0.3, maps: ALL_MAP_IDS },
  { id: 'bizon',  name: 'PP-19 Bizon',    type: 'SMG', tier: 'B', weight: 7,   maps: ['erangel'] },
  { id: 'mp5k',   name: 'MP5K',           type: 'SMG', tier: 'B', weight: 7,   maps: ALL_MAP_IDS },
  { id: 'mp9',    name: 'MP9',            type: 'SMG', tier: 'B', weight: 7,   maps: ['deston'] },
  { id: 'uzi',    name: 'UZI',            type: 'SMG', tier: 'B', weight: 7,   maps: ALL_MAP_IDS },
  { id: 'tommy',  name: 'Tommy Gun',      type: 'SMG', tier: 'C', weight: 9,   maps: ALL_MAP_IDS },

  // 狙击枪 (SR)
  { id: 'kar98k', name: 'Kar98K',       type: 'SR', tier: 'A', weight: 3,   maps: ALL_MAP_IDS },
  { id: 'm24',    name: 'M24',          type: 'SR', tier: 'A', weight: 3,   maps: ALL_MAP_IDS },
  { id: 'mosin',  name: 'Mosin Nagant', type: 'SR', tier: 'A', weight: 3,   maps: ['deston'] },
  { id: 'awm',    name: 'AWM',          type: 'SR', tier: 'S', weight: 0.3, maps: ALL_MAP_IDS },
  { id: 'lynx',   name: 'Lynx AMR',     type: 'SR', tier: 'C', weight: 0.5, maps: ALL_MAP_IDS },

  // 霰弹枪 (SG)
  { id: 's12k',  name: 'S12K',        type: 'SG', tier: 'B', weight: 7, maps: ALL_MAP_IDS },
  { id: 'o12',   name: 'O12',         type: 'SG', tier: 'B', weight: 7, maps: ['deston'] },
  { id: 's1897', name: 'S1897',       type: 'SG', tier: 'C', weight: 9, maps: ALL_MAP_IDS },
  { id: 's686',  name: 'S686',        type: 'SG', tier: 'C', weight: 9, maps: ALL_MAP_IDS },
  { id: 'sawed', name: '锯短型霰弹枪', type: 'SG', tier: 'C', weight: 9, maps: ALL_MAP_IDS },
];

const WEAPON_TYPES = {
  AR:  { name: '突击步枪',     color: '#ff7a45' },
  DMR: { name: '精确射手步枪', color: '#63d4c8' },
  SMG: { name: '冲锋枪',       color: '#ffd166' },
  SR:  { name: '狙击枪',       color: '#ff5d8f' },
  SG:  { name: '霰弹枪',       color: '#8fe3c4' },
};

const TIER_INFO = {
  S: { name: 'S', color: '#ff4757', multiplier: 0.8 },
  A: { name: 'A', color: '#ffa502', multiplier: 1.0 },
  B: { name: 'B', color: '#2ed573', multiplier: 1.3 },
  C: { name: 'C', color: '#70a1ff', multiplier: 1.8 },
};

const SCOPES = [
  { name: '红点/全息', value: '1x',  weight: 25 },
  { name: '2倍镜',     value: '2x',  weight: 25 },
  { name: '3倍镜',     value: '3x',  weight: 20 },
  { name: '4倍镜',     value: '4x',  weight: 15 },
  { name: '6倍镜',     value: '6x',  weight: 10 },
  { name: '8倍镜',     value: '8x',  weight: 4 },
  { name: '15倍镜',    value: '15x', weight: 1 },
];

const OPERATIONS = {
  AR: [
    { op: '×1',    label: '不变',      fn: x => x,                  weight: 20 },
    { op: '+2',    label: '+2',        fn: x => x + 2,              weight: 12 },
    { op: '-2',    label: '-2',        fn: x => x - 2,              weight: 12 },
    { op: '×2',    label: '翻倍',      fn: x => x * 2,              weight: 12 },
    { op: '×0',    label: '归零!',     fn: x => 0,                  weight: 10 },
    { op: '+4',    label: '+4',        fn: x => x + 4,              weight: 8 },
    { op: 'x²',   label: '平方',      fn: x => x * x,              weight: 8 },
    { op: '10-x',  label: '10减去',    fn: x => 10 - x,             weight: 8 },
    { op: '÷2',    label: '减半',      fn: x => Math.floor(x / 2),  weight: 10 },
  ],
  DMR: [
    { op: '×1',    label: '不变',      fn: x => x,                  weight: 22 },
    { op: '+3',    label: '+3',        fn: x => x + 3,              weight: 15 },
    { op: '+1',    label: '+1',        fn: x => x + 1,              weight: 12 },
    { op: '-1',    label: '-1',        fn: x => x - 1,              weight: 8 },
    { op: '×2',    label: '翻倍',      fn: x => x * 2,              weight: 10 },
    { op: '+6',    label: '+6',        fn: x => x + 6,              weight: 6 },
    { op: '÷2',    label: '减半',      fn: x => Math.floor(x / 2),  weight: 8 },
    { op: '9-x',   label: '9减去',     fn: x => 9 - x,              weight: 7 },
    { op: 'x²',   label: '平方',      fn: x => x * x,              weight: 6 },
    { op: '×3',    label: '三倍',      fn: x => x * 3,              weight: 6 },
  ],
  SMG: [
    { op: '×3',    label: '三倍!',     fn: x => x * 3,              weight: 12 },
    { op: '×2',    label: '翻倍',      fn: x => x * 2,              weight: 14 },
    { op: '×0',    label: '归零!',     fn: x => 0,                  weight: 15 },
    { op: '+5',    label: '+5',        fn: x => x + 5,              weight: 10 },
    { op: '-3',    label: '-3',        fn: x => x - 3,              weight: 12 },
    { op: 'x²',   label: '平方!',     fn: x => x * x,              weight: 8 },
    { op: '×4',    label: '四倍!',     fn: x => x * 4,              weight: 5 },
    { op: '10-x',  label: '10减去',    fn: x => 10 - x,             weight: 8 },
    { op: '+8',    label: '+8',        fn: x => x + 8,              weight: 6 },
    { op: '÷2',    label: '减半',      fn: x => Math.floor(x / 2),  weight: 10 },
  ],
  SR: [
    { op: 'x²',   label: '平方!',     fn: x => x * x,              weight: 16 },
    { op: '×3',    label: '三倍!',     fn: x => x * 3,              weight: 10 },
    { op: '×0',    label: '归零!',     fn: x => 0,                  weight: 18 },
    { op: '+7',    label: '+7',        fn: x => x + 7,              weight: 10 },
    { op: '×1',    label: '不变',      fn: x => x,                  weight: 12 },
    { op: '10-x',  label: '10减去',    fn: x => 10 - x,             weight: 8 },
    { op: '×5',    label: '五倍!',     fn: x => x * 5,              weight: 5 },
    { op: '-4',    label: '-4',        fn: x => x - 4,              weight: 8 },
    { op: '+9',    label: '+9',        fn: x => x + 9,              weight: 5 },
    { op: '÷2',    label: '减半',      fn: x => Math.floor(x / 2),  weight: 8 },
  ],
  SG: [
    { op: '×4',    label: '四倍!',     fn: x => x * 4,              weight: 8 },
    { op: '×0',    label: '归零!',     fn: x => 0,                  weight: 18 },
    { op: 'x²',   label: '平方!',     fn: x => x * x,              weight: 12 },
    { op: '+10',   label: '+10!',     fn: x => x + 10,             weight: 5 },
    { op: '-5',    label: '-5',        fn: x => x - 5,              weight: 10 },
    { op: '×1',    label: '不变',      fn: x => x,                  weight: 12 },
    { op: '10-x',  label: '10减去',    fn: x => 10 - x,             weight: 8 },
    { op: '×5',    label: '五倍!',     fn: x => x * 5,              weight: 5 },
    { op: '+3',    label: '+3',        fn: x => x + 3,              weight: 8 },
    { op: '÷2',    label: '减半',      fn: x => Math.floor(x / 2),  weight: 8 },
    { op: '×2',    label: '翻倍',      fn: x => x * 2,              weight: 6 },
  ],
};

const EVENT_CARDS = [
  { id: 'melee_only',   name: '近战挑战',     category: 'weapon', description: '目标本局只能用拳头/近战，计分×4补偿',          weight: 10, icon: '👊', effect: 'melee_only' },
  { id: 'swap_all',     name: '全队武器互换', category: 'weapon', description: '全队当前武器随机重新分配',                  weight: 10, icon: '🔄', effect: 'swap_all' },
  { id: 'reroll',       name: '重新来过',     category: 'weapon', description: '指定一人重新随机当前两把武器',              weight: 12, icon: '🎰', effect: 'reroll' },
  { id: 'steal_weapon', name: '偷梁换柱',     category: 'weapon', description: '和指定玩家各选一把武器交换',                weight: 8,  icon: '🔀', effect: 'steal_weapon' },

  { id: 'shield',       name: '护盾',         category: 'score',  description: '本局负面运算改为”不变”',                   weight: 10, icon: '🛡️', effect: 'shield' },
  { id: 'double',       name: '双倍快乐',     category: 'score',  description: '本局自己最终得分×2',                       weight: 6,  icon: '✖️', effect: 'double' },
  { id: 'thief',        name: '小偷',         category: 'score',  description: '偷取指定玩家本局50%得分（向下取整）',      weight: 6,  icon: '🦹', effect: 'thief' },
  { id: 'swap_score',   name: '乾坤大挪移',   category: 'score',  description: '自己和指定一人本局分数互换',               weight: 6,  icon: '🔃', effect: 'swap_score' },

  { id: 'no_scope',     name: '夺镜',         category: 'debuff', description: '指定一人不能使用4倍以上倍镜',              weight: 3,  icon: '🔭', effect: 'no_scope' },
  { id: 'no_meds',      name: '禁药',         category: 'debuff', description: '指定一人不能用饮料和止痛药',               weight: 3,  icon: '💊', effect: 'no_meds' },
];

const PUNISHMENT_CARDS = [
  { id: 'crouch',     name: '区',     description: '全程只能蹲着移动',                icon: '🦆' },
  { id: 'walk',       name: '本质蓝博',   description: '全程只能静步',                    icon: '🤫' },
  { id: 'crab',       name: '勒布朗詹姆斯是也',     description: '只能侧身移动（只按A/D）',        icon: '🦀' },
  { id: 'ads_walk',   name: '开镜行者',   description: '全程开镜移动',                    icon: '🔫' },
  { id: 'hipfire',    name: '盲狙',       description: '不能开镜，只能腰射',              icon: '🙈' },
  { id: 'iron_sight', name: '裸眼战士',   description: '不能捡倍镜，只用机瞄',            icon: '👁️' },
  { id: 'naked',      name: '裸奔',       description: '不能穿防弹衣和头盔',              icon: '🩲' },
  { id: 'small_bag',  name: '小小的也能装大大的',   description: '只能用1级包',                     icon: '🎒' },
  { id: 'pacifist',   name: '和平主义者', description: '前5分钟不能开枪',                 icon: '☮️' },
  { id: 'cyclist',    name: '骑行者',     description: '只能使用自行车作为载具',           icon: '🚲' },
];

function getMapById(mapId) {
  return MAPS.find(map => map.id === mapId);
}

function getWeaponsForMap(mapId) {
  return WEAPONS.filter(weapon => weapon.maps.includes(mapId));
}

function getExclusiveWeaponsForMap(mapId) {
  return getWeaponsForMap(mapId).filter(weapon => weapon.maps.length === 1);
}

function getSharedWeaponsForMap(mapId) {
  return getWeaponsForMap(mapId).filter(weapon => weapon.maps.length > 1);
}

function weightedRandom(items, weightKey = 'weight') {
  const totalWeight = items.reduce((sum, item) => sum + item[weightKey], 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item[weightKey];
    if (random <= 0) return item;
  }

  return items[items.length - 1];
}

function getWeaponsByType(weapons, type) {
  return weapons.filter(weapon => weapon.type === type);
}

function getAvailableTypes(weapons) {
  return [...new Set(weapons.map(weapon => weapon.type))];
}

function isHighMagnificationScope(scope) {
  if (!scope) return false;
  return ['4x', '6x', '8x', '15x'].includes(scope.value);
}
