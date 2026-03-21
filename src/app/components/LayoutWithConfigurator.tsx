import { ConfiguratorSidebar } from "@/app/components/configurator/ConfiguratorSidebar";
import { useConfigurator } from "@/app/providers/ConfiguratorProvider";

interface LayoutWithConfiguratorProps {
  children: React.ReactNode;
}

export function LayoutWithConfigurator({ children }: LayoutWithConfiguratorProps) {
  const { isConfiguratorOpen, closeConfigurator } = useConfigurator();

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Configurator Sidebar */}
      {isConfiguratorOpen && (
        <ConfiguratorSidebar isOpen={isConfiguratorOpen} onToggle={closeConfigurator}>
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">Equipment Configurator</h3>
            {/* Configurator content will be added here */}
          </div>
        </ConfiguratorSidebar>
      )}
    </div>
  );
}
