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

<script lang="ts">
import { Component, Watch } from "vue-property-decorator"
import DialogBase from "src/components/dialogs/_DialogBase"
import { changeCurrentProjectSettings } from "src/scripts/projectManagement/projectManagent"
import { projectApi, type ProjectMember } from "src/services/api/projectApi"
import { blueprintApi, type BlueprintField } from "src/services/api/blueprintApi"
import { userApi, type UserSearchResult } from "src/services/api/userApi"

@Component
export default class ProjectSettingsDialog extends DialogBase {
  activeTab = "general"

  @Watch("dialogTrigger")
  openDialog (val: string | false) {
    if (val) {
      if (this.SGET_getDialogsState) return
      this.SSET_setDialogState(true)
      this.dialogModel = true
      this.reloadProjectSettings()
      if (this.SGET_currentProjectId) {
        void this.loadMembers()
        void this.loadBlueprintsForFields()
      }
    }
  }

  // ── General ───────────────────────────────────────────────────────

  projectName = ""

  reservedCharacterList = ["/", ">", "<", "|", ":", "&", "\\", "-", "[", "]", "{", "}", "*", "?", "'", "\"", "#", "%", "$", "!", "@"]

  get isInvalid () {
    if (this.projectName.length === 0) return true
    return this.reservedCharacterList.some(c => this.projectName.includes(c))
  }

  reloadProjectSettings () {
    this.projectName = this.SGET_getProjectName
  }

  async saveProjectSettings () {
    if (this.isInvalid) return
    await changeCurrentProjectSettings({ projectName: this.projectName }, this)
    this.SSET_setProjectName(this.projectName)
    this.triggerDialogClose()
  }

  // ── Master Fields ─────────────────────────────────────────────────

  blueprintOptions: { label: string; value: string }[] = []
  selectedBlueprintSlug: string | null = null
  selectedBlueprintFields: (BlueprintField & { masterOnly: boolean })[] = []
  fieldsDirty = false
  savingFields = false

  async loadBlueprintsForFields () {
    if (!this.SGET_currentProjectId) return
    try {
      const bps = await blueprintApi.list(this.SGET_currentProjectId)
      this.blueprintOptions = bps.map(b => ({ label: b.namePlural, value: b.slug }))
    } catch (e) {
      console.error("Failed to load blueprints", e)
    }
  }

  async onBlueprintSelect (slug: string) {
    if (!this.SGET_currentProjectId || !slug) return
    this.fieldsDirty = false
    try {
      const bps = await blueprintApi.list(this.SGET_currentProjectId)
      const bp = bps.find(b => b.slug === slug)
      if (!bp) return
      this.selectedBlueprintFields = bp.extraFields
        .filter(f => f.type !== "break")
        .map(f => ({ ...f, masterOnly: f.masterOnly ?? false }))
    } catch (e) {
      console.error("Failed to load blueprint fields", e)
    }
  }

  onFieldToggle () {
    this.fieldsDirty = true
  }

  async saveFieldSettings () {
    if (!this.SGET_currentProjectId || !this.selectedBlueprintSlug) return
    this.savingFields = true
    try {
      const updated = await blueprintApi.updateFields(
        this.SGET_currentProjectId,
        this.selectedBlueprintSlug,
        this.selectedBlueprintFields
      )
      const allBps = this.SGET_allBlueprints
      const idx = allBps.findIndex(b => b._id === this.selectedBlueprintSlug)
      if (idx !== -1) {
        const merged = { ...allBps[idx] }
        merged.extraFields = updated.extraFields.map(f => ({ ...f, masterOnly: f.masterOnly ?? false })) as typeof merged.extraFields
        this.SSET_blueprint(merged)
      }
      this.fieldsDirty = false
    } catch (e) {
      console.error("Failed to save field settings", e)
    } finally {
      this.savingFields = false
    }
  }

  // ── Members ───────────────────────────────────────────────────────

  members: ProjectMember[] = []
  membersLoading = false

  searchEmail = ""
  searchResults: UserSearchResult[] = []
  inviteRole: "master" | "player" = "player"

  searchTimer: ReturnType<typeof setTimeout> | null = null

  async loadMembers () {
    if (!this.SGET_currentProjectId) return
    this.membersLoading = true
    try {
      this.members = await projectApi.listMembers(this.SGET_currentProjectId)
    } catch (e) {
      console.error("Failed to load members", e)
    } finally {
      this.membersLoading = false
    }
  }

  onSearchChange () {
    if (this.searchTimer) clearTimeout(this.searchTimer)
    if (this.searchEmail.length < 3) { this.searchResults = []; return }
    this.searchTimer = setTimeout(() => void this.doSearch(), 400)
  }

  async doSearch () {
    try {
      const all = await userApi.search(this.searchEmail)
      const existing = new Set(this.members.map(m => m.userId))
      this.searchResults = all.filter(u => !existing.has(u.id))
    } catch (e) {
      console.error("User search failed", e)
    }
  }

  async addMember (user: UserSearchResult) {
    if (!this.SGET_currentProjectId) return
    try {
      await projectApi.addMember(this.SGET_currentProjectId, user.id, this.inviteRole)
      this.members.push({
        id: `${this.SGET_currentProjectId}-${user.id}`,
        userId: user.id,
        role: this.inviteRole,
        user: { id: user.id, email: user.email, displayName: user.displayName }
      })
      this.searchResults = this.searchResults.filter(u => u.id !== user.id)
      this.searchEmail = ""
    } catch (e) {
      console.error("Failed to add member", e)
    }
  }

  async changeMemberRole (member: ProjectMember) {
    if (!this.SGET_currentProjectId) return
    try {
      await projectApi.updateMember(this.SGET_currentProjectId, member.userId, member.role)
    } catch (e) {
      console.error("Failed to update member role", e)
    }
  }

  async removeMember (member: ProjectMember) {
    if (!this.SGET_currentProjectId) return
    try {
      await projectApi.removeMember(this.SGET_currentProjectId, member.userId)
      this.members = this.members.filter(m => m.userId !== member.userId)
    } catch (e) {
      console.error("Failed to remove member", e)
    }
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
