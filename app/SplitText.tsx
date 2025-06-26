import React from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words";
  from?: React.CSSProperties;
  to?: React.CSSProperties;
  threshold?: number;
  rootMargin?: string;
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  splitType = "chars",
  textAlign = "left",
}) => {
  const split =
    splitType === "words" ? text.split(" ") : text.split("");

  return (
    <span className={className} style={{ display: "inline-block", textAlign }}>
      {split.map((part, i) => (
        <span key={i} style={{ display: "inline-block" }}>
          {part}
          {splitType === "words" ? " " : ""}
        </span>
      ))}
    </span>
  );
};

export default SplitText;