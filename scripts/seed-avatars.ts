/**
 * One-off script: seed avatar photos for existing users.
 * Downloads cycling-themed portraits from Pexels and uploads them to the
 * Supabase avatars storage bucket via the admin (service-role) client.
 *
 * Usage: npx tsx scripts/seed-avatars.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Build a Pexels CDN URL for a given photo ID, cropped to 400×400. */
function pexelsUrl(photoId: number): string {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;
}

// Map of user IDs to Pexels photo IDs (cycling-themed portraits).
// ~70% of users get a photo — the rest keep initials-only avatars.
const avatarAssignments: Record<string, number> = {
  // Sarah Chen — woman riding road bike
  'a0000001-0000-0000-0000-000000000001': 17239253,
  // Marcus Williams — man with helmet and sunglasses on bike
  'a0000001-0000-0000-0000-000000000002': 19431254,
  // Priya Sharma — woman posing on bicycle
  'a0000001-0000-0000-0000-000000000003': 8975721,
  // David Kim — closeup of athlete on bicycle
  'a0000001-0000-0000-0000-000000000004': 20497860,
  // Emma Thompson — woman riding bicycle (race)
  'a0000001-0000-0000-0000-000000000005': 8056390,
  // Omar Hassan — man with green helmet riding bicycle
  'a0000001-0000-0000-0000-000000000006': 11049373,
  // Jake Morrison — biker with helmet on
  'a0000001-0000-0000-0000-000000000008': 5807803,
  // Aisha Patel — person riding bicycle
  'a0000001-0000-0000-0000-000000000009': 1504207,
  // Nina Rodriguez — side view of person on road bike
  'a0000001-0000-0000-0000-000000000011': 13799203,
  // Maya Johnson — cyclist with helmet posing on bike
  'a0000001-0000-0000-0000-000000000013': 15105014,
  // Ryan O'Brien — man riding red bicycle at sunset
  'a0000001-0000-0000-0000-000000000014': 7959927,
  // Ben Nguyen — man riding bicycle (sport)
  'a0000001-0000-0000-0000-000000000016': 12838,
  // Alex Turner (admin) — biker wearing helmet
  '5e00600f-7974-4051-93d9-470b6220ea30': 5836902,
  // James Chiu — man riding bike in forest
  '4b92398d-d430-4943-83de-101bcd90dec1': 12328608,
  // Leo Marchetti (ride_leader) — road cyclist in orange vest, helmet and sunglasses
  '75064912-ae78-48ac-8a20-6ca8071b2a07': 5807579,
  // Riley Bennett (rider) — person smiling while riding bike in city
  '8f8178fd-2aa4-4c09-85b3-b324d2dd1c93': 7242981,
};

// Users WITHOUT photos (keep initials):
// - Lisa Park (a0...07)
// - Tom Baker (a0...10)
// - Chris Evans (a0...12)
// - Fatima Al-Rashid (a0...15)

async function seedAvatars() {
  console.log(`Seeding avatars for ${Object.keys(avatarAssignments).length} users...\n`);

  for (const [userId, photoId] of Object.entries(avatarAssignments)) {
    const url = pexelsUrl(photoId);
    process.stdout.write(`  pexels:${photoId}... `);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`SKIP (HTTP ${response.status})`);
        continue;
      }

      const blob = await response.arrayBuffer();
      const filePath = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, Buffer.from(blob), {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        console.log(`UPLOAD ERROR: ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        console.log(`DB ERROR: ${updateError.message}`);
        continue;
      }

      console.log('OK');
    } catch (err) {
      console.log(`FETCH ERROR: ${err}`);
    }
  }

  console.log('\nDone.');
}

seedAvatars();
