<script lang="ts">
  import { onMount } from 'svelte';
  import { App } from '@/lib/js/constants';
  import { T } from '@/lib/js/locale/locale';
  import { settingsStore } from '@/store/settings';
  import { menuStore } from '@/store/menu';
  import { appStore } from '@/store/app';
  import { orgStore } from '@/store/org';
  import DropdownItem from '@/components/ui/dropdown-item';
  import DepIconMark from '@/components/layout/icons/dep-mark';
  import { Dropdown } from '@/lib/js/dropdown';

  export let id: string;

  let modules: any[] = [];
  let selectedDep: any = undefined;

  const onNavigate = (event: Event, department: any) => {
    menuStore.selectedData$.next(undefined);
    settingsStore
      .saveUserSettings({
        menuPath: 'system',
        controlId: id,
        keys: ['lastDepartmentId'],
        values: [department.departmentId + ''],
      })
      .then((_: any) => {
        // get first menu path of department
        loadFirstMenu(department.departmentId);
        selectedDep = department;
        appStore.org.departmentId = department.departmentId;
      });

    Dropdown.hide('moduleDropdownId');
  };

  const loadFirstMenu = (departmentId: string) => {
    menuStore.sysGetRoledMenuListByUserIdAndDepId(departmentId, false).subscribe((res: any) => {
      if (res.data.length > 0) {
        settingsStore.saveUserSettings({
          menuPath: 'system',
          controlId: 'mainNavBarId',
          keys: ['lastMenuPath'],
          values: [res.data[0].path],
        });

        if (!selectedDep.noLoadMenu) {
          menuStore.dataList$.next(res.data);
          if (res.data.length > 0) {
            menuStore.selectedData = res.data[0];
            menuStore.selectedData$.next(res.data[0]);
            window.history.pushState('', '', '/' + res.data[0].path.replace('/', '--'));
          }
        }
      } else {
        if (!selectedDep.noLoadMenu) {
          menuStore.dataList$.next([]);
          menuStore.selectedData$.next(null);
        }
      }
    });
  };

  const findDepartmentById = (depId: string) => {
    const index = modules.findIndex((dep: any) => dep.departmentId == depId);
    if (index >= 0) {
      return modules[index];
    } else {
      return null;
    }
  };

  let firstTime = true;
  const loadData = () => {
    appStore.org$.subscribe((org: any) => {
      if (org && firstTime) {
        firstTime = false;
        orgStore.sysGetRoledDepartmentListByUserId().subscribe((res: any) => {
          modules = res.data;
          selectedDep = findDepartmentById(org.departmentId);

          console.log('xxxxxx', selectedDep, org.departmentId);

          appStore.org.selectedDepartment = selectedDep;
          if (selectedDep) {
            // loadFirstMenu(selectedDep.departmentId);
          } else {
            menuStore.dataList$.next([]);
            menuStore.selectedData$.next(null);
          }
        });
      } else if (org) {
        selectedDep = findDepartmentById(org.departmentId);
        appStore.org.selectedDepartment = selectedDep;
      }
    });
  };

  onMount(() => {
    loadData();
  });

  const onMouseover = () => {
    Dropdown.show('moduleDropdownId');
  };

  const onMouseout = () => {
    Dropdown.hide('moduleDropdownId');
  };
</script>

<style lang="scss" scoped>

</style>

<div class="modules">
  <div>
    <div>
      {#if selectedDep}
        <div class="modules__content">
          <DepIconMark on:mouseover={onMouseover} on:mouseout={onMouseout}>
            <!--          <i class="modules__content__icon dropdown-mark-icon fa fa-angle-down" style="padding-right: 6px;">-->
            <div id="moduleDropdownId" class="dropdown-content">
              {#each modules as module, index}
                <DropdownItem
                  on:click={(e) => onNavigate(e, module)}
                  useFontIcon={module.depUseFontIcon}
                  fontIcon={module.depFontIcon}
                  iconData={module.depIconData}
                  text={module.departmentName}
                  selected={module.departmentId === selectedDep.departmentId} />
              {/each}
            </div>
            <!--          </i>-->
          </DepIconMark>
          <span class="modules__content__name">
            {@html ' ' + selectedDep.departmentName}
          </span>
        </div>
      {:else if selectedDep === undefined}
        {@html App.PROGRESS_BAR}
      {:else}{T('COMMON.LABEL.NO_DEPARTMENT_AVAILABLE')}{/if}

    </div>

  </div>
</div>
