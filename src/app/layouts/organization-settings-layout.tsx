import type { ReactNode } from "react";
import { TabLink } from "@/shared/ui/tab-link";

type OrganizationSettingsLayoutProps = {
  showsInvitations: boolean;
  children: ReactNode;
};

export function OrganizationSettingsLayout({
  showsInvitations,
  children,
}: OrganizationSettingsLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">Organização</h1>
        <nav aria-label="Configurações da organização" className="flex gap-6 border-b border-line">
          <TabLink to="/organizacao/membros">Membros</TabLink>
          {showsInvitations && <TabLink to="/organizacao/convites">Convites</TabLink>}
          <TabLink to="/organizacao/projetos">Projetos</TabLink>
        </nav>
      </header>
      {children}
    </div>
  );
}
