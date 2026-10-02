# v0.3 验收记录 · 2026-10-01

用户最新要求优先机制，停止追加角色动画和美术打磨。本轮机制验证完成；已有表现改动保留，不把进一步动画细化当作继续交付的前置条件。

## 规则与平衡

`npm run verify`：7个测试文件、47项测试通过，TypeScript检查与静态构建成功。完整输出：`test-results/verify-v3.log`。

| 验证内容 | 结果与报告 |
| --- | --- |
| 第1／4／12关，四英雄×三阵容×三个种子 | 108场全部获胜，另2场验证分支；110场总计全部获胜，最低剩余4生命。`representative-balance.json` |
| 十二关主线×四英雄，逐关实际星数预算 | 48场全部获胜，最低剩余3生命。`campaign-balance.json` |
| 十二英雄挑战＋十二铁人挑战 | 24场全部获胜，36星预算经过成本校验。`challenge-balance.json` |
| 合法休闲战役三星路线 | 12场全部20生命，逐关获得36星。`campaign-full-stars.json` |
| 三关训练营 | 正式200／260／650金币、3／4／5波全部完成；无免费资源、无主线星奖励 |

这些是自动策略运行的194场合法资源战斗，并非声称人工逐场完整试玩。三张代表地图使用9451、20261001、314159种子，每张地图的四英雄均通过三种阵容；八个高级分支均在第十二关的获胜阵容中出现。每场保留购买、升级、塔伤害、过量、控制、拦截、阵亡、投资、漏怪统计，不能据此断言所有可能阵容都同样强。

规则覆盖：延迟出怪、分裂、召唤、墓地复生、漏怪、周期设施波间暂停、三秒清场等待、自动开关重计时、手动奖励与冷却、防御属性、范围对空、补员与拦截解除、Boss变身、捷径、英雄撤退与路线、不同渲染帧率和倍速的同种子一致性。统计额外验证出售重建累计投资、护盾减伤不计为过量。

## 浏览器机制检查

Chrome、Edge各自使用独立新浏览器上下文，避免修改玩家真实存档。`tools/experience-qa.mjs`通过：

- 新档图鉴为空；12个主线节点、30个升级节点与真实侦察。
- 三关教学通过条件驱动，完成、重玩、已读记录及训练不贡献星星。
- 在旧塔面板覆盖的位置实际点击集结；无效落点保持模式，成功恢复面板，Esc取消恢复。
- 英雄移动优先于塔拾取；3倍速；失焦冻结游戏时间。
- 音频36文件加载成功、四项音量、刷新后设置与发现记录保留。
- 工坊试玩不修改图鉴发现。
- 零JavaScript错误、零资源请求失败。

`tools/expansion-smoke.mjs`通过Chrome回归：建造、升级、自动开关、暂停、五次解冻、工坊1–100关表单、怪物组编辑、撤销／重做、隐藏面板、导出、IndexedDB重载、实际自定义双关获胜与下一关跳转、结算战斗分析展开。

v2迁移与真实v3 UI导出／导入通过：保留英雄、成绩与升级，仅推导已完成关卡敌人，保留旧v2键，有旧成绩的玩家不强制进入训练营。记录：`combat-presentation.json`。

## 性能与表现

本机1080p WebGL压力测试：Chrome、Edge各持续20秒，维持150敌人、40友军，含攻击与本地音频，均无脚本错误。RTX 5070 Laptop GPU；最终复测Chrome平均133 FPS、Edge平均135 FPS，帧时中位数5.2／5.1ms、95百分位均10.2ms。报告：`performance.json`。这是本机自动化浏览器环境的结果，其他硬件需重新运行。

既有表现检查包括十二张地图、双河渡口两座桥、八高级分支、1／3倍攻击与Boss阶段HUD。截图位于 `test-results/visual-v3/`，如 `world-chrome.png`、`upgrades-chrome.png`、`rally-chrome.png`、`map-4.png`、`combat-3x-chrome.png`。角色动作进一步打磨按用户最新指示暂停。

## 构建与复现

所有运行图片和36个音频文件位于 `public/assets/` 并复制到 `dist/`；清单版本3。音频源授权及处理记录保存在 `art/source/audio/`。构建不依赖远程热链；正式版移除开发调试对象和动作场入口。

```powershell
npm run dev
npm run verify
node tools/experience-qa.mjs
node tools/expansion-smoke.mjs
node tools/performance.mjs
npm run build
node tools/serve-dist.mjs
node tools/production-qa.mjs
```

浏览器机制工具需要5188开发服务，正式构建工具需要5189静态服务。性能测试宜单独运行；其额外金币和高生命只是压力夹具，不属于平衡验证。

上一版记录保存在 [verification-v2.md](verification-v2.md)。当前机制与接口说明见 [experience-v3.md](experience-v3.md)。
