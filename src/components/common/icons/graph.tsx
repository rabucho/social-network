import { useTheme } from "next-themes";
import * as React from "react";
import { SVGProps } from "react";

const GraphIcon = (props: SVGProps<SVGSVGElement>) => {
  const { resolvedTheme } = useTheme();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={20}
      height={20}
      fill={resolvedTheme === "dark" ? "white" : "black"}
      {...props}
    >
      <path d="M380.6 365.6c20.5 14.3 35.4 38.7 35.4 66.4 0 44.2-35.8 80-80 80s-80-35.8-80-80c0-8.4 1.3-16.6 3.7-24.2L114.1 280.4c-10.3 4.9-21.89 7.6-34.1 7.6-44.18 0-80-35.8-80-80s35.82-80 80-80c21.9 0 41.7 8.8 56.2 23.1L320 77.52C321.3 34.48 356.6 0 400 0c44.2 0 80 35.82 80 80 0 37.9-26.3 69.6-61.6 77.9l-37.8 207.7zM156.3 232.2l145.6 127.4c5-2.3 10.2-4.2 15.7-5.5l37.8-207.7c-4.2-2.8-8-6-11.6-9.5l-184.7 73.6c.6 7.5-.6 14.8-2.8 21.7z" />
    </svg>
  );
};

export default GraphIcon;
