import { SignInForm } from '@/components/auth/sign-in-form';
import { appContent } from '@/content/app';

const { signIn } = appContent.auth;

export default function SignInPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{signIn.heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{signIn.subheading}</p>
      </div>
      <SignInForm />
    </div>
  );
}
