/**
 * One-off script: seed avatar photos for existing users.
 * Downloads portraits from randomuser.me and uploads them to the Supabase
 * avatars storage bucket via the admin (service-role) client.
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

// Map of user IDs to the randomuser.me portrait path they should get.
// ~70% of users get a photo — the rest keep initials-only avatars.
// Portrait paths: men/0-99, women/0-99
const avatarAssignments: Record<string, string> = {
  // Sarah Chen
  'a0000001-0000-0000-0000-000000000001': 'women/44',
  // Marcus Williams
  'a0000001-0000-0000-0000-000000000002': 'men/32',
  // Priya Sharma
  'a0000001-0000-0000-0000-000000000003': 'women/68',
  // David Kim
  'a0000001-0000-0000-0000-000000000004': 'men/75',
  // Emma Thompson
  'a0000001-0000-0000-0000-000000000005': 'women/17',
  // Omar Hassan
  'a0000001-0000-0000-0000-000000000006': 'men/54',
  // Jake Morrison
  'a0000001-0000-0000-0000-000000000008': 'men/11',
  // Aisha Patel
  'a0000001-0000-0000-0000-000000000009': 'women/91',
  // Nina Rodriguez
  'a0000001-0000-0000-0000-000000000011': 'women/28',
  // Maya Johnson
  'a0000001-0000-0000-0000-000000000013': 'women/55',
  // Ryan O'Brien
  'a0000001-0000-0000-0000-000000000014': 'men/67',
  // Ben Nguyen
  'a0000001-0000-0000-0000-000000000016': 'men/41',
  // Alex Turner (admin)
  '5e00600f-7974-4051-93d9-470b6220ea30': 'men/22',
  // James Chiu
  '4b92398d-d430-4943-83de-101bcd90dec1': 'men/86',
};

// Users WITHOUT photos (keep initials):
// - Lisa Park (a0...07)
// - Tom Baker (a0...10)
// - Chris Evans (a0...12)
// - Fatima Al-Rashid (a0...15)
// - Leo Marchetti (leader)
// - Riley Bennett (rider)

async function seedAvatars() {
  console.log(`Seeding avatars for ${Object.keys(avatarAssignments).length} users...\n`);

  for (const [userId, portrait] of Object.entries(avatarAssignments)) {
    const url = `https://randomuser.me/api/portraits/${portrait}.jpg`;
    process.stdout.write(`  ${portrait}... `);

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
