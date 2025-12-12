export function EmailVerifyEmail({ url }: { url: string }) {
  return (
    <div>
      <p>Dear customer,</p>
      <p>
        Thank you for registering with us! To complete your registration, please
        click the following link to verify your email address:
      </p>
      <a href={url} target="_blank">
        {url}
      </a>
      <p>If you did not initiate this request, please ignore this email.</p>
    </div>
  );
}
