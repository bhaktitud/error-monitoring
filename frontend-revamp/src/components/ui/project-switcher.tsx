"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ProjectsAPI } from "@/lib/api"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Tipe untuk proyek
interface Project {
  id: string
  name: string
  dsn: string
  createdAt: string
}

// Komponen logo default untuk proyek
const DefaultProjectLogo: React.FC = () => (
  <div className="flex items-center justify-center w-full h-full">
    <span className="text-xs font-bold">P</span>
  </div>
)

export function ProjectSwitcher({
  currentProjectId,
}: {
  currentProjectId?: string
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [ownedProjects, setOwnedProjects] = React.useState<Project[]>([])
  const [invitedProjects, setInvitedProjects] = React.useState<Project[]>([])
  const [activeProject, setActiveProject] = React.useState<Project | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // 1. useEffect untuk memuat daftar proyek saat mount
  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true); // Mulai loading sebelum fetch
        setError(null);
        const { ownedProjects: fetchedOwned, invitedProjects: fetchedInvited } = await ProjectsAPI.getProjects();
        setOwnedProjects(fetchedOwned || []);
        setInvitedProjects(fetchedInvited || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Gagal memuat proyek. Silakan coba lagi.");
        setOwnedProjects([]); // Pastikan state direset jika error
        setInvitedProjects([]);
      } finally {
        setLoading(false); // Selesai loading setelah fetch (baik sukses maupun error)
      }
    };
    loadProjects();
  }, []); // Hanya dijalankan sekali saat mount

  // 2. useEffect untuk mengatur activeProject ketika proyek atau currentProjectId berubah
  React.useEffect(() => {
    // Jangan lakukan apa-apa jika masih loading daftar proyek awal
    if (loading && (ownedProjects.length === 0 && invitedProjects.length === 0)) {
        return;
    }

    const allProjects = [...ownedProjects, ...invitedProjects];

    if (allProjects.length === 0 && !loading) { // Jika tidak ada proyek dan tidak sedang loading
        setActiveProject(null);
        return;
    }
    
    let projectToSetActive: Project | null = null;

    if (currentProjectId) {
      projectToSetActive = allProjects.find(p => p.id === currentProjectId) || null;
    }
    
    // Jika tidak ada currentProjectId dari prop ATAU currentProjectId tidak cocok dengan proyek yang ada
    if (!projectToSetActive && allProjects.length > 0) {
      const lastStoredProjectId = localStorage.getItem('lastProjectId');
      if (lastStoredProjectId) {
        projectToSetActive = allProjects.find(p => p.id === lastStoredProjectId) || null;
      }
      // Jika masih belum ada, dan ada proyek, pilih yang pertama
      if (!projectToSetActive) {
        projectToSetActive = allProjects[0];
      }
    }
    
    setActiveProject(projectToSetActive);

  }, [currentProjectId, ownedProjects, invitedProjects, loading]);

  // Handler untuk pemilihan proyek
  const handleProjectSelect = (project: Project) => {
    setActiveProject(project)
    // Simpan projectId ke localStorage sebelum navigasi
    localStorage.setItem('lastProjectId', project.id)
    router.push(`/projects/${project.id}`)
  }

  // Handler untuk membuat proyek baru
  const handleCreateProject = () => {
    router.push("/projects/create")
  }

  // Tampilkan loading state
  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-muted text-sidebar-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Memuat...</span>
              <span className="truncate text-xs">Mengambil data proyek</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Tampilkan error state
  if (error) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="text-destructive"
            onClick={() => {
              // Reload projects
              const loadProjects = async () => {
                try {
                  setLoading(true);
                  setError(null);
                  const { ownedProjects: fetchedOwned, invitedProjects: fetchedInvited } = await ProjectsAPI.getProjects();
                  setOwnedProjects(fetchedOwned || []);
                  setInvitedProjects(fetchedInvited || []);
                } catch (err) {
                  console.error("Error fetching projects:", err);
                  setError("Gagal memuat proyek. Silakan coba lagi.");
                  setOwnedProjects([]);
                  setInvitedProjects([]);
                } finally {
                  setLoading(false);
                }
              };
              loadProjects();
            }}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Error</span>
              <span className="truncate text-xs">Klik untuk mencoba lagi</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Tampilkan empty state jika tidak ada proyek
  if ([...ownedProjects, ...invitedProjects].length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={handleCreateProject}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Buat Proyek</span>
              <span className="truncate text-xs">Belum ada proyek</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Tampilkan dropdown proyek
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeProject?.name.charAt(0) || <DefaultProjectLogo />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeProject?.name || "Pilih Proyek"}
                </span>
                <span className="truncate text-xs">
                  {activeProject ? new Date(activeProject.createdAt).toLocaleDateString('id-ID') : ""}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {ownedProjects.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Proyek Saya
                </DropdownMenuLabel>
                {ownedProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className={cn("gap-2 p-2", 
                      activeProject?.id === project.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      {project.name.charAt(0)}
                    </div>
                    <span className="truncate">{project.name}</span>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {invitedProjects.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Proyek Diundang
                </DropdownMenuLabel>
                {invitedProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className={cn("gap-2 p-2", 
                      activeProject?.id === project.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      {project.name.charAt(0)}
                    </div>
                    <span className="truncate">{project.name}</span>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 p-2"
              onClick={handleCreateProject}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Buat proyek baru</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
