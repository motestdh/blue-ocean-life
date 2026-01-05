import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for OpenAI-compatible function calling
const tools = [
  {
    type: "function",
    function: {
      name: "manage_tasks",
      description: "Create, update, delete, list, or complete tasks. Use this for work items and to-do lists.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list", "complete"] },
          task_id: { type: "string", description: "Task ID (required for update, delete, complete)" },
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Task description" },
          status: { type: "string", enum: ["todo", "in-progress", "completed"] },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          due_date: { type: "string", description: "Due date in YYYY-MM-DD format" },
          project_id: { type: "string", description: "Project UUID to link task to (must be a valid UUID from search_project)" },
          estimated_time: { type: "number", description: "Estimated time in minutes (e.g., 30 for 30 minutes, 60 for 1 hour)" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_project",
      description: "Search for a project by name to get its UUID. ALWAYS use this before adding tasks to a specific project.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name or partial name to search for" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_projects",
      description: "Create, update, delete, or list work/personal projects. NOT for courses - use manage_courses for learning.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list"] },
          project_id: { type: "string", description: "Project ID (required for update, delete)" },
          title: { type: "string", description: "Project title" },
          description: { type: "string", description: "Project description" },
          status: { type: "string", enum: ["new", "in-progress", "completed", "on-hold", "cancelled"] },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          due_date: { type: "string", description: "Due date in YYYY-MM-DD format" },
          budget: { type: "number", description: "Project budget" },
          category: { type: "string", description: "Project category" },
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
          note_id: { type: "string", description: "Note ID (required for update, delete)" },
          title: { type: "string", description: "Note title" },
          content: { type: "string", description: "Note content" },
          folder: { type: "string", description: "Folder name" },
          is_pinned: { type: "boolean", description: "Whether to pin the note" },
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
          habit_id: { type: "string", description: "Habit ID (required for update, delete, toggle)" },
          name: { type: "string", description: "Habit name" },
          description: { type: "string", description: "Habit description" },
          frequency: { type: "string", enum: ["daily", "weekly", "monthly"] },
          color: { type: "string", description: "Habit color (hex code)" },
          icon: { type: "string", description: "Habit icon (emoji)" },
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
          transaction_id: { type: "string", description: "Transaction ID (required for update, delete)" },
          type: { type: "string", enum: ["income", "expense"] },
          amount: { type: "number", description: "Transaction amount" },
          category: { type: "string", description: "Transaction category" },
          description: { type: "string", description: "Transaction description" },
          date: { type: "string", description: "Transaction date in YYYY-MM-DD format" },
          currency: { type: "string", description: "Currency code (USD, EUR, DZD)" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_courses",
      description: "Create, update, delete, or list LEARNING courses. This is for education/learning, NOT work projects.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list"] },
          course_id: { type: "string", description: "Course ID (required for update, delete)" },
          title: { type: "string", description: "Course title" },
          platform: { type: "string", description: "Platform name (e.g., Udemy, Coursera)" },
          instructor: { type: "string", description: "Instructor name" },
          status: { type: "string", enum: ["not-started", "in-progress", "completed"] },
          notes: { type: "string", description: "Course notes" },
          target_date: { type: "string", description: "Target completion date in YYYY-MM-DD format" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_lessons",
      description: "Create, update, delete, list, or complete lessons within a course. Requires a valid course UUID.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list", "complete"] },
          lesson_id: { type: "string", description: "Lesson ID (required for update, delete, complete)" },
          course_id: { type: "string", description: "Course UUID (required for create, list) - must be real UUID from manage_courses" },
          title: { type: "string", description: "Lesson title" },
          description: { type: "string", description: "Lesson description" },
          duration_minutes: { type: "number", description: "Duration in minutes" },
          section: { type: "string", description: "Section or module name (e.g., 'Basics', 'Grammar', 'Advanced')" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_movies_series",
      description: "Create, update, delete, or list movies and series to watch",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list"] },
          item_id: { type: "string", description: "Item ID (required for update, delete)" },
          name: { type: "string", description: "Movie or series name" },
          type: { type: "string", enum: ["movie", "series"] },
          status: { type: "string", enum: ["to-watch", "watching", "watched"] },
          description: { type: "string", description: "Description or notes" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_books_podcasts",
      description: "Create, update, delete, or list books and podcasts",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list"] },
          item_id: { type: "string", description: "Item ID (required for update, delete)" },
          name: { type: "string", description: "Book or podcast name" },
          type: { type: "string", enum: ["book", "podcast"] },
          status: { type: "string", enum: ["to-consume", "consuming", "consumed"] },
          url: { type: "string", description: "URL link" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_clients",
      description: "Create, update, delete, or list clients",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list"] },
          client_id: { type: "string", description: "Client ID (required for update, delete)" },
          name: { type: "string", description: "Client name" },
          email: { type: "string", description: "Client email" },
          phone: { type: "string", description: "Client phone" },
          company: { type: "string", description: "Company name" },
          status: { type: "string", enum: ["lead", "active", "inactive"] },
          notes: { type: "string", description: "Notes about the client" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_summary",
      description: "Get a summary of tasks, projects, habits, or transactions for today/this week/this month",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["tasks", "projects", "habits", "transactions", "all"] },
          period: { type: "string", enum: ["today", "week", "month"] },
        },
        required: ["type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_week_schedule",
      description: "Get the complete schedule for the current week or a specific week, showing tasks and their estimated times for each day",
      parameters: {
        type: "object",
        properties: {
          week_offset: { type: "number", description: "0 for current week, 1 for next week, -1 for last week (default: 0)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_course",
      description: "Search for a course by name to get its UUID. Use this before adding lessons to find the course ID.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Course name or partial name to search for" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_focus_sessions",
      description: "Start, stop, list, or get stats for focus/pomodoro sessions",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["start", "stop", "list", "stats"] },
          task_id: { type: "string", description: "Task UUID to link the focus session to" },
          session_type: { type: "string", enum: ["focus", "break"], description: "Type of session (default: focus)" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_subscriptions",
      description: "Create, update, delete, list subscriptions/agreements with clients. Used for recurring services like hosting or technical support.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list", "mark_paid"] },
          subscription_id: { type: "string", description: "Subscription ID (required for update, delete, mark_paid)" },
          client_id: { type: "string", description: "Client UUID (required for create)" },
          type: { type: "string", enum: ["hosting", "support", "other"], description: "Subscription type" },
          name: { type: "string", description: "Subscription name (e.g., 'Monthly Support Package')" },
          amount: { type: "number", description: "Amount to charge" },
          currency: { type: "string", description: "Currency code (USD, EUR, DZD)" },
          billing_cycle: { type: "string", enum: ["monthly", "yearly"], description: "How often to bill" },
          start_date: { type: "string", description: "Start date YYYY-MM-DD" },
          next_payment_date: { type: "string", description: "Next payment due date YYYY-MM-DD" },
          status: { type: "string", enum: ["active", "paused", "cancelled", "expired"] },
          notes: { type: "string", description: "Notes about the subscription" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_client",
      description: "Search for a client by name to get their UUID. Use this before creating subscriptions for a client.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Client name or partial name to search for" },
        },
        required: ["name"],
      },
    },
  },
];

