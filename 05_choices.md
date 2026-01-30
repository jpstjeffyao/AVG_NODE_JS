# 選項指令範例

以下是一個簡單的腳本範例，展示如何在選項前清除對話內容：

```
SAY|Hero|我們應該往哪邊走？
CHOICE|左邊:LeftPath|右邊:RightPath
LABEL|LeftPath
SAY|Hero|我們選擇了左邊。
GOTO|End
LABEL|RightPath
SAY|Hero|我們選擇了右邊。
GOTO|End
LABEL|End
SAY|Hero|冒險結束了。