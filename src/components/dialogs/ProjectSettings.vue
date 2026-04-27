<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      no-route-dismiss
      >
      <q-card dark class="projectSettingsDialog">
        <q-card-section class="column justify-center items-center">
          <h6 class="text-center q-my-sm">Project settings</h6>
        </q-card-section>

        <q-tabs v-model="activeTab" dense align="justify" active-color="primary" indicator-color="primary">
          <q-tab name="general" icon="mdi-cog" label="General" />
          <q-tab name="fields" icon="mdi-lock" label="Master fields" />
          <q-tab name="members" icon="mdi-account-group" label="Members" />
        </q-tabs>

        <q-separator dark />

        <q-tab-panels v-model="activeTab" animated>

          <!-- GENERAL TAB -->
          <q-tab-panel name="general">
            <div class="row justify-center q-mt-sm">
              <q-input
                filled
                dark
                style="width: 400px;"
                label="Project name"
                v-model="projectName"
                :error="isInvalid"
                :error-message="'Project name contains invalid characters or is empty'"
                @keydown.enter.prevent="saveProjectSettings"
              />
            </div>
            <div class="row justify-center q-mt-lg q-gutter-sm">
              <q-btn outline color="primary" icon="mdi-download" label="Backup project" @click="backupProject" />
              <q-btn outline color="warning" icon="mdi-backup-restore" label="Restore project" @click="restoreInput!.click()" />
              <input ref="restoreInput" type="file" accept=".zip" style="display:none" @change="onRestoreFile" />
            </div>
          </q-tab-panel>

          <!-- MASTER FIELDS TAB -->
          <q-tab-panel name="fields">
            <div style="width: 500px; min-height: 250px;">
              <div class="text-caption text-grey q-mb-md">
                Fields marked as <q-icon name="mdi-lock" size="14px" color="amber" /> Master-only are hidden from players.
              </div>

              <q-select
                v-model="selectedBlueprintSlug"
                :options="blueprintOptions"
                dark
                filled
                dense
                label="Select document type"
                emit-value
                map-options
                class="q-mb-md"
                @update:model-value="onBlueprintSelect"
              />

              <q-list separator dense v-if="selectedBlueprintFields.length > 0">
                <q-item v-for="field in selectedBlueprintFields" :key="field.id" style="min-height: 40px">
                  <q-item-section avatar>
                    <q-icon :name="field.icon || 'mdi-form-textbox'" size="18px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ field.name }}</q-item-label>
                    <q-item-label caption>{{ field.type }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-toggle
                      v-model="field.masterOnly"
                      color="amber"
                      checked-icon="mdi-lock"
                      unchecked-icon="mdi-lock-open-outline"
                      :label="field.masterOnly ? 'Master only' : 'All players'"
                      left-label
                      size="sm"
                      @update:model-value="onFieldToggle"
                    />
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-else-if="selectedBlueprintSlug" class="text-center text-grey q-py-md">
                No configurable fields.
              </div>
            </div>
          </q-tab-panel>

          <!-- MEMBERS TAB -->
          <q-tab-panel name="members">
            <div style="width: 500px; min-height: 200px;">

              <div class="text-subtitle2 q-mb-sm">Current members</div>
              <q-list separator dense class="q-mb-md">
                <q-item v-if="membersLoading">
                  <q-item-section class="items-center"><q-spinner /></q-item-section>
                </q-item>
                <q-item v-for="member in members" :key="member.userId">
                  <q-item-section avatar>
                    <q-icon
                      :name="member.role === 'master' ? 'mdi-crown' : 'mdi-account'"
                      :color="member.role === 'master' ? 'amber' : 'grey'"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ member.user.displayName || member.user.email || member.userId }}</q-item-label>
                    <q-item-label caption>{{ member.role }}</q-item-label>
                  </q-item-section>
                  <q-item-section side class="row no-wrap items-center q-gutter-xs">
                    <q-select
                      v-model="member.role"
                      :options="['master', 'player']"
                      dense
                      dark
                      borderless
                      style="min-width: 90px"
                      @update:model-value="changeMemberRole(member)"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      icon="mdi-close"
                      color="negative"
                      @click="removeMember(member)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="text-subtitle2 q-mb-sm">Add member</div>
              <div class="row q-gutter-sm items-start">
                <q-input
                  v-model="searchEmail"
                  dark
                  filled
                  dense
                  label="Search by email"
                  style="flex: 1"
                  @update:model-value="onSearchChange"
                />
                <q-select
                  v-model="inviteRole"
                  :options="['master', 'player']"
                  dark
                  filled
                  dense
                  style="min-width: 100px"
                />
              </div>
              <q-list dense separator class="q-mt-sm" v-if="searchResults.length > 0">
                <q-item v-for="u in searchResults" :key="u.id" clickable @click="addMember(u)">
                  <q-item-section avatar>
                    <q-icon name="mdi-account-plus" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ u.displayName || u.email }}</q-item-label>
                    <q-item-label caption>{{ u.email }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn flat dense round icon="mdi-plus" color="primary" />
                  </q-item-section>
                </q-item>
              </q-list>

            </div>
          </q-tab-panel>

        </q-tab-panels>

        <q-card-actions align="around" class="q-mx-xl q-mt-lg q-mb-md">
          <q-btn flat label="Cancel" color="accent" v-close-popup />
          <q-btn
            v-if="activeTab === 'general'"
            flat
            :disable="isInvalid"
            label="Save"
            color="primary"
            @click="saveProjectSettings"
          />
          <q-btn
            v-if="activeTab === 'fields' && selectedBlueprintSlug && fieldsDirty"
            flat
            label="Save field settings"
            color="primary"
            :loading="savingFields"
            @click="saveFieldSettings"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useQuasar } from "quasar"
