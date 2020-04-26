<script lang="ts">
  import { onMount } from 'svelte';
  import { App } from '@/lib/js/constants';
  import { T } from '@/lib/js/locale/locale';
  import { settingsStore } from '@/store/settings';
  import { menuStore } from '@/store/menu';
  import { appStore } from '@/store/app';
  import { orgStore } from '@/store/org';
  import DropdownItem from '@/components/ui/dropdown-item';

  export let id: string;

  let modules: any[] = [];
  let selectedDep: any = undefined;

  const onNavigate = (event: Event, departmentId: any) => {
    settingsStore
      .saveUserSettings({
        menuPath: 'system',
        controlId: id,
        keys: ['lastDepartmentId'],
        values: [departmentId + ''],
      })
      .then((_: any) => {
        // get last menu path of department
        menuStore.sysGetRoledMenuListByUserIdAndDepId(departmentId, false).subscribe((res: any) => {
          if (res.data.length > 0) {
            settingsStore.saveUserSettings({
              menuPath: 'system',
              controlId: 'mainNavBarId',
              keys: ['lastMenuPath'],
              values: [res.data[0].path],
            });
            location.href = '/' + res.data[0].path.replace('/', '--');
          }
        });
      });
  };

  const isSelectedItem = (moduleId: string): boolean => {
    return appStore.org.departmentId == moduleId;
  };

  const loadData = () => {
    appStore.org$.subscribe((org: any) => {
      if (org) {
        orgStore.sysGetRoledDepartmentListByUserId().subscribe((res: any) => {
          modules = res.data;
          const filterDep = modules.filter((dep: any) => dep.departmentId == org.departmentId);
          if (filterDep.length > 0) {
            selectedDep = filterDep[0];
            appStore.org.selectedDepartment = selectedDep;
          }
        });
      }
    });
  };

  onMount(() => {
    loadData();
  });
</script>

<style lang="scss" scoped>

</style>

<div class="modules">
  <div>
    <div>
      {#if selectedDep}
        <div class="modules__name">
          <i class="dropdown-icon fa fa-angle-down">
            {@html ' ' + selectedDep.departmentName}
          </i>

          <div class="dropdown-content">
            {#each modules as module, index}
              <DropdownItem
                on:click={(e) => onNavigate(e, module.departmentId)}
                useFontIcon={module.depUseFontIcon}
                fontIcon={module.depFontIcon}
                iconData={module.depIconData}
                text={module.departmentName}
                selected={isSelectedItem(module.departmentId)} />
            {/each}
          </div>
        </div>
      {:else}
        {@html App.PROGRESS_BAR}
      {/if}
    </div>

  </div>
</div>
