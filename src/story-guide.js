import {objective} from './model.js?v=10';
const stages=['arrival','trail','counsel','descent','heart','complete'];
export function storyBrief(h){
 const c=h.campaign,t=h.world.towns[0],index=Math.max(0,stages.indexOf(c.stage));
 const recap={arrival:c.witness,trail:'You agreed to investigate the mystery in '+t.name+'. '+c.witness,counsel:'You recovered the evidence on the old road. '+c.clue,descent:'You brought the evidence to the archive and chose an alliance. '+(c.flags.alliance?'Your allies: '+c.flags.alliance+'.':''),heart:'You defeated '+c.enemy+'. '+c.revelation,complete:c[c.ending]||'You made your choice and completed this story.'}[c.stage];
 const purpose={arrival:'Start by hearing the witness’s account in the village square.',trail:'Find physical evidence before deciding who to trust.',counsel:'The scholar can interpret your evidence and explain the sealed crypt. The gold marker leads to the archive entrance, then the scholar inside.',descent:'Your investigation now leads beneath the town. Enter the marked crypt and confront its guardian.',heart:'Reach the final chamber and decide what happens to '+c.artifact+'.',complete:'Explore freely, finish side quests, or begin a new story with the same hero.'}[c.stage];
 return{chapter:c.stage==='complete'?'Story complete':'Story '+Math.min(5,index+1)+' of 5',recap,purpose,next:objective(h),steps:['Hear the witness','Find evidence','Consult the archive','Confront the guardian','Choose the ending'],index};
}