// Execute tool functions
async function executeTool(
  supabase: any,
  userId: string,
  toolName: string,
  args: any
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    switch (toolName) {
      case "manage_tasks":
        return await handleTasks(supabase, userId, args);
      case "search_project":
        return await handleSearchProject(supabase, userId, args);
      case "manage_projects":
        return await handleProjects(supabase, userId, args);
      case "manage_notes":
        return await handleNotes(supabase, userId, args);
      case "manage_habits":
        return await handleHabits(supabase, userId, args);
      case "manage_transactions":
        return await handleTransactions(supabase, userId, args);
      case "manage_courses":
        return await handleCourses(supabase, userId, args);
      case "manage_lessons":
        return await handleLessons(supabase, userId, args);
      case "manage_movies_series":
        return await handleMoviesSeries(supabase, userId, args);
      case "manage_books_podcasts":
        return await handleBooksPodcasts(supabase, userId, args);
      case "manage_clients":
        return await handleClients(supabase, userId, args);
      case "get_summary":
        return await handleSummary(supabase, userId, args);
      case "get_week_schedule":
        return await handleWeekSchedule(supabase, userId, args);
      case "search_course":
        return await handleSearchCourse(supabase, userId, args);
      case "manage_focus_sessions":
        return await handleFocusSessions(supabase, userId, args);
      case "manage_subscriptions":
        return await handleSubscriptions(supabase, userId, args);
      case "search_client":
        return await handleSearchClient(supabase, userId, args);
      default:
        return { success: false, message: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: errorMessage };
  }
}

// Search project by name
async function handleSearchProject(supabase: any, userId: string, args: any) {
  const { name } = args;
  
  if (!name) {
    return { success: false, message: "Project name is required to search" };
  }
  
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title, status")
    .eq("user_id", userId)
    .ilike("title", `%${name}%`)
    .limit(5);
    
  if (error) throw error;
  
  if (!projects || projects.length === 0) {
    return { 
      success: false, 
      message: `No project found matching "${name}". Available projects can be listed with manage_projects action: list.` 
    };
  }
  
  if (projects.length === 1) {
    return { 
      success: true, 
      message: `Found project: "${projects[0].title}" with ID: ${projects[0].id}`,
      data: projects[0]
    };
  }
  
  return { 
    success: true, 
    message: `Found ${projects.length} projects matching "${name}"`,
    data: projects
  };
}

