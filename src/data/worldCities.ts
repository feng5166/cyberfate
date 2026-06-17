import { type CityRecord } from './chinaCities';

type WorldCityTuple = [name: string, country: string, nameEn: string, timezone: string];

const RAW_WORLD_CITIES: WorldCityTuple[] = [
  // 美国
  ['纽约', '美国', 'New York', 'UTC-5'],
  ['洛杉矶', '美国', 'Los Angeles', 'UTC-8'],
  ['旧金山', '美国', 'San Francisco', 'UTC-8'],
  ['芝加哥', '美国', 'Chicago', 'UTC-6'],
  ['西雅图', '美国', 'Seattle', 'UTC-8'],
  ['波士顿', '美国', 'Boston', 'UTC-5'],
  ['迈阿密', '美国', 'Miami', 'UTC-5'],
  ['拉斯维加斯', '美国', 'Las Vegas', 'UTC-8'],
  ['休斯顿', '美国', 'Houston', 'UTC-6'],
  ['达拉斯', '美国', 'Dallas', 'UTC-6'],
  ['华盛顿', '美国', 'Washington D.C.', 'UTC-5'],
  ['亚特兰大', '美国', 'Atlanta', 'UTC-5'],
  ['凤凰城', '美国', 'Phoenix', 'UTC-7'],
  ['丹佛', '美国', 'Denver', 'UTC-7'],
  ['明尼阿波利斯', '美国', 'Minneapolis', 'UTC-6'],
  ['底特律', '美国', 'Detroit', 'UTC-5'],
  ['费城', '美国', 'Philadelphia', 'UTC-5'],
  ['圣地亚哥', '美国', 'San Diego', 'UTC-8'],
  ['圣何塞', '美国', 'San Jose', 'UTC-8'],
  ['奥斯汀', '美国', 'Austin', 'UTC-6'],
  ['波特兰', '美国', 'Portland', 'UTC-8'],
  // 加拿大
  ['多伦多', '加拿大', 'Toronto', 'UTC-5'],
  ['温哥华', '加拿大', 'Vancouver', 'UTC-8'],
  ['蒙特利尔', '加拿大', 'Montreal', 'UTC-5'],
  ['卡尔加里', '加拿大', 'Calgary', 'UTC-7'],
  ['渥太华', '加拿大', 'Ottawa', 'UTC-5'],
  // 英国
  ['伦敦', '英国', 'London', 'UTC+0'],
  ['曼彻斯特', '英国', 'Manchester', 'UTC+0'],
  ['伯明翰', '英国', 'Birmingham', 'UTC+0'],
  ['爱丁堡', '英国', 'Edinburgh', 'UTC+0'],
  // 法国
  ['巴黎', '法国', 'Paris', 'UTC+1'],
  ['里昂', '法国', 'Lyon', 'UTC+1'],
  ['马赛', '法国', 'Marseille', 'UTC+1'],
  // 德国
  ['柏林', '德国', 'Berlin', 'UTC+1'],
  ['慕尼黑', '德国', 'Munich', 'UTC+1'],
  ['法兰克福', '德国', 'Frankfurt', 'UTC+1'],
  ['汉堡', '德国', 'Hamburg', 'UTC+1'],
  ['科隆', '德国', 'Cologne', 'UTC+1'],
  // 荷兰
  ['阿姆斯特丹', '荷兰', 'Amsterdam', 'UTC+1'],
  // 瑞士
  ['苏黎世', '瑞士', 'Zurich', 'UTC+1'],
  ['日内瓦', '瑞士', 'Geneva', 'UTC+1'],
  // 意大利
  ['罗马', '意大利', 'Rome', 'UTC+1'],
  ['米兰', '意大利', 'Milan', 'UTC+1'],
  // 西班牙
  ['马德里', '西班牙', 'Madrid', 'UTC+1'],
  ['巴塞罗那', '西班牙', 'Barcelona', 'UTC+1'],
  // 葡萄牙
  ['里斯本', '葡萄牙', 'Lisbon', 'UTC+0'],
  // 瑞典
  ['斯德哥尔摩', '瑞典', 'Stockholm', 'UTC+1'],
  // 挪威
  ['奥斯陆', '挪威', 'Oslo', 'UTC+1'],
  // 丹麦
  ['哥本哈根', '丹麦', 'Copenhagen', 'UTC+1'],
  // 芬兰
  ['赫尔辛基', '芬兰', 'Helsinki', 'UTC+2'],
  // 波兰
  ['华沙', '波兰', 'Warsaw', 'UTC+1'],
  // 俄罗斯
  ['莫斯科', '俄罗斯', 'Moscow', 'UTC+3'],
  ['圣彼得堡', '俄罗斯', 'Saint Petersburg', 'UTC+3'],
  // 土耳其
  ['伊斯坦布尔', '土耳其', 'Istanbul', 'UTC+3'],
  // 以色列
  ['特拉维夫', '以色列', 'Tel Aviv', 'UTC+2'],
  // 阿联酋
  ['迪拜', '阿联酋', 'Dubai', 'UTC+4'],
  ['阿布扎比', '阿联酋', 'Abu Dhabi', 'UTC+4'],
  // 沙特
  ['利雅得', '沙特阿拉伯', 'Riyadh', 'UTC+3'],
  // 印度
  ['孟买', '印度', 'Mumbai', 'UTC+5:30'],
  ['新德里', '印度', 'New Delhi', 'UTC+5:30'],
  ['班加罗尔', '印度', 'Bangalore', 'UTC+5:30'],
  ['海得拉巴', '印度', 'Hyderabad', 'UTC+5:30'],
  // 泰国
  ['曼谷', '泰国', 'Bangkok', 'UTC+7'],
  ['清迈', '泰国', 'Chiang Mai', 'UTC+7'],
  // 越南
  ['河内', '越南', 'Hanoi', 'UTC+7'],
  ['胡志明市', '越南', 'Ho Chi Minh City', 'UTC+7'],
  // 马来西亚
  ['吉隆坡', '马来西亚', 'Kuala Lumpur', 'UTC+8'],
  // 新加坡
  ['新加坡', '新加坡', 'Singapore', 'UTC+8'],
  // 印度尼西亚
  ['雅加达', '印度尼西亚', 'Jakarta', 'UTC+7'],
  ['巴厘岛', '印度尼西亚', 'Bali', 'UTC+8'],
  // 菲律宾
  ['马尼拉', '菲律宾', 'Manila', 'UTC+8'],
  // 日本
  ['东京', '日本', 'Tokyo', 'UTC+9'],
  ['大阪', '日本', 'Osaka', 'UTC+9'],
  ['京都', '日本', 'Kyoto', 'UTC+9'],
  ['名古屋', '日本', 'Nagoya', 'UTC+9'],
  ['福冈', '日本', 'Fukuoka', 'UTC+9'],
  ['札幌', '日本', 'Sapporo', 'UTC+9'],
  // 韩国
  ['首尔', '韩国', 'Seoul', 'UTC+9'],
  ['釜山', '韩国', 'Busan', 'UTC+9'],
  // 台湾
  ['台北', '台湾', 'Taipei', 'UTC+8'],
  ['高雄', '台湾', 'Kaohsiung', 'UTC+8'],
  // 香港
  ['香港', '香港', 'Hong Kong', 'UTC+8'],
  // 澳门
  ['澳门', '澳门', 'Macau', 'UTC+8'],
  // 澳大利亚
  ['悉尼', '澳大利亚', 'Sydney', 'UTC+10'],
  ['墨尔本', '澳大利亚', 'Melbourne', 'UTC+10'],
  ['布里斯班', '澳大利亚', 'Brisbane', 'UTC+10'],
  ['珀斯', '澳大利亚', 'Perth', 'UTC+8'],
  // 新西兰
  ['奥克兰', '新西兰', 'Auckland', 'UTC+12'],
  // 巴西
  ['圣保罗', '巴西', 'Sao Paulo', 'UTC-3'],
  ['里约热内卢', '巴西', 'Rio de Janeiro', 'UTC-3'],
  // 阿根廷
  ['布宜诺斯艾利斯', '阿根廷', 'Buenos Aires', 'UTC-3'],
  // 墨西哥
  ['墨西哥城', '墨西哥', 'Mexico City', 'UTC-6'],
  // 智利
  ['圣地亚哥（智利）', '智利', 'Santiago', 'UTC-4'],
  // 南非
  ['约翰内斯堡', '南非', 'Johannesburg', 'UTC+2'],
  ['开普敦', '南非', 'Cape Town', 'UTC+2'],
  // 埃及
  ['开罗', '埃及', 'Cairo', 'UTC+2'],
  // 尼日利亚
  ['拉各斯', '尼日利亚', 'Lagos', 'UTC+1'],
  // 肯尼亚
  ['内罗毕', '肯尼亚', 'Nairobi', 'UTC+3'],
];

export const WORLD_CITIES: CityRecord[] = RAW_WORLD_CITIES.map(([name, country, nameEn, timezone]) => ({
  name,
  province: country,
  pinyin: nameEn.toLowerCase(),
  timezone,
  country,
  nameEn,
}));
