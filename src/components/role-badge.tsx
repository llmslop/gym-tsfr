export function RoleBadge({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  const classNames = className ?? "";
  if (role.includes("admin")) {
    return <div className={"badge badge-error " + classNames}>ADMIN</div>;
  }

  return <div className={"badge badge-secondary " + classNames}>MEMBER</div>;
}