// Handler functions for each entity
async function handleTasks(supabase: any, userId: string, args: any) {
  const { action, task_id, title, description, status, priority, due_date, project_id, estimated_time } = args;

  switch (action) {
    case "create":
      if (!title) return { success: false, message: "Title is required to create a task" };
      const { data: newTask, error: createError } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title,
          description: description || "",
          status: status || "todo",
          priority: priority || "medium",
          due_date: due_date || null,
          project_id: project_id || null,
          estimated_time: estimated_time || null,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Created task: "${newTask.title}"${estimated_time ? ` (${estimated_time} min)` : ''}`, data: newTask };

    case "update":
      if (!task_id) return { success: false, message: "Task ID is required to update" };
      const updates: any = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (due_date) updates.due_date = due_date;
      if (project_id) updates.project_id = project_id;
      if (estimated_time !== undefined) updates.estimated_time = estimated_time;
      
      const { data: updatedTask, error: updateError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", task_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated task: "${updatedTask.title}"`, data: updatedTask };

    case "delete":
      if (!task_id) return { success: false, message: "Task ID is required to delete" };
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Task deleted successfully" };

    case "complete":
      if (!task_id) return { success: false, message: "Task ID is required to complete" };
      const { data: completedTask, error: completeError } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", task_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (completeError) throw completeError;
      return { success: true, message: `Completed task: "${completedTask.title}"`, data: completedTask };

    case "list":
      let query = supabase.from("tasks").select("*").eq("user_id", userId);
      if (status) query = query.eq("status", status);
      if (priority) query = query.eq("priority", priority);
      if (project_id) query = query.eq("project_id", project_id);
      const { data: tasks, error: listError } = await query.order("created_at", { ascending: false }).limit(20);
      if (listError) throw listError;
      return { success: true, message: `Found ${tasks.length} tasks`, data: tasks };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleProjects(supabase: any, userId: string, args: any) {
  const { action, project_id, title, description, status, priority, due_date, budget, category } = args;

  switch (action) {
    case "create":
      if (!title) return { success: false, message: "Title is required to create a project" };
      const { data: newProject, error: createError } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          title,
          description: description || "",
          status: status || "new",
          priority: priority || "medium",
          due_date: due_date || null,
          budget: budget || null,
          category: category || "General",
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Created project: "${newProject.title}" with ID: ${newProject.id}`, data: newProject };

    case "update":
      if (!project_id) return { success: false, message: "Project ID is required to update" };
      const updates: any = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (due_date) updates.due_date = due_date;
      if (budget !== undefined) updates.budget = budget;
      if (category) updates.category = category;
      
      const { data: updatedProject, error: updateError } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", project_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated project: "${updatedProject.title}"`, data: updatedProject };

    case "delete":
      if (!project_id) return { success: false, message: "Project ID is required to delete" };
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", project_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Project deleted successfully" };

    case "list":
      let query = supabase.from("projects").select("*").eq("user_id", userId);
      if (status) query = query.eq("status", status);
      if (priority) query = query.eq("priority", priority);
      const { data: projects, error: listError } = await query.order("created_at", { ascending: false }).limit(20);
      if (listError) throw listError;
      return { success: true, message: `Found ${projects.length} projects`, data: projects };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleNotes(supabase: any, userId: string, args: any) {
  const { action, note_id, title, content, folder, is_pinned } = args;

  switch (action) {
    case "create":
      if (!title) return { success: false, message: "Title is required to create a note" };
      const { data: newNote, error: createError } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          title,
          content: content || "",
          folder: folder || "General",
          is_pinned: is_pinned || false,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Created note: "${newNote.title}"`, data: newNote };

    case "update":
      if (!note_id) return { success: false, message: "Note ID is required to update" };
      const updates: any = {};
      if (title) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (folder) updates.folder = folder;
      if (is_pinned !== undefined) updates.is_pinned = is_pinned;
      
      const { data: updatedNote, error: updateError } = await supabase
        .from("notes")
        .update(updates)
        .eq("id", note_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated note: "${updatedNote.title}"`, data: updatedNote };

    case "delete":
      if (!note_id) return { success: false, message: "Note ID is required to delete" };
      const { error: deleteError } = await supabase
        .from("notes")
        .delete()
        .eq("id", note_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Note deleted successfully" };

    case "list":
      const { data: notes, error: listError } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (listError) throw listError;
      return { success: true, message: `Found ${notes.length} notes`, data: notes };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleHabits(supabase: any, userId: string, args: any) {
  const { action, habit_id, name, description, frequency, color, icon } = args;

  switch (action) {
    case "create":
      if (!name) return { success: false, message: "Name is required to create a habit" };
      const { data: newHabit, error: createError } = await supabase
        .from("habits")
        .insert({
          user_id: userId,
          name,
          description: description || "",
          frequency: frequency || "daily",
          color: color || "#3B82F6",
          icon: icon || "⭐",
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Created habit: "${newHabit.name}"`, data: newHabit };

    case "update":
      if (!habit_id) return { success: false, message: "Habit ID is required to update" };
      const updates: any = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (frequency) updates.frequency = frequency;
      if (color) updates.color = color;
      if (icon) updates.icon = icon;
      
      const { data: updatedHabit, error: updateError } = await supabase
        .from("habits")
        .update(updates)
        .eq("id", habit_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated habit: "${updatedHabit.name}"`, data: updatedHabit };

    case "delete":
      if (!habit_id) return { success: false, message: "Habit ID is required to delete" };
      const { error: deleteError } = await supabase
        .from("habits")
        .delete()
        .eq("id", habit_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Habit deleted successfully" };

    case "toggle_today":
      if (!habit_id) return { success: false, message: "Habit ID is required to toggle" };
      const today = new Date().toISOString().split("T")[0];
      
      // Check if already completed today
      const { data: existing } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("habit_id", habit_id)
        .eq("user_id", userId)
        .eq("completed_date", today)
        .single();
      
      if (existing) {
        // Remove completion
        await supabase
          .from("habit_completions")
          .delete()
          .eq("id", existing.id);
        return { success: true, message: "Habit unmarked for today" };
      } else {
        // Add completion
        await supabase
          .from("habit_completions")
          .insert({
            habit_id,
            user_id: userId,
            completed_date: today,
          });
        return { success: true, message: "Habit marked as complete for today! 🎉" };
      }

    case "list":
      const { data: habits, error: listError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (listError) throw listError;
      return { success: true, message: `Found ${habits.length} habits`, data: habits };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleTransactions(supabase: any, userId: string, args: any) {
  const { action, transaction_id, type, amount, category, description, date, currency } = args;

  switch (action) {
    case "create":
      if (!type || !amount || !category) {
        return { success: false, message: "Type, amount, and category are required" };
      }
      const { data: newTransaction, error: createError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type,
          amount,
          category,
          description: description || "",
          date: date || new Date().toISOString().split("T")[0],
          currency: currency || "USD",
          status: "paid",
        })
        .select()
        .single();
      if (createError) throw createError;
      return { 
        success: true, 
        message: `Added ${type}: ${amount} ${currency || "USD"} for ${category}`, 
        data: newTransaction 
      };

    case "update":
      if (!transaction_id) return { success: false, message: "Transaction ID is required to update" };
      const updates: any = {};
      if (type) updates.type = type;
      if (amount !== undefined) updates.amount = amount;
      if (category) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (date) updates.date = date;
      if (currency) updates.currency = currency;
      
      const { data: updatedTransaction, error: updateError } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", transaction_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: "Transaction updated", data: updatedTransaction };

    case "delete":
      if (!transaction_id) return { success: false, message: "Transaction ID is required to delete" };
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transaction_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Transaction deleted successfully" };

    case "list":
      let query = supabase.from("transactions").select("*").eq("user_id", userId);
      if (type) query = query.eq("type", type);
      const { data: transactions, error: listError } = await query
        .order("date", { ascending: false })
        .limit(20);
      if (listError) throw listError;
      return { success: true, message: `Found ${transactions.length} transactions`, data: transactions };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleCourses(supabase: any, userId: string, args: any) {
  const { action, course_id, title, platform, instructor, status, notes, target_date } = args;

  switch (action) {
    case "create":
      if (!title) return { success: false, message: "Title is required to create a course" };
      const { data: newCourse, error: createError } = await supabase
        .from("courses")
        .insert({
          user_id: userId,
          title,
          platform: platform || null,
          instructor: instructor || null,
          status: status || "not-started",
          notes: notes || null,
          target_date: target_date || null,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { 
        success: true, 
        message: `Created course: "${newCourse.title}" with ID: ${newCourse.id}. Use this ID to add lessons.`, 
        data: newCourse 
      };

    case "update":
      if (!course_id) return { success: false, message: "Course ID is required to update" };
      const updates: any = {};
      if (title) updates.title = title;
      if (platform !== undefined) updates.platform = platform;
      if (instructor !== undefined) updates.instructor = instructor;
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      if (target_date !== undefined) updates.target_date = target_date;
      
      const { data: updatedCourse, error: updateError } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", course_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated course: "${updatedCourse.title}"`, data: updatedCourse };

    case "delete":
      if (!course_id) return { success: false, message: "Course ID is required to delete" };
      // Delete lessons first
      await supabase.from("lessons").delete().eq("course_id", course_id);
      const { error: deleteError } = await supabase
        .from("courses")
        .delete()
        .eq("id", course_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Course and its lessons deleted successfully" };

    case "list":
      const { data: courses, error: listError } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (listError) throw listError;
      return { success: true, message: `Found ${courses.length} courses`, data: courses };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleLessons(supabase: any, userId: string, args: any) {
  const { action, lesson_id, course_id, title, description, duration_minutes, section } = args;

  switch (action) {
    case "create":
      if (!course_id) return { success: false, message: "Course ID is required to create a lesson" };
      if (!title) return { success: false, message: "Title is required to create a lesson" };
      
      // Validate course exists and belongs to user
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, title")
        .eq("id", course_id)
        .eq("user_id", userId)
        .single();
      
      if (courseError || !course) {
        return { success: false, message: `Course not found with ID: ${course_id}. Please use a valid course UUID.` };
      }
      
      // Get max sort order
      const { data: existingLessons } = await supabase
        .from("lessons")
        .select("sort_order")
        .eq("course_id", course_id)
        .order("sort_order", { ascending: false })
        .limit(1);
      
      const nextOrder = (existingLessons?.[0]?.sort_order || 0) + 1;
      
      const { data: newLesson, error: createError } = await supabase
        .from("lessons")
        .insert({
          user_id: userId,
          course_id,
          title,
          description: description || null,
          duration_minutes: duration_minutes || null,
          section: section || null,
          sort_order: nextOrder,
          is_completed: false,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { 
        success: true, 
        message: `Added lesson "${newLesson.title}" to course "${course.title}"${section ? ` in section "${section}"` : ''}`, 
        data: newLesson 
      };

    case "update":
      if (!lesson_id) return { success: false, message: "Lesson ID is required to update" };
      const updates: any = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
      if (section !== undefined) updates.section = section;
      
      const { data: updatedLesson, error: updateError } = await supabase
        .from("lessons")
        .update(updates)
        .eq("id", lesson_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated lesson: "${updatedLesson.title}"`, data: updatedLesson };

    case "delete":
      if (!lesson_id) return { success: false, message: "Lesson ID is required to delete" };
      const { error: deleteError } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lesson_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Lesson deleted successfully" };

    case "complete":
      if (!lesson_id) return { success: false, message: "Lesson ID is required to complete" };
      const { data: completedLesson, error: completeError } = await supabase
        .from("lessons")
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq("id", lesson_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (completeError) throw completeError;
      return { success: true, message: `Completed lesson: "${completedLesson.title}" 🎉`, data: completedLesson };

    case "list":
      if (!course_id) return { success: false, message: "Course ID is required to list lessons" };
      const { data: lessons, error: listError } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", course_id)
        .order("sort_order", { ascending: true });
      if (listError) throw listError;
      return { success: true, message: `Found ${lessons.length} lessons`, data: lessons };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleMoviesSeries(supabase: any, userId: string, args: any) {
  const { action, item_id, name, type, status, description } = args;

  switch (action) {
    case "create":
      if (!name) return { success: false, message: "Name is required" };
      const { data: newItem, error: createError } = await supabase
        .from("movies_series")
        .insert({
          user_id: userId,
          name,
          type: type || "movie",
          status: status || "to-watch",
          description: description || null,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Added ${type || "movie"}: "${newItem.name}"`, data: newItem };

    case "update":
      if (!item_id) return { success: false, message: "Item ID is required to update" };
      const updates: any = {};
      if (name) updates.name = name;
      if (type) updates.type = type;
      if (status) updates.status = status;
      if (description !== undefined) updates.description = description;
      
      const { data: updatedItem, error: updateError } = await supabase
        .from("movies_series")
        .update(updates)
        .eq("id", item_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated: "${updatedItem.name}"`, data: updatedItem };

    case "delete":
      if (!item_id) return { success: false, message: "Item ID is required to delete" };
      const { error: deleteError } = await supabase
        .from("movies_series")
        .delete()
        .eq("id", item_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Item deleted successfully" };

    case "list":
      let query = supabase.from("movies_series").select("*").eq("user_id", userId);
      if (type) query = query.eq("type", type);
      if (status) query = query.eq("status", status);
      const { data: items, error: listError } = await query.order("created_at", { ascending: false });
      if (listError) throw listError;
      return { success: true, message: `Found ${items.length} items`, data: items };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleBooksPodcasts(supabase: any, userId: string, args: any) {
  const { action, item_id, name, type, status, url } = args;

  switch (action) {
    case "create":
      if (!name) return { success: false, message: "Name is required" };
      const { data: newItem, error: createError } = await supabase
        .from("books_podcasts")
        .insert({
          user_id: userId,
          name,
          type: type || "book",
          status: status || "to-consume",
          url: url || null,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Added ${type || "book"}: "${newItem.name}"`, data: newItem };

    case "update":
      if (!item_id) return { success: false, message: "Item ID is required to update" };
      const updates: any = {};
      if (name) updates.name = name;
      if (type) updates.type = type;
      if (status) updates.status = status;
      if (url !== undefined) updates.url = url;
      
      const { data: updatedItem, error: updateError } = await supabase
        .from("books_podcasts")
        .update(updates)
        .eq("id", item_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated: "${updatedItem.name}"`, data: updatedItem };

    case "delete":
      if (!item_id) return { success: false, message: "Item ID is required to delete" };
      const { error: deleteError } = await supabase
        .from("books_podcasts")
        .delete()
        .eq("id", item_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Item deleted successfully" };

    case "list":
      let query = supabase.from("books_podcasts").select("*").eq("user_id", userId);
      if (type) query = query.eq("type", type);
      if (status) query = query.eq("status", status);
      const { data: items, error: listError } = await query.order("created_at", { ascending: false });
      if (listError) throw listError;
      return { success: true, message: `Found ${items.length} items`, data: items };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleClients(supabase: any, userId: string, args: any) {
  const { action, client_id, name, email, phone, company, status, notes } = args;

  switch (action) {
    case "create":
      if (!name) return { success: false, message: "Name is required to create a client" };
      const { data: newClient, error: createError } = await supabase
        .from("clients")
        .insert({
          user_id: userId,
          name,
          email: email || null,
          phone: phone || null,
          company: company || null,
          status: status || "lead",
          notes: notes || null,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Created client: "${newClient.name}"`, data: newClient };

    case "update":
      if (!client_id) return { success: false, message: "Client ID is required to update" };
      const updates: any = {};
      if (name) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (company !== undefined) updates.company = company;
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      
      const { data: updatedClient, error: updateError } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", client_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated client: "${updatedClient.name}"`, data: updatedClient };

    case "delete":
      if (!client_id) return { success: false, message: "Client ID is required to delete" };
      const { error: deleteError } = await supabase
        .from("clients")
        .delete()
        .eq("id", client_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Client deleted successfully" };

    case "list":
      const { data: clients, error: listError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (listError) throw listError;
      return { success: true, message: `Found ${clients.length} clients`, data: clients };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleSummary(supabase: any, userId: string, args: any) {
  const { type, period } = args;
  
  let startDate: string | null = null;
  const now = new Date();
  
  if (period === "today") {
    startDate = now.toISOString().split("T")[0];
  } else if (period === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate = weekAgo.toISOString().split("T")[0];
  } else if (period === "month") {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate = monthAgo.toISOString().split("T")[0];
  }

  const summary: any = {};

  if (type === "all" || type === "tasks") {
    let query = supabase.from("tasks").select("*").eq("user_id", userId);
    if (startDate) query = query.gte("created_at", startDate);
    const { data: tasks } = await query;
    summary.tasks = {
      total: tasks?.length || 0,
      completed: tasks?.filter((t: any) => t.status === "completed").length || 0,
      inProgress: tasks?.filter((t: any) => t.status === "in-progress").length || 0,
      todo: tasks?.filter((t: any) => t.status === "todo").length || 0,
    };
  }

  if (type === "all" || type === "projects") {
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId);
    summary.projects = {
      total: projects?.length || 0,
      inProgress: projects?.filter((p: any) => p.status === "in-progress").length || 0,
      completed: projects?.filter((p: any) => p.status === "completed").length || 0,
    };
  }

  if (type === "all" || type === "habits") {
    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId);
    const { data: completions } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_date", startDate);
    summary.habits = {
      total: habits?.length || 0,
      completionsInPeriod: completions?.length || 0,
    };
  }

  if (type === "all" || type === "transactions") {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate);
    const income = transactions?.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const expenses = transactions?.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    summary.transactions = {
      income,
      expenses,
      net: income - expenses,
    };
  }

  return { success: true, message: `Summary for ${period || "all time"}`, data: summary };
}

// Get week schedule
async function handleWeekSchedule(supabase: any, userId: string, args: any) {
  const { week_offset = 0 } = args;
  
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset + (week_offset * 7));
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  const startStr = weekStart.toISOString().split("T")[0];
  const endStr = weekEnd.toISOString().split("T")[0];
  
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "completed")
    .gte("due_date", startStr)
    .lte("due_date", endStr)
    .order("due_date", { ascending: true });
  
  if (error) throw error;
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayStr = today.toISOString().split("T")[0];
  
  const days: any[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    
    const dayTasks = (tasks || []).filter((t: any) => t.due_date === dateStr);
    const totalTime = dayTasks.reduce((sum: number, t: any) => sum + (t.estimated_time || 0), 0);
    
    days.push({
      date: dateStr,
      day_name: dayNames[date.getDay()],
      is_today: dateStr === todayStr,
      tasks: dayTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        estimated_time: t.estimated_time,
        status: t.status,
      })),
      total_estimated_minutes: totalTime,
    });
  }
  
  const weekTotalMinutes = days.reduce((sum, d) => sum + d.total_estimated_minutes, 0);
  
  return {
    success: true,
    message: `Week schedule: ${startStr} to ${endStr}`,
    data: {
      week: `${startStr} to ${endStr}`,
      week_offset,
      days,
      week_total_minutes: weekTotalMinutes,
    },
  };
}

// Search course by name
async function handleSearchCourse(supabase: any, userId: string, args: any) {
  const { name } = args;
  
  if (!name) {
    return { success: false, message: "Course name is required to search" };
  }
  
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, status, platform")
    .eq("user_id", userId)
    .ilike("title", `%${name}%`)
    .limit(5);
    
  if (error) throw error;
  
  if (!courses || courses.length === 0) {
    return { 
      success: false, 
      message: `No course found matching "${name}". Use manage_courses with action: list to see available courses.` 
    };
  }
  
  if (courses.length === 1) {
    return { 
      success: true, 
      message: `Found course: "${courses[0].title}" with ID: ${courses[0].id}`,
      data: courses[0]
    };
  }
  
  return { 
    success: true, 
    message: `Found ${courses.length} courses matching "${name}"`,
    data: courses
  };
}

// Manage focus sessions
async function handleFocusSessions(supabase: any, userId: string, args: any) {
  const { action, task_id, session_type = "focus" } = args;
  
  switch (action) {
    case "start":
      // Check for active session
      const { data: activeSession } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("end_time", null)
        .single();
      
      if (activeSession) {
        return { success: false, message: "You already have an active focus session. Stop it first." };
      }
      
      const { data: newSession, error: startError } = await supabase
        .from("focus_sessions")
        .insert({
          user_id: userId,
          task_id: task_id || null,
          session_type,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (startError) throw startError;
      return { 
        success: true, 
        message: `Started ${session_type} session. Focus time! 🎯`,
        data: newSession
      };
    
    case "stop":
      const { data: currentSession, error: findError } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("end_time", null)
        .single();
      
      if (findError || !currentSession) {
        return { success: false, message: "No active focus session to stop." };
      }
      
      const endTime = new Date();
      const startTime = new Date(currentSession.start_time);
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      const { data: stoppedSession, error: stopError } = await supabase
        .from("focus_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration: durationSeconds,
          completed: true,
        })
        .eq("id", currentSession.id)
        .select()
        .single();
      
      if (stopError) throw stopError;
      
      const minutes = Math.floor(durationSeconds / 60);
      return { 
        success: true, 
        message: `Stopped focus session. Duration: ${minutes} minutes. Great work! 🎉`,
        data: stoppedSession
      };
    
    case "list":
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: sessions, error: listError } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", todayStart.toISOString())
        .order("start_time", { ascending: false });
      
      if (listError) throw listError;
      return { 
        success: true, 
        message: `Found ${sessions?.length || 0} sessions today`,
        data: sessions
      };
    
    case "stats":
      const statsStart = new Date();
      statsStart.setHours(0, 0, 0, 0);
      
      const { data: todaySessions } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", statsStart.toISOString())
        .eq("completed", true);
      
      const totalSessions = todaySessions?.length || 0;
      const totalMinutes = (todaySessions || []).reduce((sum: number, s: any) => sum + Math.floor((s.duration || 0) / 60), 0);
      
      return {
        success: true,
        message: `Today: ${totalSessions} sessions, ${totalMinutes} minutes of focus time`,
        data: {
          sessions_count: totalSessions,
          total_minutes: totalMinutes,
          total_hours: Math.round(totalMinutes / 60 * 10) / 10,
        },
      };
    
    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

// Handle subscriptions
async function handleSubscriptions(supabase: any, userId: string, args: any) {
  const { action, subscription_id, client_id, type, name, amount, currency, billing_cycle, start_date, next_payment_date, status, notes } = args;

  switch (action) {
    case "create":
      if (!client_id) return { success: false, message: "Client ID is required. Use search_client first to find the client." };
      if (!name) return { success: false, message: "Subscription name is required" };
      
      const today = new Date().toISOString().split('T')[0];
      const { data: newSub, error: createError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          client_id,
          type: type || "support",
          name,
          amount: amount || 0,
          currency: currency || "USD",
          billing_cycle: billing_cycle || "monthly",
          start_date: start_date || today,
          next_payment_date: next_payment_date || today,
          status: status || "active",
          notes: notes || "",
        })
        .select(`*, client:clients(name, company)`)
        .single();
      if (createError) throw createError;
      return { 
        success: true, 
        message: `Created subscription "${newSub.name}" for ${newSub.client?.name}`, 
        data: newSub 
      };

    case "update":
      if (!subscription_id) return { success: false, message: "Subscription ID is required" };
      const updates: any = {};
      if (client_id) updates.client_id = client_id;
      if (type) updates.type = type;
      if (name) updates.name = name;
      if (amount !== undefined) updates.amount = amount;
      if (currency) updates.currency = currency;
      if (billing_cycle) updates.billing_cycle = billing_cycle;
      if (start_date) updates.start_date = start_date;
      if (next_payment_date) updates.next_payment_date = next_payment_date;
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      
      const { data: updatedSub, error: updateError } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", subscription_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: `Updated subscription "${updatedSub.name}"`, data: updatedSub };

    case "delete":
      if (!subscription_id) return { success: false, message: "Subscription ID is required" };
      const { error: deleteError } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", subscription_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Subscription deleted successfully" };

    case "mark_paid":
      if (!subscription_id) return { success: false, message: "Subscription ID is required" };
      
      // Get current subscription
      const { data: currentSub, error: getError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscription_id)
        .eq("user_id", userId)
        .single();
      if (getError) throw getError;
      
      // Calculate next payment date
      const currentNext = new Date(currentSub.next_payment_date);
      const nextDate = currentSub.billing_cycle === "monthly"
        ? new Date(currentNext.setMonth(currentNext.getMonth() + 1))
        : new Date(currentNext.setFullYear(currentNext.getFullYear() + 1));
      
      const { data: paidSub, error: paidError } = await supabase
        .from("subscriptions")
        .update({ next_payment_date: nextDate.toISOString().split('T')[0] })
        .eq("id", subscription_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (paidError) throw paidError;
      return { 
        success: true, 
        message: `Payment recorded. Next payment due: ${paidSub.next_payment_date}`, 
        data: paidSub 
      };

    case "list":
      let query = supabase
        .from("subscriptions")
        .select(`*, client:clients(name, company)`)
        .eq("user_id", userId)
        .order("next_payment_date", { ascending: true });
      
      if (status) query = query.eq("status", status);
      if (type) query = query.eq("type", type);
      if (client_id) query = query.eq("client_id", client_id);
      
      const { data: subs, error: listError } = await query;
      if (listError) throw listError;
      
      if (!subs || subs.length === 0) {
        return { success: true, message: "No subscriptions found", data: [] };
      }
      
      // Check for overdue
      const today2 = new Date();
      today2.setHours(0, 0, 0, 0);
      const overdue = subs.filter((s: any) => s.status === "active" && new Date(s.next_payment_date) < today2);
      
      const summary = subs.map((s: any) => 
        `• ${s.name} (${s.client?.name}) - ${s.amount} ${s.currency}/${s.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'} - Next: ${s.next_payment_date}`
      ).join('\n');
      
      return { 
        success: true, 
        message: `Found ${subs.length} subscriptions${overdue.length > 0 ? ` (${overdue.length} overdue!)` : ''}:\n${summary}`,
        data: subs 
      };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

// Search client by name
async function handleSearchClient(supabase: any, userId: string, args: any) {
  const { name } = args;
  
  if (!name) {
    return { success: false, message: "Client name is required to search" };
  }
  
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, name, company, status")
    .eq("user_id", userId)
    .ilike("name", `%${name}%`)
    .limit(5);
    
  if (error) throw error;
  
  if (!clients || clients.length === 0) {
    return { 
      success: false, 
      message: `No client found matching "${name}". Use manage_clients action:list to see all clients.` 
    };
  }
  
  if (clients.length === 1) {
    return { 
      success: true, 
      message: `Found client: "${clients[0].name}" (${clients[0].company || 'No company'}) with ID: ${clients[0].id}`,
      data: clients[0]
    };
  }
  
  return { 
    success: true, 
    message: `Found ${clients.length} clients matching "${name}"`,
    data: clients
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's OpenRouter API key from profile (stored in gemini_api_key column for backwards compatibility)
    const { data: profile } = await supabase
      .from("profiles")
      .select("gemini_api_key")
      .eq("id", user.id)
      .single();

    if (!profile?.gemini_api_key) {
      return new Response(
        JSON.stringify({ error: "Please add your OpenRouter API key in Settings → AI Integration", code: 400 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, conversationHistory } = await req.json();

    // Build system prompt with complete LifeOS knowledge
    const systemPrompt = `أنت مساعد ذكي لتطبيق LifeOS - نظام إدارة الحياة الشخصية والعمل. تساعد المستخدم في إدارة كل جوانب حياته.

═══════════════════════════════════════════════════════════════
                        نظرة عامة على LifeOS
═══════════════════════════════════════════════════════════════

LifeOS هو تطبيق شامل لإدارة:
• المهام والمشاريع (Tasks & Projects)
• العملاء والاشتراكات (Clients & Subscriptions)
• الكورسات والتعلم (Learning & Courses)
• العادات اليومية (Habits)
• المالية (Finance)
• الملاحظات (Notes)
• الأفلام والكتب (Movies, Books, Podcasts)
• جلسات التركيز (Focus Sessions)

═══════════════════════════════════════════════════════════════
                        القواعد الحرجة
═══════════════════════════════════════════════════════════════

1. الكورسات ≠ المشاريع:
   • كورس = للتعلم فقط → manage_courses
   • مشروع = للعمل أو المشاريع الشخصية → manage_projects
   • "أضف كورس تعلم الألمانية" → manage_courses
   • "أضف مشروع موقع للعميل" → manage_projects

2. العمليات المتعددة - نفذ فوراً:
   • عند إنشاء كورس مع دروس:
     - أولاً: manage_courses لإنشاء الكورس
     - انتظر الـ UUID الحقيقي من الاستجابة
     - ثم: manage_lessons لكل درس باستخدام الـ UUID الحقيقي
   • عند إضافة اشتراك لعميل:
     - أولاً: search_client للبحث عن العميل
     - ثم: manage_subscriptions باستخدام client_id الحقيقي
   • لا تقل "انتظر" - نفذ كل شيء فوراً!

3. المهام على المشاريع:
   • search_project أولاً → ثم manage_tasks مع project_id

4. الاشتراكات:
   • hosting = استضافة (سنوي عادة)
   • support = دعم فني (شهري عادة)
   • mark_paid = تسجيل دفعة وتحديث تاريخ الدفع القادم

5. أجب بنفس لغة المستخدم (عربي/إنجليزي)

═══════════════════════════════════════════════════════════════
                        الأدوات المتاحة
═══════════════════════════════════════════════════════════════

📋 إدارة المهام:
• manage_tasks: إنشاء/تحديث/حذف/عرض/إكمال المهام
  - يدعم: title, description, status, priority, due_date, project_id, estimated_time (بالدقائق)
• search_project: البحث عن مشروع بالاسم للحصول على UUID

📁 إدارة المشاريع:
• manage_projects: إنشاء/تحديث/حذف/عرض مشاريع العمل
  - يدعم: title, description, status, priority, due_date, budget, category

👥 إدارة العملاء والاشتراكات:
• manage_clients: إنشاء/تحديث/حذف/عرض العملاء
  - يدعم: name, email, phone, company, status (lead/active/inactive), notes
• search_client: البحث عن عميل بالاسم للحصول على UUID
• manage_subscriptions: إنشاء/تحديث/حذف/عرض/تسجيل دفع الاشتراكات
  - الأنواع: hosting (استضافة), support (دعم فني), other (أخرى)
  - الدورة: monthly (شهري), yearly (سنوي)
  - الحالة: active, paused, cancelled, expired
  - mark_paid: يسجل الدفع ويحدث next_payment_date تلقائياً

📚 إدارة التعلم:
• manage_courses: إنشاء/تحديث/حذف/عرض الكورسات
  - يدعم: title, platform, instructor, status, notes, target_date
• search_course: البحث عن كورس بالاسم للحصول على UUID
• manage_lessons: إنشاء/تحديث/حذف/عرض/إكمال الدروس
  - يدعم: course_id (مطلوب), title, description, duration_minutes, section

✅ إدارة العادات:
• manage_habits: إنشاء/تحديث/حذف/عرض/toggle العادات
  - toggle_today: لتسجيل إكمال العادة اليوم

💰 إدارة المالية:
• manage_transactions: إنشاء/تحديث/حذف/عرض المعاملات
  - النوع: income (دخل) / expense (مصروف)
  - يدعم: amount, category, description, date, currency

📝 إدارة الملاحظات:
• manage_notes: إنشاء/تحديث/حذف/عرض الملاحظات
  - يدعم: title, content, folder, is_pinned

🎬 الترفيه:
• manage_movies_series: إدارة قائمة المشاهدة
  - النوع: movie / series
  - الحالة: to-watch, watching, watched
• manage_books_podcasts: إدارة قائمة القراءة/الاستماع
  - النوع: book / podcast
  - الحالة: to-consume, consuming, consumed

⏱️ التركيز والإنتاجية:
• manage_focus_sessions: بدء/إيقاف/عرض/إحصائيات جلسات التركيز
  - start: بدء جلسة جديدة (يمكن ربطها بـ task_id)
  - stop: إيقاف الجلسة الحالية
  - stats: إحصائيات اليوم

📊 التقارير والملخصات:
• get_summary: ملخص المهام/المشاريع/العادات/المعاملات
  - الفترة: today, week, month
• get_week_schedule: جدول الأسبوع الكامل مع المهام لكل يوم
  - week_offset: 0 للأسبوع الحالي، 1 للقادم، -1 للسابق

═══════════════════════════════════════════════════════════════

تاريخ اليوم: ${new Date().toISOString().split("T")[0]}

تذكر: نفذ كل العمليات المطلوبة فوراً في نفس الرد، لا تطلب من المستخدم الانتظار!`;

    // Build messages array for OpenAI-compatible format
    const messages: Array<any> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    const apiKey = profile.gemini_api_key;
    const model = "deepseek/deepseek-chat";
    
    // Multi-turn tool calling loop
    let maxIterations = 10; // Prevent infinite loops
    let iteration = 0;
    let allExecutedActions: any[] = [];
    let finalResponse = "";

    while (iteration < maxIterations) {
      iteration++;
      console.log(`Tool calling iteration ${iteration}...`);
      
      const openrouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lifeos.app",
            "X-Title": "LifeOS",
          },
          body: JSON.stringify({
            model,
            messages,
            tools,
            tool_choice: "auto",
          }),
        }
      );

      if (!openrouterResponse.ok) {
        const errorText = await openrouterResponse.text();
        console.error("OpenRouter API error:", openrouterResponse.status, errorText);

        let parsed: any = null;
        try {
          parsed = JSON.parse(errorText);
        } catch {
          // ignore
        }

        const apiCode = parsed?.error?.code ?? openrouterResponse.status;
        const apiMessage = parsed?.error?.message ?? errorText;

        if (openrouterResponse.status === 429) {
          return new Response(
            JSON.stringify({
              error: "Rate limit exceeded. Please try again in a moment.",
              code: 429,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (openrouterResponse.status === 401 || openrouterResponse.status === 403) {
          return new Response(
            JSON.stringify({ 
              error: "Invalid OpenRouter API key. Please check your key in Settings.", 
              code: openrouterResponse.status 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: `OpenRouter API error: ${apiCode} - ${apiMessage}`, code: apiCode }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const openrouterData = await openrouterResponse.json();
      console.log(`Iteration ${iteration} response:`, JSON.stringify(openrouterData, null, 2));

      const choice = openrouterData.choices?.[0];
      if (!choice) {
        throw new Error("No response from OpenRouter");
      }

      const assistantMessage = choice.message;
      const toolCalls = assistantMessage?.tool_calls;

      // If no tool calls, we have the final response
      if (!toolCalls || toolCalls.length === 0) {
        finalResponse = assistantMessage?.content || "";
        break;
      }

      // Add assistant message with tool calls to history
      messages.push({
        role: "assistant",
        content: assistantMessage.content || null,
        tool_calls: toolCalls,
      });

      // Execute each tool call and add results
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function?.name;
        let functionArgs = {};
        
        try {
          functionArgs = JSON.parse(toolCall.function?.arguments || "{}");
        } catch (e) {
          console.error("Failed to parse function arguments:", e);
        }

        console.log(`Executing function: ${functionName} with args:`, functionArgs);
        
        const result = await executeTool(supabase, user.id, functionName, functionArgs);
        allExecutedActions.push({ function: functionName, args: functionArgs, result });

        // Add tool result to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    // If no text response, create one from actions
    if (!finalResponse && allExecutedActions.length > 0) {
      finalResponse = allExecutedActions
        .map(a => a.result.success ? `✓ ${a.result.message}` : `✗ ${a.result.message}`)
        .join("\n");
    }

    return new Response(
      JSON.stringify({ 
        response: finalResponse || "I couldn't process that request. Please try again.",
        actions: allExecutedActions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
