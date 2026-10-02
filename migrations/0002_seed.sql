-- 种子数据（由 scripts/gen-seed.mjs 生成）

-- 创建者：creator / admin123
INSERT INTO news_user (id, username, display_name, password_hash, role, status, created_at)
   VALUES ('00000000-0000-4000-8000-000000000001', 'creator', '创建者', '9c3b03f370f33254f1becc8c709a893a.c0320025ee32c3e1cd44065ab41ee697de573737dc3b03b743d3d2f1f11176d90f10e48cc5ea9545629618c5c797e09e3c50a7848ea0ceb3290bcdd847b8b5d3', 'creator', 'approved', 1790812800000);

-- 分类
INSERT INTO news_category (id, name, slug, sort_order, created_at)
     VALUES ('11111111-1111-4111-8111-111111111101', '头条新闻', 'toutiao', 1, 1790812800000);
INSERT INTO news_category (id, name, slug, sort_order, created_at)
     VALUES ('11111111-1111-4111-8111-111111111102', '国内新闻', 'guonei', 2, 1790812800000);
INSERT INTO news_category (id, name, slug, sort_order, created_at)
     VALUES ('11111111-1111-4111-8111-111111111103', '国际新闻', 'guoji', 3, 1790812800000);
INSERT INTO news_category (id, name, slug, sort_order, created_at)
     VALUES ('11111111-1111-4111-8111-111111111104', '校园新闻', 'xiaoyuan', 4, 1790812800000);
INSERT INTO news_category (id, name, slug, sort_order, created_at)
     VALUES ('11111111-1111-4111-8111-111111111105', '文化体育', 'wenhua', 5, 1790812800000);

-- 示例新闻（均为已发布）
INSERT INTO news_article
       (id, title, summary, content, cover_url, category_id, author_id,
        status, view_count, published_at, created_at)
     VALUES ('22222222-2222-4222-8222-222222222201', '复古新闻平台正式上线 重温古早互联网记忆', '一个以蓝色高光按钮、报头大字与纸质排版为特色的新闻网站今日与读者见面。',
       '本报讯 今天，一座主打"古早互联网"风格的新闻平台正式上线。

平台在视觉上还原了世纪之交网页的标志性元素：蓝色渐变高光按钮、立体描边边框、左上角的校徽报头，以及红色书法字体的大字报名，让老网民一眼梦回拨号上网的年代。

在功能上，平台设有创建者、管理员与读者三类身份。读者注册需经管理员审批，管理员撰写的新闻则需创建者批准后方可发布。创建者拥有用户封禁、改名、删除以及新闻上下线的完整权限。

平台采用 Cloudflare Pages 全球边缘网络托管，无需本地服务器即可 7×24 小时访问。', NULL, '11111111-1111-4111-8111-111111111101', '00000000-0000-4000-8000-000000000001',
       'published', 0, 1790812800000, 1790812800000);
INSERT INTO news_article
       (id, title, summary, content, cover_url, category_id, author_id,
        status, view_count, published_at, created_at)
     VALUES ('22222222-2222-4222-8222-222222222202', '校园秋季运动会圆满落幕 师生共展青春风采', '为期两天的校秋季运动会顺利结束，多个项目刷新校纪录。',
       '本报讯 为期两天的校园秋季运动会近日圆满落下帷幕。

赛场上，运动员们奋勇争先，在短跑、跳远、接力等项目中激烈角逐，多个项目的校纪录被刷新。看台上，各班啦啦队的加油声此起彼伏，气氛热烈。

主办方表示，本届运动会不仅锻炼了同学们的体魄，更增强了班级凝聚力，充分展现了新时代学子昂扬向上的精神风貌。', NULL, '11111111-1111-4111-8111-111111111104', '00000000-0000-4000-8000-000000000001',
       'published', 0, 1790816400000, 1790816400000);
INSERT INTO news_article
       (id, title, summary, content, cover_url, category_id, author_id,
        status, view_count, published_at, created_at)
     VALUES ('22222222-2222-4222-8222-222222222203', '数字阅读持续升温 纸质书与电子书各拥读者', '最新调查显示，越来越多读者选择"纸电结合"的阅读方式。',
       '本报讯 随着移动设备的普及，数字阅读近年来持续升温。

一项面向读者的调查显示，超过六成受访者表示会同时阅读纸质书与电子书：通勤路上用手机或阅读器看书，回到家中则捧起纸质书细细品读。

业内人士认为，纸质书与电子书并非替代关系，而是各有优势、互为补充，共同丰富着人们的精神文化生活。', NULL, '11111111-1111-4111-8111-111111111105', '00000000-0000-4000-8000-000000000001',
       'published', 0, 1790820000000, 1790820000000);
INSERT INTO news_article
       (id, title, summary, content, cover_url, category_id, author_id,
        status, view_count, published_at, created_at)
     VALUES ('22222222-2222-4222-8222-222222222204', '国际合作再添新成果 多国民众共享发展机遇', '新一轮多边合作项目启动，覆盖教育、文化与科技等多个领域。',
       '本报讯 近日，新一轮多边合作项目正式启动，来自多个国家的代表共同出席了启动仪式。

据介绍，本轮合作涵盖教育交流、文化互鉴与科技创新等多个领域，将通过联合办学、展览互访、共建实验室等形式，让各国民众共享发展机遇。

与会代表纷纷表示，将以此次合作为契机，进一步增进理解、深化友谊，推动构建更加紧密的合作关系。', NULL, '11111111-1111-4111-8111-111111111103', '00000000-0000-4000-8000-000000000001',
       'published', 0, 1790823600000, 1790823600000);