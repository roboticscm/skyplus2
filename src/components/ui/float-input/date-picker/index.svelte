<script lang="ts">
  import { onMount, tick, createEventDispatcher } from 'svelte';
  import '@/lib/js/vendor/daterangepicker';
  import { App } from '@/lib/js/constants';
  import { T } from '@/lib/js/locale/locale';
  import { SDate } from '../../../../lib/js/sdate';
  import moment from 'moment';

  export let name: string = undefined;
  export let disabled = false;
  export let className = '';
  export let autocomplete = App.AUTO_COMPLETE;
  export let placeholder: string;
  export let checked: boolean = undefined;
  export let rightCheck = false;
  export let title = '';
  export let checkTitle = '';
  export let dateRange = false;
  export let defaultStartDate = new Date();
  export let defaultEndDate = new Date();
  export let timePicker = true;
  export let value: number | null = null;

  const dispatch = createEventDispatcher();

  let currentStartDate: Date = defaultStartDate;

  let inputRef: any;
  export const focus = () => {
    if (inputRef) {
      inputRef.focus();
    }
  };

  const onCheck = () => {
    inputRef && inputRef.focus();
  };

  onMount(() => {
    window['$'](inputRef).daterangepicker(
      {
        singleDatePicker: !dateRange,
        timePicker,
        opens: 'center',
        drops: 'down',
        ranges: {
          [T('COMMON.LABEL.TODAY')]: [moment(), moment()],
          [T('COMMON.LABEL.TOMORROW')]: [moment().add(1, 'days'), moment().add(1, 'days')],
          [T('COMMON.LABEL.NEXT_WEEK')]: [moment().add(6, 'days'), moment()],
          [T('COMMON.LABEL.NEXT_MONTH')]: [
            moment()
              .add(1, 'month')
              .startOf('month'),
            moment()
              .add(1, 'month')
              .endOf('month'),
          ],
          ['--------']: [''],
          [T('COMMON.LABEL.YESTERDAY')]: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
          [T('COMMON.LABEL.LAST_WEEK')]: [moment().subtract(6, 'days'), moment()],
          [T('COMMON.LABEL.THIS_MONTH')]: [moment().startOf('month'), moment().endOf('month')],
          [T('COMMON.LABEL.LAST_MONTH')]: [
            moment()
              .subtract(1, 'month')
              .startOf('month'),
            moment()
              .subtract(1, 'month')
              .endOf('month'),
          ],
        },
        locale: {
          format: timePicker ? 'DD/MM/YYYY hh:mm A' : 'DD/MM/YYYY',
          separator: ' - ',
          applyLabel: T('COMMON.LABEL.APPLY'),
          cancelLabel: T('COMMON.LABEL.CLEAR'),
          fromLabel: T('COMMON.LABEL.FROM'),
          toLabel: T('COMMON.LABEL.TO'),
          customRangeLabel: T('COMMON.LABEL.CUSTOM'),
          weekLabel: 'W',
          daysOfWeek: [
            T('COMMON.LABEL.SU'),
            T('COMMON.LABEL.MO'),
            T('COMMON.LABEL.TU'),
            T('COMMON.LABEL.WE'),
            T('COMMON.LABEL.TH'),
            T('COMMON.LABEL.FR'),
            T('COMMON.LABEL.SA'),
          ],
          monthNames: [
            T('COMMON.LABEL.JANUARY'),
            T('COMMON.LABEL.FEBRUARY'),
            T('COMMON.LABEL.MARCH'),
            T('COMMON.LABEL.APRIL'),
            T('COMMON.LABEL.MAY'),
            T('COMMON.LABEL.JUNE'),
            T('COMMON.LABEL.JULY'),
            T('COMMON.LABEL.AUGUST'),
            T('COMMON.LABEL.SEPTEMBER'),
            T('COMMON.LABEL.OCTOBER'),
            T('COMMON.LABEL.NOVEMBER'),
            T('COMMON.LABEL.DECEMBER'),
          ],
          firstDay: 1,
        },
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      },
      function(start, end, label) {
        currentStartDate = start.toDate();
        value = start.valueOf();
        dispatch('change', value);
      },
    );

    window['$'](inputRef).on('cancel.daterangepicker', function(ev, picker) {
      clearDate();
    });

    window['$'](inputRef).on('show.daterangepicker', function(ev, picker) {
      const height = window['$'](picker.container[0]).height();
      const windowHeight = window.innerHeight;
      const top = +picker.container[0].style.top.replace('px', '');

      if (top + height > windowHeight) {
        picker.container[0].style.top = `${(windowHeight - height) / 2}px`;
      }
    });

    // window['$'](inputRef).on('hide.daterangepicker', function(ev, picker) {
    //   const height = window['$'](picker.container[0]).height();
    //   const windowHeight = window.innerHeight;
    //   const top = +picker.container[0].style.top.replace('px', '');
    //
    //   if(top === 0) {
    //     picker.drops = 'up';
    //   }
    //
    //   if (top < 0) {
    //     picker.drops = 'down';
    //   }
    // });
  });

  export const clearDate = () => {
    window['$'](inputRef).val('');
    currentStartDate = null;
    value = null;
    dispatch('change', value);
  };

  export const setTimestampValue = (timestamp: number) => {
    tick().then(() => {
      const ele = window['$'](inputRef).data('daterangepicker');
      if (timestamp) {
        ele && ele.setStartDate(new Date(timestamp));
        currentStartDate = new Date(timestamp);
      } else {
        clearDate();
      }
    });
  };

  export const getTimestampValue = () => {
    return currentStartDate && currentStartDate.getTime();
  };

  export const getDateValue = () => {
    return currentStartDate && SDate.toDateString(currentStartDate);
  };

  export const getDateTimeValue = () => {
    return currentStartDate && SDate.toDateTimeString(currentStartDate);
  };

  const onChange = () => {
    dispatch('change', value);
  };
  // @ts-ignore
  $: setTimestampValue(value);
</script>

<div class="floating-wrapper">
  <input
    style="color: var(--primary)"
    {title}
    {name}
    type="text"
    {disabled}
    class="{checked !== undefined ? 'check' : ''}
    {rightCheck ? 'right' : ''}
    {className} floating__input"
    {autocomplete}
    bind:this={inputRef}
    {placeholder} />
  <label class="floating__label" data-content={placeholder} />
  {#if checked !== undefined}
    <input
      title={checkTitle}
      class={rightCheck ? 'right' : ''}
      tabindex="-1"
      {disabled}
      bind:checked
      type="checkbox"
      on:change={onCheck} />
  {/if}
</div>
