import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const LineHeightIcon = memo(({ className, ...props }: SvgProps) => {
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
      {/* Three horizontal lines */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 6C11 5.44772 11.4477 5 12 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H12C11.4477 7 11 6.55228 11 6Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 12C11 11.4477 11.4477 11 12 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H12C11.4477 13 11 12.5523 11 12Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 18C11 17.4477 11.4477 17 12 17H21C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H12C11.4477 19 11 18.5523 11 18Z"
        fill="currentColor"
      />
      {/* Vertical double-arrow */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 3.29289L7.35355 5.64645C7.54882 5.84171 7.54882 6.15829 7.35355 6.35355C7.15829 6.54882 6.84171 6.54882 6.64645 6.35355L5.5 5.20711V18.7929L6.64645 17.6464C6.84171 17.4512 7.15829 17.4512 7.35355 17.6464C7.54882 17.8417 7.54882 18.1583 7.35355 18.3536L5 20.7071L2.64645 18.3536C2.45118 18.1583 2.45118 17.8417 2.64645 17.6464C2.84171 17.4512 3.15829 17.4512 3.35355 17.6464L4.5 18.7929V5.20711L3.35355 6.35355C3.15829 6.54882 2.84171 6.54882 2.64645 6.35355C2.45118 6.15829 2.45118 5.84171 2.64645 5.64645L5 3.29289Z"
        fill="currentColor"
      />
    </svg>
  );
});

LineHeightIcon.displayName = "LineHeightIcon";
