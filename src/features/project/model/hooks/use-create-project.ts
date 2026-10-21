import { useForm } from "react-hook-form";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useCreateProjectMutation } from "../../api/project.mutations";
import { projectSchema, type ProjectFormValues } from "../schemas/project.schema";
import type { Project } from "../types/project.types";

type CreateProjectOptions = {
  onCreated?: (project: Project) => void;
};

const projectResolver = zodResolver(projectSchema);

export function useCreateProject({ onCreated }: CreateProjectOptions = {}) {
  const createProject = useCreateProjectMutation();
  const form = useForm<ProjectFormValues>({
    resolver: projectResolver,
    defaultValues: { name: "", key: "" },
  });

  const onSubmit = form.handleSubmit(async values => {
    try {
      const project = await createProject.mutateAsync(values);
      onCreated?.(project);
    } catch (error) {
      applyApiErrors(form, error);
    }
  });

  return { form, onSubmit, isSaving: createProject.isPending };
}
