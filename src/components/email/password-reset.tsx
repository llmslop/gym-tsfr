export function PasswordResetEmail({ url }: { url: string }) {
  return (
    <div>
      <p>Dear customer,</p>
      <p>We received a request to reset your password.</p>
      <p>Please click on the following link to reset your password:</p>
      <a href={url} target="_blank">
        {url}
      </a>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
  );
}
