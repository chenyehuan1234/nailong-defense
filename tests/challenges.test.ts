import {it,expect} from 'vitest';
import {LEVELS,levelForMode} from '../content/levels';
import {earnedStars,freshSave,validateSave,scoreKey} from '../src/save';
it('unverified 52 challenges are not exposed as playable configurations',()=>{
 for(const level of LEVELS)for(const mode of ['heroic','iron'] as const)expect(()=>levelForMode(level,mode)).toThrow();
});
it('campaign stars have a 78-star ceiling and obsolete challenge results cannot inflate it',()=>{
 const save=freshSave();for(const l of LEVELS)save.scores[scoreKey('main',l.id)]={stars:3,lives:20,hero:'tenshi',difficulty:'normal'};
 (save.scores as any)['stage-01-heroic']={stars:3,lives:20};expect(earnedStars(validateSave(save))).toBe(78);
});
