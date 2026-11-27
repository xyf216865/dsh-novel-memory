# novel-memory 使用说明

给 agent 看的。第一次用、或参数拿不准时，调 `novel_help` 再读一遍。
原则一句话：原文只按需读，读过的每层记忆都要能回溯到 `[chN]`。

## 开启与收起

- 工具默认收起，不占上下文。`novel_wake action=on` 唤出 `novel_index / novel_find / novel_memo / novel_world / novel_check`（外加本说明 `novel_help`）。
- `novel_wake action=on book=<书名或唯一片段>` = 开启并顺带挂书。
- 不聊书了：`novel_wake action=off`。

## 开书

```
novel_index action=open path=<绝对路径>
novel_index action=open text=<正文>
```

- `path` 必须是**绝对路径**；相对路径按 DSH 进程目录解析，不是会话目录，通常都会失败。
- 支持 .txt / .text / .md，UTF-8 与 GB18030 自动识别。
- 返回：`mode = full`（正文 < 15 万字，可全读）/ `pipeline`（走分批管线）、`split = headings`（按章标题切）/ `chunked`（每 5000 字一段）。
- `open` 只是建库。还要 `novel_index action=attach` 才挂到当前会话；`novel_wake action=on book=…` 或 `open` 时带 `book` 也是挂。
- 章号一律用插件自己的 `[chN]`。原文标题里的「第 X 章」是文件自带编号，可能跳号或重号，**不要混用**。

## 读原文

```
novel_index action=read from=5 to=12
```

- 一次 5–10 章；返回过长会截到 `maxChars`（默认 12000）并告诉你下一段从哪开始。
- 读过的章，在写 L1 之前不要再读一遍；没写的章不要跳过。

## 写记忆

### L1 章摘要

```
novel_memo layer=l1 chapter=7 one="……" marks=[{k:"foreshadow",id:"f12",note:"……"}]
```

- `one` 最多 400 字。按距最新章远近分档：≤50 章 4–8 句；51–100 章 3–6 句；更早 2–4 句。
- 每 50 章跑一次 `novel_check types=[l1]`，把超标的章改短（回压）。
- `marks[].k` 只认：`turn` 转折 / `foreshadow` 伏笔埋设 / `payoff` 伏笔回收 / `motif` 母题 / `enter` 人物入场 / `exit` 人物退场 / `relation` 关系变更 / `lore` 世界观揭示。
- `foreshadow` 与 `payoff` 用同一个 `id` 配对；不给 id 时系统自动生成。
- 拿不准算不算伏笔就写 `motif`——母题不计欠账。

### L2 弧摘要

```
novel_memo layer=l2 from=1 to=18 title="……" summary="……"
```

- 15–25 章一弧，`summary` ≤600 字。

### L3 全局印象

```
novel_memo layer=l3 part=reader text="……"
novel_memo layer=l3 part=author text="……"
```

- `part` 只有 `reader`（读者反应）和 `author`（作者分析）。讨论期的判断不要改 L3，追加到 `layer=decisions`。

### 途中的感想

```
novel_memo layer=impression chapter=12 part=reader text="……"
```

- 单章单通道最多 3 条，`text` ≥6 字；读到有反应的地方当场写。

### 自定义笔记

```
novel_memo layer=note task="唯美摘抄" chapter=9 text="……"
novel_memo layer=note action=read task="唯美摘抄"
```

- 只写不读：默认不进摘要，除非用户要求。字数默认不限（用户可在页面上限）。

## 客观层

```
novel_world kind=facts action=set fact=character entry={name,aliases,role,status,tier,deathChapter,note}
novel_world kind=facts action=set fact=relation  entry={a,b,type,since}
novel_world kind=facts action=set fact=foreshadow entry={id,setupChapter,desc,payoffChapter}
```

- `status` 常用 `alive / dead / missing / unknown / 残魂`；`dead` 要带 `deathChapter`。
- `tier`：A 主角级常驻 / B 会再出现的配角 / C 龙套。C 级死亡 20 章后可 `action=prune` → `action=archive` 归档成墓碑，`action=restore` 还原。
- 关系两端可以是人物、组织、地点、种族，不限于人物。
- 时间点写进 L1，不单独建表。

世界观与文风：

```
novel_world kind=world action=set tag="玄天宗" one="一行摘要" body="……" level=A aliases=["玄天","天宗"]
novel_world kind=world action=get tag=<标签或别名>
novel_world kind=style action=append passage={chapter:9,text:"3–7 句完整原文",note="……"}
novel_world kind=style action=get
```

- 世界观卡两级：`list` 只出索引，`get` 才展开正文；别名一定要填，检索靠它。
- 文风摘录每条 **3–7 句**，少于或超出会被拒；总字数上限默认 2000，页面可调。
- 文风参考窗口默认取已读的最后两章全文；用户锁定后不要改。

## 检索与体检

```
novel_find q="关键词 关键词" from=1 to=50 regex=false
novel_index action=person name=<人物名或别名>
novel_index action=info
novel_check types=[coverage,unrecovered,dead,cadence,conflict,l1,prune,injection]
```

- `novel_find` 默认按字面匹配，空格分隔多词＝全部命中；结果带 `[chN]`。
- `check`：`coverage` 覆盖缺口 / `unrecovered` 未回收伏笔 / `dead` 死后又出现（只给候选，必须回原文核）/ `cadence` 口水词 / `conflict` 设定冲突 / `l1` 摘要长度分档 / `prune` 可归档候选 / `injection` 正文里像指令的可疑句。

## 报错怎么读

- `路径不存在：X（按当前目录解析成 Y）` → 换成绝对路径。
- `正文是空的（0 字）` / `正文只有 N 字` → 文件拿错了，或内容确实为空。
- `layer 只能是 l1 / l2 / l3 / impression / decisions / note` → 参数名写错。
- `facts 只分 characters / relations / foreshadow` → 没有 timeline 了，时间点写 L1。
- `单章单通道最多 3 条` / `摘录要 3–7 句` → 内容层面的硬限制。
- `文风窗口已锁（用户锁定）` → 让用户在页面上解锁，不要绕过。

## 数据在哪儿

`~/.dsh-novel/books/<书 id>/`：`source.txt` 原文、`book.json`、`chapters.json`、`l1.json`、`l2.json`、`l3.*.md`、`facts.json`、`world.json`、`style.json`、`notes.md`、`decisions.jsonl`。
删除整本：`novel_index action=remove`（不可恢复）或页面上的「删除这本」。
