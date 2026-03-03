import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const TableMergeCellsIcon = memo(({ className, ...props }: SvgProps) => {
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
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5ZM5 5H9V9H5V5ZM11 5H19V19H11V15H9V19H5V15H9V9H5V5ZM9 11H7.41421L8.70711 9.70711C9.09763 9.31658 9.09763 8.68342 8.70711 8.29289C8.31658 7.90237 7.68342 7.90237 7.29289 8.29289L4.29289 11.2929C3.90237 11.6834 3.90237 12.3166 4.29289 12.7071L7.29289 15.7071C7.68342 16.0976 8.31658 16.0976 8.70711 15.7071C9.09763 15.3166 9.09763 14.6834 8.70711 14.2929L7.41421 13H9V11Z"
        fill="currentColor"
      />
    </svg>
  );
});

TableMergeCellsIcon.displayName = "TableMergeCellsIcon";
