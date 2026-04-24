const MAPS = [
  {
    id: 'erangel',
    name: '艾伦格 Erangel',
    shortName: 'Erangel',
    size: '8×8',
    accent: '#8fd46a',
    exclusiveWeapons: ['PP-19 Bizon'],
  },
  {
    id: 'miramar',
    name: '米拉玛 Miramar',
    shortName: 'Miramar',
    size: '8×8',
    accent: '#f2a65a',
    exclusiveWeapons: [],
  },
  {
    id: 'vikendi',
    name: '维寒迪 Vikendi',
    shortName: 'Vikendi',
    size: '8×8',
    accent: '#8bc7ff',
    exclusiveWeapons: ['G36C'],
  },
  {
    id: 'taego',
    name: '泰戈 Taego',
    shortName: 'Taego',
    size: '8×8',
    accent: '#ffd166',
    exclusiveWeapons: ['K2'],
  },
  {
    id: 'deston',
    name: '迪斯顿 Deston',
    shortName: 'Deston',
    size: '8×8',
    accent: '#66d9d1',
    exclusiveWeapons: ['O12', 'MP9', 'Mosin Nagant'],
  },
  {
    id: 'rondo',
    name: '荣都 Rondo',
    shortName: 'Rondo',
    size: '8×8',
    accent: '#ff8c5a',
    exclusiveWeapons: ['JS9'],
  },
];

const ALL_MAP_IDS = MAPS.map(map => map.id);
const CRATE_WEAPON_IDS = new Set(['groza', 'famas', 'mk14', 'p90', 'awm', 'lynx']);

const WEAPONS = [
  // 突击步枪
  { id: 'beryl', name: 'Beryl M762(卓神de最爱)', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'm416', name: 'M416', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'groza', name: 'Groza', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'famas', name: 'FAMAS', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'akm', name: 'AKM', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'aug', name: 'AUG', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'scarl', name: 'SCAR-L', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'g36c', name: 'G36C', type: 'AR', maps: ['vikendi'] },
  { id: 'ace32', name: 'ACE32', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'm16a4', name: 'M16A4', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'mk47', name: 'Mk47 Mutant', type: 'AR', maps: ALL_MAP_IDS },
  { id: 'k2', name: 'K2', type: 'AR', maps: ['taego'] },

  // 精确射手步枪
  { id: 'mini14', name: 'Mini14', type: 'DMR', maps: ALL_MAP_IDS },
  { id: 'slr', name: 'SLR', type: 'DMR', maps: ALL_MAP_IDS },
  { id: 'mk12', name: 'MK12', type: 'DMR', maps: ALL_MAP_IDS },
  { id: 'sks', name: 'SKS', type: 'DMR', maps: ALL_MAP_IDS },
  { id: 'dragunov', name: 'Dragunov', type: 'DMR', maps: ALL_MAP_IDS },
  { id: 'mk14', name: 'MK14', type: 'DMR', maps: ALL_MAP_IDS },
  { id: 'vss', name: 'VSS', type: 'DMR', maps: ALL_MAP_IDS },

  // 冲锋枪
  { id: 'ump', name: 'UMP', type: 'SMG', maps: ALL_MAP_IDS },
  { id: 'vector', name: 'Vector', type: 'SMG', maps: ALL_MAP_IDS },
  { id: 'js9', name: 'JS9', type: 'SMG', maps: ['rondo'] },
  { id: 'p90', name: 'P90', type: 'SMG', maps: ALL_MAP_IDS },
  { id: 'bizon', name: 'PP-19 Bizon', type: 'SMG', maps: ['erangel'] },
  { id: 'mp5k', name: 'MP5K', type: 'SMG', maps: ALL_MAP_IDS },
  { id: 'mp9', name: 'MP9', type: 'SMG', maps: ['deston'] },
  { id: 'uzi', name: 'UZI', type: 'SMG', maps: ALL_MAP_IDS },
  { id: 'tommy', name: 'Tommy Gun', type: 'SMG', maps: ALL_MAP_IDS },

  // 狙击枪
  { id: 'kar98k', name: 'Kar98K', type: 'SR', maps: ALL_MAP_IDS },
  { id: 'm24', name: 'M24', type: 'SR', maps: ALL_MAP_IDS },
  { id: 'mosin', name: 'Mosin Nagant', type: 'SR', maps: ['deston'] },
  { id: 'awm', name: 'AWM', type: 'SR', maps: ALL_MAP_IDS },
  { id: 'lynx', name: 'Lynx AMR', type: 'SR', maps: ALL_MAP_IDS },

  // 霰弹枪
  { id: 's12k', name: 'S12K', type: 'SG', maps: ALL_MAP_IDS },
  { id: 'o12', name: 'O12', type: 'SG', maps: ['deston'] },
  { id: 's1897', name: 'S1897', type: 'SG', maps: ALL_MAP_IDS },
  { id: 's686', name: 'S686', type: 'SG', maps: ALL_MAP_IDS },
];

