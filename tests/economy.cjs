const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
function load(file,dependencies={}){
  const exports={};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{exports,require:name=>dependencies[name]});
  return exports;
}
const game=load('src/game.ts',{'./levels':load('src/levels.ts',{'./level-layouts.json':{default:require('../src/level-layouts.json')}})});
const {campaignEconomy,claimCampaignReward}=load('src/economy.ts',{'./game':game});
const fresh=campaignEconomy([],[]);
assert.equal(fresh.coins,0);
const first=claimCampaignReward(fresh,1);
assert.equal(first.earned,game.LEVELS[0].coinReward);
const finished={...first,completed:[1]};
assert.equal(claimCampaignReward(finished,1).earned,0);
assert.equal(claimCampaignReward(first,1).earned,0,'claim marker alone prevents duplicates');
const reloaded=campaignEconomy(...[finished.completed,finished.rewarded].map(x=>JSON.parse(JSON.stringify(x))));
assert.equal(claimCampaignReward(reloaded,1).earned,0);
const second=claimCampaignReward(reloaded,2);
assert.equal(second.coins,game.LEVELS[0].coinReward+game.LEVELS[1].coinReward);
assert.equal(claimCampaignReward(second,3,true).earned,0);
assert.equal(campaignEconomy([1,1,2],[]).coins,second.coins,'legacy completions reconstruct genuine rewards');
assert.equal(campaignEconomy([],[-1,999,'1',null]).coins,0);
assert.equal(game.validateLevels().length,0);

(async()=>{
  const writes=[];
  const storage={setItem:async(key,value)=>{await new Promise(resolve=>setTimeout(resolve,2));writes.push({key,value});}};
  const {persistSave,SAVE_KEY}=load('src/storage.ts',{'@react-native-async-storage/async-storage':{default:storage}});
  await Promise.all([persistSave(first),persistSave(second)]);
  assert.equal(writes[1].key,SAVE_KEY);
  assert.equal(JSON.parse(writes[1].value).coins,second.coins);
  assert.equal(JSON.parse(writes[1].value).rewarded.length,2);
  console.log('Passed: new balance, first rewards, replay, reload, migration, daily mode, level validation, ordered persistence.');
})().catch(error=>{console.error(error);process.exitCode=1;});
