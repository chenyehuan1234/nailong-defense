from pathlib import Path
for name in ['simulation.test.ts','campaign-v2.test.ts','experience-v3.test.ts']:
 p=Path('tests')/name;s=p.read_text(encoding='utf-8');s="import {legacyFixture} from './fixture';\n"+s;s=s.replace('...structuredClone(LEVELS[0])','...legacyFixture()');p.write_text(s,encoding='utf-8')
p=Path('content/training.ts');s=p.read_text(encoding='utf-8').replace("import { LEVELS } from './levels';","import { LEGACY_LEVELS } from './legacy-levels';\nconst trainingBase=()=>{const level=structuredClone(LEGACY_LEVELS[0]);level.slots[3]={x:620,y:405};level.slots[5]={x:795,y:390};level.heroStart={x:760,y:450};return level;};");s=s.replace('...structuredClone(LEVELS[0])','...trainingBase()');s=s.replace('脱战四秒','脱战后');p.write_text(s,encoding='utf-8')