const WEAPON_TYPES = {
  AR: { name: '步枪', fullName: '突击步枪', color: '#ff7a45' },
  DMR: { name: '连狙', fullName: '精确射手步枪', color: '#63d4c8' },
  SMG: { name: '冲锋枪', fullName: '冲锋枪', color: '#ffd166' },
  SR: { name: '栓狙', fullName: '狙击枪', color: '#ff5d8f' },
  SG: { name: '喷子', fullName: '霰弹枪', color: '#8fe3c4' },
};

/** 不在随机池内，仅用于三选二（红点/全息 + 两枚已抽镜） */
const SCOPE_RED_HOLO = { id: 'red_holo', name: '红点 / 全息', value: '1x', weight: 0 };

const SCOPES = [
  { name: '2倍镜', value: '2x', weight: 25 },
  { name: '3倍镜', value: '3x', weight: 25 },
  { name: '4倍镜', value: '4x', weight: 20 },
  { name: '6倍镜', value: '6x', weight: 10 },
  { name: '8倍镜', value: '8x', weight: 4 },
  { name: '15倍镜', value: '15x', weight: 1 },
  { name: '多倍率混合瞄具', value: 'hybrid', weight: 15, label: '多倍率混合瞄具 (1x / 4x)' },
];

const SCOPE_FALLBACK_RULE = '未捡到指定镜时，仅可使用红点 / 全息';

const OPERATIONS = {
  AR: [
    { op: '×1', label: '不变', fn: x => x, weight: 20 },
    { op: '+2', label: '+2', fn: x => x + 2, weight: 12 },
    { op: '-2', label: '-2', fn: x => x - 2, weight: 12 },
    { op: '×2', label: '翻倍', fn: x => x * 2, weight: 12 },
    { op: '×0', label: '归零!', fn: x => 0, weight: 10 },
    { op: '+4', label: '+4', fn: x => x + 4, weight: 8 },
    { op: 'x²', label: '平方', fn: x => x * x, weight: 8 },
    { op: '10-x', label: '10减去', fn: x => 10 - x, weight: 8 },
    { op: '÷2', label: '减半', fn: x => Math.floor(x / 2), weight: 10 },
  ],
  DMR: [
    { op: '×1', label: '不变', fn: x => x, weight: 22 },
    { op: '+3', label: '+3', fn: x => x + 3, weight: 15 },
    { op: '+1', label: '+1', fn: x => x + 1, weight: 12 },
    { op: '-1', label: '-1', fn: x => x - 1, weight: 8 },
    { op: '×2', label: '翻倍', fn: x => x * 2, weight: 10 },
    { op: '+6', label: '+6', fn: x => x + 6, weight: 6 },
    { op: '÷2', label: '减半', fn: x => Math.floor(x / 2), weight: 8 },
    { op: '9-x', label: '9减去', fn: x => 9 - x, weight: 7 },
    { op: 'x²', label: '平方', fn: x => x * x, weight: 6 },
    { op: '×3', label: '三倍', fn: x => x * 3, weight: 6 },
  ],
  SMG: [
    { op: '×3', label: '三倍!', fn: x => x * 3, weight: 12 },
    { op: '×2', label: '翻倍', fn: x => x * 2, weight: 14 },
    { op: '×0', label: '归零!', fn: x => 0, weight: 15 },
    { op: '+5', label: '+5', fn: x => x + 5, weight: 10 },
    { op: '-3', label: '-3', fn: x => x - 3, weight: 12 },
    { op: 'x²', label: '平方!', fn: x => x * x, weight: 8 },
    { op: '×4', label: '四倍!', fn: x => x * 4, weight: 5 },
    { op: '10-x', label: '10减去', fn: x => 10 - x, weight: 8 },
    { op: '+8', label: '+8', fn: x => x + 8, weight: 6 },
    { op: '÷2', label: '减半', fn: x => Math.floor(x / 2), weight: 10 },
  ],
  SR: [
    { op: 'x²', label: '平方!', fn: x => x * x, weight: 16 },
    { op: '×3', label: '三倍!', fn: x => x * 3, weight: 10 },
    { op: '×0', label: '归零!', fn: x => 0, weight: 18 },
    { op: '+7', label: '+7', fn: x => x + 7, weight: 10 },
    { op: '×1', label: '不变', fn: x => x, weight: 12 },
    { op: '10-x', label: '10减去', fn: x => 10 - x, weight: 8 },
    { op: '×5', label: '五倍!', fn: x => x * 5, weight: 5 },
    { op: '-4', label: '-4', fn: x => x - 4, weight: 8 },
    { op: '+9', label: '+9', fn: x => x + 9, weight: 5 },
    { op: '÷2', label: '减半', fn: x => Math.floor(x / 2), weight: 8 },
  ],
  SG: [
    { op: '×4', label: '四倍!', fn: x => x * 4, weight: 8 },
    { op: '×0', label: '归零!', fn: x => 0, weight: 18 },
    { op: 'x²', label: '平方!', fn: x => x * x, weight: 12 },
    { op: '+10', label: '+10!', fn: x => x + 10, weight: 5 },
    { op: '-5', label: '-5', fn: x => x - 5, weight: 10 },
    { op: '×1', label: '不变', fn: x => x, weight: 12 },
    { op: '10-x', label: '10减去', fn: x => 10 - x, weight: 8 },
    { op: '×5', label: '五倍!', fn: x => x * 5, weight: 5 },
    { op: '+3', label: '+3', fn: x => x + 3, weight: 8 },
    { op: '÷2', label: '减半', fn: x => Math.floor(x / 2), weight: 8 },
    { op: '×2', label: '翻倍', fn: x => x * 2, weight: 6 },
  ],
};

