-- AI Actions Schema Update
-- Add this to your existing schema or run as migration

-- Update ai_actions table to store credentials securely
ALTER TABLE public.ai_actions
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create comments for clarity
COMMENT ON TABLE public.ai_actions IS 'Stores AI action configurations for agents';
COMMENT ON COLUMN public.ai_actions.action_type IS 'Type: calendly, stripe_subscription, zapier_webhook';
COMMENT ON COLUMN public.ai_actions.config IS 'Encrypted configuration (API keys, webhook URLs, etc.)';
COMMENT ON COLUMN public.ai_actions.enabled IS 'Whether this action is active';

-- Example config structures:
-- calendly: { "api_key": "xxx", "event_type_url": "https://calendly.com/username/30min" }
-- stripe_subscription: { "stripe_secret_key": "sk_xxx" } (or use main account key)
-- zapier_webhook: { "webhook_url": "https://hooks.zapier.com/hooks/catch/xxx" }
