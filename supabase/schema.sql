-- ============================================
-- CandidateOS Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter')),
  skills TEXT[] DEFAULT '{}',
  resume_url TEXT,
  resume_text TEXT DEFAULT '',
  profile_completeness INT DEFAULT 0,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Jobs (posted by recruiters)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo TEXT,
  location TEXT,
  salary_range TEXT,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied','screening','assessment','interview_scheduled','offer','rejected')),
  current_stage INT DEFAULT 1,
  applied_at TIMESTAMPTZ DEFAULT now(),
  ai_insight TEXT,
  next_action TEXT,
  UNIQUE(candidate_id, job_id)
);

-- Application Stages
CREATE TABLE IF NOT EXISTS application_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('completed','active','pending','rejected','skipped')),
  stage_order INT NOT NULL,
  date TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  duration INT NOT NULL,
  question_count INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  due_date TIMESTAMPTZ,
  topics TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('Easy','Medium','Hard')),
  score INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Chat History (copilot)
CREATE TABLE IF NOT EXISTS copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Recruiters can view candidate profiles for their applications" ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.candidate_id = profiles.id AND j.recruiter_id = auth.uid()
    )
  );

-- JOBS
CREATE POLICY "Anyone can view active jobs" ON jobs FOR SELECT USING (status = 'active' OR recruiter_id = auth.uid());
CREATE POLICY "Recruiters can create jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = recruiter_id);

-- APPLICATIONS
CREATE POLICY "Candidates see own applications" ON applications FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Recruiters see applications for their jobs" ON applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid()));
CREATE POLICY "Candidates can create applications" ON applications FOR INSERT WITH CHECK (auth.uid() = candidate_id);
CREATE POLICY "Recruiters can update application status" ON applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid()));

-- APPLICATION STAGES
CREATE POLICY "Candidates see own stages" ON application_stages FOR SELECT
  USING (EXISTS (SELECT 1 FROM applications WHERE applications.id = application_stages.application_id AND applications.candidate_id = auth.uid()));
CREATE POLICY "Recruiters see stages for their jobs" ON application_stages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications a JOIN jobs j ON j.id = a.job_id
    WHERE a.id = application_stages.application_id AND j.recruiter_id = auth.uid()
  ));
CREATE POLICY "Recruiters can manage stages" ON application_stages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM applications a JOIN jobs j ON j.id = a.job_id
    WHERE a.id = application_stages.application_id AND j.recruiter_id = auth.uid()
  ));

-- ASSESSMENTS
CREATE POLICY "Candidates see own assessments" ON assessments FOR SELECT
  USING (EXISTS (SELECT 1 FROM applications WHERE applications.id = assessments.application_id AND applications.candidate_id = auth.uid()));
CREATE POLICY "Recruiters see assessments for their jobs" ON assessments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications a JOIN jobs j ON j.id = a.job_id
    WHERE a.id = assessments.application_id AND j.recruiter_id = auth.uid()
  ));

-- MESSAGES
CREATE POLICY "Both parties can view messages" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      LEFT JOIN jobs j ON j.id = a.job_id
      WHERE a.id = messages.application_id
        AND (a.candidate_id = auth.uid() OR j.recruiter_id = auth.uid())
    )
  );
CREATE POLICY "Both parties can send messages" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM applications a
      LEFT JOIN jobs j ON j.id = a.job_id
      WHERE a.id = messages.application_id
        AND (a.candidate_id = auth.uid() OR j.recruiter_id = auth.uid())
    )
  );

-- COPILOT MESSAGES
CREATE POLICY "Users manage own copilot messages" ON copilot_messages FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Enable Realtime for messages table
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- Seed Data: Sample recruiter, jobs, and applications
-- (Run this AFTER creating a test recruiter account)
-- ============================================

-- NOTE: You need to manually replace the UUIDs below with your actual user IDs after signing up.
-- The seed data below is a template. See README for instructions.
