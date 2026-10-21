import { CurrentAccountName, SignOutButton } from "@/features/account";
import { FirstAccessForm } from "@/features/first-access";
import { CreateProjectForm, type Project } from "@/features/project";

type FirstAccessPageProps = {
  onProjectCreated: (project: Project) => void;
};

export function FirstAccessPage({ onProjectCreated }: FirstAccessPageProps) {
  return (
    <FirstAccessForm
      projectStep={<CreateProjectForm onCreated={onProjectCreated} />}
      footer={
        <div className="flex items-center justify-between gap-2">
          <CurrentAccountName />
          <SignOutButton />
        </div>
      }
    />
  );
}
