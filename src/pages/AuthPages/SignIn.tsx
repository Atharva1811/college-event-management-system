import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | CEMS - College Event Management System"
        description="Sign in to your CEMS student or faculty account to manage events and registrations."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
