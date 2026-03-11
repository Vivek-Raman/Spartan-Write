import spartanLogo from "@/assets/spartan_32x32.png";

interface BrandLogoProps {
  size?: "md" | "lg";
}

export default function BrandLogo({ size = "md" }: BrandLogoProps) {
  const isLarge = size === "lg";
  return (
    <div className={`flex items-center ${isLarge ? "gap-4" : "gap-2"}`}>
      <img
        src={spartanLogo}
        alt="Spartan Write"
        className={isLarge ? "h-16 w-16" : "h-7 w-7"}
      />
      <span
        className={`font-bold ${isLarge ? "text-4xl" : "text-lg"}`}
      >
        Spartan Write
      </span>
    </div>
  );
}
