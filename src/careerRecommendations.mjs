export const majorCompanyDatabase = {
  计算机科学与技术: [
    { name: "华为技术有限公司", type: "知名央国企/领军民企", roles: "软件开发工程师、系统架构师", locations: "杭州、深圳、北京" },
    { name: "阿里巴巴集团", type: "互联网领军企业", roles: "前端/后端开发、分布式计算", locations: "杭州、北京" },
    { name: "国家电网信通产业集团", type: "央企名企", roles: "电力信息化研发、运维", locations: "北京、南京、各省会" },
    { name: "中国电信天翼云", type: "央企云服务", roles: "云计算研发、系统运维", locations: "北京、上海、广州" },
  ],
  软件工程: [
    { name: "腾讯科技", type: "互联网领军企业", roles: "全栈开发、游戏研发、云端开发", locations: "深圳、成都、北京" },
    { name: "网易公司", type: "互联网文化科技", roles: "互娱研发、应用软件开发", locations: "杭州、广州" },
    { name: "海康威视", type: "高新科技企业", roles: "嵌入式软件、应用平台开发", locations: "杭州、武汉" },
    { name: "中国移动研究院", type: "央企科研院所", roles: "软件平台架构、通信软件研发", locations: "北京、雄安" },
  ],
  人工智能: [
    { name: "百度在线网络", type: "AI领航企业", roles: "大模型算法工程师、自然语言处理", locations: "北京、上海" },
    { name: "商汤科技", type: "机器视觉领军", roles: "视觉算法、模型落地部署", locations: "上海、深圳" },
    { name: "科大讯飞", type: "智能语音与认知智能", roles: "语音交互开发、AI+行业解决方案", locations: "合肥、北京、广州" },
    { name: "之江实验室", type: "新型科研机构", roles: "智能计算科研助理、大模型攻关", locations: "杭州" },
  ],
  数据科学与大数据: [
    { name: "蚂蚁科技集团", type: "金融科技领军", roles: "大数据开发、风控算法分析", locations: "杭州、上海" },
    { name: "字节跳动", type: "数字内容科技", roles: "数据仓库工程师、推荐系统开发", locations: "北京、上海、杭州" },
    { name: "招商银行网络科技", type: "金融科技央企", roles: "金融数据分析、商业智能BI", locations: "深圳、杭州" },
    { name: "国家信息中心", type: "事业单位/智库", roles: "公共数据治理、宏观分析", locations: "北京" },
  ],
  通用推荐: [
    { name: "高校选调生 / 公务员考录", type: "体制内考录", roles: "各省市选调生、基层公务员", locations: "生源地或意向省份" },
    { name: "重点院校硕士研究生", type: "升学深造", roles: "学硕、专硕、推免保研", locations: "全国重点高校" },
  ],
};

export function getRecommendedCompanies(major = "", careerTarget = "") {
  if (careerTarget.includes("考研") || careerTarget.includes("考公")) {
    return majorCompanyDatabase["通用推荐"];
  }
  const found = majorCompanyDatabase[major] || majorCompanyDatabase["计算机科学与技术"];
  return [...found, ...majorCompanyDatabase["通用推荐"].slice(0, 1)];
}
