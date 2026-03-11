import TopNavigation from "@/components/top-navigation";
import SettingsMenu from "@/components/settings-menu";

export default function Settings() {
  return (
    <div className="flex flex-col h-screen">
      <TopNavigation />
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <SettingsMenu onClose={() => {}} />
      </div>
    </div>
  );
}
