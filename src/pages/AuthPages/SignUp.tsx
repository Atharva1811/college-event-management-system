import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Student Registration | CEMS - College Event Management System"
        description="Register for a new student account on the CEMS platform."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
