import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const TableDeleteRowIcon = memo(({ className, ...props }: SvgProps) => {
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
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V14C21 15.1046 20.1046 16 19 16H5C3.89543 16 3 15.1046 3 14V5ZM5 5H9V9H5V5ZM11 5H19V9H11V5ZM5 11H9V14H5V11ZM11 11H19V14H11V11ZM10.2929 18.2929C10.6834 17.9024 11.3166 17.9024 11.7071 18.2929L13 19.5858L14.2929 18.2929C14.6834 17.9024 15.3166 17.9024 15.7071 18.2929C16.0976 18.6834 16.0976 19.3166 15.7071 19.7071L14.4142 21L15.7071 22.2929C16.0976 22.6834 16.0976 23.3166 15.7071 23.7071C15.3166 24.0976 14.6834 24.0976 14.2929 23.7071L13 22.4142L11.7071 23.7071C11.3166 24.0976 10.6834 24.0976 10.2929 23.7071C9.90237 23.3166 9.90237 22.6834 10.2929 22.2929L11.5858 21L10.2929 19.7071C9.90237 19.3166 9.90237 18.6834 10.2929 18.2929Z"
        fill="currentColor"
      />
    </svg>
  );
});

TableDeleteRowIcon.displayName = "TableDeleteRowIcon";
