-- Esquema de Base de Datos Base para PollySync (Ejecutar en Supabase SQL Editor)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Perfiles de usuario (Manejo de Roles)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('ADMIN', 'ENCUESTADOR', 'CLIENTE')) DEFAULT 'ENCUESTADOR',
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Partidos Políticos
CREATE TABLE public.political_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  acronym TEXT,
  logo_url TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Cargos Electorales
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  level TEXT DEFAULT 'Nacional', -- Nacional, Regional, Municipal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Candidatos
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  photo_url TEXT,
  party_id UUID REFERENCES public.political_parties(id) ON DELETE SET NULL,
  position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Banco de Preguntas
CREATE TABLE public.questions_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  type TEXT CHECK (type IN ('SINGLE', 'MULTIPLE', 'RATING', 'OPEN', 'CANDIDATE')) DEFAULT 'SINGLE',
  options JSONB, -- Opciones en formato JSON ["Opción A", "Opción B"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Encuestas Activas
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')) DEFAULT 'DRAFT',
  target_responses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Relación Encuesta-Pregunta
CREATE TABLE public.survey_questions (
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions_bank(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  PRIMARY KEY (survey_id, question_id)
);

-- 7. Respuestas a las encuestas
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions_bank(id),
  selected_candidate_id UUID REFERENCES public.candidates(id),
  answer_text TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  time_taken_seconds INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Habilitar Row Level Security (RLS) en todo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.political_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Por propósitos de MVP/demo rápido, creamos políticas abiertas.
-- IMPORTANTE: Para producción deben limitarse a auth.uid() de admins.
CREATE POLICY "Public Read/Write Everything" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Everything" ON public.political_parties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Everything" ON public.positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Everything" ON public.candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Everything" ON public.questions_bank FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Everything" ON public.surveys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Everything" ON public.survey_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Everything" ON public.survey_responses FOR ALL USING (true) WITH CHECK (true);
