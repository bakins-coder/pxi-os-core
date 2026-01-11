// create-workspace
// Assumptions:
// - Table public.workspaces(id uuid, owner_id uuid, name text, slug text gen, created_at timestamptz, unique(slug))
// - RLS allows owner-only read/write. Any authenticated user may insert with owner_id = auth.uid().
// - No email confirmation required; any valid JWT works.

interface CreateWorkspacePayload {
    name: string
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-store',
            ...headers,
        },
    })
}

function cors(req: Request) {
    const origin = req.headers.get('Origin') ?? '*'
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
    }
}

// Simple slugify mirror of DB logic (for helpful messages only)
function toSlug(input: string) {
    return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

Deno.serve(async (req: Request) => {
    const corsHeaders = cors(req)
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

    try {
        const auth = req.headers.get('Authorization') || req.headers.get('authorization')
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null

        if (!token) {
            return json({ error: 'missing_auth', message: 'Provide Authorization: Bearer <token>' }, 401, corsHeaders)
        }

        // Use @supabase/supabase-js with the user JWT to perform a RLS-protected insert
        const { createClient } = await import('npm:@supabase/supabase-js@2.45.4')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!

        const supabase = createClient(supabaseUrl, supabaseAnon, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return json({ error: 'invalid_token', message: 'Invalid or expired token' }, 401, corsHeaders)
        }

        const body = (await req.json().catch(() => ({}))) as Partial<CreateWorkspacePayload>
        const name = (body.name || '').trim()
        if (!name) return json({ error: 'invalid_payload', message: 'Name is required' }, 400, corsHeaders)

        // Insert using RLS; owner_id must be auth.uid() per policy
        const { data, error } = await supabase
            .from('workspaces')
            .insert({ owner_id: user.id, name })
            .select('*')
            .single()

        if (error) {
            // Handle unique slug violation and RLS errors gracefully
            const msg = error.message || ''
            if (msg.includes('duplicate key value') && msg.includes('slug')) {
                return json({ error: 'slug_exists', message: 'Workspace slug already exists', slug: toSlug(name) }, 409, corsHeaders)
            }
            if (error.code === '42501' || /RLS|policy/i.test(msg)) {
                return json({ error: 'not_allowed', message: 'You are not allowed to create a workspace' }, 403, corsHeaders)
            }
            return json({ error: 'insert_failed', message: msg }, 400, corsHeaders)
        }

        return json({ workspace: data }, 201, corsHeaders)
    } catch (e) {
        console.error(e)
        return json({ error: 'server_error', message: 'Unexpected error' }, 500, corsHeaders)
    }
})
