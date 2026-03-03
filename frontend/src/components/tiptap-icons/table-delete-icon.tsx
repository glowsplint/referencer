import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const TableDeleteIcon = memo(({ className, ...props }: SvgProps) => {
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
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5ZM5 5H9V9H5V5ZM11 5H19V9H11V5ZM5 11H9V13H5V11ZM5 15H9V19H5V15ZM9.29289 14.2929C8.90237 14.6834 8.90237 15.3166 9.29289 15.7071C9.68342 16.0976 10.3166 16.0976 10.7071 15.7071L13 13.4142L15.2929 15.7071C15.6834 16.0976 16.3166 16.0976 16.7071 15.7071C17.0976 15.3166 17.0976 14.6834 16.7071 14.2929L14.4142 12L16.7071 9.70711C17.0976 9.31658 17.0976 8.68342 16.7071 8.29289C16.3166 7.90237 15.6834 7.90237 15.2929 8.29289L13 10.5858L10.7071 8.29289C10.3166 7.90237 9.68342 7.90237 9.29289 8.29289C8.90237 8.68342 8.90237 9.31658 9.29289 9.70711L11.5858 12L9.29289 14.2929Z"
        fill="currentColor"
      />
    </svg>
  );
});

TableDeleteIcon.displayName = "TableDeleteIcon";
