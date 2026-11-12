export const partyStepMap = {
  群众: 0,
  共青团员: 0,
  入党申请人: 1,
  入党积极分子: 2,
  发展对象: 3,
  中共预备党员: 4,
  中共党员: 5,
};

export const partyStagesList = [
  { name: "申请", desc: "提交申请" },
  { name: "积极分子", desc: "党课培训" },
  { name: "发展对象", desc: "政审考察" },
  { name: "预备党员", desc: "考察一年" },
  { name: "正式党员", desc: "转正终点" },
];

export function getPoliticalStep(political) {
  return partyStepMap[political] ?? 0;
}