const EVENT_CARDS = [
  { id: 'melee_only', name: '拳皇来袭', category: 'weapon', description: '目标本局只能用拳头 / 近战，计分 ×4 补偿', weight: 10, icon: '👊', effect: 'melee_only' },
  { id: 'swap_all', name: '全队武器替换', category: 'weapon', description: '把全队当前 8 把武器打乱后重新分配', weight: 10, icon: '🔄', effect: 'swap_all' },
  { id: 'reroll', name: '重新来过', category: 'weapon', description: '指定一人重新随机两把武器和本局瞄准镜', weight: 10, icon: '🎰', effect: 'reroll' },
  { id: 'steal_weapon', name: '交杯酒', category: 'weapon', description: '和指定玩家各选一把武器交换', weight: 10, icon: '🔀', effect: 'steal_weapon' },

  { id: 'shield', name: '防御', category: 'score', description: '本局负面运算改为“不变”', weight: 10, icon: '🛡️', effect: 'shield' },
  { id: 'double', name: 'Double', category: 'score', description: '本局自己最终得分 ×2', weight: 10, icon: '✖️', effect: 'double' },
  { id: 'thief', name: '小偷', category: 'score', description: '偷取指定玩家本局 50% 得分（向下取整）', weight: 10, icon: '🦹', effect: 'thief' },
  { id: 'swap_score', name: '交杯茶', category: 'score', description: '自己和指定一人本局分数互换', weight: 10, icon: '🔃', effect: 'swap_score' },

  { id: 'no_scope', name: '夺镜', category: 'debuff', description: '指定一人不能使用 4 倍以上倍镜', weight: 10, icon: '🔭', effect: 'no_scope' },
  { id: 'no_meds', name: '禁药', category: 'debuff', description: '指定一人不能用饮料和止痛药', weight: 10, icon: '💊', effect: 'no_meds' },
];

const PUNISHMENT_CARDS = [
  // { id: 'crouch', name: '蹲行者', description: '全程只能蹲着移动', icon: '🦆', weight: 10 },
  { id: 'walk', name: '本质蓝博', description: '全程只能静步', icon: '🤡', weight: 12.5 },
  { id: 'crab', name: '勒布朗詹姆斯是也', description: '只能侧身移动（只按 A / D）', icon: '🦀', weight: 12.5 },
  { id: 'crouch', name: '区', description: '全程只能蹲着移动', icon: '🐒', weight: 12.5 },
  { id: 'naked', name: '裸奔之人', description: '只能穿 1 级头和 1 级甲', icon: '🩲', weight: 12.5 },
  { id: 'small_bag', name: '极简主义', description: '只能用 1 级包', icon: '🎒', weight: 12.5 },
  { id: 'pacifist', name: '和平使者', description: '第一圈毒期间不能开枪', icon: '☮️', weight: 12.5 },
  { id: 'cyclist', name: '骑行者', description: '只能使用自行车作为载具', icon: '🚲', weight: 12.5 },
  { id: 'mute', name: '静音时刻', description: '关闭游戏声音', icon: '🔇', weight: 12.5 },
];

