<template>
  <q-page class="column items-center justify-center q-pa-lg">

    <div class="col-auto q-mb-sm">
      <h5 class="mainSubTitle">Welcome to</h5>
    </div>
    <div class="col-auto q-mb-xl">
      <h2 class="mainTitle">Fantasia Archive</h2>
    </div>

    <!-- Project list -->
    <div class="col-auto projectListWrapper">
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h6">Your Projects</div>
        <q-btn
          color="primary"
          icon="mdi-plus"
          label="New Project"
          :outline="isDarkMode"
          size="sm"
          @click="openNewProjectDialog"
        />
      </div>

      <q-card :dark="isDarkMode" class="projectListCard">
        <q-card-section v-if="loading" class="column items-center q-py-xl">
          <q-spinner color="primary" size="2em" />
        </q-card-section>

        <q-card-section v-else-if="projects.length === 0" class="text-center q-py-xl text-grey">
          No projects yet. Create one to get started.
        </q-card-section>

        <q-list v-else separator>
          <q-item
            v-for="project in projects"
            :key="project.id"
            clickable
            :active="project.id === selectedProjectId"
            active-class="bg-primary text-white"
            @click="selectProject(project)"
          >
            <q-item-section avatar>
              <q-icon
                :name="project.role === 'master' ? 'mdi-crown' : 'mdi-account'"
                :color="project.id === selectedProjectId ? 'white' : (project.role === 'master' ? 'amber' : 'grey')"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ project.name }}</q-item-label>
              <q-item-label caption :class="project.id === selectedProjectId ? 'text-white' : ''">
                {{ project.role === 'master' ? 'Master' : 'Player' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side v-if="project.role === 'master'">
              <q-btn
                flat
                round
                dense
                icon="mdi-delete"
                :color="project.id === selectedProjectId ? 'white' : 'negative'"
                @click.stop="confirmDelete(project)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <div class="row justify-center q-mt-lg">
        <q-btn
          color="primary"
          size="md"
          :outline="isDarkMode"
          :disable="!selectedProjectId"
          class="q-px-xl"
          @click="openSelectedProject"
        >
          Open Project
        </q-btn>
      </div>
    </div>

    <!-- New project dialog -->
    <q-dialog v-model="newProjectDialog">
      <q-card :dark="isDarkMode" style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">New Project</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="newProjectName"
            :dark="isDarkMode"
            label="Project name"
            autofocus
            @keydown.enter.prevent="createProject"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            flat
            label="Create"
            color="primary"
            :disable="!newProjectName.trim()"
            :loading="creating"
            @click="createProject"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete confirm dialog -->
    <q-dialog v-model="deleteDialog">
      <q-card :dark="isDarkMode" style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Delete Project</div>
        </q-card-section>
        <q-card-section>
          Delete <strong>{{ projectToDelete?.name }}</strong>? This cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Delete" color="negative" :loading="deleting" @click="deleteProject" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { useRouter } from "vue-router"
import { projectApi, type ProjectSummary } from "src/services/api/projectApi"
import { useAppStores } from "src/composables/useAppStores"

const router = useRouter()
const { optionsStore, projectStore } = useAppStores()

const isDarkMode = ref(false)

watch(() => optionsStore.getOptions, () => {
  isDarkMode.value = optionsStore.getOptions.darkMode
}, { immediate: true, deep: true })

const projects = ref<ProjectSummary[]>([])
const loading = ref(false)
const selectedProjectId = ref<string | null>(null)

const newProjectDialog = ref(false)
const newProjectName = ref("")
const creating = ref(false)

const deleteDialog = ref(false)
const projectToDelete = ref<ProjectSummary | null>(null)
const deleting = ref(false)

async function loadProjects () {
  loading.value = true
  try {
    projects.value = await projectApi.list()
    const saved = projectStore.currentProjectId
    if (saved && projects.value.some(p => p.id === saved)) {
      selectedProjectId.value = saved
    }
  } catch (e) {
    console.error("Failed to load projects", e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadProjects()
})

function selectProject (project: ProjectSummary) {
  selectedProjectId.value = project.id
}

function openSelectedProject () {
  const project = projects.value.find(p => p.id === selectedProjectId.value)
  if (!project) return
  projectStore.setCurrentProjectId(project.id)
  projectStore.setCurrentUserRole(project.role)
  router.push(`/project/${project.id}`)
}

function openNewProjectDialog () {
  newProjectName.value = ""
  newProjectDialog.value = true
}

async function createProject () {
  const name = newProjectName.value.trim()
  if (!name) return
  creating.value = true
  try {
    const project = await projectApi.create(name)
    projects.value.push(project)
    selectedProjectId.value = project.id
    newProjectDialog.value = false
  } catch (e) {
    console.error("Failed to create project", e)
  } finally {
    creating.value = false
  }
}

function confirmDelete (project: ProjectSummary) {
  projectToDelete.value = project
  deleteDialog.value = true
}

async function deleteProject () {
  if (!projectToDelete.value) return
  deleting.value = true
  try {
    await projectApi.delete(projectToDelete.value.id)
    projects.value = projects.value.filter(p => p.id !== projectToDelete.value!.id)
    if (selectedProjectId.value === projectToDelete.value.id) {
      selectedProjectId.value = null
      projectStore.setCurrentProjectId(null)
    }
    deleteDialog.value = false
    projectToDelete.value = null
  } catch (e) {
    console.error("Failed to delete project", e)
  } finally {
    deleting.value = false
  }
}
</script>

<style lang="scss">
.mainTitle {
  color: var(--q-color-dark);
}
body.body--dark {
  .mainTitle {
    color: var(--q-color-primary);
  }
}
</style>

<style scoped lang="scss">
.mainSubTitle {
  margin-top: 0;
  margin-bottom: 0;
  opacity: 0.8;
}

.mainTitle {
  position: relative;
  margin-top: 10px;
  font-weight: 500;

  &::after {
    content: '';
    top: -25px;
    right: -95px;
    position: absolute;
    height: 100px;
    width: 90px;
    background-image: url('../assets/appLogo.png');
    background-repeat: no-repeat;
    background-size: contain;
    transform: scaleX(-1);
    filter: drop-shadow(-1px 1px 2px var(--q-color-dark));
  }

  &::before {
    content: '';
    top: -25px;
    left: -95px;
    position: absolute;
    height: 100px;
    width: 90px;
    background-image: url('../assets/appLogo.png');
    background-repeat: no-repeat;
    background-size: contain;
    filter: drop-shadow(-1px 1px 2px var(--q-color-dark));
  }

  // Below md the decorative side logos (positioned -95px outside the title)
  // would push the page wider than the viewport. Drop them on mobile —
  // the centered title is still recognizable on its own.
  @media (max-width: 1023px) {
    &::before,
    &::after {
      content: none;
    }
  }
}

.projectListWrapper {
  width: 100%;
  max-width: 500px;
}

.projectListCard {
  min-height: 120px;
}
</style>
