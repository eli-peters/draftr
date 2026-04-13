import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendNotification(signupEmail: string) {
  if (!resend || !process.env.WAITLIST_NOTIFY_EMAIL) return;

  try {
    await resend.emails.send({
      from: 'Draftr Waitlist <waitlist@draftr.app>',
      to: process.env.WAITLIST_NOTIFY_EMAIL,
      subject: `New waitlist signup: ${signupEmail}`,
      text: `${signupEmail} just joined the Draftr waitlist.\n\nTime: ${new Date().toISOString()}`,
    });
  } catch (err) {
    console.error('Failed to send waitlist notification:', err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('waitlist').insert({ email });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already signed up' }, { status: 409 });
      }
      console.error('Waitlist insert error:', { code: error.code, message: error.message });
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
    }

    after(() => sendNotification(email));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
