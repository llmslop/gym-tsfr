export function SignInOTPEmail({ code }: { code: string }) {
  return (
    <div>
      <p>Dear customer,</p>
      <p>
        A sign-in request was made for your account. Please use the following
        one-time password (OTP) to complete your sign-in process:
      </p>
      <h1>{code}</h1>
      <p>If you did not initiate this request, please ignore this email.</p>
    </div>
  );
}