import { useAppStores } from "src/composables/useAppStores"
import { changeCurrentProjectSettings } from "src/scripts/projectManagement/projectManagent"
import { projectApi, type ProjectMember } from "src/services/api/projectApi"
import { blueprintApi, type BlueprintField } from "src/services/api/blueprintApi"
import { userApi, type UserSearchResult } from "src/services/api/userApi"
import { exportApi } from "src/services/api/exportApi"
import { saveAs } from "file-saver"

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const q = useQuasar()
const { dialogsStore, projectStore, blueprintsStore } = useAppStores()

const restoreInput = ref<HTMLInputElement | null>(null)

const dialogModel = ref(false)
const thumbStyle = { right: "-40px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTabs = { right: "0px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTutorialTabContent = { right: "-55px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })
watch(() => props.dialogTrigger, (val) => {
  if (val) {
    openDialog(val)
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

const activeTab = ref("general")

function openDialog (val: string | false) {
  if (val) {
    if (dialogsStore.getDialogsState) return
    dialogsStore.setDialogState(true)
    dialogModel.value = true
    reloadProjectSettings()
    if (projectStore.currentProjectId) {
      void loadMembers()
      void loadBlueprintsForFields()
    }
  }
}

// ── General ───────────────────────────────────────────────────────

const projectName = ref("")

const reservedCharacterList = ["/", ">", "<", "|", ":", "&", "\\", "-", "[", "]", "{", "}", "*", "?", "'", "\"", "#", "%", "$", "!", "@"]

const isInvalid = computed(() => {
  if (projectName.value.length === 0) return true
  return reservedCharacterList.some(c => projectName.value.includes(c))
})

function reloadProjectSettings () {
  projectName.value = projectStore.getProjectName
}

async function saveProjectSettings () {
  if (isInvalid.value) return
  await changeCurrentProjectSettings({ projectName: projectName.value }, {} as any)
  projectStore.setProjectName(projectName.value)
  triggerDialogClose()
}

async function backupProject () {
  if (!projectStore.getActiveProject) return
  try {
    const blob = await exportApi.exportZip(projectStore.getActiveProject.id)
    saveAs(blob, `${projectStore.getActiveProject.name} - Backup.zip`)
  } catch (e) {
    q.notify({ type: "negative", message: "Backup failed." })
  }
}

async function onRestoreFile (e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !projectStore.getActiveProject) return
  try {
    await exportApi.importZip(projectStore.getActiveProject.id, file)
    q.notify({ type: "positive", message: "Project restored successfully" })
  } catch (err) {
    q.notify({ type: "negative", message: "Restore failed." })
  } finally {
    ;(e.target as HTMLInputElement).value = ""
  }
}

// ── Master Fields ─────────────────────────────────────────────────

const blueprintOptions = ref<{ label: string; value: string }[]>([])
const selectedBlueprintSlug = ref<string | null>(null)
const selectedBlueprintFields = ref<(BlueprintField & { masterOnly: boolean })[]>([])
const fieldsDirty = ref(false)
const savingFields = ref(false)

async function loadBlueprintsForFields () {
  if (!projectStore.currentProjectId) return
  try {
    const bps = await blueprintApi.list(projectStore.currentProjectId)
    blueprintOptions.value = bps.map(b => ({ label: b.namePlural, value: b.slug }))
  } catch (e) {
    console.error("Failed to load blueprints", e)
  }
}

async function onBlueprintSelect (slug: string) {
  if (!projectStore.currentProjectId || !slug) return
  fieldsDirty.value = false
  try {
    const bps = await blueprintApi.list(projectStore.currentProjectId)
    const bp = bps.find(b => b.slug === slug)
    if (!bp) return
    selectedBlueprintFields.value = bp.extraFields
      .filter(f => f.type !== "break")
      .map(f => ({ ...f, masterOnly: f.masterOnly ?? false }))
  } catch (e) {
    console.error("Failed to load blueprint fields", e)
  }
}

function onFieldToggle () {
  fieldsDirty.value = true
}

async function saveFieldSettings () {
  if (!projectStore.currentProjectId || !selectedBlueprintSlug.value) return
  savingFields.value = true
  try {
    const updated = await blueprintApi.updateFields(
      projectStore.currentProjectId,
      selectedBlueprintSlug.value,
      selectedBlueprintFields.value
    )
    const allBps = blueprintsStore.getAllBlueprints
    const idx = allBps.findIndex(b => b._id === selectedBlueprintSlug.value)
    if (idx !== -1) {
      const merged = { ...allBps[idx] }
      merged.extraFields = updated.extraFields.map(f => ({ ...f, masterOnly: f.masterOnly ?? false })) as typeof merged.extraFields
      blueprintsStore.setBlueprint(merged)
    }
    fieldsDirty.value = false
  } catch (e) {
    console.error("Failed to save field settings", e)
  } finally {
    savingFields.value = false
  }
}

// ── Members ───────────────────────────────────────────────────────

const members = ref<ProjectMember[]>([])
const membersLoading = ref(false)

const searchEmail = ref("")
const searchResults = ref<UserSearchResult[]>([])
const inviteRole = ref<"master" | "player">("player")

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function loadMembers () {
  if (!projectStore.currentProjectId) return
  membersLoading.value = true
  try {
    members.value = await projectApi.listMembers(projectStore.currentProjectId)
  } catch (e) {
    console.error("Failed to load members", e)
  } finally {
    membersLoading.value = false
  }
}

function onSearchChange () {
  if (searchTimer) clearTimeout(searchTimer)
  if (searchEmail.value.length < 3) { searchResults.value = []; return }
  searchTimer = setTimeout(() => void doSearch(), 400)
}

async function doSearch () {
  try {
    const all = await userApi.search(searchEmail.value)
    const existing = new Set(members.value.map(m => m.userId))
    searchResults.value = all.filter(u => !existing.has(u.id))
  } catch (e) {
    console.error("User search failed", e)
  }
}

async function addMember (user: UserSearchResult) {
  if (!projectStore.currentProjectId) return
  try {
    await projectApi.addMember(projectStore.currentProjectId, user.id, inviteRole.value)
    members.value.push({
      id: `${projectStore.currentProjectId}-${user.id}`,
      userId: user.id,
      role: inviteRole.value,
      user: { id: user.id, email: user.email, displayName: user.displayName }
    })
    searchResults.value = searchResults.value.filter(u => u.id !== user.id)
    searchEmail.value = ""
  } catch (e) {
    console.error("Failed to add member", e)
  }
}

async function changeMemberRole (member: ProjectMember) {
  if (!projectStore.currentProjectId) return
  try {
    await projectApi.updateMember(projectStore.currentProjectId, member.userId, member.role)
  } catch (e) {
    console.error("Failed to update member role", e)
  }
}

async function removeMember (member: ProjectMember) {
  if (!projectStore.currentProjectId) return
  try {
    await projectApi.removeMember(projectStore.currentProjectId, member.userId)
    members.value = members.value.filter(m => m.userId !== member.userId)
  } catch (e) {
    console.error("Failed to remove member", e)
  }
}
</script>

<style lang="scss">
.projectSettingsDialog {
  min-width: 560px;

  .q-field__messages {
    font-weight: 600;
    font-size: 14px;
  }
}
</style>
