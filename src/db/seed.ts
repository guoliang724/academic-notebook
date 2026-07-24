import { getDb } from './index';

/**
 * Seed the database with initial data from the original index.html.
 * Only inserts if the tables are empty (idempotent).
 */
export function seedDatabase() {
  const db = getDb();

  const articleCount = (db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number }).count;
  if (articleCount > 0) return; // Already seeded

  const now = Date.now();

  const articles = [
    {
      id: 'a_1784306052346',
      title: '1. 芝加哥学派与摩天大楼',
      genre: '建筑史学 / 说明文',
      body: 'The career of the Chicago architect, Louis Sullivan, coincided with the so-called Chicago School of Architects, which was given the challenge to invent the high-rise building, known as a skyscraper. This was facilitated by the introduction of the electric elevator, and the abundance of steel. The building\'s steel skeleton could be erected and the remaining components quickly attached to complete the project.',
      translation: '芝加哥建筑师路易斯·沙利文的职业生涯，恰逢所谓的"芝加哥建筑学派"兴起。当时，该学派肩负着一项历史使命——发明被称为"摩天大楼"的高层建筑。这一进程还得益于电力电梯的引入以及钢材的大量供应。只要将建筑物的钢骨架搭建起来，便能迅速附上其余组件以完成项目。',
      insights: JSON.stringify([
        '【增词法与词类转换】原文：the abundance of steel。直译：钢材的丰富。翻译精雕：钢材的大量供应 / 充足储备。技巧：将抽象名词转换为动宾或偏正结构，符合中文工业文体表达习惯。',
        '【被动语态无痕转换】原文：This was facilitated by... 直译：这被……所促进。翻译精雕：这还得益于……的引入 / 这一进程得益于…… 技巧：在中文中尽量避免死板的"被"字句，用"得益于"、"在……推动下"进行无痕转换。',
        '【句式重组】原文：...which was given the challenge to invent the high-rise building... 直译：……他们被给予了去发明高层建筑的挑战。翻译精雕：……他们肩负着一项历史使命——发明高层建筑。技巧：将 was given the challenge 意译为"肩负使命"，并将定语拆成独立的短句。'
      ]),
      grammar: JSON.stringify([
        { title: '第一句：多重定语嵌套', skeleton: 'The career (主语) + coincided with (谓语) + the Chicago School (宾语).', notes: 'Louis Sullivan 是主语的同位语；coincide with 是高频短语（与...重合）；which 引导非限制性定语从句修饰 School；to invent 做后置定语修饰 challenge；known as a skyscraper 是过去分词短语作定语修饰 building。' },
        { title: '第二句：被动语态与形式主语', skeleton: 'This (主语) + was facilitated by (被动谓语) + [the introduction... and the abundance...] (介宾结构作状语).', notes: 'This 指代上一句"发明摩天大楼"这一整件事。在学术写作中，被动语态比主动语态更显客观，同时能让主语 This 保持句际连贯性。' },
        { title: '第三句：并列句与省略技巧 (Ellipsis)', skeleton: 'The building\'s skeleton could be erected and the components quickly [could be] attached...', notes: '后半句省略了与前半句相同的助动词 could be（只留下了过去分词 attached），这是英语为了避免重复而常用的省略手法。' }
      ]),
      vocab: JSON.stringify([
        { word: 'coincide with', type: 'v.', meaning: '与……相重合；恰逢', rating: '⭐⭐⭐⭐⭐', root: 'co- (共同) + incide (落入，来自拉丁语 incidere) → 共同落入同一时空 → 巧合/重合' },
        { word: 'facilitate', type: 'v.', meaning: '促进；使便利；推动', rating: '⭐⭐⭐⭐⭐', root: 'facil- (容易的，来自拉丁语 facilis) + -ate (动词后缀) → 使变得容易 → 促进' },
        { word: 'abundance', type: 'n.', meaning: '充裕；丰裕', rating: '⭐⭐⭐⭐', root: 'ab- (离开) + und- (波浪，来自拉丁语 unda) + -ance (名词后缀) → 波浪溢出 → 充裕/丰富' }
      ]),
      specialHTML: ''
    },
    {
      id: 'a_1784306052347',
      title: '2. 住宅室内设计要素',
      genre: '室内设计 / 说明文',
      body: 'The interior design of dwellings, such as apartments and houses, usually involves both practical and aesthetic decisions. Choices have to be made for almost every element, from ceilings and lamps, curtains and blinds, corridors and doorways, niches and ledges, grates and ventilations, terraces and staircases and even sewers or drainers.',
      translation: '住宅（如公寓、排屋等）的室内设计通常涉及实用与美观的双重抉择。从天花板与灯具、窗帘与百叶窗、走廊与门道、壁龛与窗台、格栅与通风口、露台与楼梯，甚至到下水道和排水口，几乎每一个要素都需要做出选择。',
      insights: JSON.stringify([
        '【无灵主语与被动化解】原文：Choices have to be made... 直译：选择必须被做出。翻译精雕：几乎每一个要素都需要做出选择。技巧：英文常用无灵主语强调客观必要性，中文则将其化被动为主动，理顺动作逻辑。',
        '【排比句的韵律与意合】原文：from ceilings and lamps, curtains and blinds... 直译：从天花板和灯、窗帘和百叶窗…… 翻译精雕：从天花板与灯具、窗帘与百叶窗…… 技巧：英文以介词 and 进行结构连接（形合），中文重意合，通过顿号与配对连词交叉使用，增强空间纵深感与节奏美。'
      ]),
      grammar: JSON.stringify([
        { title: '第一句：同位语插入与经典宾语搭配', skeleton: 'The interior design (主语) + [of dwellings...] (后置定语) + usually involves (谓语) + decisions (宾语).', notes: 'such as apartments and houses 作为插入语，补充说明 dwellings。involve both A and B decisions 是学术论文中概括综合性问题的黄金搭配。' },
        { title: '第二句：超长排比平行结构 (Parallel Structure)', skeleton: 'Choices have to be made for elements + from [Category A, B... and even Z].', notes: '这是英文说明文的极品长句。运用 from 引导的长排比，通过 from... and even... 的递进结构，将 14 个家装词汇两两配对，营造穷尽式列举的视觉说服力。' }
      ]),
      vocab: JSON.stringify([
        { word: 'dwelling', type: 'n.', meaning: '住宅；住所 (比 house 更具学术色彩)', rating: '⭐⭐⭐⭐', root: 'dwell (居住，来自古英语 dwellan “延误/停留”) + -ing (名词后缀) → 停留之处 → 住所' },
        { word: 'aesthetic', type: 'adj.', meaning: '美学的；审美的', rating: '⭐⭐⭐⭐⭐', root: 'aesthet- (来自希腊语 aisthētikos “感知的”) + -ic (形容词后缀) → 与感知美相关的 → 审美的' }
      ]),
      specialHTML: '<h5>✍️ 黄金句式仿写模板</h5><p><strong>句型：表达"在诸多繁杂要素中皆需做出考量/选择"</strong><br/>模板：Choices have to be made for almost every element, from [Item A] to [Item B], and even [Item C].<br/>例句：In digital marketing, choices have to be made for almost every element, from content creation to data analysis, and even customer feedback.</p><h5>🚿 深度辨析：Site (线与面) 与 Spot (具体点)</h5><p><strong>Site (大场地、规划土地)：</strong>边界明确，具特定用途。如 Construction site (建筑工地)。<br/><strong>Spot (具体点、眼前位置)：</strong>面积小，具现场感。如 Parking spot (停车位), Sweet spot (最佳击球点/黄金位)。</p>'
    },
    {
      id: 'a_1784306052348',
      title: '3. 房屋租赁契约定义',
      genre: '法律英语 / 合同文本',
      body: 'The lease is a contract to rent by which one party, called the landlord or lessor, grants possession and use of the property for a limited term to another party, who is called the tenant or lessee.',
      translation: '租赁合同是指一种租赁契约。根据该合同，一方（称为出租人）在特定期限内，将租赁财产的占有权和使用权让与另一方（称为承租人）。',
      insights: JSON.stringify([
        '【法律名词严谨对译】原文：grants possession and use。直译：给占有和使用。翻译精雕：将……的占有权和使用权让与……。技巧：在法律语境中，grant 不可译为随意的"给"，必须精雕为法理严谨的"让与/授予"；possession 需界定为"占有权"。',
        '【身份名词句式重组】原文：one party, called the lessor, grants... to another party, who is called the lessee。直译：被称为出租人的一方，让与给另一被称为承租人的一方。翻译精雕：一方（称为出租人）……让与另一方（称为承租人）。技巧：将繁琐的定语从句和分词短语处理为中文的括号备注或前置定语，消除阅读障碍。'
      ]),
      grammar: JSON.stringify([
        { title: '核心主干与防歧义定语从句', skeleton: 'The lease is a contract + [by which one party... grants... to another party].', notes: 'by which 相当于 through this contract，界定了合同的核心交换性质。法律英语必须用"介词+which"来确保关系代词的指代绝对清晰，杜绝漏洞。' },
        { title: '双重身份嵌套修饰', skeleton: 'one party, [called the lessor] (分词作定语), grants... to another party, [who is called the lessee] (定语从句).', notes: '这是一种双重嵌套结构，目的在于在同一条长句中将"行为主体"、"权利边界"与"受让主体"死死绑定。' }
      ]),
      vocab: JSON.stringify([
        { word: 'possession', type: 'n.', meaning: '占有权 (区别于 ownership 所有权)', rating: '⭐⭐⭐⭐⭐', root: 'possess- (拥有，来自拉丁语 possidere: pot- “有力的” + sedere “坐/占据”) + -ion (名词后缀) → 有力地占据 → 占有权' },
        { word: 'grant', type: 'v.', meaning: '授予；同意；让与 (法律文书极高频词)', rating: '⭐⭐⭐⭐⭐', root: '来自古法语 graanter / 拉丁语 crēdere (信任) → 因信任而给予 → 授予/同意' }
      ]),
      specialHTML: '<h5>✍️ 黄金句式仿写模板</h5><p><strong>句型：界定具有法律效力的契约或协议</strong><br/>模板：[Agreement] is a contract by which one party, called [Party A], grants [Right] to another party, who is called [Party B].<br/>例句：A non-disclosure agreement is a contract by which one party, called the discloser, grants confidential information to another party, who is called the recipient.</p><h5>⚖️ 法律英语核心规律：-or 与 -ee</h5><p><strong>-or 代表"施动者"，-ee 代表"受动者"</strong>。如：Lessor(出租人) vs Lessee(承租人)；Mortgagor(抵押人) vs Mortgagee(受抵押人/银行)。</p><h5>⚖️ 权利让与的四维梯度</h5><p>1. <strong>possession (占有权)</strong>：最高权限，具有实际物理控制权。<br/>2. <strong>use (使用权)</strong>：中等权限，仅限在特定目的范围内使用。<br/>3. <strong>permit (批准许可)</strong>：行政性质，政府准许。<br/>4. <strong>right (合法权利)</strong>：最抽象，受法律保护的资格。</p>'
    },
    {
      id: 'a_1784306052349',
      title: '4. 都市圈与城市扩张',
      genre: '社会地理学',
      body: 'These cities are usually associated with metropolitan areas and urban sprawl that creates a large numbers of business commuters. When a city\'s growth sprawls far enough to reach another city, the two cities can be deemed a conurbation, or megalopolis.',
      translation: '这些城市通常与大都市区以及城市扩张联系在一起，从而产生了大量的通勤上班族。当一个城市的扩张范围足够大，以致与另一个城市相接合时，这两个城市便可被视为一个城市群（或称连绵大都市）。',
      insights: JSON.stringify([
        '【因果逻辑链重组】原文：urban sprawl that creates a large numbers of... 直译：创造大量通勤者的城市扩张。翻译精雕：与城市扩张联系在一起，从而产生了大量的通勤上班族。技巧：原文的定语从句若直译会导致头重脚轻，将其意译为结果状语，理顺了中文的因果递进链条。',
        '【同位语的多级递进翻译】原文：deemed a conurbation, or megalopolis. 直译：被视为城市群或连绵大都市。翻译精雕：被视为城市群（或称连绵大都市）。技巧：or 在这里不是选择关系，而是概念的跃升补充，译为"或称……"极好地还原了学术递进感。'
      ]),
      grammar: JSON.stringify([
        { title: '第一句：客观现象关联与定语从句', skeleton: 'These cities (主) + are associated with (谓语) + areas and sprawl (宾) + [that creates...] (定从).', notes: 'be associated with 是学术写作表达"事物间存在客观联系"的首选被动短语，避免武断地使用 cause (导致)。' },
        { title: '第二句：程度状语与高级推论谓语', skeleton: 'When [condition sprawls far enough to reach...] + [the two cities can be deemed...].', notes: 'far enough to reach 构成了典型的"程度+结果"状语结构；deemed 是表达"客观认定、学术判定"的顶级动词，其严谨度远超 consider。' }
      ]),
      vocab: JSON.stringify([
        { word: 'urban sprawl', type: 'n.', meaning: '城市扩张；无序蔓延', rating: '⭐⭐⭐⭐⭐', root: 'urban (来自拉丁语 urbs “城市”) + sprawl (来自古英语 spreawlian “蹬跴/伸展”) → 城市的无序伸展 → 城市蔓延' },
        { word: 'deem', type: 'v.', meaning: '认为；视作 (高度正式)', rating: '⭐⭐⭐⭐⭐', root: '来自古英语 dēman (判断) → 日耳曼语 doom (命运/判决) 同源 → 正式地判定/认定' }
      ]),
      specialHTML: '<h5>✍️ 黄金句式仿写模板</h5><p><strong>句型：表达"某现象伴随某因素产生，并引发了进一步后果"</strong><br/>模板：[Subject] is usually associated with [Phenomenon A] that creates [Result C].<br/>例句：The rapid development of AI is usually associated with big data that creates a massive demand for computing power.</p><h5>🗺️ 空间词汇辨析：Suburbs vs Outskirts</h5><p>• <strong>Suburbs (住宅郊区)</strong>：侧重生活居住属性，西方语境指中产阶级居住、绿化极佳的成熟社区。<br/>• <strong>Outskirts (市郊/边缘)</strong>：侧重地理边界，指城市与乡村交界处，常伴随工业区或荒地。</p><h5>📐 北美生活必备：英美制度量衡换算</h5><p>• 1 inch = 2.54 cm；1 foot = 12 inches ≈ 30.48 cm；1 mile = 5280 feet ≈ 1.61 km<br/>• 容量：1 gallon ≈ 3.78 L<br/>• 温度：华氏度(℉) = ℃ × 1.8 + 32</p>'
    },
    {
      id: 'a_1784306052350',
      title: '5. 环境卫生与健康预防',
      genre: '公共卫生学',
      body: 'Sanitation is a hygienic process of limiting human exposure to the potential health hazards of wastes from physical, microbiological, biological, or chemical agents that may cause diseases.',
      translation: '环境卫生是指通过限制人类接触可能致病的物理、微生物、生物或化学介质等潜在健康危害废物，从而达到卫生防病目的的过程。',
      insights: JSON.stringify([
        '【经典动名转换】原文：limiting human exposure to... 直译：限制人类对……的暴露。翻译精雕：限制人类接触…… 技巧：名词 exposure 直译生硬，转换为动宾结构完美契合中文语感。',
        '【介词链逆向翻译与目的补齐】原文：hazards of wastes from agents that may cause... 直译：来自可能致病介质的废物的危害。翻译精雕：限制人类接触可能致病的……废物，从而达到卫生防病目的的过程。技巧：面对嵌套的 of/from，必须逆向重组（介质->废物->危害）。为了定义完整，在翻译 process 时补齐了"从而达到防病目的"的潜台词。'
      ]),
      grammar: JSON.stringify([
        { title: '主句骨架：极简定义句式', skeleton: 'Sanitation (主语) + is (系动词) + a process (表语).', notes: '这是学术论文下定义的标准主系表结构，主干极简，为后面承载海量修饰语留出语法空间。' },
        { title: '修饰语：高难度葡萄串式介词链 (Prepositional Chain)', skeleton: '...a process + [of limiting exposure] + [to hazards] + [of wastes] + [from agents] + [that may cause...].', notes: '这是考研、托福等学术阅读中最难的介词嵌套。每一层介词都在界定前一个名词的范围，犹如连环扣。拆解这种长句必须像剥洋葱一样，找到最终端的 that 定语从句，然后从内向外回溯。' }
      ]),
      vocab: JSON.stringify([
        { word: 'sanitation', type: 'n.', meaning: '环境卫生；卫生系统', rating: '⭐⭐⭐⭐⭐', root: 'sanit- (来自拉丁语 sanitas “健康”, 词根 san- “健全的”) + -ation (名词后缀) → 使健康的过程 → 卫生防护' },
        { word: 'hazard', type: 'n.', meaning: '危险源；隐患 (强调潜在的客观威胁)', rating: '⭐⭐⭐⭐', root: '来自阿拉伯语 az-zahr (骰子/机会) → 经西班牙语 azar (不幸的机会) → 潜在危险/隐患' }
      ]),
      specialHTML: '<h5>✍️ 黄金句式仿写模板</h5><p><strong>句型：为复杂的"防御/预防"机制下严谨定义</strong><br/>模板：[Concept] is a process of limiting human exposure to the potential hazards of [Element] from [Source] that may cause [Problem].<br/>例句：Cybersecurity is a process of limiting human exposure to the potential digital hazards of malicious software from unauthorized sources that may cause data breaches.</p><h5>🚿 排水与排污名词精准辨析</h5><p>• <strong>Sewage (黑水)</strong>：含有排泄物、高浓度病原体的极脏废水。<br/>• <strong>Sullage/Greywater (灰水)</strong>：洗衣服、洗碗等可回收的轻污染废水。<br/>• <strong>Drainer (地漏/排水口)</strong>：家用的最前端集水阀。<br/>• <strong>Septic Tank (化粪池)</strong>：独立私家的地下排污沉淀罐，依靠微生物自然净化。</p>'
    }
  ];

  const templates = [
    { id: 't_1784264734001', name: '合同定义句式', category: '法律/商业', content: '[Contract Name] is a contract by which one party, called the [Role A], grants [Rights/Goods] to another party, who is called the [Role B].' },
    { id: 't_1784264734002', name: '因果论证句式', category: '学术论证', content: '[Phenomenon] is caused by [Factor], which leads to [Outcome] and subsequently affects [Domain].' },
    { id: 't_1784264734003', name: '时代趋势句式', category: '社会分析', content: 'The career/development of [Entity] coincided with the so-called [Trend/Movement], which was given the challenge to [Mission].' },
    { id: 't_1784264734004', name: '过程定义句式', category: '学术定义', content: '[Concept] is a/an [adjective] process of [verb-ing] [Target] to/from [Outcome/Goal].' }
  ];

  const insertArticle = db.prepare(`
    INSERT INTO articles (id, title, genre, body, translation, insights, grammar, vocab, specialHTML, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTemplate = db.prepare(`
    INSERT INTO templates (id, name, category, content, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    for (const a of articles) {
      insertArticle.run(a.id, a.title, a.genre, a.body, a.translation, a.insights, a.grammar, a.vocab, a.specialHTML, now, now);
    }
    for (const t of templates) {
      insertTemplate.run(t.id, t.name, t.category, t.content, now, now);
    }
  });

  insertAll();
  console.log(`[Seed] Inserted ${articles.length} articles and ${templates.length} templates.`);
}
