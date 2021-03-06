<script lang="ts">
  import './selectable_table.js';
  import { BehaviorSubject } from 'rxjs';
  import { TableColumn } from 'src/model/base';
  import { tick, createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import { settingsStore } from 'src/store/settings';
  import { T } from 'src/lib/js/locale/locale';
  import { genUUID } from 'src/lib/js/util';
  import { SObject } from '../../../lib/js/sobject';
  import { markStringSearch } from '../../../lib/js/util';
  import { StringUtil } from '../../../lib/js/string-util';

  const dispatch = createEventDispatcher();
  // import { SObject } from 'src/lib/js/sobject';
  // require('jquery-ui');
  // require('jquery-ui/ui/widgets/sortable');

  export let id: string = genUUID();
  export let showHeader = true;
  export let columns: TableColumn[];
  export let data: any[];
  export let showRowNumber = true;
  export let startRowCount = 1;
  export let menuPath: string = undefined;
  export let saveState = true;
  export let className: string = undefined;
  export let selectedId: any = undefined;

  let startRow: any = null;
  let selectedRows: number[] = [];
  let tableRef: any;
  let filteredData: any[] = data;

  onMount(() => {
    if (saveState && menuPath) {
      loadSettings();
    }
  });

  const onSelectedRow = () => {
    // @ts-ignore
    let selectedRowsData = selectedRows.map((index) => filteredData[index]);

    dispatch('selection', selectedRowsData);
  };

  const getTableId = () => {
    // const jId: any = window['$']('#' + id);
    const jId: any = window['$'](tableRef);
    return jId;
  };

  const getFirstRowEle = () => {
    return document.querySelector(`#${id} tbody tr :first-child`);
  };
  const applyTable = () => {
    // selectedRows = [];

    getTableId().SelectableTable(
      {
        sort: true,
      },
      function(obj: any) {
        selectedRows = obj.rows;
        onSelectedRow();

        // register key for navigation
        startRow = document.querySelector(`#row_${obj.rows[0]}_Id :first-child`);
        if (startRow) {
          startRow.focus();
        }
        document.onkeydown = (e) => {
          checkKey(e);
        };
      },
    );
  };

  const selectAll = () => {
    getTableId().selectAll(true, function(obj: any) {
      selectedRows = obj.rows;
      onSelectedRow();
    });
  };

  export const unSelectAll = () => {
    getTableId().selectAll(false, function(obj: any) {
      selectedRows = obj.rows;
      onSelectedRow();
    });
  };

  const toggleSelection = () => {
    getTableId().toggleSelection(function(obj: any) {
      selectedRows = obj.rows;
      onSelectedRow();
    });
  };

  const filter = (textSearch: string) => {
    if (StringUtil.isEmpty(textSearch)) {
      filteredData = data;
    } else {
      const _data = SObject.clone(data);

      filteredData = _data
        .map((it: any) => {
          for (let field in it) {
            if (field !== 'id' && typeof it[field] === 'string') {
              const marked = markStringSearch(it[field], textSearch, true);
              if (marked !== it[field]) {
                it[field] = marked;
                it.found = true;
              }
            }
          }
          return it;
        })
        .filter((it: any) => it.found);
    }

    // refresh table
    tick().then(() => {
      applyTable();
    });
  };

  const findRowById = (id: any) => {
    for (let i = 0; i < filteredData.length; i++) {
      if (id && filteredData[i].id && id.toString() === filteredData[i].id.toString()) {
        return i;
      }
    }

    return -1;
  };

  export const selectRowById = (id: any) => {
    const row = findRowById(id);
    if (row >= 0) {
      getTableId().selectRow(row, function(obj: any) {
        selectedRows = obj.rows;
        onSelectedRow();
      });
    }
  };

  export const highlightRowById = (id: any) => {
    const row = findRowById(id);
    if (row >= 0) {
      getTableId().selectRow(row, function(obj: any) {
        selectedRows = obj.rows;
      });
    }
  };

  export const getSelectedData = () => {
    const result = selectedRows.map((index) => filteredData[index]);
    return result;
  };

  export const getSelectedRowCount = () => {
    return selectedRows.length;
  };

  function dotheneedful(sibling, row) {
    if (sibling != null) {
      sibling.focus();
      // let [, row] = sibling.id.split('_');
      // row = Number(row);
      getTableId().selectRow(row, function(obj: any) {
        selectedRows = obj.rows;
        onSelectedRow();
      });
      startRow = sibling;
    }
  }

  function checkKey(e) {
    e = e || window.event;
    if (e.code == 'ArrowUp') {
      let idx = startRow.cellIndex;

      let nextrow = startRow.parentElement && startRow.parentElement.previousElementSibling;
      if (nextrow != null) {
        let sibling = nextrow.cells[idx];
        let row = Number(sibling.id.split('_')[1]);
        if (row >= 0) {
          dotheneedful(sibling, row);
          // startingY += 200;
          // window.scrollTo(0, startingY);
        }
      }
    } else if (e.code == 'ArrowDown') {
      let idx = startRow.cellIndex;
      let nextrow = startRow.parentElement && startRow.parentElement.nextElementSibling;
      if (nextrow != null) {
        let sibling = nextrow.cells[idx];
        let row = Number(sibling.id.split('_')[1]);
        if (row < filteredData.length) {
          dotheneedful(sibling, row);
          // startingY += 200;
          // window.scrollTo(0, startingY);
        }
      }
    }
    dispatch('keyup', { event: e, data: getSelectedData() });
  }

  export const focus = () => {
    // register key for navigation
    startRow = getFirstRowEle();
    startRow.focus();
    document.onkeydown = (e) => {
      checkKey(e);
    };

    getTableId().selectRow(0, function(obj: any) {
      selectedRows = obj.rows;
      onSelectedRow();
    });
  };

  const onClick = (event) => {
    dispatch('click', { event: event, data: getSelectedData() });
  };

  const selectRowByIndex = (rowIndex: number) => {
    getTableId().selectRow(rowIndex, function(obj: any) {
      selectedRows = obj.rows;
      onSelectedRow();
    });
  };

  // @ts-ignore
  $: if (data) {
    filteredData = data;
    tick().then(() => {
      applyTable();
    });
  }

  // @ts-ignore
  $: {
    if (selectedId) {
      console.log(' selected id ', selectedId);
      setTimeout(() => {
        selectRowById(selectedId);
      }, 500);
    }
  }

  const saveSettings = () => {
    const headerEle = window['$'](`#${id} thead tr th`);

    const keys = [];
    const values = [];

    headerEle &&
      headerEle.each(function(col) {
        keys.push(col);
        // @ts-ignore
        values.push(window['$'](this).width());
      });

    settingsStore.saveUserSettings({
      menuPath,
      controlId: id,
      keys,
      values,
    });
  };

  const loadSettings = () => {
    const headerEle = window['$'](`#${id} thead tr th`);

    settingsStore.getUserSettings(id, menuPath).then((res: any[]) => {
      headerEle.each(function(col) {
        if (res && res.length > 0) {
          const filter = res.filter((it) => it.key == col);
          if (filter && filter.length > 0) {
            // @ts-ignore
            window['$'](this).width(+filter[0].value);
          }
        }
      });
    });
  };

  const onMouseUpHeader = (event) => {
    if (saveState && menuPath) {
      saveSettings();
    }
  };
</script>

<style lang="scss">

</style>

<div style="height: 100%; overflow: auto;">
  <slot />

  <span>
    <slot name="header" {selectAll} {unSelectAll} {toggleSelection} {filter} />
  </span>

  <table bind:this={tableRef} on:click|stopPropagation={onClick} {id} class="table {className}">
    {#if showHeader}
      <thead>
        <tr on:mouseup={onMouseUpHeader}>
          {#if showRowNumber}
            <th title={T('COMMON.LABEL.ROW_NUMBER')} class="freeze">#</th>
          {/if}
          {#each columns as col, index}
            {#if col.type !== 'hidden'}
              <th title={col.title}>
                {@html col.title}
              </th>
            {/if}
          {/each}
        </tr>
      </thead>
    {/if}
    <tbody>
      {#each filteredData as row, rowIndex}
        <tr id={'row_' + rowIndex + '_Id'}>
          {#if showRowNumber}
            <th id={`cell_${rowIndex}_${0}_${id}`} class="freeze row-number">{startRowCount + rowIndex}</th>
          {/if}
          {#each columns as col, colIndex}
            {#if col.type !== 'hidden'}
              <td title={row[col.name]} id={`cell_${rowIndex}_${colIndex}_${id}`}>
                {@html row[col.name]}
              </td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
