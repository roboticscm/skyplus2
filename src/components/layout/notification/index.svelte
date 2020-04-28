<script lang="ts">
  import { AppStore } from '@/store/app';

  // @ts-ignore
  const { isLogged$ } = AppStore;
</script>

<style lang="scss">
  $notify-icon-width: 24px;
  $notify-icon-height: 24px;
  $badge-width: 16px;
  $badge-height: 16px;
  $badge-space: 20px;
  $default-padding: 4px;

  .icon {
    width: $notify-icon-width;
    height: $notify-icon-height;
    margin-right: $badge-space;
  }

  .badge {
    padding-left: 4px;
    padding-right: 4px;
    background: var(--bg-secondary);
    color: var(--secondary);
    width: auto;
    min-width: $badge-width;
    height: $badge-height;
    border-radius: 40%;
    line-height: $badge-height;
    text-align: center;
    position: absolute;
    top: 3px;
    z-index: 1;
    font-size: 10px;
  }

  .badge-chat {
    left: calc(#{$notify-icon-width} - 5px);
  }

  .badge-functional {
    left: calc(#{$badge-space} + (2 * #{$notify-icon-width}) - 5px);
  }
</style>

<div class="notification">
  {#if $isLogged$}
    <svg
      class="icon"
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 24 24"
      style="enable-background:new 0 0 24 24;"
      xml:space="preserve">
      <style type="text/css">
        .st0 {
          fill: var(--primary);
        }
      </style>
      <g>
        <path
          class="st0"
          d="M21.2,12c-0.1,0-0.1,0-0.2,0l-1.9,0l-5.6,0c-1.1,0-2.1,0.6-2.6,1.5c-0.3,0.4-0.4,0.9-0.4,1.5v0v2.2V18
          c0,1.7,1.3,3,3,3h6l3,3v-3c0.7,0,1.5-0.8,1.5-1.5V15C24,13.4,22.7,12.1,21.2,12z M14.2,17c-0.4,0-0.8-0.3-0.8-0.8
          c0-0.4,0.3-0.8,0.8-0.8s0.8,0.3,0.8,0.8C15,16.7,14.7,17,14.2,17z
          M17.2,17c-0.4,0-0.8-0.3-0.8-0.8c0-0.4,0.3-0.8,0.8-0.8 s0.8,0.3,0.8,0.8C18,16.7,17.7,17,17.2,17z
          M20.2,17c-0.4,0-0.8-0.3-0.8-0.8c0-0.4,0.3-0.8,0.8-0.8c0.4,0,0.8,0.3,0.8,0.8 C21,16.7,20.7,17,20.2,17z" />
        <path class="st0" d="M5.2,4.7" />
        <g>
          <path
            class="st0"
            d="M17,0H3C1.3,0,0,1.3,0,3v7.5c0,1.7,1.3,3,3,3h0v3.1l3-3.1h1.6h1.7c0.6-1.7,2.3-3,4.2-3H20c0,0,0,0,0,0V3
            C20,1.3,18.7,0,17,0z M8.2,9.5h-3c-0.4,0-0.8-0.3-0.8-0.8S4.8,8,5.2,8h3C8.7,8,9,8.3,9,8.7S8.7,9.5,8.2,9.5z
            M14.3,5.5h-9 c-0.4,0-0.8-0.3-0.8-0.8S4.8,4,5.2,4h9C14.7,4,15,4.3,15,4.7S14.7,5.5,14.3,5.5z" />
        </g>
      </g>
    </svg>

    <div class="badge badge-chat">3</div>
    <svg
      class="icon"
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 24 24"
      style="enable-background:new 0 0 24 24;"
      xml:space="preserve">
      <style type="text/css">
        .st0 {
          fill: var(--primary);
        }
      </style>
      <g id="XMLID_42_">
        <path
          id="XMLID_41_"
          class="st0"
          d="M18.6,15.5v-4.7C18.6,7,15.8,4,12,4h0c-3.8,0-6.6,3-6.6,6.8v4.7c0,0.8-0.8,1.5-1.7,1.5h0
          C2.8,17,2,17.6,2,18.5v0C2,19.3,2.7,20,3.5,20h16.9c0.8,0,1.5-0.7,1.5-1.5v0c0-0.8-0.9-1.5-1.7-1.5h0C19.4,17,18.6,16.3,18.6,15.5z
          " />
        <circle id="XMLID_40_" class="st0" cx="12" cy="2" r="2" />
        <path id="XMLID_27_" class="st0" d="M16,20c0,2.2-1.8,4-4,4s-4-1.8-4-4" />
      </g>
    </svg>
    <div class="badge badge-functional">114</div>
  {/if}
</div>