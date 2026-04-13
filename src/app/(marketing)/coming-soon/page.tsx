'use client';

import { useState, type FormEvent } from 'react';

const LOGO_SVG = `<svg viewBox="0 0 432 99" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M205.627 26.1045C216.174 26.1045 223.03 31.3778 225.667 38.6289L227.249 28.082H253.222L245.839 75.4131C244.388 84.5096 243.861 91.2334 244.388 97.0342H218.679C218.152 94.1341 218.284 89.3873 218.284 85.5645C213.406 93.8705 206.813 98.749 197.188 98.749C182.687 98.7488 172.667 88.0694 172.667 69.3477C172.667 42.0572 187.565 26.1045 205.627 26.1045ZM346.861 28.082H359.914L357.277 45.4854H344.225L340.137 70.7988C339.346 76.4674 341.456 78.3134 345.938 78.3135C347.651 78.3135 350.025 77.9179 352.267 77.127L349.234 96.5078C346.202 97.6938 341.85 98.749 336.313 98.749C319.702 98.7489 310.869 91.1015 314.033 71.7217L318.252 45.4854H310.21L312.846 28.082H320.889L323.262 13.9756H349.103L346.861 28.082ZM57.5322 0.0341797C90.9047 0.0341797 108 15.4457 108 41.499C108 78.0526 84.7517 97.5527 50.832 97.5527H8.9834L20.1533 27.0596C15.7889 25.3381 12.0771 22.1458 9.7666 17.918L3.49902 6.44043L0 0.0341797H57.5322ZM180 27.0352C178.096 34.3823 172.5 51.5006 164 51.5352C162.991 51.4791 162.051 51.4143 161.177 51.3457C147.716 50.9978 140.271 55.2652 138.378 67.5029L133.632 97.0342H107.659L114.91 51.0225C116.493 41.0026 117.152 34.4104 117.415 28.082H142.729C142.729 31.5099 142.465 38.2341 141.806 43.9033C147.08 32.3013 155.5 27 166.5 27L166.499 27.002C166.662 27.0006 166.829 26.9993 167 27L180 27.0352ZM300.12 0C306.58 1.49469e-05 309.744 0.79095 312.908 1.97754L310.271 18.9854C308.426 18.3262 306.975 17.9307 304.075 17.9307C298.933 17.9307 296.56 20.8309 295.901 24.6543L295.242 28.082H308.688L305.921 45.4854H292.473L284.299 97.0342H258.458L266.632 45.4854H258.194L260.831 28.082H269.269L269.928 23.9951C272.565 7.25132 285.09 0 300.12 0ZM432 27.0352C430.096 34.3822 424.5 51.5005 416 51.5352C415.317 51.4972 414.666 51.4539 414.045 51.4102L414.044 51.418C399.41 50.6269 391.368 54.7141 389.39 67.5029L384.644 97.0342H358.671L365.923 51.0225C367.505 41.0026 368.164 34.4104 368.428 28.082H393.741C393.741 31.5099 393.477 38.2341 392.818 43.9033C397.719 33.122 405.01 27.8053 415.327 27.2129C416.267 27.0728 417.462 26.9947 419 27.001L432 27.0352ZM212.878 45.2217C204.704 45.2217 199.299 53.7907 199.299 66.7109C199.299 74.6211 202.463 79.4999 209.055 79.5C217.097 79.5 222.766 70.0076 222.766 57.7461C222.766 49.8357 219.339 45.2217 212.878 45.2217ZM43.7197 73.958H51.1094C66.9749 73.9579 75.8633 62.9112 75.8633 42.8594C75.8632 30.3111 69.71 23.4952 56.8506 23.4951H51.791L43.7197 73.958Z" fill="currentColor"/>
</svg>`;

const landingContent = {
  tagline: 'Your club rides, finally organized.',
  sub: 'Draftr is ride coordination software built for cycling clubs. Plan routes, manage groups, fill the draft — all in one place.',
  cta: 'Get early access',
  coming: 'Coming 2026',
  emailPlaceholder: 'you@email.com',
  success: "You're on the list.",
  successSub: "We'll be in touch when Draftr is ready to roll.",
  duplicate: 'You already signed up — sit tight.',
  error: 'Something went wrong. Try again.',
  footer: {
    copyright: `© ${new Date().getFullYear()} Draftr`,
    contact: 'hello@draftr.app',
  },
};

