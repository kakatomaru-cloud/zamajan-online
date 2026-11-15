// STAGE2_SCARAB_SILHOUETTE_V6_20261115
// V6 visual acceptance failed: synthetic underlay did not match source art.
// Keep the coherent validated transparent sprite renderer instead.
const v6OldDrawBoss=drawBoss;
drawBoss=function(){return v6OldDrawBoss();};
window.ZAMAZONE_STAGE2_V6_QA=()=>({
 stage,mode,
 parts:boss?.z?.n===3?boss.z.parts.map(p=>({id:p.i,type:p.type,hp:p.hp,dead:p.dead})):[],
 silhouette:false,
 artStatus:'Pending faithful source-art integration'
});
