import sdb from "./database.js";

const createSession = async (userId, title = "Nova conversa") => {
  const { data, error } = await sdb
    .from("CopilotSession")
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const getOrCreateSession = async (userId, sessionId) => {
  if (sessionId) {
    const { data, error } = await sdb
      .from("CopilotSession")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (error || !data) throw new Error("Session not found");
    return data;
  }

  return createSession(userId);
};

const listUserSessions = async (userId, limit = 20) => {
  const { data, error } = await sdb
    .from("CopilotSession")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
};

const listSessionMessages = async (sessionId, userId) => {
  const { data: session, error: sessionError } = await sdb
    .from("CopilotSession")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) throw new Error("Session not found");

  const { data, error } = await sdb
    .from("CopilotMessage")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

const appendMessage = async ({ sessionId, role, content, metadata = {} }) => {
  const { data, error } = await sdb
    .from("CopilotMessage")
    .insert({ session_id: sessionId, role, content, metadata })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await sdb
    .from("CopilotSession")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return data;
};

const updateSessionTitle = async (sessionId, title) => {
  await sdb
    .from("CopilotSession")
    .update({ title: title.slice(0, 120), updated_at: new Date().toISOString() })
    .eq("id", sessionId);
};

export {
  createSession,
  getOrCreateSession,
  listUserSessions,
  listSessionMessages,
  appendMessage,
  updateSessionTitle
};
