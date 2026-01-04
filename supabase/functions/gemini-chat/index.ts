import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for Gemini function calling
const tools = [
  {
    name: "manage_tasks",
    description: "Create, update, delete, list, or complete tasks",
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
        project_id: { type: "string", description: "Project ID to link task to" },
      },
      required: ["action"],
    },
  },
  {
    name: "manage_projects",
    description: "Create, update, delete, or list projects",
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
  {
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
  {
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
  {
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
  {
    name: "manage_courses",
    description: "Create, update, delete, or list learning courses",
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
  {
    name: "manage_lessons",
    description: "Create, update, delete, list, or complete lessons within a course",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["create", "update", "delete", "list", "complete"] },
        lesson_id: { type: "string", description: "Lesson ID (required for update, delete, complete)" },
        course_id: { type: "string", description: "Course ID (required for create, list)" },
        title: { type: "string", description: "Lesson title" },
        description: { type: "string", description: "Lesson description" },
        duration_minutes: { type: "number", description: "Duration in minutes" },
      },
      required: ["action"],
    },
  },
  {
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
  {
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
  {
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
  {
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
      default:
        return { success: false, message: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: errorMessage };
  }
}

// Handler functions for each entity
async function handleTasks(supabase: any, userId: string, args: any) {
  const { action, task_id, title, description, status, priority, due_date, project_id } = args;

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
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Created task: "${newTask.title}"`, data: newTask };

    case "update":
      if (!task_id) return { success: false, message: "Task ID is required to update" };
      const updates: any = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (due_date) updates.due_date = due_date;
      if (project_id) updates.project_id = project_id;
      
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
      return { success: true, message: `Created project: "${newProject.title}"`, data: newProject };

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
      let query = supabase.from("notes").select("*").eq("user_id", userId);
      if (folder) query = query.eq("folder", folder);
      const { data: notes, error: listError } = await query.order("updated_at", { ascending: false }).limit(20);
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
          color: color || "#0EA5E9",
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
      
      // Check if completion exists for today
      const { data: existing } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("habit_id", habit_id)
        .eq("user_id", userId)
        .eq("completed_date", today)
        .single();

      if (existing) {
        // Delete completion
        await supabase
          .from("habit_completions")
          .delete()
          .eq("id", existing.id);
        return { success: true, message: "Habit marked as incomplete for today" };
      } else {
        // Create completion
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
        return { success: false, message: "Type, amount, and category are required to create a transaction" };
      }
      const { data: newTx, error: createError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type,
          amount,
          category,
          description: description || "",
          date: date || new Date().toISOString().split("T")[0],
          currency: currency || "USD",
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Created ${type}: ${amount} ${currency || "USD"} for ${category}`, data: newTx };

    case "update":
      if (!transaction_id) return { success: false, message: "Transaction ID is required to update" };
      const updates: any = {};
      if (type) updates.type = type;
      if (amount !== undefined) updates.amount = amount;
      if (category) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (date) updates.date = date;
      if (currency) updates.currency = currency;
      
      const { data: updatedTx, error: updateError } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", transaction_id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { success: true, message: "Transaction updated", data: updatedTx };

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
      if (category) query = query.eq("category", category);
      const { data: transactions, error: listError } = await query.order("date", { ascending: false }).limit(20);
      if (listError) throw listError;
      
      const total = transactions.reduce((sum: number, t: any) => {
        return t.type === "income" ? sum + Number(t.amount) : sum - Number(t.amount);
      }, 0);
      return { success: true, message: `Found ${transactions.length} transactions (net: ${total})`, data: transactions };

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
          notes: notes || "",
          target_date: target_date || null,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Created course: "${newCourse.title}"`, data: newCourse };

    case "update":
      if (!course_id) return { success: false, message: "Course ID is required to update" };
      const updates: any = {};
      if (title) updates.title = title;
      if (platform !== undefined) updates.platform = platform;
      if (instructor !== undefined) updates.instructor = instructor;
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      if (target_date) updates.target_date = target_date;
      
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
      const { error: deleteError } = await supabase
        .from("courses")
        .delete()
        .eq("id", course_id)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return { success: true, message: "Course deleted successfully" };

    case "list":
      let query = supabase.from("courses").select("*").eq("user_id", userId);
      if (status) query = query.eq("status", status);
      const { data: courses, error: listError } = await query.order("created_at", { ascending: false });
      if (listError) throw listError;
      return { success: true, message: `Found ${courses.length} courses`, data: courses };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

async function handleLessons(supabase: any, userId: string, args: any) {
  const { action, lesson_id, course_id, title, description, duration_minutes } = args;

  switch (action) {
    case "create":
      if (!title || !course_id) return { success: false, message: "Title and course ID are required to create a lesson" };
      const { data: newLesson, error: createError } = await supabase
        .from("lessons")
        .insert({
          user_id: userId,
          course_id,
          title,
          description: description || null,
          duration_minutes: duration_minutes || 0,
        })
        .select()
        .single();
      if (createError) throw createError;
      return { success: true, message: `Created lesson: "${newLesson.title}"`, data: newLesson };

    case "update":
      if (!lesson_id) return { success: false, message: "Lesson ID is required to update" };
      const updates: any = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
      
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
        .update({ is_completed: true, completed_at: new Date().toISOString() })
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
        .eq("user_id", userId)
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
          description: description || "",
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
          notes: notes || "",
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
      let query = supabase.from("clients").select("*").eq("user_id", userId);
      if (status) query = query.eq("status", status);
      const { data: clients, error: listError } = await query.order("created_at", { ascending: false });
      if (listError) throw listError;
      return { success: true, message: `Found ${clients.length} clients`, data: clients };

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

  const summary: any = {};

  if (type === "all" || type === "tasks") {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate);
    summary.tasks = {
      total: tasks?.length || 0,
      completed: tasks?.filter((t: any) => t.status === "completed").length || 0,
      pending: tasks?.filter((t: any) => t.status !== "completed").length || 0,
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

    // Get user's Gemini API key from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("gemini_api_key")
      .eq("id", user.id)
      .single();

    if (!profile?.gemini_api_key) {
      return new Response(
        JSON.stringify({ error: "Please add your Gemini API key in Settings → AI Integration" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, conversationHistory } = await req.json();

    // Build system prompt
    const systemPrompt = `You are an AI assistant for LifeOS, a personal life management application. You can help users manage their:
- Tasks (create, update, delete, complete, list)
- Projects (create, update, delete, list)
- Notes (create, update, delete, list)
- Habits (create, update, delete, toggle completion)
- Financial Transactions (income/expenses)
- Learning Courses and Lessons
- Movies & Series watchlist
- Books & Podcasts
- Clients

When the user asks to perform an action, use the appropriate function. Be helpful, concise, and confirm actions after completing them.
If listing items, summarize them nicely. For dates, today is ${new Date().toISOString().split("T")[0]}.

Answer in the same language as the user's message (Arabic or English).`;

    // Build messages array
    const messages = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "I understand. I'm ready to help you manage your LifeOS data. What would you like to do?" }] },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current message
    messages.push({ role: "user", parts: [{ text: message }] });

    // Convert tools to Gemini format
    const geminiTools = [{
      functionDeclarations: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    }];

    // Call Gemini API - using gemini-2.0-flash
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${profile.gemini_api_key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages,
          tools: geminiTools,
          toolConfig: {
            functionCallingConfig: { mode: "AUTO" },
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      
      if (geminiResponse.status === 400 && errorText.includes("API_KEY_INVALID")) {
        return new Response(
          JSON.stringify({ error: "Invalid Gemini API key. Please check your key in Settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log("Gemini response:", JSON.stringify(geminiData, null, 2));

    const candidate = geminiData.candidates?.[0];
    if (!candidate) {
      throw new Error("No response from Gemini");
    }

    const parts = candidate.content?.parts || [];
    let responseText = "";
    const executedActions: any[] = [];

    // Process each part
    for (const part of parts) {
      if (part.text) {
        responseText += part.text;
      }

      if (part.functionCall) {
        const { name, args } = part.functionCall;
        console.log(`Executing function: ${name} with args:`, args);
        
        const result = await executeTool(supabase, user.id, name, args);
        executedActions.push({ function: name, result });

        // Add function result to conversation and get final response
        const followUpMessages = [
          ...messages,
          { role: "model", parts: [{ functionCall: { name, args } }] },
          { role: "function", parts: [{ functionResponse: { name, response: result } }] },
        ];

        const followUpResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${profile.gemini_api_key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: followUpMessages,
              tools: geminiTools,
            }),
          }
        );

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          const followUpText = followUpData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (followUpText) {
            responseText = followUpText;
          }
        }
      }
    }

    // If no text response, create one from actions
    if (!responseText && executedActions.length > 0) {
      responseText = executedActions.map(a => a.result.message).join("\n");
    }

    return new Response(
      JSON.stringify({ 
        response: responseText || "I couldn't process that request. Please try again.",
        actions: executedActions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Gemini chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
