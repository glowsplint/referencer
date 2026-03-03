import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const TableIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5ZM5 5H9V9H5V5ZM5 11H9V13H5V11ZM5 15H9V19H5V15ZM11 5H19V9H11V5ZM11 11H19V13H11V11ZM11 15H19V19H11V15Z"
        fill="currentColor"
      />
    </svg>
  );
});

TableIcon.displayName = "TableIcon";
