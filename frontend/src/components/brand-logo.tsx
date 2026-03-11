import spartanLogo from "@/assets/spartan_32x32.png";

export default function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <img src={spartanLogo} alt="Spartan Write" className="h-7 w-7" />
      <span className="font-bold text-lg">Spartan Write</span>
    </div>
  );
}
