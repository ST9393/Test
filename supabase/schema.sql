-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free' or 'pro'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  message_count INTEGER DEFAULT 0,
  message_limit INTEGER DEFAULT 100,
  rgpd_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  greeting_message TEXT DEFAULT 'Bonjour ! Comment puis-je vous aider aujourd''hui ?',
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  logo_url TEXT,
  is_trained BOOLEAN DEFAULT false,
  training_status TEXT DEFAULT 'pending', -- 'pending', 'training', 'completed', 'failed'
  widget_enabled BOOLEAN DEFAULT false,
  remove_branding BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table (sources for training)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'pdf', 'url', 'notion', 'text'
  source_url TEXT,
  content TEXT,
  chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document embeddings (pgvector)
CREATE TABLE IF NOT EXISTS public.embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding vector(3072), -- text-embedding-3-large dimension
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  satisfaction_rating INTEGER, -- 1-5 stars
  handover_requested BOOLEAN DEFAULT false
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  confidence_score FLOAT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Actions table
CREATE TABLE IF NOT EXISTS public.ai_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- 'calendly', 'stripe', 'zapier'
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add name and description columns to ai_actions
ALTER TABLE public.ai_actions
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Analytics aggregations table
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  conversation_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  avg_confidence FLOAT,
  handover_count INTEGER DEFAULT 0,
  avg_satisfaction FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_agent_id ON public.embeddings(agent_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON public.embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON public.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON public.messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_analytics_agent_date ON public.analytics(agent_id, date);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Agents policies
CREATE POLICY "Users can view own agents" ON public.agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own agents" ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON public.agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agents" ON public.agents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view enabled agents" ON public.agents FOR SELECT USING (widget_enabled = true);

-- Documents policies
CREATE POLICY "Users can manage own agent documents" ON public.documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = documents.agent_id AND agents.user_id = auth.uid())
);

-- Embeddings policies
CREATE POLICY "Users can manage own agent embeddings" ON public.embeddings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = embeddings.agent_id AND agents.user_id = auth.uid())
);

-- Conversations policies (allow anonymous for widget)
CREATE POLICY "Anyone can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own agent conversations" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = conversations.agent_id AND agents.user_id = auth.uid())
);

-- Messages policies (allow anonymous for widget)
CREATE POLICY "Anyone can create messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own agent messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = messages.agent_id AND agents.user_id = auth.uid())
);

-- AI Actions policies
CREATE POLICY "Users can manage own agent actions" ON public.ai_actions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = ai_actions.agent_id AND agents.user_id = auth.uid())
);

-- Analytics policies
CREATE POLICY "Users can view own agent analytics" ON public.analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = analytics.agent_id AND agents.user_id = auth.uid())
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(3072),
  match_agent_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) as similarity,
    embeddings.metadata
  FROM embeddings
  WHERE embeddings.agent_id = match_agent_id
    AND 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
