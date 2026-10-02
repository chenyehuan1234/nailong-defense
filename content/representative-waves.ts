import type { WaveDefinition } from '../src/types';
// Explicit production schedules; rest is the manual early-wave reward clock.
export const REPRESENTATIVE_WAVES:Record<string,WaveDefinition[]>={
  "stage-01": [
    {
      "groups": [
        {
          "type": "mushroom",
          "count": 3,
          "path": 0,
          "interval": 4,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "少量基础敌人，留出建塔与观察射程的时间"
    },
    {
      "groups": [
        {
          "type": "mushroom",
          "count": 6,
          "path": 0,
          "interval": 3,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "增加击杀收入，选择扩建防线"
    },
    {
      "groups": [
        {
          "type": "mushroom",
          "count": 9,
          "path": 0,
          "interval": 2.5,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "提高单位密度，检查基础输出覆盖"
    },
    {
      "groups": [
        {
          "type": "mushroom",
          "count": 4,
          "path": 0,
          "interval": 2,
          "delay": 0
        },
        {
          "type": "orc",
          "count": 1,
          "path": 0,
          "interval": 1,
          "delay": 8
        }
      ],
      "rest": 25,
      "purpose": "首次混入耐打兽人，观察集火需求"
    },
    {
      "groups": [
        {
          "type": "orc",
          "count": 3,
          "path": 0,
          "interval": 6,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "低密度耐久敌人，给玩家整理防线的窗口"
    },
    {
      "groups": [
        {
          "type": "mushroom",
          "count": 10,
          "path": 0,
          "interval": 2,
          "delay": 0
        },
        {
          "type": "orc",
          "count": 4,
          "path": 0,
          "interval": 5,
          "delay": 5
        }
      ],
      "rest": 25,
      "purpose": "兽人与蘑菇混编，验证持续输出和拦截"
    },
    {
      "groups": [
        {
          "type": "mushroom",
          "count": 16,
          "path": 0,
          "interval": 1.5,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "密集终波，检验整条道路的火力覆盖"
    }
  ],
  "stage-04": [
    {
      "groups": [
        {
          "type": "bandit",
          "count": 12,
          "path": 0,
          "interval": 2,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "单路试探，建立河谷第一道防线"
    },
    {
      "groups": [
        {
          "type": "orc",
          "count": 10,
          "path": 1,
          "interval": 2,
          "delay": 0
        },
        {
          "type": "runner",
          "count": 12,
          "path": 0,
          "interval": 2,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "两路同时进攻，检查英雄与卫兵的分配"
    },
    {
      "groups": [
        {
          "type": "bandit",
          "count": 16,
          "path": 1,
          "interval": 2,
          "delay": 0
        },
        {
          "type": "boar",
          "count": 5,
          "path": 0,
          "interval": 4,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "南路重甲、北路脆弱群体，引导塔系克制"
    },
    {
      "groups": [
        {
          "type": "boar",
          "count": 8,
          "path": 0,
          "interval": 4,
          "delay": 0
        },
        {
          "type": "bandit",
          "count": 18,
          "path": 1,
          "interval": 1.6,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "连续重甲和群体压力，检查金币投资"
    },
    {
      "groups": [
        {
          "type": "runner",
          "count": 20,
          "path": 1,
          "interval": 1.2,
          "delay": 0
        },
        {
          "type": "shaman",
          "count": 3,
          "path": 0,
          "interval": 10,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "疾跑虫配合治疗巫医，优先处理支援"
    },
    {
      "groups": [
        {
          "type": "marauder",
          "count": 2,
          "path": 0,
          "interval": 14,
          "delay": 0
        },
        {
          "type": "boar",
          "count": 10,
          "path": 1,
          "interval": 3,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "掠夺者精英引入，集中魔法火力"
    },
    {
      "groups": [
        {
          "type": "bandit",
          "count": 22,
          "path": 0,
          "interval": 1.3,
          "delay": 0
        },
        {
          "type": "runner",
          "count": 22,
          "path": 1,
          "interval": 1.2,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "密集双路群体，奖励炮塔与拦截协作"
    },
    {
      "groups": [
        {
          "type": "boar",
          "count": 14,
          "path": 1,
          "interval": 3,
          "delay": 0
        },
        {
          "type": "shaman",
          "count": 4,
          "path": 0,
          "interval": 8,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "重甲伴随治疗，验证跨路支援"
    },
    {
      "groups": [
        {
          "type": "marauder",
          "count": 4,
          "path": 0,
          "interval": 12,
          "delay": 0
        },
        {
          "type": "bandit",
          "count": 24,
          "path": 1,
          "interval": 1.4,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "耐久精英护送基础群体，检查输出次序"
    },
    {
      "groups": [
        {
          "type": "ogre",
          "count": 3,
          "path": 1,
          "interval": 15,
          "delay": 0
        },
        {
          "type": "runner",
          "count": 26,
          "path": 0,
          "interval": 1,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "慢速食人魔与疾行敌人错位进攻"
    },
    {
      "groups": [
        {
          "type": "marauder",
          "count": 4,
          "path": 1,
          "interval": 12,
          "delay": 0
        },
        {
          "type": "boar",
          "count": 18,
          "path": 0,
          "interval": 2.5,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "精英与重甲双路推进，重组防线"
    },
    {
      "groups": [
        {
          "type": "bandit",
          "count": 30,
          "path": 0,
          "interval": 1.1,
          "delay": 0
        },
        {
          "type": "boar",
          "count": 16,
          "path": 1,
          "interval": 2.5,
          "delay": 0
        },
        {
          "type": "shaman",
          "count": 4,
          "path": 1,
          "interval": 9,
          "delay": 0
        }
      ],
      "rest": 25,
      "purpose": "治疗、重甲、群体混编，检验塔系协同"
    },
    {
      "groups": [
        {
          "type": "marauder",
          "count": 6,
          "path": 0,
          "interval": 10,
          "delay": 0
        },
        {
          "type": "ogre",
          "count": 4,
          "path": 1,
          "interval": 12,
          "delay": 0
        },
        {
          "type": "runner",
          "count": 30,
          "path": 1,
          "interval": 1.1,
          "delay": 10
        }
      ],
      "rest": 25,
      "purpose": "食人魔与掠夺者终波，使用技能守住汇流"
    }
  ],
  "stage-12": [
    {
      "groups": [
        {
          "type": "demon",
          "count": 10,
          "path": 0,
          "interval": 8,
          "delay": 0
        },
        {
          "type": "knight",
          "count": 10,
          "path": 1,
          "interval": 8,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "恶魔与重甲分路试探，建立两类基础输出"
    },
    {
      "groups": [
        {
          "type": "hound",
          "count": 13,
          "path": 1,
          "interval": 5.2,
          "delay": 0
        },
        {
          "type": "slayer",
          "count": 3,
          "path": 0,
          "interval": 8,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "疾行犬与魔抗精英，引入物理集火"
    },
    {
      "groups": [
        {
          "type": "imp",
          "count": 11,
          "path": 1,
          "interval": 5.2,
          "delay": 0
        },
        {
          "type": "shadow",
          "count": 9,
          "path": 0,
          "interval": 8,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "飞行小鬼和暗影怪，检查对空与阻拦"
    },
    {
      "groups": [
        {
          "type": "necromancer",
          "count": 2,
          "path": 0,
          "interval": 16.5,
          "delay": 0
        },
        {
          "type": "skeletonknight",
          "count": 8,
          "path": 1,
          "interval": 3.3,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "首次召唤支援，优先处理死灵法师"
    },
    {
      "groups": [
        {
          "type": "demonlord",
          "count": 2,
          "path": 1,
          "interval": 21.45,
          "delay": 0
        },
        {
          "type": "demon",
          "count": 17,
          "path": 0,
          "interval": 3.3,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "护盾领主加入，持续压力中切换优先目标"
    },
    {
      "groups": [
        {
          "type": "magma",
          "count": 1,
          "path": 0,
          "interval": 28.049999999999997,
          "delay": 0
        },
        {
          "type": "slayer",
          "count": 4,
          "path": 1,
          "interval": 14.85,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "慢速巨怪窗口，检查单体伤害与恢复"
    },
    {
      "groups": [
        {
          "type": "imp",
          "count": 16,
          "path": 1,
          "interval": 2.145,
          "delay": 0
        },
        {
          "type": "hound",
          "count": 20,
          "path": 0,
          "interval": 1.815,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "地面疾行与飞行混编，检查双路对空覆盖"
    },
    {
      "groups": [
        {
          "type": "necromancer",
          "count": 4,
          "path": 0,
          "interval": 13.2,
          "delay": 0
        },
        {
          "type": "knight",
          "count": 18,
          "path": 1,
          "interval": 2.9699999999999998,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "死灵召唤与重甲，验证AOE和魔法分工"
    },
    {
      "groups": [
        {
          "type": "slayer",
          "count": 5,
          "path": 1,
          "interval": 13.2,
          "delay": 0
        },
        {
          "type": "demonlord",
          "count": 3,
          "path": 0,
          "interval": 19.799999999999997,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "魔抗精英与护盾混编，物理火力保持价值"
    },
    {
      "groups": [
        {
          "type": "matriarch",
          "count": 4,
          "path": 1,
          "interval": 13.2,
          "delay": 0
        },
        {
          "type": "demon",
          "count": 22,
          "path": 0,
          "interval": 3.3,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "蛛母分裂与恶魔群体，奖励清群塔"
    },
    {
      "groups": [
        {
          "type": "magma",
          "count": 2,
          "path": 0,
          "interval": 26.4,
          "delay": 0
        },
        {
          "type": "necromancer",
          "count": 3,
          "path": 1,
          "interval": 14.85,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "巨怪和召唤者的持续战斗，保留全局技能"
    },
    {
      "groups": [
        {
          "type": "imp",
          "count": 24,
          "path": 1,
          "interval": 1.815,
          "delay": 0
        },
        {
          "type": "hound",
          "count": 27,
          "path": 0,
          "interval": 1.65,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "空中与地面双路高潮，检查炮塔与对空协作"
    },
    {
      "groups": [
        {
          "type": "slayer",
          "count": 7,
          "path": 0,
          "interval": 11.549999999999999,
          "delay": 0
        },
        {
          "type": "demonlord",
          "count": 4,
          "path": 1,
          "interval": 18.15,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "魔抗精英与护盾领主，重新集结卫兵"
    },
    {
      "groups": [
        {
          "type": "magma",
          "count": 3,
          "path": 1,
          "interval": 24.75,
          "delay": 0
        },
        {
          "type": "necromancer",
          "count": 5,
          "path": 0,
          "interval": 13.2,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "巨怪和死灵法师终前压力，准备Boss防线"
    },
    {
      "groups": [
        {
          "type": "demonlord",
          "count": 5,
          "path": 1,
          "interval": 16.5,
          "delay": 0
        },
        {
          "type": "slayer",
          "count": 8,
          "path": 0,
          "interval": 11.549999999999999,
          "delay": 0
        },
        {
          "type": "demon",
          "count": 29,
          "path": 1,
          "interval": 1.9799999999999998,
          "delay": 0
        }
      ],
      "rest": 35,
      "purpose": "最后混编浪潮，清场后进入双形态Boss战"
    }
  ]
};
