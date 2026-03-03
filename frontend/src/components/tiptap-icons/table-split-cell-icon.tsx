import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const TableSplitCellIcon = memo(({ className, ...props }: SvgProps) => {
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
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5ZM5 5H9V9H5V5ZM11 5H19V9H11V5ZM5 11H9V13H5V11ZM11 11H19V13H11V11ZM5 15H9V19H5V15ZM11 15H19V19H11V15ZM14.2929 8.29289C14.6834 7.90237 15.3166 7.90237 15.7071 8.29289L18.7071 11.2929C19.0976 11.6834 19.0976 12.3166 18.7071 12.7071L15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071C13.9024 15.3166 13.9024 14.6834 14.2929 14.2929L15.5858 13H14V11H15.5858L14.2929 9.70711C13.9024 9.31658 13.9024 8.68342 14.2929 8.29289Z"
        fill="currentColor"
      />
    </svg>
  );
});

TableSplitCellIcon.displayName = "TableSplitCellIcon";
