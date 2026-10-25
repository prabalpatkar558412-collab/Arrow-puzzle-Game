import {LEVELS} from './game';

function levelIds(value:unknown):number[]{
  return Array.isArray(value)?value.filter((n):n is number=>Number.isInteger(n)&&n>=1&&n<=LEVELS.length):[];
}

// No purchases or other coin grants exist yet. The durable completion ledger
// is authoritative, including when migrating saves containing a demo balance.
export function campaignEconomy(completed:unknown,rewarded:unknown){
  const completedLevels=Array.from(new Set(levelIds(completed)));
  const claims=Array.from(new Set([...levelIds(rewarded),...completedLevels]));
  const coins=claims.reduce((sum,n)=>sum+LEVELS[n-1].coinReward,0);
  return {completed:completedLevels,rewarded:claims,coins,totalCoinsEarned:coins};
}

export function claimCampaignReward(save:{completed:number[];rewarded:number[]},levelNo:number,daily=false){
  const previous=campaignEconomy(save.completed,save.rewarded);
  const earned=!daily&&!previous.rewarded.includes(levelNo)?LEVELS[levelNo-1].coinReward:0;
  const next=campaignEconomy(previous.completed,earned?[...previous.rewarded,levelNo]:previous.rewarded);
  return {...next,earned};
}