type FormStatus = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === 'submitting') return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else if (res.status === 409) {
        setStatus('duplicate');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const showForm = status === 'idle' || status === 'error' || status === 'submitting';

  return (
    <>
      <style>{`
        :root {
          --landing-accent: #DE0387;
          --landing-accent-glow: rgba(222, 3, 135, 0.18);
          --landing-bg: #FFFFFF;
          --landing-surface: #F5F5F7;
          --landing-text: #1A1A1E;
          --landing-text-muted: #6B6B76;
          --landing-border: rgba(0, 0, 0, 0.08);
        }

        .landing-root {
          min-height: 100dvh;
          background: var(--landing-bg);
          color: var(--landing-text);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          position: relative;
          overflow: hidden;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
        }

        /* Atmospheric glow */
        .landing-root::before {
          content: '';
          position: absolute;
          top: -40%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(
            circle,
            var(--landing-accent-glow) 0%,
            rgba(222, 3, 135, 0.04) 40%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        /* Subtle grain overlay */
        .landing-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.015'/%3E%3C/svg%3E");
          background-repeat: repeat;
          pointer-events: none;
          z-index: 0;
        }

        .landing-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 640px;
          width: 100%;
          text-align: center;
          gap: 2.5rem;
        }

        /* Logo */
        .landing-logo {
          width: 180px;
          color: var(--landing-accent);
          animation: logoFadeIn 1s ease-out both;
        }

        @media (min-width: 640px) {
          .landing-logo {
            width: 240px;
          }
        }

        .landing-logo svg {
          width: 100%;
          height: auto;
        }

        /* Badge */
        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 1rem;
          border-radius: 9999px;
          background: rgba(222, 3, 135, 0.1);
          border: 1px solid rgba(222, 3, 135, 0.2);
          font-family: var(--font-outfit), system-ui, sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--landing-accent);
          animation: badgeFadeIn 1s ease-out 0.2s both;
        }

        .landing-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--landing-accent);
          animation: pulse 2s ease-in-out infinite;
        }

        /* Typography */
        .landing-tagline {
          font-family: var(--font-outfit), system-ui, sans-serif;
          font-size: clamp(2rem, 6vw, 3.5rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--landing-text);
          animation: textFadeUp 0.8s ease-out 0.3s both;
        }

        .landing-sub {
          font-size: clamp(1rem, 2.5vw, 1.1875rem);
          line-height: 1.6;
          color: var(--landing-text-muted);
          max-width: 480px;
          animation: textFadeUp 0.8s ease-out 0.45s both;
        }

        /* Form */
        .landing-form-wrap {
          width: 100%;
          max-width: 440px;
          animation: textFadeUp 0.8s ease-out 0.6s both;
        }

        .landing-form {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }

        @media (max-width: 480px) {
          .landing-form {
            flex-direction: column;
          }
        }

        .landing-input {
          flex: 1;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          background: var(--landing-surface);
          border: 1px solid var(--landing-border);
          color: var(--landing-text);
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.9375rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .landing-input::placeholder {
          color: var(--landing-text-muted);
        }

        .landing-input:focus {
          border-color: var(--landing-accent);
          box-shadow: 0 0 0 3px var(--landing-accent-glow);
        }

        .landing-button {
          padding: 0.875rem 1.75rem;
          border-radius: 12px;
          background: var(--landing-accent);
          color: white;
          font-family: var(--font-outfit), system-ui, sans-serif;
          font-size: 0.9375rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.15s, opacity 0.15s, box-shadow 0.2s;
        }

        .landing-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 24px var(--landing-accent-glow);
        }

        .landing-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .landing-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Status messages */
        .landing-status {
          padding: 1.25rem 1.5rem;
          border-radius: 12px;
          text-align: center;
        }

        .landing-status-success {
          background: rgba(222, 3, 135, 0.08);
          border: 1px solid rgba(222, 3, 135, 0.15);
        }

        .landing-status-duplicate {
          background: rgba(255, 180, 0, 0.08);
          border: 1px solid rgba(255, 180, 0, 0.15);
        }

        .landing-status-error {
          color: #D32F2F;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          padding: 0;
          background: none;
          border: none;
        }

        .landing-status-title {
          font-family: var(--font-outfit), system-ui, sans-serif;
          font-weight: 700;
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .landing-status-sub {
          color: var(--landing-text-muted);
          font-size: 0.9375rem;
        }

        /* Footer */
        .landing-footer {
          position: relative;
          z-index: 1;
          margin-top: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          color: var(--landing-text-muted);
          animation: textFadeUp 0.8s ease-out 0.75s both;
        }

        .landing-footer a {
          color: var(--landing-text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .landing-footer a:hover {
          color: var(--landing-accent);
        }

        /* Animations */
        @keyframes logoFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes badgeFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes textFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div className="landing-root">
        <div className="landing-content">
          {/* Logo */}
          <div
            className="landing-logo"
            dangerouslySetInnerHTML={{ __html: LOGO_SVG }}
            aria-label="Draftr"
          />

          {/* Coming soon badge */}
          <div className="landing-badge">
            {/* <span className="landing-badge-dot" /> */}
            {landingContent.coming}
          </div>

          {/* Headline */}
          <h1 className="landing-tagline">{landingContent.tagline}</h1>

          {/* Description */}
          <p className="landing-sub">{landingContent.sub}</p>

          {/* Email capture */}
          <div className="landing-form-wrap">
            {showForm ? (
              <>
                <form className="landing-form" onSubmit={handleSubmit}>
                  <input
                    className="landing-input"
                    type="email"
                    required
                    placeholder={landingContent.emailPlaceholder}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    aria-label="Email address"
                    disabled={status === 'submitting'}
                  />
                  <button
                    className="landing-button"
                    type="submit"
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Joining...' : landingContent.cta}
                  </button>
                </form>
                {status === 'error' && (
                  <p className="landing-status landing-status-error">{landingContent.error}</p>
                )}
              </>
            ) : status === 'success' ? (
              <div className="landing-status landing-status-success">
                <p className="landing-status-title">{landingContent.success}</p>
                <p className="landing-status-sub">{landingContent.successSub}</p>
              </div>
            ) : status === 'duplicate' ? (
              <div className="landing-status landing-status-duplicate">
                <p className="landing-status-title">{landingContent.duplicate}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <footer className="landing-footer">
          <span>{landingContent.footer.copyright}</span>
          <a href={`mailto:${landingContent.footer.contact}`}>{landingContent.footer.contact}</a>
        </footer>
      </div>
    </>
  );
}
