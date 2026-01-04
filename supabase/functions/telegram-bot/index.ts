import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Telegram API helper
async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error("Telegram API error:", error);
    throw new Error(`Failed to send Telegram message: ${error}`);
  }
  
  return response.json();
}

// Tool definitions (simplified for Telegram - same as main AI chat)
const tools = [
  {
    type: "function",
    function: {
      name: "manage_tasks",
      description: "Create, update, delete, list, or complete tasks",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list", "complete"] },
          task_id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["todo", "in-progress", "completed"] },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          due_date: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_habits",
      description: "Create, update, delete, list habits, or toggle habit completion for today",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list", "toggle_today"] },
          habit_id: { type: "string" },
          name: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_transactions",
      description: "Create, update, delete, or list financial transactions",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list"] },
          type: { type: "string", enum: ["income", "expense"] },
          amount: { type: "number" },
          category: { type: "string" },
          description: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_notes",
      description: "Create, update, delete, or list notes",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list"] },
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_summary",
      description: "Get a summary of tasks, habits, or transactions",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["tasks", "habits", "transactions", "all"] },
          period: { type: "string", enum: ["today", "week", "month"] },
        },
        required: ["type"],
      },
    },
  },
];

// Execute tool functions
async function executeTool(supabase: any, userId: string, toolName: string, args: any) {
  try {
    switch (toolName) {
      case "manage_tasks":
        return await handleTasks(supabase, userId, args);
      case "manage_habits":
        return await handleHabits(supabase, userId, args);
      case "manage_transactions":
        return await handleTransactions(supabase, userId, args);
      case "manage_notes":
        return await handleNotes(supabase, userId, args);
      case "get_summary":
        return await handleSummary(supabase, userId, args);
      default:
        return { success: false, message: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    return { success: false, message: error instanceof Error ? error.message : "An error occurred" };
  }
}

async function handleTasks(supabase: any, userId: string, args: any) {
  const { action, task_id, title, description, status, priority, due_date } = args;

  switch (action) {
    case "create":
      if (!title) return { success: false, message: "Title is required" };
      const { data: newTask, error: createError } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title,
          description: description || "",
          status: status || "todo",
          priority: priority || "medium",
          due_date: due_date || null,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `✅ Created task: "${newTask.title}"` };

    case "complete":
      if (!task_id) {
        // Try to find task by title
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .neq("status", "completed")
          .ilike("title", `%${title || ""}%`)
          .limit(1);
        
        if (tasks && tasks.length > 0) {
          await supabase
            .from("tasks")
            .update({ status: "completed" })
            .eq("id", tasks[0].id);
          return { success: true, message: `✅ Completed: "${tasks[0].title}"` };
        }
        return { success: false, message: "Task not found" };
      }
      await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", task_id)
        .eq("user_id", userId);
      return { success: true, message: "✅ Task completed!" };

    case "list":
      const { data: tasksList } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (!tasksList || tasksList.length === 0) {
        return { success: true, message: "📋 No pending tasks!" };
      }
      
      const taskSummary = tasksList.map((t: any, i: number) => 
        `${i + 1}. ${t.title} [${t.priority}]${t.due_date ? ` - Due: ${t.due_date}` : ""}`
      ).join("\n");
      return { success: true, message: `📋 *Your Tasks:*\n${taskSummary}` };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleHabits(supabase: any, userId: string, args: any) {
  const { action, habit_id, name } = args;

  switch (action) {
    case "create":
      if (!name) return { success: false, message: "Name is required" };
      const { data: newHabit, error } = await supabase
        .from("habits")
        .insert({
          user_id: userId,
          name,
          frequency: "daily",
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, message: `🎯 Created habit: "${newHabit.name}"` };

    case "toggle_today":
      const today = new Date().toISOString().split("T")[0];
      
      // Find habit by name if no ID
      let targetHabitId = habit_id;
      if (!targetHabitId && name) {
        const { data: habits } = await supabase
          .from("habits")
          .select("id")
          .eq("user_id", userId)
          .ilike("name", `%${name}%`)
          .limit(1);
        if (habits && habits.length > 0) {
          targetHabitId = habits[0].id;
        }
      }
      
      if (!targetHabitId) return { success: false, message: "Habit not found" };
      
      const { data: existing } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("habit_id", targetHabitId)
        .eq("completed_date", today)
        .single();
      
      if (existing) {
        await supabase.from("habit_completions").delete().eq("id", existing.id);
        return { success: true, message: "❌ Habit unmarked for today" };
      } else {
        await supabase.from("habit_completions").insert({
          habit_id: targetHabitId,
          user_id: userId,
          completed_date: today,
        });
        return { success: true, message: "✅ Habit completed for today!" };
      }

    case "list":
      const todayDate = new Date().toISOString().split("T")[0];
      const { data: habits } = await supabase
        .from("habits")
        .select("*, habit_completions(*)")
        .eq("user_id", userId);
      
      if (!habits || habits.length === 0) {
        return { success: true, message: "🎯 No habits yet!" };
      }
      
      const habitSummary = habits.map((h: any) => {
        const completedToday = h.habit_completions?.some((c: any) => c.completed_date === todayDate);
        return `${completedToday ? "✅" : "⬜"} ${h.name}`;
      }).join("\n");
      
      return { success: true, message: `🎯 *Today's Habits:*\n${habitSummary}` };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleTransactions(supabase: any, userId: string, args: any) {
  const { action, type, amount, category, description } = args;

  switch (action) {
    case "create":
      if (!type || !amount || !category) {
        return { success: false, message: "Type, amount, and category are required" };
      }
      const { error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type,
          amount,
          category,
          description: description || "",
          date: new Date().toISOString().split("T")[0],
        });
      if (error) throw error;
      const emoji = type === "income" ? "💰" : "💸";
      return { success: true, message: `${emoji} Added ${type}: $${amount} for ${category}` };

    case "list":
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(10);
      
      if (!transactions || transactions.length === 0) {
        return { success: true, message: "💰 No transactions yet!" };
      }
      
      const txSummary = transactions.map((t: any) => {
        const emoji = t.type === "income" ? "💰" : "💸";
        return `${emoji} ${t.category}: $${t.amount}`;
      }).join("\n");
      
      return { success: true, message: `💰 *Recent Transactions:*\n${txSummary}` };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleNotes(supabase: any, userId: string, args: any) {
  const { action, title, content } = args;

  switch (action) {
    case "create":
      if (!title) return { success: false, message: "Title is required" };
      const { error } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          title,
          content: content || "",
        });
      if (error) throw error;
      return { success: true, message: `📝 Created note: "${title}"` };

    case "list":
      const { data: notes } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (!notes || notes.length === 0) {
        return { success: true, message: "📝 No notes yet!" };
      }
      
      const noteSummary = notes.map((n: any, i: number) => 
        `${i + 1}. ${n.title}`
      ).join("\n");
      
      return { success: true, message: `📝 *Your Notes:*\n${noteSummary}` };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleSummary(supabase: any, userId: string, args: any) {
  const { type, period } = args;
  const today = new Date();
  let startDate: string;
  
  if (period === "today") {
    startDate = today.toISOString().split("T")[0];
  } else if (period === "week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    startDate = weekAgo.toISOString().split("T")[0];
  } else {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    startDate = monthAgo.toISOString().split("T")[0];
  }

  let summary = `📊 *Summary for ${period || "today"}:*\n\n`;

  if (type === "all" || type === "tasks") {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId);
    const completed = tasks?.filter((t: any) => t.status === "completed").length || 0;
    const pending = tasks?.filter((t: any) => t.status !== "completed").length || 0;
    summary += `📋 *Tasks:* ${completed} completed, ${pending} pending\n`;
  }

  if (type === "all" || type === "habits") {
    const { data: completions } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_date", startDate);
    summary += `🎯 *Habits:* ${completions?.length || 0} completed in period\n`;
  }

  if (type === "all" || type === "transactions") {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate);
    const income = transactions?.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0) || 0;
    const expenses = transactions?.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0) || 0;
    summary += `💰 *Finance:* +$${income} / -$${expenses} (Net: $${income - expenses})\n`;
  }

  return { success: true, message: summary };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Telegram webhook received:", JSON.stringify(body, null, 2));

    // Handle webhook setup request from frontend
    if (body.action === "setup_webhook") {
      const { bot_token } = body;
      if (!bot_token) {
        return new Response(
          JSON.stringify({ success: false, error: "Bot token required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;
      const response = await fetch(`https://api.telegram.org/bot${bot_token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });

      const result = await response.json();
      console.log("Webhook setup result:", result);

      return new Response(
        JSON.stringify({ success: result.ok, result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle incoming Telegram message
    const update = body;
    const message = update.message;
    
    if (!message || !message.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat.id.toString();
    const text = message.text;

    console.log(`Message from chat ${chatId}: ${text}`);

    // Find user by telegram_chat_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, gemini_api_key, telegram_bot_token")
      .eq("telegram_chat_id", chatId)
      .single();

    if (profileError || !profile) {
      console.log("User not found for chat ID:", chatId);
      // Try to send a helpful message if we can find a bot token
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile.gemini_api_key) {
      if (profile.telegram_bot_token) {
        await sendTelegramMessage(
          profile.telegram_bot_token,
          chatId,
          "⚠️ Please add your OpenRouter API key in LifeOS Settings → AI Integration to use AI features."
        );
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build AI prompt
    const systemPrompt = `You are an AI assistant for LifeOS via Telegram. Help users manage tasks, habits, finances, and notes.
Be concise - this is Telegram. Use emojis. Today is ${new Date().toISOString().split("T")[0]}.
Answer in the same language as the user's message.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ];

    // Call OpenRouter with DeepSeek R1
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${profile.gemini_api_key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lifeos.app",
        "X-Title": "LifeOS Telegram",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenRouter error:", errorText);
      
      if (profile.telegram_bot_token) {
        await sendTelegramMessage(
          profile.telegram_bot_token,
          chatId,
          "❌ AI service error. Please try again later."
        );
      }
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];
    
    let responseText = choice?.message?.content || "";
    const toolCalls = choice?.message?.tool_calls;

    // Execute tool calls if any
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function?.name;
        let functionArgs = {};
        
        try {
          functionArgs = JSON.parse(toolCall.function?.arguments || "{}");
        } catch (e) {
          console.error("Failed to parse function arguments:", e);
        }

        console.log(`Executing function: ${functionName}`, functionArgs);
        
        const result = await executeTool(supabase, profile.id, functionName, functionArgs);
        
        // Get follow-up response
        const followUpMessages = [
          ...messages,
          { role: "assistant", content: null, tool_calls: [toolCall] },
          { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) },
        ];

        const followUpResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${profile.gemini_api_key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lifeos.app",
            "X-Title": "LifeOS Telegram",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-r1-0528:free",
            messages: followUpMessages,
          }),
        });

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          responseText = followUpData.choices?.[0]?.message?.content || result.message;
        } else {
          responseText = result.message;
        }
      }
    }

    // Send response to Telegram
    if (responseText && profile.telegram_bot_token) {
      await sendTelegramMessage(profile.telegram_bot_token, chatId, responseText);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Telegram bot error:", error);
    return new Response(
      JSON.stringify({ ok: true, error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
