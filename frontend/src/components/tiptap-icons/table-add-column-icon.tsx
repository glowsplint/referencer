import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const TableAddColumnIcon = memo(({ className, ...props }: SvgProps) => {
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
        d="M2 5C2 3.89543 2.89543 3 4 3H14C15.1046 3 16 3.89543 16 5V19C16 20.1046 15.1046 21 14 21H4C2.89543 21 2 20.1046 2 19V5ZM4 5H8V9H4V5ZM4 11H8V13H4V11ZM4 15H8V19H4V15ZM10 5H14V9H10V5ZM10 11H14V13H10V11ZM10 15H14V19H10V15ZM19 8C19.5523 8 20 8.44772 20 9V11H22C22.5523 11 23 11.4477 23 12C23 12.5523 22.5523 13 22 13H20V15C20 15.5523 19.5523 16 19 16C18.4477 16 18 15.5523 18 15V13H16C15.4477 13 15 12.5523 15 12C15 11.4477 15.4477 11 16 11H18V9C18 8.44772 18.4477 8 19 8Z"
        fill="currentColor"
      />
    </svg>
  );
});

TableAddColumnIcon.displayName = "TableAddColumnIcon";