const DRAW_BALANCE = {
  event: {
    recentWindow: 5,
    recentPenalties: [0.12, 0.28, 0.48, 0.7, 0.85],
    repeatPenalty: 0.45,
    minWeightFactor: 0.08,
  },
  punishment: {
    recentWindow: 4,
    recentPenalties: [0.1, 0.24, 0.45, 0.68],
    repeatPenalty: 0.55,
    minWeightFactor: 0.08,
  },
};

function getMapById(mapId) {
  return MAPS.find(map => map.id === mapId);
}

/** 仅用于界面展示：取名称中第一截中文（如「泰戈 Taego」→「泰戈」） */
function getMapNameZh(mapOrId) {
  const map = typeof mapOrId === 'string' ? getMapById(mapOrId) : mapOrId;
  if (!map || !map.name) {
    return '';
  }
  return map.name.split(/\s+/)[0] || map.name;
}

function getWeaponsForMap(mapId) {
  return WEAPONS.filter(weapon => weapon.maps.includes(mapId));
}

function getExclusiveWeaponsForMap(mapId) {
  return getWeaponsForMap(mapId).filter(weapon => weapon.maps.length === 1);
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

function createDrawHistoryBucket() {
  return {
    counts: {},
    recent: [],
  };
}

function normalizeDrawHistoryBucket(bucket) {
  return {
    counts: bucket?.counts && typeof bucket.counts === 'object' ? { ...bucket.counts } : {},
    recent: Array.isArray(bucket?.recent) ? [...bucket.recent] : [],
  };
}

function normalizeDrawHistory(drawHistory) {
  return {
    event: normalizeDrawHistoryBucket(drawHistory?.event),
    punishment: normalizeDrawHistoryBucket(drawHistory?.punishment),
  };
}

function drawBalancedWeightedItem(
  items,
  bucket,
  {
    identityKey = 'id',
    weightKey = 'weight',
    recentWindow = 4,
    recentPenalties = [0.15, 0.35, 0.55, 0.75],
    repeatPenalty = 0.5,
    minWeightFactor = 0.08,
    excludeIds = [],
  } = {}
) {
  const blockedIds = new Set(excludeIds);
  const pool = items.filter(item => !blockedIds.has(item[identityKey]));

  if (!pool.length) {
    return null;
  }

  const counts = bucket?.counts || {};
  const recent = Array.isArray(bucket?.recent) ? bucket.recent.slice(-recentWindow) : [];

  const balancedPool = pool.map(item => {
    const identity = item[identityKey];
    const baseWeight = item[weightKey] ?? 1;
    const seenCount = counts[identity] || 0;
    const reverseRecentIndex = [...recent].reverse().findIndex(recentId => recentId === identity);
    const recencyFactor = reverseRecentIndex >= 0
      ? recentPenalties[Math.min(reverseRecentIndex, recentPenalties.length - 1)]
      : 1;
    const repeatFactor = 1 / (1 + seenCount * repeatPenalty);
    const effectiveWeight = Math.max(baseWeight * recencyFactor * repeatFactor, baseWeight * minWeightFactor);

    return {
      ...item,
      __balancedWeight: effectiveWeight,
    };
  });

  return weightedRandom(balancedPool, '__balancedWeight');
}

function rememberBalancedDraw(bucket, item, { identityKey = 'id', recentWindow = 4 } = {}) {
  if (!bucket || !item) return;

  const identity = item[identityKey];
  if (!identity) return;

  bucket.counts[identity] = (bucket.counts[identity] || 0) + 1;
  bucket.recent.push(identity);

  if (bucket.recent.length > recentWindow) {
    bucket.recent.splice(0, bucket.recent.length - recentWindow);
  }
}

function drawUniqueWeightedItems(items, count, identityKey = 'value', weightKey = 'weight') {
  const pool = [...items];
  const picked = [];

  while (pool.length > 0 && picked.length < count) {
    const next = weightedRandom(pool, weightKey);
    picked.push(next);
    const nextIdentity = next[identityKey];
    const removeIndex = pool.findIndex(item => item[identityKey] === nextIdentity);
    if (removeIndex >= 0) {
      pool.splice(removeIndex, 1);
    }
  }

  return picked;
}

function shuffleArray(items) {
  const list = [...items];
  for (let index = list.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
  return list;
}

function getWeaponsByType(weapons, type) {
  return weapons.filter(weapon => weapon.type === type);
}

function getScopeDisplayName(scope) {
  return scope?.label || scope?.name || '';
}

function isHybridScope(scope) {
  return scope?.value === 'hybrid';
}

function isHighMagnificationScope(scope) {
  if (!scope || isHybridScope(scope)) return false;
  return ['6x', '8x', '15x'].includes(scope.value);
}

function getWeaponBaseWeight(weapon) {
  return CRATE_WEAPON_IDS.has(weapon.id) ? 0.2 : 1;
}
