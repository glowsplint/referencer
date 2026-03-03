import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const TableAddRowIcon = memo(({ className, ...props }: SvgProps) => {
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
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V14C21 15.1046 20.1046 16 19 16H5C3.89543 16 3 15.1046 3 14V5ZM5 5H9V9H5V5ZM11 5H19V9H11V5ZM5 11H9V14H5V11ZM11 11H19V14H11V11ZM12 18C12.5523 18 13 18.4477 13 19V20H14C14.5523 20 15 20.4477 15 21C15 21.5523 14.5523 22 14 22H13V23C13 23.5523 12.5523 24 12 24C11.4477 24 11 23.5523 11 23V22H10C9.44772 22 9 21.5523 9 21C9 20.4477 9.44772 20 10 20H11V19C11 18.4477 11.4477 18 12 18Z"
        fill="currentColor"
      />
    </svg>
  );
});

TableAddRowIcon.displayName = "TableAddRowIcon";
