async function test() {
  const targetUrl = 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions';
  const apiKey = 'tp-cvjmp0pf6zdbckc0t1pskq62whfu1nngbtijv7yquol8ng71';
  const model = 'mimo-v2.5';
  const query = '我要去北京所有的公园玩';

  console.log("Sending request to AI with REAL front-end prompt (streaming)...");
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        temperature: 0.1,
        stream: true, // 开启流
        messages: [
          {
            role: "system",
            content: `你是一个智能周末出行管家小美的语义提取与地标规划助手。请精准解析用户的周末出行心愿，提取结构化参数，并根据用户的描述进行自由的地标/商户推荐与高德经纬度坐标预测。必须严格以简洁的 JSON 格式输出，不要包含任何 markdown 代码块格式（如 \`\`\`json），也不要带任何文字解释！

输出的 JSON 结构必须为：
{
  "durationHours": 数字，建议的周末出行总时长（几小时），若未提及则默认 5,
  "maxDistanceKm": 数字，离家/起点的最大公里数（北京跨区景点如天坛、故宫、颐和园跨度较大，若包含这类跨区景点请设为 30），若未提及则默认 5,
  "hasChild": 布尔值，是否带小孩/儿童/宝宝/学龄前/几岁娃,
  "hasSlimming": 布尔值，是否有减肥/瘦身/减脂/低盐低糖/轻食/沙拉等健康塑形需求,
  "isFriendsGroup": 布尔值，是否是青年社交/密室/聚会/桌游/剧本杀等多人社交场合,
  "transportPreference": 字符串，"subway" | "taxi" | "walk" | "auto" 中的一个，如果用户强指定了出行方式如“坐地铁”则为 subway，提到“打车”则为 taxi，提到“步行/散步”则为 walk，未强指定则为 auto,
  "nodes": [
    {
      "name": "真实好玩的景点、餐饮商户或酒店住宿名称。必须优先规划用户在心愿中指定的全部景点（例如用户同时指定了天坛、故宫、颐和园，必须在nodes序列中全部输出这三个景点，一个不能少！）。并在景点之间合适的位置智能插针规划就餐点（eat），若提到过夜、住宿或行程大于5小时，在最末尾智能推荐插针一个高品质住宿点（hotel）",
      "description": "为什么推荐这里的温馨推荐语 (不超过40字)",
      "price": 价格数字（如门票价格、餐人均消费或酒店单晚价格），例如150,
      "duration": 游玩或就餐建议停留分钟数数字（景点通常为120-180分钟，餐饮通常为80分钟，酒店住宿可为0）,
      "tags": ["适合标签，3-4个"],
      "position": [经度, 纬度] (必须为真实的高德经纬度坐标数组。天坛高德坐标[116.4108, 39.8725]；故宫高德坐标[116.3974, 39.9180]；颐和园高德坐标[116.2730, 39.9920]。经度在前纬度在后，必须准确！),
      "type": "play" | "eat" | "hotel"
    }
  ]
}`
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }

    const reader = response.body;
    if (!reader) {
      console.error("Response body is null");
      return;
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let completeText = "";
    
    for await (const chunk of reader) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
          try {
            const dataJson = JSON.parse(trimmed.slice(6));
            const choice = dataJson.choices?.[0];
            const contentChunk = choice?.delta?.content || choice?.text || "";
            if (contentChunk) {
              completeText += contentChunk;
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    }
    console.log("\n================ COMPLETE TEXT ================");
    console.log(completeText);
    console.log("===============================================");
  } catch (err) {
    console.error("Error during fetch:", err);
  }
}

test();
