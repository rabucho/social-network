import { useTheme } from "next-themes";
import * as React from "react";
import { SVGProps } from "react";

const SearchIcon = (props: SVGProps<SVGSVGElement>) => {
  const { resolvedTheme } = useTheme();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={20}
      height={20}
      className="fill-primary-400 dark:bg-primary-dark-200"
      {...props}
    >
      <path d="M500.3 443.7 380.6 324c27.22-40.41 40.65-90.9 33.46-144.7C401.8 87.79 326.8 13.32 235.2 1.723 99.01-15.51-15.51 99.01 1.724 235.2c11.6 91.64 86.08 166.7 177.6 178.9 53.8 7.189 104.3-6.236 144.7-33.46l119.7 119.7c15.62 15.62 40.95 15.62 56.57 0 15.606-15.64 15.606-41.04.006-56.64zM79.1 208c0-70.58 57.42-128 128-128s128 57.42 128 128-57.42 128-128 128-128-57.4-128-128z" />
    </svg>
  );
};

export default SearchIcon;
