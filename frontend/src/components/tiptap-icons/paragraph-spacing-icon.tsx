import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const ParagraphSpacingIcon = memo(({ className, ...props }: SvgProps) => {
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
      {/* Top horizontal line */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 5C3 4.44772 3.44772 4 4 4H20C20.5523 4 21 4.44772 21 5C21 5.55228 20.5523 6 20 6H4C3.44772 6 3 5.55228 3 5Z"
        fill="currentColor"
      />
      {/* Bottom horizontal line */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 19C3 18.4477 3.44772 18 4 18H20C20.5523 18 21 18.4477 21 19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19Z"
        fill="currentColor"
      />
      {/* Vertical double-arrow between lines */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 7.29289L14.3536 9.64645C14.5488 9.84171 14.5488 10.1583 14.3536 10.3536C14.1583 10.5488 13.8417 10.5488 13.6464 10.3536L12.5 9.20711V14.7929L13.6464 13.6464C13.8417 13.4512 14.1583 13.4512 14.3536 13.6464C14.5488 13.8417 14.5488 14.1583 14.3536 14.3536L12 16.7071L9.64645 14.3536C9.45118 14.1583 9.45118 13.8417 9.64645 13.6464C9.84171 13.4512 10.1583 13.4512 10.3536 13.6464L11.5 14.7929V9.20711L10.3536 10.3536C10.1583 10.5488 9.84171 10.5488 9.64645 10.3536C9.45118 10.1583 9.45118 9.84171 9.64645 9.64645L12 7.29289Z"
        fill="currentColor"
      />
    </svg>
  );
});

ParagraphSpacingIcon.displayName = "ParagraphSpacingIcon";
