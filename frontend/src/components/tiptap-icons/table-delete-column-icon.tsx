import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const TableDeleteColumnIcon = memo(({ className, ...props }: SvgProps) => {
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
        d="M2 5C2 3.89543 2.89543 3 4 3H14C15.1046 3 16 3.89543 16 5V19C16 20.1046 15.1046 21 14 21H4C2.89543 21 2 20.1046 2 19V5ZM4 5H8V9H4V5ZM4 11H8V13H4V11ZM4 15H8V19H4V15ZM10 5H14V9H10V5ZM10 11H14V13H10V11ZM10 15H14V19H10V15ZM17.2929 10.2929C17.6834 9.90237 18.3166 9.90237 18.7071 10.2929L20 11.5858L21.2929 10.2929C21.6834 9.90237 22.3166 9.90237 22.7071 10.2929C23.0976 10.6834 23.0976 11.3166 22.7071 11.7071L21.4142 13L22.7071 14.2929C23.0976 14.6834 23.0976 15.3166 22.7071 15.7071C22.3166 16.0976 21.6834 16.0976 21.2929 15.7071L20 14.4142L18.7071 15.7071C18.3166 16.0976 17.6834 16.0976 17.2929 15.7071C16.9024 15.3166 16.9024 14.6834 17.2929 14.2929L18.5858 13L17.2929 11.7071C16.9024 11.3166 16.9024 10.6834 17.2929 10.2929Z"
        fill="currentColor"
      />
    </svg>
  );
});

TableDeleteColumnIcon.displayName = "TableDeleteColumnIcon";
